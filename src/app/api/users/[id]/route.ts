import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { getSession } from '@/lib/auth/jwt';
import { updateUser, logActivity, findUserById } from '@/lib/db/data-store';

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (session.role !== 'owner') {
    return NextResponse.json({ error: 'Forbidden: Restricted to owner.' }, { status: 403 });
  }

  const { id } = await params;
  const target = await findUserById(id);
  if (!target) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 });
  }

  const body = await req.json();
  const updates: any = {};

  if (body.newPassword) {
    updates.password_hash = await bcrypt.hash(body.newPassword, 10);
    updates.must_change_password = true;
    await logActivity(
      session.userId,
      session.full_name,
      `Reset password for staff user ${target.username}`
    );
  }

  if (typeof body.is_active === 'boolean') {
    updates.is_active = body.is_active;
    await logActivity(
      session.userId,
      session.full_name,
      `${body.is_active ? 'Activated' : 'Deactivated'} staff user ${target.username}`
    );
  }

  const updated = await updateUser(id, updates);
  return NextResponse.json({ success: true, user: updated });
}
