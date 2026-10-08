import dotenv from 'dotenv';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

// Load environment variables from process environment, root .env, or local .env
const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '../../../../.env') });
dotenv.config(); // Fallback to current working directory .env if present

export interface ApiConfig {
  env: 'development' | 'production' | 'test';
  port: number;
  webOrigin: string;

  // Configuration placeholders for future phases (non-blocking in Phase 1)
  clerk?: {
    publishableKey?: string;
    secretKey?: string;
  };
  mongodb?: {
    uri?: string;
    dbName?: string;
  };
  ollama?: {
    baseUrl?: string;
    gemmaModel?: string;
    embeddingModel?: string;
    timeoutMs?: number;
  };
  elevenlabs?: {
    apiKey?: string;
    recommendationVoiceId?: string;
    expeditionVoiceId?: string;
    orbVoiceId?: string;
    modelId?: string;
  };
  serpapi?: {
    apiKey?: string;
  };
  sentry?: {
    dsn?: string;
    environment?: string;
  };
}

export const config: ApiConfig = {
  env: (process.env.NODE_ENV as ApiConfig['env']) || 'development',
  port: parseInt(process.env.PORT || '4000', 10),
  webOrigin: process.env.WEB_ORIGIN || 'http://localhost:3000',

  clerk: {
    publishableKey: process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY,
    secretKey: process.env.CLERK_SECRET_KEY,
  },
  mongodb: {
    uri: process.env.MONGODB_URI,
    dbName: process.env.MONGODB_DB_NAME || 'explobook',
  },
  ollama: {
    baseUrl: process.env.OLLAMA_BASE_URL || 'http://127.0.0.1:11434',
    gemmaModel: process.env.GEMMA_MODEL || 'gemma3:4b-it-q4_K_M',
    embeddingModel: process.env.EMBEDDING_MODEL || 'nomic-embed-text',
    timeoutMs: parseInt(process.env.GEMMA_TIMEOUT_MS || process.env.OLLAMA_TIMEOUT_MS || '30000', 10),
  },
  elevenlabs: {
    apiKey: process.env.ELEVENLABS_API_KEY,
    recommendationVoiceId: process.env.ELEVENLABS_RECOMMENDATION_VOICE_ID,
    expeditionVoiceId: process.env.ELEVENLABS_EXPEDITION_VOICE_ID,
    orbVoiceId: process.env.ELEVENLABS_ORB_VOICE_ID,
    modelId: process.env.ELEVENLABS_MODEL_ID || 'eleven_multilingual_v2',
  },
  serpapi: {
    apiKey: process.env.SERPAPI_KEY,
  },
  sentry: {
    dsn: process.env.SENTRY_DSN,
    environment: process.env.SENTRY_ENVIRONMENT || 'development',
  },
};
