import { create } from 'zustand';
import { supabase } from '@/lib/supabase';
import { UserProfile, WeightRecord } from '@/types/workout';
import { useUserStore } from './useUserStore';

interface ProfileStore {
  profile: UserProfile | null;
  weightRecords: WeightRecord[];
  isLoading: boolean;
  isSaving: boolean;
  error: Error | null;
  isProfileLoaded: boolean; // Whether profile has been loaded at least once
  isWeightRecordsLoaded: boolean; // Whether weight records have been loaded at least once
  fetchProfile: () => Promise<void>;
  updateProfile: (updates: Partial<UserProfile>) => Promise<void>;
  fetchWeightRecords: (force?: boolean) => Promise<void>;
  addWeightRecord: (weight: number, recordedAt?: string) => Promise<void>;
  refreshProfile: () => Promise<void>;
  clearProfile: () => void;
}

export const useProfileStore = create<ProfileStore>((set, get) => {
  let cachedProfileUserId: string | null = null;
  let cachedWeightRecordsUserId: string | null = null;

  return {
    profile: null,
    weightRecords: [],
    isLoading: false,
    isSaving: false,
    error: null,
    isProfileLoaded: false,
    isWeightRecordsLoaded: false,

    fetchProfile: async () => {
      const { profile, isProfileLoaded } = get();

      // Get current user ID from cached store
      const userId = await useUserStore.getState().getUserId();

      // If we have cached data for the same user, use it
      if (isProfileLoaded && profile !== null && cachedProfileUserId === userId) {
        set({ isLoading: false });
        return;
      }

      // If already loaded (even if null) for same user, don't fetch again
      if (isProfileLoaded && cachedProfileUserId === userId) {
        set({ isLoading: false });
        return;
      }

      // Update cached user ID
      cachedProfileUserId = userId;

      try {
        set({ isLoading: true, error: null });

        const { data, error } = await supabase
          .from("user_profiles")
          .select("*")
          .eq("user_id", userId)
          .single();

        if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
          throw error;
        }

        set({ profile: data || null, isLoading: false, isProfileLoaded: true });
      } catch (error) {
        console.error("Error fetching profile:", error);
        set({ error: error as Error, isLoading: false, isProfileLoaded: true });
      }
    },

    updateProfile: async (updates: Partial<UserProfile>) => {
      try {
        set({ isSaving: true, error: null });
        // Get current user ID from cached store
        const userId = await useUserStore.getState().getUserId();

        const { data: existingProfile } = await supabase
          .from("user_profiles")
          .select("*")
          .eq("user_id", userId)
          .single();

        if (existingProfile) {
          // Update existing profile
          const { data, error } = await supabase
            .from("user_profiles")
            .update(updates)
            .eq("user_id", userId)
            .select()
            .single();

          if (error) throw error;
          set({ profile: data, isSaving: false });
        } else {
          // Create new profile
          const { data, error } = await supabase
            .from("user_profiles")
            .insert({
              user_id: userId,
              ...updates,
            })
            .select()
            .single();

          if (error) throw error;
          set({ profile: data, isSaving: false });
        }
      } catch (error) {
        console.error("Error updating profile:", error);
        set({ error: error as Error, isSaving: false });
      }
    },

    fetchWeightRecords: async (force = false) => {
      const { weightRecords, isWeightRecordsLoaded } = get();

      // Get current user ID from cached store
      const userId = await useUserStore.getState().getUserId();

      // If we have cached data for the same user, use it (unless force refresh)
      if (!force && isWeightRecordsLoaded && weightRecords.length > 0 && cachedWeightRecordsUserId === userId) {
        set({ isLoading: false });
        return;
      }

      // If already loaded (even if empty) for same user, don't fetch again (unless force refresh)
      if (!force && isWeightRecordsLoaded && cachedWeightRecordsUserId === userId) {
        set({ isLoading: false });
        return;
      }

      // Update cached user ID
      cachedWeightRecordsUserId = userId;

      try {
        set({ isLoading: true, error: null });

        const { data, error } = await supabase
          .from("weight_records")
          .select("*")
          .eq("user_id", userId)
          .order("recorded_at", { ascending: false })
          .limit(100); // Get last 100 records

        if (error) throw error;
        set({ weightRecords: data || [], isLoading: false, isWeightRecordsLoaded: true });
      } catch (error) {
        console.error("Error fetching weight records:", error);
        set({ error: error as Error, isLoading: false, isWeightRecordsLoaded: true });
      }
    },

    addWeightRecord: async (weight: number, recordedAt?: string) => {
      try {
        set({ isSaving: true, error: null });
        // Get current user ID from cached store
        const userId = await useUserStore.getState().getUserId();

        const recordDate = recordedAt || new Date().toISOString();
        const recordDateTime = new Date(recordDate);
        const dateOnly = recordDateTime.toISOString().split('T')[0]; // YYYY-MM-DD

        // Calculate start and end of the day in UTC
        const startOfDay = `${dateOnly}T00:00:00.000Z`;
        const endOfDay = `${dateOnly}T23:59:59.999Z`;

        // Find existing records for the same date
        const { data: existingRecords, error: checkError } = await supabase
          .from("weight_records")
          .select("id")
          .eq("user_id", userId)
          .gte("recorded_at", startOfDay)
          .lte("recorded_at", endOfDay);

        if (checkError) throw checkError;

        // Delete existing records for the same date
        if (existingRecords && existingRecords.length > 0) {
          const recordIds = existingRecords.map(r => r.id);
          const { error: deleteError } = await supabase
            .from("weight_records")
            .delete()
            .in("id", recordIds);

          if (deleteError) throw deleteError;
        }

        // Insert new record
        const { data, error } = await supabase
          .from("weight_records")
          .insert({
            user_id: userId,
            weight,
            recorded_at: recordDate,
          })
          .select()
          .single();

        if (error) throw error;

        // Refresh weight records to get updated list (force bypass cache)
        await get().fetchWeightRecords(true);
        set({ isSaving: false });
      } catch (error) {
        console.error("Error adding weight record:", error);
        set({ error: error as Error, isSaving: false });
      }
    },

    refreshProfile: async () => {
      await Promise.all([
        get().fetchProfile(),
        get().fetchWeightRecords(true),
      ]);
    },

    clearProfile: () => {
      cachedProfileUserId = null;
      cachedWeightRecordsUserId = null;
      set({
        profile: null,
        weightRecords: [],
        isLoading: false,
        isSaving: false,
        error: null,
        isProfileLoaded: false,
        isWeightRecordsLoaded: false,
      });
    },
  };
});
