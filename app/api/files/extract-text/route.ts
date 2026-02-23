import { NextRequest, NextResponse } from 'next/server';

const ALLOWED_TYPES = [
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // .docx
  'application/vnd.openxmlformats-officedocument.presentationml.presentation', // .pptx
  'application/msword', // .doc
  'application/vnd.ms-powerpoint', // .ppt
];
const ALLOWED_EXT = ['.pdf', '.doc', '.docx', '.ppt', '.pptx', '.csv', '.txt', '.xls', '.xlsx'];
const MAX_FILE_SIZE = 15 * 1024 * 1024; // 15 MB
const MAX_TEXT_LENGTH = 25000; // caracteres por archivo para no exceder contexto de IA

function hasAllowedExt(name: string): boolean {
  const lower = name.toLowerCase();
  return ALLOWED_EXT.some((ext) => lower.endsWith(ext));
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const files = formData.getAll('files') as File[];
    if (!files?.length) {
      return NextResponse.json(
        { success: false, error: 'No se enviaron archivos' },
        { status: 400 }
      );
    }

    const { parseOffice } = await import('officeparser');
    const results: { name: string; text: string; error?: string }[] = [];

    for (const file of files) {
      const name = file.name || 'archivo';
      if (!hasAllowedExt(name)) {
        results.push({ name, text: '', error: 'Tipo no permitido. Usa PDF, Word (.doc, .docx), PowerPoint (.ppt, .pptx), CSV, TXT, XLS o XLSX.' });
        continue;
      }
      if (file.size > MAX_FILE_SIZE) {
        results.push({ name, text: '', error: 'Archivo demasiado grande (máx. 15 MB).' });
        continue;
      }

      try {
        const buf = Buffer.from(await file.arrayBuffer());
        const ast = await parseOffice(buf, { newlineDelimiter: '\n' });
        const rawText = typeof (ast as { toText?: () => string }).toText === 'function'
          ? (ast as { toText: () => string }).toText()
          : String((ast as { content?: unknown })?.content ?? '');
        const text = rawText.slice(0, MAX_TEXT_LENGTH);
        if (rawText.length > MAX_TEXT_LENGTH) {
          results.push({ name, text: text + '\n[... texto recortado por límite ...]' });
        } else {
          results.push({ name, text });
        }
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Error al extraer texto';
        results.push({ name, text: '', error: msg });
      }
    }

    return NextResponse.json({ success: true, results });
  } catch (error) {
    console.error('Error en extract-text:', error);
    return NextResponse.json(
      { success: false, error: 'Error al procesar los archivos' },
      { status: 500 }
    );
  }
}
