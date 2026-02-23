import Link from 'next/link';
import {
  SparklesIcon,
  ClockIcon,
  ChartBarIcon,
  FolderIcon,
  ChatBubbleLeftRightIcon,
  CheckCircleIcon,
  ViewColumnsIcon,
  ArrowRightIcon,
} from '@heroicons/react/24/outline';

export default function RootPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-indigo-50/30 dark:from-slate-950 dark:via-slate-900 dark:to-indigo-950/20">
      {/* Hero */}
      <header className="relative overflow-hidden px-4 pt-16 pb-24 sm:px-6 lg:px-8">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_-20%,rgba(99,102,241,0.25),transparent)] dark:bg-[radial-gradient(ellipse_80%_60%_at_50%_-20%,rgba(99,102,241,0.15),transparent)]" />
        <div className="relative mx-auto max-w-4xl text-center">
          <h1 className="animate-fade-in-up landing-delay-1 text-4xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-5xl md:text-6xl">
            Gestiona tus tareas con{' '}
            <span className="bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
              inteligencia artificial
            </span>
          </h1>
          <p className="animate-fade-in-up landing-delay-2 mx-auto mt-4 max-w-2xl text-lg text-slate-600 dark:text-slate-400">
            TaskIA combina organización clara con IA: genera tareas desde una descripción, recibe sugerencias y chat por tarea, cronómetro y dashboard para ser más productivo.
          </p>
          {/* Tarjeta decorativa tipo mockup */}
          <div
            aria-hidden
            className="animate-fade-in-up animate-float landing-delay-5 pointer-events-none absolute right-[5%] top-28 hidden w-52 rounded-2xl border border-slate-200/80 bg-white/95 p-4 shadow-xl backdrop-blur sm:block dark:border-slate-600 dark:bg-slate-800/95"
          >
            <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400">
              <span className="h-2 w-2 rounded-full bg-rose-500" />
              <span className="text-xs font-medium">Prioridad alta</span>
            </div>
            <p className="mt-2 font-semibold text-slate-800 dark:text-white">Revisar informe Q1</p>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Marketing · 2h estimadas</p>
          </div>
          <div className="animate-fade-in-up landing-delay-3 mt-10 flex flex-wrap justify-center gap-4">
            <Link
              href="/register"
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 px-6 py-3 text-base font-semibold text-white shadow-lg shadow-indigo-500/30 transition hover:shadow-indigo-500/40 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 dark:focus:ring-offset-slate-900"
            >
              Crear cuenta gratis
              <ArrowRightIcon className="h-5 w-5" />
            </Link>
            <Link
              href="/login"
              className="inline-flex items-center rounded-xl border border-slate-300 bg-white px-6 py-3 text-base font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700 dark:focus:ring-offset-slate-900"
            >
              Iniciar sesión
            </Link>
          </div>
        </div>
      </header>

      {/* Features - Novedades */}
      <section className="px-4 py-16 sm:px-6 lg:px-8" aria-labelledby="features-heading">
        <div className="mx-auto max-w-6xl">
          <h2
            id="features-heading"
            className="animate-fade-in-up landing-delay-4 text-center text-2xl font-bold text-slate-900 dark:text-white sm:text-3xl"
          >
            Novedades y características
          </h2>
          <p className="animate-fade-in-up landing-delay-4 mx-auto mt-2 max-w-2xl text-center text-slate-600 dark:text-slate-400">
            Todo lo que necesitas para planificar, ejecutar y medir tu trabajo en un solo lugar.
          </p>
          <div className="mt-14 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {[
              {
                icon: SparklesIcon,
                title: 'Generar tareas con IA',
                description:
                  'Describe tu proyecto y la IA crea la categoría, tareas, subtareas, prioridades y estimaciones de tiempo.',
                gradient: 'from-amber-500 to-orange-500',
              },
              {
                icon: ViewColumnsIcon,
                title: 'Inicio tipo tarjetas',
                description:
                  'Revisa tus pendientes en tarjetas: omite o elige "trabajar" para ir al detalle. Estadísticas rápidas a la vista.',
                gradient: 'from-indigo-500 to-blue-500',
              },
              {
                icon: ClockIcon,
                title: 'Cronómetro por tarea',
                description:
                  'Mide el tiempo trabajado, define tiempo estimado y recibe avisos. Sesiones guardadas automáticamente.',
                gradient: 'from-emerald-500 to-teal-500',
              },
              {
                icon: ChartBarIcon,
                title: 'Dashboard y estadísticas',
                description:
                  'Gráficos por categoría, estado, prioridad y actividad reciente para ver tu productividad.',
                gradient: 'from-violet-500 to-purple-500',
              },
              {
                icon: FolderIcon,
                title: 'Categorías y proyectos',
                description:
                  'Organiza por categorías con colores. Agrupa tareas en proyectos y mantén todo ordenado.',
                gradient: 'from-rose-500 to-pink-500',
              },
              {
                icon: ChatBubbleLeftRightIcon,
                title: 'Chat y sugerencias de IA',
                description:
                  'Sugerencias de IA por tarea y chat en contexto para resolver dudas sin salir del detalle.',
                gradient: 'from-cyan-500 to-sky-500',
              },
            ].map((item, i) => (
              <div
                key={item.title}
                className="animate-fade-in-up flex flex-col rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm transition hover:border-indigo-200 hover:shadow-md dark:border-slate-700 dark:bg-slate-800/50 dark:hover:border-indigo-500/30"
                style={{ animationDelay: `${0.6 + i * 0.08}s` }}
              >
                <div
                  className={`inline-flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br ${item.gradient} text-white shadow-lg`}
                >
                  <item.icon className="h-6 w-6" />
                </div>
                <h3 className="mt-4 text-lg font-semibold text-slate-900 dark:text-white">
                  {item.title}
                </h3>
                <p className="mt-2 flex-1 text-slate-600 dark:text-slate-400">
                  {item.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits / Por qué TaskIA */}
      <section className="border-t border-slate-200 bg-slate-50/50 px-4 py-16 dark:border-slate-800 dark:bg-slate-900/50 sm:px-6 lg:px-8" aria-labelledby="benefits-heading">
        <div className="mx-auto max-w-4xl">
          <h2
            id="benefits-heading"
            className="animate-fade-in-up landing-delay-7 text-center text-2xl font-bold text-slate-900 dark:text-white sm:text-3xl"
          >
            ¿Por qué TaskIA?
          </h2>
          <ul className="mt-10 space-y-4">
            {[
              'Planifica proyectos grandes describiéndolos en lenguaje natural; la IA genera la estructura.',
              'Rastrea el tiempo por tarea y compara con lo estimado para mejorar tu planificación.',
              'Subtareas con progreso y celebración al completar todas.',
              'Comentarios en cada tarea y documentos adjuntos para dar contexto a la IA.',
              'Configura notificaciones, resumen diario y tu API de OpenAI en un solo lugar.',
            ].map((text, i) => (
              <li
                key={i}
                className="animate-fade-in-up flex items-start gap-3 rounded-xl border border-slate-200/80 bg-white px-4 py-3 dark:border-slate-700 dark:bg-slate-800/50"
                style={{ animationDelay: `${0.9 + i * 0.07}s` }}
              >
                <CheckCircleIcon className="mt-0.5 h-6 w-6 shrink-0 text-indigo-500" />
                <span className="text-slate-700 dark:text-slate-300">{text}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* CTA final */}
      <section className="px-4 py-20 sm:px-6 lg:px-8" aria-labelledby="cta-heading">
        <div className="animate-fade-in-up landing-delay-9 mx-auto max-w-2xl rounded-3xl bg-gradient-to-r from-indigo-600 to-purple-600 px-6 py-14 text-center shadow-xl shadow-indigo-500/25">
          <h2 id="cta-heading" className="text-2xl font-bold text-white sm:text-3xl">
            Empieza a ser más productivo hoy
          </h2>
          <p className="mt-3 text-indigo-100">
            Crea tu cuenta gratis y descubre la gestión de tareas con IA.
          </p>
          <div className="mt-8">
            <Link
              href="/register"
              className="inline-flex items-center gap-2 rounded-xl bg-white px-6 py-3 text-base font-semibold text-indigo-600 shadow-lg transition hover:bg-indigo-50 focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-indigo-600"
            >
              Registrarse en TaskIA
              <ArrowRightIcon className="h-5 w-5" />
            </Link>
          </div>
        </div>
      </section>

      {/* Footer mínimo */}
      <footer className="border-t border-slate-200 px-4 py-8 dark:border-slate-800">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 sm:flex-row">
          <p className="text-sm text-slate-500 dark:text-slate-400">
            TaskIA — Gestión de tareas con inteligencia artificial
          </p>
          <div className="flex gap-6">
            <Link href="/login" className="text-sm font-medium text-indigo-600 hover:text-indigo-500 dark:text-indigo-400">
              Iniciar sesión
            </Link>
            <Link href="/register" className="text-sm font-medium text-indigo-600 hover:text-indigo-500 dark:text-indigo-400">
              Registrarse
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
