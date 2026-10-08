'use client';

import React from 'react';
import Link from 'next/link';
import { Show, SignInButton } from '@clerk/nextjs';
import { Navigation } from './components/Navigation';
import { EditorialFooter } from './components/EditorialFooter';

export default function EditorialHomePage() {
  return (
    <div className="min-h-screen flex flex-col bg-[#F3EED7] text-[#292728]">
      <Navigation />

      {/* Main Journal Cover / Hero */}
      <main className="flex-1 max-w-4xl mx-auto w-full px-6 py-16 md:py-24 flex flex-col justify-center">
        {/* Subtle Journal Marker */}
        <div className="flex items-center gap-3 mb-8">
          <span className="h-px w-8 bg-[#B6A46A]" />
          <span className="text-xs font-mono tracking-widest uppercase text-[#777164]">
            Issue No. 1 · Field Notes for Readers
          </span>
        </div>

        {/* Hero Editorial Heading */}
        <div className="space-y-4 mb-10">
          <h1 className="text-5xl md:text-7xl font-serif font-normal tracking-tight leading-[1.08] text-[#292728]">
            Read something.
            <br />
            <span className="italic font-serif text-[#777164]">Then go somewhere.</span>
          </h1>

          <p className="text-lg md:text-xl text-[#524E48] font-serif leading-relaxed max-w-2xl pt-4">
            ExploBook is an AI reading companion that gets out of your way. We connect the themes of what you read with tactile, real-world exploration outside your door.
          </p>
        </div>

        {/* Thin Rule */}
        <div className="w-full h-px bg-[#B6A46A]/30 my-8" />

        {/* Editorial Manifest / Philosophy Columns */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 py-4 mb-12">
          <div className="space-y-2">
            <span className="text-[11px] font-mono text-[#B6A46A] uppercase tracking-wider">
              I. The Inward Chapter
            </span>
            <h3 className="font-serif text-lg font-bold text-[#292728]">
              Grounding in Thought
            </h3>
            <p className="text-sm text-[#524E48] leading-relaxed">
              Discover literature through local Gemma reasoning and reader DNA tailored to your curiosity, not viral social algorithms.
            </p>
          </div>

          <div className="space-y-2">
            <span className="text-[11px] font-mono text-[#B6A46A] uppercase tracking-wider">
              II. The Outward Step
            </span>
            <h3 className="font-serif text-lg font-bold text-[#292728]">
              Touch Grass Mode
            </h3>
            <p className="text-sm text-[#524E48] leading-relaxed">
              When a chapter closes, put your phone in your pocket. Complete brief real-world observational expeditions tied to the author&apos;s essence.
            </p>
          </div>

          <div className="space-y-2">
            <span className="text-[11px] font-mono text-[#B6A46A] uppercase tracking-wider">
              III. The Keepsake
            </span>
            <h3 className="font-serif text-lg font-bold text-[#292728]">
              Reflect &amp; Mint Orbs
            </h3>
            <p className="text-sm text-[#524E48] leading-relaxed">
              Return to record what you observed. Synthesize your field notes into permanent elemental Orbs and evolve your living Reader DNA.
            </p>
          </div>
        </div>

        {/* Call to Action Section */}
        <div className="pt-6 flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
          <Link
            href="/onboarding"
            className="inline-flex items-center justify-center px-8 py-4 rounded bg-[#292728] text-[#F3EED7] font-mono text-xs uppercase tracking-widest hover:bg-[#3D3A3B] transition-colors shadow-sm text-center"
            id="home-get-started-btn"
          >
            Get Started →
          </Link>

          <Link
            href="/journey"
            className="inline-flex items-center justify-center px-8 py-4 rounded border border-[#B6A46A]/60 bg-[#FFFDF5] text-[#292728] font-mono text-xs uppercase tracking-widest hover:bg-[#E9E2C7]/30 transition-colors text-center"
            id="home-continue-journey-btn"
          >
            Continue Journey →
          </Link>
        </div>

        {/* Quotation Vignette */}
        <div className="mt-20 p-8 border-l-2 border-[#B6A46A] bg-[#FFFDF5]/60 rounded-r-lg">
          <blockquote className="font-serif italic text-lg text-[#292728] leading-relaxed mb-3">
            &ldquo;The book starts the adventure. The real world completes it.&rdquo;
          </blockquote>
          <cite className="not-italic text-xs font-mono text-[#777164] uppercase tracking-wider block">
            — The ExploBook Manifesto
          </cite>
        </div>
      </main>

      <EditorialFooter />
    </div>
  );
}
