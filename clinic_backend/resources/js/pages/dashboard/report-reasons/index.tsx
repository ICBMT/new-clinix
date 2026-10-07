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
import { ConfirmationDialog } from '@/components/confirmation-dialog';
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
import { Head, Link, router } from '@inertiajs/react';
import { Plus, Eye, Edit, Trash2, Filter } from 'lucide-react';
import { useState, useEffect, useCallback } from 'react';
import { customToast } from '@/components/ui/custom-toast';
import { index as dashboard } from '@/routes/dashboard';
import { type BreadcrumbItem } from '@/types';
import { formatHumanDate } from '@/utils/date-utils';
import { cn } from '@/lib/utils';

interface ReportReason {
    id: number;
    name_en: string;
    name_ar: string;
    key: string;
    is_active: boolean;
    sort_order: number;
    requires_description: boolean;
    created_at: string;
}

interface ReportReasonsPageProps {
    reportReasons: {
        data: ReportReason[];
        current_page: number;
        last_page: number;
        per_page: number;
        total: number;
    };
    filters: {
        search?: string;
        is_active?: string;
        created_from?: string;
        created_to?: string;
    };
}

export default function ReportReasonsIndex({ reportReasons, filters: initialFilters }: ReportReasonsPageProps) {
    useRTLInit();
    const { t, locale } = useTranslation();
    const { isRTL, dir, textAlign, flexDirection, iconMargin } = useRTL();
    
    const breadcrumbs: BreadcrumbItem[] = [
        {
            title: t('dashboard'),
            href: dashboard.url(),
        },
        {
            title: t('report_reasons_management'),
            href: '/dashboard/report-reasons',
        },
    ];
    const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; reasonId: number | null }>({ 
        open: false, 
        reasonId: null 
    });
    const [optimisticReasons, setOptimisticReasons] = useState(reportReasons.data);
    const [showFilters, setShowFilters] = useState(false);
    const [isInitialLoad, setIsInitialLoad] = useState(true);

    const [filters, setFilters] = useState({
        search: initialFilters?.search || '',
        is_active: initialFilters?.is_active || 'all',
        created_from: initialFilters?.created_from || '',
        created_to: initialFilters?.created_to || '',
    });

    const applyFiltersToBackend = useCallback((filtersToApply: typeof filters) => {
        router.get('/dashboard/report-reasons', {
            page: 1,
            search: filtersToApply.search || undefined,
            filters: {
                is_active: filtersToApply.is_active && filtersToApply.is_active !== 'all' ? filtersToApply.is_active : undefined,
                created_from: filtersToApply.created_from || undefined,
                created_to: filtersToApply.created_to || undefined,
            },
        }, { preserveState: true });
    }, []);

    useEffect(() => {
        setOptimisticReasons(reportReasons.data);
    }, [reportReasons.data]);

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
        { value: 'true', label: t('active') },
        { value: 'false', label: t('inactive') },
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

        if (filters.is_active && filters.is_active !== 'all') {
            const option = statusOptions.find(o => o.value === filters.is_active);
            active.push({
                key: 'is_active',
                label: t('status'),
                value: filters.is_active,
                displayValue: option?.label || filters.is_active,
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
        } else if (key === 'is_active') {
            newFilters.is_active = 'all';
        } else {
            newFilters[key as keyof typeof filters] = '';
        }

        setFilters(newFilters);
    };

    const handleClearAllFilters = () => {
        const clearedFilters = {
            search: '',
            is_active: 'all',
            created_from: '',
            created_to: '',
        };
        setFilters(clearedFilters);
    };

    const columns = [
        {
            key: 'name',
            label: t('reason_name'),
            render: (_: unknown, reason: ReportReason) => (
                <span className={cn("font-medium", textAlign)} dir={dir}>
                    {isRTL ? reason.name_ar : reason.name_en}
                </span>
            ),
        },
        {
            key: 'key',
            label: t('key'),
            render: (_: unknown, reason: ReportReason) => (
                <Badge variant="outline" dir="ltr">{reason.key}</Badge>
            ),
        },
        {
            key: 'is_active',
            label: t('status'),
            render: (_: unknown, reason: ReportReason) => (
                <Badge 
                    variant={reason.is_active ? 'default' : 'secondary'}
                    className={
                        reason.is_active 
                            ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300' 
                            : 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300'
                    }
                >
                    {reason.is_active ? t('active') : t('inactive')}
                </Badge>
            ),
        },
        {
            key: 'requires_description',
            label: t('requires_description'),
            render: (_: unknown, reason: ReportReason) => (
                <Badge variant={reason.requires_description ? 'default' : 'outline'}>
                    {reason.requires_description ? t('yes') : t('no')}
                </Badge>
            ),
        },
        {
            key: 'sort_order',
            label: t('sort_order'),
            render: (_: unknown, reason: ReportReason) => (
                <span className={cn("text-sm", textAlign)} dir="ltr">{reason.sort_order}</span>
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
            render: (_: unknown, reason: ReportReason) => (
                <div className={cn("flex items-center gap-1", isRTL ? 'justify-start flex-row-reverse' : 'justify-end')}>
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => router.visit(`/dashboard/report-reasons/${reason.id}`)}
                        title={t('view')}
                    >
                        <Eye className="h-4 w-4" />
                    </Button>
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => router.visit(`/dashboard/report-reasons/${reason.id}/edit`)}
                        title={t('edit')}
                    >
                        <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setDeleteDialog({ open: true, reasonId: reason.id })}
                        title={t('delete')}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                        <Trash2 className="h-4 w-4" />
                    </Button>
                </div>
            ),
        },
    ];

    const handleDelete = () => {
        if (deleteDialog.reasonId) {
            const reason = optimisticReasons.find(r => r.id === deleteDialog.reasonId);
            router.delete(`/dashboard/report-reasons/${deleteDialog.reasonId}`, {
                onSuccess: () => {
                    customToast.success(t('report_reason_deleted_successfully'), reason?.name_en);
                    setOptimisticReasons(prev => prev.filter(r => r.id !== deleteDialog.reasonId));
                },
                onError: () => {
                    customToast.error(t('update_failed'));
                }
            });
        }
    };

    const handlePageChange = (page: number) => {
        router.get('/dashboard/report-reasons', {
            page,
            per_page: reportReasons.per_page,
            search: filters.search || undefined,
            filters: {
                is_active: filters.is_active && filters.is_active !== 'all' ? filters.is_active : undefined,
                created_from: filters.created_from || undefined,
                created_to: filters.created_to || undefined,
            },
        }, { preserveState: true });
    };

    const handlePerPageChange = (perPage: number) => {
        router.get('/dashboard/report-reasons', {
            per_page: perPage,
            page: 1,
            search: filters.search || undefined,
            filters: {
                is_active: filters.is_active && filters.is_active !== 'all' ? filters.is_active : undefined,
                created_from: filters.created_from || undefined,
                created_to: filters.created_to || undefined,
            },
        }, { preserveState: true });
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={t('report_reasons_management')} />
            
            <div className={cn("flex h-full flex-1 flex-col gap-6 overflow-x-auto rounded-xl bg-card dark:bg-card p-6 border border-border", textAlign)} dir={dir}>
                <div className={cn("flex items-center justify-between", flexDirection)}>
                    <div className={textAlign}>
                        <h1 className={cn("text-3xl font-bold text-foreground", textAlign)}>{t('report_reasons_management')}</h1>
                        <p className={cn("text-muted-foreground mt-1", textAlign)}>{t('manage_report_reasons')}</p>
                    </div>
                    <Link href="/dashboard/report-reasons/create">
                        <Button className={cn("flex items-center gap-2", flexDirection)}>
                            <Plus className={cn("h-4 w-4", iconMargin('md'))} />
                            {t('add_report_reason')}
                        </Button>
                    </Link>
                </div>

                <div className={cn("flex items-center justify-between", flexDirection)}>
                    <div className={cn("flex items-center gap-2", flexDirection)}>
                        <span className={cn("text-sm text-foreground", textAlign)}>
                            {t('showing')} {((reportReasons.current_page - 1) * reportReasons.per_page) + 1} {t('of')} {reportReasons.total} {t('results')}
                        </span>
                        <Select value={reportReasons.per_page.toString()} onValueChange={(value) => handlePerPageChange(Number(value))}>
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
                            id="is_active"
                            label={t('status')}
                            value={filters.is_active}
                            onChange={(value) => setFilters(prev => ({ ...prev, is_active: value }))}
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
                    data={optimisticReasons}
                    columns={columns}
                    total={reportReasons.total}
                    currentPage={reportReasons.current_page}
                    perPage={reportReasons.per_page}
                    onPageChange={handlePageChange}
                    onPerPageChange={handlePerPageChange}
                />
            </div>

            <ConfirmationDialog
                open={deleteDialog.open}
                onOpenChange={(open) => setDeleteDialog({ open, reasonId: null })}
                onConfirm={handleDelete}
                title={t('delete_report_reason')}
                description={t('delete_report_reason_confirmation')}
                variant="danger"
                confirmText={t('delete')}
            />
        </AppLayout>
    );
}

