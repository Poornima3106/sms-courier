'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { useI18n } from '@/lib/i18n';
import { formatDate, formatCurrency, getTrackingUrl, getWhatsAppUrl } from '@/lib/utils/format';
import StatusBadge from '@/components/StatusBadge';
import {
  Search,
  CheckCircle2,
  Clock,
  Truck,
  AlertTriangle,
  Package,
  ExternalLink,
  MessageCircle,
  MapPin,
  Calendar,
  Sparkles,
} from 'lucide-react';

function TrackOrderContent() {
  const searchParams = useSearchParams();
  const initialOrderNo = searchParams.get('orderNo') || '';

  const { t } = useI18n();
  const [orderNoInput, setOrderNoInput] = useState(initialOrderNo);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchTracking = async (no: string) => {
    if (!no.trim()) return;
    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`/api/orders/track/${encodeURIComponent(no.trim().toUpperCase())}`);
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Order not found');
        setResult(null);
      } else {
        setResult(data);
      }
    } catch {
      setError('Failed to fetch tracking details. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (initialOrderNo) {
      fetchTracking(initialOrderNo);
    }
  }, [initialOrderNo]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchTracking(orderNoInput);
  };

  const order = result?.order;
  const timeline = result?.timeline || [];

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header & Search Bar */}
      <div className="bg-white dark:bg-[#1E0D12] p-6 sm:p-8 rounded-3xl shadow-sm border border-[#EFE4D3] dark:border-[#3A1B23] text-center">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-[#7A1626] text-white shadow-md mb-3">
          <Truck className="w-7 h-7" />
        </div>
        <h2 className="text-2xl sm:text-3xl font-serif font-bold text-[#7A1626] dark:text-[#E5B84B]">
          {t.nav.track}
        </h2>
        <p className="text-xs sm:text-sm text-gray-500 max-w-md mx-auto mt-1">
          Check live parcel status and delivery timeline for Sri Mahadevaiyer sweet boxes
        </p>

        {/* Input Form */}
        <form onSubmit={handleSearch} className="mt-6 flex flex-col sm:flex-row gap-2 max-w-lg mx-auto">
          <div className="relative flex-1">
            <Search className="w-5 h-5 absolute left-3.5 top-3 text-gray-400" />
            <input
              type="text"
              required
              value={orderNoInput}
              onChange={(e) => setOrderNoInput(e.target.value.toUpperCase())}
              placeholder="Enter Order No (e.g. DWL1001)"
              className="w-full pl-11 pr-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-[#140A0D] text-sm uppercase tracking-wider font-semibold focus:ring-2 focus:ring-[#7A1626] outline-none"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-2.5 rounded-xl bg-[#7A1626] hover:bg-[#5B0E1B] text-white font-semibold text-sm shadow-md transition-all cursor-pointer disabled:opacity-50"
          >
            {loading ? 'Tracking...' : 'Track Package'}
          </button>
        </form>

        {/* Quick Sample Links */}
        <div className="flex items-center justify-center gap-2 mt-4 text-[11px] text-gray-400">
          <span>Try sample orders:</span>
          {['DWL1001', 'DWL1002', 'DWL1003', 'DWL1004'].map((sample) => (
            <button
              key={sample}
              type="button"
              onClick={() => {
                setOrderNoInput(sample);
                fetchTracking(sample);
              }}
              className="font-bold text-[#7A1626] dark:text-[#E5B84B] hover:underline"
            >
              {sample}
            </button>
          ))}
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-2xl bg-red-50 dark:bg-red-950/40 border border-red-200 text-red-700 dark:text-red-300 text-sm flex items-center gap-2">
          <AlertTriangle className="w-5 h-5 shrink-0" />
          <p>{error}</p>
        </div>
      )}

      {/* Tracking Result View */}
      {order && (
        <div className="space-y-6">
          {/* Order Summary Card */}
          <div className="bg-white dark:bg-[#1E0D12] p-6 rounded-3xl shadow-sm border border-[#EFE4D3] dark:border-[#3A1B23]">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-5 border-b border-gray-100 dark:border-gray-800">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Order Number</span>
                <div className="flex items-center gap-2 mt-0.5">
                  <h3 className="text-xl sm:text-2xl font-bold tracking-wider text-[#7A1626] dark:text-[#E5B84B]">
                    {order.order_no}
                  </h3>
                  <StatusBadge status={order.status} />
                </div>
              </div>

              {/* Fast links: Official Tracking & WhatsApp */}
              <div className="flex items-center gap-2">
                {order.awb_no && (
                  <a
                    href={getTrackingUrl(order.courier, order.awb_no)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 text-xs font-semibold hover:bg-blue-100 transition-colors"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span>{order.courier} Portal</span>
                  </a>
                )}
                {order.phone && (
                  <a
                    href={getWhatsAppUrl(order.customer_name, order.order_no, order.courier, order.awb_no, order.phone)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 text-xs font-semibold hover:bg-emerald-100 transition-colors"
                  >
                    <MessageCircle className="w-3.5 h-3.5" />
                    <span>WhatsApp Customer</span>
                  </a>
                )}
              </div>
            </div>

            {/* Order Details Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-5 text-xs">
              <div>
                <span className="text-gray-400 block text-[10px] font-semibold uppercase">Customer</span>
                <span className="font-bold text-gray-800 dark:text-gray-200 mt-0.5 block">{order.customer_name}</span>
                <span className="text-gray-500 font-mono text-[11px]">{order.phone}</span>
              </div>

              <div>
                <span className="text-gray-400 block text-[10px] font-semibold uppercase">Delivery City</span>
                <span className="font-bold text-gray-800 dark:text-gray-200 mt-0.5 block">{order.city}</span>
                <span className="text-gray-500 text-[11px]">PIN: {order.pincode}</span>
              </div>

              <div>
                <span className="text-gray-400 block text-[10px] font-semibold uppercase">Product / Sweet Box</span>
                <span className="font-bold text-gray-800 dark:text-gray-200 mt-0.5 block">{order.product}</span>
                <span className="text-gray-500 text-[11px]">{order.boxes || 1} Box • ₹{order.amount}</span>
              </div>

              <div>
                <span className="text-gray-400 block text-[10px] font-semibold uppercase">Courier / AWB</span>
                <span className="font-bold text-gray-800 dark:text-gray-200 mt-0.5 block">
                  {order.courier || 'Pending'}
                </span>
                <span className="text-gray-500 font-mono text-[11px]">{order.awb_no || 'No AWB yet'}</span>
              </div>
            </div>
          </div>

          {/* Visual Timeline Section */}
          <div className="bg-white dark:bg-[#1E0D12] p-6 sm:p-8 rounded-3xl shadow-sm border border-[#EFE4D3] dark:border-[#3A1B23]">
            <h4 className="font-serif font-bold text-base text-gray-900 dark:text-gray-100 mb-6 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-[#D4AF37]" />
              <span>Shipment Progress Timeline</span>
            </h4>

            <div className="relative pl-6 sm:pl-8 space-y-8 before:absolute before:left-3 before:top-2 before:bottom-2 before:w-0.5 before:bg-gray-200 dark:before:bg-gray-800">
              {timeline.map((step: any, index: number) => {
                const isCompleted = step.completed;
                const isCurrent = step.current;
                const isProblem = step.problem;

                return (
                  <div key={index} className="relative group">
                    {/* Step Icon Node */}
                    <div
                      className={`absolute -left-6 sm:-left-8 top-0.5 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold transition-all shadow-sm ${
                        isProblem
                          ? 'bg-rose-600 text-white ring-4 ring-rose-100 dark:ring-rose-950/40'
                          : isCompleted
                          ? 'bg-[#7A1626] text-white ring-4 ring-[#7A1626]/20'
                          : isCurrent
                          ? 'bg-amber-500 text-white ring-4 ring-amber-100 dark:ring-amber-950/40'
                          : 'bg-gray-200 dark:bg-gray-800 text-gray-400'
                      }`}
                    >
                      {isProblem ? '!' : isCompleted ? '✓' : index + 1}
                    </div>

                    {/* Step Details */}
                    <div>
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                        <h5
                          className={`text-sm font-bold ${
                            isProblem
                              ? 'text-rose-600'
                              : isCompleted || isCurrent
                              ? 'text-gray-900 dark:text-gray-100'
                              : 'text-gray-400'
                          }`}
                        >
                          {step.title}
                        </h5>
                        {step.date && (
                          <span className="text-[11px] text-gray-400 mt-0.5 sm:mt-0 font-mono">
                            {formatDate(step.date)}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        {step.description}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function TrackOrderPage() {
  return (
    <Suspense fallback={<div className="p-12 text-center text-sm text-gray-500">Loading tracking page...</div>}>
      <TrackOrderContent />
    </Suspense>
  );
}
