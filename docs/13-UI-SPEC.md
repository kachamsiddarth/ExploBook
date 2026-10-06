# 13 — Page-by-Page UI Specification

## Visual direction

Reference direction: warm ivory/cream background, charcoal sections, muted gold accent, editorial typography, thin rules, generous whitespace, large book-cover imagery and literary-magazine composition.

Suggested tokens:

```css
--paper: #F3EED7;
--ink: #292728;
--muted: #777164;
--accent: #B6A46A;
--paper-2: #E9E2C7;
--white: #FFFDF5;
```

Exact values can be refined during implementation; the visual system should remain warm, restrained and editorial.

## 1. Landing `/`

Sections:
- Navbar.
- Hero: `READ MORE. SCROLL LESS.`
- Short product statement.
- CTA: `BEGIN YOUR READING JOURNEY`.
- Visual Orb/book composition.
- `How it works` three-step story.
- `Touch Grass` section.
- Featured Orb gallery.
- Footer.

## 2. Login `/login`

Minimal editorial authentication page. Avoid SaaS-heavy cards.

## 3. Onboarding `/onboarding`

Progressive steps:
1. Genres.
2. Goals.
3. Difficulty.
4. Preferred length.
5. Available reading time.
6. Language.
7. Generate Reader DNA.

## 4. Home `/home`

Primary dashboard:
- Reader level.
- XP bar.
- Current streak.
- Total books.
- Total reading time.
- Current Orb collection preview.
- `YOUR NEXT ADVENTURE` recommendation.

## 5. Recommendation `/recommendation`

Large book cover, title, author, metadata, Gemma explanation, reasons, difficulty, page count, `🔊 Listen`, purchase links and `START READING`.

## 6. Reading `/reading/:sessionId`

Grass Mode:
- Minimal UI.
- Infinite timer.
- Book title.
- Start/stop state.
- No feed.
- No chat.
- No distracting navigation.

## 7. Reflection `/reflection/:sessionId`

- Rating.
- Difficulty.
- Favorite aspect.
- Moral/meaning.
- Reflection.
- New vocabulary.
- Would recommend.
- Submit.

## 8. Completion `/completion/:sessionId`

- Book completed.
- Reading time.
- XP earned.
- Level progress.
- Orb reveal.
- Orb traits.
- `🔊 Hear Orb Story`.
- Next recommendation.

## 9. Orbs `/orbs`

Gallery with filters by rarity and genre/theme.

## 10. Orb detail `/orbs/:orbId`

Large procedural Orb visual, book source, rarity, traits, statistics and optional voice story.

## 11. History `/history`

Editorial timeline of completed books and sessions.

## 12. Reader DNA `/profile`

- Genre affinity.
- Theme affinity.
- Difficulty.
- Vocabulary level.
- Reading pace.
- Current level.
- Streak.
- Completed books.

## 13. Missions `/missions`

Current mission, completed missions and rewards.

## UI state rules

Every asynchronous AI/voice action needs:
- loading state.
- success state.
- provider-unavailable state.
- retry state.
- no-data state.

Never block core reading functionality because ElevenLabs or SerpApi is unavailable.
