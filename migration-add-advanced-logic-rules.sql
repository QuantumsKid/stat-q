-- Add advanced_logic_rules column to questions table
-- This column stores complex conditional logic with AND/OR combinations

ALTER TABLE questions
ADD COLUMN IF NOT EXISTS advanced_logic_rules JSONB DEFAULT '[]'::jsonb;

-- Add comment for documentation
COMMENT ON COLUMN questions.advanced_logic_rules IS
  'Stores advanced conditional logic rules with AND/OR operators, multiple condition groups, and complex actions (field piping, calculations, etc.)';

-- Add GIN index for performance when querying advanced logic rules
CREATE INDEX IF NOT EXISTS idx_questions_advanced_logic_rules
ON questions USING GIN (advanced_logic_rules);

COMMENT ON INDEX idx_questions_advanced_logic_rules IS
  'Improves performance when querying questions by their advanced conditional logic rules';
