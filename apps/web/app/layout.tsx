import type { Metadata } from 'next';
import './globals.css';
import { APP_NAME, APP_TAGLINE } from '@explobook/shared';
import { ClerkProvider } from '@clerk/nextjs';

export const metadata: Metadata = {
  title: `${APP_NAME} — Touch Grass`,
  description: APP_TAGLINE,
};

const publishableKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY || 'pk_test_placeholder_build_time_explobook';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ClerkProvider publishableKey={publishableKey}>
      <html lang="en">
        <body className="bg-[#F3EED7] text-[#292728] antialiased min-h-screen">
          {children}
        </body>
      </html>
    </ClerkProvider>
  );
}
