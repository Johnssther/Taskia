import { NextRequest, NextResponse } from 'next/server';
import { query, execute } from '@/lib/db';
import { getCurrentUserId } from '@/lib/auth';
import { Task, Subtask, Comment, CreateTaskDTO, ApiResponse } from '@/lib/types';

interface TaskWithRelations extends Task {
  subtasks: Subtask[];
  comments: (Comment & { author: string })[];
}

// GET - Obtener todas las tareas del usuario con subtareas y comentarios
export async function GET(request: NextRequest) {
  try {
    const userId = await getCurrentUserId(request);
    if (userId === null) {
      return NextResponse.json<ApiResponse<null>>(
        { success: false, error: 'No autorizado' },
        { status: 401 }
      );
    }

    const tasks = await query<Task>(
      `SELECT t.* FROM tasks t
       WHERE t.user_id = $1
       ORDER BY t.created_at DESC`,
      [userId]
    );

    // Obtener subtareas para todas las tareas
    const taskIds = tasks.map(t => t.id);
    
    let subtasks: Subtask[] = [];
    let comments: (Comment & { author: string })[] = [];

    if (taskIds.length > 0) {
      subtasks = await query<Subtask>(
        `SELECT * FROM subtasks WHERE task_id = ANY($1) ORDER BY created_at ASC`,
        [taskIds]
      );

      // Obtener comentarios con nombre del autor
      comments = await query<Comment & { author: string }>(
        `SELECT c.*, (u.first_name || ' ' || u.last_name) as author 
         FROM comments c 
         LEFT JOIN users u ON c.user_id = u.id 
         WHERE c.task_id = ANY($1) 
         ORDER BY c.created_at ASC`,
        [taskIds]
      );
    }

    // Agrupar subtareas y comentarios por tarea
    const tasksWithRelations: TaskWithRelations[] = tasks.map(task => ({
      ...task,
      subtasks: subtasks.filter(s => s.task_id === task.id),
      comments: comments.filter(c => c.task_id === task.id),
    }));

    return NextResponse.json<ApiResponse<TaskWithRelations[]>>({
      success: true,
      data: tasksWithRelations,
    });
  } catch (error) {
    console.error('Error al obtener tareas:', error);
    return NextResponse.json<ApiResponse<null>>(
      { success: false, error: 'Error al obtener tareas' },
      { status: 500 }
    );
  }
}

// POST - Crear nueva tarea
export async function POST(request: NextRequest) {
  try {
    const userId = await getCurrentUserId(request);
    if (userId === null) {
      return NextResponse.json<ApiResponse<null>>(
        { success: false, error: 'No autorizado' },
        { status: 401 }
      );
    }

    const body: CreateTaskDTO = await request.json();

    if (!body.title) {
      return NextResponse.json<ApiResponse<null>>(
        { success: false, error: 'El título es requerido' },
        { status: 400 }
      );
    }

    const result = await execute(
      `INSERT INTO tasks (title, description, priority, due_date, category_id, estimated_time, user_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [
        body.title,
        body.description || null,
        body.priority || 'medium',
        body.due_date || null,
        body.category_id || null,
        body.estimated_time || null,
        userId,
      ]
    );

    const newTask = result.rows[0] as Task;

    // Crear subtareas si se proporcionaron
    let subtasks: Subtask[] = [];
    if (body.subtasks && body.subtasks.length > 0) {
      for (const subtask of body.subtasks) {
        const subtaskResult = await execute(
          'INSERT INTO subtasks (title, task_id) VALUES ($1, $2) RETURNING *',
          [subtask.title, newTask.id]
        );
        subtasks.push(subtaskResult.rows[0] as Subtask);
      }
    }

    return NextResponse.json<ApiResponse<TaskWithRelations>>({
      success: true,
      data: { ...newTask, subtasks, comments: [] },
    }, { status: 201 });
  } catch (error) {
    console.error('Error al crear tarea:', error);
    return NextResponse.json<ApiResponse<null>>(
      { success: false, error: 'Error al crear tarea' },
      { status: 500 }
    );
  }
}
