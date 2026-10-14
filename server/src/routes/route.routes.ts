// route.routes.ts — Express routes for publishing, editing, and viewing routes with privacy guards.
import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { authenticate, optionalAuth } from '../middleware/auth';
import { validate } from '../middleware/validate';
import {
  publishRoute,
  getRouteById,
  getDriverRoutes,
  updateRoute,
  updateRouteStatus,
} from '../services/route.service';
import { getDb } from '../db/connection';
import type { RouteStatus } from '../../../shared/types';

const router = Router();

const waypointSchema = z.object({
  name: z.string(),
  lat: z.number(),
  lng: z.number(),
});

const publishRouteSchema = z.object({
  vehicle_id: z.number().int().positive(),
  origin_name: z.string().min(2),
  origin_lat: z.number(),
  origin_lng: z.number(),
  destination_name: z.string().min(2),
  dest_lat: z.number(),
  dest_lng: z.number(),
  waypoints: z.array(waypointSchema).optional(),
  route_geometry: z.string().optional(),
  departure_time: z.string().min(5),
  recurring_days: z.array(z.string()).nullable().optional(),
  seats_offered: z.number().int().min(1).max(10),
  price_per_km: z.number().positive(),
  notes: z.string().nullable().optional(),
});

const updateRouteSchema = z.object({
  waypoints: z.array(waypointSchema).optional(),
  departure_time: z.string().optional(),
  recurring_days: z.array(z.string()).nullable().optional(),
  seats_offered: z.number().int().min(1).max(10).optional(),
  price_per_km: z.number().positive().optional(),
  notes: z.string().nullable().optional(),
});

const statusSchema = z.object({
  status: z.enum(['active', 'in_progress', 'paused', 'cancelled', 'completed']),
});

router.post('/', authenticate, validate(publishRouteSchema), (req: Request, res: Response) => {
  try {
    const route = publishRoute(req.user!.id, req.body);
    res.status(201).json({ route });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to publish route';
    res.status(400).json({ error: message });
  }
});

router.get('/mine', authenticate, (req: Request, res: Response) => {
  try {
    const routes = getDriverRoutes(req.user!.id);
    res.json({ routes });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to fetch your routes';
    res.status(500).json({ error: message });
  }
});

router.get('/:id', optionalAuth, (req: Request, res: Response) => {
  try {
    const routeId = Number(req.params.id);
    const route = getRouteById(routeId);
    if (!route) {
      res.status(404).json({ error: 'Route not found' });
      return;
    }

    // Privacy logic: Check if user has confirmed booking or is the driver
    let canViewPrivateDetails = false;
    let driverPhone: string | null = null;

    if (req.user) {
      if (req.user.id === route.driver_id) {
        canViewPrivateDetails = true;
      } else {
        const db = getDb();
        const booking = db.prepare(`
          SELECT id FROM bookings
          WHERE route_id = ? AND rider_id = ? AND status IN ('confirmed', 'in_progress', 'completed')
        `).get(routeId, req.user.id);
        if (booking) {
          canViewPrivateDetails = true;
        }
      }

      if (canViewPrivateDetails) {
        const db = getDb();
        const driver = db.prepare('SELECT phone FROM users WHERE id = ?').get(route.driver_id) as { phone: string | null } | undefined;
        driverPhone = driver?.phone || null;
      }
    }

    res.json({
      route,
      driver_phone: driverPhone,
      can_view_contact: canViewPrivateDetails,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to fetch route';
    res.status(500).json({ error: message });
  }
});

router.put('/:id', authenticate, validate(updateRouteSchema), (req: Request, res: Response) => {
  try {
    const route = updateRoute(req.user!.id, Number(req.params.id), req.body);
    res.json({ route });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to update route';
    res.status(400).json({ error: message });
  }
});

router.patch('/:id/status', authenticate, validate(statusSchema), (req: Request, res: Response) => {
  try {
    const route = updateRouteStatus(req.user!.id, Number(req.params.id), req.body.status as RouteStatus);
    res.json({ route });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to update route status';
    res.status(400).json({ error: message });
  }
});

export default router;
