import { create } from 'zustand';
import { supabase } from '@/lib/supabase';

export interface DateAnalytics {
  date: string; // YYYY-MM-DD format
  maxWeight: number;
  totalVolume: number;
  totalSets: number;
}

export interface WorkoutAnalyticsData {
  [exerciseName: string]: DateAnalytics[];
}

interface AnalyticsRow {
  exercise_name: string;
  date: string; // ISO date string from database
  max_weight: number;
  total_volume: number;
  total_sets: number;
}

interface WorkoutAnalyticsStore {
  data: WorkoutAnalyticsData;
  isLoading: boolean;
  error: Error | null;
  fetchAnalytics: () => Promise<void>;
  refreshAnalytics: () => Promise<void>;
}

export const useWorkoutAnalyticsStore = create<WorkoutAnalyticsStore>((set, get) => {
  // Initialize event listeners
  if (typeof window !== 'undefined') {
    const handleWorkoutChange = () => {
      get().refreshAnalytics();
    };

    window.addEventListener('workoutSaved', handleWorkoutChange);
    window.addEventListener('workoutDeleted', handleWorkoutChange);
  }

  return {
    data: {},
    isLoading: true,
    error: null,

    fetchAnalytics: async () => {
      const { data } = get();
      
      // If we have cached data, use it
      if (Object.keys(data).length > 0) {
        set({ isLoading: false });
        return;
      }

      try {
        set({ isLoading: true, error: null });

        // Call RPC function to get aggregated data from database
        const { data: analyticsData, error: fetchError } = await supabase
          .rpc('get_workout_analytics');

        if (fetchError) throw fetchError;

        if (!analyticsData || analyticsData.length === 0) {
          set({ data: {}, isLoading: false });
          return;
        }

        // Transform database response to the expected format
        const analyticsMap: WorkoutAnalyticsData = {};

        (analyticsData as AnalyticsRow[]).forEach((row) => {
          const exerciseName = row.exercise_name;
          // Extract date from ISO string (YYYY-MM-DD)
          const date = row.date.split('T')[0];

          // Initialize exercise if not exists
          if (!analyticsMap[exerciseName]) {
            analyticsMap[exerciseName] = [];
          }

          // Add date entry (already aggregated by database)
          analyticsMap[exerciseName].push({
            date,
            maxWeight: Number(row.max_weight),
            totalVolume: Number(row.total_volume),
            totalSets: Number(row.total_sets),
          });
        });

        // Data is already sorted by database query, but ensure it's sorted
        Object.keys(analyticsMap).forEach((exerciseName) => {
          analyticsMap[exerciseName].sort((a, b) => a.date.localeCompare(b.date));
        });

        set({ data: analyticsMap, isLoading: false });
      } catch (err) {
        console.error('Error fetching workout analytics:', err);
        set({ 
          error: err instanceof Error ? err : new Error('Failed to fetch analytics'),
          isLoading: false 
        });
      }
    },

    refreshAnalytics: async () => {
      // Clear cache and fetch fresh data
      set({ data: {} });
      await get().fetchAnalytics();
    },
  };
});
