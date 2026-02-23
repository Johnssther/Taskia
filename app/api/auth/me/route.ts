import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { queryOne } from '@/lib/db';
import { verifyToken, getCookieName } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(getCookieName())?.value;
    if (!token) {
      return NextResponse.json({ success: false, user: null });
    }

    const payload = await verifyToken(token);
    if (!payload) {
      return NextResponse.json({ success: false, user: null });
    }

    const user = await queryOne<{
      id: number;
      email: string;
      first_name: string;
      last_name: string;
      avatar_url: string | null;
      is_premium: boolean;
      email_verified: boolean;
      created_at: string;
      updated_at: string;
    }>(
      `SELECT id, email, first_name, last_name, avatar_url, is_premium, email_verified, created_at, updated_at
       FROM users WHERE id = $1`,
      [parseInt(payload.sub, 10)]
    );

    if (!user) {
      return NextResponse.json({ success: false, user: null });
    }

    return NextResponse.json({ success: true, user });
  } catch (err) {
    console.error('Auth me error:', err);
    return NextResponse.json({ success: false, user: null });
  }
}
