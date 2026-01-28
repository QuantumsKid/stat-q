-- Fix RLS policies to allow anonymous form submissions
-- This addresses the "Failed to submit response" error for public forms

-- Drop the restrictive policy
DROP POLICY IF EXISTS "Users can update their own incomplete responses" ON responses;

-- Create new policy that allows:
-- 1. Authenticated users to update their own responses
-- 2. Anonymous users to update responses where respondent_id is NULL
CREATE POLICY "Anyone can update incomplete responses"
  ON responses FOR UPDATE
  USING (
    (respondent_id IS NULL OR respondent_id = auth.uid())
    AND is_complete = FALSE
  );

-- Drop the restrictive answers update policy
DROP POLICY IF EXISTS "Users can update their own answers" ON answers;

-- Create new policy that allows updating answers for incomplete responses
CREATE POLICY "Anyone can update answers for incomplete responses"
  ON answers FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM responses
      WHERE responses.id = answers.response_id
      AND (responses.respondent_id IS NULL OR responses.respondent_id = auth.uid())
      AND responses.is_complete = FALSE
    )
  );

-- Ensure answers can be inserted for anonymous responses
DROP POLICY IF EXISTS "Users can create answers" ON answers;

CREATE POLICY "Anyone can create answers for incomplete responses"
  ON answers FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM responses
      WHERE responses.id = answers.response_id
      AND responses.is_complete = FALSE
    )
  );

-- Add comment for documentation
COMMENT ON POLICY "Anyone can update incomplete responses" ON responses IS
  'Allows both authenticated and anonymous users to update their incomplete responses';

COMMENT ON POLICY "Anyone can update answers for incomplete responses" ON answers IS
  'Allows updating answers for incomplete responses, supporting anonymous form submissions';

COMMENT ON POLICY "Anyone can create answers for incomplete responses" ON answers IS
  'Allows creating answers for any incomplete response, enabling anonymous form submissions';
