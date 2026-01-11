'use client';

import { useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { useWorkoutHistoryStore } from '@/app/stores/useWorkoutHistoryStore';
import { useWorkoutAnalyticsStore } from '@/app/stores/useWorkoutAnalyticsStore';
import { useExerciseHistoryStore } from '@/app/stores/useExerciseHistoryStore';
import { useHomeDataStore } from '@/app/stores/useHomeDataStore';
import { useProfileStore } from '@/app/stores/useProfileStore';
import { useUserStore } from '@/app/stores/useUserStore';

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const clearWorkoutHistory = useWorkoutHistoryStore((state) => state.clearWorkoutHistory);
    const clearAnalytics = useWorkoutAnalyticsStore((state) => state.clearAnalytics);
    const clearExerciseCache = useExerciseHistoryStore((state) => state.clearCache);
    const clearHomeData = useHomeDataStore((state) => state.clearHomeData);
    const clearProfile = useProfileStore((state) => state.clearProfile);
    const fetchWorkoutHistory = useWorkoutHistoryStore((state) => state.fetchWorkoutHistory);
    const fetchAnalytics = useWorkoutAnalyticsStore((state) => state.fetchAnalytics);
    const fetchHomeData = useHomeDataStore((state) => state.fetchHomeData);
    const refreshProfile = useProfileStore((state) => state.refreshProfile);

    const previousUserIdRef = useRef<string | null>(null);

    useEffect(() => {
        const {
            data: { subscription },
        } = supabase.auth.onAuthStateChange(async (event, session) => {
            const currentUserId = session?.user?.id || 'anon_user';
            const previousUserId = previousUserIdRef.current;

            // Only handle SIGNED_IN and SIGNED_OUT events
            if (event === 'SIGNED_OUT') {
                // Clear all caches on logout
                clearWorkoutHistory();
                clearAnalytics();
                clearExerciseCache();
                clearHomeData();
                clearProfile();
                useUserStore.getState().clearUser();
                previousUserIdRef.current = null;
            } else if (event === 'SIGNED_IN' && previousUserId !== currentUserId) {
                // Only fetch if user changed (new login or different user)
                // Don't refresh if it's the same user (e.g., page reload)
                if (previousUserId !== null) {
                    // User changed, clear old data first
                    clearWorkoutHistory();
                    clearAnalytics();
                    clearExerciseCache();
                    clearHomeData();
                    clearProfile();
                }
                // Fetch new user's data
                await Promise.all([
                    fetchWorkoutHistory(),
                    fetchAnalytics(),
                    fetchHomeData(),
                    refreshProfile(),
                ]);
                previousUserIdRef.current = currentUserId;
            } else if (event === 'TOKEN_REFRESHED' && previousUserId === currentUserId) {
                // Token refreshed but same user, don't refetch
                return;
            }
        });

        // Initialize: get current user and set ref
        supabase.auth.getUser().then(({ data: { user } }) => {
            previousUserIdRef.current = user?.id || 'anon_user';
        });

        return () => subscription.unsubscribe();
    }, [
        clearWorkoutHistory,
        clearAnalytics,
        clearExerciseCache,
        clearHomeData,
        clearProfile,
        fetchWorkoutHistory,
        fetchAnalytics,
        fetchHomeData,
        refreshProfile,
    ]);

    return <>{children}</>;
}
