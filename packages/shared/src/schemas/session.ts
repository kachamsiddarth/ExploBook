import { z } from 'zod';

export const ReadingSessionStatusSchema = z.enum([
  'ACTIVE',
  'PAUSED',
  'COMPLETED',
  'ABANDONED',
]);

export type ReadingSessionStatus = z.infer<typeof ReadingSessionStatusSchema>;

export const ReadingReflectionSchema = z.object({
  id: z.string().optional(),
  quoteOrPassage: z.string().max(1000).optional(),
  takeaways: z.string().min(5).max(3000),
  moodRating: z.number().int().min(1).max(5).optional(),
  outdoorReadLocation: z.string().optional(),
  pagesRead: z.number().int().nonnegative().optional(),
  submittedAt: z.string().or(z.date()).optional(),
});

export type ReadingReflection = z.infer<typeof ReadingReflectionSchema>;

export const ReadingSessionSchema = z.object({
  id: z.string(),
  userId: z.string(),
  bookId: z.string(),
  status: ReadingSessionStatusSchema.default('ACTIVE'),
  pagesRead: z.number().int().nonnegative().default(0),
  durationSeconds: z.number().int().nonnegative().default(0),
  reflection: ReadingReflectionSchema.optional(),
  startedAt: z.string().or(z.date()),
  pausedAt: z.string().or(z.date()).optional(),
  completedAt: z.string().or(z.date()).optional(),
  createdAt: z.string().or(z.date()).optional(),
  updatedAt: z.string().or(z.date()).optional(),
});

export type ReadingSession = z.infer<typeof ReadingSessionSchema>;

export const StartReadingSessionInputSchema = z.object({
  bookId: z.string().min(1),
  initialPagesRead: z.number().int().nonnegative().optional().default(0),
});

export type StartReadingSessionInput = z.infer<typeof StartReadingSessionInputSchema>;

export const CompleteReadingSessionInputSchema = z.object({
  pagesRead: z.number().int().nonnegative().optional(),
  durationSeconds: z.number().int().nonnegative().optional(),
  reflection: ReadingReflectionSchema,
});

export type CompleteReadingSessionInput = z.infer<typeof CompleteReadingSessionInputSchema>;
