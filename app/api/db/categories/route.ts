import { NextRequest, NextResponse } from 'next/server';
import { query, execute } from '@/lib/db';
import { getCurrentUserId } from '@/lib/auth';
import { Category, CreateCategoryDTO, ApiResponse } from '@/lib/types';

// GET - Obtener categorías del usuario (opcional: ?project_id= para filtrar por proyecto)
export async function GET(request: NextRequest) {
  try {
    const userId = await getCurrentUserId(request);
    if (userId === null) {
      return NextResponse.json<ApiResponse<null>>(
        { success: false, error: 'No autorizado' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get('project_id');

    const values: unknown[] = [userId];
    let sql = `SELECT c.*, 
        (SELECT COUNT(*) FROM tasks t WHERE t.category_id = c.id) as task_count
       FROM categories c 
       WHERE c.user_id = $1`;
    if (projectId != null && projectId !== '') {
      const pid = parseInt(projectId, 10);
      if (!isNaN(pid)) {
        sql += ` AND c.project_id = $2`;
        values.push(pid);
      }
    }

    sql += ` ORDER BY c.is_default DESC, c.created_at ASC`;

    const categories = await query<Category>(sql, values);

    return NextResponse.json<ApiResponse<Category[]>>({
      success: true,
      data: categories,
    });
  } catch (error) {
    console.error('Error al obtener categorías:', error);
    return NextResponse.json<ApiResponse<null>>(
      { success: false, error: 'Error al obtener categorías' },
      { status: 500 }
    );
  }
}

// POST - Crear nueva categoría (project_id opcional)
export async function POST(request: NextRequest) {
  try {
    const userId = await getCurrentUserId(request);
    if (userId === null) {
      return NextResponse.json<ApiResponse<null>>(
        { success: false, error: 'No autorizado' },
        { status: 401 }
      );
    }

    const body: CreateCategoryDTO = await request.json();

    if (!body.name || !body.color) {
      return NextResponse.json<ApiResponse<null>>(
        { success: false, error: 'Nombre y color son requeridos' },
        { status: 400 }
      );
    }

    const result = await execute(
      `INSERT INTO categories (name, color, icon, user_id, project_id)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [body.name, body.color, body.icon || 'folder', userId, body.project_id ?? null]
    );

    const newCategory = result.rows[0] as Category;

    return NextResponse.json<ApiResponse<Category>>({
      success: true,
      data: newCategory,
    }, { status: 201 });
  } catch (error) {
    console.error('Error al crear categoría:', error);
    return NextResponse.json<ApiResponse<null>>(
      { success: false, error: 'Error al crear categoría' },
      { status: 500 }
    );
  }
}
