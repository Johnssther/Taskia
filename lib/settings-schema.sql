-- Esquema de la tabla de configuración para TaskIA
-- Base de datos: db_taskia

-- Tabla de configuración de usuario
CREATE TABLE IF NOT EXISTS settings (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    
    -- Configuración general
    theme VARCHAR(20) DEFAULT 'system' CHECK (theme IN ('light', 'dark', 'system')),
    language VARCHAR(10) DEFAULT 'es' CHECK (language IN ('es', 'en', 'pt')),
    
    -- Configuración de tareas
    default_priority VARCHAR(20) DEFAULT 'medium' CHECK (default_priority IN ('low', 'medium', 'high')),
    default_category_id INTEGER REFERENCES categories(id) ON DELETE SET NULL,
    show_completed_tasks BOOLEAN DEFAULT TRUE,
    auto_archive_completed BOOLEAN DEFAULT FALSE,
    task_timer_auto_start BOOLEAN DEFAULT FALSE,
    archive_after_days INTEGER DEFAULT 7,
    
    -- Configuración de notificaciones
    notifications_enabled BOOLEAN DEFAULT TRUE,
    email_notifications BOOLEAN DEFAULT FALSE,
    notification_sound BOOLEAN DEFAULT TRUE,
    daily_summary BOOLEAN DEFAULT FALSE,
    reminder_before_due INTEGER DEFAULT 24, -- horas antes de la fecha límite
    
    -- Configuración de IA
    ai_suggestions_enabled BOOLEAN DEFAULT TRUE,
    ai_auto_categorize BOOLEAN DEFAULT FALSE,
    ai_model VARCHAR(50) DEFAULT 'gpt-4o-mini',
    
    -- Configuración de vista
    tasks_per_page INTEGER DEFAULT 20,
    default_view VARCHAR(20) DEFAULT 'list' CHECK (default_view IN ('list', 'board', 'calendar')),
    show_subtasks_inline BOOLEAN DEFAULT TRUE,
    compact_mode BOOLEAN DEFAULT FALSE,
    
    -- Configuración de categorías
    max_categories INTEGER DEFAULT 10,
    show_empty_categories BOOLEAN DEFAULT TRUE,
    category_sort_order VARCHAR(20) DEFAULT 'manual' CHECK (category_sort_order IN ('manual', 'alphabetical', 'task_count')),
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    -- Restricción de unicidad por usuario
    UNIQUE(user_id)
);

-- Crear índice para búsqueda por usuario
CREATE INDEX IF NOT EXISTS idx_settings_user_id ON settings(user_id);

-- Trigger para actualizar updated_at
DROP TRIGGER IF EXISTS update_settings_updated_at ON settings;
CREATE TRIGGER update_settings_updated_at
    BEFORE UPDATE ON settings
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Insertar configuración por defecto para el usuario existente
INSERT INTO settings (user_id)
SELECT id FROM users WHERE email = 'john.doe@example.com'
ON CONFLICT (user_id) DO NOTHING;
