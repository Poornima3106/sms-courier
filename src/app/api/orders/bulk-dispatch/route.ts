import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth/jwt';
import { bulkDispatch } from '@/lib/db/data-store';
import { bulkDispatchSchema } from '@/lib/validations/order';

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const json = await req.json();
    const validated = bulkDispatchSchema.safeParse(json);

    if (!validated.success) {
      return NextResponse.json(
        { error: 'Invalid dispatch data', details: validated.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { courier, dispatch_date, items } = validated.data;
    const count = await bulkDispatch(
      items.map((it) => ({
        id: it.id,
        awbNo: it.awbNo,
        weightKg: it.weightKg ?? undefined,
        boxes: it.boxes,
        courierCharge: it.courierCharge ?? undefined,
      })),
      { courier, dispatchDate: dispatch_date },
      { id: session.userId, name: session.full_name }
    );

    return NextResponse.json({ success: true, count, message: `${count} orders dispatched successfully.` });
  } catch (err: any) {
    console.error('Bulk dispatch error:', err);
    return NextResponse.json({ error: err.message || 'Bulk dispatch failed' }, { status: 500 });
  }
}
