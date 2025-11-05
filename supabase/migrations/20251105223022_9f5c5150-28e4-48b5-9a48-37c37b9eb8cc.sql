-- Add INSERT policy for transactions table to allow admins and system operations
-- Admins can insert any transaction
CREATE POLICY "Admins can insert transactions"
ON public.transactions
FOR INSERT
TO authenticated
WITH CHECK (
  has_role(auth.uid(), 'admin'::app_role)
);

-- Allow users to insert transactions where they are the sender
CREATE POLICY "Users can insert own transactions"
ON public.transactions
FOR INSERT
TO authenticated
WITH CHECK (
  from_user_id = auth.uid()
);

-- Add UPDATE policy for transaction status updates by admins
CREATE POLICY "Admins can update transactions"
ON public.transactions
FOR UPDATE
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));