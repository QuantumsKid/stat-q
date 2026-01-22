-- ============================================================================
-- StatForm AI - FINAL COMPLETE DATABASE MIGRATION
-- ============================================================================
-- This migration consolidates ALL database changes including new features.
-- Run this in your Supabase SQL Editor to apply all changes.
--
-- IMPORTANT: This is an INCREMENTAL migration for existing databases.
-- For a fresh install, use database.sql instead.
--
-- Version: 2.0
-- Date: 2025-12-13
-- ============================================================================

-- ============================================================================
-- PART 1: Add Missing Columns & Update Existing Tables
-- ============================================================================

-- Add display_mode to forms table
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

-- Add form archival columns (is_archived, archived_at)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'forms' AND column_name = 'is_archived'
  ) THEN
    ALTER TABLE forms ADD COLUMN is_archived BOOLEAN DEFAULT FALSE;
    COMMENT ON COLUMN forms.is_archived IS 'Whether the form is soft-deleted/archived';
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'forms' AND column_name = 'archived_at'
  ) THEN
    ALTER TABLE forms ADD COLUMN archived_at TIMESTAMP WITH TIME ZONE;
    COMMENT ON COLUMN forms.archived_at IS 'Timestamp when the form was archived';
  END IF;
END $$;


-- Add form scheduling columns
ALTER TABLE forms ADD COLUMN IF NOT EXISTS schedule_start TIMESTAMP WITH TIME ZONE;
ALTER TABLE forms ADD COLUMN IF NOT EXISTS schedule_end TIMESTAMP WITH TIME ZONE;
ALTER TABLE forms ADD COLUMN IF NOT EXISTS max_responses INTEGER;
ALTER TABLE forms ADD COLUMN IF NOT EXISTS password_hash TEXT;
ALTER TABLE forms ADD COLUMN IF NOT EXISTS require_login BOOLEAN DEFAULT FALSE;

COMMENT ON COLUMN forms.schedule_start IS 'When the form becomes available (NULL = no start restriction)';
COMMENT ON COLUMN forms.schedule_end IS 'When the form closes (NULL = no end restriction)';
COMMENT ON COLUMN forms.max_responses IS 'Maximum number of responses allowed (NULL = unlimited)';
COMMENT ON COLUMN forms.password_hash IS 'Bcrypt hash of form password (NULL = no password required)';
COMMENT ON COLUMN forms.require_login IS 'Whether respondents must be logged in to submit';

-- Add started_at to responses table
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

-- Make submitted_at nullable (should be NULL until form is submitted)
DO $$
BEGIN
  ALTER TABLE responses ALTER COLUMN submitted_at DROP DEFAULT;
  ALTER TABLE responses ALTER COLUMN submitted_at DROP NOT NULL;
  COMMENT ON COLUMN responses.submitted_at IS 'When the form was submitted (NULL if incomplete)';
EXCEPTION
  WHEN OTHERS THEN NULL;
END $$;

-- ============================================================================
-- PART 2: Update question_type Enum with New Types
-- ============================================================================

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

-- ============================================================================
-- PART 3: Create Performance Indexes
-- ============================================================================

-- GIN index on logic_rules for advanced conditional logic queries
CREATE INDEX IF NOT EXISTS idx_questions_logic_rules
  ON questions USING GIN (logic_rules);
COMMENT ON INDEX idx_questions_logic_rules IS 'Improves performance when querying questions by their conditional logic rules';

-- Partial index on published forms
CREATE INDEX IF NOT EXISTS idx_forms_published
  ON forms(is_published) WHERE is_published = true;
COMMENT ON INDEX idx_forms_published IS 'Optimize public form queries';

-- Composite index for question ordering
CREATE INDEX IF NOT EXISTS idx_questions_form_order
  ON questions(form_id, order_index);
COMMENT ON INDEX idx_questions_form_order IS 'Optimize question ordering within forms';

-- Composite index for user's forms (ordered by last updated)
CREATE INDEX IF NOT EXISTS idx_forms_user_updated
  ON forms(user_id, updated_at DESC);
COMMENT ON INDEX idx_forms_user_updated IS 'Optimize user dashboard form listing';

-- Index for question type analytics
CREATE INDEX IF NOT EXISTS idx_questions_type
  ON questions(type);
COMMENT ON INDEX idx_questions_type IS 'Optimize analytics by question type';

-- Index for response completion tracking
CREATE INDEX IF NOT EXISTS idx_responses_complete
  ON responses(form_id, is_complete);
COMMENT ON INDEX idx_responses_complete IS 'Optimize tracking of completed vs incomplete responses';

-- GIN index for answer value searches
CREATE INDEX IF NOT EXISTS idx_answers_value
  ON answers USING GIN (value_json);
COMMENT ON INDEX idx_answers_value IS 'Optimize searches within answer values';

-- ============================================================================
-- PART 4: Add Data Quality Constraints
-- ============================================================================

-- Ensure forms have valid titles
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'forms_title_not_empty') THEN
    ALTER TABLE forms ADD CONSTRAINT forms_title_not_empty
      CHECK (length(trim(title)) > 0);
  END IF;
END $$;

-- Ensure questions have valid titles
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'questions_title_not_empty') THEN
    ALTER TABLE questions ADD CONSTRAINT questions_title_not_empty
      CHECK (length(trim(title)) > 0);
  END IF;
END $$;

-- Ensure valid order_index
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'questions_order_index_valid') THEN
    ALTER TABLE questions ADD CONSTRAINT questions_order_index_valid
      CHECK (order_index >= 0);
  END IF;
END $$;

-- Validate scheduling dates
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'forms_schedule_valid') THEN
    ALTER TABLE forms ADD CONSTRAINT forms_schedule_valid
      CHECK (schedule_end IS NULL OR schedule_start IS NULL OR schedule_end > schedule_start);
  END IF;
END $$;

-- Validate max_responses
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'forms_max_responses_valid') THEN
    ALTER TABLE forms ADD CONSTRAINT forms_max_responses_valid
      CHECK (max_responses IS NULL OR max_responses > 0);
  END IF;
END $$;

-- ============================================================================
-- PART 5: Create Audit Logging System
-- ============================================================================

-- Create audit_logs table
CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  user_email TEXT,
  action TEXT NOT NULL,
  resource_type TEXT NOT NULL,
  resource_id UUID,
  details JSONB,
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

COMMENT ON TABLE audit_logs IS 'Audit trail of all important actions in the system';

-- Indexes for audit logs
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_resource ON audit_logs(resource_type, resource_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_details ON audit_logs USING GIN (details);

-- Enable RLS on audit_logs
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Audit log policies
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'audit_logs' AND policyname = 'Users can view their own audit logs') THEN
    CREATE POLICY "Users can view their own audit logs"
      ON audit_logs FOR SELECT
      USING (user_id = auth.uid());
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'audit_logs' AND policyname = 'Admins can view all audit logs') THEN
    CREATE POLICY "Admins can view all audit logs"
      ON audit_logs FOR SELECT
      USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'audit_logs' AND policyname = 'System can insert audit logs') THEN
    CREATE POLICY "System can insert audit logs"
      ON audit_logs FOR INSERT
      WITH CHECK (TRUE);
  END IF;
END $$;

-- ============================================================================
-- PART 6: Create Utility Functions
-- ============================================================================

-- Function to log audit events
CREATE OR REPLACE FUNCTION log_audit_event(
  p_user_id UUID,
  p_user_email TEXT,
  p_action TEXT,
  p_resource_type TEXT,
  p_resource_id UUID,
  p_details JSONB DEFAULT NULL,
  p_ip_address TEXT DEFAULT NULL,
  p_user_agent TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  audit_id UUID;
BEGIN
  INSERT INTO audit_logs (user_id, user_email, action, resource_type, resource_id, details, ip_address, user_agent)
  VALUES (p_user_id, p_user_email, p_action, p_resource_type, p_resource_id, p_details, p_ip_address, p_user_agent)
  RETURNING id INTO audit_id;
  RETURN audit_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if form is accepting responses
CREATE OR REPLACE FUNCTION is_form_accepting_responses(form_uuid UUID)
RETURNS BOOLEAN AS $$
DECLARE
  form_record RECORD;
  current_responses INTEGER;
BEGIN
  SELECT is_published, schedule_start, schedule_end, max_responses
  INTO form_record FROM forms WHERE id = form_uuid;

  IF NOT form_record.is_published THEN RETURN FALSE; END IF;
  IF form_record.schedule_start IS NOT NULL AND NOW() < form_record.schedule_start THEN RETURN FALSE; END IF;
  IF form_record.schedule_end IS NOT NULL AND NOW() > form_record.schedule_end THEN RETURN FALSE; END IF;

  IF form_record.max_responses IS NOT NULL THEN
    SELECT COUNT(*) INTO current_responses FROM responses WHERE form_id = form_uuid AND is_complete = TRUE;
    IF current_responses >= form_record.max_responses THEN RETURN FALSE; END IF;
  END IF;

  RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- Function to get form status
CREATE OR REPLACE FUNCTION get_form_status(form_uuid UUID)
RETURNS TEXT AS $$
DECLARE
  form_record RECORD;
  current_responses INTEGER;
BEGIN
  SELECT is_published, schedule_start, schedule_end, max_responses
  INTO form_record FROM forms WHERE id = form_uuid;

  IF NOT form_record.is_published THEN RETURN 'draft'; END IF;
  IF form_record.schedule_start IS NOT NULL AND NOW() < form_record.schedule_start THEN RETURN 'scheduled'; END IF;
  IF form_record.schedule_end IS NOT NULL AND NOW() > form_record.schedule_end THEN RETURN 'closed'; END IF;

  IF form_record.max_responses IS NOT NULL THEN
    SELECT COUNT(*) INTO current_responses FROM responses WHERE form_id = form_uuid AND is_complete = TRUE;
    IF current_responses >= form_record.max_responses THEN RETURN 'full'; END IF;
  END IF;

  RETURN 'active';
END;
$$ LANGUAGE plpgsql;

-- Function to calculate form completion rate
CREATE OR REPLACE FUNCTION get_form_completion_rate(form_uuid UUID)
RETURNS DECIMAL AS $$
DECLARE
  total_responses INTEGER;
  completed_responses INTEGER;
BEGIN
  SELECT COUNT(*), COUNT(*) FILTER (WHERE is_complete = true)
  INTO total_responses, completed_responses FROM responses WHERE form_id = form_uuid;

  IF total_responses = 0 THEN RETURN 0; END IF;
  RETURN ROUND((completed_responses::DECIMAL / total_responses::DECIMAL) * 100, 2);
END;
$$ LANGUAGE plpgsql;

-- Function to get average response time
CREATE OR REPLACE FUNCTION get_avg_response_time(form_uuid UUID)
RETURNS INTERVAL AS $$
BEGIN
  RETURN (
    SELECT AVG(submitted_at - started_at) FROM responses
    WHERE form_id = form_uuid AND is_complete = true
    AND started_at IS NOT NULL AND submitted_at IS NOT NULL
  );
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- PART 7: Create Triggers for Audit Logging
-- ============================================================================

-- Audit form changes
CREATE OR REPLACE FUNCTION audit_form_changes()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    PERFORM log_audit_event(NEW.user_id, (SELECT email FROM profiles WHERE id = NEW.user_id), 'form.created', 'form', NEW.id, jsonb_build_object('title', NEW.title));
  ELSIF TG_OP = 'UPDATE' THEN
    IF OLD.is_published <> NEW.is_published THEN
      PERFORM log_audit_event(NEW.user_id, (SELECT email FROM profiles WHERE id = NEW.user_id),
        CASE WHEN NEW.is_published THEN 'form.published' ELSE 'form.unpublished' END,
        'form', NEW.id, jsonb_build_object('title', NEW.title));
    END IF;
  ELSIF TG_OP = 'DELETE' THEN
    PERFORM log_audit_event(OLD.user_id, (SELECT email FROM profiles WHERE id = OLD.user_id), 'form.deleted', 'form', OLD.id, jsonb_build_object('title', OLD.title));
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Audit response changes
CREATE OR REPLACE FUNCTION audit_response_changes()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    PERFORM log_audit_event(NEW.respondent_id, NEW.respondent_email, 'response.started', 'response', NEW.id, jsonb_build_object('form_id', NEW.form_id));
  ELSIF TG_OP = 'UPDATE' AND OLD.is_complete = FALSE AND NEW.is_complete = TRUE THEN
    PERFORM log_audit_event(NEW.respondent_id, NEW.respondent_email, 'response.submitted', 'response', NEW.id, jsonb_build_object('form_id', NEW.form_id, 'submitted_at', NEW.submitted_at));
  ELSIF TG_OP = 'DELETE' THEN
    PERFORM log_audit_event(auth.uid(), (SELECT email FROM profiles WHERE id = auth.uid()), 'response.deleted', 'response', OLD.id, jsonb_build_object('form_id', OLD.form_id));
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create triggers
DROP TRIGGER IF EXISTS audit_form_changes_trigger ON forms;
CREATE TRIGGER audit_form_changes_trigger AFTER INSERT OR UPDATE OR DELETE ON forms FOR EACH ROW EXECUTE FUNCTION audit_form_changes();

DROP TRIGGER IF EXISTS audit_response_changes_trigger ON responses;
CREATE TRIGGER audit_response_changes_trigger AFTER INSERT OR UPDATE OR DELETE ON responses FOR EACH ROW EXECUTE FUNCTION audit_response_changes();

-- ============================================================================
-- PART 8: Create Views
-- ============================================================================

-- Form statistics view
CREATE OR REPLACE VIEW form_statistics AS
SELECT
  f.id AS form_id, f.title, f.user_id, f.is_published, f.created_at,
  COUNT(DISTINCT q.id) AS question_count,
  COUNT(DISTINCT r.id) AS response_count,
  COUNT(DISTINCT CASE WHEN r.is_complete = true THEN r.id END) AS completed_response_count,
  MAX(r.submitted_at) AS last_response_at
FROM forms f
LEFT JOIN questions q ON q.form_id = f.id
LEFT JOIN responses r ON r.form_id = f.id
GROUP BY f.id, f.title, f.user_id, f.is_published, f.created_at;

-- Question analytics view
CREATE OR REPLACE VIEW question_analytics AS
SELECT
  q.id AS question_id, q.form_id, q.type AS question_type, q.title, q.required,
  COUNT(DISTINCT a.response_id) AS answer_count,
  COUNT(DISTINCT CASE WHEN r.is_complete = true THEN a.response_id END) AS completed_answer_count
FROM questions q
LEFT JOIN answers a ON a.question_id = q.id
LEFT JOIN responses r ON r.id = a.response_id
GROUP BY q.id, q.form_id, q.type, q.title, q.required;

-- Form availability view
CREATE OR REPLACE VIEW form_availability AS
SELECT
  f.id AS form_id, f.title, f.is_published, f.schedule_start, f.schedule_end,
  f.max_responses, f.require_login, (f.password_hash IS NOT NULL) AS has_password,
  COUNT(r.id) FILTER (WHERE r.is_complete = TRUE) AS current_responses,
  get_form_status(f.id) AS status,
  is_form_accepting_responses(f.id) AS accepting_responses
FROM forms f
LEFT JOIN responses r ON r.form_id = f.id
GROUP BY f.id, f.title, f.is_published, f.schedule_start, f.schedule_end, f.max_responses, f.require_login, f.password_hash;

-- Recent activity view
CREATE OR REPLACE VIEW recent_activity AS
SELECT al.id, al.user_id, al.user_email, al.action, al.resource_type, al.resource_id, al.details, al.created_at, p.role AS user_role
FROM audit_logs al
LEFT JOIN profiles p ON p.id = al.user_id
ORDER BY al.created_at DESC;

-- ============================================================================
-- PART 9: Update RLS Policies
-- ============================================================================

DROP POLICY IF EXISTS "Anyone can view published forms" ON forms;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'forms' AND policyname = 'Public can view published forms') THEN
    CREATE POLICY "Public can view published forms" ON forms FOR SELECT USING (is_published = TRUE);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'responses' AND policyname = 'Form owners can view all responses') THEN
    CREATE POLICY "Form owners can view all responses" ON responses FOR SELECT
    USING (EXISTS (SELECT 1 FROM forms WHERE forms.id = responses.form_id AND forms.user_id = auth.uid()));
  END IF;
END $$;

-- ============================================================================
-- PART 10: Verification & Summary
-- ============================================================================

DO $$
DECLARE
  form_count INTEGER;
  question_count INTEGER;
  response_count INTEGER;
  audit_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO form_count FROM forms;
  SELECT COUNT(*) INTO question_count FROM questions;
  SELECT COUNT(*) INTO response_count FROM responses;
  SELECT COUNT(*) INTO audit_count FROM audit_logs;

  RAISE NOTICE '============================================================';
  RAISE NOTICE 'FINAL MIGRATION COMPLETED SUCCESSFULLY!';
  RAISE NOTICE '============================================================';
  RAISE NOTICE 'Current database statistics:';
  RAISE NOTICE '  - Forms: %', form_count;
  RAISE NOTICE '  - Questions: %', question_count;
  RAISE NOTICE '  - Responses: %', response_count;
  RAISE NOTICE '  - Audit logs: %', audit_count;
  RAISE NOTICE '============================================================';
  RAISE NOTICE 'New features enabled:';
  RAISE NOTICE '  ✓ Display mode (single/scroll)';
  RAISE NOTICE '  ✓ Question types (slider, ranking, file_upload)';
  RAISE NOTICE '  ✓ Form scheduling (start/end dates)';
  RAISE NOTICE '  ✓ Response limits';
  RAISE NOTICE '  ✓ Password protection';
  RAISE NOTICE '  ✓ Login requirement';
  RAISE NOTICE '  ✓ Audit logging system';
  RAISE NOTICE '  ✓ Performance indexes (8 new indexes)';
  RAISE NOTICE '  ✓ Utility functions (5 functions)';
  RAISE NOTICE '  ✓ Database views (4 views)';
  RAISE NOTICE '============================================================';
END $$;
