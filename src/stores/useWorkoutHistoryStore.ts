import { create } from 'zustand';
import { WorkoutWithDetails } from '@/types/workout';
import { useUserStore } from './useUserStore';
import { getWorkoutsWithDetails } from '@/services';

interface WorkoutHistoryStore {
    historyWorkouts: WorkoutWithDetails[];
    isLoading: boolean;
    isLoaded: boolean;
    fetchWorkoutHistory: (forceRefresh?: boolean) => Promise<void>;
    refreshWorkoutHistory: () => Promise<void>;
    clearWorkoutHistory: () => void;
}

export const useWorkoutHistoryStore = create<WorkoutHistoryStore>((set, get) => {
    let cachedUserId: string | null = null;

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

        fetchWorkoutHistory: async (forceRefresh = false) => {
            const { historyWorkouts, isLoaded } = get();
            const userId = await useUserStore.getState().getUserId();

            // Skip if already loaded and not forcing refresh
            if (!forceRefresh && isLoaded && cachedUserId === userId) {
                set({ isLoading: false });
                return;
            }

            cachedUserId = userId;

            try {
                // Only show loading if no existing data
                if (historyWorkouts.length === 0) {
                    set({ isLoading: true });
                }

                const workouts = await getWorkoutsWithDetails(userId);

                const uniqueWorkoutsMap = new Map<string, WorkoutWithDetails>();
                workouts.forEach((workout) => {
                    const nameKey = workout.name ? workout.name.trim() : "Untitled";
                    if (!uniqueWorkoutsMap.has(nameKey)) {
                        uniqueWorkoutsMap.set(nameKey, workout);
                    }
                });

                set({
                    historyWorkouts: Array.from(uniqueWorkoutsMap.values()),
                    isLoading: false,
                    isLoaded: true,
                });
            } catch (error) {
                console.error("Error fetching workout history:", error);
                set({ isLoading: false, isLoaded: true });
            }
        },

        refreshWorkoutHistory: async () => {
            cachedUserId = null;
            // Don't clear existing data - fetch in background
            await get().fetchWorkoutHistory(true);
        },

        clearWorkoutHistory: () => {
            cachedUserId = null;
            set({ historyWorkouts: [], isLoading: false, isLoaded: false });
        },
    };
});



