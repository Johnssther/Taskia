# Integración con IA - TaskIA

## Visión General

TaskIA integra OpenAI GPT-4o-mini para proporcionar funcionalidades inteligentes de gestión de tareas. Esta integración permite:

1. **Generación automática de tareas** desde descripciones de proyectos
2. **Sugerencias inteligentes** para completar tareas
3. **Chat asistente** contextualizado por tarea

---

## Arquitectura de la Integración

```
┌─────────────────────────────────────────────────────────────┐
│                      CLIENTE (Browser)                       │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  localStorage: openai_api_key                        │   │
│  │                                                       │   │
│  │  ┌──────────────┐  ┌──────────────┐  ┌───────────┐  │   │
│  │  │ TasksPage    │  │ TaskDetail   │  │ Settings  │  │   │
│  │  │ (Generate)   │  │ (Suggestions)│  │ (API Key) │  │   │
│  │  └──────────────┘  └──────────────┘  └───────────┘  │   │
│  └─────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                      NEXT.JS API ROUTES                      │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  /api/tasks/generate     - Genera tareas con IA     │   │
│  │  /api/tasks/suggestions  - Obtiene sugerencias      │   │
│  └─────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                      OPENAI API                              │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  Modelo: gpt-4o-mini                                 │   │
│  │  Endpoint: https://api.openai.com/v1/chat/completions│   │
│  └─────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

---

## Configuración de API Key

### Opción 1: Variable de Entorno (Servidor)

```env
# .env.local
OPENAI_API_KEY=sk-tu-api-key-aqui
```

**Ventajas:**
- Más seguro (no expuesto al cliente)
- Centralizado para todos los usuarios

**Desventajas:**
- Requiere acceso al servidor
- Costos centralizados

### Opción 2: localStorage (Cliente)

```typescript
// Guardar
localStorage.setItem('openai_api_key', 'sk-...');

// Obtener
const apiKey = localStorage.getItem('openai_api_key');
```

**Ventajas:**
- Cada usuario usa su propia key
- No requiere configuración del servidor

**Desventajas:**
- Menos seguro (almacenado en el navegador)
- Requiere configuración por usuario

### Flujo de Autenticación

```typescript
// En el API Route
const { apiKey } = await request.json();

// Prioridad: API key del cliente > Variable de entorno
const openaiApiKey = apiKey || process.env.OPENAI_API_KEY;

if (!openaiApiKey) {
  return NextResponse.json(
    { error: 'API key de OpenAI no configurada' },
    { status: 400 }
  );
}
```

---

## Generación de Tareas

### Endpoint: POST /api/tasks/generate

### Prompt del Sistema

```typescript
const systemPrompt = `Eres un asistente experto en gestión de proyectos y productividad. 
Tu trabajo es generar listas de tareas estructuradas y accionables con estimaciones de tiempo realistas.

REGLAS:
- Genera entre 3 y 7 tareas principales
- Cada tarea debe tener subtareas cuando sea apropiado (máximo 5 subtareas)
- Asigna prioridades: "high", "medium", o "low"
- IMPORTANTE: Estima el tiempo en MINUTOS que tomará completar cada tarea
- Las estimaciones deben ser realistas: tareas simples 15-30 min, medianas 30-120 min, complejas 120-480 min
- Las tareas deben ser específicas y accionables
- Responde SOLO con JSON válido, sin explicaciones

FORMATO DE RESPUESTA (JSON):
{
  "tasks": [
    {
      "title": "Título de la tarea",
      "description": "Descripción breve",
      "priority": "high|medium|low",
      "estimated_minutes": 60,
      "subtasks": ["Subtarea 1", "Subtarea 2"]
    }
  ]
}`;
```

### Ejemplo de Uso

**Request:**
```json
{
  "prompt": "Planificar el lanzamiento de una aplicación móvil",
  "apiKey": "sk-..."
}
```

**Response:**
```json
{
  "tasks": [
    {
      "title": "Preparar assets de marketing",
      "description": "Crear screenshots, videos y descripciones para las tiendas",
      "priority": "high",
      "estimated_minutes": 180,
      "subtasks": [
        "Crear screenshots para App Store",
        "Crear screenshots para Play Store",
        "Grabar video promocional",
        "Escribir descripción de la app"
      ]
    },
    {
      "title": "Configurar cuentas de desarrollador",
      "description": "Asegurar que las cuentas de Apple y Google estén activas",
      "priority": "high",
      "estimated_minutes": 60,
      "subtasks": [
        "Verificar cuenta de Apple Developer",
        "Verificar cuenta de Google Play Console"
      ]
    },
    {
      "title": "Realizar pruebas finales",
      "description": "Testing completo antes del lanzamiento",
      "priority": "high",
      "estimated_minutes": 240,
      "subtasks": [
        "Pruebas en dispositivos iOS",
        "Pruebas en dispositivos Android",
        "Pruebas de rendimiento",
        "Pruebas de seguridad"
      ]
    }
  ],
  "usage": {
    "prompt_tokens": 280,
    "completion_tokens": 350,
    "total_tokens": 630,
    "cost_usd": 0.000126,
    "model": "gpt-4o-mini"
  }
}
```

### Implementación

```typescript
// app/api/tasks/generate/route.ts
export async function POST(request: NextRequest) {
  const { prompt, apiKey } = await request.json();
  const openaiApiKey = apiKey || process.env.OPENAI_API_KEY;

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${openaiApiKey}`,
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: `Genera una lista de tareas para: ${prompt}` }
      ],
      temperature: 0.7,
      max_tokens: 1500,
    }),
  });

  const data = await response.json();
  // Procesar y retornar
}
```

---

## Sugerencias de IA

### Endpoint: POST /api/tasks/suggestions

### Prompt del Sistema

```typescript
const systemPrompt = `Eres un asistente de productividad experto. 
Analiza la tarea proporcionada y genera sugerencias útiles para completarla de manera más eficiente.

REGLAS:
- Genera exactamente 3-5 sugerencias
- Las sugerencias deben ser prácticas y accionables
- Considera el contexto y la prioridad de la tarea
- Responde SOLO con JSON válido

FORMATO:
{
  "suggestions": ["Sugerencia 1", "Sugerencia 2", "Sugerencia 3"]
}`;
```

### Ejemplo de Uso

**Request:**
```json
{
  "task": {
    "title": "Escribir documentación del API",
    "description": "Documentar todos los endpoints REST",
    "priority": "high",
    "subtasks": [
      { "title": "Documentar endpoints de tareas" },
      { "title": "Documentar endpoints de categorías" }
    ]
  },
  "apiKey": "sk-..."
}
```

**Response:**
```json
{
  "suggestions": [
    "Usa una herramienta como Swagger o Postman para generar documentación automática",
    "Incluye ejemplos de request y response para cada endpoint",
    "Documenta los códigos de error y sus significados",
    "Agrega una sección de 'Quick Start' para nuevos desarrolladores",
    "Considera usar Markdown para mejor legibilidad"
  ],
  "usage": {
    "prompt_tokens": 150,
    "completion_tokens": 120,
    "total_tokens": 270,
    "cost_usd": 0.000054,
    "model": "gpt-4o-mini"
  }
}
```

---

## Chat de IA por Tarea

### Componente: TaskAIChat

El componente `TaskAIChat` proporciona un chat contextualizado para cada tarea.

### Contexto del Chat

```typescript
const systemPrompt = `Eres un asistente de productividad especializado en ayudar a completar tareas.

CONTEXTO DE LA TAREA:
- Título: ${task.title}
- Descripción: ${task.description || 'Sin descripción'}
- Prioridad: ${task.priority}
- Categoría: ${categoryName || 'Sin categoría'}
- Subtareas: ${task.subtasks.map(s => s.title).join(', ') || 'Ninguna'}
- Tiempo estimado: ${formatTime(task.estimated_time)}
- Tiempo trabajado: ${formatTime(task.time_spent)}

INSTRUCCIONES:
- Ayuda al usuario a completar esta tarea específica
- Proporciona consejos prácticos y accionables
- Si el usuario pregunta algo no relacionado, redirige amablemente a la tarea
- Sé conciso pero útil`;
```

### Flujo de Conversación

```
Usuario: "¿Cómo puedo empezar con esta tarea?"
    │
    ▼
[Contexto de tarea + Historial de chat]
    │
    ▼
OpenAI GPT-4o-mini
    │
    ▼
Respuesta contextualizada
```

---

## Cálculo de Costos

### Precios de GPT-4o-mini (Enero 2026)

| Tipo | Precio por 1M tokens |
|------|---------------------|
| Input (prompt) | $0.15 |
| Output (completion) | $0.60 |

### Cálculo en el Código

```typescript
// Precios de GPT-4o-mini (por 1M tokens)
const INPUT_PRICE_PER_1M = 0.15;
const OUTPUT_PRICE_PER_1M = 0.60;

const inputCost = (usage.prompt_tokens / 1000000) * INPUT_PRICE_PER_1M;
const outputCost = (usage.completion_tokens / 1000000) * OUTPUT_PRICE_PER_1M;
const totalCost = inputCost + outputCost;
```

### Ejemplo de Costos

| Operación | Tokens Input | Tokens Output | Costo USD |
|-----------|--------------|---------------|-----------|
| Generar tareas | ~300 | ~500 | ~$0.00035 |
| Sugerencias | ~150 | ~120 | ~$0.00009 |
| Chat (1 mensaje) | ~200 | ~150 | ~$0.00012 |

### Tracking de Uso

La aplicación trackea el uso de tokens en el estado:

```typescript
interface TokenUsage {
  prompt_tokens: number;
  completion_tokens: number;
  total_tokens: number;
  cost_usd: number;
  requests: number;
}

const [tokenUsage, setTokenUsage] = useState<TokenUsage>({
  prompt_tokens: 0,
  completion_tokens: 0,
  total_tokens: 0,
  cost_usd: 0,
  requests: 0,
});

const updateTokenUsage = (usage: Partial<TokenUsage>) => {
  setTokenUsage(prev => ({
    prompt_tokens: prev.prompt_tokens + (usage.prompt_tokens || 0),
    completion_tokens: prev.completion_tokens + (usage.completion_tokens || 0),
    total_tokens: prev.total_tokens + (usage.total_tokens || 0),
    cost_usd: prev.cost_usd + (usage.cost_usd || 0),
    requests: prev.requests + 1,
  }));
};
```

---

## Manejo de Errores

### Errores Comunes

| Error | Causa | Solución |
|-------|-------|----------|
| 401 Unauthorized | API key inválida | Verificar API key |
| 429 Rate Limit | Demasiadas solicitudes | Esperar y reintentar |
| 500 Server Error | Error de OpenAI | Reintentar más tarde |
| JSON Parse Error | Respuesta malformada | Usar fallback |

### Implementación de Fallback

```typescript
try {
  const cleanContent = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
  const parsed = JSON.parse(cleanContent);
  return NextResponse.json(parsed);
} catch {
  // Fallback si no se puede parsear
  return NextResponse.json({
    tasks: [{
      title: 'Tarea generada',
      description: content.substring(0, 200),
      priority: 'medium',
      subtasks: []
    }]
  });
}
```

---

## Configuración del Modelo

### Parámetros Utilizados

```typescript
{
  model: 'gpt-4o-mini',      // Modelo económico y eficiente
  temperature: 0.7,           // Balance entre creatividad y consistencia
  max_tokens: 1500,           // Límite de tokens de salida
}
```

### Modelos Disponibles

| Modelo | Velocidad | Costo | Calidad |
|--------|-----------|-------|---------|
| gpt-4o-mini | Rápido | Bajo | Buena |
| gpt-4o | Medio | Alto | Excelente |
| gpt-4-turbo | Medio | Alto | Excelente |
| gpt-3.5-turbo | Muy rápido | Muy bajo | Aceptable |

El modelo se puede cambiar en Configuración > IA.

---

## Seguridad

### Mejores Prácticas

1. **No exponer API key en el frontend**
   - Usar variable de entorno cuando sea posible
   - Si se usa localStorage, advertir al usuario

2. **Validar inputs**
   - Limitar longitud de prompts
   - Sanitizar contenido antes de enviar

3. **Rate limiting**
   - Implementar límites de solicitudes por usuario
   - Usar debounce en el frontend

4. **Monitoreo**
   - Trackear uso de tokens
   - Alertar sobre uso anómalo

### Validación de API Key

```typescript
// Validar formato básico
if (!trimmedKey.startsWith('sk-')) {
  setApiKeyStatus('error');
  return;
}

// Validar con OpenAI
const response = await fetch('https://api.openai.com/v1/models', {
  headers: { 'Authorization': `Bearer ${trimmedKey}` },
});

if (response.ok) {
  localStorage.setItem('openai_api_key', trimmedKey);
  setApiKeyStatus('saved');
}
```

---

## Extensibilidad

### Agregar Nuevas Funcionalidades de IA

1. **Crear nuevo endpoint**
```typescript
// app/api/tasks/analyze/route.ts
export async function POST(request: NextRequest) {
  // Nueva funcionalidad
}
```

2. **Definir prompt del sistema**
```typescript
const systemPrompt = `Tu nuevo prompt aquí...`;
```

3. **Integrar en el frontend**
```typescript
const analyzeTask = async (task: Task) => {
  const response = await fetch('/api/tasks/analyze', {
    method: 'POST',
    body: JSON.stringify({ task, apiKey }),
  });
  // Procesar respuesta
};
```

### Cambiar Proveedor de IA

La arquitectura permite cambiar fácilmente el proveedor:

```typescript
// Ejemplo con Anthropic Claude
const response = await fetch('https://api.anthropic.com/v1/messages', {
  headers: {
    'x-api-key': apiKey,
    'anthropic-version': '2023-06-01',
  },
  body: JSON.stringify({
    model: 'claude-3-sonnet-20240229',
    messages: [...],
  }),
});
```

---

## Generación de Imágenes con Google Imagen

TaskIA integra Google Imagen (Vertex AI) para generar imágenes a partir de descripciones de texto.

### Endpoint: POST /api/generate-images

### Configuración Requerida

Antes de usar este endpoint, necesitas:

1. **Proyecto de Google Cloud**
   - Crear o seleccionar un proyecto en [Google Cloud Console](https://console.cloud.google.com/)
   - Habilitar facturación
   - Habilitar la API de Vertex AI

2. **Autenticación** (una de las siguientes opciones):
   
   **Opción A: Access Token Directo**
   ```env
   # .env.local
   GOOGLE_ACCESS_TOKEN=ya29.tu-access-token-aqui
   GOOGLE_CLOUD_PROJECT_ID=tu-project-id
   GOOGLE_CLOUD_REGION=us-central1
   ```
   
   **Opción B: Application Default Credentials (Recomendado para desarrollo local)**
   ```bash
   # Instalar Google Cloud SDK
   gcloud auth application-default login
   ```
   
   **Opción C: Service Account Key**
   ```env
   # .env.local
   GOOGLE_APPLICATION_CREDENTIALS=/ruta/a/service-account-key.json
   GOOGLE_CLOUD_PROJECT_ID=tu-project-id
   ```

### Parámetros del Request

```typescript
{
  prompt: string;              // Requerido: Descripción de la imagen a generar
  apiKey?: string;             // Opcional: Access token de Google Cloud
  projectId?: string;          // Opcional: Google Cloud Project ID
  region?: string;             // Opcional: Región (default: "us-central1")
  model?: string;             // Opcional: Modelo de Imagen (default: "imagen-4.0-generate-001")
  aspectRatio?: string;        // Opcional: "1:1" | "3:4" | "4:3" | "16:9" | "9:16" (default: "1:1")
  sampleCount?: number;        // Opcional: Número de imágenes (1-4, default: 1)
  addWatermark?: boolean;      // Opcional: Agregar watermark digital (default: true)
  enhancePrompt?: boolean;     // Opcional: Mejorar prompt automáticamente (default: true)
}
```

### Ejemplo de Uso

**Request:**
```json
{
  "prompt": "Un gato leyendo un periódico en un café parisino, estilo acuarela",
  "projectId": "mi-proyecto-123",
  "region": "us-central1",
  "aspectRatio": "16:9",
  "sampleCount": 2,
  "apiKey": "ya29.tu-access-token"
}
```

**Response:**
```json
{
  "images": [
    {
      "id": 1,
      "mimeType": "image/png",
      "base64": "iVBORw0KGgoAAAANSUhEUgAA...",
      "dataUrl": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAA...",
      "enhancedPrompt": "A cat reading a newspaper in a Parisian café, watercolor style, soft lighting, artistic composition"
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

### Modelos Disponibles

| Modelo | Descripción | Uso Recomendado |
|--------|-------------|-----------------|
| `imagen-4.0-generate-001` | Modelo estándar GA | Uso general |
| `imagen-4.0-fast-generate-001` | Generación rápida | Cuando la velocidad es prioritaria |
| `imagen-4.0-ultra-generate-001` | Máxima calidad | Cuando se requiere la mejor calidad |
| `imagen-3.0-generate-002` | Versión anterior | Compatibilidad |

**Nota:** Los modelos preview (`imagen-4.0-generate-preview-06-06`) serán removidos el 30 de noviembre de 2025.

### Aspect Ratios Disponibles

- `1:1` - Cuadrado (default)
- `3:4` - Vertical (Ads, redes sociales)
- `4:3` - Horizontal (TV, fotografía)
- `16:9` - Panorámico (paisajes)
- `9:16` - Vertical (retratos, móvil)

### Características

1. **Watermark Digital (SynthID)**
   - Por defecto, todas las imágenes incluyen un watermark invisible
   - Puede verificarse usando la herramienta de verificación de Google
   - Para deshabilitar: `addWatermark: false`

2. **Mejora Automática de Prompts**
   - El modelo puede mejorar automáticamente el prompt para mejores resultados
   - Para prompts complejos con `imagen-4.0-fast-generate-001`, considera deshabilitar: `enhancePrompt: false`

3. **Seguridad y Filtros**
   - El modelo aplica filtros de contenido responsable
   - Puede rechazar prompts que violen políticas de seguridad

### Ejemplo de Implementación en Frontend

```typescript
const generateImage = async (prompt: string) => {
  try {
    const response = await fetch('/api/generate-images', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        prompt,
        projectId: process.env.NEXT_PUBLIC_GOOGLE_PROJECT_ID,
        region: 'us-central1',
        aspectRatio: '16:9',
        sampleCount: 1,
        apiKey: localStorage.getItem('google_access_token'), // Opcional
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error);
    }

    const data = await response.json();
    
    // Mostrar las imágenes generadas
    data.images.forEach((image: any) => {
      const img = document.createElement('img');
      img.src = image.dataUrl;
      document.body.appendChild(img);
    });

    return data;
  } catch (error) {
    console.error('Error generando imagen:', error);
    throw error;
  }
};
```

### Obtención de Access Token

Para obtener un access token de Google Cloud:

```bash
# Opción 1: Usando gcloud CLI
gcloud auth print-access-token

# Opción 2: Usando Application Default Credentials
gcloud auth application-default login
# Luego el token se obtiene automáticamente

# Opción 3: Desde Service Account
gcloud auth activate-service-account --key-file=service-account-key.json
gcloud auth print-access-token
```

### Errores Comunes

| Error | Causa | Solución |
|-------|-------|----------|
| 401 Unauthorized | Token inválido o expirado | Obtener nuevo access token |
| 403 Forbidden | Sin permisos para Vertex AI | Habilitar Vertex AI API y verificar IAM roles |
| 400 Bad Request | Project ID no configurado | Configurar GOOGLE_CLOUD_PROJECT_ID |
| No se generaron imágenes | Contenido filtrado por seguridad | Modificar el prompt |

### Costos

Los costos de Google Imagen varían según:
- Modelo utilizado
- Resolución de la imagen
- Región

Consulta los [precios actuales](https://cloud.google.com/vertex-ai/pricing) en la documentación de Google Cloud.

---

## Arquitectura Actualizada

```
┌─────────────────────────────────────────────────────────────┐
│                      CLIENTE (Browser)                       │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  localStorage: openai_api_key, google_access_token  │   │
│  │                                                       │   │
│  │  ┌──────────────┐  ┌──────────────┐  ┌───────────┐  │   │
│  │  │ TasksPage    │  │ TaskDetail   │  │ Settings  │  │   │
│  │  │ (Generate)   │  │ (Suggestions)│  │ (API Key) │  │   │
│  │  └──────────────┘  └──────────────┘  └───────────┘  │   │
│  └─────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                      NEXT.JS API ROUTES                      │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  /api/tasks/generate     - Genera tareas con IA     │   │
│  │  /api/tasks/suggestions  - Obtiene sugerencias      │   │
│  │  /api/generate-images    - Genera imágenes (Imagen)│   │
│  └─────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
                              │
                    ┌─────────┴─────────┐
                    ▼                   ▼
┌──────────────────────────┐  ┌──────────────────────────┐
│      OPENAI API          │  │   GOOGLE VERTEX AI         │
│  ┌────────────────────┐  │  │  ┌────────────────────┐   │
│  │  Modelo:           │  │  │  │  Modelo:           │   │
│  │  gpt-4o-mini       │  │  │  │  imagen-4.0-*      │   │
│  │  Endpoint:         │  │  │  │  Endpoint:         │   │
│  │  /chat/completions │  │  │  │  /predict          │   │
│  └────────────────────┘  │  │  └────────────────────┘   │
└──────────────────────────┘  └──────────────────────────┘
```
