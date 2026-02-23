# TaskIA – Funcionalidades generales de la aplicación

Este documento describe **todas las funcionalidades** de la aplicación TaskIA, organizadas por rutas, módulos y capacidades.

---

## Índice

1. [Rutas y páginas](#1-rutas-y-páginas)
2. [Proyectos](#2-proyectos)
3. [Categorías](#3-categorías)
4. [Tareas](#4-tareas)
5. [Inteligencia artificial](#5-inteligencia-artificial)
6. [Generación de imágenes](#6-generación-de-imágenes)
7. [Dashboard y estadísticas](#7-dashboard-y-estadísticas)
8. [Configuración y perfil](#8-configuración-y-perfil)
9. [APIs disponibles](#9-apis-disponibles)

---

## 1. Rutas y páginas

| Ruta | Descripción |
|------|-------------|
| **`/`** | Inicio: vista de tarjetas (swipe) para elegir tareas pendientes. Navegación entre tareas, omitir o trabajar en una. |
| **`/tasks`** | Lista de tareas por categorías. Selector de proyecto, crear/editar tareas, generar con IA, gestión de categorías. |
| **`/tasks/[id]`** | Detalle de una tarea: cronómetro, subtareas, comentarios, sugerencias de IA, chat de IA, confeti al completar. |
| **`/projects`** | Lista de proyectos. Crear proyecto, ver cantidad de categorías, eliminar proyecto, enlace a detalle. |
| **`/projects/[id]`** | Detalle de proyecto: editar nombre, listar categorías del proyecto, crear categorías, eliminar proyecto. |
| **`/categories/[id]`** | Detalle de categoría: editar nombre, listar tareas de la categoría, agregar tareas, eliminar categoría/tareas. |
| **`/generate-images`** | Generar imágenes con Google Imagen (Vertex AI): prompt, opciones de modelo, aspect ratio, descarga. |
| **`/dashboard`** | Estadísticas: resumen de tareas, por categoría, por prioridad, actividad diaria, tareas recientes. |
| **`/settings`** | Configuración: prioridad por defecto, categoría por defecto, notificaciones, IA (API key OpenAI), categorías. |
| **`/profile`** | Perfil de usuario: datos personales y preferencias asociadas. |

---

## 2. Proyectos

- **Listar proyectos**  
  Ver todos los proyectos del usuario con número de categorías.

- **Crear proyecto**  
  Nombre obligatorio; se asocia al usuario actual.

- **Editar nombre del proyecto**  
  En `/projects/[id]`, edición inline del nombre con guardar/cancelar.

- **Eliminar proyecto**  
  Con confirmación; elimina el proyecto y, por CASCADE, sus categorías (y lógica asociada).

- **Ver categorías de un proyecto**  
  En `/projects/[id]` se listan solo las categorías con `project_id` igual a ese proyecto.

- **Crear categoría dentro de un proyecto**  
  En `/projects/[id]`: nombre y color; la categoría queda asociada al proyecto.

- **Relación con tareas**  
  Las tareas se filtran por categoría; al elegir un proyecto en `/tasks` solo se muestran tareas de categorías de ese proyecto.

---

## 3. Categorías

- **Listar categorías**  
  Todas las del usuario o filtradas por `project_id` (selector de proyecto en `/tasks` o parámetro en API).

- **Crear categoría**  
  Desde `/tasks` (modal) o desde `/projects/[id]`. Campos: nombre, color, icono; opcionalmente `project_id`.

- **Editar nombre de categoría**  
  En `/categories/[id]`: edición inline con guardar/cancelar (solo si no es la categoría por defecto).

- **Eliminar categoría**  
  Desde sidebar o cabecera de categoría en `/tasks`, o desde `/categories/[id]`. Las tareas pasan a la categoría por defecto.

- **Navegación a categoría**  
  Clic en el nombre de la categoría (sidebar o panel en `/tasks`) lleva a `/categories/[id]`.

- **Categoría por defecto**  
  Una categoría marcada como por defecto no se puede eliminar ni editar nombre (según reglas de negocio).

- **Límite de categorías (plan)**  
  Indicador de uso y límite (ej. 20 en plan gratuito); modal “Premium” al superar el límite.

---

## 4. Tareas

### 4.1 Listado y filtrado

- **Listar tareas por proyecto**  
  En `/tasks`, al elegir un proyecto en el selector solo se muestran tareas cuyas categorías pertenecen a ese proyecto.

- **Opción “Todos los proyectos”**  
  Muestra todas las categorías y todas las tareas.

- **Persistencia del proyecto seleccionado**  
  El proyecto elegido se guarda en `localStorage` y se recupera al volver a `/tasks`.

### 4.2 Crear y editar tareas

- **Crear tarea manual**  
  Título, categoría (entre las visibles), prioridad (baja, media, alta). La categoría por defecto puede venir de configuración.

- **Generar tareas con IA**  
  Pestaña “Generar con IA”: descripción del proyecto, opcionalmente nombre de categoría. Se crea una categoría y varias tareas con subtareas, prioridades y tiempo estimado (OpenAI).

- **Marcar completada / no completada**  
  Checkbox en lista y en detalle; animación de confeti al completar todas las subtareas en detalle.

- **Cambiar prioridad**  
  En el modal de detalle de tarea en `/tasks`.

- **Cambiar categoría**  
  Selector de categoría en el modal de detalle (solo categorías visibles).

- **Eliminar tarea**  
  Desde la lista en `/tasks` o desde `/categories/[id]`.

### 4.3 Detalle de tarea (`/tasks/[id]`)

- **Cronómetro**  
  Iniciar, pausar, detener; tiempo por sesión; guardado de tiempo trabajado en la tarea.

- **Tiempo estimado**  
  Configuración de horas/minutos estimados; comparación con tiempo trabajado.

- **Subtareas**  
  Añadir, marcar completadas; progreso visual; impacto en “completado” de la tarea (p. ej. confeti al 100 %).

- **Comentarios**  
  Añadir comentarios; soporte de enlaces tipo Markdown `[texto](url)`; eliminar comentarios.

- **Sugerencias de IA**  
  Botón para obtener sugerencias (OpenAI) y mostrarlas en la vista; se pueden guardar en la tarea.

- **Chat de IA (TaskAIChat)**  
  Asistente contextualizado con la tarea (título, descripción, prioridad, categoría, subtareas, tiempos).

### 4.4 Navegación desde categoría

- En `/categories/[id]`, cada tarea enlaza a `/tasks/[id]` para ver detalle completo.

---

## 5. Inteligencia artificial

- **Generación de tareas (OpenAI)**  
  Endpoint `POST /api/tasks/generate`. Descripción en texto → lista de tareas con subtareas, prioridades y tiempo estimado en minutos. Uso de API key en body o variable de entorno.

- **Sugerencias para una tarea (OpenAI)**  
  Endpoint `POST /api/tasks/suggestions`. Envía la tarea y recibe sugerencias para completarla. Se muestran en el detalle de la tarea.

- **Chat por tarea (OpenAI)**  
  Componente `TaskAIChat`: contexto de la tarea y conversación con el modelo (p. ej. GPT-4o-mini). API key desde cliente o servidor.

- **Configuración de IA**  
  En `/settings`: sección IA, API key de OpenAI (validación y guardado en `localStorage`), modelo de IA, activar/desactivar sugerencias.

- **Uso de tokens en sesión**  
  En `/tasks` se muestra un resumen de tokens (entrada/salida) y costo estimado de la sesión cuando se usa generación o sugerencias.

---

## 6. Generación de imágenes

- **Ruta**  
  `/generate-images`: interfaz para generar imágenes con Google Imagen (Vertex AI).

- **Parámetros**  
  Prompt, Project ID de Google Cloud, región, modelo (p. ej. Imagen 4.0), aspect ratio (1:1, 16:9, etc.), número de imágenes (1–4), watermark, mejora de prompt.

- **Autenticación**  
  Access token en la petición o variable de entorno; opcionalmente Application Default Credentials.

- **Resultado**  
  Imágenes en base64/data URL; descarga; opción de ver en modal; prompt mejorado si la API lo devuelve.

- **API**  
  `POST /api/generate-images` (documentado en API.md e INTEGRACION_IA.md).

---

## 7. Dashboard y estadísticas

- **Resumen general**  
  Total de tareas, completadas, pendientes; por prioridad (alta, media, baja).

- **Por categoría**  
  Tareas por categoría, completadas vs total; colores por categoría.

- **Actividad diaria**  
  Gráfica de tareas creadas y completadas por día (p. ej. Recharts).

- **Subtareas**  
  Total de subtareas y subtareas completadas.

- **Comentarios**  
  Número total de comentarios.

- **Tareas recientes**  
  Listado de tareas recientes con enlace al detalle.

- **Navegación**  
  Enlace para volver al inicio o a tareas.

---

## 8. Configuración y perfil

### Configuración (`/settings`)

- **Tareas**  
  Prioridad por defecto, categoría por defecto, mostrar completadas, auto-archivar, días para archivar, tareas por página.

- **Notificaciones**  
  Activar notificaciones, por email, sonido, resumen diario, recordatorio antes de la fecha límite (horas).

- **IA**  
  API key de OpenAI (guardar/validar), sugerencias de IA on/off, modelo (p. ej. gpt-4o-mini, gpt-4o).

- **Categorías**  
  Máximo de categorías, mostrar categorías vacías, orden (manual, alfabético, por cantidad de tareas); listado de categorías actuales.

### Perfil (`/profile`)

- **Datos de usuario**  
  Visualización (y en su caso edición) de datos de perfil según implementación (nombre, email, etc.).

---

## 9. APIs disponibles

### Base de datos (`/api/db/`)

| Método | Ruta | Función |
|--------|------|---------|
| GET    | `/api/db/categories` | Listar categorías (opcional `?project_id=`). |
| POST   | `/api/db/categories` | Crear categoría (nombre, color, icono, opcional `project_id`). |
| GET    | `/api/db/categories/[id]` | Obtener una categoría. |
| PUT    | `/api/db/categories/[id]` | Actualizar categoría (nombre, color, icono, opcional `project_id`). |
| DELETE | `/api/db/categories/[id]` | Eliminar categoría (tareas pasan a categoría por defecto). |
| GET    | `/api/db/projects` | Listar proyectos (con `category_count`). |
| POST   | `/api/db/projects` | Crear proyecto (nombre). |
| GET    | `/api/db/projects/[id]` | Obtener un proyecto. |
| PUT    | `/api/db/projects/[id]` | Actualizar proyecto (nombre). |
| DELETE | `/api/db/projects/[id]` | Eliminar proyecto (CASCADE categorías). |
| GET    | `/api/db/tasks` | Listar tareas con subtareas y comentarios. |
| POST   | `/api/db/tasks` | Crear tarea (título, categoría, prioridad, etc.). |
| GET    | `/api/db/tasks/[id]` | Obtener una tarea. |
| PUT    | `/api/db/tasks/[id]` | Actualizar tarea (completada, prioridad, categoría, tiempo, etc.). |
| DELETE | `/api/db/tasks/[id]` | Eliminar tarea. |
| GET/POST/PUT/DELETE | `/api/db/subtasks`, `/api/db/subtasks/[id]` | CRUD de subtareas. |
| GET/POST/DELETE | `/api/db/comments`, `/api/db/comments/[id]` | CRUD de comentarios. |
| GET/PUT | `/api/db/settings` | Leer y actualizar configuración de usuario. |
| GET    | `/api/db/stats` | Estadísticas para el dashboard. |
| GET    | `/api/db/users` | Datos de usuarios (según implementación). |

### IA y generación

| Método | Ruta | Función |
|--------|------|---------|
| POST | `/api/tasks/generate` | Generar tareas con OpenAI (prompt, opcional apiKey). |
| POST | `/api/tasks/suggestions` | Sugerencias de IA para una tarea (task, opcional apiKey). |
| POST | `/api/generate-images` | Generar imágenes con Google Imagen (prompt, projectId, opciones, opcional apiKey). |

---

## Resumen rápido por módulo

| Módulo | Funcionalidades principales |
|--------|-----------------------------|
| **Proyectos** | CRUD proyectos, listar categorías por proyecto, crear categorías en proyecto. |
| **Categorías** | CRUD categorías, filtrar por proyecto, editar nombre, eliminar (con reasignación de tareas). |
| **Tareas** | CRUD tareas, filtro por proyecto, prioridad, subtareas, comentarios, cronómetro, tiempo estimado. |
| **IA** | Generar tareas, sugerencias, chat por tarea; API key en configuración. |
| **Imágenes** | Generar imágenes con Google Imagen desde `/generate-images` y API. |
| **Dashboard** | Resumen, por categoría, por prioridad, actividad diaria, recientes. |
| **Configuración** | Tareas, notificaciones, IA, categorías; perfil de usuario. |

---

**Versión del documento:** 1.0  
**Última actualización:** Enero 2026
