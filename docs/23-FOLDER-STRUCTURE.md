# 23 — Recommended Repository Structure

```text
exploBook/
├── apps/
│   ├── web/
│   │   ├── app/
│   │   ├── components/
│   │   ├── features/
│   │   └── lib/
│   │
│   └── api/
│       └── src/
│           ├── config/
│           ├── controllers/
│           ├── middleware/
│           ├── repositories/
│           ├── routes/
│           ├── schemas/
│           ├── services/
│           ├── providers/
│           │   ├── gemma/
│           │   ├── elevenlabs/
│           │   ├── serpapi/
│           │   └── sentry/
│           └── mastra/
│               ├── agents/
│               ├── tools/
│               ├── workflows/
│               ├── prompts/
│               └── index.ts
│
├── packages/
│   ├── shared/
│   │   ├── types/
│   │   ├── schemas/
│   │   └── constants/
│   └── ui/
│
├── data/
│   ├── seed/
│   └── fixtures/
│
├── scripts/
│   ├── seed-books.ts
│   ├── embed-books.ts
│   └── eval-recommendations.ts
│
├── docs/
│   └── ...
│
├── .env.example
├── package.json
└── README.md
```

If the existing repository already has a structure, adapt this logically instead of performing a destructive rewrite.
