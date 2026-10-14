// rating.routes.ts — Express routes for submitting and fetching user trip ratings.
import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { authenticate } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { submitRating, getUserRatings, getUserAverageRating } from '../services/rating.service';

const router = Router();

const ratingSchema = z.object({
  booking_id: z.number().int().positive(),
  score: z.number().int().min(1).max(5),
  comment: z.string().nullable().optional(),
});

router.post('/', authenticate, validate(ratingSchema), (req: Request, res: Response) => {
  try {
    const { booking_id, score, comment } = req.body;
    const rating = submitRating(req.user!.id, booking_id, score, comment);
    res.status(201).json({ rating });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to submit rating';
    res.status(400).json({ error: message });
  }
});

router.get('/users/:id', (req: Request, res: Response) => {
  try {
    const userId = Number(req.params.id);
    const ratings = getUserRatings(userId);
    const stats = getUserAverageRating(userId);
    res.json({ ratings, stats });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to fetch ratings';
    res.status(500).json({ error: message });
  }
});

export default router;
