/**
 * Automatically setup web push notifications after login
 * This function requests permission and generates device token automatically
 */
import { initializeFirebase, getFCMToken } from './firebase-config';

let hasAutoSetupRun = false;
const AUTO_SETUP_KEY = 'notification_auto_setup_completed';

/**
 * Automatically request notification permission and generate device token
 * This should be called after successful login
 */
export async function autoSetupNotifications(): Promise<void> {
    console.log('Auto-setup: Starting...');
    
    // Check if browser supports notifications
    if (typeof window === 'undefined' || 
        !('Notification' in window) || 
        !('serviceWorker' in navigator) ||
        !('PushManager' in window)) {
        console.log('Auto-setup: Browser does not support notifications');
        return;
    }

    // Check current permission status
    const currentPermission = Notification.permission;
    console.log('Auto-setup: Current permission:', currentPermission);
    
    // If permission is already granted, just generate token (don't request again)
    if (currentPermission === 'granted') {
        const alreadyCompleted = sessionStorage.getItem(AUTO_SETUP_KEY) === 'true';
        if (alreadyCompleted && hasAutoSetupRun) {
            console.log('Auto-setup: Already completed, skipping');
            return;
        }
        
        // Initialize Firebase and get token
        console.log('Auto-setup: Permission already granted, generating token...');
        const firebaseApp = initializeFirebase();
        if (firebaseApp) {
            await new Promise(resolve => setTimeout(resolve, 1000));
            try {
                const token = await getFCMToken();
                if (token) {
                    await saveTokenToBackend(token);
                    sessionStorage.setItem(AUTO_SETUP_KEY, 'true');
                    hasAutoSetupRun = true;
                }
            } catch (error) {
                console.warn('Auto-setup: Failed to get token:', error);
            }
        }
        return;
    }
    
    // For 'denied' permission, skip auto-request (browser won't show dialog)
    // User must enable it in browser settings first
    if (currentPermission === 'denied') {
        console.log('Auto-setup: Permission is denied - browser will not show dialog. User must enable it in browser settings first.');
        return;
    }
    
    // Clear the session storage flag to allow retry after login
    sessionStorage.removeItem(AUTO_SETUP_KEY);
    hasAutoSetupRun = false;

    // Initialize Firebase first
    console.log('Auto-setup: Initializing Firebase...');
    const firebaseApp = initializeFirebase();
    if (!firebaseApp) {
        console.warn('Auto-setup: Firebase initialization failed');
        return;
    }

    // Wait a bit for Firebase to initialize and service worker to be ready
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    // Ensure service worker is registered
    if ('serviceWorker' in navigator) {
        try {
            let registration = await navigator.serviceWorker.getRegistration('/');
            if (!registration) {
                console.log('Auto-setup: Registering service worker...');
                registration = await navigator.serviceWorker.register('/firebase-messaging-sw.js', {
                    scope: '/',
                });
            }
            // Wait for service worker to be ready
            await navigator.serviceWorker.ready;
            console.log('Auto-setup: Service worker ready');
        } catch (error) {
            console.warn('Auto-setup: Service worker registration failed:', error);
        }
    }

    // If permission is 'default', request it automatically - show browser dialog
    if (currentPermission === 'default') {
        try {
            // Simple: Just ask for permission - browser will show dialog
            const permission = await Notification.requestPermission();
            
            if (permission === 'granted') {
                // Permission granted, generate token
                const token = await getFCMToken();
                if (token) {
                    // Save token to backend
                    await saveTokenToBackend(token);
                }
            }
            
            // Mark as completed regardless of result
            sessionStorage.setItem(AUTO_SETUP_KEY, 'true');
            hasAutoSetupRun = true;
        } catch (error) {
            console.error('Auto-setup: Failed to request permission:', error);
            sessionStorage.setItem(AUTO_SETUP_KEY, 'true');
            hasAutoSetupRun = true;
        }
    }
}

/**
 * Save device token to backend
 */
async function saveTokenToBackend(token: string): Promise<void> {
    try {
        const csrfToken = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '';
        const response = await fetch('/dashboard/device-tokens/web', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRF-TOKEN': csrfToken,
                'X-Requested-With': 'XMLHttpRequest',
                'Accept': 'application/json',
            },
            body: JSON.stringify({ token }),
            credentials: 'same-origin',
        });

        if (!response.ok) {
            console.warn('Auto-setup: Failed to save device token to backend');
        }
    } catch (error) {
        console.warn('Auto-setup: Error saving device token:', error);
    }
}

/**
 * Reset auto-setup (useful for testing or after logout)
 */
export function resetAutoSetup(): void {
    hasAutoSetupRun = false;
    sessionStorage.removeItem(AUTO_SETUP_KEY);
    // Also clear the denied-tried flag so we can try again
    sessionStorage.removeItem('notification_denied_tried');
    console.log('Auto-setup: Reset completed');
}

