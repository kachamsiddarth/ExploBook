# ExploBook — Phase 4: Reading, Real-World Expeditions, XP & Orbs

> **Document:** `PHASE-4-EXPEDITIONS.md`  
> **Version:** 1.0.0  
> **Status:** Completed & Verified  
> **Milestone:** Merged Phase 4 — The "Touch Grass" Core Product Loop  

---

## 1. Executive Summary

Phase 4 operationalizes the core Hacktoberfest "Touch Grass" product loop in ExploBook. It shifts the product from an AI recommendation engine into an offline action system where reading is directly transformed into physical real-world missions.

```text
Book Discovery (Phase 3)
       ↓
Reading Session Started
       ↓
Reading Session Reflection
       ↓
Gemma Generates Real-World Expedition
       ↓
🌿 GRASS MODE (PHONE IN POCKET / LOCKED)
       ↓
User Explores Physical World
       ↓
User Returns & Records Observations
       ↓
Gemma Reflection Analysis & DNA Delta Suggestion
       ↓
Deterministic XP Awarded & Level Up
       ↓
Orb Minted & Added to Player Profile
       ↓
Next Book Loop
```

---

## 2. Architecture & Design Enforcement

### 2.1 AI vs Deterministic Division
Per ADR guidelines and Hacktoberfest integrity rules:
- **Gemma 3 4B (`gemma3:4b-it-q4_K_M`) Controls:**
  - Semantic theme translation from book to physical world.
  - Expedition concepts, titles, objectives, and observation prompts.
  - Reflection analysis and curiosity signal detection.
  - Recommended Reader DNA exploration profile deltas.
  - Evocative Orb titles and themes.
- **TypeScript / Zod Strictly Controls:**
  - IDs and MongoDB ObjectIds.
  - Timestamp recording and durations.
  - XP calculation formulas:
    - Base reading session XP: 50 XP (+pages / 2 + reflection bonus).
    - Base expedition XP: 100 XP (+duration bonus + reflection + observation bonus).
  - Level calculation formula:
    - Tiered thresholds for Levels 1–4, quadratic curve for higher levels.
  - Orb rarity determination (COMMON, UNCOMMON, RARE, EPIC, LEGENDARY) based on reflection quality and streak metrics.
  - Grass Ratio calculation: `Outdoor Seconds / App Seconds`.

### 2.2 Mastra Workflow Engine
Phase 4 registers two additional high-level Mastra workflows on `explobookMastra`:
1. `expeditionGenerationWorkflow`:
   - Validates book and reader identity.
   - Prompts Gemma for real-world missions.
   - Validates structure via Zod.
   - Persists state `READY`.
2. `expeditionCompletionWorkflow`:
   - Analyzes user reflection observations via Gemma.
   - Calculates XP and awards deterministic rewards.
   - Creates and links persistent `Orb` doc.
   - Updates Reader DNA with bounded deltas.

---

## 3. Database Collections & Schemas

### 3.1 Collections Added:
1. `reading_sessions` (`readingSessionRepository`)
   - Tracks reading status (`ACTIVE`, `PAUSED`, `COMPLETED`, `ABANDONED`).
   - Stores pages read, duration, and reader passage takeaways.
2. `expeditions` (`expeditionRepository`)
   - Tracks expedition lifecycle (`GENERATED`, `READY`, `STARTED`, `AWAY`, `RETURNED`, `REFLECTION_PENDING`, `COMPLETED`).
   - Categorized by type: `WANDER`, `OBSERVATION`, `NATURE`, `DISCOVERY`, `HISTORICAL`, `LITERARY`, `MYSTERY`.
   - Stores Gemma's objective, instructions, and connection to book themes.
3. `orbs` (`orbRepository`)
   - Persistent crystallized achievements awarded upon completed loops.
   - Properties: `title`, `rarity`, `theme`, `essenceQuote`, `colorHex`, `earnedAt`.

---

## 4. REST API Endpoints

Mounted under `/api/v1`:

| Method | Endpoint | Description | Auth Required |
|---|---|---|---|
| `POST` | `/api/v1/sessions/start` | Start or resume reading session | Yes |
| `GET` | `/api/v1/sessions/active` | Retrieve current active reading session | Yes |
| `POST` | `/api/v1/sessions/:id/complete`| Submit reading reflection, award reading XP | Yes |
| `GET` | `/api/v1/sessions/history` | List user reading history | Yes |
| `POST` | `/api/v1/expeditions/generate` | Generate expedition from book via Mastra & Gemma | Yes |
| `GET` | `/api/v1/expeditions/current` | Retrieve current expedition | Yes |
| `POST` | `/api/v1/expeditions/:id/start` | Initiate expedition / step away (Grass Mode) | Yes |
| `POST` | `/api/v1/expeditions/:id/return` | Record return from physical exploration | Yes |
| `POST` | `/api/v1/expeditions/:id/reflection` | Submit reflection, run Mastra completion workflow | Yes |
| `GET` | `/api/v1/expeditions/history` | List completed expeditions | Yes |
| `GET` | `/api/v1/orbs` | Fetch user earned Orbs | Yes |

---

## 5. Frontend & Grass Mode UI

`apps/web/app/page.tsx` is updated to provide the complete 6-stage interactive loop:
1. **Catalogue View:** Book selection with themes and grounded rationale.
2. **Reading Session:** Active reading with passage takeaway gate.
3. **Expedition Briefing:** Visual presentation of the mission, instructions, and time estimate.
4. **🌿 Grass Mode Screen:** Dark minimalist screen instructing user to put the phone in pocket and step outside.
5. **Return & Reflection:** Form to record real-world discoveries and overlooked details.
6. **Orb & Progression Reveal:** Displays earned Orb rarity, XP awarded, and updated Grass Ratio.

---

## 6. Verification & Test Results

- All 4 test files pass:
  - `health.test.ts` (3 tests)
  - `phase2.test.ts` (3 tests)
  - `phase3.test.ts` (3 tests)
  - `phase4.test.ts` (8 tests)
  - Total: **17 passed**
- Workspace Typecheck: **Clean (all 4 packages pass `tsc --noEmit`)**
- Workspace Production Build: **Clean (Next.js static generation + API compile exit code 0)**
