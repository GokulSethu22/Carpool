// search.routes.ts — Express route for searching commuter rides with geocoded coordinates.
import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { searchRoutes } from '../services/search.service';
import type { VehicleType } from '../../../shared/types';

const router = Router();

const searchSchema = z.object({
  pickup_lat: z.coerce.number(),
  pickup_lng: z.coerce.number(),
  drop_lat: z.coerce.number(),
  drop_lng: z.coerce.number(),
  date: z.string().optional().default(''),
  vehicle_type: z.enum(['bike', 'auto', 'cab']).optional(),
  seats_needed: z.coerce.number().int().min(1).default(1),
  max_detour_km: z.coerce.number().positive().optional().default(1.5),
});

router.get('/', (req: Request, res: Response) => {
  try {
    const parsed = searchSchema.parse(req.query);

    const results = searchRoutes(
      {
        pickup_lat: parsed.pickup_lat,
        pickup_lng: parsed.pickup_lng,
        drop_lat: parsed.drop_lat,
        drop_lng: parsed.drop_lng,
        date: parsed.date,
        vehicle_type: parsed.vehicle_type as VehicleType | undefined,
        seats_needed: parsed.seats_needed,
      },
      parsed.max_detour_km,
    );

    res.json({ results, count: results.length });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Search failed';
    res.status(400).json({ error: message });
  }
});

export default router;
