import { z } from 'zod';

export const OrbRaritySchema = z.enum([
  'COMMON',
  'UNCOMMON',
  'RARE',
  'EPIC',
  'LEGENDARY',
]);

export type OrbRarity = z.infer<typeof OrbRaritySchema>;

export const OrbSchema = z.object({
  id: z.string(),
  userId: z.string(),
  bookId: z.string(),
  expeditionId: z.string(),
  title: z.string().min(2).max(100),
  rarity: OrbRaritySchema.default('COMMON'),
  theme: z.string().min(2).max(100),
  essenceQuote: z.string().min(5).max(400),
  colorHex: z.string().regex(/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/).default('#4a7c59'),
  earnedAt: z.string().or(z.date()),
  createdAt: z.string().or(z.date()).optional(),
});

export type Orb = z.infer<typeof OrbSchema>;

export const ProgressionUpdateResultSchema = z.object({
  xpGained: z.number().int().nonnegative(),
  newTotalXp: z.number().int().nonnegative(),
  previousLevel: z.number().int().positive(),
  newLevel: z.number().int().positive(),
  leveledUp: z.boolean(),
  orbAwarded: OrbSchema.optional(),
  grassRatio: z.number().nonnegative(),
});

export type ProgressionUpdateResult = z.infer<typeof ProgressionUpdateResultSchema>;
