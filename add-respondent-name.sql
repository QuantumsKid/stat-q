-- Add respondent_name column to responses table
ALTER TABLE responses
ADD COLUMN IF NOT EXISTS respondent_name TEXT;

-- Add comment for documentation
COMMENT ON COLUMN responses.respondent_name IS 'Full name of the respondent (collected before form submission)';
