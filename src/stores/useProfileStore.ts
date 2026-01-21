import { create } from 'zustand';
import { UserProfile, WeightRecord } from '@/types/profile';
import { useUserStore } from './useUserStore';
import {
    getProfile,
    upsertProfile,
    getWeightRecords,
    addWeightRecord as addWeightRecordService,
} from '@/services';

interface ProfileStore {
    profile: UserProfile | null;
    weightRecords: WeightRecord[];
    isLoading: boolean;
    isSaving: boolean;
    error: Error | null;
    isProfileLoaded: boolean;
    isWeightRecordsLoaded: boolean;
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
            const userId = await useUserStore.getState().getUserId();

            if (isProfileLoaded && profile !== null && cachedProfileUserId === userId) {
                set({ isLoading: false });
                return;
            }

            if (isProfileLoaded && cachedProfileUserId === userId) {
                set({ isLoading: false });
                return;
            }

            cachedProfileUserId = userId;

            try {
                set({ isLoading: true, error: null });
                const data = await getProfile(userId);
                set({ profile: data, isLoading: false, isProfileLoaded: true });
            } catch (error) {
                console.error("Error fetching profile:", error);
                set({ error: error as Error, isLoading: false, isProfileLoaded: true });
            }
        },

        updateProfile: async (updates: Partial<UserProfile>) => {
            try {
                set({ isSaving: true, error: null });
                const userId = await useUserStore.getState().getUserId();
                const data = await upsertProfile(userId, updates);
                set({ profile: data, isSaving: false });
            } catch (error) {
                console.error("Error updating profile:", error);
                set({ error: error as Error, isSaving: false });
            }
        },

        fetchWeightRecords: async (force = false) => {
            const { weightRecords, isWeightRecordsLoaded } = get();
            const userId = await useUserStore.getState().getUserId();

            if (!force && isWeightRecordsLoaded && weightRecords.length > 0 && cachedWeightRecordsUserId === userId) {
                set({ isLoading: false });
                return;
            }

            if (!force && isWeightRecordsLoaded && cachedWeightRecordsUserId === userId) {
                set({ isLoading: false });
                return;
            }

            cachedWeightRecordsUserId = userId;

            try {
                set({ isLoading: true, error: null });
                const data = await getWeightRecords(userId);
                set({ weightRecords: data, isLoading: false, isWeightRecordsLoaded: true });
            } catch (error) {
                console.error("Error fetching weight records:", error);
                set({ error: error as Error, isLoading: false, isWeightRecordsLoaded: true });
            }
        },

        addWeightRecord: async (weight: number, recordedAt?: string) => {
            try {
                set({ isSaving: true, error: null });
                const userId = await useUserStore.getState().getUserId();
                await addWeightRecordService(userId, weight, recordedAt);
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



