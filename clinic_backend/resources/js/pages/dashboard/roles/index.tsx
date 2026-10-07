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
    type ActiveFilter 
} from '@/components/filters';
import AppLayout from '@/layouts/app-layout';
import { useRTLInit } from '@/hooks/use-rtl-init';
import { useTranslation } from '@/hooks/use-translation';
import { useRTL } from '@/hooks/use-rtl';
import { Head, Link, router, usePage } from '@inertiajs/react';
import { type SharedData } from '@/types';
import { Plus, Eye, Edit, Shield, Filter, Calendar } from 'lucide-react';
import { useState, useEffect, useCallback } from 'react';
import { customToast } from '@/components/ui/custom-toast';
import { type BreadcrumbItem } from '@/types';
import { formatHumanDate } from '@/utils/date-utils';
import { index as dashboard } from '@/routes/dashboard';
import { cn } from '@/lib/utils';

interface Role {
    id: number;
    name: string;
    alias?: string;
    guard_name: string;
    users_count: number;
    created_at: string;
    updated_at: string;
}

interface RolesPageProps {
    roles: {
        data: Role[];
        current_page: number;
        last_page: number;
        per_page: number;
        total: number;
        from: number;
        to: number;
    };
    filters: {
        search?: string;
        guard_name?: string;
        created_from?: string;
        created_to?: string;
    };
}

export default function RolesIndex({ roles, filters: initialFilters }: RolesPageProps) {
    useRTLInit();
    const { t, locale } = useTranslation();
    const page = usePage<SharedData>();
    const { locale: pageLocale } = page.props;
    const isRTL = pageLocale === 'ar';
    const dir = isRTL ? 'rtl' : 'ltr';
    const { flexDirection, iconMargin } = useRTL();
    const { flash } = usePage<SharedData>().props;
    
    const [showFilters, setShowFilters] = useState(false);
    const [isInitialLoad, setIsInitialLoad] = useState(true);

    // Filter states
    const [filters, setFilters] = useState({
        search: initialFilters?.search || '',
    });

    const applyFiltersToBackend = useCallback((filtersToApply: typeof filters) => {
        router.get('/dashboard/roles', {
            page: 1, // Reset to first page when applying filters
            search: filtersToApply.search || undefined,
        }, { preserveState: true, preserveScroll: true });
    }, []);

    // Flash messages
    useEffect(() => {
        if (flash?.success) {
            customToast.success(flash.success);
        }
        if (flash?.error) {
            customToast.error(flash.error);
        }
    }, [flash]);

    // Auto-apply filters when they change
    useEffect(() => {
        // Skip auto-apply on initial load
        if (isInitialLoad) {
            setIsInitialLoad(false);
            return;
        }

        const timeoutId = setTimeout(() => {
            applyFiltersToBackend(filters);
        }, 300);

        return () => clearTimeout(timeoutId);
    }, [filters, applyFiltersToBackend, isInitialLoad]);

    const handleFilterChange = (filterName: string, value: string) => {
        setFilters((prev) => ({
            ...prev,
            [filterName]: value,
        }));
    };

    const handleRemoveFilter = (filterName: string) => {
        setFilters((prev) => ({
            ...prev,
            [filterName]: '',
        }));
    };

    const handleClearAllFilters = () => {
        const clearedFilters = {
            search: '',
        };
        setFilters(clearedFilters);
    };

    const handlePageChange = (page: number) => {
        router.get('/dashboard/roles', {
            page,
            search: filters.search || undefined,
            per_page: roles.per_page,
        }, {
            preserveState: true,
            preserveScroll: true,
        });
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

    // Get active filters
    const getActiveFilters = (): ActiveFilter[] => {
        const activeFilters: ActiveFilter[] = [];

        if (filters.search) {
            activeFilters.push({
                key: 'search',
                label: t('search'),
                value: filters.search,
                displayValue: filters.search,
            });
        }

        return activeFilters;
    };


    const breadcrumbs: BreadcrumbItem[] = [
        { title: t('dashboard'), href: dashboard.url() },
        { title: t('role_management'), href: '/dashboard/roles' },
    ];

    const columns = [
        {
            key: 'name',
            label: t('role_name'),
            render: (_: unknown, role: Role) => (
                <div className={cn("flex items-center gap-3", flexDirection)}>
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                        <Shield className={cn("h-5 w-5 text-primary", iconMargin('md'))} />
                    </div>
                    <div className={cn(isRTL ? '!text-right' : '!text-left')}>
                        <div className={cn("font-medium", isRTL ? '!text-right' : '!text-left')} dir="ltr">{role.name}</div>
                        <div className={cn("text-sm text-muted-foreground", isRTL ? '!text-right' : '!text-left')} dir="ltr">{role.guard_name}</div>
                    </div>
                </div>
            ),
            sortable: true,
        },
        {
            key: 'users_count',
            label: t('users_count'),
            render: (_: unknown, role: Role) => (
                <Badge variant="secondary" className={cn(isRTL ? '!text-right' : '!text-left')}>
                    {role.users_count} {role.users_count === 1 ? t('user') : t('users')}
                </Badge>
            ),
            sortable: true,
        },
        {
            key: 'created_at',
            label: t('created_at'),
            render: (_: unknown, role: Role) => (
                <div className={cn("flex items-center gap-2", flexDirection)}>
                    <Calendar className={cn("h-4 w-4 text-muted-foreground", iconMargin('md'))} />
                    <span className={cn("text-sm text-muted-foreground", isRTL ? '!text-right' : '!text-left')} dir={dir}>{formatHumanDate(role.created_at, t)}</span>
                </div>
            ),
            sortable: true,
        },
        {
            key: 'actions',
            label: t('actions'),
            render: (_: unknown, role: Role) => (
                <div className={cn("flex items-center gap-1 w-full", isRTL ? 'justify-start flex-row-reverse' : 'justify-end')}>
                    <Button
                        variant="ghost"
                        size="icon"
                        asChild
                    >
                        <Link href={`/dashboard/roles/${role.id}`}>
                            <Eye className="h-4 w-4" />
                        </Link>
                    </Button>
                    <Button
                        variant="ghost"
                        size="icon"
                        asChild
                    >
                        <Link href={`/dashboard/roles/${role.id}/edit`}>
                            <Edit className="h-4 w-4" />
                        </Link>
                    </Button>
                </div>
            ),
        },
    ];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={t('role_management')} />

            <div className={cn("flex h-full flex-1 flex-col gap-6 overflow-x-auto rounded-xl bg-card dark:bg-card p-6 border border-border", isRTL ? '!text-right' : '!text-left')} dir={dir}>
                {/* Header */}
                <div className={cn("flex items-center justify-between border-b pb-4", flexDirection)}>
                    <div className={cn(isRTL ? '!text-right' : '!text-left')}>
                        <h1 className={cn("text-3xl font-bold text-foreground", isRTL ? '!text-right' : '!text-left')}>{t('role_management')}</h1>
                        <p className={cn("text-muted-foreground mt-1", isRTL ? '!text-right' : '!text-left')}>{t('manage_roles_and_permissions')}</p>
                    </div>
                    <Link href="/dashboard/roles/create">
                        <Button className={cn("flex items-center gap-2", flexDirection)}>
                            <Plus className={cn("h-4 w-4", iconMargin('md'))} />
                            {t('create_role')}
                        </Button>
                    </Link>
                </div>

                {/* Pagination Info and Show Filters Button */}
                <div className={cn("flex items-center justify-between", flexDirection)}>
                    <div className={cn("flex items-center gap-2", flexDirection)}>
                        <span className={cn("text-sm text-foreground", isRTL ? '!text-right' : '!text-left')}>
                            {t('showing')} {((roles.current_page - 1) * roles.per_page) + 1} {t('of')} {roles.total} {t('results')}
                        </span>
                        <Select value={roles.per_page.toString()} onValueChange={(value) => handlePerPageChange(Number(value))}>
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
                            placeholder={t('search_roles')}
                        />
                    </CollapsibleFilters>
                )}

                {/* Data Table */}
                <DataTable
                    data={roles.data}
                    columns={columns}
                    total={roles.total}
                    currentPage={roles.current_page}
                    perPage={roles.per_page}
                    onPageChange={handlePageChange}
                    onPerPageChange={handlePerPageChange}
                    locale={locale}
                />
            </div>
        </AppLayout>
    );
}