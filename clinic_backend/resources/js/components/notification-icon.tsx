import { useState, useEffect } from 'react';
import { Bell } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { usePage, router } from '@inertiajs/react';
import { type SharedData } from '@/types';
import { Link } from '@inertiajs/react';
import { useTranslation } from '@/hooks/use-translation';
import axios from 'axios';
import { cn } from '@/lib/utils';

interface Notification {
    id: number;
    title: string;
    message: string;
    is_read: boolean;
    type: string;
    data?: {
        booking_id?: number;
        clinic_id?: number;
        earning_id?: number;
        url?: string;
    };
    created_at: string;
}

export function NotificationIcon() {
    const { t } = useTranslation();
    const page = usePage<SharedData>();
    const { rtl, auth } = page.props;
    const [unreadCount, setUnreadCount] = useState(0);
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [isOpen, setIsOpen] = useState(false);
    const [loading, setLoading] = useState(false);

    const fetchUnreadCount = async () => {
        // Only fetch if user is authenticated
        if (!auth?.user) {
            return;
        }
        
        try {
            const csrfToken = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '';
            const response = await axios.get('/dashboard/notifications/unread-count', {
                headers: {
                    'X-CSRF-TOKEN': csrfToken,
                    'Accept': 'application/json',
                },
            });
            setUnreadCount(response.data.unread_count || 0);
        } catch (error) {
            console.error('Failed to fetch unread count:', error);
            // Don't set count on error, keep it at 0
        }
    };

    const fetchRecentNotifications = async () => {
        try {
            setLoading(true);
            const csrfToken = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '';
            const response = await axios.get('/dashboard/notifications/recent?limit=10', {
                headers: {
                    'X-CSRF-TOKEN': csrfToken,
                    'Accept': 'application/json',
                },
            });
            setNotifications(response.data.notifications || []);
        } catch (error) {
            console.error('Failed to fetch notifications:', error);
        } finally {
            setLoading(false);
        }
    };

    const markAsRead = async (notificationId: number, url?: string) => {
        try {
            const csrfToken = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '';
            await axios.patch(`/dashboard/notifications/${notificationId}/mark-read`, {}, {
                headers: {
                    'X-CSRF-TOKEN': csrfToken,
                    'Accept': 'application/json',
                },
            });

            // Update local state
            setNotifications(prev => prev.map(n => 
                n.id === notificationId ? { ...n, is_read: true } : n
            ));
            setUnreadCount(prev => Math.max(0, prev - 1));

            // Navigate if URL exists
            if (url) {
                router.visit(url);
                setIsOpen(false);
            }
        } catch (error) {
            console.error('Failed to mark notification as read:', error);
        }
    };

    const formatTimeAgo = (dateString: string): string => {
        const date = new Date(dateString);
        const now = new Date();
        const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

        if (diffInSeconds < 60) {
            return t('just_now');
        }

        const diffInMinutes = Math.floor(diffInSeconds / 60);
        if (diffInMinutes < 60) {
            const translated = t('minutes_ago');
            return translated?.replace('{count}', diffInMinutes.toString()) || `${diffInMinutes} min ago`;
        }

        const diffInHours = Math.floor(diffInMinutes / 60);
        if (diffInHours < 24) {
            const translated = t('hours_ago');
            return translated?.replace('{count}', diffInHours.toString()) || `${diffInHours} hour${diffInHours > 1 ? 's' : ''} ago`;
        }

        const diffInDays = Math.floor(diffInHours / 24);
        if (diffInDays < 7) {
            const translated = t('days_ago');
            return translated?.replace('{count}', diffInDays.toString()) || `${diffInDays} day${diffInDays > 1 ? 's' : ''} ago`;
        }

        return date.toLocaleDateString();
    };

    const getNotificationUrl = (notification: Notification): string | undefined => {
        if (notification.data?.url) {
            return notification.data.url;
        }

        if (notification.data?.booking_id) {
            return `/dashboard/bookings/${notification.data.booking_id}`;
        }

        if (notification.data?.earning_id) {
            return `/dashboard/earnings/${notification.data.earning_id}`;
        }

        if (notification.data?.clinic_id) {
            return `/dashboard/clinics/${notification.data.clinic_id}`;
        }

        return undefined;
    };

    useEffect(() => {
        // Fetch initial count
        fetchUnreadCount();

        // Poll every 30 seconds for real-time updates
        const interval = setInterval(() => {
            fetchUnreadCount();
            if (isOpen) {
                fetchRecentNotifications();
            }
        }, 30000);

        return () => clearInterval(interval);
    }, [isOpen]);

    useEffect(() => {
        if (isOpen) {
            fetchRecentNotifications();
        }
    }, [isOpen]);

    // Don't render if user is not authenticated (check after all hooks)
    // Note: In dashboard context, auth.user should always exist
    if (!auth?.user) {
        return null;
    }

    return (
        <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
            <DropdownMenuTrigger asChild>
                <Button
                    variant="ghost"
                    size="sm"
                    className={cn(
                        "h-9 px-3 flex items-center gap-2 hover:bg-accent/50 transition-colors relative",
                        rtl && "flex-row-reverse"
                    )}
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
                    <span className="sr-only">{t('notifications')}</span>
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent 
                align="end" 
                className={cn(
                    "w-80 p-0",
                    rtl && "text-right"
                )}
            >
                <div className={cn(
                    "flex items-center justify-between p-3 border-b",
                    rtl && "flex-row-reverse"
                )}>
                    <h3 className="font-semibold text-sm">{t('notifications')}</h3>
                    <Link
                        href="/dashboard/notifications"
                        className="text-xs text-primary hover:underline"
                    >
                        {t('view_all')}
                    </Link>
                </div>
                
                <div className="max-h-[400px] overflow-y-auto">
                    {loading ? (
                        <div className="p-4 text-center text-sm text-muted-foreground">
                            {t('loading')}
                        </div>
                    ) : notifications.length === 0 ? (
                        <div className="p-4 text-center text-sm text-muted-foreground">
                            {t('no_notifications')}
                        </div>
                    ) : (
                        <div className="divide-y">
                            {notifications.map((notification) => {
                                const url = getNotificationUrl(notification);
                                return (
                                    <button
                                        key={notification.id}
                                        onClick={() => markAsRead(notification.id, url)}
                                        className={cn(
                                            "w-full text-left p-3 hover:bg-accent transition-colors",
                                            !notification.is_read && "bg-accent/50",
                                            rtl && "text-right"
                                        )}
                                    >
                                        <div className={cn(
                                            "flex items-start gap-2",
                                            rtl && "flex-row-reverse"
                                        )}>
                                            {!notification.is_read && (
                                                <div className="h-2 w-2 rounded-full bg-primary mt-1.5 flex-shrink-0" />
                                            )}
                                            <div className="flex-1 min-w-0">
                                                <p className={cn(
                                                    "text-sm font-medium truncate",
                                                    !notification.is_read && "font-semibold"
                                                )}>
                                                    {notification.title}
                                                </p>
                                                <p className="text-xs text-muted-foreground line-clamp-2 mt-1">
                                                    {notification.message}
                                                </p>
                                                <p className="text-xs text-muted-foreground mt-1">
                                                    {formatTimeAgo(notification.created_at)}
                                                </p>
                                            </div>
                                        </div>
                                    </button>
                                );
                            })}
                        </div>
                    )}
                </div>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
