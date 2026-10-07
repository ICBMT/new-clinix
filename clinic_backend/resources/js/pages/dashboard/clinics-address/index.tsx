import { DataTable } from '@/components/data-table';
import { Button } from '@/components/ui/button';
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
    type ActiveFilter,
    type SelectOption 
} from '@/components/filters';
import AppLayout from '@/layouts/app-layout';
import { useTranslation } from '@/hooks/use-translation';
import { useRTL } from '@/hooks/use-rtl';
import { useRTLInit } from '@/hooks/use-rtl-init';
import { Head, router, usePage } from '@inertiajs/react';
import { Eye, Edit, Filter } from 'lucide-react';
import { useState, useEffect, useCallback } from 'react';
import { index as dashboard } from '@/routes/dashboard';
import { type BreadcrumbItem } from '@/types';
import { cn } from '@/lib/utils';
import { type SharedData } from '@/types';

interface Clinic {
    id: number;
    name_en: string;
    name_ar: string;
    address?: string;
    block?: string;
    street?: string;
    city?: string;
    governorate?: { id: number; name_en: string; name_ar: string };
    area?: { id: number; name_en: string; name_ar: string };
    created_at: string;
}

interface ClinicsAddressPageProps {
    clinics: {
        data: Clinic[];
        current_page: number;
        last_page: number;
        per_page: number;
        total: number;
    };
    filters: {
        clinic_id?: string;
        governorate_id?: string;
        area_id?: string;
        search?: string;
        status?: string;
    };
    allClinics?: Clinic[];
    governorates?: Array<{ id: number; name_en: string; name_ar: string }>;
    areas?: Array<{ id: number; name_en: string; name_ar: string; governorate_id?: number }>;
}

export default function ClinicsAddressIndex({ clinics, filters: initialFilters, allClinics = [], governorates = [], areas = [] }: ClinicsAddressPageProps) {
    useRTLInit();
    const { t, locale } = useTranslation();
    const page = usePage<SharedData>();
    const { locale: pageLocale } = page.props;
    const isRTL = pageLocale === 'ar';
    const dir = isRTL ? 'rtl' : 'ltr';
    const { flexDirection, iconMargin } = useRTL();
    
    const breadcrumbs: BreadcrumbItem[] = [
        {
            title: 'dashboard',
            href: dashboard.url(),
        },
        {
            title: t('clinics_address_management'),
            href: '/dashboard/clinics-address',
        },
    ];

    const [optimisticClinics, setOptimisticClinics] = useState(clinics.data);
    const [showFilters, setShowFilters] = useState(false);
    const [isInitialLoad, setIsInitialLoad] = useState(true);

    const [filters, setFilters] = useState({
        search: initialFilters?.search || '',
        clinic_id: initialFilters?.clinic_id || 'all',
        governorate_id: initialFilters?.governorate_id || 'all',
        area_id: initialFilters?.area_id || 'all',
        status: initialFilters?.status || 'all',
    });

    const applyFiltersToBackend = useCallback((filtersToApply: typeof filters) => {
        router.get('/dashboard/clinics-address', {
            page: 1,
            search: filtersToApply.search || undefined,
            clinic_id: filtersToApply.clinic_id && filtersToApply.clinic_id !== 'all' ? filtersToApply.clinic_id : undefined,
            governorate_id: filtersToApply.governorate_id && filtersToApply.governorate_id !== 'all' ? filtersToApply.governorate_id : undefined,
            area_id: filtersToApply.area_id && filtersToApply.area_id !== 'all' ? filtersToApply.area_id : undefined,
            status: filtersToApply.status && filtersToApply.status !== 'all' ? filtersToApply.status : undefined,
        }, { preserveState: true, preserveScroll: true });
    }, []);

    useEffect(() => {
        setOptimisticClinics(clinics.data);
    }, [clinics.data]);

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

    const clinicOptions: SelectOption[] = [
        { value: 'all', label: t('all') },
        ...allClinics.map(clinic => ({
            value: clinic.id.toString(),
            label: clinic.name_en || clinic.name_ar,
        })),
    ];

    const governorateOptions: SelectOption[] = [
        { value: 'all', label: t('all') },
        ...governorates.map(gov => ({
            value: gov.id.toString(),
            label: isRTL ? (gov.name_ar || gov.name_en) : (gov.name_en || gov.name_ar),
        })),
    ];

    // Filter areas based on selected governorate
    const filteredAreas = filters.governorate_id && filters.governorate_id !== 'all'
        ? areas.filter(area => area.governorate_id?.toString() === filters.governorate_id)
        : areas;

    const areaOptions: SelectOption[] = [
        { value: 'all', label: t('all') },
        ...filteredAreas.map(area => ({
            value: area.id.toString(),
            label: isRTL ? (area.name_ar || area.name_en) : (area.name_en || area.name_ar),
        })),
    ];

    const statusOptions: SelectOption[] = [
        { value: 'all', label: t('all') },
        { value: 'approved', label: t('approved') },
        { value: 'pending', label: t('pending') },
        { value: 'rejected', label: t('rejected') },
    ];

    const getActiveFilters = (): ActiveFilter[] => {
        const active: ActiveFilter[] = [];
        if (filters.search) {
            active.push({ 
                key: 'search', 
                label: t('search'), 
                value: filters.search,
                displayValue: filters.search
            });
        }
        if (filters.clinic_id && filters.clinic_id !== 'all') {
            const clinic = allClinics.find(c => c.id.toString() === filters.clinic_id);
            const displayValue = clinic?.name_en || clinic?.name_ar || filters.clinic_id;
            active.push({ 
                key: 'clinic_id', 
                label: t('clinic'), 
                value: filters.clinic_id,
                displayValue
            });
        }
        if (filters.governorate_id && filters.governorate_id !== 'all') {
            const gov = governorates.find(g => g.id.toString() === filters.governorate_id);
            const displayValue = gov?.name_en || gov?.name_ar || filters.governorate_id;
            active.push({ 
                key: 'governorate_id', 
                label: t('governorate'), 
                value: filters.governorate_id,
                displayValue
            });
        }
        if (filters.area_id && filters.area_id !== 'all') {
            const area = areas.find(a => a.id.toString() === filters.area_id);
            const displayValue = area?.name_en || area?.name_ar || filters.area_id;
            active.push({ 
                key: 'area_id', 
                label: t('area'), 
                value: filters.area_id,
                displayValue
            });
        }
        if (filters.status && filters.status !== 'all') {
            const option = statusOptions.find(o => o.value === filters.status);
            const displayValue = option?.label || filters.status;
            active.push({ 
                key: 'status', 
                label: t('status'), 
                value: filters.status,
                displayValue
            });
        }
        return active;
    };

    const handleRemoveFilter = (key: string) => {
        setFilters(prev => {
            const newFilters = { ...prev };
            if (key === 'search') newFilters.search = '';
            else if (key === 'clinic_id') newFilters.clinic_id = 'all';
            else if (key === 'governorate_id') {
                newFilters.governorate_id = 'all';
                // Reset area when governorate is cleared
                newFilters.area_id = 'all';
            }
            else if (key === 'area_id') newFilters.area_id = 'all';
            else if (key === 'status') newFilters.status = 'all';
            return newFilters;
        });
    };

    const handleClearAllFilters = () => {
        setFilters({
            search: '',
            clinic_id: 'all',
            governorate_id: 'all',
            area_id: 'all',
            status: 'all',
        });
    };

    const columns = [
        {
            key: 'name',
            label: t('clinic'),
            render: (_: unknown, clinic: Clinic) => (
                <p className="font-medium">{clinic.name_en || clinic.name_ar}</p>
            ),
        },
        {
            key: 'address',
            label: t('address'),
            render: (_: unknown, clinic: Clinic) => (
                <p className="text-sm text-muted-foreground">
                    {clinic.address || `${clinic.block || ''} ${clinic.street || ''} ${clinic.city || ''}`.trim() || t('n_a')}
                </p>
            ),
        },
        {
            key: 'governorate',
            label: t('governorate'),
            render: (_: unknown, clinic: Clinic) => (
                <p className="text-sm">{clinic.governorate?.name_en || clinic.governorate?.name_ar || t('n_a')}</p>
            ),
        },
        {
            key: 'area',
            label: t('area'),
            render: (_: unknown, clinic: Clinic) => (
                <p className="text-sm">{clinic.area?.name_en || clinic.area?.name_ar || t('n_a')}</p>
            ),
        },
        {
            key: 'created_at',
            label: t('created_at'),
            render: (date: string) => {
                if (!date) return t('n_a');
                try {
                    const dateObj = new Date(date);
                    if (isNaN(dateObj.getTime())) return t('n_a');
                    return dateObj.toLocaleDateString(isRTL ? 'ar-KW' : 'en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                    });
                } catch {
                    return t('n_a');
                }
            },
        },
        {
            key: 'actions',
            label: t('actions'),
            render: (_: unknown, clinic: Clinic) => (
                <div className={cn("flex items-center gap-1", isRTL ? 'justify-start flex-row-reverse' : 'justify-end')}>
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => router.visit(`/dashboard/clinics-address/${clinic.id}`)}
                        title={t('view')}
                    >
                        <Eye className="h-4 w-4" />
                    </Button>
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => router.visit(`/dashboard/clinics-address/${clinic.id}/edit`)}
                        title={t('edit')}
                    >
                        <Edit className="h-4 w-4" />
                    </Button>
                </div>
            ),
        },
    ];

    const handlePageChange = (page: number) => {
        router.get('/dashboard/clinics-address', {
            page,
            per_page: clinics.per_page,
            search: filters.search || undefined,
            clinic_id: filters.clinic_id && filters.clinic_id !== 'all' ? filters.clinic_id : undefined,
            governorate_id: filters.governorate_id && filters.governorate_id !== 'all' ? filters.governorate_id : undefined,
            area_id: filters.area_id && filters.area_id !== 'all' ? filters.area_id : undefined,
            status: filters.status && filters.status !== 'all' ? filters.status : undefined,
        }, { preserveState: true });
    };

    const handlePerPageChange = (perPage: number) => {
        router.get('/dashboard/clinics-address', {
            per_page: perPage,
            page: 1,
            search: filters.search || undefined,
            clinic_id: filters.clinic_id && filters.clinic_id !== 'all' ? filters.clinic_id : undefined,
            governorate_id: filters.governorate_id && filters.governorate_id !== 'all' ? filters.governorate_id : undefined,
            area_id: filters.area_id && filters.area_id !== 'all' ? filters.area_id : undefined,
            status: filters.status && filters.status !== 'all' ? filters.status : undefined,
        }, { preserveState: true });
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={t('clinics_address_management')} />
            
            <div className={cn("flex h-full flex-1 flex-col gap-6 overflow-x-auto rounded-xl bg-card dark:bg-card p-6 border border-border", isRTL ? '!text-right' : '!text-left')} dir={dir}>
                <div className={cn("flex items-center justify-between", flexDirection)}>
                    <div className={cn(isRTL ? '!text-right' : '!text-left')}>
                        <h1 className={cn("text-3xl font-bold text-foreground", isRTL ? '!text-right' : '!text-left')}>{t('clinics_address_management')}</h1>
                        <p className={cn("text-muted-foreground mt-1", isRTL ? '!text-right' : '!text-left')}>{t('manage_clinics_address_description')}</p>
                    </div>
                </div>

                <div className={cn("flex items-center justify-between", flexDirection)}>
                    <div className={cn("flex items-center gap-2", flexDirection)}>
                        <span className={cn("text-sm text-foreground", isRTL ? '!text-right' : '!text-left')}>
                            {t('showing')} {((clinics.current_page - 1) * clinics.per_page) + 1} {t('of')} {clinics.total} {t('results')}
                        </span>
                        <Select value={clinics.per_page.toString()} onValueChange={(value) => handlePerPageChange(Number(value))}>
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
                            id="clinic_id"
                            label={t('clinic')}
                            value={filters.clinic_id}
                            onChange={(value) => setFilters(prev => ({ ...prev, clinic_id: value }))}
                            options={clinicOptions}
                            placeholder={t('all')}
                        />
                        
                        <SelectFilter
                            id="governorate_id"
                            label={t('governorate')}
                            value={filters.governorate_id}
                            onChange={(value) => {
                                setFilters(prev => ({ 
                                    ...prev, 
                                    governorate_id: value,
                                    area_id: 'all' // Reset area when governorate changes
                                }));
                            }}
                            options={governorateOptions}
                            placeholder={t('all')}
                        />
                        
                        <SelectFilter
                            id="area_id"
                            label={t('area')}
                            value={filters.area_id}
                            onChange={(value) => setFilters(prev => ({ ...prev, area_id: value }))}
                            options={areaOptions}
                            placeholder={filters.governorate_id && filters.governorate_id !== 'all' ? t('select_area') : t('select_governorate_first')}
                            disabled={!filters.governorate_id || filters.governorate_id === 'all'}
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

                <DataTable
                    data={optimisticClinics}
                    columns={columns}
                    total={clinics.total}
                    currentPage={clinics.current_page}
                    perPage={clinics.per_page}
                    onPageChange={handlePageChange}
                    onPerPageChange={handlePerPageChange}
                />
            </div>
        </AppLayout>
    );
}

