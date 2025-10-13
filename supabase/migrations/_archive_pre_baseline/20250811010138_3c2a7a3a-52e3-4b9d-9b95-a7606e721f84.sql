-- Add new status for drafts if not exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_type t
    JOIN pg_enum e ON t.oid = e.enumtypid
    WHERE t.typname = 'submission_status' AND e.enumlabel = 'draft'
  ) THEN
    ALTER TYPE submission_status ADD VALUE 'draft';
  END IF;
END $$;