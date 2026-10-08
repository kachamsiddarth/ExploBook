'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useUser, useAuth } from '@clerk/nextjs';
import { Navigation } from '../components/Navigation';
import { EditorialFooter } from '../components/EditorialFooter';
import * as api from '../../lib/api';
import type { ReadingSession, Expedition, Orb } from '../../lib/api';

const EXPEDITION_TYPE_ICONS: Record<string, string> = {
  WANDER: '🚶',
  OBSERVATION: '👁️',
  NATURE: '🌿',
  DISCOVERY: '🔍',
  HISTORICAL: '🏛️',
  LITERARY: '📚',
  MYSTERY: '🔮',
};

export default function TrailPage() {
  const { isSignedIn } = useUser();
  const { getToken } = useAuth();

  const [sessions, setSessions] = useState<ReadingSession[]>([]);
  const [expeditions, setExpeditions] = useState<Expedition[]>([]);
  const [orbs, setOrbs] = useState<Orb[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
    loadTrail();
  }, [isSignedIn, getToken]);

  async function loadTrail() {
    setLoading(true);
    setError(null);
    try {
      const [sess, exps, orbList] = await Promise.all([
        api.getSessionHistory(),
        api.getExpeditionHistory(),
        api.getOrbs(),
      ]);
      setSessions(sess);
      setExpeditions(exps);
      setOrbs(orbList);
    } catch (err: unknown) {
      console.error(err);
      setError('Could not load your trail history.');
    } finally {
      setLoading(false);
    }
  }

  // Combine expeditions and sessions chronologically into an editorial timeline
  type TimelineItem =
    | { type: 'SESSION'; date: Date; data: ReadingSession }
    | { type: 'EXPEDITION'; date: Date; data: Expedition };

  const timeline: TimelineItem[] = [
    ...sessions.map((s) => ({
      type: 'SESSION' as const,
      date: new Date(s.completedAt || s.startedAt),
      data: s,
    })),
    ...expeditions.map((e) => ({
      type: 'EXPEDITION' as const,
      date: new Date(e.completedAt || e.createdAt || Date.now()),
      data: e,
    })),
  ].sort((a, b) => b.date.getTime() - a.date.getTime());

  return (
    <div className="min-h-screen flex flex-col bg-[#F3EED7] text-[#292728]">
      <Navigation />

      <main className="flex-1 max-w-4xl mx-auto w-full px-6 py-12 md:py-16">
        {/* Header */}
        <div className="mb-10 pb-6 border-b border-[#B6A46A]/30">
          <div className="flex items-center gap-3 mb-2">
            <span className="h-px w-6 bg-[#B6A46A]" />
            <span className="text-xs font-mono tracking-widest uppercase text-[#777164]">
              CHRONOLOGY &amp; FIELD NOTES
            </span>
          </div>
          <h1 className="text-4xl md:text-5xl font-serif text-[#292728]">
            The Reading Trail
          </h1>
          <p className="text-sm font-serif text-[#524E48] mt-2 max-w-xl">
            A chronological travelogue of every chapter opened, trail traversed, and observational insight recorded outside your screen.
          </p>
        </div>

        {loading ? (
          <div className="py-20 text-center font-mono text-xs text-[#777164]">
            Unrolling your scroll...
          </div>
        ) : error ? (
          <div className="p-4 border border-red-200 bg-red-50 text-red-700 text-xs rounded mb-8">
            {error}
          </div>
        ) : timeline.length === 0 ? (
          <div className="py-20 text-center border border-[#B6A46A]/20 bg-[#FFFDF5]/40 rounded-xl p-8 space-y-4">
            <div className="text-4xl">📜</div>
            <h3 className="text-xl font-serif font-bold text-[#292728]">
              Your trail has just begun.
            </h3>
            <p className="text-sm text-[#777164] max-w-md mx-auto">
              As you read books and step outside into real landscapes, your timeline will document each discovery in chronological order.
            </p>
            <div className="pt-2">
              <Link
                href="/discover"
                className="inline-flex items-center px-6 py-3 rounded bg-[#292728] text-[#F3EED7] font-mono text-xs uppercase tracking-wider hover:bg-[#3D3A3B] transition-colors"
              >
                Log First Chapter →
              </Link>
            </div>
          </div>
        ) : (
          <div className="space-y-8 relative before:absolute before:inset-0 before:left-3 md:before:left-6 before:w-px before:bg-[#B6A46A]/30">
            {timeline.map((item, idx) => {
              const isExp = item.type === 'EXPEDITION';
              const exp = isExp ? (item.data as Expedition) : null;
              const sess = !isExp ? (item.data as ReadingSession) : null;

              return (
                <div key={idx} className="relative pl-10 md:pl-16">
                  {/* Timeline dot */}
                  <div
                    className={`absolute left-1.5 md:left-4.5 top-2 w-3.5 h-3.5 rounded-full border-2 border-[#F3EED7] ${
                      isExp ? 'bg-[#4a7c59]' : 'bg-[#292728]'
                    }`}
                  />

                  <article className="p-6 border border-[#B6A46A]/30 rounded-xl bg-[#FFFDF5] space-y-3 shadow-sm">
                    <div className="flex flex-wrap items-center justify-between gap-2 text-xs font-mono text-[#777164]">
                      <span className="uppercase tracking-wider">
                        {isExp ? '🌿 Outdoor Expedition' : '📖 Reading Session'}
                      </span>
                      <span>{item.date.toLocaleDateString()}</span>
                    </div>

                    {isExp && exp && (
                      <div className="space-y-2">
                        <h3 className="text-xl font-serif font-bold text-[#292728]">
                          {EXPEDITION_TYPE_ICONS[exp.type] ?? '🗺️'} {exp.title}
                        </h3>
                        <p className="text-xs text-[#524E48] font-mono">
                          Duration: {exp.durationMinutes} min · Status: {exp.status}
                          {exp.xpAwarded ? ` · +${exp.xpAwarded} XP awarded` : ''}
                        </p>
                        <p className="text-sm text-[#454240] leading-relaxed">
                          {exp.objective}
                        </p>

                        {exp.reflection?.notes && (
                          <div className="mt-4 p-4 border-l-2 border-[#4a7c59] bg-[#F3EED7]/60 rounded-r-lg">
                            <span className="text-[10px] font-mono uppercase tracking-widest text-[#4a7c59] block mb-1">
                              Field Reflection
                            </span>
                            <p className="font-serif italic text-sm text-[#292728]">
                              &ldquo;{exp.reflection.notes}&rdquo;
                            </p>
                            {exp.reflection.observedDetails && exp.reflection.observedDetails.length > 0 && (
                              <div className="mt-2 text-xs font-mono text-[#777164]">
                                Observed: {exp.reflection.observedDetails.join(', ')}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    )}

                    {!isExp && sess && (
                      <div className="space-y-2">
                        <h3 className="text-xl font-serif font-bold text-[#292728]">
                          Reading Session
                        </h3>
                        <div className="text-xs font-mono text-[#777164]">
                          {api.formatDuration(sess.durationSeconds)} · {sess.pagesRead} pages read · {sess.status}
                        </div>
                        {sess.reflection?.takeaways && (
                          <div className="mt-3 p-4 border-l-2 border-[#B6A46A] bg-[#F3EED7]/60 rounded-r-lg">
                            <span className="text-[10px] font-mono uppercase tracking-widest text-[#B6A46A] block mb-1">
                              Session Takeaways
                            </span>
                            <p className="font-serif italic text-sm text-[#292728]">
                              &ldquo;{sess.reflection.takeaways}&rdquo;
                            </p>
                            {sess.reflection.quoteOrPassage && (
                              <p className="text-xs text-[#777164] mt-2 italic">
                                Quote: &ldquo;{sess.reflection.quoteOrPassage}&rdquo;
                              </p>
                            )}
                          </div>
                        )}
                      </div>
                    )}
                  </article>
                </div>
              );
            })}
          </div>
        )}
      </main>

      <EditorialFooter />
    </div>
  );
}
