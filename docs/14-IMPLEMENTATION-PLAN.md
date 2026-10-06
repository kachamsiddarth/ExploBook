# 14 — Exact Implementation Plan

The implementation is intentionally phased. Do not ask a coding agent to build the whole project in one prompt.

## Phase 0 — Repository audit

Tasks:
- Inspect existing repository.
- Confirm current stack.
- Confirm package manager.
- Identify existing auth/database/deployment code.
- Record conflicts with this specification.

Exit gate: written architecture delta in `18-DECISIONS.md`.

## Phase 1 — Project foundation

Build:
- environment loader.
- shared TypeScript/Zod types.
- API error contract.
- logging/request IDs.
- basic MongoDB connection.
- health endpoint.

Verification:
- typecheck.
- lint.
- unit tests.

## Phase 2 — Authentication + user profile

Build:
- register/login/logout/me.
- user model.
- Reader Profile model.
- protected routes.

Verification:
- auth integration tests.
- authorization tests.

## Phase 3 — Book catalogue

Build:
- book schema.
- seed dataset.
- book search.
- book detail.
- metadata validation.
- public-domain flag.

Verification:
- no duplicate IDs.
- required metadata present.

## Phase 4 — Local Gemma adapter

Build:
- `AIProvider` interface.
- Ollama adapter.
- Gemma smoke test.
- structured JSON generation helper.
- timeout/retry behavior.

Start with Gemma 3 1B; evaluate against a small recommendation/reflection dataset before moving to 4B.

Verification:
- 10–20 representative prompts.
- valid JSON rate.
- latency measurement.

## Phase 5 — Mastra foundation

Build:
- Mastra project/module.
- ReaderAgent.
- first tools.
- Studio dev workflow.
- authentication context propagation.

Verification:
- tool execution.
- agent generation.
- traceable request IDs.

## Phase 6 — Recommendation engine

Build:
- Reader DNA.
- deterministic scoring.
- candidate retrieval.
- recommendation workflow.
- Gemma ranking.
- persistence.

Verification:
- recommendation never references unknown book IDs.
- recommendation output validates.
- repeat request behavior.

## Phase 7 — MongoDB Vector Search

Build:
- embedding pipeline.
- book embeddings.
- vector index.
- semantic query.
- metadata prefilters.
- hybrid scoring.

Verification:
- known similar books appear in top K.
- filters exclude incompatible books.

## Phase 8 — Reading cycle

Build:
- Start Reading.
- server timestamp session.
- infinite timer UI.
- Stop.
- reflection form.

Verification:
- refresh does not reset duration.
- duplicate stop is safe.
- abandoned session is recoverable.

## Phase 9 — Completion workflow

Build:
- review analysis.
- vocabulary extraction.
- Reader DNA update.
- XP.
- level.
- streak.
- Orb.
- next recommendation.

Verification:
- exactly one Orb per completed session.
- idempotent completion.

## Phase 10 — ElevenLabs

Build:
- recommendation voice.
- 60-second preview.
- Orb story.
- journey recap.
- caching.
- rate limits.

Verification:
- key stays server-side.
- repeated generation hits cache.
- provider failure does not break recommendation.

## Phase 11 — Grass Mode + Missions

Build:
- minimal reading screen.
- reading missions.
- streak UI.
- mission completion.

Verification:
- core reading screen contains no distracting features.

## Phase 12 — SerpApi + external links

Build:
- book availability lookup.
- purchase/search link normalization.
- external link UI.

Verification:
- external links are clearly external.
- missing results handled gracefully.

## Phase 13 — Sentry + observability

Build:
- error capture.
- request tracing.
- AI workflow timing.
- provider failures.
- useful metadata without sensitive user content.

Verification:
- representative errors visible.
- secrets excluded.

## Phase 14 — Editorial UI polish

Build:
- warm paper/charcoal theme.
- typography.
- transitions.
- Orb animations.
- responsive layouts.
- accessibility.

Verification:
- mobile/desktop smoke test.
- keyboard navigation.
- reduced-motion support.

## Phase 15 — Evaluation and hardening

Build:
- recommendation eval set.
- prompt regression tests.
- API integration tests.
- E2E happy path.
- failure-path tests.
- security review.

## Phase 16 — Deployment

Deploy:
- frontend to Vercel.
- backend/Mastra service to Render.
- MongoDB Atlas.
- provider secrets.
- production health checks.

Critical decision: production Gemma runtime must be explicitly chosen before final deployment; do not assume a local Ollama process is reachable from Render.

## Phase 17 — Submission freeze

- Freeze features.
- Fix P0/P1 bugs.
- Record demo script.
- Capture partner evidence.
- Write DEV article.
- Verify README and setup.
- Tag release.
