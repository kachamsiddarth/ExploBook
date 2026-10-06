import { Router } from 'express';
import type { HealthCheckResponse } from '@explobook/shared';

const router = Router();

router.get('/', (_req, res) => {
  const responsePayload: HealthCheckResponse = {
    status: 'ok',
    service: 'explobook-api',
    timestamp: new Date().toISOString(),
  };

  res.status(200).json(responsePayload);
});

export default router;
