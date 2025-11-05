-- Allow admins to create tasks when approving campaigns
CREATE POLICY "Admins can create tasks"
ON public.tasks
FOR INSERT
TO authenticated
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));