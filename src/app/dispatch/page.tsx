'use client';

import React, { useState, useEffect } from 'react';
import useSWR, { mutate } from 'swr';
import { useI18n } from '@/lib/i18n';
import { Order } from '@/lib/types';
import { Truck, CheckSquare, Square, Calendar, AlertCircle, CheckCircle2 } from 'lucide-react';
import { formatDate } from '@/lib/utils/format';

const fetcher = (url: string) => fetch(url).then((res) => res.json());

interface DispatchRowState {
  awbNo: string;
  weightKg: string;
  boxes: number;
  courierCharge: string;
}

export default function DispatchPage() {
  const { t } = useI18n();

  // Fetch only Pending orders
  const { data, isLoading } = useSWR('/api/orders?status=Pending', fetcher, {
    refreshInterval: 10000,
    revalidateOnFocus: true,
  });

  const orders: Order[] = data?.orders || [];

  // Masters: Couriers
  const [courierList, setCourierList] = useState<string[]>(['DTDC', 'ST Courier', 'Professional', 'Others']);
  const [commonCourier, setCommonCourier] = useState('DTDC');
  const [commonDate, setCommonDate] = useState('2026-10-31');

  // Selected orders & their dispatch input details
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [rowStates, setRowStates] = useState<Record<string, DispatchRowState>>({});

  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/masters?category=courier')
      .then((res) => res.json())
      .then((d) => {
        if (d?.items && d.items.length > 0) {
          const names = d.items.filter((m: any) => m.is_active).map((m: any) => m.name);
          if (names.length > 0) {
            setCourierList(names);
            setCommonCourier(names[0]);
          }
        }
      })
      .catch(() => {});
  }, []);

  const toggleSelectOrder = (id: string) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter((item) => item !== id));
    } else {
      setSelectedIds([...selectedIds, id]);
      if (!rowStates[id]) {
        const ord = orders.find((o) => o.id === id);
        setRowStates((prev) => ({
          ...prev,
          [id]: {
            awbNo: ord?.awb_no || '',
            weightKg: ord?.weight_kg ? String(ord.weight_kg) : '1.0',
            boxes: ord?.boxes || 1,
            courierCharge: ord?.courier_charge ? String(ord.courier_charge) : '100',
          },
        }));
      }
    }
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === orders.length) {
      setSelectedIds([]);
    } else {
      const allIds = orders.map((o) => o.id);
      setSelectedIds(allIds);
      const newRows: Record<string, DispatchRowState> = { ...rowStates };
      allIds.forEach((id) => {
        if (!newRows[id]) {
          const ord = orders.find((o) => o.id === id);
          newRows[id] = {
            awbNo: ord?.awb_no || '',
            weightKg: ord?.weight_kg ? String(ord.weight_kg) : '1.0',
            boxes: ord?.boxes || 1,
            courierCharge: ord?.courier_charge ? String(ord.courier_charge) : '100',
          };
        }
      });
      setRowStates(newRows);
    }
  };

  const updateRowField = (id: string, field: keyof DispatchRowState, value: any) => {
    setRowStates((prev) => ({
      ...prev,
      [id]: {
        ...(prev[id] || { awbNo: '', weightKg: '1.0', boxes: 1, courierCharge: '100' }),
        [field]: value,
      },
    }));
  };

  const handleBulkDispatch = async () => {
    setErrorMsg(null);
    setSuccessMsg(null);

    if (selectedIds.length === 0) {
      setErrorMsg('Please select at least one pending order to dispatch.');
      return;
    }

    // Validate that each selected order has an AWB number
    for (const id of selectedIds) {
      const row = rowStates[id];
      if (!row || !row.awbNo || !row.awbNo.trim()) {
        const ord = orders.find((o) => o.id === id);
        setErrorMsg(`AWB number is required for order ${ord?.order_no || id}.`);
        return;
      }
    }

    setSubmitting(true);

    try {
      const payload = {
        courier: commonCourier,
        dispatch_date: commonDate,
        items: selectedIds.map((id) => {
          const r = rowStates[id];
          return {
            id,
            awbNo: r.awbNo.trim(),
            weightKg: r.weightKg ? Number(r.weightKg) : null,
            boxes: r.boxes || 1,
            courierCharge: r.courierCharge ? Number(r.courierCharge) : null,
          };
        }),
      };

      const res = await fetch('/api/orders/bulk-dispatch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const resData = await res.json();
      if (!res.ok) {
        setErrorMsg(resData.error || 'Failed to dispatch orders');
        setSubmitting(false);
        return;
      }

      setSuccessMsg(`Successfully dispatched ${selectedIds.length} orders via ${commonCourier}!`);
      setSelectedIds([]);
      mutate('/api/orders?status=Pending');
      mutate('/api/orders');
    } catch {
      setErrorMsg('An unexpected network error occurred.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & Common Pickers */}
      <div className="bg-white dark:bg-[#1E0D12] p-5 sm:p-6 rounded-3xl shadow-sm border border-[#EFE4D3] dark:border-[#3A1B23]">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-[#7A1626] text-white flex items-center justify-center shadow-md">
              <Truck className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl sm:text-2xl font-serif font-bold text-[#7A1626] dark:text-[#E5B84B]">
                {t.nav.dispatch}
              </h2>
              <p className="text-xs text-gray-500">
                Bulk assign couriers and AWB tracking numbers in a single transaction
              </p>
            </div>
          </div>

          {/* Common Courier & Dispatch Date Picker */}
          <div className="flex flex-wrap items-center gap-3 bg-gray-50 dark:bg-[#140A0D] p-3 rounded-2xl border border-gray-200 dark:border-gray-800">
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-500 mb-1">
                Common Courier Partner
              </label>
              <select
                value={commonCourier}
                onChange={(e) => setCommonCourier(e.target.value)}
                className="px-3 py-1.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-[#1E0D12] text-xs font-semibold focus:ring-2 focus:ring-[#7A1626] outline-none"
              >
                {courierList.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-500 mb-1">
                Dispatch Date
              </label>
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-[#1E0D12] text-xs">
                <Calendar className="w-3.5 h-3.5 text-gray-400" />
                <input
                  type="date"
                  value={commonDate}
                  onChange={(e) => setCommonDate(e.target.value)}
                  className="bg-transparent outline-none text-xs"
                />
              </div>
            </div>

            <div className="flex items-end pt-3 sm:pt-0">
              <button
                type="button"
                onClick={handleBulkDispatch}
                disabled={submitting || selectedIds.length === 0}
                className="px-5 py-2 rounded-xl bg-[#7A1626] hover:bg-[#5B0E1B] text-white text-xs sm:text-sm font-semibold shadow-md transition-all cursor-pointer disabled:opacity-50"
              >
                {submitting ? 'Dispatching...' : `${t.buttons.dispatchSelected} (${selectedIds.length})`}
              </button>
            </div>
          </div>
        </div>

        {errorMsg && (
          <div className="mt-4 p-3.5 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 text-red-700 dark:text-red-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <p>{errorMsg}</p>
          </div>
        )}

        {successMsg && (
          <div className="mt-4 p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 text-emerald-700 dark:text-emerald-300 text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <p>{successMsg}</p>
          </div>
        )}
      </div>

      {/* Orders Selection Table */}
      <div className="bg-white dark:bg-[#1E0D12] rounded-3xl shadow-sm border border-[#EFE4D3] dark:border-[#3A1B23] overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={toggleSelectAll}
              className="flex items-center gap-2 text-xs font-semibold text-gray-700 dark:text-gray-300 hover:text-[#7A1626]"
            >
              {selectedIds.length === orders.length && orders.length > 0 ? (
                <CheckSquare className="w-5 h-5 text-[#7A1626]" />
              ) : (
                <Square className="w-5 h-5 text-gray-400" />
              )}
              <span>Select All Pending ({orders.length})</span>
            </button>
          </div>

          <span className="text-xs text-gray-500 font-medium">
            {selectedIds.length} of {orders.length} selected
          </span>
        </div>

        {isLoading ? (
          <div className="p-12 text-center text-sm text-gray-500">Loading pending sweet orders...</div>
        ) : orders.length === 0 ? (
          <div className="p-12 text-center text-sm text-gray-500">
            🎉 All orders are currently dispatched! No pending orders awaiting courier.
          </div>
        ) : (
          <div className="divide-y divide-gray-100 dark:divide-gray-800">
            {orders.map((o) => {
              const isSelected = selectedIds.includes(o.id);
              const row = rowStates[o.id] || {
                awbNo: '',
                weightKg: '1.0',
                boxes: 1,
                courierCharge: '100',
              };

              return (
                <div
                  key={o.id}
                  className={`p-4 sm:p-5 transition-colors ${
                    isSelected ? 'bg-amber-50/40 dark:bg-amber-950/20' : 'hover:bg-gray-50/50 dark:hover:bg-[#180A0E]'
                  }`}
                >
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                    {/* Order Details & Checkbox */}
                    <div className="flex items-start gap-3.5 max-w-md">
                      <button
                        type="button"
                        onClick={() => toggleSelectOrder(o.id)}
                        className="mt-1 shrink-0 text-gray-400 hover:text-[#7A1626]"
                      >
                        {isSelected ? (
                          <CheckSquare className="w-5 h-5 text-[#7A1626]" />
                        ) : (
                          <Square className="w-5 h-5" />
                        )}
                      </button>

                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-sm tracking-wide text-[#7A1626] dark:text-[#E5B84B]">
                            {o.order_no}
                          </span>
                          <span className="text-xs font-semibold text-gray-800 dark:text-gray-200">
                            • {o.customer_name}
                          </span>
                          <span className="text-xs text-gray-500">({o.city})</span>
                        </div>
                        <p className="text-xs text-gray-600 dark:text-gray-400 mt-0.5 line-clamp-1">
                          <span className="font-semibold text-gray-800 dark:text-gray-200">{o.product}</span> • <span className="font-bold text-[#7A1626] dark:text-[#E5B84B]">{o.boxes || 1} Total Items</span> • {o.address} • Ph: {o.phone}
                        </p>
                        <p className="text-[11px] text-gray-400 mt-0.5">
                          Ordered on: {formatDate(o.order_date)} • Amount: ₹{o.amount} ({o.payment_status})
                        </p>
                      </div>
                    </div>

                    {/* Inline Dispatch Inputs (Active when order is ticked) */}
                    {isSelected && (
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-white dark:bg-[#140A0D] p-3 rounded-2xl border border-amber-200 dark:border-amber-900/60 shadow-xs animate-in fade-in">
                        <div>
                          <label className="block text-[10px] font-bold uppercase text-gray-500 mb-1">
                            AWB No *
                          </label>
                          <input
                            type="text"
                            required
                            value={row.awbNo}
                            onChange={(e) => updateRowField(o.id, 'awbNo', e.target.value.toUpperCase())}
                            placeholder="e.g. DTDC88123"
                            className="w-full px-2.5 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-transparent text-xs font-semibold focus:ring-1 focus:ring-[#7A1626] outline-none"
                          />
                        </div>

                        <div>
                          <label className="block text-[10px] font-bold uppercase text-gray-500 mb-1">
                            Weight (kg)
                          </label>
                          <input
                            type="number"
                            step="0.1"
                            min="0.1"
                            value={row.weightKg}
                            onChange={(e) => updateRowField(o.id, 'weightKg', e.target.value)}
                            placeholder="1.0"
                            className="w-full px-2.5 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-transparent text-xs focus:ring-1 focus:ring-[#7A1626] outline-none"
                          />
                        </div>

                        <div>
                          <label className="block text-[10px] font-bold uppercase text-gray-500 mb-1">
                            Total Items (Boxes)
                          </label>
                          <input
                            type="number"
                            min="1"
                            value={row.boxes}
                            onChange={(e) => updateRowField(o.id, 'boxes', parseInt(e.target.value) || 1)}
                            className="w-full px-2.5 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-transparent text-xs font-semibold focus:ring-1 focus:ring-[#7A1626] outline-none"
                          />
                        </div>

                        <div>
                          <label className="block text-[10px] font-bold uppercase text-gray-500 mb-1">
                            Charge (₹)
                          </label>
                          <input
                            type="number"
                            min="0"
                            value={row.courierCharge}
                            onChange={(e) => updateRowField(o.id, 'courierCharge', e.target.value)}
                            placeholder="100"
                            className="w-full px-2.5 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-transparent text-xs focus:ring-1 focus:ring-[#7A1626] outline-none"
                          />
                        </div>
                      </div>
                    )}
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
