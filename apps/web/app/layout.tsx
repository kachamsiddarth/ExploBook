import type { Metadata } from 'next';
import './globals.css';
import { APP_NAME, APP_TAGLINE } from '@explobook/shared';

export const metadata: Metadata = {
  title: `${APP_NAME} — Touch Grass`,
  description: APP_TAGLINE,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-[#F3EED7] text-[#292728] antialiased min-h-screen">
        {children}
      </body>
    </html>
  );
}
