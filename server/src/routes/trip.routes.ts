// trip.routes.ts — Express routes for controlling trip status (start, complete).
import { Router, Request, Response } from 'express';
import { authenticate } from '../middleware/auth';
import { startTrip, completeTrip } from '../services/trip.service';

const router = Router();
router.use(authenticate);

router.patch('/:routeId/start', (req: Request, res: Response) => {
  try {
    const route = startTrip(req.user!.id, Number(req.params.routeId));
    res.json({ route });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to start trip';
    res.status(400).json({ error: message });
  }
});

router.patch('/:routeId/complete', (req: Request, res: Response) => {
  try {
    const route = completeTrip(req.user!.id, Number(req.params.routeId));
    res.json({ route });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to complete trip';
    res.status(400).json({ error: message });
  }
});

export default router;
