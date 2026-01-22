-- Analytics Performance Views
-- Move statistics computation to database-level for better performance

-- View: Form response statistics (aggregated at database level)
CREATE OR REPLACE VIEW form_response_stats AS
SELECT
  f.id AS form_id,
  f.title AS form_title,
  f.user_id,
  COUNT(r.id) FILTER (WHERE r.deleted_at IS NULL) AS total_responses,
  COUNT(r.id) FILTER (WHERE r.is_complete = TRUE AND r.deleted_at IS NULL) AS completed_responses,
  COUNT(r.id) FILTER (WHERE r.is_complete = FALSE AND r.deleted_at IS NULL) AS incomplete_responses,
  COUNT(r.id) FILTER (WHERE r.deleted_at IS NOT NULL) AS deleted_responses,
  COUNT(r.id) FILTER (WHERE r.is_flagged = TRUE AND r.deleted_at IS NULL) AS flagged_responses,
  MIN(r.submitted_at) FILTER (WHERE r.is_complete = TRUE) AS first_response_at,
  MAX(r.submitted_at) FILTER (WHERE r.is_complete = TRUE) AS latest_response_at,
  -- Average completion time in seconds
  AVG(EXTRACT(EPOCH FROM (r.submitted_at - r.created_at))) FILTER (WHERE r.is_complete = TRUE AND r.submitted_at IS NOT NULL) AS avg_completion_time_seconds,
  -- Completion rate percentage
  CASE
    WHEN COUNT(r.id) FILTER (WHERE r.deleted_at IS NULL) > 0
    THEN (COUNT(r.id) FILTER (WHERE r.is_complete = TRUE AND r.deleted_at IS NULL)::FLOAT /
          COUNT(r.id) FILTER (WHERE r.deleted_at IS NULL)::FLOAT * 100)
    ELSE 0
  END AS completion_rate_percent
FROM forms f
LEFT JOIN responses r ON f.id = r.form_id
GROUP BY f.id, f.title, f.user_id;

-- Index for faster queries on form_response_stats
CREATE INDEX IF NOT EXISTS idx_responses_stats_lookup
ON responses(form_id, is_complete, deleted_at, submitted_at);

-- View: Question response statistics
CREATE OR REPLACE VIEW question_response_stats AS
SELECT
  q.id AS question_id,
  q.form_id,
  q.title AS question_title,
  q.type AS question_type,
  q.required,
  COUNT(DISTINCT a.response_id) AS response_count,
  -- Skip rate (required questions not answered)
  CASE
    WHEN q.required THEN
      (SELECT COUNT(*) FROM responses r
       WHERE r.form_id = q.form_id
       AND r.is_complete = TRUE
       AND r.deleted_at IS NULL
       AND NOT EXISTS (
         SELECT 1 FROM answers a2
         WHERE a2.response_id = r.id
         AND a2.question_id = q.id
       ))
    ELSE 0
  END AS skip_count,
  -- For numeric questions: avg, min, max
  CASE
    WHEN q.type IN ('linear_scale', 'slider') THEN
      AVG((a.value::jsonb->>'value')::NUMERIC)
    ELSE NULL
  END AS numeric_avg,
  CASE
    WHEN q.type IN ('linear_scale', 'slider') THEN
      MIN((a.value::jsonb->>'value')::NUMERIC)
    ELSE NULL
  END AS numeric_min,
  CASE
    WHEN q.type IN ('linear_scale', 'slider') THEN
      MAX((a.value::jsonb->>'value')::NUMERIC)
    ELSE NULL
  END AS numeric_max
FROM questions q
LEFT JOIN answers a ON q.id = a.question_id
LEFT JOIN responses r ON a.response_id = r.id AND r.is_complete = TRUE AND r.deleted_at IS NULL
GROUP BY q.id, q.form_id, q.title, q.type, q.required;

-- Index for question stats
CREATE INDEX IF NOT EXISTS idx_answers_question_stats
ON answers(question_id, response_id);

-- View: Daily response trends (last 90 days)
CREATE OR REPLACE VIEW daily_response_trends AS
SELECT
  f.id AS form_id,
  f.user_id,
  DATE(r.submitted_at) AS response_date,
  COUNT(*) AS response_count,
  COUNT(*) FILTER (WHERE r.is_complete = TRUE) AS completed_count,
  AVG(EXTRACT(EPOCH FROM (r.submitted_at - r.created_at))) AS avg_completion_time_seconds
FROM forms f
LEFT JOIN responses r ON f.id = r.form_id
WHERE r.submitted_at >= CURRENT_DATE - INTERVAL '90 days'
  AND r.deleted_at IS NULL
GROUP BY f.id, f.user_id, DATE(r.submitted_at)
ORDER BY f.id, response_date DESC;

-- Index for daily trends
CREATE INDEX IF NOT EXISTS idx_responses_daily_trends
ON responses(form_id, submitted_at, is_complete, deleted_at)
WHERE submitted_at >= CURRENT_DATE - INTERVAL '90 days';

-- View: Question abandonment analysis
CREATE OR REPLACE VIEW question_abandonment_stats AS
WITH question_positions AS (
  SELECT
    q.id AS question_id,
    q.form_id,
    q.title,
    q.order_index,
    COUNT(DISTINCT a.response_id) AS answered_count,
    (
      SELECT COUNT(DISTINCT r.id)
      FROM responses r
      WHERE r.form_id = q.form_id
        AND r.deleted_at IS NULL
        AND r.created_at >= CURRENT_DATE - INTERVAL '30 days'
    ) AS total_started
  FROM questions q
  LEFT JOIN answers a ON q.id = a.question_id
  LEFT JOIN responses r ON a.response_id = r.id
    AND r.deleted_at IS NULL
    AND r.created_at >= CURRENT_DATE - INTERVAL '30 days'
  GROUP BY q.id, q.form_id, q.title, q.order_index
)
SELECT
  question_id,
  form_id,
  title,
  order_index,
  answered_count,
  total_started,
  CASE
    WHEN total_started > 0 THEN
      ((total_started - answered_count)::FLOAT / total_started::FLOAT * 100)
    ELSE 0
  END AS abandonment_rate_percent,
  CASE
    WHEN total_started > 0 THEN
      (answered_count::FLOAT / total_started::FLOAT * 100)
    ELSE 0
  END AS completion_rate_percent
FROM question_positions
ORDER BY form_id, order_index;

-- View: Answer value frequency (for multiple choice, checkbox, dropdown)
CREATE OR REPLACE VIEW answer_frequency_stats AS
SELECT
  q.id AS question_id,
  q.form_id,
  q.title AS question_title,
  q.type AS question_type,
  a.value AS answer_value,
  COUNT(*) AS frequency,
  COUNT(*)::FLOAT / (
    SELECT COUNT(DISTINCT a2.response_id)
    FROM answers a2
    JOIN responses r2 ON a2.response_id = r2.id
    WHERE a2.question_id = q.id
      AND r2.is_complete = TRUE
      AND r2.deleted_at IS NULL
  ) * 100 AS percentage
FROM questions q
JOIN answers a ON q.id = a.question_id
JOIN responses r ON a.response_id = r.id
WHERE q.type IN ('multiple_choice', 'checkboxes', 'dropdown')
  AND r.is_complete = TRUE
  AND r.deleted_at IS NULL
GROUP BY q.id, q.form_id, q.title, q.type, a.value
ORDER BY q.form_id, q.order_index, frequency DESC;

-- View: Response quality metrics
CREATE OR REPLACE VIEW response_quality_metrics AS
SELECT
  r.id AS response_id,
  r.form_id,
  r.submitted_at,
  -- Count of answered questions
  COUNT(a.id) AS questions_answered,
  -- Total questions in form
  (SELECT COUNT(*) FROM questions WHERE form_id = r.form_id) AS total_questions,
  -- Completion percentage
  (COUNT(a.id)::FLOAT / (SELECT COUNT(*) FROM questions WHERE form_id = r.form_id)::FLOAT * 100) AS completion_percentage,
  -- Time spent
  EXTRACT(EPOCH FROM (r.submitted_at - r.created_at)) AS time_spent_seconds,
  -- Flag indicators
  r.is_flagged,
  r.flag_reason,
  -- Detect potentially rushed responses (< 5 seconds)
  CASE
    WHEN EXTRACT(EPOCH FROM (r.submitted_at - r.created_at)) < 5 THEN TRUE
    ELSE FALSE
  END AS potentially_rushed,
  -- Detect suspiciously long responses (> 1 hour)
  CASE
    WHEN EXTRACT(EPOCH FROM (r.submitted_at - r.created_at)) > 3600 THEN TRUE
    ELSE FALSE
  END AS potentially_abandoned_tab
FROM responses r
LEFT JOIN answers a ON r.id = a.response_id
WHERE r.is_complete = TRUE
  AND r.deleted_at IS NULL
GROUP BY r.id, r.form_id, r.submitted_at, r.is_flagged, r.flag_reason, r.created_at;

-- Grant SELECT permissions to authenticated users (RLS will still apply)
GRANT SELECT ON form_response_stats TO authenticated;
GRANT SELECT ON question_response_stats TO authenticated;
GRANT SELECT ON daily_response_trends TO authenticated;
GRANT SELECT ON question_abandonment_stats TO authenticated;
GRANT SELECT ON answer_frequency_stats TO authenticated;
GRANT SELECT ON response_quality_metrics TO authenticated;

-- Add helpful comments
COMMENT ON VIEW form_response_stats IS 'Aggregated statistics for each form (counts, rates, avg completion time)';
COMMENT ON VIEW question_response_stats IS 'Statistics per question including skip rates and numeric averages';
COMMENT ON VIEW daily_response_trends IS 'Daily response counts and completion times for the last 90 days';
COMMENT ON VIEW question_abandonment_stats IS 'Abandonment rates per question (last 30 days)';
COMMENT ON VIEW answer_frequency_stats IS 'Frequency distribution for multiple choice questions';
COMMENT ON VIEW response_quality_metrics IS 'Quality metrics per response (completion %, time, potential issues)';
