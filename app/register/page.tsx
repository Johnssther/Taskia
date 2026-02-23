'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  EnvelopeIcon,
  LockClosedIcon,
  UserIcon,
  ArrowPathIcon,
  RocketLaunchIcon,
} from '@heroicons/react/24/outline';

export default function RegisterPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres');
      return;
    }
    setLoading(true);
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email.trim(),
          password,
          first_name: firstName.trim(),
          last_name: lastName.trim(),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Error al registrarse');
        setLoading(false);
        return;
      }
      router.push('/home');
      router.refresh();
    } catch {
      setError('Error de conexión');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-indigo-900 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="flex items-center justify-center gap-3 mb-8">
          <div className="w-12 h-12 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-xl flex items-center justify-center">
            <RocketLaunchIcon className="w-7 h-7 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">TaskIA</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">Crear cuenta</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6 space-y-4 border border-gray-200 dark:border-gray-700">
          {error && (
            <div className="p-3 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-lg text-sm">
              {error}
            </div>
          )}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="reg-first" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Nombre
              </label>
              <div className="relative">
                <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  id="reg-first"
                  type="text"
                  autoComplete="given-name"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  placeholder="Juan"
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                />
              </div>
            </div>
            <div>
              <label htmlFor="reg-last" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Apellido
              </label>
              <div className="relative">
                <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  id="reg-last"
                  type="text"
                  autoComplete="family-name"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  placeholder="Pérez"
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                />
              </div>
            </div>
          </div>
          <div>
            <label htmlFor="reg-email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Email
            </label>
            <div className="relative">
              <EnvelopeIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                id="reg-email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="tu@email.com"
                required
                className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
              />
            </div>
          </div>
          <div>
            <label htmlFor="reg-password" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Contraseña (mín. 6 caracteres)
            </label>
            <div className="relative">
              <LockClosedIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                id="reg-password"
                type="password"
                autoComplete="new-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                minLength={6}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
              />
            </div>
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-medium rounded-xl hover:from-indigo-700 hover:to-purple-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <ArrowPathIcon className="w-5 h-5 animate-spin" />
                Creando cuenta...
              </>
            ) : (
              'Crear cuenta'
            )}
          </button>
          <p className="text-center text-sm text-gray-500 dark:text-gray-400">
            ¿Ya tienes cuenta?{' '}
            <Link href="/login" className="text-indigo-600 dark:text-indigo-400 font-medium hover:underline">
              Inicia sesión
            </Link>
          </p>
        </form>

        <p className="mt-6 text-center">
          <Link href="/home" className="text-sm text-gray-500 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400">
            ← Volver al inicio
          </Link>
        </p>
      </div>
    </div>
  );
}
