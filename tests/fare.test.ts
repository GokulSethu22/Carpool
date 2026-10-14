// tests/fare.test.ts — Unit tests for the segment-based fare splitting algorithm with Tamil Nadu examples.
import { describe, it, expect } from 'vitest';
import { calculateFareSplit, estimateFare } from '../server/src/services/fare.service';
import type { PickupDropPoint } from '../shared/types';

describe('calculateFareSplit', () => {
  it('returns empty array when there are no riders', () => {
    const result = calculateFareSplit(14, []);
    expect(result).toEqual([]);
  });

  it('correctly splits Chennai Tambaram -> Guindy -> T. Nagar corridor between 2 riders', () => {
    // Chennai Tambaram -> Guindy -> T. Nagar:
    // Total Route: 18 km at ₹14/km
    // Rider 1 (Tambaram to Guindy): km 0 to km 12 (12 km)
    // Rider 2 (Chromepet to T. Nagar): km 5 to km 18 (13 km)
    //
    // Segment 1 (0 to 5 km): 5 km * ₹14 = ₹70. 2 people (driver + Rider 1) -> ₹35 each.
    // Segment 2 (5 to 12 km): 7 km * ₹14 = ₹98. 3 people (driver + Rider 1 + Rider 2) -> ₹32.67 each.
    // Segment 3 (12 to 18 km): 6 km * ₹14 = ₹84. 2 people (driver + Rider 2) -> ₹42 each.
    //
    // Expected Totals:
    // Rider 1: ₹35.00 + ₹32.67 = ₹67.67
    // Rider 2: ₹32.67 + ₹42.00 = ₹74.67
    const points: PickupDropPoint[] = [
      {
        rider_id: 1,
        pickup_km: 0,
        drop_km: 12,
        pickup_name: 'Tambaram',
        drop_name: 'Guindy',
        seats: 1,
      },
      {
        rider_id: 2,
        pickup_km: 5,
        drop_km: 18,
        pickup_name: 'Chromepet',
        drop_name: 'T. Nagar',
        seats: 1,
      },
    ];

    const result = calculateFareSplit(14, points);
    expect(result).toHaveLength(2);

    const rider1 = result.find((r) => r.rider_id === 1);
    const rider2 = result.find((r) => r.rider_id === 2);

    expect(rider1).toBeDefined();
    expect(rider2).toBeDefined();

    // Verify segments count
    expect(rider1!.segments).toHaveLength(2);
    expect(rider2!.segments).toHaveLength(2);

    // Verify calculated totals
    expect(rider1!.total_fare).toBeCloseTo(67.67, 1);
    expect(rider2!.total_fare).toBeCloseTo(74.67, 1);
  });

  it('handles a rider booking multiple seats (e.g. 2 seats)', () => {
    // 10 km route at ₹10/km.
    // Rider 1 books 2 seats from km 0 to km 10.
    // People count = driver (1) + Rider 1 seats (2) = 3 people.
    // Segment cost = 10 * 10 = ₹100.
    // Per person cost = 100 / 3 = ₹33.33.
    // Rider 1 pays for 2 seats = 33.33 * 2 = ₹66.67.
    const points: PickupDropPoint[] = [
      {
        rider_id: 1,
        pickup_km: 0,
        drop_km: 10,
        pickup_name: 'Gandhipuram',
        drop_name: 'Peelamedu',
        seats: 2,
      },
    ];

    const result = calculateFareSplit(10, points);
    expect(result).toHaveLength(1);
    expect(result[0].total_fare).toBeCloseTo(66.67, 1);
  });
});

describe('estimateFare', () => {
  it('estimates fair share based on distance, rate, and estimated riders', () => {
    // 20 km at ₹10/km with 1 passenger:
    // Total = ₹200. People = driver + 1 rider = 2. Fare = ₹100.
    const fare = estimateFare(20, 10, 1);
    expect(fare).toBe(100);
  });

  it('enforces a minimum baseline fare of ₹10', () => {
    const fare = estimateFare(0.2, 5, 1);
    expect(fare).toBeGreaterThanOrEqual(10);
  });
});
