# 18 — Architecture Decisions

## ADR-001 — Gemma is the primary intelligence layer

**Decision:** Use Gemma for semantic AI tasks.

**Reason:** The project is entering the Gemma partner category and wants an open-weight/local-first AI core.

## ADR-002 — Start with Gemma 3 1B, evaluate 4B

**Decision:** Use the smaller Gemma 3 model first and move to 4B only if quality requires it.

**Reason:** Local development reliability and iteration speed matter more than maximum model size.

## ADR-003 — Mastra orchestrates, Gemma reasons

**Decision:** Mastra owns agent/tool/workflow structure; Gemma performs semantic interpretation.

**Reason:** Separating orchestration from model choice makes the system testable and provider-independent.

## ADR-004 — MongoDB is the application source of truth

**Decision:** Store canonical Reader DNA, sessions, reviews, XP, Orbs and books in MongoDB.

**Reason:** Business state must not live only in model memory.

## ADR-005 — Vector retrieval before LLM ranking

**Decision:** Retrieve verified candidates using MongoDB Vector Search before Gemma ranks them.

**Reason:** Prevent hallucinated recommendations and improve grounding.

## ADR-006 — Deterministic progression

**Decision:** XP, levels, Orb rarity and timer duration are calculated in code.

**Reason:** These are business rules, not language-generation tasks.

## ADR-007 — ElevenLabs is optional enhancement

**Decision:** Voice never blocks core reading/recommendation functionality.

**Reason:** The product must remain useful without a paid/available voice provider.

## ADR-008 — No full copyrighted book hosting

**Decision:** Reading content is limited to legally permitted/public-domain/user-provided material.

**Reason:** Copyright and platform risk.

## ADR-009 — One primary agent initially

**Decision:** Start with `readerAgent` rather than a multi-agent architecture.

**Reason:** The product can be implemented cleanly with tools and workflows; multi-agent complexity is not required for MVP.

## ADR-010 — Current official docs are implementation authority

Mastra: current docs describe Mastra as a TypeScript framework for agents/applications and specify `createTool()` + Zod tool definitions; Studio runs locally for agent/workflow/tool testing. urlMastra docshttps://mastra.ai/docs

Mastra memory supports working memory and semantic recall, with storage adapters including MongoDB in current releases. urlMastra memory docshttps://mastra.ai/docs/memory/overview

MongoDB Vector Search supports semantic retrieval through `$vectorSearch` and metadata pre-filtering. urlMongoDB Vector Searchhttps://www.mongodb.com/products/platform/atlas-vector-search/getting-started

ElevenLabs provides Text to Speech through an API and official Node SDK. urlElevenLabs TTS docshttps://elevenlabs.io/docs/overview/capabilities/text-to-speech

Gemma documentation is the authority for model capabilities and deployment details. urlGemma docshttps://ai.google.dev/gemma/docs/


## ADR-011 — Clerk owns authentication

**Decision:** Use Clerk as ExploBook's identity provider.

**Reason:** Clerk provides the authentication/session layer, prebuilt UI and authorization primitives so ExploBook can focus engineering effort on the reading experience and AI workflow. It also avoids custom password/session security. The Next.js app uses `@clerk/nextjs`; the Express API uses `@clerk/express`. The local MongoDB user record stores the stable Clerk user ID as `clerkUserId`.

**References:** urlClerk Next.js SDKhttps://clerk.com/docs/reference/nextjs/overview · urlClerk Express middlewarehttps://clerk.com/docs/reference/express/clerk-middleware
