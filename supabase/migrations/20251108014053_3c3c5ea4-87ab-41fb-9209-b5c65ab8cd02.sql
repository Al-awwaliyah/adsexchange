-- Create RLS policies for NIN selfie uploads in task-proofs bucket
CREATE POLICY "Users can upload their own NIN selfies"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'task-proofs' AND
  (storage.foldername(name))[1] = 'nin-selfies' AND
  auth.uid()::text = (storage.foldername(name))[2]
);

CREATE POLICY "Users can view their own NIN selfies"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'task-proofs' AND
  (storage.foldername(name))[1] = 'nin-selfies' AND
  auth.uid()::text = (storage.foldername(name))[2]
);

CREATE POLICY "Admins can view all NIN selfies"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'task-proofs' AND
  (storage.foldername(name))[1] = 'nin-selfies' AND
  has_role(auth.uid(), 'admin'::app_role)
);