import { DataTable } from '@/components/data-table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { UserCard } from '@/components/user-card';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
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
import { useTranslation } from '@/hooks/use-translation';
import { useRTL } from '@/hooks/use-rtl';
import { useRTLInit } from '@/hooks/use-rtl-init';
import { usePermissions } from '@/hooks/use-permissions';
import { usePage } from '@inertiajs/react';
import { Head, Link, router } from '@inertiajs/react';
import { Plus, Eye, Edit, Trash2, Filter, Check, X, Clock } from 'lucide-react';
import { useState, useEffect, useCallback } from 'react';
import { customToast } from '@/components/ui/custom-toast';
import { index as dashboard } from '@/routes/dashboard';
import { type BreadcrumbItem } from '@/types';
import { formatHumanDate } from '@/utils/date-utils';
import { getLocalizedCompanyName } from '@/utils/localization';
import { ClinicCard } from '@/components/clinic-card';
import { cn } from '@/lib/utils';
import { type SharedData } from '@/types';

interface Clinic {
    id: number;
    company_name_en: string;
    company_name_ar: string;
    verification_status: 'pending' | 'approved' | 'rejected';
    rejection_reason?: string | null;
    created_at: string;
    is_featured?: boolean;
    auto_confirm_bookings?: boolean;
    logo?: string | null;
    email?: string;
    phone?: string;
    owner?: {
        id: number;
        name: string;
        email: string;
        phone: string;
        status?: string;
    } | null;
    area?: {
        id: number;
        name_en: string;
        name_ar: string;
    } | null;
    office_hours?: Array<{
        id: number;
        day_of_week: string;
        opening_time: string;
        closing_time: string;
        is_closed: boolean;
    }>;
}

interface ClinicsPageProps {
    clinics: {
        data: Clinic[];
        current_page: number;
        last_page: number;
        per_page: number;
        total: number;
    };
    filters: {
        search?: string;
        verification_status?: string;
        created_from?: string;
        created_to?: string;
    };
    canApproveReject?: boolean;
    canToggleOwnerStatus?: boolean;
}

// Breadcrumbs will be set inside component to use translation

export default function ClinicsIndex({ clinics, filters: initialFilters, canApproveReject = false, canToggleOwnerStatus = false }: ClinicsPageProps) {
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
            title: t('clinics_management'),
            href: '/dashboard/clinics',
        },
    ];
    const [activeTab, setActiveTab] = useState<string>('all');
    const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; clinicId: number | null }>({ open: false, clinicId: null });
    const [approveDialog, setApproveDialog] = useState<{ open: boolean; clinicId: number | null }>({ open: false, clinicId: null });
    const [rejectDialog, setRejectDialog] = useState<{ open: boolean; clinicId: number | null; reason: string }>({ open: false, clinicId: null, reason: '' });
    const [optimisticClinics, setOptimisticClinics] = useState(clinics.data);
    const [showFilters, setShowFilters] = useState(false);
    const [isInitialLoad, setIsInitialLoad] = useState(true);

    // Filter states
    const [filters, setFilters] = useState({
        search: initialFilters?.search || '',
        verification_status: initialFilters?.verification_status || 'all',
        created_from: initialFilters?.created_from || '',
        created_to: initialFilters?.created_to || '',
    });

    const applyFiltersToBackend = useCallback((filtersToApply: typeof filters) => {
        router.get('/dashboard/clinics', {
            page: 1,
            search: filtersToApply.search || undefined,
            filters: {
                verification_status: filtersToApply.verification_status && filtersToApply.verification_status !== 'all' ? filtersToApply.verification_status : undefined,
                created_from: filtersToApply.created_from || undefined,
                created_to: filtersToApply.created_to || undefined,
            },
        }, { preserveState: true, preserveScroll: true });
    }, []);

    useEffect(() => {
        setOptimisticClinics(clinics.data);
    }, [clinics.data]);

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

    // Check for tab parameter from URL (used when redirecting after approve/reject)
    useEffect(() => {
        if (typeof window !== 'undefined') {
            const urlParams = new URLSearchParams(window.location.search);
            const tabParam = urlParams.get('tab');
            if (tabParam && ['all', 'pending', 'approved', 'rejected'].includes(tabParam)) {
                // Switch tab without updating filters (skipFilterUpdate = true)
                handleTabChange(tabParam, true);
                // Remove tab parameter from URL without triggering filter
                urlParams.delete('tab');
                const newUrl = window.location.pathname + (urlParams.toString() ? '?' + urlParams.toString() : '');
                window.history.replaceState({}, '', newUrl);
                return;
            }
        }

        // Fallback to initialFilters if no tab parameter
        if (initialFilters?.verification_status) {
            setActiveTab(initialFilters.verification_status);
        } else {
            setActiveTab('all');
        }
    }, [initialFilters?.verification_status]);

    const verificationStatusOptions: SelectOption[] = [
        { value: 'all', label: t('all') },
        { value: 'pending', label: t('pending') },
        { value: 'approved', label: t('approved') },
        { value: 'rejected', label: t('rejected') },
    ];

    const handleTabChange = (tab: string, skipFilterUpdate = false) => {
        setActiveTab(tab);

        // Only update filters if not skipping (i.e., user manually changed tab)
        if (!skipFilterUpdate) {
        const newFilters = { ...filters };

        if (tab === 'all') {
            newFilters.verification_status = 'all';
        } else {
            newFilters.verification_status = tab;
        }

        setFilters(newFilters);
        }
    };

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

        if (filters.verification_status && filters.verification_status !== 'all') {
            const option = verificationStatusOptions.find(o => o.value === filters.verification_status);
            active.push({
                key: 'verification_status',
                label: t('verification_status'),
                value: filters.verification_status,
                displayValue: option?.label || filters.verification_status,
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
        } else if (key === 'verification_status') {
            newFilters.verification_status = 'all';
        } else {
            newFilters[key as keyof typeof filters] = '';
        }

        setFilters(newFilters);
    };

    const handleClearAllFilters = () => {
        const clearedFilters = {
            search: '',
            verification_status: 'all',
            created_from: '',
            created_to: '',
        };
        setFilters(clearedFilters);
    };

    const handleToggleFeatured = (clinicId: number, isFeatured: boolean) => {
        // Optimistic update
        setOptimisticClinics(prev => prev.map(c =>
            c.id === clinicId ? { ...c, is_featured: isFeatured } : c
        ));

        router.patch(`/dashboard/clinics/${clinicId}/toggle-featured`, {
            is_featured: isFeatured,
        }, {
            preserveState: true,
            preserveScroll: true,
            onSuccess: () => {
                customToast.success(
                    isFeatured
                        ? t('clinic_featured_successfully')
                        : t('clinic_unfeatured_successfully')
                );
            },
            onError: () => {
                // Revert optimistic update on error
                setOptimisticClinics(prev => prev.map(c =>
                    c.id === clinicId ? { ...c, is_featured: !isFeatured } : c
                ));
                customToast.error(t('update_failed'));
            },
        });
    };

    const handleToggleAutoConfirm = (clinicId: number, autoConfirm: boolean) => {
        // Optimistic update
        setOptimisticClinics(prev => prev.map(c =>
            c.id === clinicId ? { ...c, auto_confirm_bookings: autoConfirm } : c
        ));

        router.patch(`/dashboard/clinics/${clinicId}/toggle-auto-confirm`, {
            auto_confirm_bookings: autoConfirm,
        }, {
            preserveState: true,
            preserveScroll: true,
            onSuccess: () => {
                customToast.success(
                    autoConfirm
                        ? t('auto_confirm_enabled')
                        : t('auto_confirm_disabled')
                );
            },
            onError: () => {
                // Revert optimistic update on error
                setOptimisticClinics(prev => prev.map(c =>
                    c.id === clinicId ? { ...c, auto_confirm_bookings: !autoConfirm } : c
                ));
                customToast.error(t('update_failed'));
            },
        });
    };

    const columns = [
        {
            key: 'clinic',
            label: t('clinic'),
            render: (_: unknown, clinic: Clinic) => (
                <div className={cn("p-2", isRTL ? '!text-right' : '!text-left')} dir={dir}>
                    {clinic ? (
                        <>
                            <ClinicCard
                                clinic={{
                                    id: clinic.id,
                                    company_name_en: clinic.company_name_en,
                                    company_name_ar: clinic.company_name_ar,
                                    email: clinic.email,
                                    phone: clinic.phone,
                                    logo: clinic.logo,
                                }}
                                locale={locale}
                                variant="default"
                            />
                            {clinic.owner && (
                                <div className="mt-2" dir={dir}>
                                    <UserCard 
                                        user={{
                                            id: clinic.owner.id,
                                            name: clinic.owner.name,
                                            email: clinic.owner.email || '',
                                            phone: clinic.owner.phone || '',
                                            email_verified_at: null,
                                            phone_verified_at: null,
                                        }} 
                                        variant="compact"
                                        showVerificationBadges={false}
                                    />
                                </div>
                            )}
                        </>
                    ) : (
                        <span className={cn("text-muted-foreground", isRTL ? '!text-right' : '!text-left')} dir={dir}>{t('n_a')}</span>
                    )}
                </div>
            ),
        },
        // Only show owner_status column if user has permission
        ...(canToggleOwnerStatus ? [{
            key: 'owner_status',
            label: t('owner_status'),
            render: (_: unknown, clinic: Clinic) => {
                if (!clinic.owner) {
                    return (
                        <div className={cn("p-2", isRTL ? '!text-right' : '!text-left')} dir={dir}>
                            <span className={cn("text-muted-foreground text-sm", isRTL ? '!text-right' : '!text-left')} dir={dir}>{t('n_a')}</span>
                        </div>
                    );
                }
                const ownerStatus = clinic.owner.status || 'active';
                return (
                    <div className={cn("p-2", isRTL ? '!text-right' : '!text-left')} dir={dir}>
                        <Switch
                            checked={ownerStatus === 'active'}
                            onCheckedChange={(checked) => {
                                const newStatus = checked ? 'active' : 'inactive';
                                router.patch(`/dashboard/users/${clinic.owner!.id}/toggle-status`, {
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
                );
            },
        }] : []),
        {
            key: 'verification_status',
            label: t('verification_status'),
            render: (_: unknown, clinic: Clinic) => {
                const verificationStatus = clinic.verification_status || 'pending';
                let className = '';
                let variant: 'default' | 'secondary' | 'destructive' = 'secondary';

                if (verificationStatus === 'approved') {
                    variant = 'default';
                    className = 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 border-green-200 dark:border-green-800 hover:bg-green-200 dark:hover:bg-green-800/40 hover:text-green-900 dark:hover:text-green-200';
                } else if (verificationStatus === 'pending') {
                    variant = 'secondary';
                    className = 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300 border-yellow-200 dark:border-yellow-800 hover:bg-yellow-200 dark:hover:bg-yellow-800/40 hover:text-yellow-900 dark:hover:text-yellow-200';
                } else if (verificationStatus === 'rejected') {
                    variant = 'destructive';
                    className = 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300 border-red-200 dark:border-red-800 hover:bg-red-200 dark:hover:bg-red-800/40 hover:text-red-900 dark:hover:text-red-200';
                }

                return (
                    <div className={cn("p-2", isRTL ? '!text-right' : '!text-left')} dir={dir}>
                        <div className={cn("flex items-center gap-2", flexDirection)} dir={dir}>
                            <Badge variant={variant} className={cn(className, isRTL ? '!text-right' : '!text-left')} dir={dir}>
                                {t(verificationStatus)}
                            </Badge>
                            {verificationStatus === 'pending' && canApproveReject && (
                                <div className={cn("flex items-center gap-1", flexDirection)} dir={dir}>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => setApproveDialog({ open: true, clinicId: clinic.id })}
                                        title={t('approve')}
                                        aria-label={t('approve')}
                                        className={cn("h-7 px-2 text-green-600 dark:text-green-400 hover:text-green-700 dark:hover:text-green-300 hover:bg-green-50 dark:hover:bg-green-900/20", flexDirection)}
                                        dir={dir}
                                    >
                                        <Check className={cn("h-3 w-3", iconMargin('sm'))} />
                                        <span className="text-xs">{t('approve')}</span>
                                    </Button>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => setRejectDialog({ open: true, clinicId: clinic.id, reason: '' })}
                                        title={t('reject')}
                                        aria-label={t('reject')}
                                        className={cn("h-7 px-2 text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-900/20", flexDirection)}
                                        dir={dir}
                                    >
                                        <X className={cn("h-3 w-3", iconMargin('sm'))} />
                                        <span className="text-xs">{t('reject')}</span>
                                    </Button>
                                </div>
                            )}
                        </div>
                    </div>
                );
            },
        },
        {
            key: 'office_hours',
            label: t('office_hours'),
            render: (_: unknown, clinic: Clinic) => {
                if (!clinic.office_hours || clinic.office_hours.length === 0) {
                    return (
                        <div className={cn("p-2", isRTL ? '!text-right' : '!text-left')} dir={dir}>
                            <span className={cn("text-muted-foreground text-sm", isRTL ? '!text-right' : '!text-left')} dir={dir}>{t('not_set')}</span>
                        </div>
                    );
                }
                const openDays = clinic.office_hours.filter(oh => !oh.is_closed && oh.opening_time && oh.closing_time).length;
                if (openDays === 0) {
                    return (
                        <div className={cn("p-2", isRTL ? '!text-right' : '!text-left')} dir={dir}>
                            <span className={cn("text-muted-foreground text-sm", isRTL ? '!text-right' : '!text-left')} dir={dir}>{t('not_set')}</span>
                        </div>
                    );
                }
                return (
                    <div className={cn("p-2", isRTL ? '!text-right' : '!text-left')} dir={dir}>
                        <div className={cn("flex items-center gap-2", flexDirection)} dir={dir}>
                            <Clock className={cn("h-4 w-4 text-muted-foreground", iconMargin('sm'))} />
                            <span className={cn("text-sm text-foreground", isRTL ? '!text-right' : '!text-left')} dir={dir}>{openDays} {t('days_open')}</span>
                        </div>
                    </div>
                );
            },
        },
        {
            key: 'is_featured',
            label: t('is_featured'),
            render: (_: unknown, clinic: Clinic) => {
                const canToggleFeatured = can('clinics.toggle-featured');

                if (!canToggleFeatured) {
                    const isFeatured = clinic.is_featured ?? false;
                    return (
                        <div className={cn("p-2", isRTL ? '!text-right' : '!text-left')} dir={dir}>
                            <Badge variant={isFeatured ? 'default' : 'secondary'} className={cn(isRTL ? '!text-right' : '!text-left')} dir={dir}>
                                {isFeatured ? t('yes') : t('no')}
                            </Badge>
                        </div>
                    );
                }

                const isFeatured = clinic.is_featured ?? false;
                return (
                    <div className={cn("p-2", isRTL ? '!text-right' : '!text-left')} dir={dir}>
                        <Switch
                            checked={isFeatured}
                            onCheckedChange={(checked) => handleToggleFeatured(clinic.id, checked)}
                            disabled={false}
                        />
                    </div>
                );
            },
        },
        {
            key: 'auto_confirm_bookings',
            label: t('auto_confirm_bookings'),
            render: (_: unknown, clinic: Clinic) => {
                const canToggleAutoConfirm = can('clinics.toggle-auto-confirm');
                const autoConfirm = clinic.auto_confirm_bookings ?? false;

                if (!canToggleAutoConfirm) {
                    return (
                        <div className={cn("p-2", isRTL ? '!text-right' : '!text-left')} dir={dir}>
                            <Badge variant={autoConfirm ? 'default' : 'secondary'} className={cn(isRTL ? '!text-right' : '!text-left')} dir={dir}>
                                {autoConfirm ? t('yes') : t('no')}
                            </Badge>
                        </div>
                    );
                }

                return (
                    <div className={cn("p-2", isRTL ? '!text-right' : '!text-left')} dir={dir}>
                        <Switch
                            checked={autoConfirm}
                            onCheckedChange={(checked) => handleToggleAutoConfirm(clinic.id, checked)}
                            disabled={false}
                        />
                    </div>
                );
            },
        },
        {
            key: 'created_at',
            label: t('created_at'),
            render: (date: string) => (
                <div className={cn("p-2", isRTL ? '!text-right' : '!text-left')} dir={dir}>
                    <span className={cn(isRTL ? '!text-right' : '!text-left')} dir={dir}>
                        {formatHumanDate(date, t)}
                    </span>
                </div>
            ),
        },
        {
            key: 'actions',
            label: t('actions'),
            render: (_: unknown, clinic: Clinic) => (
                <div className={cn("flex items-center gap-1 w-full", isRTL ? 'justify-start flex-row-reverse' : 'justify-end')} dir={dir}>
                    {can('clinics.show') && (
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => router.visit(`/dashboard/clinics/${clinic.id}`)}
                            title={t('view')}
                            aria-label={t('view')}
                            dir={dir}
                        >
                            <Eye className="h-4 w-4" />
                        </Button>
                    )}
                    {can('clinics.edit') && (
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => router.visit(`/dashboard/clinics/${clinic.id}/edit`)}
                            title={t('edit')}
                            aria-label={t('edit')}
                            dir={dir}
                        >
                            <Edit className="h-4 w-4" />
                        </Button>
                    )}
                    {can('clinics.destroy') && (
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setDeleteDialog({ open: true, clinicId: clinic.id })}
                            title={t('delete')}
                            aria-label={t('delete')}
                            className="text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-900/20"
                            dir={dir}
                        >
                            <Trash2 className="h-4 w-4" />
                        </Button>
                    )}
                </div>
            ),
        },
    ];

    const handleDelete = () => {
        if (deleteDialog.clinicId) {
            const clinic = optimisticClinics.find(c => c.id === deleteDialog.clinicId);
            router.delete(`/dashboard/clinics/${deleteDialog.clinicId}`, {
                onSuccess: () => {
                    customToast.success(t('clinic_deleted_successfully'), clinic?.company_name_en);
                    setOptimisticClinics(prev => prev.filter(c => c.id !== deleteDialog.clinicId));
                },
                onError: () => {
                    customToast.error(t('update_failed'));
                }
            });
        }
    };

    const handlePageChange = (page: number) => {
        router.get('/dashboard/clinics', {
            page,
            per_page: clinics.per_page,
            search: filters.search || undefined,
            filters: {
                verification_status: filters.verification_status && filters.verification_status !== 'all' ? filters.verification_status : undefined,
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
            preserveState: true,
            preserveScroll: true,
        });
    };

    const handleApprove = () => {
        if (approveDialog.clinicId) {
            // Optimistic update
            setOptimisticClinics(prev => prev.map(c =>
                c.id === approveDialog.clinicId
                    ? { ...c, verification_status: 'approved' as const }
                    : c
            ));

            router.patch(`/dashboard/clinics/${approveDialog.clinicId}/approve`, {}, {
                preserveState: true,
                preserveScroll: true,
                onSuccess: () => {
                    setApproveDialog({ open: false, clinicId: null });
                    customToast.success(t('clinic_approved_successfully'));
                    // Reload to get fresh data
                    router.reload({ only: ['clinics'], preserveScroll: true });
                },
                onError: () => {
                    // Revert optimistic update
                    router.reload({ only: ['clinics'], preserveScroll: true });
                    customToast.error(t('failed_to_approve_clinic'));
                }
            });
        }
    };

    const handleReject = () => {
        if (rejectDialog.clinicId && rejectDialog.reason.trim()) {
            // Optimistic update
            setOptimisticClinics(prev => prev.map(c =>
                c.id === rejectDialog.clinicId
                    ? { ...c, verification_status: 'rejected' as const }
                    : c
            ));

            router.patch(`/dashboard/clinics/${rejectDialog.clinicId}/reject`, {
                rejection_reason: rejectDialog.reason.trim()
            }, {
                preserveState: true,
                preserveScroll: true,
                onSuccess: () => {
                    setRejectDialog({ open: false, clinicId: null, reason: '' });
                    customToast.success(t('clinic_rejected_successfully'));
                    // Reload to get fresh data
                    router.reload({ only: ['clinics'], preserveScroll: true });
                },
                onError: () => {
                    // Revert optimistic update
                    router.reload({ only: ['clinics'], preserveScroll: true });
                    customToast.error(t('failed_to_reject_clinic'));
                }
            });
        } else if (!rejectDialog.reason.trim()) {
            customToast.error(t('rejection_reason_required'));
        }
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={t('clinics_management')} />

            <div className={cn("flex h-full flex-1 flex-col gap-6 overflow-x-auto rounded-xl bg-card dark:bg-card p-6 border border-border", isRTL ? '!text-right' : '!text-left')} dir={dir}>
                {/* Header */}
                <div className={cn("flex items-center justify-between border-b pb-4", flexDirection)} dir={dir}>
                    <div className={cn(isRTL ? '!text-right' : '!text-left')} dir={dir}>
                        <h1 className={cn("text-3xl font-bold text-foreground", isRTL ? '!text-right' : '!text-left')} dir={dir}>{t('clinics_management')}</h1>
                        <p className={cn("text-muted-foreground mt-1", isRTL ? '!text-right' : '!text-left')} dir={dir}>{t('manage_clinic_accounts')}</p>
                    </div>
                    {can('clinics.create') && (
                        <Link href="/dashboard/clinics/create">
                            <Button className={cn("flex items-center gap-2", flexDirection)} dir={dir}>
                                <Plus className={cn("h-4 w-4", iconMargin('md'))} />
                                {t('add_branch')}
                            </Button>
                        </Link>
                    )}
                </div>

                {/* Tabs for filtering by verification status */}
                <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
                    <TabsList className={cn("grid w-full grid-cols-4", flexDirection)}>
                        <TabsTrigger value="all" className={cn(isRTL ? '!text-right' : '!text-left')}>{t('all')}</TabsTrigger>
                        <TabsTrigger value="approved" className={cn(isRTL ? '!text-right' : '!text-left')}>{t('approved')}</TabsTrigger>
                        <TabsTrigger value="pending" className={cn(isRTL ? '!text-right' : '!text-left')}>{t('pending')}</TabsTrigger>
                        <TabsTrigger value="rejected" className={cn(isRTL ? '!text-right' : '!text-left')}>{t('rejected')}</TabsTrigger>
                    </TabsList>
                </Tabs>

                {/* Pagination Info and Show Filters Button */}
                <div className={cn("flex items-center justify-between", flexDirection)} dir={dir}>
                    <div className={cn("flex items-center gap-2", flexDirection)} dir={dir}>
                        <span className={cn("text-sm text-foreground", isRTL ? '!text-right' : '!text-left')} dir={dir}>
                            {t('showing')} {((clinics.current_page - 1) * clinics.per_page) + 1} {t('of')} {clinics.total} {t('results')}
                        </span>
                        <Select value={clinics.per_page.toString()} onValueChange={(value) => handlePerPageChange(Number(value))}>
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
                            placeholder={t('search_by_clinic_name_or_owner')}
                        />

                        <SelectFilter
                            id="verification_status"
                            label={t('verification_status')}
                            value={filters.verification_status}
                            onChange={(value) => setFilters(prev => ({ ...prev, verification_status: value }))}
                            options={verificationStatusOptions}
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
                    data={optimisticClinics}
                    columns={columns}
                    total={clinics.total}
                    currentPage={clinics.current_page}
                    perPage={clinics.per_page}
                    onPageChange={handlePageChange}
                    onPerPageChange={handlePerPageChange}
                    locale={locale}
                />
            </div>

            {/* Delete Dialog */}
            <ConfirmationDialog
                open={deleteDialog.open}
                onOpenChange={(open) => setDeleteDialog({ open, clinicId: null })}
                onConfirm={handleDelete}
                title={t('delete_clinic')}
                description={t('delete_clinic_confirmation')}
                variant="danger"
                confirmText={t('delete')}
            />

            {/* Approve Dialog */}
            <ConfirmationDialog
                open={approveDialog.open}
                onOpenChange={(open) => setApproveDialog({ open, clinicId: null })}
                onConfirm={handleApprove}
                title={t('approve_clinic')}
                description={t('approve_clinic_confirmation')}
                variant="success"
                confirmText={t('approve')}
            />

            {/* Reject Dialog */}
            <ConfirmationDialog
                open={rejectDialog.open}
                onOpenChange={(open) => setRejectDialog({ open, clinicId: null, reason: '' })}
                onConfirm={handleReject}
                title={t('reject_clinic')}
                description={t('reject_clinic_confirmation')}
                variant="warning"
                confirmText={t('reject')}
            >
                <div className="mt-4">
                    <label className="block text-sm font-medium text-foreground mb-2">
                        {t('rejection_reason')} <span className="text-red-500">*</span>
                    </label>
                    <textarea
                        value={rejectDialog.reason}
                        onChange={(e) => setRejectDialog(prev => ({ ...prev, reason: e.target.value }))}
                        placeholder={t('enter_rejection_reason')}
                        className="w-full min-h-[100px] px-3 py-2 text-sm border border-input bg-background rounded-md focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                        required
                    />
                </div>
            </ConfirmationDialog>
        </AppLayout>
    );
}

