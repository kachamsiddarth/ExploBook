'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Show, SignInButton, UserButton } from '@clerk/nextjs';
import { APP_NAME } from '@explobook/shared';

const NAV_ITEMS = [
  { href: '/', label: 'Home' },
  { href: '/discover', label: 'Discover' },
  { href: '/journey', label: 'Journey' },
  { href: '/trail', label: 'Trail' },
  { href: '/orbs', label: 'Orbs' },
];

export function Navigation() {
  const pathname = usePathname();

  return (
    <header className="w-full border-b border-[#B6A46A]/25 bg-[#F3EED7]/90 backdrop-blur-sm sticky top-0 z-50">
      <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
        {/* Brand */}
        <Link
          href="/"
          className="group flex items-baseline gap-2 text-xl font-serif font-bold text-[#292728] tracking-tight hover:opacity-80 transition-opacity"
          aria-label="ExploBook Home"
        >
          <span>{APP_NAME}</span>
          <span className="text-[10px] font-mono tracking-widest text-[#777164] uppercase opacity-70 group-hover:opacity-100 transition-opacity">
            JOURNAL
          </span>
        </Link>

        {/* Center Nav Links */}
        <nav className="flex items-center gap-1 sm:gap-2">
          {NAV_ITEMS.map((item) => {
            const isActive =
              item.href === '/'
                ? pathname === '/'
                : pathname.startsWith(item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`px-3 py-1.5 rounded text-xs font-mono tracking-wider transition-all duration-150 ${
                  isActive
                    ? 'text-[#292728] font-bold border-b-2 border-[#292728] bg-[#E9E2C7]/40'
                    : 'text-[#777164] hover:text-[#292728] hover:bg-[#E9E2C7]/20'
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* Auth / Profile */}
        <div className="flex items-center gap-3">
          <Show when="signed-in">
            <UserButton />
          </Show>
          <Show when="signed-out">
            <SignInButton mode="modal">
              <button className="px-3.5 py-1.5 rounded text-xs font-mono tracking-wider bg-[#292728] text-[#F3EED7] hover:bg-[#3D3A3B] transition-colors shadow-sm focus:outline-none focus:ring-1 focus:ring-[#B6A46A]">
                Sign In
              </button>
            </SignInButton>
          </Show>
        </div>
      </div>
    </header>
  );
}
