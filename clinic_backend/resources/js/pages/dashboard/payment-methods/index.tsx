import { DataTable } from '@/components/data-table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
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
import { useRTLInit } from '@/hooks/use-rtl-init';
import { useTranslation } from '@/hooks/use-translation';
import { useRTL } from '@/hooks/use-rtl';
import { Head, Link, router, usePage } from '@inertiajs/react';
import { type SharedData } from '@/types';
import { Eye, Filter } from 'lucide-react';
import { useState, useCallback } from 'react';
import { index as dashboard } from '@/routes/dashboard';
import { type BreadcrumbItem } from '@/types';
import { formatHumanDate } from '@/utils/date-utils';
import { formatCurrency } from '@/utils/currency-utils';
import { getLocalizedName } from '@/utils/localization';
import { cn } from '@/lib/utils';

interface PaymentMethod {
    id: number;
    payment_method_id?: string;
    payment_method_ar: string;
    payment_method_en: string;
    payment_method_code?: string;
    is_direct_payment: boolean;
    service_charge: string;
    total_amount: string;
    currency_iso?: string;
    image_url?: string;
    is_embedded_supported: boolean;
    payment_currency_iso?: string;
    status: string;
    is_ios_supported: boolean;
    is_android_supported: boolean;
    is_web_supported: boolean;
    created_at: string;
    updated_at: string;
}

interface PaymentMethodsPageProps {
    paymentMethods: {
        data: PaymentMethod[];
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

export default function PaymentMethodsIndex({ paymentMethods, filters: initialFilters }: PaymentMethodsPageProps) {
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
            title: t('payment_methods'),
            href: '/dashboard/payment-methods',
        },
    ];
    const [showFilters, setShowFilters] = useState(false);

    const [filters, setFilters] = useState({
        search: initialFilters?.search || '',
        status: initialFilters?.status || 'all',
    });

    const applyFiltersToBackend = useCallback((filtersToApply: typeof filters) => {
        router.get('/dashboard/payment-methods', {
            page: 1,
            search: filtersToApply.search || undefined,
            filters: {
                status: filtersToApply.status && filtersToApply.status !== 'all' ? filtersToApply.status : undefined,
            },
        }, { preserveState: true });
    }, []);

    const handleFilterChange = (key: string, value: string) => {
        const newFilters = { ...filters, [key]: value };
        setFilters(newFilters);
        applyFiltersToBackend(newFilters);
    };

    const clearFilters = () => {
        const clearedFilters = {
            search: '',
            status: 'all',
        };
        setFilters(clearedFilters);
        applyFiltersToBackend(clearedFilters);
    };

    const handleToggleStatus = (methodId: number, currentStatus: string) => {
        router.patch(`/dashboard/payment-methods/${methodId}/toggle-status`, {
            status: currentStatus === 'active' ? 'inactive' : 'active',
        }, { preserveScroll: true });
    };

    const activeFilters: ActiveFilter[] = [
        ...(filters.search ? [{ key: 'search', label: t('search'), value: filters.search }] : []),
        ...(filters.status && filters.status !== 'all' ? [{ key: 'status', label: t('status'), value: t(filters.status) }] : []),
    ];

    const statusOptions: SelectOption[] = [
        { value: 'all', label: t('all_statuses') },
        { value: 'active', label: t('active') },
        { value: 'inactive', label: t('inactive') },
    ];

    const columns = [
        {
            key: 'id',
            label: t('id'),
            render: (_: unknown, method: PaymentMethod) => (
                <span className="font-medium" dir="ltr">#{method.id}</span>
            ),
        },
        {
            key: 'name',
            label: t('name'),
            render: (_: unknown, method: PaymentMethod) => (
                <div className={cn("flex items-center gap-3", flexDirection)}>
                    {method.image_url && (
                        <img 
                            src={method.image_url} 
                            alt={getLocalizedName(method.payment_method_en, method.payment_method_ar, locale)}
                            className="h-8 w-8 object-contain rounded"
                        />
                    )}
                    <div className={cn(isRTL ? '!text-right' : '!text-left')}>
                        <div className={cn("font-medium", isRTL ? '!text-right' : '!text-left')} dir={dir}>
                            {getLocalizedName(method.payment_method_en, method.payment_method_ar, locale)}
                        </div>
                        {method.payment_method_code && (
                            <div className={cn("text-xs text-muted-foreground", isRTL ? '!text-right' : '!text-left')} dir="ltr">{method.payment_method_code}</div>
                        )}
                    </div>
                </div>
            ),
        },
        {
            key: 'platforms',
            label: t('platforms'),
            render: (_: unknown, method: PaymentMethod) => {
                const platforms = [];
                if (method.is_ios_supported) platforms.push(t('platform_ios'));
                if (method.is_android_supported) platforms.push(t('platform_android'));
                if (method.is_web_supported) platforms.push(t('platform_web'));
                return (
                    <div className={cn("flex gap-1", flexDirection)}>
                        {platforms.map((p) => (
                            <Badge key={p} variant="secondary" className={cn("text-xs", isRTL ? '!text-right' : '!text-left')} dir="ltr">
                                {p}
                            </Badge>
                        ))}
                    </div>
                );
            },
        },
        {
            key: 'status',
            label: t('status'),
            render: (_: unknown, method: PaymentMethod) => {
                const status = method.status;
                const isActive = status === 'active';
                return (
                    <div className={cn("flex items-center gap-3", flexDirection)}>
                        <Switch
                            checked={isActive}
                            onCheckedChange={() => handleToggleStatus(method.id, method.status)}
                            aria-label={isActive ? t('deactivate') : t('activate')}
                        />
                        <Badge 
                            variant={isActive ? 'default' : 'secondary'}
                            className={cn(
                                isActive 
                                    ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300' 
                                    : 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300',
                                isRTL ? '!text-right' : '!text-left'
                            )}
                        >
                            {t(status)}
                        </Badge>
                    </div>
                );
            },
        },
        {
            key: 'created_at',
            label: t('created_at'),
            render: (date: string) => {
                if (!date) {
                    return <span className="text-sm text-muted-foreground">{t('n_a')}</span>;
                }
                return formatHumanDate(date, t);
            },
        },
        {
            key: 'actions',
            label: t('actions'),
            render: (_: unknown, method: PaymentMethod) => (
                <div className={cn("flex items-center gap-1 w-full", isRTL ? 'justify-start flex-row-reverse' : 'justify-end')}>
                    <Link href={`/dashboard/payment-methods/${method.id}`}>
                        <Button variant="ghost" size="icon" title={t('view')}>
                            <Eye className="h-4 w-4" />
                        </Button>
                    </Link>
                </div>
            ),
        },
    ];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={t('payment_methods')} />

            <div className={cn("flex h-full flex-1 flex-col gap-6 overflow-x-auto rounded-xl bg-card dark:bg-card p-6 border border-border", isRTL ? '!text-right' : '!text-left')} dir={dir}>
                {/* Header */}
                <div className={cn("flex items-center justify-between border-b pb-4", flexDirection)}>
                    <div className={cn(isRTL ? '!text-right' : '!text-left')}>
                        <h1 className={cn("text-3xl font-bold text-foreground", isRTL ? '!text-right' : '!text-left')}>{t('payment_methods')}</h1>
                        <p className={cn("text-muted-foreground mt-1", isRTL ? '!text-right' : '!text-left')}>
                            {t('manage_payment_methods') || t('payment_methods')}
                        </p>
                    </div>
                </div>

                {/* Pagination Info and Show Filters Button */}
                <div className={cn("flex items-center justify-between", flexDirection)}>
                    <div className={cn("flex items-center gap-2", flexDirection)}>
                        <span className={cn("text-sm text-foreground", isRTL ? '!text-right' : '!text-left')}>
                            {t('showing')} {((paymentMethods.current_page - 1) * paymentMethods.per_page) + 1} {t('of')} {paymentMethods.total} {t('results')}
                        </span>
                        <Select value={paymentMethods.per_page.toString()} onValueChange={(value) => {
                            router.reload({
                                data: {
                                    per_page: Number(value),
                                    page: 1,
                                },
                                only: [],
                            });
                        }}>
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
                            <Filter className={cn("h-4 w-4", iconMargin('md'))} />
                            {showFilters ? t('hide_filters') : t('show_filters')}
                            {activeFilters.length > 0 && (
                                <span className={cn("px-1.5 py-0.5 text-xs bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-300 rounded-full", iconMargin('sm'))}>
                                    {activeFilters.length}
                                </span>
                            )}
                        </Button>
                    </div>
                </div>

                {/* Filters */}
                {showFilters && (
                    <CollapsibleFilters
                        activeFilters={activeFilters}
                        onRemoveFilter={(key) => {
                            if (key === 'search') {
                                handleFilterChange('search', '');
                            } else if (key === 'status') {
                                handleFilterChange('status', 'all');
                            }
                        }}
                        onClearAll={clearFilters}
                        isOpen={true}
                        locale={locale}
                    >
                        <SearchFieldFilter
                            id="search"
                            label={t('search')}
                            value={filters.search}
                            onChange={(value) => handleFilterChange('search', value)}
                            placeholder={t('search_payment_methods')}
                        />
                        <SelectFilter
                            id="status"
                            label={t('status')}
                            value={filters.status}
                            options={statusOptions}
                            onChange={(value) => handleFilterChange('status', value)}
                            placeholder={t('all')}
                        />
                    </CollapsibleFilters>
                )}

                {/* Data Table */}
                <DataTable
                    data={paymentMethods.data}
                    columns={columns}
                    total={paymentMethods.total}
                    currentPage={paymentMethods.current_page}
                    perPage={paymentMethods.per_page}
                    onPageChange={(page: number) => {
                        router.get('/dashboard/payment-methods', {
                            page,
                            search: filters.search || undefined,
                            filters: {
                                status: filters.status && filters.status !== 'all' ? filters.status : undefined,
                            },
                        }, { preserveState: true, preserveScroll: true });
                    }}
                    onPerPageChange={(perPage: number) => {
                        router.reload({
                            data: {
                                per_page: perPage,
                                page: 1,
                            },
                            only: [],
                        });
                    }}
                    locale={locale}
                />

            </div>
        </AppLayout>
    );
}

