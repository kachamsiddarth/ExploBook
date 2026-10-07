import { config } from '../config/index.js';
import type { BookDoc } from '../repositories/book.repository.js';
import type { ReaderProfile } from '@explobook/shared';

export interface RecommendationReasoning {
  explanation: string;
  touchGrassReason: string;
  suggestedAtmosphere: string;
}

export interface GroundedReasoningResult {
  reasoning: RecommendationReasoning;
  status: 'gemma_grounded' | 'fallback_offline';
}

export class GemmaService {
  private baseUrl: string;
  private model: string;

  constructor() {
    this.baseUrl = config.ollama?.baseUrl || 'http://127.0.0.1:11434';
    this.model = config.ollama?.gemmaModel || 'gemma3:4b-it-q4_K_M';
  }

  /**
   * Grounds a book recommendation for a reader by invoking Gemma 3 4B.
   * Generates rationale emphasizing outdoor connection and the "Touch Grass" philosophy.
   */
  async generateGroundedReasoning(
    book: BookDoc,
    readerProfile?: Partial<ReaderProfile>,
    userQuery?: string
  ): Promise<GroundedReasoningResult> {
    const prompt = this.buildPrompt(book, readerProfile, userQuery);

    try {
      const response = await fetch(`${this.baseUrl}/api/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: AbortSignal.timeout(3000),
        body: JSON.stringify({
          model: this.model,
          prompt,
          stream: false,
          options: {
            temperature: 0.3,
            top_p: 0.9,
          },
        }),
      });

      if (!response.ok) {
        console.warn(`[GemmaService]: Ollama returned HTTP ${response.status}. Using dev fallback.`);
        return {
          reasoning: this.fallbackReasoning(book),
          status: 'fallback_offline',
        };
      }

      const data = (await response.json()) as { response?: string };
      const rawText = data.response?.trim();

      if (!rawText) {
        return {
          reasoning: this.fallbackReasoning(book),
          status: 'fallback_offline',
        };
      }

      const parsed = this.parseResponse(rawText, book);
      return {
        reasoning: parsed,
        status: 'gemma_grounded',
      };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      console.warn(`[GemmaService]: Inference failed (${msg}). Using dev fallback.`);
      return {
        reasoning: this.fallbackReasoning(book),
        status: 'fallback_offline',
      };
    }
  }

  private buildPrompt(
    book: BookDoc,
    readerProfile?: Partial<ReaderProfile>,
    userQuery?: string
  ): string {
    const genres = book.genres.join(', ');
    const themes = book.themes.join(', ');

    return `You are ExploBook's reading and expedition guide.
ExploBook's philosophy is "Touch Grass": screens are the shortest part of the experience. Books ignite curiosity, then the reader puts their device down and steps outside.

Book Details:
- Title: "${book.title}"
- Authors: ${book.authors.join(', ')}
- Genres: ${genres}
- Themes: ${themes}
- Description: ${book.description}

Reader Context:
${userQuery ? `- Reader Query: "${userQuery}"` : ''}
${readerProfile?.genres ? `- Reader Favorite Genres: ${readerProfile.genres.join(', ')}` : ''}
${readerProfile?.goals ? `- Reader Goals: ${readerProfile.goals.join(', ')}` : ''}

Task:
Generate a grounded, concise recommendation reasoning.
Output valid JSON ONLY in exactly this schema:
{
  "explanation": "Why this book fits the reader, referencing themes from the book.",
  "touchGrassReason": "Why this book provides a compelling reason to put down the screen and step outside into the real world.",
  "suggestedAtmosphere": "The ideal outdoor physical environment to read or reflect on this book (e.g. park bench, forest trail, quiet library garden)."
}

Respond ONLY with the JSON object. Do not wrap in markdown or commentary.`;
  }

  private parseResponse(raw: string, book: BookDoc): RecommendationReasoning {
    try {
      const jsonStart = raw.indexOf('{');
      const jsonEnd = raw.lastIndexOf('}');
      if (jsonStart !== -1 && jsonEnd !== -1) {
        const jsonStr = raw.substring(jsonStart, jsonEnd + 1);
        const parsed = JSON.parse(jsonStr) as Record<string, string>;
        if (parsed.explanation && parsed.touchGrassReason) {
          return {
            explanation: parsed.explanation,
            touchGrassReason: parsed.touchGrassReason,
            suggestedAtmosphere: parsed.suggestedAtmosphere || 'A quiet natural bench or outdoor shaded park.',
          };
        }
      }
    } catch {
      // JSON parse error, fall through to fallback
    }
    return this.fallbackReasoning(book);
  }

  private fallbackReasoning(book: BookDoc): RecommendationReasoning {
    return {
      explanation: `[Dev / Offline Template]: "${book.title}" explores ${book.genres.slice(0, 2).join(' and ')}, offering perspective away from digital noise.`,
      touchGrassReason: `[Dev / Offline Template]: Themes of ${book.themes.slice(0, 2).join(' and ') || 'observation'} encourage setting screens aside.`,
      suggestedAtmosphere: 'Under the canopy of an old tree or during an open-air morning walk.',
    };
  }
}

export const gemmaService = new GemmaService();
