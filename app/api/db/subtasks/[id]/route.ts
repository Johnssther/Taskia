import { NextRequest, NextResponse } from 'next/server';
import { execute } from '@/lib/db';
import { getCurrentUserId } from '@/lib/auth';
import { Subtask, ApiResponse } from '@/lib/types';

interface RouteParams {
  params: Promise<{ id: string }>;
}

// PUT - Actualizar subtarea (solo si la tarea es del usuario)
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
    const body = await request.json();

    const updates: string[] = [];
    const values: unknown[] = [];
    let paramCount = 1;

    if (body.title !== undefined) {
      updates.push(`title = $${paramCount++}`);
      values.push(body.title);
    }
    if (body.completed !== undefined) {
      updates.push(`completed = $${paramCount++}`);
      values.push(body.completed);
    }

    if (updates.length === 0) {
      return NextResponse.json<ApiResponse<null>>(
        { success: false, error: 'No hay campos para actualizar' },
        { status: 400 }
      );
    }

    values.push(id, userId);
    const result = await execute(
      `UPDATE subtasks SET ${updates.join(', ')}
       WHERE id = $${paramCount}
         AND task_id IN (SELECT id FROM tasks WHERE user_id = $${paramCount + 1})
       RETURNING *`,
      values
    );

    if (result.rowCount === 0) {
      return NextResponse.json<ApiResponse<null>>(
        { success: false, error: 'Subtarea no encontrada' },
        { status: 404 }
      );
    }

    return NextResponse.json<ApiResponse<Subtask>>({
      success: true,
      data: result.rows[0] as Subtask,
    });
  } catch (error) {
    console.error('Error al actualizar subtarea:', error);
    return NextResponse.json<ApiResponse<null>>(
      { success: false, error: 'Error al actualizar subtarea' },
      { status: 500 }
    );
  }
}

// DELETE - Eliminar subtarea (solo si la tarea es del usuario)
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

    const result = await execute(
      `DELETE FROM subtasks
       WHERE id = $1 AND task_id IN (SELECT id FROM tasks WHERE user_id = $2)
       RETURNING id`,
      [id, userId]
    );

    if (result.rowCount === 0) {
      return NextResponse.json<ApiResponse<null>>(
        { success: false, error: 'Subtarea no encontrada' },
        { status: 404 }
      );
    }

    return NextResponse.json<ApiResponse<{ id: number }>>({
      success: true,
      data: { id: parseInt(id) },
    });
  } catch (error) {
    console.error('Error al eliminar subtarea:', error);
    return NextResponse.json<ApiResponse<null>>(
      { success: false, error: 'Error al eliminar subtarea' },
      { status: 500 }
    );
  }
}
