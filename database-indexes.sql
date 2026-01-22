-- Database Index Optimization for StatForm AI
-- Run this after database-fixed.sql to add performance indexes

-- Index on forms.is_published for public form queries
CREATE INDEX IF NOT EXISTS idx_forms_published ON forms(is_published) WHERE is_published = true;

-- Composite index on questions for efficient ordering
CREATE INDEX IF NOT EXISTS idx_questions_form_order ON questions(form_id, order_index);

-- Index on responses for form statistics
CREATE INDEX IF NOT EXISTS idx_responses_form ON responses(form_id);

-- Index on answers for response queries
CREATE INDEX IF NOT EXISTS idx_answers_response ON answers(response_id);

-- Index on answers for question statistics
CREATE INDEX IF NOT EXISTS idx_answers_question ON answers(question_id);

-- Composite index for user's forms queries
CREATE INDEX IF NOT EXISTS idx_forms_user_updated ON forms(user_id, updated_at DESC);

-- Index for finding questions by type (for analytics)
CREATE INDEX IF NOT EXISTS idx_questions_type ON questions(type);

COMMENT ON INDEX idx_forms_published IS 'Optimize public form queries';
COMMENT ON INDEX idx_questions_form_order IS 'Optimize question ordering within forms';
COMMENT ON INDEX idx_responses_form IS 'Optimize response statistics by form';
COMMENT ON INDEX idx_answers_response IS 'Optimize answer retrieval by response';
COMMENT ON INDEX idx_answers_question IS 'Optimize question statistics';
COMMENT ON INDEX idx_forms_user_updated IS 'Optimize user dashboard form listing';
COMMENT ON INDEX idx_questions_type IS 'Optimize analytics by question type';
