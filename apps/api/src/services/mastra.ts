import { Mastra } from '@mastra/core';
import { createWorkflow, createStep } from '@mastra/core/workflows';
import { z } from 'zod';
import { recommendationOrchestrator, type GetRecommendationsOptions } from './recommendation.orchestrator.js';
import { expeditionService } from './expedition.service.js';
import { reflectionService } from './reflection.service.js';
import { progressionService } from './progression.service.js';
import { serpApiService, EXPEDITION_TYPE_TO_QUERY } from './serpapi.service.js';
import { bookRepository } from '../repositories/book.repository.js';
import { readerProfileRepository } from '../repositories/reader-profile.repository.js';
import { expeditionRepository } from '../repositories/expedition.repository.js';
import { orbRepository } from '../repositories/orb.repository.js';
import {
  RecommendationResponseSchema,
  ExpeditionSchema,
  ProgressionUpdateResultSchema,
  type Expedition,
  type ProgressionUpdateResult,
  type ExpeditionType,
} from '@explobook/shared';

// STEP 1: Recommendation Workflow Step
const recommendationWorkflowStep = (createStep as any)({
  id: 'orchestrate-book-recommendations',
  inputSchema: z.object({
    query: z.string().optional(),
    genre: z.string().optional(),
    limit: z.number().optional(),
  }),
  outputSchema: RecommendationResponseSchema,
  execute: async (params: any) => {
    const input =
      params?.inputData ??
      params?.context?.inputData ??
      params?.input ??
      params?.context?.input ??
      params?.context ??
      params ??
      {};
    return recommendationOrchestrator.getRecommendations(input as GetRecommendationsOptions);
  },
});

export const bookRecommendationWorkflow = createWorkflow({
  id: 'book-recommendation-workflow',
  description: 'Mastra workflow coordinating vector retrieval, reader DNA, and Gemma grounding for books',
  inputSchema: z.object({
    query: z.string().optional(),
    genre: z.string().optional(),
    limit: z.number().optional(),
  }),
  outputSchema: RecommendationResponseSchema,
})
  .then(recommendationWorkflowStep)
  .commit();

// STEP 2: Expedition Generation Workflow Step
const expeditionGenerationWorkflowStep = (createStep as any)({
  id: 'orchestrate-expedition-generation',
  inputSchema: z.object({
    userId: z.string(),
    bookId: z.string(),
    readingSessionId: z.string().optional(),
    availableMinutes: z.number().optional(),
    preferredType: z.string().optional(),
    location: z.object({
      latitude: z.number(),
      longitude: z.number(),
    }).optional(),
  }),
  outputSchema: ExpeditionSchema,
  execute: async (params: any) => {
    const input =
      params?.inputData ??
      params?.context?.inputData ??
      params?.input ??
      params?.context?.input ??
      params?.context ??
      params ??
      {};

    const book = await bookRepository.findById(input.bookId);
    if (!book) {
      throw new Error(`Book not found: ${input.bookId}`);
    }

    const readerProfile = await readerProfileRepository.findByUserId(input.userId);

    // SerpApi place discovery when location is provided
    let nearbyPlace: import('@explobook/shared').ExpeditionPlace | undefined;
    if (input.location?.latitude !== undefined && input.location?.longitude !== undefined) {
      const expeditionType = (input.preferredType as string | undefined) ?? 'DISCOVERY';
      const placeQuery = EXPEDITION_TYPE_TO_QUERY[expeditionType] ?? 'parks near me';

      const candidates = await serpApiService.searchNearbyPlaces({
        latitude: input.location.latitude,
        longitude: input.location.longitude,
        query: placeQuery,
      });

      if (candidates.length > 0) {
        // Use the first (highest-ranked) SerpApi candidate
        nearbyPlace = candidates[0];
        console.info(`[Mastra/Expedition]: SerpApi found ${candidates.length} place(s). Using: ${nearbyPlace.name}`);
      } else {
        console.info('[Mastra/Expedition]: SerpApi returned no candidates. Generating generic expedition.');
      }
    }

    const concept = await expeditionService.generateExpeditionConcept(
      book,
      readerProfile || undefined,
      {
        availableMinutes: input.availableMinutes,
        preferredType: input.preferredType as ExpeditionType | undefined,
        nearbyPlace,
      }
    );

    const expeditionDoc = await expeditionRepository.create({
      userId: input.userId,
      bookId: book._id!,
      readingSessionId: input.readingSessionId,
      type: concept.type,
      title: concept.title,
      durationMinutes: concept.durationMinutes,
      objective: concept.objective,
      instructions: concept.instructions,
      bookConnection: concept.bookConnection,
      place: nearbyPlace,
    });

    return expeditionRepository.toDomain(expeditionDoc);
  },
});

export const expeditionGenerationWorkflow = createWorkflow({
  id: 'expedition-generation-workflow',
  description: 'Mastra workflow generating a real-world expedition from book themes and reader DNA using Gemma. Optionally discovers nearby places via SerpApi.',
  inputSchema: z.object({
    userId: z.string(),
    bookId: z.string(),
    readingSessionId: z.string().optional(),
    availableMinutes: z.number().optional(),
    preferredType: z.string().optional(),
    location: z.object({
      latitude: z.number(),
      longitude: z.number(),
    }).optional(),
  }),
  outputSchema: ExpeditionSchema,
})
  .then(expeditionGenerationWorkflowStep)
  .commit();

// STEP 3: Expedition Completion & Reflection Workflow Step
const expeditionCompletionWorkflowStep = (createStep as any)({
  id: 'orchestrate-expedition-completion',
  inputSchema: z.object({
    expeditionId: z.string(),
    userId: z.string(),
    notes: z.string(),
    observedDetails: z.array(z.string()).optional(),
    surprises: z.string().optional(),
  }),
  outputSchema: ProgressionUpdateResultSchema,
  execute: async (params: any) => {
    const input =
      params?.inputData ??
      params?.context?.inputData ??
      params?.input ??
      params?.context?.input ??
      params?.context ??
      params ??
      {};

    const expedition = await expeditionRepository.findById(input.expeditionId);
    if (!expedition) {
      throw new Error(`Expedition not found: ${input.expeditionId}`);
    }

    if (expedition.userId.toString() !== input.userId) {
      throw new Error('Unauthorized to complete this expedition');
    }

    const book = await bookRepository.findById(expedition.bookId);
    if (!book) {
      throw new Error(`Book not found: ${expedition.bookId}`);
    }

    const reflectionInput = {
      notes: input.notes,
      observedDetails: input.observedDetails,
      surprises: input.surprises,
      submittedAt: new Date().toISOString(),
    };

    // 1. Analyze reflection via Gemma
    const analysis = await reflectionService.analyzeExpeditionReflection(
      expedition,
      book,
      reflectionInput
    );

    // 2. Deterministic XP calculation
    const durationMinutes = expedition.durationMinutes || 25;
    const xpGained = progressionService.calculateExpeditionXP({
      durationMinutes,
      reflectionLength: input.notes.length,
      observedCount: input.observedDetails?.length || 0,
    });

    // 3. Deterministic Orb rarity & creation
    const rarity = progressionService.determineOrbRarity({
      reflectionLength: input.notes.length,
      observationsCount: input.observedDetails?.length || 0,
    });

    const orbTitle = analysis.orbTitleIdea || `Essence of ${book.title}`;
    const orbTheme = analysis.orbThemeIdea || book.themes[0] || 'Discovery';
    const orbColor = progressionService.getOrbColor(rarity, orbTheme);

    const orbDoc = await orbRepository.create({
      userId: expedition.userId,
      bookId: expedition.bookId,
      expeditionId: expedition._id!,
      title: orbTitle,
      rarity,
      theme: orbTheme,
      essenceQuote: input.notes.slice(0, 200),
      colorHex: orbColor,
    });

    // 4. Update expedition state to COMPLETED
    await expeditionRepository.update(expedition._id!, {
      status: 'COMPLETED',
      completedAt: new Date(),
      reflection: reflectionInput,
      reflectionAnalysis: analysis,
      xpAwarded: xpGained,
      orbId: orbDoc._id,
    });

    // 5. Update user profile stats & progression
    const outdoorSeconds = durationMinutes * 60;
    const profile = await readerProfileRepository.findByUserId(expedition.userId);
    const prevXP = profile?.stats?.xp || 0;
    const prevLevel = profile?.stats?.level || 1;
    const newTotalXp = prevXP + xpGained;
    const newLevel = progressionService.calculateLevel(newTotalXp);
    const leveledUp = newLevel > prevLevel;

    await readerProfileRepository.addStatsAndXP(expedition.userId, {
      xpGained,
      outdoorSeconds,
      newLevel,
    });

    // 6. Evolve Reader DNA from analysis deltas
    if (analysis.suggestedDnaDelta && Object.keys(analysis.suggestedDnaDelta).length > 0) {
      await readerProfileRepository.updateDNA(expedition.userId, analysis.suggestedDnaDelta);
    }

    const updatedProfile = await readerProfileRepository.findByUserId(expedition.userId);
    const grassRatio = progressionService.calculateGrassRatio(
      updatedProfile?.stats?.totalOutdoorSeconds || outdoorSeconds,
      updatedProfile?.stats?.totalReadingSeconds || 60
    );

    const result: ProgressionUpdateResult = {
      xpGained,
      newTotalXp,
      previousLevel: prevLevel,
      newLevel,
      leveledUp,
      orbAwarded: orbRepository.toDomain(orbDoc),
      grassRatio,
    };

    return result;
  },
});

export const expeditionCompletionWorkflow = createWorkflow({
  id: 'expedition-completion-workflow',
  description: 'Mastra workflow analyzing real-world reflection, awarding deterministic XP, minting Orb and updating Reader DNA',
  inputSchema: z.object({
    expeditionId: z.string(),
    userId: z.string(),
    notes: z.string(),
    observedDetails: z.array(z.string()).optional(),
    surprises: z.string().optional(),
  }),
  outputSchema: ProgressionUpdateResultSchema,
})
  .then(expeditionCompletionWorkflowStep)
  .commit();

export const explobookMastra = new Mastra({
  workflows: {
    bookRecommendationWorkflow,
    expeditionGenerationWorkflow,
    expeditionCompletionWorkflow,
  },
});

/**
 * Executes book recommendations strictly via the registered Mastra workflow engine.
 */
export async function executeRecommendationWorkflow(
  options: GetRecommendationsOptions
): Promise<{ result: any; workflowStatus: string }> {
  try {
    const workflow = explobookMastra.getWorkflow('bookRecommendationWorkflow');
    if (!workflow) {
      throw new Error('bookRecommendationWorkflow not found on Mastra hub');
    }

    const run = await workflow.createRun();
    const runResult = await run.start({
      inputData: {
        query: options.query,
        genre: options.genre,
        limit: options.limit,
      },
    });

    const stepResult = (runResult.steps?.['orchestrate-book-recommendations'] as any)?.output;
    if (stepResult) {
      return {
        result: stepResult,
        workflowStatus: 'EXECUTED',
      };
    }
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.warn(`[Mastra]: Workflow execution encountered error (${msg}), using direct orchestrator.`);
  }

  const directResult = await recommendationOrchestrator.getRecommendations(options);
  return {
    result: directResult,
    workflowStatus: 'DIRECT_FALLBACK',
  };
}

/**
 * Executes expedition generation workflow via Mastra.
 */
export async function executeExpeditionGenerationWorkflow(input: {
  userId: string;
  bookId: string;
  readingSessionId?: string;
  availableMinutes?: number;
  preferredType?: string;
  location?: { latitude: number; longitude: number };
}): Promise<{ result: Expedition; workflowStatus: string }> {
  try {
    const workflow = explobookMastra.getWorkflow('expeditionGenerationWorkflow');
    if (!workflow) {
      throw new Error('expeditionGenerationWorkflow not found on Mastra hub');
    }

    const run = await workflow.createRun();
    const runResult = await run.start({ inputData: input });
    const stepResult = (runResult.steps?.['orchestrate-expedition-generation'] as any)?.output;
    if (stepResult) {
      return {
        result: stepResult,
        workflowStatus: 'EXECUTED',
      };
    }
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.warn(`[Mastra]: Expedition workflow error (${msg}), using direct creation.`);
  }

  // Fallback to direct service invocation
  const book = await bookRepository.findById(input.bookId);
  if (!book) throw new Error(`Book not found: ${input.bookId}`);

  const readerProfile = await readerProfileRepository.findByUserId(input.userId);

  // SerpApi place discovery in fallback path too
  let nearbyPlace: import('@explobook/shared').ExpeditionPlace | undefined;
  if (input.location?.latitude !== undefined && input.location?.longitude !== undefined) {
    const expeditionType = input.preferredType ?? 'DISCOVERY';
    const placeQuery = EXPEDITION_TYPE_TO_QUERY[expeditionType] ?? 'parks near me';
    const candidates = await serpApiService.searchNearbyPlaces({
      latitude: input.location.latitude,
      longitude: input.location.longitude,
      query: placeQuery,
    });
    if (candidates.length > 0) nearbyPlace = candidates[0];
  }

  const concept = await expeditionService.generateExpeditionConcept(
    book,
    readerProfile || undefined,
    {
      availableMinutes: input.availableMinutes,
      preferredType: input.preferredType as ExpeditionType | undefined,
      nearbyPlace,
    }
  );

  const doc = await expeditionRepository.create({
    userId: input.userId,
    bookId: book._id!,
    readingSessionId: input.readingSessionId,
    type: concept.type,
    title: concept.title,
    durationMinutes: concept.durationMinutes,
    objective: concept.objective,
    instructions: concept.instructions,
    bookConnection: concept.bookConnection,
    place: nearbyPlace,
  });

  return {
    result: expeditionRepository.toDomain(doc),
    workflowStatus: 'DIRECT_FALLBACK',
  };
}

/**
 * Executes expedition completion and reflection workflow via Mastra.
 */
export async function executeExpeditionCompletionWorkflow(input: {
  expeditionId: string;
  userId: string;
  notes: string;
  observedDetails?: string[];
  surprises?: string;
}): Promise<{ result: ProgressionUpdateResult; workflowStatus: string }> {
  try {
    const workflow = explobookMastra.getWorkflow('expeditionCompletionWorkflow');
    if (!workflow) {
      throw new Error('expeditionCompletionWorkflow not found on Mastra hub');
    }

    const run = await workflow.createRun();
    const runResult = await run.start({ inputData: input });
    const stepResult = (runResult.steps?.['orchestrate-expedition-completion'] as any)?.output;
    if (stepResult) {
      return {
        result: stepResult,
        workflowStatus: 'EXECUTED',
      };
    }
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.warn(`[Mastra]: Completion workflow error (${msg}), executing direct completion.`);
  }

  // Direct completion execution if workflow runner caught an exception
  const expedition = await expeditionRepository.findById(input.expeditionId);
  if (!expedition) throw new Error(`Expedition not found: ${input.expeditionId}`);

  const book = await bookRepository.findById(expedition.bookId);
  if (!book) throw new Error(`Book not found: ${expedition.bookId}`);

  const reflectionInput = {
    notes: input.notes,
    observedDetails: input.observedDetails,
    surprises: input.surprises ? (Array.isArray(input.surprises) ? input.surprises.join('; ') : String(input.surprises)) : undefined,
    submittedAt: new Date().toISOString(),
  };

  const analysis = await reflectionService.analyzeExpeditionReflection(
    expedition,
    book,
    reflectionInput
  );

  const durationMinutes = expedition.durationMinutes || 25;
  const xpGained = progressionService.calculateExpeditionXP({
    durationMinutes,
    reflectionLength: input.notes.length,
    observedCount: input.observedDetails?.length || 0,
  });

  const rarity = progressionService.determineOrbRarity({
    reflectionLength: input.notes.length,
    observationsCount: input.observedDetails?.length || 0,
  });

  const orbDoc = await orbRepository.create({
    userId: expedition.userId,
    bookId: expedition.bookId,
    expeditionId: expedition._id!,
    title: analysis.orbTitleIdea || `Essence of ${book.title}`,
    rarity,
    theme: analysis.orbThemeIdea || book.themes[0] || 'Discovery',
    essenceQuote: input.notes.slice(0, 200),
    colorHex: progressionService.getOrbColor(rarity),
  });

  await expeditionRepository.update(expedition._id!, {
    status: 'COMPLETED',
    completedAt: new Date(),
    reflection: reflectionInput,
    reflectionAnalysis: analysis,
    xpAwarded: xpGained,
    orbId: orbDoc._id,
  });

  const profile = await readerProfileRepository.findByUserId(expedition.userId);
  const prevXP = profile?.stats?.xp || 0;
  const prevLevel = profile?.stats?.level || 1;
  const newTotalXp = prevXP + xpGained;
  const newLevel = progressionService.calculateLevel(newTotalXp);

  await readerProfileRepository.addStatsAndXP(expedition.userId, {
    xpGained,
    outdoorSeconds: durationMinutes * 60,
    newLevel,
  });

  if (analysis.suggestedDnaDelta && Object.keys(analysis.suggestedDnaDelta).length > 0) {
    await readerProfileRepository.updateDNA(expedition.userId, analysis.suggestedDnaDelta);
  }

  const updatedProfile = await readerProfileRepository.findByUserId(expedition.userId);
  const grassRatio = progressionService.calculateGrassRatio(
    updatedProfile?.stats?.totalOutdoorSeconds || durationMinutes * 60,
    updatedProfile?.stats?.totalReadingSeconds || 60
  );

  return {
    result: {
      xpGained,
      newTotalXp,
      previousLevel: prevLevel,
      newLevel,
      leveledUp: newLevel > prevLevel,
      orbAwarded: orbRepository.toDomain(orbDoc),
      grassRatio,
    },
    workflowStatus: 'DIRECT_FALLBACK',
  };
}

export { recommendationOrchestrator };
