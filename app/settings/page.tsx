'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  ArrowLeftIcon,
  ArrowPathIcon,
  CheckIcon,
  Cog6ToothIcon,
  ListBulletIcon,
  BellIcon,
  CpuChipIcon,
  FolderIcon,
  SparklesIcon,
  StarIcon,
  ChartBarIcon,
  KeyIcon,
  EyeIcon,
  EyeSlashIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
} from '@heroicons/react/24/outline';

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

// Componente Switch reutilizable
const Switch = ({ checked, onChange }: { checked: boolean; onChange: () => void }) => (
  <button
    type="button"
    role="switch"
    aria-checked={checked}
    onClick={onChange}
    className={`relative inline-flex h-7 w-12 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 ${
      checked ? 'bg-indigo-600' : 'bg-gray-300 dark:bg-gray-600'
    }`}
  >
    <span
      className={`pointer-events-none inline-block h-6 w-6 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
        checked ? 'translate-x-5' : 'translate-x-0'
      }`}
    />
  </button>
);

interface Settings {
  id: number;
  theme: 'light' | 'dark' | 'system';
  language: 'es' | 'en' | 'pt';
  default_priority: 'low' | 'medium' | 'high';
  default_category_id: number | null;
  show_completed_tasks: boolean;
  auto_archive_completed: boolean;
  archive_after_days: number;
  notifications_enabled: boolean;
  email_notifications: boolean;
  notification_sound: boolean;
  daily_summary: boolean;
  reminder_before_due: number;
  ai_suggestions_enabled: boolean;
  ai_auto_categorize: boolean;
  ai_model: string;
  tasks_per_page: number;
  default_view: 'list' | 'board' | 'calendar';
  show_subtasks_inline: boolean;
  compact_mode: boolean;
  max_categories: number;
  show_empty_categories: boolean;
  category_sort_order: 'manual' | 'alphabetical' | 'task_count';
}

interface Category {
  id: number;
  name: string;
  color: string;
  icon: string;
}

export default function SettingsPage() {
  const [settings, setSettings] = useState<Settings | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const [activeSection, setActiveSection] = useState('tasks');
  const [apiKey, setApiKey] = useState('');
  const [showApiKey, setShowApiKey] = useState(false);
  const [apiKeyStatus, setApiKeyStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [isValidatingKey, setIsValidatingKey] = useState(false);

  // Cargar API key desde localStorage
  useEffect(() => {
    const savedApiKey = localStorage.getItem('openai_api_key');
    if (savedApiKey) {
      setApiKey(maskApiKey(savedApiKey));
      setApiKeyStatus('saved');
    }
  }, []);

  useEffect(() => {
    const loadData = async () => {
      try {
        // Cargar configuración
        const settingsRes = await fetch('/api/db/settings');
        if (settingsRes.ok) {
          const data = await settingsRes.json();
          if (data.success && data.data) {
            setSettings(data.data);
          }
        }

        // Cargar categorías
        const catRes = await fetch('/api/db/categories');
        if (catRes.ok) {
          const data = await catRes.json();
          if (data.success && data.data) {
            setCategories(data.data);
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

  // Función para enmascarar el API key
  const maskApiKey = (key: string): string => {
    if (!key || key.length < 10) return '****';
    return key.substring(0, 7) + '...' + key.substring(key.length - 4);
  };

  // Función para guardar el API key en localStorage
  const saveApiKey = async () => {
    const trimmedKey = apiKey.trim();
    if (!trimmedKey || trimmedKey.includes('...')) return;
    
    // Validar formato básico
    if (!trimmedKey.startsWith('sk-')) {
      setApiKeyStatus('error');
      setTimeout(() => setApiKeyStatus('idle'), 3000);
      return;
    }
    
    setIsValidatingKey(true);
    setApiKeyStatus('saving');
    
    try {
      // Validar la key con OpenAI
      const response = await fetch('https://api.openai.com/v1/models', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${trimmedKey}`,
        },
      });
      
      if (response.ok) {
        // Guardar en localStorage
        localStorage.setItem('openai_api_key', trimmedKey);
        setApiKey(maskApiKey(trimmedKey));
        setApiKeyStatus('saved');
        setShowApiKey(false);
      } else {
        setApiKeyStatus('error');
        setTimeout(() => setApiKeyStatus('idle'), 3000);
      }
    } catch (error) {
      console.error('Error validando API key:', error);
      setApiKeyStatus('error');
      setTimeout(() => setApiKeyStatus('idle'), 3000);
    } finally {
      setIsValidatingKey(false);
    }
  };

  // Función para limpiar el API key
  const clearApiKey = () => {
    localStorage.removeItem('openai_api_key');
    setApiKey('');
    setApiKeyStatus('idle');
    setShowApiKey(false);
  };

  const updateSetting = async (key: keyof Settings, value: unknown) => {
    if (!settings) return;

    setSettings({ ...settings, [key]: value });
    setIsSaving(true);
    setSaveMessage(null);

    try {
      const response = await fetch('/api/db/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ [key]: value }),
      });

      if (response.ok) {
        setSaveMessage('Guardado');
        setTimeout(() => setSaveMessage(null), 2000);
      } else {
        setSaveMessage('Error al guardar');
      }
    } catch (error) {
      console.error('Error:', error);
      setSaveMessage('Error al guardar');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center">
        <div className="text-center">
          <ArrowPathIcon className="w-12 h-12 animate-spin text-indigo-600 dark:text-indigo-400 mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400">Cargando configuración...</p>
        </div>
      </div>
    );
  }

  if (!settings) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-500 mb-4">Error al cargar la configuración</p>
          <Link href="/tasks" className="text-indigo-600 hover:underline">
            Volver a tareas
          </Link>
        </div>
      </div>
    );
  }

  const sections = [
    { id: 'tasks', name: 'Tareas', icon: 'tasks' },
    { id: 'notifications', name: 'Notificaciones', icon: 'bell' },
    { id: 'ai', name: 'Inteligencia Artificial', icon: 'cpu' },
    { id: 'categories', name: 'Categorías', icon: 'folder' },
  ];

  const getSectionIcon = (iconName: string) => {
    const icons: { [key: string]: React.ReactNode } = {
      'tasks': <ListBulletIcon className="w-5 h-5" />,
      'bell': <BellIcon className="w-5 h-5" />,
      'cpu': <CpuChipIcon className="w-5 h-5" />,
      'folder': <FolderIcon className="w-5 h-5" />,
    };
    return icons[iconName] || <Cog6ToothIcon className="w-5 h-5" />;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        {/* Header */}
        <header className="mb-8">
          <Link 
            href="/tasks"
            className="inline-flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white mb-4 transition-colors"
          >
            <ArrowLeftIcon className="w-4 h-4" />
            Volver a Tareas
          </Link>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
                <Cog6ToothIcon className="w-10 h-10" /> Configuración
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mt-2">
                Personaliza tu experiencia en TaskIA
              </p>
            </div>
            {/* Indicador de guardado */}
            <div className="flex items-center gap-2">
              {isSaving && (
                <span className="flex items-center gap-2 text-gray-500">
                  <ArrowPathIcon className="w-4 h-4 animate-spin" />
                  Guardando...
                </span>
              )}
              {saveMessage && !isSaving && (
                <span className={`flex items-center gap-2 ${saveMessage === 'Guardado' ? 'text-green-600' : 'text-red-500'}`}>
                  {saveMessage === 'Guardado' && <CheckIcon className="w-4 h-4" />}
                  {saveMessage}
                </span>
              )}
            </div>
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Sidebar de navegación */}
          <div className="lg:col-span-1">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-4 sticky top-8">
              <nav className="space-y-1">
                {sections.map((section) => (
                  <button
                    key={section.id}
                    onClick={() => setActiveSection(section.id)}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-colors ${
                      activeSection === section.id
                        ? 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300'
                        : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
                    }`}
                  >
                    {getSectionIcon(section.icon)}
                    <span className="font-medium">{section.name}</span>
                  </button>
                ))}
              </nav>
            </div>
          </div>

          {/* Contenido principal */}
          <div className="lg:col-span-3 space-y-6">
            {/* Sección Tareas */}
            {activeSection === 'tasks' && (
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
                  <ListBulletIcon className="w-6 h-6" /> Configuración de Tareas
                </h2>
                
                <div className="space-y-6">
                  {/* Prioridad por defecto */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Prioridad por defecto para nuevas tareas
                    </label>
                    <div className="grid grid-cols-3 gap-3">
                      {[
                        { value: 'low', label: 'Baja', color: 'bg-green-100 text-green-700 border-green-300' },
                        { value: 'medium', label: 'Media', color: 'bg-amber-100 text-amber-700 border-amber-300' },
                        { value: 'high', label: 'Alta', color: 'bg-red-100 text-red-700 border-red-300' },
                      ].map((option) => (
                        <button
                          key={option.value}
                          onClick={() => updateSetting('default_priority', option.value)}
                          className={`p-3 rounded-lg border-2 transition-all ${
                            settings.default_priority === option.value
                              ? `${option.color} border-current`
                              : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
                          }`}
                        >
                          <span className="font-medium">{option.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Categoría por defecto */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Categoría por defecto
                    </label>
                    <select
                      value={settings.default_category_id || ''}
                      onChange={(e) => updateSetting('default_category_id', e.target.value ? parseInt(e.target.value) : null)}
                      className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                    >
                      <option value="">Sin categoría por defecto</option>
                      {categories.map((cat) => (
                        <option key={cat.id} value={cat.id}>
                          {cat.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Mostrar tareas completadas */}
                  <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">Mostrar tareas completadas</p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Las tareas completadas serán visibles en la lista</p>
                    </div>
                    <Switch 
                      checked={settings.show_completed_tasks} 
                      onChange={() => updateSetting('show_completed_tasks', !settings.show_completed_tasks)} 
                    />
                  </div>

                  {/* Auto archivar */}
                  <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">Auto-archivar tareas completadas</p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Archivar automáticamente después de completar</p>
                    </div>
                    <Switch 
                      checked={settings.auto_archive_completed} 
                      onChange={() => updateSetting('auto_archive_completed', !settings.auto_archive_completed)} 
                    />
                  </div>

                  {/* Días para archivar */}
                  {settings.auto_archive_completed && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Archivar después de (días)
                      </label>
                      <input
                        type="number"
                        min="1"
                        max="365"
                        value={settings.archive_after_days}
                        onChange={(e) => updateSetting('archive_after_days', parseInt(e.target.value))}
                        className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                      />
                    </div>
                  )}

                  {/* Tareas por página */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Tareas por página
                    </label>
                    <select
                      value={settings.tasks_per_page}
                      onChange={(e) => updateSetting('tasks_per_page', parseInt(e.target.value))}
                      className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                    >
                      <option value={10}>10 tareas</option>
                      <option value={20}>20 tareas</option>
                      <option value={50}>50 tareas</option>
                      <option value={100}>100 tareas</option>
                    </select>
                  </div>
                </div>
              </div>
            )}

            {/* Sección Notificaciones */}
            {activeSection === 'notifications' && (
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
                  <BellIcon className="w-6 h-6" /> Notificaciones
                </h2>
                
                <div className="space-y-4">
                  {/* Notificaciones habilitadas */}
                  <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">Notificaciones</p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Recibir notificaciones de la aplicación</p>
                    </div>
                    <Switch 
                      checked={settings.notifications_enabled} 
                      onChange={() => updateSetting('notifications_enabled', !settings.notifications_enabled)} 
                    />
                  </div>

                  {/* Notificaciones por email */}
                  <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">Notificaciones por email</p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Recibir actualizaciones por correo electrónico</p>
                    </div>
                    <Switch 
                      checked={settings.email_notifications} 
                      onChange={() => updateSetting('email_notifications', !settings.email_notifications)} 
                    />
                  </div>

                  {/* Sonido de notificación */}
                  <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">Sonido de notificación</p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Reproducir sonido al recibir notificaciones</p>
                    </div>
                    <Switch 
                      checked={settings.notification_sound} 
                      onChange={() => updateSetting('notification_sound', !settings.notification_sound)} 
                    />
                  </div>

                  {/* Resumen diario */}
                  <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">Resumen diario</p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Recibir un resumen de tareas cada día</p>
                    </div>
                    <Switch 
                      checked={settings.daily_summary} 
                      onChange={() => updateSetting('daily_summary', !settings.daily_summary)} 
                    />
                  </div>

                  {/* Recordatorio antes de fecha límite */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Recordatorio antes de fecha límite (horas)
                    </label>
                    <select
                      value={settings.reminder_before_due}
                      onChange={(e) => updateSetting('reminder_before_due', parseInt(e.target.value))}
                      className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                    >
                      <option value={1}>1 hora antes</option>
                      <option value={2}>2 horas antes</option>
                      <option value={6}>6 horas antes</option>
                      <option value={12}>12 horas antes</option>
                      <option value={24}>24 horas antes</option>
                      <option value={48}>48 horas antes</option>
                    </select>
                  </div>
                </div>
              </div>
            )}

            {/* Sección IA */}
            {activeSection === 'ai' && (
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
                  <CpuChipIcon className="w-6 h-6" /> Inteligencia Artificial
                </h2>
                
                <div className="space-y-6">
                  {/* API Key de OpenAI */}
                  <div className="p-4 bg-gradient-to-br from-purple-50 to-indigo-50 dark:from-purple-900/20 dark:to-indigo-900/20 rounded-lg border border-purple-100 dark:border-purple-800/30">
                    <div className="flex items-center gap-2 mb-3">
                      <KeyIcon className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                      <p className="font-medium text-gray-900 dark:text-white">API Key de OpenAI</p>
                    </div>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                      Ingresa tu API key de OpenAI para habilitar las funciones de IA. 
                      Puedes obtener una en{' '}
                      <a 
                        href="https://platform.openai.com/api-keys" 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-indigo-600 dark:text-indigo-400 hover:underline"
                      >
                        platform.openai.com
                      </a>
                    </p>
                    
                    <div className="space-y-3">
                      <div className="relative">
                        <input
                          type={showApiKey ? 'text' : 'password'}
                          value={apiKey}
                          onChange={(e) => {
                            setApiKey(e.target.value);
                            if (apiKeyStatus === 'saved' || apiKeyStatus === 'error') {
                              setApiKeyStatus('idle');
                            }
                          }}
                          placeholder="sk-..."
                          className="w-full px-4 py-3 pr-24 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent dark:bg-gray-700 dark:text-white font-mono text-sm"
                        />
                        <button
                          type="button"
                          onClick={() => setShowApiKey(!showApiKey)}
                          className="absolute right-12 top-1/2 -translate-y-1/2 p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                        >
                          {showApiKey ? (
                            <EyeSlashIcon className="w-5 h-5" />
                          ) : (
                            <EyeIcon className="w-5 h-5" />
                          )}
                        </button>
                        {apiKeyStatus === 'saved' && (
                          <button
                            type="button"
                            onClick={clearApiKey}
                            className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-red-500"
                            title="Cambiar API key"
                          >
                            <span className="text-xs">Cambiar</span>
                          </button>
                        )}
                      </div>
                      
                      {/* Botón de guardar */}
                      {apiKeyStatus !== 'saved' && (
                        <button
                          onClick={saveApiKey}
                          disabled={!apiKey.trim() || apiKey.includes('...') || isValidatingKey}
                          className="w-full py-3 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-lg hover:from-purple-700 hover:to-indigo-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 font-medium"
                        >
                          {isValidatingKey ? (
                            <>
                              <ArrowPathIcon className="w-5 h-5 animate-spin" />
                              Validando...
                            </>
                          ) : (
                            <>
                              <KeyIcon className="w-5 h-5" />
                              Guardar API Key
                            </>
                          )}
                        </button>
                      )}
                      
                      {/* Estado del API key */}
                      {apiKeyStatus === 'saved' && (
                        <div className="flex items-center gap-2 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg text-green-700 dark:text-green-400">
                          <CheckCircleIcon className="w-5 h-5" />
                          <span className="text-sm font-medium">API key configurada correctamente</span>
                        </div>
                      )}
                      
                      {apiKeyStatus === 'error' && (
                        <div className="flex items-center gap-2 p-3 bg-red-50 dark:bg-red-900/20 rounded-lg text-red-700 dark:text-red-400">
                          <ExclamationTriangleIcon className="w-5 h-5" />
                          <span className="text-sm font-medium">API key inválida. Verifica que sea correcta.</span>
                        </div>
                      )}
                      
                      {/* Información de seguridad */}
                      <div className="flex items-start gap-2 p-3 bg-amber-50 dark:bg-amber-900/20 rounded-lg">
                        <ExclamationTriangleIcon className="w-4 h-4 text-amber-600 dark:text-amber-400 mt-0.5 flex-shrink-0" />
                        <p className="text-xs text-amber-700 dark:text-amber-300">
                          Tu API key se guarda localmente en este navegador. Si usas otro dispositivo o navegador, deberás ingresarla nuevamente.
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Sugerencias de IA */}
                  <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">Sugerencias de IA</p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Obtener sugerencias inteligentes para completar tareas</p>
                    </div>
                    <Switch 
                      checked={settings.ai_suggestions_enabled} 
                      onChange={() => updateSetting('ai_suggestions_enabled', !settings.ai_suggestions_enabled)} 
                    />
                  </div>

                  {/* Modelo de IA */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Modelo de IA
                    </label>
                    <select
                      value={settings.ai_model}
                      onChange={(e) => updateSetting('ai_model', e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                    >
                      <option value="gpt-4o-mini">GPT-4o Mini (Recomendado - Económico)</option>
                      <option value="gpt-4o">GPT-4o (Más potente)</option>
                      <option value="gpt-4-turbo">GPT-4 Turbo</option>
                      <option value="gpt-3.5-turbo">GPT-3.5 Turbo (Más rápido)</option>
                    </select>
                    <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                      GPT-4o Mini ofrece el mejor balance entre costo y rendimiento.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Sección Categorías */}
            {activeSection === 'categories' && (
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
                  <FolderIcon className="w-6 h-6" /> Configuración de Categorías
                </h2>
                
                <div className="space-y-6">
                  {/* Máximo de categorías */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Máximo de categorías permitidas
                    </label>
                    <select
                      value={settings.max_categories}
                      onChange={(e) => updateSetting('max_categories', parseInt(e.target.value))}
                      className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                    >
                      <option value={5}>5 categorías</option>
                      <option value={10}>10 categorías</option>
                      <option value={20}>20 categorías</option>
                      <option value={50}>50 categorías</option>
                      <option value={100}>Ilimitadas (100)</option>
                    </select>
                  </div>

                  {/* Mostrar categorías vacías */}
                  <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">Mostrar categorías vacías</p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Mostrar categorías sin tareas en la lista</p>
                    </div>
                    <Switch 
                      checked={settings.show_empty_categories} 
                      onChange={() => updateSetting('show_empty_categories', !settings.show_empty_categories)} 
                    />
                  </div>

                  {/* Orden de categorías */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Orden de categorías
                    </label>
                    <select
                      value={settings.category_sort_order}
                      onChange={(e) => updateSetting('category_sort_order', e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                    >
                      <option value="manual">Manual (arrastrar y soltar)</option>
                      <option value="alphabetical">Alfabético</option>
                      <option value="task_count">Por cantidad de tareas</option>
                    </select>
                  </div>

                  {/* Lista de categorías actuales */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                      Categorías actuales ({categories.length})
                    </label>
                    <div className="space-y-2">
                      {categories.map((cat) => (
                        <div key={cat.id} className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                          <span className={`w-4 h-4 rounded-full ${cat.color}`}></span>
                          {getCategoryIcon(cat.icon, "w-5 h-5 text-gray-600 dark:text-gray-400")}
                          <span className="font-medium text-gray-900 dark:text-white">{cat.name}</span>
                        </div>
                      ))}
                    </div>
                    <Link 
                      href="/tasks"
                      className="inline-block mt-4 text-indigo-600 dark:text-indigo-400 hover:underline text-sm"
                    >
                      Administrar categorías en Tareas →
                    </Link>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
