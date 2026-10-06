# 24 — Environment Template

Copy the keys into the project's actual `.env.example`; never commit real values.

```env
NODE_ENV=development
PORT=4000
WEB_ORIGIN=http://localhost:3000

NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=
CLERK_SECRET_KEY=

MONGODB_URI=
MONGODB_DB_NAME=explobook

OLLAMA_BASE_URL=http://127.0.0.1:11434
GEMMA_MODEL=gemma3:1b-it-q4_K_M
EMBEDDING_MODEL=nomic-embed-text

ELEVENLABS_API_KEY=
ELEVENLABS_RECOMMENDATION_VOICE_ID=
ELEVENLABS_ORB_VOICE_ID=
ELEVENLABS_MODEL_ID=

SERPAPI_KEY=
SENTRY_DSN=
SENTRY_ENVIRONMENT=development
```
