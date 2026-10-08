'use client';

/**
 * ExploBook — Phase 6 Complete UI
 *
 * Full product loop:
 * Dashboard → Recommendation → Book → Reading Mode → Reflection →
 * Expedition → Voice Briefing → Grass Mode → Return → Expedition Reflection →
 * XP + Orb → DNA Evolution → Next Recommendation
 *
 * All data comes from the real backend. No hardcoded values.
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { APP_NAME } from '@explobook/shared';
import { Show, SignInButton, UserButton, useUser, useAuth } from '@clerk/nextjs';

import * as api from '../lib/api';
import type {
  DashboardData,
  Book,
  ReadingSession,
  Expedition,
  Recommendation,
  Orb,
  ExpeditionCompletionResult,
  CompletionResult,
  VoiceBriefing,
} from '../lib/api';

// ─── View States ──────────────────────────────────────────────────────────────

type View =
  | 'DASHBOARD'
  | 'RECOMMENDATION'
  | 'BOOK_DETAIL'
  | 'READING'
  | 'BOOK_REFLECTION'
  | 'EXPEDITION_READY'
  | 'GRASS_MODE'
  | 'EXPEDITION_REFLECTION'
  | 'REWARDS'
  | 'HISTORY'
  | 'DNA_VIEW';

// ─── Helpers ─────────────────────────────────────────────────────────────────

function clamp(val: number, min = 0, max = 1): number {
  return Math.max(min, Math.min(max, val));
}

function dnaBar(value: number): string {
  const pct = clamp(value) * 100;
  const filled = Math.round(pct / 10);
  const empty = 10 - filled;
  return '█'.repeat(filled) + '░'.repeat(empty);
}

function elapsedDisplay(startISO: string): string {
  const diff = Math.floor((Date.now() - new Date(startISO).getTime()) / 1000);
  const m = Math.floor(diff / 60);
  const s = diff % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

const EXPEDITION_TYPE_ICONS: Record<string, string> = {
  WANDER: '🚶',
  OBSERVATION: '👁️',
  NATURE: '🌿',
  DISCOVERY: '🔍',
  HISTORICAL: '🏛️',
  LITERARY: '📚',
  MYSTERY: '🔮',
};

const ORB_RARITY_LABEL: Record<string, string> = {
  COMMON: 'Common',
  UNCOMMON: 'Uncommon',
  RARE: 'Rare',
  EPIC: 'Epic',
  LEGENDARY: 'Legendary',
};

// ─── Sub-components ────────────────────────────────────────────────────────────

function LoadingSpinner({ text }: { text: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 gap-4">
      <div className="w-8 h-8 border-2 border-[#B6A46A] border-t-[#292728] rounded-full animate-spin" />
      <p className="text-sm text-[#777164] font-mono">{text}</p>
    </div>
  );
}

function ErrorBanner({ message, onDismiss }: { message: string; onDismiss: () => void }) {
  return (
    <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start justify-between gap-3">
      <p className="text-sm text-red-700">{message}</p>
      <button
        onClick={onDismiss}
        className="text-red-500 hover:text-red-700 text-xs shrink-0"
        aria-label="Dismiss error"
      >
        ✕
      </button>
    </div>
  );
}

function SectionTag({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-block bg-[#E9E2C7] px-3 py-1 rounded text-xs font-mono text-[#777164] mb-3">
      {children}
    </span>
  );
}

function Card({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`border border-[#B6A46A]/30 rounded-xl bg-[#FFFDF5] shadow-sm p-6 md:p-8 ${className}`}>
      {children}
    </div>
  );
}

function PrimaryButton({
  onClick,
  disabled,
  loading,
  loadingText,
  children,
  className = '',
  id,
}: {
  onClick: () => void;
  disabled?: boolean;
  loading?: boolean;
  loadingText?: string;
  children: React.ReactNode;
  className?: string;
  id?: string;
}) {
  return (
    <button
      id={id}
      onClick={onClick}
      disabled={disabled || loading}
      className={`w-full py-3 bg-[#292728] text-[#F3EED7] font-medium rounded-lg hover:bg-[#3D3A3B] transition-colors disabled:opacity-50 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-[#B6A46A] focus:ring-offset-2 ${className}`}
    >
      {loading ? (loadingText || 'Loading...') : children}
    </button>
  );
}

function GreenButton({
  onClick,
  disabled,
  loading,
  loadingText,
  children,
  className = '',
  id,
}: {
  onClick: () => void;
  disabled?: boolean;
  loading?: boolean;
  loadingText?: string;
  children: React.ReactNode;
  className?: string;
  id?: string;
}) {
  return (
    <button
      id={id}
      onClick={onClick}
      disabled={disabled || loading}
      className={`w-full py-3 bg-[#4a7c59] text-white font-medium rounded-lg hover:bg-[#3d6849] transition-colors disabled:opacity-50 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-[#4a7c59] focus:ring-offset-2 ${className}`}
    >
      {loading ? (loadingText || 'Loading...') : children}
    </button>
  );
}

function XPBar({ xp, level, xpToNext }: { xp: number; level: number; xpToNext?: number }) {
  const pct = xpToNext && xpToNext > 0 ? Math.min(100, Math.round(((xp % (xpToNext || 200)) / (xpToNext || 200)) * 100)) : 99;
  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <span className="text-xs font-mono text-[#777164]">LEVEL {level}</span>
        <span className="text-xs font-mono text-[#777164]">{xp.toLocaleString()} XP</span>
      </div>
      <div className="w-full h-2 bg-[#E9E2C7] rounded-full overflow-hidden">
        <div
          className="h-full bg-[#4a7c59] rounded-full transition-all duration-700"
          style={{ width: `${pct}%` }}
        />
      </div>
      {xpToNext !== undefined && xpToNext > 0 && (
        <p className="text-xs text-[#777164] font-mono mt-1">{xpToNext} XP to Level {level + 1}</p>
      )}
    </div>
  );
}

function DNAPanel({ dna }: { dna: api.ReaderDNA }) {
  const labels = api.dnaLabelMap();
  const profile = dna.explorationProfile;
  return (
    <div className="space-y-2">
      {Object.entries(labels).map(([key, label]) => {
        const val = (profile as Record<string, number>)[key] ?? 0.5;
        return (
          <div key={key} className="flex items-center gap-3">
            <span className="text-xs text-[#777164] w-28 shrink-0 font-mono">{label}</span>
            <span className="text-xs font-mono text-[#292728] tracking-tighter">{dnaBar(val)}</span>
            <span className="text-xs text-[#B6A46A] font-mono">{Math.round(val * 100)}</span>
          </div>
        );
      })}
    </div>
  );
}

function OrbDisplay({ orb }: { orb: Orb }) {
  return (
    <div className="flex flex-col items-center text-center">
      <div
        className="w-20 h-20 rounded-full shadow-lg flex items-center justify-center text-2xl mb-3 border-2 border-white/30 transition-transform hover:scale-105"
        style={{ backgroundColor: orb.colorHex }}
        aria-label={`${orb.rarity} orb: ${orb.title}`}
      >
        🔮
      </div>
      <span className="px-2 py-0.5 border border-[#B6A46A]/40 rounded text-xs font-mono uppercase tracking-wider text-[#292728] mb-1">
        {ORB_RARITY_LABEL[orb.rarity] ?? orb.rarity}
      </span>
      <h3 className="text-base font-serif font-bold mt-1">{orb.title}</h3>
      <p className="text-xs text-[#777164] font-mono">Theme: {orb.theme}</p>
    </div>
  );
}

function PlaceCard({ place }: { place: api.ExpeditionPlace }) {
  return (
    <div className="p-4 bg-[#F3EED7] border border-[#B6A46A]/30 rounded-lg flex items-start gap-3">
      <span className="text-2xl mt-0.5" aria-hidden="true">📍</span>
      <div className="text-sm min-w-0">
        <div className="font-semibold text-[#292728]">{place.name}</div>
        {place.category && (
          <div className="text-xs text-[#777164] font-mono">{place.category}</div>
        )}
        {place.address && (
          <div className="text-xs text-[#454240] mt-0.5 break-words">{place.address}</div>
        )}
        {place.rating !== undefined && (
          <div className="text-xs text-[#B6A46A] mt-0.5">
            {'★'.repeat(Math.round(place.rating))} {place.rating.toFixed(1)}
          </div>
        )}
        {place.mapsUrl && (
          <a
            href={place.mapsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-[#4a7c59] hover:underline mt-1 inline-block"
          >
            Open in Maps →
          </a>
        )}
      </div>
    </div>
  );
}

// ─── Main App ─────────────────────────────────────────────────────────────────

export default function HomePage() {
  const { isSignedIn } = useUser();
  const { getToken } = useAuth();

  // ── Application State ──

  const [view, setView] = useState<View>('DASHBOARD');

  // Data
  const [dashboard, setDashboard] = useState<DashboardData | null>(null);
  const [currentBook, setCurrentBook] = useState<Book | null>(null);
  const [recommendation, setRecommendation] = useState<Recommendation | null>(null);
  const [activeSession, setActiveSession] = useState<ReadingSession | null>(null);
  const [currentExpedition, setCurrentExpedition] = useState<Expedition | null>(null);
  const [completionResult, setCompletionResult] = useState<CompletionResult | null>(null);
  const [expeditionResult, setExpeditionResult] = useState<ExpeditionCompletionResult | null>(null);
  const [voiceBriefing, setVoiceBriefing] = useState<VoiceBriefing | null>(null);
  const [historyData, setHistoryData] = useState<{
    sessions: ReadingSession[];
    expeditions: Expedition[];
    orbs: Orb[];
  } | null>(null);

  // UI state
  const [loading, setLoading] = useState(false);
  const [loadingText, setLoadingText] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoadingVoice, setIsLoadingVoice] = useState(false);
  const [locationGranted, setLocationGranted] = useState<boolean | null>(null);
  const [userLocation, setUserLocation] = useState<{ latitude: number; longitude: number } | null>(null);

  // Reading form
  const [reflectionText, setReflectionText] = useState('');
  const [quoteText, setQuoteText] = useState('');
  const [moodRating, setMoodRating] = useState<number>(3);
  const [pagesRead, setPagesRead] = useState<number>(0);

  // Expedition reflection form
  const [expNotes, setExpNotes] = useState('');
  const [expObservations, setExpObservations] = useState('');
  const [expSurprises, setExpSurprises] = useState('');

  // Timer
  const [timerDisplay, setTimerDisplay] = useState('0:00');
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Session duration tracking
  const sessionStartRef = useRef<Date | null>(null);

  // ── Register Clerk token getter for authenticated API requests ──
  useEffect(() => {
    if (isSignedIn) {
      api.setAuthTokenGetter(async () => {
        try {
          return await getToken();
        } catch {
          return null;
        }
      });
      loadDashboard();
    } else {
      api.setAuthTokenGetter(null);
    }
  }, [isSignedIn, getToken]);

  // ── Timer logic ──

  const startTimer = useCallback((startISO?: string) => {
    if (timerRef.current) clearInterval(timerRef.current);
    const startTime = startISO ? new Date(startISO) : new Date();
    sessionStartRef.current = startTime;
    timerRef.current = setInterval(() => {
      setTimerDisplay(elapsedDisplay(startTime.toISOString()));
    }, 1000);
  }, []);

  const stopTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  useEffect(() => {
    return () => stopTimer();
  }, [stopTimer]);

  // ── Helpers ──

  function clearError() {
    setError(null);
  }

  async function loadDashboard() {
    setLoading(true);
    setLoadingText('Loading your reading journey...');
    try {
      const data = await api.getDashboard();
      setDashboard(data);

      // Resume in-progress states
      if (data?.activeSession) {
        setActiveSession(data.activeSession);
        const book = await api.getBook(data.activeSession.bookId);
        setCurrentBook(book);
      }
      if (data?.currentExpedition) {
        setCurrentExpedition(data.currentExpedition);
        const status = data.currentExpedition.status;
        if (status === 'AWAY') {
          setView('GRASS_MODE');
          return;
        }
        if (status === 'REFLECTION_PENDING') {
          setView('EXPEDITION_REFLECTION');
          return;
        }
        if (status === 'READY' || status === 'GENERATED') {
          const book = await api.getBook(data.currentExpedition.bookId);
          setCurrentBook(book);
          setView('EXPEDITION_READY');
          return;
        }
      }
    } catch (e) {
      setError('Could not load dashboard. Please refresh.');
    } finally {
      setLoading(false);
    }
  }

  const [excludedBookIds, setExcludedBookIds] = useState<string[]>([]);

  // ─── ACTIONS ──────────────────────────────────────────────────────────────────

  async function handleGetRecommendation(excludeCurrent = false) {
    setView('RECOMMENDATION');
    setLoading(true);
    setLoadingText('Finding your next book...');

    let nextExclusions = excludedBookIds;
    if (excludeCurrent && recommendation?.book) {
      const currentId = recommendation.book.id || (recommendation.book as any)._id;
      if (currentId && !nextExclusions.includes(currentId)) {
        nextExclusions = [...nextExclusions, currentId];
        setExcludedBookIds(nextExclusions);
      }
    } else if (!excludeCurrent) {
      nextExclusions = [];
      setExcludedBookIds([]);
    }

    setRecommendation(null);
    try {
      const result = await api.getRecommendation({
        query: buildDNAQuery(dashboard?.profile?.dna),
        excludeBookIds: nextExclusions.length > 0 ? nextExclusions : undefined,
      });
      if (result && result.recommendations.length > 0) {
        setRecommendation(result.recommendations[0]);
      } else {
        setError('No recommendation available right now. Try again shortly.');
      }
    } catch {
      setError('Recommendation failed. The AI may be busy — please try again.');
    } finally {
      setLoading(false);
    }
  }

  function buildDNAQuery(dna?: api.ReaderDNA): string {
    if (!dna) return 'discover something new';
    const profile = dna.explorationProfile;
    const traits: string[] = [];
    if (profile.natureAffinity > 0.6) traits.push('nature');
    if (profile.discoveryAffinity > 0.6) traits.push('exploration');
    if (profile.historicalAffinity > 0.6) traits.push('history');
    if (profile.observationAffinity > 0.6) traits.push('observation');
    const genres = dna.genreAffinity
      ? Object.entries(dna.genreAffinity)
          .sort((a, b) => b[1] - a[1])
          .slice(0, 2)
          .map(([g]) => g.toLowerCase())
      : [];
    return [...traits, ...genres, 'thoughtful exploration'].join(' and ') || 'curious exploration';
  }

  async function handleSelectBook(book: Book) {
    setCurrentBook(book);
    setView('BOOK_DETAIL');
  }

  async function handleStartReading() {
    if (!currentBook) return;
    setLoading(true);
    setLoadingText('Starting your reading session...');
    try {
      const result = await api.startSession(currentBook._id || currentBook.id!);
      if (result) {
        setActiveSession(result.session);
        startTimer(result.session.startedAt);
        setView('READING');
      } else {
        setError('Could not start reading session. Please try again.');
      }
    } catch {
      setError('Failed to start session. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  async function handleFinishReading() {
    if (!activeSession) return;
    setView('BOOK_REFLECTION');
    stopTimer();
  }

  async function handleSubmitBookReflection() {
    if (!activeSession || reflectionText.length < 5) return;
    setLoading(true);
    setLoadingText('Saving your reflection...');
    try {
      const durationSeconds = sessionStartRef.current
        ? Math.floor((Date.now() - sessionStartRef.current.getTime()) / 1000)
        : undefined;

      const result = await api.completeSession(activeSession.id, {
        pagesRead: pagesRead || undefined,
        durationSeconds,
        reflection: {
          takeaways: reflectionText,
          quoteOrPassage: quoteText || undefined,
          moodRating,
        },
      });

      if (result) {
        setCompletionResult(result);
        // Generate expedition from the completed session
        await handleGenerateExpedition(activeSession.id);
      } else {
        setError('Could not save reflection. Please try again.');
      }
    } catch {
      setError('Reflection submission failed. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  async function handleGenerateExpedition(sessionId?: string) {
    if (!currentBook) return;
    setLoading(true);
    setLoadingText('Designing your expedition...');
    try {
      const locationData = userLocation
        ? { latitude: userLocation.latitude, longitude: userLocation.longitude, label: 'Current location' }
        : undefined;

      const expedition = await api.generateExpedition({
        bookId: currentBook._id || currentBook.id!,
        readingSessionId: sessionId,
        availableMinutes: dashboard?.profile?.availableMinutesPerSession ?? 30,
        location: locationData,
      });

      if (expedition) {
        setCurrentExpedition(expedition);
        setView('EXPEDITION_READY');
      } else {
        setError('Expedition generation failed. Please try again.');
      }
    } catch {
      setError('Could not generate expedition. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  async function handleLoadVoice() {
    if (!currentExpedition) return;
    setIsLoadingVoice(true);
    try {
      const briefing = await api.getExpeditionVoice(currentExpedition.id);
      if (briefing) {
        setVoiceBriefing(briefing);
      }
    } catch {
      // Voice is non-fatal — expedition continues without it
    } finally {
      setIsLoadingVoice(false);
    }
  }

  function handlePlayVoice() {
    if (!voiceBriefing) return;
    try {
      const audio = new Audio(`data:${voiceBriefing.contentType};base64,${voiceBriefing.audioBase64}`);
      audio.play().catch(() => {});
    } catch {
      // Ignore playback errors
    }
  }

  async function handleRequestLocation() {
    if (!navigator.geolocation) {
      setLocationGranted(false);
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocationGranted(true);
        setUserLocation({ latitude: pos.coords.latitude, longitude: pos.coords.longitude });
      },
      () => setLocationGranted(false),
      { timeout: 8000, maximumAge: 120000 }
    );
  }

  async function handleStartExpedition() {
    if (!currentExpedition) return;
    setLoading(true);
    setLoadingText('Starting expedition...');
    try {
      const updated = await api.startExpedition(currentExpedition.id);
      if (updated) {
        setCurrentExpedition(updated);
        startTimer(new Date().toISOString());
        setView('GRASS_MODE');
      }
    } catch {
      setError('Could not start expedition. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  async function handleReturnFromExpedition() {
    if (!currentExpedition) return;
    setLoading(true);
    try {
      const updated = await api.returnFromExpedition(currentExpedition.id);
      if (updated) {
        setCurrentExpedition(updated);
        stopTimer();
        setView('EXPEDITION_REFLECTION');
      }
    } catch {
      // Even if return API fails, let user proceed
      stopTimer();
      setView('EXPEDITION_REFLECTION');
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmitExpeditionReflection() {
    if (!currentExpedition || expNotes.length < 5) return;
    setLoading(true);
    setLoadingText('Analyzing what you discovered...');
    try {
      const observedItems = expObservations
        .split(',')
        .map((s) => s.trim())
        .filter((s) => s.length > 0);

      const result = await api.submitExpeditionReflection(currentExpedition.id, {
        notes: expNotes,
        observedDetails: observedItems.length > 0 ? observedItems : undefined,
        surprises: expSurprises || undefined,
      });

      if (result) {
        setExpeditionResult(result);
        setView('REWARDS');
        // Reload dashboard to get updated DNA + stats
        loadDashboard();
      } else {
        setError('Could not process your reflection. Please try again.');
      }
    } catch {
      setError('Reflection submission failed. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  async function handleLoadHistory() {
    setView('HISTORY');
    setLoading(true);
    setLoadingText('Loading your reading trail...');
    try {
      const [sessions, expeditions, orbs] = await Promise.all([
        api.getSessionHistory(),
        api.getExpeditionHistory(),
        api.getOrbs(),
      ]);
      setHistoryData({ sessions, expeditions, orbs });
    } catch {
      setError('Could not load history.');
    } finally {
      setLoading(false);
    }
  }

  function handleStartNewLoop() {
    // Reset state for next book cycle
    setCurrentBook(null);
    setRecommendation(null);
    setActiveSession(null);
    setCurrentExpedition(null);
    setCompletionResult(null);
    setExpeditionResult(null);
    setVoiceBriefing(null);
    setReflectionText('');
    setQuoteText('');
    setPagesRead(0);
    setMoodRating(3);
    setExpNotes('');
    setExpObservations('');
    setExpSurprises('');
    setView('DASHBOARD');
    loadDashboard();
  }

  // ─── RENDER ───────────────────────────────────────────────────────────────────

  const stats = dashboard?.stats;

  return (
    <main className="min-h-screen flex flex-col items-center bg-[#F3EED7] text-[#292728]">
      {/* ── Header ── */}
      <header className="w-full max-w-3xl flex items-center justify-between px-4 md:px-0 py-5 border-b border-[#B6A46A]/30">
        <div className="flex items-center gap-4">
          <button
            onClick={() => setView('DASHBOARD')}
            className="text-xl font-serif font-bold tracking-tight hover:opacity-80 transition-opacity"
            aria-label="Go to dashboard"
          >
            {APP_NAME}
          </button>
          {stats && (
            <div className="hidden sm:flex items-center gap-2 text-xs font-mono text-[#777164]">
              <span className="px-2 py-0.5 bg-[#E9E2C7] rounded">Lv {stats.level}</span>
              {stats.grassRatio !== undefined && stats.grassRatio > 0 && (
                <span className="px-2 py-0.5 bg-[#E9E2C7] rounded">🌿 {api.formatGrassRatio(stats.grassRatio)}</span>
              )}
            </div>
          )}
        </div>

        <div className="flex items-center gap-3">
          {isSignedIn && view !== 'HISTORY' && (
            <button
              onClick={handleLoadHistory}
              className="text-xs font-mono text-[#777164] hover:text-[#292728] transition-colors px-2 py-1"
              aria-label="Reading trail"
            >
              Trail
            </button>
          )}
          <Show when="signed-in">
            <UserButton />
          </Show>
          <Show when="signed-out">
            <SignInButton mode="modal">
              <button className="px-4 py-2 rounded text-xs font-medium bg-[#292728] text-[#F3EED7] hover:bg-[#3D3A3B] transition-colors focus:outline-none focus:ring-2 focus:ring-[#B6A46A]">
                Sign In
              </button>
            </SignInButton>
          </Show>
        </div>
      </header>

      {/* ── Content ── */}
      <div className="w-full max-w-3xl px-4 md:px-0 py-8 flex-1">
        {error && <ErrorBanner message={error} onDismiss={clearError} />}

        {/* ════════════════════════════════════════════════════ */}
        {/* DASHBOARD                                            */}
        {/* ════════════════════════════════════════════════════ */}
        {view === 'DASHBOARD' && (
          <Show when="signed-in" fallback={
            <div className="text-center py-20">
              <div className="text-4xl mb-4">📚</div>
              <h1 className="text-3xl font-serif font-bold mb-3">ExploBook</h1>
              <p className="text-[#777164] text-sm mb-8 max-w-sm mx-auto">
                AI-powered reading that gets you off the screen. Sign in to begin your reading journey.
              </p>
              <SignInButton mode="modal">
                <button className="px-8 py-3 bg-[#292728] text-[#F3EED7] font-medium rounded-lg hover:bg-[#3D3A3B] transition-colors text-sm">
                  Begin Your Journey
                </button>
              </SignInButton>
            </div>
          }>
            {loading ? (
              <LoadingSpinner text={loadingText} />
            ) : (
              <div className="space-y-5">
                {/* Greeting + Stats */}
                <Card>
                  <div className="flex items-start justify-between gap-4 mb-5">
                    <div>
                      <h2 className="text-xl font-serif font-bold mb-1">Welcome back.</h2>
                      <p className="text-sm text-[#777164]">Your reading journey continues.</p>
                    </div>
                    {stats && stats.grassRatio !== undefined && stats.grassRatio > 0 && (
                      <div className="text-right shrink-0">
                        <div className="text-xs font-mono text-[#777164]">GRASS RATIO</div>
                        <div className="text-2xl font-bold text-[#4a7c59]">🌿 {api.formatGrassRatio(stats.grassRatio)}</div>
                        <div className="text-xs text-[#777164] font-mono">time outside / app time</div>
                      </div>
                    )}
                  </div>

                  {stats && (
                    <div className="mb-5">
                      <XPBar xp={stats.xp} level={stats.level} xpToNext={stats.xpToNextLevel} />
                    </div>
                  )}

                  <div className="grid grid-cols-3 gap-3 text-center">
                    <div className="bg-[#E9E2C7]/60 p-3 rounded-lg">
                      <div className="text-xs text-[#777164] font-mono">BOOKS</div>
                      <div className="text-xl font-bold">{stats?.booksCompleted ?? 0}</div>
                    </div>
                    <div className="bg-[#E9E2C7]/60 p-3 rounded-lg">
                      <div className="text-xs text-[#777164] font-mono">READING</div>
                      <div className="text-xl font-bold">{api.formatDuration(stats?.totalReadingSeconds ?? 0)}</div>
                    </div>
                    <div className="bg-[#E9E2C7]/60 p-3 rounded-lg">
                      <div className="text-xs text-[#777164] font-mono">OUTSIDE</div>
                      <div className="text-xl font-bold text-[#4a7c59]">{api.formatDuration(stats?.totalOutdoorSeconds ?? 0)}</div>
                    </div>
                  </div>
                </Card>

                {/* Reader DNA Preview */}
                {dashboard?.profile?.dna && (
                  <Card>
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-sm font-mono uppercase tracking-wider text-[#777164]">Reader DNA</h3>
                      <button
                        onClick={() => setView('DNA_VIEW')}
                        className="text-xs font-mono text-[#4a7c59] hover:underline"
                        aria-label="View full Reader DNA"
                      >
                        View full →
                      </button>
                    </div>
                    <DNAPanel dna={dashboard.profile.dna} />
                  </Card>
                )}

                {/* Active Session Resume */}
                {dashboard?.activeSession && currentBook && (
                  <Card className="border-[#4a7c59]/40">
                    <SectionTag>Reading In Progress</SectionTag>
                    <h3 className="font-serif text-lg font-bold mb-1">{currentBook.title}</h3>
                    <p className="text-sm text-[#777164] mb-4">By {currentBook.authors?.join(', ')}</p>
                    <PrimaryButton onClick={() => {
                      startTimer(dashboard.activeSession!.startedAt);
                      setView('READING');
                    }} id="resume-reading-btn">
                      Resume Reading Session
                    </PrimaryButton>
                  </Card>
                )}

                {/* Current Expedition Resume */}
                {dashboard?.currentExpedition && !dashboard?.activeSession && (
                  <Card className="border-[#4a7c59]/40">
                    <SectionTag>Expedition Waiting</SectionTag>
                    <h3 className="font-serif text-lg font-bold mb-1">{dashboard.currentExpedition.title}</h3>
                    <p className="text-sm text-[#777164] mb-4">{dashboard.currentExpedition.objective.slice(0, 100)}...</p>
                    <GreenButton onClick={() => {
                      const status = dashboard.currentExpedition!.status;
                      if (status === 'AWAY') setView('GRASS_MODE');
                      else if (status === 'REFLECTION_PENDING') setView('EXPEDITION_REFLECTION');
                      else setView('EXPEDITION_READY');
                    }} id="resume-expedition-btn">
                      Continue Expedition
                    </GreenButton>
                  </Card>
                )}

                {/* Recent Orb */}
                {dashboard?.recentOrb && (
                  <Card>
                    <SectionTag>Most Recent Orb</SectionTag>
                    <OrbDisplay orb={dashboard.recentOrb} />
                    <p className="text-xs text-center text-[#777164] mt-3 italic">
                      &ldquo;{dashboard.recentOrb.essenceQuote.slice(0, 100)}&rdquo;
                    </p>
                  </Card>
                )}

                {/* Main CTA */}
                {!dashboard?.activeSession && !dashboard?.currentExpedition && (
                  <GreenButton onClick={() => handleGetRecommendation(false)} id="get-recommendation-btn" className="py-4 text-base">
                    Find My Next Book →
                  </GreenButton>
                )}
              </div>
            )}
          </Show>
        )}

        {/* ════════════════════════════════════════════════════ */}
        {/* READER DNA VIEW                                      */}
        {/* ════════════════════════════════════════════════════ */}
        {view === 'DNA_VIEW' && dashboard?.profile?.dna && (
          <Card>
            <div className="flex items-center justify-between mb-5">
              <div>
                <SectionTag>Your Profile</SectionTag>
                <h2 className="text-xl font-serif font-bold">Reader DNA</h2>
              </div>
              <button onClick={() => setView('DASHBOARD')} className="text-xs text-[#777164] hover:text-[#292728]" aria-label="Back">← Back</button>
            </div>

            <div className="mb-6">
              <h3 className="text-xs font-mono uppercase tracking-wider text-[#777164] mb-3">Exploration Profile</h3>
              <DNAPanel dna={dashboard.profile.dna} />
            </div>

            {Object.keys(dashboard.profile.dna.genreAffinity ?? {}).length > 0 && (
              <div className="mb-5">
                <h3 className="text-xs font-mono uppercase tracking-wider text-[#777164] mb-3">Genre Affinities</h3>
                <div className="flex flex-wrap gap-2">
                  {Object.entries(dashboard.profile.dna.genreAffinity)
                    .sort((a, b) => b[1] - a[1])
                    .map(([genre, score]) => (
                      <span key={genre} className="px-2.5 py-1 bg-[#E9E2C7] rounded-full text-xs font-mono border border-[#B6A46A]/30">
                        {genre} <span className="text-[#777164]">{Math.round(score * 100)}</span>
                      </span>
                    ))}
                </div>
              </div>
            )}

            <div className="grid grid-cols-2 gap-3 mb-5">
              <div className="bg-[#E9E2C7]/60 p-3 rounded-lg">
                <div className="text-xs text-[#777164] font-mono">DIFFICULTY</div>
                <div className="font-mono text-sm mt-1">{dashboard.profile.dna.difficultyScore.toFixed(1)} / 10</div>
              </div>
              <div className="bg-[#E9E2C7]/60 p-3 rounded-lg">
                <div className="text-xs text-[#777164] font-mono">REFLECTION DEPTH</div>
                <div className="font-mono text-sm mt-1">{dashboard.profile.dna.reflectionScore.toFixed(1)}</div>
              </div>
            </div>

            <p className="text-xs text-[#777164] font-mono">
              DNA last updated: {dashboard.profile.dna.updatedAt
                ? new Date(dashboard.profile.dna.updatedAt).toLocaleDateString()
                : 'Never'}
            </p>
          </Card>
        )}

        {/* ════════════════════════════════════════════════════ */}
        {/* RECOMMENDATION                                       */}
        {/* ════════════════════════════════════════════════════ */}
        {view === 'RECOMMENDATION' && (
          <div className="space-y-5">
            <div className="flex items-center justify-between">
              <SectionTag>Gemma Recommends</SectionTag>
              <button onClick={() => setView('DASHBOARD')} className="text-xs text-[#777164] hover:text-[#292728]">← Back</button>
            </div>

            {loading ? (
              <LoadingSpinner text={loadingText} />
            ) : recommendation ? (
              <Card>
                <div className="flex flex-wrap gap-2 mb-3">
                  {recommendation.book.genres?.map((g) => (
                    <span key={g} className="px-2 py-0.5 bg-[#E9E2C7] border border-[#B6A46A]/20 rounded-full text-xs font-mono">
                      {g}
                    </span>
                  ))}
                </div>
                <h2 className="text-2xl font-serif font-bold mb-1">{recommendation.book.title}</h2>
                <p className="text-sm text-[#777164] mb-4">By {recommendation.book.authors?.join(', ')}</p>
                <p className="text-sm text-[#454240] leading-relaxed mb-5">{recommendation.book.description}</p>

                {recommendation.reasoning && (
                  <div className="mb-5 p-4 bg-[#F3EED7] border-l-2 border-[#B6A46A] rounded-r-lg space-y-3">
                    <div>
                      <div className="text-xs font-mono uppercase tracking-wider text-[#777164] mb-1">Why Gemma chose this</div>
                      <p className="text-sm text-[#454240] leading-relaxed">
                        {recommendation.reasoning.explanation ||
                          recommendation.reasoning.whyThisBook ||
                          recommendation.reasoning.summary ||
                          'A thoughtful match for your reading journey.'}
                      </p>
                    </div>

                    {recommendation.reasoning.touchGrassReason && (
                      <div className="pt-2 border-t border-[#B6A46A]/20">
                        <div className="text-[11px] font-mono uppercase tracking-wider text-[#4a7c59] mb-1">Why this could get you outside</div>
                        <p className="text-xs text-[#454240] leading-relaxed">
                          {recommendation.reasoning.touchGrassReason}
                        </p>
                      </div>
                    )}

                    {recommendation.reasoning.suggestedAtmosphere && (
                      <div className="pt-1">
                        <span className="text-[11px] font-mono text-[#777164]">Suggested atmosphere: </span>
                        <span className="text-xs text-[#292728] italic">
                          {recommendation.reasoning.suggestedAtmosphere}
                        </span>
                      </div>
                    )}
                  </div>
                )}

                <div className="flex flex-wrap gap-2 mb-5">
                  {recommendation.book.themes?.map((t) => (
                    <span key={t} className="px-2.5 py-1 bg-[#F3EED7] text-[#292728] border border-[#B6A46A]/20 rounded-full text-xs font-mono">
                      #{t}
                    </span>
                  ))}
                </div>

                <PrimaryButton
                  onClick={() => handleSelectBook(recommendation.book)}
                  id="select-recommended-book-btn"
                >
                  Select This Book
                </PrimaryButton>

                <button
                  onClick={() => handleGetRecommendation(true)}
                  className="w-full mt-2 py-2 text-xs font-mono text-[#777164] hover:text-[#292728] transition-colors"
                  aria-label="Get another recommendation"
                  id="try-another-recommendation-btn"
                >
                  Try another →
                </button>
              </Card>
            ) : (
              <Card>
                <p className="text-sm text-[#777164] mb-4">No recommendation available right now.</p>
                <PrimaryButton onClick={() => handleGetRecommendation(false)}>Try Again</PrimaryButton>
              </Card>
            )}
          </div>
        )}

        {/* ════════════════════════════════════════════════════ */}
        {/* BOOK DETAIL                                          */}
        {/* ════════════════════════════════════════════════════ */}
        {view === 'BOOK_DETAIL' && currentBook && (
          <Card>
            <div className="flex items-center justify-between mb-4">
              <SectionTag>About This Book</SectionTag>
              <button onClick={() => setView('RECOMMENDATION')} className="text-xs text-[#777164] hover:text-[#292728]">← Back</button>
            </div>
            <h2 className="text-2xl font-serif font-bold mb-1">{currentBook.title}</h2>
            <p className="text-sm text-[#777164] mb-4">By {currentBook.authors?.join(', ')}</p>
            <p className="text-sm text-[#454240] leading-relaxed mb-5">{currentBook.description}</p>
            <div className="flex flex-wrap gap-2 mb-6">
              {currentBook.themes?.map((t) => (
                <span key={t} className="px-2.5 py-1 bg-[#E9E2C7] rounded-full text-xs font-mono border border-[#B6A46A]/20">
                  #{t}
                </span>
              ))}
            </div>
            {currentBook.pageCount && (
              <p className="text-xs text-[#777164] font-mono mb-5">{currentBook.pageCount} pages</p>
            )}
            <GreenButton
              onClick={handleStartReading}
              loading={loading}
              loadingText="Starting session..."
              id="start-reading-btn"
            >
              Start Reading Session
            </GreenButton>
          </Card>
        )}

        {/* ════════════════════════════════════════════════════ */}
        {/* READING MODE                                         */}
        {/* ════════════════════════════════════════════════════ */}
        {view === 'READING' && activeSession && currentBook && (
          <div className="space-y-4">
            {/* Minimal header */}
            <div className="flex items-center justify-between py-2">
              <span className="text-xs font-mono text-[#777164]">Reading Session</span>
              <span className="text-2xl font-mono font-bold text-[#292728] tabular-nums" aria-live="polite" aria-label="Elapsed time">
                {timerDisplay}
              </span>
            </div>

            <Card>
              <div className="text-center mb-6">
                <div className="text-4xl mb-3">📖</div>
                <h2 className="text-xl font-serif font-bold mb-1">{currentBook.title}</h2>
                <p className="text-sm text-[#777164]">By {currentBook.authors?.join(', ')}</p>
              </div>

              <div className="bg-[#F3EED7] border border-[#B6A46A]/20 rounded-lg p-4 mb-6 text-center">
                <p className="text-sm text-[#777164] leading-relaxed">
                  Put your phone face-down. Read. We&apos;ll be here when you&apos;re ready.
                </p>
              </div>

              <div className="mb-4">
                <label
                  htmlFor="pages-read"
                  className="block text-xs font-mono uppercase tracking-wider text-[#777164] mb-1"
                >
                  Pages Read (optional)
                </label>
                <input
                  id="pages-read"
                  type="number"
                  min={0}
                  value={pagesRead || ''}
                  onChange={(e) => setPagesRead(Number(e.target.value))}
                  placeholder="0"
                  className="w-full p-2.5 text-sm rounded-lg border border-[#B6A46A]/40 bg-[#FFFDF5] text-[#292728] focus:outline-none focus:ring-1 focus:ring-[#292728]"
                />
              </div>

              <PrimaryButton
                onClick={handleFinishReading}
                id="finish-reading-btn"
              >
                I&apos;ve Finished Reading
              </PrimaryButton>
            </Card>
          </div>
        )}

        {/* ════════════════════════════════════════════════════ */}
        {/* BOOK REFLECTION                                      */}
        {/* ════════════════════════════════════════════════════ */}
        {view === 'BOOK_REFLECTION' && (
          <Card>
            <SectionTag>Book Reflection</SectionTag>
            <h2 className="text-xl font-serif font-bold mb-1">What did you take away?</h2>
            <p className="text-sm text-[#777164] mb-5">
              Your reflection shapes your next expedition and evolves your Reader DNA.
            </p>

            <div className="space-y-4 mb-5">
              <div>
                <label htmlFor="reflection-takeaways" className="block text-xs font-mono uppercase tracking-wider text-[#777164] mb-1">
                  Key Takeaways *
                </label>
                <textarea
                  id="reflection-takeaways"
                  value={reflectionText}
                  onChange={(e) => setReflectionText(e.target.value)}
                  placeholder="What resonated? What idea made you pause?"
                  rows={4}
                  className="w-full p-3 text-sm rounded-lg border border-[#B6A46A]/40 bg-[#FFFDF5] text-[#292728] focus:outline-none focus:ring-1 focus:ring-[#292728]"
                />
              </div>

              <div>
                <label htmlFor="reflection-quote" className="block text-xs font-mono uppercase tracking-wider text-[#777164] mb-1">
                  Memorable Quote or Passage (optional)
                </label>
                <textarea
                  id="reflection-quote"
                  value={quoteText}
                  onChange={(e) => setQuoteText(e.target.value)}
                  placeholder="A passage that stayed with you..."
                  rows={2}
                  className="w-full p-3 text-sm rounded-lg border border-[#B6A46A]/40 bg-[#FFFDF5] text-[#292728] focus:outline-none focus:ring-1 focus:ring-[#292728]"
                />
              </div>

              <div>
                <label htmlFor="mood-rating" className="block text-xs font-mono uppercase tracking-wider text-[#777164] mb-1">
                  Mood Rating: {moodRating}/5
                </label>
                <input
                  id="mood-rating"
                  type="range"
                  min={1}
                  max={5}
                  value={moodRating}
                  onChange={(e) => setMoodRating(Number(e.target.value))}
                  className="w-full accent-[#4a7c59]"
                />
                <div className="flex justify-between text-xs text-[#777164] font-mono mt-1">
                  <span>Difficult</span>
                  <span>Inspiring</span>
                </div>
              </div>
            </div>

            <GreenButton
              onClick={handleSubmitBookReflection}
              disabled={reflectionText.length < 5}
              loading={loading}
              loadingText="Saving & generating expedition..."
              id="submit-book-reflection-btn"
            >
              Submit Reflection & Generate Expedition
            </GreenButton>
          </Card>
        )}

        {/* ════════════════════════════════════════════════════ */}
        {/* EXPEDITION READY                                     */}
        {/* ════════════════════════════════════════════════════ */}
        {view === 'EXPEDITION_READY' && currentExpedition && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-xl" aria-hidden="true">
                  {EXPEDITION_TYPE_ICONS[currentExpedition.type] ?? '🗺️'}
                </span>
                <SectionTag>
                  {currentExpedition.type} · {currentExpedition.durationMinutes} min
                </SectionTag>
              </div>
              <span className="text-xs font-mono text-[#777164]">Screen Departure Imminent</span>
            </div>

            <Card>
              <h2 className="text-2xl font-serif font-bold mb-2">{currentExpedition.title}</h2>
              <p className="text-sm text-[#454240] leading-relaxed mb-5 italic">
                &ldquo;{currentExpedition.objective}&rdquo;
              </p>

              {/* Place card from SerpApi */}
              {currentExpedition.place && (
                <div className="mb-5">
                  <PlaceCard place={currentExpedition.place} />
                </div>
              )}

              {/* Instructions */}
              <div className="bg-[#F3EED7]/70 border border-[#B6A46A]/20 p-4 rounded-lg mb-5">
                <h3 className="text-xs font-mono uppercase tracking-wider text-[#777164] mb-3">Mission Instructions</h3>
                <ol className="space-y-2 text-sm">
                  {currentExpedition.instructions.map((step, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <span className="font-mono text-[#B6A46A] text-xs mt-0.5 shrink-0">{i + 1}.</span>
                      <span>{step}</span>
                    </li>
                  ))}
                </ol>
              </div>

              {/* Book connection */}
              <p className="text-xs text-[#777164] leading-relaxed mb-5 border-l-2 border-[#B6A46A] pl-3 italic">
                {currentExpedition.bookConnection}
              </p>

              {/* Voice Briefing */}
              <div className="mb-5 p-4 bg-[#292728]/5 border border-[#B6A46A]/20 rounded-lg">
                <div className="text-xs font-mono uppercase tracking-wider text-[#777164] mb-2">🎙 Expedition Briefing</div>
                {!voiceBriefing ? (
                  <button
                    onClick={handleLoadVoice}
                    disabled={isLoadingVoice}
                    className="text-xs font-mono text-[#4a7c59] hover:text-[#3d6849] disabled:opacity-50 transition-colors"
                    aria-label="Load expedition voice briefing"
                    id="load-voice-btn"
                  >
                    {isLoadingVoice ? 'Preparing briefing...' : '🎧 Listen to Expedition Briefing'}
                  </button>
                ) : (
                  <div className="space-y-2">
                    <button
                      onClick={handlePlayVoice}
                      className="flex items-center gap-2 px-3 py-1.5 bg-[#292728] text-[#F3EED7] rounded text-xs font-mono hover:bg-[#3D3A3B] transition-colors"
                      aria-label="Play expedition briefing"
                      id="play-voice-btn"
                    >
                      ▶ Play Briefing
                    </button>
                    <p className="text-xs text-[#777164] font-mono">
                      {voiceBriefing.cacheHit ? 'Cached' : 'Generated'} · ElevenLabs
                    </p>
                  </div>
                )}
              </div>

              {/* Optional location */}
              {locationGranted === null && (
                <div className="mb-4 text-center">
                  <button
                    onClick={handleRequestLocation}
                    className="text-xs font-mono text-[#777164] hover:text-[#454240] hover:underline transition-colors"
                    id="request-location-btn"
                  >
                    📍 Share location to discover nearby places
                  </button>
                </div>
              )}
              {locationGranted === true && (
                <p className="text-xs font-mono text-[#4a7c59] mb-4 text-center">
                  ✓ Location shared — real places suggested
                </p>
              )}

              <GreenButton
                onClick={handleStartExpedition}
                loading={loading}
                loadingText="Starting expedition..."
                id="start-expedition-btn"
                className="py-4"
              >
                🌿 I&apos;m Putting My Phone Away · Start Expedition
              </GreenButton>
            </Card>
          </div>
        )}

        {/* ════════════════════════════════════════════════════ */}
        {/* GRASS MODE                                           */}
        {/* ════════════════════════════════════════════════════ */}
        {view === 'GRASS_MODE' && (
          <div className="border border-[#4a7c59]/40 p-10 md:p-14 rounded-2xl bg-[#292728] text-[#F3EED7] text-center shadow-lg min-h-[60vh] flex flex-col items-center justify-center">
            <div className="text-6xl mb-5" aria-hidden="true">🌿</div>
            <h2 className="text-3xl font-serif font-bold mb-3 tracking-tight">Expedition In Progress</h2>
            <p className="text-sm text-[#E9E2C7]/80 max-w-sm mx-auto leading-relaxed mb-4">
              You are outside. Lock your screen, put your phone in your pocket, and explore the real world.
            </p>

            {currentExpedition && (
              <div className="text-sm font-serif italic text-[#E9E2C7]/60 mb-6 max-w-xs mx-auto">
                &ldquo;{currentExpedition.objective.slice(0, 80)}...&rdquo;
              </div>
            )}

            <div
              className="text-4xl font-mono font-bold mb-6 tabular-nums text-[#4a7c59]"
              aria-live="polite"
              aria-label="Time outside"
            >
              {timerDisplay}
            </div>

            <div className="inline-block px-4 py-2 border border-[#E9E2C7]/20 rounded-full text-xs font-mono text-[#E9E2C7]/50 mb-8">
              📵 Phone Away · Grass Mode Active
            </div>

            <button
              onClick={handleReturnFromExpedition}
              disabled={loading}
              className="px-8 py-3 bg-[#F3EED7] text-[#292728] font-medium rounded-lg hover:bg-white transition-colors text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-[#F3EED7] focus:ring-offset-2 focus:ring-offset-[#292728] disabled:opacity-50"
              id="return-from-expedition-btn"
            >
              I Have Returned
            </button>
          </div>
        )}

        {/* ════════════════════════════════════════════════════ */}
        {/* EXPEDITION REFLECTION                                */}
        {/* ════════════════════════════════════════════════════ */}
        {view === 'EXPEDITION_REFLECTION' && (
          <Card>
            <SectionTag>Welcome Back</SectionTag>
            <h2 className="text-xl font-serif font-bold mb-1">What Did You Discover Outside?</h2>
            <p className="text-sm text-[#777164] mb-5">
              Your observations will evolve your Reader DNA, award XP, and crystallize into an Orb.
            </p>

            <div className="space-y-4 mb-5">
              <div>
                <label htmlFor="exp-notes" className="block text-xs font-mono uppercase tracking-wider text-[#777164] mb-1">
                  Expedition Notes *
                </label>
                <textarea
                  id="exp-notes"
                  value={expNotes}
                  onChange={(e) => setExpNotes(e.target.value)}
                  placeholder="Describe your walk, what you noticed, how it connected to the book..."
                  rows={4}
                  className="w-full p-3 text-sm rounded-lg border border-[#B6A46A]/40 bg-[#FFFDF5] text-[#292728] focus:outline-none focus:ring-1 focus:ring-[#292728]"
                />
              </div>

              <div>
                <label htmlFor="exp-observations" className="block text-xs font-mono uppercase tracking-wider text-[#777164] mb-1">
                  Specific Details You Noticed (comma-separated)
                </label>
                <input
                  id="exp-observations"
                  type="text"
                  value={expObservations}
                  onChange={(e) => setExpObservations(e.target.value)}
                  placeholder="E.g. Moss on old wall, rustling willow, stone arch"
                  className="w-full p-3 text-sm rounded-lg border border-[#B6A46A]/40 bg-[#FFFDF5] text-[#292728] focus:outline-none focus:ring-1 focus:ring-[#292728]"
                />
              </div>

              <div>
                <label htmlFor="exp-surprises" className="block text-xs font-mono uppercase tracking-wider text-[#777164] mb-1">
                  What Surprised You? (optional)
                </label>
                <input
                  id="exp-surprises"
                  type="text"
                  value={expSurprises}
                  onChange={(e) => setExpSurprises(e.target.value)}
                  placeholder="Something unexpected you discovered..."
                  className="w-full p-3 text-sm rounded-lg border border-[#B6A46A]/40 bg-[#FFFDF5] text-[#292728] focus:outline-none focus:ring-1 focus:ring-[#292728]"
                />
              </div>
            </div>

            <GreenButton
              onClick={handleSubmitExpeditionReflection}
              disabled={expNotes.length < 5}
              loading={loading}
              loadingText="Analyzing what you discovered..."
              id="submit-expedition-reflection-btn"
            >
              Claim Your Orb
            </GreenButton>
          </Card>
        )}

        {/* ════════════════════════════════════════════════════ */}
        {/* REWARDS                                              */}
        {/* ════════════════════════════════════════════════════ */}
        {view === 'REWARDS' && expeditionResult && (
          <div className="space-y-5">
            <SectionTag>Expedition Complete</SectionTag>

            {/* XP + Level */}
            <Card>
              <div className="text-center mb-5">
                <div className="text-3xl font-bold text-[#4a7c59] mb-1">+{expeditionResult.xpAwarded} XP</div>
                {expeditionResult.leveledUp && (
                  <div className="text-sm font-serif font-bold text-[#B6A46A] mb-2">
                    ✨ Level Up! You are now Level {expeditionResult.newLevel}
                  </div>
                )}
              </div>
              <XPBar
                xp={expeditionResult.newTotalXp}
                level={expeditionResult.newLevel}
                xpToNext={dashboard?.stats?.xpToNextLevel}
              />
              <div className="mt-4 text-center">
                <span className="text-sm text-[#777164] font-mono">
                  🌿 Grass Ratio: {api.formatGrassRatio(expeditionResult.grassRatio)}
                </span>
              </div>
            </Card>

            {/* Orb */}
            {expeditionResult.orbAwarded && (
              <Card>
                <SectionTag>Orb Crystallized</SectionTag>
                <OrbDisplay orb={expeditionResult.orbAwarded} />
                <p className="text-sm italic text-center text-[#454240] mt-4 px-4">
                  &ldquo;{expeditionResult.orbAwarded.essenceQuote}&rdquo;
                </p>
              </Card>
            )}

            {/* DNA Evolution */}
            {expeditionResult.dnaUpdated && expeditionResult.dnaDelta && (
              <Card>
                <SectionTag>Reader DNA Evolved</SectionTag>
                <div className="space-y-2 mb-4">
                  {Object.entries(expeditionResult.dnaDelta)
                    .filter(([, v]) => Math.abs(v) > 0.01)
                    .map(([key, delta]) => {
                      const labels = api.dnaLabelMap();
                      const label = labels[key] ?? key;
                      const sign = delta > 0 ? '+' : '';
                      return (
                        <div key={key} className="flex items-center gap-3">
                          <span className="text-sm text-[#292728] w-32">{label}</span>
                          <span className={`text-sm font-mono font-bold ${delta > 0 ? 'text-[#4a7c59]' : 'text-[#777164]'}`}>
                            {sign}{Math.round(delta * 100)}
                          </span>
                        </div>
                      );
                    })}
                </div>
                <p className="text-xs text-[#777164] italic">
                  Your next recommendations will reflect what you discovered.
                </p>
              </Card>
            )}

            {/* Next recommendation CTA */}
            <Card>
              <h3 className="text-sm font-mono uppercase tracking-wider text-[#777164] mb-2">Your Journey Continues</h3>
              <p className="text-sm text-[#454240] mb-4">
                Your Reader DNA has evolved. Gemma will use your updated profile to find your next book.
              </p>
              <GreenButton onClick={() => {
                handleStartNewLoop();
                setTimeout(() => handleGetRecommendation(false), 100);
              }} id="next-book-btn">
                Find My Next Book →
              </GreenButton>
            </Card>
          </div>
        )}

        {/* ════════════════════════════════════════════════════ */}
        {/* HISTORY                                              */}
        {/* ════════════════════════════════════════════════════ */}
        {view === 'HISTORY' && (
          <div className="space-y-5">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-serif font-bold">Reading Trail</h2>
              <button onClick={() => setView('DASHBOARD')} className="text-xs text-[#777164] hover:text-[#292728]">← Back</button>
            </div>

            {loading ? (
              <LoadingSpinner text={loadingText} />
            ) : historyData ? (
              <>
                {/* Stats overview */}
                {dashboard?.stats && (
                  <Card>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-center">
                      <div className="bg-[#E9E2C7]/60 p-3 rounded-lg">
                        <div className="text-xs text-[#777164] font-mono">BOOKS</div>
                        <div className="text-xl font-bold">{dashboard.stats.booksCompleted}</div>
                      </div>
                      <div className="bg-[#E9E2C7]/60 p-3 rounded-lg">
                        <div className="text-xs text-[#777164] font-mono">ORBS</div>
                        <div className="text-xl font-bold text-[#2b5876]">{historyData.orbs.length}</div>
                      </div>
                      <div className="bg-[#E9E2C7]/60 p-3 rounded-lg">
                        <div className="text-xs text-[#777164] font-mono">TOTAL XP</div>
                        <div className="text-xl font-bold text-[#4a7c59]">{dashboard.stats.xp.toLocaleString()}</div>
                      </div>
                      <div className="bg-[#E9E2C7]/60 p-3 rounded-lg">
                        <div className="text-xs text-[#777164] font-mono">GRASS</div>
                        <div className="text-xl font-bold">🌿 {api.formatGrassRatio(dashboard.stats.grassRatio ?? 0)}</div>
                      </div>
                    </div>
                  </Card>
                )}

                {/* Orbs */}
                {historyData.orbs.length > 0 && (
                  <div>
                    <h3 className="text-xs font-mono uppercase tracking-wider text-[#777164] mb-3">Orbs Collected</h3>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      {historyData.orbs.map((orb) => (
                        <Card key={orb.id} className="p-4">
                          <OrbDisplay orb={orb} />
                          <p className="text-xs text-center text-[#777164] mt-2 font-mono">
                            {new Date(orb.earnedAt).toLocaleDateString()}
                          </p>
                        </Card>
                      ))}
                    </div>
                  </div>
                )}

                {/* Sessions */}
                {historyData.sessions.length > 0 && (
                  <div>
                    <h3 className="text-xs font-mono uppercase tracking-wider text-[#777164] mb-3">Reading Sessions</h3>
                    <div className="space-y-3">
                      {historyData.sessions.slice(0, 10).map((session) => (
                        <div key={session.id} className="flex items-center justify-between p-3 bg-[#FFFDF5] border border-[#B6A46A]/20 rounded-lg text-sm">
                          <div>
                            <span className={`text-xs font-mono px-2 py-0.5 rounded ${
                              session.status === 'COMPLETED' ? 'bg-[#4a7c59]/10 text-[#4a7c59]' : 'bg-[#E9E2C7] text-[#777164]'
                            }`}>
                              {session.status}
                            </span>
                            <div className="text-xs text-[#777164] mt-1 font-mono">
                              {new Date(session.startedAt).toLocaleDateString()}
                            </div>
                          </div>
                          <div className="text-right text-xs font-mono text-[#777164]">
                            <div>{api.formatDuration(session.durationSeconds)}</div>
                            {session.pagesRead > 0 && <div>{session.pagesRead} pages</div>}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Expeditions */}
                {historyData.expeditions.length > 0 && (
                  <div>
                    <h3 className="text-xs font-mono uppercase tracking-wider text-[#777164] mb-3">Expeditions</h3>
                    <div className="space-y-3">
                      {historyData.expeditions.slice(0, 10).map((exp) => (
                        <div key={exp.id} className="p-3 bg-[#FFFDF5] border border-[#B6A46A]/20 rounded-lg">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-sm font-serif font-medium">
                              {EXPEDITION_TYPE_ICONS[exp.type] ?? '🗺️'} {exp.title}
                            </span>
                            <span className={`text-xs font-mono px-2 py-0.5 rounded ${
                              exp.status === 'COMPLETED' ? 'bg-[#4a7c59]/10 text-[#4a7c59]' : 'bg-[#E9E2C7] text-[#777164]'
                            }`}>
                              {exp.status}
                            </span>
                          </div>
                          <div className="text-xs text-[#777164] font-mono">
                            {exp.durationMinutes} min · {new Date(exp.createdAt!).toLocaleDateString()}
                            {exp.xpAwarded ? ` · +${exp.xpAwarded} XP` : ''}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {historyData.sessions.length === 0 && historyData.expeditions.length === 0 && (
                  <Card>
                    <p className="text-sm text-[#777164] text-center py-4">
                      No history yet. Start your first reading session to begin your journey.
                    </p>
                    <PrimaryButton onClick={() => setView('DASHBOARD')}>Go to Dashboard</PrimaryButton>
                  </Card>
                )}
              </>
            ) : null}
          </div>
        )}
      </div>

      {/* ── Footer ── */}
      <footer className="w-full max-w-3xl px-4 md:px-0 pb-8 pt-4 border-t border-[#B6A46A]/20 text-center">
        <div className="flex flex-wrap justify-center gap-3 text-xs font-mono text-[#B6A46A]/60">
          <span>Gemma 3 4B</span>
          <span>·</span>
          <span>Mastra</span>
          <span>·</span>
          <span>Atlas Vector Search</span>
          <span>·</span>
          <span>SerpApi</span>
          <span>·</span>
          <span>ElevenLabs</span>
        </div>
      </footer>
    </main>
  );
}
