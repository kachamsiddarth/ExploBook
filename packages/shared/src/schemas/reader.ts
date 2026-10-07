import { z } from 'zod';

export const ExplorationProfileSchema = z.object({
  natureAffinity: z.number().min(0).max(1).default(0.5),
  walkingAffinity: z.number().min(0).max(1).default(0.5),
  discoveryAffinity: z.number().min(0).max(1).default(0.5),
  historicalAffinity: z.number().min(0).max(1).default(0.5),
  observationAffinity: z.number().min(0).max(1).default(0.5),
  quietPlaceAffinity: z.number().min(0).max(1).default(0.5),
});

export type ExplorationProfile = z.infer<typeof ExplorationProfileSchema>;

export const ReaderDNASchema = z.object({
  genreAffinity: z.record(z.string(), z.number()).default({}),
  themeAffinity: z.record(z.string(), z.number()).default({}),
  difficultyScore: z.number().min(1).max(10).default(5),
  pacingPreference: z.number().min(1).max(10).default(5),
  reflectionScore: z.number().default(0),
  vocabularyLevel: z.string().default('intermediate'),
  preferredPageRange: z.object({
    min: z.number().default(100),
    max: z.number().default(400),
  }).default({ min: 100, max: 400 }),
  explorationProfile: ExplorationProfileSchema.default({
    natureAffinity: 0.5,
    walkingAffinity: 0.5,
    discoveryAffinity: 0.5,
    historicalAffinity: 0.5,
    observationAffinity: 0.5,
    quietPlaceAffinity: 0.5,
  }),
  updatedAt: z.string().or(z.date()).optional(),
});

export type ReaderDNA = z.infer<typeof ReaderDNASchema>;

export const ReaderStatsSchema = z.object({
  booksCompleted: z.number().default(0),
  totalReadingSeconds: z.number().default(0),
  totalOutdoorSeconds: z.number().default(0),
  averageRating: z.number().default(0),
  currentStreak: z.number().default(0),
  longestStreak: z.number().default(0),
  xp: z.number().default(0),
  level: z.number().default(1),
});

export type ReaderStats = z.infer<typeof ReaderStatsSchema>;

export const ReaderProfileSchema = z.object({
  id: z.string().min(1),
  userId: z.string().min(1),
  genres: z.array(z.string()).default([]),
  goals: z.array(z.string()).default([]),
  difficultyPreference: z.enum(['beginner', 'intermediate', 'advanced', 'expert']).default('intermediate'),
  preferredLength: z.object({
    minPages: z.number().default(100),
    maxPages: z.number().default(400),
  }).default({ minPages: 100, maxPages: 400 }),
  availableMinutesPerSession: z.number().default(30),
  language: z.string().default('en'),
  dna: ReaderDNASchema,
  stats: ReaderStatsSchema,
  createdAt: z.string().or(z.date()).optional(),
  updatedAt: z.string().or(z.date()).optional(),
});

export type ReaderProfile = z.infer<typeof ReaderProfileSchema>;
