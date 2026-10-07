import { usePage } from '@inertiajs/react';
import { type SharedData } from '@/types';
import { translate, getLocale } from '@/utils/i18n';

/**
 * Custom hook for translations
 * 
 * Uses translations from Laravel backend (lang/en/common.php and lang/ar/common.php)
 * These translations are shared via HandleInertiaRequests middleware.
 * 
 * This hook uses the unified translation system for consistency across the application.
 * 
 * Usage:
 * ```tsx
 * const { t, locale } = useTranslation();
 * <h1>{t('welcome_message', { name: 'John' })}</h1>
 * ```
 */
export function useTranslation() {
    const { locale: pageLocale, translations } = usePage<SharedData>().props;
    
    /**
     * Translation function
     * @param key - Translation key from common.php files
     * @param params - Optional parameters to replace in translation (e.g., {name: 'John', count: 5})
     */
    const t = (key: string | undefined | null, params: Record<string, string | number> = {}): string => {
        if (!key) {
            return '';
        }

        let translation = translations?.[key];

        if (!translation) {
            // Keep the key visible so missing translations are obvious
            translation = key;
        }

        if (typeof translation !== 'string') {
            translation = String(translation);
        }

        Object.entries(params).forEach(([paramKey, value]) => {
            const stringValue = String(value);
            translation = translation.replace(`:${paramKey}`, stringValue);
            translation = translation.replace(`{${paramKey}}`, stringValue);
        });

        return translation;
    };
    
    return { 
        t, 
        locale: pageLocale || getLocale(),
        // Also provide isRTL for convenience
        isRTL: (pageLocale || getLocale()) === 'ar',
    };
}
