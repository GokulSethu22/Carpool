// profile.routes.ts — Express routes for profile views, updates, safety (reports/blocks), and dashboard metrics.
import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { authenticate, optionalAuth } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { getDb } from '../db/connection';
import { getUserById, updateUser } from '../services/auth.service';
import { getUserAverageRating, getUserRatings } from '../services/rating.service';
import { getVehiclesByUser } from '../services/vehicle.service';
import { PHONE_REGEX } from '../../../shared/types';
import type { DashboardStats } from '../../../shared/types';

const router = Router();

const updateProfileSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  phone: z.string().regex(PHONE_REGEX, 'Phone must be a valid 10-digit Indian number starting with +91').nullable().optional(),
});

const reportSchema = z.object({
  reported_user_id: z.number().int().positive(),
  reason: z.string().min(5, 'Reason must be at least 5 characters'),
});

const blockSchema = z.object({
  blocked_id: z.number().int().positive(),
});

// Dashboard stats: earnings, savings, ride counts
router.get('/dashboard/stats', authenticate, (req: Request, res: Response) => {
  try {
    const db = getDb();
    const userId = req.user!.id;

    // Driver stats: sum of fares from completed bookings on user's routes
    const driverStats = db.prepare(`
      SELECT COALESCE(SUM(b.fare), 0) as total_earned, COUNT(DISTINCT r.id) as rides_count
      FROM routes r
      LEFT JOIN bookings b ON r.id = b.route_id AND b.status = 'completed'
      WHERE r.driver_id = ? AND r.status = 'completed'
    `).get(userId) as { total_earned: number; rides_count: number };

    // Rider stats: sum of fares paid on completed bookings
    const riderStats = db.prepare(`
      SELECT COALESCE(SUM(fare), 0) as total_saved, COUNT(*) as rides_count
      FROM bookings
      WHERE rider_id = ? AND status = 'completed'
    `).get(userId) as { total_saved: number; rides_count: number };

    const stats: DashboardStats = {
      total_earned: Math.round(driverStats.total_earned * 100) / 100,
      total_saved: Math.round(riderStats.total_saved * 100) / 100,
      rides_as_driver: driverStats.rides_count,
      rides_as_rider: riderStats.rides_count,
    };

    res.json({ stats });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to calculate stats';
    res.status(500).json({ error: message });
  }
});

// Update own profile
router.put('/profile', authenticate, validate(updateProfileSchema), (req: Request, res: Response) => {
  try {
    const { name, phone } = req.body;
    const updated = updateUser(req.user!.id, name, phone ?? null);
    res.json({ user: updated });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to update profile';
    res.status(400).json({ error: message });
  }
});

// Safety: Report user
router.post('/reports', authenticate, validate(reportSchema), (req: Request, res: Response) => {
  try {
    const db = getDb();
    const { reported_user_id, reason } = req.body;
    db.prepare(`
      INSERT INTO reports (reporter_id, reported_user_id, reason)
      VALUES (?, ?, ?)
    `).run(req.user!.id, reported_user_id, reason);

    res.status(201).json({ message: 'Report submitted. Our safety team will review it.' });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to submit report';
    res.status(400).json({ error: message });
  }
});

// Safety: Block user
router.post('/blocks', authenticate, validate(blockSchema), (req: Request, res: Response) => {
  try {
    const db = getDb();
    const { blocked_id } = req.body;
    db.prepare(`
      INSERT OR IGNORE INTO blocks (blocker_id, blocked_id)
      VALUES (?, ?)
    `).run(req.user!.id, blocked_id);

    res.status(201).json({ message: 'User blocked.' });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to block user';
    res.status(400).json({ error: message });
  }
});

// Public profile view
router.get('/users/:id/profile', optionalAuth, (req: Request, res: Response) => {
  try {
    const targetUserId = Number(req.params.id);
    const user = getUserById(targetUserId);
    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    const ratingsStats = getUserAverageRating(targetUserId);
    const ratings = getUserRatings(targetUserId);
    const vehicles = getVehiclesByUser(targetUserId);

    // Privacy rule: Only show phone number if requester has confirmed/completed booking with this user
    let showPhone = false;
    if (req.user) {
      if (req.user.id === targetUserId) {
        showPhone = true;
      } else {
        const db = getDb();
        const sharedBooking = db.prepare(`
          SELECT b.id FROM bookings b
          JOIN routes r ON b.route_id = r.id
          WHERE ((b.rider_id = ? AND r.driver_id = ?) OR (b.rider_id = ? AND r.driver_id = ?))
            AND b.status IN ('confirmed', 'in_progress', 'completed')
        `).get(req.user.id, targetUserId, targetUserId, req.user.id);

        if (sharedBooking) {
          showPhone = true;
        }
      }
    }

    res.json({
      profile: {
        id: user.id,
        name: user.name,
        created_at: user.created_at,
        phone: showPhone ? user.phone : null,
        phone_hidden: !showPhone && Boolean(user.phone),
        average_rating: ratingsStats.average,
        total_ratings: ratingsStats.count,
        vehicles: vehicles.map((v) => ({
          type: v.type,
          model: v.model,
          colour: v.colour,
          seat_capacity: v.seat_capacity,
        })),
        ratings,
      },
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to fetch user profile';
    res.status(500).json({ error: message });
  }
});

export default router;
