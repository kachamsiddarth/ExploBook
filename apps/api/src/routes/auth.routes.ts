import { Router } from 'express';
import { requireAuth } from '../middleware/auth.middleware.js';

const authRouter = Router();

// GET /api/v1/auth/me - Resolves authenticated Clerk session to local ExploBook user and profile
authRouter.get('/me', requireAuth, async (req, res) => {
  const { user, readerProfile } = req.authContext!;

  res.status(200).json({
    success: true,
    data: {
      user: {
        id: user._id?.toString(),
        clerkUserId: user.clerkUserId,
        email: user.email,
        displayName: user.displayName,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      },
      readerProfile: readerProfile
        ? {
            id: readerProfile._id?.toString(),
            userId: readerProfile.userId.toString(),
            genres: readerProfile.genres,
            goals: readerProfile.goals,
            difficultyPreference: readerProfile.difficultyPreference,
            preferredLength: readerProfile.preferredLength,
            availableMinutesPerSession: readerProfile.availableMinutesPerSession,
            dna: readerProfile.dna,
            stats: readerProfile.stats,
          }
        : null,
    },
  });
});

export default authRouter;
