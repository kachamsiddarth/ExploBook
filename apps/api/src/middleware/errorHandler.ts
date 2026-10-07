import type { Request, Response, NextFunction } from 'express';
import type { ApiErrorResponse } from '@explobook/shared';
import { config } from '../config/index.js';

export function errorHandler(
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  const isProduction = config.env === 'production';
  
  if (!isProduction) {
    console.error('[API Error]:', err.message);
  }

  const errorPayload: ApiErrorResponse = {
    success: false,
    error: {
      code: 'INTERNAL_ERROR',
      message: isProduction ? 'An unexpected internal server error occurred' : (err.message || 'An unexpected internal error occurred'),
    },
  };

  res.status(500).json(errorPayload);
}
