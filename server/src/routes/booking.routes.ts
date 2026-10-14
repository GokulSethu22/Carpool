// booking.routes.ts — Express routes for booking requests, confirmations, declines, and cancellations.
import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { authenticate } from '../middleware/auth';
import { validate } from '../middleware/validate';
import {
  requestBooking,
  acceptBooking,
  declineBooking,
  cancelBooking,
  completeBooking,
  getRiderBookings,
  getDriverRequests,
  getRouteBookings,
  getBookingById,
} from '../services/booking.service';
import { getRouteById } from '../services/route.service';

const router = Router();
router.use(authenticate);

const requestBookingSchema = z.object({
  route_id: z.number().int().positive(),
  pickup_name: z.string().min(2),
  pickup_lat: z.number(),
  pickup_lng: z.number(),
  drop_name: z.string().min(2),
  drop_lat: z.number(),
  drop_lng: z.number(),
  seats_booked: z.number().int().min(1).default(1),
});

router.post('/', validate(requestBookingSchema), (req: Request, res: Response) => {
  try {
    const booking = requestBooking(req.user!.id, req.body);
    res.status(201).json({ booking });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Booking request failed';
    res.status(400).json({ error: message });
  }
});

router.get('/mine', (req: Request, res: Response) => {
  try {
    const bookings = getRiderBookings(req.user!.id);
    res.json({ bookings });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to fetch bookings';
    res.status(500).json({ error: message });
  }
});

router.get('/requests', (req: Request, res: Response) => {
  try {
    const requests = getDriverRequests(req.user!.id);
    res.json({ requests });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to fetch ride requests';
    res.status(500).json({ error: message });
  }
});

router.get('/route/:routeId', (req: Request, res: Response) => {
  try {
    const routeId = Number(req.params.routeId);
    const route = getRouteById(routeId);
    if (!route || route.driver_id !== req.user!.id) {
      res.status(403).json({ error: 'You are not authorized to view bookings for this route.' });
      return;
    }
    const bookings = getRouteBookings(routeId);
    res.json({ bookings });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to fetch route bookings';
    res.status(500).json({ error: message });
  }
});

router.get('/:id', (req: Request, res: Response) => {
  try {
    const booking = getBookingById(Number(req.params.id));
    if (!booking) {
      res.status(404).json({ error: 'Booking not found' });
      return;
    }
    // Only rider or driver can view
    const route = getRouteById(booking.route_id);
    if (booking.rider_id !== req.user!.id && route?.driver_id !== req.user!.id) {
      res.status(403).json({ error: 'Access denied.' });
      return;
    }
    res.json({ booking });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to fetch booking';
    res.status(500).json({ error: message });
  }
});

router.patch('/:id/accept', (req: Request, res: Response) => {
  try {
    const booking = acceptBooking(req.user!.id, Number(req.params.id));
    res.json({ booking });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to accept booking';
    res.status(400).json({ error: message });
  }
});

router.patch('/:id/decline', (req: Request, res: Response) => {
  try {
    const booking = declineBooking(req.user!.id, Number(req.params.id));
    res.json({ booking });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to decline booking';
    res.status(400).json({ error: message });
  }
});

router.patch('/:id/cancel', (req: Request, res: Response) => {
  try {
    const booking = cancelBooking(req.user!.id, Number(req.params.id));
    res.json({ booking });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to cancel booking';
    res.status(400).json({ error: message });
  }
});

router.patch('/:id/complete', (req: Request, res: Response) => {
  try {
    const booking = completeBooking(Number(req.params.id));
    res.json({ booking });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to complete booking';
    res.status(400).json({ error: message });
  }
});

export default router;
