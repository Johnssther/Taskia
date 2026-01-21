# TaskIA - Documentación Completa

## Índice de Documentación

Bienvenido a la documentación completa de **TaskIA**, una aplicación de gestión de tareas inteligente con integración de IA.

### Documentos Disponibles

| Documento | Descripción |
|-----------|-------------|
| [Arquitectura](./ARQUITECTURA.md) | Estructura del proyecto, tecnologías y patrones de diseño |
| [Base de Datos](./BASE_DE_DATOS.md) | Esquemas, tablas, relaciones y consultas SQL |
| [API Reference](./API.md) | Documentación completa de todos los endpoints REST |
| [Componentes](./COMPONENTES.md) | Guía de componentes React y su uso |
| [Guía de Instalación](./INSTALACION.md) | Pasos detallados para configurar el proyecto |
| [Integración IA](./INTEGRACION_IA.md) | Cómo funciona la integración con OpenAI |
| [Guía de Usuario](./GUIA_USUARIO.md) | Manual de uso de la aplicación |

---

## Descripción General

**TaskIA** es una aplicación web moderna de gestión de tareas que combina las mejores prácticas de productividad con inteligencia artificial. Permite a los usuarios:

- 📋 Crear y organizar tareas por categorías
- 🤖 Generar tareas automáticamente usando IA
- ⏱️ Hacer seguimiento del tiempo trabajado
- 📊 Visualizar estadísticas y progreso
- 💬 Agregar comentarios y subtareas
- 💡 Obtener sugerencias inteligentes de IA

## Stack Tecnológico

| Categoría | Tecnología |
|-----------|------------|
| **Frontend** | Next.js 16, React 19, TypeScript |
| **Estilos** | Tailwind CSS 4 |
| **Base de Datos** | PostgreSQL 14+ |
| **IA** | OpenAI GPT-4o-mini |
| **Gráficos** | Recharts |
| **Iconos** | Heroicons |

## Inicio Rápido

```bash
# 1. Clonar el repositorio
git clone <repository-url>
cd cv-app

# 2. Instalar dependencias
npm install

# 3. Configurar base de datos PostgreSQL
createdb db_taskia
psql -d db_taskia -f lib/schema.sql

# 4. Configurar variables de entorno
cp .env.example .env.local
# Editar .env.local con tus credenciales

# 5. Iniciar servidor de desarrollo
npm run dev
```

## Estructura del Proyecto

```
cv-app/
├── app/                    # Aplicación Next.js (App Router)
│   ├── api/               # API Routes
│   │   ├── db/           # Endpoints de base de datos
│   │   └── tasks/        # Endpoints de IA
│   ├── components/        # Componentes compartidos
│   ├── dashboard/         # Página de estadísticas
│   ├── profile/          # Página de perfil
│   ├── settings/         # Página de configuración
│   └── tasks/            # Páginas de tareas
├── lib/                   # Utilidades y esquemas
│   ├── db.ts             # Conexión a PostgreSQL
│   ├── schema.sql        # Esquema principal
│   └── types.ts          # Tipos TypeScript
├── public/               # Archivos estáticos
└── docs/                 # Documentación
```

## Características Principales

### 1. Gestión de Tareas
- Crear, editar y eliminar tareas
- Organización por categorías con colores
- Sistema de prioridades (Alta, Media, Baja)
- Subtareas con progreso visual
- Comentarios en tareas

### 2. Integración con IA
- Generación automática de tareas desde descripción
- Sugerencias inteligentes para completar tareas
- Chat asistente por tarea
- Estimación de tiempo automática

### 3. Seguimiento de Tiempo
- Cronómetro integrado por tarea
- Tiempo estimado vs tiempo real
- Historial de tiempo trabajado

### 4. Dashboard de Estadísticas
- Gráficos de actividad
- Distribución por categorías
- Métricas de productividad
- Tareas recientes

### 5. Personalización
- Configuración de preferencias
- Temas claro/oscuro
- Notificaciones personalizables
- Gestión de categorías

## Licencia

Este proyecto es de uso privado.

---

**Versión:** 0.1.0  
**Última actualización:** Enero 2026
