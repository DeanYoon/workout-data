-- Cleanup script: Keep only the specified workout and its related data
-- Workout ID: de619b54-302a-4c29-9358-2f1d2b2bc9c1

-- Step 1: Delete sets that are NOT related to the specified workout
-- (Delete sets whose exercise_id is not in the exercises of the target workout)
DELETE FROM sets
WHERE exercise_id NOT IN (
  SELECT id 
  FROM exercises 
  WHERE workout_id = 'de619b54-302a-4c29-9358-2f1d2b2bc9c1'
);

-- Step 2: Delete exercises that are NOT related to the specified workout
DELETE FROM exercises
WHERE workout_id != 'de619b54-302a-4c29-9358-2f1d2b2bc9c1';

-- Step 3: Delete workouts that are NOT the specified workout
DELETE FROM workouts
WHERE id != 'de619b54-302a-4c29-9358-2f1d2b2bc9c1';

-- Verification queries (run these to check the results):
-- SELECT COUNT(*) FROM workouts; -- Should return 1
-- SELECT COUNT(*) FROM exercises WHERE workout_id = 'de619b54-302a-4c29-9358-2f1d2b2bc9c1';
-- SELECT COUNT(*) FROM sets WHERE exercise_id IN (SELECT id FROM exercises WHERE workout_id = 'de619b54-302a-4c29-9358-2f1d2b2bc9c1');
