// Firebase Web App Configuration
// This file reads from window.FIREBASE_CONFIG which is set from storage/app/firebase_web.json

declare global {
    interface Window {
        FIREBASE_CONFIG?: {
            apiKey: string;
            authDomain: string;
            projectId: string;
            storageBucket: string;
            messagingSenderId: string;
            appId: string;
            measurementId?: string;
        };
    }
}

// Get Firebase configuration from window object (set in app.blade.php from storage/app/firebase_web.json)
export const firebaseConfig = (typeof window !== 'undefined' && window.FIREBASE_CONFIG) 
    ? window.FIREBASE_CONFIG 
    : {
        apiKey: "",
        authDomain: "",
        projectId: "",
        storageBucket: "",
        messagingSenderId: "",
        appId: "",
    };

