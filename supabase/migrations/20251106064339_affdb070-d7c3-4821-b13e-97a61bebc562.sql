-- Add check constraint for valid task status values
ALTER TABLE public.tasks 
DROP CONSTRAINT IF EXISTS tasks_status_check;

ALTER TABLE public.tasks
ADD CONSTRAINT tasks_status_check 
CHECK (status IN ('available', 'claimed', 'submitted', 'completed', 'rejected'));