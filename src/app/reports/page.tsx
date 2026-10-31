'use client';

import React, { useState } from 'react';
import useSWR from 'swr';
import { useI18n } from '@/lib/i18n';
import { formatCurrency } from '@/lib/utils/format';
import { exportOrdersToExcel, exportOrdersToPdf } from '@/lib/utils/export';
import {
  BarChart3,
  Calendar,
  FileSpreadsheet,
  FileText,
  DollarSign,
  Truck,
  MapPin,
  Clock,
  RotateCw,
} from 'lucide-react';

const fetcher = (url: string) => fetch(url).then((res) => (res.ok ? res.json() : null));

export default function ReportsPage() {
  const { t } = useI18n();

  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  const queryParams = new URLSearchParams();
  if (dateFrom) queryParams.set('dateFrom', dateFrom);
  if (dateTo) queryParams.set('dateTo', dateTo);

  const { data, isLoading } = useSWR(`/api/reports?${queryParams.toString()}`, fetcher, {
    refreshInterval: 10000,
    revalidateOnFocus: true,
  });

  const { data: ordersData } = useSWR(`/api/orders?${queryParams.toString()}`, fetcher);

  const summary = data?.summary || {
    totalOrders: 0,
    totalOrderAmount: 0,
    totalCourierCharges: 0,
    totalPendingAmount: 0,
    totalCodAmount: 0,
    totalPaidAmount: 0,
  };

  const cityReport = data?.cityReport || [];
  const courierReport = data?.courierReport || [];

  const handleExportExcel = () => {
    if (ordersData?.orders) {
      exportOrdersToExcel(ordersData.orders, `SMS_Reports_${new Date().toISOString().slice(0, 10)}.xlsx`);
    }
  };

  const handleExportPdf = () => {
    if (ordersData?.orders) {
      exportOrdersToPdf(ordersData.orders, 'Sri Mahadevaiyer Sweets – Financial & Dispatch Report');
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & Date Filter */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-white dark:bg-[#1E0D12] p-5 sm:p-6 rounded-3xl shadow-sm border border-[#EFE4D3] dark:border-[#3A1B23]">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-[#7A1626] text-white flex items-center justify-center shadow-md">
            <BarChart3 className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl sm:text-2xl font-serif font-bold text-[#7A1626] dark:text-[#E5B84B]">
                {t.nav.reports}
              </h2>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300">
                Owner Only
              </span>
            </div>
            <p className="text-xs text-gray-500">
              City-wise, courier-wise, and financial analytics for Diwali dispatch operations
            </p>
          </div>
        </div>

        {/* Date Filters & Export Buttons */}
        <div className="flex flex-wrap items-center gap-2.5">
          <div className="flex items-center gap-1.5 bg-gray-50 dark:bg-[#140A0D] border border-gray-200 dark:border-gray-800 rounded-xl px-3 py-1.5 text-xs">
            <Calendar className="w-3.5 h-3.5 text-gray-400" />
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="bg-transparent outline-none text-xs"
            />
            <span className="text-gray-400">to</span>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="bg-transparent outline-none text-xs"
            />
          </div>

          <button
            type="button"
            onClick={handleExportExcel}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-md transition-all cursor-pointer"
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>Excel</span>
          </button>

          <button
            type="button"
            onClick={handleExportPdf}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-semibold shadow-md transition-all cursor-pointer"
          >
            <FileText className="w-4 h-4" />
            <span>PDF</span>
          </button>
        </div>
      </div>

      {/* Financial Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Courier Charges */}
        <div className="bg-white dark:bg-[#1E0D12] p-5 rounded-2xl shadow-xs border border-[#EFE4D3] dark:border-[#3A1B23]">
          <span className="text-xs font-semibold uppercase tracking-wider text-gray-400 block mb-1">
            Total Courier Charges
          </span>
          <div className="text-2xl font-bold font-serif text-[#7A1626] dark:text-[#E5B84B]">
            {formatCurrency(summary.totalCourierCharges)}
          </div>
          <span className="text-[11px] text-gray-500 mt-1 block">Expense across all logistics</span>
        </div>

        {/* Total Order Amount */}
        <div className="bg-white dark:bg-[#1E0D12] p-5 rounded-2xl shadow-xs border border-[#EFE4D3] dark:border-[#3A1B23]">
          <span className="text-xs font-semibold uppercase tracking-wider text-gray-400 block mb-1">
            Total Order Value
          </span>
          <div className="text-2xl font-bold font-serif text-emerald-600">
            {formatCurrency(summary.totalOrderAmount)}
          </div>
          <span className="text-[11px] text-emerald-600/80 mt-1 block">
            Paid: {formatCurrency(summary.totalPaidAmount)}
          </span>
        </div>

        {/* Pending Amount Due */}
        <div className="bg-white dark:bg-[#1E0D12] p-5 rounded-2xl shadow-xs border border-[#EFE4D3] dark:border-[#3A1B23]">
          <span className="text-xs font-semibold uppercase tracking-wider text-gray-400 block mb-1">
            Payment Pending
          </span>
          <div className="text-2xl font-bold font-serif text-amber-600">
            {formatCurrency(summary.totalPendingAmount)}
          </div>
          <span className="text-[11px] text-amber-600/80 mt-1 block">Awaiting customer clearance</span>
        </div>

        {/* COD Amount Due */}
        <div className="bg-white dark:bg-[#1E0D12] p-5 rounded-2xl shadow-xs border border-[#EFE4D3] dark:border-[#3A1B23]">
          <span className="text-xs font-semibold uppercase tracking-wider text-gray-400 block mb-1">
            COD to Collect
          </span>
          <div className="text-2xl font-bold font-serif text-blue-600">
            {formatCurrency(summary.totalCodAmount)}
          </div>
          <span className="text-[11px] text-blue-600/80 mt-1 block">Receivable on delivery</span>
        </div>
      </div>

      {/* Two Detailed Tables: City-wise & Courier-wise */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* City-Wise Report */}
        <div className="bg-white dark:bg-[#1E0D12] rounded-3xl shadow-sm border border-[#EFE4D3] dark:border-[#3A1B23] p-5 sm:p-6">
          <div className="flex items-center gap-2 mb-4 pb-3 border-b border-gray-100 dark:border-gray-800">
            <MapPin className="w-4 h-4 text-[#7A1626] dark:text-[#E5B84B]" />
            <h3 className="font-serif font-bold text-base text-gray-900 dark:text-gray-100">
              City-Wise Orders & Revenue
            </h3>
          </div>

          {isLoading ? (
            <div className="py-12 text-center text-xs text-gray-400">Loading city analytics...</div>
          ) : cityReport.length === 0 ? (
            <div className="py-12 text-center text-xs text-gray-400">No city records found</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="text-gray-400 font-bold uppercase text-[10px] border-b border-gray-100 dark:border-gray-800 pb-2">
                    <th className="py-2">City</th>
                    <th className="py-2 text-center">Orders</th>
                    <th className="py-2 text-right">Total Value</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                  {cityReport.map((c: any) => (
                    <tr key={c.city} className="hover:bg-gray-50/50 dark:hover:bg-[#180A0E]">
                      <td className="py-2.5 font-semibold text-gray-800 dark:text-gray-200">{c.city}</td>
                      <td className="py-2.5 text-center font-bold text-[#7A1626] dark:text-[#E5B84B]">
                        {c.count}
                      </td>
                      <td className="py-2.5 text-right font-medium text-gray-700 dark:text-gray-300">
                        {formatCurrency(c.amount)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Courier-Wise Report */}
        <div className="bg-white dark:bg-[#1E0D12] rounded-3xl shadow-sm border border-[#EFE4D3] dark:border-[#3A1B23] p-5 sm:p-6">
          <div className="flex items-center gap-2 mb-4 pb-3 border-b border-gray-100 dark:border-gray-800">
            <Truck className="w-4 h-4 text-[#7A1626] dark:text-[#E5B84B]" />
            <h3 className="font-serif font-bold text-base text-gray-900 dark:text-gray-100">
              Courier-Wise Orders & Expenses
            </h3>
          </div>

          {isLoading ? (
            <div className="py-12 text-center text-xs text-gray-400">Loading courier analytics...</div>
          ) : courierReport.length === 0 ? (
            <div className="py-12 text-center text-xs text-gray-400">No courier records found</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="text-gray-400 font-bold uppercase text-[10px] border-b border-gray-100 dark:border-gray-800 pb-2">
                    <th className="py-2">Courier Partner</th>
                    <th className="py-2 text-center">Parcels</th>
                    <th className="py-2 text-right">Charges Paid</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                  {courierReport.map((cr: any) => (
                    <tr key={cr.courier} className="hover:bg-gray-50/50 dark:hover:bg-[#180A0E]">
                      <td className="py-2.5 font-semibold text-gray-800 dark:text-gray-200">{cr.courier}</td>
                      <td className="py-2.5 text-center font-bold text-[#7A1626] dark:text-[#E5B84B]">
                        {cr.count}
                      </td>
                      <td className="py-2.5 text-right font-medium text-gray-700 dark:text-gray-300">
                        {formatCurrency(cr.courierCharge)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
