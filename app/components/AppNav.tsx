'use client';

import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  HomeIcon,
  ListBulletIcon,
  FolderIcon,
  ChartBarIcon,
  Cog6ToothIcon,
  ChevronRightIcon,
  UserCircleIcon,
  ChevronDownIcon,
  ArrowLeftOnRectangleIcon,
  Bars3Icon,
  XMarkIcon,
} from '@heroicons/react/24/outline';

export const PUBLIC_PATHS = ['/', '/home', '/login', '/register'];

export const NAV_FLOW = [
  { href: '/home', label: 'Inicio', icon: HomeIcon, step: 1 },
  { href: '/tasks', label: 'Tareas', icon: ListBulletIcon, step: 2 },
  { href: '/projects', label: 'Proyectos', icon: FolderIcon, step: 3 },
  { href: '/dashboard', label: 'Dashboard', icon: ChartBarIcon, step: 4 },
  { href: '/settings', label: 'Configuración', icon: Cog6ToothIcon, step: 5 },
] as const;

function isCurrent(href: string, pathname: string): boolean {
  if (href === '/home') return pathname === '/home';
  return pathname.startsWith(href);
}

interface AuthUser {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  avatar_url: string | null;
}

export default function AppNav() {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const mobileMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch('/api/auth/me')
      .then((res) => res.json())
      .then((data) => data.success && data.user && setUser(data.user))
      .catch(() => setUser(null));
  }, [pathname]);

  useEffect(() => {
    if (!menuOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [menuOpen]);

  useEffect(() => {
    if (!mobileMenuOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (mobileMenuRef.current && !mobileMenuRef.current.contains(e.target as Node)) {
        setMobileMenuOpen(false);
      }
    };
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setMobileMenuOpen(false);
    };
    document.addEventListener('click', handleClickOutside);
    document.addEventListener('keydown', handleEscape);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('click', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = '';
    };
  }, [mobileMenuOpen]);

  const displayName = user
    ? [user.first_name, user.last_name].filter(Boolean).join(' ') || user.email
    : '';

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    setUser(null);
    setMenuOpen(false);
    setMobileMenuOpen(false);
    router.push('/home');
    router.refresh();
  };

  const closeMobileMenu = () => setMobileMenuOpen(false);

  // Panel móvil: renderizar en portal para que quede por encima de todo y no sea recortado
  const mobileMenuPanel =
    typeof document !== 'undefined' &&
    mobileMenuOpen &&
    createPortal(
      <div
        className="fixed inset-0 z-[100] md:hidden"
        aria-modal="true"
        role="dialog"
        aria-label="Menú de navegación"
      >
        <button
          type="button"
          onClick={closeMobileMenu}
          className="absolute inset-0 bg-black/50 backdrop-blur-sm"
          aria-label="Cerrar"
        />
        <div
          ref={mobileMenuRef}
          className="absolute top-0 right-0 bottom-0 w-full max-w-[280px] bg-white dark:bg-gray-800 border-l border-gray-200 dark:border-gray-700 shadow-xl flex flex-col overflow-hidden"
        >
          <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
            <span className="font-semibold text-gray-900 dark:text-white">Menú</span>
            <button
              type="button"
              onClick={closeMobileMenu}
              className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 touch-manipulation"
              aria-label="Cerrar menú"
            >
              <XMarkIcon className="w-5 h-5" />
            </button>
          </div>
          <nav className="flex-1 overflow-y-auto p-3" aria-label="Navegación principal">
            <ul className="space-y-0.5">
              {NAV_FLOW.map((item) => {
                const active = isCurrent(item.href, pathname);
                const Icon = item.icon;
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      onClick={closeMobileMenu}
                      className={`
                          flex items-center gap-3 px-4 py-3 rounded-xl text-base font-medium transition-colors touch-manipulation
                          ${active
                            ? 'bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300'
                            : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'}
                        `}
                      aria-current={active ? 'page' : undefined}
                    >
                      <Icon className="w-5 h-5 flex-shrink-0" />
                      {item.label}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>
          {displayName && (
            <div className="p-3 border-t border-gray-200 dark:border-gray-700 space-y-1">
              <p className="px-4 py-2 text-sm text-gray-500 dark:text-gray-400 truncate" title={displayName}>
                {displayName}
              </p>
              <button
                type="button"
                onClick={() => { handleLogout(); closeMobileMenu(); }}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors touch-manipulation"
              >
                <ArrowLeftOnRectangleIcon className="w-5 h-5 text-gray-500" />
                Cerrar sesión
              </button>
            </div>
          )}
        </div>
      </div>,
      document.body
    );

  // En rutas públicas, no mostrar el nav si no hay sesión
  const isPublicPath = PUBLIC_PATHS.includes(pathname);
  if (isPublicPath && !user) {
    return null;
  }

  return (
    <header className="sticky top-0 z-40 flex items-center justify-between gap-2 py-2 px-3 sm:px-4 bg-white/90 dark:bg-gray-800/90 backdrop-blur border-b border-gray-200 dark:border-gray-700">
      <div className="flex items-center gap-2 min-w-0">
        <Link
          href="/home"
          className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white truncate"
        >
          CV App
        </Link>
      </div>

      <nav
        className="hidden md:flex items-center gap-1 flex-wrap"
        aria-label="Flujo de la aplicación"
      >
        {NAV_FLOW.map((item, index) => {
          const active = isCurrent(item.href, pathname);
          const Icon = item.icon;
          return (
            <span key={item.href} className="inline-flex items-center gap-1">
              <Link
                href={item.href}
                className={`
                  inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors
                  ${active
                    ? 'bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300'
                    : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-white'}
                `}
                aria-current={active ? 'page' : undefined}
              >
                <Icon className="w-4 h-4 flex-shrink-0" aria-hidden />
                <span>{item.label}</span>
              </Link>
              {index < NAV_FLOW.length - 1 && (
                <ChevronRightIcon className="w-4 h-4 text-gray-300 dark:text-gray-600 flex-shrink-0" aria-hidden />
              )}
            </span>
          );
        })}
      </nav>

      <div className="flex items-center gap-2 flex-shrink-0">
        {displayName && (
          <div className="hidden md:block relative" ref={menuRef}>
            <button
              type="button"
              onClick={() => setMenuOpen((o) => !o)}
              className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg px-2 py-1.5 transition-colors"
              aria-expanded={menuOpen}
              aria-haspopup="true"
            >
              <UserCircleIcon className="w-5 h-5 text-indigo-500 dark:text-indigo-400 flex-shrink-0" />
              <span className="font-medium truncate max-w-[180px]" title={displayName}>
                {displayName}
              </span>
              <ChevronDownIcon className={`w-4 h-4 flex-shrink-0 transition-transform ${menuOpen ? 'rotate-180' : ''}`} />
            </button>
            {menuOpen && (
              <div className="absolute right-0 top-full mt-1 py-1 w-40 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-50">
                <button
                  type="button"
                  onClick={handleLogout}
                  className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg text-left"
                >
                  <ArrowLeftOnRectangleIcon className="w-4 h-4 text-gray-500" />
                  Logout
                </button>
              </div>
            )}
          </div>
        )}

        <button
          type="button"
          onClick={() => setMobileMenuOpen((o) => !o)}
          className="md:hidden p-2.5 rounded-lg text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-white transition-colors touch-manipulation"
          aria-expanded={mobileMenuOpen}
          aria-label={mobileMenuOpen ? 'Cerrar menú' : 'Abrir menú'}
        >
          {mobileMenuOpen ? (
            <XMarkIcon className="w-6 h-6" />
          ) : (
            <Bars3Icon className="w-6 h-6" />
          )}
        </button>

        {displayName && (
          <div className="md:hidden flex items-center gap-1.5 text-sm text-gray-700 dark:text-gray-300 truncate max-w-[120px]">
            <UserCircleIcon className="w-5 h-5 text-indigo-500 dark:text-indigo-400 flex-shrink-0" />
            <span className="truncate font-medium" title={displayName}>{displayName}</span>
          </div>
        )}
      </div>

      {mobileMenuPanel}
    </header>
  );
}
