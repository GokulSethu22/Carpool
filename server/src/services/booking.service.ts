// booking.service.ts — Transactional seat management, booking requests, confirmations, and cancellations.
import { getDb } from '../db/connection';
import { createNotification } from './notification.service';
import { haversineDistance } from './search.service';
import { estimateFare } from './fare.service';
import type { Booking, BookingStatus } from '../../../shared/types';

interface RequestBookingInput {
  route_id: number;
  pickup_name: string;
  pickup_lat: number;
  pickup_lng: number;
  drop_name: string;
  drop_lat: number;
  drop_lng: number;
  seats_booked: number;
}

export function requestBooking(riderId: number, data: RequestBookingInput): Booking {
  const db = getDb();

  return db.transaction(() => {
    // Check route exists and is active
    const route = db.prepare(`
      SELECT r.*, u.id as driver_id, u.name as driver_name
      FROM routes r
      JOIN users u ON r.driver_id = u.id
      WHERE r.id = ?
    `).get(data.route_id) as Record<string, unknown> | undefined;

    if (!route) {
      throw new Error('Route not found.');
    }

    if (route.status !== 'active') {
      throw new Error('This route is not accepting new bookings.');
    }

    if ((route.driver_id as number) === riderId) {
      throw new Error('You cannot book a seat on your own route.');
    }

    const seatsAvailable = route.seats_available as number;
    if (seatsAvailable < data.seats_booked) {
      throw new Error(`Only ${seatsAvailable} seat(s) available on this route.`);
    }

    // Check for existing active booking by this rider on this route
    const existing = db.prepare(`
      SELECT id FROM bookings
      WHERE route_id = ? AND rider_id = ? AND status IN ('requested', 'confirmed', 'in_progress')
    `).get(data.route_id, riderId);

    if (existing) {
      throw new Error('You already have an active booking or request on this route.');
    }

    // Recompute fare on the server (never trust client)
    const distanceKm = haversineDistance(data.pickup_lat, data.pickup_lng, data.drop_lat, data.drop_lng);
    const fare = estimateFare(distanceKm, route.price_per_km as number, 1) * data.seats_booked;

    const result = db.prepare(`
      INSERT INTO bookings (
        route_id, rider_id, pickup_name, pickup_lat, pickup_lng,
        drop_name, drop_lat, drop_lng, seats_booked, fare, status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'requested')
    `).run(
      data.route_id,
      riderId,
      data.pickup_name,
      data.pickup_lat,
      data.pickup_lng,
      data.drop_name,
      data.drop_lat,
      data.drop_lng,
      data.seats_booked,
      Math.max(10, Math.round(fare * 100) / 100),
    );

    const bookingId = result.lastInsertRowid as number;

    // Notify driver of request
    createNotification(
      route.driver_id as number,
      `New seat request (${data.seats_booked} seat) for route #${data.route_id} from ${data.pickup_name} to ${data.drop_name}.`,
      'booking_request',
      bookingId,
    );

    return getBookingById(bookingId)!;
  })();
}

export function acceptBooking(driverId: number, bookingId: number): Booking {
  const db = getDb();

  return db.transaction(() => {
    const booking = getBookingById(bookingId);
    if (!booking) {
      throw new Error('Booking not found.');
    }

    const route = db.prepare('SELECT driver_id, seats_available FROM routes WHERE id = ?').get(booking.route_id) as {
      driver_id: number;
      seats_available: number;
    } | undefined;

    if (!route || route.driver_id !== driverId) {
      throw new Error('You do not have permission to manage this booking.');
    }

    if (booking.status !== 'requested') {
      throw new Error(`Cannot accept booking in '${booking.status}' status.`);
    }

    if (route.seats_available < booking.seats_booked) {
      throw new Error(`Insufficient seats available (${route.seats_available} left, requested ${booking.seats_booked}).`);
    }

    // Decrement seats_available atomically
    db.prepare(`
      UPDATE routes
      SET seats_available = seats_available - ?
      WHERE id = ? AND seats_available >= ?
    `).run(booking.seats_booked, booking.route_id, booking.seats_booked);

    db.prepare("UPDATE bookings SET status = 'confirmed' WHERE id = ?").run(bookingId);

    // Notify rider
    createNotification(
      booking.rider_id,
      `Your booking request for route #${booking.route_id} was confirmed by the driver!`,
      'booking_confirmed',
      bookingId,
    );

    return getBookingById(bookingId)!;
  })();
}

export function declineBooking(driverId: number, bookingId: number): Booking {
  const db = getDb();

  return db.transaction(() => {
    const booking = getBookingById(bookingId);
    if (!booking) {
      throw new Error('Booking not found.');
    }

    const route = db.prepare('SELECT driver_id FROM routes WHERE id = ?').get(booking.route_id) as { driver_id: number } | undefined;
    if (!route || route.driver_id !== driverId) {
      throw new Error('You do not have permission to manage this booking.');
    }

    if (booking.status !== 'requested') {
      throw new Error(`Cannot decline booking in '${booking.status}' status.`);
    }

    db.prepare("UPDATE bookings SET status = 'declined' WHERE id = ?").run(bookingId);

    createNotification(
      booking.rider_id,
      `Your booking request for route #${booking.route_id} was declined.`,
      'booking_declined',
      bookingId,
    );

    return getBookingById(bookingId)!;
  })();
}

export function cancelBooking(userId: number, bookingId: number): Booking {
  const db = getDb();

  return db.transaction(() => {
    const booking = getBookingById(bookingId);
    if (!booking) {
      throw new Error('Booking not found.');
    }

    const route = db.prepare('SELECT driver_id FROM routes WHERE id = ?').get(booking.route_id) as { driver_id: number } | undefined;
    if (!route) {
      throw new Error('Associated route not found.');
    }

    const isRider = booking.rider_id === userId;
    const isDriver = route.driver_id === userId;

    if (!isRider && !isDriver) {
      throw new Error('You are not authorized to cancel this booking.');
    }

    if (['completed', 'cancelled', 'declined'].includes(booking.status)) {
      throw new Error(`Cannot cancel a booking that is already ${booking.status}.`);
    }

    // If was confirmed, return the seats to available count
    if (booking.status === 'confirmed') {
      db.prepare(`
        UPDATE routes
        SET seats_available = seats_available + ?
        WHERE id = ?
      `).run(booking.seats_booked, booking.route_id);
    }

    db.prepare("UPDATE bookings SET status = 'cancelled' WHERE id = ?").run(bookingId);

    // Notify the other party
    const recipientId = isRider ? route.driver_id : booking.rider_id;
    const cancelledBy = isRider ? 'rider' : 'driver';
    createNotification(
      recipientId,
      `Booking #${bookingId} for route #${booking.route_id} was cancelled by the ${cancelledBy}.`,
      'booking_cancelled',
      bookingId,
    );

    return getBookingById(bookingId)!;
  })();
}

export function completeBooking(bookingId: number): Booking {
  const db = getDb();
  db.prepare("UPDATE bookings SET status = 'completed' WHERE id = ?").run(bookingId);
  return getBookingById(bookingId)!;
}

export function getBookingById(id: number): Booking | null {
  const db = getDb();
  const row = db.prepare(`
    SELECT b.*, u.name as rider_name, d.name as driver_name
    FROM bookings b
    JOIN users u ON b.rider_id = u.id
    JOIN routes r ON b.route_id = r.id
    JOIN users d ON r.driver_id = d.id
    WHERE b.id = ?
  `).get(id) as Record<string, unknown> | undefined;

  if (!row) return null;
  return mapBookingRow(row);
}

export function getRiderBookings(riderId: number): Booking[] {
  const db = getDb();
  const rows = db.prepare(`
    SELECT b.*, u.name as rider_name, d.name as driver_name
    FROM bookings b
    JOIN users u ON b.rider_id = u.id
    JOIN routes r ON b.route_id = r.id
    JOIN users d ON r.driver_id = d.id
    WHERE b.rider_id = ?
    ORDER BY b.created_at DESC
  `).all(riderId) as Record<string, unknown>[];

  return rows.map(mapBookingRow);
}

export function getDriverRequests(driverId: number): Booking[] {
  const db = getDb();
  const rows = db.prepare(`
    SELECT b.*, u.name as rider_name, d.name as driver_name
    FROM bookings b
    JOIN users u ON b.rider_id = u.id
    JOIN routes r ON b.route_id = r.id
    JOIN users d ON r.driver_id = d.id
    WHERE r.driver_id = ?
    ORDER BY b.created_at DESC
  `).all(driverId) as Record<string, unknown>[];

  return rows.map(mapBookingRow);
}

export function getRouteBookings(routeId: number): Booking[] {
  const db = getDb();
  const rows = db.prepare(`
    SELECT b.*, u.name as rider_name, d.name as driver_name
    FROM bookings b
    JOIN users u ON b.rider_id = u.id
    JOIN routes r ON b.route_id = r.id
    JOIN users d ON r.driver_id = d.id
    WHERE b.route_id = ?
    ORDER BY b.created_at ASC
  `).all(routeId) as Record<string, unknown>[];

  return rows.map(mapBookingRow);
}

function mapBookingRow(row: Record<string, unknown>): Booking {
  return {
    id: row.id as number,
    route_id: row.route_id as number,
    rider_id: row.rider_id as number,
    pickup_name: row.pickup_name as string,
    pickup_lat: row.pickup_lat as number,
    pickup_lng: row.pickup_lng as number,
    drop_name: row.drop_name as string,
    drop_lat: row.drop_lat as number,
    drop_lng: row.drop_lng as number,
    seats_booked: row.seats_booked as number,
    fare: row.fare as number,
    status: row.status as BookingStatus,
    created_at: row.created_at as string,
    rider_name: row.rider_name as string,
    driver_name: row.driver_name as string,
  };
}
