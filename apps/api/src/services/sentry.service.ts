/**
 * Sentry telemetry initializer for ExploBook API.
 *
 * Captures meaningful workflow errors only.
 * NEVER captures:
 * - raw user reflections
 * - API keys or secrets
 * - precise GPS coordinates
 * - personal identifying information beyond clerkUserId
 */

import * as Sentry from '@sentry/node';

const SENTRY_DSN = process.env.SENTRY_DSN;
const isDevelopment = process.env.NODE_ENV !== 'production';

// Only initialize if DSN is set and not a placeholder
const isConfigured = Boolean(
  SENTRY_DSN &&
  !SENTRY_DSN.includes('placeholder') &&
  !SENTRY_DSN.includes('sentry.io/0')
);

if (isConfigured) {
  Sentry.init({
    dsn: SENTRY_DSN,
    environment: process.env.SENTRY_ENVIRONMENT || 'development',
    release: `explobook-api@${process.env.npm_package_version || '0.1.0'}`,
    tracesSampleRate: isDevelopment ? 1.0 : 0.1,

    // Prevent capturing any sensitive data
    beforeSend(event) {
      // Strip request bodies (may contain reflections/personal data)
      if (event.request) {
        delete event.request.data;
        delete event.request.cookies;
      }
      return event;
    },
  });
}

/**
 * Named error event types for ExploBook workflow failures.
 * Use these instead of generic console.error for trackable failures.
 */
export const SentryEvents = {
  EXPEDITION_GENERATION_FAILED: 'expedition_generation_failed',
  PLACE_SEARCH_FAILED: 'place_search_failed',
  GEMMA_VALIDATION_FAILED: 'gemma_validation_failed',
  VOICE_GENERATION_FAILED: 'voice_generation_failed',
  REFLECTION_ANALYSIS_FAILED: 'reflection_analysis_failed',
  RECOMMENDATION_FAILED: 'recommendation_failed',
  EMBEDDING_FAILED: 'embedding_failed',
  VECTOR_SEARCH_FAILED: 'vector_search_failed',
  READER_DNA_UPDATE_FAILED: 'reader_dna_update_failed',
} as const;

export type SentryEventType = (typeof SentryEvents)[keyof typeof SentryEvents];

/**
 * Capture a structured workflow error in Sentry.
 * Only accepts safe, non-sensitive metadata.
 */
export function captureWorkflowError(
  eventType: SentryEventType,
  error: unknown,
  safeContext?: {
    userId?: string;
    bookId?: string;
    expeditionId?: string;
    sessionId?: string;
    workflowStep?: string;
    fallbackUsed?: boolean;
    modelName?: string;
  }
): void {
  if (!isConfigured) return;

  const err = error instanceof Error ? error : new Error(String(error));

  Sentry.withScope((scope) => {
    scope.setTag('event_type', eventType);
    scope.setTag('service', 'explobook-api');

    if (safeContext) {
      // Only attach safe, non-personal identifiers
      if (safeContext.userId) scope.setTag('user_id', safeContext.userId);
      if (safeContext.bookId) scope.setTag('book_id', safeContext.bookId);
      if (safeContext.expeditionId) scope.setTag('expedition_id', safeContext.expeditionId);
      if (safeContext.sessionId) scope.setTag('session_id', safeContext.sessionId);
      if (safeContext.workflowStep) scope.setTag('workflow_step', safeContext.workflowStep);
      if (safeContext.fallbackUsed !== undefined) {
        scope.setTag('fallback_used', String(safeContext.fallbackUsed));
      }
      if (safeContext.modelName) scope.setTag('model', safeContext.modelName);
    }

    scope.setLevel('error');
    Sentry.captureException(err);
  });
}

export { Sentry, isConfigured as sentryIsConfigured };
