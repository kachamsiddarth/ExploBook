import './services/sentry.service.js'; // Initialize Sentry first
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { config } from './config/index.js';
import healthRouter from './routes/health.routes.js';
import v1Router from './routes/v1.routes.js';
import { notFoundHandler } from './middleware/notFoundHandler.js';
import { errorHandler } from './middleware/errorHandler.js';
import { clerkAuthMiddleware } from './middleware/auth.middleware.js';

export const app = express();

// Security and CORS middleware
app.use(helmet());
app.use(
  cors({
    origin: config.webOrigin,
    credentials: true,
  })
);

// Standard body parser with safe payload size limit
app.use(express.json({ limit: '1mb' }));

// Clerk session authentication parsing
app.use(clerkAuthMiddleware());

// Routes
app.use('/health', healthRouter);
app.use('/api/v1', v1Router);

// Fallback Handlers
app.use(notFoundHandler);
app.use(errorHandler);
