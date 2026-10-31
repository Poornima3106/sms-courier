'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useI18n } from '@/lib/i18n';
import { Moon, Sun, Globe, LogOut, User as UserIcon, Menu, X, Sparkles } from 'lucide-react';
import { UserRole } from '@/lib/types';

interface HeaderProps {
  currentUser?: {
    username: string;
    full_name: string;
    role: UserRole;
  } | null;
  onToggleMobileMenu?: () => void;
  isMobileMenuOpen?: boolean;
}

export default function Header({ currentUser, onToggleMobileMenu, isMobileMenuOpen }: HeaderProps) {
  const { language, setLanguage, t } = useI18n();
  const [isDark, setIsDark] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const savedTheme = localStorage.getItem('sms_theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    if (savedTheme === 'dark' || (!savedTheme && prefersDark)) {
      setIsDark(true);
      document.documentElement.classList.add('dark');
    } else {
      setIsDark(false);
      document.documentElement.classList.remove('dark');
    }
  }, []);

  const toggleTheme = () => {
    if (isDark) {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('sms_theme', 'light');
      setIsDark(false);
    } else {
      document.documentElement.classList.add('dark');
      localStorage.setItem('sms_theme', 'dark');
      setIsDark(true);
    }
  };

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      router.push('/login');
      router.refresh();
    } catch (err) {
      console.error('Logout error:', err);
    }
  };

  return (
    <header className="sticky top-0 z-40 bg-[#7A1626] text-white shadow-lg border-b border-[#5B0E1B]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-20">
          {/* Brand & Title */}
          <div className="flex items-center gap-3">
            {onToggleMobileMenu && (
              <button
                type="button"
                onClick={onToggleMobileMenu}
                aria-label="Toggle menu"
                className="md:hidden p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors"
              >
                {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            )}

            <Link href="/dashboard" className="flex items-center gap-3 group">
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-[#FBF6EF] text-[#7A1626] flex items-center justify-center font-serif font-black text-xl sm:text-2xl shadow-inner group-hover:scale-105 transition-transform">
                <span>ம</span>
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="font-serif font-bold text-base sm:text-xl tracking-tight leading-tight text-[#FBF6EF]">
                    Sri Mahadevaiyer Sweets – Since 1946
                  </h1>
                  <span className="hidden lg:inline-flex items-center gap-1 text-[10px] uppercase font-semibold px-2 py-0.5 rounded-full bg-[#D4AF37]/30 text-[#FBF6EF] border border-[#D4AF37]/40">
                    <Sparkles className="w-2.5 h-2.5" /> Madurai
                  </span>
                </div>
                <p className="text-xs text-[#FBF6EF]/80 font-sans hidden sm:block">
                  {language === 'ta'
                    ? 'ஆர்டர் மற்றும் கூரியர் மேலாண்மை அமைப்பு • மதுரை'
                    : 'Order & Courier Management System • Madurai, Tamil Nadu'}
                </p>
              </div>
            </Link>
          </div>

          {/* Right Controls: Language, Theme, User Profile */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Language Switcher */}
            <button
              onClick={() => setLanguage(language === 'en' ? 'ta' : 'en')}
              className="flex items-center gap-1.5 px-2.5 py-1.5 sm:px-3 sm:py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-xs sm:text-sm font-medium transition-colors border border-white/10"
              title="Toggle Language (English / தமிழ்)"
            >
              <Globe className="w-3.5 h-3.5" />
              <span>{language === 'en' ? 'தமிழ்' : 'English'}</span>
            </button>

            {/* Dark Mode Toggle */}
            <button
              onClick={toggleTheme}
              className="p-2 sm:p-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors border border-white/10"
              title="Toggle Dark/Light Mode"
              aria-label="Toggle Dark Mode"
            >
              {isDark ? <Sun className="w-4 h-4 text-amber-300" /> : <Moon className="w-4 h-4" />}
            </button>

            {/* User Profile & Role */}
            {currentUser && (
              <div className="flex items-center gap-2 sm:gap-3 pl-2 border-l border-white/15">
                <div className="hidden md:flex flex-col text-right">
                  <span className="text-xs font-semibold text-white leading-tight">
                    {currentUser.full_name}
                  </span>
                  <span className="text-[10px] capitalize text-[#FBF6EF]/70 font-medium">
                    {currentUser.role === 'owner' ? '👑 Owner' : '👤 Staff'}
                  </span>
                </div>

                <button
                  onClick={handleLogout}
                  className="flex items-center gap-1.5 p-2 sm:px-3 sm:py-1.5 rounded-xl bg-white/10 hover:bg-red-900/60 text-xs sm:text-sm font-medium transition-all text-[#FBF6EF] border border-white/10"
                  title={t.logout}
                >
                  <LogOut className="w-4 h-4" />
                  <span className="hidden sm:inline">{t.logout}</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
