# 25 — Open Questions / Decisions Before Coding

These are the only decisions that should be resolved during Phase 0 rather than guessed during implementation.

1. What exact existing repository is ExploBook being added to?
2. Confirm Clerk application configuration (development and production instances, allowed origins, redirect URLs).
3. Which book metadata source will be used for the seed catalogue?
4. Which exact embedding model/version is available in the deployment environment?
5. Which production Gemma runtime will be used on Render or another backend host?
6. Where will generated audio be stored in production: object storage or provider URL/cache only?
7. Whether public-domain full-text reading is included in the first submission or only recommendation links.
8. Exact brand typography/font licensing.
9. Exact Orb visual implementation: SVG/CSS canvas/React SVG.

Do not block the entire project on questions that are explicitly marked P2. Resolve P0 architecture blockers first.
