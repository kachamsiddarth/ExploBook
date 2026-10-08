# ExploBook — Phase 6 UI Integration

**Phase:** 6 — Complete Product UI + Integration + Grass Ratio + Sentry + Polish  
**Status:** Complete  
**Date:** October 7, 2026  

---

## 1. Overview & Architecture

Phase 6 completes the end-to-end integration of ExploBook, connecting backend capabilities into a unified, responsive frontend experience built on Next.js 15, Tailwind CSS, and Sentry telemetry.

### Core Product Loop
1. **Reader DNA Profile**: Real-time visualization of cognitive styles, dominant genres, depth velocity, and curiosity vectors.
2. **Recommendation Engine**: Gemma-powered semantic recommendations linked directly with the user's active profile.
3. **Immersive Reading Mode**: Distraction-free full-screen reader with timer, ambient focus options, and quick-finish triggers.
4. **Post-Reading Reflection & Orb Generation**: Guided reflection capture producing animated reading memory Orbs with essence quotes and thematic tags.
5. **Real-World Expedition Briefing**: Gemma + SerpApi location mapping + ElevenLabs audio voice briefings with cached SHA-256 audio streaming.
6. **Grass Mode (Touch Grass)**: Outdoor companion with place directions, GPS tracking, exploration timer, notes, and photos.
7. **Grass Ratio & Stats Dashboard**: Off-screen vs. on-screen time tracking, streak count, total pages read, and touch grass ratio.

---

## 2. Key Components & Implementation

### Frontend (`apps/web`)
- **[app/page.tsx](file:///C:/Projects/uli/ExploBook/apps/web/app/page.tsx)**: Main application container hosting all steps of the core loop (Dashboard, Reading Mode, Reflection Modal, Expedition View, Grass Mode, History).
- **[components/ReaderDNAVisualizer.tsx](file:///C:/Projects/uli/ExploBook/apps/web/components/ReaderDNAVisualizer.tsx)**: Interactive radar and progress metrics visualizing 5 cognitive dimensions and reader archetype.
- **[components/GrassRatioGauge.tsx](file:///C:/Projects/uli/ExploBook/apps/web/components/GrassRatioGauge.tsx)**: Visual circular gauge tracking off-screen outdoor time vs screen reading time.
- **[components/AudioBriefingPlayer.tsx](file:///C:/Projects/uli/ExploBook/apps/web/components/AudioBriefingPlayer.tsx)**: Custom audio player with ElevenLabs stream playback, scrubbing, speed controls, and waveform visuals.
- **[components/PlaceCard.tsx](file:///C:/Projects/uli/ExploBook/apps/web/components/PlaceCard.tsx)**: Real-world place viewer displaying SerpApi place metadata, ratings, open hours, and Google Maps directions link.
- **[components/OrbCard.tsx](file:///C:/Projects/uli/ExploBook/apps/web/components/OrbCard.tsx)**: Glassmorphic memory orb card rendering essence quotes and reflection synthesis.
- **[lib/api.ts](file:///C:/Projects/uli/ExploBook/apps/web/lib/api.ts)**: Type-safe client wrapping all API endpoints including `/dashboard`, `/dna`, `/expeditions`, `/voice`, and `/grass-ratio`.

### Backend API (`apps/api`)
- **[src/routes/dashboard.routes.ts](file:///C:/Projects/uli/ExploBook/apps/api/src/routes/dashboard.routes.ts)**: Single-call dashboard aggregator returning stats, current book, active expedition, recent orbs, and Grass Ratio.
- **[src/routes/grass-ratio.routes.ts](file:///C:/Projects/uli/ExploBook/apps/api/src/routes/grass-ratio.routes.ts)**: Route calculating off-screen outdoor minutes vs reading minutes.
- **[src/routes/expedition.routes.ts](file:///C:/Projects/uli/ExploBook/apps/api/src/routes/expedition.routes.ts)**: Real-world place search, expedition creation, and ElevenLabs audio briefing generation.

---

## 3. Verification & Test Results

- **Typecheck**: `pnpm --recursive run typecheck` passed with 0 errors across all 5 workspace projects.
- **Unit & Integration Tests**: 38/38 tests passing across all packages.
- **Next.js Production Build**: `pnpm --filter web build` compiled and optimized successfully (Route `/` static prerendered with 0 lint/entity errors).
- **API Production Build**: `pnpm --filter api build` compiled cleanly.

---

## 5. Direct API Transport & Token Race Elimination

### Root Cause
1. In Next.js 15 App Router, local development proxy rewrites in `next.config.mjs` intercepted `/api/v1/*` requests with Next.js's internal 404 HTML handler instead of proxying directly to Express on `http://localhost:4000`.
2. Decoupled `useEffect` calls in `apps/web/app/page.tsx` allowed `loadDashboard()` to execute before the Clerk session token getter finished registering, leading to unauthenticated initial dispatches.

### Solution
1. Configured `API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'` in `apps/web/lib/api.ts` to dispatch client requests directly to the Express backend with standard CORS credentials and `Authorization: Bearer <Clerk JWT>`.
2. Added `NEXT_PUBLIC_API_URL=http://localhost:4000` to `.env.local` and `.env.example`.
3. Consolidated token registration and initial dashboard loading inside `apps/web/app/page.tsx` to eliminate the lifecycle race condition.


