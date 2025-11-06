-- Create storage bucket for task proofs
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'task-proofs',
  'task-proofs',
  false,
  5242880, -- 5MB limit
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
);

-- Storage policies for task proofs
CREATE POLICY "Promoters can upload their own task proofs"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'task-proofs' 
  AND auth.uid()::text = (storage.foldername(name))[1]
  AND has_role(auth.uid(), 'promoter'::app_role)
);

CREATE POLICY "Promoters can view their own task proofs"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'task-proofs'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Admins can view all task proofs"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'task-proofs'
  AND has_role(auth.uid(), 'admin'::app_role)
);

CREATE POLICY "Advertisers can view task proofs for their campaigns"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'task-proofs'
  AND EXISTS (
    SELECT 1 FROM tasks t
    JOIN campaigns c ON c.id = t.campaign_id
    WHERE t.proof_url LIKE '%' || (storage.foldername(name))[2] || '%'
    AND c.advertiser_id = auth.uid()
  )
);

-- Update tasks RLS policy for reviewing - restrict to admins only
DROP POLICY IF EXISTS "Advertisers can review tasks" ON tasks;

CREATE POLICY "Only admins can review submitted tasks"
ON tasks
FOR UPDATE
TO authenticated
USING (
  status = 'submitted' AND has_role(auth.uid(), 'admin'::app_role)
)
WITH CHECK (
  has_role(auth.uid(), 'admin'::app_role)
);