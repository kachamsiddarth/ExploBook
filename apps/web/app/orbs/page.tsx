'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useUser, useAuth } from '@clerk/nextjs';
import { Navigation } from '../components/Navigation';
import { EditorialFooter } from '../components/EditorialFooter';
import * as api from '../../lib/api';
import type { Orb } from '../../lib/api';

const RARITY_COLORS: Record<string, string> = {
  COMMON: 'border-[#4a7c59] text-[#4a7c59]',
  UNCOMMON: 'border-[#3d7068] text-[#3d7068]',
  RARE: 'border-[#2b5876] text-[#2b5876]',
  EPIC: 'border-[#6b4c9a] text-[#6b4c9a]',
  LEGENDARY: 'border-[#b8860b] text-[#b8860b]',
};

export default function OrbsPage() {
  const { isSignedIn } = useUser();
  const { getToken } = useAuth();

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
    loadOrbs();
  }, [isSignedIn, getToken]);

  async function loadOrbs() {
    setLoading(true);
    setError(null);
    try {
      const data = await api.getOrbs();
      setOrbs(data);
    } catch (err: unknown) {
      console.error(err);
      setError('Could not load your Orb collection.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#F3EED7] text-[#292728]">
      <Navigation />

      <main className="flex-1 max-w-4xl mx-auto w-full px-6 py-12 md:py-16">
        {/* Header */}
        <div className="mb-10 pb-6 border-b border-[#B6A46A]/30">
          <div className="flex items-center gap-3 mb-2">
            <span className="h-px w-6 bg-[#B6A46A]" />
            <span className="text-xs font-mono tracking-widest uppercase text-[#777164]">
              CABINET OF CURIOSITIES
            </span>
          </div>
          <h1 className="text-4xl md:text-5xl font-serif text-[#292728]">
            Elemental Orbs
          </h1>
          <p className="text-sm font-serif text-[#524E48] mt-2 max-w-xl">
            Each Orb is a permanent crystalline record of a finished outdoor expedition, synthesized from your personal field observations and the author&apos;s philosophical core.
          </p>
        </div>

        {loading ? (
          <div className="py-20 text-center font-mono text-xs text-[#777164]">
            Polishing your collection...
          </div>
        ) : error ? (
          <div className="p-4 border border-red-200 bg-red-50 text-red-700 text-xs rounded mb-8">
            {error}
          </div>
        ) : orbs.length === 0 ? (
          <div className="py-20 text-center border border-[#B6A46A]/20 bg-[#FFFDF5]/40 rounded-xl p-8 space-y-4">
            <div className="text-4xl">🔮</div>
            <h3 className="text-xl font-serif font-bold text-[#292728]">
              Your cabinet is waiting.
            </h3>
            <p className="text-sm text-[#777164] max-w-md mx-auto">
              Complete a reading session, step outside on an expedition, and submit your reflections to mint your first elemental Orb.
            </p>
            <div className="pt-2">
              <Link
                href="/discover"
                className="inline-flex items-center px-6 py-3 rounded bg-[#292728] text-[#F3EED7] font-mono text-xs uppercase tracking-wider hover:bg-[#3D3A3B] transition-colors"
              >
                Begin First Expedition →
              </Link>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {orbs.map((orb) => {
              const borderCls = RARITY_COLORS[orb.rarity] || 'border-[#4a7c59] text-[#4a7c59]';
              return (
                <article
                  key={orb.id}
                  className="p-8 border border-[#B6A46A]/30 rounded-xl bg-[#FFFDF5] shadow-sm flex flex-col justify-between space-y-6 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div
                      className="w-16 h-16 rounded-full shadow-md flex items-center justify-center text-2xl border-2 border-white/50 shrink-0"
                      style={{ backgroundColor: orb.colorHex }}
                    >
                      🔮
                    </div>
                    <span
                      className={`text-[10px] font-mono uppercase tracking-widest px-2.5 py-1 rounded border ${borderCls}`}
                    >
                      {orb.rarity}
                    </span>
                  </div>

                  <div className="space-y-2">
                    <div className="text-[11px] font-mono uppercase text-[#B6A46A]">
                      Theme · {orb.theme}
                    </div>
                    <h3 className="text-2xl font-serif font-bold text-[#292728] leading-tight">
                      {orb.title}
                    </h3>
                    <p className="font-serif italic text-sm text-[#524E48] leading-relaxed pt-2">
                      &ldquo;{orb.essenceQuote}&rdquo;
                    </p>
                  </div>

                  <div className="pt-4 border-t border-[#B6A46A]/20 flex items-center justify-between text-[11px] font-mono text-[#777164]">
                    <span>Minted {new Date(orb.earnedAt).toLocaleDateString()}</span>
                    <span>Touch Grass Provenance</span>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </main>

      <EditorialFooter />
    </div>
  );
}
