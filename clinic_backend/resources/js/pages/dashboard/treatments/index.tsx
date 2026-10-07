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
import { Plus, Eye, Edit, Trash2, Filter, CheckCircle, XCircle } from 'lucide-react';
import { useState, useEffect, useCallback } from 'react';
import { customToast } from '@/components/ui/custom-toast';
import { index as dashboard } from '@/routes/dashboard';
import { type BreadcrumbItem } from '@/types';
import { formatHumanDate } from '@/utils/date-utils';
import { getLocalizedName } from '@/utils/localization';
import { cn } from '@/lib/utils';
import { UserCard } from '@/components/user-card';
import { ClinicCard } from '@/components/clinic-card';

interface Treatment {
    id: number;
    name_en: string;
    name_ar: string;
    description_en?: string;
    description_ar?: string;
    clinic?: { 
        id: number; 
        name_en: string; 
        name_ar: string;
        email?: string;
        phone?: string;
        logo?: string | null;
        status?: string;
        owner?: {
            id: number;
            name: string;
            email?: string;
            phone?: string;
        };
    };
    category?: { id: number; name_en: string; name_ar: string };
    status: 'pending' | 'approved' | 'rejected';
    is_featured: boolean;
    base_price: string;
    final_price?: string;
    currency?: string;
    has_discount?: boolean;
    discount_type?: string;
    discount_value?: string;
    service_duration_minutes?: number;
    sessions_required?: number;
    max_sessions?: number;
    sessions_interval_days?: number;
    estimated_recovery_days?: number;
    requires_consultation?: boolean;
    requires_medical_clearance?: boolean;
    min_age?: number;
    max_age?: number;
    gender_restriction?: string;
    average_rating?: number;
    total_reviews?: number;
    total_bookings?: number;
    bookings_count?: number;
    reviews_count?: number;
    created_at: string;
    updated_at?: string;
    machines?: Array<{ id: number; model_en?: string; model_ar?: string; manufacturer_en?: string; manufacturer_ar?: string }>;
    addOns?: Array<{ id: number; name_en?: string; name_ar?: string; price: string }>;
    media?: Array<{ id: number; file_name?: string; url?: string }>;
}

interface TreatmentsPageProps {
    treatments: {
        data: Treatment[];
        current_page: number;
        last_page: number;
        per_page: number;
        total: number;
    };
    filters: {
        search?: string;
        status?: string;
        created_from?: string;
        created_to?: string;
    };
    canApproveReject?: boolean;
}

export default function TreatmentsIndex({ treatments, filters: initialFilters, canApproveReject = false }: TreatmentsPageProps) {
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
        { title: t('dashboard'), href: dashboard.url() },
        { title: t('treatments_management'), href: '/dashboard/treatments' },
    ];
    const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; treatmentId: number | null }>({ 
        open: false, 
        treatmentId: null 
    });
    const [optimisticTreatments, setOptimisticTreatments] = useState(treatments.data);
    const [showFilters, setShowFilters] = useState(false);
    const [isInitialLoad, setIsInitialLoad] = useState(true);

    const [filters, setFilters] = useState({
        search: initialFilters?.search || '',
        status: initialFilters?.status || 'all',
        created_from: initialFilters?.created_from || '',
        created_to: initialFilters?.created_to || '',
    });

    const applyFiltersToBackend = useCallback((filtersToApply: typeof filters) => {
        router.get('/dashboard/treatments', {
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
    }, [filters, isInitialLoad, applyFiltersToBackend]);

    const statusOptions: SelectOption[] = [
        { value: 'all', label: t('all') },
        { value: 'pending', label: t('pending') },
        { value: 'approved', label: t('approved') },
        { value: 'rejected', label: t('rejected') },
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

    const handleApprove = (treatmentId: number) => {
        router.patch(`/dashboard/treatments/${treatmentId}/toggle-status`, {
            status: 'approved',
        }, {
            preserveScroll: true,
            onSuccess: () => {
                customToast.success(t('treatment_updated_successfully'));
                setOptimisticTreatments(prev => prev.map(t => 
                    t.id === treatmentId ? { ...t, status: 'approved' as const } : t
                ));
            },
            onError: () => {
                customToast.error(t('update_failed'));
            },
        });
    };

    const handleReject = (treatmentId: number) => {
        router.patch(`/dashboard/treatments/${treatmentId}/toggle-status`, {
            status: 'rejected',
        }, {
            preserveScroll: true,
            onSuccess: () => {
                customToast.success(t('treatment_updated_successfully'));
                setOptimisticTreatments(prev => prev.map(t => 
                    t.id === treatmentId ? { ...t, status: 'rejected' as const } : t
                ));
            },
            onError: () => {
                customToast.error(t('update_failed'));
            },
        });
    };

    const allColumns = [
        {
            key: 'treatment',
            label: t('treatment'),
            render: (_: unknown, treatment: Treatment) => (
                <div className={cn("space-y-1", isRTL ? '!text-right' : '!text-left')}>
                    <div className={cn("flex items-center gap-2", flexDirection)}>
                        {treatment.media && treatment.media.length > 0 && (
                            <img 
                                src={treatment.media[0].file_name || treatment.media[0].url || ''} 
                                alt={getLocalizedName(treatment.name_en, treatment.name_ar, locale)}
                                className="w-10 h-10 rounded object-cover"
                            />
                        )}
                        <div className={cn("flex flex-col gap-1", isRTL ? '!text-right' : '!text-left')}>
                            <span className={cn("font-medium", isRTL ? '!text-right' : '!text-left')} dir={dir}>
                                {getLocalizedName(treatment.name_en, treatment.name_ar, locale)}
                            </span>
                            {/* Category */}
                            {treatment.category && (
                                <span className={cn("text-xs text-muted-foreground", isRTL ? '!text-right' : '!text-left')} dir={dir}>
                                    {getLocalizedName(treatment.category.name_en, treatment.category.name_ar, locale)}
                                </span>
                            )}
                        </div>
                        {treatment.is_featured && (
                            <Badge variant="outline" className={cn("bg-yellow-50 dark:bg-yellow-900/20 text-yellow-800 dark:text-yellow-300 text-xs", flexDirection)}>
                                <span className={cn(isRTL ? '!text-right' : '!text-left')} dir={dir}>{t('featured')}</span>
                            </Badge>
                        )}
                    </div>
                </div>
            ),
        },
        {
            key: 'clinic',
            label: t('clinic'),
            render: (_: unknown, treatment: Treatment) => (
                <div className="p-2">
                    {treatment.clinic ? (
                        <>
                            <div
                                className="cursor-pointer"
                                onClick={() => router.visit(`/dashboard/clinics/${treatment.clinic.id}`)}
                            >
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
                            </div>
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
                                "text-muted-foreground text-sm",
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
            key: 'pricing',
            label: t('pricing'),
            render: (_: unknown, treatment: Treatment) => (
                <div className={cn("space-y-1", isRTL ? '!text-right' : '!text-left')}>
                    <div className={cn("text-sm", isRTL ? '!text-right' : '!text-left')} dir="ltr">
                        <span className={cn("text-muted-foreground", isRTL ? '!text-right' : '!text-left')} dir={dir}>{t('base_price')}: </span>
                        <span className="font-medium">{treatment.base_price} {treatment.currency || 'KWD'}</span>
                    </div>
                    {treatment.has_discount && treatment.final_price && treatment.final_price !== treatment.base_price && (
                        <div className={cn("text-sm", isRTL ? '!text-right' : '!text-left')} dir="ltr">
                            <span className={cn("text-muted-foreground", isRTL ? '!text-right' : '!text-left')} dir={dir}>{t('final_price')}: </span>
                            <span className="font-medium text-green-600 dark:text-green-400">
                                {treatment.final_price} {treatment.currency || 'KWD'}
                            </span>
                            {treatment.discount_value && (
                                <span className={cn("text-xs text-muted-foreground", isRTL ? 'mr-1' : 'ml-1')} dir={dir}>
                                    ({treatment.discount_type === 'percentage' ? `${treatment.discount_value}%` : `${treatment.discount_value} ${treatment.currency || 'KWD'}`} {t('off')})
                                </span>
                            )}
                        </div>
                    )}
                </div>
            ),
        },
        {
            key: 'sessions_duration',
            label: t('sessions_duration'),
            render: (_: unknown, treatment: Treatment) => (
                <div className={cn("space-y-1 text-sm", isRTL ? '!text-right' : '!text-left')}>
                    {treatment.service_duration_minutes && (
                        <div className={cn(isRTL ? '!text-right' : '!text-left')} dir="ltr">
                            <span className={cn("text-muted-foreground", isRTL ? '!text-right' : '!text-left')} dir={dir}>{t('duration')}: </span>
                            <span>{treatment.service_duration_minutes} {t('minutes')}</span>
                        </div>
                    )}
                    {treatment.sessions_required && (
                        <div className={cn(isRTL ? '!text-right' : '!text-left')} dir="ltr">
                            <span className={cn("text-muted-foreground", isRTL ? '!text-right' : '!text-left')} dir={dir}>{t('sessions')}: </span>
                            <span>{treatment.sessions_required}
                                {treatment.max_sessions && treatment.max_sessions !== treatment.sessions_required ? `-${treatment.max_sessions}` : ''}
                            </span>
                        </div>
                    )}
                    {treatment.estimated_recovery_days && (
                        <div className={cn(isRTL ? '!text-right' : '!text-left')} dir="ltr">
                            <span className={cn("text-muted-foreground", isRTL ? '!text-right' : '!text-left')} dir={dir}>{t('recovery')}: </span>
                            <span>{treatment.estimated_recovery_days} {t('days')}</span>
                        </div>
                    )}
                </div>
            ),
        },
        {
            key: 'status',
            label: t('status'),
            render: (_: unknown, treatment: Treatment) => (
                <div className={cn(isRTL ? '!text-right' : '!text-left')}>
                    <Badge 
                        variant={
                            treatment.status === 'approved' ? 'default' : 
                            treatment.status === 'rejected' ? 'destructive' : 'secondary'
                        }
                        className={cn(
                            treatment.status === 'approved' 
                                ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300' 
                                : treatment.status === 'rejected'
                                ? 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300'
                                : 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300',
                            isRTL ? '!text-right' : '!text-left'
                        )}
                    >
                        {t(treatment.status)}
                    </Badge>
                </div>
            ),
        },
        {
            key: 'created_at',
            label: t('created_at'),
            render: (_: unknown, treatment: Treatment) => (
                <div className={cn("text-sm text-muted-foreground", isRTL ? '!text-right' : '!text-left')} dir={dir}>
                    {formatHumanDate(treatment.created_at, t)}
                </div>
            ),
        },
        {
            key: 'actions',
            label: t('actions'),
            render: (_: unknown, treatment: Treatment) => (
                <div className={cn("flex items-center gap-1 w-full", isRTL ? 'justify-start flex-row-reverse' : 'justify-end')}>
                    {!shouldHideStatus && treatment.status !== 'approved' && canApproveReject && can('treatments.approve') && (
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleApprove(treatment.id)}
                            title={t('approve')}
                            className="text-green-600 hover:text-green-700 hover:bg-green-50"
                        >
                            <CheckCircle className="h-4 w-4" />
                        </Button>
                    )}
                    {!shouldHideStatus && treatment.status !== 'rejected' && canApproveReject && can('treatments.reject') && (
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleReject(treatment.id)}
                            title={t('reject')}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                            <XCircle className="h-4 w-4" />
                        </Button>
                    )}
                    {can('treatments.show') && (
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => router.visit(`/dashboard/treatments/${treatment.id}`)}
                            title={t('view')}
                        >
                            <Eye className="h-4 w-4" />
                        </Button>
                    )}
                    {can('treatments.edit') && (
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => router.visit(`/dashboard/treatments/${treatment.id}/edit`)}
                            title={t('edit')}
                        >
                            <Edit className="h-4 w-4" />
                        </Button>
                    )}
                    {can('treatments.destroy') && (
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setDeleteDialog({ open: true, treatmentId: treatment.id })}
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

    // Filter out status column if user has clinic or clinic_manager role
    const columns = shouldHideStatus 
        ? allColumns.filter(col => col.key !== 'status')
        : allColumns;

    const handleDelete = () => {
        if (deleteDialog.treatmentId) {
            const treatment = optimisticTreatments.find(t => t.id === deleteDialog.treatmentId);
            router.delete(`/dashboard/treatments/${deleteDialog.treatmentId}`, {
                onSuccess: () => {
                    customToast.success(t('treatment_deleted_successfully'), treatment?.name_en);
                    setOptimisticTreatments(prev => prev.filter(t => t.id !== deleteDialog.treatmentId));
                },
                onError: () => {
                    customToast.error(t('update_failed'));
                }
            });
        }
    };

    const handlePageChange = (page: number) => {
        router.get('/dashboard/treatments', {
            page,
            per_page: treatments.per_page,
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
        });
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={t('treatments')} />
            
            <div className={cn("flex h-full flex-1 flex-col gap-6 overflow-x-auto rounded-xl bg-card dark:bg-card p-6 border border-border", isRTL ? '!text-right' : '!text-left')} dir={dir}>
                {/* Header */}
                <div className={cn("flex items-center justify-between border-b pb-4", flexDirection)}>
                    <div className={cn(isRTL ? '!text-right' : '!text-left')}>
                        <h1 className={cn("text-3xl font-bold text-foreground", isRTL ? '!text-right' : '!text-left')}>{t('treatments')}</h1>
                        <p className={cn("text-muted-foreground mt-1", isRTL ? '!text-right' : '!text-left')}>{t('manage_treatments')}</p>
                    </div>
                    {can('treatments.create') && (
                        <Link href="/dashboard/treatments/create">
                            <Button className={cn("flex items-center gap-2", flexDirection)}>
                                <Plus className={cn("h-4 w-4", iconMargin('md'))} />
                                {t('add_treatment')}
                            </Button>
                        </Link>
                    )}
                </div>

                <div className={cn("flex items-center justify-between", flexDirection)}>
                    <div className={cn("flex items-center gap-2", flexDirection)}>
                        <span className={cn("text-sm text-foreground", isRTL ? '!text-right' : '!text-left')}>
                            {t('showing')} {((treatments.current_page - 1) * treatments.per_page) + 1} {t('of')} {treatments.total} {t('results')}
                        </span>
                        <Select value={treatments.per_page.toString()} onValueChange={(value) => handlePerPageChange(Number(value))}>
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
            </div>

            <ConfirmationDialog
                open={deleteDialog.open}
                onOpenChange={(open) => setDeleteDialog({ open, treatmentId: null })}
                onConfirm={handleDelete}
                title={t('delete_treatment')}
                description={t('delete_treatment_confirmation')}
                variant="danger"
                confirmText={t('delete')}
            />
        </AppLayout>
    );
}

