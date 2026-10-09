import { Router, type Request, type Response } from 'express';
import { requireAuth } from '../middleware/auth.middleware.js';
import { readerProfileRepository } from '../repositories/reader-profile.repository.js';
import { readingSessionRepository } from '../repositories/reading-session.repository.js';
import { expeditionRepository } from '../repositories/expedition.repository.js';
import { orbRepository } from '../repositories/orb.repository.js';
import { progressionService } from '../services/progression.service.js';

const dashboardRouter = Router();

/**
 * GET /api/v1/dashboard
 * Aggregate reader dashboard data in a single request.
 * Returns:
 * - Reader DNA + stats + level + grass ratio
 * - Active reading session (if any)
 * - Current expedition (if any)
 * - Most recent orb (if any)
 */
dashboardRouter.get('/', requireAuth, async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.authContext?.user._id;
    if (!userId) {
      res.status(401).json({
        success: false,
        error: {
          code: 'UNAUTHENTICATED',
          message: 'Valid Clerk authentication token is required.',
        },
      });
      return;
    }

    // Fetch all needed data in parallel
    const [profile, activeSession, currentExpedition, orbs] = await Promise.all([
      readerProfileRepository.findByUserId(userId),
      readingSessionRepository.findActiveByUserId(userId),
      expeditionRepository.findCurrentByUserId(userId),
      orbRepository.findByUserId(userId),
    ]);

    const stats = profile?.stats ?? {
      booksCompleted: 0,
      totalReadingSeconds: 0,
      totalOutdoorSeconds: 0,
      xp: 0,
      level: 1,
      currentStreak: 0,
      longestStreak: 0,
      averageRating: 0,
    };

    const grassRatio = progressionService.calculateGrassRatio(
      stats.totalOutdoorSeconds || 0,
      stats.totalReadingSeconds || 0
    );

    const xpToNextLevel = computeXpToNextLevel(stats.xp || 0, stats.level || 1);

    res.status(200).json({
      success: true,
      data: {
        profile: profile
          ? {
              genres: profile.genres,
              goals: profile.goals,
              difficultyPreference: profile.difficultyPreference,
              availableMinutesPerSession: profile.availableMinutesPerSession,
              dna: profile.dna,
            }
          : null,
        stats: {
          ...stats,
          grassRatio,
          xpToNextLevel,
        },
        activeSession: activeSession
          ? readingSessionRepository.toDomain(activeSession)
          : null,
        currentExpedition: currentExpedition
          ? expeditionRepository.toDomain(currentExpedition)
          : null,
        recentOrb: orbs.length > 0
          ? orbRepository.toDomain(orbs[0])
          : null,
        orbCount: orbs.length,
      },
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    res.status(500).json({
      success: false,
      error: { code: 'SERVER_ERROR', message: msg },
    });
  }
});

/**
 * Compute the XP needed to reach the next level.
 */
function computeXpToNextLevel(currentXp: number, currentLevel: number): number {
  const thresholds = [0, 200, 500, 900, 1400];
  if (currentLevel < thresholds.length) {
    return thresholds[currentLevel] - currentXp;
  }
  // Formula-based: next boundary = ((level)^2) * 100
  const nextThreshold = Math.pow(currentLevel, 2) * 100;
  return Math.max(0, nextThreshold - currentXp);
}

export default dashboardRouter;
