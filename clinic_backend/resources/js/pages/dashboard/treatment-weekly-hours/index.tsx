import { DataTable } from '@/components/data-table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ConfirmationDialog } from '@/components/confirmation-dialog';
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
import { Plus, Edit, Trash2, Filter, Clock, Eye } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { useState, useEffect, useCallback } from 'react';
import { customToast } from '@/components/ui/custom-toast';
import { index as dashboard } from '@/routes/dashboard';
import { type BreadcrumbItem } from '@/types';
import { usePermissions } from '@/hooks/use-permissions';
import { cn } from '@/lib/utils';
import { UserCard } from '@/components/user-card';
import { ClinicCard } from '@/components/clinic-card';

interface Clinic {
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
}

interface Treatment {
    id: number;
    name_en: string;
    name_ar: string;
    clinic_id: number;
    clinic?: Clinic;
    available_days?: string[];
    has_schedule?: boolean;
    is_active?: boolean;
    slot_duration?: number;
    buffer_time_minutes?: number;
    max_bookings_per_slot?: number;
    weekly_schedules_count?: number;
}

interface TreatmentWeeklyHoursPageProps {
    treatments: {
        data: Treatment[];
        current_page: number;
        last_page: number;
        per_page: number;
        total: number;
    };
    filters: {
        clinic_id?: string;
        search?: string;
    };
    allClinics?: Array<{
        id: number;
        name_en: string;
        name_ar: string;
    }>;
    isSuperAdmin?: boolean;
}

export default function TreatmentWeeklyHoursIndex({ treatments, filters: initialFilters, allClinics = [], isSuperAdmin: isSuperAdminProp }: TreatmentWeeklyHoursPageProps) {
    useRTLInit();
    const { t, locale } = useTranslation();
    const page = usePage<SharedData>();
    const { locale: pageLocale } = page.props;
    const isRTL = pageLocale === 'ar';
    const dir = isRTL ? 'rtl' : 'ltr';
    const { flexDirection, iconMargin } = useRTL();
    const { isSuperAdmin: isSuperAdminFromHook, can } = usePermissions();
    const isSuperAdmin = isSuperAdminProp ?? isSuperAdminFromHook;
    
    const breadcrumbs: BreadcrumbItem[] = [
        {
            title: t('dashboard'),
            href: dashboard.url(),
        },
        {
            title: t('treatment_weekly_hours'),
            href: '/dashboard/treatment-weekly-hours',
        },
    ];

    const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; clinicId: number | null; treatmentId: number | null }>({ 
        open: false, 
        clinicId: null,
        treatmentId: null,
    });
    const [optimisticTreatments, setOptimisticTreatments] = useState(treatments.data);
    const [showFilters, setShowFilters] = useState(false);
    const [isInitialLoad, setIsInitialLoad] = useState(true);

    const [filters, setFilters] = useState({
        clinic_id: initialFilters?.clinic_id || 'all',
        search: initialFilters?.search || '',
    });

    // Sync optimistic state with incoming treatments data
    useEffect(() => {
        setOptimisticTreatments(treatments.data);
    }, [treatments.data]);

    const getLocalizedName = (en?: string, ar?: string) => {
        if (isRTL && ar) return ar;
        return en || '';
    };

    const getDayName = (day: string) => {
        // Use translations for abbreviated day names
        const dayKey = day.toLowerCase();
        const dayTranslationMap: Record<string, string> = {
            monday: t('monday_short'),
            tuesday: t('tuesday_short'),
            wednesday: t('wednesday_short'),
            thursday: t('thursday_short'),
            friday: t('friday_short'),
            saturday: t('saturday_short'),
            sunday: t('sunday_short'),
        };

        return dayTranslationMap[dayKey] || day;
    };

    const getActiveFilters = (): ActiveFilter[] => {
        const active: ActiveFilter[] = [];

        if (filters.clinic_id && filters.clinic_id !== 'all') {
            const clinic = allClinics.find(c => c.id.toString() === filters.clinic_id);
            active.push({
                key: 'clinic_id',
                label: t('clinic'),
                value: filters.clinic_id,
                displayValue: clinic ? getLocalizedName(clinic.name_en, clinic.name_ar) : filters.clinic_id,
            });
        }

        if (filters.search) {
            active.push({
                key: 'search',
                label: t('search'),
                value: filters.search,
                displayValue: filters.search,
            });
        }

        return active;
    };

    const handleRemoveFilter = (key: string) => {
        const newFilters = { ...filters };
        if (key === 'clinic_id') {
            newFilters.clinic_id = 'all';
        } else if (key === 'search') {
            newFilters.search = '';
        }
        setFilters(newFilters);
    };

    const handleClearAllFilters = () => {
        setFilters({ clinic_id: 'all', search: '' });
    };

    const clinicOptions: SelectOption[] = [
        { value: 'all', label: t('all_clinics') },
        ...allClinics.map(clinic => ({
            value: clinic.id.toString(),
            label: getLocalizedName(clinic.name_en, clinic.name_ar),
        })),
    ];

    const handleDelete = () => {
        if (deleteDialog.clinicId && deleteDialog.treatmentId) {
            router.delete(`/dashboard/treatment-weekly-hours/${deleteDialog.clinicId}/${deleteDialog.treatmentId}`, {
                onSuccess: () => {
                    customToast.success(t('treatment_weekly_schedule_deleted_successfully'));
                    setOptimisticTreatments(prev => prev.filter(treatment => 
                        !(treatment.id === deleteDialog.treatmentId && treatment.clinic_id === deleteDialog.clinicId)
                    ));
                },
                onError: () => {
                    customToast.error(t('delete_failed'));
                }
            });
        }
    };

    const columns = [
        {
            key: 'treatment',
            label: t('treatment'),
            render: (_: unknown, treatment: Treatment) => (
                <div className={cn("p-2", isRTL ? '!text-right' : '!text-left')} dir={dir}>
                    <Link
                        href={`/dashboard/treatments/${treatment.id}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={cn("block cursor-pointer hover:opacity-80 transition-opacity", isRTL ? '!text-right' : '!text-left')}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <span className={cn("font-medium text-sm text-foreground", isRTL ? '!text-right' : '!text-left')} dir={dir}>
                            {getLocalizedName(treatment.name_en, treatment.name_ar)}
                        </span>
                    </Link>
                </div>
            ),
        },
        {
            key: 'clinic',
            label: t('clinic'),
            render: (_: unknown, treatment: Treatment) => (
                <div className={cn("p-2", isRTL ? '!text-right' : '!text-left')} dir={dir}>
                    {treatment.clinic ? (
                        <>
                            <ClinicCard
                                clinic={{
                                    id: treatment.clinic.id,
                                    company_name_en: treatment.clinic.name_en,
                                    company_name_ar: treatment.clinic.name_ar,
                                    email: treatment.clinic.email,
                                    phone: treatment.clinic.phone,
                                    logo: treatment.clinic.logo ?? null,
                                }}
                                locale={locale}
                                variant="default"
                            />
                            {treatment.clinic.owner && (
                                <div className="mt-2">
                                    <UserCard 
                                        user={{
                                            id: treatment.clinic.owner.id,
                                            name: treatment.clinic.owner.name,
                                            email: treatment.clinic.owner.email || '',
                                            phone: treatment.clinic.owner.phone || '',
                                        }} 
                                        variant="compact"
                                        showVerificationBadges={false}
                                    />
                                </div>
                            )}
                        </>
                    ) : (
                        <span
                            className={cn(
                                "text-sm text-muted-foreground",
                                isRTL ? '!text-right' : '!text-left'
                            )}
                            dir={dir}
                        >
                            {t('n_a')}
                        </span>
                    )}
                </div>
            ),
        },
        {
            key: 'available_days',
            label: t('available_days'),
            render: (_: unknown, treatment: Treatment) => {
                if (!treatment.available_days || treatment.available_days.length === 0) {
                    return <span className={cn("text-muted-foreground text-sm", isRTL ? '!text-right' : '!text-left')} dir={dir}>—</span>;
                }
                return (
                    <div className={cn("flex flex-wrap gap-1", flexDirection, isRTL ? '!text-right' : '!text-left')} dir={dir}>
                        {treatment.available_days.map((day) => (
                            <Badge key={day} variant="outline" className={cn("text-xs", isRTL ? '!text-right' : '!text-left')} dir={dir}>
                                {getDayName(day)}
                            </Badge>
                        ))}
                    </div>
                );
            },
        },
        {
            key: 'status',
            label: t('status'),
            render: (_: unknown, treatment: Treatment) => {
                if (can('treatment-slots.edit')) {
                    return (
                        <div className={cn(isRTL ? '!text-right' : '!text-left')} dir={dir}>
                            <Switch
                                checked={treatment.is_active ?? false}
                                onCheckedChange={(checked) => {
                                    // Optimistic update
                                    setOptimisticTreatments(prev => 
                                        prev.map(t => 
                                            t.id === treatment.id && t.clinic_id === treatment.clinic_id
                                                ? { ...t, is_active: checked }
                                                : t
                                        )
                                    );
                                    
                                    router.patch(`/dashboard/treatment-weekly-hours/${treatment.clinic_id}/${treatment.id}/toggle-status`, {}, {
                                        preserveState: true,
                                        preserveScroll: true,
                                        onSuccess: () => {
                                            // Reload only treatments data to get fresh state
                                            router.reload({ 
                                                only: ['treatments'],
                                                preserveScroll: true 
                                            });
                                            customToast.success(
                                                checked 
                                                    ? t('treatment_schedule_activated')
                                                    : t('treatment_schedule_deactivated')
                                            );
                                        },
                                        onError: () => {
                                            customToast.error(t('update_failed'));
                                            // Revert optimistic update on error
                                            setOptimisticTreatments(prev => 
                                                prev.map(t => 
                                                    t.id === treatment.id && t.clinic_id === treatment.clinic_id
                                                        ? { ...t, is_active: !checked }
                                                        : t
                                                )
                                            );
                                        },
                                    });
                                }}
                            />
                        </div>
                    );
                }
                return (
                    <Badge variant={treatment.is_active ? 'default' : 'secondary'} className={cn(isRTL ? '!text-right' : '!text-left')} dir={dir}>
                        {treatment.is_active ? t('active') : t('inactive')}
                    </Badge>
                );
            },
        },
        {
            key: 'actions',
            label: t('actions'),
            render: (_: unknown, treatment: Treatment) => (
                <div className={cn("flex items-center gap-1", isRTL ? 'justify-start flex-row-reverse' : 'justify-end')} dir={dir}>
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => router.visit(`/dashboard/treatment-weekly-hours/${treatment.clinic_id}/${treatment.id}/edit`)}
                        title={t('view')}
                        dir={dir}
                    >
                        <Eye className="h-4 w-4" />
                    </Button>
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => router.visit(`/dashboard/treatment-weekly-hours/${treatment.clinic_id}/${treatment.id}/edit`)}
                        title={t('edit')}
                        dir={dir}
                    >
                        <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setDeleteDialog({ open: true, clinicId: treatment.clinic_id, treatmentId: treatment.id })}
                        title={t('delete')}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        dir={dir}
                    >
                        <Trash2 className="h-4 w-4" />
                    </Button>
                </div>
            ),
        },
    ];

    const applyFiltersToBackend = useCallback((filtersToApply: typeof filters) => {
        router.get('/dashboard/treatment-weekly-hours', {
            page: 1,
            clinic_id: filtersToApply.clinic_id && filtersToApply.clinic_id !== 'all' ? filtersToApply.clinic_id : undefined,
            search: filtersToApply.search || undefined,
        }, { preserveState: true, preserveScroll: true });
    }, []);

    useEffect(() => {
        setOptimisticTreatments(treatments.data);
    }, [treatments.data]);

    useEffect(() => {
        if (isInitialLoad) {
            setIsInitialLoad(false);
            return;
        }
        const timeoutId = setTimeout(() => {
            applyFiltersToBackend(filters);
        }, 300);
        return () => clearTimeout(timeoutId);
    }, [filters.clinic_id, filters.search, isInitialLoad, applyFiltersToBackend]);

    const handlePageChange = (page: number) => {
        router.get('/dashboard/treatment-weekly-hours', {
            page,
            per_page: treatments.per_page,
            clinic_id: filters.clinic_id && filters.clinic_id !== 'all' ? filters.clinic_id : undefined,
            search: filters.search || undefined,
        }, { preserveState: true });
    };

    const handlePerPageChange = (perPage: number) => {
        router.get('/dashboard/treatment-weekly-hours', {
            per_page: perPage,
            page: 1,
            clinic_id: filters.clinic_id && filters.clinic_id !== 'all' ? filters.clinic_id : undefined,
            search: filters.search || undefined,
        }, { preserveState: true });
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={t('treatment_weekly_hours')} />
            
            <div className={cn("flex h-full flex-1 flex-col gap-6 overflow-x-auto rounded-xl bg-card dark:bg-card p-6 border border-border", isRTL ? '!text-right' : '!text-left')} dir={dir}>
                {/* Header */}
                <div className={cn("flex items-center justify-between border-b pb-4", flexDirection)}>
                    <div className={cn(isRTL ? '!text-right' : '!text-left')}>
                        <h1 className={cn("text-3xl font-bold text-foreground", isRTL ? '!text-right' : '!text-left')}>{t('treatment_weekly_hours')}</h1>
                        <p className={cn("text-muted-foreground mt-1", isRTL ? '!text-right' : '!text-left')}>{t('manage_treatment_weekly_schedules')}</p>
                    </div>
                </div>
                
                {treatments.total === 0 ? (
                    <div className={cn("flex flex-col items-center justify-center py-12 px-4", isRTL ? '!text-right' : '!text-left')} dir={dir}>
                        <div className={cn("rounded-full bg-muted p-4 mb-4", flexDirection)} dir={dir}>
                            <Clock className={cn("h-8 w-8 text-muted-foreground", iconMargin('md'))} />
                        </div>
                        <h3 className={cn("text-lg font-semibold mb-2", isRTL ? '!text-right' : '!text-left')} dir={dir}>{t('no_treatment_schedules')}</h3>
                        <p className={cn("text-muted-foreground mb-6 max-w-md text-center", isRTL ? '!text-right' : '!text-left')} dir={dir}>
                            {t('treatment_schedules_empty_message')}
                        </p>
                        <Link href="/dashboard/treatment-weekly-hours/create">
                            <Button size="lg" className={cn("flex items-center gap-2", flexDirection)} dir={dir}>
                                <Plus className={cn("h-5 w-5", iconMargin('md'))} />
                                {t('create_weekly_schedule')}
                            </Button>
                        </Link>
                    </div>
                ) : (
                    <>
                        {/* Pagination Info and Show Filters Button */}
                        <div className={cn("flex items-center justify-between", flexDirection)}>
                            <div className={cn("flex items-center gap-2", flexDirection)} dir={dir}>
                                <span className={cn("text-sm text-foreground", isRTL ? '!text-right' : '!text-left')} dir={dir}>
                                    {t('showing')} {((treatments.current_page - 1) * treatments.per_page) + 1} {t('of')} {treatments.total} {t('results')}
                                </span>
                                <Select value={treatments.per_page.toString()} onValueChange={(value) => handlePerPageChange(Number(value))}>
                                    <SelectTrigger className={cn("w-20", isRTL ? '!text-right' : '!text-left')} dir={dir}>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent dir={dir}>
                                        <SelectItem value="10" dir={dir}>10</SelectItem>
                                        <SelectItem value="15" dir={dir}>15</SelectItem>
                                        <SelectItem value="25" dir={dir}>25</SelectItem>
                                        <SelectItem value="50" dir={dir}>50</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            
                            <div className={cn("flex items-center gap-2", flexDirection)} dir={dir}>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setShowFilters(!showFilters)}
                                    className={cn("flex items-center gap-2", flexDirection)}
                                    dir={dir}
                                >
                                    <Filter className={cn("h-4 w-4", iconMargin('sm'))} />
                                    {showFilters ? t('hide_filters') : t('show_filters')}
                                    {getActiveFilters().length > 0 && (
                                        <span className={cn("px-1.5 py-0.5 text-xs bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-300 rounded-full", iconMargin('sm'))} dir={dir}>
                                            {getActiveFilters().length}
                                        </span>
                                    )}
                                </Button>
                                <Link href="/dashboard/treatment-weekly-hours/create">
                                    <Button size="sm" className={cn("flex items-center gap-2", flexDirection)} dir={dir}>
                                        <Plus className={cn("h-4 w-4", iconMargin('sm'))} />
                                        {t('create_weekly_schedule')}
                                    </Button>
                                </Link>
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
                                    placeholder={t('search_treatments_or_clinics')}
                                />
                                <SelectFilter
                                    id="clinic_id"
                                    label={t('clinic')}
                                    value={filters.clinic_id}
                                    onChange={(value) => setFilters(prev => ({ ...prev, clinic_id: value }))}
                                    options={clinicOptions}
                                    placeholder={t('all_clinics')}
                                />
                            </CollapsibleFilters>
                        )}

                        {/* Data Table */}
                        <DataTable
                            data={optimisticTreatments}
                            columns={columns}
                            total={treatments.total}
                            currentPage={treatments.current_page}
                            perPage={treatments.per_page}
                            onPageChange={handlePageChange}
                            onPerPageChange={handlePerPageChange}
                            locale={locale}
                        />
                    </>
                )}
            </div>

            <ConfirmationDialog
                open={deleteDialog.open}
                onOpenChange={(open) => setDeleteDialog({ open, clinicId: null, treatmentId: null })}
                onConfirm={handleDelete}
                title={t('delete_treatment_schedule')}
                description={t('delete_treatment_schedule_confirmation')}
                variant="danger"
                confirmText={t('delete')}
            />
        </AppLayout>
    );
}
