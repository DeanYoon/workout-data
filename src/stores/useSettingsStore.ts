import { create } from 'zustand';

export type ThemeMode = 'light' | 'dark' | 'system';
export type Language = 'ko' | 'en';

interface AppSettings {
  theme: ThemeMode;
  language: Language;
}

interface SettingsStore extends AppSettings {
  setTheme: (theme: ThemeMode) => void;
  setLanguage: (language: Language) => void;
  getEffectiveTheme: () => 'light' | 'dark';
  loadSettings: () => void;
}

const STORAGE_KEY = 'app-settings';

const getStoredSettings = (): Partial<AppSettings> => {
  if (typeof window === 'undefined') return {};
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : {};
  } catch {
    return {};
  }
};

const saveSettings = (settings: Partial<AppSettings>) => {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  } catch {
    // Ignore storage errors
  }
};

export const useSettingsStore = create<SettingsStore>((set, get) => ({
  theme: 'system',
  language: 'en',

  loadSettings: () => {
    const stored = getStoredSettings();
    const theme = (stored.theme || 'system') as ThemeMode;
    const language = (stored.language || 'en') as Language;
    
    set({ theme, language });
    
    // Apply theme immediately
    if (typeof window !== 'undefined') {
      const effectiveTheme = theme === 'system' 
        ? (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
        : theme;
      document.documentElement.classList.toggle('dark', effectiveTheme === 'dark');
    }
  },

  setTheme: (theme: ThemeMode) => {
    set({ theme });
    saveSettings({ theme, language: get().language });
    
    // Apply theme immediately
    if (typeof window !== 'undefined') {
      const effectiveTheme = theme === 'system' 
        ? (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
        : theme;
      document.documentElement.classList.toggle('dark', effectiveTheme === 'dark');
    }
  },

  setLanguage: (language: Language) => {
    set({ language });
    saveSettings({ theme: get().theme, language });
  },

  getEffectiveTheme: () => {
    const { theme } = get();
    if (theme === 'system' && typeof window !== 'undefined') {
      return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    return theme as 'light' | 'dark';
  },
}));

// Initialize theme on mount
if (typeof window !== 'undefined') {
  const store = useSettingsStore.getState();
  store.loadSettings();

  // Listen for system theme changes
  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
    const currentTheme = useSettingsStore.getState().theme;
    if (currentTheme === 'system') {
      document.documentElement.classList.toggle('dark', e.matches);
    }
  });
}



