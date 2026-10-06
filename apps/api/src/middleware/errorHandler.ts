import type { Request, Response, NextFunction } from 'express';
import type { ApiErrorResponse } from '@explobook/shared';

export function errorHandler(
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  console.error('[API Error]:', err.message);

  const errorPayload: ApiErrorResponse = {
    error: {
      code: 'INTERNAL_ERROR',
      message: err.message || 'An unexpected internal error occurred',
    },
  };

  res.status(500).json(errorPayload);
}
