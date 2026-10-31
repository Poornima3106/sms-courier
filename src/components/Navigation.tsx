'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useI18n } from '@/lib/i18n';
import {
  LayoutDashboard,
  Package,
  PlusCircle,
  Truck,
  Search,
  BarChart3,
  Users,
  History,
  Settings,
} from 'lucide-react';
import { UserRole } from '@/lib/types';

interface NavigationProps {
  userRole?: UserRole;
  isMobileOpen?: boolean;
  onCloseMobile?: () => void;
}

export default function Navigation({ userRole = 'staff', isMobileOpen, onCloseMobile }: NavigationProps) {
  const pathname = usePathname();
  const { t } = useI18n();

  const isOwner = userRole === 'owner';

  const navItems = [
    { href: '/dashboard', label: t.nav.dashboard, icon: LayoutDashboard, role: 'staff' },
    { href: '/orders', label: t.nav.orders, icon: Package, role: 'staff' },
    { href: '/orders/add', label: t.nav.addOrder, icon: PlusCircle, role: 'staff' },
    { href: '/dispatch', label: t.nav.dispatch, icon: Truck, role: 'staff' },
    { href: '/track', label: t.nav.track, icon: Search, role: 'staff' },
    // Owner Only links
    ...(isOwner
      ? [
          { href: '/reports', label: t.nav.reports, icon: BarChart3, role: 'owner' },
          { href: '/users', label: t.nav.users, icon: Users, role: 'owner' },
          { href: '/activity', label: t.nav.activity, icon: History, role: 'owner' },
          { href: '/settings', label: t.nav.settings, icon: Settings, role: 'owner' },
        ]
      : []),
  ];

  return (
    <>
      {/* Desktop Navigation Bar */}
      <nav className="hidden md:block bg-white dark:bg-[#1E0D12] border-b border-[#EFE4D3] dark:border-[#3A1B23] shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center space-x-1 lg:space-x-2 py-2 overflow-x-auto">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href));

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-sm font-medium transition-all shrink-0 ${
                    isActive
                      ? 'bg-[#7A1626] text-white shadow-sm'
                      : 'text-gray-700 dark:text-gray-300 hover:bg-[#FBF6EF] dark:hover:bg-[#2B141B] hover:text-[#7A1626] dark:hover:text-[#E5B84B]'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-[#7A1626] dark:text-[#E5B84B]'}`} />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </div>
        </div>
      </nav>

      {/* Mobile Drawer Overlay */}
      {isMobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden bg-black/60 backdrop-blur-xs flex">
          <div className="w-72 bg-white dark:bg-[#1E0D12] h-full shadow-2xl flex flex-col p-5 border-r border-[#EFE4D3] dark:border-[#3A1B23]">
            <div className="flex items-center justify-between pb-4 border-b border-gray-100 dark:border-gray-800 mb-4">
              <span className="font-serif font-bold text-lg text-[#7A1626] dark:text-[#E5B84B]">
                Menu
              </span>
              <button
                onClick={onCloseMobile}
                className="text-gray-500 hover:text-gray-800 dark:hover:text-gray-200 text-sm font-bold p-1"
              >
                ✕
              </button>
            </div>

            <div className="flex-1 space-y-1.5 overflow-y-auto">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href;

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={onCloseMobile}
                    className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors ${
                      isActive
                        ? 'bg-[#7A1626] text-white font-semibold'
                        : 'text-gray-700 dark:text-gray-300 hover:bg-[#FBF6EF] dark:hover:bg-[#2B141B]'
                    }`}
                  >
                    <Icon className="w-5 h-5 shrink-0" />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </div>
          </div>
          <div className="flex-1" onClick={onCloseMobile} />
        </div>
      )}

      {/* Mobile Bottom Navigation Bar (Sticky for staff during phone usage) */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-[#1E0D12]/95 backdrop-blur-md border-t border-[#EFE4D3] dark:border-[#3A1B23] px-2 py-1 shadow-lg">
        <div className="flex items-center justify-around">
          <Link
            href="/dashboard"
            className={`flex flex-col items-center py-1 px-2 rounded-lg text-[10px] font-medium ${
              pathname === '/dashboard' ? 'text-[#7A1626] dark:text-[#E5B84B] font-bold' : 'text-gray-500'
            }`}
          >
            <LayoutDashboard className="w-5 h-5 mb-0.5" />
            <span>{t.nav.dashboard}</span>
          </Link>

          <Link
            href="/orders"
            className={`flex flex-col items-center py-1 px-2 rounded-lg text-[10px] font-medium ${
              pathname === '/orders' ? 'text-[#7A1626] dark:text-[#E5B84B] font-bold' : 'text-gray-500'
            }`}
          >
            <Package className="w-5 h-5 mb-0.5" />
            <span>{t.nav.orders}</span>
          </Link>

          <Link
            href="/orders/add"
            className="flex flex-col items-center -mt-4"
          >
            <div className="w-12 h-12 rounded-full bg-[#7A1626] text-white flex items-center justify-center shadow-lg border-2 border-white dark:border-[#1E0D12]">
              <PlusCircle className="w-6 h-6" />
            </div>
            <span className="text-[10px] font-bold text-[#7A1626] dark:text-[#E5B84B] mt-0.5">
              {t.nav.addOrder}
            </span>
          </Link>

          <Link
            href="/dispatch"
            className={`flex flex-col items-center py-1 px-2 rounded-lg text-[10px] font-medium ${
              pathname === '/dispatch' ? 'text-[#7A1626] dark:text-[#E5B84B] font-bold' : 'text-gray-500'
            }`}
          >
            <Truck className="w-5 h-5 mb-0.5" />
            <span>{t.nav.dispatch}</span>
          </Link>

          <Link
            href="/track"
            className={`flex flex-col items-center py-1 px-2 rounded-lg text-[10px] font-medium ${
              pathname === '/track' ? 'text-[#7A1626] dark:text-[#E5B84B] font-bold' : 'text-gray-500'
            }`}
          >
            <Search className="w-5 h-5 mb-0.5" />
            <span>{t.nav.track}</span>
          </Link>
        </div>
      </div>
    </>
  );
}
