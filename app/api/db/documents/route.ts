import { NextRequest, NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';
import { query, execute } from '@/lib/db';
import { getCurrentUserId } from '@/lib/auth';
import { Document, ApiResponse } from '@/lib/types';

const FILES_ROOT = path.join(process.cwd(), 'files');
const ALLOWED_EXT = ['.pdf', '.doc', '.docx', '.ppt', '.pptx', '.csv', '.txt', '.xls', '.xlsx'];
const MAX_FILE_SIZE = 15 * 1024 * 1024; // 15 MB
const MAX_TEXT_LENGTH = 25000;

function hasAllowedExt(name: string): boolean {
  const lower = name.toLowerCase();
  return ALLOWED_EXT.some((ext) => lower.endsWith(ext));
}

function sanitizeFileName(name: string): string {
  const base = path.basename(name);
  return base.replace(/[^a-zA-Z0-9._-]/g, '_').slice(0, 200) || 'file';
}

// GET - Listar documentos por ref_table y ref_id (solo si el recurso es del usuario)
export async function GET(request: NextRequest) {
  try {
    const userId = await getCurrentUserId(request);
    if (userId === null) {
      return NextResponse.json<ApiResponse<null>>(
        { success: false, error: 'No autorizado' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const refTable = searchParams.get('ref_table');
    const refId = searchParams.get('ref_id');

    if (!refTable || !refId) {
      return NextResponse.json<ApiResponse<null>>(
        { success: false, error: 'ref_table y ref_id son requeridos' },
        { status: 400 }
      );
    }
    const refIdNum = parseInt(refId, 10);
    if (isNaN(refIdNum)) {
      return NextResponse.json<ApiResponse<null>>(
        { success: false, error: 'ref_id debe ser un número' },
        { status: 400 }
      );
    }

    if (refTable === 'tasks') {
      const rows = await query<Document>(
        `SELECT d.id, d.ref_id, d.ref_table, d.original_filename, d.file_path, d.mime_type, d.size_bytes, d.extracted_text, d.created_at
         FROM documents d
         INNER JOIN tasks t ON t.id = d.ref_id AND d.ref_table = 'tasks' AND t.user_id = $3
         WHERE d.ref_table = $1 AND d.ref_id = $2
         ORDER BY d.created_at ASC`,
        [refTable, refIdNum, userId]
      );
      return NextResponse.json<ApiResponse<Document[]>>({ success: true, data: rows });
    }

    const rows = await query<Document>(
      `SELECT id, ref_id, ref_table, original_filename, file_path, mime_type, size_bytes, extracted_text, created_at
       FROM documents WHERE ref_table = $1 AND ref_id = $2 ORDER BY created_at ASC`,
      [refTable, refIdNum]
    );
    return NextResponse.json<ApiResponse<Document[]>>({ success: true, data: rows });
  } catch (error) {
    console.error('Error listando documentos:', error);
    return NextResponse.json<ApiResponse<null>>(
      { success: false, error: 'Error al listar documentos' },
      { status: 500 }
    );
  }
}

// POST - Subir archivo(s) (solo a recursos que pertenecen al usuario)
export async function POST(request: NextRequest) {
  try {
    const userId = await getCurrentUserId(request);
    if (userId === null) {
      return NextResponse.json<ApiResponse<null>>(
        { success: false, error: 'No autorizado' },
        { status: 401 }
      );
    }

    const formData = await request.formData();
    const refTable = formData.get('ref_table') as string | null;
    const refIdRaw = formData.get('ref_id') as string | null;
    const files = formData.getAll('files') as File[];

    if (!refTable || !refIdRaw || !files?.length) {
      return NextResponse.json<ApiResponse<null>>(
        { success: false, error: 'ref_table, ref_id y al menos un archivo son requeridos' },
        { status: 400 }
      );
    }
    const refId = parseInt(refIdRaw, 10);
    if (isNaN(refId)) {
      return NextResponse.json<ApiResponse<null>>(
        { success: false, error: 'ref_id debe ser un número' },
        { status: 400 }
      );
    }

    if (refTable === 'tasks') {
      const taskCheck = await query<{ id: number }>(
        'SELECT id FROM tasks WHERE id = $1 AND user_id = $2',
        [refId, userId]
      );
      if (taskCheck.length === 0) {
        return NextResponse.json<ApiResponse<null>>(
          { success: false, error: 'Tarea no encontrada' },
          { status: 404 }
        );
      }
    }

    const dir = path.join(FILES_ROOT, refTable, String(refId));
    await fs.mkdir(dir, { recursive: true });

    const { parseOffice } = await import('officeparser');
    const inserted: Document[] = [];

    for (const file of files) {
      const originalName = file.name || 'archivo';
      if (!hasAllowedExt(originalName)) {
        continue;
      }
      if (file.size > MAX_FILE_SIZE) {
        continue;
      }

      const ext = path.extname(originalName).toLowerCase() || path.extname(originalName);
      const safeName = sanitizeFileName(path.basename(originalName, ext) + ext);
      const uniqueName = `${Date.now()}-${safeName}`;
      const relativePath = path.join(refTable, String(refId), uniqueName);
      const absolutePath = path.join(FILES_ROOT, relativePath);

      const buf = Buffer.from(await file.arrayBuffer());
      await fs.writeFile(absolutePath, buf);

      let extractedText: string | null = null;
      try {
        const ast = await parseOffice(buf, { newlineDelimiter: '\n' });
        const rawText = typeof (ast as { toText?: () => string }).toText === 'function'
          ? (ast as { toText: () => string }).toText()
          : String((ast as { content?: unknown })?.content ?? '');
        extractedText = rawText.slice(0, MAX_TEXT_LENGTH) || null;
      } catch {
        // Si falla la extracción, guardamos igual sin texto
      }

      const result = await execute(
        `INSERT INTO documents (ref_id, ref_table, original_filename, file_path, mime_type, size_bytes, extracted_text)
         VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
        [refId, refTable, originalName, relativePath.replace(/\\/g, '/'), file.type || null, file.size, extractedText]
      );
      const row = result.rows[0] as Document;
      inserted.push(row);
    }

    return NextResponse.json<ApiResponse<Document[]>>({ success: true, data: inserted }, { status: 201 });
  } catch (error) {
    console.error('Error subiendo documentos:', error);
    return NextResponse.json<ApiResponse<null>>(
      { success: false, error: 'Error al subir documentos' },
      { status: 500 }
    );
  }
}
