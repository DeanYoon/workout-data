-- Add user_id column to exercises and sets tables
-- This improves query performance and simplifies data management

-- Step 1: Add user_id column to exercises table
ALTER TABLE exercises
ADD COLUMN IF NOT EXISTS user_id TEXT;

-- Step 2: Add user_id column to sets table
ALTER TABLE sets
ADD COLUMN IF NOT EXISTS user_id TEXT;

-- Step 3: Populate user_id in exercises from workouts
UPDATE exercises e
SET user_id = w.user_id
FROM workouts w
WHERE e.workout_id = w.id
  AND e.user_id IS NULL;

-- Step 4: Populate user_id in sets from exercises
UPDATE sets s
SET user_id = e.user_id
FROM exercises e
WHERE s.exercise_id = e.id
  AND s.user_id IS NULL;

-- Step 5: Make user_id NOT NULL after populating
ALTER TABLE exercises
ALTER COLUMN user_id SET NOT NULL;

ALTER TABLE sets
ALTER COLUMN user_id SET NOT NULL;

-- Step 6: Add indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_exercises_user_id ON exercises(user_id);
CREATE INDEX IF NOT EXISTS idx_sets_user_id ON sets(user_id);

-- Step 7: Add foreign key constraints (optional, for data integrity)
-- Note: This assumes user_id references auth.users(id) or is a text identifier
-- ALTER TABLE exercises
-- ADD CONSTRAINT fk_exercises_user_id 
-- FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
-- 
-- ALTER TABLE sets
-- ADD CONSTRAINT fk_sets_user_id 
-- FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
