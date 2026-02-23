'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { EnvelopeIcon, LockClosedIcon, ArrowPathIcon, RocketLaunchIcon } from '@heroicons/react/24/outline';

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const fromParam = searchParams.get('from') || '/home';
  const from = fromParam === '/' ? '/home' : fromParam;
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Error al iniciar sesión');
        setLoading(false);
        return;
      }
      router.push(from);
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
            <p className="text-sm text-gray-500 dark:text-gray-400">Iniciar sesión</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6 space-y-4 border border-gray-200 dark:border-gray-700">
          {error && (
            <div className="p-3 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-lg text-sm">
              {error}
            </div>
          )}
          <div>
            <label htmlFor="login-email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Email
            </label>
            <div className="relative">
              <EnvelopeIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                id="login-email"
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
            <label htmlFor="login-password" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Contraseña
            </label>
            <div className="relative">
              <LockClosedIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                id="login-password"
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
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
                Entrando...
              </>
            ) : (
              'Entrar'
            )}
          </button>
          <p className="text-center text-sm text-gray-500 dark:text-gray-400">
            ¿No tienes cuenta?{' '}
            <Link href="/register" className="text-indigo-600 dark:text-indigo-400 font-medium hover:underline">
              Regístrate
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
