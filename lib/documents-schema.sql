-- Tabla de documentos (archivos adjuntos) con referencia genérica ref_table + ref_id
-- Ejecutar: psql -U postgres -d db_taskia -f lib/documents-schema.sql

CREATE TABLE IF NOT EXISTS documents (
    id SERIAL PRIMARY KEY,
    ref_table VARCHAR(64) NOT NULL,
    ref_id INTEGER NOT NULL,
    original_filename VARCHAR(255) NOT NULL,
    file_path VARCHAR(512) NOT NULL,
    mime_type VARCHAR(128),
    size_bytes BIGINT,
    extracted_text TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_documents_ref ON documents(ref_table, ref_id);

COMMENT ON TABLE documents IS 'Archivos adjuntos referenciados por ref_table (ej: tasks) y ref_id (ej: id de tarea)';
COMMENT ON COLUMN documents.ref_table IS 'Nombre de la tabla referenciada (ej: tasks)';
COMMENT ON COLUMN documents.ref_id IS 'ID del registro en ref_table (ej: id de la tarea)';
COMMENT ON COLUMN documents.file_path IS 'Ruta relativa dentro de /files (ej: tasks/123/abc.pdf)';
COMMENT ON COLUMN documents.extracted_text IS 'Texto extraído del archivo para contexto de IA';
