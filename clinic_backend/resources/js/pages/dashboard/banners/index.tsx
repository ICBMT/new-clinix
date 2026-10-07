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
import { useTranslation } from '@/hooks/use-translation';
import { useRTL } from '@/hooks/use-rtl';
import { useRTLInit } from '@/hooks/use-rtl-init';
import { usePermissions } from '@/hooks/use-permissions';
import { type SharedData } from '@/types';
import { Head, Link, router, usePage } from '@inertiajs/react';
import { Plus, Eye, Edit, Trash2, Filter } from 'lucide-react';
import { useState, useEffect, useCallback } from 'react';
import { customToast } from '@/components/ui/custom-toast';
import { index as dashboard } from '@/routes/dashboard';
import { type BreadcrumbItem } from '@/types';
import { formatHumanDate } from '@/utils/date-utils';
import { cn } from '@/lib/utils';

interface Banner {
    id: number;
    title_en: string;
    title_ar: string;
    description_en?: string;
    description_ar?: string;
    image_url?: string;
    mobile_image_url?: string;
    link_url?: string;
    type?: string;
    category?: { id: number; name_en: string; name_ar: string };
    service?: { id: number; name_en: string; name_ar: string };
    position?: string;
    sort_order: number;
    start_date?: string;
    end_date?: string;
    status: 'active' | 'inactive';
    click_count: number;
    view_count: number;
    created_at: string;
}

interface BannersPageProps {
    banners: {
        data: Banner[];
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

export default function BannersIndex({ banners, filters: initialFilters }: BannersPageProps) {
    useRTLInit();
    const { t, locale } = useTranslation();
    const page = usePage<SharedData>();
    const { locale: pageLocale } = page.props;
    const isRTL = pageLocale === 'ar';
    const dir = isRTL ? 'rtl' : 'ltr';
    const { flexDirection, iconMargin } = useRTL();
    const { can } = usePermissions();
    
    const breadcrumbs: BreadcrumbItem[] = [
        {
            title: t('dashboard'),
            href: dashboard.url(),
        },
        {
            title: t('banners_management'),
            href: '/dashboard/banners',
        },
    ];
    const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; bannerId: number | null }>({ 
        open: false, 
        bannerId: null 
    });
    const [optimisticBanners, setOptimisticBanners] = useState(banners.data);
    const [showFilters, setShowFilters] = useState(false);
    const [isInitialLoad, setIsInitialLoad] = useState(true);

    const [filters, setFilters] = useState({
        search: initialFilters?.search || '',
        status: initialFilters?.status || 'all',
        created_from: initialFilters?.created_from || '',
        created_to: initialFilters?.created_to || '',
    });

    const applyFiltersToBackend = useCallback((filtersToApply: typeof filters) => {
        router.get('/dashboard/banners', {
            page: 1,
            search: filtersToApply.search || undefined,
            filters: {
                status: filtersToApply.status && filtersToApply.status !== 'all' ? filtersToApply.status : undefined,
                created_from: filtersToApply.created_from || undefined,
                created_to: filtersToApply.created_to || undefined,
            },
        }, { preserveState: true, preserveScroll: true });
    }, []);

    useEffect(() => {
        setOptimisticBanners(banners.data);
    }, [banners.data]);

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
        { value: 'active', label: t('active') },
        { value: 'inactive', label: t('inactive') },
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
                filters.created_from && `${t('date_from') || t('from_date')}: ${filters.created_from}`,
                filters.created_to && `${t('date_to') || t('to_date')}: ${filters.created_to}`,
            ].filter(Boolean).join(' | ');

            active.push({
                key: 'created_date',
                label: t('created_date') || t('created_at'),
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
            key: 'banner',
            label: t('banner_title') || t('title'),
            render: (_: unknown, banner: Banner) => (
                <div className={cn("flex items-center gap-3", flexDirection)}>
                    {banner.image_url ? (
                        <img 
                            src={banner.image_url} 
                            alt={isRTL ? banner.title_ar : banner.title_en}
                            className="w-16 h-16 object-cover rounded flex-shrink-0"
                            onError={(e) => {
                                const target = e.target as HTMLImageElement;
                                target.style.display = 'none';
                            }}
                        />
                    ) : (
                        <div className="w-16 h-16 flex-shrink-0 bg-muted rounded flex items-center justify-center">
                            <span className="text-muted-foreground text-xs">—</span>
                        </div>
                    )}
                    <div className={cn("space-y-1 min-w-0 flex-1", isRTL ? '!text-right' : '!text-left')}>
                        <span className={cn("font-medium block", isRTL ? '!text-right' : '!text-left')} dir={dir}>
                            {isRTL ? banner.title_ar : banner.title_en}
                        </span>
                        {(banner.description_en || banner.description_ar) && (
                            <p className={cn("text-xs text-muted-foreground line-clamp-2", isRTL ? '!text-right' : '!text-left')} dir={dir}>
                                {isRTL ? (banner.description_ar || '') : (banner.description_en || '')}
                            </p>
                        )}
                    </div>
                </div>
            ),
        },
        {
            key: 'status',
            label: t('status'),
            render: (_: unknown, banner: Banner) => (
                <Badge 
                    variant={banner.status === 'active' ? 'default' : 'secondary'}
                    className={cn(
                        banner.status === 'active' 
                            ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300' 
                            : 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300',
                        isRTL ? '!text-right' : '!text-left'
                    )}
                >
                    {t(banner.status)}
                </Badge>
            ),
        },
        {
            key: 'start_date',
            label: t('start_date'),
            render: (_: unknown, banner: Banner) => (
                banner.start_date ? (
                    <span className={cn("text-sm text-muted-foreground", isRTL ? '!text-right' : '!text-left')} dir={dir}>
                        {formatHumanDate(banner.start_date, t)}
                    </span>
                ) : (
                    <span className={cn("text-muted-foreground text-sm", isRTL ? '!text-right' : '!text-left')}>—</span>
                )
            ),
        },
        {
            key: 'end_date',
            label: t('end_date'),
            render: (_: unknown, banner: Banner) => (
                banner.end_date ? (
                    <span className={cn("text-sm text-muted-foreground", isRTL ? '!text-right' : '!text-left')} dir={dir}>
                        {formatHumanDate(banner.end_date, t)}
                    </span>
                ) : (
                    <span className={cn("text-muted-foreground text-sm", isRTL ? '!text-right' : '!text-left')}>—</span>
                )
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
            render: (_: unknown, banner: Banner) => (
                <div className={cn("flex items-center gap-1 w-full", isRTL ? 'justify-start flex-row-reverse' : 'justify-end')}>
                    {can('banners.show') && (
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => router.visit(`/dashboard/banners/${banner.id}`)}
                            title={t('view')}
                        >
                            <Eye className="h-4 w-4" />
                        </Button>
                    )}
                    {can('banners.edit') && (
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => router.visit(`/dashboard/banners/${banner.id}/edit`)}
                            title={t('edit')}
                        >
                            <Edit className="h-4 w-4" />
                        </Button>
                    )}
                    {can('banners.destroy') && (
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setDeleteDialog({ open: true, bannerId: banner.id })}
                            title={t('delete')}
                            className="text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-900/20"
                        >
                            <Trash2 className="h-4 w-4" />
                        </Button>
                    )}
                </div>
            ),
        },
    ];

    const handleDelete = () => {
        if (deleteDialog.bannerId) {
            const banner = optimisticBanners.find(b => b.id === deleteDialog.bannerId);
            router.delete(`/dashboard/banners/${deleteDialog.bannerId}`, {
                onSuccess: () => {
                    customToast.success(t('banner_deleted_successfully'), banner?.title_en);
                    setOptimisticBanners(prev => prev.filter(b => b.id !== deleteDialog.bannerId));
                },
                onError: () => {
                    customToast.error(t('update_failed'));
                }
            });
        }
    };

    const handlePageChange = (page: number) => {
        router.get('/dashboard/banners', {
            page,
            per_page: banners.per_page,
            search: filters.search || undefined,
            filters: {
                status: filters.status && filters.status !== 'all' ? filters.status : undefined,
                created_from: filters.created_from || undefined,
                created_to: filters.created_to || undefined,
            },
        }, { preserveState: true, preserveScroll: true });
    };

    const handlePerPageChange = (perPage: number) => {
        router.get('/dashboard/banners', {
            page: 1,
            per_page: perPage,
            search: filters.search || undefined,
            filters: {
                status: filters.status && filters.status !== 'all' ? filters.status : undefined,
                created_from: filters.created_from || undefined,
                created_to: filters.created_to || undefined,
            },
        }, { preserveState: true, preserveScroll: true });
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={t('banners_management')} />

            <div className={cn("flex h-full flex-1 flex-col gap-6 overflow-x-auto rounded-xl bg-card dark:bg-card p-6 border border-border", isRTL ? '!text-right' : '!text-left')} dir={dir}>
                {/* Header */}
                <div className={cn("flex items-center justify-between border-b pb-4", flexDirection)}>
                    <div className={cn(isRTL ? '!text-right' : '!text-left')}>
                        <h1 className={cn("text-3xl font-bold text-foreground", isRTL ? '!text-right' : '!text-left')}>{t('banners_management')}</h1>
                        <p className={cn("text-muted-foreground mt-1", isRTL ? '!text-right' : '!text-left')}>{t('manage_banners')}</p>
                    </div>
                    {can('banners.create') && (
                        <Link href="/dashboard/banners/create">
                            <Button className={cn("flex items-center gap-2", flexDirection)}>
                                <Plus className={cn("h-4 w-4", iconMargin('md'))} />
                                {t('add_banner')}
                            </Button>
                        </Link>
                    )}
                </div>

                {/* Pagination Info and Show Filters Button */}
                <div className={cn("flex items-center justify-between", flexDirection)}>
                    <div className={cn("flex items-center gap-2", flexDirection)}>
                        <span className={cn("text-sm text-foreground", isRTL ? '!text-right' : '!text-left')}>
                            {t('showing')} {((banners.current_page - 1) * banners.per_page) + 1} {t('of')} {banners.total} {t('results')}
                        </span>
                        <Select value={banners.per_page.toString()} onValueChange={(value) => handlePerPageChange(Number(value))}>
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
                            <Filter className="h-4 w-4" />
                            {showFilters ? t('hide_filters') : t('show_filters')}
                            {getActiveFilters().length > 0 && (
                                <span className={cn("px-1.5 py-0.5 text-xs bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-300 rounded-full", iconMargin('sm'))}>
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
                        locale={locale}
                    >
                        <SearchFieldFilter
                            id="search"
                            label={t('search')}
                            value={filters.search}
                            onChange={(value) => setFilters(prev => ({ ...prev, search: value }))}
                            placeholder={t('search_banners')}
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

                {/* Data Table */}
                <DataTable
                    data={optimisticBanners}
                    columns={columns}
                    total={banners.total}
                    currentPage={banners.current_page}
                    perPage={banners.per_page}
                    onPageChange={handlePageChange}
                    onPerPageChange={handlePerPageChange}
                    locale={locale}
                />
            </div>

            {/* Delete Dialog */}
            <ConfirmationDialog
                open={deleteDialog.open}
                onOpenChange={(open) => setDeleteDialog({ open, bannerId: null })}
                onConfirm={handleDelete}
                title={t('delete_banner')}
                description={t('are_you_sure_delete_banner')}
                variant="danger"
                confirmText={t('delete')}
            />
        </AppLayout>
    );
}

