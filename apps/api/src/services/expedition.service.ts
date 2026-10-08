import { config } from '../config/index.js';
import type { BookDoc } from '../repositories/book.repository.js';
import type {
  ReaderProfile,
  ExpeditionType,
  ExpeditionPlace,
} from '@explobook/shared';

export interface GeneratedExpeditionConcept {
  title: string;
  type: ExpeditionType;
  durationMinutes: number;
  objective: string;
  instructions: string[];
  bookConnection: string;
  suggestedPlaceCategory?: string;
}

export class ExpeditionService {
  private baseUrl: string;
  private model: string;
  private timeoutMs: number;

  constructor(options?: { baseUrl?: string; model?: string; timeoutMs?: number }) {
    this.baseUrl = options?.baseUrl || config.ollama?.baseUrl || 'http://127.0.0.1:11434';
    this.model = options?.model || config.ollama?.gemmaModel || 'gemma3:4b-it-q4_K_M';
    this.timeoutMs = options?.timeoutMs ?? (config.ollama?.timeoutMs || 30000);
  }

  /**
   * Prompts Gemma 3 4B to transform a book and reader profile into a real-world expedition challenge.
   */
  async generateExpeditionConcept(
    book: BookDoc,
    readerProfile?: any,
    options?: {
      availableMinutes?: number;
      preferredType?: ExpeditionType;
      nearbyPlace?: ExpeditionPlace;
    }
  ): Promise<GeneratedExpeditionConcept> {
    const prompt = this.buildPrompt(book, readerProfile, options);

    try {
      const response = await fetch(`${this.baseUrl}/api/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: AbortSignal.timeout(this.timeoutMs),
        body: JSON.stringify({
          model: this.model,
          prompt,
          stream: false,
          options: {
            temperature: 0.4,
            top_p: 0.9,
          },
        }),
      });

      if (!response.ok) {
        console.warn(`[ExpeditionService]: Ollama returned ${response.status}. Using deterministic fallback.`);
        return this.fallbackConcept(book, options);
      }

      const data = (await response.json()) as { response?: string };
      const rawText = data.response?.trim();

      if (!rawText) {
        return this.fallbackConcept(book, options);
      }

      const parsed = this.parseResponse(rawText, book, options);
      return parsed;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      console.warn(`[ExpeditionService]: Gemma generation failed (${msg}). Using deterministic fallback.`);
      return this.fallbackConcept(book, options);
    }
  }

  private buildPrompt(
    book: BookDoc,
    readerProfile?: Partial<ReaderProfile>,
    options?: {
      availableMinutes?: number;
      preferredType?: ExpeditionType;
      nearbyPlace?: ExpeditionPlace;
    }
  ): string {
    const genres = book.genres.join(', ');
    const themes = book.themes.join(', ');
    const availableMinutes = options?.availableMinutes || 25;

    return `You are the ExploBook Expedition Guide.
Your purpose is to transform a book into a safe, simple real-world exploration mission that encourages the reader to leave the screen, put the phone in their pocket, and step into the physical world.

Book Details:
- Title: "${book.title}"
- Authors: ${book.authors.join(', ')}
- Genres: ${genres}
- Themes: ${themes}
- Description: ${book.description}

Expedition Constraints:
- Available Time: ${availableMinutes} minutes
- Expedition Types allowed: WANDER, OBSERVATION, NATURE, DISCOVERY, HISTORICAL, LITERARY, MYSTERY
${options?.preferredType ? `- Preferred Type: ${options.preferredType}` : ''}
${options?.nearbyPlace ? `- Suggested Destination: ${options.nearbyPlace.name} (${options.nearbyPlace.category || 'destination'})` : ''}

Safety and "Touch Grass" Rules:
1. Must require putting the phone away / in pocket.
2. Minimal or zero screen interaction during the walk.
3. No dangerous stunts, trespassing, or hazardous terrain.
4. Focus on observing nature, architecture, stillness, streets, or bookish discovery.
5. Must directly connect to themes of "${book.title}".

Output Schema (VALID JSON ONLY):
{
  "title": "A short, evocative expedition title (3-6 words)",
  "type": "WANDER | OBSERVATION | NATURE | DISCOVERY | HISTORICAL | LITERARY | MYSTERY",
  "durationMinutes": ${availableMinutes},
  "objective": "A 1-2 sentence mission goal for the reader.",
  "instructions": [
    "Step 1: Put your phone in your pocket or Grass Mode.",
    "Step 2: Concrete action outside...",
    "Step 3: What to notice or observe...",
    "Step 4: Return when done."
  ],
  "bookConnection": "A concise explanation of how this real-world walk reflects the themes or atmosphere of ${book.title}."
}

Respond ONLY with valid JSON. No markdown ticks, no preamble.`;
  }

  private parseResponse(
    raw: string,
    book: BookDoc,
    options?: { availableMinutes?: number; preferredType?: ExpeditionType }
  ): GeneratedExpeditionConcept {
    try {
      const jsonStart = raw.indexOf('{');
      const jsonEnd = raw.lastIndexOf('}');
      if (jsonStart !== -1 && jsonEnd !== -1) {
        const jsonStr = raw.substring(jsonStart, jsonEnd + 1);
        const parsed = JSON.parse(jsonStr) as Record<string, any>;

        const validTypes: ExpeditionType[] = [
          'WANDER',
          'OBSERVATION',
          'NATURE',
          'DISCOVERY',
          'HISTORICAL',
          'LITERARY',
          'MYSTERY',
        ];

        const rawType = String(parsed.type).toUpperCase() as ExpeditionType;
        const type: ExpeditionType = validTypes.includes(rawType) ? rawType : (options?.preferredType || 'OBSERVATION');

        if (parsed.title && parsed.objective && Array.isArray(parsed.instructions)) {
          return {
            title: String(parsed.title).slice(0, 100),
            type,
            durationMinutes: Number(parsed.durationMinutes) || options?.availableMinutes || 25,
            objective: String(parsed.objective),
            instructions: parsed.instructions.map((i: any) => String(i)).slice(0, 6),
            bookConnection: String(parsed.bookConnection || `Connects to the themes of ${book.title}`),
          };
        }
      }
    } catch {
      // Fall through to fallback
    }
    return this.fallbackConcept(book, options);
  }

  private fallbackConcept(
    book: BookDoc,
    options?: { availableMinutes?: number; preferredType?: ExpeditionType }
  ): GeneratedExpeditionConcept {
    const minutes = options?.availableMinutes || 25;
    const type: ExpeditionType = options?.preferredType || 'OBSERVATION';

    return {
      title: `Path of ${book.title.slice(0, 30)}`,
      type,
      durationMinutes: minutes,
      objective: `Step into the open air and observe your surroundings through the thematic lens of "${book.title}".`,
      instructions: [
        'Place your phone into your pocket or enable Grass Mode.',
        `Walk for ${minutes} minutes along an unfamiliar path or quiet green space.`,
        'Notice three subtle textures or quiet details that you normally rush past.',
        'Commit what you discovered to memory and return to reflect.',
      ],
      bookConnection: `Inspired by "${book.title}", grounding its themes of ${book.themes.slice(0, 2).join(' and ') || 'curiosity'} in the physical world.`,
    };
  }
}

export const expeditionService = new ExpeditionService();
