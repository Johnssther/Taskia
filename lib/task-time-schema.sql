-- Agregar columnas de tiempo a la tabla tasks
-- time_spent: tiempo total trabajado en la tarea (en segundos)
-- estimated_time: tiempo estimado para completar la tarea (en segundos)

ALTER TABLE tasks 
ADD COLUMN IF NOT EXISTS time_spent INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS estimated_time INTEGER DEFAULT NULL;

-- Comentarios de las columnas
COMMENT ON COLUMN tasks.time_spent IS 'Tiempo total trabajado en la tarea en segundos';
COMMENT ON COLUMN tasks.estimated_time IS 'Tiempo estimado para completar la tarea en segundos';
