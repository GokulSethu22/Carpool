// vehicle.routes.ts — Express routes for vehicle management with plate validation.
import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { authenticate } from '../middleware/auth';
import { validate } from '../middleware/validate';
import {
  getVehiclesByUser,
  getVehicleById,
  addVehicle,
  updateVehicle,
  deleteVehicle,
} from '../services/vehicle.service';

const router = Router();
router.use(authenticate);

const vehicleSchema = z.object({
  type: z.enum(['bike', 'auto', 'cab']),
  registration: z.string().min(6, 'Invalid registration format'),
  model: z.string().min(2, 'Vehicle model is required'),
  colour: z.string().min(2, 'Vehicle colour is required'),
  seat_capacity: z.number().int().min(1).max(10),
});

const updateVehicleSchema = vehicleSchema.partial();

router.get('/', (req: Request, res: Response) => {
  try {
    const vehicles = getVehiclesByUser(req.user!.id);
    res.json({ vehicles });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to fetch vehicles';
    res.status(500).json({ error: message });
  }
});

router.get('/:id', (req: Request, res: Response) => {
  try {
    const vehicle = getVehicleById(Number(req.params.id));
    if (!vehicle || vehicle.user_id !== req.user!.id) {
      res.status(404).json({ error: 'Vehicle not found' });
      return;
    }
    res.json({ vehicle });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to fetch vehicle';
    res.status(500).json({ error: message });
  }
});

router.post('/', validate(vehicleSchema), (req: Request, res: Response) => {
  try {
    const vehicle = addVehicle(req.user!.id, req.body);
    res.status(201).json({ vehicle });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to add vehicle';
    res.status(400).json({ error: message });
  }
});

router.put('/:id', validate(updateVehicleSchema), (req: Request, res: Response) => {
  try {
    const vehicle = updateVehicle(req.user!.id, Number(req.params.id), req.body);
    res.json({ vehicle });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to update vehicle';
    res.status(400).json({ error: message });
  }
});

router.delete('/:id', (req: Request, res: Response) => {
  try {
    deleteVehicle(req.user!.id, Number(req.params.id));
    res.json({ message: 'Vehicle removed successfully' });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to delete vehicle';
    res.status(400).json({ error: message });
  }
});

export default router;
