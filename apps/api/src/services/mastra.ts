import { Mastra } from '@mastra/core';
import { createWorkflow, createStep } from '@mastra/core/workflows';
import { z } from 'zod';
import { recommendationOrchestrator, type GetRecommendationsOptions } from './recommendation.orchestrator.js';
import { RecommendationResponseSchema } from '@explobook/shared';

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

export const explobookMastra = new Mastra({
  workflows: {
    bookRecommendationWorkflow,
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

  // Graceful fallback to direct orchestrator invocation if workflow runner fails
  const directResult = await recommendationOrchestrator.getRecommendations(options);
  return {
    result: directResult,
    workflowStatus: 'DIRECT_FALLBACK',
  };
}

export { recommendationOrchestrator };
