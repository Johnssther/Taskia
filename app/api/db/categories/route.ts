import { NextRequest, NextResponse } from 'next/server';
import { query, execute } from '@/lib/db';
import { Category, CreateCategoryDTO, ApiResponse } from '@/lib/types';

// GET - Obtener todas las categorías
export async function GET() {
  try {
    const categories = await query<Category>(
      `SELECT c.*, 
        (SELECT COUNT(*) FROM tasks t WHERE t.category_id = c.id) as task_count
       FROM categories c 
       WHERE c.user_id = (SELECT id FROM users WHERE email = 'john.doe@example.com')
       ORDER BY c.is_default DESC, c.created_at ASC`
    );

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

// POST - Crear nueva categoría
export async function POST(request: NextRequest) {
  try {
    const body: CreateCategoryDTO = await request.json();

    if (!body.name || !body.color) {
      return NextResponse.json<ApiResponse<null>>(
        { success: false, error: 'Nombre y color son requeridos' },
        { status: 400 }
      );
    }

    const result = await execute(
      `INSERT INTO categories (name, color, icon, user_id)
       SELECT $1, $2, $3, id FROM users WHERE email = 'john.doe@example.com'
       RETURNING *`,
      [body.name, body.color, body.icon || '📁']
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
