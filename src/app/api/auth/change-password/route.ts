import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { getSession } from '@/lib/auth/jwt';
import { updateUser, logActivity } from '@/lib/db/data-store';

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { newPassword } = await req.json();
  if (!newPassword || newPassword.length < 6) {
    return NextResponse.json({ error: 'Password must be at least 6 characters long' }, { status: 400 });
  }

  const hash = await bcrypt.hash(newPassword, 10);
  await updateUser(session.userId, {
    password_hash: hash,
    must_change_password: false,
  });

  await logActivity(session.userId, session.full_name, 'Changed password');

  return NextResponse.json({ success: true, message: 'Password updated successfully' });
}
