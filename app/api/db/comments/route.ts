import { NextRequest, NextResponse } from 'next/server';
import { execute, query } from '@/lib/db';
import { getCurrentUserId } from '@/lib/auth';
import { Comment, CreateCommentDTO, ApiResponse } from '@/lib/types';

// POST - Crear nuevo comentario (solo en tareas del usuario)
export async function POST(request: NextRequest) {
  try {
    const userId = await getCurrentUserId(request);
    if (userId === null) {
      return NextResponse.json<ApiResponse<null>>(
        { success: false, error: 'No autorizado' },
        { status: 401 }
      );
    }

    const body: CreateCommentDTO = await request.json();

    if (!body.text || !body.task_id) {
      return NextResponse.json<ApiResponse<null>>(
        { success: false, error: 'Texto y task_id son requeridos' },
        { status: 400 }
      );
    }

    // Verificar que la tarea pertenece al usuario
    const taskCheck = await query<{ id: number }>(
      'SELECT id FROM tasks WHERE id = $1 AND user_id = $2',
      [body.task_id, userId]
    );
    if (taskCheck.length === 0) {
      return NextResponse.json<ApiResponse<null>>(
        { success: false, error: 'Tarea no encontrada' },
        { status: 404 }
      );
    }

    const result = await execute(
      `INSERT INTO comments (text, task_id, user_id) VALUES ($1, $2, $3) RETURNING *`,
      [body.text, body.task_id, userId]
    );

    const newComment = result.rows[0] as Comment;

    const authorRow = await query<{ author: string }>(
      `SELECT (first_name || ' ' || last_name) as author FROM users WHERE id = $1`,
      [userId]
    );
    const author = authorRow[0]?.author ?? 'Usuario';

    return NextResponse.json<ApiResponse<Comment & { author: string }>>({
      success: true,
      data: { ...newComment, author },
    }, { status: 201 });
  } catch (error) {
    console.error('Error al crear comentario:', error);
    return NextResponse.json<ApiResponse<null>>(
      { success: false, error: 'Error al crear comentario' },
      { status: 500 }
    );
  }
}
