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
    type ActiveFilter,
    type SelectOption 
} from '@/components/filters';
import AppLayout from '@/layouts/app-layout';
import { useRTLInit } from '@/hooks/use-rtl-init';
import { useTranslation } from '@/hooks/use-translation';
import { useRTL } from '@/hooks/use-rtl';
import { usePermissions } from '@/hooks/use-permissions';
import { Head, Link, router, usePage } from '@inertiajs/react';
import { type SharedData } from '@/types';
import { Plus, Eye, Edit, Trash2, Filter } from 'lucide-react';
import { useState, useEffect, useCallback } from 'react';
import { customToast } from '@/components/ui/custom-toast';
import { index as dashboard } from '@/routes/dashboard';
import { type BreadcrumbItem } from '@/types';
import { formatHumanDate } from '@/utils/date-utils';
import { cn } from '@/lib/utils';

interface TreatmentSlot {
    id: number;
    treatment_id: number;
    treatment?: { id: number; name_en: string; name_ar: string };
    slot_date: string;
    start_time: string;
    end_time: string;
    status: 'available' | 'booked' | 'blocked' | 'maintenance';
    price?: string;
    created_at: string;
}

interface TreatmentSlotsPageProps {
    treatmentSlots: {
        data: TreatmentSlot[];
        current_page: number;
        last_page: number;
        per_page: number;
        total: number;
    };
    filters: {
        search?: string;
        status?: string;
    };
}

export default function TreatmentSlotsIndex({ treatmentSlots, filters: initialFilters }: TreatmentSlotsPageProps) {
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
            title: t('treatment_slots_management'),
            href: '/dashboard/treatment-slots',
        },
    ];

    const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; slotId: number | null }>({ 
        open: false, 
        slotId: null 
    });
    const [optimisticSlots, setOptimisticSlots] = useState(treatmentSlots.data);
    const [showFilters, setShowFilters] = useState(false);
    const [isInitialLoad, setIsInitialLoad] = useState(true);

    const [filters, setFilters] = useState({
        search: initialFilters?.search || '',
        status: initialFilters?.status || 'all',
    });

    const applyFiltersToBackend = useCallback((filtersToApply: typeof filters) => {
        const params: any = {
            page: 1,
        };
        
        if (filtersToApply.search) {
            params.search = filtersToApply.search;
        }
        
        const filterParams: any = {};
        if (filtersToApply.status && filtersToApply.status !== 'all') {
            filterParams.status = filtersToApply.status;
        }
        
        if (Object.keys(filterParams).length > 0) {
            params.filters = filterParams;
        }
        
        router.get('/dashboard/treatment-slots', params, { preserveState: true, preserveScroll: true });
    }, []);

    useEffect(() => {
        setOptimisticSlots(treatmentSlots.data);
    }, [treatmentSlots.data]);

    useEffect(() => {
        if (isInitialLoad) {
            setIsInitialLoad(false);
            return;
        }
        const timeoutId = setTimeout(() => {
            applyFiltersToBackend(filters);
        }, 300);
        return () => clearTimeout(timeoutId);
    }, [filters.search, filters.status, isInitialLoad]);

    const statusOptions: SelectOption[] = [
        { value: 'all', label: t('all') },
        { value: 'available', label: t('available') },
        { value: 'booked', label: t('booked') },
        { value: 'blocked', label: t('blocked') },
        { value: 'maintenance', label: t('maintenance') },
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

        return active;
    };

    const handleRemoveFilter = (key: string) => {
        const newFilters = { ...filters };
        
        if (key === 'status') {
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
        };
        setFilters(clearedFilters);
    };

    const getStatusBadge = (status: string) => {
        const variants: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
            available: 'default',
            booked: 'secondary',
            blocked: 'destructive',
            maintenance: 'outline',
        };

        return (
            <Badge variant={variants[status] || 'outline'}>
                {t(status)}
            </Badge>
        );
    };

    const columns = [
        {
            key: 'treatment',
            label: t('treatment'),
            render: (_: unknown, slot: TreatmentSlot) => (
                slot.treatment ? (
                    <span className={cn("text-sm font-medium", textAlign)} dir={dir}>
                        {slot.treatment.name_en || slot.treatment.name_ar}
                    </span>
                ) : (
                    <span className={cn("text-muted-foreground", textAlign)} dir={dir}>—</span>
                )
            ),
        },
        {
            key: 'slot_date',
            label: t('date'),
            render: (_: unknown, slot: TreatmentSlot) => {
                const date = new Date(slot.slot_date);
                return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
            },
        },
        {
            key: 'time',
            label: t('time'),
            render: (_: unknown, slot: TreatmentSlot) => (
                <span className={cn("text-sm", textAlign)} dir="ltr">
                    {slot.start_time} - {slot.end_time}
                </span>
            ),
        },
        {
            key: 'price',
            label: t('price'),
            render: (_: unknown, slot: TreatmentSlot) => (
                <span className={cn("font-medium", textAlign)} dir="ltr">{slot.price || '—'}</span>
            ),
        },
        {
            key: 'status',
            label: t('status'),
            render: (_: unknown, slot: TreatmentSlot) => getStatusBadge(slot.status),
        },
        {
            key: 'created_at',
            label: t('created_at'),
            render: (date: string) => formatHumanDate(date),
        },
        {
            key: 'actions',
            label: t('actions'),
            render: (_: unknown, slot: TreatmentSlot) => (
                <div className={cn("flex items-center gap-1 w-full", isRTL ? 'justify-start flex-row-reverse' : 'justify-end')}>
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => router.visit(`/dashboard/treatment-slots/${slot.id}`)}
                        title={t('view')}
                    >
                        <Eye className="h-4 w-4" />
                    </Button>
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => router.visit(`/dashboard/treatment-slots/${slot.id}/edit`)}
                        title={t('edit')}
                    >
                        <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setDeleteDialog({ open: true, slotId: slot.id })}
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
        if (deleteDialog.slotId) {
            router.delete(`/dashboard/treatment-slots/${deleteDialog.slotId}`, {
                onSuccess: () => {
                    customToast.success(t('treatment_slot_deleted_successfully'));
                    setOptimisticSlots(prev => prev.filter(s => s.id !== deleteDialog.slotId));
                },
                onError: () => {
                    customToast.error(t('delete_failed'));
                }
            });
        }
    };

    const handlePageChange = (page: number) => {
        const params: any = {
            page,
            per_page: treatmentSlots.per_page,
        };
        
        if (filters.search) {
            params.search = filters.search;
        }
        
        const filterParams: any = {};
        if (filters.status && filters.status !== 'all') {
            filterParams.status = filters.status;
        }
        
        if (Object.keys(filterParams).length > 0) {
            params.filters = filterParams;
        }
        
        router.get('/dashboard/treatment-slots', params, { preserveState: true, preserveScroll: true });
    };

    const handlePerPageChange = (perPage: number) => {
        const params: any = {
            per_page: perPage,
            page: 1,
        };
        
        if (filters.search) {
            params.search = filters.search;
        }
        
        const filterParams: any = {};
        if (filters.status && filters.status !== 'all') {
            filterParams.status = filters.status;
        }
        
        if (Object.keys(filterParams).length > 0) {
            params.filters = filterParams;
        }
        
        router.get('/dashboard/treatment-slots', params, { preserveState: true });
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={t('treatment_slots')} />
            
            <div className={cn("flex h-full flex-1 flex-col gap-6 overflow-x-auto rounded-xl bg-card dark:bg-card p-6 border border-border", textAlign)} dir={dir}>
                <div className={cn("flex items-center justify-between border-b pb-4", flexDirection)}>
                    <div className={textAlign}>
                        <h1 className={cn("text-3xl font-bold text-foreground", textAlign)}>{t('treatment_slots')}</h1>
                        <p className={cn("text-muted-foreground mt-1", textAlign)}>{t('manage_treatment_slots')}</p>
                    </div>
                    {can('treatment-slots.create') && (
                        <Link href="/dashboard/treatment-slots/create">
                            <Button size="lg" className={cn("flex items-center gap-2", flexDirection)}>
                                <Plus className={cn("h-5 w-5", iconMargin('md'))} />
                                {t('create_treatment_slot')}
                            </Button>
                        </Link>
                    )}
                </div>
                
                {/* Empty state message if no slots exist */}
                {treatmentSlots.total === 0 && (
                    <div className={cn("flex flex-col items-center justify-center py-12 px-4", textAlign)}>
                        <div className="rounded-full bg-muted p-4 mb-4">
                            <Plus className={cn("h-8 w-8 text-muted-foreground", iconMargin('md'))} />
                        </div>
                        <h3 className={cn("text-lg font-semibold mb-2", textAlign)} dir={dir}>{t('no_treatment_slots')}</h3>
                        <p className={cn("text-muted-foreground mb-6 max-w-md", textAlign)} dir={dir}>
                            {t('treatment_slots_empty_message')}
                        </p>
                        {can('treatment-slots.create') && (
                            <Link href="/dashboard/treatment-slots/create">
                                <Button size="lg" className={cn("flex items-center gap-2", flexDirection)}>
                                    <Plus className={cn("h-5 w-5", iconMargin('md'))} />
                                    {t('create_treatment_slot')}
                                </Button>
                            </Link>
                        )}
                    </div>
                )}

                <div className={cn("flex items-center justify-between", flexDirection)}>
                    <div className={cn("flex items-center gap-2", flexDirection)}>
                        <span className={cn("text-sm text-foreground", textAlign)}>
                            {t('showing')} {((treatmentSlots.current_page - 1) * treatmentSlots.per_page) + 1} {t('of')} {treatmentSlots.total} {t('results')}
                        </span>
                        <Select value={treatmentSlots.per_page.toString()} onValueChange={(value) => handlePerPageChange(Number(value))}>
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
                    </CollapsibleFilters>
                )}

                {/* Data Table */}
                <DataTable
                    data={optimisticSlots}
                    columns={columns}
                    total={treatmentSlots.total}
                    currentPage={treatmentSlots.current_page}
                    perPage={treatmentSlots.per_page}
                    onPageChange={handlePageChange}
                    onPerPageChange={handlePerPageChange}
                    locale={locale}
                />
            </div>

            <ConfirmationDialog
                open={deleteDialog.open}
                onOpenChange={(open) => setDeleteDialog({ open, slotId: null })}
                onConfirm={handleDelete}
                title={t('delete_treatment_slot')}
                description={t('delete_treatment_slot_confirmation')}
                variant="danger"
                confirmText={t('delete')}
            />
        </AppLayout>
    );
}

