import { supabase } from '@/lib/supabase';
import { getAnonUserWorkouts } from '@/data/anonUserData';

export interface AnalyticsRow {
  exercise_name: string;
  date: string;
  max_weight: number;
  max_volume: number;
  total_volume: number;
}

/**
 * Fetch workout analytics using RPC function
 */
export async function getWorkoutAnalytics(userId?: string): Promise<AnalyticsRow[]> {
  if (userId === 'anon_user') {
    const workouts = getAnonUserWorkouts();
    const analyticsMap = new Map<string, AnalyticsRow>();
    
    workouts.forEach((workout) => {
      const date = workout.start_time.split('T')[0];
      workout.exercises.forEach((exercise) => {
        const completedSets = exercise.sets.filter((s) => s.is_completed);
        if (completedSets.length === 0) return;
        
        const maxWeight = Math.max(...completedSets.map((s) => s.weight));
        const totalVolume = completedSets.reduce((sum, s) => sum + s.weight * s.reps, 0);
        const maxVolume = Math.max(...completedSets.map((s) => s.weight * s.reps));
        
        const key = `${exercise.name}_${date}`;
        const existing = analyticsMap.get(key);
        
        if (!existing || maxWeight > existing.max_weight) {
          analyticsMap.set(key, {
            exercise_name: exercise.name,
            date,
            max_weight: maxWeight,
            max_volume: maxVolume,
            total_volume: existing ? existing.total_volume + totalVolume : totalVolume,
          });
        } else {
          existing.total_volume += totalVolume;
        }
      });
    });
    
    return Array.from(analyticsMap.values());
  }

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
  if (userId === 'anon_user') {
    const workouts = getAnonUserWorkouts();
    const filteredWorkouts = workouts
      .filter((workout) =>
        workout.exercises.some((ex) => ex.name === exerciseName)
      )
      .slice(0, limit);

    return filteredWorkouts
      .map((workout) => {
        const exercise = workout.exercises.find((e) => e.name === exerciseName);
        const completedSets = (exercise?.sets || []).filter((s) => s.is_completed === true);
        const sortedSets = completedSets.sort((a, b) => a.order - b.order);
        if (sortedSets.length === 0) return null;
        return {
          workoutId: workout.id,
          workoutDate: workout.start_time,
          sets: sortedSets.map((set) => ({
            order: set.order,
            weight: set.weight,
            reps: set.reps,
          })),
        };
      })
      .filter((x): x is NonNullable<typeof x> => x != null);
  }

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



