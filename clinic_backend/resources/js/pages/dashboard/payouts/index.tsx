import { DataTable } from '@/components/data-table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { UserCard } from '@/components/user-card';
import { ClinicCard } from '@/components/clinic-card';
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
import { Eye, Filter, DollarSign } from 'lucide-react';
import { useState, useEffect, useCallback } from 'react';
import { index as dashboard } from '@/routes/dashboard';
import { type BreadcrumbItem } from '@/types';
import { formatHumanDate } from '@/utils/date-utils';
import { getLocalizedName } from '@/utils/localization';
import { cn } from '@/lib/utils';

interface Payout {
    id: number;
    payout_reference: string;
    clinic?: {
        id: number;
        name_en: string;
        name_ar: string;
        logo?: string | null;
        email?: string;
        phone?: string;
        owner?: {
            id: number;
            name: string;
            email: string;
        };
    };
    total_amount: string;
    commission_deducted: string;
    net_amount: string;
    currency: string;
    status: 'pending' | 'approved' | 'failed';
    frequency: 'daily' | 'weekly' | 'bi_weekly' | 'monthly' | 'manual';
    payout_date: string;
    processed_at?: string;
    bank_reference?: string;
    created_at: string;
}

interface PayoutsPageProps {
    payouts: {
        data: Payout[];
        current_page: number;
        last_page: number;
        per_page: number;
        total: number;
    };
    stats?: {
        total_pending: number;
        total_approved: number;
        total_commission: number;
        pending_count: number;
    };
    filters?: {
        status?: string;
        frequency?: string;
    };
}

export default function PayoutsIndex({ payouts, stats, filters: initialFilters }: PayoutsPageProps) {
    useRTLInit();
    const { t, locale } = useTranslation();
    const { isRTL, dir, textAlign, flexDirection, iconMargin } = useRTL();
    
    const breadcrumbs: BreadcrumbItem[] = [
        {
            title: t('dashboard'),
            href: dashboard.url(),
        },
        {
            title: t('payouts_management'),
            href: '/dashboard/payouts',
        },
    ];

    const [optimisticPayouts, setOptimisticPayouts] = useState(payouts?.data || []);
    const [showFilters, setShowFilters] = useState(false);
    const [isInitialLoad, setIsInitialLoad] = useState(true);

    const [filters, setFilters] = useState({
        search: '',
        status: initialFilters?.status || 'all',
        frequency: initialFilters?.frequency || 'all',
        created_from: '',
        created_to: '',
    });

    const applyFiltersToBackend = useCallback((filtersToApply: typeof filters) => {
        router.get('/dashboard/payouts', {
            page: 1,
            status: filtersToApply.status !== 'all' ? filtersToApply.status : undefined,
            frequency: filtersToApply.frequency !== 'all' ? filtersToApply.frequency : undefined,
            search: filtersToApply.search || undefined,
            filters: {
                created_from: filtersToApply.created_from || undefined,
                created_to: filtersToApply.created_to || undefined,
            },
        }, { preserveState: true, preserveScroll: true });
    }, []);

    useEffect(() => {
        if (payouts?.data) {
            setOptimisticPayouts(payouts.data);
        }
    }, [payouts?.data]);

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
        { value: 'failed', label: t('failed') },
    ];

    const frequencyOptions: SelectOption[] = [
        { value: 'all', label: t('all') },
        { value: 'daily', label: t('daily') },
        { value: 'weekly', label: t('weekly') },
        { value: 'bi_weekly', label: t('bi_weekly') },
        { value: 'monthly', label: t('monthly') },
        { value: 'manual', label: t('manual') },
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

        if (filters.frequency && filters.frequency !== 'all') {
            const option = frequencyOptions.find(o => o.value === filters.frequency);
            active.push({
                key: 'frequency',
                label: t('frequency'),
                value: filters.frequency,
                displayValue: option?.label || filters.frequency,
            });
        }

        if (filters.created_from || filters.created_to) {
            active.push({
                key: 'created_date',
                label: t('created_date'),
                value: `${filters.created_from || ''}_${filters.created_to || ''}`,
                displayValue: `${filters.created_from || '...'} - ${filters.created_to || '...'}`,
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
        } else if (key === 'frequency') {
            newFilters.frequency = 'all';
        } else {
            newFilters[key as keyof typeof filters] = '';
        }

        setFilters(newFilters);
    };

    const handleClearAllFilters = () => {
        const clearedFilters = {
            search: '',
            status: 'all',
            frequency: 'all',
            created_from: '',
            created_to: '',
        };
        setFilters(clearedFilters);
    };

    const handlePageChange = (page: number) => {
        router.get('/dashboard/payouts', {
            ...filters,
            page,
            per_page: payouts.per_page,
        }, { preserveState: true, preserveScroll: true });
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

    const columns = [
        {
            key: 'payout_reference',
            label: t('payout_reference'),
            render: (_: unknown, payout: Payout) => (
                <div className={cn("font-mono text-sm", textAlign)} dir="ltr">
                    {payout.payout_reference}
                </div>
            ),
        },
        {
            key: 'clinic',
            label: t('clinic'),
            render: (_: unknown, payout: Payout) => (
                <div className="p-2">
                    {payout.clinic ? (
                        <>
                            <ClinicCard
                                clinic={{
                                    id: payout.clinic.id,
                                    company_name_en: payout.clinic.name_en,
                                    company_name_ar: payout.clinic.name_ar,
                                    email: payout.clinic.email,
                                    phone: payout.clinic.phone,
                                    logo: payout.clinic.logo,
                                }}
                                locale={locale}
                                variant="default"
                            />
                            {payout.clinic.owner && (
                                <div className="mt-2">
                                    <UserCard 
                                        user={{
                                            id: payout.clinic.owner.id,
                                            name: payout.clinic.owner.name,
                                            email: payout.clinic.owner.email || '',
                                            phone: '',
                                            email_verified_at: null,
                                            phone_verified_at: null,
                                        }} 
                                        variant="compact"
                                        showVerificationBadges={false}
                                    />
                                </div>
                            )}
                        </>
                    ) : (
                        <span className={cn("text-muted-foreground", textAlign)} dir={dir}>{t('n_a')}</span>
                    )}
                </div>
            ),
        },
        {
            key: 'amount',
            label: t('amount'),
            render: (_: unknown, payout: Payout) => (
                <div className={cn("flex flex-col", textAlign)}>
                    <span className={cn("font-medium text-foreground", textAlign)} dir="ltr">
                        {parseFloat(payout.net_amount).toFixed(2)} {payout.currency}
                    </span>
                    <span className={cn("text-xs text-muted-foreground", textAlign)} dir="ltr">
                        {t('total')}: {parseFloat(payout.total_amount).toFixed(2)} {payout.currency}
                    </span>
                </div>
            ),
        },
        {
            key: 'status',
            label: t('status'),
            render: (_: unknown, payout: Payout) => {
                const statusColors = {
                    pending: 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300 border-yellow-200 dark:border-yellow-800',
                    approved: 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 border-green-200 dark:border-green-800',
                    failed: 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300 border-red-200 dark:border-red-800',
                };
                
                return (
                    <Badge className={statusColors[payout.status] || ''}>
                        {t(payout.status)}
                    </Badge>
                );
            },
        },
        {
            key: 'frequency',
            label: t('frequency'),
            render: (_: unknown, payout: Payout) => (
                <span className={cn("text-sm text-foreground", textAlign)} dir={dir}>{t(payout.frequency)}</span>
            ),
        },
        {
            key: 'payout_date',
            label: t('payout_date'),
            render: (date: string) => (
                <span className={cn("text-sm", textAlign)} dir={dir}>{formatHumanDate(date, t)}</span>
            ),
        },
        {
            key: 'actions',
            label: t('actions'),
            render: (_: unknown, payout: Payout) => (
                <div className={cn("flex items-center gap-1", isRTL ? 'justify-start flex-row-reverse' : 'justify-end')}>
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => router.visit(`/dashboard/payouts/${payout.id}`)}
                        title={t('view')}
                    >
                        <Eye className="h-4 w-4" />
                    </Button>
                </div>
            ),
        },
    ];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={t('payouts_management')} />

            <div className={cn("flex h-full flex-1 flex-col gap-6 overflow-x-auto rounded-xl bg-card dark:bg-card p-6 border border-border", textAlign)} dir={dir}>
                {/* Header */}
                <div className={cn("flex items-center justify-between border-b pb-4", flexDirection)}>
                    <div className={textAlign}>
                        <h1 className={cn("text-3xl font-bold text-foreground", textAlign)}>{t('payouts_management')}</h1>
                        <p className={cn("text-muted-foreground mt-1", textAlign)}>{t('manage_clinic_payouts')}</p>
                    </div>
                </div>

                {/* Stats Cards */}
                {stats && (
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div className={cn("p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800", textAlign)}>
                            <p className={cn("text-sm text-muted-foreground", textAlign)}>{t('total_pending')}</p>
                            <p className={cn("text-2xl font-bold text-foreground", textAlign)} dir="ltr">
                                {typeof stats.total_pending === 'number' ? stats.total_pending.toFixed(2) : '0.00'} KWD
                            </p>
                            <p className={cn("text-xs text-muted-foreground mt-1", textAlign)} dir="ltr">
                                {stats.pending_count || 0} {t('payouts')}
                            </p>
                        </div>
                        <div className={cn("p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800", textAlign)}>
                            <p className={cn("text-sm text-muted-foreground", textAlign)}>{t('total_approved')}</p>
                            <p className={cn("text-2xl font-bold text-foreground", textAlign)} dir="ltr">
                                {typeof stats.total_approved === 'number' ? stats.total_approved.toFixed(2) : '0.00'} KWD
                            </p>
                        </div>
                        <div className={cn("p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg border border-purple-200 dark:border-purple-800", textAlign)}>
                            <p className={cn("text-sm text-muted-foreground", textAlign)}>{t('total_commission')}</p>
                            <p className={cn("text-2xl font-bold text-foreground", textAlign)} dir="ltr">
                                {typeof stats.total_commission === 'number' ? stats.total_commission.toFixed(2) : '0.00'} KWD
                            </p>
                        </div>
                        <div className={cn("p-4 bg-orange-50 dark:bg-orange-900/20 rounded-lg border border-orange-200 dark:border-orange-800", textAlign)}>
                            <p className={cn("text-sm text-muted-foreground", textAlign)}>{t('pending_count')}</p>
                            <p className={cn("text-2xl font-bold text-foreground", textAlign)} dir="ltr">
                                {stats.pending_count || 0}
                            </p>
                        </div>
                    </div>
                )}

                {/* Filters and Actions */}
                <div className={cn("flex items-center justify-between", flexDirection)}>
                    <div className={cn("flex items-center gap-3", flexDirection)}>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setShowFilters(!showFilters)}
                            className={flexDirection}
                        >
                            <Filter className={cn("h-4 w-4", iconMargin('md'))} />
                            {t('filters')}
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
                            placeholder={t('search_by_payout_reference')}
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
                            id="frequency"
                            label={t('frequency')}
                            value={filters.frequency}
                            onChange={(value) => setFilters(prev => ({ ...prev, frequency: value }))}
                            options={frequencyOptions}
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
                    data={optimisticPayouts}
                    columns={columns}
                    total={payouts?.total || 0}
                    currentPage={payouts?.current_page || 1}
                    perPage={payouts?.per_page || 15}
                    onPageChange={handlePageChange}
                    onPerPageChange={handlePerPageChange}
                />
            </div>
        </AppLayout>
    );
}

