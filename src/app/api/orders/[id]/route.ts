import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth/jwt';
import { updateOrder, deleteOrder, logActivity, listOrders, getOrderByOrderNo } from '@/lib/db/data-store';
import { orderFormSchema } from '@/lib/validations/order';

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;
  const order = (await listOrders()).find((item) => item.id === id);
  if (!order) {
    return NextResponse.json({ error: 'Order not found' }, { status: 404 });
  }

  return NextResponse.json({ order });
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const validated = orderFormSchema.partial().safeParse(body);
  if (!validated.success) {
    return NextResponse.json(
      { error: 'Validation failed', details: validated.error.flatten().fieldErrors },
      { status: 400 }
    );
  }

  const updates = validated.data;
  if (updates.order_no) {
    const existing = await getOrderByOrderNo(updates.order_no);
    if (existing && existing.id !== id) {
      return NextResponse.json(
        { error: `Order number ${updates.order_no} already exists. Please use a unique order number.` },
        { status: 409 }
      );
    }
  }

  const updated = await updateOrder(id, updates);
  if (!updated) {
    return NextResponse.json({ error: 'Order not found' }, { status: 404 });
  }

  if (updates.status && Object.keys(updates).length === 1) {
    await logActivity(
      session.userId,
      session.full_name,
      `Updated status of order ${updated.order_no} to ${updates.status}`,
      updated.order_no
    );
  } else {
    await logActivity(
      session.userId,
      session.full_name,
      `Modified details of order ${updated.order_no}`,
      updated.order_no
    );
  }

  return NextResponse.json({ success: true, order: updated });
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;
  const orders = await listOrders();
  const target = orders.find((o) => o.id === id);

  const deleted = await deleteOrder(id);
  if (!deleted) {
    return NextResponse.json({ error: 'Order not found' }, { status: 404 });
  }

  if (target) {
    await logActivity(
      session.userId,
      session.full_name,
      `Deleted order ${target.order_no} (${target.customer_name})`,
      target.order_no
    );
  }

  return NextResponse.json({ success: true });
}
