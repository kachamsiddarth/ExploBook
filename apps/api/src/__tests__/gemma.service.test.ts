import { afterEach, describe, expect, it, vi } from 'vitest';
import { GemmaService } from '../services/gemma.service.js';
import type { BookDoc } from '../repositories/book.repository.js';

const book: BookDoc = {
  title: 'Walden',
  authors: ['Henry David Thoreau'],
  description: 'Life in the woods',
  genres: ['Nature', 'Philosophy'],
  themes: ['nature', 'solitude'],
  language: 'en',
  difficultyScore: 7,
  publicDomain: true,
  source: 'seed',
  metadataQuality: 1,
  createdAt: new Date('2024-01-01T00:00:00.000Z'),
  updatedAt: new Date('2024-01-01T00:00:00.000Z'),
};

function ollamaResponse(response: string): Response {
  return new Response(JSON.stringify({ response }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
}

describe('Gemma recommendation reasoning', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('marks malformed Ollama output as offline fallback, not Gemma-generated reasoning', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(ollamaResponse('This is not JSON')));
    const service = new GemmaService({ baseUrl: 'http://ollama.test', model: 'gemma3:4b-it-q4_K_M' });

    const result = await service.generateGroundedReasoning(book);

    expect(result.status).toBe('fallback_offline');
    expect(result.reasoning.explanation).toContain('[Dev / Offline Template]');
  });

  it('rejects parsed responses that do not contain required reasoning strings', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(ollamaResponse('{"explanation": 42}')));
    const service = new GemmaService({ baseUrl: 'http://ollama.test', model: 'gemma3:4b-it-q4_K_M' });

    const result = await service.generateGroundedReasoning(book);

    expect(result.status).toBe('fallback_offline');
    expect(result.reasoning.touchGrassReason).toContain('[Dev / Offline Template]');
  });

  it('accepts valid JSON reasoning as Gemma-grounded output', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        ollamaResponse(
          '{"explanation":"Good fit","touchGrassReason":"Go outside","suggestedAtmosphere":"A garden"}'
        )
      )
    );
    const service = new GemmaService({ baseUrl: 'http://ollama.test', model: 'gemma3:4b-it-q4_K_M' });

    const result = await service.generateGroundedReasoning(book);

    expect(result.status).toBe('gemma_grounded');
    expect(result.reasoning).toEqual({
      explanation: 'Good fit',
      touchGrassReason: 'Go outside',
      suggestedAtmosphere: 'A garden',
    });
  });
});
