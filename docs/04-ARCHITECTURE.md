# 04 — System Architecture

## 1. High-level

```text
                         Browser
                            │
                      Next.js / React
                            │
                       HTTPS / JSON
                            │
                     Express API
                            │
          ┌─────────────────┼──────────────────┐
          │                 │                  │
       Auth/User         Domain Services     Mastra
          │                 │                  │
          │                 │          ┌───────┼────────┐
          │                 │          │       │        │
          │                 │        Agent   Tools   Workflows
          │                 │          │       │        │
          └─────────────────┼──────────┴───────┼────────┘
                            │                  │
                         MongoDB Atlas         │
                            │                  │
                 ┌──────────┴─────────┐        │
                 │                    │        │
             Documents            Vector Search│
                 │                    │        │
                 └──────────┬─────────┘        │
                            │                  │
                         Gemma                 │
                       via Ollama              │
                                               │
                              ┌────────────────┼──────────────┐
                              ▼                ▼              ▼
                           ElevenLabs       SerpApi         Sentry
```

## 2. Responsibility boundaries

### Next.js
- Render pages.
- Manage UI state.
- Call backend APIs.
- Never hold provider secrets.

### Express
- Authentication/authorization.
- Input validation.
- Business rules.
- Reading-session state.
- XP/Orb calculations.
- Provider adapters.
- Mastra invocation.

### Mastra
- AI orchestration.
- Tool calling.
- Recommendation/reflection workflows.
- AI memory/evaluation hooks.
- Structured AI outputs.

### Gemma
- Semantic interpretation.
- Candidate ranking within a supplied set.
- Review analysis.
- Vocabulary extraction.
- Recommendation explanation.
- Mission/Orb semantic metadata.

### MongoDB
- Source of truth for users/books/sessions/reviews/progress.
- Vector retrieval for books and reader preferences.

### ElevenLabs
- Convert short generated text into audio.
- No recommendation logic.

### SerpApi
- Current external search/discovery.
- No final recommendation authority.

### Sentry
- Observe, diagnose and measure the application.

## 3. Recommendation pipeline

```text
request
  ↓
authenticate user
  ↓
load Reader DNA
  ↓
load recent reading history
  ↓
construct semantic query
  ↓
MongoDB Vector Search
  ↓
apply deterministic filters
  ↓
score candidates using deterministic factors
  ↓
pass top N candidates to Gemma
  ↓
Gemma ranks and explains
  ↓
Zod validation
  ↓
select existing bookId
  ↓
store recommendation
  ↓
optional ElevenLabs narration
  ↓
return UI response
```

## 4. Completion pipeline

```text
STOP SESSION
   ↓
calculate duration from timestamps
   ↓
collect reflection
   ↓
validate reflection
   ↓
Mastra completion workflow
   ├── analyze review (Gemma)
   ├── extract vocabulary (Gemma)
   ├── update Reader DNA
   ├── calculate deterministic XP
   ├── generate Orb parameters
   ├── persist Orb
   ├── update streak/level
   └── generate next recommendation
```

## 5. Failure behavior

- Gemma unavailable → show retry + optional deterministic candidate list.
- ElevenLabs unavailable → recommendation still works without audio.
- SerpApi unavailable → hide live external links.
- Vector Search unavailable → fallback to metadata filtering + deterministic scoring.
- Sentry unavailable → application remains functional; telemetry is best-effort.
