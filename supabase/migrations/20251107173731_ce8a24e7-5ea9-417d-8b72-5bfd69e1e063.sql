-- Add campaign statistics columns for tracking completed tasks and spending
ALTER TABLE campaigns 
ADD COLUMN IF NOT EXISTS completed_tasks integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS spent numeric DEFAULT 0;

-- Add index for better query performance
CREATE INDEX IF NOT EXISTS idx_campaigns_stats ON campaigns(completed_tasks, spent);

COMMENT ON COLUMN campaigns.completed_tasks IS 'Total number of approved/completed tasks for this campaign';
COMMENT ON COLUMN campaigns.spent IS 'Total amount spent on approved tasks for this campaign';