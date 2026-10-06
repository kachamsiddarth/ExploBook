# 03 — Technology Stack

| Layer | Technology | Role |
|---|---|---|
| Frontend | Next.js + React + TypeScript | Web application |
| Styling | Tailwind CSS + custom CSS tokens | Editorial visual system |
| Backend | Node.js + Express + TypeScript | API/business logic |
| Validation | Zod | API and AI schema validation |
| AI orchestration | Mastra | Agents, tools, workflows, memory/evals |
| Primary model | Gemma 3 1B IT Q4_K_M initially; 4B Q4 fallback | Local/open-weight intelligence |
| Local inference | Ollama | Development model runtime |
| Database | MongoDB Atlas | Application persistence |
| Retrieval | MongoDB Atlas Vector Search | Semantic book/profile retrieval |
| Embeddings | `nomic-embed-text` via Ollama for local-first MVP | Book/profile embeddings |
| Voice | ElevenLabs | Recommendation/Orb narration |
| Web grounding | SerpApi | Current book/search/availability links |
| Observability | Sentry | Errors, traces, AI workflow observability |
| Frontend hosting | Vercel | Next.js deployment |
| Backend hosting | Render | API/AI service deployment |
| Source control | GitHub | Repository and CI |

## Why Gemma 3 first

The project prioritizes a small local model to keep development practical. Start with Gemma 3 1B; move to Gemma 3 4B if recommendation quality is insufficient. Do not make the entire architecture depend on a specific model size.

## Why Mastra

Mastra is the orchestration layer rather than the model. It provides agents, tools, workflows and memory primitives that fit the recommendation/reflection lifecycle. Its current docs require tools to be defined with `createTool()` and Zod schemas, and support integration with Express/Next.js. See the official Mastra docs in `18-DECISIONS.md`.

## Why MongoDB Atlas

The same database can store application documents and vector representations. Atlas Vector Search supports semantic retrieval with pre-filtering, allowing the system to combine genre/difficulty/language filters with semantic similarity.

## Why ElevenLabs

Voice is an optional accessibility/discovery layer: recommendation previews, Orb stories and reading-journey recaps. It should not turn the app into an audiobook reader or encourage screen time.
