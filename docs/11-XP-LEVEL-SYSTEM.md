# 11 — XP, Levels and Progression

## 1. XP sources

```text
Book completion                  +100
Reading commitment bonus        +0–80
Reflection completion            +25
High-quality reflection         +0–40
Vocabulary growth                +0–30
Reading mission                  +25–100
Streak milestone                 +25–100
Difficulty stretch               +0–50
```

XP is calculated by deterministic application code.

## 2. Anti-gaming rules

- XP is not awarded repeatedly for the same session.
- Timer duration alone cannot generate unlimited XP.
- Browser-side XP values are never trusted.
- Abnormally long sessions can be flagged for review but should not automatically accuse the user of cheating.
- Mission rewards are one-time.

## 3. Level curve

Use a simple increasing threshold rather than exponential grinding:

```text
Level 1  — Curious Reader      0 XP
Level 2  — Page Explorer       250 XP
Level 3  — Story Seeker        600 XP
Level 4  — Book Wanderer       1,050 XP
Level 5  — Avid Reader         1,600 XP
Level 6  — Deep Reader         2,300 XP
Level 7  — Scholar             3,150 XP
Level 8  — Bibliophile         4,200 XP
Level 9  — Literary Voyager   5,500 XP
Level 10 — Grandmaster         7,000 XP
```

Future levels can extend the same curve.

## 4. Level-up behavior

When crossing a threshold:
- update level.
- show level-up UI.
- optionally award a cosmetic frame/title.
- do not remove XP.

## 5. Streak

A streak is a sequence of calendar days with a qualifying reading session. A qualifying session is at least 5 minutes or a completed book reflection, configurable by product policy.

Store dates in the user's configured timezone, not server timezone.
