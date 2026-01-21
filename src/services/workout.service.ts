import { supabase } from '@/lib/supabase';
import { WorkoutWithDetails } from '@/types/workout';

export interface SaveWorkoutData {
  id: string;
  userId: string;
  name: string;
  startTime: string;
  endTime: string;
  totalWeight: number;
  totalSets: number;
  exercises: Array<{
    id: string;
    name: string;
    sets: Array<{
      id: string;
      weight: number;
      reps: number;
      isCompleted: boolean;
    }>;
  }>;
}

/**
 * Fetch workout by name for a user
 */
export async function getWorkoutByName(
  userId: string,
  workoutName: string
): Promise<WorkoutWithDetails | null> {
  const { data, error } = await supabase
    .from('workouts')
    .select(`
      *,
      exercises (
        *,
        sets (*)
      )
    `)
    .eq('user_id', userId)
    .eq('is_disabled', false)
    .eq('name', workoutName)
    .order('start_time', { ascending: false })
    .limit(1);

  if (error) throw error;

  if (data && data.length > 0) {
    const workout = data[0] as any;
    return {
      ...workout,
      exercises: workout.exercises
        .sort((a: any, b: any) => a.order - b.order)
        .map((e: any) => ({
          ...e,
          sets: e.sets.sort((a: any, b: any) => a.order - b.order),
        })),
    };
  }

  return null;
}

/**
 * Fetch a single workout by id with exercises and sets
 */
export async function getWorkoutById(
  userId: string,
  workoutId: string
): Promise<WorkoutWithDetails | null> {
  const { data, error } = await supabase
    .from('workouts')
    .select(`
      *,
      exercises (
        *,
        sets (*)
      )
    `)
    .eq('id', workoutId)
    .eq('user_id', userId)
    .eq('is_disabled', false)
    .single();

  if (error || !data) return null;

  const w = data as any;
  return {
    ...w,
    exercises: (w.exercises || [])
      .sort((a: any, b: any) => a.order - b.order)
      .map((e: any) => ({
        ...e,
        sets: (e.sets || []).sort((a: any, b: any) => a.order - b.order),
      })),
  };
}

/**
 * Fetch all workouts with details for a user
 */
export async function getWorkoutsWithDetails(
  userId: string
): Promise<WorkoutWithDetails[]> {
  const { data, error } = await supabase
    .from('workouts')
    .select(`
      *,
      exercises (
        *,
        sets (*)
      )
    `)
    .eq('user_id', userId)
    .eq('is_disabled', false)
    .order('start_time', { ascending: false });

  if (error) throw error;

  if (data) {
    return data.map((w: any) => ({
      ...w,
      exercises: w.exercises
        .sort((a: any, b: any) => a.order - b.order)
        .map((e: any) => ({
          ...e,
          sets: e.sets.sort((a: any, b: any) => a.order - b.order),
        })),
    }));
  }

  return [];
}

/**
 * Save a complete workout with exercises and sets
 */
export async function saveWorkout(data: SaveWorkoutData): Promise<void> {
  const { error: workoutError } = await supabase.from('workouts').insert({
    id: data.id,
    user_id: data.userId,
    name: data.name,
    start_time: data.startTime,
    end_time: data.endTime,
    total_weight: data.totalWeight,
    total_sets: data.totalSets,
  });

  if (workoutError) throw workoutError;

  for (let i = 0; i < data.exercises.length; i++) {
    const ex = data.exercises[i];

    const { error: exError } = await supabase.from('exercises').insert({
      id: ex.id,
      workout_id: data.id,
      user_id: data.userId,
      name: ex.name,
      order: i,
    });

    if (exError) throw exError;

    const setsToInsert = ex.sets.map((set, setIndex) => ({
      id: set.id,
      exercise_id: ex.id,
      user_id: data.userId,
      weight: set.weight,
      reps: set.reps,
      is_completed: set.isCompleted,
      order: setIndex,
    }));

    if (setsToInsert.length > 0) {
      const { error: setsError } = await supabase.from('sets').insert(setsToInsert);
      if (setsError) throw setsError;
    }
  }
}

/**
 * Soft delete a workout
 */
export async function deleteWorkout(workoutId: string): Promise<void> {
  const { error } = await supabase
    .from('workouts')
    .update({ is_disabled: true })
    .eq('id', workoutId);

  if (error) throw error;
}

export interface RecentWorkoutWithExercises {
  id: string;
  start_time: string;
  exercises: Array<{
    id: string;
    name: string;
    order: number;
    sets: Array<{ weight: number; reps: number; order: number }>;
  }> | null;
}

/**
 * Get recent workouts with exercises for loading previous sets
 */
export async function getRecentWorkoutsWithExercises(
  userId: string,
  limit: number = 20
): Promise<RecentWorkoutWithExercises[]> {
  const { data, error } = await supabase
    .from('workouts')
    .select(`
      id,
      start_time,
      exercises (
        id,
        name,
        order,
        sets (
          weight,
          reps,
          order
        )
      )
    `)
    .eq('user_id', userId)
    .eq('is_disabled', false)
    .order('start_time', { ascending: false })
    .limit(limit);

  if (error) throw error;
  return (data || []) as RecentWorkoutWithExercises[];
}

/**
 * Get workout for a specific date
 */
export async function getWorkoutForDate(
  userId: string,
  date: Date
): Promise<WorkoutWithDetails | null> {
  const startOfDay = new Date(date);
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date(date);
  endOfDay.setHours(23, 59, 59, 999);

  const { data, error } = await supabase
    .from('workouts')
    .select(`
      *,
      exercises (
        *,
        sets (*)
      )
    `)
    .eq('user_id', userId)
    .eq('is_disabled', false)
    .gte('start_time', startOfDay.toISOString())
    .lte('start_time', endOfDay.toISOString())
    .order('start_time', { ascending: false })
    .limit(1);

  if (error) throw error;

  if (data && data.length > 0) {
    const workout = data[0] as any;
    return {
      ...workout,
      exercises: workout.exercises
        .sort((a: any, b: any) => a.order - b.order)
        .map((e: any) => ({
          ...e,
          sets: e.sets.sort((a: any, b: any) => a.order - b.order),
        })),
    };
  }

  return null;
}

/**
 * Get unique exercise names for a user
 */
export async function getExerciseNames(userId: string): Promise<string[]> {
  const { data, error } = await supabase
    .from('exercises')
    .select(`
      name,
      workouts!left (
        is_disabled
      )
    `)
    .eq('user_id', userId);

  if (error) throw error;

  if (data) {
    const filtered = data.filter((row: any) => {
      const workout = row.workouts as { is_disabled: boolean } | null | undefined;
      return workout == null || workout.is_disabled === false;
    });

    const nameSet = new Set<string>();
    filtered.forEach((row: any) => {
      if (row.name) {
        nameSet.add(row.name);
      }
    });

    return Array.from(nameSet).sort();
  }

  return [];
}



