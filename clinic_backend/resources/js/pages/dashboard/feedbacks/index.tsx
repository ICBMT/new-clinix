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
    user?: { id: number; name: string; email?: string };
    booking?: {
        id: number;
        clinic?: { id: number; name_en: string; name_ar: string };
        treatment?: { id: number; name_en: string; name_ar: string };
    };
    rating: number;
    comment?: string;
    additional_data?: any;
    created_at: string;
}

interface FeedbacksPageProps {
    feedbacks: {
        data: Feedback[];
        current_page: number;
        last_page: number;
        per_page: number;
        total: number;
    };
    filters: {
        search?: string;
        status?: string;
        created_from?: string;
        created_to?: string;
    };
}

export default function FeedbacksIndex({ feedbacks, filters: initialFilters }: FeedbacksPageProps) {
    useRTLInit();
    const { t, locale } = useTranslation();
    const { isRTL, dir, textAlign, flexDirection, iconMargin } = useRTL();

    const breadcrumbs: BreadcrumbItem[] = [
        {
            title: t('dashboard'),
            href: dashboard.url(),
        },
        {
            title: t('feedbacks_management'),
            href: '/dashboard/feedbacks',
        },
    ];
    const [optimisticFeedbacks, setOptimisticFeedbacks] = useState(feedbacks.data);
    const [showFilters, setShowFilters] = useState(false);
    const [isInitialLoad, setIsInitialLoad] = useState(true);

    const [filters, setFilters] = useState({
        search: initialFilters?.search || '',
        rating: initialFilters?.rating || 'all',
        created_from: initialFilters?.created_from || '',
        created_to: initialFilters?.created_to || '',
    });

    const applyFiltersToBackend = useCallback((filtersToApply: typeof filters) => {
        router.get('/dashboard/feedbacks', {
            page: 1,
            search: filtersToApply.search || undefined,
            filters: {
                rating: filtersToApply.rating && filtersToApply.rating !== 'all' ? filtersToApply.rating : undefined,
                created_from: filtersToApply.created_from || undefined,
                created_to: filtersToApply.created_to || undefined,
            },
        }, { preserveState: true });
    }, []);

    useEffect(() => {
        setOptimisticFeedbacks(feedbacks.data);
    }, [feedbacks.data]);

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

    const ratingOptions: SelectOption[] = [
        { value: 'all', label: t('all') },
        { value: '1', label: '1 ' + t('star') },
        { value: '2', label: '2 ' + t('stars') },
        { value: '3', label: '3 ' + t('stars') },
        { value: '4', label: '4 ' + t('stars') },
        { value: '5', label: '5 ' + t('stars') },
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

        if (filters.rating && filters.rating !== 'all') {
            const option = ratingOptions.find(o => o.value === filters.rating);
            active.push({
                key: 'rating',
                label: t('rating'),
                value: filters.rating,
                displayValue: option?.label || filters.rating,
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
        } else if (key === 'rating') {
            newFilters.rating = 'all';
        } else {
            newFilters[key as keyof typeof filters] = '';
        }

        setFilters(newFilters);
    };

    const handleClearAllFilters = () => {
        const clearedFilters = {
            search: '',
            rating: 'all',
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
            key: 'clinic',
            label: t('clinic'),
            render: (_: unknown, feedback: Feedback) => (
                feedback.booking?.clinic ? (
                    <span className={cn("text-sm font-medium", textAlign)} dir={dir}>
                        {isRTL ? feedback.booking.clinic.name_ar : feedback.booking.clinic.name_en}
                    </span>
                ) : (
                    <span className={cn("text-muted-foreground", textAlign)} dir={dir}>—</span>
                )
            ),
        },
        {
            key: 'comment',
            label: t('comment'),
            render: (_: unknown, feedback: Feedback) => (
                <span className={cn("text-sm", textAlign)} dir={dir}>{feedback.comment || '—'}</span>
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
            key: 'created_at',
            label: t('created_at'),
            render: (date: string) => (
                <span className={cn("text-sm", textAlign)} dir={dir}>{formatHumanDate(date)}</span>
            ),
        },
        {
            key: 'actions',
            label: t('actions'),
            render: (_: unknown, feedback: Feedback) => (
                <div className={cn("flex items-center gap-1", isRTL ? 'justify-start flex-row-reverse' : 'justify-end')}>
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => router.visit(`/dashboard/feedbacks/${feedback.id}`)}
                        title={t('view')}
                    >
                        <Eye className="h-4 w-4" />
                    </Button>
                </div>
            ),
        },
    ];

    const handlePageChange = (page: number) => {
        router.get('/dashboard/feedbacks', {
            page,
            per_page: feedbacks.per_page,
            search: filters.search || undefined,
            filters: {
                rating: filters.rating && filters.rating !== 'all' ? filters.rating : undefined,
                created_from: filters.created_from || undefined,
                created_to: filters.created_to || undefined,
            },
        }, { preserveState: true });
    };

    const handlePerPageChange = (perPage: number) => {
        router.get('/dashboard/feedbacks', {
            per_page: perPage,
            page: 1,
            search: filters.search || undefined,
            filters: {
                rating: filters.rating && filters.rating !== 'all' ? filters.rating : undefined,
                created_from: filters.created_from || undefined,
                created_to: filters.created_to || undefined,
            },
        }, { preserveState: true });
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={t('feedbacks_management')} />
            
            <div className={cn("flex h-full flex-1 flex-col gap-6 overflow-x-auto rounded-xl bg-card dark:bg-card p-6 border border-border", textAlign)} dir={dir}>
                <div className={cn("flex items-center justify-between border-b pb-4", flexDirection)}>
                    <div className={textAlign}>
                        <h1 className={cn("text-3xl font-bold text-foreground", textAlign)}>{t('feedbacks_management')}</h1>
                        <p className={cn("text-muted-foreground mt-1", textAlign)}>{t('manage_feedbacks')}</p>
                    </div>
                </div>

                <div className={cn("flex items-center justify-between", flexDirection)}>
                    <div className={cn("flex items-center gap-2", flexDirection)}>
                        <span className={cn("text-sm text-foreground", textAlign)}>
                            {t('showing')} {((feedbacks.current_page - 1) * feedbacks.per_page) + 1} {t('of')} {feedbacks.total} {t('results')}
                        </span>
                        <Select value={feedbacks.per_page.toString()} onValueChange={(value) => handlePerPageChange(Number(value))}>
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
                            id="rating"
                            label={t('rating')}
                            value={filters.rating}
                            onChange={(value) => setFilters(prev => ({ ...prev, rating: value }))}
                            options={ratingOptions}
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
                    total={feedbacks.total}
                    currentPage={feedbacks.current_page}
                    perPage={feedbacks.per_page}
                    onPageChange={handlePageChange}
                    onPerPageChange={handlePerPageChange}
                />
            </div>
        </AppLayout>
    );
}

