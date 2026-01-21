import { create } from 'zustand';
import { supabase } from '@/lib/supabase';

interface UserStore {
    userId: string | null;
    isLoading: boolean;
    initializeUser: () => Promise<void>;
    getUserId: () => Promise<string>;
    clearUser: () => void;
}

let userIdPromise: Promise<string> | null = null;

export const useUserStore = create<UserStore>((set, get) => ({
    userId: null,
    isLoading: true,

    initializeUser: async () => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            const userId = user?.id || "anon_user";
            set({ userId, isLoading: false });
            userIdPromise = Promise.resolve(userId);
        } catch (error) {
            console.error('Error initializing user:', error);
            set({ userId: "anon_user", isLoading: false });
            userIdPromise = Promise.resolve("anon_user");
        }
    },

    getUserId: async () => {
        const { userId } = get();

        // If we have cached user ID, return it immediately
        if (userId !== null) {
            return userId;
        }

        // If there's already a pending request, wait for it
        if (userIdPromise) {
            return userIdPromise;
        }

        // Create new request
        userIdPromise = (async () => {
            try {
                const { data: { user } } = await supabase.auth.getUser();
                const id = user?.id || "anon_user";
                set({ userId: id, isLoading: false });
                return id;
            } catch (error) {
                console.error('Error getting user ID:', error);
                const id = "anon_user";
                set({ userId: id, isLoading: false });
                return id;
            } finally {
                userIdPromise = null;
            }
        })();

        return userIdPromise;
    },

    clearUser: () => {
        userIdPromise = null;
        set({ userId: null, isLoading: true });
    },
}));

// Initialize user on module load
if (typeof window !== 'undefined') {
    useUserStore.getState().initializeUser();

    // Listen for auth state changes
    supabase.auth.onAuthStateChange((_event, session) => {
        const userId = session?.user?.id || "anon_user";
        useUserStore.setState({ userId, isLoading: false });
        userIdPromise = Promise.resolve(userId);
    });
}



