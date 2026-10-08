import type { Request, Response, NextFunction } from 'express';
import type { ApiErrorResponse } from '@explobook/shared';
import { config } from '../config/index.js';

export function errorHandler(
  err: any,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  const isProduction = config.env === 'production';
  
  if (!isProduction) {
    console.error('[API Error]:', err.message || err);
  }

  if (err.name === 'ZodError') {
    res.status(400).json({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Invalid request payload parameters',
        details: err.flatten ? err.flatten() : err.errors,
      },
    });
    return;
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
