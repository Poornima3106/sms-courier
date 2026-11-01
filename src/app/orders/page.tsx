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
  Truck,
  Package,
  Edit,
  AlertCircle,
  Check,
  X,
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
  const [products, setProducts] = useState<string[]>([
    'Diwali Feast Box',
    'Mixed Sweets Box',
    'Mysore Pak Box',
    'Laddu Box',
  ]);

  // Pagination
  const [page, setPage] = useState(1);
  const pageSize = 10;

  // Modals & Delete
  const [orderToDelete, setOrderToDelete] = useState<Order | null>(null);
  const [currentUser, setCurrentUser] = useState<any>(null);

  // Courier & AWB Assignment Modal State
  const [orderForCourier, setOrderForCourier] = useState<Order | null>(null);
  const [modalProduct, setModalProduct] = useState('Diwali Feast Box');
  const [modalCustomProduct, setModalCustomProduct] = useState('');
  const [modalIsCustomProduct, setModalIsCustomProduct] = useState(false);
  const [modalCourier, setModalCourier] = useState('Professional');
  const [modalCustomCourier, setModalCustomCourier] = useState('');
  const [modalIsCustomCourier, setModalIsCustomCourier] = useState(false);
  const [modalAwb, setModalAwb] = useState('');
  const [modalStatus, setModalStatus] = useState<OrderStatus>('Dispatched');
  const [modalDispatchDate, setModalDispatchDate] = useState('');
  const [modalBoxes, setModalBoxes] = useState('1');
  const [modalWeight, setModalWeight] = useState('1.0');
  const [modalCharge, setModalCharge] = useState('');
  const [isSavingCourier, setIsSavingCourier] = useState(false);
  const [courierSaveError, setCourierSaveError] = useState<string | null>(null);

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
          const pList = d.items.filter((m: any) => m.category === 'product').map((m: any) => m.name);
          setCouriers(cList);
          setCities(ctList);
          if (pList.length > 0) setProducts(pList);
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

  const openCourierModal = (order: Order) => {
    setOrderForCourier(order);
    setCourierSaveError(null);

    const existingCourier = order.courier || couriers[0] || 'Professional';
    if (couriers.length > 0 && !couriers.includes(existingCourier)) {
      setModalIsCustomCourier(true);
      setModalCustomCourier(existingCourier);
      setModalCourier('__custom__');
    } else {
      setModalIsCustomCourier(false);
      setModalCustomCourier('');
      setModalCourier(existingCourier);
    }

    const existingProduct = order.product || products[0] || 'Diwali Feast Box';
    if (products.length > 0 && !products.includes(existingProduct)) {
      setModalIsCustomProduct(true);
      setModalCustomProduct(existingProduct);
      setModalProduct('__custom__');
    } else {
      setModalIsCustomProduct(false);
      setModalCustomProduct('');
      setModalProduct(existingProduct);
    }

    setModalAwb(order.awb_no || '');
    setModalStatus(order.status === 'Pending' ? 'Dispatched' : order.status);
    setModalDispatchDate(order.dispatch_date || new Date().toISOString().slice(0, 10));
    setModalBoxes(order.boxes ? String(order.boxes) : '1');
    setModalWeight(order.weight_kg ? String(order.weight_kg) : '');
    setModalCharge(order.courier_charge ? String(order.courier_charge) : '');
  };

  const handleSaveCourierAssignment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!orderForCourier) return;

    setIsSavingCourier(true);
    setCourierSaveError(null);

    const finalCourier = modalIsCustomCourier ? modalCustomCourier.trim() : modalCourier;
    if (!finalCourier) {
      setCourierSaveError('Please select or specify a courier partner');
      setIsSavingCourier(false);
      return;
    }

    const finalProduct = modalIsCustomProduct ? modalCustomProduct.trim() : modalProduct;
    if (!finalProduct) {
      setCourierSaveError('Please select or specify a sweet box product');
      setIsSavingCourier(false);
      return;
    }

    try {
      const res = await fetch(`/api/orders/${orderForCourier.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          product: finalProduct,
          courier: finalCourier,
          awb_no: modalAwb.trim() ? modalAwb.trim().toUpperCase() : null,
          status: modalStatus,
          dispatch_date: modalDispatchDate || new Date().toISOString().slice(0, 10),
          boxes: Math.max(1, Number(modalBoxes) || 1),
          weight_kg: modalWeight ? Number(modalWeight) : null,
          courier_charge: modalCharge ? Number(modalCharge) : null,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setCourierSaveError(data.error || 'Failed to assign courier');
        setIsSavingCourier(false);
        return;
      }

      setOrderForCourier(null);
      mutate(`/api/orders?${queryParams.toString()}`);
      mutate('/api/orders');
    } catch (err: any) {
      setCourierSaveError('An unexpected error occurred while saving.');
    } finally {
      setIsSavingCourier(false);
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
            Search, filter, track, and update status • <span className="font-semibold text-gray-700 dark:text-gray-300">{totalCount} orders</span> • <span className="font-semibold text-[#7A1626] dark:text-[#E5B84B]">{allOrders.reduce((sum, o) => sum + (o.boxes || 1), 0)} total sweet boxes/items</span>
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
                  <th className="py-3.5 px-4">{t.orderFields.totalItems}</th>
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

                      {/* Sweet Box Product */}
                      <td className="py-3.5 px-4">
                        <span className="font-semibold text-gray-800 dark:text-gray-200 block">
                          {o.product}
                        </span>
                      </td>

                      {/* Total Items / Boxes */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-bold bg-amber-50 dark:bg-amber-950/40 text-[#7A1626] dark:text-[#E5B84B] border border-amber-200/80 dark:border-amber-900/60 shadow-xs">
                          <Package className="w-3.5 h-3.5" />
                          <span>{o.boxes || 1} {Number(o.boxes) === 1 ? 'Item' : 'Items'}</span>
                        </span>
                        {o.weight_kg && (
                          <span className="text-[10px] text-gray-400 block mt-0.5 font-medium">
                            {o.weight_kg} kg
                          </span>
                        )}
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
                            <div className="flex items-center gap-1.5">
                              <span className="font-semibold text-gray-800 dark:text-gray-200">
                                {o.courier}
                              </span>
                              <button
                                type="button"
                                onClick={() => openCourierModal(o)}
                                className="p-1 rounded text-gray-400 hover:text-[#7A1626] dark:hover:text-[#E5B84B] hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors cursor-pointer"
                                title="Edit Courier or AWB"
                              >
                                <Edit className="w-3 h-3" />
                              </button>
                            </div>
                            {o.awb_no ? (
                              <a
                                href={getTrackingUrl(o.courier, o.awb_no)}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1 text-[11px] text-blue-600 dark:text-blue-400 font-mono font-semibold hover:underline"
                                title={`Track on official ${o.courier} portal`}
                              >
                                <span>{o.awb_no}</span>
                                <ExternalLink className="w-2.5 h-2.5" />
                              </a>
                            ) : (
                              <button
                                type="button"
                                onClick={() => openCourierModal(o)}
                                className="text-[10px] text-amber-600 dark:text-amber-400 font-semibold hover:underline cursor-pointer block"
                              >
                                + Add AWB Number
                              </button>
                            )}
                            {o.dispatch_date && (
                              <span className="text-[9px] text-gray-400 block">
                                Dispatched: {formatDate(o.dispatch_date)}
                              </span>
                            )}
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => openCourierModal(o)}
                            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 hover:bg-amber-100 dark:hover:bg-amber-900/60 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800 text-[11px] font-bold transition-all shadow-xs cursor-pointer"
                            title="Assign Courier Partner & AWB tracking"
                          >
                            <Truck className="w-3.5 h-3.5" />
                            <span>+ Assign Courier</span>
                          </button>
                        )}
                      </td>

                      {/* Actions: Courier, WhatsApp, Track, Delete */}
                      <td className="py-3.5 px-4 whitespace-nowrap text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Assign / Edit Courier quick button */}
                          <button
                            type="button"
                            onClick={() => openCourierModal(o)}
                            className="p-1.5 rounded-lg bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 hover:bg-amber-100 transition-colors cursor-pointer"
                            title={o.courier ? "Edit Courier & AWB" : "Assign Courier & AWB"}
                          >
                            <Truck className="w-4 h-4" />
                          </button>

                          {/* WhatsApp Button for all orders */}
                          {o.phone && (
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

      {/* Assign / Edit Courier & AWB Modal */}
      {orderForCourier && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-[#1E0D12] rounded-3xl shadow-2xl border border-[#EFE4D3] dark:border-[#3A1B23] w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95">
            {/* Modal Header */}
            <div className="bg-[#7A1626] text-white p-5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center">
                  <Truck className="w-5 h-5 text-[#E5B84B]" />
                </div>
                <div>
                  <h3 className="font-serif font-bold text-base sm:text-lg">
                    Assign Courier & Tracking AWB
                  </h3>
                  <p className="text-xs text-white/80">
                    Order {orderForCourier.order_no} • {orderForCourier.customer_name} ({orderForCourier.city})
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setOrderForCourier(null)}
                className="text-white/70 hover:text-white p-1 rounded-lg transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSaveCourierAssignment} className="p-6 space-y-4 text-xs">
              {courierSaveError && (
                <div className="p-3 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 text-red-700 dark:text-red-300 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <p>{courierSaveError}</p>
                </div>
              )}

              {/* Sweet Box Product & Total Items */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pb-3 border-b border-gray-100 dark:border-gray-800">
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300">
                      Sweet Box Product *
                    </label>
                    <button
                      type="button"
                      onClick={() => setModalIsCustomProduct(!modalIsCustomProduct)}
                      className="text-[10px] font-semibold text-[#7A1626] dark:text-[#E5B84B] hover:underline cursor-pointer"
                    >
                      {modalIsCustomProduct ? '← Dropdown' : '+ Custom'}
                    </button>
                  </div>
                  {!modalIsCustomProduct ? (
                    <select
                      value={modalProduct}
                      onChange={(e) => setModalProduct(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-[#140A0D] text-xs font-semibold focus:ring-2 focus:ring-[#7A1626] outline-none"
                    >
                      {products.map((p) => (
                        <option key={p} value={p}>{p}</option>
                      ))}
                    </select>
                  ) : (
                    <input
                      type="text"
                      required
                      value={modalCustomProduct}
                      onChange={(e) => setModalCustomProduct(e.target.value)}
                      placeholder="Sweet box name"
                      className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-[#140A0D] text-xs focus:ring-2 focus:ring-[#7A1626] outline-none"
                    />
                  )}
                </div>

                <div>
                  <label className="block font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300 mb-1.5">
                    Total No. of Items (Boxes) *
                  </label>
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => setModalBoxes((prev) => String(Math.max(1, (Number(prev) || 1) - 1)))}
                      className="w-8 h-8 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 font-bold text-sm flex items-center justify-center transition-colors cursor-pointer select-none"
                    >
                      -
                    </button>
                    <input
                      type="number"
                      min="1"
                      required
                      value={modalBoxes}
                      onChange={(e) => setModalBoxes(e.target.value)}
                      className="flex-1 text-center px-2.5 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-[#140A0D] text-xs font-bold text-[#7A1626] dark:text-[#E5B84B] focus:ring-2 focus:ring-[#7A1626] outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => setModalBoxes((prev) => String((Number(prev) || 0) + 1))}
                      className="w-8 h-8 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 font-bold text-sm flex items-center justify-center transition-colors cursor-pointer select-none"
                    >
                      +
                    </button>
                  </div>
                </div>
              </div>

              {/* Courier Partner Selection */}
              <div>
                <label className="block font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300 mb-1.5">
                  Courier Partner *
                </label>
                {!modalIsCustomCourier ? (
                  <select
                    value={modalCourier}
                    onChange={(e) => {
                      if (e.target.value === '__custom__') {
                        setModalIsCustomCourier(true);
                        setModalCustomCourier('');
                      } else {
                        setModalCourier(e.target.value);
                      }
                    }}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-[#140A0D] text-xs font-semibold focus:ring-2 focus:ring-[#7A1626] outline-none"
                  >
                    {couriers.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                    <option value="__custom__">+ Enter Custom Courier Partner</option>
                  </select>
                ) : (
                  <div className="flex gap-2">
                    <input
                      type="text"
                      required
                      value={modalCustomCourier}
                      onChange={(e) => setModalCustomCourier(e.target.value)}
                      placeholder="e.g. Professional / ST Courier / Speed Post"
                      className="flex-1 px-3.5 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-[#140A0D] text-xs focus:ring-2 focus:ring-[#7A1626] outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => setModalIsCustomCourier(false)}
                      className="px-3 py-2 text-xs text-gray-500 hover:text-gray-700 font-semibold"
                    >
                      Cancel
                    </button>
                  </div>
                )}
              </div>

              {/* AWB Tracking Number */}
              <div>
                <label className="block font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300 mb-1.5">
                  AWB / Tracking Number *
                </label>
                <input
                  type="text"
                  required
                  value={modalAwb}
                  onChange={(e) => setModalAwb(e.target.value.toUpperCase())}
                  placeholder="e.g. PRO672314 or ST8892110"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-[#140A0D] text-xs font-mono font-bold uppercase tracking-wider focus:ring-2 focus:ring-[#7A1626] outline-none"
                />
                <p className="text-[10px] text-gray-400 mt-1">
                  Once assigned, customers can track their parcel live and receive direct tracking links
                </p>
              </div>

              {/* Status & Dispatch Date */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300 mb-1.5">
                    Order Status
                  </label>
                  <select
                    value={modalStatus}
                    onChange={(e) => setModalStatus(e.target.value as OrderStatus)}
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-[#140A0D] text-xs font-semibold focus:ring-2 focus:ring-[#7A1626] outline-none"
                  >
                    {ALL_STATUSES.map((st) => (
                      <option key={st} value={st}>{st}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300 mb-1.5">
                    Dispatch Date
                  </label>
                  <input
                    type="date"
                    value={modalDispatchDate}
                    onChange={(e) => setModalDispatchDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-[#140A0D] text-xs focus:ring-2 focus:ring-[#7A1626] outline-none"
                  />
                </div>
              </div>

              {/* Optional: Weight, Courier Charge */}
              <div className="grid grid-cols-2 gap-3 pt-1 border-t border-gray-100 dark:border-gray-800">
                <div>
                  <label className="block text-[10px] font-semibold text-gray-500 mb-1">
                    Weight (kg)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    value={modalWeight}
                    onChange={(e) => setModalWeight(e.target.value)}
                    placeholder="1.0"
                    className="w-full px-2.5 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-[#140A0D] text-xs"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-semibold text-gray-500 mb-1">
                    Charge (₹)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={modalCharge}
                    onChange={(e) => setModalCharge(e.target.value)}
                    placeholder="90"
                    className="w-full px-2.5 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-[#140A0D] text-xs"
                  />
                </div>
              </div>

              {/* Modal Buttons */}
              <div className="pt-4 border-t border-gray-100 dark:border-gray-800 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setOrderForCourier(null)}
                  className="px-4 py-2 rounded-xl text-gray-600 dark:text-gray-300 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 text-xs font-medium cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSavingCourier}
                  className="px-5 py-2 rounded-xl bg-[#7A1626] hover:bg-[#5B0E1B] text-white text-xs font-semibold shadow-md transition-all cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
                >
                  {isSavingCourier ? (
                    <>
                      <RotateCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Saving...</span>
                    </>
                  ) : (
                    <>
                      <Check className="w-3.5 h-3.5" />
                      <span>Save & Update Courier</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

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
