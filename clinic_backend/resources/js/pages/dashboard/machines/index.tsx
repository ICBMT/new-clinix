import { DataTable } from '@/components/data-table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ConfirmationDialog } from '@/components/confirmation-dialog';
import { RejectionDialog } from '@/components/rejection-dialog';
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
import { type SharedData } from '@/types';
import { Plus, Eye, Edit, Trash2, Filter, CheckCircle, XCircle, Wrench, Power } from 'lucide-react';
import { useState, useEffect, useCallback } from 'react';
import { customToast } from '@/components/ui/custom-toast';
import { index as dashboard } from '@/routes/dashboard';
import { type BreadcrumbItem } from '@/types';
import { formatHumanDate } from '@/utils/date-utils';
import { cn } from '@/lib/utils';
import { ClinicCard } from '@/components/clinic-card';
import { UserCard } from '@/components/user-card';

interface Machine {
    id: number;
    model_en?: string;
    model_ar?: string;
    serial_number?: string;
    manufacturer_en?: string;
    manufacturer_ar?: string;
    image?: string;
    status: 'ready' | 'maintenance' | 'busy';
    request_status?: 'pending' | 'approved' | 'rejected';
    description_en?: string;
    description_ar?: string;
    created_at: string;
    treatments_count?: number;
    clinic?: {
        id: number;
        name_en: string;
        name_ar: string;
        email?: string;
        phone?: string;
        logo?: string | null;
        owner?: {
            id: number;
            name: string;
            email?: string;
            phone?: string;
        } | null;
    } | null;
    category?: {
        id: number;
        name_en: string;
        name_ar: string;
    } | null;
    categories?: Array<{
        id: number;
        name_en: string;
        name_ar: string;
    }>;
}

interface Clinic {
    id: number;
    name_en: string;
    name_ar: string;
    email?: string;
    phone?: string;
    logo?: string | null;
}

interface Treatment {
    id: number;
    name_en: string;
    name_ar: string;
}

interface MachinesPageProps {
    machines: {
        data: Machine[];
        current_page: number;
        last_page: number;
        per_page: number;
        total: number;
    };
    filters: {
        search?: string;
        status?: string;
        clinic_id?: string;
        treatment_id?: string;
    };
    accessibleClinics?: Clinic[];
    accessibleTreatments?: Treatment[];
    canApproveReject?: boolean;
}

export default function MachinesIndex({ machines, filters: initialFilters, accessibleClinics, accessibleTreatments = [], canApproveReject = false }: MachinesPageProps) {
    useRTLInit();
    const { t, locale } = useTranslation();
    const page = usePage<SharedData>();
    const { locale: pageLocale } = page.props;
    const isRTL = pageLocale === 'ar';
    const dir = isRTL ? 'rtl' : 'ltr';
    const { flexDirection, iconMargin } = useRTL();
    const { can } = usePermissions();
    const auth = page.props.auth;
    const userRoles = auth?.user?.roles || [];
    const shouldHideStatus = userRoles.includes('clinic') || userRoles.includes('clinic_manager');
    
    const breadcrumbs: BreadcrumbItem[] = [
        {
            title: t('dashboard'),
            href: dashboard.url(),
        },
        {
            title: t('machines_management'),
            href: '/dashboard/machines',
        },
    ];
    const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; machineId: number | null }>({ open: false, machineId: null });
    const [rejectDialog, setRejectDialog] = useState<{ open: boolean; machineId: number | null }>({ open: false, machineId: null });
    const [optimisticMachines, setOptimisticMachines] = useState(machines.data);
    const [showFilters, setShowFilters] = useState(false);
    const [isInitialLoad, setIsInitialLoad] = useState(true);

    const [filters, setFilters] = useState({
        search: initialFilters?.search || '',
        status: initialFilters?.status || 'all',
        clinic_id: initialFilters?.clinic_id || 'all',
        treatment_id: initialFilters?.treatment_id || 'all',
    });

    const applyFiltersToBackend = useCallback((filtersToApply: typeof filters) => {
        router.get('/dashboard/machines', {
            page: 1,
            search: filtersToApply.search || undefined,
            clinic_id: filtersToApply.clinic_id && filtersToApply.clinic_id !== 'all' ? filtersToApply.clinic_id : undefined,
            treatment_id: filtersToApply.treatment_id && filtersToApply.treatment_id !== 'all' ? filtersToApply.treatment_id : undefined,
            filters: {
                status: filtersToApply.status && filtersToApply.status !== 'all' ? filtersToApply.status : undefined,
            },
        }, { preserveState: true, preserveScroll: true });
    }, []);

    useEffect(() => {
        setOptimisticMachines(machines.data);
    }, [machines.data]);

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
        { value: 'ready', label: t('ready') },
        { value: 'maintenance', label: t('maintenance') },
        { value: 'out_of_service', label: t('out_of_service') },
    ];

    const clinicOptions: SelectOption[] = [
        { value: 'all', label: t('all_clinics') },
        ...(accessibleClinics || []).map(clinic => ({
            value: clinic.id.toString(),
            label: isRTL ? clinic.name_ar : clinic.name_en,
        })),
    ];

    const treatmentOptions: SelectOption[] = [
        { value: 'all', label: t('all_treatments') },
        ...(accessibleTreatments || []).map(treatment => ({
            value: treatment.id.toString(),
            label: isRTL ? treatment.name_ar : treatment.name_en,
        })),
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

        if (filters.clinic_id && filters.clinic_id !== 'all') {
            const option = clinicOptions.find(o => o.value === filters.clinic_id);
            active.push({
                key: 'clinic_id',
                label: t('clinic'),
                value: filters.clinic_id,
                displayValue: option?.label || filters.clinic_id,
            });
        }

        if (filters.treatment_id && filters.treatment_id !== 'all') {
            const option = treatmentOptions.find(o => o.value === filters.treatment_id);
            active.push({
                key: 'treatment_id',
                label: t('treatment'),
                value: filters.treatment_id,
                displayValue: option?.label || filters.treatment_id,
            });
        }

        return active;
    };

    const handleRemoveFilter = (key: string) => {
        const newFilters = { ...filters };
        
        if (key === 'status') {
            newFilters.status = 'all';
        } else if (key === 'clinic_id') {
            newFilters.clinic_id = 'all';
        } else if (key === 'treatment_id') {
            newFilters.treatment_id = 'all';
        } else {
            newFilters[key as keyof typeof filters] = '';
        }

        setFilters(newFilters);
    };

    const handleClearAllFilters = () => {
        const clearedFilters = {
            search: '',
            status: 'all',
            clinic_id: 'all',
            treatment_id: 'all',
        };
        setFilters(clearedFilters);
    };

    const getStatusBadge = (status: string) => {
        const variants: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
            ready: 'default',
            maintenance: 'secondary',
            busy: 'destructive',
        };

        return (
            <Badge variant={variants[status] || 'outline'}>
                {t(status)}
            </Badge>
        );
    };

    const getRequestStatusBadge = (status?: string) => {
        if (!status) return null;
        const variants: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
            pending: 'secondary',
            approved: 'default',
            rejected: 'destructive',
        };

        return (
            <Badge variant={variants[status] || 'outline'}>
                {t(status)}
            </Badge>
        );
    };

    const getLocalizedName = (en?: string, ar?: string) => {
        if (isRTL && ar) return ar;
        return en || '';
    };

    const allColumns = [
        {
            key: 'machine',
            label: t('machine'),
            render: (_: unknown, machine: Machine) => (
                <div className={cn("flex items-start gap-3", flexDirection)}>
                    {/* Machine image */}
                    {machine.image && (
                        <img 
                            src={machine.image} 
                            alt={getLocalizedName(machine.model_en, machine.model_ar)}
                            className="w-10 h-10 rounded object-cover flex-shrink-0"
                        />
                    )}

                    {/* Machine details + categories */}
                    <div className={cn("flex flex-col gap-1 min-w-0", isRTL ? '!text-right' : '!text-left')}>
                        {/* Model name */}
                        <p className={cn("font-medium text-sm text-foreground truncate", isRTL ? '!text-right' : '!text-left')} dir={dir}>
                            {getLocalizedName(machine.model_en, machine.model_ar)}
                        </p>

                        {/* Serial number */}
                        {machine.serial_number && (
                            <p
                                className={cn(
                                    "text-xs text-muted-foreground font-mono truncate",
                                    isRTL ? '!text-right' : '!text-left'
                                )}
                                dir="ltr"
                            >
                                {machine.serial_number}
                            </p>
                        )}

                        {/* Manufacturer */}
                        {(machine.manufacturer_en || machine.manufacturer_ar) && (
                            <p
                                className={cn(
                                    "text-xs text-muted-foreground truncate",
                                    isRTL ? '!text-right' : '!text-left'
                                )}
                                dir={dir}
                            >
                                {getLocalizedName(machine.manufacturer_en, machine.manufacturer_ar)}
                            </p>
                        )}

                        {/* Categories (combined from former Category column) */}
                        <div className="mt-1">
                            {machine.categories && machine.categories.length > 0 ? (
                                <div className={cn("flex flex-wrap gap-1", flexDirection)}>
                                    {machine.categories.map((category) => (
                                        <span 
                                            key={category.id} 
                                            className={cn(
                                                "inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-medium bg-primary/10 text-primary",
                                                isRTL ? '!text-right' : '!text-left'
                                            )}
                                            dir={dir}
                                        >
                                            {getLocalizedName(category.name_en, category.name_ar)}
                                        </span>
                                    ))}
                                </div>
                            ) : machine.category ? (
                                <span
                                    className={cn(
                                        "inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-medium bg-primary/10 text-primary",
                                        isRTL ? '!text-right' : '!text-left'
                                    )}
                                    dir={dir}
                                >
                                    {getLocalizedName(machine.category.name_en, machine.category.name_ar)}
                                </span>
                            ) : (
                                <span
                                    className={cn(
                                        "text-xs text-muted-foreground",
                                        isRTL ? '!text-right' : '!text-left'
                                    )}
                                    dir={dir}
                                >
                                    {t('n_a')}
                                </span>
                            )}
                        </div>
                    </div>
                </div>
            ),
        },
        {
            key: 'clinic',
            label: t('clinic'),
            render: (_: unknown, machine: Machine) => (
                <div className="p-2">
                    {machine.clinic ? (
                        <>
                            <div
                                className="cursor-pointer"
                                onClick={() => router.visit(`/dashboard/clinics/${machine.clinic.id}`)}
                            >
                                <ClinicCard
                                    clinic={{
                                        id: machine.clinic.id,
                                        company_name_en: machine.clinic.name_en,
                                        company_name_ar: machine.clinic.name_ar,
                                        email: machine.clinic.email,
                                        phone: machine.clinic.phone,
                                        logo: machine.clinic.logo ?? null,
                                    }}
                                    locale={locale}
                                    variant="default"
                                />
                            </div>
                            {machine.clinic.owner && (
                                <div className="mt-2">
                                    <UserCard 
                                        user={{
                                            id: machine.clinic.owner.id,
                                            name: machine.clinic.owner.name,
                                            email: machine.clinic.owner.email || '',
                                            phone: machine.clinic.owner.phone || '',
                                        }} 
                                        variant="compact"
                                        showVerificationBadges={false}
                                    />
                                </div>
                            )}
                        </>
                    ) : (
                        <span className={cn("text-sm text-muted-foreground", isRTL ? '!text-right' : '!text-left')} dir={dir}>
                            {t('global_machine')}
                        </span>
                    )}
                </div>
            ),
        },
        {
            key: 'treatments_count',
            label: t('treatments'),
            render: (_: unknown, machine: Machine) => (
                <p className={cn("text-sm font-medium", isRTL ? '!text-right' : '!text-left')} dir="ltr">{machine.treatments_count || 0}</p>
            ),
        },
        {
            key: 'status',
            label: t('status'),
            render: (_: unknown, machine: Machine) => (
                <div className={cn(isRTL ? '!text-right' : '!text-left')}>
                    {getStatusBadge(machine.status)}
                </div>
            ),
        },
        {
            key: 'request_status',
            label: t('request_status'),
            render: (_: unknown, machine: Machine) => {
                const badge = getRequestStatusBadge(machine.request_status);
                return badge ? (
                    <div className={cn(isRTL ? '!text-right' : '!text-left')}>
                        {badge}
                    </div>
                ) : null;
            },
        },
        {
            key: 'created_at',
            label: t('created_at'),
            render: (_: unknown, machine: Machine) => (
                <span className={cn("text-sm text-muted-foreground", isRTL ? '!text-right' : '!text-left')} dir={dir}>{formatHumanDate(machine.created_at, t)}</span>
            ),
        },
        {
            key: 'actions',
            label: t('actions'),
            render: (_: unknown, machine: Machine) => (
                <div className={cn("flex items-center gap-1 w-full", isRTL ? 'justify-start flex-row-reverse' : 'justify-end')}>
                    {can('machines.show') && (
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => router.visit(`/dashboard/machines/${machine.id}`)}
                            title={t('view')}
                        >
                            <Eye className="h-4 w-4" />
                        </Button>
                    )}
                    {can('machines.edit') && (
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => router.visit(`/dashboard/machines/${machine.id}/edit`)}
                            title={t('edit')}
                        >
                            <Edit className="h-4 w-4" />
                        </Button>
                    )}
                    {can('machines.toggle-status') && (
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                                const newStatus = machine.status === 'ready' ? 'maintenance' : 'ready';
                                router.patch(`/dashboard/machines/${machine.id}/toggle-status`, { status: newStatus }, {
                                    onSuccess: () => {
                                        customToast.success(t('status_updated_successfully'));
                                        setOptimisticMachines(prev => prev.map(m => 
                                            m.id === machine.id ? { ...m, status: newStatus as 'ready' | 'maintenance' | 'busy' } : m
                                        ));
                                    },
                                });
                            }}
                            title={machine.status === 'ready' ? t('set_maintenance') : t('set_ready')}
                            className={machine.status === 'ready' ? 'text-orange-600 hover:text-orange-700 hover:bg-orange-50' : 'text-green-600 hover:text-green-700 hover:bg-green-50'}
                        >
                            {machine.status === 'ready' ? <Wrench className="h-4 w-4" /> : <Power className="h-4 w-4" />}
                        </Button>
                    )}
                    {!shouldHideStatus && machine.request_status === 'pending' && canApproveReject && can('machines.approve') && (
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                                router.patch(`/dashboard/machines/${machine.id}/approve`, {}, {
                                    onSuccess: () => {
                                        customToast.success(t('machine_approved_successfully'));
                                        setOptimisticMachines(prev => prev.map(m => 
                                            m.id === machine.id ? { ...m, request_status: 'approved' as const } : m
                                        ));
                                    },
                                });
                            }}
                            title={t('approve')}
                            className="text-green-600 hover:text-green-700 hover:bg-green-50"
                        >
                            <CheckCircle className="h-4 w-4" />
                        </Button>
                    )}
                    {!shouldHideStatus && machine.request_status === 'pending' && canApproveReject && can('machines.reject') && (
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setRejectDialog({ open: true, machineId: machine.id })}
                            title={t('reject')}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                            <XCircle className="h-4 w-4" />
                        </Button>
                    )}
                    {can('machines.destroy') && (
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setDeleteDialog({ open: true, machineId: machine.id })}
                            title={t('delete')}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                            <Trash2 className="h-4 w-4" />
                        </Button>
                    )}
                </div>
            ),
        },
    ];

    // Filter out status and request_status columns if user has clinic or clinic_manager role
    const columns = shouldHideStatus 
        ? allColumns.filter(col => col.key !== 'status' && col.key !== 'request_status')
        : allColumns;

    const handleDelete = () => {
        if (deleteDialog.machineId) {
            const machine = optimisticMachines.find(m => m.id === deleteDialog.machineId);
            router.delete(`/dashboard/machines/${deleteDialog.machineId}`, {
                onSuccess: () => {
                    customToast.success(t('machine_deleted_successfully'), getLocalizedName(machine?.model_en, machine?.model_ar));
                    setOptimisticMachines(prev => prev.filter(m => m.id !== deleteDialog.machineId));
                },
                onError: () => {
                    customToast.error(t('delete_failed'));
                }
            });
        }
    };

    const handleReject = (reason: string) => {
        if (rejectDialog.machineId) {
            router.patch(`/dashboard/machines/${rejectDialog.machineId}/reject`, { rejection_reason: reason }, {
                onSuccess: () => {
                    customToast.success(t('machine_rejected_successfully'));
                    setOptimisticMachines(prev => prev.map(m => 
                        m.id === rejectDialog.machineId ? { ...m, request_status: 'rejected' as const } : m
                    ));
                    setRejectDialog({ open: false, machineId: null });
                },
                onError: () => {
                    customToast.error(t('reject_failed'));
                }
            });
        }
    };

    const handlePageChange = (page: number) => {
        router.get('/dashboard/machines', {
            page,
            per_page: machines.per_page,
            search: filters.search || undefined,
            clinic_id: filters.clinic_id && filters.clinic_id !== 'all' ? filters.clinic_id : undefined,
            treatment_id: filters.treatment_id && filters.treatment_id !== 'all' ? filters.treatment_id : undefined,
            filters: {
                status: filters.status && filters.status !== 'all' ? filters.status : undefined,
            },
        }, { preserveState: true });
    };

    const handlePerPageChange = (perPage: number) => {
        router.get('/dashboard/machines', {
            per_page: perPage,
            page: 1,
            search: filters.search || undefined,
            clinic_id: filters.clinic_id && filters.clinic_id !== 'all' ? filters.clinic_id : undefined,
            treatment_id: filters.treatment_id && filters.treatment_id !== 'all' ? filters.treatment_id : undefined,
            filters: {
                status: filters.status && filters.status !== 'all' ? filters.status : undefined,
            },
        }, { preserveState: true });
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={t('machines_management')} />
            
            <div className={cn("flex h-full flex-1 flex-col gap-6 overflow-x-auto rounded-xl bg-card dark:bg-card p-6 border border-border", isRTL ? '!text-right' : '!text-left')} dir={dir}>
                {/* Header */}
                <div className={cn("flex items-center justify-between border-b pb-4", flexDirection)}>
                    <div className={cn(isRTL ? '!text-right' : '!text-left')}>
                        <h1 className={cn("text-3xl font-bold text-foreground", isRTL ? '!text-right' : '!text-left')}>{t('machines_management')}</h1>
                        <p className={cn("text-muted-foreground mt-1", isRTL ? '!text-right' : '!text-left')}>{t('manage_clinic_machines_description')}</p>
                    </div>
                    {can('machines.create') && (
                        <Link href="/dashboard/machines/create">
                            <Button className={cn("flex items-center gap-2", flexDirection)}>
                                <Plus className={cn("h-4 w-4", iconMargin('md'))} />
                                {t('add_machine')}
                            </Button>
                        </Link>
                    )}
                </div>

                {/* Pagination Info and Show Filters Button */}
                <div className={cn("flex items-center justify-between", flexDirection)}>
                    <div className={cn("flex items-center gap-2", flexDirection)}>
                        <span className={cn("text-sm text-foreground", isRTL ? '!text-right' : '!text-left')}>
                            {t('showing')} {((machines.current_page - 1) * machines.per_page) + 1} {t('of')} {machines.total} {t('results')}
                        </span>
                        <Select value={machines.per_page.toString()} onValueChange={(value) => handlePerPageChange(Number(value))}>
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
                            placeholder={t('search_by_model_serial_manufacturer')}
                        />
                        
                        {!shouldHideStatus && (
                            <SelectFilter
                                id="status"
                                label={t('status')}
                                value={filters.status}
                                onChange={(value) => setFilters(prev => ({ ...prev, status: value }))}
                                options={statusOptions}
                                placeholder={t('all')}
                            />
                        )}
                        
                        {accessibleClinics && accessibleClinics.length > 0 && (
                            <SelectFilter
                                id="clinic_id"
                                label={t('clinic')}
                                value={filters.clinic_id}
                                onChange={(value) => setFilters(prev => ({ ...prev, clinic_id: value }))}
                                options={clinicOptions}
                                placeholder={t('all_clinics')}
                            />
                        )}
                        
                        {accessibleTreatments && accessibleTreatments.length > 0 && (
                            <SelectFilter
                                id="treatment_id"
                                label={t('treatment')}
                                value={filters.treatment_id}
                                onChange={(value) => setFilters(prev => ({ ...prev, treatment_id: value }))}
                                options={treatmentOptions}
                                placeholder={t('all_treatments')}
                            />
                        )}
                    </CollapsibleFilters>
                )}

                {/* Data Table */}
                <DataTable
                    data={optimisticMachines}
                    columns={columns}
                    total={machines.total}
                    currentPage={machines.current_page}
                    perPage={machines.per_page}
                    onPageChange={handlePageChange}
                    onPerPageChange={handlePerPageChange}
                    locale={locale}
                />
            </div>

            <ConfirmationDialog
                open={deleteDialog.open}
                onOpenChange={(open) => setDeleteDialog({ open, machineId: null })}
                onConfirm={handleDelete}
                title={t('delete_machine')}
                description={t('delete_machine_confirmation')}
                cancelText={t('cancel')}
                variant="danger"
                confirmText={t('delete')}
            />

            <RejectionDialog
                open={rejectDialog.open}
                onOpenChange={(open) => setRejectDialog({ open, machineId: null })}
                onConfirm={handleReject}
                title={t('reject_machine')}
                description={t('reject_machine_description')}
            />
        </AppLayout>
    );
}

