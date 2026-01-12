-- Migrate all data from 'anon_user' to actual user_id
-- User ID: 2658968a-0a1a-4ba0-9a7c-1ef7cfa1d628

DO $$
DECLARE
    new_user_id TEXT := '2658968a-0a1a-4ba0-9a7c-1ef7cfa1d628';
    old_user_id TEXT := 'anon_user';
BEGIN
    -- Step 1: Copy workouts with new IDs and create workout mapping
    CREATE TEMP TABLE workout_mapping (
        old_id TEXT,
        new_id TEXT
    );
    
    INSERT INTO workout_mapping (old_id, new_id)
    SELECT 
        id,
        gen_random_uuid()::TEXT
    FROM workouts
    WHERE user_id = old_user_id AND is_disabled = false;
    
    -- Insert new workouts
    INSERT INTO workouts (
        id,
        name,
        start_time,
        end_time,
        total_weight,
        total_sets,
        user_id,
        is_disabled
    )
    SELECT 
        wm.new_id,
        w.name,
        w.start_time,
        w.end_time,
        w.total_weight,
        w.total_sets,
        new_user_id,
        w.is_disabled
    FROM workouts w
    INNER JOIN workout_mapping wm ON w.id = wm.old_id;
    
    -- Step 2: Copy exercises with new IDs and create exercise mapping
    CREATE TEMP TABLE exercise_mapping (
        old_id TEXT,
        new_id TEXT,
        new_workout_id TEXT
    );
    
    INSERT INTO exercise_mapping (old_id, new_id, new_workout_id)
    SELECT 
        e.id,
        gen_random_uuid()::TEXT,
        wm.new_id
    FROM exercises e
    INNER JOIN workout_mapping wm ON e.workout_id = wm.old_id;
    
    -- Insert new exercises
    INSERT INTO exercises (
        id,
        workout_id,
        name,
        "order",
        user_id
    )
    SELECT 
        em.new_id,
        em.new_workout_id,
        e.name,
        e."order",
        new_user_id
    FROM exercises e
    INNER JOIN exercise_mapping em ON e.id = em.old_id;
    
    -- Step 3: Copy sets with new IDs
    INSERT INTO sets (
        id,
        exercise_id,
        weight,
        reps,
        is_completed,
        "order",
        user_id
    )
    SELECT 
        gen_random_uuid()::TEXT,
        em.new_id,
        s.weight,
        s.reps,
        s.is_completed,
        s."order",
        new_user_id
    FROM sets s
    INNER JOIN exercise_mapping em ON s.exercise_id = em.old_id;
    
    -- Step 4: Copy user_profiles (UPSERT in case it exists)
    INSERT INTO user_profiles (
        user_id,
        name,
        age,
        gender,
        height,
        created_at,
        updated_at
    )
    SELECT 
        new_user_id,
        name,
        age,
        gender,
        height,
        created_at,
        updated_at
    FROM user_profiles
    WHERE user_id = old_user_id
    ON CONFLICT (user_id) DO UPDATE SET
        name = EXCLUDED.name,
        age = EXCLUDED.age,
        gender = EXCLUDED.gender,
        height = EXCLUDED.height,
        updated_at = EXCLUDED.updated_at;
    
    -- Step 5: Copy weight_records (id is UUID type)
    INSERT INTO weight_records (
        id,
        user_id,
        weight,
        recorded_at,
        created_at
    )
    SELECT 
        gen_random_uuid(),
        new_user_id,
        weight,
        recorded_at,
        created_at
    FROM weight_records
    WHERE user_id = old_user_id;
    
    -- Step 6: Copy weekly_goals (UPSERT in case it exists)
    INSERT INTO weekly_goals (
        user_id,
        weekly_target,
        created_at,
        updated_at
    )
    SELECT 
        new_user_id,
        weekly_target,
        created_at,
        updated_at
    FROM weekly_goals
    WHERE user_id = old_user_id
    ON CONFLICT (user_id) DO UPDATE SET
        weekly_target = EXCLUDED.weekly_target,
        updated_at = EXCLUDED.updated_at;
    
    -- Step 7: Copy split_config (UPSERT in case it exists)
    INSERT INTO split_config (
        user_id,
        split_count,
        split_order,
        created_at,
        updated_at
    )
    SELECT 
        new_user_id,
        split_count,
        split_order,
        created_at,
        updated_at
    FROM split_config
    WHERE user_id = old_user_id
    ON CONFLICT (user_id) DO UPDATE SET
        split_count = EXCLUDED.split_count,
        split_order = EXCLUDED.split_order,
        updated_at = EXCLUDED.updated_at;
    
    -- Clean up temp tables
    DROP TABLE IF EXISTS exercise_mapping;
    DROP TABLE IF EXISTS workout_mapping;
    
    RAISE NOTICE 'Migration completed successfully';
END $$;

-- Verification queries (run these to check the results):
-- SELECT COUNT(*) FROM workouts WHERE user_id = '2658968a-0a1a-4ba0-9a7c-1ef7cfa1d628';
-- SELECT COUNT(*) FROM workouts WHERE user_id = 'anon_user';
-- SELECT COUNT(*) FROM exercises WHERE workout_id IN (SELECT id FROM workouts WHERE user_id = '2658968a-0a1a-4ba0-9a7c-1ef7cfa1d628');
-- SELECT COUNT(*) FROM weight_records WHERE user_id = '2658968a-0a1a-4ba0-9a7c-1ef7cfa1d628';
