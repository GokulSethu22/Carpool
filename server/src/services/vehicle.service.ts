// vehicle.service.ts — CRUD operations for driver vehicles with TN plate validation.
import { getDb } from '../db/connection';
import { TN_PLATE_REGEX } from '../../../shared/types';
import type { Vehicle, VehicleType } from '../../../shared/types';

interface VehicleInput {
  type: VehicleType;
  registration: string;
  model: string;
  colour: string;
  seat_capacity: number;
}

export function getVehiclesByUser(userId: number): Vehicle[] {
  const db = getDb();
  return db.prepare('SELECT * FROM vehicles WHERE user_id = ?').all(userId) as Vehicle[];
}

export function getVehicleById(id: number): Vehicle | null {
  const db = getDb();
  return (db.prepare('SELECT * FROM vehicles WHERE id = ?').get(id) as Vehicle) || null;
}

export function addVehicle(userId: number, data: VehicleInput): Vehicle {
  const db = getDb();

  const reg = data.registration.toUpperCase().trim();
  if (!TN_PLATE_REGEX.test(reg)) {
    throw new Error('Invalid registration. Use Tamil Nadu format, e.g. TN 09 AB 1234.');
  }

  const result = db
    .prepare(
      `INSERT INTO vehicles (user_id, type, registration, model, colour, seat_capacity)
       VALUES (?, ?, ?, ?, ?, ?)`,
    )
    .run(userId, data.type, reg, data.model, data.colour, data.seat_capacity);

  return {
    id: result.lastInsertRowid as number,
    user_id: userId,
    type: data.type,
    registration: reg,
    model: data.model,
    colour: data.colour,
    seat_capacity: data.seat_capacity,
  };
}

export function updateVehicle(userId: number, vehicleId: number, data: Partial<VehicleInput>): Vehicle {
  const db = getDb();
  const existing = db.prepare('SELECT * FROM vehicles WHERE id = ? AND user_id = ?').get(vehicleId, userId) as Vehicle | undefined;
  if (!existing) {
    throw new Error('Vehicle not found or you do not own it.');
  }

  if (data.registration) {
    const reg = data.registration.toUpperCase().trim();
    if (!TN_PLATE_REGEX.test(reg)) {
      throw new Error('Invalid registration. Use Tamil Nadu format, e.g. TN 09 AB 1234.');
    }
    data.registration = reg;
  }

  const updated = { ...existing, ...data };
  db.prepare(
    `UPDATE vehicles SET type = ?, registration = ?, model = ?, colour = ?, seat_capacity = ?
     WHERE id = ? AND user_id = ?`,
  ).run(updated.type, updated.registration, updated.model, updated.colour, updated.seat_capacity, vehicleId, userId);

  return updated;
}

export function deleteVehicle(userId: number, vehicleId: number): void {
  const db = getDb();
  const existing = db.prepare('SELECT id FROM vehicles WHERE id = ? AND user_id = ?').get(vehicleId, userId);
  if (!existing) {
    throw new Error('Vehicle not found or you do not own it.');
  }

  // Check for active routes using this vehicle
  const activeRoute = db
    .prepare("SELECT id FROM routes WHERE vehicle_id = ? AND status IN ('active', 'paused')")
    .get(vehicleId);
  if (activeRoute) {
    throw new Error('Cannot delete a vehicle that has active routes. Cancel or complete those routes first.');
  }

  db.prepare('DELETE FROM vehicles WHERE id = ? AND user_id = ?').run(vehicleId, userId);
}
