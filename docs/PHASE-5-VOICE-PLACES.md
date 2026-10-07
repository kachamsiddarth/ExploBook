# ExploBook — Phase 5: ElevenLabs Voice Briefings & SerpApi Place Discovery

> **Document:** `docs/PHASE-5-VOICE-PLACES.md`
> **Status:** COMPLETE
> **Completed:** October 7, 2026

---

## Summary

Phase 5 adds two real-world integration pillars that complete the "phone away" loop:

1. **SerpApi** — Server-side verified nearby place discovery for `DISCOVERY`, `HISTORICAL`, and `LITERARY` expedition types.
2. **ElevenLabs** — Cinematic audio expedition briefings narrated before the user steps outside.

Both integrations are **strictly server-side**. No API key is exposed to the browser.

---

## Architecture

```text
Browser (optional geolocation)
    ↓
POST /api/v1/expeditions/generate
    { bookId, availableMinutes, preferredType, location? }
    ↓
Mastra: expeditionGenerationWorkflow
    ↓ (if location provided)
SerpApiService.searchNearbyPlaces()
    ↓
SerpApi Google Maps REST API
    ↓
Normalized place candidates (max 5)
    ↓
First candidate passed to Gemma as nearbyPlace context
    ↓
Expedition persisted with place field
    ↓
Return expedition + place to client

--- After expedition is ready ---

POST /api/v1/expeditions/:id/voice
    ↓
ElevenLabsService.generateExpeditionBriefing()
    ↓
VoiceCacheService.lookup(SHA-256 cache key)
    ├── HIT  → Return cached base64 audio
    └── MISS
          ↓
        ElevenLabs TTS REST API
          ↓
        Base64 MP3 audio
          ↓
        VoiceCacheService.store()
          ↓
        Return audio to client
```

---

## Files Created

| File | Purpose |
|---|---|
| `apps/api/src/services/serpapi.service.ts` | SerpApi Google Maps place discovery |
| `apps/api/src/services/voice/elevenlabs.service.ts` | ElevenLabs TTS briefing generation |
| `apps/api/src/services/voice/voice-cache.service.ts` | SHA-256 MongoDB voice generation cache |
| `apps/api/src/__tests__/phase5.test.ts` | Phase 5 unit tests (15 tests) |

---

## Files Modified

| File | Change |
|---|---|
| `apps/api/src/services/mastra.ts` | SerpApi integration in expedition workflow + fallback path |
| `apps/api/src/routes/expedition.routes.ts` | Added `/voice` endpoint + location passthrough |
| `apps/web/app/page.tsx` | Phase 5 UI: voice briefing player, place card, location request |

---

## SerpApi Implementation

- **Client:** Direct `fetch` to `https://serpapi.com/search.json` (no SDK import)
- **Engine:** `google_maps` search
- **Privacy:** Location coordinates used ephemerally for the immediate request only. Coordinates are NOT stored in MongoDB.
- **Fallback:** If `SERPAPI_KEY` is not configured, or API fails → `[]` (empty candidates), expedition proceeds without place data.
- **Grounding:** Gemma receives `nearbyPlace` as context only. Gemma never invents places.
- **Query mapping:**

| Expedition Type | SerpApi Query |
|---|---|
| DISCOVERY | `bookstores near me` |
| HISTORICAL | `historical places near me` |
| NATURE | `parks near me` |
| LITERARY | `libraries near me` |
| WANDER | `parks near me` |
| OBSERVATION | `parks near me` |
| MYSTERY | `landmarks near me` |

---

## ElevenLabs Implementation

- **Client:** Direct `fetch` to `https://api.elevenlabs.io/v1/text-to-speech/:voiceId`
- **Model:** `eleven_multilingual_v2` (configurable via `ELEVENLABS_MODEL_ID`)
- **Voice:** `ELEVENLABS_EXPEDITION_VOICE_ID` (defaults to `pNInz6obpgDQGcFmaJgB`)
- **Format:** Audio returned as `base64` MP3, played client-side via `new Audio('data:audio/mpeg;base64,...')`
- **Caching:** `SHA-256(voiceId + modelId + script)` → `voiceGenerations` MongoDB collection
- **Error handling:** If key is missing → `503 VOICE_UNAVAILABLE` with clear message. Not a fatal error for expedition flow.

---

## Script Structure

The briefing script format:
```
[expedition title]

[objective]

[up to 4 instruction lines, cleaned of "Step N:" prefix]

You have [N] minutes. Keep your phone in your pocket.

[bookConnection]

I'll be here when you return. Now step outside.
```

---

## Environment Variables Required

```env
# SerpApi
SERPAPI_KEY=your_serpapi_key

# ElevenLabs
ELEVENLABS_API_KEY=your_elevenlabs_key
ELEVENLABS_EXPEDITION_VOICE_ID=pNInz6obpgDQGcFmaJgB
ELEVENLABS_MODEL_ID=eleven_multilingual_v2
```

---

## Test Results

```
✓ Phase 5 tests: 15/15 passed
✓ All API tests: 32/32 passed
✓ TypeScript typecheck: 0 errors across all packages
✓ Production build: clean
```

---

## Provider Boundaries (Phase 5)

| Responsibility | Provider |
|---|---|
| Place discovery | SerpApi (verified) |
| Place selection | First SerpApi result (deterministic by rank) |
| Expedition concept using place | Gemma (semantic grounding) |
| Audio script construction | TypeScript (deterministic) |
| Audio synthesis | ElevenLabs |
| Audio caching | SHA-256 → MongoDB |
| Coordinates storage | NOT stored (ephemeral only) |
