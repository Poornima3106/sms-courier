import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';
import AppShell from '@/components/AppShell';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'Sri Mahadevaiyer Sweets – Order & Courier Management (Since 1946)',
  description: 'Order and courier management system for Sri Mahadevaiyer Sweets, Pollachi. Track Diwali sweet-box dispatches and orders.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col bg-[#FBF6EF] dark:bg-[#140A0D] text-[#2B1810] dark:text-[#FBF6EF]">
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
