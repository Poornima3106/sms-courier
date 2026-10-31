import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { getSession } from '@/lib/auth/jwt';
import { listUsers, createUser, findUserByUsername, logActivity } from '@/lib/db/data-store';

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (session.role !== 'owner') {
    return NextResponse.json({ error: 'Forbidden: Restricted to owner.' }, { status: 403 });
  }

  const users = await listUsers();
  return NextResponse.json({ users });
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (session.role !== 'owner') {
    return NextResponse.json({ error: 'Forbidden: Restricted to owner.' }, { status: 403 });
  }

  const { username, full_name, password, role = 'staff' } = await req.json();

  if (!username || !password || !full_name) {
    return NextResponse.json({ error: 'Username, full name, and password are required' }, { status: 400 });
  }

  const cleanUsername = username.trim().toLowerCase();
  const existing = await findUserByUsername(cleanUsername);
  if (existing) {
    return NextResponse.json({ error: 'Username already taken' }, { status: 409 });
  }

  const password_hash = await bcrypt.hash(password, 10);
  const created = await createUser({
    username: cleanUsername,
    full_name: full_name.trim(),
    password_hash,
    role: role === 'owner' ? 'owner' : 'staff',
    is_active: true,
    must_change_password: true, // Force password change on first login as per requirements
  });

  await logActivity(
    session.userId,
    session.full_name,
    `Created new ${created.role} user: ${created.username} (${created.full_name})`
  );

  return NextResponse.json({ success: true, user: created }, { status: 201 });
}
