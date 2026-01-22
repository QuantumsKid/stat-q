-- Migration: Add form scheduling and response limits
-- Allows forms to be scheduled with start/end dates and response limits

-- Add scheduling columns to forms table
ALTER TABLE forms ADD COLUMN IF NOT EXISTS schedule_start TIMESTAMP WITH TIME ZONE;
ALTER TABLE forms ADD COLUMN IF NOT EXISTS schedule_end TIMESTAMP WITH TIME ZONE;
ALTER TABLE forms ADD COLUMN IF NOT EXISTS max_responses INTEGER;
ALTER TABLE forms ADD COLUMN IF NOT EXISTS password_hash TEXT;
ALTER TABLE forms ADD COLUMN IF NOT EXISTS require_login BOOLEAN DEFAULT FALSE;

-- Add comments
COMMENT ON COLUMN forms.schedule_start IS 'When the form becomes available (NULL = no start restriction)';
COMMENT ON COLUMN forms.schedule_end IS 'When the form closes (NULL = no end restriction)';
COMMENT ON COLUMN forms.max_responses IS 'Maximum number of responses allowed (NULL = unlimited)';
COMMENT ON COLUMN forms.password_hash IS 'Bcrypt hash of form password (NULL = no password required)';
COMMENT ON COLUMN forms.require_login IS 'Whether respondents must be logged in to submit';

-- Add constraint to ensure schedule_end is after schedule_start
ALTER TABLE forms ADD CONSTRAINT forms_schedule_valid
  CHECK (schedule_end IS NULL OR schedule_start IS NULL OR schedule_end > schedule_start);

-- Add constraint for max_responses
ALTER TABLE forms ADD CONSTRAINT forms_max_responses_valid
  CHECK (max_responses IS NULL OR max_responses > 0);

-- Create function to check if form is currently accepting responses
CREATE OR REPLACE FUNCTION is_form_accepting_responses(form_uuid UUID)
RETURNS BOOLEAN AS $$
DECLARE
  form_record RECORD;
  current_responses INTEGER;
BEGIN
  -- Get form details
  SELECT
    is_published,
    schedule_start,
    schedule_end,
    max_responses
  INTO form_record
  FROM forms
  WHERE id = form_uuid;

  -- Form must be published
  IF NOT form_record.is_published THEN
    RETURN FALSE;
  END IF;

  -- Check schedule start
  IF form_record.schedule_start IS NOT NULL AND NOW() < form_record.schedule_start THEN
    RETURN FALSE;
  END IF;

  -- Check schedule end
  IF form_record.schedule_end IS NOT NULL AND NOW() > form_record.schedule_end THEN
    RETURN FALSE;
  END IF;

  -- Check response limit
  IF form_record.max_responses IS NOT NULL THEN
    SELECT COUNT(*)
    INTO current_responses
    FROM responses
    WHERE form_id = form_uuid AND is_complete = TRUE;

    IF current_responses >= form_record.max_responses THEN
      RETURN FALSE;
    END IF;
  END IF;

  RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION is_form_accepting_responses IS 'Check if a form is currently accepting new responses';

-- Create function to get form status
CREATE OR REPLACE FUNCTION get_form_status(form_uuid UUID)
RETURNS TEXT AS $$
DECLARE
  form_record RECORD;
  current_responses INTEGER;
BEGIN
  SELECT
    is_published,
    schedule_start,
    schedule_end,
    max_responses
  INTO form_record
  FROM forms
  WHERE id = form_uuid;

  -- Not published
  IF NOT form_record.is_published THEN
    RETURN 'draft';
  END IF;

  -- Not started yet
  IF form_record.schedule_start IS NOT NULL AND NOW() < form_record.schedule_start THEN
    RETURN 'scheduled';
  END IF;

  -- Ended
  IF form_record.schedule_end IS NOT NULL AND NOW() > form_record.schedule_end THEN
    RETURN 'closed';
  END IF;

  -- Check response limit
  IF form_record.max_responses IS NOT NULL THEN
    SELECT COUNT(*)
    INTO current_responses
    FROM responses
    WHERE form_id = form_uuid AND is_complete = TRUE;

    IF current_responses >= form_record.max_responses THEN
      RETURN 'full';
    END IF;
  END IF;

  RETURN 'active';
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION get_form_status IS 'Get the current status of a form (draft, scheduled, active, closed, full)';

-- Create view for form availability
CREATE OR REPLACE VIEW form_availability AS
SELECT
  f.id AS form_id,
  f.title,
  f.is_published,
  f.schedule_start,
  f.schedule_end,
  f.max_responses,
  f.require_login,
  (f.password_hash IS NOT NULL) AS has_password,
  COUNT(r.id) FILTER (WHERE r.is_complete = TRUE) AS current_responses,
  get_form_status(f.id) AS status,
  is_form_accepting_responses(f.id) AS accepting_responses
FROM forms f
LEFT JOIN responses r ON r.form_id = f.id
GROUP BY f.id, f.title, f.is_published, f.schedule_start, f.schedule_end, f.max_responses, f.require_login, f.password_hash;

COMMENT ON VIEW form_availability IS 'Shows availability and status information for all forms';
