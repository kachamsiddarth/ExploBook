# 05 — MongoDB Database Schema

## Collections

### `users`
```ts
{
  _id: ObjectId,
  clerkUserId: string,
  email: string,
  displayName: string,
  createdAt: Date,
  updatedAt: Date
}
```
Indexes: unique `clerkUserId`; unique `email` when present.

### `readerProfiles`
```ts
{
  _id: ObjectId,
  userId: ObjectId,
  genres: string[],
  goals: string[],
  difficultyPreference: 'beginner'|'intermediate'|'advanced'|'expert',
  preferredLength: { minPages: number, maxPages: number },
  availableMinutesPerSession?: number,
  language: string,
  dna: {
    genreAffinity: Record<string, number>,
    themeAffinity: Record<string, number>,
    difficultyScore: number,
    pacingPreference: number,
    reflectionScore: number,
    vocabularyLevel: string,
    preferredPageRange: { min: number, max: number },
    updatedAt: Date
  },
  stats: {
    booksCompleted: number,
    totalReadingSeconds: number,
    averageRating: number,
    currentStreak: number,
    longestStreak: number,
    xp: number,
    level: number
  },
  createdAt: Date,
  updatedAt: Date
}
```
Indexes: unique `userId`.

### `books`
```ts
{
  _id: ObjectId,
  externalIds: {
    isbn10?: string,
    isbn13?: string,
    openLibraryId?: string,
    googleBooksId?: string
  },
  title: string,
  subtitle?: string,
  authors: string[],
  description: string,
  genres: string[],
  themes: string[],
  language: string,
  pageCount?: number,
  publicationYear?: number,
  difficultyScore: number, // 1-10
  publicDomain: boolean,
  coverImageUrl?: string,
  source: 'seed'|'openlibrary'|'googlebooks'|'manual'|'other',
  metadataQuality: number,
  embedding?: number[],
  embeddingModel?: string,
  embeddingVersion?: string,
  createdAt: Date,
  updatedAt: Date
}
```
Indexes: `genres`, `themes`, `language`, `difficultyScore`, ISBN IDs. Vector index on `embedding`.

### `readingSessions`
```ts
{
  _id: ObjectId,
  userId: ObjectId,
  bookId: ObjectId,
  status: 'ACTIVE'|'COMPLETED'|'ABANDONED',
  startedAt: Date,
  stoppedAt?: Date,
  durationSeconds?: number,
  createdAt: Date,
  updatedAt: Date
}
```
Indexes: `{ userId: 1, startedAt: -1 }`, `{ userId: 1, status: 1 }`.

### `reviews`
```ts
{
  _id: ObjectId,
  userId: ObjectId,
  bookId: ObjectId,
  sessionId: ObjectId,
  rating: number, // 1-5
  difficulty: number, // 1-10
  favoriteAspect?: string,
  reflection?: string,
  moral?: string,
  wouldRecommend?: boolean,
  learnedWords?: string[],
  createdAt: Date,
  aiAnalysis?: {
    themes: string[],
    sentiment: string,
    strengths: string[],
    dislikes: string[],
    inferredPreferences: string[],
    vocabulary: Array<{ word: string, meaning?: string, confidence: number }>,
    model: string,
    promptVersion: string,
    createdAt: Date
  }
}
```
Indexes: `{ userId: 1, createdAt: -1 }`, `{ bookId: 1, userId: 1 }` unique if one review per completed cycle.

### `recommendations`
```ts
{
  _id: ObjectId,
  userId: ObjectId,
  bookId: ObjectId,
  source: 'onboarding'|'post_completion'|'manual',
  candidateIds: ObjectId[],
  deterministicScores?: Array<{ bookId: ObjectId, score: number }>,
  aiRank: number,
  explanation: string,
  reasons: string[],
  model: string,
  promptVersion: string,
  accepted: boolean,
  createdAt: Date
}
```
Indexes: `{ userId: 1, createdAt: -1 }`.

### `vocabulary`
```ts
{
  _id: ObjectId,
  userId: ObjectId,
  word: string,
  normalizedWord: string,
  meaning?: string,
  example?: string,
  sourceBookIds: ObjectId[],
  confidence: number,
  firstSeenAt: Date,
  lastSeenAt: Date,
  mastery: number // 0-100
}
```
Indexes: unique `{ userId: 1, normalizedWord: 1 }`.

### `orbs`
```ts
{
  _id: ObjectId,
  userId: ObjectId,
  bookId: ObjectId,
  sessionId: ObjectId,
  name: string,
  rarity: 'COMMON'|'UNCOMMON'|'RARE'|'EPIC'|'LEGENDARY'|'MYTHIC',
  score: number,
  traits: string[],
  visual: {
    geometry: string,
    rings: number,
    particles: number,
    symbol: string,
    rotationSeed: number,
    patternSeed: number,
    intensity: number
  },
  earnedAt: Date
}
```
Unique index: `{ userId: 1, sessionId: 1 }`.

### `missions`
```ts
{
  _id: ObjectId,
  userId: ObjectId,
  type: 'READ_OUTSIDE'|'NEW_LOCATION'|'PHONE_FREE'|'REFLECTION'|'CONSISTENCY',
  title: string,
  description: string,
  xpReward: number,
  status: 'AVAILABLE'|'COMPLETED'|'EXPIRED',
  createdAt: Date,
  completedAt?: Date
}
```

### `voiceGenerations`
```ts
{
  _id: ObjectId,
  userId: ObjectId,
  purpose: 'RECOMMENDATION'|'ORB_STORY'|'JOURNEY_RECAP',
  sourceHash: string,
  text: string,
  voiceId: string,
  modelId?: string,
  characterCost?: number,
  audioStorageKey?: string,
  providerRequestId?: string,
  createdAt: Date
}
```
Unique cache key can be `{ userId, purpose, sourceHash, voiceId }`.

### `aiRuns`
```ts
{
  _id: ObjectId,
  userId?: ObjectId,
  workflow: string,
  step: string,
  model: string,
  promptVersion: string,
  status: 'RUNNING'|'COMPLETED'|'FAILED',
  latencyMs?: number,
  inputTokens?: number,
  outputTokens?: number,
  providerRequestId?: string,
  errorCode?: string,
  createdAt: Date,
  completedAt?: Date
}
```

## Data ownership rule

Every user-owned collection must carry `userId` (the local MongoDB user `_id`) and every repository method must scope queries by the authenticated Clerk identity resolved to that local user. Never trust a client-supplied user ID.
