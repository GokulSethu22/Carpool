// notification.service.ts — Creates, fetches, and manages in-app notifications.
import { getDb } from '../db/connection';
import type { AppNotification } from '../../../shared/types';

export function createNotification(
  userId: number,
  message: string,
  type: string,
  relatedId: number | null = null,
): void {
  const db = getDb();
  db.prepare(
    'INSERT INTO notifications (user_id, message, type, related_id) VALUES (?, ?, ?, ?)',
  ).run(userId, message, type, relatedId);
}

export function getUserNotifications(userId: number): AppNotification[] {
  const db = getDb();
  const rows = db
    .prepare(
      `SELECT id, user_id, message, type, related_id, is_read, created_at
       FROM notifications WHERE user_id = ?
       ORDER BY created_at DESC LIMIT 50`,
    )
    .all(userId) as Array<{
      id: number;
      user_id: number;
      message: string;
      type: string;
      related_id: number | null;
      is_read: number;
      created_at: string;
    }>;

  return rows.map((r) => ({ ...r, is_read: r.is_read === 1 }));
}

export function markAsRead(userId: number, notificationId: number): void {
  const db = getDb();
  db.prepare('UPDATE notifications SET is_read = 1 WHERE id = ? AND user_id = ?').run(
    notificationId,
    userId,
  );
}

export function getUnreadCount(userId: number): number {
  const db = getDb();
  const row = db
    .prepare('SELECT COUNT(*) as count FROM notifications WHERE user_id = ? AND is_read = 0')
    .get(userId) as { count: number };
  return row.count;
}
