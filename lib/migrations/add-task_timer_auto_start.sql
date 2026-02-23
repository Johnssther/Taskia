-- Añadir opción "Tiempo de tarea automático" a settings
-- Ejecutar: psql -U postgres -d db_taskia -f lib/migrations/add-task_timer_auto_start.sql

ALTER TABLE settings
ADD COLUMN IF NOT EXISTS task_timer_auto_start BOOLEAN DEFAULT FALSE;

COMMENT ON COLUMN settings.task_timer_auto_start IS 'Si está activo, el cronómetro de la tarea se inicia al entrar y se guarda al salir o cada minuto';
