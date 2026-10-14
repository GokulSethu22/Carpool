// index.ts — Main Express server application entry point for Carpool.
import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import path from 'path';
import fs from 'fs';
import { getDb } from './db/connection';

import authRoutes from './routes/auth.routes';
import vehicleRoutes from './routes/vehicle.routes';
import routeRoutes from './routes/route.routes';
import searchRoutes from './routes/search.routes';
import bookingRoutes from './routes/booking.routes';
import tripRoutes from './routes/trip.routes';
import ratingRoutes from './routes/rating.routes';
import notificationRoutes from './routes/notification.routes';
import profileRoutes from './routes/profile.routes';

// Load .env file optionally if native method is present
if (typeof process.loadEnvFile === 'function') {
  try {
    process.loadEnvFile();
  } catch {
    // Optional .env file was not present or could not be loaded
  }
}

const isProd = process.env.NODE_ENV === 'production';

// In production, enforce that JWT_SECRET is provided
if (isProd && !process.env.JWT_SECRET) {
  // eslint-disable-next-line no-console
  console.error('FATAL ERROR: JWT_SECRET environment variable is missing in production.');
  process.exit(1);
}

const app = express();
const PORT = Number(process.env.PORT) || 3001;
const HOST = '0.0.0.0';

// Ensure database connection, schema, and initial seeding are loaded
getDb();

// Proxy and CORS configuration
if (isProd) {
  app.set('trust proxy', 1);
} else {
  app.use(
    cors({
      origin: 'http://localhost:5173',
      credentials: true,
    }),
  );
}

app.use(cookieParser());
app.use(express.json());

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/vehicles', vehicleRoutes);
app.use('/api/routes', routeRoutes);
app.use('/api/search', searchRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/trips', tripRoutes);
app.use('/api/ratings', ratingRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api', profileRoutes);

// Health check endpoint
app.get('/api/health', (_req: Request, res: Response) => {
  res.json({ status: 'ok' });
});

// Serve frontend static assets in production
if (isProd) {
  const clientDistCandidates = [
    path.resolve(process.cwd(), 'client/dist'),
    path.resolve(__dirname, '../../../../client/dist'),
    path.resolve(__dirname, '../../../client/dist'),
    path.resolve(__dirname, '../../client/dist'),
  ];
  const clientDist = clientDistCandidates.find((p) => fs.existsSync(p)) || clientDistCandidates[0];

  app.use(express.static(clientDist));

  // React Router deep linking: return index.html for any non-/api route
  app.get('*', (req: Request, res: Response) => {
    if (req.path.startsWith('/api')) {
      res.status(404).json({ error: 'API endpoint not found' });
      return;
    }
    res.sendFile(path.join(clientDist, 'index.html'));
  });
}

// Global error handler
app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  res.status(500).json({ error: err.message || 'Internal server error' });
});

app.listen(PORT, HOST, () => {
  // eslint-disable-next-line no-console
  console.log(`Carpool server running on http://${HOST}:${PORT} (environment: ${process.env.NODE_ENV || 'development'})`);
});

export default app;
