import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { task, apiKey } = await request.json();

    // Usar API key del cliente o la variable de entorno como fallback
    const openaiApiKey = apiKey || process.env.OPENAI_API_KEY;

    if (!openaiApiKey) {
      return NextResponse.json(
        { error: 'API key de OpenAI no configurada. Ve a Configuración > IA para agregarla.' },
        { status: 400 }
      );
    }

    if (!task || !task.title) {
      return NextResponse.json(
        { error: 'La tarea es requerida' },
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
            content: `Eres un asistente de productividad experto. 
Analiza la tarea proporcionada y genera sugerencias útiles para completarla de manera más eficiente.

REGLAS:
- Genera exactamente 3-5 sugerencias
- Las sugerencias deben ser prácticas y accionables
- Considera el contexto y la prioridad de la tarea
- Responde SOLO con JSON válido

FORMATO:
{
  "suggestions": ["Sugerencia 1", "Sugerencia 2", "Sugerencia 3"]
}`
          },
          {
            role: 'user',
            content: `Genera sugerencias para esta tarea:
Título: ${task.title}
Descripción: ${task.description || 'Sin descripción'}
Prioridad: ${task.priority}
Subtareas: ${task.subtasks?.map((st: { title: string }) => st.title).join(', ') || 'Ninguna'}`
          }
        ],
        temperature: 0.7,
        max_tokens: 500,
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

    try {
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
      return NextResponse.json({
        suggestions: [
          'Divide la tarea en pasos más pequeños',
          'Establece un tiempo límite para completarla',
          'Elimina distracciones mientras trabajas en ella'
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
    console.error('Error getting suggestions:', error);
    const errorMessage = error instanceof Error ? error.message : 'Error al obtener sugerencias';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
