import { create } from 'zustand';
import { useUserStore } from './useUserStore';
import { getExerciseHistory } from '@/services';

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
  historyCache: Map<string, ExerciseHistoryByWorkout[]>;
  currentExercise: string | null;
  isLoading: boolean;
  error: Error | null;
  fetchExerciseHistory: (exerciseName: string) => Promise<void>;
  clearHistory: () => void;
  clearCache: () => void;
}

export const useExerciseHistoryStore = create<ExerciseHistoryStore>((set, get) => {
  if (typeof window !== 'undefined') {
    const handleWorkoutChange = () => {
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

      if (currentExercise === exerciseName && historyCache.has(exerciseName)) {
        const cachedData = historyCache.get(exerciseName)!;
        set({ exerciseHistory: cachedData, isLoading: false });
        return;
      }

      if (historyCache.has(exerciseName)) {
        const cachedData = historyCache.get(exerciseName)!;
        set({ exerciseHistory: cachedData, currentExercise: exerciseName, isLoading: false });
        return;
      }

      try {
        set({ isLoading: true, error: null, currentExercise: exerciseName });

        const userId = await useUserStore.getState().getUserId();
        const history = await getExerciseHistory(userId, exerciseName);

        const newCache = new Map(historyCache);
        newCache.set(exerciseName, history);
        set({
          exerciseHistory: history,
          historyCache: newCache,
          isLoading: false,
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
      // Only clear cache, keep current display data
      set({ historyCache: new Map() });
    },
  };
});



