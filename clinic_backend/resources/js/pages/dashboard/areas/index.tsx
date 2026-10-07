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
import { cn } from '@/lib/utils';
import { Plus, Eye, Edit, Trash2, Filter } from 'lucide-react';
import { useState, useEffect, useCallback } from 'react';
import { customToast } from '@/components/ui/custom-toast';
import { index as dashboard } from '@/routes/dashboard';
import { type BreadcrumbItem } from '@/types';
import { formatHumanDate } from '@/utils/date-utils';
import { getLocalizedName } from '@/utils/localization';

interface Area {
    id: number;
    name_en: string;
    name_ar: string;
    governorate_id: number;
    governorate?: { id: number; name_en: string; name_ar: string };
    is_active: boolean;
    created_at: string;
    updated_at: string;
}

interface AreasPageProps {
    areas: {
        data: Area[];
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

// Breadcrumbs will be set inside component to use translation

export default function AreasIndex({ areas, filters: initialFilters }: AreasPageProps) {
    useRTLInit();
    const { t, locale } = useTranslation();
    const page = usePage<SharedData>();
    const { locale: pageLocale } = page.props;
    const isRTL = pageLocale === 'ar';
    const dir = isRTL ? 'rtl' : 'ltr';
    const { flexDirection, iconMargin } = useRTL();
    const { can } = usePermissions();
    const { flash } = usePage<SharedData>().props;
    
    // Flash messages
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
            title: t('areas_management'),
        href: '/dashboard/areas',
    },
];
    const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; areaId: number | null }>({ 
        open: false, 
        areaId: null 
    });
    const [optimisticAreas, setOptimisticAreas] = useState(areas.data);
    const [showFilters, setShowFilters] = useState(false);
    const [isInitialLoad, setIsInitialLoad] = useState(true);

    const [filters, setFilters] = useState({
        search: initialFilters?.search || '',
        is_active: initialFilters?.is_active || 'all',
        created_from: initialFilters?.created_from || '',
        created_to: initialFilters?.created_to || '',
    });

    const applyFiltersToBackend = useCallback((filtersToApply: typeof filters) => {
        const params: Record<string, any> = {
            page: 1,
        };
        
        if (filtersToApply.search) {
            params.search = filtersToApply.search;
        }
        
        const filtersObj: Record<string, any> = {};
        
        // Only include is_active if it's not 'all'
        if (filtersToApply.is_active && filtersToApply.is_active !== 'all') {
            if (filtersToApply.is_active === 'true') {
                filtersObj.is_active = true;
            } else if (filtersToApply.is_active === 'false') {
                filtersObj.is_active = false;
            }
        }
        
        if (filtersToApply.created_from) {
            filtersObj.created_from = filtersToApply.created_from;
        }
        
        if (filtersToApply.created_to) {
            filtersObj.created_to = filtersToApply.created_to;
        }
        
        // Only include filters if there are any
        if (Object.keys(filtersObj).length > 0) {
            params.filters = filtersObj;
        }
        
        router.get('/dashboard/areas', params, { 
            preserveState: true, 
            preserveScroll: true,
            replace: true, // Replace current history entry to avoid filter persistence
        });
    }, []);

    useEffect(() => {
        setOptimisticAreas(areas.data);
    }, [areas.data]);

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
            label: t('area_name'),
            render: (_: unknown, area: Area) => (
                <div className={cn("p-2", isRTL ? '!text-right' : '!text-left')} dir={dir}>
                    <span className={cn("font-medium", isRTL ? '!text-right' : '!text-left')} dir={isRTL && area.name_ar ? 'rtl' : 'ltr'}>
                        {getLocalizedName(area.name_en, area.name_ar, locale)}
                    </span>
                </div>
            ),
        },
        {
            key: 'governorate',
            label: t('governorate'),
            render: (_: unknown, area: Area) => (
                <div className={cn("p-2", isRTL ? '!text-right' : '!text-left')} dir={dir}>
                    {area.governorate ? (
                        <span className={cn("font-medium", isRTL ? '!text-right' : '!text-left')} dir={isRTL && area.governorate.name_ar ? 'rtl' : 'ltr'}>
                            {getLocalizedName(area.governorate.name_en, area.governorate.name_ar, locale)}
                        </span>
                    ) : (
                        <span className={cn("text-muted-foreground", isRTL ? '!text-right' : '!text-left')} dir={dir}>—</span>
                    )}
                </div>
            ),
        },
        {
            key: 'is_active',
            label: t('status'),
            render: (_: unknown, area: Area) => (
                <div className={cn("p-2", isRTL ? '!text-right' : '!text-left')} dir={dir}>
                    <Badge 
                        variant={area.is_active ? 'default' : 'secondary'}
                        className={cn(
                            area.is_active 
                                ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300' 
                                : 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300',
                            isRTL ? '!text-right' : '!text-left'
                        )}
                        dir={dir}
                    >
                        {area.is_active ? t('active') : t('inactive')}
                    </Badge>
                </div>
            ),
        },
        {
            key: 'created_at',
            label: t('created_at'),
            render: (date: string) => (
                <div className={cn("p-2", isRTL ? '!text-right' : '!text-left')} dir={dir}>
                    <span className={cn(isRTL ? '!text-right' : '!text-left')} dir={dir}>
                        {formatHumanDate(date, t)}
                    </span>
                </div>
            ),
        },
        {
            key: 'actions',
            label: t('actions'),
            render: (_: unknown, area: Area) => (
                <div className={cn("flex items-center gap-1 w-full", isRTL ? 'justify-start flex-row-reverse' : 'justify-end')} dir={dir}>
                    {can('areas.show') && (
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => router.visit(`/dashboard/areas/${area.id}`)}
                            title={t('view')}
                            aria-label={t('view')}
                            dir={dir}
                        >
                            <Eye className="h-4 w-4" />
                        </Button>
                    )}
                    {can('areas.edit') && (
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => router.visit(`/dashboard/areas/${area.id}/edit`)}
                            title={t('edit')}
                            aria-label={t('edit')}
                            dir={dir}
                        >
                            <Edit className="h-4 w-4" />
                        </Button>
                    )}
                    {can('areas.destroy') && (
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setDeleteDialog({ open: true, areaId: area.id })}
                            title={t('delete')}
                            aria-label={t('delete')}
                            className="text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-900/20"
                            dir={dir}
                        >
                            <Trash2 className="h-4 w-4" />
                        </Button>
                    )}
                </div>
            ),
        },
    ];

    const handleDelete = () => {
        if (deleteDialog.areaId) {
            router.delete(`/dashboard/areas/${deleteDialog.areaId}`, {
                onSuccess: () => {
                    // Flash message will be shown via useEffect
                    setOptimisticAreas(prev => prev.filter(a => a.id !== deleteDialog.areaId));
                },
                onError: () => {
                    customToast.error(t('update_failed'));
                }
            });
        }
    };

    const handlePageChange = (page: number) => {
        const params: Record<string, any> = {
            page,
            per_page: areas.per_page,
        };
        
        if (filters.search) {
            params.search = filters.search;
        }
        
        const filtersObj: Record<string, any> = {};
        
        // Only include is_active if it's not 'all'
        if (filters.is_active && filters.is_active !== 'all') {
            if (filters.is_active === 'true') {
                filtersObj.is_active = true;
            } else if (filters.is_active === 'false') {
                filtersObj.is_active = false;
            }
        }
        
        if (filters.created_from) {
            filtersObj.created_from = filters.created_from;
        }
        
        if (filters.created_to) {
            filtersObj.created_to = filters.created_to;
        }
        
        // Only include filters if there are any
        if (Object.keys(filtersObj).length > 0) {
            params.filters = filtersObj;
        }
        
        router.get('/dashboard/areas', params, { preserveState: true, preserveScroll: true });
    };

    const handlePerPageChange = (perPage: number) => {
        router.reload({
            data: {
                per_page: perPage,
                page: 1,
            },
            only: [],
            preserveState: true,
            preserveScroll: true,
        });
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={t('areas_management')} />

            <div className={cn("flex h-full flex-1 flex-col gap-6 overflow-x-auto rounded-xl bg-card dark:bg-card p-6 border border-border", isRTL ? '!text-right' : '!text-left')} dir={dir}>
                {/* Header */}
                <div className={cn("flex items-center justify-between border-b pb-4", flexDirection)} dir={dir}>
                    <div className={cn(isRTL ? '!text-right' : '!text-left')} dir={dir}>
                        <h1 className={cn("text-3xl font-bold text-foreground", isRTL ? '!text-right' : '!text-left')} dir={dir}>{t('areas_management')}</h1>
                        <p className={cn("text-muted-foreground mt-1", isRTL ? '!text-right' : '!text-left')} dir={dir}>{t('manage_areas')}</p>
                    </div>
                    {can('areas.create') && (
                        <Link href="/dashboard/areas/create">
                            <Button className={cn("flex items-center gap-2", flexDirection)} dir={dir}>
                                <Plus className={cn("h-4 w-4", iconMargin('md'))} />
                                {t('add_area')}
                            </Button>
                        </Link>
                    )}
                </div>

                {/* Pagination Info and Show Filters Button */}
                <div className={cn("flex items-center justify-between", flexDirection)} dir={dir}>
                    <div className={cn("flex items-center gap-2", flexDirection)} dir={dir}>
                        <span className={cn("text-sm text-foreground", isRTL ? '!text-right' : '!text-left')} dir={dir}>
                            {t('showing')} {((areas.current_page - 1) * areas.per_page) + 1} {t('of')} {areas.total} {t('results')}
                        </span>
                        <Select value={areas.per_page.toString()} onValueChange={(value) => handlePerPageChange(Number(value))}>
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
                        locale={locale}
                    >
                        <SearchFieldFilter
                            id="search"
                            label={t('search')}
                            value={filters.search}
                            onChange={(value) => setFilters(prev => ({ ...prev, search: value }))}
                            placeholder={t('search_areas')}
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

                {/* Data Table */}
                <DataTable
                    data={optimisticAreas}
                    columns={columns}
                    total={areas.total}
                    currentPage={areas.current_page}
                    perPage={areas.per_page}
                    onPageChange={handlePageChange}
                    onPerPageChange={handlePerPageChange}
                    locale={locale}
                />
            </div>

            {/* Delete Dialog */}
            <ConfirmationDialog
                open={deleteDialog.open}
                onOpenChange={(open) => setDeleteDialog({ open, areaId: null })}
                onConfirm={handleDelete}
                title={t('delete_area')}
                description={t('are_you_sure_delete_area')}
                variant="danger"
                confirmText={t('delete')}
            />
        </AppLayout>
    );
}

