import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

interface User {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  avatar_url: string | null;
  bio: string | null;
  phone: string | null;
  location: string | null;
  website: string | null;
  job_title: string | null;
  company: string | null;
  is_premium: boolean;
  email_verified: boolean;
  last_login: string | null;
  created_at: string;
  updated_at: string;
}

// GET - Obtener usuario (por ahora retorna John Doe)
export async function GET() {
  try {
    const users = await query<User>(
      `SELECT id, email, first_name, last_name, avatar_url, bio, phone, 
              location, website, job_title, company, is_premium, 
              email_verified, last_login, created_at, updated_at
       FROM users 
       WHERE email = $1`,
      ['john.doe@example.com']
    );

    if (users.length === 0) {
      return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 });
    }

    return NextResponse.json(users[0]);
  } catch (error) {
    console.error('Error obteniendo usuario:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}

// PUT - Actualizar usuario
export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { first_name, last_name, bio, phone, location, website, job_title, company, avatar_url } = body;

    const result = await query<User>(
      `UPDATE users 
       SET first_name = COALESCE($1, first_name),
           last_name = COALESCE($2, last_name),
           bio = COALESCE($3, bio),
           phone = COALESCE($4, phone),
           location = COALESCE($5, location),
           website = COALESCE($6, website),
           job_title = COALESCE($7, job_title),
           company = COALESCE($8, company),
           avatar_url = COALESCE($9, avatar_url),
           updated_at = CURRENT_TIMESTAMP
       WHERE email = 'john.doe@example.com'
       RETURNING id, email, first_name, last_name, avatar_url, bio, phone, 
                 location, website, job_title, company, is_premium, 
                 email_verified, last_login, created_at, updated_at`,
      [first_name, last_name, bio, phone, location, website, job_title, company, avatar_url]
    );

    if (result.length === 0) {
      return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 });
    }

    return NextResponse.json(result[0]);
  } catch (error) {
    console.error('Error actualizando usuario:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
