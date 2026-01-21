import { NextRequest, NextResponse } from 'next/server';
import { execute } from '@/lib/db';
import { Subtask, CreateSubtaskDTO, ApiResponse } from '@/lib/types';

// POST - Crear nueva subtarea
export async function POST(request: NextRequest) {
  try {
    const body: CreateSubtaskDTO = await request.json();

    if (!body.title || !body.task_id) {
      return NextResponse.json<ApiResponse<null>>(
        { success: false, error: 'Título y task_id son requeridos' },
        { status: 400 }
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
