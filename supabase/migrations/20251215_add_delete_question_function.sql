-- Migration: Add atomic delete_question function
-- This prevents race conditions when deleting questions and reordering

-- Drop function if exists (for migration reruns)
DROP FUNCTION IF EXISTS delete_question_atomic(uuid);

-- Create function to atomically delete question and reorder
CREATE OR REPLACE FUNCTION delete_question_atomic(question_id_param uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  question_form_id uuid;
  question_order_index integer;
  affected_rows integer;
BEGIN
  -- Get question details (will fail if not found)
  SELECT form_id, order_index INTO question_form_id, question_order_index
  FROM questions
  WHERE id = question_id_param
  FOR UPDATE; -- Lock the row to prevent concurrent modifications

  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Question not found'
    );
  END IF;

  -- Delete the question (cascades to answers via FK)
  DELETE FROM questions WHERE id = question_id_param;

  -- Reorder remaining questions in one atomic operation
  UPDATE questions
  SET order_index = order_index - 1
  WHERE form_id = question_form_id
    AND order_index > question_order_index;

  GET DIAGNOSTICS affected_rows = ROW_COUNT;

  -- Return success with metadata
  RETURN jsonb_build_object(
    'success', true,
    'form_id', question_form_id,
    'deleted_order_index', question_order_index,
    'reordered_count', affected_rows
  );

EXCEPTION
  WHEN OTHERS THEN
    -- Return error info
    RETURN jsonb_build_object(
      'success', false,
      'error', SQLERRM,
      'error_code', SQLSTATE
    );
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION delete_question_atomic(uuid) TO authenticated;

-- Add comment
COMMENT ON FUNCTION delete_question_atomic IS
  'Atomically deletes a question and reorders remaining questions. Prevents race conditions.';
