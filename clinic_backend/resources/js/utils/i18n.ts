/**
 * Unified Internationalization (i18n) Utility
 * 
 * This module provides a consistent, unified pattern for translations across the entire application.
 * All text must come from Laravel translation files (lang/en/common.php and lang/ar/common.php).
 * 
 * Usage:
 * - In React components: use useTranslation() hook
 * - In utility functions: use translate() function
 * - Always use translation keys, never hardcoded strings
 */

/**
 * Inertia page type for accessing page props
 */
interface InertiaPage {
    props?: {
        translations?: Record<string, string>;
        locale?: string;
    };
}

/**
 * Get translations from Inertia page props
 * This can be used in utility functions that don't have access to React hooks
 */
export function getTranslations(): Record<string, string> {
    if (typeof window === 'undefined') {
        return {};
    }
    
    try {
        // Try to get translations from Inertia page props
        // This works if called within an Inertia context
        const page = (window as unknown as { __INERTIA_PAGE__?: InertiaPage }).__INERTIA_PAGE__;
        if (page?.props?.translations) {
            return page.props.translations;
        }
        
        // Alternative: Try to get from Inertia's shared data
        // @ts-ignore - Inertia might expose this differently
        if (window.__INERTIA__?.shared?.translations) {
            // @ts-ignore
            return window.__INERTIA__.shared.translations;
        }
    } catch (error) {
        console.warn('Could not access Inertia page props for translations:', error);
    }
    
    return {};
}

/**
 * Get current locale from Inertia page props
 */
export function getLocale(): string {
    if (typeof window === 'undefined') {
        return 'en';
    }
    
    try {
        const page = (window as unknown as { __INERTIA_PAGE__?: InertiaPage }).__INERTIA_PAGE__;
        if (page?.props?.locale) {
            return page.props.locale;
        }
    } catch (error) {
        console.warn('Could not access Inertia page props for locale:', error);
    }
    
    // Fallback: check HTML lang attribute
    if (typeof document !== 'undefined') {
        const lang = document.documentElement.lang || document.documentElement.getAttribute('lang');
        if (lang) {
            return lang;
        }
    }
    
    return 'en';
}

/**
 * Translation function for use in utility functions
 * This is a standalone version that doesn't require React hooks
 * 
 * @param key - Translation key from common.php files
 * @param params - Optional parameters to replace in translation (e.g., {name: 'John'})
 * @returns Translated string
 */
export function translate(key: string | undefined | null, params: Record<string, string | number> = {}): string {
    if (!key) {
        return '';
    }
    
    const translations = getTranslations();
    let translation = translations[key];

    // Keep the key visible so missing translations are obvious
    if (!translation) {
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
}

/**
 * Check if current locale is RTL
 */
export function isRTL(): boolean {
    return getLocale() === 'ar';
}

/**
 * Get direction ('rtl' or 'ltr') based on current locale
 */
export function getDirection(): 'rtl' | 'ltr' {
    return isRTL() ? 'rtl' : 'ltr';
}

