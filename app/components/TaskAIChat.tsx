'use client';

import { useState, useRef, useEffect } from 'react';
import {
  PaperAirplaneIcon,
  SparklesIcon,
  UserIcon,
  ArrowPathIcon,
  TrashIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  LightBulbIcon,
} from '@heroicons/react/24/outline';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface TaskContext {
  id: number;
  title: string;
  description: string | null;
  priority: 'low' | 'medium' | 'high';
  subtasks: { id: number; title: string; completed: boolean }[];
  estimated_time: number | null;
  time_spent: number;
  category_name?: string;
}

interface TaskAIChatProps {
  task: TaskContext;
  categoryName?: string;
}

// Sugerencias rápidas para iniciar conversación
const quickPrompts = [
  { icon: '🎯', text: '¿Cómo empiezo esta tarea?' },
  { icon: '📝', text: 'Dame un plan paso a paso' },
  { icon: '⚡', text: '¿Cómo puedo hacerlo más rápido?' },
  { icon: '❓', text: 'Explícame qué debo hacer' },
];

// Estados emocionales del usuario
const emotionalStates = [
  { 
    id: 'going-well',
    icon: '✅', 
    label: 'Voy bien',
    message: '[ESTADO: Voy bien con la tarea]',
    color: 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 border-green-200 dark:border-green-800 hover:bg-green-200 dark:hover:bg-green-900/50'
  },
  { 
    id: 'stuck',
    icon: '😐', 
    label: 'Estoy estancado',
    message: '[ESTADO: Estoy estancado y necesito ayuda para avanzar]',
    color: 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300 border-yellow-200 dark:border-yellow-800 hover:bg-yellow-200 dark:hover:bg-yellow-900/50'
  },
  { 
    id: 'blocked',
    icon: '😵‍💫', 
    label: 'Me siento bloqueado',
    message: '[ESTADO: Me siento completamente bloqueado y frustrado]',
    color: 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 border-red-200 dark:border-red-800 hover:bg-red-200 dark:hover:bg-red-900/50'
  },
];

export default function TaskAIChat({ task, categoryName }: TaskAIChatProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isExpanded, setIsExpanded] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Auto-scroll al último mensaje
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Generar ID único para mensajes
  const generateId = () => `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  // Construir el contexto de la tarea para el sistema
  const buildTaskContext = () => {
    const subtasksInfo = task.subtasks.length > 0
      ? `\nSubtareas:\n${task.subtasks.map((st, i) => `  ${i + 1}. [${st.completed ? '✓' : ' '}] ${st.title}`).join('\n')}`
      : '';
    
    const timeInfo = task.estimated_time 
      ? `\nTiempo estimado: ${Math.floor(task.estimated_time / 60)} minutos`
      : '';
    
    const timeSpentInfo = task.time_spent > 0
      ? `\nTiempo ya trabajado: ${Math.floor(task.time_spent / 60)} minutos`
      : '';

    return `CONTEXTO DE LA TAREA:
Título: ${task.title}
Descripción: ${task.description || 'Sin descripción'}
Prioridad: ${task.priority === 'high' ? 'Alta' : task.priority === 'medium' ? 'Media' : 'Baja'}
Categoría: ${categoryName || 'Sin categoría'}${subtasksInfo}${timeInfo}${timeSpentInfo}`;
  };

  // Enviar mensaje
  const sendMessage = async (messageText?: string) => {
    const text = messageText || input.trim();
    if (!text || isLoading) return;

    // Verificar si es un estado emocional para mostrar un mensaje más amigable
    const emotionalState = emotionalStates.find(state => state.message === text);
    const displayText = emotionalState 
      ? `${emotionalState.icon} ${emotionalState.label}`
      : text;

    const userMessage: Message = {
      id: generateId(),
      role: 'user',
      content: displayText,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const apiKey = localStorage.getItem('openai_api_key');
      
      if (!apiKey) {
        const errorMessage: Message = {
          id: generateId(),
          role: 'assistant',
          content: 'No tienes configurada tu API key de OpenAI. Ve a Configuración > IA para agregarla.',
          timestamp: new Date(),
        };
        setMessages(prev => [...prev, errorMessage]);
        setIsLoading(false);
        return;
      }

      // Construir historial de mensajes para contexto
      const conversationHistory = messages.map(msg => ({
        role: msg.role as 'user' | 'assistant',
        content: msg.content,
      }));

      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: [
            {
              role: 'system',
              content: `Eres un asistente de productividad experto y amigable. Tu ÚNICO objetivo es ayudar al usuario a completar la tarea específica que tiene asignada.

${buildTaskContext()}

REGLAS IMPORTANTES:
1. SOLO responde preguntas relacionadas con esta tarea específica
2. Si el usuario pregunta algo no relacionado, amablemente redirige la conversación a la tarea
3. Sé conciso pero útil - respuestas claras y accionables
4. Si la tarea tiene subtareas, ayuda a priorizarlas o explicarlas
5. Ofrece consejos prácticos y específicos
6. Si el usuario parece atascado, sugiere el siguiente paso concreto
7. Usa formato markdown cuando sea útil (listas, negritas, etc.)
8. Mantén un tono motivador y positivo
9. Responde en español

ESTADOS EMOCIONALES DEL USUARIO:
El usuario puede indicar su estado emocional. Responde de forma apropiada:

- Si dice "[ESTADO: Voy bien con la tarea]": Felicítalo brevemente, pregunta en qué parte está y ofrece consejos para mantener el momentum. Sé entusiasta pero no exagerado.

- Si dice "[ESTADO: Estoy estancado y necesito ayuda para avanzar]": Sé comprensivo, pregunta específicamente dónde se atascó, y ofrece 2-3 sugerencias concretas para desbloquear. Divide el problema en partes más pequeñas.

- Si dice "[ESTADO: Me siento completamente bloqueado y frustrado]": Sé muy empático y calmado. Primero valida su frustración. Luego sugiere dar un paso atrás, respirar, y ofrece empezar desde el principio con pasos muy pequeños y manejables. Pregunta qué es lo que más le frustra específicamente.`,
            },
            ...conversationHistory,
            {
              role: 'user',
              content: text,
            },
          ],
          temperature: 0.7,
          max_tokens: 500,
        }),
      });

      if (!response.ok) {
        throw new Error('Error al comunicarse con la IA');
      }

      const data = await response.json();
      const assistantContent = data.choices[0]?.message?.content || 'Lo siento, no pude generar una respuesta.';

      const assistantMessage: Message = {
        id: generateId(),
        role: 'assistant',
        content: assistantContent,
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Error en chat:', error);
      const errorMessage: Message = {
        id: generateId(),
        role: 'assistant',
        content: 'Hubo un error al procesar tu mensaje. Por favor, intenta de nuevo.',
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  // Limpiar chat
  const clearChat = () => {
    setMessages([]);
  };

  // Manejar tecla Enter
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  // Formatear contenido con markdown mejorado
  const formatContent = (content: string) => {
    let formatted = content;
    
    // Procesar línea por línea para mejor control
    const lines = formatted.split('\n');
    const processedLines: string[] = [];
    let inList = false;
    let listType: 'ul' | 'ol' | null = null;
    
    for (let i = 0; i < lines.length; i++) {
      let line = lines[i];
      
      // Headers ### ## #
      if (line.startsWith('### ')) {
        if (inList) { processedLines.push(listType === 'ul' ? '</ul>' : '</ol>'); inList = false; }
        line = `<h4 class="font-semibold text-gray-900 dark:text-white mt-3 mb-1">${line.substring(4)}</h4>`;
      } else if (line.startsWith('## ')) {
        if (inList) { processedLines.push(listType === 'ul' ? '</ul>' : '</ol>'); inList = false; }
        line = `<h3 class="font-bold text-gray-900 dark:text-white mt-3 mb-1">${line.substring(3)}</h3>`;
      } else if (line.startsWith('# ')) {
        if (inList) { processedLines.push(listType === 'ul' ? '</ul>' : '</ol>'); inList = false; }
        line = `<h2 class="font-bold text-lg text-gray-900 dark:text-white mt-3 mb-1">${line.substring(2)}</h2>`;
      }
      // Listas con viñetas (- o *)
      else if (line.match(/^[\-\*]\s/)) {
        if (!inList || listType !== 'ul') {
          if (inList) processedLines.push('</ol>');
          processedLines.push('<ul class="list-disc list-inside space-y-1 my-2">');
          inList = true;
          listType = 'ul';
        }
        line = `<li class="text-gray-700 dark:text-gray-300">${line.substring(2)}</li>`;
      }
      // Listas numeradas (1. 2. etc)
      else if (line.match(/^\d+\.\s/)) {
        if (!inList || listType !== 'ol') {
          if (inList) processedLines.push('</ul>');
          processedLines.push('<ol class="list-decimal list-inside space-y-1 my-2">');
          inList = true;
          listType = 'ol';
        }
        line = `<li class="text-gray-700 dark:text-gray-300">${line.replace(/^\d+\.\s/, '')}</li>`;
      }
      // Línea vacía o normal
      else {
        if (inList && line.trim() === '') {
          processedLines.push(listType === 'ul' ? '</ul>' : '</ol>');
          inList = false;
          listType = null;
        }
        if (line.trim() !== '' && !line.startsWith('<')) {
          line = `<p class="my-1">${line}</p>`;
        }
      }
      
      processedLines.push(line);
    }
    
    // Cerrar lista si quedó abierta
    if (inList) {
      processedLines.push(listType === 'ul' ? '</ul>' : '</ol>');
    }
    
    formatted = processedLines.join('');
    
    // Convertir **texto** a negrita
    formatted = formatted.replace(/\*\*(.*?)\*\*/g, '<strong class="font-semibold">$1</strong>');
    // Convertir *texto* a cursiva (pero no los que ya son parte de listas)
    formatted = formatted.replace(/(?<!\<)\*([^\*]+)\*(?!\>)/g, '<em>$1</em>');
    // Convertir `código` a código inline
    formatted = formatted.replace(/`([^`]+)`/g, '<code class="bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 px-1.5 py-0.5 rounded text-xs font-mono">$1</code>');
    // Convertir enlaces [texto](url)
    formatted = formatted.replace(/\[([^\]]+)\]\(([^\)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer" class="text-indigo-600 dark:text-indigo-400 hover:underline">$1</a>');
    
    // Limpiar párrafos vacíos
    formatted = formatted.replace(/<p class="my-1"><\/p>/g, '');
    
    return formatted;
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden">
      {/* Header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full p-4 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
      >
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-lg flex items-center justify-center">
            <SparklesIcon className="w-5 h-5 text-white" />
          </div>
          <div className="text-left">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              Asistente IA
            </h2>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Pregúntame sobre esta tarea
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {messages.length > 0 && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                clearChat();
              }}
              className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
              title="Limpiar chat"
            >
              <TrashIcon className="w-4 h-4" />
            </button>
          )}
          {isExpanded ? (
            <ChevronUpIcon className="w-5 h-5 text-gray-500" />
          ) : (
            <ChevronDownIcon className="w-5 h-5 text-gray-500" />
          )}
        </div>
      </button>

      {isExpanded && (
        <div className="border-t border-gray-200 dark:border-gray-700">
          {/* Messages Area */}
          <div className="h-80 overflow-y-auto p-4 space-y-4 bg-gray-50 dark:bg-gray-900/50">
            {messages.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center">
                <div className="w-16 h-16 bg-gradient-to-br from-purple-100 to-indigo-100 dark:from-purple-900/30 dark:to-indigo-900/30 rounded-full flex items-center justify-center mb-4">
                  <LightBulbIcon className="w-8 h-8 text-purple-600 dark:text-purple-400" />
                </div>
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  ¿Necesitas ayuda con esta tarea?
                </p>
                <div className="flex flex-wrap justify-center gap-2">
                  {quickPrompts.map((prompt, idx) => (
                    <button
                      key={idx}
                      onClick={() => sendMessage(prompt.text)}
                      className="px-3 py-1.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-full text-sm text-gray-700 dark:text-gray-300 hover:border-purple-500 hover:text-purple-600 dark:hover:text-purple-400 transition-colors flex items-center gap-1.5"
                    >
                      <span>{prompt.icon}</span>
                      {prompt.text}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <>
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex gap-3 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    {message.role === 'assistant' && (
                      <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-lg flex items-center justify-center flex-shrink-0">
                        <SparklesIcon className="w-4 h-4 text-white" />
                      </div>
                    )}
                    <div
                      className={`max-w-[85%] px-4 py-3 rounded-2xl ${
                        message.role === 'user'
                          ? 'bg-indigo-600 text-white rounded-br-md'
                          : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-bl-md shadow-sm border border-gray-100 dark:border-gray-700'
                      }`}
                    >
                      <div 
                        className={`text-sm leading-relaxed prose-sm ${
                          message.role === 'user' 
                            ? 'text-white [&_strong]:text-white [&_em]:text-indigo-100' 
                            : '[&_h2]:text-gray-900 [&_h3]:text-gray-900 [&_h4]:text-gray-800 dark:[&_h2]:text-white dark:[&_h3]:text-white dark:[&_h4]:text-gray-200'
                        }`}
                        dangerouslySetInnerHTML={{ __html: formatContent(message.content) }}
                      />
                      <p className={`text-[10px] mt-1 ${
                        message.role === 'user' ? 'text-indigo-200' : 'text-gray-400'
                      }`}>
                        {message.timestamp.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                    {message.role === 'user' && (
                      <div className="w-8 h-8 bg-gray-200 dark:bg-gray-700 rounded-lg flex items-center justify-center flex-shrink-0">
                        <UserIcon className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                      </div>
                    )}
                  </div>
                ))}
                {isLoading && (
                  <div className="flex gap-3 justify-start">
                    <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-lg flex items-center justify-center flex-shrink-0">
                      <SparklesIcon className="w-4 h-4 text-white" />
                    </div>
                    <div className="bg-white dark:bg-gray-800 px-4 py-3 rounded-2xl rounded-bl-md shadow-sm border border-gray-100 dark:border-gray-700">
                      <div className="flex items-center gap-2">
                        <ArrowPathIcon className="w-4 h-4 text-purple-500 animate-spin" />
                        <span className="text-sm text-gray-500 dark:text-gray-400">Pensando...</span>
                      </div>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </>
            )}
          </div>

          {/* Emotional States */}
          <div className="px-4 py-3 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-2 text-center font-medium">
              ¿Cómo te sientes con la tarea?
            </p>
            <div className="flex justify-center gap-2">
              {emotionalStates.map((state) => (
                <button
                  key={state.id}
                  onClick={() => sendMessage(state.message)}
                  disabled={isLoading}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all disabled:opacity-50 disabled:cursor-not-allowed ${state.color}`}
                >
                  <span className="mr-1">{state.icon}</span>
                  {state.label}
                </button>
              ))}
            </div>
          </div>

          {/* Input Area */}
          <div className="p-4 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
            <div className="flex items-end gap-2">
              <textarea
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Escribe tu pregunta sobre la tarea..."
                rows={1}
                className="flex-1 px-4 py-2.5 border border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent dark:bg-gray-700 dark:text-white resize-none text-sm"
                style={{ minHeight: '44px', maxHeight: '120px' }}
                disabled={isLoading}
              />
              <button
                onClick={() => sendMessage()}
                disabled={!input.trim() || isLoading}
                className="p-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-xl hover:from-purple-700 hover:to-indigo-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0"
              >
                {isLoading ? (
                  <ArrowPathIcon className="w-5 h-5 animate-spin" />
                ) : (
                  <PaperAirplaneIcon className="w-5 h-5" />
                )}
              </button>
            </div>
            <p className="text-[10px] text-gray-400 dark:text-gray-500 mt-2 text-center">
              La IA está enfocada únicamente en ayudarte con esta tarea
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
