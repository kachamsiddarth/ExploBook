# 20 — Hacktoberfest Submission Strategy

## Core story

**AI should not keep you on the screen. It should help you choose what to read, then get out of the way.**

## 60-second demo

1. Open ExploBook.
2. Show Reader DNA.
3. Show `YOUR NEXT ADVENTURE`.
4. Click `🔊 Listen` and play the personalized recommendation.
5. Click `START READING`.
6. Show Grass Mode + timer.
7. Stop the session.
8. Submit a short reflection.
9. Show Gemma analysis.
10. Reveal the generated Orb.
11. Show XP/level update.
12. Show next recommendation.

## Partner evidence

### Gemma
Show:
- model configuration.
- ReaderAgent prompt.
- recommendation/reflection workflow.
- local inference screenshot/log.

### Mastra
Show:
- ReaderAgent.
- tools.
- completion workflow.
- Studio trace/test.

### MongoDB Atlas
Show:
- collections.
- Vector Search index.
- semantic retrieval.

### ElevenLabs
Show:
- recommendation voice.
- Orb story.
- caching/request metadata.

### Sentry
Show:
- recommendation trace.
- provider latency/error.

### SerpApi
Show:
- external book discovery/availability flow.

### Render
Show:
- backend deployment and runtime configuration.

## DEV article structure

1. Problem.
2. Why existing book apps fail to get users reading.
3. ExploBook concept.
4. Architecture diagram.
5. How Gemma is used.
6. How Mastra orchestrates the workflow.
7. MongoDB Vector Search.
8. ElevenLabs voice layer.
9. Grass Mode.
10. Orb/progression system.
11. Challenges encountered.
12. What was learned.
13. Demo GIF/video.
14. Repository/setup.
15. Partner technologies.

## Avoid in article

- Claiming AI generated book facts without grounding.
- Saying the app hosts books that it does not legally host.
- Listing partner technologies without explaining their concrete role.
- Calling Mastra the model.
- Calling MongoDB Vector Search an LLM.
