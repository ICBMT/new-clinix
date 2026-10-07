/* eslint-disable no-undef */
// Import Firebase scripts
importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-messaging-compat.js');

// Firebase config - will be set via postMessage from main thread
let firebaseConfig = null;
let firebaseInitialized = false;
let backgroundMessageHandlerSetup = false;

// Listen for config from main thread
self.addEventListener('message', (event) => {
    if (event.data && event.data.type === 'FIREBASE_CONFIG') {
        firebaseConfig = event.data.config;
        if (!firebaseInitialized) {
            initializeFirebase();
        } else {
            // If Firebase is already initialized but handler wasn't set up, set it up now
            setupBackgroundMessageHandler();
        }
    }
});

// Initialize Firebase
function initializeFirebase() {
    if (!firebaseConfig) {
        console.warn('Firebase config not received yet');
        return;
    }

    try {
        firebase.initializeApp(firebaseConfig);
        firebaseInitialized = true;
        console.log('Firebase initialized in service worker');
        
        // Set up background message handler once Firebase is initialized
        setupBackgroundMessageHandler();
    } catch (error) {
        console.error('Error initializing Firebase in service worker:', error);
    }
}

// Set up background message handler (only once)
function setupBackgroundMessageHandler() {
    if (backgroundMessageHandlerSetup) {
        console.log('[firebase-messaging-sw.js] Background message handler already set up');
        return;
    }
    
    const messagingInstance = getMessagingInstance();
    if (messagingInstance) {
        try {
            messagingInstance.onBackgroundMessage((payload) => {
                console.log('[firebase-messaging-sw.js] Received background message ', payload);
                
                const notificationTitle = payload.notification?.title || payload.data?.title || 'New Notification';
                const notificationBody = payload.notification?.body || payload.data?.body || '';
                const notificationOptions = {
                    body: notificationBody,
                    icon: payload.notification?.icon || payload.data?.icon || '/favicon.ico',
                    badge: '/favicon.ico',
                    tag: payload.data?.notification_id || 'notification',
                    data: payload.data || {},
                    requireInteraction: false,
                    silent: false, // Set to false to play default system sound
                };

                // Send message to open clients to play sound if page is open
                self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
                    clientList.forEach((client) => {
                        client.postMessage({
                            type: 'PLAY_NOTIFICATION_SOUND',
                            notification: {
                                title: notificationTitle,
                                body: notificationBody,
                                data: payload.data || {},
                            },
                        });
                    });
                });

                return self.registration.showNotification(notificationTitle, notificationOptions);
            });
            backgroundMessageHandlerSetup = true;
            console.log('[firebase-messaging-sw.js] Background message handler set up');
        } catch (error) {
            console.error('[firebase-messaging-sw.js] Error setting up background message handler:', error);
        }
    }
}

// Retrieve an instance of Firebase Messaging (will be initialized when config is received)
let messaging = null;

function getMessagingInstance() {
    if (!firebaseInitialized) {
        console.warn('Firebase not initialized yet');
        return null;
    }
    
    if (!messaging) {
        try {
            messaging = firebase.messaging();
        } catch (error) {
            console.error('Error getting messaging instance:', error);
            return null;
        }
    }
    
    return messaging;
}

// Handle push events (fallback for non-Firebase push notifications)
self.addEventListener('push', (event) => {
    console.log('[firebase-messaging-sw.js] Push event received');
    
    // If Firebase is initialized, it will handle the message via onBackgroundMessage
    // This is just a fallback for non-Firebase push notifications
    if (!firebaseInitialized) {
        try {
            const data = event.data ? event.data.json() : {};
            const notificationTitle = data.notification?.title || data.title || 'New Notification';
            const notificationBody = data.notification?.body || data.body || '';
            const notificationOptions = {
                body: notificationBody,
                icon: data.notification?.icon || data.icon || '/favicon.ico',
                badge: '/favicon.ico',
                tag: data.notification_id || 'notification',
                data: data.data || {},
                silent: false, // Set to false to play default system sound
            };

            // Send message to open clients to play sound if page is open
            self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
                clientList.forEach((client) => {
                    client.postMessage({
                        type: 'PLAY_NOTIFICATION_SOUND',
                        notification: {
                            title: notificationTitle,
                            body: notificationBody,
                            data: data.data || {},
                        },
                    });
                });
            });

            event.waitUntil(
                self.registration.showNotification(notificationTitle, notificationOptions)
            );
        } catch (error) {
            console.error('[firebase-messaging-sw.js] Error handling push event:', error);
        }
    }
});

// Handle notification clicks
self.addEventListener('notificationclick', (event) => {
    console.log('[firebase-messaging-sw.js] Notification click received.');

    event.notification.close();

    const urlToOpen = event.notification.data?.url || '/dashboard/notifications';
    
    event.waitUntil(
        clients.matchAll({
            type: 'window',
            includeUncontrolled: true,
        }).then((clientList) => {
            // Check if there's already a window/tab open with the target URL
            for (let i = 0; i < clientList.length; i++) {
                const client = clientList[i];
                if (client.url === urlToOpen && 'focus' in client) {
                    return client.focus();
                }
            }
            // If no window is open, open a new one
            if (clients.openWindow) {
                return clients.openWindow(urlToOpen);
            }
        })
    );
});
