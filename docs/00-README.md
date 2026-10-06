# ExploBook — Engineering Documentation

> **Touch Grass · AI-powered reading companion**

ExploBook is a reading-habit product whose central design principle is: **AI should help the reader choose and reflect, then get out of the way while the human reads.**

The application uses open-weight Gemma as the primary intelligence layer, Mastra for agent/workflow orchestration, MongoDB Atlas for application data and semantic retrieval, ElevenLabs for optional voice experiences, SerpApi for live book discovery/availability, Sentry for observability, and Vercel/Render for deployment.

## Documentation map

| File | Purpose |
|---|---|
| `01-PRD.md` | Product requirements, personas, goals, scope, success criteria |
| `02-TECH-REQUIREMENTS.md` | Functional/non-functional engineering requirements |
| `03-TECH-STACK.md` | Technology choices and rationale |
| `04-ARCHITECTURE.md` | System architecture and end-to-end data flow |
| `05-DATABASE-SCHEMA.md` | MongoDB collections, document shapes, indexes |
| `06-MASTRA.md` | Agents, tools, memory, workflows, orchestration contracts |
| `07-GEMMA-PROMPTS.md` | Prompt contracts, structured outputs, safety rules |
| `08-ELEVENLABS.md` | TTS architecture and voice experiences |
| `09-MONGODB-VECTOR-SEARCH.md` | Embedding, indexing, retrieval and ranking design |
| `10-ORB-SYSTEM.md` | Orb generation, rarity and procedural visual parameters |
| `11-XP-LEVEL-SYSTEM.md` | XP, levels, streaks and progression rules |
| `12-API-SPEC.md` | REST API endpoints, request/response contracts |
| `13-UI-SPEC.md` | Page-by-page UI and visual system |
| `14-IMPLEMENTATION-PLAN.md` | Exact implementation phases and verification gates |
| `15-TESTING.md` | Unit, integration, AI eval and E2E strategy |
| `16-SECURITY-PRIVACY.md` | Authentication, secrets, data boundaries and abuse controls |
| `17-ENV-RUNBOOK.md` | Environment variables, local setup and deployment runbook |
| `18-DECISIONS.md` | Architecture decisions and trade-offs |
| `19-TRACEABILITY.md` | Requirements → implementation → tests → demo mapping |
| `20-HACKTOBERFEST-SUBMISSION.md` | Demo narrative, partner-category evidence and article outline |
| `21-COPILOT-INSTRUCTIONS.md` | Rules for coding agents implementing the project |
| `22-BOOK-DATA-INGESTION.md` | Book catalogue, public-domain content and metadata ingestion |

## Source-of-truth rule

These documents are the architecture contract. Implementation should follow them unless a deliberate architecture decision is recorded in `18-DECISIONS.md`.

## Core product loop

```text
Reader onboarding
      ↓
Reader DNA
      ↓
Gemma + Mastra recommendation workflow
      ↓
Book recommendation
      ↓
Optional ElevenLabs voice preview
      ↓
START READING
      ↓
🌿 Grass Mode / infinite timer
      ↓
Human reads away from the screen
      ↓
STOP
      ↓
Reflection + rating + vocabulary
      ↓
Gemma analysis
      ↓
Reader DNA update
      ↓
XP + level + one Orb
      ↓
Next recommendation
      ↺
```

## Important product boundary

ExploBook is **not** a general-purpose chatbot and should not become one. AI exists to power recommendation, reflection, personalization, vocabulary and optional voice experiences. The primary human activity is reading away from the screen.
