import { NextRequest, NextResponse } from 'next/server';
import { execute } from '@/lib/db';
import { getCurrentUserId } from '@/lib/auth';
import { ApiResponse } from '@/lib/types';

interface RouteParams {
  params: Promise<{ id: string }>;
}

// DELETE - Eliminar comentario (solo el autor o el dueño de la tarea)
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
      `DELETE FROM comments
       WHERE id = $1 AND (
         user_id = $2
         OR task_id IN (SELECT id FROM tasks WHERE user_id = $2)
       )
       RETURNING id`,
      [id, userId]
    );

    if (result.rowCount === 0) {
      return NextResponse.json<ApiResponse<null>>(
        { success: false, error: 'Comentario no encontrado' },
        { status: 404 }
      );
    }

    return NextResponse.json<ApiResponse<{ id: number }>>({
      success: true,
      data: { id: parseInt(id) },
    });
  } catch (error) {
    console.error('Error al eliminar comentario:', error);
    return NextResponse.json<ApiResponse<null>>(
      { success: false, error: 'Error al eliminar comentario' },
      { status: 500 }
    );
  }
}
