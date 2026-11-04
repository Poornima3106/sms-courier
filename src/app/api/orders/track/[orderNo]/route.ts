import { NextRequest, NextResponse } from 'next/server';
import { getOrderByOrderNo } from '@/lib/db/data-store';
import { isProfessionalCourier, getCleanCarrierAwb } from '@/lib/utils/format';

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
      const directOrder = {
        id: `track-${cleanToken}`,
        order_no: cleanToken,
        customer_name: 'Direct Consignment Lookup',
        phone: '',
        address: '',
        city: 'Check Live Carrier Scan',
        pincode: '—',
        product: 'Courier Consignment',
        order_date: today,
        payment_status: 'Paid',
        amount: 0,
        status: 'Dispatched',
        courier: detectedCourier,
        awb_no: cleanToken,
        weight_kg: null,
        boxes: 1,
        courier_charge: null,
        dispatch_date: today,
        created_by: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        is_direct_awb: true,
      };

      const directTimeline = [
        {
          title: 'Consignment Registered',
          description: `Tracking ID ${cleanToken} recognized for ${detectedCourier}`,
          date: today,
          completed: true,
          current: false,
        },
        {
          title: 'Dispatched via ' + detectedCourier,
          description: `Consignment AWB: ${cleanToken} — Click "Track on TPC India" above for live hub scans`,
          date: today,
          completed: true,
          current: true,
        },
        {
          title: 'In Transit',
          description: 'Live movement & hub scans available on official carrier portal',
          date: null,
          completed: false,
          current: false,
        },
        {
          title: 'Delivered',
          description: 'Final delivery confirmation updated on carrier portal',
          date: null,
          completed: false,
          current: false,
        },
      ];

      return NextResponse.json({ order: directOrder, timeline: directTimeline, isDirectAwb: true });
    }

    return NextResponse.json({ error: `Order or Tracking ID "${rawInput}" not found` }, { status: 404 });
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
      description: isInTransit
        ? `Package in transit to ${order.city}`
        : 'Will depart dispatch hub once scanned',
      date: order.dispatch_date || null,
      completed: isInTransit,
      current: order.status === 'In Transit',
    },
    {
      title: isProblem ? `Notice: ${order.status}` : 'Delivered',
      description: isDelivered
        ? `Successfully delivered to ${order.customer_name}`
        : isProblem
        ? `Status flag: ${order.status}. Contact shop staff for assistance.`
        : 'Out for delivery to destination address',
      date: isDelivered ? order.updated_at : null,
      completed: isDelivered,
      current: isDelivered || isProblem,
      problem: isProblem,
    },
  ];

  return NextResponse.json({ order, timeline });
}
