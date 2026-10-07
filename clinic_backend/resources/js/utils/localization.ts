/**
 * Utility functions for localization
 * 
 * These functions handle bilingual content (EN/AR) consistently across the application.
 * All fallback text uses the unified translation system.
 */

import { getLocale, translate } from './i18n';

/**
 * Get localized name based on current locale
 * Returns name_en if locale is 'en', name_ar if locale is 'ar'
 * Falls back to name_en if name_ar is not available
 * If both are empty, returns a translated "not_available" message
 */
export function getLocalizedName(
    nameEn: string | null | undefined,
    nameAr: string | null | undefined,
    locale?: string
): string {
    const currentLocale = locale || getLocale();
    
    if (currentLocale === 'ar' && nameAr) {
        return nameAr;
    }
    
    const result = nameEn || nameAr || '';
    
    // If no name is available, return translated "not available" message
    if (!result) {
        return translate('not_available');
    }
    
    return result;
}

/**
 * Get localized description based on current locale
 * Falls back to translated "no_description" if neither is available
 */
export function getLocalizedDescription(
    descEn: string | null | undefined,
    descAr: string | null | undefined,
    locale?: string
): string {
    const currentLocale = locale || getLocale();
    
    if (currentLocale === 'ar' && descAr) {
        return descAr;
    }
    
    const result = descEn || descAr || '';
    
    // If no description is available, return translated "no description" message
    if (!result) {
        return translate('no_description');
    }
    
    return result;
}

/**
 * Get localized company name
 */
export function getLocalizedCompanyName(
    companyNameEn: string | null | undefined,
    companyNameAr: string | null | undefined,
    locale?: string
): string {
    return getLocalizedName(companyNameEn, companyNameAr, locale);
}

/**
 * Get localized bio
 */
export function getLocalizedBio(
    bioEn: string | null | undefined,
    bioAr: string | null | undefined,
    locale?: string
): string {
    return getLocalizedDescription(bioEn, bioAr, locale);
}

