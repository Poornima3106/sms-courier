import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth/jwt';
import { listMasters, createMasterItem, logActivity } from '@/lib/db/data-store';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const category = searchParams.get('category') || undefined;

  const items = await listMasters(category);
  return NextResponse.json({ items });
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Owner only!
  if (session.role !== 'owner') {
    return NextResponse.json({ error: 'Forbidden: Restricted to owner.' }, { status: 403 });
  }

  const { category, name } = await req.json();
  if (!category || !name) {
    return NextResponse.json({ error: 'Category and name are required' }, { status: 400 });
  }

  const created = await createMasterItem(category, name);
  await logActivity(
    session.userId,
    session.full_name,
    `Added new ${category} master: ${created.name}`
  );

  return NextResponse.json({ success: true, item: created }, { status: 201 });
}
