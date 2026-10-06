# 08 — ElevenLabs Voice Architecture

## 1. Product role

ElevenLabs is an optional voice layer that makes recommendations and progress feel personal without turning ExploBook into an audiobook/social-media product.

The official ElevenLabs Text to Speech API supports lifelike speech with nuanced intonation/pacing and can stream audio. The official Node SDK is `@elevenlabs/elevenlabs-js`.

## 2. Voice experiences

### A. Recommendation Preview — P0/P1

User sees:

`🔊 Listen why this book was chosen`

Gemma produces a short explanation. Server sends it to ElevenLabs. Browser receives audio reference/stream.

Target length: 20–45 seconds.

### B. 60-second Book Preview — P1

Gemma produces a non-spoiler introduction:
- what the book is about
- why it matches the reader
- expected difficulty
- what kind of reading experience to expect

Do not generate copyrighted book text.

### C. Orb Story — P1

After completion, ElevenLabs narrates a 10–20 second story about the earned Orb.

### D. Journey Recap — P1

After several books, Gemma creates a short recap of the user's reading journey. ElevenLabs narrates it.

## 3. Audio pipeline

```text
Gemma text
  ↓
length/safety validation
  ↓
SHA-256 cache key
  ↓
voice cache lookup
  ↓ miss
ElevenLabs TTS
  ↓
store audio / object reference
  ↓
return playback URL/reference
```

## 4. Server-side security

- ElevenLabs API key only on backend.
- Never send provider key to browser.
- Limit text length.
- Rate-limit user generation requests.
- Cache repeated content.
- Store provider request ID and character cost where available.

## 5. Suggested voice presets

Maintain configuration rather than hard-code voice IDs:

```ts
{
  recommendation: { voiceId, modelId },
  orbStory: { voiceId, modelId },
  journeyRecap: { voiceId, modelId }
}
```

Use one consistent primary voice for product identity and optionally a second voice for special experiences.

## 6. UX rules

- Audio button is secondary to the book title and Start Reading CTA.
- Never autoplay.
- Show loading state.
- Allow pause/stop.
- If TTS fails, recommendation remains usable.
- Do not add voice to the Grass Mode timer; the purpose of Grass Mode is to put the phone down.
