'use client';

import React, { useState, useEffect } from 'react';
import useSWR, { mutate } from 'swr';
import Link from 'next/link';
import { useI18n } from '@/lib/i18n';
import { Order, OrderStatus } from '@/lib/types';
import StatusBadge from '@/components/StatusBadge';
import ConfirmModal from '@/components/ConfirmModal';
import { formatDate, formatCurrency, getWhatsAppUrl, getTrackingUrl } from '@/lib/utils/format';
import { exportOrdersToExcel, exportOrdersToPdf } from '@/lib/utils/export';
import {
  Search,
  Filter,
  PlusCircle,
  ExternalLink,
  MessageCircle,
  Trash2,
  FileSpreadsheet,
  FileText,
  RotateCw,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';

const fetcher = (url: string) => fetch(url).then((res) => res.json());

const ALL_STATUSES: OrderStatus[] = [
  'Pending',
  'Dispatched',
  'In Transit',
  'Delivered',
  'Delayed',
  'Returned',
  'Damaged',
];

export default function OrdersPage() {
  const { t } = useI18n();

  // Search & Filter state
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('All');
  const [courier, setCourier] = useState('All');
  const [city, setCity] = useState('All');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  // Masters
  const [couriers, setCouriers] = useState<string[]>([]);
  const [cities, setCities] = useState<string[]>([]);

  // Pagination
  const [page, setPage] = useState(1);
  const pageSize = 10;

  // Modals & Delete
  const [orderToDelete, setOrderToDelete] = useState<Order | null>(null);
  const [currentUser, setCurrentUser] = useState<any>(null);

  useEffect(() => {
    fetch('/api/auth/me')
      .then((res) => (res.ok ? res.json() : null))
      .then((d) => {
        if (d?.user) setCurrentUser(d.user);
      })
      .catch(() => {});

    fetch('/api/masters')
      .then((res) => res.json())
      .then((d) => {
        if (d?.items) {
          const cList = d.items.filter((m: any) => m.category === 'courier').map((m: any) => m.name);
          const ctList = d.items.filter((m: any) => m.category === 'city').map((m: any) => m.name);
          setCouriers(cList);
          setCities(ctList);
        }
      })
      .catch(() => {});
  }, []);

  const queryParams = new URLSearchParams();
  if (search) queryParams.set('search', search);
  if (status !== 'All') queryParams.set('status', status);
  if (courier !== 'All') queryParams.set('courier', courier);
  if (city !== 'All') queryParams.set('city', city);
  if (dateFrom) queryParams.set('dateFrom', dateFrom);
  if (dateTo) queryParams.set('dateTo', dateTo);

  // SWR auto-refresh 10s + focus
  const { data, isLoading } = useSWR(`/api/orders?${queryParams.toString()}`, fetcher, {
    refreshInterval: 10000,
    revalidateOnFocus: true,
  });

  const allOrders: Order[] = data?.orders || [];
  const totalCount = allOrders.length;
  const totalPages = Math.ceil(totalCount / pageSize) || 1;
  const paginatedOrders = allOrders.slice((page - 1) * pageSize, page * pageSize);

  const isOwner = currentUser?.role === 'owner';

  const handleStatusChange = async (orderId: string, newStatus: string) => {
    try {
      const res = await fetch(`/api/orders/${orderId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) {
        mutate(`/api/orders?${queryParams.toString()}`);
        mutate('/api/orders');
      }
    } catch (err) {
      console.error('Failed to update status:', err);
    }
  };

  const confirmDeleteOrder = async () => {
    if (!orderToDelete) return;
    try {
      const res = await fetch(`/api/orders/${orderToDelete.id}`, { method: 'DELETE' });
      if (res.ok) {
        setOrderToDelete(null);
        mutate(`/api/orders?${queryParams.toString()}`);
        mutate('/api/orders');
      }
    } catch (err) {
      console.error('Failed to delete order:', err);
    }
  };

  const handleExportExcel = () => {
    exportOrdersToExcel(allOrders, `Sri_Mahadevaiyer_Orders_${new Date().toISOString().slice(0, 10)}.xlsx`);
  };

  const handleExportPdf = () => {
    exportOrdersToPdf(allOrders, 'Sri Mahadevaiyer Sweets – Orders Register');
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white dark:bg-[#1E0D12] p-5 sm:p-6 rounded-3xl shadow-sm border border-[#EFE4D3] dark:border-[#3A1B23]">
        <div>
          <h2 className="text-xl sm:text-2xl font-serif font-bold text-[#7A1626] dark:text-[#E5B84B]">
            {t.nav.orders}
          </h2>
          <p className="text-xs sm:text-sm text-gray-500">
            Search, filter, track, and update status • {totalCount} orders found
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Owner-Only Export Buttons */}
          {isOwner && (
            <>
              <button
                type="button"
                onClick={handleExportExcel}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 text-xs font-semibold hover:bg-emerald-100 transition-colors cursor-pointer"
                title="Export to Excel"
              >
                <FileSpreadsheet className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">{t.buttons.exportExcel}</span>
              </button>
              <button
                type="button"
                onClick={handleExportPdf}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-800 text-xs font-semibold hover:bg-red-100 transition-colors cursor-pointer"
                title="Export to PDF"
              >
                <FileText className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">{t.buttons.exportPdf}</span>
              </button>
            </>
          )}

          <Link
            href="/orders/add"
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#7A1626] hover:bg-[#5B0E1B] text-white text-xs sm:text-sm font-semibold shadow-md transition-all shrink-0"
          >
            <PlusCircle className="w-4 h-4" />
            <span>{t.buttons.addOrder}</span>
          </Link>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white dark:bg-[#1E0D12] p-4 sm:p-5 rounded-3xl shadow-sm border border-[#EFE4D3] dark:border-[#3A1B23] space-y-3">
        <div className="flex flex-col md:flex-row gap-3">
          {/* Search Box */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3.5 top-3 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              placeholder={t.buttons.search}
              className="w-full pl-10 pr-4 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-[#140A0D] text-xs sm:text-sm focus:ring-2 focus:ring-[#7A1626] outline-none"
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                className="absolute right-3 top-2.5 text-xs text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            )}
          </div>

          {/* Status Dropdown */}
          <select
            value={status}
            onChange={(e) => {
              setStatus(e.target.value);
              setPage(1);
            }}
            className="px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-[#140A0D] text-xs font-medium focus:ring-2 focus:ring-[#7A1626] outline-none"
          >
            <option value="All">All Statuses</option>
            {ALL_STATUSES.map((st) => (
              <option key={st} value={st}>
                {(t.status as any)[st] || st}
              </option>
            ))}
          </select>

          {/* Courier Dropdown */}
          <select
            value={courier}
            onChange={(e) => {
              setCourier(e.target.value);
              setPage(1);
            }}
            className="px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-[#140A0D] text-xs font-medium focus:ring-2 focus:ring-[#7A1626] outline-none"
          >
            <option value="All">All Couriers</option>
            {couriers.map((cr) => (
              <option key={cr} value={cr}>
                {cr}
              </option>
            ))}
          </select>

          {/* City Dropdown */}
          <select
            value={city}
            onChange={(e) => {
              setCity(e.target.value);
              setPage(1);
            }}
            className="px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-[#140A0D] text-xs font-medium focus:ring-2 focus:ring-[#7A1626] outline-none"
          >
            <option value="All">All Cities</option>
            {cities.map((ct) => (
              <option key={ct} value={ct}>
                {ct}
              </option>
            ))}
          </select>
        </div>

        {/* Date Filters Row */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-gray-100 dark:border-gray-800 text-xs">
          <div className="flex items-center gap-2">
            <span className="text-gray-500 font-semibold">Date Range:</span>
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => {
                setDateFrom(e.target.value);
                setPage(1);
              }}
              className="px-2.5 py-1 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-[#140A0D]"
            />
            <span className="text-gray-400">to</span>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => {
                setDateTo(e.target.value);
                setPage(1);
              }}
              className="px-2.5 py-1 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-[#140A0D]"
            />
            {(dateFrom || dateTo || status !== 'All' || courier !== 'All' || city !== 'All' || search) && (
              <button
                type="button"
                onClick={() => {
                  setSearch('');
                  setStatus('All');
                  setCourier('All');
                  setCity('All');
                  setDateFrom('');
                  setDateTo('');
                  setPage(1);
                }}
                className="text-red-500 hover:text-red-700 font-semibold text-xs ml-2 cursor-pointer"
              >
                Reset Filters
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Orders List / Table */}
      <div className="bg-white dark:bg-[#1E0D12] rounded-3xl shadow-sm border border-[#EFE4D3] dark:border-[#3A1B23] overflow-hidden">
        {isLoading ? (
          <div className="p-16 text-center text-sm text-gray-500">
            <RotateCw className="w-6 h-6 animate-spin mx-auto mb-2 text-[#7A1626]" />
            Loading sweet orders...
          </div>
        ) : paginatedOrders.length === 0 ? (
          <div className="p-16 text-center text-sm text-gray-500">
            No sweet box orders match your criteria.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-[#FBF6EF] dark:bg-[#140A0D] border-b border-[#EFE4D3] dark:border-[#3A1B23] text-gray-700 dark:text-gray-300 uppercase tracking-wider text-[11px] font-bold">
                  <th className="py-3.5 px-4">{t.orderFields.orderNo}</th>
                  <th className="py-3.5 px-4">{t.orderFields.customerName}</th>
                  <th className="py-3.5 px-4">{t.orderFields.city}</th>
                  <th className="py-3.5 px-4">{t.orderFields.product}</th>
                  <th className="py-3.5 px-4">{t.orderFields.amount}</th>
                  <th className="py-3.5 px-4">{t.orderFields.status}</th>
                  <th className="py-3.5 px-4">{t.orderFields.courier} / AWB</th>
                  <th className="py-3.5 px-4 text-right">{t.orderFields.actions}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                {paginatedOrders.map((o) => {
                  const hasAwb = Boolean(o.awb_no);
                  const whatsAppUrl = getWhatsAppUrl(o.customer_name, o.order_no, o.courier, o.awb_no, o.phone);
                  const trackingUrl = getTrackingUrl(o.courier, o.awb_no);

                  return (
                    <tr
                      key={o.id}
                      className="hover:bg-gray-50/60 dark:hover:bg-[#180A0E] transition-colors"
                    >
                      {/* Order No & Date */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="font-bold text-sm tracking-wide text-[#7A1626] dark:text-[#E5B84B]">
                          {o.order_no}
                        </div>
                        <div className="text-[10px] text-gray-400">{formatDate(o.order_date)}</div>
                      </td>

                      {/* Customer Name & Phone */}
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-gray-900 dark:text-gray-100">
                          {o.customer_name}
                        </div>
                        <div className="text-[11px] text-gray-500 font-mono">{o.phone}</div>
                      </td>

                      {/* City & Pincode */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span className="font-medium text-gray-800 dark:text-gray-200">{o.city}</span>
                        <div className="text-[10px] text-gray-400">{o.pincode}</div>
                      </td>

                      {/* Product */}
                      <td className="py-3.5 px-4">
                        <span className="font-medium text-gray-700 dark:text-gray-300">{o.product}</span>
                        {o.boxes && <span className="text-[10px] text-gray-400 block">{o.boxes} Box(es)</span>}
                      </td>

                      {/* Amount & Payment */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span className="font-bold text-gray-900 dark:text-gray-100">
                          {formatCurrency(o.amount)}
                        </span>
                        <span
                          className={`block text-[10px] font-semibold ${
                            o.payment_status === 'Paid'
                              ? 'text-emerald-600'
                              : o.payment_status === 'COD'
                              ? 'text-blue-600'
                              : 'text-amber-600'
                          }`}
                        >
                          {o.payment_status}
                        </span>
                      </td>

                      {/* Inline Status Dropdown */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="flex flex-col gap-1">
                          <StatusBadge status={o.status} size="sm" />
                          <select
                            value={o.status}
                            onChange={(e) => handleStatusChange(o.id, e.target.value)}
                            className="text-[10px] py-1 px-1.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-[#1E0D12] text-gray-700 dark:text-gray-300 font-medium cursor-pointer focus:ring-1 focus:ring-[#7A1626] outline-none"
                          >
                            {ALL_STATUSES.map((st) => (
                              <option key={st} value={st}>
                                {st}
                              </option>
                            ))}
                          </select>
                        </div>
                      </td>

                      {/* Courier & AWB */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        {o.courier ? (
                          <div>
                            <span className="font-semibold text-gray-800 dark:text-gray-200">
                              {o.courier}
                            </span>
                            <div className="text-[10px] text-gray-500 font-mono">
                              {o.awb_no || 'Pending AWB'}
                            </div>
                            {o.dispatch_date && (
                              <span className="text-[9px] text-gray-400">
                                Dispatched: {formatDate(o.dispatch_date)}
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="text-gray-400 italic text-[11px]">Not assigned</span>
                        )}
                      </td>

                      {/* Actions: WhatsApp, Track, Delete */}
                      <td className="py-3.5 px-4 whitespace-nowrap text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* WhatsApp Button (Active when AWB exists) */}
                          {hasAwb && (
                            <a
                              href={whatsAppUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="p-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-100 transition-colors"
                              title="Send WhatsApp update to customer"
                            >
                              <MessageCircle className="w-4 h-4" />
                            </a>
                          )}

                          {/* Track Button */}
                          <Link
                            href={`/track?orderNo=${o.order_no}`}
                            className="p-1.5 rounded-lg bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 hover:bg-blue-100 transition-colors"
                            title="View tracking timeline"
                          >
                            <ExternalLink className="w-4 h-4" />
                          </Link>

                          {/* Owner-Only Delete Button */}
                          {isOwner && (
                            <button
                              type="button"
                              onClick={() => setOrderToDelete(o)}
                              className="p-1.5 rounded-lg bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400 hover:bg-red-100 transition-colors"
                              title="Delete Order (Owner Only)"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Bar */}
        {totalPages > 1 && (
          <div className="p-4 border-t border-gray-100 dark:border-gray-800 flex items-center justify-between text-xs">
            <span className="text-gray-500">
              Showing {(page - 1) * pageSize + 1} to {Math.min(page * pageSize, totalCount)} of {totalCount} orders
            </span>

            <div className="flex items-center gap-1.5">
              <button
                type="button"
                disabled={page === 1}
                onClick={() => setPage(page - 1)}
                className="p-1.5 rounded-lg border border-gray-200 dark:border-gray-700 disabled:opacity-30 hover:bg-gray-100 dark:hover:bg-gray-800"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="px-2 font-bold text-gray-700 dark:text-gray-300">
                {page} / {totalPages}
              </span>
              <button
                type="button"
                disabled={page === totalPages}
                onClick={() => setPage(page + 1)}
                className="p-1.5 rounded-lg border border-gray-200 dark:border-gray-700 disabled:opacity-30 hover:bg-gray-100 dark:hover:bg-gray-800"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Owner Confirmation Delete Modal */}
      <ConfirmModal
        isOpen={Boolean(orderToDelete)}
        title="Confirm Order Deletion"
        message={`Are you sure you want to permanently delete order ${orderToDelete?.order_no} for ${orderToDelete?.customer_name}? This action cannot be undone.`}
        confirmLabel="Yes, Delete Order"
        onConfirm={confirmDeleteOrder}
        onCancel={() => setOrderToDelete(null)}
      />
    </div>
  );
}
