import { Router } from 'express';
import { requireAuth } from '../middleware/auth.middleware.js';
import { readerProfileRepository } from '../repositories/reader-profile.repository.js';
import { executeRecommendationWorkflow } from '../services/mastra.js';
import { RecommendationRequestSchema } from '@explobook/shared';

const recommendationRouter = Router();

// POST /api/v1/recommendations - Generate grounded book recommendations via Mastra workflow
recommendationRouter.post('/', requireAuth, async (req, res, next) => {
  try {
    const input = RecommendationRequestSchema.parse(req.body);
    const user = req.authContext?.user;

    let readerProfile = undefined;
    if (user?._id) {
      const profileDoc = await readerProfileRepository.findByUserId(user._id);
      if (profileDoc) {
        readerProfile = {
          genres: profileDoc.genres,
          goals: profileDoc.goals,
          dna: profileDoc.dna,
          preferredLength: profileDoc.preferredLength,
        };
      }
    }

    const { result } = await executeRecommendationWorkflow({
      query: input.query,
      genre: input.genre,
      limit: input.limit,
      readerProfile,
    });

    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/v1/recommendations/public - Public / teaser recommendations via Mastra workflow
recommendationRouter.get('/public', async (req, res, next) => {
  try {
    const query = typeof req.query.q === 'string' ? req.query.q : undefined;
    const genre = typeof req.query.genre === 'string' ? req.query.genre : undefined;
    const limit = Math.min(6, Math.max(1, Number(req.query.limit) || 3));

    const { result } = await executeRecommendationWorkflow({
      query,
      genre,
      limit,
    });

    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (err) {
    next(err);
  }
});

export default recommendationRouter;
