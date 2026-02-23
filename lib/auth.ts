import type { NextRequest } from 'next/server';
import bcrypt from 'bcryptjs';
import * as jose from 'jose';

const SALT_ROUNDS = 10;
const JWT_SECRET = process.env.JWT_SECRET || 'taskia-dev-secret-change-in-production';
const COOKIE_NAME = 'taskia_session';

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export async function createToken(payload: { sub: string; email: string }): Promise<string> {
  const secret = new TextEncoder().encode(JWT_SECRET);
  return new jose.SignJWT({ ...payload })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(secret);
}

export async function verifyToken(token: string): Promise<{ sub: string; email: string } | null> {
  try {
    const secret = new TextEncoder().encode(JWT_SECRET);
    const { payload } = await jose.jwtVerify(token, secret);
    const sub = payload.sub as string;
    const email = payload.email as string;
    return sub && email ? { sub, email } : null;
  } catch {
    return null;
  }
}

export function getCookieName() {
  return COOKIE_NAME;
}

export function getCookieOptions() {
  const isProd = process.env.NODE_ENV === 'production';
  return {
    httpOnly: true,
    secure: isProd,
    sameSite: 'lax' as const,
    maxAge: 60 * 60 * 24 * 7, // 7 days
    path: '/',
  };
}

/** Obtiene el ID del usuario autenticado desde la cookie JWT. Devuelve null si no hay sesión o es inválida. */
export async function getCurrentUserId(request: NextRequest): Promise<number | null> {
  const token = request.cookies.get(COOKIE_NAME)?.value;
  if (!token) return null;
  const payload = await verifyToken(token);
  if (!payload) return null;
  const id = parseInt(payload.sub, 10);
  return Number.isNaN(id) ? null : id;
}
