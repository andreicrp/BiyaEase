import { Request, Response, NextFunction } from 'express';
import { env } from '../config/env.js';
import { logger } from '../utils/logger.js';

export function errorMiddleware(
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  const isProd = env.NODE_ENV === 'production';

  logger.error(`Unhandled error: ${err.message}`, isProd ? undefined : err.stack);

  res.status(500).json({
    success: false,
    error: {
      message: isProd ? 'Internal Server Error' : err.message,
      code: 'INTERNAL_SERVER_ERROR',
      ...(isProd ? {} : { stack: err.stack }),
    },
  });
}
