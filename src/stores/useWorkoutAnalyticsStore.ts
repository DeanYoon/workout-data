import { create } from 'zustand';
import { useUserStore } from './useUserStore';
import { getWorkoutAnalytics, type AnalyticsRow } from '@/services';

export interface DateAnalytics {
  date: string;
  maxWeight: number;
  maxVolume: number;
  totalVolume: number;
}

export interface WorkoutAnalyticsData {
  [exerciseName: string]: DateAnalytics[];
}

interface WorkoutAnalyticsStore {
  data: WorkoutAnalyticsData;
  isLoading: boolean;
  error: Error | null;
  isLoaded: boolean;
  fetchAnalytics: (forceRefresh?: boolean) => Promise<void>;
  refreshAnalytics: () => Promise<void>;
  clearAnalytics: () => void;
}

export const useWorkoutAnalyticsStore = create<WorkoutAnalyticsStore>((set, get) => {
  let cachedUserId: string | null = null;

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

    fetchAnalytics: async (forceRefresh = false) => {
      const { data, isLoaded } = get();
      const userId = await useUserStore.getState().getUserId();

      // Skip if already loaded and not forcing refresh
      if (!forceRefresh && isLoaded && cachedUserId === userId) {
        set({ isLoading: false });
        return;
      }

      cachedUserId = userId;

      try {
        // Only show loading if no existing data
        if (Object.keys(data).length === 0) {
          set({ isLoading: true, error: null });
        }

        const analyticsData = await getWorkoutAnalytics(userId);

        if (!analyticsData || analyticsData.length === 0) {
          set({ data: {}, isLoading: false, isLoaded: true });
          return;
        }

        const analyticsMap: WorkoutAnalyticsData = {};

        analyticsData.forEach((row: AnalyticsRow) => {
          const exerciseName = row.exercise_name;
          const date = row.date.split('T')[0];

          if (!analyticsMap[exerciseName]) {
            analyticsMap[exerciseName] = [];
          }

          analyticsMap[exerciseName].push({
            date,
            maxWeight: Number(row.max_weight),
            maxVolume: Number(row.max_volume),
            totalVolume: Number(row.total_volume),
          });
        });

        Object.keys(analyticsMap).forEach((exerciseName) => {
          analyticsMap[exerciseName].sort((a, b) => a.date.localeCompare(b.date));
        });

        set({ data: analyticsMap, isLoading: false, isLoaded: true });
      } catch (err) {
        console.error('Error fetching workout analytics:', err);
        set({
          error: err instanceof Error ? err : new Error('Failed to fetch analytics'),
          isLoading: false,
          isLoaded: true,
        });
      }
    },

    refreshAnalytics: async () => {
      cachedUserId = null;
      // Don't clear existing data - fetch in background
      await get().fetchAnalytics(true);
    },

    clearAnalytics: () => {
      cachedUserId = null;
      set({ data: {}, isLoading: false, error: null, isLoaded: false });
    },
  };
});



