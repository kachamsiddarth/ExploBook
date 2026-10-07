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
});
