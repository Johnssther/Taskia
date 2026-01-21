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

-- Índices
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- Insertar usuario de ejemplo (John Doe)
INSERT INTO users (
    email, 
    first_name, 
    last_name, 
    avatar_url,
    bio,
    phone,
    location,
    website,
    job_title,
    company,
    is_premium,
    email_verified
) VALUES (
    'john.doe@example.com',
    'John',
    'Doe',
    'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&h=400&fit=crop&crop=face',
    'Desarrollador Full Stack apasionado por crear aplicaciones que mejoren la productividad. Me encanta aprender nuevas tecnologías y compartir conocimiento con la comunidad.',
    '+1 (555) 123-4567',
    'San Francisco, CA',
    'https://johndoe.dev',
    'Senior Software Engineer',
    'Tech Startup Inc.',
    TRUE,
    TRUE
) ON CONFLICT (email) DO NOTHING;

-- Comentarios de las columnas
COMMENT ON TABLE users IS 'Tabla de usuarios del sistema';
COMMENT ON COLUMN users.password_hash IS 'Hash de la contraseña (bcrypt)';
COMMENT ON COLUMN users.is_premium IS 'Indica si el usuario tiene plan premium';
COMMENT ON COLUMN users.avatar_url IS 'URL de la imagen de perfil del usuario';
COMMENT ON COLUMN users.bio IS 'Biografía o descripción del usuario';
