import type { Request, Response } from 'express';
import type { ApiErrorResponse } from '@explobook/shared';

export function notFoundHandler(req: Request, res: Response): void {
  const errorPayload: ApiErrorResponse = {
    error: {
      code: 'NOT_FOUND',
      message: `Resource not found: ${req.method} ${req.path}`,
    },
  };

  res.status(404).json(errorPayload);
}
