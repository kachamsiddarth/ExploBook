'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@clerk/nextjs';
import { Navigation } from '../components/Navigation';
import { EditorialFooter } from '../components/EditorialFooter';
import * as api from '../../lib/api';

const GENRES = [
  'Nature & Environment',
  'Philosophy & Solitude',
  'Literary Fiction',
  'History & Biography',
  'Science & Discovery',
  'Travel & Adventure',
  'Essays & Culture',
  'Poetry & Contemplation',
];

const DIFFICULTIES = [
  { id: 'beginner', label: 'Beginner', desc: 'Breezy & Inviting — gentle pacing, clear language, easy to pick up anytime' },
  { id: 'intermediate', label: 'Intermediate', desc: 'Balanced & Engaging — rewarding narrative with subtle depth and substance' },
  { id: 'advanced', label: 'Advanced', desc: 'Dense & Literary — demands close attention, rich prose, contemplative' },
  { id: 'expert', label: 'Expert', desc: 'Philosophical & Complex — intricate structures, challenging vocabulary' },
];

const GOALS = [
  { id: 'habit', label: 'Build a reading habit', desc: 'Read consistently every day' },
  { id: 'learn', label: 'Learn something', desc: 'Expand knowledge and perspective' },
  { id: 'ideas', label: 'Explore new ideas', desc: 'Challenge assumptions and discover new angles' },
  { id: 'enjoyment', label: 'Read for enjoyment', desc: 'Pure literary delight and immersion' },
  { id: 'english', label: 'Improve English', desc: 'Enrich vocabulary and language mastery' },
  { id: 'relax', label: 'Slow down / relax', desc: 'Disconnect from screens and restore inner calm' },
  { id: 'challenge', label: 'Challenge myself', desc: 'Tackle ambitious, profound literature' },
];

const TIME_OPTIONS = [
  { minutes: 10, label: '10 min/day', desc: 'A quick morning passage or midday pause' },
  { minutes: 20, label: '20 min/day', desc: 'A measured daily reading routine' },
  { minutes: 30, label: '30 min/day', desc: 'A dedicated reading and reflection block' },
  { minutes: 60, label: '1 hour/day', desc: 'Deep uninterrupted immersion' },
  { minutes: 0, label: 'No fixed limit', desc: 'Read freely whenever the mood strikes' },
];

const EXPLORATION_PLACES = [
  { key: 'natureAffinity', label: 'Under Tree Canopies & Forests', desc: 'Moss, wind in leaves, shifting shadows' },
  { key: 'walkingAffinity', label: 'Along Paths & Quiet Trails', desc: 'Continuous movement, gravel, footbridges' },
  { key: 'discoveryAffinity', label: 'Uncharted Corners & Side Streets', desc: 'Hidden courtyards, unmarked alleys, ruins' },
  { key: 'historicalAffinity', label: 'Historic Stones & Old Landmarks', desc: 'Architecture with memory and layered time' },
  { key: 'observationAffinity', label: 'Park Benches & Riverbanks', desc: 'Stationary watching, ripples, passing birds' },
  { key: 'quietPlaceAffinity', label: 'Secluded Lawns & Cloistered Nooks', desc: 'Absolute silence, breeze, privacy' },
];

export default function OnboardingPage() {
  const router = useRouter();
  const { isSignedIn } = useUser();

  const [step, setStep] = useState(1);
  const [primaryGenre, setPrimaryGenre] = useState('');
  const [secondaryGenre, setSecondaryGenre] = useState('');
  const [difficulty, setDifficulty] = useState('intermediate');
  const [goal, setGoal] = useState('habit');
  const [minutes, setMinutes] = useState(30);
  const [selectedPlaces, setSelectedPlaces] = useState<string[]>([
    'natureAffinity',
    'quietPlaceAffinity',
  ]);

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function togglePlace(key: string) {
    if (selectedPlaces.includes(key)) {
      if (selectedPlaces.length > 1) {
        setSelectedPlaces(selectedPlaces.filter((p) => p !== key));
      }
    } else {
      setSelectedPlaces([...selectedPlaces, key]);
    }
  }

  async function handleComplete() {
    setSaving(true);
    setError(null);
    try {
      const explorationProfile: Record<string, number> = {
        natureAffinity: selectedPlaces.includes('natureAffinity') ? 0.9 : 0.4,
        walkingAffinity: selectedPlaces.includes('walkingAffinity') ? 0.9 : 0.4,
        discoveryAffinity: selectedPlaces.includes('discoveryAffinity') ? 0.9 : 0.4,
        historicalAffinity: selectedPlaces.includes('historicalAffinity') ? 0.9 : 0.4,
        observationAffinity: selectedPlaces.includes('observationAffinity') ? 0.9 : 0.4,
        quietPlaceAffinity: selectedPlaces.includes('quietPlaceAffinity') ? 0.9 : 0.4,
      };

      const genres = [primaryGenre, secondaryGenre].filter(Boolean);
      if (genres.length === 0) genres.push('Nature & Environment');

      await api.updateReaderProfile({
        genres,
        goals: [goal],
        difficultyPreference: difficulty,
        availableMinutesPerSession: minutes,
        explorationProfile,
      });

      // Navigate to Discover/recommendations
      router.push('/discover');
    } catch (err: unknown) {
      console.error(err);
      // Even if network fails, proceed to Discover so flow isn't stuck
      router.push('/discover');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#F3EED7] text-[#292728]">
      <Navigation />

      <main className="flex-1 max-w-2xl mx-auto w-full px-6 py-12 md:py-16">
        {/* Progress Dots */}
        <div className="flex items-center justify-between mb-8 pb-4 border-b border-[#B6A46A]/20">
          <div className="flex items-center gap-2">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div
                key={i}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  i === step
                    ? 'w-8 bg-[#292728]'
                    : i < step
                    ? 'w-3 bg-[#B6A46A]'
                    : 'w-3 bg-[#E9E2C7]'
                }`}
              />
            ))}
          </div>
          <span className="text-xs font-mono text-[#777164]">
            Step {step} of 6
          </span>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-800 text-xs rounded-lg">
            {error}
          </div>
        )}

        {/* ── STEP 1: Primary Genre ── */}
        {step === 1 && (
          <div className="space-y-6">
            <div>
              <span className="text-xs font-mono uppercase tracking-wider text-[#B6A46A] block mb-2">
                Question I
              </span>
              <h2 className="text-3xl font-serif text-[#292728]">
                What kind of stories pull you in?
              </h2>
              <p className="text-sm text-[#777164] mt-2">
                Choose your primary literary compass.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              {GENRES.map((g) => (
                <button
                  key={g}
                  type="button"
                  onClick={() => setPrimaryGenre(g)}
                  className={`p-4 text-left rounded-lg border transition-all text-sm font-serif ${
                    primaryGenre === g
                      ? 'border-[#292728] bg-[#FFFDF5] shadow-sm font-bold text-[#292728]'
                      : 'border-[#B6A46A]/30 bg-[#FFFDF5]/50 hover:bg-[#FFFDF5] text-[#524E48]'
                  }`}
                >
                  {g}
                </button>
              ))}
            </div>

            <div className="pt-6 flex justify-end">
              <button
                type="button"
                disabled={!primaryGenre}
                onClick={() => setStep(2)}
                className="px-6 py-3 rounded bg-[#292728] text-[#F3EED7] font-mono text-xs uppercase tracking-wider disabled:opacity-30 hover:bg-[#3D3A3B] transition-colors"
              >
                Next →
              </button>
            </div>
          </div>
        )}

        {/* ── STEP 2: Secondary Genre ── */}
        {step === 2 && (
          <div className="space-y-6">
            <div>
              <span className="text-xs font-mono uppercase tracking-wider text-[#B6A46A] block mb-2">
                Question II
              </span>
              <h2 className="text-3xl font-serif text-[#292728]">
                What else catches your eye?
              </h2>
              <p className="text-sm text-[#777164] mt-2">
                A secondary thread that enriches your reading DNA.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              {GENRES.filter((g) => g !== primaryGenre).map((g) => (
                <button
                  key={g}
                  type="button"
                  onClick={() => setSecondaryGenre(g)}
                  className={`p-4 text-left rounded-lg border transition-all text-sm font-serif ${
                    secondaryGenre === g
                      ? 'border-[#292728] bg-[#FFFDF5] shadow-sm font-bold text-[#292728]'
                      : 'border-[#B6A46A]/30 bg-[#FFFDF5]/50 hover:bg-[#FFFDF5] text-[#524E48]'
                  }`}
                >
                  {g}
                </button>
              ))}
            </div>

            <div className="pt-6 flex justify-between">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="px-4 py-2 text-xs font-mono text-[#777164] hover:text-[#292728]"
              >
                ← Back
              </button>
              <button
                type="button"
                disabled={!secondaryGenre}
                onClick={() => setStep(3)}
                className="px-6 py-3 rounded bg-[#292728] text-[#F3EED7] font-mono text-xs uppercase tracking-wider disabled:opacity-30 hover:bg-[#3D3A3B] transition-colors"
              >
                Next →
              </button>
            </div>
          </div>
        )}

        {/* ── STEP 3: Reading Difficulty ── */}
        {step === 3 && (
          <div className="space-y-6">
            <div>
              <span className="text-xs font-mono uppercase tracking-wider text-[#B6A46A] block mb-2">
                Question III
              </span>
              <h2 className="text-3xl font-serif text-[#292728]">
                How challenging do you want your next book to be?
              </h2>
              <p className="text-sm text-[#777164] mt-2">
                We calibrate vocabulary, narrative density, and sentence complexity.
              </p>
            </div>

            <div className="space-y-3 pt-2">
              {DIFFICULTIES.map((d) => (
                <button
                  key={d.id}
                  type="button"
                  onClick={() => setDifficulty(d.id)}
                  className={`w-full p-4 text-left rounded-lg border transition-all ${
                    difficulty === d.id
                      ? 'border-[#292728] bg-[#FFFDF5] shadow-sm'
                      : 'border-[#B6A46A]/30 bg-[#FFFDF5]/50 hover:bg-[#FFFDF5]'
                  }`}
                >
                  <div className="font-serif font-bold text-base text-[#292728]">
                    {d.label}
                  </div>
                  <div className="text-xs text-[#777164] mt-1">{d.desc}</div>
                </button>
              ))}
            </div>

            <div className="pt-6 flex justify-between">
              <button
                type="button"
                onClick={() => setStep(2)}
                className="px-4 py-2 text-xs font-mono text-[#777164] hover:text-[#292728]"
              >
                ← Back
              </button>
              <button
                type="button"
                onClick={() => setStep(4)}
                className="px-6 py-3 rounded bg-[#292728] text-[#F3EED7] font-mono text-xs uppercase tracking-wider hover:bg-[#3D3A3B] transition-colors"
              >
                Next →
              </button>
            </div>
          </div>
        )}

        {/* ── STEP 4: Reading Goal ── */}
        {step === 4 && (
          <div className="space-y-6">
            <div>
              <span className="text-xs font-mono uppercase tracking-wider text-[#B6A46A] block mb-2">
                Question IV
              </span>
              <h2 className="text-3xl font-serif text-[#292728]">
                Why are you reading right now?
              </h2>
              <p className="text-sm text-[#777164] mt-2">
                Your underlying intent guides how Gemma frames each book recommendation.
              </p>
            </div>

            <div className="space-y-3 pt-2">
              {GOALS.map((g) => (
                <button
                  key={g.id}
                  type="button"
                  onClick={() => setGoal(g.id)}
                  className={`w-full p-4 text-left rounded-lg border transition-all ${
                    goal === g.id
                      ? 'border-[#292728] bg-[#FFFDF5] shadow-sm'
                      : 'border-[#B6A46A]/30 bg-[#FFFDF5]/50 hover:bg-[#FFFDF5]'
                  }`}
                >
                  <div className="font-serif font-bold text-base text-[#292728]">
                    {g.label}
                  </div>
                  <div className="text-xs text-[#777164] mt-1">{g.desc}</div>
                </button>
              ))}
            </div>

            <div className="pt-6 flex justify-between">
              <button
                type="button"
                onClick={() => setStep(3)}
                className="px-4 py-2 text-xs font-mono text-[#777164] hover:text-[#292728]"
              >
                ← Back
              </button>
              <button
                type="button"
                onClick={() => setStep(5)}
                className="px-6 py-3 rounded bg-[#292728] text-[#F3EED7] font-mono text-xs uppercase tracking-wider hover:bg-[#3D3A3B] transition-colors"
              >
                Next →
              </button>
            </div>
          </div>
        )}

        {/* ── STEP 5: Reading Time ── */}
        {step === 5 && (
          <div className="space-y-6">
            <div>
              <span className="text-xs font-mono uppercase tracking-wider text-[#B6A46A] block mb-2">
                Question V
              </span>
              <h2 className="text-3xl font-serif text-[#292728]">
                How much time do you usually have?
              </h2>
              <p className="text-sm text-[#777164] mt-2">
                We design reading sessions and real-world expeditions that fit your rhythm.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              {TIME_OPTIONS.map((t) => (
                <button
                  key={t.minutes}
                  type="button"
                  onClick={() => setMinutes(t.minutes)}
                  className={`p-4 text-left rounded-lg border transition-all ${
                    minutes === t.minutes
                      ? 'border-[#292728] bg-[#FFFDF5] shadow-sm'
                      : 'border-[#B6A46A]/30 bg-[#FFFDF5]/50 hover:bg-[#FFFDF5]'
                  }`}
                >
                  <div className="font-mono font-bold text-base text-[#292728]">
                    {t.label}
                  </div>
                  <div className="text-xs text-[#777164] mt-1">{t.desc}</div>
                </button>
              ))}
            </div>

            <div className="pt-6 flex justify-between">
              <button
                type="button"
                onClick={() => setStep(4)}
                className="px-4 py-2 text-xs font-mono text-[#777164] hover:text-[#292728]"
              >
                ← Back
              </button>
              <button
                type="button"
                onClick={() => setStep(6)}
                className="px-6 py-3 rounded bg-[#292728] text-[#F3EED7] font-mono text-xs uppercase tracking-wider hover:bg-[#3D3A3B] transition-colors"
              >
                Next →
              </button>
            </div>
          </div>
        )}

        {/* ── STEP 6: Exploration Preferences (DNA) ── */}
        {step === 6 && (
          <div className="space-y-6">
            <div>
              <span className="text-xs font-mono uppercase tracking-wider text-[#B6A46A] block mb-2">
                Question VI · The Touch Grass Core
              </span>
              <h2 className="text-3xl font-serif text-[#292728]">
                Where would you rather find yourself?
              </h2>
              <p className="text-sm text-[#777164] mt-2">
                Select one or more environments where you feel most grounded.
              </p>
            </div>

            <div className="space-y-3 pt-2">
              {EXPLORATION_PLACES.map((p) => {
                const isSelected = selectedPlaces.includes(p.key);
                return (
                  <button
                    key={p.key}
                    type="button"
                    onClick={() => togglePlace(p.key)}
                    className={`w-full p-4 text-left rounded-lg border transition-all flex items-start justify-between gap-4 ${
                      isSelected
                        ? 'border-[#292728] bg-[#FFFDF5] shadow-sm'
                        : 'border-[#B6A46A]/30 bg-[#FFFDF5]/50 hover:bg-[#FFFDF5]'
                    }`}
                  >
                    <div>
                      <div className="font-serif font-bold text-base text-[#292728]">
                        {p.label}
                      </div>
                      <div className="text-xs text-[#777164] mt-1">{p.desc}</div>
                    </div>
                    <span
                      className={`text-xs font-mono px-2 py-0.5 rounded shrink-0 ${
                        isSelected
                          ? 'bg-[#292728] text-[#F3EED7]'
                          : 'bg-[#E9E2C7] text-[#777164]'
                      }`}
                    >
                      {isSelected ? 'Selected' : '+ Add'}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Completion Box */}
            <div className="mt-8 p-6 border border-[#B6A46A]/40 bg-[#FFFDF5] rounded-xl text-center space-y-3">
              <div className="text-xs font-mono text-[#4a7c59] uppercase tracking-widest">
                ✓ Ready to synthesize
              </div>
              <h3 className="text-xl font-serif font-bold text-[#292728]">
                Your Reader DNA is ready.
              </h3>
              <p className="text-xs text-[#777164] max-w-sm mx-auto">
                Gemma 3 will ground recommendations using this literary and observational profile.
              </p>
              <div className="pt-2">
                <button
                  type="button"
                  disabled={saving}
                  onClick={handleComplete}
                  className="w-full sm:w-auto px-8 py-3.5 rounded bg-[#292728] text-[#F3EED7] font-mono text-xs uppercase tracking-widest hover:bg-[#3D3A3B] transition-colors shadow-sm disabled:opacity-50"
                  id="complete-onboarding-btn"
                >
                  {saving ? 'Synthesizing DNA...' : 'Find my first adventure →'}
                </button>
              </div>
            </div>

            <div className="pt-2 flex justify-start">
              <button
                type="button"
                onClick={() => setStep(5)}
                className="px-4 py-2 text-xs font-mono text-[#777164] hover:text-[#292728]"
              >
                ← Back
              </button>
            </div>
          </div>
        )}
      </main>

      <EditorialFooter />
    </div>
  );
}
