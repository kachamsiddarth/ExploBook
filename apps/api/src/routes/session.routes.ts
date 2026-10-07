import { Router, type Request, type Response } from 'express';
import { requireAuth } from '../middleware/auth.middleware.js';
import { readingSessionRepository } from '../repositories/reading-session.repository.js';
import { bookRepository } from '../repositories/book.repository.js';
import { readerProfileRepository } from '../repositories/reader-profile.repository.js';
import { progressionService } from '../services/progression.service.js';
import {
  StartReadingSessionInputSchema,
  CompleteReadingSessionInputSchema,
} from '@explobook/shared';
import { ObjectId } from 'mongodb';

const sessionRouter = Router();

// 1. POST /api/v1/sessions/start - Begin a reading session
sessionRouter.post('/start', requireAuth, async (req: Request, res: Response): Promise<void> => {
  try {
    const user = (req as any).user;
    const parseResult = StartReadingSessionInputSchema.safeParse(req.body);
    if (!parseResult.success) {
      res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid session input',
          details: parseResult.error.flatten(),
        },
      });
      return;
    }

    const { bookId, initialPagesRead } = parseResult.data;
    const book = await bookRepository.findById(bookId);
    if (!book) {
      res.status(404).json({
        success: false,
        error: {
          code: 'BOOK_NOT_FOUND',
          message: `Book not found with ID ${bookId}`,
        },
      });
      return;
    }

    // Check if active session already exists; if so, return it
    const active = await readingSessionRepository.findActiveByUserId(user._id);
    if (active) {
      res.status(200).json({
        success: true,
        data: readingSessionRepository.toDomain(active),
        resumed: true,
      });
      return;
    }

    const doc = await readingSessionRepository.create({
      userId: user._id,
      bookId: book._id!,
      pagesRead: initialPagesRead,
    });

    res.status(201).json({
      success: true,
      data: readingSessionRepository.toDomain(doc),
      resumed: false,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    res.status(500).json({
      success: false,
      error: { code: 'SERVER_ERROR', message: msg },
    });
  }
});

// 2. GET /api/v1/sessions/active - Get current active reading session
sessionRouter.get('/active', requireAuth, async (req: Request, res: Response): Promise<void> => {
  try {
    const user = (req as any).user;
    const active = await readingSessionRepository.findActiveByUserId(user._id);
    if (!active) {
      res.status(200).json({ success: true, data: null });
      return;
    }
    res.status(200).json({
      success: true,
      data: readingSessionRepository.toDomain(active),
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    res.status(500).json({
      success: false,
      error: { code: 'SERVER_ERROR', message: msg },
    });
  }
});

// 3. POST /api/v1/sessions/:id/complete - Complete reading session with reflection
sessionRouter.post('/:id/complete', requireAuth, async (req: Request, res: Response): Promise<void> => {
  try {
    const user = (req as any).user;
    const sessionId = String(req.params.id);

    const parseResult = CompleteReadingSessionInputSchema.safeParse(req.body);
    if (!parseResult.success) {
      res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid reflection submission',
          details: parseResult.error.flatten(),
        },
      });
      return;
    }

    const session = await readingSessionRepository.findById(sessionId);
    if (!session) {
      res.status(404).json({
        success: false,
        error: { code: 'SESSION_NOT_FOUND', message: 'Session not found' },
      });
      return;
    }

    if (session.userId.toString() !== user._id.toString()) {
      res.status(403).json({
        success: false,
        error: { code: 'FORBIDDEN', message: 'Not authorized for this session' },
      });
      return;
    }

    const { pagesRead, durationSeconds, reflection } = parseResult.data;
    const now = new Date();
    const finalDurationSeconds =
      durationSeconds !== undefined
        ? durationSeconds
        : Math.max(60, Math.floor((now.getTime() - session.startedAt.getTime()) / 1000));
    const finalPages = pagesRead !== undefined ? pagesRead : session.pagesRead;

    // Calculate reading XP deterministically
    const readingXp = progressionService.calculateReadingSessionXP({
      pagesRead: finalPages,
      reflectionLength: reflection.takeaways.length,
    });

    // Update reading session document
    const updated = await readingSessionRepository.update(session._id!, {
      status: 'COMPLETED',
      pagesRead: finalPages,
      durationSeconds: finalDurationSeconds,
      reflection: {
        ...reflection,
        submittedAt: now.toISOString(),
      },
      completedAt: now,
    });

    // Update reader stats
    const profile = await readerProfileRepository.findByUserId(user._id);
    const prevXP = profile?.stats?.xp || 0;
    const prevLevel = profile?.stats?.level || 1;
    const newTotalXp = prevXP + readingXp;
    const newLevel = progressionService.calculateLevel(newTotalXp);

    await readerProfileRepository.addStatsAndXP(user._id, {
      xpGained: readingXp,
      readingSeconds: finalDurationSeconds,
      newLevel,
    });

    res.status(200).json({
      success: true,
      data: {
        session: updated ? readingSessionRepository.toDomain(updated) : null,
        xpAwarded: readingXp,
        newTotalXp,
        newLevel,
        leveledUp: newLevel > prevLevel,
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

// 4. GET /api/v1/sessions/history - List user reading history
sessionRouter.get('/history', requireAuth, async (req: Request, res: Response): Promise<void> => {
  try {
    const user = (req as any).user;
    const limit = Math.min(50, Number(req.query.limit) || 20);
    const sessions = await readingSessionRepository.findByUserId(user._id, limit);

    res.status(200).json({
      success: true,
      data: sessions.map((s) => readingSessionRepository.toDomain(s)),
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    res.status(500).json({
      success: false,
      error: { code: 'SERVER_ERROR', message: msg },
    });
  }
});

export default sessionRouter;
