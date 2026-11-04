'use client';

import React, { useState, useEffect } from 'react';
import useSWR, { mutate } from 'swr';
import Link from 'next/link';
import { useI18n } from '@/lib/i18n';
import { Order, OrderStatus, PaymentStatus } from '@/lib/types';
import StatusBadge from '@/components/StatusBadge';
import ConfirmModal from '@/components/ConfirmModal';
import {
  formatDate,
  formatCurrency,
  formatPhoneDisplay,
  getWhatsAppUrl,
  getTrackingUrl,
  getCleanCarrierAwb,
  isProfessionalCourier,
} from '@/lib/utils/format';
import { exportOrdersToExcel, exportOrdersToPdf } from '@/lib/utils/export';
import {
  COUNTRY_CODES,
  combinePhoneInput,
  parseStoredPhone,
  phoneNumberSchema,
} from '@/lib/validations/order';
import {
  Search,
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
  Globe,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Phone,
  UserCheck,
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
  const [phoneFilter, setPhoneFilter] = useState('');
  const [status, setStatus] = useState('All');
  const [courier, setCourier] = useState('All');
  const [city, setCity] = useState('All');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [sortBy, setSortBy] = useState<
    | 'latest'
    | 'order_no_asc'
    | 'order_no_desc'
    | 'phone_asc'
    | 'phone_desc'
    | 'date_desc'
    | 'date_asc'
    | 'amount_desc'
    | 'amount_asc'
    | 'boxes_desc'
    | 'name_asc'
  >('latest');

  // Masters
  const [couriers, setCouriers] = useState<string[]>([
    'Professional',
    'ST Courier',
    'DTDC',
    'India Post (Speed Post)',
  ]);
  const [cities, setCities] = useState<string[]>([
    'Pollachi',
    'Coimbatore',
    'Chennai',
    'Madurai',
    'Trichy',
    'Salem',
    'Tirunelveli',
  ]);
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

  // Full Edit Order Modal State
  const [orderToEdit, setOrderToEdit] = useState<Order | null>(null);
  const [editOrderNo, setEditOrderNo] = useState('');
  const [editOrderDate, setEditOrderDate] = useState('');
  const [editCustomerName, setEditCustomerName] = useState('');
  const [editCountryCode, setEditCountryCode] = useState('+91');
  const [editPhone, setEditPhone] = useState('');
  const [editAddress, setEditAddress] = useState('');
  const [editCity, setEditCity] = useState('');
  const [editCustomCity, setEditCustomCity] = useState('');
  const [editIsCustomCity, setEditIsCustomCity] = useState(false);
  const [editPincode, setEditPincode] = useState('');
  const [editProduct, setEditProduct] = useState('');
  const [editCustomProduct, setEditCustomProduct] = useState('');
  const [editIsCustomProduct, setEditIsCustomProduct] = useState(false);
  const [editBoxes, setEditBoxes] = useState('1');
  const [editPaymentStatus, setEditPaymentStatus] = useState<PaymentStatus>('Paid');
  const [editAmount, setEditAmount] = useState('');
  const [editStatus, setEditStatus] = useState<OrderStatus>('Pending');
  const [editCourier, setEditCourier] = useState('');
  const [editCustomCourier, setEditCustomCourier] = useState('');
  const [editIsCustomCourier, setEditIsCustomCourier] = useState(false);
  const [editAwb, setEditAwb] = useState('');
  const [editDispatchDate, setEditDispatchDate] = useState('');
  const [editWeight, setEditWeight] = useState('');
  const [editCharge, setEditCharge] = useState('');
  const [isSavingEdit, setIsSavingEdit] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);

  // Courier & AWB Quick Assignment Modal State
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
  const [copiedAwbId, setCopiedAwbId] = useState<string | null>(null);

  const handleCopyAwb = (id: string, courierName?: string | null, awbNo?: string | null) => {
    if (!awbNo) return;
    const clean = getCleanCarrierAwb(courierName, awbNo);
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(clean).catch(() => {});
      setCopiedAwbId(id);
      setTimeout(() => {
        setCopiedAwbId((prev) => (prev === id ? null : prev));
      }, 3000);
    }
  };

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
          if (cList.length > 0) setCouriers(cList);
          if (ctList.length > 0) setCities(ctList);
          if (pList.length > 0) setProducts(pList);
        }
      })
      .catch(() => {});
  }, []);

  const queryParams = new URLSearchParams();
  if (search) queryParams.set('search', search);
  if (phoneFilter) queryParams.set('phone', phoneFilter);
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

  // Also fetch full list for phone autocomplete suggestions
  const { data: allUnfilteredData } = useSWR('/api/orders', fetcher);
  const allUnfilteredOrders: Order[] = allUnfilteredData?.orders || [];

  const allOrders: Order[] = data?.orders || [];

  const getNumericOrderNo = (orderNo: string): number => {
    const num = parseInt(orderNo.replace(/\D/g, ''), 10);
    return isNaN(num) ? 0 : num;
  };

  const getCleanPhoneKey = (phone?: string | null): string => {
    const d = (phone || '').replace(/\D/g, '');
    return d.length === 12 && d.startsWith('91') ? d.slice(2) : d;
  };

  const sortedOrders = [...allOrders].sort((a, b) => {
    switch (sortBy) {
      case 'latest': {
        const timeDiff = new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        if (timeDiff !== 0) return timeDiff;
        const numDiff = getNumericOrderNo(b.order_no) - getNumericOrderNo(a.order_no);
        return numDiff !== 0 ? numDiff : b.order_no.localeCompare(a.order_no, undefined, { numeric: true });
      }
      case 'order_no_asc': {
        const diff = getNumericOrderNo(a.order_no) - getNumericOrderNo(b.order_no);
        return diff !== 0 ? diff : a.order_no.localeCompare(b.order_no, undefined, { numeric: true });
      }
      case 'order_no_desc': {
        const diff = getNumericOrderNo(b.order_no) - getNumericOrderNo(a.order_no);
        return diff !== 0 ? diff : b.order_no.localeCompare(a.order_no, undefined, { numeric: true });
      }
      case 'phone_asc':
        return getCleanPhoneKey(a.phone).localeCompare(getCleanPhoneKey(b.phone), undefined, { numeric: true });
      case 'phone_desc':
        return getCleanPhoneKey(b.phone).localeCompare(getCleanPhoneKey(a.phone), undefined, { numeric: true });
      case 'date_asc':
        return a.order_date.localeCompare(b.order_date) || getNumericOrderNo(a.order_no) - getNumericOrderNo(b.order_no);
      case 'date_desc':
        return b.order_date.localeCompare(a.order_date) || getNumericOrderNo(b.order_no) - getNumericOrderNo(a.order_no);
      case 'amount_desc':
        return (Number(b.amount) || 0) - (Number(a.amount) || 0);
      case 'amount_asc':
        return (Number(a.amount) || 0) - (Number(b.amount) || 0);
      case 'boxes_desc':
        return (Number(b.boxes) || 1) - (Number(a.boxes) || 1);
      case 'name_asc':
        return a.customer_name.localeCompare(b.customer_name);
      default:
        return 0;
    }
  });

  // Unique customer phone options for autocomplete
  const customerPhoneOptions = React.useMemo(() => {
    const map = new Map<string, { phone: string; name: string; city: string; count: number }>();
    for (const ord of allUnfilteredOrders) {
      const key = getCleanPhoneKey(ord.phone) || ord.phone;
      if (!key) continue;
      const existing = map.get(key);
      if (existing) {
        existing.count += 1;
      } else {
        map.set(key, {
          phone: ord.phone,
          name: ord.customer_name,
          city: ord.city,
          count: 1,
        });
      }
    }
    return Array.from(map.values());
  }, [allUnfilteredOrders]);

  // Detect if the active phone filter / search resolves to a single customer phone number
  const activeCustomerSummary = React.useMemo(() => {
    const trimmedSearch = search.trim();
    const isPhoneSearch = !/[a-zA-Z]/.test(trimmedSearch) && trimmedSearch.replace(/\D/g, '').length >= 6;
    const hasPhoneQuery = Boolean(phoneFilter.trim()) || isPhoneSearch;
    if (!hasPhoneQuery || sortedOrders.length === 0) return null;

    const uniquePhoneKeys = new Set(sortedOrders.map((o) => getCleanPhoneKey(o.phone)));
    if (uniquePhoneKeys.size !== 1) return null;

    const first = sortedOrders[0];
    const totalCustomerAmount = sortedOrders.reduce((sum, o) => sum + (Number(o.amount) || 0), 0);
    const totalCustomerBoxes = sortedOrders.reduce((sum, o) => sum + (Number(o.boxes) || 1), 0);
    const customerNames = Array.from(new Set(sortedOrders.map((o) => o.customer_name))).join(', ');

    return {
      name: customerNames,
      phone: first.phone,
      phoneDisplay: formatPhoneDisplay(first.phone),
      city: first.city,
      address: first.address,
      orderCount: sortedOrders.length,
      totalBoxes: totalCustomerBoxes,
      totalAmount: totalCustomerAmount,
      latestOrderNo: first.order_no,
      courier: first.courier,
      awbNo: first.awb_no,
    };
  }, [phoneFilter, search, sortedOrders]);

  const totalCount = sortedOrders.length;
  const totalPages = Math.ceil(totalCount / pageSize) || 1;
  const paginatedOrders = sortedOrders.slice((page - 1) * pageSize, page * pageSize);

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

  const openEditOrderModal = (order: Order) => {
    setOrderToEdit(order);
    setEditError(null);
    setEditOrderNo(order.order_no);
    setEditOrderDate(order.order_date);
    setEditCustomerName(order.customer_name);

    const parsedPhone = parseStoredPhone(order.phone);
    setEditCountryCode(parsedPhone.countryCode);
    setEditPhone(parsedPhone.localNumber);

    setEditAddress(order.address || '');
    setEditPincode(order.pincode);

    if (cities.length > 0 && !cities.includes(order.city)) {
      setEditIsCustomCity(true);
      setEditCustomCity(order.city);
      setEditCity(cities[0] || 'Pollachi');
    } else {
      setEditIsCustomCity(false);
      setEditCustomCity('');
      setEditCity(order.city || cities[0] || 'Pollachi');
    }

    if (products.length > 0 && !products.includes(order.product)) {
      setEditIsCustomProduct(true);
      setEditCustomProduct(order.product);
      setEditProduct(products[0] || 'Diwali Feast Box');
    } else {
      setEditIsCustomProduct(false);
      setEditCustomProduct('');
      setEditProduct(order.product || products[0] || 'Diwali Feast Box');
    }

    setEditBoxes(String(order.boxes || 1));
    setEditPaymentStatus(order.payment_status);
    setEditAmount(String(order.amount));
    setEditStatus(order.status);

    if (order.courier && couriers.length > 0 && !couriers.includes(order.courier)) {
      setEditIsCustomCourier(true);
      setEditCustomCourier(order.courier);
      setEditCourier('');
    } else {
      setEditIsCustomCourier(false);
      setEditCustomCourier('');
      setEditCourier(order.courier || '');
    }

    setEditAwb(order.awb_no || '');
    setEditDispatchDate(order.dispatch_date || '');
    setEditWeight(order.weight_kg != null ? String(order.weight_kg) : '');
    setEditCharge(order.courier_charge != null ? String(order.courier_charge) : '');
  };

  const handleSaveEditOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!orderToEdit) return;

    setEditError(null);

    if (!editOrderNo.trim() || !/^\d+$/.test(editOrderNo.trim())) {
      setEditError('Order number must contain only numbers (e.g. 1005)');
      return;
    }

    if (!editCustomerName.trim() || editCustomerName.trim().length < 2) {
      setEditError('Customer name must be at least 2 characters');
      return;
    }

    const combinedPhone = combinePhoneInput(editCountryCode, editPhone);
    const phoneCheck = phoneNumberSchema.safeParse(combinedPhone);
    if (!phoneCheck.success) {
      setEditError(
        phoneCheck.error.issues[0]?.message ||
          'Enter a valid 10-digit Indian mobile number or international number'
      );
      return;
    }

    const finalCity = editIsCustomCity ? editCustomCity.trim() : editCity.trim();
    if (!finalCity || finalCity.length < 2) {
      setEditError('Please select or enter a valid city');
      return;
    }

    if (!editPincode.trim() || !/^\d{6}$/.test(editPincode.trim())) {
      setEditError('PIN code must be exactly 6 digits');
      return;
    }

    const finalProduct = editIsCustomProduct ? editCustomProduct.trim() : editProduct.trim();
    if (!finalProduct || finalProduct.length < 2) {
      setEditError('Please select or enter a valid sweet box product');
      return;
    }

    const cleanEditAwb = editAwb.trim() ? editAwb.trim().toUpperCase() : null;
    const rawCourier = editIsCustomCourier
      ? editCustomCourier.trim() || null
      : editCourier.trim() || null;
    const finalCourier = rawCourier || (cleanEditAwb ? 'Professional' : null);
    const finalStatus: OrderStatus =
      cleanEditAwb && editStatus === 'Pending' ? 'Dispatched' : editStatus;
    const finalDispatchDate =
      editDispatchDate || (cleanEditAwb ? new Date().toISOString().slice(0, 10) : null);

    setIsSavingEdit(true);

    try {
      const res = await fetch(`/api/orders/${encodeURIComponent(orderToEdit.id)}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          order_no: editOrderNo.trim(),
          order_date: editOrderDate,
          customer_name: editCustomerName.trim(),
          phone: combinedPhone,
          address: editAddress.trim(),
          city: finalCity,
          pincode: editPincode.trim(),
          product: finalProduct,
          boxes: Math.max(1, Number(editBoxes) || 1),
          payment_status: editPaymentStatus,
          amount: Math.max(0, Number(editAmount) || 0),
          status: finalStatus,
          courier: finalCourier,
          awb_no: cleanEditAwb,
          dispatch_date: finalDispatchDate,
          weight_kg: editWeight ? Number(editWeight) : null,
          courier_charge: editCharge ? Number(editCharge) : null,
        }),
      });

      const resData = await res.json();
      if (!res.ok) {
        setEditError(resData.error || 'Failed to update order');
        setIsSavingEdit(false);
        return;
      }

      setOrderToEdit(null);
      mutate(`/api/orders?${queryParams.toString()}`);
      mutate('/api/orders');
    } catch {
      setEditError('An unexpected error occurred while saving changes.');
    } finally {
      setIsSavingEdit(false);
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
    } catch {
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
    exportOrdersToExcel(sortedOrders, `Sri_Mahadevaiyer_Orders_${new Date().toISOString().slice(0, 10)}.xlsx`);
  };

  const handleExportPdf = () => {
    exportOrdersToPdf(sortedOrders, 'Sri Mahadevaiyer Sweets – Orders Register');
  };

  const selectedEditCountryOption =
    COUNTRY_CODES.find((c) => c.code === editCountryCode) || COUNTRY_CODES[0];

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white dark:bg-[#1E0D12] p-5 sm:p-6 rounded-3xl shadow-sm border border-[#EFE4D3] dark:border-[#3A1B23]">
        <div>
          <h2 className="text-xl sm:text-2xl font-serif font-bold text-[#7A1626] dark:text-[#E5B84B]">
            {t.nav.orders}
          </h2>
          <p className="text-xs sm:text-sm text-gray-500">
            Search, filter, edit, track, and update status •{' '}
            <span className="font-semibold text-gray-700 dark:text-gray-300">{totalCount} orders</span> •{' '}
            <span className="font-semibold text-[#7A1626] dark:text-[#E5B84B]">
              {allOrders.reduce((sum, o) => sum + (o.boxes || 1), 0)} total sweet boxes/items
            </span>
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
              className="w-full pl-10 pr-7 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-[#140A0D] text-xs sm:text-sm focus:ring-2 focus:ring-[#7A1626] outline-none"
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

          {/* Dedicated Customer Phone Number Filter / Lookup */}
          <div className="relative flex-1">
            <Phone className="w-4 h-4 absolute left-3.5 top-3 text-[#7A1626] dark:text-[#E5B84B]" />
            <input
              type="tel"
              list="customer-phone-list"
              value={phoneFilter}
              onChange={(e) => {
                setPhoneFilter(e.target.value);
                setPage(1);
              }}
              placeholder="Filter by Customer Phone No (e.g. 9876543210 or +44...)"
              className="w-full pl-10 pr-7 py-2 rounded-xl border border-[#EFE4D3] dark:border-[#3A1B23] bg-[#FBF6EF]/60 dark:bg-[#180A0E] text-xs sm:text-sm font-mono focus:ring-2 focus:ring-[#7A1626] outline-none"
            />
            <datalist id="customer-phone-list">
              {customerPhoneOptions.map((c) => (
                <option key={c.phone} value={c.phone}>
                  {c.name} ({c.city}) — {c.count} {c.count === 1 ? 'order' : 'orders'}
                </option>
              ))}
            </datalist>
            {phoneFilter && (
              <button
                onClick={() => {
                  setPhoneFilter('');
                  setPage(1);
                }}
                className="absolute right-3 top-2.5 text-xs text-gray-400 hover:text-gray-600 cursor-pointer"
                title="Clear phone filter"
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

          {/* Sort By Dropdown */}
          <select
            aria-label="Sort Orders By"
            value={sortBy}
            onChange={(e) => {
              setSortBy(e.target.value as any);
              setPage(1);
            }}
            className="px-3 py-2 rounded-xl border border-[#EFE4D3] dark:border-[#3A1B23] bg-[#FBF6EF] dark:bg-[#180A0E] text-[#7A1626] dark:text-[#E5B84B] text-xs font-bold focus:ring-2 focus:ring-[#7A1626] outline-none"
          >
            <option value="latest">Sort By: Latest Booked First</option>
            <option value="order_no_desc">Sort: Order No (Latest → Oldest)</option>
            <option value="order_no_asc">Sort: Order No (1 → 9999)</option>
            <option value="phone_asc">Sort: Phone No (0 → 9)</option>
            <option value="phone_desc">Sort: Phone No (9 → 0)</option>
            <option value="date_desc">Sort: Date (Newest First)</option>
            <option value="date_asc">Sort: Date (Oldest First)</option>
            <option value="amount_desc">Sort: Amount (High → Low)</option>
            <option value="amount_asc">Sort: Amount (Low → High)</option>
            <option value="boxes_desc">Sort: Total Items (High → Low)</option>
            <option value="name_asc">Sort: Customer Name (A → Z)</option>
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
            {(dateFrom ||
              dateTo ||
              status !== 'All' ||
              courier !== 'All' ||
              city !== 'All' ||
              search ||
              phoneFilter ||
              sortBy !== 'latest') && (
              <button
                type="button"
                onClick={() => {
                  setSearch('');
                  setPhoneFilter('');
                  setStatus('All');
                  setCourier('All');
                  setCity('All');
                  setDateFrom('');
                  setDateTo('');
                  setSortBy('latest');
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

      {/* Customized Customer Profile Banner when a customer's phone number is typed/filtered */}
      {activeCustomerSummary && (
        <div className="bg-gradient-to-r from-[#7A1626] to-[#5B0E1B] text-white p-5 rounded-3xl shadow-md border border-[#E5B84B]/30 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 animate-in fade-in">
          <div className="flex items-start sm:items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-white/15 flex items-center justify-center shrink-0">
              <UserCheck className="w-6 h-6 text-[#E5B84B]" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-[#E5B84B] text-[#4A0B15]">
                  Customized Customer View
                </span>
                <span className="text-xs font-mono text-white/90">
                  {activeCustomerSummary.phoneDisplay.formatted}
                </span>
                {activeCustomerSummary.phoneDisplay.isInternational && (
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-blue-500/30 border border-blue-300/40">
                    INTL
                  </span>
                )}
              </div>
              <h3 className="text-lg sm:text-xl font-serif font-bold mt-1">
                {activeCustomerSummary.name}{' '}
                <span className="text-xs font-sans font-normal text-white/80">
                  ({activeCustomerSummary.city})
                </span>
              </h3>
              {activeCustomerSummary.address && (
                <p className="text-xs text-white/75 mt-0.5">{activeCustomerSummary.address}</p>
              )}
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3 sm:gap-5">
            <div className="bg-white/10 px-3.5 py-2 rounded-2xl text-center">
              <span className="block text-[10px] uppercase tracking-wider text-white/70">Orders</span>
              <span className="text-base font-bold text-[#E5B84B]">{activeCustomerSummary.orderCount}</span>
            </div>
            <div className="bg-white/10 px-3.5 py-2 rounded-2xl text-center">
              <span className="block text-[10px] uppercase tracking-wider text-white/70">Total Boxes</span>
              <span className="text-base font-bold text-[#E5B84B]">{activeCustomerSummary.totalBoxes}</span>
            </div>
            <div className="bg-white/10 px-3.5 py-2 rounded-2xl text-center">
              <span className="block text-[10px] uppercase tracking-wider text-white/70">Total Value</span>
              <span className="text-base font-bold text-emerald-300">
                {formatCurrency(activeCustomerSummary.totalAmount)}
              </span>
            </div>
            <button
              type="button"
              onClick={() => {
                setPhoneFilter('');
                setSearch('');
                setPage(1);
              }}
              className="px-3.5 py-2 rounded-xl bg-white/15 hover:bg-white/25 text-xs font-semibold text-white transition-colors cursor-pointer"
            >
              Show All Customers ✕
            </button>
          </div>
        </div>
      )}

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
                  <th className="py-3.5 px-4">
                    <button
                      type="button"
                      onClick={() => {
                        setSortBy((prev) =>
                          prev === 'order_no_asc' ? 'order_no_desc' : 'order_no_asc'
                        );
                        setPage(1);
                      }}
                      className="inline-flex items-center gap-1 uppercase tracking-wider font-bold text-[#7A1626] dark:text-[#E5B84B] hover:underline cursor-pointer"
                      title="Click to sort by Order Number"
                    >
                      <span>{t.orderFields.orderNo}</span>
                      {sortBy === 'order_no_asc' ? (
                        <ArrowUp className="w-3.5 h-3.5" />
                      ) : sortBy === 'order_no_desc' ? (
                        <ArrowDown className="w-3.5 h-3.5" />
                      ) : (
                        <ArrowUpDown className="w-3.5 h-3.5 opacity-60" />
                      )}
                    </button>
                  </th>
                  <th className="py-3.5 px-4">
                    <button
                      type="button"
                      onClick={() => {
                        setSortBy((prev) => (prev === 'phone_asc' ? 'phone_desc' : 'phone_asc'));
                        setPage(1);
                      }}
                      className="inline-flex items-center gap-1 uppercase tracking-wider font-bold text-gray-700 dark:text-gray-300 hover:text-[#7A1626] dark:hover:text-[#E5B84B] cursor-pointer"
                      title="Click to sort by Phone Number"
                    >
                      <span>{t.orderFields.customerName} / Phone</span>
                      {sortBy === 'phone_asc' ? (
                        <ArrowUp className="w-3.5 h-3.5 text-[#7A1626] dark:text-[#E5B84B]" />
                      ) : sortBy === 'phone_desc' ? (
                        <ArrowDown className="w-3.5 h-3.5 text-[#7A1626] dark:text-[#E5B84B]" />
                      ) : (
                        <ArrowUpDown className="w-3.5 h-3.5 opacity-50" />
                      )}
                    </button>
                  </th>
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
                  const whatsAppUrl = getWhatsAppUrl(o.customer_name, o.order_no, o.courier, o.awb_no, o.phone);
                  const phoneInfo = formatPhoneDisplay(o.phone);

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

                      {/* Customer Name, Phone & Optional Address */}
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-gray-900 dark:text-gray-100">
                          {o.customer_name}
                        </div>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <button
                            type="button"
                            onClick={() => {
                              setPhoneFilter(o.phone);
                              setPage(1);
                            }}
                            className="text-[11px] text-[#7A1626] dark:text-[#E5B84B] hover:underline font-mono font-semibold cursor-pointer"
                            title="Click to show only this customer's orders"
                          >
                            {phoneInfo.formatted}
                          </button>
                          {phoneInfo.isInternational && (
                            <span className="inline-flex items-center gap-0.5 px-1.5 py-0.2 rounded text-[9px] font-bold bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                              <Globe className="w-2.5 h-2.5" />
                              INTL
                            </span>
                          )}
                        </div>
                        {o.address ? (
                          <div className="text-[10px] text-gray-400 truncate max-w-[180px]" title={o.address}>
                            {o.address}
                          </div>
                        ) : (
                          <div className="text-[10px] text-gray-400 italic">No address added</div>
                        )}
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
                        {o.courier || o.awb_no ? (
                          <div>
                            <div className="flex items-center gap-1.5">
                              <span className="font-semibold text-gray-800 dark:text-gray-200">
                                {o.courier || 'Professional'}
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
                              <div className="flex items-center gap-1.5 mt-0.5">
                                <a
                                  href={getTrackingUrl(o.courier || 'Professional', o.awb_no)}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  onClick={() => handleCopyAwb(o.id, o.courier || 'Professional', o.awb_no)}
                                  className="inline-flex items-center gap-1 text-[11px] text-blue-600 dark:text-blue-400 font-mono font-semibold hover:underline"
                                  title={`Copies Track ID ${o.awb_no} & opens ${
                                    isProfessionalCourier(o.courier || 'Professional', o.awb_no)
                                      ? 'tpcindia.com/Default.aspx'
                                      : `${o.courier} portal`
                                  }`}
                                >
                                  <span>{o.awb_no}</span>
                                  <ExternalLink className="w-2.5 h-2.5" />
                                </a>
                                {copiedAwbId === o.id && (
                                  <span className="inline-flex items-center gap-0.5 px-1.5 py-0.2 rounded text-[9px] font-bold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                                    <Check className="w-2.5 h-2.5" />
                                    Copied!
                                  </span>
                                )}
                              </div>
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

                      {/* Actions: Edit Order, Courier, WhatsApp, Track, Delete */}
                      <td className="py-3.5 px-4 whitespace-nowrap text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Edit Order Button */}
                          <button
                            type="button"
                            onClick={() => openEditOrderModal(o)}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-violet-50 dark:bg-violet-950/40 text-violet-700 dark:text-violet-300 border border-violet-200 dark:border-violet-800 hover:bg-violet-100 text-[11px] font-semibold transition-colors cursor-pointer"
                            title="Edit Order Details"
                          >
                            <Edit className="w-3.5 h-3.5" />
                            <span>Edit</span>
                          </button>

                          {/* Assign / Edit Courier quick button */}
                          <button
                            type="button"
                            onClick={() => openCourierModal(o)}
                            className="p-1.5 rounded-lg bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 hover:bg-amber-100 transition-colors cursor-pointer"
                            title={o.courier ? 'Edit Courier & AWB' : 'Assign Courier & AWB'}
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
                            href={`/track?orderNo=${encodeURIComponent(o.awb_no || o.order_no)}`}
                            onClick={() => {
                              if (o.awb_no) {
                                handleCopyAwb(o.id, o.courier || 'Professional', o.awb_no);
                              }
                            }}
                            className="p-1.5 rounded-lg bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 hover:bg-blue-100 transition-colors"
                            title={
                              o.awb_no
                                ? `Track AWB ${o.awb_no} (${o.courier || 'Professional'})`
                                : `Track Order ${o.order_no}`
                            }
                          >
                            <ExternalLink className="w-4 h-4" />
                          </Link>

                          {/* Delete Order Button */}
                          <button
                            type="button"
                            onClick={() => setOrderToDelete(o)}
                            className="p-1.5 rounded-lg bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400 hover:bg-red-100 transition-colors cursor-pointer"
                            title="Delete Order"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
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

      {/* Full Edit Order Modal */}
      {orderToEdit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white dark:bg-[#1E0D12] rounded-3xl shadow-2xl border border-[#EFE4D3] dark:border-[#3A1B23] w-full max-w-2xl overflow-hidden my-8 animate-in fade-in zoom-in-95">
            {/* Modal Header */}
            <div className="bg-[#7A1626] text-white p-5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center">
                  <Edit className="w-5 h-5 text-[#E5B84B]" />
                </div>
                <div>
                  <h3 className="font-serif font-bold text-base sm:text-lg">
                    Edit Order #{orderToEdit.order_no}
                  </h3>
                  <p className="text-xs text-white/80">
                    Update customer, Indian/International phone, optional address, and shipment details
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Link
                  href={`/orders/add?edit=${encodeURIComponent(orderToEdit.id)}`}
                  className="text-[11px] font-semibold px-2.5 py-1 rounded-lg bg-white/15 hover:bg-white/25 text-white transition-colors"
                >
                  Open Full Page
                </Link>
                <button
                  type="button"
                  onClick={() => setOrderToEdit(null)}
                  className="text-white/70 hover:text-white p-1 rounded-lg transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSaveEditOrder} className="p-6 space-y-4 text-xs max-h-[80vh] overflow-y-auto">
              {editError && (
                <div className="p-3 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 text-red-700 dark:text-red-300 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <p>{editError}</p>
                </div>
              )}

              {/* Order No, Order Date, Status */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300 mb-1">
                    Order No *
                  </label>
                  <input
                    type="text"
                    required
                    value={editOrderNo}
                    onChange={(e) => setEditOrderNo(e.target.value.replace(/\D/g, ''))}
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-[#140A0D] font-bold tracking-wider focus:ring-2 focus:ring-[#7A1626] outline-none"
                  />
                </div>
                <div>
                  <label className="block font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300 mb-1">
                    Order Date *
                  </label>
                  <input
                    type="date"
                    required
                    value={editOrderDate}
                    onChange={(e) => setEditOrderDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-[#140A0D] focus:ring-2 focus:ring-[#7A1626] outline-none"
                  />
                </div>
                <div>
                  <label className="block font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300 mb-1">
                    Order Status *
                  </label>
                  <select
                    value={editStatus}
                    onChange={(e) => setEditStatus(e.target.value as OrderStatus)}
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-[#140A0D] font-semibold focus:ring-2 focus:ring-[#7A1626] outline-none"
                  >
                    {ALL_STATUSES.map((st) => (
                      <option key={st} value={st}>
                        {st}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Customer Name & Phone (Indian + International) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300 mb-1">
                    Customer Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={editCustomerName}
                    onChange={(e) => setEditCustomerName(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-[#140A0D] focus:ring-2 focus:ring-[#7A1626] outline-none"
                  />
                </div>
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300">
                      Phone Number *
                    </label>
                    <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-[#7A1626] dark:text-[#E5B84B]">
                      <Globe className="w-3 h-3" />
                      Indian &amp; Intl
                    </span>
                  </div>
                  <div className="flex gap-1.5">
                    <select
                      aria-label="Country Code"
                      value={editCountryCode}
                      onChange={(e) => setEditCountryCode(e.target.value)}
                      className="w-36 px-2 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-[#140A0D] text-[11px] font-semibold focus:ring-2 focus:ring-[#7A1626] outline-none shrink-0"
                    >
                      {COUNTRY_CODES.map((c) => (
                        <option key={c.code} value={c.code}>
                          {c.label}
                        </option>
                      ))}
                    </select>
                    <input
                      type="tel"
                      required
                      inputMode="tel"
                      value={editPhone}
                      onChange={(e) => setEditPhone(e.target.value)}
                      placeholder={selectedEditCountryOption.placeholder}
                      className="flex-1 min-w-0 px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-[#140A0D] font-mono focus:ring-2 focus:ring-[#7A1626] outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Delivery Address (Optional) */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300">
                    Delivery Address <span className="font-normal normal-case text-gray-400">(Optional)</span>
                  </label>
                </div>
                <textarea
                  rows={2}
                  value={editAddress}
                  onChange={(e) => setEditAddress(e.target.value)}
                  placeholder="Door No, Street Name, Area / Landmark (optional)"
                  className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-[#140A0D] focus:ring-2 focus:ring-[#7A1626] outline-none"
                />
              </div>

              {/* City & PIN Code */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300">
                      City / Town *
                    </label>
                    <button
                      type="button"
                      onClick={() => setEditIsCustomCity(!editIsCustomCity)}
                      className="text-[10px] font-semibold text-[#7A1626] dark:text-[#E5B84B] hover:underline cursor-pointer"
                    >
                      {editIsCustomCity ? '← Dropdown' : '+ Custom'}
                    </button>
                  </div>
                  {editIsCustomCity ? (
                    <input
                      type="text"
                      required
                      value={editCustomCity}
                      onChange={(e) => setEditCustomCity(e.target.value)}
                      placeholder="Enter city name"
                      className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-[#140A0D] focus:ring-2 focus:ring-[#7A1626] outline-none"
                    />
                  ) : (
                    <select
                      value={editCity}
                      onChange={(e) => setEditCity(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-[#140A0D] focus:ring-2 focus:ring-[#7A1626] outline-none"
                    >
                      {cities.map((c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                    </select>
                  )}
                </div>

                <div>
                  <label className="block font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300 mb-1">
                    PIN Code (6 digits) *
                  </label>
                  <input
                    type="text"
                    required
                    maxLength={6}
                    value={editPincode}
                    onChange={(e) => setEditPincode(e.target.value.replace(/\D/g, ''))}
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-[#140A0D] focus:ring-2 focus:ring-[#7A1626] outline-none"
                  />
                </div>
              </div>

              {/* Product, Boxes, Payment Status, Amount */}
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 pt-2 border-t border-gray-100 dark:border-gray-800">
                <div className="sm:col-span-2">
                  <div className="flex items-center justify-between mb-1">
                    <label className="font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300">
                      Sweet Box Product *
                    </label>
                    <button
                      type="button"
                      onClick={() => setEditIsCustomProduct(!editIsCustomProduct)}
                      className="text-[10px] font-semibold text-[#7A1626] dark:text-[#E5B84B] hover:underline cursor-pointer"
                    >
                      {editIsCustomProduct ? '← Dropdown' : '+ Custom'}
                    </button>
                  </div>
                  {editIsCustomProduct ? (
                    <input
                      type="text"
                      required
                      value={editCustomProduct}
                      onChange={(e) => setEditCustomProduct(e.target.value)}
                      placeholder="Sweet box name"
                      className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-[#140A0D] focus:ring-2 focus:ring-[#7A1626] outline-none"
                    />
                  ) : (
                    <select
                      value={editProduct}
                      onChange={(e) => setEditProduct(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-[#140A0D] focus:ring-2 focus:ring-[#7A1626] outline-none"
                    >
                      {products.map((p) => (
                        <option key={p} value={p}>
                          {p}
                        </option>
                      ))}
                    </select>
                  )}
                </div>

                <div>
                  <label className="block font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300 mb-1">
                    Boxes *
                  </label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={editBoxes}
                    onChange={(e) => setEditBoxes(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-[#140A0D] font-bold focus:ring-2 focus:ring-[#7A1626] outline-none"
                  />
                </div>

                <div>
                  <label className="block font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300 mb-1">
                    Amount (₹) *
                  </label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={editAmount}
                    onChange={(e) => setEditAmount(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-[#140A0D] font-bold focus:ring-2 focus:ring-[#7A1626] outline-none"
                  />
                </div>
              </div>

              {/* Payment Status & Courier / AWB fields */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t border-gray-100 dark:border-gray-800">
                <div>
                  <label className="block font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300 mb-1">
                    Payment Status *
                  </label>
                  <select
                    value={editPaymentStatus}
                    onChange={(e) => setEditPaymentStatus(e.target.value as PaymentStatus)}
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-[#140A0D] focus:ring-2 focus:ring-[#7A1626] outline-none"
                  >
                    <option value="Paid">Paid</option>
                    <option value="COD">COD (Cash on Delivery)</option>
                    <option value="Pending">Pending</option>
                  </select>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300">
                      Courier Partner
                    </label>
                    <button
                      type="button"
                      onClick={() => setEditIsCustomCourier(!editIsCustomCourier)}
                      className="text-[10px] font-semibold text-[#7A1626] dark:text-[#E5B84B] hover:underline cursor-pointer"
                    >
                      {editIsCustomCourier ? '← Dropdown' : '+ Custom'}
                    </button>
                  </div>
                  {editIsCustomCourier ? (
                    <input
                      type="text"
                      value={editCustomCourier}
                      onChange={(e) => setEditCustomCourier(e.target.value)}
                      placeholder="Courier name"
                      className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-[#140A0D] focus:ring-2 focus:ring-[#7A1626] outline-none"
                    />
                  ) : (
                    <select
                      value={editCourier}
                      onChange={(e) => setEditCourier(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-[#140A0D] focus:ring-2 focus:ring-[#7A1626] outline-none"
                    >
                      <option value="">— Unassigned —</option>
                      {couriers.map((c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                    </select>
                  )}
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300">
                      AWB / Tracking No
                    </label>
                    {editAwb.trim() && (
                      <a
                        href={getTrackingUrl(editIsCustomCourier ? editCustomCourier : editCourier || 'Professional', editAwb)}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={() =>
                          handleCopyAwb(
                            'edit-modal',
                            editIsCustomCourier ? editCustomCourier : editCourier || 'Professional',
                            editAwb
                          )
                        }
                        className="inline-flex items-center gap-1 text-[10px] font-bold text-blue-600 dark:text-blue-400 hover:underline"
                        title="Copies Track ID & opens carrier portal"
                      >
                        <span>Track AWB</span>
                        <ExternalLink className="w-2.5 h-2.5" />
                      </a>
                    )}
                  </div>
                  <input
                    type="text"
                    value={editAwb}
                    onChange={(e) => {
                      const val = e.target.value.toUpperCase();
                      setEditAwb(val);
                      if (val.trim()) {
                        if (!editIsCustomCourier && !editCourier) {
                          setEditCourier(couriers[0] || 'Professional');
                        }
                        if (editStatus === 'Pending') {
                          setEditStatus('Dispatched');
                        }
                        if (!editDispatchDate) {
                          setEditDispatchDate(new Date().toISOString().slice(0, 10));
                        }
                      }
                    }}
                    placeholder="e.g. CJB1234567 or PRO672314"
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-[#140A0D] font-mono uppercase focus:ring-2 focus:ring-[#7A1626] outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-[10px] font-semibold text-gray-500 mb-1">
                    Dispatch Date
                  </label>
                  <input
                    type="date"
                    value={editDispatchDate}
                    onChange={(e) => setEditDispatchDate(e.target.value)}
                    className="w-full px-3 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-[#140A0D]"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-semibold text-gray-500 mb-1">
                    Weight (kg)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    value={editWeight}
                    onChange={(e) => setEditWeight(e.target.value)}
                    placeholder="1.0"
                    className="w-full px-3 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-[#140A0D]"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-semibold text-gray-500 mb-1">
                    Courier Charge (₹)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={editCharge}
                    onChange={(e) => setEditCharge(e.target.value)}
                    placeholder="90"
                    className="w-full px-3 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-[#140A0D]"
                  />
                </div>
              </div>

              {/* Modal Buttons */}
              <div className="pt-4 border-t border-gray-100 dark:border-gray-800 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setOrderToEdit(null)}
                  className="px-4 py-2 rounded-xl text-gray-600 dark:text-gray-300 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 text-xs font-medium cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSavingEdit}
                  className="px-5 py-2 rounded-xl bg-[#7A1626] hover:bg-[#5B0E1B] text-white text-xs font-semibold shadow-md transition-all cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
                >
                  {isSavingEdit ? (
                    <>
                      <RotateCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Saving...</span>
                    </>
                  ) : (
                    <>
                      <Check className="w-3.5 h-3.5" />
                      <span>Save Order Changes</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

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
                    Assign Courier &amp; Tracking AWB
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
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300">
                    AWB / Tracking Number *
                  </label>
                  {modalAwb.trim() && (
                    <a
                      href={getTrackingUrl(modalIsCustomCourier ? modalCustomCourier : modalCourier, modalAwb)}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={() =>
                        handleCopyAwb(
                          'courier-modal',
                          modalIsCustomCourier ? modalCustomCourier : modalCourier,
                          modalAwb
                        )
                      }
                      className="inline-flex items-center gap-1 text-[10px] font-bold text-blue-600 dark:text-blue-400 hover:underline"
                      title="Copies Track ID & opens carrier portal"
                    >
                      <span>
                        {isProfessionalCourier(modalIsCustomCourier ? modalCustomCourier : modalCourier, modalAwb)
                          ? 'Track on TPC India'
                          : 'Track AWB'}
                      </span>
                      <ExternalLink className="w-2.5 h-2.5" />
                    </a>
                  )}
                </div>
                <input
                  type="text"
                  required
                  value={modalAwb}
                  onChange={(e) => setModalAwb(e.target.value.toUpperCase())}
                  placeholder="e.g. CJB1234567, PRO672314 or ST8892110"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-[#140A0D] text-xs font-mono font-bold uppercase tracking-wider focus:ring-2 focus:ring-[#7A1626] outline-none"
                />
                <p className="text-[10px] text-gray-400 mt-1">
                  Once assigned, clicking Track copies the AWB and opens the official carrier tracking page (tpcindia.com/Default.aspx for Professional Courier)
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
                      <span>Save &amp; Update Courier</span>
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
