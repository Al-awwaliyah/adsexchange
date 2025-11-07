-- Add foreign key constraint for tasks.promoter_id -> profiles.id
ALTER TABLE tasks
ADD CONSTRAINT fk_tasks_promoter 
FOREIGN KEY (promoter_id) 
REFERENCES profiles(id) 
ON DELETE SET NULL;

-- Add rejection_reason column to store why tasks were rejected
ALTER TABLE tasks
ADD COLUMN rejection_reason text;

COMMENT ON COLUMN tasks.rejection_reason IS 'Reason provided by admin/advertiser when rejecting a task';