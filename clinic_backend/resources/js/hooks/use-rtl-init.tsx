import { useEffect } from 'react';
import { usePage } from '@inertiajs/react';
import { type SharedData } from '@/types';

/**
 * Hook to initialize and maintain RTL support
 * Updates HTML element dir and lang attributes based on locale
 * Should be used in the root layout or app component
 */
export function useRTLInit() {
    const { locale } = usePage<SharedData>().props;
    const isRTL = locale === 'ar';

    useEffect(() => {
        // Ensure we're in the browser environment
        if (typeof document === 'undefined') {
            return;
        }

        const htmlElement = document.documentElement;
        const bodyElement = document.body;

        // Check if body element exists and has classList before accessing it
        if (!bodyElement || !bodyElement.classList) {
            return;
        }

        try {
            if (isRTL) {
                htmlElement.setAttribute('dir', 'rtl');
                htmlElement.setAttribute('lang', 'ar');
                bodyElement.classList.add('rtl');
            } else {
                htmlElement.setAttribute('dir', 'ltr');
                htmlElement.setAttribute('lang', 'en');
                bodyElement.classList.remove('rtl');
            }
        } catch (error) {
            // Silently fail if there's any error accessing DOM elements
            console.warn('Failed to update RTL classes:', error);
        }

        // Cleanup function (though it's not strictly necessary)
        return () => {
            // Optionally reset on unmount, but usually we want to keep the direction
        };
    }, [isRTL, locale]);
}

