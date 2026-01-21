# Guía de Instalación - TaskIA

## Requisitos Previos

### Software Requerido

| Software | Versión Mínima | Verificar |
|----------|----------------|-----------|
| Node.js | 18.x o superior | `node --version` |
| npm | 9.x o superior | `npm --version` |
| PostgreSQL | 14 o superior | `psql --version` |

### Opcional

| Software | Propósito |
|----------|-----------|
| Git | Control de versiones |
| VS Code | Editor recomendado |
| pgAdmin | Administración de PostgreSQL |

---

## Instalación Paso a Paso

### 1. Clonar el Repositorio

```bash
# Clonar el proyecto
git clone <repository-url>
cd cv-app

# O si ya tienes el código
cd cv-app
```

### 2. Instalar Dependencias

```bash
# Usando npm
npm install

# O usando yarn
yarn install

# O usando pnpm
pnpm install
```

**Dependencias principales que se instalarán:**
- next (16.1.3)
- react (19.2.3)
- react-dom (19.2.3)
- pg (8.17.1)
- @heroicons/react (2.2.0)
- recharts (2.15.0)
- canvas-confetti (1.9.4)
- tailwindcss (4.x)
- typescript (5.x)

### 3. Configurar PostgreSQL

#### 3.1 Crear la Base de Datos

```bash
# Conectar a PostgreSQL
psql -U postgres

# Crear la base de datos
CREATE DATABASE db_taskia;

# Salir
\q
```

O usando el comando directo:
```bash
createdb -U postgres db_taskia
```

#### 3.2 Ejecutar los Esquemas SQL

```bash
# Esquema principal (usuarios, categorías, tareas, subtareas, comentarios)
psql -U postgres -d db_taskia -f lib/schema.sql

# Esquema de configuración (opcional, si no está en schema.sql)
psql -U postgres -d db_taskia -f lib/settings-schema.sql

# Esquema de tiempo de tareas (si existe)
psql -U postgres -d db_taskia -f lib/task-time-schema.sql
```

#### 3.3 Verificar la Instalación

```bash
# Conectar a la base de datos
psql -U postgres -d db_taskia

# Listar tablas
\dt

# Deberías ver:
#  Schema |    Name    | Type  |  Owner
# --------+------------+-------+----------
#  public | categories | table | postgres
#  public | comments   | table | postgres
#  public | settings   | table | postgres
#  public | subtasks   | table | postgres
#  public | tasks      | table | postgres
#  public | users      | table | postgres

# Verificar usuario por defecto
SELECT * FROM users;

# Salir
\q
```

### 4. Configurar Variables de Entorno

Crear archivo `.env.local` en la raíz del proyecto:

```bash
# Copiar el ejemplo (si existe)
cp .env.example .env.local

# O crear manualmente
touch .env.local
```

Contenido de `.env.local`:

```env
# ============================================
# Configuración de Base de Datos
# ============================================
DB_HOST=localhost
DB_PORT=5432
DB_NAME=db_taskia
DB_USER=postgres
DB_PASSWORD=tu_password_aqui

# ============================================
# OpenAI API (Opcional)
# ============================================
# Si no se configura, los usuarios deberán ingresar
# su API key en Configuración > IA
OPENAI_API_KEY=sk-tu-api-key-aqui

# ============================================
# Configuración de Next.js (Opcional)
# ============================================
# NEXT_PUBLIC_API_URL=http://localhost:3000
```

### 5. Iniciar el Servidor de Desarrollo

```bash
# Iniciar servidor
npm run dev

# El servidor estará disponible en:
# http://localhost:3000
```

### 6. Verificar la Instalación

1. Abrir `http://localhost:3000` en el navegador
2. Deberías ver la página principal de TaskIA
3. Navegar a `/tasks` para ver la lista de tareas
4. Navegar a `/settings` para configurar la API key de OpenAI

---

## Configuración de OpenAI (Opcional)

Para habilitar las funciones de IA, necesitas una API key de OpenAI.

### Obtener API Key

1. Ir a [platform.openai.com](https://platform.openai.com)
2. Crear una cuenta o iniciar sesión
3. Ir a **API Keys** en el menú lateral
4. Crear una nueva API key
5. Copiar la key (empieza con `sk-`)

### Configurar API Key

**Opción 1: Variable de entorno (Recomendado para producción)**

Agregar a `.env.local`:
```env
OPENAI_API_KEY=sk-tu-api-key-aqui
```

**Opción 2: Desde la aplicación (Recomendado para desarrollo)**

1. Ir a `http://localhost:3000/settings`
2. Navegar a la sección "Inteligencia Artificial"
3. Ingresar la API key
4. Hacer clic en "Guardar API Key"

La key se almacena en localStorage del navegador.

---

## Configuración para Producción

### 1. Build de Producción

```bash
# Crear build optimizado
npm run build

# Iniciar servidor de producción
npm start
```

### 2. Variables de Entorno de Producción

```env
# .env.production
NODE_ENV=production
DB_HOST=tu-servidor-postgres.com
DB_PORT=5432
DB_NAME=db_taskia
DB_USER=usuario_produccion
DB_PASSWORD=password_seguro
OPENAI_API_KEY=sk-...
```

### 3. Despliegue en Vercel

```bash
# Instalar Vercel CLI
npm i -g vercel

# Desplegar
vercel

# Configurar variables de entorno en Vercel Dashboard
```

---

## Solución de Problemas

### Error: "Cannot connect to PostgreSQL"

```bash
# Verificar que PostgreSQL está corriendo
# En Linux/Mac:
sudo systemctl status postgresql
# o
pg_isready

# En Windows:
# Verificar en Servicios que "PostgreSQL" esté iniciado
```

**Solución:**
```bash
# Iniciar PostgreSQL
sudo systemctl start postgresql
```

### Error: "Database does not exist"

```bash
# Crear la base de datos
createdb -U postgres db_taskia

# O desde psql
psql -U postgres -c "CREATE DATABASE db_taskia;"
```

### Error: "Relation does not exist"

Los esquemas SQL no se han ejecutado:

```bash
psql -U postgres -d db_taskia -f lib/schema.sql
```

### Error: "ECONNREFUSED 127.0.0.1:5432"

PostgreSQL no está corriendo o está en otro puerto:

```bash
# Verificar puerto
sudo netstat -tlnp | grep postgres

# Actualizar DB_PORT en .env.local si es diferente
```

### Error: "OpenAI API key not configured"

1. Verificar que la API key está configurada en `.env.local` o en Settings
2. Verificar que la API key es válida (empieza con `sk-`)
3. Verificar que tienes créditos en tu cuenta de OpenAI

### Error: "Module not found"

```bash
# Limpiar caché y reinstalar
rm -rf node_modules
rm package-lock.json
npm install
```

### Puerto 3000 en uso

```bash
# Usar otro puerto
npm run dev -- -p 3001

# O matar el proceso que usa el puerto
# En Linux/Mac:
lsof -i :3000
kill -9 <PID>

# En Windows:
netstat -ano | findstr :3000
taskkill /PID <PID> /F
```

---

## Estructura de Archivos de Configuración

```
cv-app/
├── .env.local              # Variables de entorno (NO commitear)
├── .env.example            # Ejemplo de variables (commitear)
├── next.config.ts          # Configuración de Next.js
├── tsconfig.json           # Configuración de TypeScript
├── tailwind.config.ts      # Configuración de Tailwind CSS
├── postcss.config.mjs      # Configuración de PostCSS
├── eslint.config.mjs       # Configuración de ESLint
└── package.json            # Dependencias y scripts
```

---

## Scripts Disponibles

```bash
# Desarrollo
npm run dev       # Inicia servidor de desarrollo

# Producción
npm run build     # Crea build de producción
npm start         # Inicia servidor de producción

# Calidad de código
npm run lint      # Ejecuta ESLint
```

---

## Siguiente Paso

Una vez instalado, consulta la [Guía de Usuario](./GUIA_USUARIO.md) para aprender a usar TaskIA.
