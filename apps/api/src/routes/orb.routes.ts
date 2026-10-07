import { Router, type Request, type Response } from 'express';
import { requireAuth } from '../middleware/auth.middleware.js';
import { orbRepository } from '../repositories/orb.repository.js';

const orbRouter = Router();

// GET /api/v1/orbs - Get all Orbs earned by authenticated user
orbRouter.get('/', requireAuth, async (req: Request, res: Response): Promise<void> => {
  try {
    const user = (req as any).user;
    const docs = await orbRepository.findByUserId(user._id);

    res.status(200).json({
      success: true,
      data: docs.map((d) => orbRepository.toDomain(d)),
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    res.status(500).json({
      success: false,
      error: { code: 'SERVER_ERROR', message: msg },
    });
  }
});

export default orbRouter;
