-- Migration: Add GIN index on logic_rules JSONB field for improved performance
-- This improves queries that filter or search within conditional logic rules

-- Add GIN index to questions table for logic_rules column
-- GIN (Generalized Inverted Index) is optimal for JSONB columns
CREATE INDEX IF NOT EXISTS idx_questions_logic_rules
ON questions USING GIN (logic_rules);

-- Add comment explaining the index
COMMENT ON INDEX idx_questions_logic_rules IS 'Improves performance when querying questions by their conditional logic rules';

-- Verify the index was created
SELECT
  tablename,
  indexname,
  indexdef
FROM
  pg_indexes
WHERE
  tablename = 'questions'
  AND indexname = 'idx_questions_logic_rules';
