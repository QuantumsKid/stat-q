-- Add archival support to forms table
-- This allows forms to be soft-deleted (archived) instead of permanently removed

DO $$
BEGIN
  -- Add is_archived column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'forms' AND column_name = 'is_archived'
  ) THEN
    ALTER TABLE forms ADD COLUMN is_archived BOOLEAN DEFAULT FALSE NOT NULL;
    COMMENT ON COLUMN forms.is_archived IS 'Whether the form is archived (soft deleted)';

    -- Add index for efficient querying
    CREATE INDEX IF NOT EXISTS idx_forms_archived ON forms(is_archived) WHERE is_archived = FALSE;

    -- Add archived_at timestamp
    ALTER TABLE forms ADD COLUMN archived_at TIMESTAMP WITH TIME ZONE;
    COMMENT ON COLUMN forms.archived_at IS 'When the form was archived (NULL if not archived)';
  END IF;
END $$;
