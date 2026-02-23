import { NextRequest, NextResponse } from 'next/server';
import { queryOne } from '@/lib/db';
import { verifyPassword, createToken, getCookieName, getCookieOptions } from '@/lib/auth';

interface UserRow {
  id: number;
  email: string;
  password_hash: string | null;
  first_name: string;
  last_name: string;
  avatar_url: string | null;
  is_premium: boolean;
  email_verified: boolean;
  created_at: string;
  updated_at: string;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password } = body;

    if (!email || !password || typeof email !== 'string' || typeof password !== 'string') {
      return NextResponse.json(
        { success: false, error: 'Email y contraseña son requeridos' },
        { status: 400 }
      );
    }

    const emailTrim = email.trim().toLowerCase();
    const user = await queryOne<UserRow>(
      `SELECT id, email, password_hash, first_name, last_name, avatar_url, is_premium, email_verified, created_at, updated_at
       FROM users WHERE email = $1`,
      [emailTrim]
    );

    if (!user || !user.password_hash) {
      return NextResponse.json(
        { success: false, error: 'Email o contraseña incorrectos' },
        { status: 401 }
      );
    }

    const valid = await verifyPassword(password, user.password_hash);
    if (!valid) {
      return NextResponse.json(
        { success: false, error: 'Email o contraseña incorrectos' },
        { status: 401 }
      );
    }

    await import('@/lib/db').then(({ execute }) =>
      execute(
        'UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = $1',
        [user.id]
      )
    );

    const token = await createToken({ sub: String(user.id), email: user.email });

    const res = NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        first_name: user.first_name,
        last_name: user.last_name,
        avatar_url: user.avatar_url,
        is_premium: user.is_premium,
        email_verified: user.email_verified,
        created_at: user.created_at,
        updated_at: user.updated_at,
      },
    });

    res.cookies.set(getCookieName(), token, getCookieOptions());
    return res;
  } catch (err) {
    console.error('Login error:', err);
    return NextResponse.json(
      { success: false, error: 'Error al iniciar sesión' },
      { status: 500 }
    );
  }
}
