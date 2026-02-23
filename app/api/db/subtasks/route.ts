import { NextRequest, NextResponse } from 'next/server';
import { execute, query } from '@/lib/db';
import { getCurrentUserId } from '@/lib/auth';
import { Subtask, CreateSubtaskDTO, ApiResponse } from '@/lib/types';

// POST - Crear nueva subtarea (solo en tareas del usuario)
export async function POST(request: NextRequest) {
  try {
    const userId = await getCurrentUserId(request);
    if (userId === null) {
      return NextResponse.json<ApiResponse<null>>(
        { success: false, error: 'No autorizado' },
        { status: 401 }
      );
    }

    const body: CreateSubtaskDTO = await request.json();

    if (!body.title || !body.task_id) {
      return NextResponse.json<ApiResponse<null>>(
        { success: false, error: 'Título y task_id son requeridos' },
        { status: 400 }
      );
    }

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
      'INSERT INTO subtasks (title, task_id) VALUES ($1, $2) RETURNING *',
      [body.title, body.task_id]
    );

    return NextResponse.json<ApiResponse<Subtask>>({
      success: true,
      data: result.rows[0] as Subtask,
    }, { status: 201 });
  } catch (error) {
    console.error('Error al crear subtarea:', error);
    return NextResponse.json<ApiResponse<null>>(
      { success: false, error: 'Error al crear subtarea' },
      { status: 500 }
    );
  }
}
