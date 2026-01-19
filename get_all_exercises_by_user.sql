-- 특정 계정 ID로 모든 운동 리스트 추출 쿼리
-- user_id를 'xxxxxxxxx'로 변경하여 사용하세요

-- 방법 1: exercises 테이블에서 직접 조회 (가장 간단)
SELECT DISTINCT 
    e.name AS exercise_name,
    COUNT(DISTINCT e.workout_id) AS workout_count,
    COUNT(DISTINCT s.id) AS total_sets,
    COUNT(DISTINCT CASE WHEN s.is_completed = true THEN s.id END) AS completed_sets,
    MAX(w.start_time) AS last_workout_date
FROM exercises e
LEFT JOIN sets s ON e.id = s.exercise_id
LEFT JOIN workouts w ON e.workout_id = w.id
WHERE e.user_id = 'xxxxxxxxx'  -- 여기에 계정 ID 입력
  AND (w.is_disabled = false OR w.is_disabled IS NULL)
GROUP BY e.name
ORDER BY e.name;

-- 방법 2: workouts를 JOIN해서 is_disabled 필터링 (더 정확)
SELECT DISTINCT 
    e.name AS exercise_name,
    COUNT(DISTINCT e.workout_id) AS workout_count,
    COUNT(DISTINCT s.id) AS total_sets,
    COUNT(DISTINCT CASE WHEN s.is_completed = true THEN s.id END) AS completed_sets,
    MAX(w.start_time) AS last_workout_date
FROM exercises e
INNER JOIN workouts w ON e.workout_id = w.id
LEFT JOIN sets s ON e.id = s.exercise_id
WHERE e.user_id = 'xxxxxxxxx'  -- 여기에 계정 ID 입력
  AND w.is_disabled = false
GROUP BY e.name
ORDER BY e.name;

-- 방법 3: 완료된 세트가 있는 운동만 (Data 페이지와 동일한 로직)
SELECT DISTINCT 
    e.name AS exercise_name,
    COUNT(DISTINCT e.workout_id) AS workout_count,
    COUNT(DISTINCT s.id) AS completed_sets,
    MAX(w.start_time) AS last_workout_date
FROM exercises e
INNER JOIN workouts w ON e.workout_id = w.id
INNER JOIN sets s ON e.id = s.exercise_id
WHERE e.user_id = 'xxxxxxxxx'  -- 여기에 계정 ID 입력
  AND w.is_disabled = false
  AND s.is_completed = true
GROUP BY e.name
ORDER BY e.name;

-- 방법 4: 가장 간단한 버전 (운동 이름만)
SELECT DISTINCT e.name AS exercise_name
FROM exercises e
INNER JOIN workouts w ON e.workout_id = w.id
WHERE e.user_id = 'xxxxxxxxx'  -- 여기에 계정 ID 입력
  AND w.is_disabled = false
ORDER BY e.name;

-- 방법 5: Supabase 클라이언트에서 사용할 수 있는 쿼리 (TypeScript/JavaScript)
/*
const userId = 'xxxxxxxxx';  // 계정 ID

// Supabase 쿼리
const { data, error } = await supabase
  .from('exercises')
  .select(`
    name,
    workouts!inner (
      user_id,
      is_disabled
    )
  `)
  .eq('user_id', userId)
  .eq('workouts.is_disabled', false);

// 고유한 운동 이름 추출
const uniqueExercises = Array.from(
  new Set(data?.map(e => e.name).filter(Boolean))
).sort();
*/
