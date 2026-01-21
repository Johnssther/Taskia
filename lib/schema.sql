-- Esquema de base de datos para TaskIA
-- Base de datos: db_taskia

-- Crear la base de datos (ejecutar como superusuario si es necesario)
-- CREATE DATABASE db_taskia;

-- Tabla de usuarios
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255),
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    avatar_url TEXT,
    bio TEXT,
    phone VARCHAR(20),
    location VARCHAR(255),
    website VARCHAR(255),
    job_title VARCHAR(150),
    company VARCHAR(150),
    is_premium BOOLEAN DEFAULT FALSE,
    email_verified BOOLEAN DEFAULT FALSE,
    last_login TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Insertar usuario por defecto
INSERT INTO users (email, first_name, last_name, is_premium, email_verified) 
VALUES ('john.doe@example.com', 'John', 'Doe', TRUE, TRUE)
ON CONFLICT (email) DO NOTHING;

-- Tabla de categorías
CREATE TABLE IF NOT EXISTS categories (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    color VARCHAR(50) NOT NULL DEFAULT 'bg-gray-500',
    icon VARCHAR(10) DEFAULT '📋',
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    is_default BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Crear índice para búsqueda por usuario
CREATE INDEX IF NOT EXISTS idx_categories_user_id ON categories(user_id);

-- Insertar categoría por defecto
INSERT INTO categories (name, color, icon, user_id, is_default)
SELECT 'General', 'bg-gray-500', '📋', id, TRUE
FROM users WHERE email = 'john.doe@example.com'
ON CONFLICT DO NOTHING;

-- Tabla de tareas
CREATE TABLE IF NOT EXISTS tasks (
    id SERIAL PRIMARY KEY,
    title VARCHAR(500) NOT NULL,
    description TEXT,
    completed BOOLEAN DEFAULT FALSE,
    priority VARCHAR(20) DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high')),
    due_date TIMESTAMP WITH TIME ZONE,
    category_id INTEGER REFERENCES categories(id) ON DELETE SET NULL,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    ai_suggestions TEXT[], -- Array de sugerencias de IA
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Crear índices para búsqueda
CREATE INDEX IF NOT EXISTS idx_tasks_user_id ON tasks(user_id);
CREATE INDEX IF NOT EXISTS idx_tasks_category_id ON tasks(category_id);
CREATE INDEX IF NOT EXISTS idx_tasks_completed ON tasks(completed);
CREATE INDEX IF NOT EXISTS idx_tasks_priority ON tasks(priority);

-- Tabla de subtareas
CREATE TABLE IF NOT EXISTS subtasks (
    id SERIAL PRIMARY KEY,
    title VARCHAR(500) NOT NULL,
    completed BOOLEAN DEFAULT FALSE,
    task_id INTEGER REFERENCES tasks(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Crear índice para búsqueda por tarea
CREATE INDEX IF NOT EXISTS idx_subtasks_task_id ON subtasks(task_id);

-- Tabla de comentarios
CREATE TABLE IF NOT EXISTS comments (
    id SERIAL PRIMARY KEY,
    text TEXT NOT NULL,
    task_id INTEGER REFERENCES tasks(id) ON DELETE CASCADE,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Crear índices para búsqueda
CREATE INDEX IF NOT EXISTS idx_comments_task_id ON comments(task_id);
CREATE INDEX IF NOT EXISTS idx_comments_user_id ON comments(user_id);

-- Función para actualizar el campo updated_at automáticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers para actualizar updated_at
DROP TRIGGER IF EXISTS update_users_updated_at ON users;
CREATE TRIGGER update_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_categories_updated_at ON categories;
CREATE TRIGGER update_categories_updated_at
    BEFORE UPDATE ON categories
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_tasks_updated_at ON tasks;
CREATE TRIGGER update_tasks_updated_at
    BEFORE UPDATE ON tasks
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_subtasks_updated_at ON subtasks;
CREATE TRIGGER update_subtasks_updated_at
    BEFORE UPDATE ON subtasks
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_comments_updated_at ON comments;
CREATE TRIGGER update_comments_updated_at
    BEFORE UPDATE ON comments
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Vista para obtener tareas con información completa
CREATE OR REPLACE VIEW tasks_with_details AS
SELECT 
    t.id,
    t.title,
    t.description,
    t.completed,
    t.priority,
    t.due_date,
    t.category_id,
    t.user_id,
    t.ai_suggestions,
    t.created_at,
    t.updated_at,
    c.name as category_name,
    c.color as category_color,
    c.icon as category_icon,
    (u.first_name || ' ' || u.last_name) as user_name,
    (SELECT COUNT(*) FROM subtasks s WHERE s.task_id = t.id) as subtask_count,
    (SELECT COUNT(*) FROM subtasks s WHERE s.task_id = t.id AND s.completed = TRUE) as completed_subtask_count,
    (SELECT COUNT(*) FROM comments cm WHERE cm.task_id = t.id) as comment_count
FROM tasks t
LEFT JOIN categories c ON t.category_id = c.id
LEFT JOIN users u ON t.user_id = u.id;
