import { Router } from 'express';
import { requireAuth } from '../middleware/auth.middleware.js';
import { readerProfileRepository } from '../repositories/reader-profile.repository.js';

const readerRouter = Router();

// GET /api/v1/reader/profile - Get Reader DNA and profile for authenticated user
readerRouter.get('/profile', requireAuth, async (req, res, next) => {
  try {
    const { user, readerProfile } = req.authContext!;

    res.status(200).json({
      success: true,
      data: {
        userId: user._id?.toString(),
        genres: readerProfile.genres,
        goals: readerProfile.goals,
        difficultyPreference: readerProfile.difficultyPreference,
        preferredLength: readerProfile.preferredLength,
        availableMinutesPerSession: readerProfile.availableMinutesPerSession,
        language: readerProfile.language,
        dna: readerProfile.dna,
        stats: readerProfile.stats,
      },
    });
  } catch (err) {
    next(err);
  }
});

// PUT /api/v1/reader/profile - Update reader preferences
readerRouter.put('/profile', requireAuth, async (req, res, next) => {
  try {
    const { user } = req.authContext!;
    const { genres, goals, difficultyPreference, preferredLength, availableMinutesPerSession } = req.body;

    const update: any = {};
    if (Array.isArray(genres)) update.genres = genres;
    if (Array.isArray(goals)) update.goals = goals;
    if (difficultyPreference) update.difficultyPreference = difficultyPreference;
    if (preferredLength) update.preferredLength = preferredLength;
    if (typeof availableMinutesPerSession === 'number') update.availableMinutesPerSession = availableMinutesPerSession;

    const updatedProfile = await readerProfileRepository.update(user._id!, update);

    res.status(200).json({
      success: true,
      data: updatedProfile,
    });
  } catch (err) {
    next(err);
  }
});

export default readerRouter;
