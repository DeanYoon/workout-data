import { create } from 'zustand';
import { supabase } from '@/lib/supabase';

export interface ExerciseSetHistory {
    workoutId: string;
    workoutDate: string;
    setOrder: number;
    weight: number;
    reps: number;
}

export interface ExerciseHistoryByWorkout {
    workoutId: string;
    workoutDate: string;
    sets: Array<{
        order: number;
        weight: number;
        reps: number;
    }>;
}

interface ExerciseHistoryStore {
    exerciseHistory: ExerciseHistoryByWorkout[];
    isLoading: boolean;
    error: Error | null;
    fetchExerciseHistory: (exerciseName: string) => Promise<void>;
    clearHistory: () => void;
}

export const useExerciseHistoryStore = create<ExerciseHistoryStore>((set, get) => {
    return {
        exerciseHistory: [],
        isLoading: false,
        error: null,

        fetchExerciseHistory: async (exerciseName: string) => {
            try {
                set({ isLoading: true, error: null });

                const { data: { user } } = await supabase.auth.getUser();
                const userId = user?.id || "anon_user";

                // First, get all workouts with exercises and sets
                const { data: workoutsData, error: workoutsError } = await supabase
                    .from("workouts")
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
                order
              )
            )
          `)
                    .eq("user_id", userId)
                    .eq("is_disabled", false)
                    .order("start_time", { ascending: false })
                    .limit(20); // Get more to filter client-side

                if (workoutsError) throw workoutsError;

                // Filter workouts that contain the selected exercise
                const data = workoutsData?.filter((workout: any) => {
                    return workout.exercises?.some((ex: any) => ex.name === exerciseName);
                }).slice(0, 5) || [];

                if (!data || data.length === 0) {
                    set({ exerciseHistory: [], isLoading: false });
                    return;
                }

                // Transform data to our format
                const history: ExerciseHistoryByWorkout[] = data.map((workout: any) => {
                    // Find the exercise (should only be one since we filtered by name)
                    const exercise = workout.exercises.find((e: any) => e.name === exerciseName);

                    if (!exercise || !exercise.sets || exercise.sets.length === 0) {
                        return null;
                    }

                    // Sort sets by order
                    const sortedSets = exercise.sets.sort((a: any, b: any) => a.order - b.order);

                    return {
                        workoutId: workout.id,
                        workoutDate: workout.start_time,
                        sets: sortedSets.map((set: any) => ({
                            order: set.order,
                            weight: set.weight,
                            reps: set.reps,
                        })),
                    };
                }).filter(Boolean) as ExerciseHistoryByWorkout[];

                set({ exerciseHistory: history, isLoading: false });
            } catch (err) {
                console.error('Error fetching exercise history:', err);
                set({
                    error: err instanceof Error ? err : new Error('Failed to fetch exercise history'),
                    isLoading: false,
                });
            }
        },

        clearHistory: () => {
            set({ exerciseHistory: [], error: null });
        },
    };
});
