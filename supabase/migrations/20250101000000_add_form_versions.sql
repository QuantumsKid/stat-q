-- Form Versions Table
-- Stores historical snapshots of forms for version control

CREATE TABLE IF NOT EXISTS form_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  form_id UUID NOT NULL REFERENCES forms(id) ON DELETE CASCADE,
  version_number INTEGER NOT NULL,
  title TEXT NOT NULL,
  description TEXT,

  -- Snapshot of form structure at this version
  questions JSONB NOT NULL,
  settings JSONB,

  -- Version metadata
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by UUID REFERENCES profiles(id),

  -- Version notes/changelog
  change_summary TEXT,
  is_published BOOLEAN DEFAULT FALSE,

  -- Ensure unique version numbers per form
  UNIQUE(form_id, version_number)
);

-- Indexes for performance
CREATE INDEX idx_form_versions_form_id ON form_versions(form_id);
CREATE INDEX idx_form_versions_created_at ON form_versions(created_at DESC);
CREATE INDEX idx_form_versions_published ON form_versions(is_published) WHERE is_published = TRUE;

-- RLS Policies
ALTER TABLE form_versions ENABLE ROW LEVEL SECURITY;

-- Users can view versions of their own forms
CREATE POLICY "Users can view their form versions"
  ON form_versions
  FOR SELECT
  USING (
    form_id IN (
      SELECT id FROM forms WHERE user_id = auth.uid()
    )
  );

-- Users can create versions of their own forms
CREATE POLICY "Users can create versions of their forms"
  ON form_versions
  FOR INSERT
  WITH CHECK (
    form_id IN (
      SELECT id FROM forms WHERE user_id = auth.uid()
    )
  );

-- Users can delete versions of their own forms (except published ones)
CREATE POLICY "Users can delete unpublished versions"
  ON form_versions
  FOR DELETE
  USING (
    form_id IN (
      SELECT id FROM forms WHERE user_id = auth.uid()
    )
    AND is_published = FALSE
  );

-- Function to auto-create version on form publish
CREATE OR REPLACE FUNCTION create_version_on_publish()
RETURNS TRIGGER AS $$
BEGIN
  -- Only create version if form was just published (status changed to 'published')
  IF NEW.status = 'published' AND (OLD.status IS NULL OR OLD.status != 'published') THEN
    INSERT INTO form_versions (
      form_id,
      version_number,
      title,
      description,
      questions,
      settings,
      created_by,
      change_summary,
      is_published
    )
    SELECT
      NEW.id,
      COALESCE((
        SELECT MAX(version_number) + 1
        FROM form_versions
        WHERE form_id = NEW.id
      ), 1),
      NEW.title,
      NEW.description,
      (
        SELECT jsonb_agg(
          jsonb_build_object(
            'id', q.id,
            'type', q.type,
            'title', q.title,
            'description', q.description,
            'required', q.required,
            'options', q.options,
            'logic_rules', q.logic_rules,
            'order_index', q.order_index
          ) ORDER BY q.order_index
        )
        FROM questions q
        WHERE q.form_id = NEW.id
      ),
      jsonb_build_object(
        'display_mode', NEW.display_mode,
        'allow_multiple_responses', NEW.allow_multiple_responses,
        'require_authentication', NEW.require_authentication,
        'show_progress_bar', NEW.show_progress_bar,
        'schedule_start', NEW.schedule_start,
        'schedule_end', NEW.schedule_end,
        'max_responses', NEW.max_responses
      ),
      NEW.user_id,
      'Published version',
      TRUE;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to auto-create version on publish
DROP TRIGGER IF EXISTS trigger_create_version_on_publish ON forms;
CREATE TRIGGER trigger_create_version_on_publish
  AFTER UPDATE ON forms
  FOR EACH ROW
  EXECUTE FUNCTION create_version_on_publish();

-- Add helpful comments
COMMENT ON TABLE form_versions IS 'Stores versioned snapshots of forms for history and rollback';
COMMENT ON COLUMN form_versions.version_number IS 'Sequential version number for each form';
COMMENT ON COLUMN form_versions.questions IS 'Complete snapshot of all questions at this version';
COMMENT ON COLUMN form_versions.is_published IS 'Whether this version was created from a publish action';
