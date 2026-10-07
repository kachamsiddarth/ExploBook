import { describe, expect, it } from 'vitest';
import { HealthCheckResponseSchema, ApiErrorResponseSchema, EntityIdSchema, APP_NAME } from '../index.js';

describe('Shared Package Foundation', () => {
  it('should export application constants correctly', () => {
    expect(APP_NAME).toBe('ExploBook');
  });

  it('should validate HealthCheckResponseSchema with Zod', () => {
    const validData = { status: 'ok', service: 'explobook-api' };
    const parsed = HealthCheckResponseSchema.safeParse(validData);

    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data.status).toBe('ok');
      expect(parsed.data.service).toBe('explobook-api');
    }
  });

  it('should reject invalid health check responses', () => {
    const invalidData = { status: 'error', service: 123 };
    const parsed = HealthCheckResponseSchema.safeParse(invalidData);

    expect(parsed.success).toBe(false);
  });

  it('should validate ApiErrorResponseSchema with Zod', () => {
    const validError = {
      success: false,
      error: {
        code: 'NOT_FOUND',
        message: 'Item not found',
      },
    };
    const parsed = ApiErrorResponseSchema.safeParse(validError);
    expect(parsed.success).toBe(true);
  });

  it('should validate EntityIdSchema with Zod', () => {
    expect(EntityIdSchema.safeParse('valid-id-123').success).toBe(true);
    expect(EntityIdSchema.safeParse('').success).toBe(false);
  });
});
