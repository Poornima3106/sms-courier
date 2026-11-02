'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useI18n } from '@/lib/i18n';
import { PlusCircle, Edit, CheckCircle2, AlertCircle, ArrowLeft, Truck, Globe } from 'lucide-react';
import Link from 'next/link';
import type { Order, OrderStatus } from '@/lib/types';
import {
  COUNTRY_CODES,
  combinePhoneInput,
  parseStoredPhone,
  phoneNumberSchema,
} from '@/lib/validations/order';

const DEFAULT_CITIES = ['Pollachi', 'Coimbatore', 'Chennai', 'Madurai', 'Trichy', 'Salem', 'Tirunelveli'];
const DEFAULT_PRODUCTS = [
  'Diwali Feast Box',
  'Mixed Sweets Box',
  'Mysore Pak Box',
  'Laddu Box',
  'Ghee Halwa Special',
];
const DEFAULT_COURIERS = ['Professional', 'ST Courier', 'India Post (Speed Post)', 'DTDC', 'Blue Dart'];

function AddOrEditOrderForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const requestedEditId = searchParams.get('edit');
  const { t } = useI18n();

  const [editId, setEditId] = useState<string | null>(requestedEditId);
  const [editLoading, setEditLoading] = useState(Boolean(requestedEditId));
  const [orderNo, setOrderNo] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [countryCode, setCountryCode] = useState('+91');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [selectedCity, setSelectedCity] = useState('Pollachi');
  const [customCity, setCustomCity] = useState('');
  const [isTypingNewCity, setIsTypingNewCity] = useState(false);
  const [pincode, setPincode] = useState('642001');
  const [product, setProduct] = useState('Diwali Feast Box');
  const [customProduct, setCustomProduct] = useState('');
  const [isTypingNewProduct, setIsTypingNewProduct] = useState(false);
  const [boxes, setBoxes] = useState('1');
  const [orderDate, setOrderDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [paymentStatus, setPaymentStatus] = useState<'Paid' | 'COD' | 'Pending'>('Paid');
  const [amount, setAmount] = useState('1250');
  const [status, setStatus] = useState<OrderStatus>('Pending');

  // Courier & Dispatch fields (optional entry at order creation)
  const [assignCourierNow, setAssignCourierNow] = useState(false);
  const [courier, setCourier] = useState('Professional');
  const [customCourier, setCustomCourier] = useState('');
  const [isTypingNewCourier, setIsTypingNewCourier] = useState(false);
  const [awbNo, setAwbNo] = useState('');
  const [dispatchDate, setDispatchDate] = useState('');
  const [weightKg, setWeightKg] = useState('1.0');
  const [courierCharge, setCourierCharge] = useState('');

  const [cityList, setCityList] = useState<string[]>(DEFAULT_CITIES);
  const [productList, setProductList] = useState<string[]>(DEFAULT_PRODUCTS);
  const [courierList, setCourierList] = useState<string[]>(DEFAULT_COURIERS);

  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [serverError, setServerError] = useState<string | null>(null);
  const [orderLoadError, setOrderLoadError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    async function init() {
      setEditId(requestedEditId);
      setEditLoading(Boolean(requestedEditId));
      setOrderLoadError(null);
      setServerError(null);
      setErrors({});

      try {
        const [numRes, mastersRes, orderRes] = await Promise.all([
          requestedEditId ? Promise.resolve(null) : fetch('/api/orders/next-number'),
          fetch('/api/masters'),
          requestedEditId ? fetch(`/api/orders/${encodeURIComponent(requestedEditId)}`) : Promise.resolve(null),
        ]);

        if (!active) return;

        let cityNames = DEFAULT_CITIES;
        let productNames = DEFAULT_PRODUCTS;
        let courierNames = DEFAULT_COURIERS;
        if (mastersRes.ok) {
          const mData = await mastersRes.json();
          if (mData.items) {
            cityNames = mData.items.filter((m: any) => m.category === 'city' && m.is_active).map((m: any) => m.name);
            productNames = mData.items.filter((m: any) => m.category === 'product' && m.is_active).map((m: any) => m.name);
            courierNames = mData.items.filter((m: any) => m.category === 'courier' && m.is_active).map((m: any) => m.name);
          }
        }

        if (cityNames.length > 0) setCityList(cityNames);
        if (productNames.length > 0) {
          setProductList(productNames);
          if (!requestedEditId) setProduct(productNames[0]);
        }
        if (courierNames.length > 0) {
          setCourierList(courierNames);
          if (!requestedEditId) setCourier(courierNames[0]);
        }

        if (requestedEditId && orderRes) {
          const orderData = await orderRes.json();
          if (!orderRes.ok || !orderData.order) {
            throw new Error(orderData.error || 'Failed to load order');
          }
          const order: Order = orderData.order;
          const parsedPhone = parseStoredPhone(order.phone);
          setOrderNo(order.order_no);
          setCustomerName(order.customer_name);
          setCountryCode(parsedPhone.countryCode);
          setPhone(parsedPhone.localNumber);
          setAddress(order.address || '');
          setPincode(order.pincode);
          setOrderDate(order.order_date);
          setPaymentStatus(order.payment_status);
          setAmount(String(order.amount));
          setBoxes(String(order.boxes || 1));
          setStatus(order.status);
          setSelectedCity(cityNames.includes(order.city) ? order.city : cityNames[0] || 'Pollachi');
          setIsTypingNewCity(!cityNames.includes(order.city));
          setCustomCity(!cityNames.includes(order.city) ? order.city : '');
          setProduct(productNames.includes(order.product) ? order.product : productNames[0] || 'Diwali Feast Box');
          setIsTypingNewProduct(!productNames.includes(order.product));
          setCustomProduct(!productNames.includes(order.product) ? order.product : '');
          setAssignCourierNow(Boolean(order.courier || order.awb_no));
          setCourier(order.courier && courierNames.includes(order.courier) ? order.courier : courierNames[0] || 'Professional');
          setIsTypingNewCourier(Boolean(order.courier && !courierNames.includes(order.courier)));
          setCustomCourier(order.courier && !courierNames.includes(order.courier) ? order.courier : '');
          setAwbNo(order.awb_no || '');
          setDispatchDate(order.dispatch_date || '');
          setWeightKg(order.weight_kg == null ? '' : String(order.weight_kg));
          setCourierCharge(order.courier_charge == null ? '' : String(order.courier_charge));
        } else {
          // Reset for Add mode
          setCustomerName('');
          setCountryCode('+91');
          setPhone('');
          setAddress('');
          setSelectedCity(cityNames[0] || 'Pollachi');
          setIsTypingNewCity(false);
          setCustomCity('');
          setPincode('642001');
          setBoxes('1');
          setOrderDate(new Date().toISOString().slice(0, 10));
          setPaymentStatus('Paid');
          setAmount('1250');
          setStatus('Pending');
          setAssignCourierNow(false);
          setAwbNo('');
          setDispatchDate('');
          setWeightKg('1.0');
          setCourierCharge('');
          if (numRes?.ok) {
            const numData = await numRes.json();
            if (numData.nextOrderNo) setOrderNo(numData.nextOrderNo);
          }
        }
      } catch (err) {
        if (!active) return;
        const message = err instanceof Error ? err.message : 'Failed to load order details';
        if (requestedEditId) {
          setOrderLoadError(message);
        } else {
          setServerError(message);
        }
      } finally {
        if (active) setEditLoading(false);
      }
    }
    init();
    return () => {
      active = false;
    };
  }, [requestedEditId]);

  const selectedCountryOption =
    COUNTRY_CODES.find((c) => c.code === countryCode) || COUNTRY_CODES[0];

  const validate = (): boolean => {
    const errs: Record<string, string> = {};

    if (!orderNo || !orderNo.trim().match(/^\d+$/)) {
      errs.order_no = 'Order number must contain only numbers (e.g. 1005)';
    }
    if (!customerName || customerName.trim().length < 2) {
      errs.customer_name = 'Customer name is required';
    }

    const combinedPhone = combinePhoneInput(countryCode, phone);
    const phoneResult = phoneNumberSchema.safeParse(combinedPhone);
    if (!phoneResult.success) {
      errs.phone =
        phoneResult.error.issues[0]?.message ||
        'Enter a valid 10-digit Indian mobile number or international number';
    }

    const city = isTypingNewCity ? customCity.trim() : selectedCity;
    if (!city || city.length < 2) {
      errs.city = 'Please select or enter a valid city';
    }

    if (!pincode || !pincode.match(/^\d{6}$/)) {
      errs.pincode = 'PIN code must be exactly 6 digits';
    }

    const finalProd = isTypingNewProduct ? customProduct.trim() : product;
    if (!finalProd || finalProd.length < 2) {
      errs.product = 'Please select or enter a valid sweet box product';
    }

    if (!boxes || isNaN(Number(boxes)) || Number(boxes) < 1) {
      errs.boxes = 'Total items must be at least 1';
    }

    if (!amount || isNaN(Number(amount)) || Number(amount) < 0) {
      errs.amount = 'Valid amount is required';
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setServerError(null);
    setSuccessMsg(null);

    if (!validate()) return;

    setLoading(true);
    const finalCity = isTypingNewCity ? customCity.trim() : selectedCity;
    const finalProduct = isTypingNewProduct ? customProduct.trim() : product;
    const finalCourier = assignCourierNow
      ? isTypingNewCourier
        ? customCourier.trim()
        : courier
      : null;
    const finalAwb = assignCourierNow && awbNo.trim() ? awbNo.trim().toUpperCase() : null;
    const combinedPhone = combinePhoneInput(countryCode, phone);

    try {
      const res = await fetch(editId ? `/api/orders/${encodeURIComponent(editId)}` : '/api/orders', {
        method: editId ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          order_no: orderNo.toUpperCase().trim(),
          customer_name: customerName.trim(),
          phone: combinedPhone,
          address: address.trim(),
          city: finalCity,
          pincode: pincode.trim(),
          product: finalProduct,
          order_date: orderDate,
          payment_status: paymentStatus,
          amount: Number(amount),
          status: editId ? status : finalAwb ? 'Dispatched' : 'Pending',
          courier: finalCourier,
          awb_no: finalAwb,
          dispatch_date: assignCourierNow && (editId || finalAwb)
            ? dispatchDate || (editId ? null : orderDate)
            : null,
          boxes: Math.max(1, Number(boxes) || 1),
          weight_kg: assignCourierNow && weightKg ? Number(weightKg) : null,
          courier_charge: assignCourierNow && courierCharge ? Number(courierCharge) : null,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setServerError(data.error || (editId ? 'Failed to update order' : 'Failed to create order'));
        setLoading(false);
        return;
      }

      setSuccessMsg(editId ? `Order ${orderNo} updated successfully!` : `Order ${orderNo} created successfully!`);
      setTimeout(() => {
        router.push('/orders');
      }, 1000);
    } catch {
      setServerError('An unexpected network error occurred.');
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Top Header */}
      <div className="flex items-center justify-between">
        <Link
          href="/orders"
          className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-300 hover:text-[#7A1626] transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Orders</span>
        </Link>
        <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-amber-100 dark:bg-amber-950/50 text-amber-800 dark:text-amber-300">
          {editId ? `Editing Order #${orderNo}` : 'Diwali Rush Fast Entry'}
        </span>
      </div>

      <div className="bg-white dark:bg-[#1E0D12] rounded-3xl shadow-sm border border-[#EFE4D3] dark:border-[#3A1B23] p-6 sm:p-10">
        <div className="flex items-center gap-3 mb-6 pb-4 border-b border-gray-100 dark:border-gray-800">
          <div className="w-12 h-12 rounded-2xl bg-[#7A1626] text-white flex items-center justify-center shadow-md">
            {editId ? <Edit className="w-6 h-6" /> : <PlusCircle className="w-6 h-6" />}
          </div>
          <div>
            <h2 className="text-xl sm:text-2xl font-serif font-bold text-[#7A1626] dark:text-[#E5B84B]">
              {editId ? 'Edit Order' : t.buttons.addOrder}
            </h2>
            <p className="text-xs text-gray-500">
              {editId
                ? 'Update customer, Indian or international phone, optional address, payment, and courier details'
                : 'Record a customer sweet-box order for courier dispatch'}
            </p>
          </div>
        </div>

        {serverError && (
          <div className="mb-6 p-4 rounded-2xl bg-red-50 dark:bg-red-950/40 border border-red-200 text-red-700 dark:text-red-300 text-sm flex items-center gap-2">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <p>{serverError}</p>
          </div>
        )}

        {successMsg && (
          <div className="mb-6 p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 text-emerald-700 dark:text-emerald-300 text-sm flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 shrink-0" />
            <p>{successMsg}</p>
          </div>
        )}

        {editLoading ? (
          <div className="py-12 text-center text-sm text-gray-500">Loading order details...</div>
        ) : orderLoadError ? (
          <div className="py-8 text-center text-sm text-red-600">{orderLoadError}</div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              {/* Order No */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300 mb-1.5">
                  {t.orderFields.orderNo} *
                </label>
                <input
                  type="text"
                  value={orderNo}
                  onChange={(e) => setOrderNo(e.target.value.replace(/\D/g, ''))}
                  placeholder="1005"
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-[#140A0D] text-sm font-semibold tracking-wider focus:ring-2 focus:ring-[#7A1626] outline-none"
                />
                {errors.order_no && <p className="text-xs text-red-500 mt-1">{errors.order_no}</p>}
                <p className="text-[10px] text-gray-400 mt-1">Auto-suggested numerical order number</p>
              </div>

              {editId && (
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300 mb-1.5">
                    Order Status *
                  </label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as OrderStatus)}
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-[#140A0D] text-sm focus:ring-2 focus:ring-[#7A1626] outline-none"
                  >
                    {['Pending', 'Dispatched', 'In Transit', 'Delivered', 'Delayed', 'Returned', 'Damaged'].map((value) => (
                      <option key={value} value={value}>{value}</option>
                    ))}
                  </select>
                </div>
              )}

              {/* Order Date */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300 mb-1.5">
                  {t.orderFields.orderDate} *
                </label>
                <input
                  type="date"
                  value={orderDate}
                  onChange={(e) => setOrderDate(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-[#140A0D] text-sm focus:ring-2 focus:ring-[#7A1626] outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              {/* Customer Name */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300 mb-1.5">
                  {t.orderFields.customerName} *
                </label>
                <input
                  type="text"
                  required
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="e.g. Priya Sundaram"
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-[#140A0D] text-sm focus:ring-2 focus:ring-[#7A1626] outline-none"
                />
                {errors.customer_name && <p className="text-xs text-red-500 mt-1">{errors.customer_name}</p>}
              </div>

              {/* Phone (Indian & International) */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300">
                    {t.orderFields.phone} *
                  </label>
                  <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-[#7A1626] dark:text-[#E5B84B]">
                    <Globe className="w-3 h-3" />
                    Indian &amp; International
                  </span>
                </div>
                <div className="flex gap-2">
                  <select
                    aria-label="Country Code"
                    value={countryCode}
                    onChange={(e) => setCountryCode(e.target.value)}
                    className="w-40 sm:w-44 px-2.5 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-[#140A0D] text-xs font-semibold focus:ring-2 focus:ring-[#7A1626] outline-none shrink-0"
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
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder={selectedCountryOption.placeholder}
                    className="flex-1 min-w-0 px-3.5 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-[#140A0D] text-sm focus:ring-2 focus:ring-[#7A1626] outline-none"
                  />
                </div>
                <p className="text-[10px] text-gray-400 mt-1">
                  Supports both Indian (+91 10-digit) and International numbers (select country code or type with +).
                </p>
                {errors.phone && <p className="text-xs text-red-500 mt-1">{errors.phone}</p>}
              </div>
            </div>

            {/* Delivery Address (Optional) */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300">
                  {t.orderFields.address}{' '}
                  <span className="text-[10px] font-normal normal-case text-gray-400">(Optional)</span>
                </label>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-500 font-medium">
                  Optional
                </span>
              </div>
              <textarea
                rows={2}
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="Door No, Street Name, Area / Landmark (optional — can be left blank or added later)"
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-[#140A0D] text-sm focus:ring-2 focus:ring-[#7A1626] outline-none"
              />
              <p className="text-[10px] text-gray-400 mt-1">
                Address is optional. You can save the order now and add or update the delivery address anytime.
              </p>
            </div>

            {/* City & PIN Code */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300">
                    {t.orderFields.city} *
                  </label>
                  <button
                    type="button"
                    onClick={() => setIsTypingNewCity(!isTypingNewCity)}
                    className="text-[11px] font-semibold text-[#7A1626] dark:text-[#E5B84B] hover:underline"
                  >
                    {isTypingNewCity ? '← Choose from dropdown' : '+ Type new city'}
                  </button>
                </div>

                {isTypingNewCity ? (
                  <input
                    type="text"
                    value={customCity}
                    onChange={(e) => setCustomCity(e.target.value)}
                    placeholder="Enter new city / town name"
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-[#140A0D] text-sm focus:ring-2 focus:ring-[#7A1626] outline-none"
                  />
                ) : (
                  <select
                    value={selectedCity}
                    onChange={(e) => setSelectedCity(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-[#140A0D] text-sm focus:ring-2 focus:ring-[#7A1626] outline-none"
                  >
                    {cityList.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                )}
                {errors.city && <p className="text-xs text-red-500 mt-1">{errors.city}</p>}
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300 mb-1.5">
                  {t.orderFields.pincode} (6 digits) *
                </label>
                <input
                  type="text"
                  required
                  maxLength={6}
                  value={pincode}
                  onChange={(e) => setPincode(e.target.value.replace(/\D/g, ''))}
                  placeholder="625001"
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-[#140A0D] text-sm focus:ring-2 focus:ring-[#7A1626] outline-none"
                />
                {errors.pincode && <p className="text-xs text-red-500 mt-1">{errors.pincode}</p>}
              </div>
            </div>

            {/* Sweet Box Product & Total Items Customer Buys */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300">
                    {t.orderFields.product} *
                  </label>
                  <button
                    type="button"
                    onClick={() => setIsTypingNewProduct(!isTypingNewProduct)}
                    className="text-[11px] font-semibold text-[#7A1626] dark:text-[#E5B84B] hover:underline cursor-pointer"
                  >
                    {isTypingNewProduct ? '← Choose from dropdown' : '+ Type other sweet box'}
                  </button>
                </div>

                {isTypingNewProduct ? (
                  <input
                    type="text"
                    value={customProduct}
                    onChange={(e) => setCustomProduct(e.target.value)}
                    placeholder="e.g. Special Assorted Sweets Box"
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-[#140A0D] text-sm focus:ring-2 focus:ring-[#7A1626] outline-none"
                  />
                ) : (
                  <select
                    value={product}
                    onChange={(e) => setProduct(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-[#140A0D] text-sm focus:ring-2 focus:ring-[#7A1626] outline-none"
                  >
                    {productList.map((p) => (
                      <option key={p} value={p}>
                        {p}
                      </option>
                    ))}
                  </select>
                )}
                {errors.product && <p className="text-xs text-red-500 mt-1">{errors.product}</p>}
                <p className="text-[10px] text-gray-400 mt-1">Select the sweet box type customer ordered</p>
              </div>

              {/* Total No. of Items / Boxes Customer Buys */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300 mb-1.5">
                  {t.orderFields.boxes || 'Total No. of Items (Boxes)'} *
                </label>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setBoxes((prev) => String(Math.max(1, (Number(prev) || 1) - 1)))}
                    className="w-10 h-10 rounded-xl bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 font-bold text-lg flex items-center justify-center transition-colors cursor-pointer select-none"
                    title="Decrease item quantity"
                  >
                    -
                  </button>
                  <div className="relative flex-1">
                    <input
                      type="number"
                      min="1"
                      required
                      value={boxes}
                      onChange={(e) => setBoxes(e.target.value)}
                      placeholder="1"
                      className="w-full text-center px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-[#140A0D] text-sm font-bold text-[#7A1626] dark:text-[#E5B84B] focus:ring-2 focus:ring-[#7A1626] outline-none"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => setBoxes((prev) => String((Number(prev) || 0) + 1))}
                    className="w-10 h-10 rounded-xl bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 font-bold text-lg flex items-center justify-center transition-colors cursor-pointer select-none"
                    title="Increase item quantity"
                  >
                    +
                  </button>
                </div>
                {errors.boxes && <p className="text-xs text-red-500 mt-1">{errors.boxes}</p>}
                <p className="text-[10px] text-gray-400 mt-1">Total quantity of sweet boxes/items customer is purchasing</p>
              </div>
            </div>

            {/* Payment Status & Amount */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300 mb-1.5">
                  {t.orderFields.paymentStatus} *
                </label>
                <select
                  value={paymentStatus}
                  onChange={(e) => setPaymentStatus(e.target.value as any)}
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-[#140A0D] text-sm focus:ring-2 focus:ring-[#7A1626] outline-none"
                >
                  <option value="Paid">Paid</option>
                  <option value="COD">COD (Cash on Delivery)</option>
                  <option value="Pending">Pending</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300 mb-1.5">
                  {t.orderFields.amount} *
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-2.5 text-sm font-bold text-gray-400">₹</span>
                  <input
                    type="number"
                    min="0"
                    required
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="1250"
                    className="w-full pl-8 pr-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-[#140A0D] text-sm focus:ring-2 focus:ring-[#7A1626] outline-none"
                  />
                </div>
                {errors.amount && <p className="text-xs text-red-500 mt-1">{errors.amount}</p>}
              </div>
            </div>

            {/* Optional Courier & Dispatch Section */}
            <div className="p-5 rounded-2xl border-2 border-dashed border-[#EFE4D3] dark:border-[#3A1B23] bg-[#FBF6EF]/50 dark:bg-[#180A0E]/50 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-[#7A1626]/10 text-[#7A1626] dark:text-[#E5B84B] flex items-center justify-center">
                    <Truck className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-gray-900 dark:text-gray-100">
                      Courier Partner &amp; AWB Tracking {editId ? '' : '(Optional)'}
                    </h3>
                    <p className="text-[11px] text-gray-500">
                      Assign courier and tracking number now, or leave pending to dispatch later
                    </p>
                  </div>
                </div>
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={assignCourierNow}
                    onChange={(e) => setAssignCourierNow(e.target.checked)}
                    className="w-4 h-4 text-[#7A1626] rounded focus:ring-[#7A1626] cursor-pointer"
                  />
                  <span className="text-xs font-semibold text-[#7A1626] dark:text-[#E5B84B]">
                    Assign Now
                  </span>
                </label>
              </div>

              {assignCourierNow && (
                <div className="pt-3 border-t border-[#EFE4D3] dark:border-[#3A1B23] space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Courier Partner */}
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300 mb-1.5">
                        Courier Partner
                      </label>
                      {!isTypingNewCourier ? (
                        <select
                          value={courier}
                          onChange={(e) => {
                            if (e.target.value === '__custom__') {
                              setIsTypingNewCourier(true);
                            } else {
                              setCourier(e.target.value);
                            }
                          }}
                          className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-[#140A0D] text-sm focus:ring-2 focus:ring-[#7A1626] outline-none"
                        >
                          {courierList.map((c) => (
                            <option key={c} value={c}>{c}</option>
                          ))}
                          <option value="__custom__">+ Enter Other Courier Partner</option>
                        </select>
                      ) : (
                        <div className="flex gap-2">
                          <input
                            type="text"
                            value={customCourier}
                            onChange={(e) => setCustomCourier(e.target.value)}
                            placeholder="e.g. Speed Post / DTDC"
                            className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-[#140A0D] text-sm focus:ring-2 focus:ring-[#7A1626] outline-none"
                          />
                          <button
                            type="button"
                            onClick={() => setIsTypingNewCourier(false)}
                            className="px-3 py-2 text-xs text-gray-500 hover:text-gray-700 font-semibold"
                          >
                            Cancel
                          </button>
                        </div>
                      )}
                    </div>

                    {/* AWB Tracking Number */}
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300 mb-1.5">
                        AWB / Tracking Number
                      </label>
                      <input
                        type="text"
                        value={awbNo}
                        onChange={(e) => setAwbNo(e.target.value.toUpperCase())}
                        placeholder="e.g. PRO672314 or ST8892110"
                        className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-[#140A0D] text-sm uppercase tracking-wider font-semibold focus:ring-2 focus:ring-[#7A1626] outline-none"
                      />
                      <p className="text-[10px] text-gray-400 mt-1">
                        Entering an AWB automatically marks this order as &ldquo;Dispatched&rdquo;
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div>
                      <label className="block text-[11px] font-semibold text-gray-600 dark:text-gray-400 mb-1">
                        Dispatch Date
                      </label>
                      <input
                        type="date"
                        value={dispatchDate}
                        onChange={(e) => setDispatchDate(e.target.value)}
                        className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-[#140A0D] text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-gray-600 dark:text-gray-400 mb-1">
                        Boxes
                      </label>
                      <input
                        type="number"
                        min="1"
                        value={boxes}
                        onChange={(e) => setBoxes(e.target.value)}
                        className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-[#140A0D] text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-gray-600 dark:text-gray-400 mb-1">
                        Weight (kg)
                      </label>
                      <input
                        type="number"
                        step="0.1"
                        min="0"
                        value={weightKg}
                        onChange={(e) => setWeightKg(e.target.value)}
                        placeholder="1.0"
                        className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-[#140A0D] text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-gray-600 dark:text-gray-400 mb-1">
                        Courier Charge (₹)
                      </label>
                      <input
                        type="number"
                        min="0"
                        value={courierCharge}
                        onChange={(e) => setCourierCharge(e.target.value)}
                        placeholder="90"
                        className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-[#140A0D] text-xs"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Submit Button */}
            <div className="pt-4 border-t border-gray-100 dark:border-gray-800 flex justify-end gap-3">
              <Link
                href="/orders"
                className="px-5 py-2.5 rounded-xl text-sm font-medium text-gray-600 dark:text-gray-300 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 transition-colors"
              >
                Cancel
              </Link>
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-2.5 rounded-xl bg-[#7A1626] hover:bg-[#5B0E1B] text-white font-semibold text-sm shadow-md transition-all cursor-pointer disabled:opacity-50"
              >
                {loading
                  ? editId
                    ? 'Saving Changes...'
                    : 'Recording Order...'
                  : editId
                  ? 'Save Order Changes'
                  : 'Confirm & Save Order'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

export default function AddOrderPage() {
  return (
    <Suspense fallback={<div className="p-12 text-center text-sm text-gray-500">Loading order form...</div>}>
      <AddOrEditOrderForm />
    </Suspense>
  );
}
