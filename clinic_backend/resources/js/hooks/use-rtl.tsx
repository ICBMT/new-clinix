import { usePage } from '@inertiajs/react';
import { type SharedData } from '@/types';
import { getRTLUtilities } from '@/utils/rtl-unified';

/**
 * Hook to detect RTL mode and provide RTL utility classes
 * 
 * This hook uses the unified RTL utility system for consistency.
 * All RTL-aware components should use this hook.
 */
export function useRTL() {
    const { locale } = usePage<SharedData>().props;
    
    // Ensure locale is passed correctly - fallback to 'en' if undefined
    const currentLocale = locale || 'en';
    
    // Use unified RTL utilities for consistency
    return getRTLUtilities(currentLocale);
}

