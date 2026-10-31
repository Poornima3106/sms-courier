import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth/jwt';
import { listOrders } from '@/lib/db/data-store';

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Owner only!
  if (session.role !== 'owner') {
    return NextResponse.json({ error: 'Forbidden: Reports are restricted to owners only.' }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const dateFrom = searchParams.get('dateFrom') || undefined;
  const dateTo = searchParams.get('dateTo') || undefined;

  const orders = await listOrders({ dateFrom, dateTo });

  // 1. City-wise orders and amount
  const cityMap = new Map<string, { count: number; amount: number }>();
  // 2. Courier-wise orders and courier charges
  const courierMap = new Map<string, { count: number; courierCharge: number }>();
  // 3. Status breakdown
  const statusMap = new Map<string, number>();

  let totalOrders = orders.length;
  let totalOrderAmount = 0;
  let totalCourierCharges = 0;
  let totalPendingAmount = 0;
  let totalCodAmount = 0;
  let totalPaidAmount = 0;

  for (const o of orders) {
    totalOrderAmount += o.amount || 0;
    totalCourierCharges += o.courier_charge || 0;

    if (o.payment_status === 'Pending') {
      totalPendingAmount += o.amount || 0;
    } else if (o.payment_status === 'COD') {
      totalCodAmount += o.amount || 0;
    } else if (o.payment_status === 'Paid') {
      totalPaidAmount += o.amount || 0;
    }

    // City aggregation
    const cityName = o.city || 'Other';
    const cData = cityMap.get(cityName) || { count: 0, amount: 0 };
    cData.count += 1;
    cData.amount += o.amount || 0;
    cityMap.set(cityName, cData);

    // Courier aggregation
    const courierName = o.courier || 'Unassigned';
    const crData = courierMap.get(courierName) || { count: 0, courierCharge: 0 };
    crData.count += 1;
    crData.courierCharge += o.courier_charge || 0;
    courierMap.set(courierName, crData);

    // Status aggregation
    statusMap.set(o.status, (statusMap.get(o.status) || 0) + 1);
  }

  const cityReport = Array.from(cityMap.entries())
    .map(([city, data]) => ({ city, ...data }))
    .sort((a, b) => b.count - a.count);

  const courierReport = Array.from(courierMap.entries())
    .map(([courier, data]) => ({ courier, ...data }))
    .sort((a, b) => b.count - a.count);

  const statusReport = Array.from(statusMap.entries()).map(([status, count]) => ({ status, count }));

  return NextResponse.json({
    summary: {
      totalOrders,
      totalOrderAmount,
      totalCourierCharges,
      totalPendingAmount,
      totalCodAmount,
      totalPaidAmount,
    },
    cityReport,
    courierReport,
    statusReport,
  });
}
