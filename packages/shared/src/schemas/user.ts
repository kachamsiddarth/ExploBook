import { z } from 'zod';

export const UserSchema = z.object({
  id: z.string().min(1),
  clerkUserId: z.string().min(1),
  email: z.string().email(),
  displayName: z.string().min(1),
  createdAt: z.string().or(z.date()).optional(),
  updatedAt: z.string().or(z.date()).optional(),
});

export type User = z.infer<typeof UserSchema>;

export const AuthMeResponseSchema = z.object({
  user: UserSchema,
  readerProfile: z.record(z.unknown()).optional(),
});

export type AuthMeResponse = z.infer<typeof AuthMeResponseSchema>;
