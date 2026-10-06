import { z } from 'zod';

export const HealthCheckResponseSchema = z.object({
  status: z.literal('ok'),
  service: z.string(),
  timestamp: z.string().optional(),
});

export type HealthCheckResponse = z.infer<typeof HealthCheckResponseSchema>;

export const ApiErrorResponseSchema = z.object({
  error: z.object({
    code: z.string(),
    message: z.string(),
    requestId: z.string().optional(),
    details: z.record(z.unknown()).optional(),
  }),
});

export type ApiErrorResponse = z.infer<typeof ApiErrorResponseSchema>;
