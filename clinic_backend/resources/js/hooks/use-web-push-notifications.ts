import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import { getFCMToken, deleteFCMToken, initializeFirebase } from '@/utils/firebase-config';
import { useTranslation } from '@/hooks/use-translation';

interface UseWebPushNotificationsReturn {
    permission: NotificationPermission | null;
    isSupported: boolean;
    isSubscribed: boolean;
    isLoading: boolean;
    requestPermission: () => Promise<boolean>;
    subscribe: () => Promise<boolean>;
    unsubscribe: () => Promise<boolean>;
    checkSubscription: () => Promise<boolean>;
}

/**
 * Custom hook for managing web push notifications
 * This hook handles Firebase Cloud Messaging (FCM) web push notifications
 * 
 * @returns {UseWebPushNotificationsReturn} Object containing notification state and methods
 */
export function useWebPushNotifications(): UseWebPushNotificationsReturn {
    const { t } = useTranslation();
    const [permission, setPermission] = useState<NotificationPermission | null>(null);
    const [isSupported, setIsSupported] = useState(false);
    const [isSubscribed, setIsSubscribed] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    // Check if browser supports notifications and service workers
    useEffect(() => {
        const checkSupport = () => {
            const supported = 
                'Notification' in window &&
                'serviceWorker' in navigator &&
                'PushManager' in window;
            
            setIsSupported(supported);
            
            if (supported && 'Notification' in window) {
                setPermission(Notification.permission);
            }
        };

        checkSupport();
        
        // Initialize Firebase
        if (typeof window !== 'undefined') {
            initializeFirebase();
        }
    }, []);

    // Check subscription status on mount - will be set up after checkSubscription is defined

    /**
     * Request notification permission from the user
     */
    const requestPermission = useCallback(async (): Promise<boolean> => {
        if (!isSupported) {
            toast.error(t('browser_does_not_support_notifications'));
            return false;
        }

        // Check current permission state
        const currentPermission = Notification.permission;
        
        if (currentPermission === 'granted') {
            setPermission('granted');
            return true;
        }

        // If permission is 'denied', browsers typically won't show the dialog again
        // However, we still try to request it as some browsers may allow re-requesting
        // The browser will either show the dialog (if allowed) or silently return 'denied'
        if (currentPermission === 'denied') {
            // Try to request again - browser may allow it on user gesture
            try {
                setIsLoading(true);
                const result = await Notification.requestPermission();
                setPermission(result);
                
                if (result === 'granted') {
                    toast.success(t('notification_permission_granted'));
                    return true;
                } else {
                    // Still denied - show helpful message
                    setPermission('denied');
                    toast.error(t('notification_permission_blocked'), {
                        duration: 5000,
                    });
                    return false;
                }
            } catch (error) {
                console.error('Error requesting notification permission:', error);
                setPermission('denied');
                toast.error(t('failed_to_request_notification_permission'));
                return false;
            } finally {
                setIsLoading(false);
            }
        }

        // Permission is 'default' - browser will show the dialog
        try {
            setIsLoading(true);
            
            // This will trigger the browser's permission dialog
            const result = await Notification.requestPermission();
            setPermission(result);
            
            if (result === 'granted') {
                toast.success(t('notification_permission_granted'));
                return true;
            } else if (result === 'denied') {
                // User denied the permission
                toast.error(t('notification_permission_denied'));
                return false;
            } else {
                // Default state - user dismissed the dialog
                toast.error(t('notification_permission_not_granted'));
                return false;
            }
        } catch (error) {
            console.error('Error requesting notification permission:', error);
            toast.error(t('failed_to_request_notification_permission'));
            return false;
        } finally {
            setIsLoading(false);
        }
    }, [isSupported, t]);

    /**
     * Subscribe to push notifications
     */
    const subscribe = useCallback(async (): Promise<boolean> => {
        if (!isSupported) {
            toast.error('Your browser does not support push notifications');
            return false;
        }

        // Always check and request permission first
        if (Notification.permission !== 'granted') {
            if (Notification.permission === 'denied') {
                toast.error('Notification permission is blocked. Please enable it in your browser settings.', {
                    duration: 5000,
                });
                setPermission(Notification.permission);
                return false;
            }
            
            // Permission is 'default', request it
            const granted = await requestPermission();
            if (!granted) {
                return false;
            }
        }

        try {
            setIsLoading(true);

            // Register service worker
            await navigator.serviceWorker.register('/firebase-messaging-sw.js', {
                scope: '/',
            });

            // Wait for service worker to be ready
            await navigator.serviceWorker.ready;

            // Get FCM token (will throw if permission is not granted)
            let token: string | null = null;
            try {
                token = await getFCMToken();
            } catch (error: unknown) {
                const errorMessage = error instanceof Error ? error.message : String(error);
                if (errorMessage === 'PERMISSION_BLOCKED') {
                    toast.error('Notification permission is blocked. Please enable notifications in your browser settings and refresh the page.', {
                        duration: 6000,
                    });
                    setPermission('denied');
                    return false;
                } else if (errorMessage === 'PERMISSION_NOT_GRANTED') {
                    // This shouldn't happen since we check above, but handle it anyway
                    const granted = await requestPermission();
                    if (!granted) {
                        return false;
                    }
                    // Try again after permission is granted
                    token = await getFCMToken();
                } else {
                    throw error;
                }
            }

            if (!token) {
                toast.error('Failed to get push notification token');
                return false;
            }

            // Save token to backend
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
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.message || 'Failed to save device token');
            }

            setIsSubscribed(true);
            toast.success(t('push_notifications_enabled'));
            return true;
        } catch (error: unknown) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            console.error('Error subscribing to push notifications:', error);
            toast.error(errorMessage || 'Failed to enable push notifications');
            return false;
        } finally {
            setIsLoading(false);
        }
    }, [isSupported, requestPermission, t]);

    /**
     * Unsubscribe from push notifications
     */
    const unsubscribe = useCallback(async (): Promise<boolean> => {
        if (!isSupported) {
            return false;
        }

        try {
            setIsLoading(true);

            // Get current token
            const token = await getFCMToken();

            if (token) {
                // Delete token from backend
                const csrfToken = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '';
                await fetch('/dashboard/device-tokens/web', {
                    method: 'DELETE',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-CSRF-TOKEN': csrfToken,
                        'X-Requested-With': 'XMLHttpRequest',
                        'Accept': 'application/json',
                    },
                    body: JSON.stringify({ token }),
                    credentials: 'same-origin',
                });

                // Delete token from FCM
                await deleteFCMToken();
            }

            setIsSubscribed(false);
            toast.success(t('push_notifications_disabled'));
            return true;
        } catch (error: unknown) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            console.error('Error unsubscribing from push notifications:', error);
            toast.error(errorMessage || 'Failed to disable push notifications');
            return false;
        } finally {
            setIsLoading(false);
        }
    }, [isSupported, t]);

    /**
     * Check if user is currently subscribed
     */
    const checkSubscription = useCallback(async (): Promise<boolean> => {
        if (!isSupported) {
            setIsSubscribed(false);
            return false;
        }

        // Always update permission state from browser
        const currentPermission = Notification.permission;
        setPermission(currentPermission);

        // Check permission first - don't try to get token if permission is not granted
        if (currentPermission !== 'granted') {
            setIsSubscribed(false);
            return false;
        }

        try {
            // Ensure service worker is ready before trying to get token
            if ('serviceWorker' in navigator) {
                let registration = await navigator.serviceWorker.getRegistration('/');
                if (!registration) {
                    // Register service worker if not registered
                    registration = await navigator.serviceWorker.register('/firebase-messaging-sw.js', {
                        scope: '/',
                    });
                }
                // Wait for service worker to be ready
                await navigator.serviceWorker.ready;
            }

            const token = await getFCMToken();

            if (token) {
                // Check if token exists in backend
                const csrfToken = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content');
                if (!csrfToken) {
                    // CSRF token not available - might be during login or page load
                    // Just assume not subscribed for now, will check again later
                    setIsSubscribed(false);
                    return false;
                }

                try {
                    const response = await fetch('/dashboard/device-tokens/web/check', {
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

                    if (response.ok) {
                        const data = await response.json();
                        setIsSubscribed(data.exists || false);
                        return data.exists || false;
                    } else if (response.status === 419) {
                        // CSRF token expired or invalid - silently fail, will retry later
                        setIsSubscribed(false);
                        return false;
                    } else {
                        // Other error - silently fail
                        setIsSubscribed(false);
                        return false;
                    }
                } catch (fetchError) {
                    // Network error or other fetch issue - silently fail
                    setIsSubscribed(false);
                    return false;
                }
            }

            setIsSubscribed(false);
            return false;
        } catch (error: unknown) {
            // Handle permission errors gracefully
            const errorMessage = error instanceof Error ? error.message : String(error);
            if (errorMessage === 'PERMISSION_BLOCKED' || errorMessage === 'PERMISSION_NOT_GRANTED') {
                setIsSubscribed(false);
                setPermission(Notification.permission);
                return false;
            }
            
            // Only log non-permission errors
            console.error('Error checking subscription:', error);
            setIsSubscribed(false);
            return false;
        }
    }, [isSupported]);

    // Check subscription status on mount
    // Delay the check to ensure CSRF token is available after login
    useEffect(() => {
        if (isSupported) {
            // Wait a bit after mount to ensure CSRF token is ready (especially after login)
            const timer = setTimeout(() => {
                checkSubscription().catch((error) => {
                    // Silently handle errors - CSRF might not be ready yet
                    console.warn('Failed to check subscription on mount:', error);
                });
            }, 1000);
            
            return () => clearTimeout(timer);
        }
    }, [isSupported, checkSubscription]);

    return {
        permission,
        isSupported,
        isSubscribed,
        isLoading,
        requestPermission,
        subscribe,
        unsubscribe,
        checkSubscription,
    };
}
