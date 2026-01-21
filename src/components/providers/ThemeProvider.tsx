'use client';

import { useEffect } from 'react';
import { useSettingsStore } from '@/stores';

export function ThemeProvider({ children }: { children: React.ReactNode }) {
    const loadSettings = useSettingsStore((state) => state.loadSettings);

    useEffect(() => {
        loadSettings();
    }, [loadSettings]);

    return <>{children}</>;
}



