import { NextRequest, NextResponse } from 'next/server';
import { getOrderByOrderNo } from '@/lib/db/data-store';

export async function GET(req: NextRequest, { params }: { params: Promise<{ orderNo: string }> }) {
  const { orderNo } = await params;
  if (!orderNo) {
    return NextResponse.json({ error: 'Order number is required' }, { status: 400 });
  }

  const order = await getOrderByOrderNo(orderNo);
  if (!order) {
    return NextResponse.json({ error: `Order ${orderNo} not found` }, { status: 404 });
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
