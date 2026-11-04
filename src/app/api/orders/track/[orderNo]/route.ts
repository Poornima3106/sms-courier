import { NextRequest, NextResponse } from 'next/server';
import { getOrderByOrderNo } from '@/lib/db/data-store';
import { isProfessionalCourier, getCleanCarrierAwb } from '@/lib/utils/format';
import { fetchLiveCourierTracking } from '@/lib/services/courier-api';

export async function GET(req: NextRequest, { params }: { params: Promise<{ orderNo: string }> }) {
  const { orderNo } = await params;
  const queryParam = req.nextUrl.searchParams.get('query');
  const rawInput = (queryParam || orderNo || '').trim();

  if (!rawInput) {
    return NextResponse.json({ error: 'Order number or Tracking ID is required' }, { status: 400 });
  }

  const order = await getOrderByOrderNo(rawInput);

  if (!order) {
    // If the user entered a Professional Courier / AWB tracking number directly, recognize it as a live courier AWB
    const cleanToken = getCleanCarrierAwb('Professional', rawInput);
    const looksLikeTrackingId =
      isProfessionalCourier('Professional', cleanToken) ||
      /^[A-Z]{2,5}\d{4,}$/i.test(cleanToken) ||
      /^\d{6,15}$/.test(cleanToken);

    if (looksLikeTrackingId) {
      const detectedCourier = cleanToken.startsWith('ST')
        ? 'ST Courier'
        : cleanToken.startsWith('DTDC')
        ? 'DTDC'
        : 'Professional';
      const today = new Date().toISOString().slice(0, 10);

      const liveTracking = await fetchLiveCourierTracking(detectedCourier, cleanToken);
      const effectiveAwb = liveTracking.awbNo || cleanToken;
      const effectiveStatus = liveTracking.liveFetched
        ? liveTracking.currentStatus === 'Delivered'
          ? 'Delivered'
          : liveTracking.currentStatus === 'In Transit'
          ? 'In Transit'
          : 'Dispatched'
        : 'Dispatched';

      const directOrder = {
        id: `track-${effectiveAwb}`,
        order_no: effectiveAwb,
        customer_name: 'Direct Consignment Lookup',
        phone: '',
        address: '',
        city: liveTracking.liveFetched && liveTracking.location ? liveTracking.location : 'Check Live Carrier Scan',
        pincode: '—',
        product: 'Courier Consignment',
        order_date: today,
        payment_status: 'Paid',
        amount: 0,
        status: effectiveStatus,
        courier: detectedCourier,
        awb_no: effectiveAwb,
        weight_kg: null,
        boxes: 1,
        courier_charge: null,
        dispatch_date: today,
        created_by: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        is_direct_awb: true,
      };

      const isDirectInTransit = effectiveStatus === 'In Transit' || effectiveStatus === 'Delivered';
      const isDirectDelivered = effectiveStatus === 'Delivered';

      const directTimeline = [
        {
          title: 'Consignment Registered',
          description: `Tracking ID ${effectiveAwb} recognized for ${detectedCourier}`,
          date: today,
          completed: true,
          current: false,
        },
        {
          title: 'Dispatched via ' + detectedCourier,
          description: `Consignment AWB: ${effectiveAwb}`,
          date: today,
          completed: true,
          current: effectiveStatus === 'Dispatched',
        },
        {
          title: 'In Transit',
          description: liveTracking.liveFetched
            ? `${liveTracking.latestActivity} — ${liveTracking.location}`
            : 'Live movement & hub scans available in Live Tracking Report',
          date: liveTracking.liveFetched ? liveTracking.lastUpdated : null,
          completed: isDirectInTransit,
          current: effectiveStatus === 'In Transit',
        },
        {
          title: 'Delivered',
          description: isDirectDelivered
            ? `${liveTracking.latestActivity} (${liveTracking.location})`
            : 'Final delivery confirmation updated on carrier portal',
          date: isDirectDelivered ? liveTracking.lastUpdated : null,
          completed: isDirectDelivered,
          current: isDirectDelivered,
        },
      ];

      return NextResponse.json({
        order: directOrder,
        timeline: directTimeline,
        liveTracking,
        isDirectAwb: true,
      });
    }

    return NextResponse.json({ error: `Order or Tracking ID "${rawInput}" not found` }, { status: 404 });
  }

  // Normalize AWB & fetch live carrier updates if AWB exists
  let liveTracking = null;
  if (order.awb_no) {
    order.awb_no = getCleanCarrierAwb(order.courier, order.awb_no);
    liveTracking = await fetchLiveCourierTracking(order.courier || 'Professional', order.awb_no);
    if (liveTracking?.awbNo) {
      order.awb_no = liveTracking.awbNo;
    }
    if (liveTracking?.liveFetched) {
      if (liveTracking.currentStatus === 'Delivered') {
        order.status = 'Delivered';
      } else if (liveTracking.currentStatus === 'In Transit' && (order.status === 'Pending' || order.status === 'Dispatched')) {
        order.status = 'In Transit';
      }
    }
  }

  // Build timeline
  const isPending = order.status === 'Pending';
  const isDispatched = ['Dispatched', 'In Transit', 'Delivered', 'Delayed', 'Returned', 'Damaged'].includes(order.status);
  const isInTransit = ['In Transit', 'Delivered', 'Delayed', 'Returned', 'Damaged'].includes(order.status);
  const isDelivered = order.status === 'Delivered';
  const isProblem = ['Delayed', 'Returned', 'Damaged'].includes(order.status);

  const timeline = [
    {
      title: 'Order Confirmed',
      description: `Sweet box order recorded in system`,
      date: order.order_date,
      completed: true,
      current: isPending,
    },
    {
      title: 'Dispatched',
      description: order.courier
        ? `Handed over to ${order.courier} (AWB: ${order.awb_no || 'Pending'})`
        : 'Awaiting package dispatch',
      date: order.dispatch_date || null,
      completed: isDispatched,
      current: order.status === 'Dispatched',
    },
    {
      title: 'In Transit',
      description: liveTracking?.liveFetched
        ? `${liveTracking.latestActivity} • ${liveTracking.location}`
        : isInTransit
        ? `Package in transit to ${order.city}`
        : 'Will depart dispatch hub once scanned',
      date: order.dispatch_date || null,
      completed: isInTransit,
      current: order.status === 'In Transit',
    },
    {
      title: isProblem ? `Notice: ${order.status}` : 'Delivered',
      description: isDelivered
        ? liveTracking?.liveFetched
          ? `${liveTracking.latestActivity} (${liveTracking.location}) — Delivered to ${order.customer_name}`
          : `Successfully delivered to ${order.customer_name}`
        : isProblem
        ? `Status flag: ${order.status}. Contact shop staff for assistance.`
        : 'Out for delivery to destination address',
      date: isDelivered ? order.updated_at : null,
      completed: isDelivered,
      current: isDelivered || isProblem,
      problem: isProblem,
    },
  ];

  return NextResponse.json({ order, timeline, liveTracking });
}
