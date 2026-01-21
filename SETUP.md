# Configuración del Dashboard de CV con IA

## Requisitos previos

- Node.js 18 o superior
- npm o yarn
- PostgreSQL 14 o superior

## Instalación

1. Instala las dependencias:
```bash
npm install
```

2. Crea la base de datos PostgreSQL:
```bash
createdb db_taskia
```

3. Ejecuta el esquema SQL para crear las tablas:
```bash
psql -d db_taskia -f lib/schema.sql
```

4. Configura las variables de entorno:

Crea un archivo `.env.local` en la raíz del proyecto con el siguiente contenido:

```env
# API Key de OpenAI para generación de CV y tareas con IA
OPENAI_API_KEY=sk-tu-api-key-aqui

# Configuración de PostgreSQL
DB_HOST=localhost
DB_PORT=5432
DB_NAME=db_taskia
DB_USER=postgres
DB_PASSWORD=tu_password_aqui
```

Puedes obtener tu API key en: https://platform.openai.com/api-keys

5. Ejecuta el servidor de desarrollo:
```bash
npm run dev
```

6. Abre tu navegador en `http://localhost:3000`

## Características

### 1. CV desde Descripción (Principal)
- Ingresa una descripción de tu perfil profesional
- La IA genera múltiples versiones de CV con diferentes enfoques
- Selecciona y descarga el CV que más te guste

### 2. CV desde Formulario (Opcional)
- Completa el formulario con tus datos
- Genera un CV estructurado

### 3. Ofertas de Empleo
- Explora ofertas de trabajo disponibles
- Filtra por ubicación y busca por palabras clave

### 4. Gestión de Tareas con IA (/tasks)
- Crea y organiza tareas por categorías
- Genera tareas automáticamente con IA
- Agrega subtareas y comentarios
- Obtén sugerencias de IA para completar tus tareas
- Todos los datos se guardan en PostgreSQL

## Base de datos

La aplicación utiliza PostgreSQL para almacenar:

### Tablas principales
- `users`: Información de usuarios
- `categories`: Categorías para organizar tareas
- `tasks`: Tareas con prioridad, descripción y sugerencias de IA
- `subtasks`: Subtareas asociadas a tareas
- `comments`: Comentarios en tareas

### Ejecutar el esquema
```bash
# Conectar a PostgreSQL y ejecutar el esquema
psql -U postgres -d db_taskia -f lib/schema.sql
```

## Notas

- Asegúrate de tener créditos disponibles en tu cuenta de OpenAI
- El modelo utilizado es `gpt-4o-mini` para optimizar costos
- Las respuestas pueden tardar unos segundos dependiendo de la carga del servidor
- Asegúrate de que PostgreSQL esté corriendo antes de iniciar la aplicación
- Sin la API key de OpenAI, solo funcionará el formulario tradicional y las tareas manuales
