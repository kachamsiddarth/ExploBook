import { z } from 'zod';

export const BookExternalIdsSchema = z.object({
  isbn10: z.string().optional(),
  isbn13: z.string().optional(),
  openLibraryId: z.string().optional(),
  googleBooksId: z.string().optional(),
});

export type BookExternalIds = z.infer<typeof BookExternalIdsSchema>;

export const BookSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  subtitle: z.string().optional(),
  authors: z.array(z.string()).min(1),
  description: z.string().min(1),
  genres: z.array(z.string()).min(1),
  themes: z.array(z.string()).default([]),
  language: z.string().default('en'),
  pageCount: z.number().int().positive().optional(),
  publicationYear: z.number().int().optional(),
  difficultyScore: z.number().min(1).max(10).default(5),
  publicDomain: z.boolean().default(false),
  coverImageUrl: z.string().url().optional().or(z.string()),
  source: z.enum(['seed', 'openlibrary', 'googlebooks', 'manual', 'other']).default('seed'),
  metadataQuality: z.number().min(0).max(1).default(1.0),
  externalIds: BookExternalIdsSchema.optional(),
  embedding: z.array(z.number()).optional(),
  embeddingModel: z.string().optional(),
  embeddingVersion: z.string().optional(),
  createdAt: z.string().or(z.date()).optional(),
  updatedAt: z.string().or(z.date()).optional(),
});

export type Book = z.infer<typeof BookSchema>;

export const BookSearchParamsSchema = z.object({
  q: z.string().optional(),
  genre: z.string().optional(),
  difficulty: z.string().or(z.number()).optional(),
  minPages: z.string().or(z.number()).optional(),
  maxPages: z.string().or(z.number()).optional(),
  page: z.string().or(z.number()).optional().default(1),
  limit: z.string().or(z.number()).optional().default(20),
});

export type BookSearchParams = z.infer<typeof BookSearchParamsSchema>;
