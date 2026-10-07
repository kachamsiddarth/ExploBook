import { config } from '../config/index.js';

export interface EmbeddingResult {
  embedding: number[];
  model: string;
}

export class EmbeddingService {
  private baseUrl: string;
  private model: string;

  constructor() {
    this.baseUrl = config.ollama?.baseUrl || 'http://127.0.0.1:11434';
    this.model = config.ollama?.embeddingModel || 'nomic-embed-text';
  }

  /**
   * Generates a 768-dimensional vector embedding for the input text using local Ollama.
   * If Ollama is unavailable or returns an error, returns null gracefully without crashing.
   */
  async generateEmbedding(text: string): Promise<EmbeddingResult | null> {
    if (!text || text.trim().length === 0) {
      return null;
    }

    try {
      const response = await fetch(`${this.baseUrl}/api/embeddings`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: this.model,
          prompt: text.trim(),
        }),
      });

      if (!response.ok) {
        console.warn(`[EmbeddingService]: Ollama embeddings returned HTTP ${response.status}`);
        return null;
      }

      const data = (await response.json()) as { embedding?: number[] };
      if (!data.embedding || !Array.isArray(data.embedding)) {
        console.warn('[EmbeddingService]: Ollama response missing embedding array');
        return null;
      }

      return {
        embedding: data.embedding,
        model: this.model,
      };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      console.warn(`[EmbeddingService]: Embedding generation failed (${msg}).`);
      return null;
    }
  }

  /**
   * Builds rich descriptive text for a book suitable for embedding search.
   */
  buildBookEmbeddingText(book: {
    title: string;
    subtitle?: string;
    authors: string[];
    description: string;
    genres: string[];
    themes?: string[];
  }): string {
    const parts = [
      `Title: ${book.title}`,
      book.subtitle ? `Subtitle: ${book.subtitle}` : '',
      `Authors: ${book.authors.join(', ')}`,
      `Genres: ${book.genres.join(', ')}`,
      book.themes && book.themes.length > 0 ? `Themes: ${book.themes.join(', ')}` : '',
      `Description: ${book.description}`,
    ];
    return parts.filter(Boolean).join('\n');
  }

  /**
   * Builds search text from reader profile DNA and preferences.
   */
  buildReaderPreferenceText(profile: {
    genres?: string[];
    goals?: string[];
    dna?: {
      genreAffinity?: Record<string, number>;
      themeAffinity?: Record<string, number>;
      explorationProfile?: {
        natureAffinity: number;
        walkingAffinity: number;
        discoveryAffinity: number;
        historicalAffinity: number;
        observationAffinity: number;
        quietPlaceAffinity: number;
      };
    };
  }): string {
    const parts: string[] = [];

    if (profile.genres && profile.genres.length > 0) {
      parts.push(`Preferred genres: ${profile.genres.join(', ')}`);
    }

    if (profile.goals && profile.goals.length > 0) {
      parts.push(`Reading goals: ${profile.goals.join(', ')}`);
    }

    if (profile.dna?.explorationProfile) {
      const exp = profile.dna.explorationProfile;
      const affinities: string[] = [];
      if (exp.natureAffinity > 0.5) affinities.push('nature and outdoors');
      if (exp.walkingAffinity > 0.5) affinities.push('walking and trails');
      if (exp.discoveryAffinity > 0.5) affinities.push('discovery and exploration');
      if (exp.historicalAffinity > 0.5) affinities.push('history and heritage');
      if (exp.observationAffinity > 0.5) affinities.push('close observation and contemplation');
      if (exp.quietPlaceAffinity > 0.5) affinities.push('quiet sanctuaries and solitude');

      if (affinities.length > 0) {
        parts.push(`Exploration affinities: ${affinities.join(', ')}`);
      }
    }

    return parts.join('\n');
  }
}

export const embeddingService = new EmbeddingService();
