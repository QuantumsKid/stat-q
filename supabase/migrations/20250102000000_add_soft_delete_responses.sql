-- Add soft delete support for responses
-- This allows responses to be "deleted" without permanently removing them from the database

-- Add deleted_at column to responses table
ALTER TABLE responses
ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ NULL;

-- Add is_flagged column for moderation
ALTER TABLE responses
ADD COLUMN IF NOT EXISTS is_flagged BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS flag_reason TEXT NULL,
ADD COLUMN IF NOT EXISTS flagged_at TIMESTAMPTZ NULL,
ADD COLUMN IF NOT EXISTS flagged_by UUID REFERENCES profiles(id) NULL;

-- Create index for soft-deleted responses
CREATE INDEX IF NOT EXISTS idx_responses_deleted_at ON responses(deleted_at) WHERE deleted_at IS NOT NULL;

-- Create index for flagged responses
CREATE INDEX IF NOT EXISTS idx_responses_flagged ON responses(is_flagged) WHERE is_flagged = TRUE;

-- Create index for active responses (commonly queried)
CREATE INDEX IF NOT EXISTS idx_responses_active ON responses(form_id, deleted_at) WHERE deleted_at IS NULL;

-- Function to soft delete a response
CREATE OR REPLACE FUNCTION soft_delete_response(response_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  UPDATE responses
  SET deleted_at = NOW()
  WHERE id = response_id AND deleted_at IS NULL;

  RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to restore a soft-deleted response
CREATE OR REPLACE FUNCTION restore_response(response_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  UPDATE responses
  SET deleted_at = NULL
  WHERE id = response_id AND deleted_at IS NOT NULL;

  RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to permanently delete soft-deleted responses older than 30 days
CREATE OR REPLACE FUNCTION cleanup_deleted_responses()
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  WITH deleted AS (
    DELETE FROM responses
    WHERE deleted_at IS NOT NULL
      AND deleted_at < NOW() - INTERVAL '30 days'
    RETURNING id
  )
  SELECT COUNT(*) INTO deleted_count FROM deleted;

  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update RLS policies to handle soft-deleted responses
-- Drop existing view policy if it exists
DROP POLICY IF EXISTS "Users can view their form responses" ON responses;

-- Create new policy that excludes soft-deleted responses by default
CREATE POLICY "Users can view their active form responses"
  ON responses
  FOR SELECT
  USING (
    form_id IN (
      SELECT id FROM forms WHERE user_id = auth.uid()
    )
    AND deleted_at IS NULL
  );

-- Policy to allow admins to view all responses including deleted ones
CREATE POLICY "Admins can view all responses including deleted"
  ON responses
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Add helpful comments
COMMENT ON COLUMN responses.deleted_at IS 'Timestamp when response was soft-deleted. NULL means active.';
COMMENT ON COLUMN responses.is_flagged IS 'Whether this response has been flagged for moderation';
COMMENT ON COLUMN responses.flag_reason IS 'Reason why response was flagged';
COMMENT ON FUNCTION soft_delete_response(UUID) IS 'Soft deletes a response by setting deleted_at timestamp';
COMMENT ON FUNCTION restore_response(UUID) IS 'Restores a soft-deleted response by clearing deleted_at';
COMMENT ON FUNCTION cleanup_deleted_responses() IS 'Permanently deletes responses that have been soft-deleted for more than 30 days';
