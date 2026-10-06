# 15 — Testing Strategy

## Unit tests

- XP calculation.
- Level thresholds.
- Orb score.
- Orb rarity.
- deterministic recommendation scoring.
- reading duration.
- streak calculation.
- prompt input builders.
- hash/cache key generation.

## Schema tests

Every Zod schema should have:
- valid examples.
- missing required field.
- invalid enum.
- out-of-range numeric value.
- oversized text.

## Integration tests

- auth + profile.
- book search.
- recommendation workflow.
- reading session lifecycle.
- completion workflow.
- ElevenLabs adapter mocked.
- SerpApi adapter mocked.
- MongoDB vector search adapter mocked or test cluster.

## AI evaluation set

Create at least 20 representative reader profiles and 5–10 candidate books each.

Evaluate:
- selected book exists in candidates.
- relevance.
- difficulty progression.
- diversity.
- explanation consistency.
- structured-output validity.

Score with deterministic assertions plus a human-rated sample.

## E2E golden path

```text
register
→ onboarding
→ recommendation
→ listen
→ start reading
→ stop
→ reflection
→ completion
→ Orb
→ level/XP
→ next recommendation
```

## Failure-path tests

- Gemma unavailable.
- Gemma invalid JSON.
- ElevenLabs timeout.
- SerpApi timeout.
- MongoDB unavailable.
- duplicate review submission.
- duplicate completion workflow.
- expired authentication.

## Performance targets

Initial targets, to be measured rather than assumed:
- API non-AI endpoints <500ms p95 locally.
- recommendation pipeline <10s target on local 1B model.
- voice preview starts quickly enough to feel interactive; cache repeat requests.
- Grass Mode timer must remain smooth regardless of backend latency.
