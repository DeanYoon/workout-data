'use client';

import { useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import {
  useWorkoutHistoryStore,
  useWorkoutAnalyticsStore,
  useExerciseHistoryStore,
  useHomeDataStore,
  useProfileStore,
  useUserStore,
} from '@/stores';

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

      if (event === 'SIGNED_OUT') {
        clearWorkoutHistory();
        clearAnalytics();
        clearExerciseCache();
        clearHomeData();
        clearProfile();
        useUserStore.getState().clearUser();
        previousUserIdRef.current = null;
      } else if (event === 'SIGNED_IN' && previousUserId !== currentUserId) {
        if (previousUserId !== null) {
          clearWorkoutHistory();
          clearAnalytics();
          clearExerciseCache();
          clearHomeData();
          clearProfile();
        }
        await Promise.all([
          fetchWorkoutHistory(),
          fetchAnalytics(),
          fetchHomeData(),
          refreshProfile(),
        ]);
        previousUserIdRef.current = currentUserId;
      } else if (event === 'TOKEN_REFRESHED' && previousUserId === currentUserId) {
        return;
      }
    });

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



