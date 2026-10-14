// tests/matching.test.ts — Unit tests for route matching, polyline decoding, and detour thresholds.
import { describe, it, expect } from 'vitest';
import {
  decodePolyline,
  haversineDistance,
  findNearestPointOnPath,
} from '../server/src/services/search.service';

describe('haversineDistance', () => {
  it('calculates realistic distance between Chennai landmarks', () => {
    // Tambaram (12.9249, 80.1000) to Guindy (13.0067, 80.2206)
    // Straight line distance is approximately 16 km
    const dist = haversineDistance(12.9249, 80.1000, 13.0067, 80.2206);
    expect(dist).toBeGreaterThan(14);
    expect(dist).toBeLessThan(18);
  });

  it('returns 0 for identical points', () => {
    const dist = haversineDistance(11.0168, 76.9558, 11.0168, 76.9558);
    expect(dist).toBe(0);
  });
});

describe('decodePolyline', () => {
  it('decodes Google encoded polyline string to array of coordinates', () => {
    // Encoded polyline representing points near (38.5, -120.2)
    const encoded = '_p~iF~ps|U_ulLnnqC_mqNvxq`@';
    const points = decodePolyline(encoded);

    expect(points.length).toBeGreaterThan(1);
    expect(points[0].lat).toBeCloseTo(38.5, 1);
    expect(points[0].lng).toBeCloseTo(-120.2, 1);
  });

  it('returns empty array for empty string', () => {
    expect(decodePolyline('')).toEqual([]);
  });
});

describe('findNearestPointOnPath and Order Matching', () => {
  const samplePath = [
    { lat: 12.9249, lng: 80.1000 }, // Tambaram (Index 0)
    { lat: 12.9516, lng: 80.1462 }, // Chromepet (Index 1)
    { lat: 13.0067, lng: 80.2206 }, // Guindy Kathipara (Index 2)
    { lat: 13.0418, lng: 80.2341 }, // T. Nagar (Index 3)
  ];

  it('correctly matches points within threshold in correct direction', () => {
    // Rider Pickup at Chromepet station (very close to Index 1)
    const riderPickup = { lat: 12.9515, lng: 80.1460 };
    // Rider Drop at Guindy junction (very close to Index 2)
    const riderDrop = { lat: 13.0065, lng: 80.2200 };

    const pickupMatch = findNearestPointOnPath(samplePath, riderPickup);
    const dropMatch = findNearestPointOnPath(samplePath, riderDrop);

    expect(pickupMatch.distance).toBeLessThan(1.5); // within 1.5 km
    expect(dropMatch.distance).toBeLessThan(1.5);
    expect(pickupMatch.index).toBe(1);
    expect(dropMatch.index).toBe(2);

    // Pickup index must be strictly less than drop index
    expect(pickupMatch.index).toBeLessThan(dropMatch.index);
  });

  it('rejects ride when passenger travels in the reverse direction', () => {
    // Reverse commute: Pickup at T. Nagar (near Index 3), Drop at Tambaram (near Index 0)
    const riderPickup = { lat: 13.0415, lng: 80.2340 };
    const riderDrop = { lat: 12.9250, lng: 80.1005 };

    const pickupMatch = findNearestPointOnPath(samplePath, riderPickup);
    const dropMatch = findNearestPointOnPath(samplePath, riderDrop);

    // Direction check: pickup must come BEFORE drop
    const isValidDirection = pickupMatch.index < dropMatch.index;
    expect(isValidDirection).toBe(false);
  });

  it('detects when pickup or drop is too far from the driver path (> 1.5 km)', () => {
    // Point in Velachery (12.9815, 80.2180) - well off the direct Tambaram-Guindy GST road path
    const offPathPoint = { lat: 12.9815, lng: 80.2180 };
    const match = findNearestPointOnPath(samplePath, offPathPoint);

    // Should exceed the 1.5 km corridor
    expect(match.distance).toBeGreaterThan(1.5);
  });
});
