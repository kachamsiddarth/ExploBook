'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import { useUser, useAuth } from '@clerk/nextjs';
import { Navigation } from '../components/Navigation';
import { EditorialFooter } from '../components/EditorialFooter';
import * as api from '../../lib/api';
import type {
  Book,
  ReadingSession,
  Expedition,
  Recommendation,
  DashboardData,
  VoiceBriefing,
  ExpeditionCompletionResult,
} from '../../lib/api';

type DiscoverView =
  | 'RECOMMENDATION'
  | 'BOOK_DETAIL'
  | 'READING'
  | 'BOOK_REFLECTION'
  | 'EXPEDITION_READY'
  | 'GRASS_MODE'
  | 'EXPEDITION_REFLECTION'
  | 'REWARDS';

function elapsedDisplay(startISO: string): string {
  const diff = Math.floor((Date.now() - new Date(startISO).getTime()) / 1000);
  const m = Math.floor(diff / 60);
  const s = diff % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

export default function DiscoverPage() {
  const { isSignedIn } = useUser();
  const { getToken } = useAuth();

  const [view, setView] = useState<DiscoverView>('RECOMMENDATION');
  const [dashboard, setDashboard] = useState<DashboardData | null>(null);

  // Core Flow State
  const [recommendation, setRecommendation] = useState<Recommendation | null>(null);
  const [currentBook, setCurrentBook] = useState<Book | null>(null);
  const [activeSession, setActiveSession] = useState<ReadingSession | null>(null);
  const [currentExpedition, setCurrentExpedition] = useState<Expedition | null>(null);
  const [expeditionResult, setExpeditionResult] = useState<ExpeditionCompletionResult | null>(null);
  const [voiceBriefing, setVoiceBriefing] = useState<VoiceBriefing | null>(null);

  // Exclusions for "Try Another"
  const [excludedBookIds, setExcludedBookIds] = useState<string[]>([]);

  // UI state
  const [loading, setLoading] = useState(false);
  const [loadingText, setLoadingText] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoadingVoice, setIsLoadingVoice] = useState(false);

  const [pagesRead, setPagesRead] = useState<number>(0);
  const [reflectionText, setReflectionText] = useState('');
  const [quoteText, setQuoteText] = useState('');
  const [learnedWord, setLearnedWord] = useState('');
  const [wouldRecommend, setWouldRecommend] = useState<boolean>(true);
  const [moodRating, setMoodRating] = useState<number>(4);

  const [expNotes, setExpNotes] = useState('');
  const [expObservations, setExpObservations] = useState('');
  const [expSurprises, setExpSurprises] = useState('');

  // Location
  const [userLocation, setUserLocation] = useState<{ latitude: number; longitude: number } | null>(null);

  // Timer
  const [timerDisplay, setTimerDisplay] = useState('0:00');
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const sessionStartRef = useRef<Date | null>(null);

  useEffect(() => {
    if (isSignedIn) {
      api.setAuthTokenGetter(async () => {
        try {
          return await getToken();
        } catch {
          return null;
        }
      });
      loadInitialState();
    } else {
      api.setAuthTokenGetter(null);
      // Fetch public/initial recommendation
      fetchNextRecommendation(false);
    }
  }, [isSignedIn, getToken]);

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

  async function loadInitialState() {
    try {
      const dash = await api.getDashboard();
      setDashboard(dash);

      if (dash?.activeSession) {
        setActiveSession(dash.activeSession);
        const book = await api.getBook(dash.activeSession.bookId);
        if (book) setCurrentBook(book);
        startTimer(dash.activeSession.startedAt);
        setView('READING');
        return;
      }

      if (dash?.currentExpedition) {
        setCurrentExpedition(dash.currentExpedition);
        if (dash.currentExpedition.status === 'AWAY') {
          setView('GRASS_MODE');
          return;
        }
        if (dash.currentExpedition.status === 'REFLECTION_PENDING') {
          setView('EXPEDITION_REFLECTION');
          return;
        }
        if (dash.currentExpedition.status === 'READY' || dash.currentExpedition.status === 'GENERATED') {
          const book = await api.getBook(dash.currentExpedition.bookId);
          if (book) setCurrentBook(book);
          setView('EXPEDITION_READY');
          return;
        }
      }

      // Default: fetch recommendation
      fetchNextRecommendation(false, dash);
    } catch {
      fetchNextRecommendation(false);
    }
  }

  function buildDNAQuery(dna?: api.ReaderDNA): string {
    if (!dna) return 'nature exploration and solitude';
    const profile = dna.explorationProfile;
    const traits: string[] = [];
    if (profile.natureAffinity > 0.6) traits.push('nature');
    if (profile.walkingAffinity > 0.6) traits.push('walking and trail');
    if (profile.discoveryAffinity > 0.6) traits.push('exploration and wonder');
    if (profile.historicalAffinity > 0.6) traits.push('history');
    if (profile.observationAffinity > 0.6) traits.push('observation');
    if (profile.quietPlaceAffinity > 0.6) traits.push('solitude');
    return traits.join(' and ') || 'nature exploration and solitude';
  }

  async function fetchNextRecommendation(excludeCurrent = false, customDash?: DashboardData | null) {
    setView('RECOMMENDATION');
    setLoading(true);
    setLoadingText('Consulting Gemma 3 4B via Mastra workflow...');
    setError(null);

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

    try {
      const activeDash = customDash !== undefined ? customDash : dashboard;
      const res = await api.getRecommendation({
        query: buildDNAQuery(activeDash?.profile?.dna),
        excludeBookIds: nextExclusions.length > 0 ? nextExclusions : undefined,
      });

      if (res && res.recommendations && res.recommendations.length > 0) {
        setRecommendation(res.recommendations[0]);
      } else {
        setError('No recommendation available right now. Please try again.');
      }
    } catch {
      setError('Recommendation failed. Gemma inference may still be warming up.');
    } finally {
      setLoading(false);
    }
  }

  async function handleSelectBook(book: Book) {
    setCurrentBook(book);
    setView('BOOK_DETAIL');
  }

  async function handleStartReading() {
    if (!currentBook) return;
    setLoading(true);
    setLoadingText('Opening chapter...');
    try {
      const res = await api.startSession(currentBook._id || currentBook.id!);
      if (res) {
        setActiveSession(res.session);
        startTimer(res.session.startedAt);
        setView('READING');
      } else {
        setError('Could not start reading session.');
      }
    } catch {
      setError('Failed to start reading session.');
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
    setLoadingText('Synthesizing reading reflection...');
    try {
      const durationSeconds = sessionStartRef.current
        ? Math.floor((Date.now() - sessionStartRef.current.getTime()) / 1000)
        : undefined;

      const takeawaysWithWord = learnedWord?.trim()
        ? `${reflectionText}\n\n[Word Discovered]: ${learnedWord.trim()}`
        : reflectionText;

      await api.completeSession(activeSession.id, {
        pagesRead: pagesRead || undefined,
        durationSeconds,
        reflection: {
          takeaways: takeawaysWithWord,
          quoteOrPassage: quoteText || undefined,
          moodRating,
        },
      });

      // Now design outdoor expedition
      await handleGenerateExpedition(activeSession.id);
    } catch {
      setError('Reflection submission failed.');
      setLoading(false);
    }
  }

  async function handleGenerateExpedition(sessionId?: string) {
    if (!currentBook) return;
    setLoading(true);
    setLoadingText('Generating real-world expedition from book themes...');

    let coords = userLocation;
    if (!coords && typeof navigator !== 'undefined' && navigator.geolocation) {
      try {
        const pos = await new Promise<GeolocationPosition>((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 4000, maximumAge: 180000 });
        });
        coords = { latitude: pos.coords.latitude, longitude: pos.coords.longitude };
        setUserLocation(coords);
      } catch {
        // Location denied or timed out; falls back to generic nature/park prompt cleanly
      }
    }

    try {
      const locationData = coords
        ? { latitude: coords.latitude, longitude: coords.longitude, label: 'Current Location' }
        : undefined;

      const exp = await api.generateExpedition({
        bookId: currentBook._id || currentBook.id!,
        readingSessionId: sessionId,
        availableMinutes: dashboard?.profile?.availableMinutesPerSession ?? 25,
        location: locationData,
      });

      if (exp) {
        setCurrentExpedition(exp);
        setView('EXPEDITION_READY');
      } else {
        setError('Could not generate expedition.');
      }
    } catch {
      setError('Expedition generation failed.');
    } finally {
      setLoading(false);
    }
  }

  async function handleLoadVoice() {
    if (!currentExpedition) return;
    setIsLoadingVoice(true);
    try {
      const briefing = await api.getExpeditionVoice(currentExpedition.id);
      if (briefing) setVoiceBriefing(briefing);
    } catch {
      // Non-fatal
    } finally {
      setIsLoadingVoice(false);
    }
  }

  function handlePlayVoice() {
    if (!voiceBriefing) return;
    try {
      const audio = new Audio(`data:${voiceBriefing.contentType};base64,${voiceBriefing.audioBase64}`);
      audio.play().catch(() => {});
    } catch {}
  }

  async function handleStartExpedition() {
    if (!currentExpedition) return;
    setLoading(true);
    try {
      const updated = await api.startExpedition(currentExpedition.id);
      if (updated) {
        setCurrentExpedition(updated);
        startTimer(new Date().toISOString());
        setView('GRASS_MODE');
      }
    } catch {
      setError('Could not start expedition.');
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
      stopTimer();
      setView('EXPEDITION_REFLECTION');
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmitExpeditionReflection() {
    if (!currentExpedition || expNotes.length < 5) return;
    setLoading(true);
    setLoadingText('Mastra + Gemma analyzing field observations...');
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
      } else {
        setError('Could not submit reflection.');
      }
    } catch {
      setError('Expedition reflection failed.');
    } finally {
      setLoading(false);
    }
  }

  function handleResetLoop() {
    setCurrentBook(null);
    setRecommendation(null);
    setActiveSession(null);
    setCurrentExpedition(null);
    setExpeditionResult(null);
    setVoiceBriefing(null);
    setReflectionText('');
    setQuoteText('');
    setExpNotes('');
    setExpObservations('');
    setExpSurprises('');
    fetchNextRecommendation(false);
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#F3EED7] text-[#292728]">
      <Navigation />

      <main className="flex-1 max-w-3xl mx-auto w-full px-6 py-12 md:py-16">
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 text-xs rounded-lg flex items-center justify-between">
            <span>{error}</span>
            <button
              onClick={() => setError(null)}
              className="text-red-500 hover:text-red-700 font-mono text-xs ml-4"
            >
              ✕
            </button>
          </div>
        )}

        {/* ── VIEW 1: RECOMMENDATION (Discover) ── */}
        {view === 'RECOMMENDATION' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-[#B6A46A]/25">
              <div>
                <span className="text-xs font-mono uppercase tracking-widest text-[#B6A46A] block mb-1">
                  DISCOVER · GEMMA 3 4B
                </span>
                <h1 className="text-3xl md:text-4xl font-serif text-[#292728]">
                  Literary Grounding
                </h1>
              </div>

              <button
                onClick={() => fetchNextRecommendation(true)}
                disabled={loading}
                className="px-4 py-2 border border-[#B6A46A]/50 bg-[#FFFDF5] text-xs font-mono text-[#292728] rounded hover:bg-[#E9E2C7]/30 transition-colors disabled:opacity-40"
                id="try-another-btn"
              >
                Try Another →
              </button>
            </div>

            {loading ? (
              <div className="py-24 text-center space-y-3">
                <div className="w-8 h-8 border-2 border-[#B6A46A] border-t-[#292728] rounded-full animate-spin mx-auto" />
                <p className="font-mono text-xs text-[#777164]">{loadingText}</p>
              </div>
            ) : recommendation ? (
              <article className="p-8 md:p-10 border border-[#B6A46A]/40 rounded-xl bg-[#FFFDF5] shadow-sm space-y-6">
                {/* Genres */}
                <div className="flex flex-wrap gap-2">
                  {recommendation.book.genres?.map((g) => (
                    <span
                      key={g}
                      className="px-2.5 py-0.5 rounded-full text-xs font-mono bg-[#E9E2C7] border border-[#B6A46A]/30 text-[#292728]"
                    >
                      {g}
                    </span>
                  ))}
                </div>

                {/* Book Presentation */}
                <div>
                  <h2 className="text-3xl md:text-4xl font-serif font-bold text-[#292728] leading-tight">
                    {recommendation.book.title}
                  </h2>
                  <p className="text-sm font-serif italic text-[#777164] mt-1">
                    By {recommendation.book.authors?.join(', ')}
                  </p>
                </div>

                <p className="text-sm text-[#524E48] font-serif leading-relaxed">
                  {recommendation.book.description}
                </p>

                {/* Gemma Reasoning Block with Verified Fields */}
                {recommendation.reasoning && (
                  <div className="p-6 border-l-2 border-[#B6A46A] bg-[#F3EED7]/70 rounded-r-xl space-y-4">
                    {recommendation.reasoning.explanation && (
                      <div>
                        <div className="text-[11px] font-mono uppercase tracking-widest text-[#777164] mb-1">
                          Why Gemma chose this
                        </div>
                        <p className="text-sm text-[#292728] font-serif leading-relaxed">
                          {recommendation.reasoning.explanation}
                        </p>
                      </div>
                    )}

                    {recommendation.reasoning.touchGrassReason && (
                      <div className="pt-3 border-t border-[#B6A46A]/20">
                        <div className="text-[11px] font-mono uppercase tracking-widest text-[#4a7c59] mb-1">
                          Why this could get you outside
                        </div>
                        <p className="text-sm text-[#292728] font-serif leading-relaxed">
                          {recommendation.reasoning.touchGrassReason}
                        </p>
                      </div>
                    )}

                    {recommendation.reasoning.suggestedAtmosphere && (
                      <div className="pt-2 text-xs font-mono text-[#777164]">
                        <span className="text-[#B6A46A] font-bold">Suggested Atmosphere: </span>
                        <span className="italic text-[#292728] font-serif">
                          {recommendation.reasoning.suggestedAtmosphere}
                        </span>
                      </div>
                    )}
                  </div>
                )}

                {/* Themes */}
                {recommendation.book.themes && recommendation.book.themes.length > 0 && (
                  <div className="flex flex-wrap gap-2 pt-2">
                    {recommendation.book.themes.map((t) => (
                      <span
                        key={t}
                        className="px-2 py-0.5 text-[11px] font-mono text-[#777164] bg-[#E9E2C7]/50 rounded"
                      >
                        #{t}
                      </span>
                    ))}
                  </div>
                )}

                {/* Actions */}
                <div className="pt-4 flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                  <button
                    onClick={() => handleSelectBook(recommendation.book)}
                    className="flex-1 py-3.5 px-6 rounded bg-[#292728] text-[#F3EED7] font-mono text-xs uppercase tracking-widest hover:bg-[#3D3A3B] transition-colors text-center"
                    id="select-this-book-btn"
                  >
                    Select This Book →
                  </button>
                  <button
                    onClick={() => fetchNextRecommendation(true)}
                    className="py-3.5 px-6 rounded border border-[#B6A46A]/50 bg-[#FFFDF5] font-mono text-xs uppercase tracking-widest text-[#777164] hover:text-[#292728] hover:bg-[#E9E2C7]/30 transition-colors"
                  >
                    Try Another
                  </button>
                </div>
              </article>
            ) : null}
          </div>
        )}

        {/* ── VIEW 2: BOOK DETAIL ── */}
        {view === 'BOOK_DETAIL' && currentBook && (
          <article className="p-8 md:p-10 border border-[#B6A46A]/40 rounded-xl bg-[#FFFDF5] space-y-6">
            <div className="flex items-center justify-between pb-3 border-b border-[#B6A46A]/20">
              <span className="text-xs font-mono uppercase tracking-widest text-[#B6A46A]">
                BOOK DETAILS
              </span>
              <button
                onClick={() => setView('RECOMMENDATION')}
                className="text-xs font-mono text-[#777164] hover:text-[#292728]"
              >
                ← Back
              </button>
            </div>

            <div>
              <h2 className="text-3xl font-serif font-bold text-[#292728]">
                {currentBook.title}
              </h2>
              <p className="text-sm font-serif italic text-[#777164] mt-1">
                By {currentBook.authors?.join(', ')}
              </p>
            </div>

            <p className="text-sm text-[#524E48] font-serif leading-relaxed">
              {currentBook.description}
            </p>

            {/* Gemma Grounding Context */}
            {recommendation?.reasoning && (
              <div className="p-5 border-l-2 border-[#B6A46A] bg-[#F3EED7]/70 rounded-r-lg space-y-2">
                <span className="text-[10px] font-mono uppercase tracking-widest text-[#777164]">
                  Gemma Grounding Rationale
                </span>
                <p className="text-xs font-serif text-[#292728] leading-relaxed">
                  {recommendation.reasoning.explanation}
                </p>
                {recommendation.reasoning.touchGrassReason && (
                  <p className="text-xs font-serif text-[#4a7c59] pt-1">
                    🌿 {recommendation.reasoning.touchGrassReason}
                  </p>
                )}
              </div>
            )}

            {/* Themes & External Acquisition */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
              <div className="flex flex-wrap gap-2">
                {currentBook.themes?.map((t) => (
                  <span
                    key={t}
                    className="px-2 py-0.5 text-[11px] font-mono text-[#777164] bg-[#E9E2C7]/50 rounded"
                  >
                    #{t}
                  </span>
                ))}
              </div>

              {/* Verified External Library / Open Book Search */}
              <a
                href={`https://openlibrary.org/search?q=${encodeURIComponent(currentBook.title + ' ' + (currentBook.authors?.[0] || ''))}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs font-mono text-[#777164] hover:text-[#292728] hover:underline"
              >
                Find via Open Library ↗
              </a>
            </div>

            <button
              onClick={handleStartReading}
              disabled={loading}
              className="w-full py-4 rounded bg-[#4a7c59] text-white font-mono text-xs uppercase tracking-widest hover:bg-[#3d6849] transition-colors shadow-sm disabled:opacity-40"
              id="start-reading-session-btn"
            >
              {loading ? 'Preparing Session...' : 'Start Reading Session →'}
            </button>
          </article>
        )}

        {/* ── VIEW 3: READING MODE ── */}
        {view === 'READING' && currentBook && (
          <div className="space-y-6">
            <div className="flex items-center justify-between py-2 border-b border-[#B6A46A]/25">
              <span className="text-xs font-mono uppercase tracking-widest text-[#777164]">
                READING IN PROGRESS
              </span>
              <span className="text-3xl font-mono font-bold text-[#292728] tabular-nums">
                {timerDisplay}
              </span>
            </div>

            <article className="p-8 md:p-10 border border-[#B6A46A]/40 rounded-xl bg-[#FFFDF5] text-center space-y-6">
              <div className="text-4xl">📖</div>
              <div>
                <h2 className="text-2xl font-serif font-bold text-[#292728]">
                  {currentBook.title}
                </h2>
                <p className="text-xs font-serif italic text-[#777164] mt-1">
                  By {currentBook.authors?.join(', ')}
                </p>
              </div>

              <div className="p-4 border border-[#B6A46A]/20 bg-[#F3EED7]/60 rounded-lg max-w-md mx-auto text-xs font-serif text-[#777164] italic">
                Put your phone face down. Settle into the prose. We will hold your place.
              </div>

              <div className="max-w-xs mx-auto text-left">
                <label
                  htmlFor="pages-input"
                  className="block text-[11px] font-mono uppercase text-[#777164] mb-1"
                >
                  Pages Read (optional)
                </label>
                <input
                  id="pages-input"
                  type="number"
                  min={0}
                  value={pagesRead || ''}
                  onChange={(e) => setPagesRead(Number(e.target.value))}
                  placeholder="0"
                  className="w-full p-2.5 text-sm rounded border border-[#B6A46A]/40 bg-[#FFFDF5] font-mono"
                />
              </div>

              <button
                onClick={handleFinishReading}
                className="w-full max-w-md mx-auto py-3.5 rounded bg-[#292728] text-[#F3EED7] font-mono text-xs uppercase tracking-widest hover:bg-[#3D3A3B] transition-colors"
                id="finish-reading-session-btn"
              >
                I&apos;ve Finished Reading →
              </button>
            </article>
          </div>
        )}

        {/* ── VIEW 4: BOOK REFLECTION ── */}
        {view === 'BOOK_REFLECTION' && (
          <article className="p-8 md:p-10 border border-[#B6A46A]/40 rounded-xl bg-[#FFFDF5] space-y-6">
            <div>
              <span className="text-xs font-mono uppercase tracking-widest text-[#B6A46A] block mb-1">
                SYNTHESIS
              </span>
              <h2 className="text-2xl md:text-3xl font-serif font-bold text-[#292728]">
                What did you take away?
              </h2>
              <p className="text-xs text-[#777164] mt-1">
                Your notes shape the real-world expedition designed next.
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <label
                  htmlFor="reflection-notes"
                  className="block text-xs font-mono uppercase text-[#777164] mb-1"
                >
                  What stayed with you? What was the author trying to communicate? *
                </label>
                <textarea
                  id="reflection-notes"
                  value={reflectionText}
                  onChange={(e) => setReflectionText(e.target.value)}
                  placeholder="Describe what resonated, which idea made you pause, or what character/setting you understood most..."
                  rows={4}
                  className="w-full p-3 text-sm rounded border border-[#B6A46A]/40 bg-[#FFFDF5] font-serif"
                />
              </div>

              <div>
                <label
                  htmlFor="quote-input"
                  className="block text-xs font-mono uppercase text-[#777164] mb-1"
                >
                  Memorable Quote or Passage (optional)
                </label>
                <textarea
                  id="quote-input"
                  value={quoteText}
                  onChange={(e) => setQuoteText(e.target.value)}
                  placeholder="A phrase or line that stayed with you..."
                  rows={2}
                  className="w-full p-3 text-sm rounded border border-[#B6A46A]/40 bg-[#FFFDF5] font-serif"
                />
              </div>

              {/* Vocabulary / Word Discovery */}
              <div>
                <label
                  htmlFor="word-input"
                  className="block text-xs font-mono uppercase text-[#777164] mb-1"
                >
                  What new or striking word did you discover? (optional)
                </label>
                <input
                  id="word-input"
                  type="text"
                  value={learnedWord}
                  onChange={(e) => setLearnedWord(e.target.value)}
                  placeholder="e.g. petrichor, diaphanous, solipsism"
                  className="w-full p-2.5 text-sm rounded border border-[#B6A46A]/40 bg-[#FFFDF5] font-serif"
                />
              </div>

              {/* Rating & Recommendation */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                <div>
                  <label className="block text-xs font-mono uppercase text-[#777164] mb-1">
                    Reading Experience Rating: {moodRating}/5
                  </label>
                  <div className="flex gap-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setMoodRating(star)}
                        className={`text-xl transition-transform hover:scale-110 ${
                          star <= moodRating ? 'text-[#B6A46A]' : 'text-[#E9E2C7]'
                        }`}
                      >
                        ★
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-mono uppercase text-[#777164] mb-1">
                    Would you read another like this?
                  </label>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setWouldRecommend(true)}
                      className={`px-3 py-1.5 rounded text-xs font-mono border transition-all ${
                        wouldRecommend
                          ? 'border-[#292728] bg-[#292728] text-[#F3EED7]'
                          : 'border-[#B6A46A]/40 bg-[#FFFDF5] text-[#777164]'
                      }`}
                    >
                      Yes, absolutely
                    </button>
                    <button
                      type="button"
                      onClick={() => setWouldRecommend(false)}
                      className={`px-3 py-1.5 rounded text-xs font-mono border transition-all ${
                        !wouldRecommend
                          ? 'border-[#292728] bg-[#292728] text-[#F3EED7]'
                          : 'border-[#B6A46A]/40 bg-[#FFFDF5] text-[#777164]'
                      }`}
                    >
                      Explore different themes
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <button
              onClick={handleSubmitBookReflection}
              disabled={loading || reflectionText.length < 5}
              className="w-full py-4 rounded bg-[#292728] text-[#F3EED7] font-mono text-xs uppercase tracking-widest hover:bg-[#3D3A3B] transition-colors disabled:opacity-40"
              id="submit-book-reflection-btn"
            >
              {loading ? 'Synthesizing Expedition...' : 'Synthesize Expedition →'}
            </button>
          </article>
        )}

        {/* ── VIEW 5: EXPEDITION READY ── */}
        {view === 'EXPEDITION_READY' && currentExpedition && (
          <article className="p-8 md:p-10 border border-[#4a7c59]/40 rounded-xl bg-[#FFFDF5] space-y-6">
            <span className="text-[10px] font-mono uppercase tracking-widest px-2.5 py-1 bg-[#4a7c59]/15 text-[#4a7c59] rounded">
              Outdoor Expedition Ready
            </span>

            <div>
              <h2 className="text-3xl font-serif font-bold text-[#292728]">
                {currentExpedition.title}
              </h2>
              <p className="text-xs font-mono text-[#777164] mt-1">
                Estimated duration: {currentExpedition.durationMinutes} minutes
              </p>
            </div>

            <div className="p-4 border-l-2 border-[#4a7c59] bg-[#F3EED7]/70 rounded-r-lg space-y-2">
              <span className="text-[10px] font-mono uppercase tracking-widest text-[#4a7c59]">
                Objective
              </span>
              <p className="text-sm font-serif text-[#292728] leading-relaxed">
                {currentExpedition.objective}
              </p>
            </div>

            {currentExpedition.instructions && (
              <div className="space-y-2">
                <span className="text-[11px] font-mono uppercase text-[#777164]">
                  Field Instructions:
                </span>
                <ul className="space-y-1.5 list-disc list-inside text-xs font-serif text-[#524E48]">
                  {currentExpedition.instructions.map((ins, i) => (
                    <li key={i}>{ins}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Verified Place Discovery via SerpApi */}
            {currentExpedition.place && (
              <div className="p-4 border border-[#B6A46A]/30 bg-[#F3EED7]/70 rounded-lg space-y-1">
                <div className="flex items-center justify-between text-xs font-mono text-[#777164]">
                  <span className="uppercase text-[#4a7c59]">📍 Suggested Exploration Site</span>
                  {currentExpedition.place.rating && (
                    <span>★ {currentExpedition.place.rating.toFixed(1)}</span>
                  )}
                </div>
                <h4 className="font-serif font-bold text-base text-[#292728]">
                  {currentExpedition.place.name}
                </h4>
                {currentExpedition.place.address && (
                  <p className="text-xs text-[#524E48] font-serif">
                    {currentExpedition.place.address}
                  </p>
                )}
                {currentExpedition.place.mapsUrl && (
                  <div className="pt-1">
                    <a
                      href={currentExpedition.place.mapsUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs font-mono text-[#4a7c59] hover:underline inline-block"
                    >
                      Directions / Open in Maps →
                    </a>
                  </div>
                )}
              </div>
            )}

            {/* Voice Briefing Button */}
            <div className="pt-2 flex flex-col sm:flex-row gap-3">
              <button
                onClick={voiceBriefing ? handlePlayVoice : handleLoadVoice}
                disabled={isLoadingVoice}
                className="py-3 px-5 border border-[#B6A46A]/50 bg-[#FFFDF5] rounded text-xs font-mono text-[#292728] hover:bg-[#E9E2C7]/30 transition-colors"
              >
                {isLoadingVoice
                  ? 'Loading Voice Briefing...'
                  : voiceBriefing
                  ? '▶ Play Voice Briefing'
                  : '🎙️ Listen to Audio Briefing'}
              </button>

              <button
                onClick={handleStartExpedition}
                disabled={loading}
                className="flex-1 py-3 px-6 rounded bg-[#4a7c59] text-white font-mono text-xs uppercase tracking-widest hover:bg-[#3d6849] transition-colors"
                id="start-expedition-btn"
              >
                Step Outside (Touch Grass) →
              </button>
            </div>
          </article>
        )}

        {/* ── VIEW 6: GRASS MODE ── */}
        {view === 'GRASS_MODE' && currentExpedition && (
          <article className="p-10 border border-[#4a7c59]/50 rounded-xl bg-[#FFFDF5] text-center space-y-8">
            <div className="text-5xl">🌿</div>

            <div>
              <span className="text-xs font-mono uppercase tracking-widest text-[#4a7c59] block mb-2">
                TOUCH GRASS MODE ACTIVE
              </span>
              <h2 className="text-3xl font-serif font-bold text-[#292728]">
                {currentExpedition.title}
              </h2>
            </div>

            <div className="p-6 border border-[#B6A46A]/30 bg-[#F3EED7] rounded-xl max-w-md mx-auto text-sm font-serif text-[#524E48] leading-relaxed">
              &ldquo;{currentExpedition.objective}&rdquo;
              <div className="mt-4 text-xs font-mono text-[#777164]">
                Put your phone away. Look at the leaves, the stones, the shadows. Return when your senses are full.
              </div>
            </div>

            <button
              onClick={handleReturnFromExpedition}
              className="w-full max-w-sm mx-auto py-4 rounded bg-[#292728] text-[#F3EED7] font-mono text-xs uppercase tracking-widest hover:bg-[#3D3A3B] transition-colors"
              id="return-from-expedition-btn"
            >
              I Have Returned →
            </button>
          </article>
        )}

        {/* ── VIEW 7: EXPEDITION REFLECTION ── */}
        {view === 'EXPEDITION_REFLECTION' && (
          <article className="p-8 md:p-10 border border-[#B6A46A]/40 rounded-xl bg-[#FFFDF5] space-y-6">
            <div>
              <span className="text-xs font-mono uppercase tracking-widest text-[#B6A46A] block mb-1">
                FIELD LOG
              </span>
              <h2 className="text-2xl md:text-3xl font-serif font-bold text-[#292728]">
                What did you observe outside?
              </h2>
              <p className="text-xs text-[#777164] mt-1">
                Your field notes mint your permanent Orb and award expedition XP.
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <label
                  htmlFor="exp-notes-input"
                  className="block text-xs font-mono uppercase text-[#777164] mb-1"
                >
                  Expedition Notes *
                </label>
                <textarea
                  id="exp-notes-input"
                  value={expNotes}
                  onChange={(e) => setExpNotes(e.target.value)}
                  placeholder="Describe what you observed, felt, or discovered..."
                  rows={4}
                  className="w-full p-3 text-sm rounded border border-[#B6A46A]/40 bg-[#FFFDF5] font-serif"
                />
              </div>

              <div>
                <label
                  htmlFor="obs-input"
                  className="block text-xs font-mono uppercase text-[#777164] mb-1"
                >
                  Specific Details (comma-separated)
                </label>
                <input
                  id="obs-input"
                  type="text"
                  value={expObservations}
                  onChange={(e) => setExpObservations(e.target.value)}
                  placeholder="e.g. wet moss, copper leaves, cold wind"
                  className="w-full p-3 text-sm rounded border border-[#B6A46A]/40 bg-[#FFFDF5] font-serif"
                />
              </div>
            </div>

            <button
              onClick={handleSubmitExpeditionReflection}
              disabled={loading || expNotes.length < 5}
              className="w-full py-4 rounded bg-[#4a7c59] text-white font-mono text-xs uppercase tracking-widest hover:bg-[#3d6849] transition-colors disabled:opacity-40"
              id="mint-orb-btn"
            >
              {loading ? 'Synthesizing Orb...' : 'Mint Elemental Orb →'}
            </button>
          </article>
        )}

        {/* ── VIEW 8: REWARDS ── */}
        {view === 'REWARDS' && expeditionResult && (
          <article className="p-8 md:p-10 border border-[#B6A46A]/40 rounded-xl bg-[#FFFDF5] text-center space-y-6">
            <span className="text-[10px] font-mono uppercase tracking-widest px-2.5 py-1 bg-[#E9E2C7] text-[#292728] rounded">
              Expedition Completed
            </span>

            <div className="space-y-2">
              <h2 className="text-3xl font-serif font-bold text-[#292728]">
                +{expeditionResult.xpAwarded} XP Earned
              </h2>
              <p className="text-xs font-mono text-[#777164]">
                New Total XP: {expeditionResult.newTotalXp} · Level: {expeditionResult.newLevel}
              </p>
            </div>

            {expeditionResult.orbAwarded && (
              <div className="p-6 border border-[#B6A46A]/30 bg-[#F3EED7]/70 rounded-xl max-w-sm mx-auto space-y-3">
                <div
                  className="w-16 h-16 rounded-full mx-auto shadow-md flex items-center justify-center text-2xl border-2 border-white/50"
                  style={{ backgroundColor: expeditionResult.orbAwarded.colorHex }}
                >
                  🔮
                </div>
                <div className="text-xs font-mono uppercase text-[#B6A46A]">
                  {expeditionResult.orbAwarded.rarity} · {expeditionResult.orbAwarded.theme}
                </div>
                <h3 className="text-xl font-serif font-bold text-[#292728]">
                  {expeditionResult.orbAwarded.title}
                </h3>
                <p className="text-xs font-serif italic text-[#524E48]">
                  &ldquo;{expeditionResult.orbAwarded.essenceQuote}&rdquo;
                </p>
              </div>
            )}

            <div className="pt-4 flex flex-col sm:flex-row gap-3 justify-center">
              <Link
                href="/journey"
                className="py-3 px-6 rounded border border-[#B6A46A]/50 bg-[#FFFDF5] font-mono text-xs uppercase tracking-wider text-[#292728] hover:bg-[#E9E2C7]/30 transition-colors"
              >
                View in Journey →
              </Link>
              <button
                onClick={handleResetLoop}
                className="py-3 px-6 rounded bg-[#292728] text-[#F3EED7] font-mono text-xs uppercase tracking-wider hover:bg-[#3D3A3B] transition-colors"
              >
                Discover Next Adventure →
              </button>
            </div>
          </article>
        )}
      </main>

      <EditorialFooter />
    </div>
  );
}
