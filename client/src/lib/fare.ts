// fare.ts — Pure client-side fare calculation and segment splitting for previewing shared costs.
//
// Tamil Nadu Worked Example:
// Route: Chennai Tambaram -> Guindy -> T. Nagar (18 km total at ₹14/km)
// Total full journey vehicle cost = 18 km * ₹14 = ₹252
//
// Driver travels the entire route: Tambaram (km 0) to T. Nagar (km 18).
// Rider A (Kavitha's co-rider): Pickup at Tambaram (km 0), Drop at Guindy Kathipara (km 12).
// Rider B (Office commuter): Pickup at Chromepet (km 5), Drop at T. Nagar (km 18).
//
// Breakdown into contiguous route segments:
// 1. Segment 0 km -> 5 km (Tambaram to Chromepet, 5 km):
//    In vehicle: Driver + Rider A (2 people)
//    Segment cost: 5 km * ₹14 = ₹70
//    Per person share: ₹70 / 2 = ₹35.00
//
// 2. Segment 5 km -> 12 km (Chromepet to Guindy Kathipara, 7 km):
//    In vehicle: Driver + Rider A + Rider B (3 people)
//    Segment cost: 7 km * ₹14 = ₹98
//    Per person share: ₹98 / 3 = ₹32.67
//
// 3. Segment 12 km -> 18 km (Guindy Kathipara to T. Nagar, 6 km):
//    In vehicle: Driver + Rider B (2 people, since Rider A dropped off at km 12)
//    Segment cost: 6 km * ₹14 = ₹84
//    Per person share: ₹84 / 2 = ₹42.00
//
// Final Fare Shares:
// - Rider A total fare: ₹35.00 (Seg 1) + ₹32.67 (Seg 2) = ₹67.67
// - Rider B total fare: ₹32.67 (Seg 2) + ₹42.00 (Seg 3) = ₹74.67
// - Driver personal cost share: ₹35.00 + ₹32.67 + ₹42.00 = ₹109.67 (Down from ₹252 solo!)

import type { FareSplit, FareSegment, PickupDropPoint } from '../../../shared/types';

interface Event {
  km: number;
  type: 'pickup' | 'drop';
  riderId: number;
  seats: number;
  name: string;
}

export function calculateFareSplit(
  pricePerKm: number,
  points: PickupDropPoint[],
): FareSplit[] {
  if (points.length === 0) return [];

  const events: Event[] = [];
  for (const p of points) {
    events.push({ km: p.pickup_km, type: 'pickup', riderId: p.rider_id, seats: p.seats, name: p.pickup_name });
    events.push({ km: p.drop_km, type: 'drop', riderId: p.rider_id, seats: p.seats, name: p.drop_name });
  }

  // Sort events chronologically along route distance
  events.sort((a, b) => a.km - b.km || (a.type === 'pickup' ? -1 : 1));

  const activeRiders = new Map<number, number>();
  const riderFares = new Map<number, { segments: FareSegment[]; total: number }>();

  for (const p of points) {
    riderFares.set(p.rider_id, { segments: [], total: 0 });
  }

  let prevKm = events[0].km;
  let prevName = events[0].name;

  for (const event of events) {
    const segmentDistance = event.km - prevKm;

    if (segmentDistance > 0 && activeRiders.size > 0) {
      let totalPeople = 1; // Driver always in the vehicle
      for (const seats of activeRiders.values()) {
        totalPeople += seats;
      }

      const segmentCost = segmentDistance * pricePerKm;
      const perPersonCost = segmentCost / totalPeople;

      const segment: FareSegment = {
        from_name: prevName,
        to_name: event.name,
        distance_km: Math.round(segmentDistance * 100) / 100,
        people_count: totalPeople,
        segment_cost: Math.round(segmentCost * 100) / 100,
        per_person_cost: Math.round(perPersonCost * 100) / 100,
      };

      for (const [riderId, seats] of activeRiders) {
        const rData = riderFares.get(riderId);
        if (rData) {
          rData.segments.push(segment);
          rData.total += perPersonCost * seats;
        }
      }
    }

    if (event.type === 'pickup') {
      activeRiders.set(event.riderId, event.seats);
    } else {
      activeRiders.delete(event.riderId);
    }

    prevKm = event.km;
    prevName = event.name;
  }

  const results: FareSplit[] = [];
  for (const [riderId, data] of riderFares) {
    results.push({
      rider_id: riderId,
      segments: data.segments,
      total_fare: Math.round(data.total * 100) / 100,
    });
  }

  return results;
}

export function estimateFare(
  distanceKm: number,
  pricePerKm: number,
  estimatedRiders = 1,
): number {
  const totalCost = distanceKm * pricePerKm;
  const people = Math.max(1, estimatedRiders) + 1; // driver + riders
  return Math.max(10, Math.round((totalCost / people) * 100) / 100);
}
