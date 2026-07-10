import { Request, Response, NextFunction } from 'express';
import { ApplicationError } from '../utils/errors.js';
import { logger } from '../utils/logger.js';

export const errorMiddleware = (
  err: Error,
  req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  next: NextFunction
) => {
  if (err instanceof ApplicationError) {
    logger.error(`[${err.errorCode}] ${err.message}`);
    return res.status(err.statusCode).json({
      success: false,
      error: {
        code: err.errorCode,
        message: err.message,
        timestamp: new Date().toISOString(),
        ...(err.errorCode === 'VALIDATION_ERROR' && 'details' in err
          ? { details: (err as any).details }
          : {}),
      },
    });
  }

  logger.error(`[INTERNAL_SERVER_ERROR] ${err.message}\nStack: ${err.stack}`);
  return res.status(500).json({
    success: false,
    error: {
      code: 'INTERNAL_SERVER_ERROR',
      message: 'An unexpected error occurred on the server.',
      timestamp: new Date().toISOString(),
    },
  });
};
