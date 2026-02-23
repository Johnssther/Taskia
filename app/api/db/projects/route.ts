import { NextRequest, NextResponse } from 'next/server';
import { query, execute } from '@/lib/db';
import { getCurrentUserId } from '@/lib/auth';
import { Project, CreateProjectDTO, ApiResponse } from '@/lib/types';

// GET - Obtener todos los proyectos del usuario
export async function GET(request: NextRequest) {
  try {
    const userId = await getCurrentUserId(request);
    if (userId === null) {
      return NextResponse.json<ApiResponse<null>>(
        { success: false, error: 'No autorizado' },
        { status: 401 }
      );
    }

    const projects = await query<Project & { category_count?: number }>(
      `SELECT p.*,
        (SELECT COUNT(*) FROM categories c WHERE c.project_id = p.id) as category_count
       FROM projects p
       WHERE p.user_id = $1
       ORDER BY p.created_at ASC`,
      [userId]
    );

    return NextResponse.json<ApiResponse<(Project & { category_count?: number })[]>>({
      success: true,
      data: projects,
    });
  } catch (error) {
    console.error('Error al obtener proyectos:', error);
    return NextResponse.json<ApiResponse<null>>(
      { success: false, error: 'Error al obtener proyectos' },
      { status: 500 }
    );
  }
}

// POST - Crear nuevo proyecto
export async function POST(request: NextRequest) {
  try {
    const userId = await getCurrentUserId(request);
    if (userId === null) {
      return NextResponse.json<ApiResponse<null>>(
        { success: false, error: 'No autorizado' },
        { status: 401 }
      );
    }

    const body: CreateProjectDTO = await request.json();

    if (!body.name || !body.name.trim()) {
      return NextResponse.json<ApiResponse<null>>(
        { success: false, error: 'El nombre del proyecto es requerido' },
        { status: 400 }
      );
    }

    const result = await execute(
      `INSERT INTO projects (name, user_id) VALUES ($1, $2) RETURNING *`,
      [body.name.trim(), userId]
    );

    const newProject = result.rows[0] as Project;

    return NextResponse.json<ApiResponse<Project>>({
      success: true,
      data: newProject,
    }, { status: 201 });
  } catch (error) {
    console.error('Error al crear proyecto:', error);
    return NextResponse.json<ApiResponse<null>>(
      { success: false, error: 'Error al crear proyecto' },
      { status: 500 }
    );
  }
}
