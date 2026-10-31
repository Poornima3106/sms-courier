'use client';

import React from 'react';
import useSWR from 'swr';
import { useI18n } from '@/lib/i18n';
import { ActivityLog } from '@/lib/types';
import { formatDate } from '@/lib/utils/format';
import { History, User, Clock, Package, RotateCw } from 'lucide-react';

const fetcher = (url: string) => fetch(url).then((res) => (res.ok ? res.json() : null));

export default function ActivityLogPage() {
  const { t } = useI18n();

  const { data, isLoading } = useSWR('/api/activity', fetcher, {
    refreshInterval: 10000,
    revalidateOnFocus: true,
  });

  const logs: ActivityLog[] = data?.logs || [];

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white dark:bg-[#1E0D12] p-5 sm:p-6 rounded-3xl shadow-sm border border-[#EFE4D3] dark:border-[#3A1B23]">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-[#7A1626] text-white flex items-center justify-center shadow-md">
            <History className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl sm:text-2xl font-serif font-bold text-[#7A1626] dark:text-[#E5B84B]">
                {t.nav.activity}
              </h2>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300">
                Owner Only
              </span>
            </div>
            <p className="text-xs text-gray-500">
              Audit log of staff actions: order creations, courier dispatches, status changes, and deletions
            </p>
          </div>
        </div>
      </div>

      {/* Activity Log List */}
      <div className="bg-white dark:bg-[#1E0D12] rounded-3xl shadow-sm border border-[#EFE4D3] dark:border-[#3A1B23] p-5 sm:p-6">
        {isLoading ? (
          <div className="py-16 text-center text-sm text-gray-500">
            <RotateCw className="w-6 h-6 animate-spin mx-auto mb-2 text-[#7A1626]" />
            Loading activity log...
          </div>
        ) : logs.length === 0 ? (
          <div className="py-16 text-center text-sm text-gray-500">No activity logged yet.</div>
        ) : (
          <div className="divide-y divide-gray-100 dark:divide-gray-800">
            {logs.map((log) => {
              const time = new Date(log.created_at).toLocaleTimeString('en-IN', {
                hour: '2-digit',
                minute: '2-digit',
              });

              return (
                <div key={log.id} className="py-3.5 flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-full bg-[#FBF6EF] dark:bg-[#2A141A] text-[#7A1626] dark:text-[#E5B84B] flex items-center justify-center shrink-0 mt-0.5 border border-[#EFE4D3] dark:border-[#3A1B23]">
                      <User className="w-4 h-4" />
                    </div>

                    <div>
                      <p className="text-xs sm:text-sm font-semibold text-gray-900 dark:text-gray-100">
                        {log.action}
                      </p>
                      <div className="flex items-center gap-2 mt-1 text-[11px] text-gray-400">
                        <span className="font-medium text-gray-600 dark:text-gray-300">{log.user_name}</span>
                        {log.order_no && (
                          <span className="px-1.5 py-0.5 rounded bg-gray-100 dark:bg-gray-800 font-mono font-bold text-[#7A1626] dark:text-[#E5B84B]">
                            {log.order_no}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <span className="text-[11px] text-gray-500 font-mono block">{time}</span>
                    <span className="text-[10px] text-gray-400">{formatDate(log.created_at)}</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
