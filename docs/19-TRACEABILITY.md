# 19 — Requirements Traceability

| Requirement | Design | Implementation | Test | Demo |
|---|---|---|---|---|
| Gemma at core | `06`, `07` | Gemma adapter + ReaderAgent | AI eval | Recommendation |
| Touch Grass | `01`, `13` | Grass Mode | E2E reading flow | Start → Stop |
| Personalized recommendation | `06`, `09` | recommendation workflow | recommendation eval | Next Adventure |
| Timer | `02`, `12` | reading session service | duration tests | Reading screen |
| Reflection | `01`, `07`, `13` | review API/workflow | schema + integration | Reflection |
| Next recommendation | `04`, `06` | completion workflow | completion test | Completion → next |
| ORB | `10` | Orb service | deterministic score tests | Orb reveal |
| Levels | `11` | Progress service | threshold tests | Level up |
| ElevenLabs | `08` | voice service | mocked provider | Listen button |
| MongoDB Vector Search | `09` | retrieval service | retrieval eval | recommendation trace |
| SerpApi | `12` | availability adapter | mocked provider | Buy/Get links |
| Sentry | `04`, `15` | tracing/error layer | telemetry smoke | trace view |
| Security | `16` | auth/repositories | authz tests | protected pages |
