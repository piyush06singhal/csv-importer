import { Router, Request, Response } from 'express';
import { env } from '../config/env.config.js';
import { logger } from '../utils/logger.js';

const router = Router();

router.get('/', (req: Request, res: Response) => {
  logger.info('GET /health diagnostics triggered.');

  const isConfigured =
    !!env.OPENAI_API_KEY && env.OPENAI_API_KEY !== 'mock-openai-key-for-test';

  const memoryUsage = process.memoryUsage();
  const uptimeSeconds = process.uptime();

  res.status(200).json({
    status: 'healthy',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    node_version: process.version,
    environment: env.NODE_ENV,
    uptime_seconds: uptimeSeconds,
    memory: {
      heap_used_mb: Math.round((memoryUsage.heapUsed / 1024 / 1024) * 100) / 100,
      heap_total_mb: Math.round((memoryUsage.heapTotal / 1024 / 1024) * 100) / 100,
      rss_mb: Math.round((memoryUsage.rss / 1024 / 1024) * 100) / 100,
    },
    services: {
      openai_api: isConfigured ? 'configured' : 'mocked_or_missing_key',
    },
  });
});

export default router;
