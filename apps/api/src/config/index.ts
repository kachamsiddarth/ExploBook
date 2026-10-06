import dotenv from 'dotenv';

// Load environment variables from process environment or .env file
dotenv.config();

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
  };
  elevenlabs?: {
    apiKey?: string;
    recommendationVoiceId?: string;
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
    gemmaModel: process.env.GEMMA_MODEL || 'gemma3:1b-it-q4_K_M',
    embeddingModel: process.env.EMBEDDING_MODEL || 'nomic-embed-text',
  },
  elevenlabs: {
    apiKey: process.env.ELEVENLABS_API_KEY,
    recommendationVoiceId: process.env.ELEVENLABS_RECOMMENDATION_VOICE_ID,
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
