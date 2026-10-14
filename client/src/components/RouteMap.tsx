// RouteMap.tsx — Renders polyline paths, stops, and pickup/drop markers for a given route.
import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import { TN_BOUNDS } from '../../../shared/types';
import type { Waypoint } from '../../../shared/types';

interface RouteMapProps {
  origin?: { name: string; lat: number; lng: number };
  destination?: { name: string; lat: number; lng: number };
  waypoints?: Waypoint[];
  routeGeometry?: string;
  pickup?: { name: string; lat: number; lng: number };
  drop?: { name: string; lat: number; lng: number };
  height?: string;
}

function decodePolyline(encoded: string): [number, number][] {
  if (!encoded) return [];
  const poly: [number, number][] = [];
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

    poly.push([lat / 1e5, lng / 1e5]);
  }
  return poly;
}

function createCircleIcon(color: string, label: string): L.DivIcon {
  return L.divIcon({
    className: 'custom-map-marker',
    html: `<div style="
      background-color: ${color};
      color: #ffffff;
      width: 24px;
      height: 24px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 11px;
      font-weight: 700;
      border: 2px solid #ffffff;
      box-shadow: 0 2px 4px rgba(0,0,0,0.3);
    ">${label}</div>`,
    iconSize: [24, 24],
    iconAnchor: [12, 12],
  });
}

export const RouteMap: React.FC<RouteMapProps> = ({
  origin,
  destination,
  waypoints = [],
  routeGeometry,
  pickup,
  drop,
  height = '350px',
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const layerGroupRef = useRef<L.LayerGroup | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    if (!mapRef.current) {
      const southWest = L.latLng(TN_BOUNDS.south - 0.2, TN_BOUNDS.west - 0.2);
      const northEast = L.latLng(TN_BOUNDS.north + 0.2, TN_BOUNDS.east + 0.2);
      const bounds = L.latLngBounds(southWest, northEast);

      const map = L.map(containerRef.current, {
        center: [TN_BOUNDS.center.lat, TN_BOUNDS.center.lng],
        zoom: 7,
        maxBounds: bounds,
      });

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors',
      }).addTo(map);

      mapRef.current = map;
      layerGroupRef.current = L.layerGroup().addTo(map);
    }

    const map = mapRef.current;
    const layerGroup = layerGroupRef.current;
    if (!map || !layerGroup) return;

    layerGroup.clearLayers();
    const boundsPoints: [number, number][] = [];

    // Decode or fallback to straight path
    let pathCoords: [number, number][] = [];
    if (routeGeometry) {
      pathCoords = decodePolyline(routeGeometry);
    }

    if (pathCoords.length === 0 && origin && destination) {
      pathCoords.push([origin.lat, origin.lng]);
      for (const wp of waypoints) {
        pathCoords.push([wp.lat, wp.lng]);
      }
      pathCoords.push([destination.lat, destination.lng]);
    }

    // Polyline for route
    if (pathCoords.length >= 2) {
      const polyline = L.polyline(pathCoords, {
        color: '#0D7377',
        weight: 5,
        opacity: 0.85,
      });
      polyline.addTo(layerGroup);
      for (const coord of pathCoords) {
        boundsPoints.push(coord);
      }
    }

    // Markers
    if (origin) {
      const marker = L.marker([origin.lat, origin.lng], {
        icon: createCircleIcon('#2D8A4E', 'O'),
      }).bindPopup(`<strong>Origin:</strong> ${origin.name}`);
      marker.addTo(layerGroup);
      boundsPoints.push([origin.lat, origin.lng]);
    }

    waypoints.forEach((wp, idx) => {
      const marker = L.marker([wp.lat, wp.lng], {
        icon: createCircleIcon('#E8A838', `${idx + 1}`),
      }).bindPopup(`<strong>Stop ${idx + 1}:</strong> ${wp.name}`);
      marker.addTo(layerGroup);
      boundsPoints.push([wp.lat, wp.lng]);
    });

    if (destination) {
      const marker = L.marker([destination.lat, destination.lng], {
        icon: createCircleIcon('#C4392D', 'D'),
      }).bindPopup(`<strong>Destination:</strong> ${destination.name}`);
      marker.addTo(layerGroup);
      boundsPoints.push([destination.lat, destination.lng]);
    }

    // Optional pickup and drop for bookings
    if (pickup) {
      const marker = L.marker([pickup.lat, pickup.lng], {
        icon: createCircleIcon('#15959A', 'P'),
      }).bindPopup(`<strong>Your Pickup:</strong> ${pickup.name}`);
      marker.addTo(layerGroup);
      boundsPoints.push([pickup.lat, pickup.lng]);
    }

    if (drop) {
      const marker = L.marker([drop.lat, drop.lng], {
        icon: createCircleIcon('#0A5C5F', 'X'),
      }).bindPopup(`<strong>Your Drop:</strong> ${drop.name}`);
      marker.addTo(layerGroup);
      boundsPoints.push([drop.lat, drop.lng]);
    }

    if (boundsPoints.length > 0) {
      map.fitBounds(boundsPoints, { padding: [40, 40] });
    }
  }, [origin, destination, waypoints, routeGeometry, pickup, drop]);

  return (
    <div
      ref={containerRef}
      style={{ height, width: '100%', borderRadius: 'var(--radius-md)' }}
      className="route-map-container"
      role="region"
      aria-label="Route map visualization"
    />
  );
};
