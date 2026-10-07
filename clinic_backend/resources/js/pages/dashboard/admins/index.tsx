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
    type ActiveFilter 
} from '@/components/filters';
import AppLayout from '@/layouts/app-layout';
import { useTranslation } from '@/hooks/use-translation';
import { useRTL } from '@/hooks/use-rtl';
import { useRTLInit } from '@/hooks/use-rtl-init';
import { usePermissions } from '@/hooks/use-permissions';
import { Head, Link, router, usePage } from '@inertiajs/react';
import { type SharedData } from '@/types';
import { cn } from '@/lib/utils';
import { Plus, Eye, Edit, Trash2, Filter } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { useState, useEffect, useCallback } from 'react';
import { customToast } from '@/components/ui/custom-toast';
import { index as dashboard } from '@/routes/dashboard';
import { type BreadcrumbItem } from '@/types';
import { formatHumanDate } from '@/utils/date-utils';

interface Admin {
    id: number;
    name: string;
    email: string;
    phone: string;
    status?: string;
    email_verified_at: string | null;
    phone_verified_at: string | null;
    created_at: string;
    roles: Array<{
        name: string;
        alias?: string;
    }>;
}

interface AdminsPageProps {
    admins: {
        data: Admin[];
        current_page: number;
        last_page: number;
        per_page: number;
        total: number;
    };
    filters: {
        search?: string;
    };
}

export default function IndexAdmins({ admins, filters: initialFilters }: AdminsPageProps) {
    useRTLInit();
    const { t, locale } = useTranslation();
    const page = usePage<SharedData>();
    const { locale: pageLocale } = page.props;
    const isRTL = pageLocale === 'ar';
    const dir = isRTL ? 'rtl' : 'ltr';
    const { flexDirection, iconMargin } = useRTL();
    const { can } = usePermissions();
    const { flash } = usePage<SharedData>().props;
    const [filters, setFilters] = useState(initialFilters);
    const [showFilters, setShowFilters] = useState(false);
    const [deleteDialog, setDeleteDialog] = useState<{
        isOpen: boolean;
        adminId: number | null;
        adminName: string;
    }>({
        isOpen: false,
        adminId: null,
        adminName: '',
    });

    // Flash messages
    useEffect(() => {
        if (flash?.success) {
            customToast.success(flash.success);
        }
        if (flash?.error) {
            customToast.error(flash.error);
        }
    }, [flash]);


    // Debounced search effect
    useEffect(() => {
        const timeoutId = setTimeout(() => {
            router.get('/dashboard/admins', {
                search: filters.search || undefined,
                page: 1, // Reset to first page when filters change
            }, { preserveState: true });
        }, 300);

        return () => clearTimeout(timeoutId);
    }, [filters]);

    const handlePerPageChange = (perPage: number) => {
        router.reload({
            data: {
                per_page: perPage,
                page: 1,
            },
            only: [],
        });
    };

    const handlePageChange = (page: number) => {
        router.get('/dashboard/admins', {
            page,
            per_page: admins.per_page,
            search: filters.search || undefined,
        }, { preserveState: true });
    };

    const handleDelete = (adminId: number, adminName: string) => {
        setDeleteDialog({
            isOpen: true,
            adminId,
            adminName,
        });
    };

    const confirmDelete = () => {
        if (deleteDialog.adminId) {
            router.delete(`/dashboard/admins/${deleteDialog.adminId}`, {
                onSuccess: () => {
                    // Flash message will be shown via useEffect
                },
                onError: () => {
                    customToast.error(t('error_occurred'));
                },
            });
        }
        setDeleteDialog({ isOpen: false, adminId: null, adminName: '' });
    };

    const getActiveFilters = useCallback((): ActiveFilter[] => {
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
    }, [filters, t]);

    const handleClearAllFilters = () => {
        setFilters({
            search: '',
        });
    };

    const columns = [
        {
            key: 'admin',
            label: t('admin'),
            render: (_: unknown, admin: Admin) => (
                <UserCard 
                    user={{
                        ...admin,
                        roles: admin.roles?.map(role => ({ id: 0, name: role.name })) || []
                    }} 
                    showVerificationBadges={false} 
                />
            ),
        },
        {
            key: 'roles',
            label: t('roles'),
            render: (_: unknown, admin: Admin) => (
                <div className={cn("flex flex-wrap gap-1", flexDirection)}>
                    {admin.roles?.map(role => (
                        <span
                            key={role.name}
                            className={cn("inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300", isRTL ? '!text-right' : '!text-left')}
                        >
                            {role.alias || role.name}
                        </span>
                    )) || (
                        <span className={cn("text-sm text-muted-foreground", isRTL ? '!text-right' : '!text-left')}>{t('no_roles')}</span>
                    )}
                </div>
            ),
            sortable: false,
        },
        {
            key: 'status',
            label: t('status'),
            render: (_: unknown, admin: Admin) => (
                <Switch
                    checked={(admin.status || 'active') === 'active'}
                    onCheckedChange={(checked) => {
                        const newStatus = checked ? 'active' : 'inactive';
                        router.patch(`/dashboard/admins/${admin.id}/toggle-status`, {
                            status: newStatus,
                        }, {
                            preserveState: true,
                            preserveScroll: true,
                            onSuccess: () => {
                                customToast.success(
                                    newStatus === 'active' 
                                        ? t('admin_activated_successfully')
                                        : t('admin_deactivated_successfully')
                                );
                            },
                            onError: () => {
                                customToast.error(t('update_failed'));
                            },
                        });
                    }}
                />
            ),
        },
        {
            key: 'created_at',
            label: t('created_at'),
            render: (_: unknown, admin: Admin) => (
                <span className={cn("text-sm text-muted-foreground", isRTL ? '!text-right' : '!text-left')} dir={dir}>
                    {formatHumanDate(admin.created_at, t)}
                </span>
            ),
            sortable: true,
        },
        {
            key: 'actions',
            label: t('actions'),
            render: (_: unknown, admin: Admin) => {
                const { auth } = usePage<SharedData>().props;
                const userRoles = auth?.user?.roles?.map(r => r.name) || [];
                const isSuperAdmin = admin.roles?.some((r: { name: string }) => r.name === 'super-admin') || false;
                
                return (
                    <div className={cn("flex items-center gap-1 w-full", isRTL ? 'justify-start flex-row-reverse' : 'justify-end')}>
                        {can('admins.show') && (
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => router.visit(`/dashboard/admins/${admin.id}`)}
                                title={t('view')}
                                aria-label={t('view')}
                            >
                                <Eye className="h-4 w-4" />
                            </Button>
                        )}
                        {can('admins.edit') && (
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => router.visit(`/dashboard/admins/${admin.id}/edit`)}
                                title={t('edit')}
                                aria-label={t('edit')}
                            >
                                <Edit className="h-4 w-4" />
                            </Button>
                        )}
                        {!isSuperAdmin && can('admins.destroy') && (
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleDelete(admin.id, admin.name)}
                                title={t('delete')}
                                aria-label={t('delete')}
                                className="text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-900/20"
                            >
                                <Trash2 className="h-4 w-4" />
                            </Button>
                        )}
                    </div>
                );
            },
        },
    ];

    const breadcrumbItems: BreadcrumbItem[] = [
        { title: t('dashboard'), href: dashboard.url() },
        { title: t('admin_management'), href: '/dashboard/admins' },
    ];

    return (
        <AppLayout breadcrumbs={breadcrumbItems}>
            <Head title={t('admin_management')} />

            <div className={cn("flex h-full flex-1 flex-col gap-6 overflow-x-auto rounded-xl bg-card dark:bg-card p-6 border border-border", isRTL ? '!text-right' : '!text-left')} dir={dir}>
                {/* Header */}
                <div className={cn("flex items-center justify-between border-b pb-4", flexDirection)}>
                    <div className={cn(isRTL ? '!text-right' : '!text-left')}>
                        <h1 className={cn("text-3xl font-bold text-foreground", isRTL ? '!text-right' : '!text-left')}>{t('admin_management')}</h1>
                        <p className={cn("text-muted-foreground mt-1", isRTL ? '!text-right' : '!text-left')}>{t('manage_admin_accounts')}</p>
                    </div>
                    {can('admins.create') && (
                        <Link href="/dashboard/admins/create">
                            <Button className={cn("flex items-center gap-2", flexDirection)}>
                                <Plus className={cn("h-4 w-4", iconMargin('md'))} />
                                {t('create_admin')}
                            </Button>
                        </Link>
                    )}
                </div>

                {/* Pagination Info and Show Filters Button */}
                <div className={cn("flex items-center justify-between", flexDirection)}>
                    <div className={cn("flex items-center gap-2", flexDirection)}>
                        <span className={cn("text-sm text-foreground", isRTL ? '!text-right' : '!text-left')}>
                            {t('showing')} {((admins.current_page - 1) * admins.per_page) + 1} {t('of')} {admins.total} {t('results')}
                        </span>
                        <Select value={admins.per_page.toString()} onValueChange={(value) => handlePerPageChange(Number(value))}>
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
                        onRemoveFilter={(key) => {
                            if (key === 'search') {
                                setFilters(prev => ({ ...prev, search: '' }));
                            }
                        }}
                        onClearAll={handleClearAllFilters}
                        isOpen={true}
                        locale={locale}
                    >
                        <SearchFieldFilter
                            id="search"
                            label={t('search')}
                            value={filters.search || ''}
                            onChange={(value) => setFilters(prev => ({ ...prev, search: value }))}
                            placeholder={t('search_by_name_email_phone')}
                        />
                    </CollapsibleFilters>
                )}

                {/* Data Table */}
                <DataTable
                    data={admins.data}
                    columns={columns}
                    total={admins.total}
                    currentPage={admins.current_page}
                    perPage={admins.per_page}
                    onPageChange={handlePageChange}
                    onPerPageChange={handlePerPageChange}
                    locale={locale}
                />
            </div>

            {/* Delete Dialog */}
            <ConfirmationDialog
                open={deleteDialog.isOpen}
                onOpenChange={(open) => !open && setDeleteDialog({ isOpen: false, adminId: null, adminName: '' })}
                onConfirm={confirmDelete}
                title={t('delete_admin')}
                description={t('are_you_sure_delete_admin').replace('{name}', deleteDialog.adminName)}
                variant="danger"
                confirmText={t('delete')}
            />
        </AppLayout>
    );
}
