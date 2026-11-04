'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { useI18n } from '@/lib/i18n';
import {
  formatDate,
  formatCurrency,
  getWhatsAppUrl,
  getLiveTrackingReportUrl,
  getOfficialPortalUrl,
  getCleanCarrierAwb,
  isProfessionalCourier,
} from '@/lib/utils/format';
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
  Copy,
  Check,
  Globe,
  RefreshCw,
  Navigation,
} from 'lucide-react';

function TrackOrderContent() {
  const searchParams = useSearchParams();
  const initialOrderNo = searchParams.get('orderNo') || '';

  const { t } = useI18n();
  const [orderNoInput, setOrderNoInput] = useState(initialOrderNo);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [copiedAwb, setCopiedAwb] = useState(false);

  const fetchTracking = async (no: string) => {
    const raw = no.trim();
    if (!raw) return;
    setLoading(true);
    setError(null);

    try {
      const safeSegment = encodeURIComponent(raw.toUpperCase().replace(/[\/\\]/g, '-') || 'TRACK');
      const res = await fetch(`/api/orders/track/${safeSegment}?query=${encodeURIComponent(raw)}`);
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

  const copyTrackingIdToClipboard = (courierName?: string | null, awbNo?: string | null) => {
    if (!awbNo) return;
    const clean = getCleanCarrierAwb(courierName, awbNo);
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(clean).catch(() => {});
      setCopiedAwb(true);
      setTimeout(() => setCopiedAwb(false), 4000);
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
  const liveTracking = result?.liveTracking;
  const liveCheckpoints: any[] = liveTracking?.checkpoints || [];
  const cleanAwb = order?.awb_no ? getCleanCarrierAwb(order.courier, order.awb_no) : '';

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
        <form onSubmit={handleSearch} className="mt-6 flex flex-col sm:flex-row gap-2 max-w-xl mx-auto">
          <div className="relative flex-1">
            <Search className="w-5 h-5 absolute left-3.5 top-3 text-gray-400" />
            <input
              type="text"
              required
              value={orderNoInput}
              onChange={(e) => setOrderNoInput(e.target.value.toUpperCase())}
              placeholder="Enter Order No (e.g. 1001) or Courier AWB / Track ID (e.g. PRO882910)"
              className="w-full pl-11 pr-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-[#140A0D] text-xs sm:text-sm uppercase tracking-wider font-semibold focus:ring-2 focus:ring-[#7A1626] outline-none"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-2.5 rounded-xl bg-[#7A1626] hover:bg-[#5B0E1B] text-white font-semibold text-sm shadow-md transition-all cursor-pointer disabled:opacity-50 shrink-0"
          >
            {loading ? 'Tracking...' : 'Track Package'}
          </button>
        </form>

        {/* Quick Sample Links */}
        <div className="flex flex-wrap items-center justify-center gap-2 mt-4 text-[11px] text-gray-400">
          <span>Try sample Order / AWB:</span>
          {['216', 'POL1440426', '1001', '134', 'PRO882910', 'ST8892110'].map((sample) => (
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

              {/* Fast links: Live Report, Official Portal & WhatsApp */}
              <div className="flex flex-wrap items-center gap-2">
                {order.awb_no && (
                  <>
                    <a
                      href={getLiveTrackingReportUrl(order.courier, order.awb_no)}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={() => copyTrackingIdToClipboard(order.courier, order.awb_no)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-sm transition-all"
                      title="Opens Live Carrier Report with latest parcel scans"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      <span>Live {order.courier || 'Professional'} Report</span>
                    </a>
                    <a
                      href={getOfficialPortalUrl(order.courier, order.awb_no)}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={() => copyTrackingIdToClipboard(order.courier, order.awb_no)}
                      className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 text-xs font-semibold hover:bg-blue-100 transition-colors"
                      title={`Open official ${order.courier} site (copies Track ID)`}
                    >
                      <Globe className="w-3.5 h-3.5" />
                      <span>Official Site</span>
                    </a>
                  </>
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
                <span className="text-gray-500 text-[11px] font-medium">{order.boxes || 1} {Number(order.boxes) === 1 ? 'Box' : 'Boxes'} (Total Items) • ₹{order.amount}</span>
              </div>

              <div>
                <span className="text-gray-400 block text-[10px] font-semibold uppercase">Courier / AWB</span>
                <span className="font-bold text-gray-800 dark:text-gray-200 mt-0.5 block">
                  {order.courier || 'Pending'}
                </span>
                <span className="text-gray-500 font-mono text-[11px]">{cleanAwb || order.awb_no || 'No AWB yet'}</span>
              </div>
            </div>
          </div>

          {/* Live Courier Report Card */}
          {order.awb_no && (
            <div
              id="live-carrier-report"
              className="bg-white dark:bg-[#1E0D12] p-5 sm:p-6 rounded-3xl shadow-sm border-2 border-emerald-500/20 bg-gradient-to-br from-emerald-50/40 via-white to-amber-50/30 dark:from-[#180A0E] dark:to-[#1E0D12] space-y-4"
            >
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shadow-md shrink-0">
                    <Truck className="w-6 h-6" />
                  </div>
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400">
                      Verified Courier Partner & AWB
                    </span>
                    <div className="flex items-center gap-2">
                      <h4 className="text-base sm:text-lg font-bold text-gray-900 dark:text-gray-100">
                        {order.courier}
                      </h4>
                      <span className="font-mono px-2 py-0.5 rounded-md bg-gray-100 dark:bg-gray-800 text-xs font-bold text-[#7A1626] dark:text-[#E5B84B]">
                        {cleanAwb}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Copy & Refresh buttons */}
                <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto">
                  <button
                    type="button"
                    onClick={() => fetchTracking(order.order_no || cleanAwb)}
                    disabled={loading}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-emerald-200 dark:border-emerald-800 bg-emerald-50/80 dark:bg-emerald-950/40 text-xs font-semibold text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 transition-colors shadow-xs cursor-pointer disabled:opacity-50"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
                    <span>Refresh Live Updates</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => copyTrackingIdToClipboard(order.courier, order.awb_no)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-[#140A0D] text-xs font-semibold text-gray-700 dark:text-gray-300 hover:bg-gray-50 transition-colors shadow-xs cursor-pointer"
                  >
                    {copiedAwb ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                        <span className="text-emerald-600 font-bold">Copied to Clipboard!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Copy Tracking ID</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {copiedAwb && (
                <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200 text-xs flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
                  <span>
                    Track ID <strong>{cleanAwb}</strong> copied to clipboard!
                  </span>
                </div>
              )}

              {/* Automatic Live Parcel Status & Checkpoints List */}
              {liveCheckpoints.length > 0 && (
                <div className="rounded-2xl border border-emerald-200/80 dark:border-emerald-900/60 bg-white/95 dark:bg-[#140A0D] overflow-hidden shadow-xs">
                  {/* Latest Parcel Update Banner */}
                  <div className="p-4 bg-emerald-600 text-white flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                    <div className="flex items-start sm:items-center gap-2.5">
                      <span className="relative flex h-3 w-3 shrink-0 mt-1 sm:mt-0">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-200 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-3 w-3 bg-white"></span>
                      </span>
                      <div>
                        <span className="text-[10px] font-bold uppercase tracking-widest text-emerald-100 block">
                          Latest Live Parcel Update ({order.courier})
                        </span>
                        <p className="text-sm sm:text-base font-bold leading-snug">
                          {liveCheckpoints[0].activity}
                        </p>
                      </div>
                    </div>
                    <div className="text-left sm:text-right text-xs text-emerald-100 font-mono shrink-0">
                      <div className="font-bold text-white flex items-center sm:justify-end gap-1">
                        <MapPin className="w-3.5 h-3.5 inline shrink-0" />
                        <span>{liveCheckpoints[0].location || order.city}</span>
                      </div>
                      <div>
                        {liveCheckpoints[0].date} {liveCheckpoints[0].time}
                      </div>
                    </div>
                  </div>

                  {/* Full Live Carrier Scan History Table */}
                  <div className="p-4">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 flex items-center gap-1.5">
                        <Navigation className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Live Carrier Checkpoints & Hub Scans ({liveCheckpoints.length})</span>
                      </span>
                      <span className="text-[11px] font-semibold text-emerald-700 dark:text-emerald-400">
                        AWB: {cleanAwb}
                      </span>
                    </div>

                    <div className="divide-y divide-gray-100 dark:divide-gray-800/80">
                      {liveCheckpoints.map((cp: any, idx: number) => (
                        <div
                          key={idx}
                          className={`py-2.5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 text-xs ${
                            idx === 0
                              ? 'font-bold text-emerald-950 dark:text-emerald-200 bg-emerald-50/50 dark:bg-emerald-950/20 -mx-2 px-2 rounded-xl'
                              : 'text-gray-700 dark:text-gray-300'
                          }`}
                        >
                          <div className="flex items-start gap-2.5">
                            <span
                              className={`mt-1 w-2 h-2 rounded-full shrink-0 ${
                                idx === 0 ? 'bg-emerald-600 ring-4 ring-emerald-500/20' : 'bg-gray-300 dark:bg-gray-600'
                              }`}
                            />
                            <div>
                              <span className="block">{cp.activity}</span>
                              {cp.location && (
                                <span className="text-[11px] text-gray-500 dark:text-gray-400 flex items-center gap-1 mt-0.5">
                                  <MapPin className="w-3 h-3 text-gray-400" />
                                  {cp.location}
                                </span>
                              )}
                            </div>
                          </div>
                          <div className="pl-4 sm:pl-0 text-[11px] font-mono text-gray-500 dark:text-gray-400 shrink-0">
                            {cp.date} {cp.time && `• ${cp.time}`}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Live Action Buttons */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                {/* Action 1: Direct Live Report */}
                <a
                  href={getLiveTrackingReportUrl(order.courier, order.awb_no)}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => copyTrackingIdToClipboard(order.courier, order.awb_no)}
                  className="flex items-center justify-between p-3.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold shadow-md transition-all group"
                >
                  <div className="flex items-center gap-2.5">
                    <Sparkles className="w-4 h-4 text-emerald-200" />
                    <div className="text-left">
                      <span className="text-xs block font-bold leading-tight">
                        View Live Tracking Report
                      </span>
                      <span className="text-[10px] text-emerald-100 block">
                        Auto-queries {order.courier} live status & scans ({cleanAwb})
                      </span>
                    </div>
                  </div>
                  <ExternalLink className="w-4 h-4 shrink-0 transition-transform group-hover:translate-x-0.5" />
                </a>

                {/* Action 2: Official Portal Website */}
                <a
                  href={getOfficialPortalUrl(order.courier, order.awb_no)}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => copyTrackingIdToClipboard(order.courier, order.awb_no)}
                  className="flex items-center justify-between p-3.5 rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-[#140A0D] text-gray-800 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-900 font-semibold shadow-xs transition-all group"
                >
                  <div className="flex items-center gap-2.5">
                    <Globe className="w-4 h-4 text-blue-500" />
                    <div className="text-left">
                      <span className="text-xs block font-bold leading-tight">
                        Official {order.courier} Portal
                      </span>
                      <span className="text-[10px] text-gray-400 block">
                        Opens main carrier portal (copies {cleanAwb} on click)
                      </span>
                    </div>
                  </div>
                  <ExternalLink className="w-4 h-4 shrink-0 text-gray-400 transition-transform group-hover:translate-x-0.5" />
                </a>
              </div>
            </div>
          )}

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
