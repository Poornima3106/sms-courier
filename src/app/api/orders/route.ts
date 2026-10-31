import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth/jwt';
import { listOrders, createOrder, getOrderByOrderNo, logActivity } from '@/lib/db/data-store';
import { orderFormSchema } from '@/lib/validations/order';

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const search = searchParams.get('search') || undefined;
  const status = searchParams.get('status') || undefined;
  const courier = searchParams.get('courier') || undefined;
  const city = searchParams.get('city') || undefined;
  const dateFrom = searchParams.get('dateFrom') || undefined;
  const dateTo = searchParams.get('dateTo') || undefined;

  const orders = await listOrders({
    search,
    status,
    courier,
    city,
    dateFrom,
    dateTo,
  });

  return NextResponse.json({ orders });
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const json = await req.json();
    const validated = orderFormSchema.safeParse(json);

    if (!validated.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: validated.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const data = validated.data;

    // Check unique order number
    const existing = await getOrderByOrderNo(data.order_no);
    if (existing) {
      return NextResponse.json(
        { error: `Order number ${data.order_no} already exists. Please use a unique order number.` },
        { status: 409 }
      );
    }

    const created = await createOrder({
      order_no: data.order_no,
      customer_name: data.customer_name,
      phone: data.phone,
      address: data.address,
      city: data.city,
      pincode: data.pincode,
      product: data.product,
      order_date: data.order_date,
      payment_status: data.payment_status,
      amount: data.amount,
      status: data.status,
      created_by: session.userId,
    });

    await logActivity(
      session.userId,
      session.full_name,
      `Created new order ${created.order_no} for ${created.customer_name}`,
      created.order_no
    );

    return NextResponse.json({ success: true, order: created }, { status: 201 });
  } catch (err: any) {
    console.error('Error creating order:', err);
    return NextResponse.json({ error: err.message || 'Failed to create order' }, { status: 500 });
  }
}
