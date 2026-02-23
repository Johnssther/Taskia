'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  CheckCircleIcon,
  XMarkIcon,
  ArrowPathIcon,
  ClockIcon,
  FolderIcon,
  SparklesIcon,
  ChartBarIcon,
  Cog6ToothIcon,
  ListBulletIcon,
  RocketLaunchIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  HandThumbUpIcon,
  HandThumbDownIcon,
  FireIcon,
  StarIcon,
} from '@heroicons/react/24/outline';
import { CheckCircleIcon as CheckCircleSolidIcon } from '@heroicons/react/24/solid';

interface Subtask {
  id: number;
  title: string;
  completed: boolean;
}

interface Task {
  id: number;
  title: string;
  description: string | null;
  completed: boolean;
  priority: 'low' | 'medium' | 'high';
  subtasks: Subtask[];
  created_at: string;
  category_id: number | null;
  category_name?: string;
  category_color?: string;
  estimated_time: number | null;
  time_spent: number;
}

// Formatear tiempo (segundos a formato legible)
const formatTimeReadable = (seconds: number): string => {
  if (!seconds) return '0min';
  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  
  if (hrs > 0 && mins > 0) return `${hrs}h ${mins}min`;
  if (hrs > 0) return `${hrs}h`;
  return `${mins}min`;
};

interface Category {
  id: number;
  name: string;
  color: string;
}

const priorityConfig = {
  low: { label: 'Baja', color: 'bg-green-500', textColor: 'text-green-600', bgLight: 'bg-green-100 dark:bg-green-900/30' },
  medium: { label: 'Media', color: 'bg-yellow-500', textColor: 'text-yellow-600', bgLight: 'bg-yellow-100 dark:bg-yellow-900/30' },
  high: { label: 'Alta', color: 'bg-red-500', textColor: 'text-red-600', bgLight: 'bg-red-100 dark:bg-red-900/30' },
};

export default function Home() {
  const router = useRouter();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [swipeDirection, setSwipeDirection] = useState<'left' | 'right' | null>(null);
  const [skippedTasks, setSkippedTasks] = useState<number[]>([]);

  useEffect(() => {
    const loadData = async () => {
      try {
        // Cargar categorías
        const catResponse = await fetch('/api/db/categories');
        let categoriesMap: { [key: number]: Category } = {};
        if (catResponse.ok) {
          const catData = await catResponse.json();
          if (catData.success && catData.data) {
            setCategories(catData.data);
            categoriesMap = catData.data.reduce((acc: { [key: number]: Category }, cat: Category) => {
              acc[cat.id] = cat;
              return acc;
            }, {});
          }
        }

        // Cargar tareas pendientes
        const taskResponse = await fetch('/api/db/tasks');
        if (taskResponse.ok) {
          const taskData = await taskResponse.json();
          if (taskData.success && taskData.data) {
            // Filtrar solo tareas no completadas y agregar info de categoría
            const pendingTasks = taskData.data
              .filter((t: Task) => !t.completed)
              .map((t: Task) => ({
                ...t,
                category_name: t.category_id ? categoriesMap[t.category_id]?.name : 'Sin categoría',
                category_color: t.category_id ? categoriesMap[t.category_id]?.color : 'bg-gray-500',
              }));
            setTasks(pendingTasks);
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

  const pendingTasks = tasks.filter(t => !skippedTasks.includes(t.id));
  const currentTask = pendingTasks[currentIndex];

  const handleSelectTask = (taskId: number) => {
    setSwipeDirection('right');
    setTimeout(() => {
      router.push(`/tasks/${taskId}`);
    }, 300);
  };

  const handleSkipTask = () => {
    setSwipeDirection('left');
    setTimeout(() => {
      if (currentTask) {
        setSkippedTasks([...skippedTasks, currentTask.id]);
      }
      setSwipeDirection(null);
      if (currentIndex >= pendingTasks.length - 1) {
        setCurrentIndex(0);
      }
    }, 300);
  };

  const handlePrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  };

  const handleNext = () => {
    if (currentIndex < pendingTasks.length - 1) {
      setCurrentIndex(currentIndex + 1);
    }
  };

  const resetSkipped = () => {
    setSkippedTasks([]);
    setCurrentIndex(0);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-indigo-900 flex items-center justify-center">
        <div className="text-center">
          <ArrowPathIcon className="w-12 h-12 text-indigo-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400">Cargando tareas...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-indigo-900">
      {/* Header */}
      <header className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-lg border-b border-gray-200 dark:border-gray-700 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-xl flex items-center justify-center">
                <RocketLaunchIcon className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900 dark:text-white">TaskIA</h1>
                <p className="text-xs text-gray-500 dark:text-gray-400">¿Qué harás hoy?</p>
              </div>
            </div>
            
            {/* Navegación global (flujo) está en la barra superior */}
          </div>
        </div>
      </header>

      <main className="max-w-lg mx-auto px-4 py-8">
        {/* Flujo de uso */}
        <div className="mb-6 p-4 bg-white/60 dark:bg-gray-800/60 rounded-xl border border-gray-200 dark:border-gray-700">
          <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">Tu flujo</p>
          <ol className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm">
            <li className="flex items-center gap-1.5">
              <span className="w-5 h-5 rounded-full bg-indigo-600 text-white flex items-center justify-center text-xs font-bold">1</span>
              <span className="text-indigo-600 dark:text-indigo-400 font-medium">Inicio</span>
              <span className="text-gray-400 dark:text-gray-500">— elige tu tarea</span>
            </li>
            <li className="flex items-center gap-1.5">
              <ChevronRightIcon className="w-4 h-4 text-gray-300 dark:text-gray-600" />
              <span className="w-5 h-5 rounded-full bg-gray-200 dark:bg-gray-600 text-gray-600 dark:text-gray-400 flex items-center justify-center text-xs font-bold">2</span>
              <Link href="/tasks" className="text-gray-600 dark:text-gray-300 hover:text-indigo-600 dark:hover:text-indigo-400">Tareas</Link>
            </li>
            <li className="flex items-center gap-1.5">
              <ChevronRightIcon className="w-4 h-4 text-gray-300 dark:text-gray-600" />
              <span className="w-5 h-5 rounded-full bg-gray-200 dark:bg-gray-600 text-gray-600 dark:text-gray-400 flex items-center justify-center text-xs font-bold">3</span>
              <Link href="/projects" className="text-gray-600 dark:text-gray-300 hover:text-indigo-600 dark:hover:text-indigo-400">Proyectos</Link>
            </li>
            <li className="flex items-center gap-1.5">
              <ChevronRightIcon className="w-4 h-4 text-gray-300 dark:text-gray-600" />
              <span className="w-5 h-5 rounded-full bg-gray-200 dark:bg-gray-600 text-gray-600 dark:text-gray-400 flex items-center justify-center text-xs font-bold">4</span>
              <Link href="/dashboard" className="text-gray-600 dark:text-gray-300 hover:text-indigo-600 dark:hover:text-indigo-400">Dashboard</Link>
            </li>
            <li className="flex items-center gap-1.5">
              <ChevronRightIcon className="w-4 h-4 text-gray-300 dark:text-gray-600" />
              <span className="w-5 h-5 rounded-full bg-gray-200 dark:bg-gray-600 text-gray-600 dark:text-gray-400 flex items-center justify-center text-xs font-bold">5</span>
              <Link href="/settings" className="text-gray-600 dark:text-gray-300 hover:text-indigo-600 dark:hover:text-indigo-400">Configuración</Link>
            </li>
          </ol>
        </div>

        {/* Stats */}
        <div className="flex items-center justify-center gap-6 mb-8">
          <div className="text-center">
            <p className="text-3xl font-bold text-indigo-600 dark:text-indigo-400">{pendingTasks.length}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400">Pendientes</p>
          </div>
          <div className="w-px h-10 bg-gray-300 dark:bg-gray-600"></div>
          <div className="text-center">
            <p className="text-3xl font-bold text-green-600 dark:text-green-400">{tasks.length - pendingTasks.length + skippedTasks.length}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400">Completadas</p>
          </div>
          <div className="w-px h-10 bg-gray-300 dark:bg-gray-600"></div>
          <div className="text-center">
            <p className="text-3xl font-bold text-amber-600 dark:text-amber-400">{skippedTasks.length}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400">Omitidas</p>
          </div>
        </div>

        {/* Card Container */}
        {pendingTasks.length === 0 ? (
          <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-2xl p-8 text-center">
            <div className="w-20 h-20 bg-gradient-to-br from-green-400 to-emerald-500 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircleSolidIcon className="w-10 h-10 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              ¡Excelente trabajo!
            </h2>
            <p className="text-gray-500 dark:text-gray-400 mb-6">
              {skippedTasks.length > 0 
                ? `Has revisado todas las tareas. Tienes ${skippedTasks.length} tarea(s) omitida(s).`
                : 'No tienes tareas pendientes por ahora.'}
            </p>
            <div className="flex flex-col gap-3">
              {skippedTasks.length > 0 && (
                <button
                  onClick={resetSkipped}
                  className="w-full py-3 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-xl font-medium hover:from-amber-600 hover:to-orange-600 transition-all flex items-center justify-center gap-2"
                >
                  <ArrowPathIcon className="w-5 h-5" />
                  Ver tareas omitidas
                </button>
              )}
              <Link
                href="/tasks"
                className="w-full py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl font-medium hover:from-indigo-700 hover:to-purple-700 transition-all flex items-center justify-center gap-2"
              >
                <ListBulletIcon className="w-5 h-5" />
                Ir a todas las tareas
              </Link>
            </div>
          </div>
        ) : (
          <>
            {/* Progress indicator */}
            <div className="flex items-center justify-center gap-2 mb-4">
              {pendingTasks.slice(0, 5).map((_, idx) => (
                <div
                  key={idx}
                  className={`h-1.5 rounded-full transition-all ${
                    idx === currentIndex
                      ? 'w-8 bg-indigo-600'
                      : idx < currentIndex
                      ? 'w-4 bg-indigo-300'
                      : 'w-4 bg-gray-300 dark:bg-gray-600'
                  }`}
                />
              ))}
              {pendingTasks.length > 5 && (
                <span className="text-xs text-gray-400 ml-1">+{pendingTasks.length - 5}</span>
              )}
            </div>

            {/* Task Card */}
            <div
              className={`relative bg-white dark:bg-gray-800 rounded-3xl shadow-2xl overflow-hidden transition-all duration-300 transform ${
                swipeDirection === 'left'
                  ? '-translate-x-full opacity-0 rotate-[-10deg]'
                  : swipeDirection === 'right'
                  ? 'translate-x-full opacity-0 rotate-[10deg]'
                  : ''
              }`}
            >
              {/* Priority Banner */}
              <div className={`h-2 ${priorityConfig[currentTask.priority].color}`}></div>
              
              {/* Category Badge */}
              <div className="absolute top-6 right-6">
                <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium ${currentTask.category_color} text-white`}>
                  <FolderIcon className="w-3.5 h-3.5" />
                  {currentTask.category_name}
                </span>
              </div>

              <div className="p-6 pt-8">
                {/* Priority Badge & Estimated Time */}
                <div className="mb-4 flex items-center gap-2 flex-wrap">
                  <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium ${priorityConfig[currentTask.priority].bgLight} ${priorityConfig[currentTask.priority].textColor}`}>
                    {currentTask.priority === 'high' && <FireIcon className="w-3.5 h-3.5" />}
                    {currentTask.priority === 'medium' && <StarIcon className="w-3.5 h-3.5" />}
                    Prioridad {priorityConfig[currentTask.priority].label}
                  </span>
                  
                  {currentTask.estimated_time && (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400">
                      <ClockIcon className="w-3.5 h-3.5" />
                      {formatTimeReadable(currentTask.estimated_time)}
                    </span>
                  )}
                </div>

                {/* Title */}
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-3 pr-20">
                  {currentTask.title}
                </h2>

                {/* Description */}
                {currentTask.description && (
                  <p className="text-gray-600 dark:text-gray-400 mb-4 line-clamp-3">
                    {currentTask.description}
                  </p>
                )}

                {/* Subtasks Preview */}
                {currentTask.subtasks && currentTask.subtasks.length > 0 && (
                  <div className="mb-4">
                    <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-2">
                      <CheckCircleIcon className="w-4 h-4" />
                      Subtareas ({currentTask.subtasks.filter(s => s.completed).length}/{currentTask.subtasks.length})
                    </p>
                    <div className="space-y-1.5">
                      {currentTask.subtasks.slice(0, 3).map((subtask) => (
                        <div
                          key={subtask.id}
                          className={`flex items-center gap-2 text-sm ${
                            subtask.completed
                              ? 'text-gray-400 dark:text-gray-500 line-through'
                              : 'text-gray-600 dark:text-gray-400'
                          }`}
                        >
                          {subtask.completed ? (
                            <CheckCircleSolidIcon className="w-4 h-4 text-green-500" />
                          ) : (
                            <div className="w-4 h-4 rounded-full border-2 border-gray-300 dark:border-gray-600" />
                          )}
                          {subtask.title}
                        </div>
                      ))}
                      {currentTask.subtasks.length > 3 && (
                        <p className="text-xs text-gray-400 dark:text-gray-500 ml-6">
                          +{currentTask.subtasks.length - 3} más...
                        </p>
                      )}
                    </div>
                  </div>
                )}

                {/* Date & Time worked */}
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400">
                    <ClockIcon className="w-4 h-4" />
                    Creada {new Date(currentTask.created_at).toLocaleDateString('es-ES', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric'
                    })}
                  </div>
                  
                  {/* Tiempo trabajado si existe */}
                  {currentTask.time_spent > 0 && (
                    <div className="flex items-center gap-1.5 text-gray-500 dark:text-gray-400">
                      <span className="text-xs">
                        Trabajado: {formatTimeReadable(currentTask.time_spent)}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="p-6 pt-0">
                <div className="flex items-center justify-center gap-4">
                  {/* Skip Button */}
                  <button
                    onClick={handleSkipTask}
                    className="w-16 h-16 bg-gray-100 dark:bg-gray-700 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-full flex items-center justify-center transition-all group shadow-lg hover:shadow-xl hover:scale-110"
                  >
                    <XMarkIcon className="w-8 h-8 text-gray-400 group-hover:text-red-500 transition-colors" />
                  </button>

                  {/* Navigation */}
                  <div className="flex items-center gap-2">
                    <button
                      onClick={handlePrevious}
                      disabled={currentIndex === 0}
                      className="w-10 h-10 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center disabled:opacity-30 disabled:cursor-not-allowed hover:bg-gray-200 dark:hover:bg-gray-600 transition-all"
                    >
                      <ChevronLeftIcon className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                    </button>
                    <span className="text-sm text-gray-500 dark:text-gray-400 min-w-[60px] text-center">
                      {currentIndex + 1} / {pendingTasks.length}
                    </span>
                    <button
                      onClick={handleNext}
                      disabled={currentIndex === pendingTasks.length - 1}
                      className="w-10 h-10 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center disabled:opacity-30 disabled:cursor-not-allowed hover:bg-gray-200 dark:hover:bg-gray-600 transition-all"
                    >
                      <ChevronRightIcon className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                    </button>
                  </div>

                  {/* Select Button */}
                  <button
                    onClick={() => handleSelectTask(currentTask.id)}
                    className="w-16 h-16 bg-gradient-to-br from-green-400 to-emerald-500 hover:from-green-500 hover:to-emerald-600 rounded-full flex items-center justify-center transition-all shadow-lg hover:shadow-xl hover:scale-110"
                  >
                    <HandThumbUpIcon className="w-8 h-8 text-white" />
                  </button>
                </div>

                {/* Hint */}
                <p className="text-center text-xs text-gray-400 dark:text-gray-500 mt-4">
                  <span className="inline-flex items-center gap-1">
                    <HandThumbDownIcon className="w-3.5 h-3.5" /> Omitir
                  </span>
                  <span className="mx-3">•</span>
                  <span className="inline-flex items-center gap-1">
                    <HandThumbUpIcon className="w-3.5 h-3.5" /> Trabajar en esta
                  </span>
                </p>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="mt-6 flex items-center justify-center gap-3">
              <Link
                href="/tasks"
                className="px-4 py-2 text-sm text-gray-600 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-white dark:hover:bg-gray-800 rounded-lg transition-all flex items-center gap-2"
              >
                <ListBulletIcon className="w-4 h-4" />
                Ver todas
              </Link>
              {skippedTasks.length > 0 && (
                <button
                  onClick={resetSkipped}
                  className="px-4 py-2 text-sm text-amber-600 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-900/20 rounded-lg transition-all flex items-center gap-2"
                >
                  <ArrowPathIcon className="w-4 h-4" />
                  Restaurar omitidas ({skippedTasks.length})
                </button>
              )}
            </div>
          </>
        )}
      </main>
    </div>
  );
}
