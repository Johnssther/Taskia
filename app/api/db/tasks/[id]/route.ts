import { NextRequest, NextResponse } from 'next/server';
import { query, execute } from '@/lib/db';
import { getCurrentUserId } from '@/lib/auth';
import { Task, Subtask, Comment, UpdateTaskDTO, ApiResponse } from '@/lib/types';

interface RouteParams {
  params: Promise<{ id: string }>;
}

interface TaskWithRelations extends Task {
  subtasks: Subtask[];
  comments: (Comment & { author: string })[];
}

// GET - Obtener una tarea por ID con sus relaciones (solo si es del usuario)
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
    const tasks = await query<Task>(
      'SELECT * FROM tasks WHERE id = $1 AND user_id = $2',
      [id, userId]
    );

    if (tasks.length === 0) {
      return NextResponse.json<ApiResponse<null>>(
        { success: false, error: 'Tarea no encontrada' },
        { status: 404 }
      );
    }

    const task = tasks[0];

    // Obtener subtareas
    const subtasks = await query<Subtask>(
      'SELECT * FROM subtasks WHERE task_id = $1 ORDER BY created_at ASC',
      [id]
    );

    // Obtener comentarios con autor
    const comments = await query<Comment & { author: string }>(
      `SELECT c.*, (u.first_name || ' ' || u.last_name) as author 
       FROM comments c 
       LEFT JOIN users u ON c.user_id = u.id 
       WHERE c.task_id = $1 
       ORDER BY c.created_at ASC`,
      [id]
    );

    return NextResponse.json<ApiResponse<TaskWithRelations>>({
      success: true,
      data: { ...task, subtasks, comments },
    });
  } catch (error) {
    console.error('Error al obtener tarea:', error);
    return NextResponse.json<ApiResponse<null>>(
      { success: false, error: 'Error al obtener tarea' },
      { status: 500 }
    );
  }
}

// PUT - Actualizar tarea (solo si es del usuario)
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
    const body: UpdateTaskDTO = await request.json();

    const updates: string[] = [];
    const values: unknown[] = [];
    let paramCount = 1;

    if (body.title !== undefined) {
      updates.push(`title = $${paramCount++}`);
      values.push(body.title);
    }
    if (body.description !== undefined) {
      updates.push(`description = $${paramCount++}`);
      values.push(body.description);
    }
    if (body.completed !== undefined) {
      updates.push(`completed = $${paramCount++}`);
      values.push(body.completed);
    }
    if (body.priority !== undefined) {
      updates.push(`priority = $${paramCount++}`);
      values.push(body.priority);
    }
    if (body.due_date !== undefined) {
      updates.push(`due_date = $${paramCount++}`);
      values.push(body.due_date);
    }
    if (body.category_id !== undefined) {
      updates.push(`category_id = $${paramCount++}`);
      values.push(body.category_id);
    }
    if (body.ai_suggestions !== undefined) {
      updates.push(`ai_suggestions = $${paramCount++}`);
      values.push(body.ai_suggestions);
    }
    if (body.time_spent !== undefined) {
      updates.push(`time_spent = $${paramCount++}`);
      values.push(body.time_spent);
    }
    if (body.estimated_time !== undefined) {
      updates.push(`estimated_time = $${paramCount++}`);
      values.push(body.estimated_time);
    }

    if (updates.length === 0) {
      return NextResponse.json<ApiResponse<null>>(
        { success: false, error: 'No hay campos para actualizar' },
        { status: 400 }
      );
    }

    values.push(id, userId);
    const result = await execute(
      `UPDATE tasks SET ${updates.join(', ')} WHERE id = $${paramCount} AND user_id = $${paramCount + 1} RETURNING *`,
      values
    );

    if (result.rowCount === 0) {
      return NextResponse.json<ApiResponse<null>>(
        { success: false, error: 'Tarea no encontrada' },
        { status: 404 }
      );
    }

    return NextResponse.json<ApiResponse<Task>>({
      success: true,
      data: result.rows[0] as Task,
    });
  } catch (error) {
    console.error('Error al actualizar tarea:', error);
    return NextResponse.json<ApiResponse<null>>(
      { success: false, error: 'Error al actualizar tarea' },
      { status: 500 }
    );
  }
}

// DELETE - Eliminar tarea (solo si es del usuario)
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
      'DELETE FROM tasks WHERE id = $1 AND user_id = $2 RETURNING id',
      [id, userId]
    );

    if (result.rowCount === 0) {
      return NextResponse.json<ApiResponse<null>>(
        { success: false, error: 'Tarea no encontrada' },
        { status: 404 }
      );
    }

    return NextResponse.json<ApiResponse<{ id: number }>>({
      success: true,
      data: { id: parseInt(id) },
    });
  } catch (error) {
    console.error('Error al eliminar tarea:', error);
    return NextResponse.json<ApiResponse<null>>(
      { success: false, error: 'Error al eliminar tarea' },
      { status: 500 }
    );
  }
}
