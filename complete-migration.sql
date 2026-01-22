-- ============================================================================
-- StatForm AI - Complete Database Migration
-- ============================================================================
-- This migration consolidates all database changes and updates.
-- Run this in your Supabase SQL Editor to apply all changes.
--
-- IMPORTANT: This is an INCREMENTAL migration for existing databases.
-- For a fresh install, use database.sql instead.
-- ============================================================================

-- Phase 1: Add missing columns to existing tables
-- ----------------------------------------------------------------------------

-- Add display_mode to forms table (if not exists)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'forms' AND column_name = 'display_mode'
  ) THEN
    ALTER TABLE forms ADD COLUMN display_mode TEXT DEFAULT 'scroll'
      CHECK (display_mode IN ('single', 'scroll'));
    COMMENT ON COLUMN forms.display_mode IS 'Display mode for respondents: single (Typeform style) or scroll (Google Forms style)';
  END IF;
END $$;

-- Add started_at to responses table (if not exists)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'responses' AND column_name = 'started_at'
  ) THEN
    ALTER TABLE responses ADD COLUMN started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
    COMMENT ON COLUMN responses.started_at IS 'When the respondent started filling out the form';
  END IF;
END $$;

-- Make submitted_at nullable (it should be NULL until form is submitted)
DO $$
BEGIN
  ALTER TABLE responses ALTER COLUMN submitted_at DROP DEFAULT;
  ALTER TABLE responses ALTER COLUMN submitted_at DROP NOT NULL;
  COMMENT ON COLUMN responses.submitted_at IS 'When the form was submitted (NULL if incomplete)';
EXCEPTION
  WHEN OTHERS THEN
    -- Column might already be nullable
    NULL;
END $$;

-- Phase 2: Update question_type enum to include new question types
-- ----------------------------------------------------------------------------

-- Add new question types to enum (if not exists)
DO $$
BEGIN
  -- Add slider type
  IF NOT EXISTS (
    SELECT 1 FROM pg_enum WHERE enumlabel = 'slider'
    AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'question_type')
  ) THEN
    ALTER TYPE question_type ADD VALUE 'slider';
  END IF;

  -- Add ranking type
  IF NOT EXISTS (
    SELECT 1 FROM pg_enum WHERE enumlabel = 'ranking'
    AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'question_type')
  ) THEN
    ALTER TYPE question_type ADD VALUE 'ranking';
  END IF;

  -- Add file_upload type
  IF NOT EXISTS (
    SELECT 1 FROM pg_enum WHERE enumlabel = 'file_upload'
    AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'question_type')
  ) THEN
    ALTER TYPE question_type ADD VALUE 'file_upload';
  END IF;
END $$;

-- Phase 3: Create performance indexes
-- ----------------------------------------------------------------------------

-- GIN index on logic_rules for advanced conditional logic queries
CREATE INDEX IF NOT EXISTS idx_questions_logic_rules
  ON questions USING GIN (logic_rules);
COMMENT ON INDEX idx_questions_logic_rules IS 'Improves performance when querying questions by their conditional logic rules';

-- Index on forms.is_published for public form queries (partial index)
CREATE INDEX IF NOT EXISTS idx_forms_published
  ON forms(is_published) WHERE is_published = true;
COMMENT ON INDEX idx_forms_published IS 'Optimize public form queries';

-- Composite index on questions for efficient ordering
CREATE INDEX IF NOT EXISTS idx_questions_form_order
  ON questions(form_id, order_index);
COMMENT ON INDEX idx_questions_form_order IS 'Optimize question ordering within forms';

-- Composite index for user's forms queries (most recent first)
CREATE INDEX IF NOT EXISTS idx_forms_user_updated
  ON forms(user_id, updated_at DESC);
COMMENT ON INDEX idx_forms_user_updated IS 'Optimize user dashboard form listing';

-- Index for finding questions by type (useful for analytics)
CREATE INDEX IF NOT EXISTS idx_questions_type
  ON questions(type);
COMMENT ON INDEX idx_questions_type IS 'Optimize analytics by question type';

-- Index on responses for completion tracking
CREATE INDEX IF NOT EXISTS idx_responses_complete
  ON responses(form_id, is_complete);
COMMENT ON INDEX idx_responses_complete IS 'Optimize tracking of completed vs incomplete responses';

-- Index on answers for value queries (JSONB)
CREATE INDEX IF NOT EXISTS idx_answers_value
  ON answers USING GIN (value_json);
COMMENT ON INDEX idx_answers_value IS 'Optimize searches within answer values';

-- Phase 4: Add constraints for data quality
-- ----------------------------------------------------------------------------

-- Ensure forms have valid titles
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'forms_title_not_empty'
  ) THEN
    ALTER TABLE forms ADD CONSTRAINT forms_title_not_empty
      CHECK (length(trim(title)) > 0);
  END IF;
END $$;

-- Ensure questions have valid titles
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'questions_title_not_empty'
  ) THEN
    ALTER TABLE questions ADD CONSTRAINT questions_title_not_empty
      CHECK (length(trim(title)) > 0);
  END IF;
END $$;

-- Ensure valid order_index (non-negative)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'questions_order_index_valid'
  ) THEN
    ALTER TABLE questions ADD CONSTRAINT questions_order_index_valid
      CHECK (order_index >= 0);
  END IF;
END $$;

-- Phase 5: Update RLS policies for better security
-- ----------------------------------------------------------------------------

-- Drop old duplicate policy if exists
DROP POLICY IF EXISTS "Anyone can view published forms" ON forms;

-- Recreate with better naming
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'forms' AND policyname = 'Public can view published forms'
  ) THEN
    CREATE POLICY "Public can view published forms"
      ON forms FOR SELECT
      USING (is_published = TRUE);
  END IF;
END $$;

-- Add policy for form owners to view responses
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'responses' AND policyname = 'Form owners can view all responses'
  ) THEN
    CREATE POLICY "Form owners can view all responses"
      ON responses FOR SELECT
      USING (
        EXISTS (
          SELECT 1 FROM forms
          WHERE forms.id = responses.form_id
          AND forms.user_id = auth.uid()
        )
      );
  END IF;
END $$;

-- Phase 6: Create helpful database views
-- ----------------------------------------------------------------------------

-- View for form statistics (makes analytics queries easier)
CREATE OR REPLACE VIEW form_statistics AS
SELECT
  f.id AS form_id,
  f.title,
  f.user_id,
  f.is_published,
  f.created_at,
  COUNT(DISTINCT q.id) AS question_count,
  COUNT(DISTINCT r.id) AS response_count,
  COUNT(DISTINCT CASE WHEN r.is_complete = true THEN r.id END) AS completed_response_count,
  MAX(r.submitted_at) AS last_response_at
FROM forms f
LEFT JOIN questions q ON q.form_id = f.id
LEFT JOIN responses r ON r.form_id = f.id
GROUP BY f.id, f.title, f.user_id, f.is_published, f.created_at;

COMMENT ON VIEW form_statistics IS 'Aggregated statistics for each form';

-- View for question analytics (aggregates answer data)
CREATE OR REPLACE VIEW question_analytics AS
SELECT
  q.id AS question_id,
  q.form_id,
  q.type AS question_type,
  q.title,
  q.required,
  COUNT(DISTINCT a.response_id) AS answer_count,
  COUNT(DISTINCT CASE
    WHEN r.is_complete = true THEN a.response_id
  END) AS completed_answer_count
FROM questions q
LEFT JOIN answers a ON a.question_id = q.id
LEFT JOIN responses r ON r.id = a.response_id
GROUP BY q.id, q.form_id, q.type, q.title, q.required;

COMMENT ON VIEW question_analytics IS 'Analytics for each question including response counts';

-- Phase 7: Create utility functions
-- ----------------------------------------------------------------------------

-- Function to calculate form completion rate
CREATE OR REPLACE FUNCTION get_form_completion_rate(form_uuid UUID)
RETURNS DECIMAL AS $$
DECLARE
  total_responses INTEGER;
  completed_responses INTEGER;
BEGIN
  SELECT
    COUNT(*),
    COUNT(*) FILTER (WHERE is_complete = true)
  INTO total_responses, completed_responses
  FROM responses
  WHERE form_id = form_uuid;

  IF total_responses = 0 THEN
    RETURN 0;
  END IF;

  RETURN ROUND((completed_responses::DECIMAL / total_responses::DECIMAL) * 100, 2);
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION get_form_completion_rate IS 'Calculate completion rate percentage for a form';

-- Function to get average response time
CREATE OR REPLACE FUNCTION get_avg_response_time(form_uuid UUID)
RETURNS INTERVAL AS $$
BEGIN
  RETURN (
    SELECT AVG(submitted_at - started_at)
    FROM responses
    WHERE form_id = form_uuid
    AND is_complete = true
    AND started_at IS NOT NULL
    AND submitted_at IS NOT NULL
  );
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION get_avg_response_time IS 'Calculate average time to complete a form';

-- Phase 8: Verify migration
-- ----------------------------------------------------------------------------

-- Display migration results
DO $$
DECLARE
  form_count INTEGER;
  question_count INTEGER;
  response_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO form_count FROM forms;
  SELECT COUNT(*) INTO question_count FROM questions;
  SELECT COUNT(*) INTO response_count FROM responses;

  RAISE NOTICE '=================================================';
  RAISE NOTICE 'Migration completed successfully!';
  RAISE NOTICE '=================================================';
  RAISE NOTICE 'Current database statistics:';
  RAISE NOTICE '  - Forms: %', form_count;
  RAISE NOTICE '  - Questions: %', question_count;
  RAISE NOTICE '  - Responses: %', response_count;
  RAISE NOTICE '=================================================';
  RAISE NOTICE 'New features enabled:';
  RAISE NOTICE '  ✓ Display mode support (single/scroll)';
  RAISE NOTICE '  ✓ New question types (slider, ranking, file_upload)';
  RAISE NOTICE '  ✓ Performance indexes (logic_rules, published forms)';
  RAISE NOTICE '  ✓ Response tracking (started_at timestamp)';
  RAISE NOTICE '  ✓ Form statistics views';
  RAISE NOTICE '  ✓ Utility functions (completion rate, avg time)';
  RAISE NOTICE '=================================================';
END $$;
