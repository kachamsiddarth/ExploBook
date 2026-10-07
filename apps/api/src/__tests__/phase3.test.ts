import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import { app } from '../app.js';
import { bookRepository } from '../repositories/book.repository.js';
import { embeddingService } from '../services/embedding.service.js';
import { gemmaService } from '../services/gemma.service.js';
import { ObjectId } from 'mongodb';

describe('Phase 3 - Recommendations & Vector Retrieval Tests', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  describe('GET /api/v1/recommendations/public', () => {
    it('should return recommendations even when DB or vector search falls back gracefully', async () => {
      // Mock book repository to return sample books
      vi.spyOn(bookRepository, 'find').mockResolvedValue({
        books: [
          {
            _id: new ObjectId('651234567890123456789012'),
            title: 'Walden',
            authors: ['Henry David Thoreau'],
            description: 'Life in the woods',
            genres: ['Nature', 'Philosophy'],
            themes: ['nature', 'solitude'],
            language: 'en',
            difficultyScore: 7,
            publicDomain: true,
            source: 'seed',
            metadataQuality: 1.0,
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        ],
        total: 1,
      });

      // Mock missing embeddings to return empty
      vi.spyOn(bookRepository, 'findMissingEmbeddings').mockResolvedValue([]);
      vi.spyOn(embeddingService, 'generateEmbedding').mockResolvedValue({
        embedding: new Array(768).fill(0.05),
        model: 'nomic-embed-text',
      });

      // Mock gemmaService to return grounded fallback instantly
      vi.spyOn(gemmaService, 'generateGroundedReasoning').mockResolvedValue({
        reasoning: {
          explanation: 'Walden explores intentional living and contemplation.',
          touchGrassReason: 'Step away from screen hurry into quiet nature.',
          suggestedAtmosphere: 'By a pond or quiet wooded bench.',
        },
        status: 'gemma_grounded',
      });

      const response = await request(app).get('/api/v1/recommendations/public?q=nature');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('recommendations');
      expect(response.body.data.recommendations.length).toBeGreaterThan(0);
      expect(response.body.data.recommendations[0].book.title).toBe('Walden');
      expect(response.body.data.recommendations[0]).toHaveProperty('reasoning');
      expect(response.body.data.recommendations[0].reasoning).toHaveProperty('touchGrassReason');
    });

    it('should utilize vectorSearch when query embeddings are generated', async () => {
      // Mock embedding service to return valid dummy 768-dim vector
      const mockVector = new Array(768).fill(0.1);
      vi.spyOn(embeddingService, 'generateEmbedding').mockResolvedValue({
        embedding: mockVector,
        model: 'nomic-embed-text',
      });

      vi.spyOn(bookRepository, 'findMissingEmbeddings').mockResolvedValue([]);

      vi.spyOn(bookRepository, 'vectorSearch').mockResolvedValue({
        results: [
          {
            book: {
              _id: new ObjectId('651234567890123456789013'),
              title: 'A Walk in the Woods',
              authors: ['Bill Bryson'],
              description: 'Hiking the Appalachian trail',
              genres: ['Travel', 'Nature'],
              themes: ['walking', 'trail'],
              language: 'en',
              difficultyScore: 5,
              publicDomain: false,
              source: 'seed',
              metadataQuality: 1.0,
              createdAt: new Date(),
              updatedAt: new Date(),
            },
            score: 0.94,
          },
        ],
        method: 'atlas_vector_search',
      });

      // Mock Gemma reasoning
      vi.spyOn(gemmaService, 'generateGroundedReasoning').mockResolvedValue({
        reasoning: {
          explanation: 'Bryson chronicles the challenge and humor of long-distance hiking.',
          touchGrassReason: 'Inspires walking through green woods and disconnecting completely.',
          suggestedAtmosphere: 'On a park trail bench surrounded by trees.',
        },
        status: 'gemma_grounded',
      });

      const response = await request(app).get('/api/v1/recommendations/public?q=walking');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.source).toBe('vector_search');
      expect(response.body.data.retrievalMethod).toBe('atlas_vector_search');
      expect(response.body.data.gemmaStatus).toBe('gemma_grounded');
      expect(response.body.data.recommendations[0].book.title).toBe('A Walk in the Woods');
      expect(response.body.data.recommendations[0].score).toBe(0.94);
      expect(response.body.data.recommendations[0].reasoning.touchGrassReason).toContain('Inspires walking');
    });
  });

  describe('POST /api/v1/recommendations', () => {
    it('should reject unauthenticated requests with 401 UNAUTHENTICATED', async () => {
      const response = await request(app)
        .post('/api/v1/recommendations')
        .send({ query: 'nature' });

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('UNAUTHENTICATED');
    });
  });
});
