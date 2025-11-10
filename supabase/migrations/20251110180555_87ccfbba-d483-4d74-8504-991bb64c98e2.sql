-- Make task-proofs bucket public so proof images can be accessed
UPDATE storage.buckets 
SET public = true 
WHERE id = 'task-proofs';