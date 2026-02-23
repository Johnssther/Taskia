import { NextRequest, NextResponse } from 'next/server';
import { query, execute } from '@/lib/db';
import { getCurrentUserId } from '@/lib/auth';
import { Project, UpdateProjectDTO, ApiResponse } from '@/lib/types';

interface RouteParams {
  params: Promise<{ id: string }>;
}

// GET - Obtener un proyecto por ID (solo si es del usuario)
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
    const projects = await query<Project>(
      'SELECT * FROM projects WHERE id = $1 AND user_id = $2',
      [id, userId]
    );

    if (projects.length === 0) {
      return NextResponse.json<ApiResponse<null>>(
        { success: false, error: 'Proyecto no encontrado' },
        { status: 404 }
      );
    }

    return NextResponse.json<ApiResponse<Project>>({
      success: true,
      data: projects[0],
    });
  } catch (error) {
    console.error('Error al obtener proyecto:', error);
    return NextResponse.json<ApiResponse<null>>(
      { success: false, error: 'Error al obtener proyecto' },
      { status: 500 }
    );
  }
}

// PUT - Actualizar proyecto (solo si es del usuario)
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
    const body: UpdateProjectDTO = await request.json();

    if (body.name !== undefined && !body.name.trim()) {
      return NextResponse.json<ApiResponse<null>>(
        { success: false, error: 'El nombre no puede estar vacío' },
        { status: 400 }
      );
    }

    const updates: string[] = [];
    const values: unknown[] = [];
    let paramCount = 1;

    if (body.name !== undefined) {
      updates.push(`name = $${paramCount++}`);
      values.push(body.name.trim());
    }

    if (updates.length === 0) {
      return NextResponse.json<ApiResponse<null>>(
        { success: false, error: 'No hay campos para actualizar' },
        { status: 400 }
      );
    }

    values.push(id, userId);
    const result = await execute(
      `UPDATE projects SET ${updates.join(', ')}, updated_at = CURRENT_TIMESTAMP
       WHERE id = $${paramCount} AND user_id = $${paramCount + 1} RETURNING *`,
      values
    );

    if (result.rowCount === 0) {
      return NextResponse.json<ApiResponse<null>>(
        { success: false, error: 'Proyecto no encontrado' },
        { status: 404 }
      );
    }

    return NextResponse.json<ApiResponse<Project>>({
      success: true,
      data: result.rows[0] as Project,
    });
  } catch (error) {
    console.error('Error al actualizar proyecto:', error);
    return NextResponse.json<ApiResponse<null>>(
      { success: false, error: 'Error al actualizar proyecto' },
      { status: 500 }
    );
  }
}

// DELETE - Eliminar proyecto (solo si es del usuario)
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
      `DELETE FROM projects WHERE id = $1 AND user_id = $2 RETURNING id`,
      [id, userId]
    );

    if (result.rowCount === 0) {
      return NextResponse.json<ApiResponse<null>>(
        { success: false, error: 'Proyecto no encontrado' },
        { status: 404 }
      );
    }

    return NextResponse.json<ApiResponse<{ id: number }>>({
      success: true,
      data: { id: parseInt(id, 10) },
    });
  } catch (error) {
    console.error('Error al eliminar proyecto:', error);
    return NextResponse.json<ApiResponse<null>>(
      { success: false, error: 'Error al eliminar proyecto' },
      { status: 500 }
    );
  }
}
