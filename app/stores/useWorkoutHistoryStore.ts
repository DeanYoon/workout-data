import { create } from 'zustand';
import { supabase } from '@/lib/supabase';
import { WorkoutWithDetails } from '@/types/workout';

interface WorkoutHistoryStore {
  historyWorkouts: WorkoutWithDetails[];
  isLoading: boolean;
  fetchWorkoutHistory: () => Promise<void>;
  refreshWorkoutHistory: () => Promise<void>;
}

export const useWorkoutHistoryStore = create<WorkoutHistoryStore>((set, get) => {
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

    fetchWorkoutHistory: async () => {
      const { historyWorkouts } = get();
      
      // If we have cached data, use it
      if (historyWorkouts.length > 0) {
        set({ isLoading: false });
        return;
      }

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

          set({ historyWorkouts: Array.from(uniqueWorkoutsMap.values()), isLoading: false });
        }
      } catch (error) {
        console.error("Error fetching workout history:", error);
        set({ isLoading: false });
      }
    },

    refreshWorkoutHistory: async () => {
      // Clear cache and fetch fresh data
      set({ historyWorkouts: [] });
      await get().fetchWorkoutHistory();
    },
  };
});
