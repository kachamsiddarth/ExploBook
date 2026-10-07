'use client';

import { APP_NAME, APP_TAGLINE } from '@explobook/shared';
import { Show, SignInButton, UserButton } from '@clerk/nextjs';

export default function HomePage() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-8 text-center bg-[#F3EED7] text-[#292728]">
      <header className="absolute top-6 right-6">
        <Show when="signed-in">
          <UserButton />
        </Show>
        <Show when="signed-out">
          <SignInButton mode="modal">
            <button className="px-4 py-2 rounded text-sm font-medium bg-[#292728] text-[#F3EED7] hover:bg-[#3D3A3B] transition-colors">
              Sign In
            </button>
          </SignInButton>
        </Show>
      </header>

      <div className="max-w-2xl border border-[#B6A46A]/30 p-12 rounded-lg bg-[#FFFDF5]/80 shadow-sm">
        <h1 className="text-4xl font-serif font-bold tracking-tight mb-3">
          {APP_NAME}
        </h1>
        <p className="text-lg text-[#777164] font-medium mb-6">
          {APP_TAGLINE}
        </p>
        <div className="inline-block bg-[#E9E2C7] px-4 py-2 rounded text-sm text-[#292728] font-mono mb-8 border border-[#B6A46A]/20">
          Phase 2 Identity &amp; Catalogue Operational
        </div>
        <p className="text-sm text-[#777164] max-w-md mx-auto leading-relaxed mb-6">
          AI helps you choose and reflect, then gets out of the way while you step outside and explore.
        </p>
        <div className="flex justify-center gap-4 text-xs font-mono text-[#777164]">
          <span>Clerk Verified</span>
          <span>•</span>
          <span>MongoDB Atlas</span>
          <span>•</span>
          <span>Book Catalogue</span>
        </div>
      </div>
    </main>
  );
}
