-- Add display_mode column to forms table
-- This allows form creators to choose between single-question and scroll modes

ALTER TABLE forms
ADD COLUMN IF NOT EXISTS display_mode TEXT DEFAULT 'scroll' CHECK (display_mode IN ('single', 'scroll'));

COMMENT ON COLUMN forms.display_mode IS 'Display mode for respondents: single (Typeform style) or scroll (Google Forms style)';
