-- Delete all data created within the last 1 hour
-- This will delete workouts, exercises, and sets created in the last hour
-- Using start_time as the reference point since it's more reliable

-- Step 1: Delete sets from exercises created in the last hour
DELETE FROM sets
WHERE exercise_id IN (
  SELECT id FROM exercises
  WHERE workout_id IN (
    SELECT id FROM workouts
    WHERE start_time >= NOW() - INTERVAL '1 hour'
  )
);

-- Step 2: Delete exercises from workouts created in the last hour
DELETE FROM exercises
WHERE workout_id IN (
  SELECT id FROM workouts
  WHERE start_time >= NOW() - INTERVAL '1 hour'
);

-- Step 3: Delete workouts created in the last hour
DELETE FROM workouts
WHERE start_time >= NOW() - INTERVAL '1 hour';
