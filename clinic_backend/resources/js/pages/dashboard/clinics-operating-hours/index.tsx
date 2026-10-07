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
import { formatHumanDate } from '@/utils/date-utils';
import { cn } from '@/lib/utils';
import { type SharedData } from '@/types';

interface OperatingHour {
    id: number;
    clinic_id: number;
    day_of_week: string;
    opening_time: string;
    closing_time: string;
    is_closed: boolean;
    clinic?: { id: number; name_en: string; name_ar: string };
    created_at: string;
}

interface ClinicsOperatingHoursPageProps {
    operatingHours: {
        data: OperatingHour[];
        current_page: number;
        last_page: number;
        per_page: number;
        total: number;
    };
    filters: {
        clinic_id?: string;
        day_of_week?: string;
        search?: string;
    };
    clinics?: Array<{ id: number; name_en: string; name_ar: string }>;
}

const DAYS_OF_WEEK = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];

export default function ClinicsOperatingHoursIndex({ operatingHours, filters: initialFilters, clinics = [] }: ClinicsOperatingHoursPageProps) {
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
            title: t('clinics_operating_hours_management'),
            href: '/dashboard/clinics-operating-hours',
        },
    ];

    const [optimisticHours, setOptimisticHours] = useState(operatingHours.data);
    const [showFilters, setShowFilters] = useState(false);
    const [isInitialLoad, setIsInitialLoad] = useState(true);

    const [filters, setFilters] = useState({
        search: initialFilters?.search || '',
        clinic_id: initialFilters?.clinic_id || 'all',
        day_of_week: initialFilters?.day_of_week || 'all',
    });

    const applyFiltersToBackend = useCallback((filtersToApply: typeof filters) => {
        router.get('/dashboard/clinics-operating-hours', {
            page: 1,
            search: filtersToApply.search || undefined,
            filters: {
                clinic_id: filtersToApply.clinic_id && filtersToApply.clinic_id !== 'all' ? filtersToApply.clinic_id : undefined,
                day_of_week: filtersToApply.day_of_week && filtersToApply.day_of_week !== 'all' ? filtersToApply.day_of_week : undefined,
            },
        }, { preserveState: true, preserveScroll: true });
    }, []);

    useEffect(() => {
        setOptimisticHours(operatingHours.data);
    }, [operatingHours.data]);

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
        ...clinics.map(clinic => ({
            value: clinic.id.toString(),
            label: clinic.name_en || clinic.name_ar,
        })),
    ];

    const dayOptions: SelectOption[] = [
        { value: 'all', label: t('all') },
        ...DAYS_OF_WEEK.map(day => ({
            value: day,
            label: t(day),
        })),
    ];

    const getActiveFilters = (): ActiveFilter[] => {
        const active: ActiveFilter[] = [];
        if (filters.search) active.push({ key: 'search', label: t('search'), value: filters.search });
        if (filters.clinic_id && filters.clinic_id !== 'all') {
            const clinic = clinics.find(c => c.id.toString() === filters.clinic_id);
            active.push({ key: 'clinic_id', label: t('clinic'), value: clinic?.name_en || clinic?.name_ar || filters.clinic_id });
        }
        if (filters.day_of_week && filters.day_of_week !== 'all') {
            active.push({ key: 'day_of_week', label: t('day_of_week'), value: t(filters.day_of_week) });
        }
        return active;
    };

    const handleRemoveFilter = (key: string) => {
        setFilters(prev => {
            const newFilters = { ...prev };
            if (key === 'search') newFilters.search = '';
            else if (key === 'clinic_id') newFilters.clinic_id = 'all';
            else if (key === 'day_of_week') newFilters.day_of_week = 'all';
            return newFilters;
        });
    };

    const handleClearAllFilters = () => {
        setFilters({
            search: '',
            clinic_id: 'all',
            day_of_week: 'all',
        });
    };

    const columns = [
        {
            key: 'clinic',
            label: t('clinic'),
            render: (_: unknown, hour: OperatingHour) => (
                <p className="font-medium">{hour.clinic?.name_en || hour.clinic?.name_ar || t('n_a')}</p>
            ),
        },
        {
            key: 'day_of_week',
            label: t('day_of_week'),
            render: (_: unknown, hour: OperatingHour) => (
                <p className="text-sm">{t(hour.day_of_week)}</p>
            ),
        },
        {
            key: 'hours',
            label: t('hours'),
            render: (_: unknown, hour: OperatingHour) => (
                <p className="text-sm">
                    {hour.is_closed ? (
                        <span className="text-muted-foreground">{t('closed')}</span>
                    ) : (
                        `${hour.opening_time} - ${hour.closing_time}`
                    )}
                </p>
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
            render: (_: unknown, hour: OperatingHour) => (
                <div className={cn("flex items-center gap-1", isRTL ? 'justify-start flex-row-reverse' : 'justify-end')}>
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => router.visit(`/dashboard/clinics-operating-hours/${hour.id}`)}
                        title={t('view')}
                    >
                        <Eye className="h-4 w-4" />
                    </Button>
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => router.visit(`/dashboard/clinics-operating-hours/${hour.id}/edit`)}
                        title={t('edit')}
                    >
                        <Edit className="h-4 w-4" />
                    </Button>
                </div>
            ),
        },
    ];

    const handlePageChange = (page: number) => {
        router.get('/dashboard/clinics-operating-hours', {
            page,
            per_page: operatingHours.per_page,
            search: filters.search || undefined,
            filters: {
                clinic_id: filters.clinic_id && filters.clinic_id !== 'all' ? filters.clinic_id : undefined,
                day_of_week: filters.day_of_week && filters.day_of_week !== 'all' ? filters.day_of_week : undefined,
            },
        }, { preserveState: true });
    };

    const handlePerPageChange = (perPage: number) => {
        router.get('/dashboard/clinics-operating-hours', {
            per_page: perPage,
            page: 1,
            search: filters.search || undefined,
            filters: {
                clinic_id: filters.clinic_id && filters.clinic_id !== 'all' ? filters.clinic_id : undefined,
                day_of_week: filters.day_of_week && filters.day_of_week !== 'all' ? filters.day_of_week : undefined,
            },
        }, { preserveState: true });
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={t('clinics_operating_hours_management')} />
            
            <div className={cn("flex h-full flex-1 flex-col gap-6 overflow-x-auto rounded-xl bg-card dark:bg-card p-6 border border-border", isRTL ? '!text-right' : '!text-left')} dir={dir}>
                <div className={cn("flex items-center justify-between", flexDirection)}>
                    <div className={cn(isRTL ? '!text-right' : '!text-left')}>
                        <h1 className={cn("text-3xl font-bold text-foreground", isRTL ? '!text-right' : '!text-left')}>{t('clinics_operating_hours_management')}</h1>
                        <p className={cn("text-muted-foreground mt-1", isRTL ? '!text-right' : '!text-left')}>{t('manage_clinics_operating_hours_description')}</p>
                    </div>
                </div>

                <div className={cn("flex items-center justify-between", flexDirection)}>
                    <div className={cn("flex items-center gap-2", flexDirection)}>
                        <span className={cn("text-sm text-foreground", isRTL ? '!text-right' : '!text-left')}>
                            {t('showing')} {((operatingHours.current_page - 1) * operatingHours.per_page) + 1} {t('of')} {operatingHours.total} {t('results')}
                        </span>
                        <Select value={operatingHours.per_page.toString()} onValueChange={(value) => handlePerPageChange(Number(value))}>
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
                            id="day_of_week"
                            label={t('day_of_week')}
                            value={filters.day_of_week}
                            onChange={(value) => setFilters(prev => ({ ...prev, day_of_week: value }))}
                            options={dayOptions}
                            placeholder={t('all')}
                        />
                    </CollapsibleFilters>
                )}

                <DataTable
                    data={optimisticHours}
                    columns={columns}
                    total={operatingHours.total}
                    currentPage={operatingHours.current_page}
                    perPage={operatingHours.per_page}
                    onPageChange={handlePageChange}
                    onPerPageChange={handlePerPageChange}
                />
            </div>
        </AppLayout>
    );
}

