import { DataTable } from '@/components/data-table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
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
    type ActiveFilter,
    type SelectOption 
} from '@/components/filters';
import AppLayout from '@/layouts/app-layout';
import { useTranslation } from '@/hooks/use-translation';
import { useRTL } from '@/hooks/use-rtl';
import { useRTLInit } from '@/hooks/use-rtl-init';
import { usePermissions } from '@/hooks/use-permissions';
import { Head, Link, router, usePage } from '@inertiajs/react';
import { Eye, Edit, Trash2, Filter, Plus } from 'lucide-react';
import { useState, useEffect, useCallback } from 'react';
import { customToast } from '@/components/ui/custom-toast';
import { ConfirmationDialog } from '@/components/confirmation-dialog';
import { index as dashboard } from '@/routes/dashboard';
import { type BreadcrumbItem } from '@/types';
import { formatHumanDate } from '@/utils/date-utils';
import { cn } from '@/lib/utils';
import { type SharedData } from '@/types';

interface Staff {
    id: number;
    name: string;
    email?: string;
    phone?: string;
    status: string;
    clinics?: Array<{ id: number; name_en: string; name_ar: string }>;
    roles?: Array<{ id: number; name: string; alias?: string }>;
    created_at: string;
}

interface ClinicsStaffPageProps {
    staff: {
        data: Staff[];
        current_page: number;
        last_page: number;
        per_page: number;
        total: number;
    };
    filters: {
        clinic_id?: string;
        role?: string;
        status?: string;
        search?: string;
        owner_id?: string;
        staff_type?: string;
    };
    clinics?: Array<{ id: number; name_en: string; name_ar: string }>;
    owners?: Array<{ id: number; name: string; email: string }>;
}

export default function ClinicsStaffIndex({ staff, filters: initialFilters, clinics = [], owners = [] }: ClinicsStaffPageProps) {
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
            title: t('clinics_staff_management'),
            href: '/dashboard/clinics-staff',
        },
    ];

    const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; staffId: number | null }>({ open: false, staffId: null });
    const [optimisticStaff, setOptimisticStaff] = useState(staff.data);
    const [showFilters, setShowFilters] = useState(false);
    const [isInitialLoad, setIsInitialLoad] = useState(true);

    const [filters, setFilters] = useState({
        search: initialFilters?.search || '',
        clinic_id: initialFilters?.clinic_id || 'all',
        role: initialFilters?.role || 'all',
        status: initialFilters?.status || 'all',
        owner_id: initialFilters?.owner_id || 'all',
        staff_type: initialFilters?.staff_type || 'clinic_manager', // Default to clinic_manager
    });

    const applyFiltersToBackend = useCallback((filtersToApply: typeof filters) => {
        router.get('/dashboard/clinics-staff', {
            page: 1,
            search: filtersToApply.search || undefined,
            filters: {
                clinic_id: filtersToApply.clinic_id && filtersToApply.clinic_id !== 'all' ? filtersToApply.clinic_id : undefined,
                role: filtersToApply.role && filtersToApply.role !== 'all' ? filtersToApply.role : undefined,
                status: filtersToApply.status && filtersToApply.status !== 'all' ? filtersToApply.status : undefined,
                owner_id: filtersToApply.owner_id && filtersToApply.owner_id !== 'all' ? filtersToApply.owner_id : undefined,
                staff_type: filtersToApply.staff_type && filtersToApply.staff_type !== 'all' ? filtersToApply.staff_type : undefined,
            },
        }, { preserveState: true, preserveScroll: true });
    }, []);

    useEffect(() => {
        setOptimisticStaff(staff.data);
    }, [staff.data]);

    useEffect(() => {
        if (isInitialLoad) {
            setIsInitialLoad(false);
            return;
        }

        const timeoutId = setTimeout(() => {
            applyFiltersToBackend(filters);
        }, 300);

        return () => clearTimeout(timeoutId);
        }, [filters.clinic_id, filters.role, filters.status, filters.search, filters.owner_id, filters.staff_type, isInitialLoad, applyFiltersToBackend]);

    const statusOptions: SelectOption[] = [
        { value: 'all', label: t('all') },
        { value: 'active', label: t('active') },
        { value: 'inactive', label: t('inactive') },
    ];

    const clinicOptions: SelectOption[] = [
        { value: 'all', label: t('all') },
        ...clinics.map(clinic => ({
            value: clinic.id.toString(),
            label: isRTL && clinic.name_ar ? clinic.name_ar : (clinic.name_en || clinic.name_ar),
        })),
    ];

    const ownerOptions: SelectOption[] = [
        { value: 'all', label: t('all_owners') },
        ...owners.map(owner => ({
            value: owner.id.toString(),
            label: `${owner.name} (${owner.email})`,
        })),
    ];

    const staffTypeOptions: SelectOption[] = [
        { value: 'all', label: t('all_staff') },
        { value: 'clinic_manager', label: t('clinic_managers') },
        { value: 'clinic', label: t('clinic_role_users') },
    ];

    const getActiveFilters = (): ActiveFilter[] => {
        const active: ActiveFilter[] = [];
        if (filters.search) active.push({ key: 'search', label: t('search'), value: filters.search, displayValue: filters.search });
        if (filters.clinic_id && filters.clinic_id !== 'all') {
            const clinic = clinics.find(c => c.id.toString() === filters.clinic_id);
            const clinicName = clinic?.name_en || clinic?.name_ar || filters.clinic_id;
            active.push({ key: 'clinic_id', label: t('clinic'), value: filters.clinic_id, displayValue: clinicName });
        }
        if (filters.role && filters.role !== 'all') {
            active.push({ key: 'role', label: t('role'), value: filters.role, displayValue: filters.role });
        }
        if (filters.status && filters.status !== 'all') {
            active.push({ key: 'status', label: t('status'), value: filters.status, displayValue: t(filters.status) });
        }
        if (filters.owner_id && filters.owner_id !== 'all') {
            const owner = owners.find(o => o.id.toString() === filters.owner_id);
            active.push({ key: 'owner_id', label: t('owner'), value: filters.owner_id, displayValue: owner?.name || filters.owner_id });
        }
        if (filters.staff_type && filters.staff_type !== 'all') {
            const staffTypeLabel = staffTypeOptions.find(opt => opt.value === filters.staff_type)?.label || filters.staff_type;
            active.push({ key: 'staff_type', label: t('staff_type'), value: filters.staff_type, displayValue: staffTypeLabel });
        }
        return active;
    };

    const handleRemoveFilter = (key: string) => {
        setFilters(prev => {
            const newFilters = { ...prev };
            if (key === 'search') newFilters.search = '';
            else if (key === 'clinic_id') newFilters.clinic_id = 'all';
            else if (key === 'role') newFilters.role = 'all';
            else if (key === 'status') newFilters.status = 'all';
            else if (key === 'owner_id') newFilters.owner_id = 'all';
            else if (key === 'staff_type') newFilters.staff_type = 'all';
            return newFilters;
        });
    };

    const handleClearAllFilters = () => {
        setFilters({
            search: '',
            clinic_id: 'all',
            role: 'all',
            status: 'all',
            owner_id: 'all',
            staff_type: 'clinic_manager', // Default to clinic_manager
        });
    };

    const handleDelete = () => {
        if (deleteDialog.staffId) {
            router.delete(`/dashboard/clinics-staff/${deleteDialog.staffId}`, {
                onSuccess: () => {
                    customToast.success(t('staff_deleted_successfully'));
                    setOptimisticStaff(prev => prev.filter(s => s.id !== deleteDialog.staffId));
                    setDeleteDialog({ open: false, staffId: null });
                },
                onError: () => {
                    customToast.error(t('delete_failed'));
                }
            });
        }
    };


    const columns = [
        {
            key: 'user',
            label: t('staff_member'),
            render: (_: unknown, staffMember: Staff) => (
                <UserCard 
                    user={{
                        ...staffMember,
                        email: staffMember.email || '',
                    }} 
                    showVerificationBadges={false} 
                />
            ),
        },
        {
            key: 'clinics',
            label: t('clinics'),
            render: (_: unknown, staffMember: Staff) => (
                <div className={cn("flex flex-wrap gap-1", flexDirection)}>
                    {staffMember.clinics && staffMember.clinics.length > 0 ? (
                        staffMember.clinics.map(clinic => (
                            <Badge key={clinic.id} variant="outline" className={cn("text-xs", isRTL ? '!text-right' : '!text-left')} dir={isRTL ? 'rtl' : 'ltr'}>
                                {isRTL && clinic.name_ar ? clinic.name_ar : (clinic.name_en || clinic.name_ar)}
                            </Badge>
                        ))
                    ) : (
                        <span className={cn("text-sm text-muted-foreground", isRTL ? '!text-right' : '!text-left')}>{t('n_a')}</span>
                    )}
                </div>
            ),
        },
        {
            key: 'role',
            label: t('role'),
            render: (_: unknown, staffMember: Staff) => (
                <div className={cn("flex flex-wrap gap-1", flexDirection)}>
                    {staffMember.roles && staffMember.roles.length > 0 ? (
                        staffMember.roles.map(role => (
                            <Badge key={role.id} variant="secondary" className={cn("text-xs", isRTL ? '!text-right' : '!text-left')}>
                                {role.alias || role.name}
                            </Badge>
                        ))
                    ) : (
                        <span className={cn("text-sm text-muted-foreground", isRTL ? '!text-right' : '!text-left')}>{t('n_a')}</span>
                    )}
                </div>
            ),
        },
        {
            key: 'status',
            label: t('status'),
            render: (_: unknown, staffMember: Staff) => (
                <Switch
                    checked={staffMember.status === 'active'}
                    onCheckedChange={(checked) => {
                        const newStatus = checked ? 'active' : 'inactive';
                        router.patch(`/dashboard/users/${staffMember.id}/toggle-status`, {
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
            ),
        },
        {
            key: 'created_at',
            label: t('created_at'),
            render: (date: string) => formatHumanDate(date, t),
        },
        {
            key: 'actions',
            label: t('actions'),
            render: (_: unknown, staffMember: Staff) => (
                <div className={cn("flex items-center gap-1", isRTL ? 'justify-start' : 'justify-end', flexDirection)}>
                    {can('clinics-staff.show') && (
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => router.visit(`/dashboard/clinics-staff/${staffMember.id}`)}
                            title={t('view')}
                        >
                            <Eye className={cn("h-4 w-4", iconMargin('sm'))} />
                        </Button>
                    )}
                    {can('clinics-staff.edit') && (
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => router.visit(`/dashboard/clinics-staff/${staffMember.id}/edit`)}
                            title={t('edit')}
                        >
                            <Edit className={cn("h-4 w-4", iconMargin('sm'))} />
                        </Button>
                    )}
                    {can('clinics-staff.destroy') && (
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setDeleteDialog({ open: true, staffId: staffMember.id })}
                            title={t('delete')}
                        >
                            <Trash2 className={cn("h-4 w-4 text-destructive", iconMargin('sm'))} />
                        </Button>
                    )}
                </div>
            ),
        },
    ];

    const handlePageChange = (page: number) => {
        router.get('/dashboard/clinics-staff', {
            page,
            per_page: staff.per_page,
            search: filters.search || undefined,
            filters: {
                clinic_id: filters.clinic_id && filters.clinic_id !== 'all' ? filters.clinic_id : undefined,
                role: filters.role && filters.role !== 'all' ? filters.role : undefined,
                status: filters.status && filters.status !== 'all' ? filters.status : undefined,
                owner_id: filters.owner_id && filters.owner_id !== 'all' ? filters.owner_id : undefined,
                staff_type: filters.staff_type && filters.staff_type !== 'all' ? filters.staff_type : undefined,
            },
        }, { preserveState: true });
    };

    const handlePerPageChange = (perPage: number) => {
        router.get('/dashboard/clinics-staff', {
            per_page: perPage,
            page: 1,
            search: filters.search || undefined,
            filters: {
                clinic_id: filters.clinic_id && filters.clinic_id !== 'all' ? filters.clinic_id : undefined,
                role: filters.role && filters.role !== 'all' ? filters.role : undefined,
                status: filters.status && filters.status !== 'all' ? filters.status : undefined,
                owner_id: filters.owner_id && filters.owner_id !== 'all' ? filters.owner_id : undefined,
                staff_type: filters.staff_type && filters.staff_type !== 'all' ? filters.staff_type : undefined,
            },
        }, { preserveState: true });
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={t('clinics_staff_management')} />
            
            <div className={cn("flex h-full flex-1 flex-col gap-6 overflow-x-auto rounded-xl bg-card dark:bg-card p-6 border border-border", isRTL ? '!text-right' : '!text-left')} dir={dir}>
                <div className={cn("flex items-center justify-between", flexDirection)}>
                    <div className={cn(isRTL ? '!text-right' : '!text-left')}>
                        <h1 className={cn("text-3xl font-bold text-foreground", isRTL ? '!text-right' : '!text-left')}>{t('clinics_staff_management')}</h1>
                        <p className={cn("text-muted-foreground mt-1", isRTL ? '!text-right' : '!text-left')}>{t('manage_clinics_staff_description')}</p>
                    </div>
                    {can('clinics-staff.create') && (
                        <Link href="/dashboard/clinics-staff/create">
                            <Button className={cn("flex items-center gap-2", flexDirection)}>
                                <Plus className={cn("h-4 w-4", iconMargin('md'))} />
                                {t('add_staff')}
                            </Button>
                        </Link>
                    )}
                </div>

                <div className={cn("flex items-center justify-between", flexDirection)}>
                    <div className={cn("flex items-center gap-2", flexDirection)}>
                        <span className={cn("text-sm text-foreground", isRTL ? '!text-right' : '!text-left')}>
                            {t('showing')} {((staff.current_page - 1) * staff.per_page) + 1} {t('of')} {staff.total} {t('results')}
                        </span>
                        <Select value={staff.per_page.toString()} onValueChange={(value) => handlePerPageChange(Number(value))}>
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
                            placeholder={t('search_by_name_email_phone') || t('search_placeholder')}
                        />
                        
                        <SelectFilter
                            id="owner_id"
                            label={t('owner')}
                            value={filters.owner_id}
                            onChange={(value) => setFilters(prev => ({ ...prev, owner_id: value }))}
                            options={ownerOptions}
                            placeholder={t('all_owners')}
                        />
                        
                        <SelectFilter
                            id="staff_type"
                            label={t('staff_type')}
                            value={filters.staff_type}
                            onChange={(value) => setFilters(prev => ({ ...prev, staff_type: value }))}
                            options={staffTypeOptions}
                            placeholder={t('all_staff')}
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
                    </CollapsibleFilters>
                )}

                <DataTable
                    data={optimisticStaff}
                    columns={columns}
                    total={staff.total}
                    currentPage={staff.current_page}
                    perPage={staff.per_page}
                    onPageChange={handlePageChange}
                    onPerPageChange={handlePerPageChange}
                />
            </div>

            <ConfirmationDialog
                open={deleteDialog.open}
                onOpenChange={(open) => setDeleteDialog({ open, staffId: null })}
                onConfirm={handleDelete}
                title={t('delete_staff')}
                description={t('delete_staff_confirmation')}
                cancelText={t('cancel')}
                variant="danger"
                confirmText={t('delete')}
            />
        </AppLayout>
    );
}

