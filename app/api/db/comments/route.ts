import { NextRequest, NextResponse } from 'next/server';
import { execute } from '@/lib/db';
import { Comment, CreateCommentDTO, ApiResponse } from '@/lib/types';

// POST - Crear nuevo comentario
export async function POST(request: NextRequest) {
  try {
    const body: CreateCommentDTO = await request.json();

    if (!body.text || !body.task_id) {
      return NextResponse.json<ApiResponse<null>>(
        { success: false, error: 'Texto y task_id son requeridos' },
        { status: 400 }
      );
    }

    const result = await execute(
      `INSERT INTO comments (text, task_id, user_id)
       SELECT $1, $2, id FROM users WHERE email = 'john.doe@example.com'
       RETURNING *`,
      [body.text, body.task_id]
    );

    const newComment = result.rows[0] as Comment;

    // Obtener el nombre del autor
    return NextResponse.json<ApiResponse<Comment & { author: string }>>({
      success: true,
      data: { ...newComment, author: 'John Doe' },
    }, { status: 201 });
  } catch (error) {
    console.error('Error al crear comentario:', error);
    return NextResponse.json<ApiResponse<null>>(
      { success: false, error: 'Error al crear comentario' },
      { status: 500 }
    );
  }
}
