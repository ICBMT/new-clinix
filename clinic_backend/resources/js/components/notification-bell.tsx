import { Bell } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { usePage, router } from '@inertiajs/react';
import { type SharedData } from '@/types';
import { usePermissions } from '@/hooks/use-permissions';
import { useTranslation } from '@/hooks/use-translation';
import { useRTL } from '@/hooks/use-rtl';
import { useState, useEffect } from 'react';

export function NotificationBell() {
    const page = usePage<SharedData>();
    const { auth, unreadNotificationCount: initialUnreadCount } = page.props;
    const { can } = usePermissions();
    const { t } = useTranslation();
    const { isRTL } = useRTL();
    
    // Get unread count from shared data or fetch it
    const [unreadCount, setUnreadCount] = useState<number>(
        initialUnreadCount || 0
    );
    
    // Check if user has permission to view notifications
    const canViewNotifications = auth?.user && can('notifications.view');
    
    // Fetch unread count on mount and periodically
    useEffect(() => {
        if (!canViewNotifications) return;
        
        const fetchUnreadCount = async () => {
            try {
                const response = await fetch('/dashboard/notifications/unread-count');
                if (response.ok) {
                    const data = await response.json();
                    setUnreadCount(data.unread_count || 0);
                }
            } catch (error) {
                console.error('Failed to fetch unread count:', error);
            }
        };
        
        // Fetch immediately
        fetchUnreadCount();
        
        // Refresh every 30 seconds
        const interval = setInterval(fetchUnreadCount, 30000);
        
        return () => clearInterval(interval);
    }, [canViewNotifications]);
    
    // Don't render if user doesn't have permission
    if (!canViewNotifications) {
        return null;
    }
    
    const handleClick = () => {
        router.visit('/dashboard/notifications');
    };
    
    return (
        <Button
            variant="ghost"
            size="sm"
            onClick={handleClick}
            className={`h-9 px-3 flex items-center gap-2 hover:bg-accent/50 transition-colors relative ${isRTL ? 'flex-row-reverse' : ''}`}
            title={t('notifications') || 'Notifications'}
        >
            <Bell className="h-4 w-4" />
            {unreadCount > 0 && (
                <Badge 
                    variant="destructive" 
                    className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs"
                >
                    {unreadCount > 99 ? '99+' : unreadCount}
                </Badge>
            )}
            <span className="sr-only">{t('notifications') || 'Notifications'}</span>
        </Button>
    );
}

