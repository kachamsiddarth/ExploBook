# ExploBook — Phase 0: Repository Audit Report

> **Document Version:** 1.0.0  
> **Date:** October 6, 2026  
> **Status:** Completed  
> **Target Path:** `docs/PHASE-0-AUDIT.md`

---

## Executive Summary

Phase 0 Repository Audit has been conducted for **ExploBook**. The repository is currently a **clean-slate technical specification pack** containing an introductory `README.md` and 28 exhaustive engineering design documents in `docs/`. 

No application source code, package manager manifests (`package.json`), framework configs (`tsconfig.json`), or third-party dependencies exist in the repository yet. This audit establishes the baseline environment, technology inventory, missing infrastructure, integration integration points (Clerk, Mastra, MongoDB Atlas, Ollama/Gemma, ElevenLabs, SerpApi, Sentry), and architectural roadmap required prior to initiating Phase 1.

---

## A. Repository Summary

- **Repository Root:** `c:\Projects\uli\ExploBook`
- **Current State:** Specification-only blueprint repository.
- **File Count:** 29 files (1 root `README.md` + 28 markdown documents under `docs/`).
- **Git Repository Status:** Uninitialized (`.git` directory absent).
- **Source Code Presence:** 0% (No JS/TS, HTML/CSS, or backend code present).
- **Configuration Files:** None (`package.json`, `tsconfig.json`, `.env` are currently absent).

---

## B. Existing Architecture Diagram

Because no code is implemented yet, the current architecture represents the **Target State** prescribed by the technical specification pack:

```text
                               ┌─────────────────────────┐
                               │     Browser Client      │
                               │  Next.js 15+ / React    │
                               │  (Tailwind, Warm Theme) │
                               └────────────┬────────────┘
                                            │
                                    Clerk Auth / HTTPS
                                            │
                               ┌────────────▼────────────┐
                               │   Node.js / Express     │
                               │      Backend API        │
                               └──────┬───────────┬──────┘
                                      │           │
          ┌───────────────────────────┴─┐       ┌─┴───────────────────────────┐
          │     Domain Repositories     │       │   Mastra Orchestration      │
          │  Users, Sessions, Reviews,  │       │  (readerAgent, Tools,       │
          │     Progress, Orbs, Books   │       │   Workflows, Memory/Evals)  │
          └──────────────┬──────────────┘       └──────────────┬──────────────┘
                         │                                     │
           ┌─────────────▼─────────────┐          ┌────────────▼────────────┐
           │   MongoDB Atlas Database  │          │   Ollama Local Runtime  │
           │  Documents + Vector Index │          │   Gemma 3 (1B/4B IT) +  │
           │   ($vectorSearch Engine)  │          │   nomic-embed-text      │
           └───────────────────────────┘          └────────────┬────────────┘
                                                               │
                                         ┌─────────────────────┼─────────────────────┐
                                         ▼                     ▼                     ▼
                                    ElevenLabs              SerpApi               Sentry
                                    (Voice TTS)          (Book Links)          (Telemetry)
```

---

## C. Current Technology Inventory

| Audit Item | Current Status | Target Specification |
|---|---|---|
| **1. Frontend Framework** | Uninitialized | Next.js 15+ (App Router), React 19, TypeScript |
| **2. Backend Framework** | Uninitialized | Node.js 22+, Express 4.x / 5.x, TypeScript |
| **3. Package Manager** | Uninitialized | `pnpm` or `npm` (monorepo structure with npm workspaces/pnpm workspaces) |
| **4. TypeScript Config** | Uninitialized | Strict Mode (`tsconfig.json` with `strict: true`, `target: ES2022`) |
| **5. Folder Structure** | Blueprint only | Monorepo layout: `apps/web`, `apps/api`, `packages/shared`, `packages/ui` |
| **6. Authentication** | Uninitialized | Clerk (`@clerk/nextjs` + `@clerk/express`) mapped to `users.clerkUserId` |
| **7. Database** | Uninitialized | MongoDB Atlas (Documents) + Atlas Vector Search (`book_embedding_index`) |
| **8. Book Models/Data** | Uninitialized | 200–1,000 book seed catalogue + `nomic-embed-text` vectors |
| **9. AI/Model Runtime** | Uninitialized | Mastra TypeScript SDK + Ollama running Gemma 3 (1B IT default, 4B fallback) |
| **10. API Routes** | Uninitialized | Express REST API scoped under `/api/v1/*` |
| **11. UI/Pages** | Uninitialized | Warm ivory editorial design system (13 spec pages including Grass Mode) |
| **12. Environment Vars** | Uninitialized | `.env` missing; template specified in `24-ENV-EXAMPLE.md` |
| **13. Testing Setup** | Uninitialized | Vitest / Jest + Supertest + Zod schema validation + AI eval set |
| **14. Deployment Config** | Uninitialized | Frontend → Vercel; Backend API → Render; DB → MongoDB Atlas |

---

## D. Reusable Components

Since the codebase is starting from a clean slate, there are **no legacy code files or existing modules** that need to be refactored or deleted. All implementation will directly build upon the specification files:

1. **Schema Specifications:** `docs/05-DATABASE-SCHEMA.md` provides copy-paste ready TypeScript/Zod interfaces for 11 collection shapes.
2. **Prompt Templates:** `docs/07-GEMMA-PROMPTS.md` provides versioned system & task prompt contracts.
3. **API Contracts:** `docs/12-API-SPEC.md` provides exact REST endpoint contracts and error payload standards.
4. **UI Design Tokens:** `docs/13-UI-SPEC.md` defines color tokens (`--paper: #F3EED7`, `--ink: #292728`, `--accent: #B6A46A`) and editorial typography rules.

---

## E. Conflicts with the New Specification

Because no code has been written yet, there are **zero code-level conflicts**. However, the audit highlights key architectural boundaries that must be strictly enforced during initial coding:

1. **Authentication Scoping (ADR-011 / FR-001):**
   - *Rule:* The app must **not** build custom password forms or JWT signers.
   - *Boundary:* Clerk owns authentication tokens. Express middleware verifies session JWTs via `@clerk/express`. API routes must derive identity from `clerkUserId` mapped to MongoDB local `userId`, **never** trusting a client-supplied `userId` parameter in request bodies.
2. **Deterministic Engine vs. LLM Authority (ADR-006):**
   - *Rule:* Gemma must **not** calculate XP, determine Orb rarity, or adjust session timers.
   - *Boundary:* All progression math is strictly calculated in TypeScript service methods. Gemma provides only semantic interpretation (review themes, vocabulary, Orb name/traits).
3. **Book Grounding Rule (FR-003 / ADR-005):**
   - *Rule:* Gemma must **never** hallucinate book titles or IDs.
   - *Boundary:* MongoDB Vector Search retrieves verified `bookId` candidates first. Gemma ranks *only* within the provided candidate array.
4. **Voice Service Boundary (ADR-007):**
   - *Rule:* ElevenLabs keys must stay server-side only. Audio generation must be non-blocking and cached.

---

## F. Required Future Changes

During upcoming phases, the following infrastructure must be created from scratch:

1. **Repository Setup:** Run `git init`, set up `.gitignore`, and configure `package.json` workspaces.
2. **TypeScript & Build Tooling:** Create root `tsconfig.json`, build scripts, and linter configurations.
3. **App Architecture Setup:**
   - `apps/web/`: Next.js frontend application.
   - `apps/api/`: Express API server & Mastra module.
   - `packages/shared/`: Shared Zod schemas, types, and constants.
4. **Environment Infrastructure:** Create `.env` files for local development containing Clerk, MongoDB, Ollama, ElevenLabs, SerpApi, and Sentry credentials.

---

## G. Dependency Changes Required Later

The following dependencies will be installed during Phase 1–5:

### 1. Workspace / Shared Dependencies
- `typescript` (~5.x)
- `zod` (~3.x)
- `dotenv`

### 2. Frontend Dependencies (`apps/web`)
- `next` (15.x)
- `react`, `react-dom` (19.x)
- `@clerk/nextjs`
- `tailwindcss`, `postcss`, `autoprefixer`
- `lucide-react`
- `clsx`, `tailwind-merge`

### 3. Backend Dependencies (`apps/api`)
- `express`
- `@clerk/express`
- `mongodb` (MongoDB Node Driver 6.x)
- `@mastra/core`
- `@elevenlabs/elevenlabs-js`
- `@sentry/node`
- `serpapi`
- `cors`, `helmet`

### 4. Developer & Testing Dependencies
- `vitest` / `jest`
- `ts-node` / `tsx`
- `nodemon`
- `@types/express`, `@types/node`, `@types/cors`

---

## H. Environment Variables Required Later

```env
# Server Runtime
NODE_ENV=development
PORT=4000
WEB_ORIGIN=http://localhost:3000

# Authentication (Clerk)
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...

# Database (MongoDB Atlas)
MONGODB_URI=mongodb+srv://...
MONGODB_DB_NAME=explobook

# Local AI / Inference (Ollama)
OLLAMA_BASE_URL=http://127.0.0.1:11434
GEMMA_MODEL=gemma3:1b-it-q4_K_M
EMBEDDING_MODEL=nomic-embed-text

# Voice (ElevenLabs)
ELEVENLABS_API_KEY=el_...
ELEVENLABS_RECOMMENDATION_VOICE_ID=
ELEVENLABS_ORB_VOICE_ID=
ELEVENLABS_MODEL_ID=eleven_multilingual_v2

# External Search (SerpApi)
SERPAPI_KEY=

# Observability (Sentry)
SENTRY_DSN=
SENTRY_ENVIRONMENT=development
```

---

## I. Database Changes Required Later

When initializing MongoDB Atlas:

1. **Collections to Create:**
   - `users` (Index: unique `clerkUserId`)
   - `readerProfiles` (Index: unique `userId`)
   - `books` (Indexes: `genres`, `themes`, `language`, `difficultyScore`, ISBNs)
   - `readingSessions` (Indexes: `{ userId: 1, startedAt: -1 }`, `{ userId: 1, status: 1 }`)
   - `reviews` (Indexes: `{ userId: 1, createdAt: -1 }`, `{ bookId: 1, userId: 1 }`)
   - `recommendations` (Index: `{ userId: 1, createdAt: -1 }`)
   - `vocabulary` (Index: unique `{ userId: 1, normalizedWord: 1 }`)
   - `orbs` (Index: unique `{ userId: 1, sessionId: 1 }`)
   - `missions` (Index: `{ userId: 1, status: 1 }`)
   - `voiceGenerations` (Index: `{ userId: 1, sourceHash: 1 }`)
   - `aiRuns` (Index: `{ workflow: 1, createdAt: -1 }`)

2. **MongoDB Atlas Vector Search Index (`book_embedding_index`):**
   - Target field: `books.embedding`
   - Filter fields: `language`, `publicDomain`, `difficultyScore`, `genres`

---

## J. Recommended Implementation Order

Following `docs/14-IMPLEMENTATION-PLAN.md`:

```text
Phase 0: Repository Audit (CURRENT - COMPLETE)
   ↓
Phase 1: Project Foundation (Environment, Shared Zod Schemas, API Error Contracts, DB Conn)
   ↓
Phase 2: Authentication + User Profile (Clerk setup, Express Auth Middleware, User Provisioning)
   ↓
Phase 3: Book Catalogue (Schema, Seed Dataset 200–1000 books, Metadata Search API)
   ↓
Phase 4: Local Gemma Adapter (Ollama Provider Interface, JSON Repair Prompt Fallback)
   ↓
Phase 5: Mastra Foundation (readerAgent, Tools, Workflows, Dev Studio)
   ↓
Phase 6: Recommendation Engine (Hybrid Candidate Scoring + Gemma Ranking)
   ↓
Phase 7: MongoDB Vector Search (Embedding Pipeline + $vectorSearch Integration)
   ↓
Phase 8: Reading Cycle & Grass Mode (Server Timestamps, Infinite Timer, Reflection Form)
   ↓
Phase 9: Completion Workflow (Review Analysis, XP Engine, Level Progression, Orb Generation)
   ↓
Phase 10: ElevenLabs Voice Integration (Server TTS Caching & Voice Previews)
   ↓
Phase 11–17: UI Polish, Missions, External Links, Telemetry & Deployment
```

---

## K. Risks & Blockers

1. **Production Gemma Deployment Strategy (ADR-002 / Phase 16):**
   - *Risk:* Local Ollama works seamlessly for local development, but Render backend hosting cannot access `localhost:11434`.
   - *Mitigation:* A remote Gemma inference endpoint (or containerized Ollama instance on Render / Google Cloud Run) must be selected before production deployment.
2. **Structured JSON Reliability on Gemma 3 1B/4B:**
   - *Risk:* Small open-weight models occasionally emit malformed JSON or trailing prose.
   - *Mitigation:* Implement strict Zod parsing with a single automated repair prompt fallback as specified in `docs/07-GEMMA-PROMPTS.md`.
3. **Atlas Vector Search Index Provisioning:**
   - *Risk:* Vector indexes in MongoDB Atlas take a few minutes to build upon initial deployment.
   - *Mitigation:* Implement a graceful fallback to metadata pre-filtering and deterministic scoring when Vector Search is indexing or unavailable.
4. **Third-Party API Cost / Rate Limits (ElevenLabs & SerpApi):**
   - *Risk:* High usage during public demo could exhaust API quotas.
   - *Mitigation:* Hash inputs with SHA-256 and store cached audio results in `voiceGenerations`. Rate-limit voice endpoints aggressively.

---

## L. Phase 1 Readiness Checklist

- [x] All 28 specification documents in `docs/` inspected and verified.
- [x] Baseline architectural constraints (Clerk, Mastra, Gemma, Atlas) audited.
- [x] Target repository layout defined.
- [x] `docs/PHASE-0-AUDIT.md` created as the single sole modification.
- [x] Repository confirmed free of unexpected code changes or dependency installs.

---

*Phase 0 Audit complete. Ready to proceed to Phase 1 (Project Foundation) upon user instruction.*
