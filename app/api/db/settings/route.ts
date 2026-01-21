import { NextRequest, NextResponse } from 'next/server';
import { query, execute } from '@/lib/db';

interface Settings {
  id: number;
  user_id: number;
  theme: 'light' | 'dark' | 'system';
  language: 'es' | 'en' | 'pt';
  default_priority: 'low' | 'medium' | 'high';
  default_category_id: number | null;
  show_completed_tasks: boolean;
  auto_archive_completed: boolean;
  archive_after_days: number;
  notifications_enabled: boolean;
  email_notifications: boolean;
  notification_sound: boolean;
  daily_summary: boolean;
  reminder_before_due: number;
  ai_suggestions_enabled: boolean;
  ai_auto_categorize: boolean;
  ai_model: string;
  tasks_per_page: number;
  default_view: 'list' | 'board' | 'calendar';
  show_subtasks_inline: boolean;
  compact_mode: boolean;
  max_categories: number;
  show_empty_categories: boolean;
  category_sort_order: 'manual' | 'alphabetical' | 'task_count';
  created_at: string;
  updated_at: string;
}

// GET - Obtener configuración del usuario
export async function GET() {
  try {
    const settings = await query<Settings>(
      `SELECT s.*, c.name as default_category_name
       FROM settings s
       LEFT JOIN categories c ON s.default_category_id = c.id
       WHERE s.user_id = (SELECT id FROM users WHERE email = 'john.doe@example.com')`
    );

    if (settings.length === 0) {
      // Crear configuración por defecto si no existe
      const result = await execute(
        `INSERT INTO settings (user_id)
         SELECT id FROM users WHERE email = 'john.doe@example.com'
         ON CONFLICT (user_id) DO NOTHING
         RETURNING *`
      );
      
      if (result.rows.length > 0) {
        return NextResponse.json({
          success: true,
          data: result.rows[0],
        });
      }
      
      // Intentar obtener de nuevo
      const newSettings = await query<Settings>(
        `SELECT * FROM settings WHERE user_id = (SELECT id FROM users WHERE email = 'john.doe@example.com')`
      );
      
      return NextResponse.json({
        success: true,
        data: newSettings[0] || null,
      });
    }

    return NextResponse.json({
      success: true,
      data: settings[0],
    });
  } catch (error) {
    console.error('Error al obtener configuración:', error);
    return NextResponse.json(
      { success: false, error: 'Error al obtener configuración' },
      { status: 500 }
    );
  }
}

// PUT - Actualizar configuración
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();

    // Construir query dinámicamente
    const allowedFields = [
      'theme', 'language', 'default_priority', 'default_category_id',
      'show_completed_tasks', 'auto_archive_completed', 'archive_after_days',
      'notifications_enabled', 'email_notifications', 'notification_sound',
      'daily_summary', 'reminder_before_due', 'ai_suggestions_enabled',
      'ai_auto_categorize', 'ai_model', 'tasks_per_page', 'default_view',
      'show_subtasks_inline', 'compact_mode', 'max_categories',
      'show_empty_categories', 'category_sort_order'
    ];

    const updates: string[] = [];
    const values: unknown[] = [];
    let paramCount = 1;

    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        updates.push(`${field} = $${paramCount++}`);
        values.push(body[field]);
      }
    }

    if (updates.length === 0) {
      return NextResponse.json(
        { success: false, error: 'No hay campos para actualizar' },
        { status: 400 }
      );
    }

    const result = await execute(
      `UPDATE settings SET ${updates.join(', ')} 
       WHERE user_id = (SELECT id FROM users WHERE email = 'john.doe@example.com')
       RETURNING *`,
      values
    );

    if (result.rowCount === 0) {
      return NextResponse.json(
        { success: false, error: 'Configuración no encontrada' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: result.rows[0],
    });
  } catch (error) {
    console.error('Error al actualizar configuración:', error);
    return NextResponse.json(
      { success: false, error: 'Error al actualizar configuración' },
      { status: 500 }
    );
  }
}
