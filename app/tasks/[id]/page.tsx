'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeftIcon,
  CheckCircleIcon,
  TrashIcon,
  PlusIcon,
  ClockIcon,
  FolderIcon,
  ChatBubbleLeftIcon,
  PaperAirplaneIcon,
  UserIcon,
  SparklesIcon,
  ArrowPathIcon,
  LightBulbIcon,
  CpuChipIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  PencilIcon,
  HomeIcon,
  ListBulletIcon,
  PlayIcon,
  PauseIcon,
  StopIcon,
} from '@heroicons/react/24/outline';
import { CheckCircleIcon as CheckCircleSolidIcon } from '@heroicons/react/24/solid';
import TaskAIChat from '@/app/components/TaskAIChat';
import Confetti from '@/app/components/Confetti';

interface Comment {
  id: number;
  text: string;
  author: string;
  created_at: string;
}

interface Subtask {
  id: number;
  title: string;
  completed: boolean;
  task_id: number;
}

interface Task {
  id: number;
  title: string;
  description: string | null;
  completed: boolean;
  priority: 'low' | 'medium' | 'high';
  due_date?: string | null;
  subtasks: Subtask[];
  ai_suggestions?: string[] | null;
  comments: Comment[];
  created_at: string;
  category_id: number | null;
  time_spent: number; // Tiempo trabajado en segundos
  estimated_time: number | null; // Tiempo estimado en segundos
}

interface Category {
  id: number;
  name: string;
  color: string;
  icon: string;
}

const priorityColors = {
  low: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  medium: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
  high: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
};

const priorityLabels = {
  low: 'Baja',
  medium: 'Media',
  high: 'Alta',
};

const categoryColors = [
  { name: 'Azul', value: 'bg-blue-500', gradient: 'from-blue-500 to-blue-700' },
  { name: 'Verde', value: 'bg-green-500', gradient: 'from-green-500 to-green-700' },
  { name: 'Morado', value: 'bg-purple-500', gradient: 'from-purple-500 to-purple-700' },
  { name: 'Naranja', value: 'bg-orange-500', gradient: 'from-orange-500 to-orange-700' },
  { name: 'Rosa', value: 'bg-pink-500', gradient: 'from-pink-500 to-pink-700' },
  { name: 'Cyan', value: 'bg-cyan-500', gradient: 'from-cyan-500 to-cyan-700' },
  { name: 'Rojo', value: 'bg-red-500', gradient: 'from-red-500 to-red-700' },
  { name: 'Indigo', value: 'bg-indigo-500', gradient: 'from-indigo-500 to-indigo-700' },
];

export default function TaskDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const router = useRouter();
  const [task, setTask] = useState<Task | null>(null);
  const [category, setCategory] = useState<Category | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [newComment, setNewComment] = useState('');
  const [newSubtaskTitle, setNewSubtaskTitle] = useState('');
  const [showSubtaskInput, setShowSubtaskInput] = useState(false);
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);
  const [showComments, setShowComments] = useState(true);
  const [showSubtasks, setShowSubtasks] = useState(true);
  const [showConfetti, setShowConfetti] = useState(false);
  const [previousProgress, setPreviousProgress] = useState<number | null>(null);
  
  // Estados del cronómetro
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [currentTime, setCurrentTime] = useState(0); // Tiempo actual de la sesión
  const [showEstimatedTimeInput, setShowEstimatedTimeInput] = useState(false);
  const [estimatedHours, setEstimatedHours] = useState(0);
  const [estimatedMinutes, setEstimatedMinutes] = useState(0);
  const [showTimerModal, setShowTimerModal] = useState(false);

  // Efecto para el cronómetro
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    
    if (isTimerRunning) {
      interval = setInterval(() => {
        setCurrentTime(prev => prev + 1);
      }, 1000);
    }
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isTimerRunning]);

  // Guardar tiempo cuando se pausa o detiene
  const saveTimeSpent = async (additionalTime: number) => {
    if (!task || additionalTime === 0) return;
    
    const newTimeSpent = (task.time_spent || 0) + additionalTime;
    
    try {
      const response = await fetch(`/api/db/tasks/${task.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ time_spent: newTimeSpent }),
      });

      if (response.ok) {
        setTask({ ...task, time_spent: newTimeSpent });
      }
    } catch (error) {
      console.error('Error guardando tiempo:', error);
    }
  };

  // Controles del cronómetro
  const startTimer = () => {
    setIsTimerRunning(true);
  };

  const pauseTimer = async () => {
    setIsTimerRunning(false);
    await saveTimeSpent(currentTime);
    setCurrentTime(0);
  };

  const stopTimer = async () => {
    setIsTimerRunning(false);
    await saveTimeSpent(currentTime);
    setCurrentTime(0);
  };

  // Guardar tiempo estimado
  const saveEstimatedTime = async () => {
    if (!task) return;
    
    const totalSeconds = (estimatedHours * 3600) + (estimatedMinutes * 60);
    
    try {
      const response = await fetch(`/api/db/tasks/${task.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ estimated_time: totalSeconds || null }),
      });

      if (response.ok) {
        setTask({ ...task, estimated_time: totalSeconds || null });
        setShowEstimatedTimeInput(false);
      }
    } catch (error) {
      console.error('Error guardando tiempo estimado:', error);
    }
  };

  // Formatear tiempo (segundos a HH:MM:SS)
  const formatTime = (seconds: number): string => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hrs > 0) {
      return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Formatear tiempo para mostrar (más legible)
  const formatTimeReadable = (seconds: number): string => {
    if (!seconds) return '0 min';
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    
    if (hrs > 0 && mins > 0) return `${hrs} hrs ${mins} min`;
    if (hrs > 0) return `${hrs} hrs`;
    return `${mins} min`;
  };

  useEffect(() => {
    const loadData = async () => {
      try {
        // Cargar categorías
        const catResponse = await fetch('/api/db/categories');
        if (catResponse.ok) {
          const catData = await catResponse.json();
          if (catData.success && catData.data) {
            setCategories(catData.data);
          }
        }

        // Cargar tarea específica
        const taskResponse = await fetch(`/api/db/tasks/${resolvedParams.id}`);
        if (taskResponse.ok) {
          const taskData = await taskResponse.json();
          if (taskData.success && taskData.data) {
            setTask(taskData.data);
            // Buscar categoría de la tarea
            if (taskData.data.category_id && catResponse.ok) {
              const catData = await catResponse.json().catch(() => null);
              if (catData?.success && catData?.data) {
                const taskCategory = catData.data.find((c: Category) => c.id === taskData.data.category_id);
                setCategory(taskCategory || null);
              }
            }
          }
        }
      } catch (error) {
        console.error('Error cargando datos:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [resolvedParams.id]);

  // Cargar categoría cuando cambie la tarea
  useEffect(() => {
    if (task?.category_id && categories.length > 0) {
      const taskCategory = categories.find(c => c.id === task.category_id);
      setCategory(taskCategory || null);
    }
  }, [task?.category_id, categories]);

  const getCategoryGradient = (color: string) => {
    const found = categoryColors.find(c => c.value === color);
    return found ? found.gradient : 'from-indigo-500 to-purple-500';
  };

  const toggleTaskCompleted = async () => {
    if (!task) return;
    
    try {
      const response = await fetch(`/api/db/tasks/${task.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ completed: !task.completed }),
      });

      if (response.ok) {
        setTask({ ...task, completed: !task.completed });
      }
    } catch (error) {
      console.error('Error actualizando tarea:', error);
    }
  };

  const toggleSubtask = async (subtaskId: number) => {
    if (!task) return;
    
    const subtask = task.subtasks.find(s => s.id === subtaskId);
    if (!subtask) return;

    try {
      const response = await fetch(`/api/db/subtasks/${subtaskId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ completed: !subtask.completed }),
      });

      if (response.ok) {
        setTask({
          ...task,
          subtasks: task.subtasks.map(s =>
            s.id === subtaskId ? { ...s, completed: !s.completed } : s
          ),
        });
      }
    } catch (error) {
      console.error('Error actualizando subtarea:', error);
    }
  };

  const addSubtask = async () => {
    if (!task || !newSubtaskTitle.trim()) return;

    try {
      const response = await fetch('/api/db/subtasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          task_id: task.id,
          title: newSubtaskTitle.trim(),
        }),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success && data.data) {
          setTask({
            ...task,
            subtasks: [...task.subtasks, data.data],
          });
          setNewSubtaskTitle('');
          setShowSubtaskInput(false);
        }
      }
    } catch (error) {
      console.error('Error agregando subtarea:', error);
    }
  };

  const deleteSubtask = async (subtaskId: number) => {
    if (!task) return;

    try {
      const response = await fetch(`/api/db/subtasks/${subtaskId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setTask({
          ...task,
          subtasks: task.subtasks.filter(s => s.id !== subtaskId),
        });
      }
    } catch (error) {
      console.error('Error eliminando subtarea:', error);
    }
  };

  const addComment = async () => {
    if (!task || !newComment.trim()) return;

    try {
      const response = await fetch('/api/db/comments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          task_id: task.id,
          text: newComment.trim(),
          author: 'John Doe',
        }),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success && data.data) {
          setTask({
            ...task,
            comments: [...task.comments, data.data],
          });
          setNewComment('');
        }
      }
    } catch (error) {
      console.error('Error agregando comentario:', error);
    }
  };

  const getAISuggestions = async () => {
    if (!task) return;
    
    setIsLoadingSuggestions(true);

    try {
      const apiKey = localStorage.getItem('openai_api_key');
      const response = await fetch('/api/tasks/suggestions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ task, apiKey }),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.suggestions) {
          // Guardar sugerencias en la base de datos
          await fetch(`/api/db/tasks/${task.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ai_suggestions: data.suggestions }),
          });

          setTask({ ...task, ai_suggestions: data.suggestions });
        }
      }
    } catch (error) {
      console.error('Error obteniendo sugerencias:', error);
    } finally {
      setIsLoadingSuggestions(false);
    }
  };

  const deleteTask = async () => {
    if (!task) return;
    
    if (!confirm('¿Estás seguro de que deseas eliminar esta tarea?')) return;

    try {
      const response = await fetch(`/api/db/tasks/${task.id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        router.push('/tasks');
      }
    } catch (error) {
      console.error('Error eliminando tarea:', error);
    }
  };

  // Calcular progreso de forma segura (antes de los returns condicionales)
  const completedSubtasks = task?.subtasks?.filter(s => s.completed).length ?? 0;
  const totalSubtasks = task?.subtasks?.length ?? 0;
  const progress = totalSubtasks > 0 ? (completedSubtasks / totalSubtasks) * 100 : 0;

  // Efecto para detectar cuando se completa el 100% de las subtareas
  // IMPORTANTE: Este hook debe estar antes de cualquier return condicional
  useEffect(() => {
    // Solo mostrar confeti si:
    // 1. Hay tarea y subtareas
    // 2. El progreso actual es 100%
    // 3. El progreso anterior no era 100% (para evitar mostrar al cargar)
    if (task && totalSubtasks > 0 && progress === 100 && previousProgress !== null && previousProgress < 100) {
      setShowConfetti(true);
    }
    setPreviousProgress(progress);
  }, [task, progress, totalSubtasks, previousProgress]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-indigo-900 flex items-center justify-center">
        <div className="text-center">
          <ArrowPathIcon className="w-12 h-12 text-indigo-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400">Cargando tarea...</p>
        </div>
      </div>
    );
  }

  if (!task) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-indigo-900 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 dark:text-gray-400 mb-4">Tarea no encontrada</p>
          <Link
            href="/tasks"
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
          >
            Volver a tareas
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-indigo-900">
      {/* Confetti Animation */}
      <Confetti 
        isActive={showConfetti} 
        onComplete={() => setShowConfetti(false)} 
      />

      {/* Header with category color */}
      <header className={`bg-gradient-to-r ${category ? getCategoryGradient(category.color) : 'from-indigo-500 to-purple-500'} text-white`}>
        <div className="max-w-4xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <Link
                href="/"
                className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                title="Inicio"
              >
                <HomeIcon className="w-5 h-5" />
              </Link>
              <Link
                href="/tasks"
                className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                title="Todas las tareas"
              >
                <ListBulletIcon className="w-5 h-5" />
              </Link>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={deleteTask}
                className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                title="Eliminar tarea"
              >
                <TrashIcon className="w-5 h-5" />
              </button>
            </div>
          </div>
          
          <div className="flex items-start gap-4">
            <button
              onClick={toggleTaskCompleted}
              className="mt-1 flex-shrink-0"
            >
              {task.completed ? (
                <CheckCircleSolidIcon className="w-8 h-8 text-white" />
              ) : (
                <CheckCircleIcon className="w-8 h-8 text-white/70 hover:text-white transition-colors" />
              )}
            </button>
            <div className="flex-1">
              <h1 className={`text-2xl font-bold ${task.completed ? 'line-through opacity-70' : ''}`}>
                {task.title}
              </h1>
              <div className="flex items-center gap-3 mt-2 text-white/80 text-sm">
                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                  task.priority === 'high' ? 'bg-red-500/30' :
                  task.priority === 'medium' ? 'bg-yellow-500/30' : 'bg-green-500/30'
                }`}>
                  Prioridad {priorityLabels[task.priority]}
                </span>
                {category && (
                  <span className="flex items-center gap-1">
                    <FolderIcon className="w-4 h-4" />
                    {category.name}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Progress bar */}
          {totalSubtasks > 0 && (
            <div className="mt-4">
              <div className="flex items-center justify-between text-sm text-white/80 mb-1">
                <span>Progreso</span>
                <span>{completedSubtasks}/{totalSubtasks} subtareas</span>
              </div>
              <div className="w-full bg-white/20 rounded-full h-2">
                <div
                  className="bg-white rounded-full h-2 transition-all"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          )}

          {/* Cronómetro discreto */}
          <div className="mt-4 flex items-center justify-between">
            <div className="flex items-center gap-4">
              {/* Tiempo actual / cronómetro - Clickeable para abrir modal */}
              <button
                onClick={() => setShowTimerModal(true)}
                className="flex items-center gap-2 bg-white/10 hover:bg-white/20 rounded-lg px-3 py-2 transition-colors cursor-pointer"
                title="Click para ver cronómetro grande"
              >
                <ClockIcon className="w-4 h-4" />
                <span className={`font-mono text-lg font-semibold ${isTimerRunning ? 'text-green-300' : ''}`}>
                  {formatTime((task.time_spent || 0) + currentTime)}
                </span>
                {currentTime > 0 && (
                  <span className="text-xs text-white/60">
                    (+{formatTime(currentTime)})
                  </span>
                )}
              </button>

              {/* Controles */}
              <div className="flex items-center gap-1">
                {!isTimerRunning ? (
                  <button
                    onClick={startTimer}
                    className="p-2 bg-green-500/20 hover:bg-green-500/30 rounded-lg transition-colors"
                    title="Iniciar"
                  >
                    <PlayIcon className="w-5 h-5 text-green-300" />
                  </button>
                ) : (
                  <>
                    <button
                      onClick={pauseTimer}
                      className="p-2 bg-yellow-500/20 hover:bg-yellow-500/30 rounded-lg transition-colors"
                      title="Pausar y guardar"
                    >
                      <PauseIcon className="w-5 h-5 text-yellow-300" />
                    </button>
                    <button
                      onClick={stopTimer}
                      className="p-2 bg-red-500/20 hover:bg-red-500/30 rounded-lg transition-colors"
                      title="Detener y guardar"
                    >
                      <StopIcon className="w-5 h-5 text-red-300" />
                    </button>
                  </>
                )}
              </div>
            </div>

            {/* Tiempo estimado */}
            <div className="flex items-center gap-2">
              {task.estimated_time ? (
                <div className="flex items-center gap-2 text-sm">
                  <span className="text-white/60">Estimado:</span>
                  <span className={`font-medium ${
                    (task.time_spent || 0) + currentTime > task.estimated_time 
                      ? 'text-red-300' 
                      : 'text-white'
                  }`}>
                    {formatTimeReadable(task.estimated_time)}
                  </span>
                  {(task.time_spent || 0) + currentTime > task.estimated_time && (
                    <span className="text-xs text-red-300">
                      (excedido)
                    </span>
                  )}
                  <button
                    onClick={() => {
                      const hrs = Math.floor((task.estimated_time || 0) / 3600);
                      const mins = Math.floor(((task.estimated_time || 0) % 3600) / 60);
                      setEstimatedHours(hrs);
                      setEstimatedMinutes(mins);
                      setShowEstimatedTimeInput(true);
                    }}
                    className="p-1 hover:bg-white/10 rounded transition-colors"
                    title="Editar tiempo estimado"
                  >
                    <PencilIcon className="w-3.5 h-3.5" />
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setShowEstimatedTimeInput(true)}
                  className="text-sm text-white/60 hover:text-white/80 transition-colors flex items-center gap-1"
                >
                  <PlusIcon className="w-4 h-4" />
                  Agregar tiempo estimado
                </button>
              )}
            </div>
          </div>

          {/* Modal para tiempo estimado */}
          {showEstimatedTimeInput && (
            <div className="mt-3 p-3 bg-white/10 rounded-lg">
              <p className="text-sm text-white/80 mb-2">Tiempo estimado para completar:</p>
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1">
                  <input
                    type="number"
                    min="0"
                    max="99"
                    value={estimatedHours}
                    onChange={(e) => setEstimatedHours(Math.max(0, parseInt(e.target.value) || 0))}
                    className="w-16 px-2 py-1 bg-white/20 border border-white/30 rounded text-center text-white"
                  />
                  <span className="text-sm text-white/60">h</span>
                </div>
                <div className="flex items-center gap-1">
                  <input
                    type="number"
                    min="0"
                    max="59"
                    value={estimatedMinutes}
                    onChange={(e) => setEstimatedMinutes(Math.min(59, Math.max(0, parseInt(e.target.value) || 0)))}
                    className="w-16 px-2 py-1 bg-white/20 border border-white/30 rounded text-center text-white"
                  />
                  <span className="text-sm text-white/60">min</span>
                </div>
                <button
                  onClick={saveEstimatedTime}
                  className="px-3 py-1 bg-white/20 hover:bg-white/30 rounded text-sm font-medium transition-colors"
                >
                  Guardar
                </button>
                <button
                  onClick={() => setShowEstimatedTimeInput(false)}
                  className="px-3 py-1 hover:bg-white/10 rounded text-sm text-white/60 transition-colors"
                >
                  Cancelar
                </button>
              </div>
            </div>
          )}
        </div>
      </header>

      {/* Modal del Cronómetro Grande */}
      {showTimerModal && (
        <div 
          className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={() => setShowTimerModal(false)}
        >
          <div 
            className={`bg-gradient-to-br ${category ? getCategoryGradient(category.color) : 'from-indigo-600 to-purple-700'} rounded-3xl shadow-2xl p-8 max-w-lg w-full`}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header del modal */}
            <div className="text-center mb-6">
              <h3 className="text-white/80 text-lg font-medium">{task.title}</h3>
              <p className="text-white/50 text-sm mt-1">Cronómetro de tarea</p>
            </div>

            {/* Tiempo principal grande */}
            <div className="text-center mb-8">
              <div className={`font-mono text-7xl md:text-8xl font-bold tracking-wider ${isTimerRunning ? 'text-green-300' : 'text-white'}`}>
                {formatTime((task.time_spent || 0) + currentTime)}
              </div>
              {currentTime > 0 && (
                <p className="text-white/50 text-lg mt-2">
                  Sesión actual: +{formatTime(currentTime)}
                </p>
              )}
            </div>

            {/* Controles grandes */}
            <div className="flex justify-center gap-4 mb-8">
              {!isTimerRunning ? (
                <button
                  onClick={startTimer}
                  className="w-20 h-20 bg-green-500/30 hover:bg-green-500/50 rounded-full flex items-center justify-center transition-all hover:scale-105 border-2 border-green-400/50"
                  title="Iniciar"
                >
                  <PlayIcon className="w-10 h-10 text-green-300" />
                </button>
              ) : (
                <>
                  <button
                    onClick={pauseTimer}
                    className="w-20 h-20 bg-yellow-500/30 hover:bg-yellow-500/50 rounded-full flex items-center justify-center transition-all hover:scale-105 border-2 border-yellow-400/50"
                    title="Pausar y guardar"
                  >
                    <PauseIcon className="w-10 h-10 text-yellow-300" />
                  </button>
                  <button
                    onClick={stopTimer}
                    className="w-20 h-20 bg-red-500/30 hover:bg-red-500/50 rounded-full flex items-center justify-center transition-all hover:scale-105 border-2 border-red-400/50"
                    title="Detener y guardar"
                  >
                    <StopIcon className="w-10 h-10 text-red-300" />
                  </button>
                </>
              )}
            </div>

            {/* Info adicional */}
            <div className="grid grid-cols-2 gap-4 text-center">
              <div className="bg-white/10 rounded-xl p-4">
                <p className="text-white/50 text-sm mb-1">Tiempo total</p>
                <p className="text-white font-mono text-xl font-semibold">
                  {formatTimeReadable(task.time_spent || 0)}
                </p>
              </div>
              <div className="bg-white/10 rounded-xl p-4">
                <p className="text-white/50 text-sm mb-1">Tiempo estimado</p>
                <p className={`font-mono text-xl font-semibold ${
                  task.estimated_time && (task.time_spent || 0) + currentTime > task.estimated_time
                    ? 'text-red-300'
                    : 'text-white'
                }`}>
                  {task.estimated_time ? formatTimeReadable(task.estimated_time) : '—'}
                </p>
              </div>
            </div>

            {/* Progreso si hay tiempo estimado */}
            {task.estimated_time && (
              <div className="mt-6">
                <div className="flex justify-between text-sm text-white/60 mb-2">
                  <span>Progreso de tiempo</span>
                  <span>{Math.min(100, Math.round(((task.time_spent || 0) + currentTime) / task.estimated_time * 100))}%</span>
                </div>
                <div className="w-full bg-white/20 rounded-full h-3">
                  <div
                    className={`h-3 rounded-full transition-all ${
                      (task.time_spent || 0) + currentTime > task.estimated_time
                        ? 'bg-red-400'
                        : 'bg-green-400'
                    }`}
                    style={{ width: `${Math.min(100, ((task.time_spent || 0) + currentTime) / task.estimated_time * 100)}%` }}
                  />
                </div>
              </div>
            )}

            {/* Botón cerrar */}
            <button
              onClick={() => setShowTimerModal(false)}
              className="mt-6 w-full py-3 bg-white/10 hover:bg-white/20 rounded-xl text-white/80 font-medium transition-colors"
            >
              Cerrar
            </button>
          </div>
        </div>
      )}

      <main className="max-w-4xl mx-auto px-4 py-6 space-y-6">
        {/* Description */}
        {task.description && (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
              <PencilIcon className="w-5 h-5" />
              Descripción
            </h2>
            <p className="text-gray-600 dark:text-gray-400 whitespace-pre-wrap">
              {task.description}
            </p>
          </div>
        )}

        {/* Subtasks */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden">
          <button
            onClick={() => setShowSubtasks(!showSubtasks)}
            className="w-full p-4 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
          >
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
              <CheckCircleIcon className="w-5 h-5" />
              Subtareas ({completedSubtasks}/{totalSubtasks})
            </h2>
            {showSubtasks ? (
              <ChevronUpIcon className="w-5 h-5 text-gray-500" />
            ) : (
              <ChevronDownIcon className="w-5 h-5 text-gray-500" />
            )}
          </button>
          
          {showSubtasks && (
            <div className="px-4 pb-4">
              <div className="space-y-2">
                {task.subtasks.map((subtask) => (
                  <div
                    key={subtask.id}
                    className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg group hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                  >
                    <button onClick={() => toggleSubtask(subtask.id)}>
                      {subtask.completed ? (
                        <CheckCircleSolidIcon className="w-6 h-6 text-green-500" />
                      ) : (
                        <CheckCircleIcon className="w-6 h-6 text-gray-400 hover:text-green-500 transition-colors" />
                      )}
                    </button>
                    <span className={`flex-1 ${subtask.completed ? 'line-through text-gray-400' : 'text-gray-700 dark:text-gray-300'}`}>
                      {subtask.title}
                    </span>
                    <button
                      onClick={() => deleteSubtask(subtask.id)}
                      className="p-1.5 text-gray-300 dark:text-gray-600 hover:text-red-500 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-all"
                      title="Eliminar subtarea"
                    >
                      <TrashIcon className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>

              {/* Add subtask */}
              {showSubtaskInput ? (
                <div className="mt-3 flex items-center gap-2">
                  <input
                    type="text"
                    value={newSubtaskTitle}
                    onChange={(e) => setNewSubtaskTitle(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && addSubtask()}
                    placeholder="Nueva subtarea..."
                    className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white"
                    autoFocus
                  />
                  <button
                    onClick={addSubtask}
                    className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                  >
                    Agregar
                  </button>
                  <button
                    onClick={() => {
                      setShowSubtaskInput(false);
                      setNewSubtaskTitle('');
                    }}
                    className="p-2 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                  >
                    Cancelar
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setShowSubtaskInput(true)}
                  className="mt-3 w-full py-2 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg text-gray-500 hover:border-indigo-500 hover:text-indigo-500 transition-colors flex items-center justify-center gap-2"
                >
                  <PlusIcon className="w-5 h-5" />
                  Agregar subtarea
                </button>
              )}
            </div>
          )}
        </div>

        {/* AI Suggestions */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
              <SparklesIcon className="w-5 h-5 text-purple-500" />
              Sugerencias de IA
            </h2>
            <button
              onClick={getAISuggestions}
              disabled={isLoadingSuggestions}
              className="px-3 py-1.5 bg-gradient-to-r from-purple-600 to-indigo-600 text-white text-sm rounded-lg hover:from-purple-700 hover:to-indigo-700 transition-all disabled:opacity-50 flex items-center gap-2"
            >
              {isLoadingSuggestions ? (
                <>
                  <ArrowPathIcon className="w-4 h-4 animate-spin" />
                  Generando...
                </>
              ) : (
                <>
                  <CpuChipIcon className="w-4 h-4" />
                  {task.ai_suggestions ? 'Regenerar' : 'Obtener sugerencias'}
                </>
              )}
            </button>
          </div>

          {task.ai_suggestions && task.ai_suggestions.length > 0 ? (
            <div className="space-y-2">
              {task.ai_suggestions.map((suggestion, index) => (
                <div
                  key={index}
                  className="flex items-start gap-3 p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg"
                >
                  <LightBulbIcon className="w-5 h-5 text-purple-500 flex-shrink-0 mt-0.5" />
                  <p className="text-gray-700 dark:text-gray-300 text-sm">{suggestion}</p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 dark:text-gray-400 text-sm text-center py-4">
              Haz clic en &quot;Obtener sugerencias&quot; para recibir consejos de IA sobre cómo completar esta tarea.
            </p>
          )}
        </div>

        {/* AI Chat Assistant */}
        <TaskAIChat 
          task={{
            id: task.id,
            title: task.title,
            description: task.description,
            priority: task.priority,
            subtasks: task.subtasks,
            estimated_time: task.estimated_time,
            time_spent: task.time_spent,
          }}
          categoryName={category?.name}
        />

        {/* Comments */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden">
          <button
            onClick={() => setShowComments(!showComments)}
            className="w-full p-4 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
          >
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
              <ChatBubbleLeftIcon className="w-5 h-5" />
              Comentarios ({task.comments.length})
            </h2>
            {showComments ? (
              <ChevronUpIcon className="w-5 h-5 text-gray-500" />
            ) : (
              <ChevronDownIcon className="w-5 h-5 text-gray-500" />
            )}
          </button>

          {showComments && (
            <div className="px-4 pb-4">
              {/* Comments list */}
              <div className="space-y-3 mb-4">
                {task.comments.length === 0 ? (
                  <p className="text-gray-500 dark:text-gray-400 text-sm text-center py-4">
                    No hay comentarios aún. ¡Sé el primero en comentar!
                  </p>
                ) : (
                  task.comments.map((comment) => (
                    <div key={comment.id} className="p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-8 h-8 bg-indigo-100 dark:bg-indigo-900/30 rounded-full flex items-center justify-center">
                          <UserIcon className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                        </div>
                        <div>
                          <p className="font-medium text-gray-900 dark:text-white text-sm">{comment.author}</p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            {new Date(comment.created_at).toLocaleString('es-ES')}
                          </p>
                        </div>
                      </div>
                      <p className="text-gray-700 dark:text-gray-300 text-sm whitespace-pre-wrap ml-10">
                        {comment.text}
                      </p>
                    </div>
                  ))
                )}
              </div>

              {/* Add comment */}
              <div className="flex items-start gap-2">
                <textarea
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && e.ctrlKey) {
                      addComment();
                    }
                  }}
                  placeholder="Escribe un comentario... (Ctrl+Enter para enviar)"
                  rows={2}
                  className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white resize-none"
                />
                <button
                  onClick={addComment}
                  disabled={!newComment.trim()}
                  className="p-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <PaperAirplaneIcon className="w-5 h-5" />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Metadata */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <ClockIcon className="w-5 h-5" />
            Información
          </h2>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-gray-500 dark:text-gray-400">Creada</p>
              <p className="text-gray-900 dark:text-white font-medium">
                {new Date(task.created_at).toLocaleString('es-ES')}
              </p>
            </div>
            <div>
              <p className="text-gray-500 dark:text-gray-400">Estado</p>
              <p className={`font-medium ${task.completed ? 'text-green-600' : 'text-amber-600'}`}>
                {task.completed ? 'Completada' : 'Pendiente'}
              </p>
            </div>
            <div>
              <p className="text-gray-500 dark:text-gray-400">Prioridad</p>
              <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${priorityColors[task.priority]}`}>
                {priorityLabels[task.priority]}
              </span>
            </div>
            <div>
              <p className="text-gray-500 dark:text-gray-400">Categoría</p>
              <p className="text-gray-900 dark:text-white font-medium flex items-center gap-1">
                {category && <span className={`w-3 h-3 rounded-full ${category.color}`}></span>}
                {category?.name || 'Sin categoría'}
              </p>
            </div>
            <div>
              <p className="text-gray-500 dark:text-gray-400">Tiempo trabajado</p>
              <p className="text-gray-900 dark:text-white font-medium font-mono">
                {formatTimeReadable(task.time_spent || 0)}
              </p>
            </div>
            <div>
              <p className="text-gray-500 dark:text-gray-400">Tiempo estimado</p>
              <p className={`font-medium font-mono ${
                task.estimated_time && (task.time_spent || 0) > task.estimated_time
                  ? 'text-red-600 dark:text-red-400'
                  : 'text-gray-900 dark:text-white'
              }`}>
                {task.estimated_time ? formatTimeReadable(task.estimated_time) : 'No definido'}
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
