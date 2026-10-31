import { NextResponse } from 'next/server';
import { getNextOrderNumber } from '@/lib/db/data-store';

export async function GET() {
  const nextOrderNo = await getNextOrderNumber();
  return NextResponse.json({ nextOrderNo });
}
