import { DataTable } from '@/components/data-table';
import { Button } from '@/components/ui/button';
import { ConfirmationDialog } from '@/components/confirmation-dialog';
import { UserCard } from '@/components/user-card';
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
import { useRTLInit } from '@/hooks/use-rtl-init';
import { useTranslation } from '@/hooks/use-translation';
import { useRTL } from '@/hooks/use-rtl';
import { usePermissions } from '@/hooks/use-permissions';
import { Head, Link, router, usePage } from '@inertiajs/react';
import { type SharedData } from '@/types';
import { Plus, Eye, Edit, Trash2, Filter } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { useState, useEffect, useCallback } from 'react';
import { customToast } from '@/components/ui/custom-toast';
import { index as dashboard } from '@/routes/dashboard';
import { type BreadcrumbItem } from '@/types';
import { formatHumanDate } from '@/utils/date-utils';
import { cn } from '@/lib/utils';

interface User {
    id: number;
    name: string;
    email: string;
    phone: string;
    status?: string;
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

// Breadcrumbs will be set inside component to use translation

export default function UsersIndex({ users, filters: initialFilters }: UsersPageProps) {
    useRTLInit();
    const { t, locale } = useTranslation();
    const page = usePage<SharedData>();
    const { locale: pageLocale } = page.props;
    const isRTL = pageLocale === 'ar';
    const dir = isRTL ? 'rtl' : 'ltr';
    const { flexDirection, iconMargin } = useRTL();
    const { can } = usePermissions();
    
    const breadcrumbs: BreadcrumbItem[] = [
        {
            title: t('dashboard'),
            href: dashboard.url(),
        },
        {
            title: t('users_management'),
            href: '/dashboard/users',
        },
    ];
    const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; userId: number | null }>({ open: false, userId: null });
    const [optimisticUsers, setOptimisticUsers] = useState(users.data);
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

    const applyFiltersToBackend = useCallback((filtersToApply: typeof filters) => {
        router.get('/dashboard/users', {
            page: 1, // Reset to first page when applying filters
            search: filtersToApply.search || undefined,
            filters: {
                email_verified: filtersToApply.email_verified && filtersToApply.email_verified !== 'all' ? filtersToApply.email_verified : undefined,
                phone_verified: filtersToApply.phone_verified && filtersToApply.phone_verified !== 'all' ? filtersToApply.phone_verified : undefined,
                created_from: filtersToApply.created_from || undefined,
                created_to: filtersToApply.created_to || undefined,
            },
        }, { preserveState: true, preserveScroll: true });
    }, []);

    // Initialize optimistic users only once when component mounts
    useEffect(() => {
        setOptimisticUsers(users.data);
    }, [users.data]);

    // Auto-apply filters when they change
    useEffect(() => {
        // Skip auto-apply on initial load
        if (isInitialLoad) {
            setIsInitialLoad(false);
            return;
        }

        const timeoutId = setTimeout(() => {
            applyFiltersToBackend(filters);
        }, 300); // Debounce for 300ms to avoid too many requests

        return () => clearTimeout(timeoutId);
    }, [filters, isInitialLoad, applyFiltersToBackend]);


    // Verification options (for email/phone)
    const verificationOptions: SelectOption[] = [
        { value: 'all', label: t('all') },
        { value: 'verified', label: t('verified') },
        { value: 'not_verified', label: t('not_verified') },
    ];


    // Build active filters array
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
            const option = verificationOptions.find(o => o.value === filters.email_verified);
            active.push({
                key: 'email_verified',
                label: t('email_status'),
                value: filters.email_verified,
                displayValue: option?.label || filters.email_verified,
            });
        }

        if (filters.phone_verified && filters.phone_verified !== 'all') {
            const option = verificationOptions.find(o => o.value === filters.phone_verified);
            active.push({
                key: 'phone_verified',
                label: t('phone_status'),
                value: filters.phone_verified,
                displayValue: option?.label || filters.phone_verified,
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
        } else if (key === 'email_verified') {
            newFilters.email_verified = 'all';
        } else if (key === 'phone_verified') {
            newFilters.phone_verified = 'all';
        } else {
            newFilters[key as keyof typeof filters] = '';
        }

        setFilters(newFilters);
        // Auto-apply will handle the backend request via useEffect
    };

    const handleClearAllFilters = () => {
        const clearedFilters = {
            search: '',
            email_verified: 'all',
            phone_verified: 'all',
            created_from: '',
            created_to: '',
        };
        setFilters(clearedFilters);
        // Auto-apply will handle the backend request via useEffect
    };

    const columns = [
        {
            key: 'user',
            label: t('user'),
            render: (_: unknown, user: User) => (
                <div className="p-2">
                    <UserCard user={user} />
                </div>
            ),
        },
        {
            key: 'status',
            label: t('status'),
            render: (_: unknown, user: User) => (
                <div className={cn(isRTL ? '!text-right' : '!text-left')} dir={dir}>
                    <Switch
                        checked={(user.status || 'active') === 'active'}
                        onCheckedChange={(checked) => {
                            const newStatus = checked ? 'active' : 'inactive';
                            router.patch(`/dashboard/users/${user.id}/toggle-status`, {
                                status: newStatus,
                            }, {
                                preserveState: true,
                                preserveScroll: true,
                                onSuccess: () => {
                                    customToast.success(
                                        newStatus === 'active' 
                                            ? t('user_activated_successfully')
                                            : t('user_deactivated_successfully')
                                    );
                                },
                                onError: () => {
                                    customToast.error(t('update_failed'));
                                },
                            });
                        }}
                    />
                </div>
            ),
        },
        {
            key: 'created_at',
            label: t('created_at'),
            render: (date: string) => (
                <span className={cn("text-sm text-muted-foreground", isRTL ? '!text-right' : '!text-left')} dir={dir}>
                    {formatHumanDate(date, t)}
                </span>
            ),
        },
        {
            key: 'actions',
            label: t('actions'),
            render: (_: unknown, user: User) => (
                <div className={cn("flex items-center gap-1 w-full", isRTL ? 'justify-start flex-row-reverse' : 'justify-end')}>
                    {can('users.show') && (
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => router.visit(`/dashboard/users/${user.id}`)}
                            title={t('view')}
                            aria-label={t('view')}
                        >
                            <Eye className="h-4 w-4" />
                        </Button>
                    )}
                    {can('users.edit') && (
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => router.visit(`/dashboard/users/${user.id}/edit`)}
                            title={t('edit')}
                            aria-label={t('edit')}
                        >
                            <Edit className="h-4 w-4" />
                        </Button>
                    )}
                    {can('users.destroy') && (
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setDeleteDialog({ open: true, userId: user.id })}
                            title={t('delete')}
                            aria-label={t('delete')}
                            className="text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-900/20"
                        >
                            <Trash2 className="h-4 w-4" />
                        </Button>
                    )}
                </div>
            ),
        },
    ];



    const handleDelete = () => {
        if (deleteDialog.userId) {
            const user = optimisticUsers.find(u => u.id === deleteDialog.userId);
            router.delete(`/dashboard/users/${deleteDialog.userId}`, {
                onSuccess: () => {
                    customToast.success(t('user_deleted_successfully'), user?.name);
                    setOptimisticUsers(prev => prev.filter(u => u.id !== deleteDialog.userId));
                },
                onError: () => {
                    customToast.error(t('update_failed'));
                }
            });
        }
    };

    const handlePageChange = (page: number) => {
        router.get('/dashboard/users', {
            page,
            per_page: users.per_page,
            search: filters.search || undefined,
            filters: {
                email_verified: filters.email_verified && filters.email_verified !== 'all' ? filters.email_verified : undefined,
                phone_verified: filters.phone_verified && filters.phone_verified !== 'all' ? filters.phone_verified : undefined,
                created_from: filters.created_from || undefined,
                created_to: filters.created_to || undefined,
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
        });
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={t('users_management')} />

            <div className={cn("flex h-full flex-1 flex-col gap-6 overflow-x-auto rounded-xl bg-card dark:bg-card p-6 border border-border", isRTL ? '!text-right' : '!text-left')} dir={dir}>
                {/* Header */}
                <div className={cn("flex items-center justify-between border-b pb-4", flexDirection)}>
                    <div className={cn(isRTL ? '!text-right' : '!text-left')}>
                        <h1 className={cn("text-3xl font-bold text-foreground", isRTL ? '!text-right' : '!text-left')}>{t('users_management')}</h1>
                        <p className={cn("text-muted-foreground mt-1", isRTL ? '!text-right' : '!text-left')}>{t('manage_user_accounts_description')}</p>
                    </div>
                    {can('users.create') && (
                        <Link href="/dashboard/users/create">
                            <Button className={cn("flex items-center gap-2", flexDirection)}>
                                <Plus className={cn("h-4 w-4", iconMargin('md'))} />
                                {t('add_user')}
                            </Button>
                        </Link>
                    )}
                </div>

                {/* Pagination Info and Show Filters Button */}
                <div className={cn("flex items-center justify-between", flexDirection)}>
                    <div className={cn("flex items-center gap-2", flexDirection)}>
                        <span className={cn("text-sm text-foreground", isRTL ? '!text-right' : '!text-left')}>
                            {t('showing')} {((users.current_page - 1) * users.per_page) + 1} {t('of')} {users.total} {t('results')}
                        </span>
                        <Select value={users.per_page.toString()} onValueChange={(value) => handlePerPageChange(Number(value))}>
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
                            placeholder={t('search_by_name_email_phone')}
                        />
                        
                        <SelectFilter
                            id="email_verified"
                            label={t('email_status')}
                            value={filters.email_verified}
                            onChange={(value) => setFilters(prev => ({ ...prev, email_verified: value }))}
                            options={verificationOptions}
                            placeholder={t('all')}
                        />
                        
                        <SelectFilter
                            id="phone_verified"
                            label={t('phone_status')}
                            value={filters.phone_verified}
                            onChange={(value) => setFilters(prev => ({ ...prev, phone_verified: value }))}
                            options={verificationOptions}
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
                    data={optimisticUsers}
                    columns={columns}
                    total={users.total}
                    currentPage={users.current_page}
                    perPage={users.per_page}
                    onPageChange={handlePageChange}
                    onPerPageChange={handlePerPageChange}
                    locale={locale}
                />
            </div>

            {/* Delete Dialog */}
            <ConfirmationDialog
                open={deleteDialog.open}
                onOpenChange={(open) => setDeleteDialog({ open, userId: null })}
                onConfirm={handleDelete}
                title={t('delete_user')}
                description={t('are_you_sure_delete_user')}
                variant="danger"
                confirmText={t('delete')}
            />
        </AppLayout>
    );
}
