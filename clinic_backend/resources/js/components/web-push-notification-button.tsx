import { Button } from '@/components/ui/button';
import { useWebPushNotifications } from '@/hooks/use-web-push-notifications';
import { useTranslation } from '@/hooks/use-translation';
import { useRTL } from '@/hooks/use-rtl';
import { Bell, BellOff, Loader2 } from 'lucide-react';
import { useEffect } from 'react';

interface WebPushNotificationButtonProps {
    variant?: 'default' | 'outline' | 'ghost' | 'secondary';
    size?: 'default' | 'sm' | 'lg' | 'icon';
    className?: string;
    showLabel?: boolean;
    autoRequest?: boolean;
}

/**
 * Reusable button component for enabling/disabling web push notifications
 * 
 * @param {WebPushNotificationButtonProps} props - Component props
 * @returns {JSX.Element} Button component
 */
export function WebPushNotificationButton({
    variant = 'outline',
    size = 'default',
    className = '',
    showLabel = true,
    autoRequest = false,
}: WebPushNotificationButtonProps) {
    const { t } = useTranslation();
    const { isRTL } = useRTL();
    const {
        isSupported,
        isSubscribed,
        isLoading,
        permission,
        subscribe,
        unsubscribe,
        requestPermission,
        checkSubscription,
    } = useWebPushNotifications();
    // Removed modal - we only use browser permission dialog

    // Auto-request permission if enabled and permission is default
    // Only auto-request once per session to avoid annoying the user
    useEffect(() => {
        if (autoRequest && isSupported && permission === 'default' && !isSubscribed) {
            // Use a small delay to ensure the page is fully loaded
            const timer = setTimeout(() => {
                requestPermission();
            }, 1000);
            return () => clearTimeout(timer);
        }
    }, [autoRequest, isSupported, permission, isSubscribed, requestPermission]);

    if (!isSupported) {
        return null; // Don't show button if browser doesn't support notifications
    }

    const handleClick = async () => {
        if (isSubscribed) {
            await unsubscribe();
        } else {
            // Use the hook's requestPermission which properly handles all cases
            // including checking for denied permissions and attempting to re-request
            const permissionGranted = await requestPermission();
            
            if (permissionGranted) {
                // Permission granted - check subscription and subscribe
                await checkSubscription();
                await subscribe();
            }
        }
    };
    

    const getButtonText = () => {
        if (isSubscribed) {
            return t('disable_notifications') || 'Disable Notifications';
        }
        if (permission === 'denied') {
            return t('request_notification_permission') || 'Request Notification Permission';
        }
        if (permission === 'default') {
            return t('enable_notifications') || 'Enable Notifications';
        }
        return t('enable_notifications') || 'Enable Notifications';
    };

    return (
        <>
            <Button
                variant={variant}
                size={size}
                onClick={handleClick}
                disabled={isLoading}
                className={className}
            >
                {isLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                ) : isSubscribed ? (
                    <>
                        <BellOff className="h-4 w-4" />
                        {showLabel && <span className={isRTL ? 'mr-2' : 'ml-2'}>{getButtonText()}</span>}
                    </>
                ) : (
                    <>
                        <Bell className="h-4 w-4" />
                        {showLabel && <span className={isRTL ? 'mr-2' : 'ml-2'}>{getButtonText()}</span>}
                    </>
                )}
            </Button>

        </>
    );
}

