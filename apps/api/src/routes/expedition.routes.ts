import { Router, type Request, type Response } from 'express';
import { requireAuth } from '../middleware/auth.middleware.js';
import { expeditionRepository } from '../repositories/expedition.repository.js';
import { bookRepository } from '../repositories/book.repository.js';
import {
  executeExpeditionGenerationWorkflow,
  executeExpeditionCompletionWorkflow,
} from '../services/mastra.js';
import {
  GenerateExpeditionInputSchema,
  SubmitExpeditionReflectionInputSchema,
} from '@explobook/shared';

const expeditionRouter = Router();

// 1. POST /api/v1/expeditions/generate - Generate an expedition using Mastra workflow & Gemma
expeditionRouter.post('/generate', requireAuth, async (req: Request, res: Response): Promise<void> => {
  try {
    const user = (req as any).user;
    const parseResult = GenerateExpeditionInputSchema.safeParse(req.body);
    if (!parseResult.success) {
      res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid expedition request parameters',
          details: parseResult.error.flatten(),
        },
      });
      return;
    }

    const { bookId, readingSessionId, availableMinutes, preferredType } = parseResult.data;

    // Check if user already has an active expedition
    const existingActive = await expeditionRepository.findCurrentByUserId(user._id);
    if (existingActive) {
      res.status(200).json({
        success: true,
        data: expeditionRepository.toDomain(existingActive),
        resumed: true,
      });
      return;
    }

    const { result, workflowStatus } = await executeExpeditionGenerationWorkflow({
      userId: user._id.toString(),
      bookId,
      readingSessionId,
      availableMinutes,
      preferredType,
    });

    res.status(201).json({
      success: true,
      data: result,
      meta: { workflowStatus },
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    res.status(500).json({
      success: false,
      error: { code: 'SERVER_ERROR', message: msg },
    });
  }
});

// 2. GET /api/v1/expeditions/current - Get current active/ongoing expedition
expeditionRouter.get('/current', requireAuth, async (req: Request, res: Response): Promise<void> => {
  try {
    const user = (req as any).user;
    const current = await expeditionRepository.findCurrentByUserId(user._id);
    if (!current) {
      res.status(200).json({ success: true, data: null });
      return;
    }

    res.status(200).json({
      success: true,
      data: expeditionRepository.toDomain(current),
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    res.status(500).json({
      success: false,
      error: { code: 'SERVER_ERROR', message: msg },
    });
  }
});

// 3. POST /api/v1/expeditions/:id/start - Step away / Grass Mode initiated
expeditionRouter.post('/:id/start', requireAuth, async (req: Request, res: Response): Promise<void> => {
  try {
    const user = (req as any).user;
    const expeditionId = String(req.params.id);

    const expedition = await expeditionRepository.findById(expeditionId);
    if (!expedition) {
      res.status(404).json({
        success: false,
        error: { code: 'EXPEDITION_NOT_FOUND', message: 'Expedition not found' },
      });
      return;
    }

    if (expedition.userId.toString() !== user._id.toString()) {
      res.status(403).json({
        success: false,
        error: { code: 'FORBIDDEN', message: 'Not authorized for this expedition' },
      });
      return;
    }

    const updated = await expeditionRepository.update(expedition._id!, {
      status: 'AWAY',
      startedAt: new Date(),
    });

    res.status(200).json({
      success: true,
      data: updated ? expeditionRepository.toDomain(updated) : null,
      message: 'Expedition started. Put your phone in your pocket and step outside.',
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    res.status(500).json({
      success: false,
      error: { code: 'SERVER_ERROR', message: msg },
    });
  }
});

// 4. POST /api/v1/expeditions/:id/return - User returns from outside
expeditionRouter.post('/:id/return', requireAuth, async (req: Request, res: Response): Promise<void> => {
  try {
    const user = (req as any).user;
    const expeditionId = String(req.params.id);

    const expedition = await expeditionRepository.findById(expeditionId);
    if (!expedition) {
      res.status(404).json({
        success: false,
        error: { code: 'EXPEDITION_NOT_FOUND', message: 'Expedition not found' },
      });
      return;
    }

    if (expedition.userId.toString() !== user._id.toString()) {
      res.status(403).json({
        success: false,
        error: { code: 'FORBIDDEN', message: 'Not authorized for this expedition' },
      });
      return;
    }

    const updated = await expeditionRepository.update(expedition._id!, {
      status: 'REFLECTION_PENDING',
    });

    res.status(200).json({
      success: true,
      data: updated ? expeditionRepository.toDomain(updated) : null,
      message: 'Welcome back. Describe what you discovered outside.',
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    res.status(500).json({
      success: false,
      error: { code: 'SERVER_ERROR', message: msg },
    });
  }
});

// 5. POST /api/v1/expeditions/:id/reflection - Submit reflection & complete via Mastra workflow
expeditionRouter.post('/:id/reflection', requireAuth, async (req: Request, res: Response): Promise<void> => {
  try {
    const user = (req as any).user;
    const expeditionId = String(req.params.id);

    const parseResult = SubmitExpeditionReflectionInputSchema.safeParse(req.body);
    if (!parseResult.success) {
      res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid reflection format',
          details: parseResult.error.flatten(),
        },
      });
      return;
    }

    const { notes, observedDetails, surprises } = parseResult.data;

    const { result, workflowStatus } = await executeExpeditionCompletionWorkflow({
      expeditionId,
      userId: user._id.toString(),
      notes,
      observedDetails,
      surprises,
    });

    res.status(200).json({
      success: true,
      data: result,
      meta: { workflowStatus },
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    res.status(500).json({
      success: false,
      error: { code: 'SERVER_ERROR', message: msg },
    });
  }
});

// 6. GET /api/v1/expeditions/history - User history of completed expeditions
expeditionRouter.get('/history', requireAuth, async (req: Request, res: Response): Promise<void> => {
  try {
    const user = (req as any).user;
    const limit = Math.min(50, Number(req.query.limit) || 20);
    const docs = await expeditionRepository.findByUserId(user._id, limit);

    res.status(200).json({
      success: true,
      data: docs.map((d) => expeditionRepository.toDomain(d)),
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    res.status(500).json({
      success: false,
      error: { code: 'SERVER_ERROR', message: msg },
    });
  }
});

export default expeditionRouter;
