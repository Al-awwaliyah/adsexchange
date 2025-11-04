-- Step 1: Add 'promoter' to the enum (keeping publisher for backward compatibility)
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type t JOIN pg_enum e ON t.oid = e.enumtypid WHERE t.typname = 'app_role' AND e.enumlabel = 'promoter') THEN
    ALTER TYPE app_role ADD VALUE 'promoter';
  END IF;
END $$;