'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useI18n } from '@/lib/i18n';
import { PlusCircle, Sparkles, CheckCircle2, AlertCircle, ArrowLeft, Truck, Package } from 'lucide-react';
import Link from 'next/link';

export default function AddOrderPage() {
  const router = useRouter();
  const { t } = useI18n();

  const [orderNo, setOrderNo] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [selectedCity, setSelectedCity] = useState('Madurai');
  const [customCity, setCustomCity] = useState('');
  const [isTypingNewCity, setIsTypingNewCity] = useState(false);
  const [pincode, setPincode] = useState('625001');
  const [product, setProduct] = useState('Diwali Feast Box');
  const [orderDate, setOrderDate] = useState('2026-10-31');
  const [paymentStatus, setPaymentStatus] = useState<'Paid' | 'COD' | 'Pending'>('Paid');
  const [amount, setAmount] = useState('1250');

  // Courier & Dispatch fields (optional entry at order creation)
  const [assignCourierNow, setAssignCourierNow] = useState(false);
  const [courier, setCourier] = useState('Professional');
  const [customCourier, setCustomCourier] = useState('');
  const [isTypingNewCourier, setIsTypingNewCourier] = useState(false);
  const [awbNo, setAwbNo] = useState('');
  const [boxes, setBoxes] = useState('1');
  const [weightKg, setWeightKg] = useState('1.0');
  const [courierCharge, setCourierCharge] = useState('');

  const [cityList, setCityList] = useState<string[]>(['Madurai', 'Chennai', 'Coimbatore', 'Trichy', 'Salem', 'Tirunelveli']);
  const [productList, setProductList] = useState<string[]>([
    'Diwali Feast Box',
    'Mixed Sweets Box',
    'Mysore Pak Box',
    'Laddu Box',
    'Ghee Halwa Special',
  ]);
  const [courierList, setCourierList] = useState<string[]>([
    'Professional',
    'ST Courier',
    'India Post (Speed Post)',
    'DTDC',
    'Blue Dart',
  ]);

  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [serverError, setServerError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Auto-suggest next order number and fetch masters
  useEffect(() => {
    async function init() {
      try {
        const [numRes, mastersRes] = await Promise.all([
          fetch('/api/orders/next-number'),
          fetch('/api/masters'),
        ]);

        if (numRes.ok) {
          const numData = await numRes.json();
          if (numData.nextOrderNo) {
            setOrderNo(numData.nextOrderNo);
          }
        }

        if (mastersRes.ok) {
          const mData = await mastersRes.json();
          if (mData.items) {
            const cities = mData.items.filter((m: any) => m.category === 'city' && m.is_active).map((m: any) => m.name);
            const products = mData.items.filter((m: any) => m.category === 'product' && m.is_active).map((m: any) => m.name);
            const couriers = mData.items.filter((m: any) => m.category === 'courier' && m.is_active).map((m: any) => m.name);
            if (cities.length > 0) setCityList(cities);
            if (products.length > 0) {
              setProductList(products);
              setProduct(products[0]);
            }
            if (couriers.length > 0) {
              setCourierList(couriers);
              setCourier(couriers[0]);
            }
          }
        }
      } catch (err) {
        console.error('Failed to load initial form data:', err);
      }
    }
    init();
  }, []);

  const validate = (): boolean => {
    const errs: Record<string, string> = {};

    if (!orderNo || !orderNo.trim().match(/^DWL\d+$/i)) {
      errs.order_no = 'Order number must be in format DWL1001';
    }
    if (!customerName || customerName.trim().length < 2) {
      errs.customer_name = 'Customer name is required';
    }
    if (!phone || !phone.match(/^[6-9]\d{9}$/)) {
      errs.phone = 'Phone must be exactly 10 digits starting with 6, 7, 8, or 9';
    }
    if (!address || address.trim().length < 5) {
      errs.address = 'Delivery address is required (at least 5 characters)';
    }

    const city = isTypingNewCity ? customCity.trim() : selectedCity;
    if (!city || city.length < 2) {
      errs.city = 'Please select or enter a valid city';
    }

    if (!pincode || !pincode.match(/^\d{6}$/)) {
      errs.pincode = 'PIN code must be exactly 6 digits';
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
    const finalCourier = assignCourierNow
      ? isTypingNewCourier
        ? customCourier.trim()
        : courier
      : null;
    const finalAwb = assignCourierNow && awbNo.trim() ? awbNo.trim().toUpperCase() : null;

    try {
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          order_no: orderNo.toUpperCase().trim(),
          customer_name: customerName.trim(),
          phone: phone.trim(),
          address: address.trim(),
          city: finalCity,
          pincode: pincode.trim(),
          product,
          order_date: orderDate,
          payment_status: paymentStatus,
          amount: Number(amount),
          status: finalAwb ? 'Dispatched' : 'Pending',
          courier: finalCourier,
          awb_no: finalAwb,
          boxes: Number(boxes) || 1,
          weight_kg: weightKg ? Number(weightKg) : null,
          courier_charge: courierCharge ? Number(courierCharge) : null,
          dispatch_date: finalAwb ? orderDate : null,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setServerError(data.error || 'Failed to create order');
        setLoading(false);
        return;
      }

      setSuccessMsg(`Order ${orderNo} created successfully!`);
      setTimeout(() => {
        router.push('/orders');
      }, 1200);
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
          Diwali Rush Fast Entry
        </span>
      </div>

      <div className="bg-white dark:bg-[#1E0D12] rounded-3xl shadow-sm border border-[#EFE4D3] dark:border-[#3A1B23] p-6 sm:p-10">
        <div className="flex items-center gap-3 mb-6 pb-4 border-b border-gray-100 dark:border-gray-800">
          <div className="w-12 h-12 rounded-2xl bg-[#7A1626] text-white flex items-center justify-center shadow-md">
            <PlusCircle className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl sm:text-2xl font-serif font-bold text-[#7A1626] dark:text-[#E5B84B]">
              {t.buttons.addOrder}
            </h2>
            <p className="text-xs text-gray-500">Record a customer sweet-box order for courier dispatch</p>
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
                onChange={(e) => setOrderNo(e.target.value.toUpperCase())}
                placeholder="DWL1005"
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-[#140A0D] text-sm font-semibold tracking-wider uppercase focus:ring-2 focus:ring-[#7A1626] outline-none"
              />
              {errors.order_no && <p className="text-xs text-red-500 mt-1">{errors.order_no}</p>}
              <p className="text-[10px] text-gray-400 mt-1">Auto-suggested based on latest order number</p>
            </div>

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

            {/* Phone */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300 mb-1.5">
                {t.orderFields.phone} (10 digits) *
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-2.5 text-xs font-bold text-gray-400">+91</span>
                <input
                  type="tel"
                  required
                  maxLength={10}
                  value={phone}
                  onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
                  placeholder="9876543210"
                  className="w-full pl-12 pr-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-[#140A0D] text-sm focus:ring-2 focus:ring-[#7A1626] outline-none"
                />
              </div>
              {errors.phone && <p className="text-xs text-red-500 mt-1">{errors.phone}</p>}
            </div>
          </div>

          {/* Delivery Address */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300 mb-1.5">
              {t.orderFields.address} *
            </label>
            <textarea
              required
              rows={2}
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="Door No, Street Name, Area / Landmark"
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-[#140A0D] text-sm focus:ring-2 focus:ring-[#7A1626] outline-none"
            />
            {errors.address && <p className="text-xs text-red-500 mt-1">{errors.address}</p>}
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

          {/* Product, Payment Status, Amount */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300 mb-1.5">
                {t.orderFields.product} *
              </label>
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
            </div>

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
                    Courier Partner & AWB Tracking (Optional)
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

                <div className="grid grid-cols-3 gap-3">
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
              {loading ? 'Recording Order...' : 'Confirm & Save Order'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
