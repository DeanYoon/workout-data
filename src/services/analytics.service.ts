import { supabase } from '@/lib/supabase';

export interface AnalyticsRow {
    exercise_name: string;
    date: string;
    max_weight: number;
    total_volume: number;
    total_sets: number;
}

/**
 * Fetch workout analytics using RPC function
 */
export async function getWorkoutAnalytics(): Promise<AnalyticsRow[]> {
    const { data, error } = await supabase.rpc('get_workout_analytics');

    if (error) throw error;
    return data || [];
}

/**
 * 특정 운동의 이력을 조회한다.
 * sets 중 is_completed === true 인 세트만 포함한다 (실제 수행 완료한 세트만).
 *
 * @param userId - 사용자 ID
 * @param exerciseName - 운동 이름
 * @param limit - 반환할 워크아웃 수 (기본 5, DB 조회는 20건)
 * @returns 워크아웃별 { workoutId, workoutDate, sets } (completed 세트만)
 */
export async function getExerciseHistory(
    userId: string,
    exerciseName: string,
    limit: number = 5
) {
    const { data: workoutsData, error } = await supabase
        .from('workouts')
        .select(`
      id,
      start_time,
      exercises (
        id,
        name,
        order,
        sets (
          id,
          weight,
          reps,
          order,
          is_completed
        )
      )
    `)
        .eq('user_id', userId)
        .eq('is_disabled', false)
        .order('start_time', { ascending: false })
        .limit(20);

    if (error) throw error;

    // 선택한 운동이 포함된 워크아웃만 남기고 limit 까지 자른다
    const filteredWorkouts = workoutsData
        ?.filter((workout: any) =>
            workout.exercises?.some((ex: any) => ex.name === exerciseName)
        )
        .slice(0, limit) || [];

    return filteredWorkouts
        .map((workout: any) => {
            const exercise = workout.exercises.find((e: any) => e.name === exerciseName);
            // is_completed === true 인 세트만 사용 (미완료·미체크는 제외)
            const completedSets = (exercise?.sets || []).filter((s: any) => s.is_completed === true);
            const sortedSets = completedSets.sort((a: any, b: any) => a.order - b.order);
            // 완료 세트가 하나도 없으면 이력에 포함하지 않음 (빈 컬럼 방지)
            if (sortedSets.length === 0) return null;
            return {
                workoutId: workout.id,
                workoutDate: workout.start_time,
                sets: sortedSets.map((set: any) => ({
                    order: set.order,
                    weight: set.weight,
                    reps: set.reps,
                })),
            };
        })
        .filter((x): x is NonNullable<typeof x> => x != null);
}



