import { NextRequest, NextResponse } from 'next/server';
import { execute } from '@/lib/db';
import { Subtask, ApiResponse } from '@/lib/types';

interface RouteParams {
  params: Promise<{ id: string }>;
}

// PUT - Actualizar subtarea (toggle completed)
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
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

    values.push(id);
    const result = await execute(
      `UPDATE subtasks SET ${updates.join(', ')} WHERE id = $${paramCount} RETURNING *`,
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

// DELETE - Eliminar subtarea
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;

    const result = await execute(
      'DELETE FROM subtasks WHERE id = $1 RETURNING id',
      [id]
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
