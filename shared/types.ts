// shared/types.ts — Shared TypeScript types used by both client and server.

export type VehicleType = 'bike' | 'auto' | 'cab';

export type RouteStatus = 'active' | 'in_progress' | 'paused' | 'cancelled' | 'completed';

export type BookingStatus =
  | 'requested'
  | 'confirmed'
  | 'declined'
  | 'cancelled'
  | 'in_progress'
  | 'completed';

export interface User {
  id: number;
  name: string;
  email: string;
  phone: string | null;
  created_at: string;
}

export interface Vehicle {
  id: number;
  user_id: number;
  type: VehicleType;
  registration: string;
  model: string;
  colour: string;
  seat_capacity: number;
}

export interface Waypoint {
  name: string;
  lat: number;
  lng: number;
}

export interface Route {
  id: number;
  driver_id: number;
  vehicle_id: number;
  origin_name: string;
  origin_lat: number;
  origin_lng: number;
  destination_name: string;
  dest_lat: number;
  dest_lng: number;
  waypoints: Waypoint[];
  route_geometry: string;
  departure_time: string;
  recurring_days: string[] | null;
  seats_offered: number;
  seats_available: number;
  price_per_km: number;
  status: RouteStatus;
  notes: string | null;
  created_at: string;
  driver_name?: string;
  driver_rating?: number;
  vehicle?: Vehicle;
}

export interface Booking {
  id: number;
  route_id: number;
  rider_id: number;
  pickup_name: string;
  pickup_lat: number;
  pickup_lng: number;
  drop_name: string;
  drop_lat: number;
  drop_lng: number;
  seats_booked: number;
  fare: number;
  status: BookingStatus;
  created_at: string;
  rider_name?: string;
  driver_name?: string;
  route?: Route;
}

export interface Rating {
  id: number;
  booking_id: number;
  from_user_id: number;
  to_user_id: number;
  score: number;
  comment: string | null;
  created_at: string;
  from_user_name?: string;
}

export interface AppNotification {
  id: number;
  user_id: number;
  message: string;
  type: string;
  related_id: number | null;
  is_read: boolean;
  created_at: string;
}

export interface SearchParams {
  pickup_lat: number;
  pickup_lng: number;
  drop_lat: number;
  drop_lng: number;
  date: string;
  vehicle_type?: VehicleType;
  seats_needed: number;
}

export interface SearchResult extends Route {
  pickup_distance_km: number;
  drop_distance_km: number;
  estimated_fare: number;
  detour_km: number;
}

export interface FareSegment {
  from_name: string;
  to_name: string;
  distance_km: number;
  people_count: number;
  segment_cost: number;
  per_person_cost: number;
}

export interface FareSplit {
  rider_id: number;
  segments: FareSegment[];
  total_fare: number;
}

export interface PickupDropPoint {
  rider_id: number;
  pickup_km: number;
  drop_km: number;
  pickup_name: string;
  drop_name: string;
  seats: number;
}

export interface DashboardStats {
  total_earned: number;
  total_saved: number;
  rides_as_driver: number;
  rides_as_rider: number;
}

export const DEFAULT_PRICE_PER_KM: Record<VehicleType, number> = {
  bike: 5,
  auto: 12,
  cab: 14,
};

export const TN_BOUNDS = {
  south: 8.0,
  north: 13.6,
  west: 76.2,
  east: 80.4,
  center: { lat: 11.0, lng: 78.6 },
} as const;

export const TN_PLATE_REGEX = /^TN\s?\d{2}\s?[A-Z]{1,2}\s?\d{4}$/i;

export const PHONE_REGEX = /^\+91[6-9]\d{9}$/;
