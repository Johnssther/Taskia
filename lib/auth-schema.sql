-- Esquema de autenticación: tabla de usuarios y soporte para login/sesiones
-- Base de datos: db_taskia
-- Ejecutar: psql -U postgres -d db_taskia -f lib/auth-schema.sql

-- =============================================================================
-- TABLA users (definición para autenticación)
-- =============================================================================
-- Si la tabla ya existe por schema.sql, se mantiene; si no, se crea completa.
-- Luego se añaden columnas opcionales para reset de contraseña y sesiones.
-- =============================================================================

CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255),
    first_name VARCHAR(100) NOT NULL DEFAULT '',
    last_name VARCHAR(100) NOT NULL DEFAULT '',
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

-- Índices para autenticación (login por email, búsquedas)
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_email_verified ON users(email_verified) WHERE email_verified = TRUE;

-- Columnas opcionales para "olvidé mi contraseña" (PostgreSQL 11+ ADD COLUMN IF NOT EXISTS)
ALTER TABLE users ADD COLUMN IF NOT EXISTS password_reset_token VARCHAR(255) NULL;
ALTER TABLE users ADD COLUMN IF NOT EXISTS password_reset_expires_at TIMESTAMP WITH TIME ZONE NULL;

-- Comentarios para autenticación
COMMENT ON TABLE users IS 'Usuarios del sistema; autenticación por email + password_hash (bcrypt)';
COMMENT ON COLUMN users.email IS 'Email único; se usa como login';
COMMENT ON COLUMN users.password_hash IS 'Hash bcrypt de la contraseña; NULL si registro por OAuth sin contraseña';
COMMENT ON COLUMN users.email_verified IS 'Si el email fue verificado (enlace o código)';
COMMENT ON COLUMN users.last_login IS 'Última fecha/hora de login exitoso';
COMMENT ON COLUMN users.password_reset_token IS 'Token único para flujo "olvidé mi contraseña"';
COMMENT ON COLUMN users.password_reset_expires_at IS 'Caducidad del password_reset_token';

-- Trigger para actualizar updated_at (crear después de ejecutar schema.sql o junto con él)
-- Si ya existe update_updated_at_column(), descomentar o ejecutar:
-- DROP TRIGGER IF EXISTS update_users_updated_at ON users;
-- CREATE TRIGGER update_users_updated_at
--     BEFORE UPDATE ON users FOR EACH ROW
--     EXECUTE FUNCTION update_updated_at_column();

-- =============================================================================
-- TABLA sessions (opcional: sesiones en servidor / refresh tokens)
-- =============================================================================
-- Permite invalidar sesiones por usuario y expiración por tiempo.
-- =============================================================================

CREATE TABLE IF NOT EXISTS sessions (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token_hash VARCHAR(255) NOT NULL,
    user_agent TEXT,
    ip_address INET,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_sessions_token_hash ON sessions(token_hash);
CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_expires_at ON sessions(expires_at);

COMMENT ON TABLE sessions IS 'Sesiones activas; token_hash = hash del JWT o session id para invalidación';
COMMENT ON COLUMN sessions.token_hash IS 'Hash del token (no guardar el token en claro)';
COMMENT ON COLUMN sessions.expires_at IS 'Fecha de expiración de la sesión';

-- Usuario de ejemplo solo si no existe (compatible con schema.sql existente)
INSERT INTO users (email, first_name, last_name, is_premium, email_verified)
VALUES ('john.doe@example.com', 'John', 'Doe', TRUE, TRUE)
ON CONFLICT (email) DO NOTHING;
