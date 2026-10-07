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
import { Head, Link, router, usePage } from '@inertiajs/react';
import { type SharedData } from '@/types';
import { Plus, Eye, Edit, Trash2, Filter, Star, Zap } from 'lucide-react';
import { useState, useEffect, useCallback } from 'react';
import { customToast } from '@/components/ui/custom-toast';
import { index as dashboard } from '@/routes/dashboard';
import { type BreadcrumbItem } from '@/types';
import { formatHumanDate } from '@/utils/date-utils';
import { getLocalizedName } from '@/utils/localization';
import { cn } from '@/lib/utils';

interface Service {
    id: number;
    name_en: string;
    name_ar: string;
    vendor?: { id: number; name: string };
    category?: { id: number; name_en: string; name_ar: string };
    status: 'pending' | 'approved' | 'rejected';
    is_featured: boolean;
    is_fast_booking: boolean;
    base_price: string;
    created_at: string;
}

interface ServicesPageProps {
    services: {
        data: Service[];
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

export default function ServicesIndex({ services, filters: initialFilters }: ServicesPageProps) {
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
            title: t('services_management'),
            href: '/dashboard/services',
        },
    ];
    const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; serviceId: number | null }>({ 
        open: false, 
        serviceId: null 
    });
    const [optimisticServices, setOptimisticServices] = useState(services.data);
    const [showFilters, setShowFilters] = useState(false);
    const [isInitialLoad, setIsInitialLoad] = useState(true);

    const [filters, setFilters] = useState({
        search: initialFilters?.search || '',
        status: initialFilters?.status || 'all',
        created_from: initialFilters?.created_from || '',
        created_to: initialFilters?.created_to || '',
    });

    const applyFiltersToBackend = useCallback((filtersToApply: typeof filters) => {
        router.get('/dashboard/services', {
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
        setOptimisticServices(services.data);
    }, [services.data]);

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
        { value: 'approved', label: t('approved') },
        { value: 'rejected', label: t('rejected') },
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

    const handleToggleFeatured = (serviceId: number, currentValue: boolean) => {
        router.patch(`/dashboard/services/${serviceId}/toggle-featured`, {
            is_featured: !currentValue,
        }, {
            onSuccess: () => {
                customToast.success(t('service_updated_successfully'));
                setOptimisticServices(prev => prev.map(s => 
                    s.id === serviceId ? { ...s, is_featured: !currentValue } : s
                ));
            },
        });
    };

    const handleToggleFastBooking = (serviceId: number, currentValue: boolean) => {
        router.patch(`/dashboard/services/${serviceId}/toggle-fast-booking`, {
            is_fast_booking: !currentValue,
        }, {
            onSuccess: () => {
                customToast.success(t('service_updated_successfully'));
                setOptimisticServices(prev => prev.map(s => 
                    s.id === serviceId ? { ...s, is_fast_booking: !currentValue } : s
                ));
            },
        });
    };

    const columns = [
        {
            key: 'name',
            label: t('service_name'),
            render: (_: unknown, service: Service) => (
                <div className={cn("flex items-center gap-2", flexDirection)}>
                    <span className={cn("font-medium", isRTL ? '!text-right' : '!text-left')} dir={dir}>
                        {getLocalizedName(service.name_en, service.name_ar, locale)}
                    </span>
                    {service.is_featured && (
                        <Star className={cn("h-4 w-4 text-yellow-500 fill-yellow-500", iconMargin('sm'))} />
                    )}
                    {service.is_fast_booking && (
                        <Zap className={cn("h-4 w-4 text-purple-500 dark:text-purple-400", iconMargin('sm'))} />
                    )}
                </div>
            ),
        },
        {
            key: 'vendor',
            label: t('vendor'),
            render: (_: unknown, service: Service) => (
                service.vendor ? (
                    <span className={cn("text-sm", isRTL ? '!text-right' : '!text-left')} dir={dir}>{service.vendor.name}</span>
                ) : (
                    <span className={cn("text-muted-foreground", isRTL ? '!text-right' : '!text-left')} dir={dir}>—</span>
                )
            ),
        },
        {
            key: 'category',
            label: t('category'),
            render: (_: unknown, service: Service) => (
                service.category ? (
                    <span className={cn("text-sm", isRTL ? '!text-right' : '!text-left')} dir={dir}>
                        {getLocalizedName(service.category.name_en, service.category.name_ar, locale)}
                    </span>
                ) : (
                    <span className={cn("text-muted-foreground", isRTL ? '!text-right' : '!text-left')} dir={dir}>—</span>
                )
            ),
        },
        {
            key: 'base_price',
            label: t('price'),
            render: (_: unknown, service: Service) => (
                <span className={cn("font-medium", isRTL ? '!text-right' : '!text-left')} dir="ltr">{service.base_price}</span>
            ),
        },
        {
            key: 'status',
            label: t('status'),
            render: (_: unknown, service: Service) => (
                <div className={cn(isRTL ? '!text-right' : '!text-left')}>
                    <Badge 
                        variant={
                            service.status === 'approved' ? 'default' : 
                            service.status === 'rejected' ? 'destructive' : 'secondary'
                        }
                        className={cn(
                            service.status === 'approved' 
                                ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300' 
                                : service.status === 'rejected'
                                ? 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300'
                                : 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300',
                            isRTL ? '!text-right' : '!text-left'
                        )}
                    >
                        {t(service.status)}
                    </Badge>
                </div>
            ),
        },
        {
            key: 'created_at',
            label: t('created_at'),
            render: (_: unknown, service: Service) => (
                <span className={cn("text-sm text-muted-foreground", isRTL ? '!text-right' : '!text-left')} dir={dir}>{formatHumanDate(service.created_at, t)}</span>
            ),
        },
        {
            key: 'actions',
            label: t('actions'),
            render: (_: unknown, service: Service) => (
                <div className={cn("flex items-center gap-1 w-full", isRTL ? 'justify-start flex-row-reverse' : 'justify-end')}>
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => router.visit(`/dashboard/services/${service.id}`)}
                        title={t('view')}
                    >
                        <Eye className="h-4 w-4" />
                    </Button>
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => router.visit(`/dashboard/services/${service.id}/edit`)}
                        title={t('edit')}
                    >
                        <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleToggleFeatured(service.id, service.is_featured)}
                        title={service.is_featured ? t('remove_featured') : t('mark_featured')}
                    >
                        <Star className={`h-4 w-4 ${service.is_featured ? 'text-yellow-500 fill-yellow-500' : ''}`} />
                    </Button>
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleToggleFastBooking(service.id, service.is_fast_booking)}
                        title={service.is_fast_booking ? t('remove_fast_booking') : t('mark_fast_booking')}
                    >
                        <Zap className={`h-4 w-4 ${service.is_fast_booking ? 'text-purple-500 dark:text-purple-400' : ''}`} />
                    </Button>
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setDeleteDialog({ open: true, serviceId: service.id })}
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
        if (deleteDialog.serviceId) {
            const service = optimisticServices.find(s => s.id === deleteDialog.serviceId);
            router.delete(`/dashboard/services/${deleteDialog.serviceId}`, {
                onSuccess: () => {
                    customToast.success(t('service_deleted_successfully'), service?.name_en);
                    setOptimisticServices(prev => prev.filter(s => s.id !== deleteDialog.serviceId));
                },
                onError: () => {
                    customToast.error(t('update_failed'));
                }
            });
        }
    };

    const handlePageChange = (page: number) => {
        router.get('/dashboard/services', {
            page,
            per_page: services.per_page,
            search: filters.search || undefined,
            filters: {
                status: filters.status && filters.status !== 'all' ? filters.status : undefined,
                created_from: filters.created_from || undefined,
                created_to: filters.created_to || undefined,
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

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={t('services_management')} />
            
            <div className={cn("flex h-full flex-1 flex-col gap-6 overflow-x-auto rounded-xl bg-card dark:bg-card p-6 border border-border", isRTL ? '!text-right' : '!text-left')} dir={dir}>
                {/* Header */}
                <div className={cn("flex items-center justify-between border-b pb-4", flexDirection)}>
                    <div className={cn(isRTL ? '!text-right' : '!text-left')}>
                        <h1 className={cn("text-3xl font-bold text-foreground", isRTL ? '!text-right' : '!text-left')}>{t('services_management')}</h1>
                        <p className={cn("text-muted-foreground mt-1", isRTL ? '!text-right' : '!text-left')}>{t('manage_services')}</p>
                    </div>
                    <Link href="/dashboard/services/create">
                        <Button className={cn("flex items-center gap-2", flexDirection)}>
                            <Plus className={cn("h-4 w-4", iconMargin('md'))} />
                            {t('add_service')}
                        </Button>
                    </Link>
                </div>

                {/* Pagination Info and Show Filters Button */}
                <div className={cn("flex items-center justify-between", flexDirection)}>
                    <div className={cn("flex items-center gap-2", flexDirection)}>
                        <span className={cn("text-sm text-foreground", isRTL ? '!text-right' : '!text-left')}>
                            {t('showing')} {((services.current_page - 1) * services.per_page) + 1} {t('of')} {services.total} {t('results')}
                        </span>
                        <Select value={services.per_page.toString()} onValueChange={(value) => handlePerPageChange(Number(value))}>
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

                {/* Data Table */}
                <DataTable
                    data={optimisticServices}
                    columns={columns}
                    total={services.total}
                    currentPage={services.current_page}
                    perPage={services.per_page}
                    onPageChange={handlePageChange}
                    onPerPageChange={handlePerPageChange}
                    locale={locale}
                />
            </div>

            <ConfirmationDialog
                open={deleteDialog.open}
                onOpenChange={(open) => setDeleteDialog({ open, serviceId: null })}
                onConfirm={handleDelete}
                title={t('delete_service')}
                description={t('delete_service_confirmation')}
                variant="danger"
                confirmText={t('delete')}
            />
        </AppLayout>
    );
}

