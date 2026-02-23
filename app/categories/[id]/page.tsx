'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeftIcon,
  CheckCircleIcon,
  TrashIcon,
  PlusIcon,
  FolderIcon,
  ChevronRightIcon,
  ChatBubbleLeftIcon,
  Cog6ToothIcon,
  ListBulletIcon,
  ArrowPathIcon,
  SparklesIcon,
  StarIcon,
  ChartBarIcon,
  CpuChipIcon,
  PencilSquareIcon,
  CheckIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';
import { CheckCircleIcon as CheckCircleSolidIcon } from '@heroicons/react/24/solid';

const getCategoryIcon = (iconName: string, className: string = 'w-4 h-4') => {
  const icons: Record<string, React.ReactNode> = {
    folder: <FolderIcon className={className} />,
    list: <ListBulletIcon className={className} />,
    sparkles: <SparklesIcon className={className} />,
    star: <StarIcon className={className} />,
    chart: <ChartBarIcon className={className} />,
    cpu: <CpuChipIcon className={className} />,
  };
  return icons[iconName] || <FolderIcon className={className} />;
};

const categoryColors: { value: string; light: string; text: string }[] = [
  { value: 'bg-blue-500', light: 'bg-blue-100 dark:bg-blue-900/30', text: 'text-blue-600 dark:text-blue-400' },
  { value: 'bg-green-500', light: 'bg-green-100 dark:bg-green-900/30', text: 'text-green-600 dark:text-green-400' },
  { value: 'bg-purple-500', light: 'bg-purple-100 dark:bg-purple-900/30', text: 'text-purple-600 dark:text-purple-400' },
  { value: 'bg-orange-500', light: 'bg-orange-100 dark:bg-orange-900/30', text: 'text-orange-600 dark:text-orange-400' },
  { value: 'bg-pink-500', light: 'bg-pink-100 dark:bg-pink-900/30', text: 'text-pink-600 dark:text-pink-400' },
  { value: 'bg-cyan-500', light: 'bg-cyan-100 dark:bg-cyan-900/30', text: 'text-cyan-600 dark:text-cyan-400' },
  { value: 'bg-red-500', light: 'bg-red-100 dark:bg-red-900/30', text: 'text-red-600 dark:text-red-400' },
  { value: 'bg-indigo-500', light: 'bg-indigo-100 dark:bg-indigo-900/30', text: 'text-indigo-600 dark:text-indigo-400' },
  { value: 'bg-gray-500', light: 'bg-gray-100 dark:bg-gray-900/30', text: 'text-gray-600 dark:text-gray-400' },
];

const priorityColors = {
  low: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  medium: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
  high: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
};

const priorityLabels = { low: 'Baja', medium: 'Media', high: 'Alta' };

interface Subtask {
  id: number;
  title: string;
  completed: boolean;
  task_id: number;
}

interface Comment {
  id: number;
  text: string;
  author: string;
  created_at: string;
}

interface Task {
  id: number;
  title: string;
  description: string | null;
  completed: boolean;
  priority: 'low' | 'medium' | 'high';
  due_date?: string | null;
  subtasks: Subtask[];
  comments: Comment[];
  created_at: string;
  category_id: number | null;
}

interface Category {
  id: number;
  name: string;
  color: string;
  icon: string;
  is_default: boolean;
}

interface Settings {
  default_priority: 'low' | 'medium' | 'high';
}

function getCategoryColor(colorClass: string) {
  if (colorClass === 'bg-gray-500') {
    return { value: 'bg-gray-500', light: 'bg-gray-100 dark:bg-gray-900/30', text: 'text-gray-600 dark:text-gray-400' };
  }
  return categoryColors.find((c) => c.value === colorClass) || categoryColors[0];
}

export default function CategoryPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const categoryId = parseInt(resolvedParams.id, 10);
  const router = useRouter();
  const [category, setCategory] = useState<Category | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [settings, setSettings] = useState<Settings>({ default_priority: 'medium' });
  const [isLoading, setIsLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskPriority, setNewTaskPriority] = useState<'low' | 'medium' | 'high'>('medium');
  const [isEditingName, setIsEditingName] = useState(false);
  const [editName, setEditName] = useState('');
  const [isSavingName, setIsSavingName] = useState(false);

  useEffect(() => {
    const load = async () => {
      if (isNaN(categoryId)) {
        setNotFound(true);
        setIsLoading(false);
        return;
      }
      try {
        const [catRes, tasksRes, settingsRes] = await Promise.all([
          fetch(`/api/db/categories/${categoryId}`),
          fetch('/api/db/tasks'),
          fetch('/api/db/settings'),
        ]);

        const catData = await catRes.json();
        if (!catRes.ok || !catData.success || !catData.data) {
          setNotFound(true);
          setIsLoading(false);
          return;
        }
        setCategory(catData.data);

        if (tasksRes.ok) {
          const tasksData = await tasksRes.json();
          if (tasksData.success && tasksData.data) {
            const filtered = (tasksData.data as Task[]).filter((t) => t.category_id === categoryId);
            setTasks(filtered);
          }
        }

        if (settingsRes.ok) {
          const settingsData = await settingsRes.json();
          if (settingsData.success && settingsData.data) {
            setSettings({
              default_priority: settingsData.data.default_priority || 'medium',
            });
            setNewTaskPriority(settingsData.data.default_priority || 'medium');
          }
        }
      } catch (e) {
        console.error(e);
        setNotFound(true);
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, [categoryId]);

  const addTask = async () => {
    if (!newTaskTitle.trim() || !category) return;
    try {
      const res = await fetch('/api/db/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: newTaskTitle.trim(),
          category_id: category.id,
          priority: newTaskPriority,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.success && data.data) {
          setTasks([data.data, ...tasks]);
          setNewTaskTitle('');
          setNewTaskPriority(settings.default_priority);
        }
      }
    } catch (e) {
      console.error(e);
    }
  };

  const toggleTask = async (task: Task) => {
    try {
      const res = await fetch(`/api/db/tasks/${task.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ completed: !task.completed }),
      });
      if (res.ok) {
        setTasks((prev) =>
          prev.map((t) => (t.id === task.id ? { ...t, completed: !t.completed } : t))
        );
      }
    } catch (e) {
      console.error(e);
    }
  };

  const deleteTask = async (taskId: number) => {
    try {
      const res = await fetch(`/api/db/tasks/${taskId}`, { method: 'DELETE' });
      if (res.ok) setTasks((prev) => prev.filter((t) => t.id !== taskId));
    } catch (e) {
      console.error(e);
    }
  };

  const deleteCategory = async () => {
    if (!category || category.is_default) return;
    try {
      const res = await fetch(`/api/db/categories/${categoryId}`, { method: 'DELETE' });
      if (res.ok) router.push('/tasks');
    } catch (e) {
      console.error(e);
    }
  };

  const startEditingName = () => {
    setEditName(category?.name ?? '');
    setIsEditingName(true);
  };

  const cancelEditingName = () => {
    setEditName('');
    setIsEditingName(false);
  };

  const saveCategoryName = async () => {
    if (!category || category.is_default) return;
    const name = editName.trim();
    if (!name || name === category.name) {
      cancelEditingName();
      return;
    }
    setIsSavingName(true);
    try {
      const res = await fetch(`/api/db/categories/${categoryId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name }),
      });
      if (res.ok) {
        setCategory({ ...category, name });
        cancelEditingName();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsSavingName(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center p-4">
        <div className="text-center">
          <ArrowPathIcon className="w-10 h-10 sm:w-12 sm:h-12 animate-spin text-indigo-600 dark:text-indigo-400 mx-auto mb-4" />
          <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400">Cargando categoría...</p>
        </div>
      </div>
    );
  }

  if (notFound || !category) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center p-4">
        <div className="text-center">
          <FolderIcon className="w-12 h-12 sm:w-16 sm:h-16 text-gray-400 mx-auto mb-4" />
          <h1 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white mb-2">Categoría no encontrada</h1>
          <Link
            href="/tasks"
            className="inline-flex items-center gap-2 text-sm sm:text-base text-indigo-600 dark:text-indigo-400 hover:underline"
          >
            <ArrowLeftIcon className="w-4 h-4" />
            Volver a Tareas
          </Link>
        </div>
      </div>
    );
  }

  const colorInfo = getCategoryColor(category.color);
  const completedCount = tasks.filter((t) => t.completed).length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <div className="container mx-auto px-4 sm:px-6 py-6 sm:py-8 max-w-4xl">
        <Link
          href="/tasks"
          className="inline-flex items-center gap-2 text-sm sm:text-base text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white mb-4 sm:mb-6 transition-colors"
        >
          <ArrowLeftIcon className="w-4 h-4 flex-shrink-0" />
          Volver a Tareas
        </Link>

        {/* Header de categoría */}
        <header
          className={`rounded-xl shadow-lg p-4 sm:p-6 mb-6 sm:mb-8 ${colorInfo.light} border border-transparent`}
        >
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-start gap-3 sm:gap-4 min-w-0 flex-1">
              <span className={`w-10 h-10 sm:w-12 sm:h-12 rounded-xl flex-shrink-0 ${category.color} flex items-center justify-center`}>
                {getCategoryIcon(category.icon, 'w-5 h-5 sm:w-7 sm:h-7 text-white')}
              </span>
              <div className="min-w-0 flex-1">
                {isEditingName ? (
                  <div className="flex flex-wrap items-center gap-2">
                    <input
                      type="text"
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') saveCategoryName();
                        if (e.key === 'Escape') cancelEditingName();
                      }}
                      className={`text-lg sm:text-2xl font-bold w-full min-w-0 px-2 py-1 rounded border-2 border-indigo-300 dark:border-indigo-600 bg-white dark:bg-gray-800 ${colorInfo.text} focus:ring-2 focus:ring-indigo-500 focus:border-transparent`}
                      autoFocus
                      disabled={isSavingName}
                    />
                    <div className="flex gap-1">
                      <button
                        onClick={saveCategoryName}
                        disabled={isSavingName || !editName.trim() || editName.trim() === category.name}
                        className="p-2 text-green-600 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-lg transition-colors disabled:opacity-50 touch-manipulation"
                        title="Guardar"
                      >
                        {isSavingName ? (
                          <ArrowPathIcon className="w-5 h-5 sm:w-6 sm:h-6 animate-spin" />
                        ) : (
                          <CheckIcon className="w-5 h-5 sm:w-6 sm:h-6" />
                        )}
                      </button>
                      <button
                        onClick={cancelEditingName}
                        disabled={isSavingName}
                        className="p-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors disabled:opacity-50 touch-manipulation"
                        title="Cancelar"
                      >
                        <XMarkIcon className="w-5 h-5 sm:w-6 sm:h-6" />
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 flex-wrap">
                    <h1 className={`text-xl sm:text-2xl font-bold break-words ${colorInfo.text}`}>
                      {category.name}
                    </h1>
                    {!category.is_default && (
                      <button
                        onClick={startEditingName}
                        className="p-1.5 text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-white/50 dark:hover:bg-black/10 rounded-lg transition-colors touch-manipulation"
                        title="Cambiar nombre de la categoría"
                      >
                        <PencilSquareIcon className="w-5 h-5" />
                      </button>
                    )}
                  </div>
                )}
                <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                  {completedCount} de {tasks.length} tareas completadas
                </p>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2 sm:flex-shrink-0">
              <Link
                href="/tasks"
                className="flex-1 sm:flex-none text-center px-3 py-2 sm:px-4 text-sm sm:text-base bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors inline-flex items-center justify-center gap-2"
              >
                <Cog6ToothIcon className="w-5 h-5" />
                Ver todas las tareas
              </Link>
              {!category.is_default && (
                <button
                  onClick={deleteCategory}
                  className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors touch-manipulation"
                  title="Eliminar categoría"
                >
                  <TrashIcon className="w-5 h-5" />
                </button>
              )}
            </div>
          </div>
        </header>

        {/* Agregar tarea */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-4 sm:p-6 mb-6 sm:mb-8">
          <h2 className="text-base sm:text-lg font-bold text-gray-900 dark:text-white mb-3 sm:mb-4 flex items-center gap-2">
            <PlusIcon className="w-5 h-5 flex-shrink-0" />
            Nueva tarea en esta categoría
          </h2>
          <div className="flex flex-col sm:flex-row sm:flex-wrap gap-3">
            <input
              type="text"
              value={newTaskTitle}
              onChange={(e) => setNewTaskTitle(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && addTask()}
              placeholder="¿Qué necesitas hacer?"
              className="w-full sm:flex-1 sm:min-w-0 px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
            />
            <div className="flex gap-3 sm:flex-shrink-0">
              <select
                value={newTaskPriority}
                onChange={(e) => setNewTaskPriority(e.target.value as 'low' | 'medium' | 'high')}
                className="flex-1 sm:w-auto min-w-0 px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
              >
                <option value="low">Baja</option>
                <option value="medium">Media</option>
                <option value="high">Alta</option>
              </select>
              <button
                onClick={addTask}
                disabled={!newTaskTitle.trim()}
                className="flex-1 sm:flex-none px-5 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg hover:from-indigo-700 hover:to-purple-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 font-medium"
              >
                <PlusIcon className="w-5 h-5" />
                Agregar
              </button>
            </div>
          </div>
        </div>

        {/* Lista de tareas */}
        <div className="space-y-3">
          <h2 className="text-base sm:text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <ListBulletIcon className="w-5 h-5 flex-shrink-0" />
            Tareas ({tasks.length})
          </h2>

          {tasks.length === 0 ? (
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8 sm:p-12 text-center">
              <FolderIcon className="w-12 h-12 sm:w-16 sm:h-16 mx-auto mb-3 sm:mb-4 text-gray-300 dark:text-gray-600" />
              <p className="text-gray-500 dark:text-gray-400 text-sm sm:text-base">No hay tareas en esta categoría.</p>
              <p className="text-xs sm:text-sm text-gray-400 dark:text-gray-500 mt-2">
                Agrega una arriba para empezar.
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {tasks.map((task) => (
                <div
                  key={task.id}
                  className="bg-white dark:bg-gray-800 rounded-lg shadow p-3 sm:p-4 flex items-center gap-2 sm:gap-4 group hover:shadow-md transition-shadow"
                >
                  <button
                    onClick={() => toggleTask(task)}
                    className={`flex-shrink-0 touch-manipulation ${task.completed ? 'text-green-500' : 'text-gray-400 hover:text-indigo-500'}`}
                  >
                    {task.completed ? (
                      <CheckCircleSolidIcon className="w-5 h-5 sm:w-6 sm:h-6" />
                    ) : (
                      <CheckCircleIcon className="w-5 h-5 sm:w-6 sm:h-6" />
                    )}
                  </button>
                  <Link
                    href={`/tasks/${task.id}`}
                    className="flex-1 min-w-0 flex items-center gap-2 sm:gap-3 no-underline overflow-hidden"
                  >
                    <span
                      className={`font-medium text-sm sm:text-base text-gray-900 dark:text-white truncate ${task.completed ? 'line-through opacity-70' : ''}`}
                    >
                      {task.title}
                    </span>
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full flex-shrink-0 ${priorityColors[task.priority]}`}
                    >
                      {priorityLabels[task.priority]}
                    </span>
                    {task.subtasks?.length > 0 && (
                      <span className="text-xs text-gray-500 dark:text-gray-400 flex-shrink-0 hidden sm:inline">
                        {task.subtasks.filter((s) => s.completed).length}/{task.subtasks.length}
                      </span>
                    )}
                    {(task.comments?.length ?? 0) > 0 && (
                      <span className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-0.5 flex-shrink-0">
                        <ChatBubbleLeftIcon className="w-3 h-3 sm:w-4 sm:h-4" />
                        {task.comments!.length}
                      </span>
                    )}
                    <ChevronRightIcon className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400 flex-shrink-0 ml-auto" />
                  </Link>
                  <button
                    onClick={() => deleteTask(task.id)}
                    className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors flex-shrink-0 touch-manipulation"
                    title="Eliminar tarea"
                  >
                    <TrashIcon className="w-5 h-5" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
