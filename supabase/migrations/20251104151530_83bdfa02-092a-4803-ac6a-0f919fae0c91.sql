-- Step 2: Update existing data and schema changes
-- Update all existing 'publisher' roles to 'promoter' in user_roles table
UPDATE user_roles SET role = 'promoter' WHERE role = 'publisher';

-- Update tasks table to rename publisher_id column to promoter_id
ALTER TABLE tasks RENAME COLUMN publisher_id TO promoter_id;

-- Update social_accounts table publisher_id to promoter_id
ALTER TABLE social_accounts RENAME COLUMN publisher_id TO promoter_id;

-- Add currency_type column to wallets for multi-currency support (USD, NGN)
ALTER TABLE wallets ADD COLUMN IF NOT EXISTS currency_type text DEFAULT 'USD';
COMMENT ON COLUMN wallets.currency_type IS 'Currency type: USD or NGN (Naira)';

-- Drop and recreate the RLS policies with updated names for tasks
DROP POLICY IF EXISTS "Publishers can claim tasks" ON tasks;
DROP POLICY IF EXISTS "Promoters can claim tasks" ON tasks;
CREATE POLICY "Promoters can claim tasks"
ON tasks
FOR UPDATE
TO authenticated
USING (
  (status = 'available' AND has_role(auth.uid(), 'promoter'::app_role))
  OR (promoter_id = auth.uid())
);

DROP POLICY IF EXISTS "Publishers can view available tasks" ON tasks;
DROP POLICY IF EXISTS "Promoters can view available tasks" ON tasks;
CREATE POLICY "Promoters can view available tasks"
ON tasks
FOR SELECT
TO authenticated
USING (
  status = 'available'
  OR promoter_id = auth.uid()
  OR has_role(auth.uid(), 'admin'::app_role)
  OR EXISTS (
    SELECT 1 FROM campaigns
    WHERE campaigns.id = tasks.campaign_id
    AND campaigns.advertiser_id = auth.uid()
  )
);

-- Drop and recreate policies for social_accounts
DROP POLICY IF EXISTS "Publishers can manage own accounts" ON social_accounts;
DROP POLICY IF EXISTS "Promoters can manage own accounts" ON social_accounts;
CREATE POLICY "Promoters can manage own accounts"
ON social_accounts
FOR ALL
TO authenticated
USING (promoter_id = auth.uid());