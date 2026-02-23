-- Proyectos: cada proyecto tiene muchas categorías de tareas
-- Ejecutar después de schema.sql (o en DB existente):
--   psql -U postgres -d db_taskia -f lib/projects-schema.sql

-- Tabla de proyectos
CREATE TABLE IF NOT EXISTS projects (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_projects_user_id ON projects(user_id);

-- Añadir project_id a categorías (nullable para migración)
ALTER TABLE categories ADD COLUMN IF NOT EXISTS project_id INTEGER REFERENCES projects(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS idx_categories_project_id ON categories(project_id);

-- Crear proyecto por defecto y asignar categorías existentes
INSERT INTO projects (name, user_id)
SELECT 'General', id FROM users WHERE email = 'john.doe@example.com'
ON CONFLICT DO NOTHING;

-- Asignar categorías sin proyecto al proyecto General
UPDATE categories
SET project_id = (SELECT id FROM projects WHERE user_id = categories.user_id ORDER BY id ASC LIMIT 1)
WHERE project_id IS NULL;

-- Hacer project_id obligatorio para nuevas categorías (opcional: descomentar para forzar NOT NULL)
-- ALTER TABLE categories ALTER COLUMN project_id SET NOT NULL;

-- Trigger para actualizar updated_at en projects
DROP TRIGGER IF EXISTS update_projects_updated_at ON projects;
CREATE TRIGGER update_projects_updated_at
    BEFORE UPDATE ON projects
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
