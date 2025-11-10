-- Add storage policies for task-proofs bucket to allow users to upload their own files

-- Allow users to upload their own files (for NIN selfies and task proofs)
CREATE POLICY "Users can upload own files to task-proofs"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'task-proofs' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Allow users to update their own files
CREATE POLICY "Users can update own files in task-proofs"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'task-proofs' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Allow users to delete their own files
CREATE POLICY "Users can delete own files in task-proofs"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'task-proofs' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);