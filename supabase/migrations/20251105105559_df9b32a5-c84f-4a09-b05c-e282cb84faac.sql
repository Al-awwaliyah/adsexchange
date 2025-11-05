-- Add approved field to campaigns for admin approval workflow
ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS approved BOOLEAN DEFAULT false NOT NULL;

-- Drop existing "Anyone can view active campaigns" policy
DROP POLICY IF EXISTS "Anyone can view active campaigns" ON campaigns;

-- Create new policy: Promoters can only see approved AND active campaigns
CREATE POLICY "Promoters can view approved active campaigns" 
ON campaigns 
FOR SELECT 
USING (
  (status = 'active'::text AND approved = true) 
  OR (advertiser_id = auth.uid())
  OR has_role(auth.uid(), 'admin'::app_role)
);

-- Update tasks policy to only show tasks from approved campaigns
DROP POLICY IF EXISTS "Promoters can view available tasks" ON tasks;

CREATE POLICY "Promoters can view available tasks" 
ON tasks 
FOR SELECT 
USING (
  (
    status = 'available'::text 
    AND EXISTS (
      SELECT 1 FROM campaigns 
      WHERE campaigns.id = tasks.campaign_id 
      AND campaigns.approved = true 
      AND campaigns.status = 'active'::text
    )
  )
  OR (promoter_id = auth.uid())
  OR has_role(auth.uid(), 'admin'::app_role)
  OR (EXISTS (
    SELECT 1 FROM campaigns 
    WHERE campaigns.id = tasks.campaign_id 
    AND campaigns.advertiser_id = auth.uid()
  ))
);