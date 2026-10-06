# 17 — Environment and Runbook

## Development prerequisites

- Node.js 22+.
- npm/pnpm according to repository lockfile.
- MongoDB Atlas account/cluster.
- Ollama.
- Gemma 3 1B model initially.
- ElevenLabs account/key for voice.
- Optional SerpApi key.
- Sentry project.

## Environment variables

```env
NODE_ENV=development
PORT=4000
WEB_ORIGIN=http://localhost:3000

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

## Local startup order

1. Start Ollama.
2. Verify Gemma model exists.
3. Verify embedding model exists.
4. Start MongoDB/Atlas connectivity.
5. Start backend.
6. Start Mastra Studio if enabled.
7. Start Next.js.

## Smoke checks

```text
GET /health
GET /api/v1/auth/me
book search
Gemma smoke
embedding smoke
vector search smoke
recommendation smoke
reading-session smoke
ElevenLabs smoke
```

## Deployment

Frontend:
- Vercel.

Backend:
- Render.

Database:
- MongoDB Atlas.

Before production:
- production Gemma provider/runtime confirmed.
- all secrets configured.
- CORS restricted.
- Sentry configured.
- health endpoint accessible.
- database indexes deployed.
