// route.service.ts — Service for managing published routes, waypoints, and statuses.
import { getDb } from '../db/connection';
import type { Route, RouteStatus, Waypoint, VehicleType } from '../../../shared/types';

interface PublishRouteInput {
  vehicle_id: number;
  origin_name: string;
  origin_lat: number;
  origin_lng: number;
  destination_name: string;
  dest_lat: number;
  dest_lng: number;
  waypoints?: Waypoint[];
  route_geometry?: string;
  departure_time: string;
  recurring_days?: string[] | null;
  seats_offered: number;
  price_per_km: number;
  notes?: string | null;
}

interface UpdateRouteInput {
  waypoints?: Waypoint[];
  departure_time?: string;
  recurring_days?: string[] | null;
  seats_offered?: number;
  price_per_km?: number;
  notes?: string | null;
}

export function publishRoute(driverId: number, data: PublishRouteInput): Route {
  const db = getDb();

  // Verify driver owns vehicle
  const vehicle = db
    .prepare('SELECT id, seat_capacity FROM vehicles WHERE id = ? AND user_id = ?')
    .get(data.vehicle_id, driverId) as { id: number; seat_capacity: number } | undefined;

  if (!vehicle) {
    throw new Error('Vehicle not found or does not belong to you.');
  }

  if (data.seats_offered > vehicle.seat_capacity) {
    throw new Error(`Seats offered (${data.seats_offered}) cannot exceed vehicle capacity (${vehicle.seat_capacity}).`);
  }

  const waypointsJson = JSON.stringify(data.waypoints || []);
  const recurringDaysJson = data.recurring_days ? JSON.stringify(data.recurring_days) : null;
  const geometry = data.route_geometry || '';

  const result = db.prepare(`
    INSERT INTO routes (
      driver_id, vehicle_id, origin_name, origin_lat, origin_lng,
      destination_name, dest_lat, dest_lng, waypoints, route_geometry,
      departure_time, recurring_days, seats_offered, seats_available,
      price_per_km, status, notes
    ) VALUES (
      ?, ?, ?, ?, ?,
      ?, ?, ?, ?, ?,
      ?, ?, ?, ?,
      ?, 'active', ?
    )
  `).run(
    driverId,
    data.vehicle_id,
    data.origin_name,
    data.origin_lat,
    data.origin_lng,
    data.destination_name,
    data.dest_lat,
    data.dest_lng,
    waypointsJson,
    geometry,
    data.departure_time,
    recurringDaysJson,
    data.seats_offered,
    data.seats_offered, // available starts equal to offered
    data.price_per_km,
    data.notes || null,
  );

  return getRouteById(result.lastInsertRowid as number)!;
}

export function getRouteById(id: number): Route | null {
  const db = getDb();
  const row = db.prepare(`
    SELECT r.*, u.name as driver_name,
           (SELECT AVG(score) FROM ratings WHERE to_user_id = r.driver_id) as driver_rating,
           v.type as vehicle_type, v.registration as vehicle_reg, v.model as vehicle_model,
           v.colour as vehicle_colour, v.seat_capacity as vehicle_capacity
    FROM routes r
    JOIN users u ON r.driver_id = u.id
    JOIN vehicles v ON r.vehicle_id = v.id
    WHERE r.id = ?
  `).get(id) as Record<string, unknown> | undefined;

  if (!row) return null;

  return mapRouteRow(row);
}

export function getDriverRoutes(driverId: number): Route[] {
  const db = getDb();
  const rows = db.prepare(`
    SELECT r.*, u.name as driver_name,
           (SELECT AVG(score) FROM ratings WHERE to_user_id = r.driver_id) as driver_rating,
           v.type as vehicle_type, v.registration as vehicle_reg, v.model as vehicle_model,
           v.colour as vehicle_colour, v.seat_capacity as vehicle_capacity
    FROM routes r
    JOIN users u ON r.driver_id = u.id
    JOIN vehicles v ON r.vehicle_id = v.id
    WHERE r.driver_id = ?
    ORDER BY r.departure_time DESC
  `).all(driverId) as Record<string, unknown>[];

  return rows.map(mapRouteRow);
}

export function updateRoute(driverId: number, routeId: number, data: UpdateRouteInput): Route {
  const db = getDb();
  const existing = getRouteById(routeId);
  if (!existing || existing.driver_id !== driverId) {
    throw new Error('Route not found or you do not have permission to edit it.');
  }

  let newSeatsAvailable = existing.seats_available;
  let newSeatsOffered = existing.seats_offered;

  if (data.seats_offered !== undefined) {
    const diff = data.seats_offered - existing.seats_offered;
    newSeatsOffered = data.seats_offered;
    newSeatsAvailable = Math.max(0, existing.seats_available + diff);
  }

  const waypointsJson = data.waypoints !== undefined ? JSON.stringify(data.waypoints) : JSON.stringify(existing.waypoints);
  const recurringDaysJson = data.recurring_days !== undefined
    ? (data.recurring_days ? JSON.stringify(data.recurring_days) : null)
    : (existing.recurring_days ? JSON.stringify(existing.recurring_days) : null);
  const departureTime = data.departure_time ?? existing.departure_time;
  const pricePerKm = data.price_per_km ?? existing.price_per_km;
  const notes = data.notes !== undefined ? data.notes : existing.notes;

  db.prepare(`
    UPDATE routes
    SET waypoints = ?, departure_time = ?, recurring_days = ?,
        seats_offered = ?, seats_available = ?, price_per_km = ?, notes = ?
    WHERE id = ? AND driver_id = ?
  `).run(
    waypointsJson,
    departureTime,
    recurringDaysJson,
    newSeatsOffered,
    newSeatsAvailable,
    pricePerKm,
    notes,
    routeId,
    driverId,
  );

  return getRouteById(routeId)!;
}

export function updateRouteStatus(driverId: number, routeId: number, status: RouteStatus): Route {
  const db = getDb();
  const existing = getRouteById(routeId);
  if (!existing || existing.driver_id !== driverId) {
    throw new Error('Route not found or you do not have permission to update it.');
  }

  db.transaction(() => {
    db.prepare('UPDATE routes SET status = ? WHERE id = ? AND driver_id = ?').run(status, routeId, driverId);

    if (status === 'cancelled') {
      // Cancel pending/confirmed bookings and notify
      const bookings = db.prepare(`
        SELECT id, rider_id FROM bookings
        WHERE route_id = ? AND status IN ('requested', 'confirmed')
      `).all(routeId) as Array<{ id: number; rider_id: number }>;

      db.prepare(`
        UPDATE bookings SET status = 'cancelled'
        WHERE route_id = ? AND status IN ('requested', 'confirmed')
      `).run(routeId);

      for (const b of bookings) {
        db.prepare(`
          INSERT INTO notifications (user_id, message, type, related_id)
          VALUES (?, ?, 'status_change', ?)
        `).run(b.rider_id, `Route #${routeId} was cancelled by the driver.`, routeId);
      }
    }
  })();

  return getRouteById(routeId)!;
}

function mapRouteRow(row: Record<string, unknown>): Route {
  let waypoints: Waypoint[] = [];
  try {
    waypoints = JSON.parse(row.waypoints as string || '[]');
  } catch {
    waypoints = [];
  }

  let recurringDays: string[] | null = null;
  if (row.recurring_days) {
    try {
      recurringDays = JSON.parse(row.recurring_days as string);
    } catch {
      recurringDays = null;
    }
  }

  return {
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
    recurring_days: recurringDays,
    seats_offered: row.seats_offered as number,
    seats_available: row.seats_available as number,
    price_per_km: row.price_per_km as number,
    status: row.status as RouteStatus,
    notes: (row.notes as string) || null,
    created_at: row.created_at as string,
    driver_name: row.driver_name as string,
    driver_rating: row.driver_rating ? Number(Number(row.driver_rating).toFixed(1)) : undefined,
    vehicle: row.vehicle_type ? {
      id: row.vehicle_id as number,
      user_id: row.driver_id as number,
      type: row.vehicle_type as VehicleType,
      registration: row.vehicle_reg as string,
      model: row.vehicle_model as string,
      colour: row.vehicle_colour as string,
      seat_capacity: row.vehicle_capacity as number,
    } : undefined,
  };
}
