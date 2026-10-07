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
import { useRTLInit } from '@/hooks/use-rtl-init';
import { useTranslation } from '@/hooks/use-translation';
import { useRTL } from '@/hooks/use-rtl';
import { usePermissions } from '@/hooks/use-permissions';
import { Head, Link, router, usePage } from '@inertiajs/react';
import { Plus, Eye, Edit, Filter, Star, StarOff } from 'lucide-react';
import { useState, useEffect, useCallback } from 'react';
import { customToast } from '@/components/ui/custom-toast';
import { index as dashboard } from '@/routes/dashboard';
import { type BreadcrumbItem } from '@/types';
import { formatHumanDate } from '@/utils/date-utils';
import { cn } from '@/lib/utils';

interface SubscriptionPackage {
    id: number;
    name_en: string;
    name_ar?: string;
    description_en?: string;
    description_ar?: string;
    price: string;
    currency: string;
    billing_cycle: 'monthly' | 'yearly' | 'lifetime';
    duration_days: number;
    features?: string[];
    max_services?: number;
    max_bookings_per_month?: number;
    featured_listing: boolean;
    priority_support: boolean;
    analytics_access: boolean;
    custom_branding: boolean;
    status: 'active' | 'inactive';
    sort_order: number;
    created_at: string;
}

interface SubscriptionPackagesPageProps {
    packages: {
        data: SubscriptionPackage[];
        current_page: number;
        last_page: number;
        per_page: number;
        total: number;
    };
    filters: {
        search?: string;
        status?: string;
        featured?: string;
    };
}

export default function SubscriptionPackagesIndex({ packages, filters: initialFilters }: SubscriptionPackagesPageProps) {
    useRTLInit();
    const { t, locale } = useTranslation();
    const { isRTL, dir, textAlign, flexDirection, iconMargin } = useRTL();
    const { can } = usePermissions();
    const { flash } = usePage().props as { flash?: { success?: string; error?: string } };
    
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
            title: t('subscription_packages'),
            href: '/dashboard/subscription-packages',
        },
    ];
    
    const [optimisticPackages, setOptimisticPackages] = useState(packages.data);
    const [showFilters, setShowFilters] = useState(false);
    const [isInitialLoad, setIsInitialLoad] = useState(true);

    const [filters, setFilters] = useState({
        search: initialFilters?.search || '',
        status: initialFilters?.status || 'all',
        featured: initialFilters?.featured || 'all',
    });

    const applyFiltersToBackend = useCallback((filtersToApply: typeof filters) => {
        const params: Record<string, any> = {
            page: 1,
        };
        
        if (filtersToApply.search) {
            params.search = filtersToApply.search;
        }
        
        const filterParams: Record<string, any> = {};
        if (filtersToApply.status && filtersToApply.status !== 'all') {
            filterParams.status = filtersToApply.status;
        }
        if (filtersToApply.featured && filtersToApply.featured !== 'all') {
            filterParams.featured = filtersToApply.featured;
        }
        
        if (Object.keys(filterParams).length > 0) {
            params.filters = filterParams;
        }
        
        router.get('/dashboard/subscription-packages', params, { preserveState: true, preserveScroll: true });
    }, []);

    useEffect(() => {
        setOptimisticPackages(packages.data);
    }, [packages.data]);

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
    ];

    const featuredOptions: SelectOption[] = [
        { value: 'all', label: t('all') },
        { value: 'true', label: t('featured') },
        { value: 'false', label: t('not_featured') },
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

        if (filters.featured && filters.featured !== 'all') {
            const option = featuredOptions.find(o => o.value === filters.featured);
            active.push({
                key: 'featured',
                label: t('featured'),
                value: filters.featured,
                displayValue: option?.label || filters.featured,
            });
        }

        return active;
    };

    const handleRemoveFilter = (key: string) => {
        const newFilters = { ...filters };
        
        if (key === 'status') {
            newFilters.status = 'all';
        } else if (key === 'featured') {
            newFilters.featured = 'all';
        } else {
            newFilters[key as keyof typeof filters] = '';
        }

        setFilters(newFilters);
        applyFiltersToBackend(newFilters);
    };

    const handleClearAllFilters = () => {
        const clearedFilters = {
            search: '',
            status: 'all',
            featured: 'all',
        };
        setFilters(clearedFilters);
        applyFiltersToBackend(clearedFilters);
    };

    const getStatusBadge = (status: string) => {
        return (
            <Badge variant={status === 'active' ? 'default' : 'secondary'}>
                {t(status)}
            </Badge>
        );
    };

    const columns = [
        {
            key: 'package',
            label: t('package'),
            render: (_: unknown, pkg: SubscriptionPackage) => (
                <div className={textAlign}>
                    <div className={cn("flex items-center gap-2", flexDirection)}>
                        <p className={cn("font-medium", textAlign)} dir={dir}>{isRTL && pkg.name_ar ? pkg.name_ar : pkg.name_en}</p>
                        {pkg.featured_listing && (
                            <Badge variant="outline" className={cn("bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300", flexDirection)}>
                                <Star className={cn("h-3 w-3", iconMargin('sm'))} />
                                {t('featured')}
                            </Badge>
                        )}
                    </div>
                    {(isRTL && pkg.description_ar ? pkg.description_ar : pkg.description_en) && (
                        <p className={cn("text-sm text-muted-foreground truncate max-w-xs", textAlign)} dir={dir}>{isRTL && pkg.description_ar ? pkg.description_ar : pkg.description_en}</p>
                    )}
                </div>
            ),
        },
        {
            key: 'price',
            label: t('price'),
            render: (_: unknown, pkg: SubscriptionPackage) => (
                <div className={textAlign}>
                    <p className={cn("font-medium", textAlign)} dir="ltr">{pkg.price} {pkg.currency}</p>
                    <p className={cn("text-sm text-muted-foreground", textAlign)} dir={dir}>{t(pkg.billing_cycle)}</p>
                </div>
            ),
        },
        {
            key: 'duration',
            label: t('duration'),
            render: (_: unknown, pkg: SubscriptionPackage) => (
                <p className={cn("text-sm", textAlign)} dir="ltr">{pkg.duration_days} {t('days')}</p>
            ),
        },
        {
            key: 'features',
            label: t('features'),
            render: (_: unknown, pkg: SubscriptionPackage) => {
                const features = [];
                if (pkg.featured_listing) features.push(t('featured_listing'));
                if (pkg.priority_support) features.push(t('priority_support'));
                if (pkg.analytics_access) features.push(t('analytics_access'));
                if (pkg.custom_branding) features.push(t('custom_branding'));
                
                if (features.length === 0) {
                    return <span className="text-sm text-muted-foreground">{t('no_features')}</span>;
                }
                
                return (
                    <div className={cn("flex flex-wrap gap-1", isRTL ? 'flex-row-reverse justify-end' : '')}>
                        {features.map((feature, idx) => (
                            <Badge key={idx} variant="outline" className={cn("text-xs", textAlign)} dir={dir}>{feature}</Badge>
                        ))}
                    </div>
                );
            },
        },
        {
            key: 'limits',
            label: t('limits'),
            render: (_: unknown, pkg: SubscriptionPackage) => (
                <div className={cn("text-sm", textAlign)}>
                    {pkg.max_services !== undefined && (
                        <p className={textAlign} dir="ltr">{t('max_services')}: {pkg.max_services}</p>
                    )}
                    {pkg.max_bookings_per_month !== undefined && (
                        <p className={textAlign} dir="ltr">{t('max_bookings')}: {pkg.max_bookings_per_month}/mo</p>
                    )}
                </div>
            ),
        },
        {
            key: 'status',
            label: t('status'),
            render: (_: unknown, pkg: SubscriptionPackage) => getStatusBadge(pkg.status),
        },
        {
            key: 'created_at',
            label: t('created_at'),
            render: (date: string) => formatHumanDate(date),
        },
        {
            key: 'actions',
            label: t('actions'),
            render: (_: unknown, pkg: SubscriptionPackage) => (
                <div className={cn("flex items-center gap-1", isRTL ? 'justify-start flex-row-reverse' : 'justify-end')}>
                    {can('subscription-packages.show') && (
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => router.visit(`/dashboard/subscription-packages/${pkg.id}`)}
                            title={t('view')}
                        >
                            <Eye className="h-4 w-4" />
                        </Button>
                    )}
                    {can('subscription-packages.edit') && (
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => router.visit(`/dashboard/subscription-packages/${pkg.id}/edit`)}
                            title={t('edit')}
                        >
                            <Edit className="h-4 w-4" />
                        </Button>
                    )}
                    {can('subscription-packages.toggle-featured') && (
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => router.patch(`/dashboard/subscription-packages/${pkg.id}/toggle-featured`, {
                                featured_listing: !pkg.featured_listing
                            }, {
                                onSuccess: () => {
                                    customToast.success(t('featured_status_updated_successfully'));
                                    setOptimisticPackages(prev => prev.map(p => 
                                        p.id === pkg.id ? { ...p, featured_listing: !p.featured_listing } : p
                                    ));
                                },
                                onError: () => {
                                    customToast.error(t('failed_to_update_featured_status'));
                                }
                            })}
                            title={pkg.featured_listing ? t('remove_featured') : t('set_featured')}
                            className={pkg.featured_listing ? 'text-orange-600 hover:text-orange-700 hover:bg-orange-50' : 'text-yellow-600 hover:text-yellow-700 hover:bg-yellow-50'}
                        >
                            {pkg.featured_listing ? <StarOff className="h-4 w-4" /> : <Star className="h-4 w-4" />}
                        </Button>
                    )}
                </div>
            ),
        },
    ];

    const handlePageChange = (page: number) => {
        router.get('/dashboard/subscription-packages', {
            page,
            per_page: packages.per_page,
            search: filters.search || undefined,
            filters: {
                status: filters.status && filters.status !== 'all' ? filters.status : undefined,
                featured: filters.featured && filters.featured !== 'all' ? filters.featured : undefined,
            },
        }, { preserveState: true });
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
            <Head title={t('subscription_packages')} />
            
            <div className={cn("flex h-full flex-1 flex-col gap-6 overflow-x-auto rounded-xl bg-card dark:bg-card p-6 border border-border", textAlign)} dir={dir}>
                <div className={cn("flex items-center justify-between border-b pb-4", flexDirection)}>
                    <div className={textAlign}>
                        <h1 className={cn("text-3xl font-bold text-foreground", textAlign)}>{t('subscription_packages')}</h1>
                        <p className={cn("text-muted-foreground mt-1", textAlign)}>{t('manage_subscription_packages_for_clinics')}</p>
                    </div>
                    {can('subscription-packages.create') && (
                        <Link href="/dashboard/subscription-packages/create">
                            <Button className={cn("flex items-center gap-2", flexDirection)}>
                                <Plus className={cn("h-4 w-4", iconMargin('md'))} />
                                {t('add_package')}
                            </Button>
                        </Link>
                    )}
                </div>

                <div className={cn("flex items-center justify-between", flexDirection)}>
                    <div className={cn("flex items-center gap-2", flexDirection)}>
                        <span className={cn("text-sm text-foreground", textAlign)}>
                            {t('showing')} {((packages.current_page - 1) * packages.per_page) + 1} {t('of')} {packages.total} {t('results')}
                        </span>
                        <Select value={packages.per_page.toString()} onValueChange={(value) => handlePerPageChange(Number(value))}>
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
                                <span className={cn(isRTL ? 'mr-1' : 'ml-1', "px-1.5 py-0.5 text-xs bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-300 rounded-full")}>
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
                            placeholder={t('search_by_name_or_description')}
                        />
                        
                        <SelectFilter
                            id="status"
                            label={t('status')}
                            value={filters.status}
                            onChange={(value) => setFilters(prev => ({ ...prev, status: value }))}
                            options={statusOptions}
                            placeholder={t('all')}
                            className={isRTL ? 'text-right' : ''}
                        />
                        
                        <SelectFilter
                            id="featured"
                            label={t('featured')}
                            value={filters.featured}
                            onChange={(value) => setFilters(prev => ({ ...prev, featured: value }))}
                            options={featuredOptions}
                            placeholder={t('all')}
                            className={isRTL ? 'text-right [&>div]:text-right' : ''}
                        />
                    </CollapsibleFilters>
                )}

                <DataTable
                    data={optimisticPackages}
                    columns={columns}
                    total={packages.total}
                    currentPage={packages.current_page}
                    perPage={packages.per_page}
                    onPageChange={handlePageChange}
                    onPerPageChange={handlePerPageChange}
                />
            </div>
        </AppLayout>
    );
}

