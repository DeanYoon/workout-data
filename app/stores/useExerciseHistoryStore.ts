import { create } from 'zustand';
import { supabase } from '@/lib/supabase';
import { useUserStore } from './useUserStore';

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
    historyCache: Map<string, ExerciseHistoryByWorkout[]>; // Cache by exercise name
    currentExercise: string | null; // Currently displayed exercise
    isLoading: boolean;
    error: Error | null;
    fetchExerciseHistory: (exerciseName: string) => Promise<void>;
    clearHistory: () => void;
    clearCache: () => void;
}

export const useExerciseHistoryStore = create<ExerciseHistoryStore>((set, get) => {
    // Initialize event listeners for cache invalidation
    if (typeof window !== 'undefined') {
        const handleWorkoutChange = () => {
            // Clear cache when workout is saved or deleted
            get().clearCache();
        };

        window.addEventListener('workoutSaved', handleWorkoutChange);
        window.addEventListener('workoutDeleted', handleWorkoutChange);
    }

    return {
        exerciseHistory: [],
        historyCache: new Map(),
        currentExercise: null,
        isLoading: false,
        error: null,

        fetchExerciseHistory: async (exerciseName: string) => {
            const { historyCache, currentExercise } = get();

            // If same exercise is already displayed and cached, use cache
            if (currentExercise === exerciseName && historyCache.has(exerciseName)) {
                const cachedData = historyCache.get(exerciseName)!;
                set({ exerciseHistory: cachedData, isLoading: false });
                return;
            }

            // If different exercise but cached, use cache immediately and fetch in background
            if (historyCache.has(exerciseName)) {
                const cachedData = historyCache.get(exerciseName)!;
                set({ exerciseHistory: cachedData, currentExercise: exerciseName, isLoading: false });
                // Optionally refresh in background, but for now just use cache
                return;
            }

            try {
                set({ isLoading: true, error: null, currentExercise: exerciseName });

                // Get current user ID from cached store
                const userId = await useUserStore.getState().getUserId();

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

                // Update cache and state
                const newCache = new Map(historyCache);
                newCache.set(exerciseName, history);
                set({
                    exerciseHistory: history,
                    historyCache: newCache,
                    isLoading: false
                });
            } catch (err) {
                console.error('Error fetching exercise history:', err);
                set({
                    error: err instanceof Error ? err : new Error('Failed to fetch exercise history'),
                    isLoading: false,
                });
            }
        },

        clearHistory: () => {
            set({ exerciseHistory: [], currentExercise: null, error: null });
        },

        clearCache: () => {
            set({ historyCache: new Map(), exerciseHistory: [], currentExercise: null });
        },
    };
});
