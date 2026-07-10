import express from 'express';
import cors from 'cors';
import { env } from './config/env.config.js';
import { logger } from './utils/logger.js';
import healthRoutes from './routes/health.routes.js';
import importRoutes from './routes/import.routes.js';
import swaggerRoutes from './routes/swagger.routes.js';
import { errorMiddleware } from './middlewares/error.middleware.js';

const app = express();

// Configure CORS
const allowedOrigin = env.ALLOWED_ORIGIN;
const cleanOrigin = allowedOrigin.endsWith('/') ? allowedOrigin.slice(0, -1) : allowedOrigin;

app.use(
  cors({
    origin: [cleanOrigin, `${cleanOrigin}/`],
    methods: ['GET', 'POST', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

// Security Headers Middleware
app.use((req, res, next) => {
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'no-referrer');
  res.setHeader('Strict-Transport-Security', 'max-age=15552000; includeSubDomains');
  next();
});

// Body parsers
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request Logger Middleware
app.use((req, res, next) => {
  logger.http(`${req.method} ${req.url}`);
  next();
});

// Route registration
app.use('/health', healthRoutes);
app.use('/api/import', importRoutes);
app.use('/api-docs', swaggerRoutes);

// Catch-all route for missing routes
app.use((req, res, next) => {
  res.status(404).json({
    success: false,
    error: {
      code: 'NOT_FOUND',
      message: `Route ${req.method} ${req.url} does not exist.`,
      timestamp: new Date().toISOString(),
    },
  });
});

// Error handling middleware
app.use(errorMiddleware);

export default app;
