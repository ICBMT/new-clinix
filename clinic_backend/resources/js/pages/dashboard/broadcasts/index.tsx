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
import { useTranslation } from '@/hooks/use-translation';
import { useRTL } from '@/hooks/use-rtl';
import { useRTLInit } from '@/hooks/use-rtl-init';
import { Head, Link, router, usePage } from '@inertiajs/react';
import { Plus, Eye, Edit, Trash2, Filter, Send, Clock } from 'lucide-react';
import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import { customToast } from '@/components/ui/custom-toast';
import { type SharedData } from '@/types';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { index as dashboard } from '@/routes/dashboard';
import { type BreadcrumbItem } from '@/types';
import { formatHumanDate } from '@/utils/date-utils';
import { cn } from '@/lib/utils';

interface Broadcast {
    id: number;
    title_en: string;
    title_ar: string;
    description_en?: string;
    description_ar?: string;
    message_en?: string;
    message_ar?: string;
    recipients?: number[] | null;
    target_roles?: string[] | null;
    topics?: number[] | null;
    status: 'draft' | 'scheduled' | 'sent' | 'pending';
    sent_at: string | null;
    scheduled_at?: string | null;
    created_at: string;
}

interface BroadcastsPageProps {
    broadcasts: {
        data: Broadcast[];
        current_page: number;
        last_page: number;
        per_page: number;
        total: number;
    };
    filters: {
        search?: string;
        status?: string;
        sent_from?: string;
        sent_to?: string;
    };
}

export default function BroadcastsIndex({ broadcasts, filters: initialFilters }: BroadcastsPageProps) {
    useRTLInit();
    const { t, locale } = useTranslation();
    const page = usePage<SharedData>();
    const { locale: pageLocale } = page.props;
    const isRTL = pageLocale === 'ar';
    const dir = isRTL ? 'rtl' : 'ltr';
    const { flexDirection, iconMargin, getFieldDir, getInputTextAlign } = useRTL();
    const { flash } = usePage<SharedData>().props;
    
    // Flash messages (for success/error messages from backend)
    useEffect(() => {
        if (flash?.success) {
            customToast.success(flash.success);
        }
        if (flash?.error) {
            customToast.error(flash.error);
        }
    }, [flash]);
    
    const breadcrumbs: BreadcrumbItem[] = [
        {
            title: t('dashboard'),
            href: dashboard.url(),
        },
        {
            title: t('broadcast_management'),
            href: '/dashboard/broadcasts',
        },
    ];
    const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; broadcastId: number | null; broadcastTitle?: string }>({ open: false, broadcastId: null });
    const [scheduleDialog, setScheduleDialog] = useState<{ open: boolean; broadcastId: number | null }>({ open: false, broadcastId: null });
    const [scheduleDateTime, setScheduleDateTime] = useState('');
    const [optimisticBroadcasts, setOptimisticBroadcasts] = useState(broadcasts.data);
    const [showFilters, setShowFilters] = useState(false);
    const [isInitialLoad, setIsInitialLoad] = useState(true);

    // Filter states
    const [filters, setFilters] = useState({
        search: initialFilters?.search || '',
        status: initialFilters?.status || 'all',
        sent_from: initialFilters?.sent_from || '',
        sent_to: initialFilters?.sent_to || '',
    });

    const applyFiltersToBackend = useCallback((filtersToApply: typeof filters) => {
        router.get('/dashboard/broadcasts', {
            page: 1, // Reset to first page when applying filters
            search: filtersToApply.search || undefined,
            filters: {
                status: filtersToApply.status && filtersToApply.status !== 'all' ? filtersToApply.status : undefined,
                sent_from: filtersToApply.sent_from || undefined,
                sent_to: filtersToApply.sent_to || undefined,
            },
        }, { preserveState: true, preserveScroll: true });
    }, []);

    // Initialize optimistic broadcasts only once when component mounts
    useEffect(() => {
        setOptimisticBroadcasts(broadcasts.data);
    }, [broadcasts.data]);

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
            status: 'all',
            sent_from: '',
            sent_to: '',
        });
    };

    const confirmDelete = () => {
        if (deleteDialog.broadcastId) {
            router.delete(`/dashboard/broadcasts/${deleteDialog.broadcastId}`, {
                onSuccess: () => {
                    toast.success(t('broadcast_deleted_successfully'));
                    setDeleteDialog({ open: false, broadcastId: null });
                },
                onError: () => {
                    toast.error(t('failed_to_delete_broadcast'));
                },
            });
        }
    };

    const handleSend = (broadcastId: number) => {
        router.patch(`/dashboard/broadcasts/${broadcastId}/send`, {}, {
            onSuccess: () => {
                toast.success(t('broadcast_sent_successfully'));
            },
            onError: () => {
                toast.error(t('failed_to_send_broadcast'));
            },
        });
    };

    const handleSchedule = (broadcastId: number) => {
        setScheduleDialog({ open: true, broadcastId });
        setScheduleDateTime('');
    };

    const confirmSchedule = () => {
        if (scheduleDialog.broadcastId && scheduleDateTime) {
            router.post(`/dashboard/broadcasts/${scheduleDialog.broadcastId}/schedule`, {
                scheduled_at: scheduleDateTime,
            }, {
                onSuccess: () => {
                    toast.success(t('broadcast_scheduled_successfully'));
                    setScheduleDialog({ open: false, broadcastId: null });
                    setScheduleDateTime('');
                },
                onError: () => {
                    toast.error(t('failed_to_schedule_broadcast'));
                },
            });
        }
    };

    const getStatusBadgeVariant = (status: string) => {
        switch (status) {
            case 'sent':
                return 'default';
            case 'pending':
            case 'draft':
                return 'secondary';
            case 'scheduled':
                return 'outline';
            default:
                return 'outline';
        }
    };

    const statusOptions: SelectOption[] = [
        { value: 'all', label: t('all') },
        { value: 'pending', label: t('pending') },
        { value: 'draft', label: t('draft') },
        { value: 'scheduled', label: t('scheduled') },
        { value: 'sent', label: t('sent') },
    ];

    const activeFilters: ActiveFilter[] = [
        ...(filters.search ? [{ key: 'search', label: t('search'), value: filters.search, displayValue: `"${filters.search}"` }] : []),
        ...(filters.status && filters.status !== 'all' ? [{ key: 'status', label: t('status'), value: filters.status, displayValue: t(filters.status) }] : []),
        ...(filters.sent_from ? [{ key: 'sent_from', label: t('from'), value: filters.sent_from, displayValue: filters.sent_from }] : []),
        ...(filters.sent_to ? [{ key: 'sent_to', label: t('to'), value: filters.sent_to, displayValue: filters.sent_to }] : []),
    ];

    const formatBroadcastDateTime = (value?: string | null) => {
        if (!value) {
            return t('n_a');
        }

        try {
            const date = new Date(value);
            if (isNaN(date.getTime())) {
                return t('n_a');
            }

            return date.toLocaleString(isRTL ? 'ar-KW' : 'en-US', {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
            });
        } catch {
            return t('n_a');
        }
    };

    const columns = [
        {
            key: 'broadcast',
            label: t('broadcast'),
            render: (_: unknown, broadcast: Broadcast) => (
                <div className={cn("space-y-1", isRTL ? '!text-right' : '!text-left')}>
                    <div className={cn("font-medium text-foreground", isRTL ? '!text-right' : '!text-left')}>
                        {isRTL && broadcast.title_ar ? broadcast.title_ar : broadcast.title_en}
                    </div>
                    {(isRTL && (broadcast.description_ar || broadcast.message_ar)) || (locale === 'en' && (broadcast.description_en || broadcast.message_en)) ? (
                        <div className={cn("text-sm text-muted-foreground line-clamp-2", isRTL ? '!text-right' : '!text-left')} dir={dir}>
                            {isRTL 
                                ? (broadcast.description_ar || broadcast.message_ar || '')
                                : (broadcast.description_en || broadcast.message_en || '')}
                        </div>
                    ) : null}
                </div>
            ),
        },
        {
            key: 'recipients',
            label: t('recipients'),
            render: (_: unknown, broadcast: Broadcast) => (
                <div className={cn("space-y-1", isRTL ? '!text-right' : '!text-left')} dir={dir}>
                    {broadcast.target_roles && Array.isArray(broadcast.target_roles) && broadcast.target_roles.length > 0 ? (
                        <div className={cn("text-sm text-muted-foreground", isRTL ? '!text-right' : '!text-left')} dir={dir}>
                            {t('roles')}: {broadcast.target_roles.length} {t('selected')}
                        </div>
                    ) : broadcast.recipients && Array.isArray(broadcast.recipients) && broadcast.recipients.length > 0 ? (
                        <div className={cn("text-sm text-muted-foreground", isRTL ? '!text-right' : '!text-left')} dir={dir}>
                            {broadcast.recipients.length} {t('users')}
                        </div>
                    ) : (
                        <span className={cn("text-muted-foreground", isRTL ? '!text-right' : '!text-left')} dir={dir}>{t('n_a')}</span>
                    )}
                </div>
            ),
        },
        {
            key: 'status',
            label: t('broadcast_status'),
            render: (_: unknown, broadcast: Broadcast) => (
                <Badge variant={getStatusBadgeVariant(broadcast.status)} className={cn(isRTL ? '!text-right' : '!text-left')}>
                    {t(broadcast.status)}
                </Badge>
            ),
        },
        {
            key: 'sent_at',
            label: t('sent_at') || t('sending_time'),
            render: (_: unknown, broadcast: Broadcast) => {
                if (broadcast.sent_at) {
                    return (
                        <span className={cn("text-sm text-muted-foreground", isRTL ? '!text-right' : '!text-left')} dir={dir}>
                            {formatBroadcastDateTime(broadcast.sent_at)}
                        </span>
                    );
                }
                // Show scheduled time if scheduled, otherwise show "Not sent"
                if (broadcast.status === 'scheduled' && (broadcast as any).scheduled_at) {
                    return (
                        <span className={cn("text-sm text-muted-foreground", isRTL ? '!text-right' : '!text-left')} dir={dir}>
                            {formatBroadcastDateTime((broadcast as any).scheduled_at)} ({t('scheduled')})
                        </span>
                    );
                }
                return (
                    <span className={cn("text-sm text-muted-foreground", isRTL ? '!text-right' : '!text-left')} dir={dir}>
                        {t('n_a')}
                    </span>
                );
            },
        },
        {
            key: 'actions',
            label: t('actions'),
            render: (_: unknown, broadcast: Broadcast) => (
                <div className={cn("flex items-center gap-1 w-full", isRTL ? 'justify-start flex-row-reverse' : 'justify-end')}>
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => router.visit(`/dashboard/broadcasts/${broadcast.id}`)}
                        title={t('view')}
                    >
                        <Eye className="h-4 w-4" />
                    </Button>
                    {broadcast.status !== 'sent' && (
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => router.visit(`/dashboard/broadcasts/${broadcast.id}/edit`)}
                            title={t('edit')}
                        >
                            <Edit className="h-4 w-4" />
                        </Button>
                    )}
                    {(broadcast.status === 'pending' || broadcast.status === 'draft') && (
                        <>
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleSend(broadcast.id)}
                                title={t('broadcast_now')}
                                className="text-green-600 hover:text-green-700 hover:bg-green-50"
                            >
                                <Send className="h-4 w-4" />
                            </Button>
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleSchedule(broadcast.id)}
                                title={t('schedule_broadcast')}
                                className="text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300 hover:bg-purple-50 dark:hover:bg-purple-900/20"
                            >
                                <Clock className="h-4 w-4" />
                            </Button>
                        </>
                    )}
                    {broadcast.status !== 'sent' && (
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                                const title = isRTL ? (broadcast.title_ar || broadcast.title_en) : (broadcast.title_en || broadcast.title_ar);
                                setDeleteDialog({ open: true, broadcastId: broadcast.id, broadcastTitle: title });
                            }}
                            title={t('delete')}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                            <Trash2 className="h-4 w-4" />
                        </Button>
                    )}
                </div>
            ),
        },
    ];

    const handlePageChange = (page: number) => {
        router.get('/dashboard/broadcasts', {
            page,
            per_page: broadcasts.per_page,
            search: filters.search || undefined,
            filters: {
                status: filters.status && filters.status !== 'all' ? filters.status : undefined,
                sent_from: filters.sent_from || undefined,
                sent_to: filters.sent_to || undefined,
            },
        }, { preserveState: true });
    };

    const handlePerPageChange = (perPage: number) => {
        router.get('/dashboard/broadcasts', {
            page: 1,
            per_page: perPage,
            search: filters.search || undefined,
            filters: {
                status: filters.status && filters.status !== 'all' ? filters.status : undefined,
                sent_from: filters.sent_from || undefined,
                sent_to: filters.sent_to || undefined,
            },
        }, { preserveState: true, preserveScroll: true });
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={t('broadcast_management')} />
            
            <div className={cn("flex h-full flex-1 flex-col gap-6 overflow-x-auto rounded-xl bg-card dark:bg-card p-6 border border-border", isRTL ? '!text-right' : '!text-left')} dir={dir}>
                {/* Header */}
                <div className={cn("flex items-center justify-between border-b pb-4", flexDirection)}>
                    <div className={cn(isRTL ? '!text-right' : '!text-left')}>
                        <h1 className={cn("text-3xl font-bold text-foreground", isRTL ? '!text-right' : '!text-left')}>{t('broadcast_management')}</h1>
                        <p className={cn("text-muted-foreground mt-1", isRTL ? '!text-right' : '!text-left')}>{t('send_and_manage_broadcasts') || t('broadcast_management')}</p>
                    </div>
                    <Link href="/dashboard/broadcasts/create">
                        <Button className={cn("flex items-center gap-2", flexDirection)}>
                            <Plus className={cn("h-4 w-4", iconMargin('md'))} />
                            {t('create_broadcast')}
                        </Button>
                    </Link>
                </div>

                {/* Pagination Info and Show Filters Button in same row */}
                <div className={cn("flex items-center justify-between", flexDirection)}>
                    <div className={cn("flex items-center gap-2", flexDirection)}>
                        <span className={cn("text-sm text-foreground", isRTL ? '!text-right' : '!text-left')}>
                            {t('showing')} {((broadcasts.current_page - 1) * broadcasts.per_page) + 1} {t('of')} {broadcasts.total} {t('results')}
                        </span>
                        <Select value={broadcasts.per_page.toString()} onValueChange={(value) => handlePerPageChange(Number(value))}>
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
                            className={`flex items-center gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}
                        >
                            <Filter className="h-4 w-4" />
                            {showFilters ? t('hide_filters') : t('show_filters')}
                            {activeFilters.length > 0 && (
                                <span className={`${isRTL ? 'mr-1' : 'ml-1'} px-1.5 py-0.5 text-xs bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-300 rounded-full`}>
                                    {activeFilters.length}
                                </span>
                            )}
                        </Button>
                    </div>
                </div>

                {/* Filters - Show between button and table when toggled */}
                {showFilters && (
                    <CollapsibleFilters
                        activeFilters={activeFilters}
                        onRemoveFilter={(key) => {
                            switch (key) {
                                case 'search':
                                    handleFilterChange('search', '');
                                    break;
                                case 'status':
                                    handleFilterChange('status', 'all');
                                    break;
                                case 'sent_from':
                                    handleFilterChange('sent_from', '');
                                    break;
                                case 'sent_to':
                                    handleFilterChange('sent_to', '');
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
                            id="status"
                            label={t('broadcast_status')}
                            value={filters.status}
                            onChange={(value) => handleFilterChange('status', value)}
                            options={statusOptions}
                            placeholder={t('all')}
                        />
                        
                        <DateRangeFilter
                            id="sent_date"
                            label={t('sent_at')}
                            fromValue={filters.sent_from}
                            toValue={filters.sent_to}
                            onFromChange={(value) => handleFilterChange('sent_from', value)}
                            onToChange={(value) => handleFilterChange('sent_to', value)}
                            fromPlaceholder={t('date_from')}
                            toPlaceholder={t('date_to')}
                        />
                    </CollapsibleFilters>
                )}

                {/* Data Table */}
                <DataTable
                    data={optimisticBroadcasts}
                    columns={columns}
                    total={broadcasts.total}
                    currentPage={broadcasts.current_page}
                    perPage={broadcasts.per_page}
                    onPageChange={handlePageChange}
                    onPerPageChange={handlePerPageChange}
                    locale={locale}
                />
            </div>

            {/* Delete Confirmation Dialog */}
            <ConfirmationDialog
                open={deleteDialog.open}
                onOpenChange={(open) => setDeleteDialog({ open, broadcastId: null })}
                onConfirm={confirmDelete}
                title={t('delete_broadcast')}
                description={
                    deleteDialog.broadcastTitle
                        ? (t('are_you_sure_delete_broadcast') || t('are_you_sure_delete'))
                            .replace(/:title/g, deleteDialog.broadcastTitle)
                        : (t('are_you_sure_delete_broadcast') || t('are_you_sure_delete'))
                }
                variant="danger"
                confirmText={t('delete')}
                cancelText={t('cancel')}
            />

            {/* Schedule Dialog */}
            <Dialog open={scheduleDialog.open} onOpenChange={(open) => setScheduleDialog({ open, broadcastId: null })}>
                <DialogContent className={isRTL ? 'text-right' : ''} dir={isRTL ? 'rtl' : 'ltr'}>
                    <DialogHeader className={isRTL ? 'text-right' : ''} dir={isRTL ? 'rtl' : 'ltr'}>
                        <DialogTitle className={isRTL ? 'text-right' : ''} dir={isRTL ? 'rtl' : 'ltr'}>{t('schedule_broadcast')}</DialogTitle>
                        <DialogDescription className={isRTL ? 'text-right' : ''} dir={isRTL ? 'rtl' : 'ltr'}>
                            {t('select_date_and_time_to_schedule_broadcast')}
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className={`space-y-2 ${isRTL ? 'text-right' : ''}`}>
                        <Label htmlFor="schedule_datetime" className={isRTL ? 'text-right' : ''}>{t('date_and_time')}</Label>
                            <Input
                                id="schedule_datetime"
                                type="datetime-local"
                                value={scheduleDateTime}
                                onChange={(e) => setScheduleDateTime(e.target.value)}
                                min={new Date().toISOString().slice(0, 16)}
                                className="w-full"
                            />
                            <p className="text-sm text-muted-foreground">
                                {t('schedule_datetime_help')}
                            </p>
                        </div>
                    </div>
                    <DialogFooter className={isRTL ? 'flex-row-reverse' : ''}>
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => setScheduleDialog({ open: false, broadcastId: null })}
                            className={isRTL ? 'flex-row-reverse' : ''}
                        >
                            {t('cancel')}
                        </Button>
                        <Button
                            type="button"
                            onClick={confirmSchedule}
                            disabled={!scheduleDateTime || new Date(scheduleDateTime) <= new Date()}
                            className={isRTL ? 'flex-row-reverse' : ''}
                        >
                            {t('schedule')}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </AppLayout>
    );
}