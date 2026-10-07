import { initializeApp, getApps, FirebaseApp } from 'firebase/app';
import { getMessaging, getToken, deleteToken, Messaging, onMessage, MessagePayload } from 'firebase/messaging';
import { firebaseConfig as config } from '@/config/firebase';

// Use the config from firebase.ts file
const firebaseConfig = config;

let app: FirebaseApp | null = null;
let messaging: Messaging | null = null;

/**
 * Initialize Firebase app
 */
export function initializeFirebase(): FirebaseApp | null {
    // Validate Firebase config before initializing
    if (!firebaseConfig.projectId || !firebaseConfig.apiKey) {
        console.error('Firebase configuration is incomplete. Please check resources/js/config/firebase.ts');
        return null;
    }

    if (getApps().length === 0) {
        try {
            app = initializeApp(firebaseConfig);
            
            // Send config to service worker
            if (typeof navigator !== 'undefined' && 'serviceWorker' in navigator) {
                navigator.serviceWorker.ready.then((registration) => {
                    if (registration.active) {
                        registration.active.postMessage({
                            type: 'FIREBASE_CONFIG',
                            config: firebaseConfig,
                        });
                    }
                }).catch((error) => {
                    console.warn('Error sending Firebase config to service worker:', error);
                });
            }
        } catch (error) {
            console.error('Error initializing Firebase:', error);
            return null;
        }
    } else {
        app = getApps()[0];
    }
    return app;
}

/**
 * Get Firebase Messaging instance
 */
export async function getFirebaseMessaging(): Promise<Messaging | null> {
    if (!app) {
        app = initializeFirebase();
    }

    if (!app) {
        return null;
    }

    if (typeof window === 'undefined') {
        return null; // Server-side rendering
    }

    if (!messaging && 'Notification' in window && 'serviceWorker' in navigator) {
        try {
            messaging = getMessaging(app);
        } catch (error) {
            console.error('Error getting Firebase Messaging:', error);
            return null;
        }
    }

    return messaging;
}

/**
 * Get FCM token
 */
export async function getFCMToken(): Promise<string | null> {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
        return null;
    }

    // Check notification permission first
    if (!('Notification' in window)) {
        console.error('This browser does not support notifications');
        return null;
    }

    // Check if permission is granted
    if (Notification.permission !== 'granted') {
        if (Notification.permission === 'denied') {
            throw new Error('PERMISSION_BLOCKED');
        }
        // Permission is 'default', need to request it first
        throw new Error('PERMISSION_NOT_GRANTED');
    }

    try {
        // Register service worker first if not already registered
        let registration = await navigator.serviceWorker.getRegistration('/');
        if (!registration) {
            registration = await navigator.serviceWorker.register('/firebase-messaging-sw.js', {
                scope: '/',
            });
        }

        // Wait for service worker to be ready
        await navigator.serviceWorker.ready;

        const messagingInstance = await getFirebaseMessaging();
        if (!messagingInstance) {
            return null;
        }

        // Get FCM token
        // Note: VAPID key is optional but recommended for web push
        // If you get an error here, you may need to add a VAPID key
        const token = await getToken(messagingInstance, {
            serviceWorkerRegistration: registration,
        });
        
        // Save token to localStorage for this session
        if (token && typeof window !== 'undefined' && window.localStorage) {
            try {
                localStorage.setItem('fcm_device_token', token);
            } catch (e) {
                console.warn('Failed to save FCM token to localStorage:', e);
            }
        }
        
        return token;
    } catch (error: unknown) {
        // Re-throw permission errors so they can be handled by the caller
        const errorMessage = error instanceof Error ? error.message : String(error);
        if (errorMessage === 'PERMISSION_BLOCKED' || errorMessage === 'PERMISSION_NOT_GRANTED') {
            throw error;
        }
        
        // If error mentions VAPID key, log a helpful message
        if (errorMessage.includes('vapid') || errorMessage.includes('VAPID')) {
            console.warn('VAPID key may be required for web push notifications. Get it from Firebase Console → Project Settings → Cloud Messaging → Web Push certificates');
        }
        
        // If error mentions permission blocked
        if (errorMessage.includes('permission') && errorMessage.includes('blocked')) {
            throw new Error('PERMISSION_BLOCKED');
        }
        
        console.error('Error getting FCM token:', error);
        return null;
    }
}

/**
 * Delete FCM token
 */
export async function deleteFCMToken(): Promise<boolean> {
    const messagingInstance = await getFirebaseMessaging();
    if (!messagingInstance) {
        return false;
    }

    try {
        await deleteToken(messagingInstance);
        return true;
    } catch (error) {
        console.error('Error deleting FCM token:', error);
        return false;
    }
}

/**
 * Play notification sound
 */
export function playNotificationSound(): void {
    try {
        // Create a simple notification sound using Web Audio API
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

/**
 * Listen for foreground messages
 */
export function onForegroundMessage(callback: (payload: MessagePayload) => void): (() => void) | null {
    getFirebaseMessaging().then((messagingInstance) => {
        if (messagingInstance) {
            onMessage(messagingInstance, (payload) => {
                // Play sound when foreground message is received
                playNotificationSound();
                callback(payload);
            });
        }
    });

    return () => {
        // Cleanup function if needed
    };
}

