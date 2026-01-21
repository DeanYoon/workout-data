import {
    format,
    parseISO,
    startOfWeek,
    endOfWeek,
    startOfDay,
    addDays,
    eachDayOfInterval,
} from 'date-fns';
import { ko } from 'date-fns/locale';
import { enUS } from 'date-fns/locale';

export type DateLocale = 'en' | 'ko';

/**
 * Get today's date in YYYY-MM-DD format
 */
export const getTodayDateString = (): string => {
    return format(new Date(), 'yyyy-MM-dd');
};

/**
 * Get start and end of current week (Monday to Sunday)
 */
export const getWeekRange = (): { start: string; end: string } => {
    const now = new Date();
    const monday = startOfWeek(now, { weekStartsOn: 1 });
    const sunday = endOfWeek(now, { weekStartsOn: 1 });
    return { start: monday.toISOString(), end: sunday.toISOString() };
};

/**
 * Get today's date range (start of today to start of tomorrow)
 */
export const getTodayRange = (): { start: string; end: string } => {
    const today = startOfDay(new Date());
    const tomorrow = addDays(today, 1);
    return { start: today.toISOString(), end: tomorrow.toISOString() };
};

/**
 * Get all days of the current week (Monday to Sunday)
 */
export const getWeekDays = (): Date[] => {
    const now = new Date();
    const monday = startOfWeek(now, { weekStartsOn: 1 });
    const sunday = endOfWeek(now, { weekStartsOn: 1 });
    return eachDayOfInterval({ start: monday, end: sunday });
};

/**
 * Get short day label (locale-aware)
 */
export const getDayLabel = (date: Date, lang: DateLocale = 'en'): string => {
    return format(date, 'EEEEE', { locale: lang === 'ko' ? ko : enUS });
};

/**
 * Format date long e.g. "Dec 25, 2024 (Wed)" or "2024년 12월 25일 (수)"
 */
export const formatDateLong = (date: Date, lang: DateLocale): string => {
    return lang === 'ko'
        ? format(date, 'yyyy년 M월 d일 (E)', { locale: ko })
        : format(date, 'MMM d, yyyy (EEE)', { locale: enUS });
};

/**
 * Format month-year e.g. "Dec 2024" or "2024년 12월"
 */
export const formatMonthYear = (date: Date, lang: DateLocale): string => {
    return lang === 'ko'
        ? format(date, 'yyyy년 M월', { locale: ko })
        : format(date, 'MMM yyyy', { locale: enUS });
};

/**
 * Format short weekday (1 char) for calendar
 */
export const formatShortWeekday = (date: Date, lang: DateLocale): string => {
    return format(date, 'E', { locale: lang === 'ko' ? ko : enUS }).slice(0, 1);
};

// Re-export date-fns functions for convenience
export { format, parseISO } from 'date-fns';
export { ko, enUS } from 'date-fns/locale';

/**
 * Check if cache is still valid (same day)
 */
export const isCacheValid = (cachedDate: string): boolean => {
    return cachedDate === getTodayDateString();
};



