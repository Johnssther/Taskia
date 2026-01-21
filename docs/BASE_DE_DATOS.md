# Base de Datos - TaskIA

## Visión General

TaskIA utiliza **PostgreSQL** como sistema de gestión de base de datos relacional. El esquema está diseñado para soportar gestión de tareas con categorías, subtareas, comentarios y configuración de usuario.

## Diagrama Entidad-Relación

```
┌─────────────────┐       ┌─────────────────┐
│     users       │       │    settings     │
├─────────────────┤       ├─────────────────┤
│ id (PK)         │◄──────│ user_id (FK)    │
│ email           │       │ theme           │
│ first_name      │       │ language        │
│ last_name       │       │ default_priority│
│ avatar_url      │       │ ...             │
│ bio             │       └─────────────────┘
│ phone           │
│ location        │       ┌─────────────────┐
│ website         │       │   categories    │
│ job_title       │       ├─────────────────┤
│ company         │◄──────│ user_id (FK)    │
│ is_premium      │       │ id (PK)         │
│ email_verified  │       │ name            │
│ last_login      │       │ color           │
│ created_at      │       │ icon            │
│ updated_at      │       │ is_default      │
└─────────────────┘       └────────┬────────┘
        │                          │
        │                          │
        ▼                          ▼
┌─────────────────┐       ┌─────────────────┐
│     tasks       │◄──────│ category_id(FK) │
├─────────────────┤       └─────────────────┘
│ id (PK)         │
│ title           │       ┌─────────────────┐
│ description     │       │    subtasks     │
│ completed       │       ├─────────────────┤
│ priority        │◄──────│ task_id (FK)    │
│ due_date        │       │ id (PK)         │
│ category_id(FK) │       │ title           │
│ user_id (FK)    │       │ completed       │
│ ai_suggestions  │       └─────────────────┘
│ time_spent      │
│ estimated_time  │       ┌─────────────────┐
│ created_at      │       │    comments     │
│ updated_at      │       ├─────────────────┤
└─────────────────┘◄──────│ task_id (FK)    │
                          │ id (PK)         │
                          │ text            │
                          │ user_id (FK)    │
                          └─────────────────┘
```

## Tablas

### 1. users

Almacena información de los usuarios del sistema.

```sql
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
```

| Columna | Tipo | Descripción |
|---------|------|-------------|
| id | SERIAL | Identificador único |
| email | VARCHAR(255) | Email único del usuario |
| password_hash | VARCHAR(255) | Hash de contraseña (bcrypt) |
| first_name | VARCHAR(100) | Nombre |
| last_name | VARCHAR(100) | Apellido |
| avatar_url | TEXT | URL de imagen de perfil |
| bio | TEXT | Biografía del usuario |
| phone | VARCHAR(20) | Teléfono |
| location | VARCHAR(255) | Ubicación |
| website | VARCHAR(255) | Sitio web personal |
| job_title | VARCHAR(150) | Cargo laboral |
| company | VARCHAR(150) | Empresa |
| is_premium | BOOLEAN | Plan premium activo |
| email_verified | BOOLEAN | Email verificado |
| last_login | TIMESTAMP | Último acceso |
| created_at | TIMESTAMP | Fecha de creación |
| updated_at | TIMESTAMP | Última actualización |

### 2. categories

Categorías para organizar tareas.

```sql
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
```

| Columna | Tipo | Descripción |
|---------|------|-------------|
| id | SERIAL | Identificador único |
| name | VARCHAR(255) | Nombre de la categoría |
| color | VARCHAR(50) | Clase CSS de color (ej: bg-blue-500) |
| icon | VARCHAR(10) | Emoji o icono |
| user_id | INTEGER | FK a users |
| is_default | BOOLEAN | Categoría por defecto del sistema |
| created_at | TIMESTAMP | Fecha de creación |
| updated_at | TIMESTAMP | Última actualización |

### 3. tasks

Tareas principales del sistema.

```sql
CREATE TABLE IF NOT EXISTS tasks (
    id SERIAL PRIMARY KEY,
    title VARCHAR(500) NOT NULL,
    description TEXT,
    completed BOOLEAN DEFAULT FALSE,
    priority VARCHAR(20) DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high')),
    due_date TIMESTAMP WITH TIME ZONE,
    category_id INTEGER REFERENCES categories(id) ON DELETE SET NULL,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    ai_suggestions TEXT[],
    time_spent INTEGER DEFAULT 0,
    estimated_time INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
```

| Columna | Tipo | Descripción |
|---------|------|-------------|
| id | SERIAL | Identificador único |
| title | VARCHAR(500) | Título de la tarea |
| description | TEXT | Descripción detallada |
| completed | BOOLEAN | Estado de completado |
| priority | VARCHAR(20) | Prioridad: low, medium, high |
| due_date | TIMESTAMP | Fecha límite |
| category_id | INTEGER | FK a categories |
| user_id | INTEGER | FK a users |
| ai_suggestions | TEXT[] | Array de sugerencias de IA |
| time_spent | INTEGER | Tiempo trabajado en segundos |
| estimated_time | INTEGER | Tiempo estimado en segundos |
| created_at | TIMESTAMP | Fecha de creación |
| updated_at | TIMESTAMP | Última actualización |

### 4. subtasks

Subtareas asociadas a tareas principales.

```sql
CREATE TABLE IF NOT EXISTS subtasks (
    id SERIAL PRIMARY KEY,
    title VARCHAR(500) NOT NULL,
    completed BOOLEAN DEFAULT FALSE,
    task_id INTEGER REFERENCES tasks(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
```

| Columna | Tipo | Descripción |
|---------|------|-------------|
| id | SERIAL | Identificador único |
| title | VARCHAR(500) | Título de la subtarea |
| completed | BOOLEAN | Estado de completado |
| task_id | INTEGER | FK a tasks |
| created_at | TIMESTAMP | Fecha de creación |
| updated_at | TIMESTAMP | Última actualización |

### 5. comments

Comentarios en tareas.

```sql
CREATE TABLE IF NOT EXISTS comments (
    id SERIAL PRIMARY KEY,
    text TEXT NOT NULL,
    task_id INTEGER REFERENCES tasks(id) ON DELETE CASCADE,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
```

| Columna | Tipo | Descripción |
|---------|------|-------------|
| id | SERIAL | Identificador único |
| text | TEXT | Contenido del comentario |
| task_id | INTEGER | FK a tasks |
| user_id | INTEGER | FK a users |
| created_at | TIMESTAMP | Fecha de creación |
| updated_at | TIMESTAMP | Última actualización |

### 6. settings

Configuración personalizada por usuario.

```sql
CREATE TABLE IF NOT EXISTS settings (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    
    -- Configuración general
    theme VARCHAR(20) DEFAULT 'system',
    language VARCHAR(10) DEFAULT 'es',
    
    -- Configuración de tareas
    default_priority VARCHAR(20) DEFAULT 'medium',
    default_category_id INTEGER REFERENCES categories(id),
    show_completed_tasks BOOLEAN DEFAULT TRUE,
    auto_archive_completed BOOLEAN DEFAULT FALSE,
    archive_after_days INTEGER DEFAULT 7,
    
    -- Configuración de notificaciones
    notifications_enabled BOOLEAN DEFAULT TRUE,
    email_notifications BOOLEAN DEFAULT FALSE,
    notification_sound BOOLEAN DEFAULT TRUE,
    daily_summary BOOLEAN DEFAULT FALSE,
    reminder_before_due INTEGER DEFAULT 24,
    
    -- Configuración de IA
    ai_suggestions_enabled BOOLEAN DEFAULT TRUE,
    ai_auto_categorize BOOLEAN DEFAULT FALSE,
    ai_model VARCHAR(50) DEFAULT 'gpt-4o-mini',
    
    -- Configuración de vista
    tasks_per_page INTEGER DEFAULT 20,
    default_view VARCHAR(20) DEFAULT 'list',
    show_subtasks_inline BOOLEAN DEFAULT TRUE,
    compact_mode BOOLEAN DEFAULT FALSE,
    
    -- Configuración de categorías
    max_categories INTEGER DEFAULT 10,
    show_empty_categories BOOLEAN DEFAULT TRUE,
    category_sort_order VARCHAR(20) DEFAULT 'manual',
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE(user_id)
);
```

## Índices

```sql
-- Índices para optimizar búsquedas
CREATE INDEX IF NOT EXISTS idx_categories_user_id ON categories(user_id);
CREATE INDEX IF NOT EXISTS idx_tasks_user_id ON tasks(user_id);
CREATE INDEX IF NOT EXISTS idx_tasks_category_id ON tasks(category_id);
CREATE INDEX IF NOT EXISTS idx_tasks_completed ON tasks(completed);
CREATE INDEX IF NOT EXISTS idx_tasks_priority ON tasks(priority);
CREATE INDEX IF NOT EXISTS idx_subtasks_task_id ON subtasks(task_id);
CREATE INDEX IF NOT EXISTS idx_comments_task_id ON comments(task_id);
CREATE INDEX IF NOT EXISTS idx_comments_user_id ON comments(user_id);
CREATE INDEX IF NOT EXISTS idx_settings_user_id ON settings(user_id);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
```

## Triggers

### Actualización automática de `updated_at`

```sql
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Aplicar a todas las tablas
CREATE TRIGGER update_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_categories_updated_at
    BEFORE UPDATE ON categories
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_tasks_updated_at
    BEFORE UPDATE ON tasks
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_subtasks_updated_at
    BEFORE UPDATE ON subtasks
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_comments_updated_at
    BEFORE UPDATE ON comments
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_settings_updated_at
    BEFORE UPDATE ON settings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

## Vistas

### tasks_with_details

Vista que combina tareas con información de categoría y estadísticas.

```sql
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
    t.time_spent,
    t.estimated_time,
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
```

## Consultas Comunes

### Obtener tareas con subtareas

```sql
SELECT 
    t.*,
    json_agg(
        json_build_object(
            'id', s.id,
            'title', s.title,
            'completed', s.completed
        )
    ) FILTER (WHERE s.id IS NOT NULL) as subtasks
FROM tasks t
LEFT JOIN subtasks s ON s.task_id = t.id
WHERE t.user_id = $1
GROUP BY t.id
ORDER BY t.created_at DESC;
```

### Estadísticas del dashboard

```sql
SELECT 
    COUNT(*) as total_tasks,
    COUNT(*) FILTER (WHERE completed = TRUE) as completed_tasks,
    COUNT(*) FILTER (WHERE completed = FALSE) as pending_tasks,
    COUNT(*) FILTER (WHERE priority = 'high') as high_priority,
    COUNT(*) FILTER (WHERE priority = 'medium') as medium_priority,
    COUNT(*) FILTER (WHERE priority = 'low') as low_priority
FROM tasks
WHERE user_id = $1;
```

### Actividad de los últimos 7 días

```sql
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
LEFT JOIN tasks t ON t.user_id = $1
GROUP BY d.date
ORDER BY d.date ASC;
```

## Configuración de Conexión

```typescript
// lib/db.ts
import { Pool } from 'pg';

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME || 'db_taskia',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'password',
  max: 20,                    // Máximo de conexiones en el pool
  idleTimeoutMillis: 30000,   // Tiempo de espera antes de cerrar conexión inactiva
  connectionTimeoutMillis: 2000, // Timeout de conexión
});
```

## Migraciones

### Crear base de datos

```bash
# Crear la base de datos
createdb db_taskia

# Ejecutar esquema principal
psql -d db_taskia -f lib/schema.sql

# Ejecutar esquema de usuarios (si es necesario)
psql -d db_taskia -f lib/users-schema.sql

# Ejecutar esquema de configuración
psql -d db_taskia -f lib/settings-schema.sql

# Ejecutar esquema de tiempo de tareas
psql -d db_taskia -f lib/task-time-schema.sql
```

### Backup y Restore

```bash
# Crear backup
pg_dump db_taskia > backup_taskia.sql

# Restaurar backup
psql -d db_taskia < backup_taskia.sql
```
