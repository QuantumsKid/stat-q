-- Add missing question types to the question_type enum
-- This migration adds: file_upload, ranking, and slider

-- Step 1: Add the new enum values
ALTER TYPE question_type ADD VALUE IF NOT EXISTS 'file_upload';
ALTER TYPE question_type ADD VALUE IF NOT EXISTS 'ranking';
ALTER TYPE question_type ADD VALUE IF NOT EXISTS 'slider';

-- Note: PostgreSQL doesn't allow removing enum values easily
-- If you need to remove a value, you'd need to:
-- 1. Create a new enum type with the desired values
-- 2. Alter the column to use the new type
-- 3. Drop the old type
--
-- For adding values (like we're doing here), it's straightforward
