import React from 'react';

export function EditorialFooter() {
  return (
    <footer className="w-full border-t border-[#B6A46A]/20 py-10 mt-auto bg-[#F3EED7]">
      <div className="max-w-4xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-4 text-xs font-mono text-[#777164]">
        <div>
          <span className="font-serif italic text-sm text-[#292728]">ExploBook</span>
          <span className="mx-2 text-[#B6A46A]/40">·</span>
          <span>The book starts the adventure. The real world completes it.</span>
        </div>
        <div className="flex items-center gap-2 text-[11px] text-[#B6A46A]">
          <span>Gemma 3 4B</span>
          <span>·</span>
          <span>Mastra</span>
          <span>·</span>
          <span>Atlas Vector</span>
          <span>·</span>
          <span>SerpApi</span>
          <span>·</span>
          <span>ElevenLabs</span>
        </div>
      </div>
    </footer>
  );
}
