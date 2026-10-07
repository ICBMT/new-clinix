import { DataTable } from '@/components/data-table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
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
    DateRangeFilter,
    type ActiveFilter,
    type SelectOption 
} from '@/components/filters';
import AppLayout from '@/layouts/app-layout';
import { useTranslation } from '@/hooks/use-translation';
import { useRTL } from '@/hooks/use-rtl';
import { useRTLInit } from '@/hooks/use-rtl-init';
import { Head, router, usePage } from '@inertiajs/react';
import { Eye, Filter } from 'lucide-react';
import { useState, useEffect, useCallback } from 'react';
import { index as dashboard } from '@/routes/dashboard';
import { type BreadcrumbItem } from '@/types';
import { formatHumanDate } from '@/utils/date-utils';
import { cn } from '@/lib/utils';
import { type SharedData } from '@/types';

interface Booking {
    id: number;
    booking_reference: string;
    clinic?: { id: number; name_en: string; name_ar: string };
    user?: { id: number; name: string; email: string; phone: string };
    treatment?: { id: number; name_en: string; name_ar: string };
    machine?: { id: number; serial_number: string };
    status: string;
    payment_status: string;
    total_amount: string;
    created_at: string;
}

interface ClinicsBookingsPageProps {
    bookings: {
        data: Booking[];
        current_page: number;
        last_page: number;
        per_page: number;
        total: number;
    };
    filters: {
        clinic_id?: string;
        status?: string;
        date_from?: string;
        date_to?: string;
        search?: string;
    };
    clinics?: Array<{ id: number; name_en: string; name_ar: string }>;
}

export default function ClinicsBookingsIndex({ bookings, filters: initialFilters, clinics = [] }: ClinicsBookingsPageProps) {
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
            title: t('clinics_bookings_management'),
            href: '/dashboard/clinics-bookings',
        },
    ];

    const [optimisticBookings, setOptimisticBookings] = useState(bookings.data);
    const [showFilters, setShowFilters] = useState(false);
    const [isInitialLoad, setIsInitialLoad] = useState(true);

    const [filters, setFilters] = useState({
        search: initialFilters?.search || '',
        clinic_id: initialFilters?.clinic_id || 'all',
        status: initialFilters?.status || 'all',
        date_from: initialFilters?.date_from || '',
        date_to: initialFilters?.date_to || '',
    });

    const applyFiltersToBackend = useCallback((filtersToApply: typeof filters) => {
        router.get('/dashboard/clinics-bookings', {
            page: 1,
            search: filtersToApply.search || undefined,
            filters: {
                clinic_id: filtersToApply.clinic_id && filtersToApply.clinic_id !== 'all' ? filtersToApply.clinic_id : undefined,
                status: filtersToApply.status && filtersToApply.status !== 'all' ? filtersToApply.status : undefined,
                date_from: filtersToApply.date_from || undefined,
                date_to: filtersToApply.date_to || undefined,
            },
        }, { preserveState: true, preserveScroll: true });
    }, []);

    useEffect(() => {
        setOptimisticBookings(bookings.data);
    }, [bookings.data]);

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
        { value: 'confirmed', label: t('confirmed') },
        { value: 'cancelled', label: t('cancelled') },
        { value: 'completed', label: t('completed') },
    ];

    const clinicOptions: SelectOption[] = [
        { value: 'all', label: t('all') },
        ...clinics.map(clinic => ({
            value: clinic.id.toString(),
            label: isRTL && clinic.name_ar ? clinic.name_ar : (clinic.name_en || clinic.name_ar),
        })),
    ];

    const getActiveFilters = (): ActiveFilter[] => {
        const active: ActiveFilter[] = [];
        if (filters.search) active.push({ key: 'search', label: t('search'), value: filters.search });
        if (filters.clinic_id && filters.clinic_id !== 'all') {
            const clinic = clinics.find(c => c.id.toString() === filters.clinic_id);
            active.push({ key: 'clinic_id', label: t('clinic'), value: clinic?.name_en || clinic?.name_ar || filters.clinic_id });
        }
        if (filters.status && filters.status !== 'all') {
            active.push({ key: 'status', label: t('status'), value: t(filters.status) });
        }
        if (filters.date_from) active.push({ key: 'date_from', label: t('date_from'), value: filters.date_from });
        if (filters.date_to) active.push({ key: 'date_to', label: t('date_to'), value: filters.date_to });
        return active;
    };

    const handleRemoveFilter = (key: string) => {
        setFilters(prev => {
            const newFilters = { ...prev };
            if (key === 'search') newFilters.search = '';
            else if (key === 'clinic_id') newFilters.clinic_id = 'all';
            else if (key === 'status') newFilters.status = 'all';
            else if (key === 'date_from') newFilters.date_from = '';
            else if (key === 'date_to') newFilters.date_to = '';
            return newFilters;
        });
    };

    const handleClearAllFilters = () => {
        setFilters({
            search: '',
            clinic_id: 'all',
            status: 'all',
            date_from: '',
            date_to: '',
        });
    };

    const getStatusBadge = (status: string) => {
        const variants: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
            pending: 'outline',
            confirmed: 'default',
            cancelled: 'destructive',
            completed: 'secondary',
        };
        return (
            <Badge variant={variants[status] || 'outline'}>
                {t(status)}
            </Badge>
        );
    };

    const columns = [
        {
            key: 'booking_reference',
            label: t('booking_reference'),
            render: (_: unknown, booking: Booking) => (
                <p className="font-mono text-sm">{booking.booking_reference}</p>
            ),
        },
        {
            key: 'clinic',
            label: t('clinic'),
            render: (_: unknown, booking: Booking) => (
                <p className="text-sm">
                    {isRTL && booking.clinic?.name_ar 
                        ? booking.clinic.name_ar 
                        : booking.clinic?.name_en || booking.clinic?.name_ar || t('n_a')}
                </p>
            ),
        },
        {
            key: 'user',
            label: t('user'),
            render: (_: unknown, booking: Booking) => (
                <p className="text-sm">{booking.user?.name || t('n_a')}</p>
            ),
        },
        {
            key: 'treatment',
            label: t('treatment'),
            render: (_: unknown, booking: Booking) => (
                <p className="text-sm">{booking.treatment?.name_en || booking.treatment?.name_ar || t('n_a')}</p>
            ),
        },
        {
            key: 'status',
            label: t('status'),
            render: (_: unknown, booking: Booking) => getStatusBadge(booking.status),
        },
        {
            key: 'total_amount',
            label: t('total_amount'),
            render: (_: unknown, booking: Booking) => (
                <p className="text-sm font-medium">{booking.total_amount} KWD</p>
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
            render: (_: unknown, booking: Booking) => (
                <div className={cn("flex items-center gap-1", isRTL ? 'justify-start flex-row-reverse' : 'justify-end')}>
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => router.visit(`/dashboard/clinics-bookings/${booking.id}`)}
                        title={t('view')}
                    >
                        <Eye className="h-4 w-4" />
                    </Button>
                </div>
            ),
        },
    ];

    const handlePageChange = (page: number) => {
        router.get('/dashboard/clinics-bookings', {
            page,
            per_page: bookings.per_page,
            search: filters.search || undefined,
            filters: {
                clinic_id: filters.clinic_id && filters.clinic_id !== 'all' ? filters.clinic_id : undefined,
                status: filters.status && filters.status !== 'all' ? filters.status : undefined,
                date_from: filters.date_from || undefined,
                date_to: filters.date_to || undefined,
            },
        }, { preserveState: true });
    };

    const handlePerPageChange = (perPage: number) => {
        router.get('/dashboard/clinics-bookings', {
            per_page: perPage,
            page: 1,
            search: filters.search || undefined,
            filters: {
                clinic_id: filters.clinic_id && filters.clinic_id !== 'all' ? filters.clinic_id : undefined,
                status: filters.status && filters.status !== 'all' ? filters.status : undefined,
                date_from: filters.date_from || undefined,
                date_to: filters.date_to || undefined,
            },
        }, { preserveState: true });
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={t('clinics_bookings_management')} />
            
            <div className={cn("flex h-full flex-1 flex-col gap-6 overflow-x-auto rounded-xl bg-card dark:bg-card p-6 border border-border", isRTL ? '!text-right' : '!text-left')} dir={dir}>
                <div className={cn("flex items-center justify-between", flexDirection)}>
                    <div className={cn(isRTL ? '!text-right' : '!text-left')}>
                        <h1 className={cn("text-3xl font-bold text-foreground", isRTL ? '!text-right' : '!text-left')}>{t('clinics_bookings_management')}</h1>
                        <p className={cn("text-muted-foreground mt-1", isRTL ? '!text-right' : '!text-left')}>{t('manage_clinics_bookings_description')}</p>
                    </div>
                </div>

                <div className={cn("flex items-center justify-between", flexDirection)}>
                    <div className={cn("flex items-center gap-2", flexDirection)}>
                        <span className={cn("text-sm text-foreground", isRTL ? '!text-right' : '!text-left')}>
                            {t('showing')} {((bookings.current_page - 1) * bookings.per_page) + 1} {t('of')} {bookings.total} {t('results')}
                        </span>
                        <Select value={bookings.per_page.toString()} onValueChange={(value) => handlePerPageChange(Number(value))}>
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
                            id="status"
                            label={t('status')}
                            value={filters.status}
                            onChange={(value) => setFilters(prev => ({ ...prev, status: value }))}
                            options={statusOptions}
                            placeholder={t('all')}
                        />
                        
                        <DateRangeFilter
                            id="date"
                            label={t('date')}
                            fromValue={filters.date_from}
                            toValue={filters.date_to}
                            onFromChange={(value) => setFilters(prev => ({ ...prev, date_from: value }))}
                            onToChange={(value) => setFilters(prev => ({ ...prev, date_to: value }))}
                            fromPlaceholder={t('date_from')}
                            toPlaceholder={t('date_to')}
                        />
                    </CollapsibleFilters>
                )}

                <DataTable
                    data={optimisticBookings}
                    columns={columns}
                    total={bookings.total}
                    currentPage={bookings.current_page}
                    perPage={bookings.per_page}
                    onPageChange={handlePageChange}
                    onPerPageChange={handlePerPageChange}
                />
            </div>
        </AppLayout>
    );
}

