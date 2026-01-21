import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

interface TaskStats {
  total_tasks: number;
  completed_tasks: number;
  pending_tasks: number;
  high_priority: number;
  medium_priority: number;
  low_priority: number;
}

interface CategoryStats {
  category_name: string;
  category_color: string;
  task_count: number;
  completed_count: number;
}

interface DailyStats {
  date: string;
  created: number;
  completed: number;
}

interface SubtaskStats {
  total_subtasks: number;
  completed_subtasks: number;
}

// GET - Obtener estadísticas del dashboard
export async function GET() {
  try {
    // Estadísticas generales de tareas
    const taskStats = await query<TaskStats>(`
      SELECT 
        COUNT(*) as total_tasks,
        COUNT(*) FILTER (WHERE completed = TRUE) as completed_tasks,
        COUNT(*) FILTER (WHERE completed = FALSE) as pending_tasks,
        COUNT(*) FILTER (WHERE priority = 'high') as high_priority,
        COUNT(*) FILTER (WHERE priority = 'medium') as medium_priority,
        COUNT(*) FILTER (WHERE priority = 'low') as low_priority
      FROM tasks
      WHERE user_id = (SELECT id FROM users WHERE email = 'john.doe@example.com')
    `);

    // Estadísticas por categoría
    const categoryStats = await query<CategoryStats>(`
      SELECT 
        COALESCE(c.name, 'Sin categoría') as category_name,
        COALESCE(c.color, 'bg-gray-500') as category_color,
        COUNT(t.id) as task_count,
        COUNT(t.id) FILTER (WHERE t.completed = TRUE) as completed_count
      FROM tasks t
      LEFT JOIN categories c ON t.category_id = c.id
      WHERE t.user_id = (SELECT id FROM users WHERE email = 'john.doe@example.com')
      GROUP BY c.id, c.name, c.color
      ORDER BY task_count DESC
    `);

    // Estadísticas de los últimos 7 días
    const dailyStats = await query<DailyStats>(`
      WITH dates AS (
        SELECT generate_series(
          CURRENT_DATE - INTERVAL '6 days',
          CURRENT_DATE,
          '1 day'::interval
        )::date as date
      )
      SELECT 
        d.date::text,
        COALESCE(COUNT(t.id) FILTER (WHERE t.created_at::date = d.date), 0) as created,
        COALESCE(COUNT(t.id) FILTER (WHERE t.completed = TRUE AND t.updated_at::date = d.date), 0) as completed
      FROM dates d
      LEFT JOIN tasks t ON t.user_id = (SELECT id FROM users WHERE email = 'john.doe@example.com')
      GROUP BY d.date
      ORDER BY d.date ASC
    `);

    // Estadísticas de subtareas
    const subtaskStats = await query<SubtaskStats>(`
      SELECT 
        COUNT(*) as total_subtasks,
        COUNT(*) FILTER (WHERE s.completed = TRUE) as completed_subtasks
      FROM subtasks s
      JOIN tasks t ON s.task_id = t.id
      WHERE t.user_id = (SELECT id FROM users WHERE email = 'john.doe@example.com')
    `);

    // Total de comentarios
    const commentStats = await query<{ total_comments: number }>(`
      SELECT COUNT(*) as total_comments
      FROM comments c
      JOIN tasks t ON c.task_id = t.id
      WHERE t.user_id = (SELECT id FROM users WHERE email = 'john.doe@example.com')
    `);

    // Tareas recientes
    const recentTasks = await query<{
      id: number;
      title: string;
      completed: boolean;
      priority: string;
      category_name: string;
      category_color: string;
      created_at: string;
    }>(`
      SELECT 
        t.id,
        t.title,
        t.completed,
        t.priority,
        COALESCE(c.name, 'Sin categoría') as category_name,
        COALESCE(c.color, 'bg-gray-500') as category_color,
        t.created_at
      FROM tasks t
      LEFT JOIN categories c ON t.category_id = c.id
      WHERE t.user_id = (SELECT id FROM users WHERE email = 'john.doe@example.com')
      ORDER BY t.created_at DESC
      LIMIT 5
    `);

    return NextResponse.json({
      success: true,
      data: {
        overview: taskStats[0] || {
          total_tasks: 0,
          completed_tasks: 0,
          pending_tasks: 0,
          high_priority: 0,
          medium_priority: 0,
          low_priority: 0,
        },
        byCategory: categoryStats,
        daily: dailyStats,
        subtasks: subtaskStats[0] || { total_subtasks: 0, completed_subtasks: 0 },
        comments: commentStats[0] || { total_comments: 0 },
        recentTasks,
      },
    });
  } catch (error) {
    console.error('Error al obtener estadísticas:', error);
    return NextResponse.json(
      { success: false, error: 'Error al obtener estadísticas' },
      { status: 500 }
    );
  }
}
