import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth/jwt';
import { updateOrder, deleteOrder, logActivity, listOrders } from '@/lib/db/data-store';

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;
  const body = await req.json();

  const updated = await updateOrder(id, body);
  if (!updated) {
    return NextResponse.json({ error: 'Order not found' }, { status: 404 });
  }

  if (body.status) {
    await logActivity(
      session.userId,
      session.full_name,
      `Updated status of order ${updated.order_no} to ${body.status}`,
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

  // Strict server-side role check: Only owner can delete orders!
  if (session.role !== 'owner') {
    return NextResponse.json(
      { error: 'Forbidden: Only the owner has permission to delete orders.' },
      { status: 403 }
    );
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
