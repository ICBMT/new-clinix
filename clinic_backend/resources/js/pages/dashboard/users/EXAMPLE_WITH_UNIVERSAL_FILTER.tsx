/**
 * EXAMPLE: Users Index Page with Universal Filter Panel
 * 
 * This demonstrates how to use the UniversalFilterPanel component
 * with dynamic filter configurations for each page.
 */

import { DataTable } from '@/components/data-table';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { UniversalFilterPanel, FilterField, ActiveFilter } from '@/components/filters/universal-filter-panel';
import AppLayout from '@/layouts/app-layout';
import { useTranslation } from '@/hooks/use-translation';
import { useRTL } from '@/hooks/use-rtl';
import { Head, Link, router } from '@inertiajs/react';
import { Plus, Eye, Edit, Filter } from 'lucide-react';
import { useState, useEffect, useCallback } from 'react';
import { formatHumanDate } from '@/utils/date-utils';

interface User {
    id: number;
    name: string;
    email: string;
    phone: string;
    email_verified_at: string | null;
    phone_verified_at: string | null;
    created_at: string;
}

interface UsersPageProps {
    users: {
        data: User[];
        current_page: number;
        last_page: number;
        per_page: number;
        total: number;
    };
    filters: {
        search?: string;
        email_verified?: string;
        phone_verified?: string;
        created_from?: string;
        created_to?: string;
    };
}

export default function UsersIndexExample({ users, filters: initialFilters }: UsersPageProps) {
    const { t, locale } = useTranslation();
    const { isRTL } = useRTL();
    const [showFilters, setShowFilters] = useState(false);
    const [isInitialLoad, setIsInitialLoad] = useState(true);

    // Filter states
    const [filters, setFilters] = useState({
        search: initialFilters?.search || '',
        email_verified: initialFilters?.email_verified || 'all',
        phone_verified: initialFilters?.phone_verified || 'all',
        created_from: initialFilters?.created_from || '',
        created_to: initialFilters?.created_to || '',
    });

    // ============================================
    // STEP 1: Define filter configuration for this page
    // ============================================
    const filterConfig: FilterField[] = [
        // Search field (full width)
        {
            id: 'search',
            type: 'search',
            label: t('search'),
            placeholder: 'Search by name, email, or phone...',
            value: filters.search,
            width: 'full',
        },
        // Email verification filter (quarter width)
        {
            id: 'email_verified',
            type: 'select',
            label: t('email_verification'),
            placeholder: 'All',
            value: filters.email_verified,
            width: 'quarter',
            options: [
                { value: 'all', label: t('all') },
                { value: 'verified', label: t('verified') },
                { value: 'unverified', label: t('unverified') },
            ],
        },
        // Phone verification filter (quarter width)
        {
            id: 'phone_verified',
            type: 'select',
            label: t('phone_verification'),
            placeholder: 'All',
            value: filters.phone_verified,
            width: 'quarter',
            options: [
                { value: 'all', label: t('all') },
                { value: 'verified', label: t('verified') },
                { value: 'unverified', label: t('unverified') },
            ],
        },
        // Date range filter (half width)
        {
            id: 'created_date',
            type: 'date-range',
            label: t('created_date_range'),
            value: {
                from: filters.created_from,
                to: filters.created_to,
            },
            width: 'half',
        },
    ];

    // ============================================
    // STEP 2: Handle filter changes
    // ============================================
    const handleFilterChange = (filterId: string, value: string | string[] | { from?: string; to?: string }) => {
        if (filterId === 'created_date' && typeof value === 'object' && !Array.isArray(value)) {
            // Handle date range
            setFilters(prev => ({
                ...prev,
                created_from: value.from || '',
                created_to: value.to || '',
            }));
        } else {
            // Handle other filters
            setFilters(prev => ({
                ...prev,
                [filterId]: value as string,
            }));
        }
    };

    // ============================================
    // STEP 3: Get active filters for display
    // ============================================
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

        if (filters.email_verified && filters.email_verified !== 'all') {
            active.push({
                key: 'email_verified',
                label: t('email_verification'),
                value: filters.email_verified,
                displayValue: filters.email_verified === 'verified' ? t('verified') : t('unverified'),
            });
        }

        if (filters.phone_verified && filters.phone_verified !== 'all') {
            active.push({
                key: 'phone_verified',
                label: t('phone_verification'),
                value: filters.phone_verified,
                displayValue: filters.phone_verified === 'verified' ? t('verified') : t('unverified'),
            });
        }

        if (filters.created_from || filters.created_to) {
            active.push({
                key: 'created_date',
                label: t('created_date'),
                value: { from: filters.created_from, to: filters.created_to },
                displayValue: `${filters.created_from || '...'} to ${filters.created_to || '...'}`,
            });
        }

        return active;
    };

    // ============================================
    // STEP 4: Handle filter removal
    // ============================================
    const handleRemoveFilter = (filterKey: string) => {
        if (filterKey === 'created_date') {
            setFilters(prev => ({ ...prev, created_from: '', created_to: '' }));
        } else {
            setFilters(prev => ({ ...prev, [filterKey]: filterKey.includes('verified') ? 'all' : '' }));
        }
    };

    // ============================================
    // STEP 5: Handle clear all filters
    // ============================================
    const handleClearAllFilters = () => {
        setFilters({
            search: '',
            email_verified: 'all',
            phone_verified: 'all',
            created_from: '',
            created_to: '',
        });
    };

    // Auto-apply filters to backend
    const applyFiltersToBackend = useCallback((filtersToApply: typeof filters) => {
        router.get('/dashboard/users', {
            page: 1,
            search: filtersToApply.search || undefined,
            email_verified: filtersToApply.email_verified !== 'all' ? filtersToApply.email_verified : undefined,
            phone_verified: filtersToApply.phone_verified !== 'all' ? filtersToApply.phone_verified : undefined,
            created_from: filtersToApply.created_from || undefined,
            created_to: filtersToApply.created_to || undefined,
        }, { preserveState: true, preserveScroll: true });
    }, []);

    // Auto-apply filters when they change (debounced)
    useEffect(() => {
        if (isInitialLoad) {
            setIsInitialLoad(false);
            return;
        }

        const timeoutId = setTimeout(() => {
            applyFiltersToBackend(filters);
        }, 300);

        return () => clearTimeout(timeoutId);
    }, [filters, applyFiltersToBackend, isInitialLoad]);

    // Pagination handlers
    const handlePageChange = (page: number) => {
        router.get('/dashboard/users', {
            page,
            ...filters,
        }, { preserveState: true, preserveScroll: true });
    };

    const handlePerPageChange = (perPage: number) => {
        router.get('/dashboard/users', {
            page: 1,
            per_page: perPage,
            ...filters,
        }, { preserveState: true, preserveScroll: true });
    };

    // Table columns (simplified for example)
    const columns = [
        {
            key: 'name',
            label: t('user'),
            render: (_: unknown, user: User) => <UserCard user={user} />,
        },
        {
            key: 'email_verified_at',
            label: t('email_verified'),
            render: (_: unknown, user: User) => (
                user.email_verified_at ? 
                    <CheckCircle className="h-5 w-5 text-green-600" /> : 
                    <XCircle className="h-5 w-5 text-red-600" />
            ),
        },
        {
            key: 'actions',
            label: t('actions'),
            render: (_: unknown, user: User) => (
                <div className={`flex items-center gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
                    <Button variant="ghost" size="sm" asChild>
                        <Link href={`/dashboard/users/${user.id}`}>
                            <Eye className="h-4 w-4" />
                        </Link>
                    </Button>
                    <Button variant="ghost" size="sm" asChild>
                        <Link href={`/dashboard/users/${user.id}/edit`}>
                            <Edit className="h-4 w-4" />
                        </Link>
                    </Button>
                </div>
            ),
        },
    ];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={t('users_management')} />

            <div className="flex h-full flex-1 flex-col gap-6 overflow-x-auto rounded-xl bg-card dark:bg-card p-6 border border-border" dir={isRTL ? 'rtl' : 'ltr'}>
                {/* Header */}
                <div className={`flex items-center justify-between ${isRTL ? 'flex-row-reverse' : ''}`}>
                    <div>
                        <h1 className="text-3xl font-bold text-foreground">{t('users_management')}</h1>
                        <p className="text-muted-foreground mt-1">{t('manage_system_users')}</p>
                    </div>
                    <Link href="/dashboard/users/create">
                        <Button className={`flex items-center gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
                            <Plus className="h-4 w-4" />
                            {t('create_user')}
                        </Button>
                    </Link>
                </div>

                {/* Pagination Info and Show Filters Button */}
                <div className={`flex items-center justify-between ${isRTL ? 'flex-row-reverse' : ''}`}>
                    <div className={`flex items-center gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
                        <span className="text-sm text-foreground">
                            {t('showing')} {((users.current_page - 1) * users.per_page) + 1} {t('of')} {users.total} {t('results')}
                        </span>
                        <Select value={users.per_page.toString()} onValueChange={(value) => handlePerPageChange(Number(value))}>
                            <SelectTrigger className={`w-20 ${isRTL ? 'text-right' : ''}`}>
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
                        className={`flex items-center gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}
                    >
                        <Filter className="h-4 w-4" />
                        {showFilters ? t('hide_filters') : t('show_filters')}
                        {getActiveFilters().length > 0 && (
                            <span className="ml-1 px-1.5 py-0.5 text-xs bg-primary/10 dark:bg-primary/20 text-primary rounded-full">
                                {getActiveFilters().length}
                            </span>
                        )}
                    </Button>
                </div>

                {/* ============================================ */}
                {/* UNIVERSAL FILTER PANEL - Dynamic Configuration */}
                {/* ============================================ */}
                {showFilters && (
                    <UniversalFilterPanel
                        filters={filterConfig}
                        activeFilters={getActiveFilters()}
                        onFilterChange={handleFilterChange}
                        onRemoveFilter={handleRemoveFilter}
                        onClearAll={handleClearAllFilters}
                        isOpen={true}
                    />
                )}

                {/* Data Table */}
                <DataTable
                    data={users.data}
                    columns={columns}
                    total={users.total}
                    currentPage={users.current_page}
                    perPage={users.per_page}
                    onPageChange={handlePageChange}
                    onPerPageChange={handlePerPageChange}
                />
            </div>
        </AppLayout>
    );
}

