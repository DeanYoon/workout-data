-- Add is_disabled column to workouts table
-- This migration adds a boolean column to support soft deletes

ALTER TABLE workouts 
ADD COLUMN IF NOT EXISTS is_disabled BOOLEAN DEFAULT FALSE NOT NULL;

-- Create an index for better query performance when filtering by is_disabled
CREATE INDEX IF NOT EXISTS idx_workouts_is_disabled ON workouts(is_disabled);

-- Update existing records to ensure they are not disabled by default
UPDATE workouts 
SET is_disabled = FALSE 
WHERE is_disabled IS NULL;
