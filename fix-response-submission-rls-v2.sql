-- Fix RLS policies for form submissions - VERSION 2
-- Adds WITH CHECK clause to allow updates

-- Drop existing policies first
DROP POLICY IF EXISTS "Anyone can update incomplete responses" ON responses;
DROP POLICY IF EXISTS "Anyone can update answers for incomplete responses" ON answers;
DROP POLICY IF EXISTS "Anyone can create answers for incomplete responses" ON answers;

-- ============================================================================
-- RESPONSES TABLE POLICIES
-- ============================================================================

-- Allow updating responses (needs both USING and WITH CHECK)
CREATE POLICY "Allow updating incomplete responses"
  ON responses FOR UPDATE
  USING (
    (respondent_id IS NULL OR respondent_id = auth.uid())
    AND is_complete = FALSE
  )
  WITH CHECK (
    (respondent_id IS NULL OR respondent_id = auth.uid())
    -- Allow marking as complete (is_complete can be TRUE in the new row)
  );

-- ============================================================================
-- ANSWERS TABLE POLICIES
-- ============================================================================

-- Allow inserting answers for incomplete responses
CREATE POLICY "Allow creating answers for incomplete responses"
  ON answers FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM responses
      WHERE responses.id = answers.response_id
      AND responses.is_complete = FALSE
    )
  );

-- Allow updating answers for incomplete responses
CREATE POLICY "Allow updating answers for incomplete responses"
  ON answers FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM responses
      WHERE responses.id = answers.response_id
      AND (responses.respondent_id IS NULL OR responses.respondent_id = auth.uid())
      AND responses.is_complete = FALSE
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM responses
      WHERE responses.id = answers.response_id
      AND (responses.respondent_id IS NULL OR responses.respondent_id = auth.uid())
      AND responses.is_complete = FALSE
    )
  );

-- Add documentation
COMMENT ON POLICY "Allow updating incomplete responses" ON responses IS
  'Allows both authenticated and anonymous users to update and submit their incomplete responses. WITH CHECK clause permits marking responses as complete.';

COMMENT ON POLICY "Allow creating answers for incomplete responses" ON answers IS
  'Allows creating answers for any incomplete response, enabling anonymous form submissions';

COMMENT ON POLICY "Allow updating answers for incomplete responses" ON answers IS
  'Allows updating answers for incomplete responses, supporting both authenticated and anonymous users';
