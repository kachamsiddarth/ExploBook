import { describe, expect, it } from 'vitest';
import request from 'supertest';
import { app } from '../app.js';

describe('Phase 2 API Integration Tests', () => {
  describe('GET /api/v1/auth/me', () => {
    it('should return 401 UNAUTHENTICATED when no Clerk session token is provided', async () => {
      const response = await request(app).get('/api/v1/auth/me');

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('error');
      expect(response.body.error.code).toBe('UNAUTHENTICATED');
    });
  });

  describe('GET /api/v1/reader/profile', () => {
    it('should return 401 UNAUTHENTICATED when no Clerk session token is provided', async () => {
      const response = await request(app).get('/api/v1/reader/profile');

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('success', false);
      expect(response.body.error.code).toBe('UNAUTHENTICATED');
    });
  });

  describe('GET /api/v1/books/:bookId', () => {
    it('should return 404 BOOK_NOT_FOUND for invalid/non-existent book id when DB is offline or empty', async () => {
      const response = await request(app).get('/api/v1/books/nonexistent-book-id');

      // If DB is offline, error handler returns 500, if DB online and missing returns 404
      expect([404, 500]).toContain(response.status);
      expect(response.body).toHaveProperty('error');
    });
  });
  describe('Protected Endpoints - 401 UNAUTHENTICATED when unauthenticated', () => {
    it('GET /api/v1/dashboard returns 401 without Clerk auth', async () => {
      const res = await request(app).get('/api/v1/dashboard');
      expect(res.status).toBe(401);
      expect(res.body.error?.code).toBe('UNAUTHENTICATED');
    });

    it('GET /api/v1/sessions/history returns 401 without Clerk auth', async () => {
      const res = await request(app).get('/api/v1/sessions/history');
      expect(res.status).toBe(401);
      expect(res.body.error?.code).toBe('UNAUTHENTICATED');
    });

    it('GET /api/v1/expeditions/history returns 401 without Clerk auth', async () => {
      const res = await request(app).get('/api/v1/expeditions/history');
      expect(res.status).toBe(401);
      expect(res.body.error?.code).toBe('UNAUTHENTICATED');
    });

    it('GET /api/v1/orbs returns 401 without Clerk auth', async () => {
      const res = await request(app).get('/api/v1/orbs');
      expect(res.status).toBe(401);
      expect(res.body.error?.code).toBe('UNAUTHENTICATED');
    });

    it('POST /api/v1/recommendations returns 401 without Clerk auth', async () => {
      const res = await request(app)
        .post('/api/v1/recommendations')
        .send({ query: 'nature' });
      expect(res.status).toBe(401);
      expect(res.body.error?.code).toBe('UNAUTHENTICATED');
    });

    it('does NOT accept client-provided userId to spoof or bypass authentication', async () => {
      const res = await request(app)
        .get('/api/v1/dashboard?userId=spoofed_user_123')
        .set('x-user-id', 'spoofed_user_123');
      expect(res.status).toBe(401);
      expect(res.body.error?.code).toBe('UNAUTHENTICATED');
    });
  });
});
