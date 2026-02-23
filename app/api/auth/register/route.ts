import { NextRequest, NextResponse } from 'next/server';
import { execute } from '@/lib/db';
import { hashPassword, createToken, getCookieName, getCookieOptions } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password, first_name, last_name } = body;

    if (!email || !password || typeof email !== 'string' || typeof password !== 'string') {
      return NextResponse.json(
        { success: false, error: 'Email y contraseña son requeridos' },
        { status: 400 }
      );
    }

    const emailTrim = email.trim().toLowerCase();
    if (!emailTrim || password.length < 6) {
      return NextResponse.json(
        { success: false, error: 'Email válido y contraseña de al menos 6 caracteres' },
        { status: 400 }
      );
    }

    const passwordHash = await hashPassword(password);
    const firstName = (first_name ?? '').toString().trim().slice(0, 100) || 'Usuario';
    const lastName = (last_name ?? '').toString().trim().slice(0, 100) || '';

    const result = await execute(
      `INSERT INTO users (email, password_hash, first_name, last_name)
       VALUES ($1, $2, $3, $4)
       RETURNING id, email, first_name, last_name, avatar_url, is_premium, email_verified, created_at, updated_at`,
      [emailTrim, passwordHash, firstName, lastName]
    );

    const row = result.rows[0] as Record<string, unknown>;
    if (!row) {
      return NextResponse.json(
        { success: false, error: 'Error al crear el usuario' },
        { status: 500 }
      );
    }

    const token = await createToken({
      sub: String(row.id),
      email: String(row.email),
    });

    const cookieOpts = getCookieOptions();
    const res = NextResponse.json({
      success: true,
      user: {
        id: row.id,
        email: row.email,
        first_name: row.first_name,
        last_name: row.last_name,
        avatar_url: row.avatar_url,
        is_premium: row.is_premium,
        email_verified: row.email_verified,
        created_at: row.created_at,
        updated_at: row.updated_at,
      },
    });

    res.cookies.set(getCookieName(), token, cookieOpts);
    return res;
  } catch (err: unknown) {
    const code = err && typeof err === 'object' && 'code' in err ? (err as { code: string }).code : '';
    const msg = code === '23505' ? 'Este email ya está registrado' : 'Error al registrar';
    console.error('Register error:', err);
    return NextResponse.json({ success: false, error: msg }, { status: 400 });
  }
}
