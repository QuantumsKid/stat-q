-- ============================================================================
-- Fix RLS Policy - Allow All Authenticated Users to Create Forms
-- ============================================================================
-- This migration fixes the overly restrictive RLS policy that only allows
-- admins to create forms. In a form builder application, all authenticated
-- users should be able to create their own forms.
-- ============================================================================

-- Drop the existing restrictive policy
DROP POLICY IF EXISTS "Admins can create forms" ON forms;

-- Create a new policy that allows all authenticated users to create forms
CREATE POLICY "Users can create their own forms"
  ON forms FOR INSERT
  WITH CHECK (
    auth.uid() = user_id
  );

-- Update the view policy name for consistency (optional, for clarity)
DROP POLICY IF EXISTS "Admins can view their own forms" ON forms;

CREATE POLICY "Users can view their own forms"
  ON forms FOR SELECT
  USING (
    auth.uid() = user_id
    OR EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

COMMENT ON POLICY "Users can create their own forms" ON forms IS
  'Allows any authenticated user to create forms with themselves as the owner';

COMMENT ON POLICY "Users can view their own forms" ON forms IS
  'Users can view their own forms, admins can view all forms';
