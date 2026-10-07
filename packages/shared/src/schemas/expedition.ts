import { z } from 'zod';

export const ExpeditionTypeSchema = z.enum([
  'WANDER',
  'OBSERVATION',
  'NATURE',
  'DISCOVERY',
  'HISTORICAL',
  'LITERARY',
  'MYSTERY',
]);

export type ExpeditionType = z.infer<typeof ExpeditionTypeSchema>;

export const ExpeditionStatusSchema = z.enum([
  'GENERATED',
  'READY',
  'STARTED',
  'AWAY',
  'RETURNED',
  'REFLECTION_PENDING',
  'COMPLETED',
  'CANCELLED',
  'EXPIRED',
]);

export type ExpeditionStatus = z.infer<typeof ExpeditionStatusSchema>;

export const ExpeditionPlaceSchema = z.object({
  placeId: z.string().optional(),
  name: z.string(),
  category: z.string().optional(),
  address: z.string().optional(),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
  rating: z.number().optional(),
  mapsUrl: z.string().optional(),
});

export type ExpeditionPlace = z.infer<typeof ExpeditionPlaceSchema>;

export const ExpeditionReflectionSchema = z.object({
  notes: z.string().min(5).max(3000),
  observedDetails: z.array(z.string()).min(1).max(10).optional(),
  emotionalState: z.string().optional(),
  surprises: z.string().optional(),
  submittedAt: z.string().or(z.date()).optional(),
});

export type ExpeditionReflection = z.infer<typeof ExpeditionReflectionSchema>;

export const ExpeditionReflectionAnalysisSchema = z.object({
  thematicResonance: z.string(),
  curiositySignals: z.array(z.string()).default([]),
  keyObservations: z.array(z.string()).default([]),
  suggestedDnaDelta: z.object({
    natureAffinity: z.number().min(-0.2).max(0.2).optional(),
    walkingAffinity: z.number().min(-0.2).max(0.2).optional(),
    discoveryAffinity: z.number().min(-0.2).max(0.2).optional(),
    historicalAffinity: z.number().min(-0.2).max(0.2).optional(),
    observationAffinity: z.number().min(-0.2).max(0.2).optional(),
    quietPlaceAffinity: z.number().min(-0.2).max(0.2).optional(),
  }).default({}),
  orbTitleIdea: z.string().optional(),
  orbThemeIdea: z.string().optional(),
});

export type ExpeditionReflectionAnalysis = z.infer<typeof ExpeditionReflectionAnalysisSchema>;

export const ExpeditionSchema = z.object({
  id: z.string(),
  userId: z.string(),
  bookId: z.string(),
  readingSessionId: z.string().optional(),
  type: ExpeditionTypeSchema,
  title: z.string().min(3).max(150),
  durationMinutes: z.number().int().min(5).max(180),
  objective: z.string().min(10).max(500),
  instructions: z.array(z.string()).min(2).max(8),
  bookConnection: z.string().min(10).max(600),
  place: ExpeditionPlaceSchema.optional(),
  status: ExpeditionStatusSchema.default('GENERATED'),
  reflection: ExpeditionReflectionSchema.optional(),
  reflectionAnalysis: ExpeditionReflectionAnalysisSchema.optional(),
  xpAwarded: z.number().int().nonnegative().optional(),
  orbId: z.string().optional(),
  startedAt: z.string().or(z.date()).optional(),
  completedAt: z.string().or(z.date()).optional(),
  createdAt: z.string().or(z.date()).optional(),
  updatedAt: z.string().or(z.date()).optional(),
});

export type Expedition = z.infer<typeof ExpeditionSchema>;

export const GenerateExpeditionInputSchema = z.object({
  bookId: z.string().min(1),
  readingSessionId: z.string().optional(),
  availableMinutes: z.number().int().min(5).max(180).optional().default(30),
  preferredType: ExpeditionTypeSchema.optional(),
  location: z.object({
    latitude: z.number().min(-90).max(90),
    longitude: z.number().min(-180).max(180),
    label: z.string().optional(),
  }).optional(),
});

export type GenerateExpeditionInput = z.infer<typeof GenerateExpeditionInputSchema>;

export const SubmitExpeditionReflectionInputSchema = z.object({
  notes: z.string().min(5).max(3000),
  observedDetails: z.array(z.string()).min(1).max(10).optional(),
  surprises: z.string().optional(),
});

export type SubmitExpeditionReflectionInput = z.infer<typeof SubmitExpeditionReflectionInputSchema>;
