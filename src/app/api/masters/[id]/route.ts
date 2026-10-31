import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth/jwt';
import { toggleMasterItem, deleteMasterItem } from '@/lib/db/data-store';

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (session.role !== 'owner') {
    return NextResponse.json({ error: 'Forbidden: Restricted to owner.' }, { status: 403 });
  }

  const { id } = await params;
  const { is_active } = await req.json();

  const success = await toggleMasterItem(id, Boolean(is_active));
  return NextResponse.json({ success });
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (session.role !== 'owner') {
    return NextResponse.json({ error: 'Forbidden: Restricted to owner.' }, { status: 403 });
  }

  const { id } = await params;
  const success = await deleteMasterItem(id);
  return NextResponse.json({ success });
}
