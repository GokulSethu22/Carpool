// trip.service.ts — State machine managing live trip transitions (open -> in progress -> completed).
import { getDb } from '../db/connection';
import { createNotification } from './notification.service';
import type { Route } from '../../../shared/types';
import { getRouteById } from './route.service';

export function startTrip(driverId: number, routeId: number): Route {
  const db = getDb();

  return db.transaction(() => {
    const route = getRouteById(routeId);
    if (!route || route.driver_id !== driverId) {
      throw new Error('Route not found or you do not have permission to start it.');
    }

    if (route.status !== 'active') {
      throw new Error(`Cannot start a trip that is currently '${route.status}'.`);
    }

    // Mark route and confirmed bookings as in_progress
    db.prepare("UPDATE routes SET status = 'in_progress' WHERE id = ?").run(routeId);

    const confirmedBookings = db.prepare(`
      SELECT id, rider_id FROM bookings
      WHERE route_id = ? AND status = 'confirmed'
    `).all(routeId) as Array<{ id: number; rider_id: number }>;

    db.prepare(`
      UPDATE bookings
      SET status = 'in_progress'
      WHERE route_id = ? AND status = 'confirmed'
    `).run(routeId);

    for (const b of confirmedBookings) {
      createNotification(
        b.rider_id,
        `Your trip for route #${routeId} (${route.origin_name} -> ${route.destination_name}) has started!`,
        'status_change',
        routeId,
      );
    }

    return getRouteById(routeId)!;
  })();
}

export function completeTrip(driverId: number, routeId: number): Route {
  const db = getDb();

  return db.transaction(() => {
    const route = getRouteById(routeId);
    if (!route || route.driver_id !== driverId) {
      throw new Error('Route not found or you do not have permission to complete it.');
    }

    // Update route status to completed
    db.prepare("UPDATE routes SET status = 'completed' WHERE id = ?").run(routeId);

    // Update in_progress and confirmed bookings to completed
    const bookings = db.prepare(`
      SELECT id, rider_id FROM bookings
      WHERE route_id = ? AND status IN ('in_progress', 'confirmed')
    `).all(routeId) as Array<{ id: number; rider_id: number }>;

    db.prepare(`
      UPDATE bookings
      SET status = 'completed'
      WHERE route_id = ? AND status IN ('in_progress', 'confirmed')
    `).run(routeId);

    for (const b of bookings) {
      createNotification(
        b.rider_id,
        `Your trip for route #${routeId} is complete. Please leave a rating for the driver!`,
        'status_change',
        routeId,
      );
    }

    return getRouteById(routeId)!;
  })();
}
