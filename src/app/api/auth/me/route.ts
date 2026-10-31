import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth/jwt';
import { findUserById } from '@/lib/db/data-store';

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ user: null }, { status: 401 });
  }

  const user = await findUserById(session.userId);
  if (!user || !user.is_active) {
    return NextResponse.json({ user: null }, { status: 401 });
  }

  return NextResponse.json({
    user: {
      id: user.id,
      username: user.username,
      full_name: user.full_name,
      role: user.role,
      must_change_password: user.must_change_password,
    },
  });
}
