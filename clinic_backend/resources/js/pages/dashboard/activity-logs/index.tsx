import { DataTable } from '@/components/data-table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
    type ActiveFilter 
} from '@/components/filters';
import { ConfirmationDialog } from '@/components/confirmation-dialog';
import AppLayout from '@/layouts/app-layout';
import { useTranslation } from '@/hooks/use-translation';
import { useRTL } from '@/hooks/use-rtl';
import { useRTLInit } from '@/hooks/use-rtl-init';
import { Head, Link, router, usePage } from '@inertiajs/react';
import { Eye, Trash2, Filter, User, Target, Calendar } from 'lucide-react';
import { useState, useEffect, useCallback } from 'react';
import { customToast } from '@/components/ui/custom-toast';
import { type BreadcrumbItem, type SharedData } from '@/types';
import { formatHumanDate } from '@/utils/date-utils';
import { index as dashboard } from '@/routes/dashboard';
import { cn } from '@/lib/utils';

interface ActivityLog {
    id: number;
    log_name: string;
    description: string;
    event: string;
    created_at: string;
    causer?: {
        id: number;
        name: string;
        email: string;
    };
    subject?: {
        id: number;
        name?: string;
        email?: string;
        title?: string;
    };
}

interface ActivityLogsPageProps {
    activityLogs: {
        data: ActivityLog[];
        current_page: number;
        last_page: number;
        per_page: number;
        total: number;
        from: number;
        to: number;
    };
    filters: {
        search?: string;
        entity_type?: string;
    };
}

export default function ActivityLogsIndex({ activityLogs, filters: initialFilters }: ActivityLogsPageProps) {
    useRTLInit();
    const { t } = useTranslation();
    const page = usePage<SharedData>();
    const { locale: pageLocale } = page.props;
    const isRTL = pageLocale === 'ar';
    const dir = isRTL ? 'rtl' : 'ltr';
    const { flexDirection, iconMargin } = useRTL();
    const { flash, auth } = page.props as { 
        flash?: { success?: string; error?: string };
        auth?: { user?: { roles?: string[] } };
    };
    
    // Check if current user is super-admin
    const isSuperAdmin = auth?.user?.roles?.includes('super-admin') || false;
    
    const [showFilters, setShowFilters] = useState(false);
    const [isInitialLoad, setIsInitialLoad] = useState(true);
    const [deleteAllDialog, setDeleteAllDialog] = useState(false);

    // Filter states
    const [filters, setFilters] = useState({
        search: initialFilters?.search || '',
        entity_type: initialFilters?.entity_type || 'all',
    });

    // Get current active tab from URL or default to 'all'
    const getCurrentTab = () => {
        const urlParams = new URLSearchParams(window.location.search);
        const entityType = urlParams.get('filters[entity_type]');
        return entityType || initialFilters?.entity_type || 'all';
    };

    const [activeTab, setActiveTab] = useState(getCurrentTab());

    const applyFiltersToBackend = useCallback((filtersToApply: typeof filters) => {
        router.get('/dashboard/activity-logs', {
            page: 1, // Reset to first page when applying filters
            search: filtersToApply.search || undefined,
            filters: {
                entity_type: filtersToApply.entity_type && filtersToApply.entity_type !== 'all' ? filtersToApply.entity_type : undefined,
            },
        }, { preserveState: true, preserveScroll: true });
    }, []);

    // Flash messages
    useEffect(() => {
        if (flash?.success) {
            customToast.success(flash.success);
        }
        if (flash?.error) {
            customToast.error(flash.error);
        }
    }, [flash]);

    // Auto-apply filters when they change
    useEffect(() => {
        // Skip auto-apply on initial load
        if (isInitialLoad) {
            setIsInitialLoad(false);
            return;
        }

        const timeoutId = setTimeout(() => {
            applyFiltersToBackend(filters);
        }, 300);

        return () => clearTimeout(timeoutId);
    }, [filters, applyFiltersToBackend, isInitialLoad]);

    const handleRemoveFilter = (filterName: string) => {
        setFilters((prev) => ({
            ...prev,
            [filterName]: filterName === 'entity_type' ? 'all' : '',
        }));
    };

    const handleClearAllFilters = () => {
        const clearedFilters = {
            search: '',
            entity_type: 'all',
        };
        setFilters(clearedFilters);
    };

    const handlePageChange = (page: number) => {
        router.get('/dashboard/activity-logs', {
            page,
            per_page: activityLogs.per_page,
            search: filters.search || undefined,
            filters: {
                entity_type: filters.entity_type && filters.entity_type !== 'all' ? filters.entity_type : undefined,
            },
        }, { preserveState: true, preserveScroll: true });
    };

    const handlePerPageChange = (perPage: number) => {
        router.reload({
            data: {
                per_page: perPage,
                page: 1,
            },
            only: [],
        });
    };

    const handleTabChange = (tabValue: string) => {
        setActiveTab(tabValue);
        const newFilters = {
            ...filters,
            entity_type: tabValue,
        };
        setFilters(newFilters);
        
        router.get('/dashboard/activity-logs', {
            page: 1,
            search: newFilters.search || undefined,
            filters: {
                entity_type: tabValue !== 'all' ? tabValue : undefined,
            },
        }, {
            preserveState: true,
            preserveScroll: true,
        });
    };

    // Get active filters
    const getActiveFilters = (): ActiveFilter[] => {
        const activeFilters: ActiveFilter[] = [];

        if (filters.search) {
            activeFilters.push({
                key: 'search',
                label: t('search'),
                value: filters.search,
                displayValue: filters.search,
            });
        }

        return activeFilters;
    };

    // Handle delete all activity logs
    const handleDeleteAll = () => {
        router.delete('/dashboard/activity-logs/delete-all', {
            preserveScroll: true,
            onSuccess: () => {
                setDeleteAllDialog(false);
            },
        });
    };

    const breadcrumbs: BreadcrumbItem[] = [
        { title: t('dashboard'), href: dashboard.url() },
        { title: t('activity_logs'), href: '/dashboard/activity-logs' },
    ];

    // Helper to render description with bold text - strip HTML tags first
    const renderDescriptionWithBold = (description: string) => {
        if (!description) return '';

        const strippedDescription = description.replace(/<[^>]*>/g, '');

        // Build terms from translation keys to avoid hardcoded text
        const boldKeys = [
            'created',
            'updated',
            'deleted',
            'login',
            'logout',
            'registered',
            'reset',
            'verified',
        ];

        const escapeRegex = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

        const boldTerms = Array.from(new Set(boldKeys.flatMap((key) => {
            const translated = t(key);
            return [translated, key, key.replace(/_/g, ' ')];
        }).filter(Boolean)));

        const regex = new RegExp(`\\b(${boldTerms.map(escapeRegex).join('|')})\\b`, 'gi');

        const parts = strippedDescription.split(regex);
        return parts.map((part, index) => {
            if (boldTerms.some(term => term.toLowerCase() === part.toLowerCase())) {
                return <strong key={index} className="font-semibold">{part}</strong>;
            }
            return <span key={index}>{part}</span>;
        });
    };

    const columns = [
        {
            key: 'action',
            label: t('action'),
            render: (_: unknown, activityLog: ActivityLog) => {
                const eventType = activityLog.event || activityLog.log_name || 'system';
                const formattedEventType = eventType
                    .split('_')
                    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
                    .join(' ');
                const performerName = activityLog.causer?.name || activityLog.causer?.email || t('system');
                const targetName = activityLog.subject?.name || activityLog.subject?.title || activityLog.subject?.email || t('n_a');
                
                return (
                    <div className={cn("p-2 w-full max-w-full", isRTL ? '!text-right' : '!text-left')} dir={dir}>
                        <div className={cn("flex items-start gap-4 p-3 border rounded-lg w-full max-w-full", isRTL ? "flex-row-reverse" : "flex-row")} dir={dir}>
                            {/* View Action - Appears on right in LTR, left in RTL */}
                            <div className={cn("flex-shrink-0", isRTL ? "order-1" : "order-2")}>
                                <Link href={`/dashboard/activity-logs/${activityLog.id}`}>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        className="text-purple-600 dark:text-purple-400 hover:text-purple-500 dark:hover:text-purple-300 hover:bg-purple-50 dark:hover:bg-purple-900/20"
                                        dir={dir}
                                    >
                                        <Eye className="h-4 w-4" />
                                    </Button>
                                </Link>
                            </div>
                            
                            {/* Event Content - Appears on left in LTR, right in RTL */}
                            <div className={cn("flex-1 min-w-0 overflow-hidden w-full max-w-full", isRTL ? "order-2" : "order-1")}>
                                {/* Event Header - Inline */}
                                <div className={cn("flex items-start gap-2 mb-2 flex-wrap", flexDirection)} dir={dir}>
                                    <Badge variant="secondary" className={cn("text-xs px-2 py-1 flex-shrink-0", isRTL ? '!text-right' : '!text-left')} dir={dir}>
                                        {activityLog.log_name || formattedEventType}
                                    </Badge>
                                    <div className={cn("text-sm text-foreground break-words overflow-wrap-anywhere line-clamp-2 flex-1 min-w-0", isRTL ? '!text-right' : '!text-left')} dir={dir} title={activityLog.description?.replace(/<[^>]*>/g, '')}>
                                        {renderDescriptionWithBold(activityLog.description)}
                                    </div>
                                </div>

                                {/* Metadata - Horizontal Layout */}
                                <div className={cn("flex items-center gap-4 text-xs text-muted-foreground flex-wrap", flexDirection)} dir={dir}>
                                    {/* Performed By */}
                                    <div className={cn("flex items-center gap-1", flexDirection)} dir={dir}>
                                        <User className="h-3 w-3" />
                                        <span className={cn("text-gray-400", isRTL ? '!text-right' : '!text-left')} dir={dir}>{t('performed_by')}:</span>
                                        <span className={cn("font-medium text-foreground", isRTL ? '!text-right' : '!text-left')} dir={dir}>
                                            {performerName}
                                        </span>
                                    </div>
                                    <span>•</span>
                                    {/* Target */}
                                    <div className={cn("flex items-center gap-1", flexDirection)} dir={dir}>
                                        <Target className="h-3 w-3" />
                                        <span className={cn("text-gray-400", isRTL ? '!text-right' : '!text-left')} dir={dir}>{t('target')}:</span>
                                        <span className={cn("font-medium text-foreground", isRTL ? '!text-right' : '!text-left')} dir={dir}>
                                            {targetName}
                                        </span>
                                    </div>
                                    <span>•</span>
                                    {/* Performed At */}
                                    <div className={cn("flex items-center gap-1", flexDirection)} dir={dir}>
                                        <Calendar className="h-3 w-3" />
                                        <span className={cn("text-gray-400", isRTL ? '!text-right' : '!text-left')} dir={dir}>{t('performed_at')}:</span>
                                        <span className={cn("font-medium text-foreground", isRTL ? '!text-right' : '!text-left')} dir={dir}>
                                            {formatHumanDate(activityLog.created_at, t)}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                );
            },
        },
    ];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={t('activity_logs')} />
            
            <div className={cn("flex h-full flex-1 flex-col gap-6 rounded-xl bg-card dark:bg-card p-6 border border-border", isRTL ? '!text-right' : '!text-left')} dir={dir}>
                {/* Header */}
                <div className={cn("flex items-center justify-between border-b pb-4", flexDirection)} dir={dir}>
                    <div className={cn(isRTL ? '!text-right' : '!text-left')} dir={dir}>
                        <h1 className={cn("text-3xl font-bold text-foreground", isRTL ? '!text-right' : '!text-left')} dir={dir}>{t('activity_logs')}</h1>
                        <p className={cn("text-muted-foreground mt-1", isRTL ? '!text-right' : '!text-left')} dir={dir}>{t('view_all_system_activities')}</p>
                    </div>
                    {isSuperAdmin && (
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setDeleteAllDialog(true)}
                            className={cn("text-red-600 hover:text-red-700 hover:bg-red-50", flexDirection)}
                            dir={dir}
                        >
                            <Trash2 className={cn("h-4 w-4", iconMargin('md'))} />
                            {t('delete_all_activity_logs')}
                        </Button>
                    )}
                </div>

                {/* Tabs */}
                <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full" dir={dir}>
                    <TabsList className={cn("grid w-full grid-cols-6", flexDirection)} dir={dir}>
                        <TabsTrigger value="all" className={cn(isRTL ? '!text-right' : '!text-left')} dir={dir}>{t('all')}</TabsTrigger>
                        <TabsTrigger value="admin" className={cn(isRTL ? '!text-right' : '!text-left')} dir={dir}>{t('admins')}</TabsTrigger>
                        <TabsTrigger value="clinic" className={cn(isRTL ? '!text-right' : '!text-left')} dir={dir}>{t('clinics')}</TabsTrigger>
                        <TabsTrigger value="clinic_manager" className={cn(isRTL ? '!text-right' : '!text-left')} dir={dir}>{t('clinic_managers')}</TabsTrigger>
                        <TabsTrigger value="user" className={cn(isRTL ? '!text-right' : '!text-left')} dir={dir}>{t('users')}</TabsTrigger>
                        <TabsTrigger value="guest" className={cn(isRTL ? '!text-right' : '!text-left')} dir={dir}>{t('guests')}</TabsTrigger>
                    </TabsList>
                </Tabs>

                {/* Pagination Info and Show Filters Button */}
                <div className={cn("flex items-center justify-between", flexDirection)} dir={dir}>
                    <div className={cn("flex items-center gap-2", flexDirection)} dir={dir}>
                        <span className={cn("text-sm text-foreground", isRTL ? '!text-right' : '!text-left')} dir={dir}>
                            {t('showing')} {((activityLogs.current_page - 1) * activityLogs.per_page) + 1} {t('of')} {activityLogs.total} {t('results')}
                        </span>
                        <Select value={activityLogs.per_page.toString()} onValueChange={(value) => handlePerPageChange(Number(value))}>
                            <SelectTrigger className={cn("w-20", isRTL ? '!text-right' : '!text-left')} dir={dir}>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent dir={dir}>
                                <SelectItem value="10" dir={dir}>10</SelectItem>
                                <SelectItem value="15" dir={dir}>15</SelectItem>
                                <SelectItem value="25" dir={dir}>25</SelectItem>
                                <SelectItem value="50" dir={dir}>50</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div className={cn("flex items-center gap-2", flexDirection)} dir={dir}>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setShowFilters(!showFilters)}
                            className={cn("flex items-center gap-2", flexDirection)}
                            dir={dir}
                        >
                            <Filter className={cn("h-4 w-4", iconMargin('sm'))} />
                            {showFilters ? t('hide_filters') : t('show_filters')}
                            {getActiveFilters().length > 0 && (
                                <span className={cn("px-1.5 py-0.5 text-xs bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-300 rounded-full", iconMargin('sm'))} dir={dir}>
                                    {getActiveFilters().length}
                                </span>
                            )}
                        </Button>
                    </div>
                </div>

                {/* Filters */}
                {showFilters && (
                    <CollapsibleFilters
                        activeFilters={getActiveFilters()}
                        onRemoveFilter={handleRemoveFilter}
                        onClearAll={handleClearAllFilters}
                        isOpen={true}
                    >
                        <SearchFieldFilter
                            id="search"
                            label={t('search')}
                            value={filters.search}
                            onChange={(value) => setFilters(prev => ({ ...prev, search: value }))}
                            placeholder={t('search_activities')}
                        />
                    </CollapsibleFilters>
                )}

                {/* Activity Logs Data Table */}
                <DataTable
                    data={activityLogs.data}
                    columns={columns}
                    total={activityLogs.total}
                    currentPage={activityLogs.current_page}
                    perPage={activityLogs.per_page}
                    onPageChange={handlePageChange}
                    onPerPageChange={handlePerPageChange}
                />
            </div>

            {/* Delete All Confirmation Dialog */}
            <ConfirmationDialog
                open={deleteAllDialog}
                onOpenChange={setDeleteAllDialog}
                onConfirm={handleDeleteAll}
                title={t('delete_all_activity_logs')}
                description={t('are_you_sure_delete_all_activity_logs')}
                variant="danger"
                confirmText={t('delete')}
            />
        </AppLayout>
    );
}