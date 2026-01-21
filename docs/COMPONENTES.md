# Componentes - TaskIA

## Visión General

TaskIA utiliza componentes React funcionales con hooks y TypeScript. Todos los componentes de página son Client Components (marcados con `'use client'`) ya que requieren interactividad.

---

## Páginas Principales

### 1. Home (`app/page.tsx`)

Página principal con interfaz tipo "swipe" para seleccionar tareas pendientes.

**Características:**
- Vista de tarjeta deslizable (swipe cards)
- Navegación entre tareas pendientes
- Estadísticas rápidas (pendientes, completadas, omitidas)
- Animaciones de transición

**Estado:**
```typescript
const [tasks, setTasks] = useState<Task[]>([]);
const [categories, setCategories] = useState<Category[]>([]);
const [currentIndex, setCurrentIndex] = useState(0);
const [isLoading, setIsLoading] = useState(true);
const [swipeDirection, setSwipeDirection] = useState<'left' | 'right' | null>(null);
const [skippedTasks, setSkippedTasks] = useState<number[]>([]);
```

**Funciones principales:**
- `handleSelectTask(taskId)`: Navega al detalle de la tarea
- `handleSkipTask()`: Omite la tarea actual
- `handlePrevious()` / `handleNext()`: Navega entre tareas
- `resetSkipped()`: Restaura tareas omitidas

---

### 2. Tasks (`app/tasks/page.tsx`)

Lista completa de tareas organizadas por categorías.

**Características:**
- Vista de lista con categorías colapsables
- Creación de tareas manuales
- Generación de tareas con IA
- Modal de detalles de tarea
- Gestión de categorías
- Indicador de uso de tokens de IA

**Estado principal:**
```typescript
const [tasks, setTasks] = useState<Task[]>([]);
const [categories, setCategories] = useState<Category[]>([]);
const [settings, setSettings] = useState<Settings>(defaultSettings);
const [newTaskTitle, setNewTaskTitle] = useState('');
const [selectedCategoryForNewTask, setSelectedCategoryForNewTask] = useState<number | null>(null);
const [newTaskPriority, setNewTaskPriority] = useState<'low' | 'medium' | 'high'>('medium');
const [isGenerating, setIsGenerating] = useState(false);
const [aiPrompt, setAiPrompt] = useState('');
const [showAiPanel, setShowAiPanel] = useState(false);
const [selectedTask, setSelectedTask] = useState<Task | null>(null);
const [tokenUsage, setTokenUsage] = useState<TokenUsage>({...});
```

**Funciones principales:**
- `addCategory()`: Crea nueva categoría
- `deleteCategory(id)`: Elimina categoría
- `addTask()`: Crea tarea manual
- `toggleTask(id)`: Marca tarea como completada
- `deleteTask(id)`: Elimina tarea
- `generateTasksWithAI()`: Genera tareas usando OpenAI
- `getAISuggestions(task)`: Obtiene sugerencias de IA

---

### 3. Task Detail (`app/tasks/[id]/page.tsx`)

Vista detallada de una tarea individual.

**Características:**
- Header con color de categoría
- Cronómetro integrado con modal expandido
- Gestión de subtareas
- Sugerencias de IA
- Chat de IA (TaskAIChat)
- Sistema de comentarios
- Animación de confeti al completar 100%

**Estado:**
```typescript
const [task, setTask] = useState<Task | null>(null);
const [category, setCategory] = useState<Category | null>(null);
const [isTimerRunning, setIsTimerRunning] = useState(false);
const [currentTime, setCurrentTime] = useState(0);
const [showConfetti, setShowConfetti] = useState(false);
const [showTimerModal, setShowTimerModal] = useState(false);
```

**Funciones del cronómetro:**
```typescript
const startTimer = () => setIsTimerRunning(true);
const pauseTimer = async () => {
  setIsTimerRunning(false);
  await saveTimeSpent(currentTime);
  setCurrentTime(0);
};
const stopTimer = async () => {
  setIsTimerRunning(false);
  await saveTimeSpent(currentTime);
  setCurrentTime(0);
};
```

---

### 4. Dashboard (`app/dashboard/page.tsx`)

Panel de estadísticas y visualizaciones.

**Características:**
- Tarjetas de resumen (total, completadas, pendientes, tasa de éxito)
- Gráfico de área: Actividad últimos 7 días
- Gráfico de barras: Tareas por categoría
- Gráficos de pastel: Estado y prioridad
- Resumen de subtareas y comentarios
- Lista de tareas recientes

**Gráficos (Recharts):**
```typescript
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, PieChart, Pie, Cell, AreaChart, Area
} from 'recharts';
```

---

### 5. Settings (`app/settings/page.tsx`)

Configuración de la aplicación.

**Secciones:**
1. **Tareas**: Prioridad por defecto, categoría por defecto, mostrar completadas
2. **Notificaciones**: Email, sonido, resumen diario
3. **IA**: API key de OpenAI, modelo, sugerencias
4. **Categorías**: Máximo, orden, mostrar vacías

**Componente Switch:**
```typescript
const Switch = ({ checked, onChange }: { checked: boolean; onChange: () => void }) => (
  <button
    type="button"
    role="switch"
    aria-checked={checked}
    onClick={onChange}
    className={`relative inline-flex h-7 w-12 ... ${
      checked ? 'bg-indigo-600' : 'bg-gray-300'
    }`}
  >
    <span className={`... ${checked ? 'translate-x-5' : 'translate-x-0'}`} />
  </button>
);
```

---

### 6. Profile (`app/profile/page.tsx`)

Perfil del usuario.

**Características:**
- Avatar con imagen o placeholder
- Badge de Premium
- Información de contacto editable
- Biografía
- Información de la cuenta

---

## Componentes Compartidos

### TaskAIChat (`app/components/TaskAIChat.tsx`)

Chat de IA integrado en el detalle de tarea.

**Props:**
```typescript
interface TaskAIChatProps {
  task: {
    id: number;
    title: string;
    description: string | null;
    priority: string;
    subtasks: { title: string; completed: boolean }[];
    estimated_time: number | null;
    time_spent: number;
  };
  categoryName?: string;
}
```

**Uso:**
```tsx
<TaskAIChat 
  task={{
    id: task.id,
    title: task.title,
    description: task.description,
    priority: task.priority,
    subtasks: task.subtasks,
    estimated_time: task.estimated_time,
    time_spent: task.time_spent,
  }}
  categoryName={category?.name}
/>
```

---

### Confetti (`app/components/Confetti.tsx`)

Animación de confeti para celebraciones.

**Props:**
```typescript
interface ConfettiProps {
  isActive: boolean;
  onComplete?: () => void;
}
```

**Uso:**
```tsx
<Confetti 
  isActive={showConfetti} 
  onComplete={() => setShowConfetti(false)} 
/>
```

**Implementación:**
```typescript
import confetti from 'canvas-confetti';

useEffect(() => {
  if (isActive) {
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 }
    });
    
    setTimeout(() => {
      onComplete?.();
    }, 3000);
  }
}, [isActive, onComplete]);
```

---

## Patrones de Componentes

### 1. Patrón de Carga

```typescript
const [isLoading, setIsLoading] = useState(true);

useEffect(() => {
  const loadData = async () => {
    try {
      const response = await fetch('/api/...');
      // procesar datos
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setIsLoading(false);
    }
  };
  loadData();
}, []);

if (isLoading) {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <ArrowPathIcon className="w-12 h-12 animate-spin text-indigo-600" />
      <p>Cargando...</p>
    </div>
  );
}
```

### 2. Patrón de Modal

```typescript
const [showModal, setShowModal] = useState(false);

// Renderizado
{showModal && (
  <div 
    className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50"
    onClick={() => setShowModal(false)}
  >
    <div 
      className="bg-white rounded-2xl shadow-2xl max-w-lg w-full"
      onClick={(e) => e.stopPropagation()}
    >
      {/* Contenido del modal */}
      <button onClick={() => setShowModal(false)}>Cerrar</button>
    </div>
  </div>
)}
```

### 3. Patrón de Formulario

```typescript
const [formData, setFormData] = useState({ title: '', priority: 'medium' });

const handleSubmit = async () => {
  if (!formData.title.trim()) return;
  
  try {
    const response = await fetch('/api/...', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData),
    });
    
    if (response.ok) {
      const data = await response.json();
      // actualizar estado
      setFormData({ title: '', priority: 'medium' }); // reset
    }
  } catch (error) {
    console.error('Error:', error);
  }
};
```

### 4. Patrón de Lista con CRUD

```typescript
const [items, setItems] = useState<Item[]>([]);

// Crear
const addItem = async (newItem: CreateItemDTO) => {
  const response = await fetch('/api/items', {
    method: 'POST',
    body: JSON.stringify(newItem),
  });
  const { data } = await response.json();
  setItems([data, ...items]);
};

// Actualizar
const updateItem = async (id: number, updates: Partial<Item>) => {
  await fetch(`/api/items/${id}`, {
    method: 'PUT',
    body: JSON.stringify(updates),
  });
  setItems(items.map(item => 
    item.id === id ? { ...item, ...updates } : item
  ));
};

// Eliminar
const deleteItem = async (id: number) => {
  await fetch(`/api/items/${id}`, { method: 'DELETE' });
  setItems(items.filter(item => item.id !== id));
};
```

---

## Iconos (Heroicons)

La aplicación usa Heroicons v2 para todos los iconos:

```typescript
import {
  // Outline (24x24)
  CheckCircleIcon,
  TrashIcon,
  PlusIcon,
  SparklesIcon,
  ArrowLeftIcon,
  ClockIcon,
  FolderIcon,
  // ...
} from '@heroicons/react/24/outline';

import {
  // Solid (24x24)
  CheckCircleIcon as CheckCircleSolidIcon,
  StarIcon,
} from '@heroicons/react/24/solid';
```

**Uso:**
```tsx
<CheckCircleIcon className="w-5 h-5 text-green-500" />
<SparklesIcon className="w-6 h-6 text-purple-500" />
```

---

## Estilos con Tailwind CSS

### Colores de Prioridad

```typescript
const priorityColors = {
  low: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  medium: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
  high: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
};
```

### Colores de Categoría

```typescript
const categoryColors = [
  { name: 'Azul', value: 'bg-blue-500', gradient: 'from-blue-500 to-blue-700' },
  { name: 'Verde', value: 'bg-green-500', gradient: 'from-green-500 to-green-700' },
  { name: 'Morado', value: 'bg-purple-500', gradient: 'from-purple-500 to-purple-700' },
  { name: 'Naranja', value: 'bg-orange-500', gradient: 'from-orange-500 to-orange-700' },
  { name: 'Rosa', value: 'bg-pink-500', gradient: 'from-pink-500 to-pink-700' },
  { name: 'Cyan', value: 'bg-cyan-500', gradient: 'from-cyan-500 to-cyan-700' },
  { name: 'Rojo', value: 'bg-red-500', gradient: 'from-red-500 to-red-700' },
  { name: 'Indigo', value: 'bg-indigo-500', gradient: 'from-indigo-500 to-indigo-700' },
];
```

### Clases Comunes

```css
/* Tarjetas */
.card {
  @apply bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6;
}

/* Botones primarios */
.btn-primary {
  @apply px-4 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 
         text-white rounded-lg hover:from-indigo-700 hover:to-purple-700 
         transition-all shadow-md;
}

/* Inputs */
.input {
  @apply w-full px-4 py-3 border border-gray-300 dark:border-gray-600 
         rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent 
         dark:bg-gray-700 dark:text-white;
}

/* Badges */
.badge {
  @apply inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium;
}
```

---

## Responsive Design

La aplicación es completamente responsive:

```tsx
// Grid responsive
<div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
  <div className="lg:col-span-1">Sidebar</div>
  <div className="lg:col-span-3">Content</div>
</div>

// Ocultar en móvil
<div className="hidden md:block">Solo desktop</div>

// Tamaños de texto responsive
<h1 className="text-2xl md:text-4xl font-bold">Título</h1>

// Padding responsive
<div className="px-4 md:px-8 py-4 md:py-8">Content</div>
```

---

## Dark Mode

Soporte completo para modo oscuro usando clases de Tailwind:

```tsx
<div className="bg-white dark:bg-gray-800">
  <h1 className="text-gray-900 dark:text-white">Título</h1>
  <p className="text-gray-600 dark:text-gray-400">Descripción</p>
</div>
```

El modo oscuro se activa automáticamente según las preferencias del sistema.
