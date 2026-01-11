import { create } from 'zustand';
import { supabase } from '@/lib/supabase';
import { useUserStore } from './useUserStore';

interface HomeData {
  weeklyGoal: number | null;
  splitConfig: {
    split_count: number;
    split_order: string[];
  } | null;
  workoutNames: string[];
  weekWorkouts: Array<{
    start_time: string;
    name: string | null;
  }>;
  todayWorkout: {
    name: string | null;
  } | null;
  cachedDate: string; // YYYY-MM-DD format
}

interface HomeDataStore {
  homeData: HomeData | null;
  isLoading: boolean;
  fetchHomeData: () => Promise<void>;
  refreshHomeData: () => Promise<void>;
  clearHomeData: () => void;
}

// Get today's date in YYYY-MM-DD format
const getTodayDateString = () => {
  const today = new Date();
  return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
};

// Check if cache is still valid (same day)
const isCacheValid = (cachedDate: string): boolean => {
  return cachedDate === getTodayDateString();
};

// Get start and end of current week (Monday to Sunday)
const getWeekRange = () => {
  const now = new Date();
  const day = now.getDay();
  const diff = now.getDate() - day + (day === 0 ? -6 : 1);
  const monday = new Date(now);
  monday.setDate(diff);
  monday.setHours(0, 0, 0, 0);
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  sunday.setHours(23, 59, 59, 999);
  return { start: monday.toISOString(), end: sunday.toISOString() };
};

// Get today's date range
const getTodayRange = () => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  return { start: today.toISOString(), end: tomorrow.toISOString() };
};

export const useHomeDataStore = create<HomeDataStore>((set, get) => {
  let cachedUserId: string | null = null;

  // Initialize event listeners
  if (typeof window !== 'undefined') {
    const handleDataChange = () => {
      get().refreshHomeData();
    };

    window.addEventListener('workoutSaved', handleDataChange);
    window.addEventListener('homeDataChanged', handleDataChange);

    // Check date change every minute
    setInterval(() => {
      const { homeData } = get();
      if (homeData && !isCacheValid(homeData.cachedDate)) {
        get().refreshHomeData();
      }
    }, 60000);
  }

  return {
    homeData: null,
    isLoading: true,

    fetchHomeData: async () => {
      const { homeData } = get();
      
      // Get current user ID from cached store
      const userId = await useUserStore.getState().getUserId();

      // Check if cache is valid for the same user
      if (homeData && isCacheValid(homeData.cachedDate) && cachedUserId === userId) {
        set({ isLoading: false });
        return;
      }

      // Update cached user ID
      cachedUserId = userId;

      try {
        set({ isLoading: true });

        const { start: weekStart, end: weekEnd } = getWeekRange();
        const { start: todayStart, end: todayEnd } = getTodayRange();

        // Fetch all data in parallel - 3 API calls
        const [
          weeklyGoalResult,
          splitConfigResult,
          allWorkoutsResult,
        ] = await Promise.all([
          supabase
            .from("weekly_goals")
            .select("weekly_target")
            .eq("user_id", userId)
            .single(),

          supabase
            .from("split_config")
            .select("split_count, split_order")
            .eq("user_id", userId)
            .single(),

          supabase
            .from("workouts")
            .select("start_time, name")
            .eq("user_id", userId)
            .eq("is_disabled", false)
            .order("start_time", { ascending: false }),
        ]);

        // Process workouts client-side
        const allWorkouts = allWorkoutsResult.data ?? [];

        // Filter week workouts
        const weekWorkouts = allWorkouts.filter((w) => {
          const workoutTime = new Date(w.start_time);
          return workoutTime >= new Date(weekStart) && workoutTime <= new Date(weekEnd);
        });

        // Filter today's workout
        const todayWorkout = allWorkouts.find((w) => {
          const workoutTime = new Date(w.start_time);
          return workoutTime >= new Date(todayStart) && workoutTime < new Date(todayEnd);
        }) ?? null;

        // Extract unique workout names
        const workoutNames = Array.from(
          new Set(
            allWorkouts
              .map((w) => w.name)
              .filter(Boolean) as string[]
          )
        );

        const data: HomeData = {
          weeklyGoal: weeklyGoalResult.data?.weekly_target ?? null,
          splitConfig: splitConfigResult.data
            ? {
              split_count: splitConfigResult.data.split_count,
              split_order: (splitConfigResult.data.split_order as string[]) ?? [],
            }
            : null,
          workoutNames,
          weekWorkouts,
          todayWorkout,
          cachedDate: getTodayDateString(),
        };

        set({ homeData: data, isLoading: false });
      } catch (error) {
        console.error("Error fetching home data:", error);
        set({ isLoading: false });
      }
    },

    refreshHomeData: async () => {
      await get().fetchHomeData();
    },

    clearHomeData: () => {
      cachedUserId = null;
      set({ homeData: null, isLoading: false });
    },
  };
});
