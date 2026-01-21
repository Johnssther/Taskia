// Tipos para la base de datos

export interface User {
  id: number;
  name: string;
  email: string;
  avatar_url?: string;
  created_at: string;
  updated_at: string;
}

export interface Category {
  id: number;
  name: string;
  color: string;
  icon: string;
  user_id: number;
  is_default: boolean;
  created_at: string;
  updated_at: string;
  // Campo adicional para el frontend
  isExpanded?: boolean;
}

export interface Task {
  id: number;
  title: string;
  description: string | null;
  completed: boolean;
  priority: 'low' | 'medium' | 'high';
  due_date: string | null;
  category_id: number | null;
  user_id: number;
  ai_suggestions: string[] | null;
  time_spent: number; // Tiempo trabajado en segundos
  estimated_time: number | null; // Tiempo estimado en segundos
  created_at: string;
  updated_at: string;
  // Relaciones
  subtasks?: Subtask[];
  comments?: Comment[];
  category?: Category;
}

export interface TaskWithDetails extends Task {
  category_name: string | null;
  category_color: string | null;
  category_icon: string | null;
  user_name: string;
  subtask_count: number;
  completed_subtask_count: number;
  comment_count: number;
}

export interface Subtask {
  id: number;
  title: string;
  completed: boolean;
  task_id: number;
  created_at: string;
  updated_at: string;
}

export interface Comment {
  id: number;
  text: string;
  task_id: number;
  user_id: number;
  created_at: string;
  updated_at: string;
  // Relación
  author?: string;
}

// DTOs para crear/actualizar

export interface CreateCategoryDTO {
  name: string;
  color: string;
  icon?: string;
}

export interface UpdateCategoryDTO {
  name?: string;
  color?: string;
  icon?: string;
}

export interface CreateTaskDTO {
  title: string;
  description?: string;
  priority?: 'low' | 'medium' | 'high';
  due_date?: string;
  category_id?: number;
  estimated_time?: number; // Tiempo estimado en segundos
  subtasks?: { title: string }[];
}

export interface UpdateTaskDTO {
  title?: string;
  description?: string;
  completed?: boolean;
  priority?: 'low' | 'medium' | 'high';
  due_date?: string;
  category_id?: number;
  ai_suggestions?: string[];
  time_spent?: number;
  estimated_time?: number | null;
}

export interface CreateSubtaskDTO {
  title: string;
  task_id: number;
}

export interface CreateCommentDTO {
  text: string;
  task_id: number;
}

// Respuesta API
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}
