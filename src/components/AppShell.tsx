'use client';

import React, { useState } from 'react';
import useSWR from 'swr';
import Header from './Header';
import Navigation from './Navigation';
import { I18nProvider } from '@/lib/i18n';
import { usePathname } from 'next/navigation';

const fetcher = (url: string) => fetch(url).then((res) => (res.ok ? res.json() : null));

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // SWR for user session
  const { data } = useSWR('/api/auth/me', fetcher, {
    refreshInterval: 30000,
    revalidateOnFocus: true,
  });

  const currentUser = data?.user || null;
  const isLoginPage = pathname === '/login' || pathname === '/change-password';

  return (
    <I18nProvider>
      <div className="min-h-screen flex flex-col bg-[#FBF6EF] dark:bg-[#140A0D] text-[#2B1810] dark:text-[#FBF6EF]">
        {!isLoginPage && (
          <>
            <Header
              currentUser={currentUser}
              onToggleMobileMenu={() => setMobileMenuOpen(!mobileMenuOpen)}
              isMobileMenuOpen={mobileMenuOpen}
            />
            <Navigation
              userRole={currentUser?.role || 'staff'}
              isMobileOpen={mobileMenuOpen}
              onCloseMobile={() => setMobileMenuOpen(false)}
            />
          </>
        )}

        <main className={`flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 ${!isLoginPage ? 'pb-24 md:pb-12' : ''}`}>
          {children}
        </main>
      </div>
    </I18nProvider>
  );
}
