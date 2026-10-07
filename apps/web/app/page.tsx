'use client';

import React, { useState } from 'react';
import { APP_NAME, APP_TAGLINE } from '@explobook/shared';
import { Show, SignInButton, UserButton } from '@clerk/nextjs';

interface Book {
  _id: string;
  title: string;
  authors: string[];
  genres: string[];
  themes: string[];
  description: string;
}

interface ExpeditionPlace {
  name: string;
  category?: string;
  address?: string;
  rating?: number;
  mapsUrl?: string;
}

interface Expedition {
  id: string;
  type: string;
  title: string;
  durationMinutes: number;
  objective: string;
  instructions: string[];
  bookConnection: string;
  status: string;
  place?: ExpeditionPlace;
}

interface VoiceBriefing {
  audioBase64: string;
  contentType: string;
  script: string;
  cacheHit: boolean;
}

interface Orb {
  id: string;
  title: string;
  rarity: string;
  theme: string;
  essenceQuote: string;
  colorHex: string;
  earnedAt: string;
}

export default function HomePage() {
  const [activeStep, setActiveStep] = useState<
    'CATALOGUE' | 'READING' | 'EXPEDITION_READY' | 'GRASS_MODE' | 'RETURNED' | 'REWARDS'
  >('CATALOGUE');

  // Interactive sample state
  const [selectedBook, setSelectedBook] = useState<Book>({
    _id: '651234567890123456789012',
    title: 'Walden; or, Life in the Woods',
    authors: ['Henry David Thoreau'],
    genres: ['Nature', 'Philosophy', 'Memoir'],
    themes: ['nature', 'solitude', 'simplicity'],
    description: 'A reflection upon simple living in natural surroundings, transcending industrial noise.',
  });

  const [readingReflection, setReadingReflection] = useState('');
  const [expedition, setExpedition] = useState<Expedition | null>(null);
  const [expeditionNotes, setExpeditionNotes] = useState('');
  const [observations, setObservations] = useState('');
  const [earnedOrb, setEarnedOrb] = useState<Orb | null>(null);
  const [xpGained, setXpGained] = useState(0);
  const [isGenerating, setIsGenerating] = useState(false);
  const [voiceBriefing, setVoiceBriefing] = useState<VoiceBriefing | null>(null);
  const [isLoadingVoice, setIsLoadingVoice] = useState(false);
  const [locationGranted, setLocationGranted] = useState<boolean | null>(null);

  // 1. Complete reading & generate expedition
  const handleCompleteReading = () => {
    setIsGenerating(true);
    // Simulating call to /api/v1/expeditions/generate
    setTimeout(() => {
      setExpedition({
        id: 'exp_' + Date.now(),
        type: 'OBSERVATION',
        title: 'The Solitary Canopy',
        durationMinutes: 20,
        objective: 'Step into an open green space or tree-lined street and observe undisturbed natural rhythms.',
        instructions: [
          'Put your phone in your pocket or activate Grass Mode.',
          'Walk to the nearest tree or quiet open bench without looking down.',
          'Notice three distinct textures and movements in the leaves or sky.',
          'Do not photograph them. Commit them to memory and return.',
        ],
        bookConnection: `Inspired by "${selectedBook.title}"—grounding Thoreau's exploration of intentional living in your physical surroundings.`,
        status: 'READY',
      });
      setIsGenerating(false);
      setActiveStep('EXPEDITION_READY');
    }, 600);
  };

  // 1b. Request location for SerpApi place discovery (optional)
  const handleRequestLocation = () => {
    if (!navigator.geolocation) {
      setLocationGranted(false);
      return;
    }
    navigator.geolocation.getCurrentPosition(
      () => setLocationGranted(true),
      () => setLocationGranted(false),
      { timeout: 5000, maximumAge: 60000 }
    );
  };

  // 1c. Load expedition voice briefing from ElevenLabs
  const handleLoadVoiceBriefing = async () => {
    if (!expedition) return;
    setIsLoadingVoice(true);
    try {
      const res = await fetch(`/api/v1/expeditions/${expedition.id}/voice`, {
        method: 'POST',
        credentials: 'include',
      });
      if (res.ok) {
        const json = await res.json() as { success: boolean; data: VoiceBriefing };
        if (json.success) setVoiceBriefing(json.data);
      }
    } catch {
      // Voice unavailable — not fatal
    } finally {
      setIsLoadingVoice(false);
    }
  };

  // Play base64 audio briefing
  const handlePlayBriefing = () => {
    if (!voiceBriefing) return;
    const audio = new Audio(`data:${voiceBriefing.contentType};base64,${voiceBriefing.audioBase64}`);
    audio.play().catch(() => {});
  };

  // 2. Start Grass Mode
  const handleStartGrassMode = () => {
    setActiveStep('GRASS_MODE');
  };

  // 3. User Returns
  const handleReturnFromExpedition = () => {
    setActiveStep('RETURNED');
  };

  // 4. Submit Expedition Reflection
  const handleSubmitReflection = () => {
    const xp = 100 + 20 + 25; // 145 XP
    setXpGained(xp);
    setEarnedOrb({
      id: 'orb_' + Date.now(),
      title: 'Orb of the Living Oak',
      rarity: 'RARE',
      theme: 'Solitude & Nature',
      essenceQuote: expeditionNotes.slice(0, 100) || 'Observed the quiet wind through ancient branches.',
      colorHex: '#2b5876',
      earnedAt: new Date().toISOString(),
    });
    setActiveStep('REWARDS');
  };

  return (
    <main className="min-h-screen flex flex-col items-center justify-between p-6 md:p-12 bg-[#F3EED7] text-[#292728]">
      <header className="w-full max-w-4xl flex items-center justify-between pb-6 border-b border-[#B6A46A]/30">
        <div>
          <h1 className="text-2xl font-serif font-bold tracking-tight text-[#292728]">
            {APP_NAME}
          </h1>
          <p className="text-xs text-[#777164] font-medium tracking-wide">
            {APP_TAGLINE}
          </p>
        </div>

        <div className="flex items-center gap-4">
          <span className="hidden sm:inline-block px-3 py-1 bg-[#E9E2C7] border border-[#B6A46A]/20 rounded text-xs font-mono">
            🌱 Touch Grass Mode
          </span>
          <Show when="signed-in">
            <UserButton />
          </Show>
          <Show when="signed-out">
            <SignInButton mode="modal">
              <button className="px-4 py-2 rounded text-xs font-medium bg-[#292728] text-[#F3EED7] hover:bg-[#3D3A3B] transition-colors">
                Sign In
              </button>
            </SignInButton>
          </Show>
        </div>
      </header>

      {/* Main Container */}
      <div className="w-full max-w-3xl my-8">
        {/* STEP 1: CATALOGUE / SELECT BOOK */}
        {activeStep === 'CATALOGUE' && (
          <div className="border border-[#B6A46A]/30 p-8 rounded-xl bg-[#FFFDF5] shadow-sm">
            <div className="inline-block bg-[#E9E2C7] px-3 py-1 rounded text-xs font-mono text-[#777164] mb-3">
              Step 1 · Grounded Reading Loop
            </div>
            <h2 className="text-2xl font-serif font-bold mb-2">{selectedBook.title}</h2>
            <p className="text-sm text-[#777164] mb-4">By {selectedBook.authors.join(', ')}</p>
            <p className="text-sm leading-relaxed mb-6 text-[#454240]">{selectedBook.description}</p>

            <div className="flex flex-wrap gap-2 mb-6">
              {selectedBook.themes.map((theme) => (
                <span
                  key={theme}
                  className="px-2.5 py-1 bg-[#F3EED7] text-[#292728] border border-[#B6A46A]/20 rounded-full text-xs font-mono"
                >
                  #{theme}
                </span>
              ))}
            </div>

            <button
              onClick={() => setActiveStep('READING')}
              className="w-full py-3 bg-[#292728] text-[#F3EED7] font-medium rounded-lg hover:bg-[#3D3A3B] transition-colors shadow-sm text-sm"
            >
              Start Reading Session
            </button>
          </div>
        )}

        {/* STEP 2: READING SESSION & REFLECTION */}
        {activeStep === 'READING' && (
          <div className="border border-[#B6A46A]/30 p-8 rounded-xl bg-[#FFFDF5] shadow-sm">
            <div className="inline-block bg-[#E9E2C7] px-3 py-1 rounded text-xs font-mono text-[#777164] mb-3">
              Step 2 · Reading Session Active
            </div>
            <h2 className="text-xl font-serif font-bold mb-2">Reading: {selectedBook.title}</h2>
            <p className="text-sm text-[#777164] mb-6">
              Take time to read away from your screen. When you finish your chapter or session, record your core takeaway.
            </p>

            <label className="block text-xs font-mono uppercase tracking-wider text-[#777164] mb-2">
              Reading Reflection / Key Passage Takeaway
            </label>
            <textarea
              value={readingReflection}
              onChange={(e) => setReadingReflection(e.target.value)}
              placeholder="What resonated with you? What idea made you pause?"
              className="w-full h-32 p-3 text-sm rounded-lg border border-[#B6A46A]/40 bg-[#FFFDF5] text-[#292728] focus:outline-none focus:ring-1 focus:ring-[#292728] mb-6"
            />

            <button
              onClick={handleCompleteReading}
              disabled={isGenerating || readingReflection.length < 5}
              className="w-full py-3 bg-[#4a7c59] text-white font-medium rounded-lg hover:bg-[#3d6849] transition-colors disabled:opacity-50 text-sm shadow-sm"
            >
              {isGenerating ? 'Gemma Is Crafting Real-World Mission...' : 'Complete Reading & Generate Expedition'}
            </button>
          </div>
        )}

        {/* STEP 3: EXPEDITION READY */}
        {activeStep === 'EXPEDITION_READY' && expedition && (
          <div className="border border-[#B6A46A]/30 p-8 rounded-xl bg-[#FFFDF5] shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <span className="px-3 py-1 bg-[#E9E2C7] border border-[#B6A46A]/20 rounded text-xs font-mono uppercase">
                {expedition.type} MISSION &middot; {expedition.durationMinutes} MIN
              </span>
              <span className="text-xs text-[#777164] font-mono">Screen Departure Imminent</span>
            </div>

            <h2 className="text-3xl font-serif font-bold mb-3">{expedition.title}</h2>
            <p className="text-sm text-[#454240] leading-relaxed mb-4 font-medium italic">
              &ldquo;{expedition.objective}&rdquo;
            </p>

            {/* SerpApi place card — shown if API returned a real place */}
            {expedition.place && (
              <div className="mb-5 p-4 bg-[#F3EED7] border border-[#B6A46A]/30 rounded-lg flex items-start gap-3">
                <span className="text-2xl mt-0.5">📍</span>
                <div className="text-sm">
                  <div className="font-semibold text-[#292728]">{expedition.place.name}</div>
                  {expedition.place.category && (
                    <div className="text-xs text-[#777164] font-mono">{expedition.place.category}</div>
                  )}
                  {expedition.place.address && (
                    <div className="text-xs text-[#454240] mt-1">{expedition.place.address}</div>
                  )}
                  {expedition.place.rating && (
                    <div className="text-xs text-[#B6A46A] mt-0.5">
                      {'★'.repeat(Math.round(expedition.place.rating))} {expedition.place.rating.toFixed(1)}
                    </div>
                  )}
                  {expedition.place.mapsUrl && (
                    <a
                      href={expedition.place.mapsUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-[#4a7c59] hover:underline mt-1 inline-block"
                    >
                      View on Maps &rarr;
                    </a>
                  )}
                </div>
              </div>
            )}

            <div className="bg-[#F3EED7]/70 border border-[#B6A46A]/20 p-5 rounded-lg mb-5">
              <h3 className="text-xs font-mono uppercase tracking-wider text-[#777164] mb-3">
                Mission Instructions
              </h3>
              <ul className="space-y-2 text-sm text-[#292728]">
                {expedition.instructions.map((step, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <span className="font-mono text-[#B6A46A] text-xs mt-0.5">{idx + 1}.</span>
                    <span>{step}</span>
                  </li>
                ))}
              </ul>
            </div>

            <p className="text-xs text-[#777164] leading-relaxed mb-5 border-l-2 border-[#B6A46A] pl-3 italic">
              {expedition.bookConnection}
            </p>

            {/* ElevenLabs Voice Briefing */}
            <div className="mb-5 p-4 bg-[#292728]/5 border border-[#B6A46A]/20 rounded-lg">
              <div className="text-xs font-mono uppercase tracking-wider text-[#777164] mb-2">
                🎙 Expedition Voice Briefing
              </div>
              {!voiceBriefing ? (
                <button
                  onClick={handleLoadVoiceBriefing}
                  disabled={isLoadingVoice}
                  className="text-xs font-mono text-[#4a7c59] hover:text-[#3d6849] disabled:opacity-50 transition-colors"
                >
                  {isLoadingVoice ? 'Loading audio...' : 'Load briefing audio (ElevenLabs)'}
                </button>
              ) : (
                <div className="flex items-center gap-3">
                  <button
                    onClick={handlePlayBriefing}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-[#292728] text-[#F3EED7] rounded text-xs font-mono hover:bg-[#3D3A3B] transition-colors"
                  >
                    ▶ Play Briefing
                  </button>
                  <span className="text-xs text-[#777164]">
                    {voiceBriefing.cacheHit ? 'Cached' : 'Generated'} &middot; Ready to hear
                  </span>
                </div>
              )}
            </div>

            {/* Optional location for SerpApi */}
            {locationGranted === null && (
              <div className="mb-4 text-center">
                <button
                  onClick={handleRequestLocation}
                  className="text-xs font-mono text-[#777164] hover:text-[#454240] underline-offset-2 hover:underline transition-colors"
                >
                  📍 Optional: share location to discover nearby places
                </button>
              </div>
            )}
            {locationGranted === true && (
              <div className="mb-4 text-center text-xs font-mono text-[#4a7c59]">
                ✓ Location shared &mdash; real places will be suggested next time
              </div>
            )}
            {locationGranted === false && (
              <div className="mb-4 text-center text-xs font-mono text-[#777164]">
                Location skipped &mdash; a generic expedition will be generated
              </div>
            )}

            <button
              onClick={handleStartGrassMode}
              className="w-full py-3.5 bg-[#292728] text-[#F3EED7] font-medium rounded-lg hover:bg-[#3D3A3B] transition-colors shadow-md text-sm flex items-center justify-center gap-2"
            >
              🌿 I&apos;m Putting My Phone Away &middot; Start Expedition
            </button>
          </div>
        )}

        {/* STEP 4: GRASS MODE (PHONE AWAY) */}
        {activeStep === 'GRASS_MODE' && (
          <div className="border border-[#4a7c59]/40 p-12 rounded-2xl bg-[#292728] text-[#F3EED7] text-center shadow-lg">
            <div className="text-5xl mb-4">🌿</div>
            <h2 className="text-3xl font-serif font-bold mb-3 tracking-tight">Expedition In Progress</h2>
            <p className="text-sm text-[#E9E2C7]/80 max-w-md mx-auto leading-relaxed mb-8">
              You are outside. Lock your screen, put your phone in your pocket, and explore the real world.
              We will be right here waiting when you return.
            </p>

            <div className="inline-block px-4 py-2 border border-[#E9E2C7]/20 rounded-full text-xs font-mono text-[#E9E2C7]/60 mb-8">
              Active Mode: Grass Mode · Screen Time Paused
            </div>

            <div>
              <button
                onClick={handleReturnFromExpedition}
                className="px-8 py-3 bg-[#F3EED7] text-[#292728] font-medium rounded-lg hover:bg-white transition-colors text-sm shadow-sm"
              >
                I Have Returned
              </button>
            </div>
          </div>
        )}

        {/* STEP 5: RETURNED & EXPEDITION REFLECTION */}
        {activeStep === 'RETURNED' && (
          <div className="border border-[#B6A46A]/30 p-8 rounded-xl bg-[#FFFDF5] shadow-sm">
            <div className="inline-block bg-[#E9E2C7] px-3 py-1 rounded text-xs font-mono text-[#777164] mb-3">
              Step 4 · Welcome Back
            </div>
            <h2 className="text-2xl font-serif font-bold mb-2">What Did You Discover Outside?</h2>
            <p className="text-sm text-[#777164] mb-6">
              Your real-world observations will evolve your Reader DNA, award progression XP, and crystallize into an Orb.
            </p>

            <label className="block text-xs font-mono uppercase tracking-wider text-[#777164] mb-2">
              Expedition Discovery Notes
            </label>
            <textarea
              value={expeditionNotes}
              onChange={(e) => setExpeditionNotes(e.target.value)}
              placeholder="Describe your walk, what you noticed, and how it connected to the book..."
              className="w-full h-28 p-3 text-sm rounded-lg border border-[#B6A46A]/40 bg-[#FFFDF5] text-[#292728] focus:outline-none focus:ring-1 focus:ring-[#292728] mb-4"
            />

            <label className="block text-xs font-mono uppercase tracking-wider text-[#777164] mb-2">
              Specific Overlooked Details (1-3 items)
            </label>
            <input
              type="text"
              value={observations}
              onChange={(e) => setObservations(e.target.value)}
              placeholder="E.g. Moss on north brick wall; rustling willow by the pond"
              className="w-full p-3 text-sm rounded-lg border border-[#B6A46A]/40 bg-[#FFFDF5] text-[#292728] focus:outline-none focus:ring-1 focus:ring-[#292728] mb-6"
            />

            <button
              onClick={handleSubmitReflection}
              disabled={expeditionNotes.length < 5}
              className="w-full py-3 bg-[#292728] text-[#F3EED7] font-medium rounded-lg hover:bg-[#3D3A3B] transition-colors disabled:opacity-50 text-sm shadow-sm"
            >
              Analyze Reflection &amp; Claim Orb
            </button>
          </div>
        )}

        {/* STEP 6: REWARDS & ORB */}
        {activeStep === 'REWARDS' && earnedOrb && (
          <div className="border border-[#B6A46A]/30 p-8 rounded-xl bg-[#FFFDF5] shadow-sm text-center">
            <div className="inline-block bg-[#E9E2C7] px-3 py-1 rounded text-xs font-mono text-[#777164] mb-4">
              Expedition Complete · Loop Finished
            </div>

            <div
              className="w-24 h-24 mx-auto rounded-full shadow-lg flex items-center justify-center text-3xl mb-4 border-2 border-white/40"
              style={{ backgroundColor: earnedOrb.colorHex }}
            >
              🔮
            </div>

            <span className="px-3 py-1 bg-[#F3EED7] border border-[#B6A46A]/30 rounded text-xs font-mono font-bold uppercase tracking-wider text-[#292728]">
              {earnedOrb.rarity} ORB
            </span>

            <h2 className="text-3xl font-serif font-bold mt-3 mb-2">{earnedOrb.title}</h2>
            <p className="text-xs text-[#777164] font-mono mb-4">Theme: {earnedOrb.theme}</p>
            <p className="text-sm italic text-[#454240] max-w-md mx-auto mb-6 bg-[#F3EED7]/40 p-4 rounded-lg border border-[#B6A46A]/20">
              &ldquo;{earnedOrb.essenceQuote}&rdquo;
            </p>

            <div className="grid grid-cols-2 gap-4 max-w-sm mx-auto mb-8 font-mono text-center">
              <div className="bg-[#E9E2C7]/60 p-3 rounded-lg border border-[#B6A46A]/20">
                <div className="text-xs text-[#777164]">XP AWARDED</div>
                <div className="text-xl font-bold text-[#4a7c59]">+{xpGained} XP</div>
              </div>
              <div className="bg-[#E9E2C7]/60 p-3 rounded-lg border border-[#B6A46A]/20">
                <div className="text-xs text-[#777164]">GRASS RATIO</div>
                <div className="text-xl font-bold text-[#292728]">4.0x</div>
              </div>
            </div>

            <button
              onClick={() => {
                setActiveStep('CATALOGUE');
                setReadingReflection('');
                setExpedition(null);
                setExpeditionNotes('');
                setObservations('');
              }}
              className="py-3 px-8 bg-[#292728] text-[#F3EED7] font-medium rounded-lg hover:bg-[#3D3A3B] transition-colors text-sm shadow-sm"
            >
              Discover Next Book
            </button>
          </div>
        )}
      </div>

      {/* Footer Info */}
      <footer className="w-full max-w-3xl pt-6 border-t border-[#B6A46A]/20 text-center">
        <div className="flex flex-wrap justify-center gap-4 text-xs font-mono text-[#777164]">
          <span>Gemma 3 4B Grounded</span>
          <span>&bull;</span>
          <span>Mastra Orchestration</span>
          <span>&bull;</span>
          <span>SerpApi Places</span>
          <span>&bull;</span>
          <span>ElevenLabs Voice</span>
          <span>&bull;</span>
          <span>Deterministic XP &amp; Orbs</span>
        </div>
      </footer>
    </main>
  );
}
