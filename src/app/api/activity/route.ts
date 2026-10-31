import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth/jwt';
import { listActivityLogs } from '@/lib/db/data-store';

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Owner only!
  if (session.role !== 'owner') {
    return NextResponse.json({ error: 'Forbidden: Activity Log is restricted to owner.' }, { status: 403 });
  }

  const logs = await listActivityLogs(100);
  return NextResponse.json({ logs });
}
