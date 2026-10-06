# 10 — Orb System

## 1. Product rule

**One completed book cycle = exactly one Orb.**

Retries, repeated page refreshes and duplicate workflow execution must never produce a second Orb for the same completed session.

## 2. Orb score

All normalized to 0–100:

```text
Book difficulty        30%
Book length             15%
Reading commitment      15%
Reflection quality      15%
Rating                  10%
Vocabulary growth        5%
Consistency              10%
```

### Reading commitment
Use duration relative to book length as a soft signal; never punish short sessions if the user legitimately completed the book.

### Difficulty
Normalize catalogue difficulty 1–10 to 0–100.

### Reflection quality
Use Gemma's structured quality score but clamp it and treat it as one input, not an authority over XP.

## 3. Rarity

```text
0–29    COMMON
30–49   UNCOMMON
50–69   RARE
70–84   EPIC
85–94   LEGENDARY
95–100  MYTHIC
```

## 4. Procedural visual schema

```ts
{
  geometry: 'circle'|'hex'|'diamond'|'spiral'|'orbital',
  rings: 1..5,
  particles: 0..40,
  symbol: string,
  rotationSeed: integer,
  patternSeed: integer,
  intensity: 0..100
}
```

The `patternSeed` should be derived from the completed book/session identity so the same Orb can be reproduced.

## 5. Semantic traits

Gemma chooses:
- Orb name.
- 2–4 traits.
- symbolic concept.
- allowed geometry.

Code determines:
- score.
- rarity.
- XP.
- visual intensity.

## 6. Example

A difficult 500-page philosophy book with a strong reflection and high vocabulary growth might produce:

```text
Name: The Mind's Lantern
Rarity: LEGENDARY
Traits: introspection, curiosity, persistence
Geometry: orbital
Rings: 4
Particles: 27
```

## 7. UI reveal

Orb reveal sequence:
1. Completion acknowledged.
2. XP animation.
3. Orb silhouette appears.
4. Orb resolves.
5. Name + rarity.
6. Traits.
7. Optional ElevenLabs Orb Story.
