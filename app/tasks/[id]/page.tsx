'use client';

import { useState, useEffect, use, useRef } from 'react';
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
  DocumentArrowUpIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';
import { CheckCircleIcon as CheckCircleSolidIcon } from '@heroicons/react/24/solid';
import TaskAIChat from '@/app/components/TaskAIChat';
import Confetti from '@/app/components/Confetti';
import type { Document } from '@/lib/types';
import { convertUrlsToMarkdownLinks } from '@/lib/comment-utils';

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
  const commentTextareaRef = useRef<HTMLTextAreaElement>(null);
  const [newSubtaskTitle, setNewSubtaskTitle] = useState('');
  const [showSubtaskInput, setShowSubtaskInput] = useState(false);
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);
  const [showComments, setShowComments] = useState(true);
  const [showSubtasks, setShowSubtasks] = useState(true);
  const [showTaskFiles, setShowTaskFiles] = useState(true);
  const [taskDocuments, setTaskDocuments] = useState<Document[]>([]);
  const [isLoadingDocuments, setIsLoadingDocuments] = useState(false);
  const [isUploadingDocuments, setIsUploadingDocuments] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const [previousProgress, setPreviousProgress] = useState<number | null>(null);
  
  // Estados del cronómetro
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [currentTime, setCurrentTime] = useState(0); // Tiempo actual de la sesión
  const [showEstimatedTimeInput, setShowEstimatedTimeInput] = useState(false);
  const [estimatedHours, setEstimatedHours] = useState(0);
  const [estimatedMinutes, setEstimatedMinutes] = useState(0);
  const [showTimerModal, setShowTimerModal] = useState(false);
  const [taskTimerAutoStart, setTaskTimerAutoStart] = useState(false);

  const taskRef = useRef<Task | null>(null);
  const currentTimeRef = useRef(0);
  const autoStartDoneRef = useRef(false);

  taskRef.current = task;
  currentTimeRef.current = currentTime;

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

  // Guardar tiempo cuando se pausa o detiene (o desde flush/beacon)
  const saveTimeSpent = async (additionalTime: number, taskOverride?: Task | null) => {
    const t = taskOverride ?? task;
    if (!t || additionalTime === 0) return;
    const newTimeSpent = (t.time_spent || 0) + additionalTime;
    try {
      const response = await fetch(`/api/db/tasks/${t.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ time_spent: newTimeSpent }),
      });
      if (response.ok) {
        setTask((prev) => (prev && prev.id === t.id ? { ...prev, time_spent: newTimeSpent } : prev));
      }
    } catch (error) {
      console.error('Error guardando tiempo:', error);
    }
  };

  // Flush sesión actual al servidor y resetear currentTime (para auto-guardado cada minuto)
  const flushSessionTime = async () => {
    const t = taskRef.current;
    const c = currentTimeRef.current;
    if (!t || c === 0) return;
    await saveTimeSpent(c, t);
    setCurrentTime(0);
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
    autoStartDoneRef.current = false;
  }, [resolvedParams.id]);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [catResponse, taskResponse, settingsResponse] = await Promise.all([
          fetch('/api/db/categories'),
          fetch(`/api/db/tasks/${resolvedParams.id}`),
          fetch('/api/db/settings'),
        ]);

        if (settingsResponse.ok) {
          const settingsData = await settingsResponse.json();
          if (settingsData.success && settingsData.data?.task_timer_auto_start != null) {
            setTaskTimerAutoStart(Boolean(settingsData.data.task_timer_auto_start));
          }
        }

        if (catResponse.ok) {
          const catData = await catResponse.json();
          if (catData.success && catData.data) setCategories(catData.data);
        }

        if (taskResponse.ok) {
          const taskData = await taskResponse.json();
          if (taskData.success && taskData.data) {
            setTask(taskData.data);
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

  // Auto-iniciar cronómetro si está activada la opción en configuración
  useEffect(() => {
    if (!task || !taskTimerAutoStart || autoStartDoneRef.current) return;
    autoStartDoneRef.current = true;
    setIsTimerRunning(true);
  }, [task, taskTimerAutoStart]);

  // Con tiempo automático: guardar cada minuto y al salir/recargar
  useEffect(() => {
    if (!taskTimerAutoStart || !task) return;

    const interval = setInterval(() => {
      if (currentTimeRef.current > 0) flushSessionTime();
    }, 60 * 1000);

    const handleBeforeUnload = () => {
      const c = currentTimeRef.current;
      if (c === 0) return;
      const t = taskRef.current;
      if (!t) return;
      const newTimeSpent = (t.time_spent || 0) + c;
      fetch(`/api/db/tasks/${t.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ time_spent: newTimeSpent }),
        keepalive: true,
      }).catch(() => {});
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      clearInterval(interval);
      window.removeEventListener('beforeunload', handleBeforeUnload);
      const c = currentTimeRef.current;
      if (c > 0 && taskRef.current) {
        const t = taskRef.current;
        const newTimeSpent = (t.time_spent || 0) + c;
        fetch(`/api/db/tasks/${t.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ time_spent: newTimeSpent }),
          keepalive: true,
        }).catch(() => {});
      }
    };
  }, [taskTimerAutoStart, task?.id]);

  // Cargar categoría cuando cambie la tarea
  useEffect(() => {
    if (task?.category_id && categories.length > 0) {
      const taskCategory = categories.find(c => c.id === task.category_id);
      setCategory(taskCategory || null);
    }
  }, [task?.category_id, categories]);

  // Cargar documentos adjuntos de la tarea
  const loadTaskDocuments = async (taskId: number) => {
    setIsLoadingDocuments(true);
    try {
      const res = await fetch(`/api/db/documents?ref_table=tasks&ref_id=${taskId}`);
      if (res.ok) {
        const data = await res.json();
        if (data.success && Array.isArray(data.data)) setTaskDocuments(data.data);
      }
    } catch (e) {
      console.error('Error cargando documentos:', e);
    } finally {
      setIsLoadingDocuments(false);
    }
  };
  useEffect(() => {
    if (task?.id) loadTaskDocuments(task.id);
  }, [task?.id]);

  const uploadTaskDocuments = async (files: File[]) => {
    if (!task?.id || !files.length) return;
    setIsUploadingDocuments(true);
    try {
      const form = new FormData();
      form.set('ref_table', 'tasks');
      form.set('ref_id', String(task.id));
      files.forEach((f) => form.append('files', f));
      const res = await fetch('/api/db/documents', { method: 'POST', body: form });
      if (res.ok) {
        const data = await res.json();
        if (data.success && Array.isArray(data.data)) setTaskDocuments((prev) => [...prev, ...data.data]);
      }
    } catch (e) {
      console.error('Error subiendo documentos:', e);
    } finally {
      setIsUploadingDocuments(false);
    }
  };

  const deleteTaskDocument = async (docId: number) => {
    try {
      const res = await fetch(`/api/db/documents/${docId}`, { method: 'DELETE' });
      if (res.ok) setTaskDocuments((prev) => prev.filter((d) => d.id !== docId));
    } catch (e) {
      console.error('Error eliminando documento:', e);
    }
  };

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
          text: newComment.trim(),
          task_id: task.id,
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

  const deleteComment = async (commentId: number) => {
    if (!task) return;
    try {
      const response = await fetch(`/api/db/comments/${commentId}`, {
        method: 'DELETE',
      });
      if (response.ok) {
        setTask({
          ...task,
          comments: task.comments.filter((c) => c.id !== commentId),
        });
      }
    } catch (error) {
      console.error('Error eliminando comentario:', error);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
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
                href="/home"
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

      <main className="max-w-4xl mx-auto px-3 sm:px-4 md:px-6 py-4 sm:py-6 space-y-4 sm:space-y-6">
        {/* Description */}
        {task.description && (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-4 sm:p-6">
            <h2 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white mb-2 sm:mb-3 flex items-center gap-2">
              <PencilIcon className="w-5 h-5 flex-shrink-0" />
              Descripción
            </h2>
            <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 whitespace-pre-wrap break-words">
              {task.description}
            </p>
          </div>
        )}

        {/* Subtasks */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden">
          <button
            onClick={() => setShowSubtasks(!showSubtasks)}
            className="w-full p-3 sm:p-4 flex items-center justify-between gap-2 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors touch-manipulation"
          >
            <h2 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2 min-w-0">
              <CheckCircleIcon className="w-5 h-5 flex-shrink-0" />
              <span className="truncate">Subtareas ({completedSubtasks}/{totalSubtasks})</span>
            </h2>
            {showSubtasks ? (
              <ChevronUpIcon className="w-5 h-5 text-gray-500 flex-shrink-0" />
            ) : (
              <ChevronDownIcon className="w-5 h-5 text-gray-500 flex-shrink-0" />
            )}
          </button>
          
          {showSubtasks && (
            <div className="px-3 sm:px-4 pb-3 sm:pb-4">
              <div className="space-y-2">
                {task.subtasks.map((subtask) => (
                  <div
                    key={subtask.id}
                    className="flex items-center gap-2 sm:gap-3 p-2.5 sm:p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg group hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                  >
                    <button onClick={() => toggleSubtask(subtask.id)} className="flex-shrink-0 touch-manipulation p-0.5">
                      {subtask.completed ? (
                        <CheckCircleSolidIcon className="w-5 h-5 sm:w-6 sm:h-6 text-green-500" />
                      ) : (
                        <CheckCircleIcon className="w-5 h-5 sm:w-6 sm:h-6 text-gray-400 hover:text-green-500 transition-colors" />
                      )}
                    </button>
                    <span className={`flex-1 min-w-0 text-sm sm:text-base truncate ${subtask.completed ? 'line-through text-gray-400' : 'text-gray-700 dark:text-gray-300'}`}>
                      {subtask.title}
                    </span>
                    <button
                      onClick={() => deleteSubtask(subtask.id)}
                      className="p-1.5 sm:p-2 text-gray-300 dark:text-gray-600 hover:text-red-500 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-all flex-shrink-0 touch-manipulation"
                      title="Eliminar subtarea"
                    >
                      <TrashIcon className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>

              {/* Add subtask */}
              {showSubtaskInput ? (
                <div className="mt-3 flex flex-col sm:flex-row gap-2">
                  <input
                    type="text"
                    value={newSubtaskTitle}
                    onChange={(e) => setNewSubtaskTitle(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && addSubtask()}
                    placeholder="Nueva subtarea..."
                    className="flex-1 min-w-0 px-3 py-2.5 sm:py-2 text-sm sm:text-base border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white"
                    autoFocus
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={addSubtask}
                      className="flex-1 sm:flex-none px-4 py-2.5 sm:py-2 text-sm font-medium bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors touch-manipulation"
                    >
                      Agregar
                    </button>
                    <button
                      onClick={() => {
                        setShowSubtaskInput(false);
                        setNewSubtaskTitle('');
                      }}
                      className="px-3 py-2.5 sm:py-2 text-sm text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 touch-manipulation"
                    >
                      Cancelar
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => setShowSubtaskInput(true)}
                  className="mt-3 w-full py-2.5 sm:py-2 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg text-sm sm:text-base text-gray-500 hover:border-indigo-500 hover:text-indigo-500 transition-colors flex items-center justify-center gap-2 touch-manipulation"
                >
                  <PlusIcon className="w-5 h-5 flex-shrink-0" />
                  Agregar subtarea
                </button>
              )}
            </div>
          )}
        </div>

        {/* Archivos adjuntos (guardados en /files y tabla documents) */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden">
          <button
            onClick={() => setShowTaskFiles(!showTaskFiles)}
            className="w-full p-3 sm:p-4 flex items-center justify-between gap-2 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors touch-manipulation"
          >
            <h2 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2 min-w-0">
              <DocumentArrowUpIcon className="w-5 h-5 text-indigo-500 flex-shrink-0" />
              <span className="truncate">Archivos adjuntos</span>
              {taskDocuments.length > 0 && (
                <span className="text-sm font-normal text-gray-500 dark:text-gray-400 flex-shrink-0">
                  ({taskDocuments.length})
                </span>
              )}
            </h2>
            {showTaskFiles ? (
              <ChevronUpIcon className="w-5 h-5 text-gray-500 flex-shrink-0" />
            ) : (
              <ChevronDownIcon className="w-5 h-5 text-gray-500 flex-shrink-0" />
            )}
          </button>
          {showTaskFiles && (
            <div className="px-3 sm:px-4 pb-3 sm:pb-4 space-y-3">
              <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">
                Archivos en esta tarea. PDF, Word, PowerPoint, etc. El asistente IA usará su contenido como contexto.
              </p>
              <div className="flex flex-col gap-2">
                <input
                  type="file"
                  accept=".pdf,.doc,.docx,.ppt,.pptx,.csv,.txt,.xls,.xlsx"
                  multiple
                  disabled={isUploadingDocuments}
                  onChange={(e) => {
                    const added = Array.from(e.target.files || []);
                    if (!added.length) return;
                    uploadTaskDocuments(added);
                    e.target.value = '';
                  }}
                  className="block w-full text-xs sm:text-sm text-gray-500 dark:text-gray-400 file:mr-2 file:py-2 file:px-3 file:rounded-lg file:border-0 file:bg-indigo-50 dark:file:bg-indigo-900/30 file:text-indigo-600 dark:file:text-indigo-400 file:font-medium file:cursor-pointer file:text-sm disabled:opacity-50"
                />
                {isLoadingDocuments ? (
                  <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 flex items-center gap-2">
                    <ArrowPathIcon className="w-4 h-4 animate-spin flex-shrink-0" />
                    Cargando documentos...
                  </p>
                ) : isUploadingDocuments ? (
                  <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 flex items-center gap-2">
                    <ArrowPathIcon className="w-4 h-4 animate-spin flex-shrink-0" />
                    Subiendo...
                  </p>
                ) : taskDocuments.length > 0 ? (
                  <ul className="flex flex-col sm:flex-row sm:flex-wrap gap-2">
                    {taskDocuments.map((doc) => (
                      <li
                        key={doc.id}
                        className="flex items-center gap-2 min-w-0 px-3 py-2.5 sm:py-2 bg-gray-100 dark:bg-gray-700 rounded-lg text-sm text-gray-700 dark:text-gray-300"
                      >
                        <DocumentArrowUpIcon className="w-4 h-4 text-gray-400 flex-shrink-0" />
                        <span className="truncate min-w-0 flex-1 sm:max-w-[160px] md:max-w-[200px]" title={doc.original_filename}>{doc.original_filename}</span>
                        {doc.size_bytes != null && (
                          <span className="text-xs text-gray-400 flex-shrink-0">{(doc.size_bytes / 1024).toFixed(1)} KB</span>
                        )}
                        <button
                          type="button"
                          onClick={() => deleteTaskDocument(doc.id)}
                          className="p-1.5 text-gray-400 hover:text-red-500 rounded flex-shrink-0 touch-manipulation"
                          title="Eliminar"
                        >
                          <XMarkIcon className="w-4 h-4" />
                        </button>
                      </li>
                    ))}
                  </ul>
                ) : null}
              </div>
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
          taskPageContextText={taskDocuments
            .filter((d) => d.extracted_text)
            .map((d) => `[Archivo: ${d.original_filename}]\n${d.extracted_text}`)
            .join('\n\n---\n\n')}
        />

        {/* Comentarios - mismo diseño que /tasks */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden border border-gray-200 dark:border-gray-700">
          <button
            onClick={() => setShowComments(!showComments)}
            className="w-full p-3 sm:p-4 flex items-center justify-between gap-2 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors touch-manipulation"
          >
            <h2 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2 min-w-0">
              <ChatBubbleLeftIcon className="w-5 h-5 text-indigo-600 dark:text-indigo-400 flex-shrink-0" />
              <span className="truncate">Comentarios ({task.comments.length})</span>
            </h2>
            {showComments ? (
              <ChevronUpIcon className="w-5 h-5 text-gray-500 flex-shrink-0" />
            ) : (
              <ChevronDownIcon className="w-5 h-5 text-gray-500 flex-shrink-0" />
            )}
          </button>

          {showComments && (
            <div className="px-3 sm:px-4 pb-4 sm:pb-6 border-t border-gray-200 dark:border-gray-700 pt-3 sm:pt-4">
              {/* Lista de comentarios */}
              <div className="space-y-3 sm:space-y-4 mb-4">
                {task.comments.length === 0 ? (
                  <div className="text-center py-6 sm:py-8 bg-gray-50 dark:bg-gray-700/30 rounded-xl border-2 border-dashed border-gray-200 dark:border-gray-700">
                    <ChatBubbleLeftIcon className="w-10 h-10 sm:w-12 sm:h-12 mx-auto mb-2 sm:mb-3 text-gray-300 dark:text-gray-600" />
                    <p className="text-sm sm:text-base text-gray-500 dark:text-gray-400">No hay comentarios aún</p>
                    <p className="text-xs sm:text-sm text-gray-400 dark:text-gray-500 mt-1">Sé el primero en comentar</p>
                  </div>
                ) : (
                  task.comments.map((comment) => (
                    <div
                      key={comment.id}
                      className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-3 sm:p-4 group hover:shadow-md transition-shadow"
                    >
                      <div className="flex items-start justify-between gap-2 sm:gap-3">
                        <div className="flex items-start gap-2 sm:gap-3 min-w-0 flex-1">
                          <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center shadow-md flex-shrink-0">
                            <UserIcon className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-semibold text-sm sm:text-base text-gray-900 dark:text-white truncate">
                                {comment.author}
                              </span>
                              <span className="text-xs text-gray-400 dark:text-gray-500 flex items-center gap-1 flex-shrink-0">
                                <ClockIcon className="w-3 h-3" />
                                {formatDate(comment.created_at)}
                              </span>
                            </div>
                            <div className="text-sm sm:text-base text-gray-700 dark:text-gray-300 mt-1.5 sm:mt-2 whitespace-pre-wrap break-words">
                              {comment.text.split(/(\[.*?\]\(.*?\))/g).map((part, index) => {
                                const linkMatch = part.match(/\[(.*?)\]\((.*?)\)/);
                                if (linkMatch) {
                                  return (
                                    <a
                                      key={index}
                                      href={linkMatch[2]}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="text-indigo-600 dark:text-indigo-400 hover:underline inline-flex items-center gap-1 break-all"
                                    >
                                      {linkMatch[1]}
                                      <svg className="w-3 h-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                      </svg>
                                    </a>
                                  );
                                }
                                return <span key={index}>{part}</span>;
                              })}
                            </div>
                          </div>
                        </div>
                        <button
                          onClick={() => deleteComment(comment.id)}
                          className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-all flex-shrink-0 touch-manipulation min-w-[2.5rem] min-h-[2.5rem] flex items-center justify-center"
                          title="Eliminar comentario"
                        >
                          <TrashIcon className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Agregar comentario */}
              <div className="bg-gray-50 dark:bg-gray-700/30 p-3 sm:p-4 rounded-xl">
                <div className="flex gap-2 sm:gap-3">
                  <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center shadow-md flex-shrink-0">
                    <UserIcon className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-1 mb-2 pb-2 border-b border-gray-200 dark:border-gray-600">
                      <button
                        type="button"
                        onClick={() => {
                          const url = prompt('Ingresa la URL del enlace:');
                          if (url) {
                            const linkText = prompt('Texto del enlace (opcional):') || url;
                            setNewComment((prev) => prev + `[${linkText}](${url})`);
                          }
                        }}
                        className="p-2 text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 rounded-lg transition-colors touch-manipulation"
                        title="Insertar enlace"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                        </svg>
                      </button>
                      <button
                        type="button"
                        onClick={() => setNewComment((prev) => prev + '\n\n')}
                        className="p-2 text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 rounded-lg transition-colors touch-manipulation"
                        title="Nuevo párrafo"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h7" />
                        </svg>
                      </button>
                      <button
                        type="button"
                        onClick={() => setNewComment((prev) => prev + '\n• ')}
                        className="p-2 text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 rounded-lg transition-colors touch-manipulation"
                        title="Agregar viñeta"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                        </svg>
                      </button>
                      <span className="text-xs text-gray-400 ml-auto sm:ml-0 sm:flex-1 sm:text-right">{newComment.length} caracteres</span>
                    </div>
                    <textarea
                      ref={commentTextareaRef}
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                      onPaste={(e) => {
                        const pasted = e.clipboardData.getData('text');
                        const processed = convertUrlsToMarkdownLinks(pasted);
                        if (pasted !== processed) {
                          e.preventDefault();
                          const ta = commentTextareaRef.current;
                          if (ta) {
                            const start = ta.selectionStart;
                            const end = ta.selectionEnd;
                            const next = newComment.slice(0, start) + processed + newComment.slice(end);
                            setNewComment(next);
                          }
                        }
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && e.ctrlKey) {
                          addComment();
                        }
                      }}
                      placeholder="Escribe un comentario... (Ctrl+Enter para enviar). Al pegar texto, los enlaces se convierten automáticamente."
                      rows={3}
                      className="w-full px-3 sm:px-4 py-2.5 sm:py-3 text-sm sm:text-base border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent dark:bg-gray-700 dark:text-white resize-none min-h-[4.5rem]"
                    />
                    <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-between gap-3 mt-3">
                      <p className="text-xs text-gray-400 dark:text-gray-500 flex items-center gap-1">
                        <LightBulbIcon className="w-3 h-3 flex-shrink-0" /> Tip: Usa [texto](url) para enlaces
                      </p>
                      <button
                        onClick={addComment}
                        disabled={!newComment.trim()}
                        className="px-4 sm:px-5 py-2.5 sm:py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-md flex items-center justify-center gap-2 touch-manipulation"
                      >
                        <PaperAirplaneIcon className="w-4 h-4" />
                        Enviar
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Metadata */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-4 sm:p-6">
          <h2 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white mb-3 sm:mb-4 flex items-center gap-2">
            <ClockIcon className="w-5 h-5" />
            Información
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 text-sm">
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
