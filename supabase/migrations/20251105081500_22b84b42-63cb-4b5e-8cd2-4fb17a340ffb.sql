-- Add RLS policy to allow users to update their own wallet currency
CREATE POLICY "Users can update own wallet currency"
ON public.wallets
FOR UPDATE
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());