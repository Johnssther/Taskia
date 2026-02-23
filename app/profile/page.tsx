'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  UserCircleIcon,
  EnvelopeIcon,
  PhoneIcon,
  MapPinIcon,
  GlobeAltIcon,
  PencilSquareIcon,
  CheckIcon,
  XMarkIcon,
  ArrowLeftIcon,
  SparklesIcon,
  CalendarDaysIcon,
  CheckBadgeIcon,
  Cog6ToothIcon,
  ChartBarIcon,
} from '@heroicons/react/24/outline';
import { StarIcon } from '@heroicons/react/24/solid';

interface User {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  avatar_url: string | null;
  bio: string | null;
  phone: string | null;
  location: string | null;
  website: string | null;
  job_title: string | null;
  company: string | null;
  is_premium: boolean;
  email_verified: boolean;
  last_login: string | null;
  created_at: string;
  updated_at: string;
}

export default function ProfilePage() {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState<Partial<User>>({});
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    fetchUser();
  }, []);

  const fetchUser = async () => {
    try {
      const response = await fetch('/api/db/users');
      if (response.ok) {
        const data = await response.json();
        setUser(data);
        setEditForm(data);
      }
    } catch (error) {
      console.error('Error cargando usuario:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const response = await fetch('/api/db/users', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editForm),
      });
      if (response.ok) {
        const updatedUser = await response.json();
        setUser(updatedUser);
        setIsEditing(false);
      }
    } catch (error) {
      console.error('Error guardando:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-indigo-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-indigo-900 flex items-center justify-center">
        <div className="text-center">
          <UserCircleIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400 mb-4">Usuario no encontrado</p>
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
      {/* Header */}
      <header className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-b border-gray-200 dark:border-gray-700 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link
            href="/home"
            className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
          >
            <ArrowLeftIcon className="w-5 h-5" />
            <span>Inicio</span>
          </Link>
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">Mi Perfil</h1>
          <div className="flex items-center gap-2">
            <Link
              href="/dashboard"
              className="p-2 text-gray-500 hover:text-indigo-600 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              title="Dashboard"
            >
              <ChartBarIcon className="w-5 h-5" />
            </Link>
            <Link
              href="/settings"
              className="p-2 text-gray-500 hover:text-indigo-600 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              title="Configuración"
            >
              <Cog6ToothIcon className="w-5 h-5" />
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8">
        {/* Profile Card */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl overflow-hidden">
          {/* Cover & Avatar */}
          <div className="h-32 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 relative">
            <div className="absolute -bottom-16 left-8">
              {user.avatar_url ? (
                <img
                  src={user.avatar_url}
                  alt={`${user.first_name} ${user.last_name}`}
                  className="w-32 h-32 rounded-2xl border-4 border-white dark:border-gray-800 shadow-lg object-cover"
                />
              ) : (
                <div className="w-32 h-32 rounded-2xl border-4 border-white dark:border-gray-800 shadow-lg bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                  <UserCircleIcon className="w-20 h-20 text-gray-400" />
                </div>
              )}
            </div>
            {/* Premium Badge */}
            {user.is_premium && (
              <div className="absolute top-4 right-4 flex items-center gap-1.5 bg-gradient-to-r from-amber-400 to-orange-500 text-white px-3 py-1.5 rounded-full text-sm font-medium shadow-lg">
                <StarIcon className="w-4 h-4" />
                Premium
              </div>
            )}
          </div>

          {/* User Info */}
          <div className="pt-20 pb-6 px-8">
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                    {isEditing ? (
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={editForm.first_name || ''}
                          onChange={(e) => setEditForm({ ...editForm, first_name: e.target.value })}
                          className="px-2 py-1 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white text-lg w-32"
                          placeholder="Nombre"
                        />
                        <input
                          type="text"
                          value={editForm.last_name || ''}
                          onChange={(e) => setEditForm({ ...editForm, last_name: e.target.value })}
                          className="px-2 py-1 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white text-lg w-32"
                          placeholder="Apellido"
                        />
                      </div>
                    ) : (
                      `${user.first_name} ${user.last_name}`
                    )}
                  </h2>
                  {user.email_verified && !isEditing && (
                    <CheckBadgeIcon className="w-6 h-6 text-blue-500" title="Email verificado" />
                  )}
                </div>
                {(user.job_title || user.company || isEditing) && (
                  <div className="mt-1">
                    {isEditing ? (
                      <div className="flex items-center gap-2 mt-2">
                        <input
                          type="text"
                          value={editForm.job_title || ''}
                          onChange={(e) => setEditForm({ ...editForm, job_title: e.target.value })}
                          placeholder="Cargo"
                          className="px-2 py-1 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white text-sm w-40"
                        />
                        <span className="text-gray-400">en</span>
                        <input
                          type="text"
                          value={editForm.company || ''}
                          onChange={(e) => setEditForm({ ...editForm, company: e.target.value })}
                          placeholder="Empresa"
                          className="px-2 py-1 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white text-sm w-40"
                        />
                      </div>
                    ) : (
                      <p className="text-gray-600 dark:text-gray-400">
                        {user.job_title}
                        {user.job_title && user.company && ' en '}
                        {user.company}
                      </p>
                    )}
                  </div>
                )}
              </div>
              <div className="flex gap-2">
                {isEditing ? (
                  <>
                    <button
                      onClick={() => {
                        setIsEditing(false);
                        setEditForm(user);
                      }}
                      className="p-2 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                      title="Cancelar"
                    >
                      <XMarkIcon className="w-5 h-5" />
                    </button>
                    <button
                      onClick={handleSave}
                      disabled={isSaving}
                      className="p-2 text-green-600 hover:text-green-700 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-lg transition-colors disabled:opacity-50"
                      title="Guardar"
                    >
                      <CheckIcon className="w-5 h-5" />
                    </button>
                  </>
                ) : (
                  <button
                    onClick={() => setIsEditing(true)}
                    className="flex items-center gap-2 px-4 py-2 text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-lg transition-colors"
                  >
                    <PencilSquareIcon className="w-5 h-5" />
                    Editar
                  </button>
                )}
              </div>
            </div>

            {/* Bio */}
            <div className="mt-6">
              <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">Sobre mí</h3>
              {isEditing ? (
                <textarea
                  value={editForm.bio || ''}
                  onChange={(e) => setEditForm({ ...editForm, bio: e.target.value })}
                  rows={3}
                  className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 text-gray-700 dark:text-gray-300"
                  placeholder="Cuéntanos sobre ti..."
                />
              ) : (
                <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                  {user.bio || 'Sin biografía'}
                </p>
              )}
            </div>

            {/* Contact Info Grid */}
            <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Email */}
              <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
                <div className="w-10 h-10 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg flex items-center justify-center">
                  <EnvelopeIcon className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                </div>
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Email</p>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">{user.email}</p>
                </div>
              </div>

              {/* Phone */}
              <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
                <div className="w-10 h-10 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center">
                  <PhoneIcon className="w-5 h-5 text-green-600 dark:text-green-400" />
                </div>
                <div className="flex-1">
                  <p className="text-xs text-gray-500 dark:text-gray-400">Teléfono</p>
                  {isEditing ? (
                    <input
                      type="text"
                      value={editForm.phone || ''}
                      onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                      className="w-full px-2 py-1 border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white text-sm"
                      placeholder="+1 (555) 123-4567"
                    />
                  ) : (
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      {user.phone || 'No especificado'}
                    </p>
                  )}
                </div>
              </div>

              {/* Location */}
              <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
                <div className="w-10 h-10 bg-red-100 dark:bg-red-900/30 rounded-lg flex items-center justify-center">
                  <MapPinIcon className="w-5 h-5 text-red-600 dark:text-red-400" />
                </div>
                <div className="flex-1">
                  <p className="text-xs text-gray-500 dark:text-gray-400">Ubicación</p>
                  {isEditing ? (
                    <input
                      type="text"
                      value={editForm.location || ''}
                      onChange={(e) => setEditForm({ ...editForm, location: e.target.value })}
                      className="w-full px-2 py-1 border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white text-sm"
                      placeholder="Ciudad, País"
                    />
                  ) : (
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      {user.location || 'No especificado'}
                    </p>
                  )}
                </div>
              </div>

              {/* Website */}
              <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
                <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center">
                  <GlobeAltIcon className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                </div>
                <div className="flex-1">
                  <p className="text-xs text-gray-500 dark:text-gray-400">Sitio web</p>
                  {isEditing ? (
                    <input
                      type="text"
                      value={editForm.website || ''}
                      onChange={(e) => setEditForm({ ...editForm, website: e.target.value })}
                      className="w-full px-2 py-1 border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white text-sm"
                      placeholder="https://tusitio.com"
                    />
                  ) : user.website ? (
                    <a
                      href={user.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm font-medium text-indigo-600 dark:text-indigo-400 hover:underline"
                    >
                      {user.website}
                    </a>
                  ) : (
                    <p className="text-sm font-medium text-gray-900 dark:text-white">No especificado</p>
                  )}
                </div>
              </div>
            </div>

            {/* Avatar URL (only in edit mode) */}
            {isEditing && (
              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">
                  URL de imagen de perfil
                </label>
                <input
                  type="text"
                  value={editForm.avatar_url || ''}
                  onChange={(e) => setEditForm({ ...editForm, avatar_url: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white text-sm"
                  placeholder="https://ejemplo.com/mi-foto.jpg"
                />
              </div>
            )}

            {/* Account Info */}
            <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
              <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-4">
                Información de la cuenta
              </h3>
              <div className="flex flex-wrap gap-4 text-sm text-gray-600 dark:text-gray-400">
                <div className="flex items-center gap-2">
                  <CalendarDaysIcon className="w-4 h-4" />
                  <span>Miembro desde {formatDate(user.created_at)}</span>
                </div>
                {user.last_login && (
                  <div className="flex items-center gap-2">
                    <SparklesIcon className="w-4 h-4" />
                    <span>Último acceso: {formatDate(user.last_login)}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Quick Links */}
            <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
              <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-4">
                Accesos rápidos
              </h3>
              <div className="flex flex-wrap gap-3">
                <Link
                  href="/tasks"
                  className="px-4 py-2 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 rounded-lg hover:bg-indigo-200 dark:hover:bg-indigo-900/50 transition-colors text-sm font-medium"
                >
                  Mis Tareas
                </Link>
                <Link
                  href="/dashboard"
                  className="px-4 py-2 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded-lg hover:bg-purple-200 dark:hover:bg-purple-900/50 transition-colors text-sm font-medium"
                >
                  Dashboard
                </Link>
                <Link
                  href="/settings"
                  className="px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors text-sm font-medium"
                >
                  Configuración
                </Link>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
