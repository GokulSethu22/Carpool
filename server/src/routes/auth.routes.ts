// auth.routes.ts — Express routes for authentication (signup, login, logout, me).
import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { signup, login, getUserById } from '../services/auth.service';
import { authenticate } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { PHONE_REGEX } from '../../../shared/types';

const router = Router();

const signupSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  phone: z.string().regex(PHONE_REGEX, 'Phone must be a valid 10-digit Indian number starting with +91').optional(),
});

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

router.post('/signup', validate(signupSchema), (req: Request, res: Response) => {
  try {
    const { name, email, password, phone } = req.body;
    const user = signup(name, email, password, phone);
    const loginResult = login(email, password);

    const isProd = process.env.NODE_ENV === 'production';
    res.cookie('token', loginResult.token, {
      httpOnly: true,
      secure: isProd,
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000,
      path: '/',
    });

    res.status(201).json({ user });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Signup failed';
    res.status(400).json({ error: message });
  }
});

router.post('/login', validate(loginSchema), (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    const { user, token } = login(email, password);
    const isProd = process.env.NODE_ENV === 'production';

    res.cookie('token', token, {
      httpOnly: true,
      secure: isProd,
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000,
      path: '/',
    });

    res.json({ user });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Login failed';
    res.status(401).json({ error: message });
  }
});

router.post('/logout', (_req: Request, res: Response) => {
  const isProd = process.env.NODE_ENV === 'production';
  res.clearCookie('token', {
    httpOnly: true,
    secure: isProd,
    sameSite: 'lax',
    path: '/',
  });
  res.json({ message: 'Logged out successfully' });
});

router.get('/me', authenticate, (req: Request, res: Response) => {
  try {
    const user = getUserById(req.user!.id);
    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }
    res.json({ user });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to fetch session';
    res.status(500).json({ error: message });
  }
});

export default router;
