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
    type ActiveFilter,
    type SelectOption 
} from '@/components/filters';
import AppLayout from '@/layouts/app-layout';
import { useTranslation } from '@/hooks/use-translation';
import { useRTL } from '@/hooks/use-rtl';
import { useRTLInit } from '@/hooks/use-rtl-init';
import { Head, router, usePage } from '@inertiajs/react';
import { Eye, Edit, Filter, Plus } from 'lucide-react';
import { useState, useEffect, useCallback } from 'react';
import { index as dashboard } from '@/routes/dashboard';
import { type BreadcrumbItem } from '@/types';
import { formatHumanDate } from '@/utils/date-utils';
import { cn } from '@/lib/utils';
import { type SharedData } from '@/types';

interface Subscription {
    id: number;
    clinic_id: number;
    subscription_package_id: number;
    status: string;
    start_date: string;
    end_date?: string;
    clinic?: { id: number; name_en: string; name_ar: string };
    subscriptionPackage?: { id: number; name_en: string; name_ar: string };
    created_at: string;
}

interface ClinicsSubscriptionsPageProps {
    subscriptions: {
        data: Subscription[];
        current_page: number;
        last_page: number;
        per_page: number;
        total: number;
    };
    filters: {
        clinic_id?: string;
        status?: string;
        package_id?: string;
        search?: string;
    };
    clinics?: Array<{ id: number; name_en: string; name_ar: string }>;
    packages?: Array<{ id: number; name_en: string; name_ar: string }>;
}

export default function ClinicsSubscriptionsIndex({ subscriptions, filters: initialFilters, clinics = [], packages = [] }: ClinicsSubscriptionsPageProps) {
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
            title: t('clinics_subscriptions_management'),
            href: '/dashboard/clinics-subscriptions',
        },
    ];

    const [optimisticSubscriptions, setOptimisticSubscriptions] = useState(subscriptions.data);
    const [showFilters, setShowFilters] = useState(false);
    const [isInitialLoad, setIsInitialLoad] = useState(true);

    const [filters, setFilters] = useState({
        search: initialFilters?.search || '',
        clinic_id: initialFilters?.clinic_id || 'all',
        status: initialFilters?.status || 'all',
        package_id: initialFilters?.package_id || 'all',
    });

    const applyFiltersToBackend = useCallback((filtersToApply: typeof filters) => {
        const params: any = {
            page: 1,
        };
        
        if (filtersToApply.search) {
            params.search = filtersToApply.search;
        }
        
        const filterParams: any = {};
        if (filtersToApply.clinic_id && filtersToApply.clinic_id !== 'all') {
            filterParams.clinic_id = filtersToApply.clinic_id;
        }
        if (filtersToApply.status && filtersToApply.status !== 'all') {
            filterParams.status = filtersToApply.status;
        }
        if (filtersToApply.package_id && filtersToApply.package_id !== 'all') {
            filterParams.package_id = filtersToApply.package_id;
        }
        
        if (Object.keys(filterParams).length > 0) {
            params.filters = filterParams;
        }
        
        router.get('/dashboard/clinics-subscriptions', params, { preserveState: true, preserveScroll: true });
    }, []);

    useEffect(() => {
        setOptimisticSubscriptions(subscriptions.data);
    }, [subscriptions.data]);

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
        { value: 'expired', label: t('expired') },
        { value: 'cancelled', label: t('cancelled') },
    ];

    const clinicOptions: SelectOption[] = [
        { value: 'all', label: t('all') },
        ...clinics.map(clinic => ({
            value: clinic.id.toString(),
            label: clinic.name_en || clinic.name_ar,
        })),
    ];

    const packageOptions: SelectOption[] = [
        { value: 'all', label: t('all') },
        ...packages.map(pkg => ({
            value: pkg.id.toString(),
            label: pkg.name_en || pkg.name_ar,
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
        if (filters.package_id && filters.package_id !== 'all') {
            const pkg = packages.find(p => p.id.toString() === filters.package_id);
            active.push({ key: 'package_id', label: t('package'), value: pkg?.name_en || pkg?.name_ar || filters.package_id });
        }
        return active;
    };

    const handleRemoveFilter = (key: string) => {
        setFilters(prev => {
            const newFilters = { ...prev };
            if (key === 'search') newFilters.search = '';
            else if (key === 'clinic_id') newFilters.clinic_id = 'all';
            else if (key === 'status') newFilters.status = 'all';
            else if (key === 'package_id') newFilters.package_id = 'all';
            return newFilters;
        });
    };

    const handleClearAllFilters = () => {
        setFilters({
            search: '',
            clinic_id: 'all',
            status: 'all',
            package_id: 'all',
        });
    };

    const getStatusBadge = (status: string) => {
        const variants: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
            active: 'default',
            expired: 'destructive',
            cancelled: 'outline',
        };
        return (
            <Badge variant={variants[status] || 'outline'} className={cn(isRTL ? '!text-right' : '!text-left')}>
                {t(status)}
            </Badge>
        );
    };

    const columns = [
        {
            key: 'clinic',
            label: t('clinic'),
            render: (_: unknown, subscription: Subscription) => (
                <p className={cn("font-medium", isRTL ? '!text-right' : '!text-left')} dir={isRTL && subscription.clinic?.name_ar ? 'rtl' : 'ltr'}>
                    {subscription.clinic?.name_en || subscription.clinic?.name_ar || t('n_a')}
                </p>
            ),
        },
        {
            key: 'package',
            label: t('package'),
            render: (_: unknown, subscription: Subscription) => (
                <p className={cn("text-sm", isRTL ? '!text-right' : '!text-left')} dir={isRTL && subscription.subscriptionPackage?.name_ar ? 'rtl' : 'ltr'}>
                    {subscription.subscriptionPackage?.name_en || subscription.subscriptionPackage?.name_ar || t('n_a')}
                </p>
            ),
        },
        {
            key: 'status',
            label: t('status'),
            render: (_: unknown, subscription: Subscription) => getStatusBadge(subscription.status),
        },
        {
            key: 'start_date',
            label: t('start_date'),
            render: (date: string) => formatHumanDate(date),
        },
        {
            key: 'end_date',
            label: t('end_date'),
            render: (date: string | null) => date ? formatHumanDate(date) : t('n_a'),
        },
        {
            key: 'created_at',
            label: t('created_at'),
            render: (date: string) => formatHumanDate(date),
        },
        {
            key: 'actions',
            label: t('actions'),
            render: (_: unknown, subscription: Subscription) => (
                <div className={cn("flex items-center gap-1", isRTL ? 'justify-start' : 'justify-end', flexDirection)}>
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => router.visit(`/dashboard/clinics-subscriptions/${subscription.id}`)}
                        title={t('view')}
                    >
                        <Eye className={cn("h-4 w-4", iconMargin('sm'))} />
                    </Button>
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => router.visit(`/dashboard/clinics-subscriptions/${subscription.id}/edit`)}
                        title={t('edit')}
                    >
                        <Edit className={cn("h-4 w-4", iconMargin('sm'))} />
                    </Button>
                </div>
            ),
        },
    ];

    const handlePageChange = (page: number) => {
        const params: any = {
            page,
            per_page: subscriptions.per_page,
        };
        
        if (filters.search) {
            params.search = filters.search;
        }
        
        const filterParams: any = {};
        if (filters.clinic_id && filters.clinic_id !== 'all') {
            filterParams.clinic_id = filters.clinic_id;
        }
        if (filters.status && filters.status !== 'all') {
            filterParams.status = filters.status;
        }
        if (filters.package_id && filters.package_id !== 'all') {
            filterParams.package_id = filters.package_id;
        }
        
        if (Object.keys(filterParams).length > 0) {
            params.filters = filterParams;
        }
        
        router.get('/dashboard/clinics-subscriptions', params, { preserveState: true });
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
        if (filters.clinic_id && filters.clinic_id !== 'all') {
            filterParams.clinic_id = filters.clinic_id;
        }
        if (filters.status && filters.status !== 'all') {
            filterParams.status = filters.status;
        }
        if (filters.package_id && filters.package_id !== 'all') {
            filterParams.package_id = filters.package_id;
        }
        
        if (Object.keys(filterParams).length > 0) {
            params.filters = filterParams;
        }
        
        router.get('/dashboard/clinics-subscriptions', params, { preserveState: true });
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={t('clinics_subscriptions_management')} />
            
            <div className={cn("flex h-full flex-1 flex-col gap-6 overflow-x-auto rounded-xl bg-card dark:bg-card p-6 border border-border", isRTL ? '!text-right' : '!text-left')} dir={dir}>
                <div className={cn("flex items-center justify-between", flexDirection)}>
                    <div className={cn(isRTL ? '!text-right' : '!text-left')}>
                        <h1 className={cn("text-3xl font-bold text-foreground", isRTL ? '!text-right' : '!text-left')}>{t('clinics_subscriptions_management')}</h1>
                        <p className={cn("text-muted-foreground mt-1", isRTL ? '!text-right' : '!text-left')}>{t('manage_clinics_subscriptions_description')}</p>
                    </div>
                    <Button
                        onClick={() => router.visit('/dashboard/clinics-subscriptions/create')}
                        className={cn("flex items-center gap-2", flexDirection)}
                    >
                        <Plus className={cn("h-4 w-4", iconMargin('md'))} />
                        {t('create_subscription')}
                    </Button>
                </div>

                <div className={cn("flex items-center justify-between", flexDirection)}>
                    <div className={cn("flex items-center gap-2", flexDirection)}>
                        <span className={cn("text-sm text-foreground", isRTL ? '!text-right' : '!text-left')}>
                            {t('showing')} {((subscriptions.current_page - 1) * subscriptions.per_page) + 1} {t('of')} {subscriptions.total} {t('results')}
                        </span>
                        <Select value={subscriptions.per_page.toString()} onValueChange={(value) => handlePerPageChange(Number(value))}>
                            <SelectTrigger dir={dir} className={cn("w-20", isRTL ? '!text-right' : '!text-left')}>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent dir={dir}>
                                <SelectItem value="10" className={cn(isRTL ? '!text-right' : '!text-left')}>10</SelectItem>
                                <SelectItem value="15" className={cn(isRTL ? '!text-right' : '!text-left')}>15</SelectItem>
                                <SelectItem value="25" className={cn(isRTL ? '!text-right' : '!text-left')}>25</SelectItem>
                                <SelectItem value="50" className={cn(isRTL ? '!text-right' : '!text-left')}>50</SelectItem>
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
                            <Filter className={cn("h-4 w-4", iconMargin('md'))} />
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
                        
                        <SelectFilter
                            id="package_id"
                            label={t('package')}
                            value={filters.package_id}
                            onChange={(value) => setFilters(prev => ({ ...prev, package_id: value }))}
                            options={packageOptions}
                            placeholder={t('all')}
                        />
                    </CollapsibleFilters>
                )}

                <DataTable
                    data={optimisticSubscriptions}
                    columns={columns}
                    total={subscriptions.total}
                    currentPage={subscriptions.current_page}
                    perPage={subscriptions.per_page}
                    onPageChange={handlePageChange}
                    onPerPageChange={handlePerPageChange}
                />
            </div>
        </AppLayout>
    );
}

