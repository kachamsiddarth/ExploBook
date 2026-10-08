/**
 * ExploBook API client
 * All requests go through the Next.js rewrite proxy → Express backend.
 * The Clerk session token is passed via credentials:'include' (cookie-based auth).
 * API keys are NEVER exposed to the frontend.
 */

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ApiError {
  code: string;
  message: string;
  details?: unknown;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: ApiError;
}

export interface ReaderDNA {
  genreAffinity: Record<string, number>;
  themeAffinity: Record<string, number>;
  difficultyScore: number;
  pacingPreference: number;
  reflectionScore: number;
  explorationProfile: {
    natureAffinity: number;
    walkingAffinity: number;
    discoveryAffinity: number;
    historicalAffinity: number;
    observationAffinity: number;
    quietPlaceAffinity: number;
  };
  updatedAt?: string;
}

export interface ReaderStats {
  booksCompleted: number;
  totalReadingSeconds: number;
  totalOutdoorSeconds: number;
  xp: number;
  level: number;
  currentStreak: number;
  longestStreak: number;
  averageRating: number;
  grassRatio?: number;
  xpToNextLevel?: number;
}

export interface ReaderProfile {
  genres: string[];
  goals: string[];
  difficultyPreference: string;
  availableMinutesPerSession: number;
  dna: ReaderDNA;
}

export interface Book {
  _id: string;
  id?: string;
  title: string;
  authors: string[];
  genres: string[];
  themes: string[];
  description: string;
  pageCount?: number;
  language?: string;
  coverImageUrl?: string;
}

export interface ReadingReflection {
  takeaways: string;
  quoteOrPassage?: string;
  moodRating?: number;
  outdoorReadLocation?: string;
}

export interface ReadingSession {
  id: string;
  bookId: string;
  status: 'ACTIVE' | 'PAUSED' | 'COMPLETED' | 'ABANDONED';
  pagesRead: number;
  durationSeconds: number;
  reflection?: ReadingReflection;
  startedAt: string;
  pausedAt?: string;
  completedAt?: string;
}

export interface ExpeditionPlace {
  name: string;
  category?: string;
  address?: string;
  rating?: number;
  mapsUrl?: string;
}

export interface Expedition {
  id: string;
  userId: string;
  bookId: string;
  readingSessionId?: string;
  type: string;
  title: string;
  durationMinutes: number;
  objective: string;
  instructions: string[];
  bookConnection: string;
  place?: ExpeditionPlace;
  status: string;
  reflection?: {
    notes: string;
    observedDetails?: string[];
    surprises?: string;
  };
  reflectionAnalysis?: {
    thematicResonance: string;
    curiositySignals: string[];
    keyObservations: string[];
    suggestedDnaDelta: Record<string, number>;
    orbTitleIdea?: string;
    orbThemeIdea?: string;
  };
  xpAwarded?: number;
  orbId?: string;
  startedAt?: string;
  completedAt?: string;
  createdAt?: string;
}

export interface Orb {
  id: string;
  userId: string;
  bookId: string;
  expeditionId: string;
  title: string;
  rarity: 'COMMON' | 'UNCOMMON' | 'RARE' | 'EPIC' | 'LEGENDARY';
  theme: string;
  essenceQuote: string;
  colorHex: string;
  earnedAt: string;
}

export interface GroundedReasoning {
  explanation: string;
  touchGrassReason: string;
  suggestedAtmosphere?: string;
  summary?: string;
  whyThisBook?: string;
  explorationPotential?: string;
}

export interface Recommendation {
  book: Book;
  score: number;
  reasoning?: GroundedReasoning;
}

export interface DashboardData {
  profile: ReaderProfile | null;
  stats: ReaderStats;
  activeSession: ReadingSession | null;
  currentExpedition: Expedition | null;
  recentOrb: Orb | null;
  orbCount: number;
}

export interface CompletionResult {
  session: ReadingSession | null;
  xpAwarded: number;
  newTotalXp: number;
  newLevel: number;
  leveledUp: boolean;
}

export interface ExpeditionCompletionResult {
  expedition: Expedition;
  xpAwarded: number;
  newTotalXp: number;
  newLevel: number;
  leveledUp: boolean;
  orbAwarded?: Orb;
  grassRatio: number;
  dnaDelta?: Record<string, number>;
  dnaUpdated: boolean;
}

export interface VoiceBriefing {
  audioBase64: string;
  contentType: string;
  script: string;
  cacheHit: boolean;
}

// ─── API Base URL Strategy ───────────────────────────────────────────────────

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

// ─── Core fetch helper ─────────────────────────────────────────────────────────

type TokenGetter = () => Promise<string | null>;
let authTokenGetter: TokenGetter | null = null;

/**
 * Register a function to retrieve the current Clerk session token.
 * Called once at root/component level (e.g. via useAuth().getToken).
 */
export function setAuthTokenGetter(getter: TokenGetter | null): void {
  authTokenGetter = getter;
}

export interface ApiFetchOptions extends RequestInit {
  token?: string | null;
}

export async function apiFetch<T>(
  path: string,
  options: ApiFetchOptions = {}
): Promise<ApiResponse<T>> {
  const { token: explicitToken, ...fetchOptions } = options;

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...((fetchOptions.headers as Record<string, string>) || {}),
  };

  // Attach Clerk JWT Bearer token
  if (!headers['Authorization']) {
    if (explicitToken) {
      headers['Authorization'] = `Bearer ${explicitToken}`;
    } else if (authTokenGetter) {
      try {
        const token = await authTokenGetter();
        if (token) {
          headers['Authorization'] = `Bearer ${token}`;
        }
      } catch {
        // Non-blocking
      }
    }
  }

  // Ensure full backend URL is targeted directly
  const url = path.startsWith('http') ? path : `${API_BASE}${path.startsWith('/') ? '' : '/'}${path}`;

  const res = await fetch(url, {
    ...fetchOptions,
    credentials: 'include',
    headers,
  });

  let body: ApiResponse<T>;
  try {
    body = await res.json();
  } catch {
    return {
      success: false,
      error: { code: 'PARSE_ERROR', message: 'Could not parse server response' },
    };
  }

  return body;
}

// ─── Dashboard ────────────────────────────────────────────────────────────────

export async function getDashboard(): Promise<DashboardData | null> {
  const res = await apiFetch<DashboardData>('/api/v1/dashboard');
  return res.success ? (res.data ?? null) : null;
}

// ─── Reader ───────────────────────────────────────────────────────────────────

export async function getReaderProfile(): Promise<ReaderProfile | null> {
  const res = await apiFetch<ReaderProfile>('/api/v1/reader/profile');
  return res.success ? (res.data ?? null) : null;
}

export async function updateReaderProfile(data: {
  genres?: string[];
  goals?: string[];
  difficultyPreference?: string;
  preferredLength?: string;
  availableMinutesPerSession?: number;
  explorationProfile?: Partial<ReaderDNA['explorationProfile']>;
}): Promise<ReaderProfile | null> {
  const res = await apiFetch<ReaderProfile>('/api/v1/reader/profile', {
    method: 'PUT',
    body: JSON.stringify(data),
  });
  return res.success ? (res.data ?? null) : null;
}

// ─── Books ────────────────────────────────────────────────────────────────────

export async function getBooks(limit = 12): Promise<Book[]> {
  const res = await apiFetch<{ books: Book[] }>(`/api/v1/books?limit=${limit}`);
  if (res.success && res.data) {
    return res.data.books ?? (res.data as unknown as Book[]);
  }
  return [];
}

export async function getBook(id: string): Promise<Book | null> {
  const res = await apiFetch<Book>(`/api/v1/books/${id}`);
  return res.success ? (res.data ?? null) : null;
}

// ─── Recommendations ──────────────────────────────────────────────────────────

export async function getRecommendation(opts?: {
  query?: string;
  genre?: string;
  excludeBookIds?: string[];
}): Promise<{ recommendations: Recommendation[]; retrievalMethod: string; gemmaStatus?: string } | null> {
  const res = await apiFetch<{ recommendations: Recommendation[]; retrievalMethod: string; gemmaStatus?: string }>(
    '/api/v1/recommendations',
    {
      method: 'POST',
      body: JSON.stringify({
        query: opts?.query ?? 'discover something new',
        genre: opts?.genre,
        excludeBookIds: opts?.excludeBookIds,
        limit: 1,
      }),
    }
  );
  return res.success ? (res.data ?? null) : null;
}

// ─── Sessions ────────────────────────────────────────────────────────────────

export async function startSession(bookId: string): Promise<{ session: ReadingSession; resumed: boolean } | null> {
  const res = await apiFetch<ReadingSession>('/api/v1/sessions/start', {
    method: 'POST',
    body: JSON.stringify({ bookId }),
  });
  if (res.success && res.data) {
    return { session: res.data, resumed: (res as any).resumed ?? false };
  }
  return null;
}

export async function getActiveSession(): Promise<ReadingSession | null> {
  const res = await apiFetch<ReadingSession | null>('/api/v1/sessions/active');
  return res.success ? (res.data ?? null) : null;
}

export async function completeSession(
  sessionId: string,
  data: {
    pagesRead?: number;
    durationSeconds?: number;
    reflection: ReadingReflection;
  }
): Promise<CompletionResult | null> {
  const res = await apiFetch<CompletionResult>(`/api/v1/sessions/${sessionId}/complete`, {
    method: 'POST',
    body: JSON.stringify(data),
  });
  return res.success ? (res.data ?? null) : null;
}

export async function getSessionHistory(): Promise<ReadingSession[]> {
  const res = await apiFetch<ReadingSession[]>('/api/v1/sessions/history');
  return res.success ? (res.data ?? []) : [];
}

// ─── Expeditions ──────────────────────────────────────────────────────────────

export async function generateExpedition(data: {
  bookId: string;
  readingSessionId?: string;
  availableMinutes?: number;
  location?: { latitude: number; longitude: number; label?: string };
}): Promise<Expedition | null> {
  const res = await apiFetch<Expedition>('/api/v1/expeditions/generate', {
    method: 'POST',
    body: JSON.stringify(data),
  });
  return res.success ? (res.data ?? null) : null;
}

export async function getCurrentExpedition(): Promise<Expedition | null> {
  const res = await apiFetch<Expedition | null>('/api/v1/expeditions/current');
  return res.success ? (res.data ?? null) : null;
}

export async function startExpedition(expeditionId: string): Promise<Expedition | null> {
  const res = await apiFetch<Expedition>(`/api/v1/expeditions/${expeditionId}/start`, {
    method: 'POST',
  });
  return res.success ? (res.data ?? null) : null;
}

export async function returnFromExpedition(expeditionId: string): Promise<Expedition | null> {
  const res = await apiFetch<Expedition>(`/api/v1/expeditions/${expeditionId}/return`, {
    method: 'POST',
  });
  return res.success ? (res.data ?? null) : null;
}

export async function submitExpeditionReflection(
  expeditionId: string,
  data: {
    notes: string;
    observedDetails?: string[];
    surprises?: string;
  }
): Promise<ExpeditionCompletionResult | null> {
  const res = await apiFetch<ExpeditionCompletionResult>(
    `/api/v1/expeditions/${expeditionId}/reflection`,
    {
      method: 'POST',
      body: JSON.stringify(data),
    }
  );
  return res.success ? (res.data ?? null) : null;
}

export async function getExpeditionHistory(): Promise<Expedition[]> {
  const res = await apiFetch<Expedition[]>('/api/v1/expeditions/history');
  return res.success ? (res.data ?? []) : [];
}

export async function getExpeditionVoice(expeditionId: string): Promise<VoiceBriefing | null> {
  const res = await apiFetch<VoiceBriefing>(`/api/v1/expeditions/${expeditionId}/voice`, {
    method: 'POST',
  });
  return res.success ? (res.data ?? null) : null;
}

// ─── Orbs ─────────────────────────────────────────────────────────────────────

export async function getOrbs(): Promise<Orb[]> {
  const res = await apiFetch<Orb[]>('/api/v1/orbs');
  return res.success ? (res.data ?? []) : [];
}

// ─── Utilities ─────────────────────────────────────────────────────────────────

export function formatDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}

export function formatGrassRatio(ratio: number): string {
  return ratio.toFixed(1) + 'x';
}

export function xpProgressPercent(xp: number, level: number, xpToNext: number): number {
  const thresholds = [0, 200, 500, 900, 1400];
  const levelStart = level <= thresholds.length ? thresholds[level - 1] : Math.pow(level - 1, 2) * 100;
  const levelEnd = levelStart + (xpToNext > 0 ? xpToNext : 1);
  const progress = Math.max(0, Math.min(100, ((xp - levelStart) / (levelEnd - levelStart)) * 100));
  return Math.round(progress);
}

export function orbRarityColor(rarity: string): string {
  const colors: Record<string, string> = {
    COMMON: '#4a7c59',
    UNCOMMON: '#3d7068',
    RARE: '#2b5876',
    EPIC: '#6b4c9a',
    LEGENDARY: '#b8860b',
  };
  return colors[rarity] ?? '#4a7c59';
}

export function dnaLabelMap(): Record<string, string> {
  return {
    natureAffinity: 'Nature',
    walkingAffinity: 'Walking',
    discoveryAffinity: 'Discovery',
    historicalAffinity: 'Historical',
    observationAffinity: 'Observation',
    quietPlaceAffinity: 'Quiet Places',
  };
}
