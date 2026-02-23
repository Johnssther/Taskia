'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  PlusIcon,
  FolderIcon,
  ChevronRightIcon,
  TrashIcon,
  ArrowPathIcon,
  ListBulletIcon,
} from '@heroicons/react/24/outline';

interface Project {
  id: number;
  name: string;
  user_id: number;
  created_at: string;
  updated_at: string;
  category_count?: number;
}

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [newProjectName, setNewProjectName] = useState('');
  const [isAdding, setIsAdding] = useState(false);

  const loadProjects = async () => {
    try {
      const res = await fetch('/api/db/projects');
      if (res.ok) {
        const data = await res.json();
        if (data.success && data.data) setProjects(data.data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadProjects();
  }, []);

  const addProject = async () => {
    const name = newProjectName.trim();
    if (!name) return;
    setIsAdding(true);
    try {
      const res = await fetch('/api/db/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.success && data.data) {
          setProjects([...projects, data.data]);
          setNewProjectName('');
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsAdding(false);
    }
  };

  const deleteProject = async (e: React.MouseEvent, id: number) => {
    e.preventDefault();
    e.stopPropagation();
    if (!confirm('¿Eliminar este proyecto y sus categorías?')) return;
    try {
      const res = await fetch(`/api/db/projects/${id}`, { method: 'DELETE' });
      if (res.ok) setProjects(projects.filter((p) => p.id !== id));
    } catch (e) {
      console.error(e);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center p-4">
        <div className="text-center">
          <ArrowPathIcon className="w-10 h-10 sm:w-12 sm:h-12 animate-spin text-indigo-600 dark:text-indigo-400 mx-auto mb-4" />
          <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400">Cargando proyectos...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <div className="container mx-auto px-4 sm:px-6 py-6 sm:py-8 max-w-4xl">
        <header className="mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 dark:text-white flex items-center gap-2 sm:gap-3 flex-wrap">
            <FolderIcon className="w-8 h-8 sm:w-10 sm:h-10 text-indigo-600 dark:text-indigo-400 flex-shrink-0" />
            Proyectos
          </h1>
          <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 mt-1 sm:mt-2">
            Cada proyecto puede tener muchas categorías de tareas.
          </p>
        </header>

        {/* Crear proyecto */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-4 sm:p-6 mb-6 sm:mb-8">
          <h2 className="text-base sm:text-lg font-bold text-gray-900 dark:text-white mb-3 sm:mb-4 flex items-center gap-2">
            <PlusIcon className="w-5 h-5 flex-shrink-0" />
            Nuevo proyecto
          </h2>
          <div className="flex flex-col sm:flex-row gap-3">
            <input
              type="text"
              value={newProjectName}
              onChange={(e) => setNewProjectName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && addProject()}
              placeholder="Nombre del proyecto"
              className="w-full sm:flex-1 sm:min-w-0 px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
            />
            <button
              onClick={addProject}
              disabled={isAdding || !newProjectName.trim()}
              className="w-full sm:w-auto px-5 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg hover:from-indigo-700 hover:to-purple-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 font-medium"
            >
              {isAdding ? (
                <ArrowPathIcon className="w-5 h-5 animate-spin" />
              ) : (
                <PlusIcon className="w-5 h-5" />
              )}
              Crear
            </button>
          </div>
        </div>

        {/* Lista de proyectos */}
        <div className="space-y-3">
          <h2 className="text-base sm:text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <ListBulletIcon className="w-5 h-5 flex-shrink-0" />
            Mis proyectos ({projects.length})
          </h2>

          {projects.length === 0 ? (
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8 sm:p-12 text-center">
              <FolderIcon className="w-12 h-12 sm:w-16 sm:h-16 mx-auto mb-3 sm:mb-4 text-gray-300 dark:text-gray-600" />
              <p className="text-gray-500 dark:text-gray-400 text-sm sm:text-base">No tienes proyectos aún.</p>
              <p className="text-xs sm:text-sm text-gray-400 dark:text-gray-500 mt-2">
                Crea uno arriba para empezar.
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {projects.map((project) => (
                <Link
                  key={project.id}
                  href={`/projects/${project.id}`}
                  className="block bg-white dark:bg-gray-800 rounded-xl shadow-lg p-3 sm:p-4 hover:shadow-xl transition-shadow group"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 sm:gap-4 min-w-0 flex-1">
                      <span className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center flex-shrink-0">
                        <FolderIcon className="w-5 h-5 sm:w-7 sm:h-7 text-indigo-600 dark:text-indigo-400" />
                      </span>
                      <div className="min-w-0 flex-1">
                        <h3 className="text-base sm:text-lg font-bold text-gray-900 dark:text-white truncate">
                          {project.name}
                        </h3>
                        <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">
                          {project.category_count ?? 0} categoría{(project.category_count ?? 0) !== 1 ? 's' : ''}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
                      <button
                        onClick={(e) => deleteProject(e, project.id)}
                        className="p-2 sm:p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors opacity-100 sm:opacity-0 sm:group-hover:opacity-100 touch-manipulation"
                        title="Eliminar proyecto"
                      >
                        <TrashIcon className="w-5 h-5" />
                      </button>
                      <ChevronRightIcon className="w-5 h-5 sm:w-6 sm:h-6 text-gray-400" />
                    </div>
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
