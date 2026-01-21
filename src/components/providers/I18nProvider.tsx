'use client';

import { useEffect } from 'react';
import i18n from '../../i18n/config';
import { useSettingsStore } from '@/stores';

export function I18nProvider({ children }: { children: React.ReactNode }) {
    const language = useSettingsStore((s) => s.language);

    useEffect(() => {
        i18n.changeLanguage(language);
        if (typeof document !== 'undefined') document.documentElement.lang = language;
    }, [language]);

    return <>{children}</>;
}



