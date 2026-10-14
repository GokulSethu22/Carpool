// rating.service.ts — Service for submitting and retrieving trip ratings between riders and drivers.
import { getDb } from '../db/connection';
import { createNotification } from './notification.service';
import type { Rating } from '../../../shared/types';

export function submitRating(
  fromUserId: number,
  bookingId: number,
  score: number,
  comment?: string | null,
): Rating {
  const db = getDb();

  if (score < 1 || score > 5) {
    throw new Error('Rating score must be between 1 and 5.');
  }

  // Find booking and route
  const booking = db.prepare(`
    SELECT b.*, r.driver_id
    FROM bookings b
    JOIN routes r ON b.route_id = r.id
    WHERE b.id = ?
  `).get(bookingId) as {
    id: number;
    rider_id: number;
    driver_id: number;
    status: string;
  } | undefined;

  if (!booking) {
    throw new Error('Booking not found.');
  }

  if (booking.status !== 'completed') {
    throw new Error('Ratings can only be submitted for completed trips.');
  }

  // Determine who is rating whom
  let toUserId: number;
  if (fromUserId === booking.rider_id) {
    toUserId = booking.driver_id;
  } else if (fromUserId === booking.driver_id) {
    toUserId = booking.rider_id;
  } else {
    throw new Error('You were not part of this booking and cannot rate it.');
  }

  // Prevent double rating
  const existing = db.prepare(`
    SELECT id FROM ratings WHERE booking_id = ? AND from_user_id = ?
  `).get(bookingId, fromUserId);

  if (existing) {
    throw new Error('You have already submitted a rating for this trip.');
  }

  const result = db.prepare(`
    INSERT INTO ratings (booking_id, from_user_id, to_user_id, score, comment)
    VALUES (?, ?, ?, ?, ?)
  `).run(bookingId, fromUserId, toUserId, score, comment || null);

  createNotification(
    toUserId,
    `You received a new ${score}-star rating!`,
    'rating_received',
    bookingId,
  );

  return {
    id: result.lastInsertRowid as number,
    booking_id: bookingId,
    from_user_id: fromUserId,
    to_user_id: toUserId,
    score,
    comment: comment || null,
    created_at: new Date().toISOString(),
  };
}

export function getUserRatings(userId: number): Rating[] {
  const db = getDb();
  const rows = db.prepare(`
    SELECT rt.*, u.name as from_user_name
    FROM ratings rt
    JOIN users u ON rt.from_user_id = u.id
    WHERE rt.to_user_id = ?
    ORDER BY rt.created_at DESC
  `).all(userId) as Array<Record<string, unknown>>;

  return rows.map((r) => ({
    id: r.id as number,
    booking_id: r.booking_id as number,
    from_user_id: r.from_user_id as number,
    to_user_id: r.to_user_id as number,
    score: r.score as number,
    comment: (r.comment as string) || null,
    created_at: r.created_at as string,
    from_user_name: r.from_user_name as string,
  }));
}

export function getUserAverageRating(userId: number): { average: number; count: number } {
  const db = getDb();
  const row = db.prepare(`
    SELECT AVG(score) as avg_score, COUNT(*) as total_ratings
    FROM ratings
    WHERE to_user_id = ?
  `).get(userId) as { avg_score: number | null; total_ratings: number };

  return {
    average: row.avg_score ? Number(row.avg_score.toFixed(1)) : 0,
    count: row.total_ratings,
  };
}
