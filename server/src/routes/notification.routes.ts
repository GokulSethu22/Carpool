// notification.routes.ts — Express routes for getting and marking notifications as read.
import { Router, Request, Response } from 'express';
import { authenticate } from '../middleware/auth';
import {
  getUserNotifications,
  markAsRead,
  getUnreadCount,
} from '../services/notification.service';

const router = Router();
router.use(authenticate);

router.get('/', (req: Request, res: Response) => {
  try {
    const notifications = getUserNotifications(req.user!.id);
    const unreadCount = getUnreadCount(req.user!.id);
    res.json({ notifications, unread_count: unreadCount });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to fetch notifications';
    res.status(500).json({ error: message });
  }
});

router.patch('/:id/read', (req: Request, res: Response) => {
  try {
    markAsRead(req.user!.id, Number(req.params.id));
    res.json({ message: 'Marked as read' });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to mark notification as read';
    res.status(400).json({ error: message });
  }
});

export default router;
