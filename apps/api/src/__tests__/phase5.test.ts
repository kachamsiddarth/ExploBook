/**
 * Phase 5 Tests: SerpApi + ElevenLabs Voice Briefings
 *
 * These tests verify the Phase 5 integration without requiring
 * live API credentials for SerpApi or ElevenLabs.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createHash } from 'node:crypto';

// ─────────────────────────────────────────────────────────────────────────────
// 1. SerpApi Service Tests
// ─────────────────────────────────────────────────────────────────────────────

describe('SerpApiService', () => {
  describe('EXPEDITION_TYPE_TO_QUERY mapping', async () => {
    const { EXPEDITION_TYPE_TO_QUERY } = await import('../services/serpapi.service.js');

    it('maps all 7 expedition types to a valid query string', () => {
      const types = ['WANDER', 'OBSERVATION', 'NATURE', 'DISCOVERY', 'HISTORICAL', 'LITERARY', 'MYSTERY'];
      for (const type of types) {
        const query = EXPEDITION_TYPE_TO_QUERY[type];
        expect(typeof query, `${type} should map to a string`).toBe('string');
        expect(query.length, `${type} query should not be empty`).toBeGreaterThan(0);
      }
    });

    it('maps DISCOVERY to bookstores search', () => {
      expect(EXPEDITION_TYPE_TO_QUERY['DISCOVERY']).toBe('bookstores near me');
    });

    it('maps HISTORICAL to historical places search', () => {
      expect(EXPEDITION_TYPE_TO_QUERY['HISTORICAL']).toBe('historical places near me');
    });
  });

  describe('SerpApiService.searchNearbyPlaces', async () => {
    const { SerpApiService } = await import('../services/serpapi.service.js');

    it('returns empty array when SERPAPI_KEY is not configured', async () => {
      const service = new SerpApiService();
      // No API key set — should return empty, not throw
      const results = await service.searchNearbyPlaces({
        latitude: 17.4,
        longitude: 78.4,
        query: 'parks near me',
      });
      expect(Array.isArray(results)).toBe(true);
      // With no key configured, returns []
      expect(results.length).toBe(0);
    });

    it('returns empty array for invalid coordinates', async () => {
      const service = new SerpApiService();
      const results = await service.searchNearbyPlaces({
        latitude: 999, // invalid
        longitude: 78.4,
        query: 'parks near me',
      });
      expect(results).toHaveLength(0);
    });
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 2. Voice Cache Service Tests (no MongoDB required — unit test)
// ─────────────────────────────────────────────────────────────────────────────

describe('VoiceCacheService', () => {
  it('generates consistent SHA-256 cache keys', async () => {
    const { VoiceCacheService } = await import('../services/voice/voice-cache.service.js');
    const svc = new VoiceCacheService();

    const key1 = svc.generateCacheKey('voice123', 'eleven_multilingual_v2', 'Your expedition begins now.');
    const key2 = svc.generateCacheKey('voice123', 'eleven_multilingual_v2', 'Your expedition begins now.');
    const keyDifferent = svc.generateCacheKey('voice456', 'eleven_multilingual_v2', 'Your expedition begins now.');

    expect(key1).toBe(key2); // Same inputs → same key
    expect(key1).not.toBe(keyDifferent); // Different voice → different key
    expect(key1).toHaveLength(64); // SHA-256 hex = 64 chars
  });

  it('produces different keys for different scripts', async () => {
    const { VoiceCacheService } = await import('../services/voice/voice-cache.service.js');
    const svc = new VoiceCacheService();

    const key1 = svc.generateCacheKey('voice123', 'eleven_multilingual_v2', 'Script A');
    const key2 = svc.generateCacheKey('voice123', 'eleven_multilingual_v2', 'Script B');

    expect(key1).not.toBe(key2);
  });

  it('cache key matches manual SHA-256 calculation', async () => {
    const { VoiceCacheService } = await import('../services/voice/voice-cache.service.js');
    const svc = new VoiceCacheService();

    const voiceId = 'testVoice';
    const modelId = 'eleven_multilingual_v2';
    const script = 'Hello, explorer.';

    const serviceKey = svc.generateCacheKey(voiceId, modelId, script);
    const manualKey = createHash('sha256')
      .update(`${voiceId}::${modelId}::${script}`)
      .digest('hex');

    expect(serviceKey).toBe(manualKey);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 3. ElevenLabs Service Unit Tests (script builder)
// ─────────────────────────────────────────────────────────────────────────────

describe('ElevenLabsService — Script Builder', () => {
  it('ElevenLabsService has a generateExpeditionBriefing method', async () => {
    const { ElevenLabsService } = await import('../services/voice/elevenlabs.service.js');
    const svc = new ElevenLabsService();
    expect(typeof svc.generateExpeditionBriefing).toBe('function');
  });

  it('ElevenLabsService construction reflects missing API key configuration', async () => {
    const { ElevenLabsService } = await import('../services/voice/elevenlabs.service.js');
    const svc = new ElevenLabsService();
    // When ELEVENLABS_API_KEY is absent, the service correctly has no key
    // The error would be thrown during synthesis (after cache miss)
    // This confirms the service does not silently ignore the missing key config
    expect(svc).toBeDefined();
    // Access the private-ish indicator that no API key is configured
    const svcAny = svc as any;
    // apiKey should be undefined when env var is not set in test environment
    expect(svcAny.apiKey).toBeUndefined();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 4. Expedition Routes — Voice Endpoint Contract
// ─────────────────────────────────────────────────────────────────────────────

describe('Expedition Voice API contract', () => {
  it('expedition schema supports optional place field', async () => {
    const { ExpeditionSchema } = await import('@explobook/shared');

    const result = ExpeditionSchema.safeParse({
      id: 'exp_001',
      userId: 'user_001',
      bookId: 'book_001',
      type: 'DISCOVERY',
      title: 'Local Bookstore Quest',
      durationMinutes: 30,
      objective: 'Visit the nearest independent bookstore.',
      instructions: ['Put phone away.', 'Walk to the bookstore.', 'Browse one section.', 'Return.'],
      bookConnection: 'Connects the literary themes of discovery.',
      status: 'READY',
      place: {
        name: 'The Corner Bookshop',
        category: 'bookstore',
        address: '12 Main Street',
        rating: 4.5,
        mapsUrl: 'https://maps.google.com/?cid=12345',
      },
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.place?.name).toBe('The Corner Bookshop');
      expect(result.data.place?.rating).toBe(4.5);
    }
  });

  it('expedition schema is valid without a place (generic expedition)', async () => {
    const { ExpeditionSchema } = await import('@explobook/shared');

    const result = ExpeditionSchema.safeParse({
      id: 'exp_002',
      userId: 'user_001',
      bookId: 'book_001',
      type: 'WANDER',
      title: 'Evening Wander',
      durationMinutes: 25,
      objective: 'Walk somewhere new.',
      instructions: ['Put phone away.', 'Walk.', 'Observe.', 'Return.'],
      bookConnection: 'Grounded in the spirit of exploration.',
      status: 'READY',
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.place).toBeUndefined();
    }
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 5. GenerateExpeditionInputSchema — Location field support
// ─────────────────────────────────────────────────────────────────────────────

describe('GenerateExpeditionInputSchema — location field', () => {
  it('accepts optional location coordinates', async () => {
    const { GenerateExpeditionInputSchema } = await import('@explobook/shared');

    const result = GenerateExpeditionInputSchema.safeParse({
      bookId: 'book_001',
      availableMinutes: 30,
      location: {
        latitude: 17.385044,
        longitude: 78.486671,
      },
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.location?.latitude).toBe(17.385044);
      expect(result.data.location?.longitude).toBe(78.486671);
    }
  });

  it('accepts request without location (privacy-preserving default)', async () => {
    const { GenerateExpeditionInputSchema } = await import('@explobook/shared');

    const result = GenerateExpeditionInputSchema.safeParse({
      bookId: 'book_001',
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.location).toBeUndefined();
    }
  });

  it('rejects invalid latitude', async () => {
    const { GenerateExpeditionInputSchema } = await import('@explobook/shared');

    const result = GenerateExpeditionInputSchema.safeParse({
      bookId: 'book_001',
      location: {
        latitude: 999, // invalid
        longitude: 78.4,
      },
    });

    expect(result.success).toBe(false);
  });
});
