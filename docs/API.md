# API Reference - TaskIA

## Visión General

TaskIA expone una API REST a través de Next.js API Routes. Todos los endpoints están bajo el prefijo `/api/`.

## Base URL

```
http://localhost:3000/api
```

## Formato de Respuesta

Todas las respuestas siguen el formato estándar:

```typescript
// Respuesta exitosa
{
  "success": true,
  "data": { ... }
}

// Respuesta de error
{
  "success": false,
  "error": "Mensaje de error"
}
```

---

## Endpoints de Base de Datos

### Categorías

#### GET /api/db/categories

Obtiene todas las categorías del usuario.

**Respuesta:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "name": "General",
      "color": "bg-gray-500",
      "icon": "📋",
      "user_id": 1,
      "is_default": true,
      "created_at": "2026-01-21T10:00:00Z",
      "updated_at": "2026-01-21T10:00:00Z"
    }
  ]
}
```

#### POST /api/db/categories

Crea una nueva categoría.

**Body:**
```json
{
  "name": "Trabajo",
  "color": "bg-blue-500",
  "icon": "💼"
}
```

**Respuesta:**
```json
{
  "success": true,
  "data": {
    "id": 2,
    "name": "Trabajo",
    "color": "bg-blue-500",
    "icon": "💼",
    "user_id": 1,
    "is_default": false,
    "created_at": "2026-01-21T10:00:00Z",
    "updated_at": "2026-01-21T10:00:00Z"
  }
}
```

#### GET /api/db/categories/[id]

Obtiene una categoría específica.

**Parámetros:**
- `id` (path): ID de la categoría

#### PUT /api/db/categories/[id]

Actualiza una categoría.

**Body:**
```json
{
  "name": "Trabajo Actualizado",
  "color": "bg-green-500"
}
```

#### DELETE /api/db/categories/[id]

Elimina una categoría. Las tareas asociadas se mueven a la categoría por defecto.

---

### Tareas

#### GET /api/db/tasks

Obtiene todas las tareas del usuario con subtareas y comentarios.

**Respuesta:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "title": "Completar documentación",
      "description": "Escribir documentación completa del proyecto",
      "completed": false,
      "priority": "high",
      "due_date": "2026-01-25T18:00:00Z",
      "category_id": 1,
      "user_id": 1,
      "ai_suggestions": ["Dividir en secciones", "Usar ejemplos"],
      "time_spent": 3600,
      "estimated_time": 7200,
      "created_at": "2026-01-21T10:00:00Z",
      "updated_at": "2026-01-21T10:00:00Z",
      "subtasks": [
        {
          "id": 1,
          "title": "Escribir README",
          "completed": true,
          "task_id": 1
        }
      ],
      "comments": [
        {
          "id": 1,
          "text": "Buen progreso",
          "author": "John Doe",
          "created_at": "2026-01-21T11:00:00Z"
        }
      ]
    }
  ]
}
```

#### POST /api/db/tasks

Crea una nueva tarea.

**Body:**
```json
{
  "title": "Nueva tarea",
  "description": "Descripción de la tarea",
  "priority": "medium",
  "category_id": 1,
  "estimated_time": 3600,
  "subtasks": [
    { "title": "Subtarea 1" },
    { "title": "Subtarea 2" }
  ]
}
```

**Campos opcionales:**
- `description`: Descripción de la tarea
- `priority`: "low" | "medium" | "high" (default: "medium")
- `category_id`: ID de categoría
- `due_date`: Fecha límite (ISO 8601)
- `estimated_time`: Tiempo estimado en segundos
- `subtasks`: Array de subtareas a crear

#### GET /api/db/tasks/[id]

Obtiene una tarea específica con todos sus detalles.

#### PUT /api/db/tasks/[id]

Actualiza una tarea.

**Body (todos los campos son opcionales):**
```json
{
  "title": "Título actualizado",
  "description": "Nueva descripción",
  "completed": true,
  "priority": "high",
  "category_id": 2,
  "due_date": "2026-01-30T18:00:00Z",
  "ai_suggestions": ["Sugerencia 1", "Sugerencia 2"],
  "time_spent": 7200,
  "estimated_time": 14400
}
```

#### DELETE /api/db/tasks/[id]

Elimina una tarea y todas sus subtareas y comentarios asociados.

---

### Subtareas

#### POST /api/db/subtasks

Crea una nueva subtarea.

**Body:**
```json
{
  "task_id": 1,
  "title": "Nueva subtarea"
}
```

#### PUT /api/db/subtasks/[id]

Actualiza una subtarea.

**Body:**
```json
{
  "title": "Título actualizado",
  "completed": true
}
```

#### DELETE /api/db/subtasks/[id]

Elimina una subtarea.

---

### Comentarios

#### GET /api/db/comments

Obtiene todos los comentarios (opcional: filtrar por task_id).

**Query params:**
- `task_id` (opcional): Filtrar por tarea

#### POST /api/db/comments

Crea un nuevo comentario.

**Body:**
```json
{
  "task_id": 1,
  "text": "Este es un comentario"
}
```

#### DELETE /api/db/comments/[id]

Elimina un comentario.

---

### Configuración

#### GET /api/db/settings

Obtiene la configuración del usuario.

**Respuesta:**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "user_id": 1,
    "theme": "system",
    "language": "es",
    "default_priority": "medium",
    "default_category_id": 1,
    "show_completed_tasks": true,
    "auto_archive_completed": false,
    "archive_after_days": 7,
    "notifications_enabled": true,
    "email_notifications": false,
    "notification_sound": true,
    "daily_summary": false,
    "reminder_before_due": 24,
    "ai_suggestions_enabled": true,
    "ai_auto_categorize": false,
    "ai_model": "gpt-4o-mini",
    "tasks_per_page": 20,
    "default_view": "list",
    "show_subtasks_inline": true,
    "compact_mode": false,
    "max_categories": 10,
    "show_empty_categories": true,
    "category_sort_order": "manual"
  }
}
```

#### PUT /api/db/settings

Actualiza la configuración del usuario.

**Body (todos los campos son opcionales):**
```json
{
  "theme": "dark",
  "default_priority": "high",
  "show_completed_tasks": false,
  "ai_suggestions_enabled": true
}
```

---

### Usuarios

#### GET /api/db/users

Obtiene el perfil del usuario actual.

**Respuesta:**
```json
{
  "id": 1,
  "email": "john.doe@example.com",
  "first_name": "John",
  "last_name": "Doe",
  "avatar_url": "https://example.com/avatar.jpg",
  "bio": "Desarrollador Full Stack",
  "phone": "+1 (555) 123-4567",
  "location": "San Francisco, CA",
  "website": "https://johndoe.dev",
  "job_title": "Senior Software Engineer",
  "company": "Tech Startup Inc.",
  "is_premium": true,
  "email_verified": true,
  "last_login": "2026-01-21T10:00:00Z",
  "created_at": "2026-01-01T00:00:00Z",
  "updated_at": "2026-01-21T10:00:00Z"
}
```

#### PUT /api/db/users

Actualiza el perfil del usuario.

**Body:**
```json
{
  "first_name": "John",
  "last_name": "Doe",
  "bio": "Nueva biografía",
  "phone": "+1 (555) 987-6543",
  "location": "New York, NY",
  "website": "https://newsite.com",
  "job_title": "Lead Developer",
  "company": "New Company",
  "avatar_url": "https://example.com/new-avatar.jpg"
}
```

---

### Estadísticas

#### GET /api/db/stats

Obtiene estadísticas del dashboard.

**Respuesta:**
```json
{
  "success": true,
  "data": {
    "overview": {
      "total_tasks": 25,
      "completed_tasks": 15,
      "pending_tasks": 10,
      "high_priority": 5,
      "medium_priority": 12,
      "low_priority": 8
    },
    "byCategory": [
      {
        "category_name": "Trabajo",
        "category_color": "bg-blue-500",
        "task_count": 10,
        "completed_count": 6
      }
    ],
    "daily": [
      {
        "date": "2026-01-15",
        "created": 3,
        "completed": 2
      }
    ],
    "subtasks": {
      "total_subtasks": 50,
      "completed_subtasks": 35
    },
    "comments": {
      "total_comments": 20
    },
    "recentTasks": [
      {
        "id": 1,
        "title": "Tarea reciente",
        "completed": false,
        "priority": "high",
        "category_name": "Trabajo",
        "category_color": "bg-blue-500",
        "created_at": "2026-01-21T10:00:00Z"
      }
    ]
  }
}
```

---

## Endpoints de IA

### Generar Tareas

#### POST /api/tasks/generate

Genera tareas automáticamente usando IA basándose en una descripción.

**Body:**
```json
{
  "prompt": "Planificar el lanzamiento de un nuevo producto",
  "apiKey": "sk-..." // Opcional, usa env var si no se proporciona
}
```

**Respuesta:**
```json
{
  "tasks": [
    {
      "title": "Definir estrategia de marketing",
      "description": "Crear plan de marketing para el lanzamiento",
      "priority": "high",
      "estimated_minutes": 120,
      "subtasks": [
        "Investigar competencia",
        "Definir público objetivo",
        "Crear calendario de contenido"
      ]
    },
    {
      "title": "Preparar materiales promocionales",
      "description": "Diseñar y crear materiales de marketing",
      "priority": "medium",
      "estimated_minutes": 180,
      "subtasks": [
        "Diseñar landing page",
        "Crear videos promocionales"
      ]
    }
  ],
  "usage": {
    "prompt_tokens": 250,
    "completion_tokens": 450,
    "total_tokens": 700,
    "cost_usd": 0.000135,
    "model": "gpt-4o-mini"
  }
}
```

**Errores:**
- `400`: API key no configurada o prompt vacío
- `500`: Error de OpenAI

---

### Obtener Sugerencias

#### POST /api/tasks/suggestions

Obtiene sugerencias de IA para completar una tarea específica.

**Body:**
```json
{
  "task": {
    "title": "Completar documentación",
    "description": "Escribir documentación del proyecto",
    "priority": "high",
    "subtasks": [
      { "title": "README" },
      { "title": "API docs" }
    ]
  },
  "apiKey": "sk-..." // Opcional
}
```

**Respuesta:**
```json
{
  "suggestions": [
    "Comienza con un índice claro de secciones",
    "Incluye ejemplos de código para cada endpoint",
    "Agrega diagramas de arquitectura",
    "Documenta los casos de error comunes",
    "Incluye una guía de inicio rápido"
  ],
  "usage": {
    "prompt_tokens": 150,
    "completion_tokens": 100,
    "total_tokens": 250,
    "cost_usd": 0.000045,
    "model": "gpt-4o-mini"
  }
}
```

---

### Generar Imágenes

#### POST /api/generate-images

Genera imágenes usando Google Imagen (Vertex AI) a partir de una descripción de texto.

**Body:**
```json
{
  "prompt": "Un gato leyendo un periódico en un café parisino, estilo acuarela",
  "projectId": "mi-proyecto-123",
  "region": "us-central1",
  "model": "imagen-4.0-generate-001",
  "aspectRatio": "16:9",
  "sampleCount": 2,
  "addWatermark": true,
  "enhancePrompt": true,
  "apiKey": "ya29..." // Opcional: Access token de Google Cloud
}
```

**Parámetros:**
- `prompt` (requerido): Descripción de la imagen a generar
- `projectId` (opcional): Google Cloud Project ID (o usar `GOOGLE_CLOUD_PROJECT_ID` en env)
- `region` (opcional): Región de Google Cloud (default: "us-central1")
- `model` (opcional): Modelo de Imagen (default: "imagen-4.0-generate-001")
- `aspectRatio` (opcional): "1:1" | "3:4" | "4:3" | "16:9" | "9:16" (default: "1:1")
- `sampleCount` (opcional): Número de imágenes a generar (1-4, default: 1)
- `addWatermark` (opcional): Agregar watermark digital (default: true)
- `enhancePrompt` (opcional): Mejorar prompt automáticamente (default: true)
- `apiKey` (opcional): Access token de Google Cloud (o usar `GOOGLE_ACCESS_TOKEN` en env)

**Respuesta:**
```json
{
  "images": [
    {
      "id": 1,
      "mimeType": "image/png",
      "base64": "iVBORw0KGgoAAAANSUhEUgAA...",
      "dataUrl": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAA...",
      "enhancedPrompt": "A cat reading a newspaper in a Parisian café, watercolor style, soft lighting"
    },
    {
      "id": 2,
      "mimeType": "image/png",
      "base64": "iVBORw0KGgoAAAANSUhEUgAA...",
      "dataUrl": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAA...",
      "enhancedPrompt": null
    }
  ],
  "count": 2,
  "model": "imagen-4.0-generate-001",
  "prompt": "Un gato leyendo un periódico en un café parisino, estilo acuarela",
  "metadata": {
    "projectId": "mi-proyecto-123",
    "region": "us-central1",
    "aspectRatio": "16:9",
    "sampleCount": 2,
    "addWatermark": true
  }
}
```

**Errores:**
- `400`: Prompt vacío, Project ID no configurado, o autenticación faltante
- `401`: Token de acceso inválido o expirado
- `403`: Sin permisos para Vertex AI API
- `500`: Error de Vertex AI o no se generaron imágenes

**Notas:**
- Requiere configuración de Google Cloud (proyecto, facturación, Vertex AI API habilitada)
- Para autenticación, puedes usar:
  - Access token directo en `apiKey` o `GOOGLE_ACCESS_TOKEN`
  - Application Default Credentials (`gcloud auth application-default login`)
  - Service Account Key (`GOOGLE_APPLICATION_CREDENTIALS`)

---

## Códigos de Estado HTTP

| Código | Significado |
|--------|-------------|
| 200 | Éxito |
| 201 | Creado exitosamente |
| 400 | Error de validación / Bad Request |
| 404 | Recurso no encontrado |
| 500 | Error interno del servidor |

## Tipos TypeScript

```typescript
// Tipos principales disponibles en lib/types.ts

interface User {
  id: number;
  name: string;
  email: string;
  avatar_url?: string;
  created_at: string;
  updated_at: string;
}

interface Category {
  id: number;
  name: string;
  color: string;
  icon: string;
  user_id: number;
  is_default: boolean;
  created_at: string;
  updated_at: string;
}

interface Task {
  id: number;
  title: string;
  description: string | null;
  completed: boolean;
  priority: 'low' | 'medium' | 'high';
  due_date: string | null;
  category_id: number | null;
  user_id: number;
  ai_suggestions: string[] | null;
  time_spent: number;
  estimated_time: number | null;
  created_at: string;
  updated_at: string;
  subtasks?: Subtask[];
  comments?: Comment[];
}

interface Subtask {
  id: number;
  title: string;
  completed: boolean;
  task_id: number;
  created_at: string;
  updated_at: string;
}

interface Comment {
  id: number;
  text: string;
  task_id: number;
  user_id: number;
  created_at: string;
  updated_at: string;
  author?: string;
}

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}
```

## Ejemplos de Uso

### JavaScript/TypeScript (fetch)

```typescript
// Obtener todas las tareas
const response = await fetch('/api/db/tasks');
const { success, data } = await response.json();

// Crear una tarea
const newTask = await fetch('/api/db/tasks', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    title: 'Nueva tarea',
    priority: 'high',
    category_id: 1
  })
});

// Actualizar una tarea
await fetch('/api/db/tasks/1', {
  method: 'PUT',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ completed: true })
});

// Eliminar una tarea
await fetch('/api/db/tasks/1', { method: 'DELETE' });

// Generar tareas con IA
const aiTasks = await fetch('/api/tasks/generate', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    prompt: 'Planificar una boda',
    apiKey: 'sk-...'
  })
});
```

### cURL

```bash
# Obtener tareas
curl http://localhost:3000/api/db/tasks

# Crear tarea
curl -X POST http://localhost:3000/api/db/tasks \
  -H "Content-Type: application/json" \
  -d '{"title":"Nueva tarea","priority":"high"}'

# Actualizar tarea
curl -X PUT http://localhost:3000/api/db/tasks/1 \
  -H "Content-Type: application/json" \
  -d '{"completed":true}'

# Eliminar tarea
curl -X DELETE http://localhost:3000/api/db/tasks/1

# Generar tareas con IA
curl -X POST http://localhost:3000/api/tasks/generate \
  -H "Content-Type: application/json" \
  -d '{"prompt":"Organizar una conferencia"}'

# Generar imágenes con Google Imagen
curl -X POST http://localhost:3000/api/generate-images \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "Un paisaje montañoso al atardecer",
    "projectId": "mi-proyecto",
    "aspectRatio": "16:9",
    "apiKey": "ya29..."
  }'
```
