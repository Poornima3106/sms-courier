import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { findUserByUsername } from '@/lib/db/data-store';
import { createSession, COOKIE_NAME } from '@/lib/auth/jwt';
import { checkLoginRateLimit, recordFailedLogin, resetLoginAttempts } from '@/lib/auth/rate-limit';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { username, password } = body;

    if (!username || !password) {
      return NextResponse.json({ error: 'Username and password are required' }, { status: 400 });
    }

    const clientIp = req.headers.get('x-forwarded-for') || '127.0.0.1';
    const rateLimitKey = `${clientIp}:${username.toLowerCase()}`;

    const limitCheck = checkLoginRateLimit(rateLimitKey);
    if (!limitCheck.allowed) {
      return NextResponse.json(
        {
          error: `Account temporarily locked due to repeated failed logins. Please try again in ${limitCheck.waitSeconds} seconds.`,
        },
        { status: 429 }
      );
    }

    const user = await findUserByUsername(username);
    if (!user || !user.is_active || !user.password_hash) {
      const lockStatus = recordFailedLogin(rateLimitKey);
      if (lockStatus.locked) {
        return NextResponse.json(
          { error: `Too many failed attempts. Account locked for 5 minutes.` },
          { status: 429 }
        );
      }
      return NextResponse.json({ error: 'Invalid username or password' }, { status: 401 });
    }

    const isValid = await bcrypt.compare(password, user.password_hash);
    if (!isValid) {
      const lockStatus = recordFailedLogin(rateLimitKey);
      if (lockStatus.locked) {
        return NextResponse.json(
          { error: `Too many failed attempts. Account locked for 5 minutes.` },
          { status: 429 }
        );
      }
      return NextResponse.json({ error: 'Invalid username or password' }, { status: 401 });
    }

    resetLoginAttempts(rateLimitKey);

    const token = await createSession({
      userId: user.id,
      username: user.username,
      full_name: user.full_name,
      role: user.role,
      must_change_password: user.must_change_password,
    });

    const response = NextResponse.json({
      success: true,
      user: {
        id: user.id,
        username: user.username,
        full_name: user.full_name,
        role: user.role,
        must_change_password: user.must_change_password,
      },
    });

    response.cookies.set(COOKIE_NAME, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 7 * 24 * 60 * 60, // 7 days
    });

    return response;
  } catch (err: any) {
    console.error('Login error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
