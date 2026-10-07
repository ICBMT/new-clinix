import { DataTable } from '@/components/data-table';
import { Button } from '@/components/ui/button';
import { 
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
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
import { Head, router } from '@inertiajs/react';
import { Eye, Filter, Star } from 'lucide-react';
import { useState, useEffect, useCallback } from 'react';
import { index as dashboard } from '@/routes/dashboard';
import { type BreadcrumbItem } from '@/types';
import { formatHumanDate } from '@/utils/date-utils';
import { cn } from '@/lib/utils';

interface Feedback {
    id: number;
    user?: { id: number; name: string };
    type: string;
    subject?: string;
    message?: string;
    rating?: number;
    status: string;
    admin_response?: string;
    created_at: string;
}

interface FeedbacksPageProps {
    feedbacks?: {
        data: Feedback[];
        current_page: number;
        last_page: number;
        per_page: number;
        total: number;
    };
    filters?: {
        search?: string;
        status?: string;
        created_from?: string;
        created_to?: string;
    };
}

export default function ServicesFeedbacksIndex({ feedbacks, filters: initialFilters }: FeedbacksPageProps) {
    useRTLInit();
    const { t, locale } = useTranslation();
    const { isRTL, dir, textAlign, flexDirection, iconMargin } = useRTL();
    
    const breadcrumbs: BreadcrumbItem[] = [
        {
            title: t('dashboard'),
            href: dashboard.url(),
        },
        {
            title: t('service_feedbacks'),
            href: '/dashboard/services-feedbacks',
        },
    ];
    const [optimisticFeedbacks, setOptimisticFeedbacks] = useState(feedbacks?.data || []);
    const [showFilters, setShowFilters] = useState(false);
    const [isInitialLoad, setIsInitialLoad] = useState(true);

    const [filters, setFilters] = useState({
        search: initialFilters?.search || '',
        status: initialFilters?.status || 'all',
        created_from: initialFilters?.created_from || '',
        created_to: initialFilters?.created_to || '',
    });

    const applyFiltersToBackend = useCallback((filtersToApply: typeof filters) => {
        router.get('/dashboard/services-feedbacks', {
            page: 1,
            search: filtersToApply.search || undefined,
            filters: {
                status: filtersToApply.status && filtersToApply.status !== 'all' ? filtersToApply.status : undefined,
                created_from: filtersToApply.created_from || undefined,
                created_to: filtersToApply.created_to || undefined,
            },
        }, { preserveState: true });
    }, []);

    useEffect(() => {
        if (feedbacks?.data) {
            setOptimisticFeedbacks(feedbacks.data);
        }
    }, [feedbacks?.data]);

    useEffect(() => {
        if (isInitialLoad) {
            setIsInitialLoad(false);
            return;
        }
        const timeoutId = setTimeout(() => {
            applyFiltersToBackend(filters);
        }, 300);
        return () => clearTimeout(timeoutId);
    }, [filters, isInitialLoad, applyFiltersToBackend]);

    const statusOptions: SelectOption[] = [
        { value: 'all', label: t('all') },
        { value: 'pending', label: t('pending') },
        { value: 'reviewed', label: t('reviewed') },
        { value: 'resolved', label: t('resolved') },
    ];

    const getActiveFilters = (): ActiveFilter[] => {
        const active: ActiveFilter[] = [];

        if (filters.search) {
            active.push({
                key: 'search',
                label: t('search'),
                value: filters.search,
                displayValue: filters.search,
            });
        }

        if (filters.status && filters.status !== 'all') {
            const option = statusOptions.find(o => o.value === filters.status);
            active.push({
                key: 'status',
                label: t('status'),
                value: filters.status,
                displayValue: option?.label || filters.status,
            });
        }

        if (filters.created_from || filters.created_to) {
            const displayValue = [
                filters.created_from && `${t('date_from')}: ${filters.created_from}`,
                filters.created_to && `${t('date_to')}: ${filters.created_to}`,
            ].filter(Boolean).join(' | ');

            active.push({
                key: 'created_date',
                label: t('created_date'),
                value: [filters.created_from, filters.created_to],
                displayValue,
            });
        }

        return active;
    };

    const handleRemoveFilter = (key: string) => {
        const newFilters = { ...filters };
        
        if (key === 'created_date') {
            newFilters.created_from = '';
            newFilters.created_to = '';
        } else if (key === 'status') {
            newFilters.status = 'all';
        } else {
            newFilters[key as keyof typeof filters] = '';
        }

        setFilters(newFilters);
    };

    const handleClearAllFilters = () => {
        const clearedFilters = {
            search: '',
            status: 'all',
            created_from: '',
            created_to: '',
        };
        setFilters(clearedFilters);
    };

    const columns = [
        {
            key: 'user',
            label: t('user'),
            render: (_: unknown, feedback: Feedback) => (
                feedback.user ? (
                    <span className={cn("text-sm font-medium", textAlign)} dir={dir}>{feedback.user.name}</span>
                ) : (
                    <span className={cn("text-muted-foreground", textAlign)} dir={dir}>—</span>
                )
            ),
        },
        {
            key: 'type',
            label: t('type'),
            render: (_: unknown, feedback: Feedback) => (
                <Badge variant="outline">{t(feedback.type)}</Badge>
            ),
        },
        {
            key: 'subject',
            label: t('subject'),
            render: (_: unknown, feedback: Feedback) => (
                <span className={cn("text-sm", textAlign)} dir={dir}>{feedback.subject || '—'}</span>
            ),
        },
        {
            key: 'rating',
            label: t('rating'),
            render: (_: unknown, feedback: Feedback) => (
                feedback.rating ? (
                    <div className={cn("flex items-center gap-1", flexDirection)}>
                        <Star className={cn("h-4 w-4 text-yellow-500 fill-yellow-500", iconMargin('sm'))} />
                        <span className={cn("text-sm", textAlign)} dir="ltr">{feedback.rating}/5</span>
                    </div>
                ) : (
                    <span className={cn("text-muted-foreground", textAlign)} dir={dir}>—</span>
                )
            ),
        },
        {
            key: 'status',
            label: t('status'),
            render: (_: unknown, feedback: Feedback) => (
                <Badge 
                    variant={feedback.status === 'resolved' ? 'default' : 'secondary'}
                    className={
                        feedback.status === 'resolved' 
                            ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300' 
                            : 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300'
                    }
                >
                    {t(feedback.status)}
                </Badge>
            ),
        },
        {
            key: 'created_at',
            label: t('created_at'),
            render: (date: string) => formatHumanDate(date),
        },
        {
            key: 'actions',
            label: t('actions'),
            render: (_: unknown, feedback: Feedback) => (
                <div className={cn("flex items-center gap-1", isRTL ? 'justify-start flex-row-reverse' : 'justify-end')}>
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => router.visit(`/dashboard/services-feedbacks/${feedback.id}`)}
                        title={t('view')}
                    >
                        <Eye className="h-4 w-4" />
                    </Button>
                </div>
            ),
        },
    ];

    const handlePageChange = (page: number) => {
        router.get('/dashboard/services-feedbacks', {
            page,
            per_page: feedbacks.per_page,
            search: filters.search || undefined,
            filters: {
                status: filters.status && filters.status !== 'all' ? filters.status : undefined,
                created_from: filters.created_from || undefined,
                created_to: filters.created_to || undefined,
            },
        }, { preserveState: true });
    };

    const handlePerPageChange = (perPage: number) => {
        router.get('/dashboard/services-feedbacks', {
            per_page: perPage,
            page: 1,
            search: filters.search || undefined,
            filters: {
                status: filters.status && filters.status !== 'all' ? filters.status : undefined,
                created_from: filters.created_from || undefined,
                created_to: filters.created_to || undefined,
            },
        }, { preserveState: true });
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={t('service_feedbacks')} />
            
            <div className={cn("flex h-full flex-1 flex-col gap-6 overflow-x-auto rounded-xl bg-card dark:bg-card p-6 border border-border", textAlign)} dir={dir}>
                <div className={cn("flex items-center justify-between", flexDirection)}>
                    <div className={textAlign}>
                        <h1 className={cn("text-3xl font-bold text-foreground", textAlign)}>{t('service_feedbacks')}</h1>
                        <p className={cn("text-muted-foreground mt-1", textAlign)}>{t('manage_services_feedbacks')}</p>
                    </div>
                </div>

                <div className={cn("flex items-center justify-between", flexDirection)}>
                    <div className={cn("flex items-center gap-2", flexDirection)}>
                        <span className={cn("text-sm text-foreground", textAlign)}>
                            {t('showing')} {((feedbacks?.current_page || 1) - 1) * (feedbacks?.per_page || 15) + 1} {t('of')} {feedbacks?.total || 0} {t('results')}
                        </span>
                        <Select value={(feedbacks?.per_page || 15).toString()} onValueChange={(value) => handlePerPageChange(Number(value))}>
                            <SelectTrigger className={cn("w-20", textAlign)}>
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
                    
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setShowFilters(!showFilters)}
                        className={cn("flex items-center gap-2", flexDirection)}
                    >
                        <Filter className={cn("h-4 w-4", iconMargin('md'))} />
                        {showFilters ? t('hide_filters') : t('show_filters')}
                        {getActiveFilters().length > 0 && (
                            <span className={cn(isRTL ? 'mr-1' : 'ml-1', "px-1.5 py-0.5 text-xs bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-300 rounded-full")}>
                                {getActiveFilters().length}
                            </span>
                        )}
                    </Button>
                </div>

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
                            placeholder={t('search_placeholder')}
                        />
                        
                        <SelectFilter
                            id="status"
                            label={t('status')}
                            value={filters.status}
                            onChange={(value) => setFilters(prev => ({ ...prev, status: value }))}
                            options={statusOptions}
                            placeholder={t('all')}
                        />
                        
                        <DateRangeFilter
                            id="created_date"
                            label={t('created_date')}
                            fromValue={filters.created_from}
                            toValue={filters.created_to}
                            onFromChange={(value) => setFilters(prev => ({ ...prev, created_from: value }))}
                            onToChange={(value) => setFilters(prev => ({ ...prev, created_to: value }))}
                            fromPlaceholder={t('date_from')}
                            toPlaceholder={t('date_to')}
                        />
                    </CollapsibleFilters>
                )}

                <DataTable
                    data={optimisticFeedbacks}
                    columns={columns}
                    total={feedbacks?.total || 0}
                    currentPage={feedbacks?.current_page || 1}
                    perPage={feedbacks?.per_page || 15}
                    onPageChange={handlePageChange}
                    onPerPageChange={handlePerPageChange}
                />
            </div>
        </AppLayout>
    );
}

