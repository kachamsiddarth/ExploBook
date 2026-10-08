import { z } from 'zod';
import { BookSchema } from './book.js';

export const RecommendationRequestSchema = z.object({
  query: z.string().optional(),
  genre: z.string().optional(),
  limit: z.number().int().min(1).max(10).default(3),
  excludeBookIds: z.array(z.string()).optional(),
});

export type RecommendationRequest = z.infer<typeof RecommendationRequestSchema>;

export const GroundedReasoningSchema = z.object({
  explanation: z.string().min(1),
  touchGrassReason: z.string().min(1),
  suggestedAtmosphere: z.string().optional(),
});

export type GroundedReasoning = z.infer<typeof GroundedReasoningSchema>;

export const BookRecommendationItemSchema = z.object({
  book: BookSchema,
  score: z.number().optional(),
  reasoning: GroundedReasoningSchema,
});

export type BookRecommendationItem = z.infer<typeof BookRecommendationItemSchema>;

export const RecommendationResponseSchema = z.object({
  recommendations: z.array(BookRecommendationItemSchema),
  source: z.enum(['vector_search', 'reader_dna', 'catalogue_fallback']),
  retrievalMethod: z.enum(['atlas_vector_search', 'in_memory_cosine_fallback', 'database_filter_fallback']),
  gemmaStatus: z.enum(['gemma_grounded', 'fallback_offline', 'failed']),
  modelUsed: z.string(),
});

export type RecommendationResponse = z.infer<typeof RecommendationResponseSchema>;
