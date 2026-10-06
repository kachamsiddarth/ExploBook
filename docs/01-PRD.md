# 01 — Product Requirements Document

## 1. Product statement

**ExploBook helps people build a real-world reading habit by using AI to choose the next book, explain why it fits, guide reflection after reading, and reward completed reading journeys—while deliberately minimizing screen time during the actual reading session.**

## 2. Problem

Readers often spend substantial time deciding what to read, browsing recommendations, and consuming content about books instead of reading books. Existing book platforms optimize for discovery, ratings and social engagement; ExploBook optimizes for **selection → physical reading → reflection → continued reading**.

## 3. Target users

### Primary
- Students and young adults trying to build a consistent reading habit.
- Casual readers who do not know what book to choose next.
- Readers improving English vocabulary through books.
- Readers who enjoy progression systems and collectibles.

### Secondary
- Book clubs and reading communities.
- Users who want personalized book discovery without a social-feed experience.

## 4. Product principles

1. **AI gets out of the way.**
2. **The screen is shortest during reading.**
3. **Recommendations are grounded in known books, not hallucinated titles.**
4. **Deterministic calculations stay in code; semantic interpretation belongs to Gemma.**
5. **One completed book produces one Orb.**
6. **Progress reflects quality and difficulty, not only quantity.**
7. **Voice enhances discovery/reflection; it does not replace reading.**

## 5. Core features

### P0 — required MVP
- Authentication.
- Reader onboarding.
- Multi-genre selection.
- Reading goals, difficulty and available-time preferences.
- Reader DNA.
- Curated/verified book catalogue.
- Gemma-powered recommendation.
- Recommendation explanation.
- Optional voice recommendation using ElevenLabs.
- Start Reading.
- Infinite reading timer.
- Stop session.
- Reflection questionnaire.
- Rating and difficulty feedback.
- Gemma review analysis.
- Vocabulary extraction.
- XP calculation.
- Level progression.
- One Orb per completed book.
- Reading history.
- Next recommendation cycle.

### P1 — strong differentiators
- Grass Mode.
- Reading streaks.
- Procedural Orb visuals.
- Orb collection.
- Reader DNA visualization.
- Personalized 60-second voice preview.
- Voice Orb story.
- Reading missions/expeditions.
- Purchase/search links.
- MongoDB Vector Search.
- Sentry tracing.

### P2 — optional stretch
- Outdoor reading missions.
- Shareable Orb cards.
- Public-domain in-app reading for selected works.
- Book-club mode.
- Multilingual voice preview.
- Fine-tuned Gemma experiment using Tinker.
- Temporal durable workflows if future scope requires long-running orchestration.

## 6. Reader journey

### First visit
1. Landing page.
2. Sign up / log in.
3. Select genres.
4. Select reading goals.
5. Select difficulty.
6. Select preferred book length and available time.
7. Generate Reader DNA.
8. Show first recommendation.

### Book cycle
1. User receives recommendation.
2. User reads Gemma's reason.
3. User can listen to a short voice explanation.
4. User opens book details.
5. User optionally gets purchase links.
6. User starts reading.
7. UI switches to Grass Mode.
8. Infinite timer runs until user stops.
9. User submits reflection.
10. Gemma analyzes the reflection.
11. System updates Reader DNA.
12. System awards XP.
13. System generates one Orb.
14. System updates level/streak.
15. Gemma selects the next recommendation.

## 7. Success metrics

### Product
- Recommendation acceptance rate.
- Book completion rate.
- Median reading-session duration.
- Percentage of users completing a second book.
- Reflection completion rate.
- 7-day reading streak rate.

### AI
- Recommendation groundedness rate.
- Recommendation relevance score from evaluation set.
- Structured-output validity rate.
- Hallucinated-book rate: target 0% for verified catalogue IDs.
- Average Gemma latency.

### Challenge/demo
- User can understand the product in under 30 seconds.
- Demo clearly shows AI → human reading → AI loop.
- Reading screen visibly minimizes interaction.
- Partner technologies are visible in meaningful workflows.

## 8. Out of scope

- Full copyrighted book hosting.
- General social media feed.
- General-purpose conversational assistant.
- AI-generated fake books presented as real books.
- Automatic purchase/payment processing.
- Medical/psychological claims based on reading behavior.
