import '../css/app.css';

import { createInertiaApp } from '@inertiajs/react';
import { resolvePageComponent } from 'laravel-vite-plugin/inertia-helpers';
import { createRoot } from 'react-dom/client';
import { initializeTheme } from './hooks/use-appearance';
import { Toaster } from '@/components/ui/sonner';
import { initializeFirebase } from './utils/firebase-config';
import { translate } from './utils/i18n';

/**
 * Initialize RTL support on initial page load
 * This ensures the HTML element has proper RTL direction before React renders
 */
function initializeRTL() {
    // Ensure DOM is ready before accessing elements
    if (typeof document === 'undefined') {
        return;
    }
    
    const htmlElement = document.documentElement;
    if (!htmlElement) {
        return;
    }
    
    const body = document.body;
    if (!body || !body.classList) {
        return;
    }
    
    const isRTL = htmlElement.getAttribute('dir') === 'rtl' || htmlElement.lang === 'ar';
    
    try {
        if (isRTL) {
            body.classList.add('rtl');
            htmlElement.setAttribute('dir', 'rtl');
            htmlElement.setAttribute('lang', 'ar');
        } else {
            body.classList.remove('rtl');
            htmlElement.setAttribute('dir', 'ltr');
            htmlElement.setAttribute('lang', 'en');
        }
    } catch (error) {
        // Silently fail if there's any error accessing DOM elements
        console.warn('Failed to initialize RTL:', error);
    }
}

createInertiaApp({
    title: (title) => {
        // Use translation system for default title
        if (!title) {
            // Try to get app name from translations or use default
            try {
                return translate('app_name') || 'Laravel';
            } catch {
                return 'Laravel';
            }
        }
        return title;
    },
    resolve: (name) =>
        resolvePageComponent(
            `./pages/${name}.tsx`,
            import.meta.glob('./pages/**/*.tsx'),
        ),
    setup({ el, App, props }) {
        const root = createRoot(el);

        // Initialize RTL after DOM is ready
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', initializeRTL);
        } else {
            // DOM is already ready
            initializeRTL();
        }

        root.render(
            <>
                <App {...props} />
                <Toaster />
            </>
        );
    },
    progress: {
        color: '#6B46C1',
    },
});

// This will set light / dark mode on load...
if (typeof window !== 'undefined') {
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            initializeTheme();
            initializeRTL();
            setupNotificationSoundListener();
        });
    } else {
        // DOM is already ready
        initializeTheme();
        initializeRTL();
        setupNotificationSoundListener();
    }
}

/**
 * Set up listener for service worker messages to play notification sound
 */
function setupNotificationSoundListener(): void {
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.addEventListener('message', (event) => {
            if (event.data && event.data.type === 'PLAY_NOTIFICATION_SOUND') {
                // Play notification sound when service worker sends message
                playNotificationSound();
            }
        });
    }
}

/**
 * Play notification sound using Web Audio API
 */
function playNotificationSound(): void {
    try {
        const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        oscillator.frequency.value = 800; // Higher pitch for notification
        oscillator.type = 'sine';
        
        gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
        
        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.5);
    } catch (error) {
        console.warn('Failed to play notification sound:', error);
    }
}
