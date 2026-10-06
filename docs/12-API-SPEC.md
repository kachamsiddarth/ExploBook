# 12 — REST API Specification

Base path: `/api/v1`

## Auth / Identity

Authentication is handled by Clerk. There are no application-owned register/login/logout endpoints.

### `GET /auth/me`
Requires a valid Clerk session. Returns the local ExploBook user/profile plus the Clerk user ID.

The browser obtains its authenticated session through Clerk. Requests to the Express API carry the Clerk session/token, and the backend verifies it before accessing user-owned resources.

## Reader

### `GET /reader/profile`
Returns Reader DNA and stats.

### `PUT /reader/profile`
Updates onboarding preferences.

### `GET /reader/history`
Query: `page`, `limit`.

### `GET /reader/orbs`
Query: `page`, `limit`, `rarity`.

## Books

### `GET /books/:bookId`

### `GET /books/search`
Query: `q`, `genre`, `difficulty`, `minPages`, `maxPages`.

### `GET /books/:bookId/availability`
Optional SerpApi-backed external links.

## Recommendations

### `POST /recommendations/generate`
Starts recommendation workflow.

Response:
```json
{
  "recommendationId": "...",
  "book": { "id": "...", "title": "..." },
  "explanation": "...",
  "reasons": ["..."],
  "voiceAvailable": true
}
```

### `GET /recommendations/current`
Returns latest active recommendation.

### `POST /recommendations/:id/accept`
Marks recommendation as accepted and optionally creates reading intent.

## Voice

### `POST /voice/recommendation`
Body: `{ recommendationId }`

### `POST /voice/orb-story`
Body: `{ orbId }`

### `POST /voice/journey-recap`
Body: `{ bookIds?: string[] }`

All voice generation is server-side.

## Reading sessions

### `POST /reading-sessions`
Body: `{ bookId }`
Response: `{ sessionId, startedAt, status }`.

### `GET /reading-sessions/:sessionId`

### `POST /reading-sessions/:sessionId/stop`
Server computes duration from timestamps.

## Reviews

### `POST /reviews`
Body:
```json
{
  "sessionId": "...",
  "rating": 4.5,
  "difficulty": 7,
  "favoriteAspect": "...",
  "reflection": "...",
  "moral": "...",
  "wouldRecommend": true,
  "learnedWords": ["..."]
}
```

Creating a valid review for a completed session triggers the completion workflow.

### `GET /reviews/:reviewId`

## Missions

### `GET /missions/current`

### `POST /missions/:missionId/complete`

## Errors

All errors follow:

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Human-readable message",
    "requestId": "...",
    "details": {}
  }
}
```

Suggested codes:
`UNAUTHENTICATED`, `FORBIDDEN`, `NOT_FOUND`, `VALIDATION_ERROR`, `CONFLICT`, `AI_UNAVAILABLE`, `VOICE_UNAVAILABLE`, `SEARCH_UNAVAILABLE`, `RATE_LIMITED`, `INTERNAL_ERROR`.
