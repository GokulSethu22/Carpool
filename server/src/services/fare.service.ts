// fare.service.ts — Fare splitting algorithm: divides route cost by segment occupancy.
//
// How it works (Tambaram → Guindy → T. Nagar example):
// Route: 18 km total, ₹14/km. Driver always present.
// Rider A: pickup at km 0 (Tambaram), drop at km 12 (Guindy)
// Rider B: pickup at km 5, drop at km 18 (T. Nagar)
//
// Segment 0–5 km: driver + A = 2 people → cost 5×14 = ₹70, each ₹35
// Segment 5–12 km: driver + A + B = 3 people → cost 7×14 = ₹98, each ₹32.67
// Segment 12–18 km: driver + B = 2 people → cost 6×14 = ₹84, each ₹42
//
// Rider A total: ₹35 + ₹32.67 = ₹67.67
// Rider B total: ₹32.67 + ₹42 = ₹74.67

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

  // Build sorted events from all riders' pickup and drop points
  const events: Event[] = [];
  for (const p of points) {
    events.push({ km: p.pickup_km, type: 'pickup', riderId: p.rider_id, seats: p.seats, name: p.pickup_name });
    events.push({ km: p.drop_km, type: 'drop', riderId: p.rider_id, seats: p.seats, name: p.drop_name });
  }
  events.sort((a, b) => a.km - b.km || (a.type === 'pickup' ? -1 : 1));

  // Track which riders are currently in the vehicle
  const activeRiders = new Map<number, number>(); // riderId → seats
  const riderFares = new Map<number, { segments: FareSegment[]; total: number }>();

  for (const p of points) {
    riderFares.set(p.rider_id, { segments: [], total: 0 });
  }

  let prevKm = events[0].km;
  let prevName = events[0].name;

  for (const event of events) {
    const segmentDistance = event.km - prevKm;

    if (segmentDistance > 0 && activeRiders.size > 0) {
      // Count total people: driver (1) + sum of active rider seats
      let totalPeople = 1; // driver
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

      // Add this segment's share to each active rider
      for (const [riderId, seats] of activeRiders) {
        const riderData = riderFares.get(riderId);
        if (riderData) {
          riderData.segments.push(segment);
          riderData.total += perPersonCost * seats;
        }
      }
    }

    // Process the event
    if (event.type === 'pickup') {
      activeRiders.set(event.riderId, event.seats);
    } else {
      activeRiders.delete(event.riderId);
    }

    prevKm = event.km;
    prevName = event.name;
  }

  // Build result
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

/** Quick estimate for search results when we don't know exact segments yet. */
export function estimateFare(
  distanceKm: number,
  pricePerKm: number,
  estimatedRiders: number,
): number {
  const totalCost = distanceKm * pricePerKm;
  const people = Math.max(1, estimatedRiders) + 1; // +1 for driver
  return Math.max(10, Math.round((totalCost / people) * 100) / 100);
}
