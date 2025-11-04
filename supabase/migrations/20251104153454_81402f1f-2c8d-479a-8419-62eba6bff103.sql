-- Add verification field to profiles
ALTER TABLE public.profiles 
ADD COLUMN verified BOOLEAN DEFAULT false;

-- Update campaigns RLS policies to require verification for advertisers
DROP POLICY IF EXISTS "Advertisers can create campaigns" ON public.campaigns;
CREATE POLICY "Advertisers can create campaigns" 
ON public.campaigns 
FOR INSERT 
TO authenticated
WITH CHECK (
  has_role(auth.uid(), 'advertiser'::app_role) 
  AND advertiser_id = auth.uid()
  AND EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND verified = true
  )
);

-- Update tasks RLS policies to require verification for promoters
DROP POLICY IF EXISTS "Promoters can claim tasks" ON public.tasks;
CREATE POLICY "Promoters can claim tasks" 
ON public.tasks 
FOR UPDATE 
TO authenticated
USING (
  (
    status = 'available' 
    AND has_role(auth.uid(), 'promoter'::app_role)
    AND EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND verified = true
    )
  ) 
  OR promoter_id = auth.uid()
);

-- Allow admins to update profiles (including verification)
CREATE POLICY "Admins can update all profiles" 
ON public.profiles 
FOR UPDATE 
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));