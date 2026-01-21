import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { prompt, apiKey } = await request.json();

    // Usar API key del cliente o la variable de entorno como fallback
    const openaiApiKey = apiKey || process.env.OPENAI_API_KEY;

    if (!openaiApiKey) {
      return NextResponse.json(
        { error: 'API key de OpenAI no configurada. Ve a Configuración > IA para agregarla.' },
        { status: 400 }
      );
    }

    if (!prompt || !prompt.trim()) {
      return NextResponse.json(
        { error: 'El prompt es requerido' },
        { status: 400 }
      );
    }

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${openaiApiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: `Eres un asistente experto en gestión de proyectos y productividad. 
Tu trabajo es generar listas de tareas estructuradas y accionables con estimaciones de tiempo realistas.

REGLAS:
- Genera entre 3 y 7 tareas principales
- Cada tarea debe tener subtareas cuando sea apropiado (máximo 5 subtareas)
- Asigna prioridades: "high", "medium", o "low"
- IMPORTANTE: Estima el tiempo en MINUTOS que tomará completar cada tarea (considera todas las subtareas)
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
}`
          },
          {
            role: 'user',
            content: `Genera una lista de tareas para: ${prompt}`
          }
        ],
        temperature: 0.7,
        max_tokens: 1500,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error?.message || 'Error de OpenAI');
    }

    const data = await response.json();
    const content = data.choices[0]?.message?.content || '';
    
    // Extraer información de uso de tokens
    const usage = data.usage || { prompt_tokens: 0, completion_tokens: 0, total_tokens: 0 };
    
    // Precios de GPT-4o-mini (por 1M tokens) - Actualizado enero 2025
    const INPUT_PRICE_PER_1M = 0.15;  // $0.15 por 1M tokens de entrada
    const OUTPUT_PRICE_PER_1M = 0.60; // $0.60 por 1M tokens de salida
    
    const inputCost = (usage.prompt_tokens / 1000000) * INPUT_PRICE_PER_1M;
    const outputCost = (usage.completion_tokens / 1000000) * OUTPUT_PRICE_PER_1M;
    const totalCost = inputCost + outputCost;

    // Parsear el JSON de la respuesta
    try {
      // Limpiar el contenido de posibles caracteres extra
      const cleanContent = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      const parsed = JSON.parse(cleanContent);
      return NextResponse.json({
        ...parsed,
        usage: {
          prompt_tokens: usage.prompt_tokens,
          completion_tokens: usage.completion_tokens,
          total_tokens: usage.total_tokens,
          cost_usd: totalCost,
          model: 'gpt-4o-mini'
        }
      }, { status: 200 });
    } catch {
      // Si no se puede parsear, crear una estructura básica
      return NextResponse.json({
        tasks: [
          {
            title: 'Tarea generada',
            description: content.substring(0, 200),
            priority: 'medium',
            subtasks: []
          }
        ],
        usage: {
          prompt_tokens: usage.prompt_tokens,
          completion_tokens: usage.completion_tokens,
          total_tokens: usage.total_tokens,
          cost_usd: totalCost,
          model: 'gpt-4o-mini'
        }
      }, { status: 200 });
    }
  } catch (error) {
    console.error('Error generating tasks:', error);
    const errorMessage = error instanceof Error ? error.message : 'Error al generar tareas';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
