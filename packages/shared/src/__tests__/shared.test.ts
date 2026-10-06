import { describe, expect, it } from 'vitest';
import { HealthCheckResponseSchema, APP_NAME } from '../index.js';

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
});
