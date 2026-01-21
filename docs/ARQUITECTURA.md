# Arquitectura de TaskIA

## Visión General

TaskIA está construida siguiendo una arquitectura moderna de aplicación web full-stack utilizando Next.js 16 con el App Router, lo que permite un desarrollo eficiente con Server Components y API Routes integradas.

## Diagrama de Arquitectura

```
┌─────────────────────────────────────────────────────────────────┐
│                         CLIENTE (Browser)                        │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │                    React Components                       │   │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐   │   │
│  │  │   Home   │ │  Tasks   │ │Dashboard │ │ Settings │   │   │
│  │  └──────────┘ └──────────┘ └──────────┘ └──────────┘   │   │
│  └─────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                      NEXT.JS SERVER                              │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │                      API Routes                           │   │
│  │  ┌──────────────────┐    ┌──────────────────────────┐   │   │
│  │  │   /api/db/*      │    │    /api/tasks/*          │   │   │
│  │  │  - categories    │    │    - generate (OpenAI)   │   │   │
│  │  │  - tasks         │    │    - suggestions (OpenAI)│   │   │
│  │  │  - subtasks      │    └──────────────────────────┘   │   │
│  │  │  - comments      │                                    │   │
│  │  │  - settings      │                                    │   │
│  │  │  - users         │                                    │   │
│  │  │  - stats         │                                    │   │
│  │  └──────────────────┘                                    │   │
│  └─────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
                    │                           │
                    ▼                           ▼
┌─────────────────────────┐     ┌─────────────────────────────────┐
│      PostgreSQL         │     │         OpenAI API              │
│  ┌───────────────────┐  │     │  ┌─────────────────────────┐   │
│  │  - users          │  │     │  │  GPT-4o-mini            │   │
│  │  - categories     │  │     │  │  - Task generation      │   │
│  │  - tasks          │  │     │  │  - Suggestions          │   │
│  │  - subtasks       │  │     │  │  - Chat assistance      │   │
│  │  - comments       │  │     │  └─────────────────────────┘   │
│  │  - settings       │  │     └─────────────────────────────────┘
│  └───────────────────┘  │
└─────────────────────────┘
```

## Tecnologías Utilizadas

### Frontend

| Tecnología | Versión | Propósito |
|------------|---------|-----------|
| Next.js | 16.1.3 | Framework React con SSR/SSG |
| React | 19.2.3 | Biblioteca de UI |
| TypeScript | 5.x | Tipado estático |
| Tailwind CSS | 4.x | Framework de estilos |
| Heroicons | 2.2.0 | Iconos SVG |
| Recharts | 2.15.0 | Gráficos y visualizaciones |
| canvas-confetti | 1.9.4 | Animaciones de celebración |

### Backend

| Tecnología | Versión | Propósito |
|------------|---------|-----------|
| Next.js API Routes | 16.x | Endpoints REST |
| PostgreSQL | 14+ | Base de datos relacional |
| pg (node-postgres) | 8.17.1 | Cliente PostgreSQL |

### Servicios Externos

| Servicio | Propósito |
|----------|-----------|
| OpenAI API | Generación de tareas y sugerencias con IA |

## Estructura de Directorios

```
cv-app/
├── app/                          # App Router de Next.js
│   ├── api/                      # API Routes
│   │   ├── db/                   # Endpoints de base de datos
│   │   │   ├── categories/       # CRUD de categorías
│   │   │   │   ├── route.ts      # GET, POST
│   │   │   │   └── [id]/
│   │   │   │       └── route.ts  # GET, PUT, DELETE
│   │   │   ├── tasks/            # CRUD de tareas
│   │   │   ├── subtasks/         # CRUD de subtareas
│   │   │   ├── comments/         # CRUD de comentarios
│   │   │   ├── settings/         # Configuración de usuario
│   │   │   ├── stats/            # Estadísticas del dashboard
│   │   │   └── users/            # Gestión de usuarios
│   │   └── tasks/                # Endpoints de IA
│   │       ├── generate/         # Generación de tareas con IA
│   │       └── suggestions/      # Sugerencias de IA
│   ├── components/               # Componentes compartidos
│   │   ├── Confetti.tsx          # Animación de confeti
│   │   └── TaskAIChat.tsx        # Chat de IA por tarea
│   ├── dashboard/                # Página de estadísticas
│   │   └── page.tsx
│   ├── profile/                  # Página de perfil de usuario
│   │   └── page.tsx
│   ├── settings/                 # Página de configuración
│   │   └── page.tsx
│   ├── tasks/                    # Páginas de tareas
│   │   ├── page.tsx              # Lista de tareas
│   │   └── [id]/
│   │       └── page.tsx          # Detalle de tarea
│   ├── globals.css               # Estilos globales
│   ├── layout.tsx                # Layout principal
│   ├── page.tsx                  # Página principal (Home)
│   └── favicon.ico
├── lib/                          # Utilidades y configuración
│   ├── db.ts                     # Conexión a PostgreSQL
│   ├── types.ts                  # Tipos TypeScript
│   ├── schema.sql                # Esquema principal de BD
│   ├── settings-schema.sql       # Esquema de configuración
│   ├── users-schema.sql          # Esquema de usuarios
│   └── task-time-schema.sql      # Esquema de tiempo
├── public/                       # Archivos estáticos
├── docs/                         # Documentación
├── package.json                  # Dependencias
├── tsconfig.json                 # Configuración TypeScript
├── next.config.ts                # Configuración Next.js
├── tailwind.config.ts            # Configuración Tailwind
├── postcss.config.mjs            # Configuración PostCSS
└── eslint.config.mjs             # Configuración ESLint
```

## Patrones de Diseño

### 1. App Router Pattern (Next.js 16)

La aplicación utiliza el nuevo App Router de Next.js que permite:
- **Server Components** por defecto
- **Client Components** con directiva `'use client'`
- **Route Handlers** para API endpoints
- **Layouts** anidados

```typescript
// Ejemplo de Client Component
'use client';

import { useState, useEffect } from 'react';

export default function TasksPage() {
  const [tasks, setTasks] = useState([]);
  // ...
}
```

### 2. API Route Pattern

Los endpoints siguen el patrón RESTful con Route Handlers:

```typescript
// app/api/db/tasks/route.ts
export async function GET() { /* Lista tareas */ }
export async function POST(request: NextRequest) { /* Crea tarea */ }

// app/api/db/tasks/[id]/route.ts
export async function GET(request: NextRequest, { params }) { /* Obtiene tarea */ }
export async function PUT(request: NextRequest, { params }) { /* Actualiza tarea */ }
export async function DELETE(request: NextRequest, { params }) { /* Elimina tarea */ }
```

### 3. Repository Pattern (Simplificado)

La conexión a base de datos se centraliza en `lib/db.ts`:

```typescript
// Helpers para queries
export async function query<T>(text: string, params?: unknown[]): Promise<T[]>
export async function queryOne<T>(text: string, params?: unknown[]): Promise<T | null>
export async function execute(text: string, params?: unknown[]): Promise<{ rowCount: number; rows: unknown[] }>
```

### 4. Component Composition

Los componentes siguen el patrón de composición de React:

```typescript
// Componente padre maneja estado
<TaskDetailPage>
  <TaskHeader />
  <SubtaskList />
  <TaskAIChat task={task} />
  <CommentSection />
</TaskDetailPage>
```

## Flujo de Datos

### 1. Carga de Datos (Client-Side)

```
Usuario visita /tasks
       │
       ▼
useEffect() se ejecuta
       │
       ▼
fetch('/api/db/tasks')
       │
       ▼
API Route consulta PostgreSQL
       │
       ▼
Respuesta JSON
       │
       ▼
setTasks(data) actualiza estado
       │
       ▼
React re-renderiza UI
```

### 2. Generación de Tareas con IA

```
Usuario describe proyecto
       │
       ▼
POST /api/tasks/generate
       │
       ▼
API Route envía prompt a OpenAI
       │
       ▼
OpenAI genera JSON con tareas
       │
       ▼
API Route crea categoría en BD
       │
       ▼
API Route crea tareas en BD
       │
       ▼
Respuesta con tareas creadas
       │
       ▼
UI actualiza lista de tareas
```

## Consideraciones de Seguridad

### 1. API Keys
- La API key de OpenAI se almacena en localStorage (cliente)
- Opcionalmente se puede usar variable de entorno (servidor)
- Validación de API key antes de guardar

### 2. Base de Datos
- Uso de queries parametrizadas para prevenir SQL injection
- Pool de conexiones con límites configurados
- Timeouts de conexión

### 3. Validación
- Validación de tipos con TypeScript
- Validación de datos en API Routes
- Sanitización de inputs de usuario

## Escalabilidad

### Actual
- Diseño monolítico con Next.js
- Base de datos PostgreSQL única
- Usuario único (hardcodeado)

### Futuro (Recomendaciones)
1. **Autenticación**: Implementar NextAuth.js o Auth0
2. **Multi-tenancy**: Soporte para múltiples usuarios
3. **Caché**: Implementar Redis para caché de sesiones
4. **CDN**: Usar Vercel Edge para assets estáticos
5. **Monitoreo**: Agregar Sentry para tracking de errores
