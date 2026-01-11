-- Update RPC function to filter by user_id
-- This function aggregates sets data by exercise and date at the database level
-- and filters by the current authenticated user

CREATE OR REPLACE FUNCTION get_workout_analytics()
RETURNS TABLE (
  exercise_name TEXT,
  date DATE,
  max_weight NUMERIC,
  total_volume NUMERIC,
  total_sets BIGINT
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    e.name AS exercise_name,
    DATE(w.start_time) AS date,
    MAX(s.weight) AS max_weight,
    SUM(s.weight * s.reps) AS total_volume,
    COUNT(*) AS total_sets
  FROM sets s
  INNER JOIN exercises e ON s.exercise_id = e.id
  INNER JOIN workouts w ON e.workout_id = w.id
  WHERE s.is_completed = true
    AND w.is_disabled = false
    AND w.user_id = auth.uid()::text
  GROUP BY e.name, DATE(w.start_time)
  ORDER BY e.name, DATE(w.start_time);
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION get_workout_analytics() TO authenticated;
GRANT EXECUTE ON FUNCTION get_workout_analytics() TO anon;
