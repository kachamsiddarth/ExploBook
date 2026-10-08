'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useUser, useAuth } from '@clerk/nextjs';
import { Navigation } from '../components/Navigation';
import { EditorialFooter } from '../components/EditorialFooter';
import * as api from '../../lib/api';
import type { DashboardData, Orb } from '../../lib/api';

function dnaBar(val: number): string {
  const clamped = Math.max(0, Math.min(1, val));
  const filled = Math.round(clamped * 10);
  const empty = 10 - filled;
  return '█'.repeat(filled) + '░'.repeat(empty);
}

export default function JourneyPage() {
  const { isSignedIn } = useUser();
  const { getToken } = useAuth();

  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [recentOrbs, setRecentOrbs] = useState<Orb[]>([]);

  useEffect(() => {
    if (isSignedIn) {
      api.setAuthTokenGetter(async () => {
        try {
          return await getToken();
        } catch {
          return null;
        }
      });
    }
    loadJourney();
  }, [isSignedIn, getToken]);

  async function loadJourney() {
    setLoading(true);
    setError(null);
    try {
      const [dash, orbs] = await Promise.all([
        api.getDashboard(),
        api.getOrbs(),
      ]);
      setData(dash);
      setRecentOrbs(orbs.slice(0, 3));
    } catch (err: unknown) {
      console.error(err);
      setError('Could not load your journey history.');
    } finally {
      setLoading(false);
    }
  }

  const stats = data?.stats;
  const profile = data?.profile;
  const dna = profile?.dna;
  const recentOrb = data?.recentOrb;

  return (
    <div className="min-h-screen flex flex-col bg-[#F3EED7] text-[#292728]">
      <Navigation />

      <main className="flex-1 max-w-4xl mx-auto w-full px-6 py-12 md:py-16">
        {/* Section 1: YOUR JOURNEY (Editorial progression header) */}
        <section className="mb-12">
          <div className="flex items-center gap-3 mb-3">
            <span className="h-px w-6 bg-[#B6A46A]" />
            <span className="text-xs font-mono tracking-widest uppercase text-[#777164]">
              FIELD JOURNAL · READER RECORD
            </span>
          </div>

          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-6 border-b border-[#B6A46A]/30">
            <div>
              <h1 className="text-4xl md:text-5xl font-serif text-[#292728]">
                Your Journey
              </h1>
              <div className="flex items-center gap-3 mt-2 text-sm font-mono text-[#777164]">
                <span className="text-[#292728] font-bold">
                  Level {stats?.level ?? 1} — The Wanderer
                </span>
                <span>·</span>
                <span>{(stats?.xp ?? 0).toLocaleString()} XP</span>
              </div>
            </div>

            {stats?.grassRatio !== undefined && stats.grassRatio > 0 && (
              <div className="text-left md:text-right">
                <div className="text-[10px] font-mono uppercase tracking-widest text-[#777164]">
                  Grass Ratio
                </div>
                <div className="text-2xl font-mono font-bold text-[#4a7c59]">
                  🌿 {api.formatGrassRatio(stats.grassRatio)}
                </div>
                <div className="text-[11px] text-[#777164] font-mono">
                  {api.formatDuration(stats.totalOutdoorSeconds)} outside
                </div>
              </div>
            )}
          </div>

          {/* Subtle Progression Line */}
          {stats && (
            <div className="pt-4">
              <div className="w-full h-1 bg-[#E9E2C7] rounded-full overflow-hidden">
                <div
                  className="h-full bg-[#292728] transition-all duration-700"
                  style={{
                    width: `${Math.min(100, Math.round(((stats.xp % 200) / 200) * 100))}%`,
                  }}
                />
              </div>
              <div className="flex justify-between items-center text-[10px] font-mono text-[#777164] mt-1.5">
                <span>Current Tier</span>
                <span>{(200 - (stats.xp % 200))} XP to Next Level</span>
              </div>
            </div>
          )}
        </section>

        {loading ? (
          <div className="py-20 text-center font-mono text-xs text-[#777164]">
            Opening your field journal...
          </div>
        ) : error ? (
          <div className="p-4 border border-red-200 bg-red-50 text-red-700 text-xs rounded mb-8">
            {error}
          </div>
        ) : (
          <div className="space-y-16">
            {/* Section 2: CURRENT ADVENTURE */}
            <section className="space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-[#B6A46A]/20">
                <h2 className="text-xs font-mono uppercase tracking-widest text-[#777164]">
                  Current Adventure
                </h2>
                <Link
                  href="/discover"
                  className="text-xs font-mono text-[#4a7c59] hover:underline"
                >
                  Discover new books →
                </Link>
              </div>

              {data?.activeSession ? (
                <div className="p-8 rounded-xl border border-[#B6A46A]/40 bg-[#FFFDF5] space-y-4">
                  <span className="text-[10px] font-mono uppercase tracking-widest px-2.5 py-1 bg-[#E9E2C7] text-[#292728] rounded">
                    Reading In Progress
                  </span>
                  <h3 className="text-2xl font-serif font-bold text-[#292728]">
                    Active Reading Session
                  </h3>
                  <p className="text-xs font-mono text-[#777164]">
                    Started {new Date(data.activeSession.startedAt).toLocaleDateString()} · Pages read: {data.activeSession.pagesRead || 0}
                  </p>
                  <div className="pt-2">
                    <Link
                      href="/discover"
                      className="inline-flex items-center px-6 py-2.5 rounded bg-[#292728] text-[#F3EED7] font-mono text-xs uppercase tracking-wider hover:bg-[#3D3A3B] transition-colors"
                    >
                      Continue Reading →
                    </Link>
                  </div>
                </div>
              ) : data?.currentExpedition ? (
                <div className="p-8 rounded-xl border border-[#4a7c59]/40 bg-[#FFFDF5] space-y-4">
                  <span className="text-[10px] font-mono uppercase tracking-widest px-2.5 py-1 bg-[#4a7c59]/15 text-[#4a7c59] rounded">
                    Expedition Waiting · {data.currentExpedition.status}
                  </span>
                  <h3 className="text-2xl font-serif font-bold text-[#292728]">
                    {data.currentExpedition.title}
                  </h3>
                  <p className="text-sm text-[#524E48] leading-relaxed max-w-xl">
                    {data.currentExpedition.objective}
                  </p>
                  <div className="pt-2">
                    {data.currentExpedition.status === 'AWAY' ? (
                      <Link
                        href="/discover"
                        className="inline-flex items-center px-6 py-2.5 rounded bg-[#292728] text-[#F3EED7] font-mono text-xs uppercase tracking-wider hover:bg-[#3D3A3B] transition-colors"
                      >
                        Return from Expedition →
                      </Link>
                    ) : data.currentExpedition.status === 'REFLECTION_PENDING' ? (
                      <Link
                        href="/discover"
                        className="inline-flex items-center px-6 py-2.5 rounded bg-[#4a7c59] text-white font-mono text-xs uppercase tracking-wider hover:bg-[#3d6849] transition-colors"
                      >
                        Complete Field Reflection →
                      </Link>
                    ) : (
                      <Link
                        href="/discover"
                        className="inline-flex items-center px-6 py-2.5 rounded bg-[#4a7c59] text-white font-mono text-xs uppercase tracking-wider hover:bg-[#3d6849] transition-colors"
                      >
                        Start Expedition (Touch Grass) →
                      </Link>
                    )}
                  </div>
                </div>
              ) : (
                <div className="p-8 rounded-xl border border-[#B6A46A]/20 bg-[#FFFDF5]/40 text-center space-y-3">
                  <p className="font-serif italic text-[#777164]">
                    No active reading session or expedition.
                  </p>
                  <p className="text-xs text-[#777164]">
                    Select a book grounded by Gemma 3 4B to start your next outdoor loop.
                  </p>
                  <div className="pt-2">
                    <Link
                      href="/discover"
                      className="inline-flex items-center px-6 py-2.5 rounded bg-[#292728] text-[#F3EED7] font-mono text-xs uppercase tracking-wider hover:bg-[#3D3A3B] transition-colors"
                    >
                      Find an Adventure →
                    </Link>
                  </div>
                </div>
              )}
            </section>

            {/* Section 3: YOUR TRAIL SUMMARY */}
            <section className="space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-[#B6A46A]/20">
                <h2 className="text-xs font-mono uppercase tracking-widest text-[#777164]">
                  Your Trail
                </h2>
                <Link
                  href="/trail"
                  className="text-xs font-mono text-[#4a7c59] hover:underline"
                >
                  View full trail journal →
                </Link>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                <div className="p-6 border border-[#B6A46A]/25 rounded-xl bg-[#FFFDF5]">
                  <div className="text-[11px] font-mono uppercase text-[#777164]">
                    Books Completed
                  </div>
                  <div className="text-3xl font-serif font-bold text-[#292728] mt-2">
                    {stats?.booksCompleted ?? 0}
                  </div>
                  <div className="text-xs text-[#777164] mt-1 font-mono">
                    {api.formatDuration(stats?.totalReadingSeconds ?? 0)} logged
                  </div>
                </div>

                <div className="p-6 border border-[#B6A46A]/25 rounded-xl bg-[#FFFDF5]">
                  <div className="text-[11px] font-mono uppercase text-[#777164]">
                    Expeditions Completed
                  </div>
                  <div className="text-3xl font-serif font-bold text-[#4a7c59] mt-2">
                    {stats?.currentStreak ?? 0}
                  </div>
                  <div className="text-xs text-[#777164] mt-1 font-mono">
                    Real-world explorations
                  </div>
                </div>

                <div className="p-6 border border-[#B6A46A]/25 rounded-xl bg-[#FFFDF5]">
                  <div className="text-[11px] font-mono uppercase text-[#777164]">
                    Orbs Collected
                  </div>
                  <div className="text-3xl font-serif font-bold text-[#2b5876] mt-2">
                    {data?.orbCount ?? recentOrbs.length}
                  </div>
                  <div className="text-xs text-[#777164] mt-1 font-mono">
                    Elemental reflections
                  </div>
                </div>
              </div>
            </section>

            {/* Section 4: READER DNA */}
            {dna && (
              <section className="space-y-4">
                <div className="flex items-center justify-between pb-2 border-b border-[#B6A46A]/20">
                  <h2 className="text-xs font-mono uppercase tracking-widest text-[#777164]">
                    Reader DNA
                  </h2>
                  <Link
                    href="/onboarding"
                    className="text-xs font-mono text-[#4a7c59] hover:underline"
                  >
                    Re-calibrate DNA →
                  </Link>
                </div>

                <div className="p-8 border border-[#B6A46A]/30 rounded-xl bg-[#FFFDF5]">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-3">
                    {Object.entries(api.dnaLabelMap()).map(([key, label]) => {
                      const val = (dna.explorationProfile as any)?.[key] ?? 0.5;
                      return (
                        <div key={key} className="flex items-center justify-between gap-2 py-1">
                          <span className="text-xs font-serif text-[#292728] w-28 shrink-0">
                            {label}
                          </span>
                          <span className="text-[11px] font-mono text-[#292728] tracking-tighter">
                            {dnaBar(val)}
                          </span>
                          <span className="text-xs font-mono text-[#B6A46A] w-8 text-right">
                            {Math.round(val * 100)}
                          </span>
                        </div>
                      );
                    })}
                  </div>

                  {profile?.genres && profile.genres.length > 0 && (
                    <div className="pt-6 mt-6 border-t border-[#B6A46A]/20 flex flex-wrap items-center gap-2">
                      <span className="text-xs font-mono text-[#777164]">Affinity:</span>
                      {profile.genres.map((g) => (
                        <span
                          key={g}
                          className="px-2.5 py-0.5 rounded-full text-xs font-mono bg-[#E9E2C7] border border-[#B6A46A]/30 text-[#292728]"
                        >
                          {g}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </section>
            )}

            {/* Section 5: MOST RECENT ORB */}
            {recentOrb && (
              <section className="space-y-4">
                <div className="flex items-center justify-between pb-2 border-b border-[#B6A46A]/20">
                  <h2 className="text-xs font-mono uppercase tracking-widest text-[#777164]">
                    Most Recent Orb
                  </h2>
                  <Link
                    href="/orbs"
                    className="text-xs font-mono text-[#4a7c59] hover:underline"
                  >
                    View entire collection →
                  </Link>
                </div>

                <div className="p-8 border border-[#B6A46A]/30 rounded-xl bg-[#FFFDF5] flex flex-col md:flex-row items-center gap-8">
                  <div
                    className="w-24 h-24 rounded-full shadow-lg flex items-center justify-center text-3xl border-2 border-white/40 shrink-0"
                    style={{ backgroundColor: recentOrb.colorHex }}
                  >
                    🔮
                  </div>

                  <div className="space-y-2 text-center md:text-left">
                    <span className="inline-block px-2.5 py-0.5 text-[10px] font-mono uppercase tracking-widest rounded border border-[#B6A46A]/40 text-[#292728]">
                      {recentOrb.rarity} · {recentOrb.theme}
                    </span>
                    <h3 className="text-2xl font-serif font-bold text-[#292728]">
                      {recentOrb.title}
                    </h3>
                    <p className="font-serif italic text-sm text-[#524E48] leading-relaxed">
                      &ldquo;{recentOrb.essenceQuote}&rdquo;
                    </p>
                    <div className="text-[11px] font-mono text-[#777164]">
                      Minted on {new Date(recentOrb.earnedAt).toLocaleDateString()}
                    </div>
                  </div>
                </div>
              </section>
            )}
          </div>
        )}
      </main>

      <EditorialFooter />
    </div>
  );
}
