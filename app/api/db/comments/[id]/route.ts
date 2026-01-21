import { NextRequest, NextResponse } from 'next/server';
import { execute } from '@/lib/db';
import { ApiResponse } from '@/lib/types';

interface RouteParams {
  params: Promise<{ id: string }>;
}

// DELETE - Eliminar comentario
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;

    const result = await execute(
      'DELETE FROM comments WHERE id = $1 RETURNING id',
      [id]
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
