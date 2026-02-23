'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import {
  CheckCircleIcon,
  TrashIcon,
  PlusIcon,
  SparklesIcon,
  ArrowLeftIcon,
  ClockIcon,
  FolderIcon,
  ChevronDownIcon,
  ChevronRightIcon,
  ChatBubbleLeftIcon,
  PaperAirplaneIcon,
  UserIcon,
  Cog6ToothIcon,
  ChartBarIcon,
  ListBulletIcon,
  ArrowPathIcon,
  LightBulbIcon,
  CpuChipIcon,
  StarIcon,
  CheckIcon,
  XMarkIcon,
  RocketLaunchIcon,
  CurrencyDollarIcon,
  CalculatorIcon,
  DocumentArrowUpIcon,
} from '@heroicons/react/24/outline';
import { CheckCircleIcon as CheckCircleSolidIcon } from '@heroicons/react/24/solid';
import { convertUrlsToMarkdownLinks } from '@/lib/comment-utils';

// Interfaz para el uso de tokens
interface TokenUsage {
  prompt_tokens: number;
  completion_tokens: number;
  total_tokens: number;
  cost_usd: number;
  requests: number;
}

// Función helper para renderizar iconos de categoría
const getCategoryIcon = (iconName: string, className: string = "w-4 h-4") => {
  const icons: { [key: string]: React.ReactNode } = {
    'folder': <FolderIcon className={className} />,
    'cpu': <CpuChipIcon className={className} />,
    'star': <StarIcon className={className} />,
    'chart': <ChartBarIcon className={className} />,
    'list': <ListBulletIcon className={className} />,
    'sparkles': <SparklesIcon className={className} />,
  };
  return icons[iconName] || <FolderIcon className={className} />;
};

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
}

interface Category {
  id: number;
  name: string;
  color: string;
  icon: string;
  created_at: string;
  is_default: boolean;
  isExpanded: boolean;
  project_id?: number | null;
}

interface Project {
  id: number;
  name: string;
  user_id: number;
  created_at: string;
  updated_at: string;
  category_count?: number;
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
  { name: 'Azul', value: 'bg-blue-500', light: 'bg-blue-100 dark:bg-blue-900/30', text: 'text-blue-600 dark:text-blue-400', gradient: 'from-blue-500 to-blue-700' },
  { name: 'Verde', value: 'bg-green-500', light: 'bg-green-100 dark:bg-green-900/30', text: 'text-green-600 dark:text-green-400', gradient: 'from-green-500 to-green-700' },
  { name: 'Morado', value: 'bg-purple-500', light: 'bg-purple-100 dark:bg-purple-900/30', text: 'text-purple-600 dark:text-purple-400', gradient: 'from-purple-500 to-purple-700' },
  { name: 'Naranja', value: 'bg-orange-500', light: 'bg-orange-100 dark:bg-orange-900/30', text: 'text-orange-600 dark:text-orange-400', gradient: 'from-orange-500 to-orange-700' },
  { name: 'Rosa', value: 'bg-pink-500', light: 'bg-pink-100 dark:bg-pink-900/30', text: 'text-pink-600 dark:text-pink-400', gradient: 'from-pink-500 to-pink-700' },
  { name: 'Cyan', value: 'bg-cyan-500', light: 'bg-cyan-100 dark:bg-cyan-900/30', text: 'text-cyan-600 dark:text-cyan-400', gradient: 'from-cyan-500 to-cyan-700' },
  { name: 'Rojo', value: 'bg-red-500', light: 'bg-red-100 dark:bg-red-900/30', text: 'text-red-600 dark:text-red-400', gradient: 'from-red-500 to-red-700' },
  { name: 'Indigo', value: 'bg-indigo-500', light: 'bg-indigo-100 dark:bg-indigo-900/30', text: 'text-indigo-600 dark:text-indigo-400', gradient: 'from-indigo-500 to-indigo-700' },
];

// Límite de categorías para plan gratuito (sin contar la categoría por defecto)
const FREE_PLAN_CATEGORY_LIMIT = 20;

// Interfaz de configuración
interface Settings {
  default_priority: 'low' | 'medium' | 'high';
  default_category_id: number | null;
  show_completed_tasks: boolean;
  ai_suggestions_enabled: boolean;
  show_empty_categories: boolean;
  max_categories: number;
}

const defaultSettings: Settings = {
  default_priority: 'medium',
  default_category_id: null,
  show_completed_tasks: true,
  ai_suggestions_enabled: true,
  show_empty_categories: true,
  max_categories: 10,
};

export default function TasksPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<number | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [settings, setSettings] = useState<Settings>(defaultSettings);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [selectedCategoryForNewTask, setSelectedCategoryForNewTask] = useState<number | null>(null);
  const [newTaskPriority, setNewTaskPriority] = useState<'low' | 'medium' | 'high'>('medium');
  const [isGenerating, setIsGenerating] = useState(false);
  const [aiPrompt, setAiPrompt] = useState('');
  const [aiCategoryName, setAiCategoryName] = useState('');
  const [aiContextFiles, setAiContextFiles] = useState<File[]>([]);
  const [showAiPanel, setShowAiPanel] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);
  const [showNewCategoryModal, setShowNewCategoryModal] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newCategoryColor, setNewCategoryColor] = useState(categoryColors[0].value);
  const [newComment, setNewComment] = useState('');
  const commentTextareaRef = useRef<HTMLTextAreaElement>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showPremiumModal, setShowPremiumModal] = useState(false);
  const [tokenUsage, setTokenUsage] = useState<TokenUsage>({
    prompt_tokens: 0,
    completion_tokens: 0,
    total_tokens: 0,
    cost_usd: 0,
    requests: 0,
  });

  // Función para actualizar el uso de tokens
  const updateTokenUsage = (usage: { prompt_tokens: number; completion_tokens: number; total_tokens: number; cost_usd: number }) => {
    setTokenUsage(prev => ({
      prompt_tokens: prev.prompt_tokens + usage.prompt_tokens,
      completion_tokens: prev.completion_tokens + usage.completion_tokens,
      total_tokens: prev.total_tokens + usage.total_tokens,
      cost_usd: prev.cost_usd + usage.cost_usd,
      requests: prev.requests + 1,
    }));
  };

  // Contar categorías creadas por el usuario (excluyendo la por defecto) - total en el proyecto o global
  const userCategoriesCount = categories.filter(c => !c.is_default).length;
  const canCreateMoreCategories = userCategoriesCount < FREE_PLAN_CATEGORY_LIMIT;
  const selectedProject = projects.find(p => p.id === selectedProjectId);

  // Cargar datos desde la base de datos
  useEffect(() => {
    const loadData = async () => {
      try {
        let settingsDefaultCategoryId: number | null = null;

        // Cargar configuración
        const settingsResponse = await fetch('/api/db/settings');
        if (settingsResponse.ok) {
          const settingsData = await settingsResponse.json();
          if (settingsData.success && settingsData.data) {
            const loadedSettings: Settings = {
              default_priority: settingsData.data.default_priority || 'medium',
              default_category_id: settingsData.data.default_category_id,
              show_completed_tasks: settingsData.data.show_completed_tasks ?? true,
              ai_suggestions_enabled: settingsData.data.ai_suggestions_enabled ?? true,
              show_empty_categories: settingsData.data.show_empty_categories ?? true,
              max_categories: settingsData.data.max_categories || 10,
            };
            setSettings(loadedSettings);
            setNewTaskPriority(loadedSettings.default_priority);
            settingsDefaultCategoryId = loadedSettings.default_category_id;
          }
        }

        // Cargar proyectos
        const projectsResponse = await fetch('/api/db/projects');
        let initialProjectId: number | null = null;
        if (projectsResponse.ok) {
          const projectsData = await projectsResponse.json();
          if (projectsData.success && projectsData.data?.length) {
            setProjects(projectsData.data);
            // Por defecto seleccionar el primer proyecto (o recuperar de localStorage)
            const saved = typeof window !== 'undefined' ? localStorage.getItem('tasks_selected_project_id') : null;
            const savedId = saved ? parseInt(saved, 10) : NaN;
            const firstProject = projectsData.data[0];
            initialProjectId = (!isNaN(savedId) && projectsData.data.some((p: Project) => p.id === savedId))
              ? savedId
              : (firstProject?.id ?? null);
            setSelectedProjectId(initialProjectId);
          }
        }

        // Cargar categorías (todas, para poder filtrar por proyecto)
        const catResponse = await fetch('/api/db/categories');
        let systemDefaultCatId: number | null = null;
        if (catResponse.ok) {
          const catData = await catResponse.json();
          if (catData.success && catData.data) {
            setCategories(catData.data.map((c: Category) => ({ ...c, isExpanded: true })));
            const defaultCat = catData.data.find((c: Category) => c.is_default);
            if (defaultCat) {
              systemDefaultCatId = defaultCat.id;
            }
          }
        }

        // Establecer categoría por defecto para nuevas tareas
        setSelectedCategoryForNewTask(settingsDefaultCategoryId || systemDefaultCatId);

        // Cargar tareas
        const taskResponse = await fetch('/api/db/tasks');
        if (taskResponse.ok) {
          const taskData = await taskResponse.json();
          if (taskData.success && taskData.data) {
            setTasks(taskData.data);
          }
        }
      } catch (error) {
        console.error('Error cargando datos:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, []);

  // Persistir proyecto seleccionado
  useEffect(() => {
    if (selectedProjectId !== null && typeof window !== 'undefined') {
      localStorage.setItem('tasks_selected_project_id', String(selectedProjectId));
    }
  }, [selectedProjectId]);

  // Categorías y tareas visibles según el proyecto seleccionado
  const visibleCategories = selectedProjectId == null
    ? categories
    : categories.filter((c) => c.project_id === selectedProjectId);
  const visibleCategoryIds = new Set(visibleCategories.map((c) => c.id));
  const visibleTasks = selectedProjectId == null
    ? tasks
    : tasks.filter((t) => t.category_id != null && visibleCategoryIds.has(t.category_id));

  // Si la categoría seleccionada para nuevas tareas no está en las visibles, resetear
  useEffect(() => {
    if (visibleCategories.length && selectedCategoryForNewTask != null) {
      const isVisible = visibleCategories.some((c) => c.id === selectedCategoryForNewTask);
      if (!isVisible) {
        setSelectedCategoryForNewTask(visibleCategories[0].id);
      }
    }
  }, [selectedProjectId, visibleCategories, selectedCategoryForNewTask]);

  const addCategory = async () => {
    if (!newCategoryName.trim()) return;

    // Verificar límite de plan gratuito
    if (!canCreateMoreCategories) {
      setShowNewCategoryModal(false);
      setShowPremiumModal(true);
      return;
    }

    try {
      const response = await fetch('/api/db/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newCategoryName,
          color: newCategoryColor,
          icon: 'folder',
          project_id: selectedProjectId ?? undefined,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success && data.data) {
          setCategories([...categories, { ...data.data, isExpanded: true }]);
        }
      }
    } catch (error) {
      console.error('Error creando categoría:', error);
    }

    setNewCategoryName('');
    setNewCategoryColor(categoryColors[0].value);
    setShowNewCategoryModal(false);
  };

  const deleteCategory = async (categoryId: number) => {
    const category = categories.find(c => c.id === categoryId);
    if (!category || category.is_default) return;
    
    try {
      const response = await fetch(`/api/db/categories/${categoryId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        // Actualizar tareas localmente (mover a categoría por defecto)
        const defaultCategory = categories.find(c => c.is_default);
        if (defaultCategory) {
          setTasks(tasks.map(task => 
            task.category_id === categoryId ? { ...task, category_id: defaultCategory.id } : task
          ));
        }
        setCategories(categories.filter(c => c.id !== categoryId));
      }
    } catch (error) {
      console.error('Error eliminando categoría:', error);
    }
  };

  const toggleCategoryExpanded = (categoryId: number) => {
    setCategories(categories.map(c =>
      c.id === categoryId ? { ...c, isExpanded: !c.isExpanded } : c
    ));
  };

  const addTask = async () => {
    if (!newTaskTitle.trim()) return;

    try {
      const response = await fetch('/api/db/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: newTaskTitle,
          category_id: selectedCategoryForNewTask,
          priority: newTaskPriority,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success && data.data) {
          setTasks([data.data, ...tasks]);
        }
      }
    } catch (error) {
      console.error('Error creando tarea:', error);
    }

    setNewTaskTitle('');
    // Restablecer prioridad al valor por defecto
    setNewTaskPriority(settings.default_priority);
  };

  const toggleTask = async (taskId: number) => {
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;

    try {
      const response = await fetch(`/api/db/tasks/${taskId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ completed: !task.completed }),
      });

      if (response.ok) {
        setTasks(tasks.map(t =>
          t.id === taskId ? { ...t, completed: !t.completed } : t
        ));
        if (selectedTask?.id === taskId) {
          setSelectedTask({ ...selectedTask, completed: !selectedTask.completed });
        }
      }
    } catch (error) {
      console.error('Error actualizando tarea:', error);
    }
  };

  const deleteTask = async (taskId: number) => {
    try {
      const response = await fetch(`/api/db/tasks/${taskId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setTasks(tasks.filter(task => task.id !== taskId));
        if (selectedTask?.id === taskId) {
          setSelectedTask(null);
        }
      }
    } catch (error) {
      console.error('Error eliminando tarea:', error);
    }
  };

  const updateTaskPriority = async (taskId: number, priority: 'low' | 'medium' | 'high') => {
    try {
      const response = await fetch(`/api/db/tasks/${taskId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ priority }),
      });

      if (response.ok) {
        setTasks(tasks.map(task =>
          task.id === taskId ? { ...task, priority } : task
        ));
        if (selectedTask?.id === taskId) {
          setSelectedTask({ ...selectedTask, priority });
        }
      }
    } catch (error) {
      console.error('Error actualizando prioridad:', error);
    }
  };

  const updateTaskCategory = async (taskId: number, categoryId: number) => {
    try {
      const response = await fetch(`/api/db/tasks/${taskId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ category_id: categoryId }),
      });

      if (response.ok) {
        setTasks(tasks.map(task =>
          task.id === taskId ? { ...task, category_id: categoryId } : task
        ));
        if (selectedTask?.id === taskId) {
          setSelectedTask({ ...selectedTask, category_id: categoryId });
        }
      }
    } catch (error) {
      console.error('Error actualizando categoría:', error);
    }
  };

  const toggleSubtask = async (taskId: number, subtaskId: number) => {
    const task = tasks.find(t => t.id === taskId);
    const subtask = task?.subtasks.find(st => st.id === subtaskId);
    if (!subtask) return;

    try {
      const response = await fetch(`/api/db/subtasks/${subtaskId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ completed: !subtask.completed }),
      });

      if (response.ok) {
        setTasks(tasks.map(t =>
          t.id === taskId
            ? {
                ...t,
                subtasks: t.subtasks.map(st =>
                  st.id === subtaskId ? { ...st, completed: !st.completed } : st
                ),
              }
            : t
        ));
        if (selectedTask?.id === taskId) {
          setSelectedTask({
            ...selectedTask,
            subtasks: selectedTask.subtasks.map(st =>
              st.id === subtaskId ? { ...st, completed: !st.completed } : st
            ),
          });
        }
      }
    } catch (error) {
      console.error('Error actualizando subtarea:', error);
    }
  };

  const addComment = async (taskId: number) => {
    if (!newComment.trim()) return;

    try {
      const response = await fetch('/api/db/comments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: newComment,
          task_id: taskId,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success && data.data) {
          const comment = data.data;
          setTasks(tasks.map(task =>
            task.id === taskId
              ? { ...task, comments: [...(task.comments || []), comment] }
              : task
          ));

          if (selectedTask?.id === taskId) {
            setSelectedTask({
              ...selectedTask,
              comments: [...(selectedTask.comments || []), comment],
            });
          }
        }
      }
    } catch (error) {
      console.error('Error creando comentario:', error);
    }

    setNewComment('');
  };

  const deleteComment = async (taskId: number, commentId: number) => {
    try {
      const response = await fetch(`/api/db/comments/${commentId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setTasks(tasks.map(task =>
          task.id === taskId
            ? { ...task, comments: (task.comments || []).filter(c => c.id !== commentId) }
            : task
        ));

        if (selectedTask?.id === taskId) {
          setSelectedTask({
            ...selectedTask,
            comments: (selectedTask.comments || []).filter(c => c.id !== commentId),
          });
        }
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

  // Generar tareas con IA
  const generateTasksWithAI = async () => {
    if (!aiPrompt.trim()) return;

    // Verificar límite de plan gratuito antes de generar
    if (!canCreateMoreCategories) {
      setShowAiPanel(false);
      setShowPremiumModal(true);
      return;
    }

    setIsGenerating(true);

    // Crear nueva categoría para las tareas generadas
    const categoryName = aiCategoryName.trim() || aiPrompt.substring(0, 30) + '...';
    const randomColor = categoryColors[Math.floor(Math.random() * categoryColors.length)].value;

    try {
      // Primero crear la categoría en la base de datos
      const catResponse = await fetch('/api/db/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: categoryName,
          color: randomColor,
          icon: 'cpu',
          project_id: selectedProjectId ?? undefined,
        }),
      });

      let newCategoryId: number | null = null;
      if (catResponse.ok) {
        const catData = await catResponse.json();
        if (catData.success && catData.data) {
          const newCategory = { ...catData.data, isExpanded: true };
          setCategories(prev => [...prev, newCategory]);
          newCategoryId = newCategory.id;
        }
      }

      // Extraer texto de archivos adjuntos (PDF, Word, PowerPoint) para contexto de la IA
      let fileContext = '';
      if (aiContextFiles.length > 0) {
        const formData = new FormData();
        aiContextFiles.forEach((f) => formData.append('files', f));
        const extractRes = await fetch('/api/files/extract-text', { method: 'POST', body: formData });
        if (extractRes.ok) {
          const { results } = await extractRes.json();
          if (Array.isArray(results)) {
            fileContext = results
              .filter((r: { text?: string }) => r.text)
              .map((r: { name: string; text: string }) => `[Archivo: ${r.name}]\n${r.text}`)
              .join('\n\n---\n\n');
          }
        }
      }

      // Generar tareas con IA
      const apiKey = localStorage.getItem('openai_api_key');
      const response = await fetch('/api/tasks/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: aiPrompt, apiKey, fileContext: fileContext || undefined }),
      });

      if (response.ok && newCategoryId) {
        const data = await response.json();
        
        // Actualizar uso de tokens
        if (data.usage) {
          updateTokenUsage(data.usage);
        }
        
        if (data.tasks && Array.isArray(data.tasks)) {
          // Crear cada tarea en la base de datos
          const createdTasks: Task[] = [];
          
          for (const task of data.tasks) {
            // Convertir minutos estimados a segundos para la base de datos
            const estimatedTimeSeconds = task.estimated_minutes 
              ? task.estimated_minutes * 60 
              : null;

            const taskResponse = await fetch('/api/db/tasks', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                title: task.title,
                description: task.description || '',
                priority: task.priority || 'medium',
                category_id: newCategoryId,
                estimated_time: estimatedTimeSeconds,
                subtasks: (task.subtasks || []).map((st: string) => ({ title: st })),
              }),
            });

            if (taskResponse.ok) {
              const taskData = await taskResponse.json();
              if (taskData.success && taskData.data) {
                createdTasks.push(taskData.data);
              }
            }
          }

          setTasks(prev => [...createdTasks, ...prev]);
        }
      }
    } catch (error) {
      console.error('Error generating tasks:', error);
    } finally {
      setIsGenerating(false);
      setAiPrompt('');
      setAiCategoryName('');
      setAiContextFiles([]);
      setShowAiPanel(false);
    }
  };

  // Obtener sugerencias de IA para una tarea
  const getAISuggestions = async (task: Task) => {
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
        
        // Actualizar uso de tokens
        if (data.usage) {
          updateTokenUsage(data.usage);
        }
        
        if (data.suggestions) {
          // Guardar sugerencias en la base de datos
          await fetch(`/api/db/tasks/${task.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ai_suggestions: data.suggestions }),
          });

          setTasks(tasks.map(t =>
            t.id === task.id ? { ...t, ai_suggestions: data.suggestions } : t
          ));
          setSelectedTask({ ...task, ai_suggestions: data.suggestions });
        }
      }
    } catch (error) {
      console.error('Error getting suggestions:', error);
    } finally {
      setIsLoadingSuggestions(false);
    }
  };

  const getTasksByCategory = (categoryId: number) => {
    return visibleTasks.filter(t => {
      if (t.category_id !== categoryId) return false;
      if (!settings.show_completed_tasks && t.completed) return false;
      return true;
    });
  };

  const getCategoryColor = (colorClass: string) => {
    // Para el color gris por defecto
    if (colorClass === 'bg-gray-500') {
      return { name: 'Gris', value: 'bg-gray-500', light: 'bg-gray-100 dark:bg-gray-900/30', text: 'text-gray-600 dark:text-gray-400', gradient: 'from-gray-500 to-gray-700' };
    }
    return categoryColors.find(c => c.value === colorClass) || categoryColors[0];
  };

  // Obtener el color de la categoría de una tarea
  const getTaskCategoryGradient = (task: Task) => {
    const category = categories.find(c => c.id === task.category_id);
    if (!category) return 'from-indigo-500 to-indigo-700';
    const colorInfo = getCategoryColor(category.color);
    return colorInfo.gradient;
  };

  const completedCount = visibleTasks.filter(t => t.completed).length;
  const totalCount = visibleTasks.length;

  // Mostrar loading mientras se cargan los datos
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center">
        <div className="text-center">
          <ArrowPathIcon className="w-12 h-12 animate-spin text-indigo-600 dark:text-indigo-400 mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400">Cargando tareas...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Header */}
        <header className="mb-8">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <SparklesIcon className="w-8 h-8 text-indigo-600 dark:text-indigo-400" />
                <h1 className="text-4xl font-bold text-gray-900 dark:text-white">
                  Tareas con IA
                </h1>
              </div>
              <p className="text-gray-600 dark:text-gray-400">
                Gestiona tus tareas de forma inteligente con ayuda de la IA
                {selectedProject && (
                  <span className="block mt-1 text-indigo-600 dark:text-indigo-400 font-medium">
                    Proyecto: {selectedProject.name}
                  </span>
                )}
              </p>
            </div>
            <div className="flex items-center gap-4 flex-wrap">
              {/* Selector de proyecto */}
              <div className="flex items-center gap-2">
                <label htmlFor="project-select" className="text-sm font-medium text-gray-600 dark:text-gray-400 whitespace-nowrap">
                  Proyecto:
                </label>
                <select
                  id="project-select"
                  value={selectedProjectId ?? ''}
                  onChange={(e) => setSelectedProjectId(e.target.value ? parseInt(e.target.value, 10) : null)}
                  className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm font-medium min-w-[160px]"
                >
                  <option value="">Todos los proyectos</option>
                  {projects.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="text-right">
                <p className="text-3xl font-bold text-indigo-600 dark:text-indigo-400">
                  {completedCount}/{totalCount}
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400">completadas</p>
              </div>
            </div>
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Sidebar de categorías */}
          <div className="lg:col-span-1">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-4 sticky top-8">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-gray-900 dark:text-white flex items-center gap-2">
                  <FolderIcon className="w-5 h-5" />
                  Categorías
                </h3>
                <button
                  onClick={() => {
                    if (!canCreateMoreCategories) {
                      setShowPremiumModal(true);
                    } else {
                      setShowNewCategoryModal(true);
                    }
                  }}
                  className={`p-1 rounded transition-colors ${
                    canCreateMoreCategories 
                      ? 'text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/20'
                      : 'text-amber-500 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-900/20'
                  }`}
                  title={canCreateMoreCategories ? 'Nueva categoría' : 'Actualizar a Premium'}
                >
                  {canCreateMoreCategories ? <PlusIcon className="w-5 h-5" /> : <StarIcon className="w-5 h-5" />}
                </button>
              </div>

              <div className="space-y-2">
                {visibleCategories.map((category) => {
                  const categoryTasks = getTasksByCategory(category.id);
                  const completedInCategory = categoryTasks.filter(t => t.completed).length;
                  const colorInfo = getCategoryColor(category.color);

                  // Ocultar categorías vacías según configuración (excepto la por defecto)
                  if (!settings.show_empty_categories && categoryTasks.length === 0 && !category.is_default) {
                    return null;
                  }

                  return (
                    <div key={category.id} className="group">
                      <div
                        className={`flex items-center justify-between p-2 rounded-lg transition-colors ${colorInfo.light}`}
                      >
                        <Link
                          href={`/categories/${category.id}`}
                          className="flex items-center gap-2 flex-1 min-w-0 cursor-pointer hover:opacity-90"
                        >
                          <span className={`w-3 h-3 rounded-full flex-shrink-0 ${category.color}`}></span>
                          <span className={`font-medium text-sm ${colorInfo.text} flex items-center gap-1 truncate`}>
                            {getCategoryIcon(category.icon, "w-4 h-4")} {category.name}
                          </span>
                          <span className="text-xs text-gray-500 dark:text-gray-400 flex-shrink-0">
                            ({completedInCategory}/{categoryTasks.length})
                          </span>
                        </Link>
                        <div className="flex items-center gap-1 flex-shrink-0">
                          {!category.is_default && (
                            <button
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                deleteCategory(category.id);
                              }}
                              className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors"
                              title="Eliminar categoría"
                            >
                              <TrashIcon className="w-4 h-4" />
                            </button>
                          )}
                          <button
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              toggleCategoryExpanded(category.id);
                            }}
                            className="p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                          >
                            {category.isExpanded ? (
                              <ChevronDownIcon className="w-4 h-4 text-gray-400" />
                            ) : (
                              <ChevronRightIcon className="w-4 h-4 text-gray-400" />
                            )}
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Indicador de uso del plan */}
              <div className="mt-4 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-medium text-gray-600 dark:text-gray-400">Categorías</span>
                  <span className="text-xs font-bold text-gray-900 dark:text-white">
                    {userCategoriesCount}/{FREE_PLAN_CATEGORY_LIMIT}
                  </span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2">
                  <div 
                    className={`h-2 rounded-full transition-all ${
                      userCategoriesCount >= FREE_PLAN_CATEGORY_LIMIT 
                        ? 'bg-gradient-to-r from-amber-500 to-orange-500' 
                        : 'bg-gradient-to-r from-indigo-500 to-purple-500'
                    }`}
                    style={{ width: `${Math.min((userCategoriesCount / FREE_PLAN_CATEGORY_LIMIT) * 100, 100)}%` }}
                  ></div>
                </div>
                {userCategoriesCount >= FREE_PLAN_CATEGORY_LIMIT && (
                  <button 
                    onClick={() => setShowPremiumModal(true)}
                    className="mt-2 w-full text-xs text-amber-600 dark:text-amber-400 hover:text-amber-700 dark:hover:text-amber-300 font-medium flex items-center justify-center gap-1"
                  >
                    <StarIcon className="w-4 h-4" /> Actualizar a Premium
                  </button>
                )}
              </div>

              {/* Uso de Tokens de IA */}
              {tokenUsage.requests > 0 && (
                <div className="mt-4 p-3 bg-gradient-to-br from-purple-50 to-indigo-50 dark:from-purple-900/20 dark:to-indigo-900/20 rounded-lg border border-purple-100 dark:border-purple-800/30">
                  <div className="flex items-center gap-2 mb-3">
                    <CpuChipIcon className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                    <span className="text-xs font-semibold text-purple-700 dark:text-purple-300">Uso de IA (sesión)</span>
                  </div>
                  
                  <div className="space-y-2">
                    {/* Tokens totales */}
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-600 dark:text-gray-400 flex items-center gap-1">
                        <CalculatorIcon className="w-3 h-3" />
                        Tokens totales
                      </span>
                      <span className="text-xs font-mono font-bold text-gray-900 dark:text-white">
                        {tokenUsage.total_tokens.toLocaleString()}
                      </span>
                    </div>
                    
                    {/* Desglose de tokens */}
                    <div className="flex items-center justify-between text-[10px]">
                      <span className="text-gray-500 dark:text-gray-500">
                        Entrada: {tokenUsage.prompt_tokens.toLocaleString()}
                      </span>
                      <span className="text-gray-500 dark:text-gray-500">
                        Salida: {tokenUsage.completion_tokens.toLocaleString()}
                      </span>
                    </div>
                    
                    {/* Costo estimado */}
                    <div className="flex items-center justify-between pt-2 border-t border-purple-200 dark:border-purple-700/30">
                      <span className="text-xs text-gray-600 dark:text-gray-400 flex items-center gap-1">
                        <CurrencyDollarIcon className="w-3 h-3" />
                        Costo estimado
                      </span>
                      <span className="text-xs font-mono font-bold text-green-600 dark:text-green-400">
                        ${tokenUsage.cost_usd.toFixed(6)}
                      </span>
                    </div>
                    
                    {/* Número de solicitudes */}
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-600 dark:text-gray-400 flex items-center gap-1">
                        <SparklesIcon className="w-3 h-3" />
                        Solicitudes IA
                      </span>
                      <span className="text-xs font-mono font-bold text-indigo-600 dark:text-indigo-400">
                        {tokenUsage.requests}
                      </span>
                    </div>
                  </div>
                  
                  {/* Info del modelo */}
                  <div className="mt-3 pt-2 border-t border-purple-200 dark:border-purple-700/30">
                    <span className="text-[10px] text-gray-500 dark:text-gray-500 flex items-center gap-1">
                      <CpuChipIcon className="w-3 h-3" />
                      Modelo: GPT-4o-mini
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Panel principal de tareas */}
          <div className="lg:col-span-3 space-y-6">
            {/* Crear Tarea - Unificado con IA */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden">
              {/* Tabs de navegación */}
              <div className="flex border-b border-gray-200 dark:border-gray-700">
                <button
                  onClick={() => setShowAiPanel(false)}
                  className={`flex-1 px-6 py-4 text-sm font-medium transition-all flex items-center justify-center gap-2 ${
                    !showAiPanel
                      ? 'text-indigo-600 dark:text-indigo-400 border-b-2 border-indigo-600 dark:border-indigo-400 bg-indigo-50/50 dark:bg-indigo-900/20'
                      : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700/50'
                  }`}
                >
                  <PlusIcon className="w-5 h-5" />
                  Tarea Manual
                </button>
                <button
                  onClick={() => {
                    if (!canCreateMoreCategories) {
                      setShowPremiumModal(true);
                    } else {
                      setShowAiPanel(true);
                    }
                  }}
                  className={`flex-1 px-6 py-4 text-sm font-medium transition-all flex items-center justify-center gap-2 ${
                    showAiPanel
                      ? 'text-purple-600 dark:text-purple-400 border-b-2 border-purple-600 dark:border-purple-400 bg-purple-50/50 dark:bg-purple-900/20'
                      : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700/50'
                  }`}
                >
                  <SparklesIcon className="w-5 h-5" />
                  Generar con IA
                  {!canCreateMoreCategories && <StarIcon className="w-4 h-4 text-amber-500" />}
                </button>
              </div>

              {/* Contenido - Tarea Manual */}
              {!showAiPanel && (
                <div className="p-6 space-y-4">
                  {/* Input principal */}
                  <div className="relative">
                    <input
                      type="text"
                      value={newTaskTitle}
                      onChange={(e) => setNewTaskTitle(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && addTask()}
                      placeholder="¿Qué necesitas hacer?"
                      className="w-full px-4 py-4 text-lg border-2 border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white transition-all placeholder:text-gray-400"
                    />
                    {newTaskTitle.trim() && (
                      <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs text-gray-400 bg-gray-100 dark:bg-gray-600 px-2 py-1 rounded">
                        Enter
                      </span>
                    )}
                  </div>

                  {/* Opciones en fila */}
                  <div className="flex flex-wrap items-center gap-3">
                    {/* Categoría */}
                    <div className="flex items-center gap-2 bg-gray-50 dark:bg-gray-700/50 rounded-lg px-3 py-2">
                      <FolderIcon className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                      <select
                        value={selectedCategoryForNewTask || ''}
                        onChange={(e) => setSelectedCategoryForNewTask(parseInt(e.target.value))}
                        className="bg-transparent border-none focus:ring-0 text-sm text-gray-700 dark:text-gray-300 cursor-pointer pr-6"
                      >
                        {visibleCategories.map((cat) => (
                          <option key={cat.id} value={cat.id}>
                            {cat.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Prioridad con botones visuales */}
                    <div className="flex items-center gap-1 bg-gray-50 dark:bg-gray-700/50 rounded-lg p-1">
                      {[
                        { value: 'low', label: 'Baja', color: 'bg-green-500', hoverColor: 'hover:bg-green-100 dark:hover:bg-green-900/30' },
                        { value: 'medium', label: 'Media', color: 'bg-yellow-500', hoverColor: 'hover:bg-yellow-100 dark:hover:bg-yellow-900/30' },
                        { value: 'high', label: 'Alta', color: 'bg-red-500', hoverColor: 'hover:bg-red-100 dark:hover:bg-red-900/30' },
                      ].map((priority) => (
                        <button
                          key={priority.value}
                          onClick={() => setNewTaskPriority(priority.value as 'low' | 'medium' | 'high')}
                          className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all flex items-center gap-1.5 ${
                            newTaskPriority === priority.value
                              ? `${priority.color} text-white shadow-sm`
                              : `text-gray-600 dark:text-gray-400 ${priority.hoverColor}`
                          }`}
                        >
                          <span className={`w-2 h-2 rounded-full ${priority.color} ${newTaskPriority === priority.value ? 'bg-white' : ''}`}></span>
                          {priority.label}
                        </button>
                      ))}
                    </div>

                    {/* Spacer */}
                    <div className="flex-1"></div>

                    {/* Botón de agregar */}
                    <button
                      onClick={addTask}
                      disabled={!newTaskTitle.trim()}
                      className="px-5 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg hover:from-indigo-700 hover:to-purple-700 transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2 font-medium shadow-md hover:shadow-lg disabled:shadow-none"
                    >
                      <PlusIcon className="w-5 h-5" />
                      Agregar
                    </button>
                  </div>
                </div>
              )}

              {/* Contenido - Generar con IA */}
              {showAiPanel && (
                <div className="p-6 space-y-4">
                  {/* Descripción */}
                  <p className="text-sm text-gray-600 dark:text-gray-400 flex items-center gap-2">
                    <CpuChipIcon className="w-4 h-4 text-purple-500" />
                    Describe tu proyecto y la IA generará las tareas automáticamente
                  </p>

                  {/* Proyecto donde se creará la categoría */}
                  <div className="flex flex-col gap-1.5">
                    <label htmlFor="ai-project-select" className="text-sm font-medium text-gray-600 dark:text-gray-400">
                      Proyecto
                    </label>
                    <select
                      id="ai-project-select"
                      value={selectedProjectId ?? ''}
                      onChange={(e) => setSelectedProjectId(e.target.value ? parseInt(e.target.value, 10) : null)}
                      className="px-3 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm min-w-0"
                    >
                      <option value="">Sin proyecto (general)</option>
                      {projects.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Nombre de categoría */}
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2 bg-gray-50 dark:bg-gray-700/50 rounded-lg px-3 py-2 flex-1">
                      <FolderIcon className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                      <input
                        type="text"
                        value={aiCategoryName}
                        onChange={(e) => setAiCategoryName(e.target.value)}
                        placeholder="Nombre de la categoría (opcional)"
                        className="bg-transparent border-none focus:ring-0 text-sm text-gray-700 dark:text-gray-300 w-full placeholder:text-gray-400"
                      />
                    </div>
                  </div>

                  {/* Archivos para contexto de la IA (PDF, Word, PowerPoint) */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-600 dark:text-gray-400 flex items-center gap-2">
                      <DocumentArrowUpIcon className="w-4 h-4" />
                      Archivos para contexto (opcional)
                    </label>
                    <div className="flex flex-col gap-2">
                      <input
                        type="file"
                        accept=".pdf,.doc,.docx,.ppt,.pptx,.csv,.txt,.xls,.xlsx"
                        multiple
                        onChange={(e) => {
                          const added = Array.from(e.target.files || []);
                          if (!added.length) return;
                          setAiContextFiles((prev) => [...prev, ...added].slice(0, 5));
                          e.target.value = '';
                        }}
                        className="block w-full text-sm text-gray-500 dark:text-gray-400 file:mr-3 file:py-2 file:px-3 file:rounded-lg file:border-0 file:bg-indigo-50 dark:file:bg-indigo-900/30 file:text-indigo-600 dark:file:text-indigo-400 file:font-medium file:cursor-pointer"
                      />
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        PDF, Word (.doc, .docx) o PowerPoint (.ppt, .pptx). Máx. 5 archivos, 15 MB cada uno.
                      </p>
                      {aiContextFiles.length > 0 && (
                        <ul className="flex flex-wrap gap-2">
                          {aiContextFiles.map((file, idx) => (
                            <li
                              key={`${file.name}-${idx}`}
                              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 bg-gray-100 dark:bg-gray-700 rounded-lg text-sm text-gray-700 dark:text-gray-300"
                            >
                              <span className="truncate max-w-[140px]" title={file.name}>{file.name}</span>
                              <button
                                type="button"
                                onClick={() => setAiContextFiles((prev) => prev.filter((_, i) => i !== idx))}
                                className="p-0.5 text-gray-400 hover:text-red-500 rounded"
                                title="Quitar"
                              >
                                <XMarkIcon className="w-4 h-4" />
                              </button>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  </div>

                  {/* Textarea para descripción */}
                  <div className="relative">
                    <textarea
                      value={aiPrompt}
                      onChange={(e) => setAiPrompt(e.target.value)}
                      placeholder="Ejemplo: Necesito planificar el lanzamiento de un producto nuevo. Incluye tareas de marketing, desarrollo del producto, pruebas de calidad y preparación del equipo de ventas..."
                      rows={4}
                      className="w-full px-4 py-4 text-base border-2 border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 dark:bg-gray-700 dark:text-white transition-all placeholder:text-gray-400 resize-none"
                    />
                    <div className="absolute bottom-3 right-3 text-xs text-gray-400">
                      {aiPrompt.length}/500
                    </div>
                  </div>

                  {/* Botón de generar */}
                  <button
                    onClick={generateTasksWithAI}
                    disabled={isGenerating || !aiPrompt.trim()}
                    className="w-full py-4 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-xl hover:from-purple-700 hover:to-indigo-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3 font-medium shadow-lg hover:shadow-xl disabled:shadow-none"
                  >
                    {isGenerating ? (
                      <>
                        <ArrowPathIcon className="w-5 h-5 animate-spin" />
                        Generando tareas con IA...
                      </>
                    ) : (
                      <>
                        <SparklesIcon className="w-5 h-5" />
                        Generar Tareas con IA
                      </>
                    )}
                  </button>

                  {/* Info adicional */}
                  <div className="flex items-start gap-2 p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                    <LightBulbIcon className="w-4 h-4 text-purple-500 mt-0.5 flex-shrink-0" />
                    <p className="text-xs text-purple-700 dark:text-purple-300">
                      La IA creará una nueva categoría con múltiples tareas organizadas, incluyendo subtareas y prioridades sugeridas.
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Lista de tareas por categoría */}
            <div className="space-y-6">
              {visibleCategories.map((category) => {
                const categoryTasks = getTasksByCategory(category.id);
                // Ocultar categorías vacías según configuración (excepto la por defecto)
                if (categoryTasks.length === 0 && !category.is_default) {
                  if (!settings.show_empty_categories) return null;
                }

                const colorInfo = getCategoryColor(category.color);

                return (
                  <div key={category.id} className="space-y-3">
                    {/* Header de categoría */}
                    <div
                      className={`flex items-center justify-between p-3 rounded-lg ${colorInfo.light}`}
                    >
                      <Link
                        href={`/categories/${category.id}`}
                        className="flex items-center gap-3 flex-1 min-w-0 cursor-pointer hover:opacity-90"
                      >
                        <span className={`w-4 h-4 rounded-full flex-shrink-0 ${category.color}`}></span>
                        <h3 className={`font-bold ${colorInfo.text} flex items-center gap-2 truncate`}>
                          {getCategoryIcon(category.icon, "w-5 h-5")} {category.name}
                        </h3>
                        <span className="text-sm text-gray-500 dark:text-gray-400 flex-shrink-0">
                          ({categoryTasks.filter(t => t.completed).length}/{categoryTasks.length} completadas)
                        </span>
                      </Link>
                      <div className="flex items-center gap-1 flex-shrink-0">
                        {!category.is_default && (
                          <button
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              deleteCategory(category.id);
                            }}
                            className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                            title="Eliminar categoría"
                          >
                            <TrashIcon className="w-5 h-5" />
                          </button>
                        )}
                        <button
                          onClick={(e) => {
                            e.preventDefault();
                            toggleCategoryExpanded(category.id);
                          }}
                          className="p-2 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                        >
                          {category.isExpanded ? (
                            <ChevronDownIcon className="w-5 h-5 text-gray-400" />
                          ) : (
                            <ChevronRightIcon className="w-5 h-5 text-gray-400" />
                          )}
                        </button>
                      </div>
                    </div>

                    {/* Tareas de la categoría */}
                    {category.isExpanded && (
                      <div className="space-y-2 ml-4">
                        {categoryTasks.length === 0 ? (
                          <p className="text-sm text-gray-400 dark:text-gray-500 py-4 text-center">
                            No hay tareas en esta categoría
                          </p>
                        ) : (
                          categoryTasks.map((task) => (
                            <div
                              key={task.id}
                              onClick={() => setSelectedTask(task)}
                              className={`bg-white dark:bg-gray-800 rounded-lg shadow p-4 cursor-pointer transition-all hover:shadow-md ${
                                selectedTask?.id === task.id ? 'ring-2 ring-indigo-500' : ''
                              } ${task.completed ? 'opacity-60' : ''}`}
                            >
                              <div className="flex items-start gap-3">
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    toggleTask(task.id);
                                  }}
                                  className={`mt-0.5 ${task.completed ? 'text-green-500' : 'text-gray-400 hover:text-indigo-500'}`}
                                >
                                  {task.completed ? (
                                    <CheckCircleSolidIcon className="w-5 h-5" />
                                  ) : (
                                    <CheckCircleIcon className="w-5 h-5" />
                                  )}
                                </button>
                                <div className="flex-1 min-w-0">
                                  <h4 className={`font-medium text-gray-900 dark:text-white ${task.completed ? 'line-through' : ''}`}>
                                    {task.title}
                                  </h4>
                                  {task.description && (
                                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 truncate">
                                      {task.description}
                                    </p>
                                  )}
                                  <div className="flex items-center gap-2 mt-2">
                                    <span className={`text-xs px-2 py-0.5 rounded-full ${priorityColors[task.priority]}`}>
                                      {priorityLabels[task.priority]}
                                    </span>
                                    {task.subtasks.length > 0 && (
                                      <span className="text-xs text-gray-500 dark:text-gray-400">
                                        {task.subtasks.filter(st => st.completed).length}/{task.subtasks.length} subtareas
                                      </span>
                                    )}
                                    {(task.comments?.length || 0) > 0 && (
                                      <span className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
                                        <ChatBubbleLeftIcon className="w-3 h-3" />
                                        {task.comments.length}
                                      </span>
                                    )}
                                  </div>
                                </div>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    deleteTask(task.id);
                                  }}
                                  className="text-gray-400 hover:text-red-500 transition-colors"
                                >
                                  <TrashIcon className="w-4 h-4" />
                                </button>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    )}
                  </div>
                );
              })}

              {tasks.length === 0 && (
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-12 text-center">
                  <SparklesIcon className="w-16 h-16 mx-auto mb-4 text-gray-300 dark:text-gray-600" />
                  <p className="text-gray-500 dark:text-gray-400">
                    No tienes tareas aún. Agrega una o genera con IA.
                  </p>
                </div>
              )}
            </div>
          </div>

        </div>
      </div>

      {/* Modal de detalles de tarea */}
      {selectedTask && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setSelectedTask(null)}>
          <div 
            className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header del modal */}
            <div className={`bg-gradient-to-r ${getTaskCategoryGradient(selectedTask)} p-6 text-white`}>
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <button
                      onClick={() => toggleTask(selectedTask.id)}
                      className={`p-1 rounded-full ${selectedTask.completed ? 'bg-green-500' : 'bg-white/20 hover:bg-white/30'}`}
                    >
                      {selectedTask.completed ? (
                        <CheckCircleSolidIcon className="w-6 h-6 text-white" />
                      ) : (
                        <CheckCircleIcon className="w-6 h-6 text-white" />
                      )}
                    </button>
                    <h2 className={`text-2xl font-bold ${selectedTask.completed ? 'line-through opacity-70' : ''}`}>
                      {selectedTask.title}
                    </h2>
                  </div>
                  {selectedTask.description && (
                    <p className="text-white/80 ml-10">
                      {selectedTask.description}
                    </p>
                  )}
                  <div className="flex items-center gap-4 mt-2 ml-10 text-sm text-white/60">
                    <span>📅 Creada el {formatDate(selectedTask.created_at)}</span>
                    <span className="px-2 py-0.5 bg-white/20 rounded-full text-white/80">
                      {categories.find(c => c.id === selectedTask.category_id)?.icon} {categories.find(c => c.id === selectedTask.category_id)?.name || 'Sin categoría'}
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedTask(null)}
                  className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Contenido del modal */}
            <div className="p-6 overflow-y-auto max-h-[calc(90vh-180px)]">
              <div className="space-y-6">
                {/* Grid de opciones */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Categoría */}
                  <div className="bg-gray-50 dark:bg-gray-700/30 rounded-xl p-4">
                    <label className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 block flex items-center gap-2">
                      <FolderIcon className="w-4 h-4" /> Categoría
                    </label>
                    <select
                      value={selectedTask.category_id || ''}
                      onChange={(e) => updateTaskCategory(selectedTask.id, parseInt(e.target.value))}
                      className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                    >
                      {visibleCategories.map((cat) => (
                        <option key={cat.id} value={cat.id}>
                          {cat.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Prioridad */}
                  <div className="bg-gray-50 dark:bg-gray-700/30 rounded-xl p-4">
                    <label className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 block flex items-center gap-2">
                      🚩 Prioridad
                    </label>
                    <div className="flex gap-2">
                      {(['low', 'medium', 'high'] as const).map((p) => (
                        <button
                          key={p}
                          onClick={() => updateTaskPriority(selectedTask.id, p)}
                          className={`flex-1 px-4 py-3 rounded-lg text-sm font-medium transition-all ${
                            selectedTask.priority === p
                              ? priorityColors[p]
                              : 'bg-white dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-600 border border-gray-200 dark:border-gray-600'
                          }`}
                        >
                          {priorityLabels[p]}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Subtareas */}
                {selectedTask.subtasks.length > 0 && (
                  <div className="bg-gray-50 dark:bg-gray-700/30 rounded-xl p-4">
                    <label className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 block flex items-center gap-2">
                      ✅ Subtareas ({selectedTask.subtasks.filter(st => st.completed).length}/{selectedTask.subtasks.length})
                    </label>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      {selectedTask.subtasks.map((subtask) => (
                        <div
                          key={subtask.id}
                          onClick={() => toggleSubtask(selectedTask.id, subtask.id)}
                          className="flex items-center gap-3 p-3 rounded-lg bg-white dark:bg-gray-800 hover:shadow-md cursor-pointer transition-all border border-gray-200 dark:border-gray-700"
                        >
                          {subtask.completed ? (
                            <CheckCircleSolidIcon className="w-5 h-5 text-green-500 flex-shrink-0" />
                          ) : (
                            <CheckCircleIcon className="w-5 h-5 text-gray-400 flex-shrink-0" />
                          )}
                          <span className={`${subtask.completed ? 'line-through text-gray-400' : 'text-gray-700 dark:text-gray-300'}`}>
                            {subtask.title}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Sugerencias de IA - Solo mostrar si está habilitado en settings */}
                {settings.ai_suggestions_enabled && (
                  <div className="bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 rounded-xl p-4 border border-indigo-100 dark:border-indigo-800">
                    <button
                      onClick={() => getAISuggestions(selectedTask)}
                      disabled={isLoadingSuggestions}
                      className="w-full py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg hover:from-indigo-700 hover:to-purple-700 transition-all disabled:opacity-50 flex items-center justify-center gap-2 font-medium shadow-lg"
                    >
                      {isLoadingSuggestions ? (
                        <>
                          <ArrowPathIcon className="w-5 h-5 animate-spin" />
                          Obteniendo sugerencias...
                        </>
                      ) : (
                        <>
                          <SparklesIcon className="w-5 h-5" />
                          Obtener sugerencias de IA
                        </>
                      )}
                    </button>

                    {selectedTask.ai_suggestions && selectedTask.ai_suggestions.length > 0 && (
                      <div className="mt-4 space-y-2">
                        <p className="text-sm font-semibold text-indigo-700 dark:text-indigo-300 flex items-center gap-2">
                          <LightBulbIcon className="w-4 h-4" /> Sugerencias de la IA:
                        </p>
                        <div className="grid grid-cols-1 gap-2">
                          {selectedTask.ai_suggestions.map((suggestion, index) => (
                            <div key={index} className="text-sm text-indigo-600 dark:text-indigo-400 flex items-start gap-2 bg-white dark:bg-gray-800 p-3 rounded-lg border border-indigo-100 dark:border-indigo-800">
                              <span className="text-indigo-400 mt-0.5">•</span>
                              <span>{suggestion}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Comentarios */}
                <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
                  <label className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                    <ChatBubbleLeftIcon className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                    Comentarios ({selectedTask.comments?.length || 0})
                  </label>
                  
                  {/* Lista de comentarios */}
                  <div className="space-y-4 mb-4">
                    {(selectedTask.comments || []).length === 0 ? (
                      <div className="text-center py-8 bg-gray-50 dark:bg-gray-700/30 rounded-xl border-2 border-dashed border-gray-200 dark:border-gray-700">
                        <ChatBubbleLeftIcon className="w-12 h-12 mx-auto mb-3 text-gray-300 dark:text-gray-600" />
                        <p className="text-gray-500 dark:text-gray-400">
                          No hay comentarios aún
                        </p>
                        <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">
                          Sé el primero en comentar
                        </p>
                      </div>
                    ) : (
                      (selectedTask.comments || []).map((comment) => (
                        <div
                          key={comment.id}
                          className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-4 group hover:shadow-md transition-shadow"
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex items-start gap-3">
                              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center shadow-md flex-shrink-0">
                                <UserIcon className="w-5 h-5 text-white" />
                              </div>
                              <div className="flex-1">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <span className="font-semibold text-gray-900 dark:text-white">
                                    {comment.author}
                                  </span>
                                  <span className="text-xs text-gray-400 dark:text-gray-500 flex items-center gap-1">
                                    <ClockIcon className="w-3 h-3" />
                                    {formatDate(comment.created_at)}
                                  </span>
                                </div>
                                <div className="text-gray-700 dark:text-gray-300 mt-2 whitespace-pre-wrap break-words">
                                  {comment.text.split(/(\[.*?\]\(.*?\))/g).map((part, index) => {
                                    const linkMatch = part.match(/\[(.*?)\]\((.*?)\)/);
                                    if (linkMatch) {
                                      return (
                                        <a
                                          key={index}
                                          href={linkMatch[2]}
                                          target="_blank"
                                          rel="noopener noreferrer"
                                          className="text-indigo-600 dark:text-indigo-400 hover:underline inline-flex items-center gap-1"
                                        >
                                          {linkMatch[1]}
                                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
                              onClick={() => deleteComment(selectedTask.id, comment.id)}
                              className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg opacity-0 group-hover:opacity-100 transition-all flex-shrink-0"
                            >
                              <TrashIcon className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>

                  {/* Agregar comentario */}
                  <div className="bg-gray-50 dark:bg-gray-700/30 p-4 rounded-xl">
                    <div className="flex gap-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center shadow-md flex-shrink-0">
                        <UserIcon className="w-5 h-5 text-white" />
                      </div>
                      <div className="flex-1">
                        {/* Barra de herramientas */}
                        <div className="flex items-center gap-1 mb-2 pb-2 border-b border-gray-200 dark:border-gray-600">
                          <button
                            type="button"
                            onClick={() => {
                              const url = prompt('Ingresa la URL del enlace:');
                              if (url) {
                                const linkText = prompt('Texto del enlace (opcional):') || url;
                                setNewComment(prev => prev + `[${linkText}](${url})`);
                              }
                            }}
                            className="p-2 text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 rounded-lg transition-colors"
                            title="Insertar enlace"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                            </svg>
                          </button>
                          <button
                            type="button"
                            onClick={() => setNewComment(prev => prev + '\n\n')}
                            className="p-2 text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 rounded-lg transition-colors"
                            title="Nuevo párrafo"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h7" />
                            </svg>
                          </button>
                          <button
                            type="button"
                            onClick={() => setNewComment(prev => prev + '\n• ')}
                            className="p-2 text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 rounded-lg transition-colors"
                            title="Agregar viñeta"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                            </svg>
                          </button>
                          <div className="flex-1"></div>
                          <span className="text-xs text-gray-400">
                            {newComment.length} caracteres
                          </span>
                        </div>
                        
                        {/* Textarea */}
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
                              addComment(selectedTask.id);
                            }
                          }}
                          placeholder="Escribe un comentario... (Ctrl+Enter para enviar). Al pegar texto, los enlaces se convierten automáticamente."
                          rows={3}
                          className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent dark:bg-gray-700 dark:text-white resize-none"
                        />
                        
                        {/* Botones de acción */}
                        <div className="flex items-center justify-between mt-3">
                          <p className="text-xs text-gray-400 dark:text-gray-500 flex items-center gap-1">
                            <LightBulbIcon className="w-3 h-3" /> Tip: Usa [texto](url) para enlaces
                          </p>
                          <button
                            onClick={() => addComment(selectedTask.id)}
                            disabled={!newComment.trim()}
                            className="px-5 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-md flex items-center gap-2"
                          >
                            <PaperAirplaneIcon className="w-4 h-4" />
                            Enviar
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal para nueva categoría */}
      {showNewCategoryModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl p-6 w-full max-w-md">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
              Nueva Categoría
            </h3>
            {/* Indicador de límite */}
            <div className="mb-4 p-3 bg-amber-50 dark:bg-amber-900/20 rounded-lg border border-amber-200 dark:border-amber-800">
              <p className="text-sm text-amber-700 dark:text-amber-400 flex items-center gap-2">
                <ChartBarIcon className="w-4 h-4" /> Has usado <span className="font-bold">{userCategoriesCount}</span> de <span className="font-bold">{FREE_PLAN_CATEGORY_LIMIT}</span> categorías del plan gratuito
              </p>
            </div>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">
                  Nombre
                </label>
                <input
                  type="text"
                  value={newCategoryName}
                  onChange={(e) => setNewCategoryName(e.target.value)}
                  placeholder="Nombre de la categoría"
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                  autoFocus
                />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">
                  Color
                </label>
                <div className="flex flex-wrap gap-2">
                  {categoryColors.map((color) => (
                    <button
                      key={color.value}
                      onClick={() => setNewCategoryColor(color.value)}
                      className={`w-8 h-8 rounded-full ${color.value} ${
                        newCategoryColor === color.value ? 'ring-2 ring-offset-2 ring-indigo-500' : ''
                      }`}
                      title={color.name}
                    />
                  ))}
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => setShowNewCategoryModal(false)}
                  className="flex-1 px-4 py-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={addCategory}
                  disabled={!newCategoryName.trim()}
                  className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50"
                >
                  Crear
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Plan Premium */}
      {showPremiumModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setShowPremiumModal(false)}>
          <div 
            className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header con gradiente */}
            <div className="bg-gradient-to-r from-amber-500 via-orange-500 to-pink-500 p-8 text-white text-center relative overflow-hidden">
              <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4xIj48cGF0aCBkPSJNMzYgMzRjMC0yLjIgMS44LTQgNC00czQgMS44IDQgNC0xLjggNC00IDQtNC0xLjgtNC00eiIvPjwvZz48L2c+PC9zdmc+')] opacity-30"></div>
              <div className="relative">
                <StarIcon className="w-16 h-16 mx-auto mb-3" />
                <h2 className="text-3xl font-bold mb-2">¡Desbloquea TaskIA Premium!</h2>
                <p className="text-white/90">Lleva tu productividad al siguiente nivel</p>
              </div>
            </div>

            {/* Contenido */}
            <div className="p-8">
              <div className="text-center mb-6">
                <p className="text-gray-600 dark:text-gray-400">
                  Has alcanzado el límite de <span className="font-bold text-amber-600">{FREE_PLAN_CATEGORY_LIMIT} categorías</span> del plan gratuito.
                  <br />Actualiza a Premium para desbloquear todo el potencial.
                </p>
              </div>

              {/* Planes */}
              <div className="grid md:grid-cols-2 gap-4 mb-6">
                {/* Plan Gratuito */}
                <div className="border-2 border-gray-200 dark:border-gray-700 rounded-xl p-5">
                  <div className="text-center mb-4">
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white">Plan Gratuito</h3>
                    <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">$0<span className="text-sm font-normal text-gray-500">/mes</span></p>
                  </div>
                  <ul className="space-y-3 text-sm">
                    <li className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                      <CheckIcon className="w-4 h-4 text-green-500" /> Hasta 2 categorías
                    </li>
                    <li className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                      <CheckIcon className="w-4 h-4 text-green-500" /> Tareas ilimitadas
                    </li>
                    <li className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                      <CheckIcon className="w-4 h-4 text-green-500" /> Subtareas y comentarios
                    </li>
                    <li className="flex items-center gap-2 text-gray-400 dark:text-gray-500">
                      <XMarkIcon className="w-4 h-4 text-red-400" /> Generación con IA limitada
                    </li>
                    <li className="flex items-center gap-2 text-gray-400 dark:text-gray-500">
                      <XMarkIcon className="w-4 h-4 text-red-400" /> Sin soporte prioritario
                    </li>
                  </ul>
                  <button className="w-full mt-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-500 dark:text-gray-400 cursor-default">
                    Plan actual
                  </button>
                </div>

                {/* Plan Premium */}
                <div className="border-2 border-amber-400 dark:border-amber-500 rounded-xl p-5 bg-gradient-to-b from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 relative">
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gradient-to-r from-amber-500 to-orange-500 text-white text-xs font-bold px-3 py-1 rounded-full">
                    RECOMENDADO
                  </div>
                  <div className="text-center mb-4">
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center justify-center gap-2">
                      Plan Premium <StarIcon className="w-5 h-5 text-amber-500" />
                    </h3>
                    <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">$9.99<span className="text-sm font-normal text-gray-500">/mes</span></p>
                  </div>
                  <ul className="space-y-3 text-sm">
                    <li className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
                      <CheckIcon className="w-4 h-4 text-green-500" /> <strong>Categorías ilimitadas</strong>
                    </li>
                    <li className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
                      <CheckIcon className="w-4 h-4 text-green-500" /> Tareas ilimitadas
                    </li>
                    <li className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
                      <CheckIcon className="w-4 h-4 text-green-500" /> Subtareas y comentarios
                    </li>
                    <li className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
                      <CheckIcon className="w-4 h-4 text-green-500" /> <strong>IA ilimitada</strong>
                    </li>
                    <li className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
                      <CheckIcon className="w-4 h-4 text-green-500" /> <strong>Soporte prioritario 24/7</strong>
                    </li>
                  </ul>
                  <button className="w-full mt-4 py-3 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-bold rounded-lg transition-all shadow-lg hover:shadow-xl flex items-center justify-center gap-2">
                    <RocketLaunchIcon className="w-5 h-5" /> Actualizar a Premium
                  </button>
                </div>
              </div>

              {/* Plan Anual */}
              <div className="bg-gradient-to-r from-purple-100 to-indigo-100 dark:from-purple-900/30 dark:to-indigo-900/30 rounded-xl p-5 border border-purple-200 dark:border-purple-800">
                <div className="flex items-center justify-between flex-wrap gap-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold text-gray-900 dark:text-white">Plan Anual</h3>
                      <span className="bg-green-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">AHORRA 20%</span>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                      Paga <span className="font-bold">$95.88/año</span> en lugar de $119.88
                    </p>
                  </div>
                  <button className="px-6 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-bold rounded-lg transition-all">
                    Elegir anual
                  </button>
                </div>
              </div>

              {/* Footer */}
              <div className="mt-6 text-center">
                <button 
                  onClick={() => setShowPremiumModal(false)}
                  className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 text-sm"
                >
                  Quizás más tarde
                </button>
                <p className="text-xs text-gray-400 dark:text-gray-500 mt-3">
                  🔒 Pago seguro • Cancela cuando quieras • Garantía de 30 días
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
