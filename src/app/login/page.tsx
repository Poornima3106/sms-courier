'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Eye, EyeOff, Lock, User, Sparkles, AlertCircle } from 'lucide-react';
import { useI18n } from '@/lib/i18n';

export default function LoginPage() {
  const router = useRouter();
  const { t, language } = useI18n();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Failed to login');
        setLoading(false);
        return;
      }

      if (data.user?.must_change_password) {
        router.push('/change-password');
      } else {
        router.push('/dashboard');
      }
      router.refresh();
    } catch {
      setError('An unexpected error occurred. Please try again.');
      setLoading(false);
    }
  };

  const fillQuickLogin = (u: string, p: string) => {
    setUsername(u);
    setPassword(p);
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white dark:bg-[#1E0D12] rounded-3xl shadow-2xl border border-[#EFE4D3] dark:border-[#3A1B23] p-8 sm:p-10 relative overflow-hidden">
        {/* Decorative Golden Accent */}
        <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-[#7A1626] via-[#D4AF37] to-[#7A1626]" />

        {/* Branding */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-[#7A1626] text-[#FBF6EF] font-serif font-black text-3xl shadow-lg mb-4">
            ம
          </div>
          <h2 className="text-2xl sm:text-3xl font-serif font-bold text-[#7A1626] dark:text-[#E5B84B] tracking-tight">
            Sri Mahadevaiyer Sweets
          </h2>
          <p className="text-xs uppercase tracking-widest font-semibold text-gray-500 dark:text-gray-400 mt-1">
            Since 1946 • Madurai, Tamil Nadu
          </p>
          <div className="mt-3 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#7A1626]/10 dark:bg-[#7A1626]/30 text-[#7A1626] dark:text-[#E5B84B] text-xs font-medium">
            <Sparkles className="w-3.5 h-3.5 text-[#D4AF37]" />
            <span>Order & Courier Management</span>
          </div>
        </div>

        {error && (
          <div className="mb-6 p-4 rounded-2xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/50 flex items-start gap-3 text-red-700 dark:text-red-300 text-sm animate-in fade-in">
            <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
            <p>{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300 mb-2">
              Username
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                <User className="w-5 h-5" />
              </div>
              <input
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="owner or staff"
                className="w-full pl-11 pr-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-[#140A0D] text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#7A1626] dark:focus:ring-[#D4AF37] transition-all text-sm"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300 mb-2">
              Password
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                <Lock className="w-5 h-5" />
              </div>
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-11 pr-12 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-[#140A0D] text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#7A1626] dark:focus:ring-[#D4AF37] transition-all text-sm"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 px-4 rounded-xl bg-[#7A1626] hover:bg-[#5B0E1B] text-white font-semibold text-sm tracking-wide shadow-lg shadow-[#7A1626]/25 transition-all transform active:scale-98 disabled:opacity-50 cursor-pointer"
          >
            {loading ? 'Logging in...' : 'Sign In to Portal'}
          </button>
        </form>

        {/* Quick Demo Helper */}
        <div className="mt-8 pt-6 border-t border-gray-100 dark:border-gray-800">
          <p className="text-xs text-center font-medium text-gray-500 dark:text-gray-400 mb-2.5">
            Quick Login Credentials:
          </p>
          <div className="flex gap-2 justify-center">
            <button
              type="button"
              onClick={() => fillQuickLogin('owner', 'Admin@1946')}
              className="px-3 py-1.5 rounded-lg bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/50 text-[11px] font-semibold text-amber-900 dark:text-amber-200 hover:bg-amber-100 transition-colors"
            >
              👑 Owner: owner
            </button>
            <button
              type="button"
              onClick={() => fillQuickLogin('staff', 'Staff@1946')}
              className="px-3 py-1.5 rounded-lg bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800/50 text-[11px] font-semibold text-blue-900 dark:text-blue-200 hover:bg-blue-100 transition-colors"
            >
              👤 Staff: staff
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
