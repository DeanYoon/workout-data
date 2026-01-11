-- Delete all data except 'anon_user'
-- This will remove all data for logged-in users and keep only anon_user data
-- Updated to use direct user_id filtering (simplified after adding user_id to exercises and sets)

DO $$
DECLARE
    anon_user_id TEXT := 'anon_user';
BEGIN
    -- Step 1: Delete sets for non-anon users (now direct filtering)
    DELETE FROM sets
    WHERE user_id != anon_user_id;
    
    -- Step 2: Delete exercises for non-anon users (now direct filtering)
    DELETE FROM exercises
    WHERE user_id != anon_user_id;
    
    -- Step 3: Delete workouts for non-anon users
    DELETE FROM workouts
    WHERE user_id != anon_user_id;
    
    -- Step 4: Delete weight_records for non-anon users
    DELETE FROM weight_records
    WHERE user_id != anon_user_id;
    
    -- Step 5: Delete user_profiles for non-anon users
    DELETE FROM user_profiles
    WHERE user_id != anon_user_id;
    
    -- Step 6: Delete weekly_goals for non-anon users
    DELETE FROM weekly_goals
    WHERE user_id != anon_user_id;
    
    -- Step 7: Delete split_config for non-anon users
    DELETE FROM split_config
    WHERE user_id != anon_user_id;
    
    RAISE NOTICE 'All non-anon_user data deleted successfully';
END $$;

-- Verification queries (run these to check the results):
-- SELECT COUNT(*) FROM workouts WHERE user_id != 'anon_user'; -- Should return 0
-- SELECT COUNT(*) FROM workouts WHERE user_id = 'anon_user'; -- Should return original count
-- SELECT COUNT(*) FROM exercises WHERE workout_id IN (SELECT id FROM workouts WHERE user_id != 'anon_user'); -- Should return 0
-- SELECT COUNT(*) FROM weight_records WHERE user_id != 'anon_user'; -- Should return 0
