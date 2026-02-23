import { NextResponse } from 'next/server';
import { getCookieName, getCookieOptions } from '@/lib/auth';

export async function POST() {
  const res = NextResponse.json({ success: true });
  res.cookies.set(getCookieName(), '', { ...getCookieOptions(), maxAge: 0 });
  return res;
}
