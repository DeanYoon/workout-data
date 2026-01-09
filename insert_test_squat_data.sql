-- 임시 테스트 데이터: 스쿼트 10일치 데이터 생성
-- max weight가 점점 늘어나는 패턴 (20kg -> 38kg, 매일 2kg씩 증가)
-- 시작 날짜: 2026-01-09 (현재 workout 다음 날부터)

DO $$
DECLARE
  workout_id_val TEXT;
  exercise_id_val TEXT;
  set_id_val TEXT;
  workout_date DATE;
  max_weight_val NUMERIC;
  total_weight_val NUMERIC;
  total_sets_val INTEGER;
  i INTEGER;
  j INTEGER;
  reps_array INTEGER[] := ARRAY[10, 8, 6, 5]; -- 세트별 횟수 (점점 줄어듦)
  weight_multiplier NUMERIC;
  set_weight NUMERIC;
  set_reps INTEGER;
BEGIN
  -- 10일치 데이터 생성
  FOR i IN 1..10 LOOP
    -- 날짜 계산 (2026-01-09부터 시작)
    workout_date := '2026-01-09'::DATE + (i - 1);
    
    -- max weight 계산 (20kg부터 시작, 매일 2kg씩 증가)
    max_weight_val := 20 + (i - 1) * 2;
    
    -- Workout 생성
    workout_id_val := gen_random_uuid()::TEXT;
    
    -- 초기값 설정
    total_weight_val := 0;
    total_sets_val := 0;
    
    INSERT INTO workouts (
      id,
      user_id,
      name,
      start_time,
      end_time,
      total_weight,
      total_sets,
      is_disabled
    ) VALUES (
      workout_id_val,
      'anon_user',
      '하체',
      (workout_date || ' 10:00:00')::TIMESTAMP,
      (workout_date || ' 10:45:00')::TIMESTAMP,
      0, -- 나중에 업데이트
      0, -- 나중에 업데이트
      false
    );
    
    -- Exercise 생성 (스쿼트)
    exercise_id_val := gen_random_uuid()::TEXT;
    
    INSERT INTO exercises (
      id,
      workout_id,
      name,
      "order"
    ) VALUES (
      exercise_id_val,
      workout_id_val,
      '스쿼트',
      0
    );
    
    -- Sets 생성 (4세트)
    FOR j IN 1..4 LOOP
      set_id_val := gen_random_uuid()::TEXT;
      
      -- 세트별 무게 계산 (max weight의 80%, 85%, 90%, 100%)
      weight_multiplier := CASE j
        WHEN 1 THEN 0.80
        WHEN 2 THEN 0.85
        WHEN 3 THEN 0.90
        WHEN 4 THEN 1.00
      END;
      
      -- 무게를 정수로 반올림
      set_weight := ROUND(max_weight_val * weight_multiplier);
      set_reps := reps_array[j];
      
      INSERT INTO sets (
        id,
        exercise_id,
        weight,
        reps,
        is_completed,
        "order"
      ) VALUES (
        set_id_val,
        exercise_id_val,
        set_weight,
        set_reps,
        true,
        j - 1
      );
      
      -- 총 무게와 세트 수 누적
      total_weight_val := total_weight_val + (set_weight * set_reps);
      total_sets_val := total_sets_val + 1;
    END LOOP;
    
    -- Workout의 total_weight와 total_sets 업데이트
    UPDATE workouts
    SET total_weight = total_weight_val,
        total_sets = total_sets_val
    WHERE id = workout_id_val;
    
  END LOOP;
  
  RAISE NOTICE '10일치 스쿼트 테스트 데이터 생성 완료!';
END $$;

-- 결과 확인
SELECT 
  w.name,
  w.start_time::DATE as workout_date,
  e.name as exercise_name,
  COUNT(s.id) as set_count,
  MAX(s.weight) as max_weight,
  SUM(s.weight * s.reps) as total_volume
FROM workouts w
JOIN exercises e ON e.workout_id = w.id
JOIN sets s ON s.exercise_id = e.id
WHERE e.name = '스쿼트'
  AND w.start_time >= '2026-01-09'
GROUP BY w.id, w.name, w.start_time::DATE, e.name
ORDER BY w.start_time::DATE;
