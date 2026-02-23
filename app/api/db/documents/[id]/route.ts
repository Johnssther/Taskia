import { NextRequest, NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';
import { queryOne, query, execute } from '@/lib/db';
import { getCurrentUserId } from '@/lib/auth';
import { Document, ApiResponse } from '@/lib/types';

const FILES_ROOT = path.join(process.cwd(), 'files');

// GET - Obtener un documento (solo si el recurso referenciado es del usuario)
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = await getCurrentUserId(request);
    if (userId === null) {
      return NextResponse.json<ApiResponse<null>>(
        { success: false, error: 'No autorizado' },
        { status: 401 }
      );
    }

    const { id } = await params;
    const idNum = parseInt(id, 10);
    if (isNaN(idNum)) {
      return NextResponse.json<ApiResponse<null>>(
        { success: false, error: 'ID inválido' },
        { status: 400 }
      );
    }
    const doc = await queryOne<Document>(
      'SELECT * FROM documents WHERE id = $1',
      [idNum]
    );
    if (!doc) {
      return NextResponse.json<ApiResponse<null>>(
        { success: false, error: 'Documento no encontrado' },
        { status: 404 }
      );
    }
    if (doc.ref_table === 'tasks') {
      const taskCheck = await query<{ id: number }>(
        'SELECT id FROM tasks WHERE id = $1 AND user_id = $2',
        [doc.ref_id, userId]
      );
      if (taskCheck.length === 0) {
        return NextResponse.json<ApiResponse<null>>(
          { success: false, error: 'Documento no encontrado' },
          { status: 404 }
        );
      }
    }
    return NextResponse.json<ApiResponse<Document>>({ success: true, data: doc });
  } catch (error) {
    console.error('Error obteniendo documento:', error);
    return NextResponse.json<ApiResponse<null>>(
      { success: false, error: 'Error al obtener documento' },
      { status: 500 }
    );
  }
}

// DELETE - Eliminar documento (solo si el recurso referenciado es del usuario)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = await getCurrentUserId(request);
    if (userId === null) {
      return NextResponse.json<ApiResponse<null>>(
        { success: false, error: 'No autorizado' },
        { status: 401 }
      );
    }

    const { id } = await params;
    const idNum = parseInt(id, 10);
    if (isNaN(idNum)) {
      return NextResponse.json<ApiResponse<null>>(
        { success: false, error: 'ID inválido' },
        { status: 400 }
      );
    }
    const doc = await queryOne<Document>(
      'SELECT * FROM documents WHERE id = $1',
      [idNum]
    );
    if (!doc) {
      return NextResponse.json<ApiResponse<null>>(
        { success: false, error: 'Documento no encontrado' },
        { status: 404 }
      );
    }
    if (doc.ref_table === 'tasks') {
      const taskCheck = await query<{ id: number }>(
        'SELECT id FROM tasks WHERE id = $1 AND user_id = $2',
        [doc.ref_id, userId]
      );
      if (taskCheck.length === 0) {
        return NextResponse.json<ApiResponse<null>>(
          { success: false, error: 'Documento no encontrado' },
          { status: 404 }
        );
      }
    }

    const absolutePath = path.join(FILES_ROOT, doc.file_path);
    try {
      await fs.unlink(absolutePath);
    } catch (err) {
      console.warn('No se pudo eliminar archivo del disco:', absolutePath, err);
    }

    await execute('DELETE FROM documents WHERE id = $1', [idNum]);
    return NextResponse.json<ApiResponse<{ deleted: true }>>({
      success: true,
      data: { deleted: true },
    });
  } catch (error) {
    console.error('Error eliminando documento:', error);
    return NextResponse.json<ApiResponse<null>>(
      { success: false, error: 'Error al eliminar documento' },
      { status: 500 }
    );
  }
}
