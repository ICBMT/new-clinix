/**
 * Format a date to human-readable format like "1 year ago", "2 months ago", etc.
 * Uses unified translation system - all text comes from translation files
 * @param dateString - The date string to format
 * @param t - Translation function (optional, will use unified translation system if not provided)
 */
import { translate } from './i18n';

export function formatHumanDate(dateString: string, t?: (key: string, params?: Record<string, string | number>) => string): string {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    // Use provided translation function or fall back to unified translation system
    const tFunc = t || translate;

    if (diffInSeconds < 60) {
        return tFunc('just_now');
    }

    const diffInMinutes = Math.floor(diffInSeconds / 60);
    if (diffInMinutes < 60) {
        return diffInMinutes === 1 
            ? tFunc('minute_ago', { count: 1 })
            : tFunc('minutes_ago', { count: diffInMinutes });
    }

    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) {
        return diffInHours === 1 
            ? tFunc('hour_ago', { count: 1 })
            : tFunc('hours_ago', { count: diffInHours });
    }

    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 30) {
        return diffInDays === 1 
            ? tFunc('day_ago', { count: 1 })
            : tFunc('days_ago', { count: diffInDays });
    }

    const diffInMonths = Math.floor(diffInDays / 30);
    if (diffInMonths < 12) {
        return diffInMonths === 1 
            ? tFunc('month_ago', { count: 1 })
            : tFunc('months_ago', { count: diffInMonths });
    }

    const diffInYears = Math.floor(diffInMonths / 12);
    return diffInYears === 1 
        ? tFunc('year_ago', { count: 1 })
        : tFunc('years_ago', { count: diffInYears });
}
