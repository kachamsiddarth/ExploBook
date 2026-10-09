import { beforeEach, describe, expect, it, vi } from 'vitest';
import request from 'supertest';
import { ObjectId } from 'mongodb';
import { app } from '../app.js';
import { userRepository } from '../repositories/user.repository.js';
import { readerProfileRepository, type ReaderProfileDoc } from '../repositories/reader-profile.repository.js';
import { readingSessionRepository } from '../repositories/reading-session.repository.js';
import { expeditionRepository } from '../repositories/expedition.repository.js';
import { orbRepository } from '../repositories/orb.repository.js';
import { bookRepository } from '../repositories/book.repository.js';
import { embeddingService } from '../services/embedding.service.js';
import { gemmaService } from '../services/gemma.service.js';
import { explobookMastra } from '../services/mastra.js';

vi.mock('@clerk/express', () => ({
  clerkMiddleware: () => (_req: unknown, _res: unknown, next: () => void) => next(),
  getAuth: () => ({
    userId: 'clerk_test_reader',
    sessionClaims: { email: 'reader@example.test', first_name: 'Test Reader' },
  }),
}));

const testUserId = new ObjectId('651234567890123456789010');
const testBook = {
  _id: new ObjectId('651234567890123456789012'),
  title: 'Walden',
  authors: ['Henry David Thoreau'],
  description: 'Life in the woods',
  genres: ['Nature', 'Philosophy'],
  themes: ['nature', 'solitude'],
  language: 'en',
  difficultyScore: 7,
  publicDomain: true,
  source: 'seed' as const,
  metadataQuality: 1,
  createdAt: new Date('2024-01-01T00:00:00.000Z'),
  updatedAt: new Date('2024-01-01T00:00:00.000Z'),
};

function defaultProfile(): ReaderProfileDoc {
  const now = new Date('2024-01-01T00:00:00.000Z');
  return {
    _id: new ObjectId('651234567890123456789011'),
    userId: testUserId,
    genres: [],
    goals: ['read_more', 'touch_grass'],
    difficultyPreference: 'intermediate',
    preferredLength: { minPages: 100, maxPages: 400 },
    availableMinutesPerSession: 30,
    language: 'en',
    dna: {
      genreAffinity: {},
      themeAffinity: {},
      difficultyScore: 5,
      pacingPreference: 5,
      reflectionScore: 0,
      vocabularyLevel: 'intermediate',
      preferredPageRange: { min: 100, max: 400 },
      explorationProfile: {
        natureAffinity: 0.5,
        walkingAffinity: 0.5,
        discoveryAffinity: 0.5,
        historicalAffinity: 0.5,
        observationAffinity: 0.5,
        quietPlaceAffinity: 0.5,
      },
      updatedAt: now,
    },
    stats: {
      booksCompleted: 0,
      totalReadingSeconds: 0,
      totalOutdoorSeconds: 0,
      averageRating: 0,
      currentStreak: 0,
      longestStreak: 0,
      xp: 0,
      level: 1,
    },
    createdAt: now,
    updatedAt: now,
  };
}

describe('Reported authenticated endpoint regressions', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('initializes a missing reader profile and returns an empty dashboard for that user', async () => {
    const user = {
      _id: testUserId,
      clerkUserId: 'clerk_test_reader',
      email: 'reader@example.test',
      displayName: 'Test Reader',
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    const profile = defaultProfile();
    vi.spyOn(userRepository, 'findByClerkUserId').mockResolvedValue(user);
    vi.spyOn(readerProfileRepository, 'findByUserId')
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce(profile);
    const createDefault = vi.spyOn(readerProfileRepository, 'createDefault').mockResolvedValue(profile);
    const findActiveSession = vi.spyOn(readingSessionRepository, 'findActiveByUserId').mockResolvedValue(null);
    const findCurrentExpedition = vi.spyOn(expeditionRepository, 'findCurrentByUserId').mockResolvedValue(null);
    const findOrbs = vi.spyOn(orbRepository, 'findByUserId').mockResolvedValue([]);

    const response = await request(app).get('/api/v1/dashboard?userId=attacker-controlled-id');

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data.profile.genres).toEqual([]);
    expect(response.body.data.stats).toMatchObject({
      booksCompleted: 0,
      totalReadingSeconds: 0,
      totalOutdoorSeconds: 0,
      xp: 0,
      level: 1,
      grassRatio: 0,
    });
    expect(response.body.data.activeSession).toBeNull();
    expect(response.body.data.currentExpedition).toBeNull();
    expect(response.body.data.recentOrb).toBeNull();
    expect(response.body.data.orbCount).toBe(0);
    expect(createDefault).toHaveBeenCalledWith(testUserId);
    expect(findActiveSession).toHaveBeenCalledWith(testUserId);
    expect(findCurrentExpedition).toHaveBeenCalledWith(testUserId);
    expect(findOrbs).toHaveBeenCalledWith(testUserId);
  });

  it('returns catalogue-grounded recommendations through the registered Mastra workflow', async () => {
    const profile = defaultProfile();
    vi.spyOn(userRepository, 'findByClerkUserId').mockResolvedValue({
      _id: testUserId,
      clerkUserId: 'clerk_test_reader',
      email: 'reader@example.test',
      displayName: 'Test Reader',
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    vi.spyOn(readerProfileRepository, 'findByUserId').mockResolvedValue(profile);
    vi.spyOn(bookRepository, 'findMissingEmbeddings').mockResolvedValue([]);
    vi.spyOn(embeddingService, 'generateEmbedding').mockResolvedValue({
      embedding: new Array(768).fill(0.05),
      model: 'nomic-embed-text',
    });
    vi.spyOn(bookRepository, 'vectorSearch').mockResolvedValue({
      results: [{ book: testBook, score: 0.91 }],
      method: 'atlas_vector_search',
    });
    vi.spyOn(gemmaService, 'generateGroundedReasoning').mockResolvedValue({
      reasoning: {
        explanation: 'The book invites reflection on simple living.',
        touchGrassReason: 'Its nature writing inspires time outdoors.',
        suggestedAtmosphere: 'A quiet place beside a pond.',
      },
      status: 'gemma_grounded',
    });
    const getWorkflow = vi.spyOn(explobookMastra, 'getWorkflow');

    const response = await request(app).post('/api/v1/recommendations').send({ query: 'nature' });

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data.recommendations[0]).toMatchObject({
      book: { id: testBook._id.toString(), title: 'Walden' },
      score: 0.91,
      reasoning: { touchGrassReason: 'Its nature writing inspires time outdoors.' },
    });
    expect(response.body.data.retrievalMethod).toBe('atlas_vector_search');
    expect(response.body.data.gemmaStatus).toBe('gemma_grounded');
    expect(getWorkflow).toHaveBeenCalledWith('bookRecommendationWorkflow');
  });
});
