import { config } from '../../config/index.js';
import { voiceCacheService } from './voice-cache.service.js';
import type { Expedition } from '@explobook/shared';

export interface VoiceBriefingResult {
  /** Base64-encoded MP3 audio */
  audioBase64: string;
  contentType: 'audio/mpeg';
  script: string;
  cacheKey: string;
  cacheHit: boolean;
}

/**
 * ElevenLabs voice briefing service.
 *
 * SECURITY: This service is strictly server-side.
 * The ELEVENLABS_API_KEY must NEVER be sent to the browser.
 * All requests flow: Next.js → Express → ElevenLabs.
 *
 * CACHING: Audio is cached by SHA-256(voiceId + modelId + script)
 * in the `voiceGenerations` MongoDB collection to avoid redundant API calls.
 */
export class ElevenLabsService {
  private apiKey: string | undefined;
  private expeditionVoiceId: string;
  private modelId: string;

  constructor(options?: { apiKey?: string | null; expeditionVoiceId?: string; modelId?: string }) {
    this.apiKey = options?.apiKey === undefined ? config.elevenlabs?.apiKey : (options.apiKey || undefined);
    this.expeditionVoiceId =
      options?.expeditionVoiceId || config.elevenlabs?.expeditionVoiceId || 'pNInz6obpgDQGcFmaJgB'; // Default: "Adam" voice
    this.modelId = options?.modelId || config.elevenlabs?.modelId || 'eleven_multilingual_v2';
  }

  /**
   * Generates an expedition voice briefing for the given expedition.
   * Uses SHA-256 cache: returns cached audio if the identical script was already synthesized.
   *
   * The audio is intended to be played once as a "pre-departure briefing",
   * after which the user puts their phone away and steps outside.
   */
  async generateExpeditionBriefing(expedition: Expedition): Promise<VoiceBriefingResult> {
    const script = this.buildExpeditionScript(expedition);
    const cacheKey = voiceCacheService.generateCacheKey(
      this.expeditionVoiceId,
      this.modelId,
      script
    );

    // Cache lookup
    const cached = await voiceCacheService.lookup(cacheKey);
    if (cached) {
      return {
        audioBase64: cached.audioBase64,
        contentType: 'audio/mpeg',
        script,
        cacheKey,
        cacheHit: true,
      };
    }

    // Cache miss — synthesize with ElevenLabs
    if (!this.apiKey) {
      throw new Error(
        '[ElevenLabsService]: ELEVENLABS_API_KEY is not configured. Cannot generate voice briefing.'
      );
    }

    const audioBase64 = await this.synthesize(script);

    // Store in cache
    await voiceCacheService.store({
      voiceId: this.expeditionVoiceId,
      modelId: this.modelId,
      script,
      audioBase64,
    });

    return {
      audioBase64,
      contentType: 'audio/mpeg',
      script,
      cacheKey,
      cacheHit: false,
    };
  }

  /**
   * Calls the ElevenLabs TTS REST API and returns base64-encoded MP3.
   * Uses @elevenlabs/elevenlabs-js SDK under the hood via direct REST
   * to avoid SDK module resolution complexity in the monorepo.
   */
  private async synthesize(script: string): Promise<string> {
    const response = await fetch(
      `https://api.elevenlabs.io/v1/text-to-speech/${this.expeditionVoiceId}`,
      {
        method: 'POST',
        headers: {
          Accept: 'audio/mpeg',
          'Content-Type': 'application/json',
          'xi-api-key': this.apiKey!,
        },
        signal: AbortSignal.timeout(30000),
        body: JSON.stringify({
          text: script,
          model_id: this.modelId,
          voice_settings: {
            stability: 0.65,
            similarity_boost: 0.75,
            style: 0.4,
            use_speaker_boost: true,
          },
        }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text().catch(() => 'unknown error');
      throw new Error(
        `[ElevenLabsService]: API returned HTTP ${response.status}: ${errorText}`
      );
    }

    const audioBuffer = await response.arrayBuffer();
    return Buffer.from(audioBuffer).toString('base64');
  }

  /**
   * Constructs the expedition voice briefing script.
   * Gemma generates expedition concepts; this service formats them into audio narration.
   *
   * The script is intentionally brief and cinematic — designed to be heard once,
   * then the phone goes into the pocket.
   */
  private buildExpeditionScript(expedition: Expedition): string {
    const instructionLines = expedition.instructions
      .slice(0, 4)
      .map((line, i) => {
        const cleaned = line.replace(/^Step \d+:\s*/i, '').trim();
        return i === 0 ? cleaned : cleaned;
      })
      .join(' ');

    const durationText =
      expedition.durationMinutes < 60
        ? `${expedition.durationMinutes} minutes`
        : `${Math.round(expedition.durationMinutes / 60)} hour`;

    return `Your expedition begins now.

${expedition.title}.

${expedition.objective}

${instructionLines}

You have ${durationText}. Keep your phone in your pocket.

${expedition.bookConnection}

I'll be here when you return. Now step outside.`.trim();
  }
}

export const elevenLabsService = new ElevenLabsService();
