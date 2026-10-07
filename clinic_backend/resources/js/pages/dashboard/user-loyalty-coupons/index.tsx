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
import { UserCard } from '@/components/user-card';
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
import { Plus, Eye, Edit, Trash2, Filter } from 'lucide-react';
import { useState, useEffect, useCallback } from 'react';
import { customToast } from '@/components/ui/custom-toast';
import { index as dashboard } from '@/routes/dashboard';
import { type BreadcrumbItem } from '@/types';
import { formatHumanDate } from '@/utils/date-utils';
import { cn } from '@/lib/utils';

interface UserLoyaltyCoupon {
    id: number;
    user_id: number;
    user?: { id: number; name: string };
    code: string;
    title_en?: string;
    title_ar?: string;
    discount_type: string;
    discount_value: string;
    status: 'active' | 'inactive' | 'used' | 'expired';
    usage_limit?: number;
    used_count?: number;
    valid_from?: string;
    valid_until?: string;
    created_at: string;
}

interface UserLoyaltyCouponsPageProps {
    coupons?: {
        data: UserLoyaltyCoupon[];
        current_page: number;
        last_page: number;
        per_page: number;
        total: number;
    };
    filters?: {
        search?: string;
        status?: string;
        created_from?: string;
        created_to?: string;
    };
}

export default function UserLoyaltyCouponsIndex({ coupons, filters: initialFilters }: UserLoyaltyCouponsPageProps) {
    useRTLInit();
    const { t, locale } = useTranslation();
    const page = usePage<SharedData>();
    const { locale: pageLocale } = page.props;
    const isRTL = pageLocale === 'ar';
    const dir = isRTL ? 'rtl' : 'ltr';
    
    const breadcrumbs: BreadcrumbItem[] = [
        {
            title: t('dashboard'),
            href: dashboard.url(),
        },
        {
            title: t('user_loyalty_coupons_management'),
            href: '/dashboard/user-loyalty-coupons',
        },
    ];
    const { flexDirection, iconMargin } = useRTL();
    const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; couponId: number | null }>({ 
        open: false, 
        couponId: null 
    });
    const [optimisticCoupons, setOptimisticCoupons] = useState(coupons?.data || []);
    const [showFilters, setShowFilters] = useState(false);
    const [isInitialLoad, setIsInitialLoad] = useState(true);

    const [filters, setFilters] = useState({
        search: initialFilters?.search || '',
        status: initialFilters?.status || 'all',
        created_from: initialFilters?.created_from || '',
        created_to: initialFilters?.created_to || '',
    });

    const applyFiltersToBackend = useCallback((filtersToApply: typeof filters) => {
        router.get('/dashboard/user-loyalty-coupons', {
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
        if (coupons?.data) {
            setOptimisticCoupons(coupons.data);
        }
    }, [coupons?.data]);

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
        { value: 'used', label: t('used') },
        { value: 'expired', label: t('expired') },
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

    const columns = [
        {
            key: 'code',
            label: t('coupon_code'),
            render: (_: unknown, coupon: UserLoyaltyCoupon) => (
                <span className={cn("font-medium font-mono", isRTL ? '!text-right' : '!text-left')} dir="ltr">{coupon.code}</span>
            ),
        },
        {
            key: 'user',
            label: t('user'),
            render: (_: unknown, coupon: UserLoyaltyCoupon) => (
                coupon.user ? (
                    <UserCard 
                        user={{
                            id: coupon.user.id,
                            name: coupon.user.name,
                            email: '',
                            phone: '',
                            email_verified_at: null,
                            phone_verified_at: null,
                        }} 
                        variant="compact"
                        showVerificationBadges={false}
                    />
                ) : (
                    <span className={cn("text-muted-foreground", isRTL ? '!text-right' : '!text-left')} dir={dir}>—</span>
                )
            ),
        },
        {
            key: 'discount',
            label: t('discount'),
            render: (_: unknown, coupon: UserLoyaltyCoupon) => (
                <span className={cn("font-medium", isRTL ? '!text-right' : '!text-left')} dir="ltr">
                    {coupon.discount_type === 'percentage' 
                        ? `${coupon.discount_value}%` 
                        : `${coupon.discount_value}`}
                </span>
            ),
        },
        {
            key: 'status',
            label: t('status'),
            render: (_: unknown, coupon: UserLoyaltyCoupon) => (
                <Badge 
                    variant={
                        coupon.status === 'active' ? 'default' : 
                        coupon.status === 'used' ? 'secondary' : 'destructive'
                    }
                    className={cn(
                        coupon.status === 'active' 
                            ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300' 
                            : coupon.status === 'used'
                            ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-300'
                            : 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300',
                        isRTL ? '!text-right' : '!text-left'
                    )}
                >
                    {t(coupon.status)}
                </Badge>
            ),
        },
        {
            key: 'created_at',
            label: t('created_at'),
            render: (date: string) => <span className={cn("text-sm text-muted-foreground", isRTL ? '!text-right' : '!text-left')} dir={dir}>{formatHumanDate(date, t)}</span>,
        },
        {
            key: 'actions',
            label: t('actions'),
            render: (_: unknown, coupon: UserLoyaltyCoupon) => (
                <div className={cn("flex items-center gap-1 w-full", isRTL ? 'justify-start flex-row-reverse' : 'justify-end')}>
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => router.visit(`/dashboard/user-loyalty-coupons/${coupon.id}`)}
                        title={t('view')}
                    >
                        <Eye className="h-4 w-4" />
                    </Button>
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => router.visit(`/dashboard/user-loyalty-coupons/${coupon.id}/edit`)}
                        title={t('edit')}
                    >
                        <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setDeleteDialog({ open: true, couponId: coupon.id })}
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
        if (deleteDialog.couponId) {
            const coupon = optimisticCoupons.find(c => c.id === deleteDialog.couponId);
            router.delete(`/dashboard/user-loyalty-coupons/${deleteDialog.couponId}`, {
                onSuccess: () => {
                    customToast.success(t('coupon_deleted_successfully'), coupon?.code);
                    setOptimisticCoupons(prev => prev.filter(c => c.id !== deleteDialog.couponId));
                },
                onError: () => {
                    customToast.error(t('update_failed'));
                }
            });
        }
    };

    const handlePageChange = (page: number) => {
        router.get('/dashboard/user-loyalty-coupons', {
            page,
            per_page: coupons.per_page,
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
            preserveState: true,
            preserveScroll: true,
        });
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={t('user_loyalty_coupons_management')} />
            
            <div className={cn("flex h-full flex-1 flex-col gap-6 overflow-x-auto rounded-xl bg-card dark:bg-card p-6 border border-border", isRTL ? '!text-right' : '!text-left')} dir={dir}>
                {/* Header */}
                <div className={cn("flex items-center justify-between border-b pb-4", flexDirection)}>
                    <div className={cn(isRTL ? '!text-right' : '!text-left')}>
                        <h1 className={cn("text-3xl font-bold text-foreground", isRTL ? '!text-right' : '!text-left')}>{t('user_loyalty_coupons_management')}</h1>
                        <p className={cn("text-muted-foreground mt-1", isRTL ? '!text-right' : '!text-left')}>{t('manage_user_loyalty_coupons')}</p>
                    </div>
                    <Link href="/dashboard/user-loyalty-coupons/create">
                        <Button className={cn("flex items-center gap-2", flexDirection)}>
                            <Plus className={cn("h-4 w-4", iconMargin('md'))} />
                            {t('add_user_loyalty_coupon')}
                        </Button>
                    </Link>
                </div>

                {/* Pagination Info and Show Filters Button */}
                <div className={cn("flex items-center justify-between", flexDirection)}>
                    <div className={cn("flex items-center gap-2", flexDirection)}>
                        <span className={cn("text-sm text-foreground", isRTL ? '!text-right' : '!text-left')}>
                            {t('showing')} {((coupons?.current_page || 1) - 1) * (coupons?.per_page || 15) + 1} {t('of')} {coupons?.total || 0} {t('results')}
                        </span>
                        <Select value={(coupons?.per_page || 15).toString()} onValueChange={(value) => handlePerPageChange(Number(value))}>
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
                    data={optimisticCoupons}
                    columns={columns}
                    total={coupons?.total || 0}
                    currentPage={coupons?.current_page || 1}
                    perPage={coupons?.per_page || 15}
                    onPageChange={handlePageChange}
                    onPerPageChange={handlePerPageChange}
                    locale={locale}
                />
            </div>

            <ConfirmationDialog
                open={deleteDialog.open}
                onOpenChange={(open) => setDeleteDialog({ open, couponId: null })}
                onConfirm={handleDelete}
                title={t('delete_user_loyalty_coupon')}
                description={t('delete_user_loyalty_coupon_confirmation')}
                variant="danger"
                confirmText={t('delete')}
            />
        </AppLayout>
    );
}

