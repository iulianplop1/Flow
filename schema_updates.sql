-- Add planned_time column to tasks table for hour/minute scheduling
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS planned_time TIME;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS sort_order INTEGER DEFAULT 0;

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_tasks_planned_time ON tasks(planned_time);
CREATE INDEX IF NOT EXISTS idx_tasks_sort_order ON tasks(sort_order);

