import { DataTable } from '@/components/data-table';
import { Button } from '@/components/ui/button';
import { ConfirmationDialog } from '@/components/confirmation-dialog';
import { Badge } from '@/components/ui/badge';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { 
    CollapsibleFilters, 
    SearchFieldFilter, 
    SelectFilter, 
    DateRangeFilter,
    type ActiveFilter,
    type SelectOption 
} from '@/components/filters';
import AppLayout from '@/layouts/app-layout';
import { useRTLInit } from '@/hooks/use-rtl-init';
import { useTranslation } from '@/hooks/use-translation';
import { useRTL } from '@/hooks/use-rtl';
import { Head, router, usePage } from '@inertiajs/react';
import { type SharedData } from '@/types';
import { Eye, Trash2, Filter, CheckCircle } from 'lucide-react';
import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import { WebPushNotificationButton } from '@/components/web-push-notification-button';
import { index as dashboard } from '@/routes/dashboard';
import { type BreadcrumbItem } from '@/types';
import { formatHumanDate } from '@/utils/date-utils';
import { cn } from '@/lib/utils';

interface Notification {
    id: number;
    title_en: string;
    title_ar: string;
    description_en: string;
    description_ar: string;
    recipient_type: 'admin' | 'vendor' | 'user' | 'guest';
    recipient_id: number | null;
    is_read: boolean;
    created_at: string;
    recipient?: {
        id: number;
        name: string;
        email: string;
    };
}

interface NotificationsPageProps {
    notifications: {
        data: Notification[];
        current_page: number;
        last_page: number;
        per_page: number;
        total: number;
    };
    filters: {
        search?: string;
        recipient_type?: string;
        is_read?: string;
        created_from?: string;
        created_to?: string;
    };
}

export default function NotificationsIndex({ notifications, filters: initialFilters }: NotificationsPageProps) {
    useRTLInit();
    const { t, locale } = useTranslation();
    const page = usePage<SharedData>();
    const { locale: pageLocale } = page.props;
    const isRTL = pageLocale === 'ar';
    const dir = isRTL ? 'rtl' : 'ltr';
    const { flexDirection, iconMargin } = useRTL();
    
    const breadcrumbs: BreadcrumbItem[] = [
        {
            title: t('dashboard'),
            href: dashboard.url(),
        },
        {
            title: t('notifications_management'),
            href: '/dashboard/notifications',
        },
    ];
    const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; notificationId: number | null }>({ open: false, notificationId: null });
    const [markAllReadDialog, setMarkAllReadDialog] = useState(false);
    const [optimisticNotifications, setOptimisticNotifications] = useState(notifications.data);
    const [showFilters, setShowFilters] = useState(false);
    const [isInitialLoad, setIsInitialLoad] = useState(true);

    // Filter states
    const [filters, setFilters] = useState({
        search: initialFilters?.search || '',
        recipient_type: initialFilters?.recipient_type || 'all',
        is_read: initialFilters?.is_read || 'all',
        created_from: initialFilters?.created_from || '',
        created_to: initialFilters?.created_to || '',
    });

    const applyFiltersToBackend = useCallback((filtersToApply: typeof filters) => {
        router.get('/dashboard/notifications', {
            page: 1, // Reset to first page when applying filters
            search: filtersToApply.search || undefined,
            filters: {
                recipient_type: filtersToApply.recipient_type && filtersToApply.recipient_type !== 'all' ? filtersToApply.recipient_type : undefined,
                is_read: filtersToApply.is_read && filtersToApply.is_read !== 'all' ? filtersToApply.is_read : undefined,
                created_from: filtersToApply.created_from || undefined,
                created_to: filtersToApply.created_to || undefined,
            },
        }, { preserveState: true });
    }, []);

    // Initialize optimistic notifications only once when component mounts
    useEffect(() => {
        setOptimisticNotifications(notifications.data);
    }, [notifications.data]);

    // Auto-apply filters when they change
    useEffect(() => {
        if (isInitialLoad) {
            setIsInitialLoad(false);
            return;
        }
        
        const timeoutId = setTimeout(() => {
            applyFiltersToBackend(filters);
        }, 300);
        
        return () => clearTimeout(timeoutId);
    }, [filters, applyFiltersToBackend, isInitialLoad]);

    const handleFilterChange = (key: keyof typeof filters, value: string) => {
        setFilters(prev => ({ ...prev, [key]: value }));
    };

    const clearAllFilters = () => {
        setFilters({
            search: '',
            recipient_type: 'all',
            is_read: 'all',
            created_from: '',
            created_to: '',
        });
    };

    const confirmDelete = () => {
        if (deleteDialog.notificationId) {
            const currentPage = notifications.current_page;
            const perPage = notifications.per_page;
            const totalOnCurrentPage = notifications.data.length;
            
            router.delete(`/dashboard/notifications/${deleteDialog.notificationId}`, {
                data: {
                    page: currentPage,
                    per_page: perPage,
                },
                onSuccess: (page) => {
                    toast.success(t('notification_deleted_successfully'));
                    setDeleteDialog({ open: false, notificationId: null });
                    
                    // If we deleted the last item on the current page and we're not on page 1,
                    // the backend will redirect us to the previous page
                    if (totalOnCurrentPage === 1 && currentPage > 1) {
                        // Optimistically update to show empty state or redirect
                        setOptimisticNotifications([]);
                    } else {
                        // Remove the deleted notification from optimistic state
                        setOptimisticNotifications(prev => 
                            prev.filter(n => n.id !== deleteDialog.notificationId)
                        );
                    }
                },
                onError: () => {
                    toast.error(t('failed_to_delete_notification'));
                },
            });
        }
    };

    const handleMarkAsRead = (notificationId: number) => {
        router.patch(`/dashboard/notifications/${notificationId}/mark-read`, {}, {
            onSuccess: () => {
                toast.success(t('notification_marked_as_read'));
            },
            onError: () => {
                toast.error(t('failed_to_mark_notification_as_read'));
            },
        });
    };

    const handleMarkAllAsRead = () => {
        setMarkAllReadDialog(true);
    };

    const confirmMarkAllAsRead = () => {
        router.patch('/dashboard/notifications/mark-all-read', {}, {
            onSuccess: () => {
                toast.success(t('all_notifications_marked_as_read'));
                setMarkAllReadDialog(false);
            },
            onError: () => {
                toast.error(t('failed_to_mark_all_notifications_as_read'));
            },
        });
    };

    const getRecipientTypeBadgeVariant = (type: string) => {
        switch (type) {
            case 'admin':
                return 'default';
            case 'vendor':
                return 'secondary';
            case 'user':
                return 'outline';
            case 'guest':
                return 'destructive';
            default:
                return 'outline';
        }
    };

    const getReadStatusBadgeVariant = (isRead: boolean) => {
        return isRead ? 'default' : 'destructive';
    };

    const recipientTypeOptions: SelectOption[] = [
        { value: 'all', label: t('all_recipients') },
        { value: 'admin', label: t('admin') },
        { value: 'vendor', label: t('vendor') },
        { value: 'user', label: t('user') },
        { value: 'guest', label: t('guest') },
    ];

    const readStatusOptions: SelectOption[] = [
        { value: 'all', label: t('all_statuses') },
        { value: '1', label: t('read') },
        { value: '0', label: t('unread') },
    ];

    const activeFilters: ActiveFilter[] = [
        ...(filters.search ? [{ key: 'search', label: t('search'), value: filters.search, displayValue: `"${filters.search}"` }] : []),
        ...(filters.recipient_type && filters.recipient_type !== 'all' ? [{ key: 'recipient_type', label: t('type'), value: filters.recipient_type, displayValue: t(filters.recipient_type) }] : []),
        ...(filters.is_read && filters.is_read !== 'all' ? [{ key: 'is_read', label: t('status'), value: filters.is_read, displayValue: filters.is_read === '1' ? t('read') : t('unread') }] : []),
        ...(filters.created_from ? [{ key: 'created_from', label: t('from'), value: filters.created_from, displayValue: filters.created_from }] : []),
        ...(filters.created_to ? [{ key: 'created_to', label: t('to'), value: filters.created_to, displayValue: filters.created_to }] : []),
    ];

    const columns = [
        {
            key: 'notification',
            label: t('notification'),
            render: (_: unknown, notification: Notification) => (
                <div className={cn("space-y-1", isRTL ? '!text-right' : '!text-left')}>
                    <div className={cn("font-medium text-foreground", isRTL ? '!text-right' : '!text-left')} dir={dir}>{isRTL ? notification.title_ar : notification.title_en}</div>
                    <div className={cn("text-sm text-muted-foreground", isRTL ? '!text-right' : '!text-left')} dir={dir}>{isRTL ? notification.description_ar : notification.description_en}</div>
                </div>
            ),
        },
        {
            key: 'recipient_type',
            label: t('recipient_type'),
            render: (_: unknown, notification: Notification) => (
                <Badge variant={getRecipientTypeBadgeVariant(notification.recipient_type)} className={cn(isRTL ? '!text-right' : '!text-left')}>
                    {t(notification.recipient_type)}
                </Badge>
            ),
        },
        {
            key: 'is_read',
            label: t('is_read'),
            render: (_: unknown, notification: Notification) => (
                <Badge variant={getReadStatusBadgeVariant(notification.is_read)} className={cn(isRTL ? '!text-right' : '!text-left')}>
                    {notification.is_read ? t('read') : t('unread')}
                </Badge>
            ),
        },
        {
            key: 'created_at',
            label: t('created_at'),
            render: (date: string) => formatHumanDate(date, t),
        },
        {
            key: 'actions',
            label: t('actions'),
            render: (_: unknown, notification: Notification) => (
                <div className={cn("flex items-center gap-1 w-full", isRTL ? 'justify-start flex-row-reverse' : 'justify-end')}>
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => router.visit(`/dashboard/notifications/${notification.id}`)}
                        title={t('view')}
                    >
                        <Eye className="h-4 w-4" />
                    </Button>
                    {!notification.is_read && (
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleMarkAsRead(notification.id)}
                            title={t('mark_as_read')}
                        >
                            <CheckCircle className="h-4 w-4" />
                        </Button>
                    )}
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setDeleteDialog({ open: true, notificationId: notification.id })}
                        title={t('delete')}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                        <Trash2 className="h-4 w-4" />
                    </Button>
                </div>
            ),
        },
    ];

    const handlePageChange = (page: number) => {
        router.get('/dashboard/notifications', {
            page,
            per_page: notifications.per_page,
            search: filters.search || undefined,
            filters: {
                recipient_type: filters.recipient_type && filters.recipient_type !== 'all' ? filters.recipient_type : undefined,
                is_read: filters.is_read && filters.is_read !== 'all' ? filters.is_read : undefined,
                created_from: filters.created_from || undefined,
                created_to: filters.created_to || undefined,
            },
        }, { preserveState: true });
    };

    const handlePerPageChange = (perPage: number) => {
        router.get('/dashboard/notifications', {
            per_page: perPage,
            page: 1, // Reset to first page when changing per page
            search: filters.search || undefined,
            filters: {
                recipient_type: filters.recipient_type && filters.recipient_type !== 'all' ? filters.recipient_type : undefined,
                is_read: filters.is_read && filters.is_read !== 'all' ? filters.is_read : undefined,
                created_from: filters.created_from || undefined,
                created_to: filters.created_to || undefined,
            },
        }, { preserveState: true });
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={t('notifications')} />
            
            <div className={cn("flex h-full flex-1 flex-col gap-6 overflow-x-auto rounded-xl bg-card dark:bg-card p-6 border border-border", isRTL ? '!text-right' : '!text-left')} dir={dir}>
                {/* Header */}
                <div className={cn("flex items-center justify-between border-b pb-4", flexDirection)}>
                    <div className={cn(isRTL ? '!text-right' : '!text-left')}>
                        <h1 className={cn("text-3xl font-bold text-foreground", isRTL ? '!text-right' : '!text-left')}>{t('notifications_management')}</h1>
                        <p className={cn("text-muted-foreground mt-1", isRTL ? '!text-right' : '!text-left')}>{t('manage_notifications')}</p>
                    </div>
                    <div className={cn("flex items-center gap-3", flexDirection)}>
                        <WebPushNotificationButton 
                            variant="outline" 
                            size="default" 
                            showLabel={true}
                        />
                        <Button
                            variant="outline"
                            onClick={handleMarkAllAsRead}
                            className={cn("flex items-center gap-2", flexDirection)}
                        >
                            <CheckCircle className={cn("h-4 w-4", iconMargin('md'))} />
                            {t('mark_all_as_read')}
                        </Button>
                    </div>
                </div>

                {/* Pagination Info and Show Filters Button */}
                <div className={cn("flex items-center justify-between", flexDirection)}>
                    <div className={cn("flex items-center gap-2", flexDirection)}>
                        <span className={cn("text-sm text-foreground", isRTL ? '!text-right' : '!text-left')}>
                            {t('showing')} {((notifications.current_page - 1) * notifications.per_page) + 1} {t('of')} {notifications.total} {t('results')}
                        </span>
                        <Select value={notifications.per_page.toString()} onValueChange={(value) => handlePerPageChange(Number(value))}>
                            <SelectTrigger className={cn("w-20", isRTL ? '!text-right' : '!text-left')}>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="10">10</SelectItem>
                                <SelectItem value="15">15</SelectItem>
                                <SelectItem value="25">25</SelectItem>
                                <SelectItem value="50">50</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    
                    <div className={cn("flex items-center gap-2", flexDirection)}>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setShowFilters(!showFilters)}
                            className={cn("flex items-center gap-2", flexDirection)}
                        >
                            <Filter className={cn("h-4 w-4", iconMargin('md'))} />
                            {showFilters ? t('hide_filters') : t('show_filters')}
                            {activeFilters.length > 0 && (
                                <span className={cn("px-1.5 py-0.5 text-xs bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-300 rounded-full", iconMargin('sm'))}>
                                    {activeFilters.length}
                                </span>
                            )}
                        </Button>
                    </div>
                </div>

                {/* Filters */}
                {showFilters && (
                    <CollapsibleFilters
                        activeFilters={activeFilters}
                        onRemoveFilter={(key) => {
                            switch (key) {
                                case 'search':
                                    handleFilterChange('search', '');
                                    break;
                                case 'recipient_type':
                                    handleFilterChange('recipient_type', 'all');
                                    break;
                                case 'is_read':
                                    handleFilterChange('is_read', 'all');
                                    break;
                                case 'created_from':
                                    handleFilterChange('created_from', '');
                                    break;
                                case 'created_to':
                                    handleFilterChange('created_to', '');
                                    break;
                            }
                        }}
                        onClearAll={clearAllFilters}
                        isOpen={true}
                        locale={locale}
                    >
                        <SearchFieldFilter
                            id="search"
                            label={t('search')}
                            value={filters.search}
                            onChange={(value) => handleFilterChange('search', value)}
                            placeholder={t('search_placeholder')}
                        />
                        
                        <SelectFilter
                            id="recipient_type"
                            label={t('recipient_type')}
                            value={filters.recipient_type}
                            onChange={(value) => handleFilterChange('recipient_type', value)}
                            options={recipientTypeOptions}
                            placeholder={t('all')}
                        />
                        
                        <SelectFilter
                            id="is_read"
                            label={t('is_read')}
                            value={filters.is_read}
                            onChange={(value) => handleFilterChange('is_read', value)}
                            options={readStatusOptions}
                            placeholder={t('all')}
                        />
                        
                        <DateRangeFilter
                            id="created_date"
                            label={t('created_date')}
                            fromValue={filters.created_from}
                            toValue={filters.created_to}
                            onFromChange={(value) => handleFilterChange('created_from', value)}
                            onToChange={(value) => handleFilterChange('created_to', value)}
                            fromPlaceholder={t('date_from')}
                            toPlaceholder={t('date_to')}
                        />
                    </CollapsibleFilters>
                )}

                {/* Data Table */}
                <DataTable
                    data={optimisticNotifications}
                    columns={columns}
                    total={notifications.total}
                    currentPage={notifications.current_page}
                    perPage={notifications.per_page}
                    onPageChange={handlePageChange}
                    onPerPageChange={handlePerPageChange}
                    locale={locale}
                />
            </div>

            {/* Delete Confirmation Dialog */}
            <ConfirmationDialog
                open={deleteDialog.open}
                onOpenChange={(open) => setDeleteDialog({ open, notificationId: null })}
                onConfirm={confirmDelete}
                title={t('delete_notification')}
                description={t('are_you_sure_delete_notification')}
                variant="danger"
                confirmText={t('delete')}
            />

            {/* Mark All Read Confirmation Dialog */}
            <ConfirmationDialog
                open={markAllReadDialog}
                onOpenChange={setMarkAllReadDialog}
                onConfirm={confirmMarkAllAsRead}
                title={t('mark_all_as_read')}
                description={t('are_you_sure_mark_all_notifications_as_read')}
                variant="danger"
                confirmText={t('mark_all_as_read')}
            />
        </AppLayout>
    );
}
