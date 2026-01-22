-- Migration: Add audit logging system
-- Tracks all important actions for security and compliance

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

-- Create indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_resource ON audit_logs(resource_type, resource_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_details ON audit_logs USING GIN (details);

-- Add comments
COMMENT ON TABLE audit_logs IS 'Audit trail of all important actions in the system';
COMMENT ON COLUMN audit_logs.action IS 'Action performed (e.g., create, update, delete, publish, submit)';
COMMENT ON COLUMN audit_logs.resource_type IS 'Type of resource (e.g., form, question, response, answer)';
COMMENT ON COLUMN audit_logs.resource_id IS 'ID of the resource that was acted upon';
COMMENT ON COLUMN audit_logs.details IS 'Additional details about the action (JSON)';

-- Enable RLS
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own audit logs
CREATE POLICY "Users can view their own audit logs"
  ON audit_logs FOR SELECT
  USING (user_id = auth.uid());

-- Policy: Admin users can view all audit logs
CREATE POLICY "Admins can view all audit logs"
  ON audit_logs FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Policy: System can insert audit logs (using service role)
CREATE POLICY "System can insert audit logs"
  ON audit_logs FOR INSERT
  WITH CHECK (TRUE);

-- Function to log an audit event
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
  INSERT INTO audit_logs (
    user_id,
    user_email,
    action,
    resource_type,
    resource_id,
    details,
    ip_address,
    user_agent
  ) VALUES (
    p_user_id,
    p_user_email,
    p_action,
    p_resource_type,
    p_resource_id,
    p_details,
    p_ip_address,
    p_user_agent
  ) RETURNING id INTO audit_id;

  RETURN audit_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION log_audit_event IS 'Log an audit event';

-- Function to automatically audit form changes
CREATE OR REPLACE FUNCTION audit_form_changes()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    PERFORM log_audit_event(
      NEW.user_id,
      (SELECT email FROM profiles WHERE id = NEW.user_id),
      'form.created',
      'form',
      NEW.id,
      jsonb_build_object('title', NEW.title)
    );
  ELSIF TG_OP = 'UPDATE' THEN
    -- Log publish/unpublish separately
    IF OLD.is_published <> NEW.is_published THEN
      PERFORM log_audit_event(
        NEW.user_id,
        (SELECT email FROM profiles WHERE id = NEW.user_id),
        CASE WHEN NEW.is_published THEN 'form.published' ELSE 'form.unpublished' END,
        'form',
        NEW.id,
        jsonb_build_object('title', NEW.title)
      );
    END IF;

    -- Log title changes
    IF OLD.title <> NEW.title THEN
      PERFORM log_audit_event(
        NEW.user_id,
        (SELECT email FROM profiles WHERE id = NEW.user_id),
        'form.updated',
        'form',
        NEW.id,
        jsonb_build_object(
          'field', 'title',
          'old_value', OLD.title,
          'new_value', NEW.title
        )
      );
    END IF;
  ELSIF TG_OP = 'DELETE' THEN
    PERFORM log_audit_event(
      OLD.user_id,
      (SELECT email FROM profiles WHERE id = OLD.user_id),
      'form.deleted',
      'form',
      OLD.id,
      jsonb_build_object('title', OLD.title)
    );
  END IF;

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to automatically audit response submissions
CREATE OR REPLACE FUNCTION audit_response_changes()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    PERFORM log_audit_event(
      NEW.respondent_id,
      NEW.respondent_email,
      'response.started',
      'response',
      NEW.id,
      jsonb_build_object('form_id', NEW.form_id)
    );
  ELSIF TG_OP = 'UPDATE' AND OLD.is_complete = FALSE AND NEW.is_complete = TRUE THEN
    PERFORM log_audit_event(
      NEW.respondent_id,
      NEW.respondent_email,
      'response.submitted',
      'response',
      NEW.id,
      jsonb_build_object('form_id', NEW.form_id, 'submitted_at', NEW.submitted_at)
    );
  ELSIF TG_OP = 'DELETE' THEN
    PERFORM log_audit_event(
      auth.uid(),
      (SELECT email FROM profiles WHERE id = auth.uid()),
      'response.deleted',
      'response',
      OLD.id,
      jsonb_build_object('form_id', OLD.form_id)
    );
  END IF;

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create triggers
DROP TRIGGER IF EXISTS audit_form_changes_trigger ON forms;
CREATE TRIGGER audit_form_changes_trigger
  AFTER INSERT OR UPDATE OR DELETE ON forms
  FOR EACH ROW
  EXECUTE FUNCTION audit_form_changes();

DROP TRIGGER IF EXISTS audit_response_changes_trigger ON responses;
CREATE TRIGGER audit_response_changes_trigger
  AFTER INSERT OR UPDATE OR DELETE ON responses
  FOR EACH ROW
  EXECUTE FUNCTION audit_response_changes();

-- Create view for recent activity
CREATE OR REPLACE VIEW recent_activity AS
SELECT
  al.id,
  al.user_id,
  al.user_email,
  al.action,
  al.resource_type,
  al.resource_id,
  al.details,
  al.created_at,
  p.role AS user_role
FROM audit_logs al
LEFT JOIN profiles p ON p.id = al.user_id
ORDER BY al.created_at DESC;

COMMENT ON VIEW recent_activity IS 'Recent activity log with user details';

-- Create view for form activity
CREATE OR REPLACE VIEW form_activity AS
SELECT
  al.id,
  al.user_id,
  al.user_email,
  al.action,
  al.resource_id AS form_id,
  al.details,
  al.created_at,
  f.title AS form_title
FROM audit_logs al
JOIN forms f ON f.id = al.resource_id
WHERE al.resource_type = 'form'
ORDER BY al.created_at DESC;

COMMENT ON VIEW form_activity IS 'Activity log for forms';
