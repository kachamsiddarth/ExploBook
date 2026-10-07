import { config } from '../config/index.js';
import type { BookDoc } from '../repositories/book.repository.js';
import type {
  ExpeditionDoc,
} from '../repositories/expedition.repository.js';
import type {
  ExpeditionReflection,
  ExpeditionReflectionAnalysis,
} from '@explobook/shared';

export class ReflectionService {
  private baseUrl: string;
  private model: string;

  constructor() {
    this.baseUrl = config.ollama?.baseUrl || 'http://127.0.0.1:11434';
    this.model = config.ollama?.gemmaModel || 'gemma3:4b-it-q4_K_M';
  }

  /**
   * Prompts Gemma 3 4B to analyze a completed real-world expedition reflection.
   * Extracts curiosity signals, thematic resonance with the book, and recommended Reader DNA shifts.
   */
  async analyzeExpeditionReflection(
    expedition: ExpeditionDoc,
    book: BookDoc,
    reflection: ExpeditionReflection
  ): Promise<ExpeditionReflectionAnalysis> {
    const prompt = this.buildPrompt(expedition, book, reflection);

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
        console.warn(`[ReflectionService]: Ollama returned ${response.status}. Using deterministic analysis.`);
        return this.fallbackAnalysis(expedition, book, reflection);
      }

      const data = (await response.json()) as { response?: string };
      const rawText = data.response?.trim();

      if (!rawText) {
        return this.fallbackAnalysis(expedition, book, reflection);
      }

      const parsed = this.parseResponse(rawText, expedition, book, reflection);
      return parsed;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      console.warn(`[ReflectionService]: Analysis failed (${msg}). Using deterministic fallback.`);
      return this.fallbackAnalysis(expedition, book, reflection);
    }
  }

  private buildPrompt(
    expedition: ExpeditionDoc,
    book: BookDoc,
    reflection: ExpeditionReflection
  ): string {
    return `You are ExploBook's Reader Reflection Analyst.
Your task is to analyze what a reader discovered during their offline real-world expedition.

Expedition Context:
- Title: "${expedition.title}"
- Type: ${expedition.type}
- Book: "${book.title}" (Themes: ${book.themes.join(', ')})

Reader Discovery & Reflection:
- Reader Notes: "${reflection.notes}"
${reflection.observedDetails ? `- Observed Details: ${reflection.observedDetails.join('; ')}` : ''}
${reflection.surprises ? `- Surprises: ${reflection.surprises}` : ''}

Task:
Analyze the reflection. Identify:
1. Thematic resonance between what the reader experienced outside and the book "${book.title}".
2. Curiosity signals detected from their observation.
3. Key real-world observations made.
4. Suggested Reader DNA affinity deltas (-0.1 to +0.1) across natureAffinity, walkingAffinity, discoveryAffinity, historicalAffinity, observationAffinity, quietPlaceAffinity.
5. An evocative 2-3 word Orb title idea representing this crystallized achievement.
6. A primary theme for the orb.

Output JSON ONLY in this format:
{
  "thematicResonance": "Concise summary of how the walk mirrored the book.",
  "curiositySignals": ["Signal 1", "Signal 2"],
  "keyObservations": ["Observation 1", "Observation 2"],
  "suggestedDnaDelta": {
    "observationAffinity": 0.05,
    "natureAffinity": 0.05
  },
  "orbTitleIdea": "Seed of Stillness",
  "orbThemeIdea": "Observation"
}

Respond ONLY with valid JSON. No markdown or explanation.`;
  }

  private parseResponse(
    raw: string,
    expedition: ExpeditionDoc,
    book: BookDoc,
    reflection: ExpeditionReflection
  ): ExpeditionReflectionAnalysis {
    try {
      const jsonStart = raw.indexOf('{');
      const jsonEnd = raw.lastIndexOf('}');
      if (jsonStart !== -1 && jsonEnd !== -1) {
        const jsonStr = raw.substring(jsonStart, jsonEnd + 1);
        const parsed = JSON.parse(jsonStr) as Record<string, any>;

        if (parsed.thematicResonance) {
          return {
            thematicResonance: String(parsed.thematicResonance),
            curiositySignals: Array.isArray(parsed.curiositySignals)
              ? parsed.curiositySignals.map((s: any) => String(s)).slice(0, 5)
              : ['Attentive exploration'],
            keyObservations: Array.isArray(parsed.keyObservations)
              ? parsed.keyObservations.map((o: any) => String(o)).slice(0, 5)
              : reflection.observedDetails || [reflection.notes.slice(0, 50)],
            suggestedDnaDelta: parsed.suggestedDnaDelta && typeof parsed.suggestedDnaDelta === 'object'
              ? this.sanitizeDelta(parsed.suggestedDnaDelta)
              : this.defaultDeltaForType(expedition.type),
            orbTitleIdea: parsed.orbTitleIdea ? String(parsed.orbTitleIdea) : undefined,
            orbThemeIdea: parsed.orbThemeIdea ? String(parsed.orbThemeIdea) : undefined,
          };
        }
      }
    } catch {
      // Fall through to fallback
    }
    return this.fallbackAnalysis(expedition, book, reflection);
  }

  private sanitizeDelta(rawDelta: Record<string, any>): Record<string, number> {
    const sanitized: Record<string, number> = {};
    const validKeys = [
      'natureAffinity',
      'walkingAffinity',
      'discoveryAffinity',
      'historicalAffinity',
      'observationAffinity',
      'quietPlaceAffinity',
    ];

    for (const key of validKeys) {
      if (typeof rawDelta[key] === 'number') {
        sanitized[key] = Math.max(-0.15, Math.min(0.15, Number(rawDelta[key].toFixed(2))));
      }
    }
    return sanitized;
  }

  private defaultDeltaForType(type: ExpeditionDoc['type']): Record<string, number> {
    switch (type) {
      case 'NATURE':
        return { natureAffinity: 0.05, quietPlaceAffinity: 0.03 };
      case 'WANDER':
        return { walkingAffinity: 0.05, discoveryAffinity: 0.03 };
      case 'OBSERVATION':
        return { observationAffinity: 0.05, quietPlaceAffinity: 0.03 };
      case 'DISCOVERY':
        return { discoveryAffinity: 0.05, walkingAffinity: 0.03 };
      case 'HISTORICAL':
        return { historicalAffinity: 0.05, observationAffinity: 0.03 };
      default:
        return { observationAffinity: 0.04, walkingAffinity: 0.04 };
    }
  }

  private fallbackAnalysis(
    expedition: ExpeditionDoc,
    book: BookDoc,
    reflection: ExpeditionReflection
  ): ExpeditionReflectionAnalysis {
    return {
      thematicResonance: `The user stepped away from the screen, experiencing the grounded atmosphere of "${book.title}" in their physical environment.`,
      curiositySignals: ['Deliberate screen detachment', 'Focused environmental awareness'],
      keyObservations: reflection.observedDetails || [reflection.notes.slice(0, 60)],
      suggestedDnaDelta: this.defaultDeltaForType(expedition.type),
      orbTitleIdea: `Orb of ${expedition.type.toLowerCase()}`,
      orbThemeIdea: book.themes[0] || 'Discovery',
    };
  }
}

export const reflectionService = new ReflectionService();
