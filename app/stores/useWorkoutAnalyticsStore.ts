import { create } from 'zustand';
import { supabase } from '@/lib/supabase';
import { useUserStore } from './useUserStore';

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
  isLoaded: boolean; // Whether data has been loaded at least once
  fetchAnalytics: () => Promise<void>;
  refreshAnalytics: () => Promise<void>;
  clearAnalytics: () => void;
}

export const useWorkoutAnalyticsStore = create<WorkoutAnalyticsStore>((set, get) => {
  let cachedUserId: string | null = null;

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
    isLoaded: false,

    fetchAnalytics: async () => {
      const { data, isLoaded } = get();

      // Get current user ID from cached store
      const userId = await useUserStore.getState().getUserId();

      // If we have cached data for the same user, use it
      if (isLoaded && Object.keys(data).length > 0 && cachedUserId === userId) {
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
        set({ isLoading: true, error: null });

        // Call RPC function to get aggregated data from database
        // RPC function filters by auth.uid() or 'anon_user' automatically
        const { data: analyticsData, error: fetchError } = await supabase
          .rpc('get_workout_analytics');

        if (fetchError) throw fetchError;

        if (!analyticsData || analyticsData.length === 0) {
          set({ data: {}, isLoading: false, isLoaded: true });
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

        set({ data: analyticsMap, isLoading: false, isLoaded: true });
      } catch (err) {
        console.error('Error fetching workout analytics:', err);
        set({
          error: err instanceof Error ? err : new Error('Failed to fetch analytics'),
          isLoading: false,
          isLoaded: true
        });
      }
    },

    refreshAnalytics: async () => {
      // Clear cache and fetch fresh data
      set({ data: {} });
      await get().fetchAnalytics();
    },

    clearAnalytics: () => {
      cachedUserId = null;
      set({ data: {}, isLoading: false, error: null, isLoaded: false });
    },
  };
});
