'use client';

import React, { useState } from 'react';
import useSWR from 'swr';
import Link from 'next/link';
import { useI18n } from '@/lib/i18n';
import { Order } from '@/lib/types';
import {
  Package,
  Clock,
  Truck,
  CheckCircle2,
  AlertOctagon,
  PlusCircle,
  Calendar,
  ArrowRight,
  TrendingUp,
  PieChart as PieChartIcon,
} from 'lucide-react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';
import { formatDate } from '@/lib/utils/format';

const fetcher = (url: string) => fetch(url).then((res) => res.json());

const DONUT_COLORS = ['#7A1626', '#D4AF37', '#2563EB', '#10B981', '#9333EA', '#F97316'];

export default function DashboardPage() {
  const { t } = useI18n();

  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  const queryParams = new URLSearchParams();
  if (dateFrom) queryParams.set('dateFrom', dateFrom);
  if (dateTo) queryParams.set('dateTo', dateTo);

  // SWR: auto-refreshes every 10 seconds + on focus as requested!
  const { data, error, isLoading } = useSWR(
    `/api/orders?${queryParams.toString()}`,
    fetcher,
    {
      refreshInterval: 10000,
      revalidateOnFocus: true,
    }
  );

  const orders: Order[] = data?.orders || [];

  // Metrics calculation
  const totalOrders = orders.length;
  const pendingOrders = orders.filter((o) => o.status === 'Pending').length;
  const inTransitOrders = orders.filter((o) => o.status === 'In Transit').length;
  const deliveredOrders = orders.filter((o) => o.status === 'Delivered').length;
  const problemOrders = orders.filter((o) => ['Delayed', 'Returned', 'Damaged'].includes(o.status)).length;

  // Dispatch trend line chart data (by order_date or dispatch_date)
  const dateCounts: Record<string, number> = {};
  for (const o of orders) {
    const d = o.dispatch_date || o.order_date;
    dateCounts[d] = (dateCounts[d] || 0) + 1;
  }
  const trendData = Object.entries(dateCounts)
    .sort(([a], [b]) => a.localeCompare(b))
    .slice(-7)
    .map(([date, count]) => ({
      date: formatDate(date).slice(0, 6),
      orders: count,
    }));

  // Courier Donut chart data
  const courierCounts: Record<string, number> = {};
  for (const o of orders) {
    const c = o.courier || 'Unassigned';
    courierCounts[c] = (courierCounts[c] || 0) + 1;
  }
  const donutData = Object.entries(courierCounts).map(([name, value]) => ({
    name,
    value,
  }));

  return (
    <div className="space-y-6">
      {/* Welcome & Top Controls */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-white dark:bg-[#1E0D12] p-5 sm:p-6 rounded-3xl shadow-sm border border-[#EFE4D3] dark:border-[#3A1B23]">
        <div>
          <h2 className="text-xl sm:text-2xl font-serif font-bold text-[#7A1626] dark:text-[#E5B84B]">
            {t.nav.dashboard}
          </h2>
          <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-0.5">
            Diwali Sweet-Box Dispatch & Courier Overview • Live Updates (10s)
          </p>
        </div>

        {/* Date Filter & Quick Add */}
        <div className="flex flex-wrap items-center gap-2.5">
          <div className="flex items-center gap-1.5 bg-gray-50 dark:bg-[#140A0D] border border-gray-200 dark:border-gray-800 rounded-xl px-3 py-1.5 text-xs">
            <Calendar className="w-3.5 h-3.5 text-gray-400" />
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="bg-transparent outline-none text-xs text-gray-700 dark:text-gray-300"
            />
            <span className="text-gray-400">to</span>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="bg-transparent outline-none text-xs text-gray-700 dark:text-gray-300"
            />
            {(dateFrom || dateTo) && (
              <button
                onClick={() => {
                  setDateFrom('');
                  setDateTo('');
                }}
                className="text-red-500 font-bold ml-1 hover:text-red-700 text-xs"
              >
                ✕
              </button>
            )}
          </div>

          <Link
            href="/orders/add"
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#7A1626] hover:bg-[#5B0E1B] text-white font-medium text-xs sm:text-sm shadow-md transition-all shrink-0"
          >
            <PlusCircle className="w-4 h-4" />
            <span>{t.buttons.addOrder}</span>
          </Link>
        </div>
      </div>

      {/* Metric Cards Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4">
        {/* Total Orders */}
        <div className="bg-white dark:bg-[#1E0D12] p-4 sm:p-5 rounded-2xl shadow-xs border border-[#EFE4D3] dark:border-[#3A1B23] flex flex-col justify-between">
          <div className="flex items-center justify-between text-gray-500 dark:text-gray-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">{t.metrics.totalOrders}</span>
            <div className="w-8 h-8 rounded-xl bg-purple-50 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400 flex items-center justify-center">
              <Package className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-bold font-serif text-gray-900 dark:text-gray-100">
            {isLoading ? '...' : totalOrders}
          </div>
          <span className="text-[11px] text-gray-400 mt-1">Recorded in system</span>
        </div>

        {/* Pending Dispatch */}
        <Link
          href="/dispatch"
          className="bg-white dark:bg-[#1E0D12] p-4 sm:p-5 rounded-2xl shadow-xs border border-[#EFE4D3] dark:border-[#3A1B23] flex flex-col justify-between hover:border-amber-400 transition-colors group"
        >
          <div className="flex items-center justify-between text-gray-500 dark:text-gray-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-amber-700 dark:text-amber-400">
              {t.metrics.pending}
            </span>
            <div className="w-8 h-8 rounded-xl bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-bold font-serif text-amber-600 dark:text-amber-400">
            {isLoading ? '...' : pendingOrders}
          </div>
          <span className="text-[11px] text-amber-600/80 font-medium flex items-center gap-1 mt-1">
            Dispatch now <ArrowRight className="w-3 h-3" />
          </span>
        </Link>

        {/* In Transit */}
        <div className="bg-white dark:bg-[#1E0D12] p-4 sm:p-5 rounded-2xl shadow-xs border border-[#EFE4D3] dark:border-[#3A1B23] flex flex-col justify-between">
          <div className="flex items-center justify-between text-gray-500 dark:text-gray-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">{t.metrics.inTransit}</span>
            <div className="w-8 h-8 rounded-xl bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 flex items-center justify-center">
              <Truck className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-bold font-serif text-blue-600 dark:text-blue-400">
            {isLoading ? '...' : inTransitOrders}
          </div>
          <span className="text-[11px] text-gray-400 mt-1">With courier partners</span>
        </div>

        {/* Delivered */}
        <div className="bg-white dark:bg-[#1E0D12] p-4 sm:p-5 rounded-2xl shadow-xs border border-[#EFE4D3] dark:border-[#3A1B23] flex flex-col justify-between">
          <div className="flex items-center justify-between text-gray-500 dark:text-gray-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">{t.metrics.delivered}</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-bold font-serif text-emerald-600 dark:text-emerald-400">
            {isLoading ? '...' : deliveredOrders}
          </div>
          <span className="text-[11px] text-emerald-600/80 font-medium mt-1">Reached customers</span>
        </div>

        {/* Problems (Delayed, Returned, Damaged) */}
        <div className="col-span-2 lg:col-span-1 bg-white dark:bg-[#1E0D12] p-4 sm:p-5 rounded-2xl shadow-xs border border-[#EFE4D3] dark:border-[#3A1B23] flex flex-col justify-between">
          <div className="flex items-center justify-between text-gray-500 dark:text-gray-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-rose-700 dark:text-rose-400">
              {t.metrics.problems}
            </span>
            <div className="w-8 h-8 rounded-xl bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 flex items-center justify-center">
              <AlertOctagon className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-bold font-serif text-rose-600 dark:text-rose-400">
            {isLoading ? '...' : problemOrders}
          </div>
          <span className="text-[11px] text-rose-600/80 font-medium mt-1">Requires staff attention</span>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Dispatch Trend Line Chart */}
        <div className="lg:col-span-2 bg-white dark:bg-[#1E0D12] p-5 sm:p-6 rounded-3xl shadow-sm border border-[#EFE4D3] dark:border-[#3A1B23]">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-xl bg-[#7A1626]/10 text-[#7A1626] dark:text-[#E5B84B]">
                <TrendingUp className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-serif font-bold text-base text-gray-900 dark:text-gray-100">
                  Dispatch Trend by Date
                </h3>
                <p className="text-xs text-gray-500">Daily sweet-box shipment trajectory</p>
              </div>
            </div>
          </div>

          <div className="h-64 sm:h-72 w-full">
            {trendData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={trendData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                  <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#201014',
                      color: '#fff',
                      borderRadius: '12px',
                      border: 'none',
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="orders"
                    stroke="#7A1626"
                    strokeWidth={3}
                    dot={{ r: 5, fill: '#D4AF37' }}
                    activeDot={{ r: 7 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-xs text-gray-400">
                No dispatch trend data for selected range
              </div>
            )}
          </div>
        </div>

        {/* Orders by Courier Donut Chart */}
        <div className="bg-white dark:bg-[#1E0D12] p-5 sm:p-6 rounded-3xl shadow-sm border border-[#EFE4D3] dark:border-[#3A1B23]">
          <div className="flex items-center gap-2 mb-4">
            <div className="p-2 rounded-xl bg-[#D4AF37]/15 text-[#D4AF37]">
              <PieChartIcon className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-serif font-bold text-base text-gray-900 dark:text-gray-100">
                Courier Distribution
              </h3>
              <p className="text-xs text-gray-500">Share of parcels by logistics partner</p>
            </div>
          </div>

          <div className="h-64 sm:h-72 w-full flex items-center justify-center">
            {donutData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={donutData}
                    cx="50%"
                    cy="45%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {donutData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={DONUT_COLORS[index % DONUT_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#201014',
                      color: '#fff',
                      borderRadius: '12px',
                      border: 'none',
                    }}
                  />
                  <Legend verticalAlign="bottom" wrapperStyle={{ fontSize: '11px' }} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="text-xs text-gray-400">No courier assignments yet</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
