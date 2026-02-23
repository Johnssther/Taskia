'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeftIcon,
  PlusIcon,
  FolderIcon,
  ChevronRightIcon,
  TrashIcon,
  ArrowPathIcon,
  ListBulletIcon,
  PencilSquareIcon,
  CheckIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';

const categoryColors = [
  { name: 'Azul', value: 'bg-blue-500' },
  { name: 'Verde', value: 'bg-green-500' },
  { name: 'Morado', value: 'bg-purple-500' },
  { name: 'Naranja', value: 'bg-orange-500' },
  { name: 'Rosa', value: 'bg-pink-500' },
  { name: 'Cyan', value: 'bg-cyan-500' },
  { name: 'Rojo', value: 'bg-red-500' },
  { name: 'Indigo', value: 'bg-indigo-500' },
  { name: 'Gris', value: 'bg-gray-500' },
];

interface Project {
  id: number;
  name: string;
  user_id: number;
  created_at: string;
  updated_at: string;
}

interface Category {
  id: number;
  name: string;
  color: string;
  icon: string;
  project_id: number | null;
  is_default: boolean;
  task_count?: number;
}

export default function ProjectDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const projectId = parseInt(resolvedParams.id, 10);
  const router = useRouter();
  const [project, setProject] = useState<Project | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newCategoryColor, setNewCategoryColor] = useState(categoryColors[0].value);
  const [isAddingCategory, setIsAddingCategory] = useState(false);
  const [isEditingName, setIsEditingName] = useState(false);
  const [editName, setEditName] = useState('');
  const [isSavingName, setIsSavingName] = useState(false);

  useEffect(() => {
    const load = async () => {
      if (isNaN(projectId)) {
        setNotFound(true);
        setIsLoading(false);
        return;
      }
      try {
        const [projRes, catRes] = await Promise.all([
          fetch(`/api/db/projects/${projectId}`),
          fetch(`/api/db/categories?project_id=${projectId}`),
        ]);

        const projData = await projRes.json();
        if (!projRes.ok || !projData.success || !projData.data) {
          setNotFound(true);
          setIsLoading(false);
          return;
        }
        setProject(projData.data);
        setEditName(projData.data.name);

        if (catRes.ok) {
          const catData = await catRes.json();
          if (catData.success && catData.data) {
            setCategories(catData.data);
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
  }, [projectId]);

  const addCategory = async () => {
    const name = newCategoryName.trim();
    if (!name || !project) return;
    setIsAddingCategory(true);
    try {
      const res = await fetch('/api/db/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          color: newCategoryColor,
          icon: 'folder',
          project_id: project.id,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.success && data.data) {
          setCategories([...categories, data.data]);
          setNewCategoryName('');
          setNewCategoryColor(categoryColors[0].value);
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsAddingCategory(false);
    }
  };

  const deleteProject = async () => {
    if (!project || !confirm('¿Eliminar este proyecto y todas sus categorías?')) return;
    try {
      const res = await fetch(`/api/db/projects/${projectId}`, { method: 'DELETE' });
      if (res.ok) router.push('/projects');
    } catch (e) {
      console.error(e);
    }
  };

  const saveProjectName = async () => {
    if (!project) return;
    const name = editName.trim();
    if (!name || name === project.name) {
      setIsEditingName(false);
      return;
    }
    setIsSavingName(true);
    try {
      const res = await fetch(`/api/db/projects/${projectId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name }),
      });
      if (res.ok) {
        setProject({ ...project, name });
        setIsEditingName(false);
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
          <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400">Cargando proyecto...</p>
        </div>
      </div>
    );
  }

  if (notFound || !project) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center p-4">
        <div className="text-center">
          <FolderIcon className="w-12 h-12 sm:w-16 sm:h-16 text-gray-400 mx-auto mb-4" />
          <h1 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white mb-2">Proyecto no encontrado</h1>
          <Link href="/projects" className="inline-flex items-center gap-2 text-indigo-600 dark:text-indigo-400 hover:underline text-sm sm:text-base">
            <ArrowLeftIcon className="w-4 h-4" />
            Volver a Proyectos
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <div className="container mx-auto px-4 sm:px-6 py-6 sm:py-8 max-w-4xl">
        <Link
          href="/projects"
          className="inline-flex items-center gap-2 text-sm sm:text-base text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white mb-4 sm:mb-6 transition-colors"
        >
          <ArrowLeftIcon className="w-4 h-4 flex-shrink-0" />
          Volver a Proyectos
        </Link>

        {/* Header del proyecto */}
        <header className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-4 sm:p-6 mb-6 sm:mb-8 border border-gray-200 dark:border-gray-700">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-start gap-3 sm:gap-4 min-w-0 flex-1">
              <span className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center flex-shrink-0">
                <FolderIcon className="w-5 h-5 sm:w-7 sm:h-7 text-indigo-600 dark:text-indigo-400" />
              </span>
              <div className="min-w-0 flex-1">
                {isEditingName ? (
                  <div className="flex flex-wrap items-center gap-2">
                    <input
                      type="text"
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') saveProjectName();
                        if (e.key === 'Escape') setIsEditingName(false);
                      }}
                      className="text-lg sm:text-2xl font-bold w-full min-w-0 px-2 py-1 rounded border-2 border-indigo-300 dark:border-indigo-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      autoFocus
                      disabled={isSavingName}
                    />
                    <div className="flex gap-1">
                      <button
                        onClick={saveProjectName}
                        disabled={isSavingName || !editName.trim() || editName.trim() === project.name}
                        className="p-2 text-green-600 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-lg disabled:opacity-50 touch-manipulation"
                        title="Guardar"
                      >
                        {isSavingName ? <ArrowPathIcon className="w-5 h-5 sm:w-6 sm:h-6 animate-spin" /> : <CheckIcon className="w-5 h-5 sm:w-6 sm:h-6" />}
                      </button>
                      <button
                        onClick={() => setIsEditingName(false)}
                        disabled={isSavingName}
                        className="p-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg disabled:opacity-50 touch-manipulation"
                        title="Cancelar"
                      >
                        <XMarkIcon className="w-5 h-5 sm:w-6 sm:h-6" />
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 flex-wrap">
                    <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white break-words">{project.name}</h1>
                    <button
                      onClick={() => setIsEditingName(true)}
                      className="p-1.5 text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-lg transition-colors touch-manipulation"
                      title="Editar nombre"
                    >
                      <PencilSquareIcon className="w-5 h-5" />
                    </button>
                  </div>
                )}
                <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                  {categories.length} categoría{categories.length !== 1 ? 's' : ''} de tareas
                </p>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2 sm:flex-shrink-0">
              <Link
                href="/tasks"
                className="flex-1 sm:flex-none text-center px-3 py-2 sm:px-4 text-sm sm:text-base bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
              >
                Ver todas las tareas
              </Link>
              <button
                onClick={deleteProject}
                className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors touch-manipulation"
                title="Eliminar proyecto"
              >
                <TrashIcon className="w-5 h-5" />
              </button>
            </div>
          </div>
        </header>

        {/* Nueva categoría */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-4 sm:p-6 mb-6 sm:mb-8">
          <h2 className="text-base sm:text-lg font-bold text-gray-900 dark:text-white mb-3 sm:mb-4 flex items-center gap-2">
            <PlusIcon className="w-5 h-5 flex-shrink-0" />
            Nueva categoría en este proyecto
          </h2>
          <div className="flex flex-col sm:flex-row sm:flex-wrap gap-4 sm:gap-3 sm:items-end">
            <div className="w-full sm:flex-1 sm:min-w-0">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Nombre</label>
              <input
                type="text"
                value={newCategoryName}
                onChange={(e) => setNewCategoryName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && addCategory()}
                placeholder="Ej: Desarrollo, Diseño..."
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white"
              />
            </div>
            <div className="w-full sm:w-auto">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Color</label>
              <div className="flex gap-1 flex-wrap">
                {categoryColors.map((c) => (
                  <button
                    key={c.value}
                    type="button"
                    onClick={() => setNewCategoryColor(c.value)}
                    className={`w-8 h-8 rounded-full flex-shrink-0 ${c.value} ${newCategoryColor === c.value ? 'ring-2 ring-offset-2 ring-indigo-500' : ''}`}
                    title={c.name}
                  />
                ))}
              </div>
            </div>
            <button
              onClick={addCategory}
              disabled={isAddingCategory || !newCategoryName.trim()}
              className="w-full sm:w-auto px-5 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg hover:from-indigo-700 hover:to-purple-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 font-medium"
            >
              {isAddingCategory ? <ArrowPathIcon className="w-5 h-5 animate-spin" /> : <PlusIcon className="w-5 h-5" />}
              Agregar categoría
            </button>
          </div>
        </div>

        {/* Lista de categorías */}
        <div className="space-y-3">
          <h2 className="text-base sm:text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <ListBulletIcon className="w-5 h-5 flex-shrink-0" />
            Categorías ({categories.length})
          </h2>

          {categories.length === 0 ? (
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8 sm:p-12 text-center">
              <FolderIcon className="w-12 h-12 sm:w-16 sm:h-16 mx-auto mb-3 sm:mb-4 text-gray-300 dark:text-gray-600" />
              <p className="text-gray-500 dark:text-gray-400 text-sm sm:text-base">No hay categorías en este proyecto.</p>
              <p className="text-xs sm:text-sm text-gray-400 dark:text-gray-500 mt-2">Crea una arriba para organizar tus tareas.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {categories.map((cat) => (
                <Link
                  key={cat.id}
                  href={`/categories/${cat.id}`}
                  className="block bg-white dark:bg-gray-800 rounded-xl shadow p-3 sm:p-4 hover:shadow-md transition-shadow group"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 sm:gap-4 min-w-0 flex-1">
                      <span className={`w-9 h-9 sm:w-10 sm:h-10 rounded-lg flex-shrink-0 ${cat.color}`} />
                      <div className="min-w-0">
                        <h3 className="font-bold text-gray-900 dark:text-white truncate sm:break-words">{cat.name}</h3>
                        <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">
                          {cat.task_count ?? 0} tarea{(cat.task_count ?? 0) !== 1 ? 's' : ''}
                        </p>
                      </div>
                    </div>
                    <ChevronRightIcon className="w-5 h-5 text-gray-400 flex-shrink-0" />
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
