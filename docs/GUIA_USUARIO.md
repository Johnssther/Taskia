# Guía de Usuario - TaskIA

## Introducción

TaskIA es una aplicación de gestión de tareas inteligente que combina organización tradicional con el poder de la inteligencia artificial. Esta guía te ayudará a aprovechar al máximo todas sus funcionalidades.

---

## Navegación Principal

### Páginas de la Aplicación

| Página | URL | Descripción |
|--------|-----|-------------|
| **Inicio** | `/` | Vista de tarjetas para seleccionar tareas |
| **Tareas** | `/tasks` | Lista completa de tareas por categorías |
| **Detalle** | `/tasks/[id]` | Vista detallada de una tarea |
| **Dashboard** | `/dashboard` | Estadísticas y gráficos |
| **Configuración** | `/settings` | Preferencias de la aplicación |
| **Perfil** | `/profile` | Información del usuario |

### Barra de Navegación

En el header encontrarás accesos rápidos a:
- 📋 Lista de tareas
- 📊 Dashboard
- ⚙️ Configuración

---

## Página de Inicio

La página de inicio presenta una interfaz tipo "swipe" para revisar tus tareas pendientes.

### Funcionalidades

1. **Tarjeta de Tarea**
   - Muestra título, descripción y prioridad
   - Indica categoría y tiempo estimado
   - Muestra progreso de subtareas

2. **Acciones**
   - 👎 **Omitir**: Salta la tarea actual
   - 👍 **Trabajar**: Abre el detalle de la tarea
   - ◀️ ▶️ **Navegar**: Mueve entre tareas

3. **Estadísticas Rápidas**
   - Tareas pendientes
   - Tareas completadas
   - Tareas omitidas

### Cómo Usar

1. Revisa la tarea mostrada en la tarjeta
2. Decide si quieres trabajar en ella o saltarla
3. Haz clic en 👍 para ir al detalle y empezar a trabajar
4. Haz clic en 👎 para ver la siguiente tarea

---

## Gestión de Tareas

### Crear Tarea Manual

1. Ve a `/tasks`
2. En el panel "Tarea Manual":
   - Escribe el título de la tarea
   - Selecciona la categoría
   - Elige la prioridad (Baja, Media, Alta)
3. Haz clic en "Agregar" o presiona Enter

### Generar Tareas con IA

1. Ve a `/tasks`
2. Haz clic en la pestaña "Generar con IA"
3. Opcionalmente, escribe un nombre para la categoría
4. Describe tu proyecto o lo que necesitas hacer
5. Haz clic en "Generar Tareas con IA"

**Ejemplo de descripción:**
> "Necesito planificar el lanzamiento de un nuevo producto. Incluye tareas de marketing, desarrollo, pruebas y preparación del equipo de ventas."

La IA generará:
- Una nueva categoría con el nombre especificado
- Múltiples tareas con descripciones
- Subtareas para cada tarea
- Prioridades sugeridas
- Estimaciones de tiempo

### Organizar Tareas

**Por Categorías:**
- Las tareas se agrupan automáticamente por categoría
- Haz clic en el encabezado de categoría para expandir/colapsar
- Arrastra tareas entre categorías (próximamente)

**Por Prioridad:**
- Alta (rojo): Tareas urgentes
- Media (amarillo): Tareas normales
- Baja (verde): Tareas que pueden esperar

### Completar Tareas

1. Haz clic en el círculo junto a la tarea
2. La tarea se marcará como completada
3. Opcionalmente, oculta tareas completadas en Configuración

---

## Detalle de Tarea

### Acceder al Detalle

- Desde Inicio: Haz clic en 👍 en una tarjeta
- Desde Tareas: Haz clic en cualquier tarea de la lista

### Secciones del Detalle

#### 1. Header
- Título de la tarea
- Estado (completada/pendiente)
- Prioridad
- Categoría
- Barra de progreso de subtareas

#### 2. Cronómetro

El cronómetro te permite trackear el tiempo trabajado:

**Controles:**
- ▶️ **Iniciar**: Comienza a contar el tiempo
- ⏸️ **Pausar**: Pausa y guarda el tiempo
- ⏹️ **Detener**: Detiene y guarda el tiempo

**Tiempo Estimado:**
- Haz clic en "Agregar tiempo estimado"
- Ingresa horas y minutos
- El sistema te avisará si excedes el tiempo

**Modal de Cronómetro:**
- Haz clic en el tiempo para abrir vista expandida
- Muestra tiempo total y de sesión
- Incluye barra de progreso vs estimado

#### 3. Descripción
- Muestra la descripción detallada de la tarea
- Se genera automáticamente con IA o se agrega manualmente

#### 4. Subtareas

**Agregar Subtarea:**
1. Haz clic en "Agregar subtarea"
2. Escribe el título
3. Presiona Enter o haz clic en "Agregar"

**Completar Subtarea:**
- Haz clic en el círculo junto a la subtarea
- El progreso se actualiza automáticamente
- Al completar todas, aparece animación de confeti 🎉

**Eliminar Subtarea:**
- Pasa el cursor sobre la subtarea
- Haz clic en el icono de basura

#### 5. Sugerencias de IA

1. Haz clic en "Obtener sugerencias de IA"
2. La IA analizará tu tarea y generará consejos
3. Las sugerencias se guardan para referencia futura

**Ejemplo de sugerencias:**
- "Divide la tarea en bloques de 25 minutos (Pomodoro)"
- "Comienza por las subtareas más difíciles"
- "Elimina distracciones antes de empezar"

#### 6. Chat de IA

El chat te permite conversar con la IA sobre tu tarea específica:

1. Escribe tu pregunta o duda
2. La IA responderá considerando el contexto de la tarea
3. El historial se mantiene durante la sesión

**Ejemplos de preguntas:**
- "¿Cómo puedo empezar con esta tarea?"
- "¿Qué herramientas me recomiendas?"
- "¿Cómo puedo hacerlo más rápido?"

#### 7. Comentarios

**Agregar Comentario:**
1. Escribe en el campo de texto
2. Usa Ctrl+Enter para enviar rápidamente
3. Puedes agregar enlaces con formato `[texto](url)`

**Eliminar Comentario:**
- Pasa el cursor sobre el comentario
- Haz clic en el icono de basura

---

## Categorías

### Crear Categoría

1. En la barra lateral de `/tasks`, haz clic en ➕
2. Escribe el nombre de la categoría
3. Selecciona un color
4. Haz clic en "Crear"

### Límites del Plan Gratuito

- Máximo 20 categorías personalizadas
- La categoría "General" siempre está disponible
- Actualiza a Premium para categorías ilimitadas

### Eliminar Categoría

1. Pasa el cursor sobre la categoría
2. Haz clic en el icono de basura
3. Las tareas se moverán a "General"

**Nota:** La categoría "General" no se puede eliminar.

---

## Dashboard

El dashboard muestra estadísticas de tu productividad.

### Métricas Disponibles

1. **Resumen General**
   - Total de tareas
   - Tareas completadas
   - Tareas pendientes
   - Tasa de éxito (%)

2. **Actividad de 7 Días**
   - Gráfico de área
   - Tareas creadas por día
   - Tareas completadas por día

3. **Por Categoría**
   - Gráfico de barras horizontal
   - Completadas vs pendientes por categoría

4. **Por Estado**
   - Gráfico de pastel
   - Completadas vs pendientes

5. **Por Prioridad**
   - Gráfico de pastel
   - Alta, Media, Baja

6. **Resumen Adicional**
   - Total de subtareas
   - Subtareas completadas
   - Total de comentarios
   - Número de categorías

7. **Tareas Recientes**
   - Últimas 5 tareas creadas
   - Estado y prioridad

---

## Configuración

### Sección: Tareas

| Opción | Descripción |
|--------|-------------|
| Prioridad por defecto | Prioridad inicial para nuevas tareas |
| Categoría por defecto | Categoría inicial para nuevas tareas |
| Mostrar completadas | Mostrar/ocultar tareas completadas |
| Auto-archivar | Archivar automáticamente tareas completadas |
| Tareas por página | Cantidad de tareas a mostrar |

### Sección: Notificaciones

| Opción | Descripción |
|--------|-------------|
| Notificaciones | Habilitar notificaciones de la app |
| Email | Recibir notificaciones por correo |
| Sonido | Reproducir sonido en notificaciones |
| Resumen diario | Recibir resumen de tareas cada día |
| Recordatorio | Horas antes de fecha límite para avisar |

### Sección: Inteligencia Artificial

| Opción | Descripción |
|--------|-------------|
| API Key | Tu clave de OpenAI |
| Sugerencias | Habilitar sugerencias de IA |
| Modelo | Modelo de IA a utilizar |

**Configurar API Key:**
1. Obtén tu API key en [platform.openai.com](https://platform.openai.com)
2. Pégala en el campo "API Key de OpenAI"
3. Haz clic en "Guardar API Key"
4. El sistema validará la key automáticamente

### Sección: Categorías

| Opción | Descripción |
|--------|-------------|
| Máximo de categorías | Límite de categorías permitidas |
| Mostrar vacías | Mostrar categorías sin tareas |
| Orden | Manual, alfabético o por cantidad |

---

## Perfil de Usuario

### Información Editable

- Nombre y apellido
- Biografía
- Teléfono
- Ubicación
- Sitio web
- Cargo y empresa
- URL de avatar

### Cómo Editar

1. Ve a `/profile`
2. Haz clic en "Editar"
3. Modifica los campos deseados
4. Haz clic en ✓ para guardar

---

## Atajos de Teclado

| Atajo | Acción |
|-------|--------|
| `Enter` | Crear tarea/subtarea |
| `Ctrl+Enter` | Enviar comentario |
| `Esc` | Cerrar modal |

---

## Consejos de Productividad

### 1. Usa la IA para Planificar

Antes de empezar un proyecto grande:
1. Describe el proyecto en "Generar con IA"
2. Revisa las tareas generadas
3. Ajusta prioridades según tu criterio
4. Agrega o elimina subtareas

### 2. Trackea tu Tiempo

- Inicia el cronómetro al comenzar una tarea
- Pausa cuando te interrumpan
- Compara tiempo real vs estimado
- Ajusta estimaciones futuras basándote en datos

### 3. Revisa el Dashboard

- Consulta el dashboard semanalmente
- Identifica patrones de productividad
- Ajusta tu planificación según los datos

### 4. Usa Subtareas

- Divide tareas grandes en subtareas pequeñas
- Completa una subtarea a la vez
- Celebra el progreso (¡confeti al 100%!)

### 5. Aprovecha las Sugerencias

- Pide sugerencias de IA cuando estés atascado
- Usa el chat para resolver dudas específicas
- Las sugerencias se guardan para referencia

---

## Solución de Problemas

### "No puedo generar tareas con IA"

1. Verifica que tienes una API key configurada
2. Ve a Configuración > IA
3. Ingresa tu API key de OpenAI
4. Asegúrate de tener créditos en tu cuenta

### "El cronómetro no guarda el tiempo"

1. Asegúrate de hacer clic en Pausar o Detener
2. No cierres la página mientras el cronómetro corre
3. El tiempo se guarda automáticamente al pausar/detener

### "No veo mis tareas completadas"

1. Ve a Configuración > Tareas
2. Activa "Mostrar tareas completadas"
3. Las tareas aparecerán en sus categorías

### "Alcancé el límite de categorías"

1. Elimina categorías que no uses
2. Combina categorías similares
3. Considera actualizar a Premium

---

## Soporte

Si tienes problemas o sugerencias:

1. Revisa esta documentación
2. Consulta la sección de [Solución de Problemas](#solución-de-problemas)
3. Contacta al equipo de soporte

---

**¡Disfruta usando TaskIA para ser más productivo!** 🚀
