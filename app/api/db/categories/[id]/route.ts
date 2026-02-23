import { NextRequest, NextResponse } from 'next/server';
import { query, execute } from '@/lib/db';
import { getCurrentUserId } from '@/lib/auth';
import { Category, UpdateCategoryDTO, ApiResponse } from '@/lib/types';

interface RouteParams {
  params: Promise<{ id: string }>;
}

// GET - Obtener una categoría por ID (solo si es del usuario)
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const userId = await getCurrentUserId(request);
    if (userId === null) {
      return NextResponse.json<ApiResponse<null>>(
        { success: false, error: 'No autorizado' },
        { status: 401 }
      );
    }

    const { id } = await params;
    const category = await query<Category>(
      'SELECT * FROM categories WHERE id = $1 AND user_id = $2',
      [id, userId]
    );

    if (category.length === 0) {
      return NextResponse.json<ApiResponse<null>>(
        { success: false, error: 'Categoría no encontrada' },
        { status: 404 }
      );
    }

    return NextResponse.json<ApiResponse<Category>>({
      success: true,
      data: category[0],
    });
  } catch (error) {
    console.error('Error al obtener categoría:', error);
    return NextResponse.json<ApiResponse<null>>(
      { success: false, error: 'Error al obtener categoría' },
      { status: 500 }
    );
  }
}

// PUT - Actualizar categoría (solo si es del usuario)
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const userId = await getCurrentUserId(request);
    if (userId === null) {
      return NextResponse.json<ApiResponse<null>>(
        { success: false, error: 'No autorizado' },
        { status: 401 }
      );
    }

    const { id } = await params;
    const body: UpdateCategoryDTO = await request.json();

    const updates: string[] = [];
    const values: unknown[] = [];
    let paramCount = 1;

    if (body.name !== undefined) {
      updates.push(`name = $${paramCount++}`);
      values.push(body.name);
    }
    if (body.color !== undefined) {
      updates.push(`color = $${paramCount++}`);
      values.push(body.color);
    }
    if (body.icon !== undefined) {
      updates.push(`icon = $${paramCount++}`);
      values.push(body.icon);
    }

    if (updates.length === 0) {
      return NextResponse.json<ApiResponse<null>>(
        { success: false, error: 'No hay campos para actualizar' },
        { status: 400 }
      );
    }

    values.push(id, userId);
    const result = await execute(
      `UPDATE categories SET ${updates.join(', ')} WHERE id = $${paramCount} AND user_id = $${paramCount + 1} AND is_default = FALSE RETURNING *`,
      values
    );

    if (result.rowCount === 0) {
      return NextResponse.json<ApiResponse<null>>(
        { success: false, error: 'Categoría no encontrada o es la categoría por defecto' },
        { status: 404 }
      );
    }

    return NextResponse.json<ApiResponse<Category>>({
      success: true,
      data: result.rows[0] as Category,
    });
  } catch (error) {
    console.error('Error al actualizar categoría:', error);
    return NextResponse.json<ApiResponse<null>>(
      { success: false, error: 'Error al actualizar categoría' },
      { status: 500 }
    );
  }
}

// DELETE - Eliminar categoría (solo si es del usuario)
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const userId = await getCurrentUserId(request);
    if (userId === null) {
      return NextResponse.json<ApiResponse<null>>(
        { success: false, error: 'No autorizado' },
        { status: 401 }
      );
    }

    const { id } = await params;

    // Solo si la categoría es del usuario: mover tareas a la categoría por defecto
    await execute(
      `UPDATE tasks SET category_id = (
        SELECT id FROM categories WHERE is_default = TRUE AND user_id = $2
      ) WHERE category_id = $1 AND user_id = $2`,
      [id, userId]
    );

    const result = await execute(
      'DELETE FROM categories WHERE id = $1 AND user_id = $2 AND is_default = FALSE RETURNING id',
      [id, userId]
    );

    if (result.rowCount === 0) {
      return NextResponse.json<ApiResponse<null>>(
        { success: false, error: 'Categoría no encontrada o es la categoría por defecto' },
        { status: 404 }
      );
    }

    return NextResponse.json<ApiResponse<{ id: number }>>({
      success: true,
      data: { id: parseInt(id) },
    });
  } catch (error) {
    console.error('Error al eliminar categoría:', error);
    return NextResponse.json<ApiResponse<null>>(
      { success: false, error: 'Error al eliminar categoría' },
      { status: 500 }
    );
  }
}
