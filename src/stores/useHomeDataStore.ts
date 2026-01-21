import { create } from 'zustand';
import { useUserStore } from './useUserStore';
import { getTodayDateString, isCacheValid, getWeekRange, getTodayRange } from '@/utils';
import { getWeeklyGoal, getSplitConfig, getAllWorkouts, getWorkoutById, type WorkoutSummary } from '@/services';
import type { WorkoutWithDetails } from '@/types/workout';

interface HomeData {
    weeklyGoal: number | null;
    splitConfig: {
        split_count: number;
        split_order: string[];
    } | null;
    workoutNames: string[];
    weekWorkouts: WorkoutSummary[];
    allWorkouts: WorkoutSummary[];
    todayWorkout: WorkoutSummary | null;
    todayWorkoutDetail: WorkoutWithDetails | null;
    cachedDate: string;
}

interface HomeDataStore {
    homeData: HomeData | null;
    isLoading: boolean;
    fetchHomeData: (forceRefresh?: boolean) => Promise<void>;
    refreshHomeData: () => Promise<void>;
    clearHomeData: () => void;
}

export const useHomeDataStore = create<HomeDataStore>((set, get) => {
    let cachedUserId: string | null = null;

    if (typeof window !== 'undefined') {
        const handleDataChange = () => {
            get().refreshHomeData();
        };

        window.addEventListener('workoutSaved', handleDataChange);
        window.addEventListener('homeDataChanged', handleDataChange);

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

        fetchHomeData: async (forceRefresh = false) => {
            const { homeData } = get();
            const userId = await useUserStore.getState().getUserId();

            // Skip if cache is valid and not forcing refresh
            if (!forceRefresh && homeData && isCacheValid(homeData.cachedDate) && cachedUserId === userId) {
                set({ isLoading: false });
                return;
            }

            cachedUserId = userId;

            try {
                // Only show loading if no existing data
                if (!homeData) {
                    set({ isLoading: true });
                }

                const { start: weekStart, end: weekEnd } = getWeekRange();
                const { start: todayStart, end: todayEnd } = getTodayRange();

                const [weeklyGoal, splitConfig, allWorkouts] = await Promise.all([
                    getWeeklyGoal(userId).catch(() => null),
                    getSplitConfig(userId).catch(() => null),
                    getAllWorkouts(userId),
                ]);

                const weekWorkouts = allWorkouts.filter((w) => {
                    const workoutTime = new Date(w.start_time);
                    return workoutTime >= new Date(weekStart) && workoutTime <= new Date(weekEnd);
                });

                const todayWorkout = allWorkouts.find((w) => {
                    const workoutTime = new Date(w.start_time);
                    return workoutTime >= new Date(todayStart) && workoutTime < new Date(todayEnd);
                }) ?? null;

                let todayWorkoutDetail: WorkoutWithDetails | null = null;
                if (todayWorkout) {
                    todayWorkoutDetail = await getWorkoutById(userId, todayWorkout.id).catch(() => null);
                }

                const workoutNames = Array.from(
                    new Set(allWorkouts.map((w) => w.name).filter(Boolean) as string[])
                );

                const data: HomeData = {
                    weeklyGoal,
                    splitConfig,
                    workoutNames,
                    weekWorkouts,
                    allWorkouts,
                    todayWorkout,
                    todayWorkoutDetail,
                    cachedDate: getTodayDateString(),
                };

                set({ homeData: data, isLoading: false });
            } catch (error) {
                console.error("Error fetching home data:", error);
                set({ isLoading: false });
            }
        },

        refreshHomeData: async () => {
            cachedUserId = null;
            // Don't clear existing data - fetch in background
            await get().fetchHomeData(true);
        },

        clearHomeData: () => {
            cachedUserId = null;
            set({ homeData: null, isLoading: false });
        },
    };
});



