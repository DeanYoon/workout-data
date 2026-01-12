import { create } from 'zustand';
import { supabase } from '@/lib/supabase';
import { WorkoutWithDetails } from '@/types/workout';
import { useUserStore } from './useUserStore';

interface WorkoutHistoryStore {
  historyWorkouts: WorkoutWithDetails[];
  isLoading: boolean;
  isLoaded: boolean; // Whether data has been loaded at least once
  fetchWorkoutHistory: () => Promise<void>;
  refreshWorkoutHistory: () => Promise<void>;
  clearWorkoutHistory: () => void;
}

export const useWorkoutHistoryStore = create<WorkoutHistoryStore>((set, get) => {
  let cachedUserId: string | null = null;

  // Initialize event listeners
  if (typeof window !== 'undefined') {
    const handleWorkoutChange = () => {
      get().refreshWorkoutHistory();
    };

    window.addEventListener('workoutSaved', handleWorkoutChange);
    window.addEventListener('workoutDeleted', handleWorkoutChange);
  }

  return {
    historyWorkouts: [],
    isLoading: true,
    isLoaded: false,

    fetchWorkoutHistory: async () => {
      const { historyWorkouts, isLoaded } = get();
      
      // Get current user ID from cached store
      const userId = await useUserStore.getState().getUserId();

      // If we have cached data for the same user, use it
      if (isLoaded && historyWorkouts.length > 0 && cachedUserId === userId) {
        set({ isLoading: false });
        return;
      }

      // If no data but already loaded (empty result), don't fetch again
      if (isLoaded && cachedUserId === userId) {
        set({ isLoading: false });
        return;
      }

      // Update cached user ID
      cachedUserId = userId;

      try {
        set({ isLoading: true });

        const { data, error } = await supabase
          .from("workouts")
          .select(`
            *,
            exercises (
              *,
              sets (*)
            )
          `)
          .eq("user_id", userId)
          .eq("is_disabled", false)
          .order("start_time", { ascending: false });

        if (error) throw error;

        if (data) {
          const formattedData = data.map((w: any) => ({
            ...w,
            exercises: w.exercises
              .sort((a: any, b: any) => a.order - b.order)
              .map((e: any) => ({
                ...e,
                sets: e.sets.sort((a: any, b: any) => a.order - b.order)
              }))
          }));

          const uniqueWorkoutsMap = new Map<string, WorkoutWithDetails>();

          formattedData.forEach((workout: WorkoutWithDetails) => {
            const nameKey = workout.name ? workout.name.trim() : "Untitled";
            if (!uniqueWorkoutsMap.has(nameKey)) {
              uniqueWorkoutsMap.set(nameKey, workout);
            }
          });

          set({ historyWorkouts: Array.from(uniqueWorkoutsMap.values()), isLoading: false, isLoaded: true });
        } else {
          set({ historyWorkouts: [], isLoading: false, isLoaded: true });
        }
      } catch (error) {
        console.error("Error fetching workout history:", error);
        set({ isLoading: false, isLoaded: true });
      }
    },

    refreshWorkoutHistory: async () => {
      // Clear cache and fetch fresh data from server
      cachedUserId = null;
      set({ historyWorkouts: [], isLoaded: false });
      await get().fetchWorkoutHistory();
    },

    clearWorkoutHistory: () => {
      cachedUserId = null;
      set({ historyWorkouts: [], isLoading: false, isLoaded: false });
    },
  };
});
