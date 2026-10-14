// search.service.ts — Route matching algorithm: finds driver routes near rider pickup and drop points.
import { getDb } from '../db/connection';
import { estimateFare } from './fare.service';
import type { SearchParams, SearchResult, VehicleType, RouteStatus, Waypoint } from '../../../shared/types';

interface PolylinePoint {
  lat: number;
  lng: number;
}

export function haversineDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth's radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export function decodePolyline(encoded: string): PolylinePoint[] {
  if (!encoded) return [];
  const points: PolylinePoint[] = [];
  let index = 0;
  const len = encoded.length;
  let lat = 0;
  let lng = 0;

  while (index < len) {
    let b: number;
    let shift = 0;
    let result = 0;
    do {
      b = encoded.charCodeAt(index++) - 63;
      result |= (b & 0x1f) << shift;
      shift += 5;
    } while (b >= 0x20);
    const dlat = (result & 1) !== 0 ? ~(result >> 1) : result >> 1;
    lat += dlat;

    shift = 0;
    result = 0;
    do {
      b = encoded.charCodeAt(index++) - 63;
      result |= (b & 0x1f) << shift;
      shift += 5;
    } while (b >= 0x20);
    const dlng = (result & 1) !== 0 ? ~(result >> 1) : result >> 1;
    lng += dlng;

    points.push({
      lat: lat / 1e5,
      lng: lng / 1e5,
    });
  }

  return points;
}

export function findNearestPointOnPath(
  path: PolylinePoint[],
  point: PolylinePoint,
): { index: number; distance: number; nearestPoint: PolylinePoint } {
  let minDistance = Infinity;
  let bestIndex = -1;
  let bestPoint = path[0] || point;

  for (let i = 0; i < path.length; i++) {
    const dist = haversineDistance(point.lat, point.lng, path[i].lat, path[i].lng);
    if (dist < minDistance) {
      minDistance = dist;
      bestIndex = i;
      bestPoint = path[i];
    }
  }

  return { index: bestIndex, distance: minDistance, nearestPoint: bestPoint };
}

export function searchRoutes(params: SearchParams, maxDetourKm = 1.5): SearchResult[] {
  const db = getDb();

  let query = `
    SELECT r.*, u.name as driver_name,
           (SELECT AVG(score) FROM ratings WHERE to_user_id = r.driver_id) as driver_rating,
           v.type as vehicle_type, v.registration as vehicle_reg, v.model as vehicle_model,
           v.colour as vehicle_colour, v.seat_capacity as vehicle_capacity
    FROM routes r
    JOIN users u ON r.driver_id = u.id
    JOIN vehicles v ON r.vehicle_id = v.id
    WHERE r.status = 'active'
      AND r.seats_available >= ?
  `;
  const queryArgs: unknown[] = [params.seats_needed];

  if (params.vehicle_type) {
    query += ` AND v.type = ?`;
    queryArgs.push(params.vehicle_type);
  }

  const rows = db.prepare(query).all(...queryArgs) as Record<string, unknown>[];
  const results: SearchResult[] = [];

  const pickupPoint = { lat: params.pickup_lat, lng: params.pickup_lng };
  const dropPoint = { lat: params.drop_lat, lng: params.drop_lng };

  // Parse target day name if date is provided
  let targetDayName: string | null = null;
  let targetDateStr: string | null = null;
  if (params.date) {
    const targetDate = new Date(params.date);
    if (!isNaN(targetDate.getTime())) {
      const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
      targetDayName = days[targetDate.getDay()];
      targetDateStr = params.date.split('T')[0];
    }
  }

  for (const row of rows) {
    // Check recurring days or departure date match
    const depTime = (row.departure_time as string) || '';
    let recurring: string[] | null = null;
    if (row.recurring_days) {
      try {
        recurring = JSON.parse(row.recurring_days as string);
      } catch {
        recurring = null;
      }
    }

    if (targetDateStr) {
      const isDateMatch = depTime.startsWith(targetDateStr);
      const isRecurringMatch = recurring && targetDayName && recurring.includes(targetDayName);
      if (!isDateMatch && !isRecurringMatch) {
        continue;
      }
    }

    // Build path coordinates
    let path: PolylinePoint[] = [];
    if (row.route_geometry) {
      path = decodePolyline(row.route_geometry as string);
    }

    // Fallback path if no polyline: origin -> waypoints -> destination
    if (path.length < 2) {
      path = [{ lat: row.origin_lat as number, lng: row.origin_lng as number }];
      if (row.waypoints) {
        try {
          const wps = JSON.parse(row.waypoints as string) as Waypoint[];
          for (const wp of wps) {
            path.push({ lat: wp.lat, lng: wp.lng });
          }
        } catch {
          // ignore error
        }
      }
      path.push({ lat: row.dest_lat as number, lng: row.dest_lng as number });
    }

    // Find nearest point for pickup and drop
    const pickupMatch = findNearestPointOnPath(path, pickupPoint);
    const dropMatch = findNearestPointOnPath(path, dropPoint);

    // Rule: Both points must lie within maxDetourKm (default 1.5 km)
    if (pickupMatch.distance > maxDetourKm || dropMatch.distance > maxDetourKm) {
      continue;
    }

    // Rule: Pickup must occur strictly before drop along the path
    if (pickupMatch.index >= dropMatch.index) {
      continue;
    }

    const detourKm = pickupMatch.distance + dropMatch.distance;
    const directRideDistance = haversineDistance(
      params.pickup_lat,
      params.pickup_lng,
      params.drop_lat,
      params.drop_lng,
    );

    const pricePerKm = row.price_per_km as number;
    const estimatedFare = estimateFare(directRideDistance, pricePerKm, 1);

    let waypoints: Waypoint[] = [];
    try {
      waypoints = JSON.parse(row.waypoints as string || '[]');
    } catch {
      waypoints = [];
    }

    const searchResult: SearchResult = {
      id: row.id as number,
      driver_id: row.driver_id as number,
      vehicle_id: row.vehicle_id as number,
      origin_name: row.origin_name as string,
      origin_lat: row.origin_lat as number,
      origin_lng: row.origin_lng as number,
      destination_name: row.destination_name as string,
      dest_lat: row.dest_lat as number,
      dest_lng: row.dest_lng as number,
      waypoints,
      route_geometry: (row.route_geometry as string) || '',
      departure_time: row.departure_time as string,
      recurring_days: recurring,
      seats_offered: row.seats_offered as number,
      seats_available: row.seats_available as number,
      price_per_km: pricePerKm,
      status: row.status as RouteStatus,
      notes: (row.notes as string) || null,
      created_at: row.created_at as string,
      driver_name: row.driver_name as string,
      driver_rating: row.driver_rating ? Number(Number(row.driver_rating).toFixed(1)) : undefined,
      vehicle: {
        id: row.vehicle_id as number,
        user_id: row.driver_id as number,
        type: row.vehicle_type as VehicleType,
        registration: row.vehicle_reg as string,
        model: row.vehicle_model as string,
        colour: row.vehicle_colour as string,
        seat_capacity: row.vehicle_capacity as number,
      },
      pickup_distance_km: Math.round(pickupMatch.distance * 100) / 100,
      drop_distance_km: Math.round(dropMatch.distance * 100) / 100,
      estimated_fare: estimatedFare,
      detour_km: Math.round(detourKm * 100) / 100,
    };

    results.push(searchResult);
  }

  // Rank by: 1. Detour (least detour first), 2. Departure time, 3. Price per km
  results.sort((a, b) => {
    if (Math.abs(a.detour_km - b.detour_km) > 0.1) {
      return a.detour_km - b.detour_km;
    }
    const timeA = new Date(a.departure_time).getTime();
    const timeB = new Date(b.departure_time).getTime();
    if (!isNaN(timeA) && !isNaN(timeB) && timeA !== timeB) {
      return timeA - timeB;
    }
    return a.price_per_km - b.price_per_km;
  });

  return results;
}
