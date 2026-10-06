import { describe, expect, it } from 'vitest';
import request from 'supertest';
import { app } from '../app.js';

describe('GET /health', () => {
  it('should return 200 status with valid health response structure', async () => {
    const response = await request(app).get('/health');

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('status', 'ok');
    expect(response.body).toHaveProperty('service', 'explobook-api');
    expect(response.body).toHaveProperty('timestamp');
  });

  it('should return 404 for unknown endpoints with error payload', async () => {
    const response = await request(app).get('/unknown-route');

    expect(response.status).toBe(404);
    expect(response.body).toHaveProperty('error');
    expect(response.body.error.code).toBe('NOT_FOUND');
  });
});
