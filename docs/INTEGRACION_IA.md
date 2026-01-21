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
