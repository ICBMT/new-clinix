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
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { UserCard } from '@/components/user-card';
import { ClinicCard } from '@/components/clinic-card';
import { 
    CollapsibleFilters, 
    SearchFieldFilter, 
    SelectFilter,
    DateRangeFilter,
    type ActiveFilter,
    type SelectOption 
} from '@/components/filters';
import { 
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { StatsCard } from '@/components/dashboard/stats-card';
import AppLayout from '@/layouts/app-layout';
import { useRTLInit } from '@/hooks/use-rtl-init';
import { useTranslation } from '@/hooks/use-translation';
import { useRTL } from '@/hooks/use-rtl';
import { usePermissions } from '@/hooks/use-permissions';
import { Head, router, useForm, usePage } from '@inertiajs/react';
import { Eye, Filter, Wallet, TrendingUp, Percent, DollarSign } from 'lucide-react';
import { useState, useEffect, useCallback, useMemo } from 'react';
import { index as dashboard } from '@/routes/dashboard';
import { type BreadcrumbItem } from '@/types';
import { formatHumanDate } from '@/utils/date-utils';
import { getLocalizedName } from '@/utils/localization';
import { customToast } from '@/components/ui/custom-toast';
import { cn } from '@/lib/utils';

interface Earning {
    id: number;
    booking_reference?: string;
    // Optional booking id so we can link to the booking details page
    booking_id?: number;
    clinic?: {
        id: number;
        name_en: string;
        name_ar: string;
        logo?: string | null;
        email?: string;
        phone?: string;
        owner?: {
            id: number;
            name: string;
            email: string;
            phone?: string;
            avatar?: string;
            email_verified_at?: string | null;
            phone_verified_at?: string | null;
        };
    };
    gross_amount: string;
    commission_amount: string;
    commission_rate: string;
    platform_fee: string;
    fixed_charges: string;
    net_amount: string;
    paid_amount?: string | number;
    remaining_amount?: number;
    currency: string;
    status: 'pending' | 'paid';
    created_at: string;
    payout_id?: number;
    // Calculated values from current settings
    calculated_commission_rate?: number;
    calculated_commission_amount?: number;
    calculated_platform_fee?: number;
    calculated_fixed_charges?: number;
    calculated_net_amount?: number;
}

interface EarningsPageProps {
    earnings: {
        data: Earning[];
        current_page: number;
        last_page: number;
        per_page: number;
        total: number;
    };
    stats?: {
        total_pending: number;
        total_paid: number;
        total_commission: number;
        total_platform_fee: number;
        total_fixed_charges: number;
        pending_count: number;
        paid_count: number;
        all_count: number;
        total_gross: number;
    };
    clinics?: Array<{
        id: number;
        name_en: string;
        name_ar: string;
    }>;
    filters?: {
        status?: string;
        clinic_id?: string;
        search?: string;
        created_from?: string;
        created_to?: string;
    };
}

interface GroupedClinic {
    clinic_id: number;
    clinic_name_en: string;
    clinic_name_ar: string;
    owner_name?: string;
    total_net_amount: number;
    total_remaining_amount?: number;
    total_commission: number;
    total_platform_fee: number;
    total_fixed_charges: number;
    total_gross: number;
    earnings_count: number;
    earnings: Array<{
        id: number;
        booking_reference?: string;
        gross_amount: number;
        net_amount: number;
        paid_amount?: number;
        remaining_amount?: number;
        commission_amount: number;
        platform_fee: number;
        fixed_charges: number;
        currency: string;
        created_at: string;
    }>;
}

export default function EarningsIndex({ earnings, stats, clinics, filters: initialFilters }: EarningsPageProps) {
    useRTLInit();
    const { t, locale } = useTranslation();
    const { isRTL, dir, textAlign, flexDirection, iconMargin, getFieldDir, getInputTextAlign } = useRTL();
    const { can } = usePermissions();
    const page = usePage();
    const flash = page.props.flash as { success?: string; error?: string } | undefined;
    
    const breadcrumbs: BreadcrumbItem[] = [
        {
            title: t('dashboard'),
            href: dashboard.url(),
        },
        {
            title: t('earnings_management'),
            href: '/dashboard/earnings',
        },
    ];

    const [activeTab, setActiveTab] = useState<string>(initialFilters?.status || 'all');
    const [optimisticEarnings, setOptimisticEarnings] = useState(earnings?.data || []);
    const [showFilters, setShowFilters] = useState(false);
    const [isInitialLoad, setIsInitialLoad] = useState(true);
    const [showProcessPayoutModal, setShowProcessPayoutModal] = useState(false);
    const [selectedClinic, setSelectedClinic] = useState<GroupedClinic | null>(null);
    const [selectedEarningIds, setSelectedEarningIds] = useState<number[]>([]);
    const [groupedClinics, setGroupedClinics] = useState<GroupedClinic[]>([]);
    const [loadingClinics, setLoadingClinics] = useState(false);

    const [filters, setFilters] = useState({
        search: initialFilters?.search || '',
        status: initialFilters?.status || 'all',
        clinic_id: initialFilters?.clinic_id || 'all',
        created_from: initialFilters?.created_from || '',
        created_to: initialFilters?.created_to || '',
    });

    const payoutForm = useForm({
        payout_reference: '',
        amount: '',
        notes: '',
        earning_ids: [] as number[],
    });

    // Calculate totals based on checked bookings
    const calculatedTotals = useMemo(() => {
        if (!selectedClinic) {
            return {
                totalAmount: 0,
                maxAmount: 0,
                finalTotal: 0,
                isNegative: false,
            };
        }

        // Calculate totals from ALL earnings (not just selected) to get final total
        let totalNetAmount = 0;
        let totalPaidAmount = 0;
        
        selectedClinic.earnings.forEach(earning => {
            const netAmount = earning.net_amount || 0;
            const paidAmount = earning.paid_amount || 0;
            totalNetAmount += netAmount;
            totalPaidAmount += paidAmount;
        });

        // Final total (net - paid) - can be negative
        const finalTotal = totalNetAmount - totalPaidAmount;
        
        // Calculate total remaining from selected earnings only (for payout amount)
        const selectedEarnings = selectedEarningIds.length > 0 
            ? selectedClinic.earnings.filter(e => selectedEarningIds.includes(e.id))
            : [];
        
        let totalRemaining = 0;
        selectedEarnings.forEach(earning => {
            const remaining = earning.remaining_amount !== undefined 
                ? earning.remaining_amount 
                : (earning.net_amount - (earning.paid_amount || 0));
            // Only count positive remaining for payout
            totalRemaining += Math.max(0, remaining);
        });

        return {
            totalAmount: Math.round(totalRemaining * 100) / 100,
            maxAmount: Math.round(totalRemaining * 100) / 100,
            finalTotal: Math.round(finalTotal * 100) / 100,
            isNegative: finalTotal < 0,
        };
    }, [selectedClinic, selectedEarningIds]);

    // Show toast notifications from flash messages
    useEffect(() => {
        if (flash?.success) {
            customToast.success(flash.success);
        }
        if (flash?.error) {
            customToast.error(flash.error);
        }
    }, [flash]);

    const applyFiltersToBackend = useCallback((filtersToApply: typeof filters) => {
        router.get('/dashboard/earnings', {
            page: 1,
            status: filtersToApply.status !== 'all' ? filtersToApply.status : undefined,
            clinic_id: filtersToApply.clinic_id !== 'all' ? filtersToApply.clinic_id : undefined,
            search: filtersToApply.search || undefined,
            created_from: filtersToApply.created_from || undefined,
            created_to: filtersToApply.created_to || undefined,
        }, { preserveState: true, preserveScroll: true });
    }, []);

    useEffect(() => {
        if (earnings?.data) {
            setOptimisticEarnings(earnings.data);
        }
    }, [earnings?.data]);

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

    useEffect(() => {
        if (initialFilters?.status) {
            setActiveTab(initialFilters.status);
        } else {
            setActiveTab('all');
        }
    }, [initialFilters?.status]);

    const statusOptions: SelectOption[] = [
        { value: 'all', label: t('all') },
        { value: 'pending', label: t('pending') },
        { value: 'paid', label: t('paid') },
    ];

    const clinicOptions: SelectOption[] = [
        { value: 'all', label: t('all_clinics') },
        ...(clinics || []).map(clinic => ({
            value: clinic.id.toString(),
            label: getLocalizedName(clinic.name_en, clinic.name_ar, locale),
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
            const clinic = clinics?.find(c => c.id.toString() === filters.clinic_id);
            active.push({
                key: 'clinic_id',
                label: t('clinic'),
                value: filters.clinic_id,
                displayValue: clinic ? getLocalizedName(clinic.name_en, clinic.name_ar, locale) : filters.clinic_id,
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
        } else if (key === 'clinic_id') {
            newFilters.clinic_id = 'all';
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
            created_from: '',
            created_to: '',
        };
        setFilters(clearedFilters);
    };

    const handlePageChange = (page: number) => {
        router.get('/dashboard/earnings', {
            ...filters,
            page,
            per_page: earnings.per_page,
        }, { preserveState: true, preserveScroll: true });
    };

    const handlePerPageChange = (perPage: number) => {
        router.get('/dashboard/earnings', {
            ...filters,
            per_page: perPage,
            page: 1,
        }, { preserveState: true, preserveScroll: true });
    };

    const handleTabChange = (value: string) => {
        setActiveTab(value);
        setFilters(prev => ({ ...prev, status: value === 'all' ? 'all' : value }));
    };


    const handleOpenProcessPayoutModalForClinic = (clinic: GroupedClinic) => {
        setSelectedClinic(clinic);
        setSelectedEarningIds(clinic.earnings.map(e => e.id));
        const availableAmount = clinic.total_remaining_amount !== undefined 
            ? clinic.total_remaining_amount 
            : clinic.total_net_amount;
        // Round the amount to 2 decimal places
        const roundedAmount = Math.round(availableAmount * 100) / 100;
        payoutForm.setData({
            payout_reference: '',
            amount: roundedAmount.toFixed(2),
            notes: '',
            earning_ids: clinic.earnings.map(e => e.id),
        });
    };

    const handleProcessPayout = () => {
        if (!selectedClinic) {
            customToast.error(t('please_select_clinic'));
            return;
        }

        if (!payoutForm.data.payout_reference) {
            customToast.error(t('payout_reference_required'));
            return;
        }

        // Validate and format amount
        const amountValue = payoutForm.data.amount?.trim() || '';
        if (!amountValue) {
            customToast.error(t('amount_required'));
            return;
        }
        
        const parsedAmount = parseFloat(amountValue);
        if (isNaN(parsedAmount) || parsedAmount <= 0) {
            customToast.error(t('invalid_amount'));
            return;
        }
        
        // Round to 2 decimal places and ensure it doesn't exceed max
        const roundedAmount = Math.round(parsedAmount * 100) / 100;
        const maxAmount = calculatedTotals.maxAmount;
        if (roundedAmount > maxAmount) {
            customToast.error(t('amount_exceeds_maximum', { amount: maxAmount.toFixed(2) }));
            return;
        }
        
        // Update form with properly formatted amount
        payoutForm.setData('amount', roundedAmount.toFixed(2));

        // Ensure earning_ids is properly set - if all are selected, send all IDs, otherwise send selected ones
        const earningIds = selectedEarningIds.length > 0 
            ? selectedEarningIds 
            : selectedClinic.earnings.map(e => e.id);

        // Update form data with proper earning_ids
        payoutForm.setData({
            ...payoutForm.data,
            earning_ids: earningIds.length > 0 ? earningIds : [], // Send empty array if none selected
        });

        payoutForm.post(`/dashboard/earnings/clinics/${selectedClinic.clinic_id}/generate-payout`, {
            preserveScroll: true,
            onSuccess: () => {
                setShowProcessPayoutModal(false);
                setSelectedClinic(null);
                setSelectedEarningIds([]);
                payoutForm.reset();
            },
            onError: (errors) => {
                console.error('Payout generation error:', errors);
                if (errors.earning_ids) {
                    customToast.error(Array.isArray(errors.earning_ids) ? errors.earning_ids.join(', ') : errors.earning_ids);
                }
            },
        });
    };

    const columns = [
        {
            key: 'booking_and_clinic',
            label: t('clinic'),
            render: (_: unknown, earning: Earning) => (
                <div className={cn("flex flex-col gap-2 p-2", isRTL ? '!text-right' : '!text-left')}>
                    {/* Booking reference (link to booking details when booking_id is available) */}
                    <div>
                        {earning.booking_reference ? (
                            earning.booking_id ? (
                                <Button
                                    variant="link"
                                    size="sm"
                                    className={cn(
                                        "px-0 h-auto font-mono text-xs",
                                        isRTL ? 'justify-end' : 'justify-start'
                                    )}
                                    onClick={() => router.visit(`/dashboard/bookings/${earning.booking_id}`)}
                                >
                                    {earning.booking_reference}
                                </Button>
                            ) : (
                                <span
                                    className={cn("font-mono text-xs", isRTL ? '!text-right' : '!text-left')}
                                    dir="ltr"
                                >
                                    {earning.booking_reference}
                                </span>
                            )
                        ) : (
                            <span
                                className={cn("text-xs text-muted-foreground", isRTL ? '!text-right' : '!text-left')}
                                dir={dir}
                            >
                                {t('n_a')}
                            </span>
                        )}
                    </div>

                    {/* Clinic card (clickable to open clinic details) */}
                    {earning.clinic ? (
                        <>
                            <div
                                className="cursor-pointer"
                                onClick={() => router.visit(`/dashboard/clinics/${earning.clinic.id}`)}
                            >
                                <ClinicCard
                                    clinic={{
                                        id: earning.clinic.id,
                                        company_name_en: earning.clinic.name_en,
                                        company_name_ar: earning.clinic.name_ar,
                                        email: earning.clinic.email,
                                        phone: earning.clinic.phone,
                                        logo: earning.clinic.logo,
                                    }}
                                    locale={locale}
                                    variant="default"
                                />
                            </div>

                            {earning.clinic.owner && (
                                <div className="mt-2">
                                    <UserCard
                                        user={{
                                            id: earning.clinic.owner.id,
                                            name: earning.clinic.owner.name,
                                            email: earning.clinic.owner.email || '',
                                            phone: earning.clinic.owner.phone || '',
                                            avatar: earning.clinic.owner.avatar,
                                            email_verified_at: earning.clinic.owner.email_verified_at || null,
                                            phone_verified_at: earning.clinic.owner.phone_verified_at || null,
                                        }}
                                        variant="compact"
                                        showVerificationBadges={false}
                                    />
                                </div>
                            )}
                        </>
                    ) : (
                        <span className={cn("text-muted-foreground", textAlign)} dir={dir}>
                            {t('n_a')}
                        </span>
                    )}
                </div>
            ),
        },
        {
            key: 'gross_amount',
            label: t('gross_amount'),
            render: (_: unknown, earning: Earning) => (
                <span className={cn("font-medium", textAlign)} dir="ltr">{parseFloat(earning.gross_amount || '0').toFixed(2)} {earning.currency}</span>
            ),
        },
        {
            key: 'net_amount',
            label: t('net_amount'),
            render: (_: unknown, earning: Earning) => {
                // Use calculated values if available, otherwise fall back to stored values
                const commissionRate = earning.calculated_commission_rate !== undefined 
                    ? earning.calculated_commission_rate 
                    : parseFloat(earning.commission_rate || '0');
                const commission = earning.calculated_commission_amount !== undefined 
                    ? earning.calculated_commission_amount 
                    : parseFloat(earning.commission_amount || '0');
                const platformFee = earning.calculated_platform_fee !== undefined 
                    ? earning.calculated_platform_fee 
                    : parseFloat(earning.platform_fee || '0');
                // Round all values to 2 decimal places to avoid floating point precision issues
                const roundedCommission = Math.round(commission * 100) / 100;
                const roundedPlatformFee = Math.round(platformFee * 100) / 100;
                // Only include admin commission and platform fees in deductions (no fixed charges)
                const totalDeductions = Math.round((roundedCommission + roundedPlatformFee) * 100) / 100;
                const calculatedNet = earning.calculated_net_amount !== undefined 
                    ? earning.calculated_net_amount 
                    : parseFloat(earning.net_amount || '0');
                const roundedNet = Math.round(calculatedNet * 100) / 100;
                
                return (
                    <div className={cn("flex flex-col text-xs", textAlign)} dir={dir}>
                        <span className={cn("font-medium text-green-600 dark:text-green-400 mb-1", textAlign)} dir="ltr">
                            {roundedNet.toFixed(2)} {earning.currency}
                        </span>
                        <span className={cn("text-muted-foreground", textAlign)}>
                            {t('commission')} ({(Math.round(commissionRate * 100) / 100).toFixed(2)}%): <span dir="ltr">{roundedCommission.toFixed(2)} {earning.currency}</span>
                        </span>
                        <span className={cn("text-muted-foreground", textAlign)}>
                            {t('platform_fee')}: <span dir="ltr">{roundedPlatformFee.toFixed(2)} {earning.currency}</span>
                        </span>
                        <span className={cn("font-medium mt-1", textAlign)}>
                            {t('total_deductions')}: <span dir="ltr">{totalDeductions.toFixed(2)} {earning.currency}</span>
                        </span>
                    </div>
                );
            },
        },
        {
            key: 'remaining_amount',
            label: t('remaining_to_be_paid'),
            render: (_: unknown, earning: Earning) => {
                // Calculate remaining amount (can be negative)
                const calculatedNet = earning.calculated_net_amount !== undefined 
                    ? earning.calculated_net_amount 
                    : parseFloat(earning.net_amount || '0');
                const paidAmount = parseFloat((earning.paid_amount || 0).toString());
                const remainingAmount = earning.remaining_amount !== undefined 
                    ? earning.remaining_amount 
                    : calculatedNet - paidAmount;
                // Round to 2 decimal places to avoid floating point precision issues
                const roundedRemaining = Math.round(remainingAmount * 100) / 100;
                const roundedPaid = Math.round(paidAmount * 100) / 100;
                
                // Determine color based on remaining amount
                let remainingColor = 'text-muted-foreground';
                if (roundedRemaining > 0) {
                    remainingColor = 'text-yellow-600 dark:text-yellow-400';
                } else if (roundedRemaining < 0) {
                    remainingColor = 'text-red-600 dark:text-red-400';
                } else {
                    remainingColor = 'text-green-600 dark:text-green-400';
                }
                
                return (
                    <div className={cn("flex flex-col gap-1", textAlign)}>
                        <span className={cn("text-xs font-medium", textAlign)} dir="ltr">
                            {t('remaining')}: <span className={cn(remainingColor)}>{roundedRemaining.toFixed(2)} {earning.currency}</span>
                        </span>
                        <span className={cn("text-xs font-medium", textAlign)} dir="ltr">
                            {t('paid')}: <span className={cn("text-muted-foreground")}>{roundedPaid.toFixed(2)} {earning.currency}</span>
                            </span>
                    </div>
                );
            },
        },
        {
            key: 'status',
            label: t('status'),
            render: (_: unknown, earning: Earning) => {
                const statusColors = {
                    pending: 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300 border-yellow-200 dark:border-yellow-800',
                    paid: 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 border-green-200 dark:border-green-800',
                };
                
                return (
                    <Badge className={statusColors[earning.status] || ''}>
                        {t(earning.status)}
                    </Badge>
                );
            },
        },
        {
            key: 'created_at',
            label: t('created_at'),
            render: (_: unknown, earning: Earning) => (
                <span className={cn("text-sm text-muted-foreground", textAlign)} dir={dir}>
                    {formatHumanDate(earning.created_at, t)}
                </span>
            ),
        },
        {
            key: 'actions',
            label: t('actions'),
            render: (_: unknown, earning: Earning) => (
                <div className={cn("flex items-center gap-1", isRTL ? 'flex-row-reverse' : '')}>
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => router.visit(`/dashboard/earnings/${earning.id}`)}
                        className={cn("h-8 w-8 p-0", flexDirection)}
                        title={t('view')}
                    >
                        <Eye className="h-4 w-4" />
                    </Button>
                    {can('payouts.process') && earning.status === 'pending' && !earning.payout_id && earning.clinic && (() => {
                        // Calculate remaining amount to check if it's negative
                        const calculatedNet = earning.calculated_net_amount !== undefined 
                            ? earning.calculated_net_amount 
                            : parseFloat(earning.net_amount || '0');
                        const paidAmount = parseFloat((earning.paid_amount || 0).toString());
                        const remainingAmount = earning.remaining_amount !== undefined 
                            ? earning.remaining_amount 
                            : calculatedNet - paidAmount;
                        const roundedRemaining = Math.round(remainingAmount * 100) / 100;
                        
                        // Only show Pay now button if remaining is positive
                        if (roundedRemaining <= 0) {
                            return null;
                        }
                        
                        return (
                        <Button
                            variant="default"
                            size="sm"
                            onClick={async () => {
                                setLoadingClinics(true);
                                setShowProcessPayoutModal(true);
                                try {
                                    const response = await fetch('/dashboard/earnings/clinics/pending');
                                    const data = await response.json();
                                    
                                    if (data.success && data.data) {
                                        setGroupedClinics(data.data);
                                        const clinic = data.data.find((c: GroupedClinic) => c.clinic_id === earning.clinic?.id);
                                        if (clinic) {
                                            handleOpenProcessPayoutModalForClinic(clinic);
                                        } else {
                                            customToast.warning(t('loading_clinic_earnings'));
                                        }
                                    } else {
                                        customToast.error(t('error_loading_clinics'));
                                    }
                                } catch (error) {
                                    console.error('Error:', error);
                                    customToast.error(t('error_loading_clinic'));
                                } finally {
                                    setLoadingClinics(false);
                                }
                            }}
                            className={cn("flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white dark:bg-green-700 dark:hover:bg-green-800", flexDirection)}
                        >
                            <DollarSign className={cn("h-4 w-4", iconMargin('md'))} />
                            {t('pay_now')}
                        </Button>
                        );
                    })()}
                </div>
            ),
        },
    ];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={t('earnings_management')} />

            <div className={cn("flex h-full flex-1 flex-col gap-6 overflow-x-auto rounded-xl bg-card dark:bg-card p-6 border border-border", isRTL ? '!text-right' : '!text-left')} dir={dir}>
                {/* Header */}
                <div className={cn("flex items-center justify-between border-b pb-4", flexDirection)}>
                    <div className={cn(isRTL ? '!text-right' : '!text-left')}>
                        <h1 className={cn("text-3xl font-bold text-foreground", isRTL ? '!text-right' : '!text-left')}>{t('earnings_management')}</h1>
                        <p className={cn("text-muted-foreground mt-1", isRTL ? '!text-right' : '!text-left')}>{t('manage_clinic_earnings')}</p>
                    </div>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <StatsCard
                        title={t('total_pending')}
                        value={`${(Math.round((stats?.total_pending || 0) * 100) / 100).toFixed(2)} KWD`}
                        icon={Wallet}
                        iconColor="text-yellow-600"
                        bgColor="bg-yellow-100 dark:bg-yellow-900/30"
                    />
                    <StatsCard
                        title={t('total_paid')}
                        value={`${(Math.round((stats?.total_paid || 0) * 100) / 100).toFixed(2)} KWD`}
                        icon={TrendingUp}
                        iconColor="text-green-600"
                        bgColor="bg-green-100 dark:bg-green-900/30"
                    />
                    <StatsCard
                        title={t('total_commission')}
                        value={`${(Math.round((stats?.total_commission || 0) * 100) / 100).toFixed(2)} KWD`}
                        icon={Percent}
                        iconColor="text-blue-600"
                        bgColor="bg-blue-100 dark:bg-blue-900/30"
                    />
                    <StatsCard
                        title={t('total_gross')}
                        value={`${(Math.round((stats?.total_gross || 0) * 100) / 100).toFixed(2)} KWD`}
                        icon={DollarSign}
                        iconColor="text-purple-600"
                        bgColor="bg-purple-100 dark:bg-purple-900/30"
                    />
                </div>

                {/* Tabs */}
                <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
                    <TabsList className={cn("grid w-full grid-cols-3", flexDirection)}>
                        <TabsTrigger value="all" className={cn(isRTL ? '!text-right' : '!text-left')}>{t('all')} ({stats?.all_count || 0})</TabsTrigger>
                        <TabsTrigger value="pending" className={cn(isRTL ? '!text-right' : '!text-left')}>{t('pending')} ({stats?.pending_count || 0})</TabsTrigger>
                        <TabsTrigger value="paid" className={cn(isRTL ? '!text-right' : '!text-left')}>{t('paid')} ({stats?.paid_count || 0})</TabsTrigger>
                    </TabsList>
                </Tabs>

                {/* Pagination Info and Show Filters Button */}
                <div className={cn("flex items-center justify-between", flexDirection)}>
                    <div className={cn("flex items-center gap-2", flexDirection)}>
                        <span className={cn("text-sm text-foreground", isRTL ? '!text-right' : '!text-left')}>
                            {t('showing')} {((earnings?.current_page || 1) - 1) * (earnings?.per_page || 15) + 1} {t('of')} {earnings?.total || 0} {t('results')}
                        </span>
                        <Select value={(earnings?.per_page || 15).toString()} onValueChange={(value) => handlePerPageChange(Number(value))}>
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
                            placeholder={t('search_by_clinic_or_booking')}
                        />
                        
                        <SelectFilter
                            id="status"
                            label={t('status')}
                            value={filters.status}
                            onChange={(value) => setFilters(prev => ({ ...prev, status: value }))}
                            options={statusOptions}
                            placeholder={t('all')}
                        />
                        
                        <SelectFilter
                            id="clinic_id"
                            label={t('clinic')}
                            value={filters.clinic_id}
                            onChange={(value) => setFilters(prev => ({ ...prev, clinic_id: value }))}
                            options={clinicOptions}
                            placeholder={t('all_clinics')}
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

                <DataTable
                    data={optimisticEarnings}
                    columns={columns}
                    total={earnings?.total || 0}
                    currentPage={earnings?.current_page || 1}
                    perPage={earnings?.per_page || 15}
                    onPageChange={handlePageChange}
                    onPerPageChange={handlePerPageChange}
                    locale={locale}
                />
            </div>

            {/* Process Payout Modal */}
            <Dialog open={showProcessPayoutModal} onOpenChange={(open) => {
                setShowProcessPayoutModal(open);
                if (!open) {
                    setSelectedClinic(null);
                    setSelectedEarningIds([]);
                    payoutForm.reset();
                }
            }}>
                <DialogContent className={cn("max-w-4xl max-h-[90vh] overflow-y-auto", isRTL ? '!text-right' : '!text-left')} dir={dir}>
                    <DialogHeader className={cn(isRTL ? '!text-right' : '!text-left')} dir={dir}>
                        <DialogTitle className={cn("text-xl font-semibold", isRTL ? '!text-right' : '!text-left')} dir={dir}>{t('process_payout')}</DialogTitle>
                        <DialogDescription className={cn("text-sm text-muted-foreground", isRTL ? '!text-right' : '!text-left')} dir={dir}>
                            {selectedClinic 
                                ? t('process_payout_for_clinic')
                                : t('select_clinic_and_earnings_to_process_payout')}
                        </DialogDescription>
                    </DialogHeader>

                    {loadingClinics ? (
                        <div className={cn("flex items-center justify-center p-8", isRTL ? '!text-right' : '!text-left')} dir={dir}>
                            <p className={cn(isRTL ? '!text-right' : '!text-left')} dir={dir}>{t('loading')}</p>
                        </div>
                    ) : !selectedClinic ? (
                        <div className={cn("space-y-4", isRTL ? '!text-right' : '!text-left')} dir={dir}>
                            {groupedClinics.length === 0 ? (
                                <p className={cn("text-center text-muted-foreground p-8", isRTL ? '!text-right' : '!text-left')} dir={dir}>
                                    {t('no_pending_earnings')}
                                </p>
                            ) : (
                                <div className={cn("space-y-2 max-h-96 overflow-y-auto", isRTL ? '!text-right' : '!text-left')} dir={dir}>
                                    {groupedClinics.map((clinic) => (
                                        <div
                                            key={clinic.clinic_id}
                                            className={cn("border rounded-lg p-4 hover:bg-accent cursor-pointer transition-colors", isRTL ? '!text-right' : '!text-left')}
                                            dir={dir}
                                            onClick={() => handleOpenProcessPayoutModalForClinic(clinic)}
                                        >
                                            <div className={cn("flex justify-between items-center", flexDirection)}>
                                                <div className={cn(isRTL ? '!text-right' : '!text-left')} dir={dir}>
                                                    <h3 className={cn("font-semibold text-base", isRTL ? '!text-right' : '!text-left')} dir={dir}>
                                                        {getLocalizedName(clinic.clinic_name_en, clinic.clinic_name_ar, locale)}
                                                    </h3>
                                                    {clinic.owner_name && (
                                                        <p className={cn("text-sm text-muted-foreground", isRTL ? '!text-right' : '!text-left')} dir={dir}>{clinic.owner_name}</p>
                                                    )}
                                                    <p className={cn("text-sm text-muted-foreground mt-1", isRTL ? '!text-right' : '!text-left')} dir={dir}>
                                                        {t('total_available')}: {(Math.round((clinic.total_remaining_amount !== undefined ? clinic.total_remaining_amount : clinic.total_net_amount) * 100) / 100).toFixed(2)} KWD
                                                    </p>
                                                    {clinic.total_remaining_amount !== undefined && clinic.total_remaining_amount < clinic.total_net_amount && (
                                                        <p className={cn("text-xs text-muted-foreground", isRTL ? '!text-right' : '!text-left')} dir={dir}>
                                                            {t('total_net')}: {(Math.round(clinic.total_net_amount * 100) / 100).toFixed(2)} KWD
                                                        </p>
                                                    )}
                                                    <p className={cn("text-xs text-muted-foreground", isRTL ? '!text-right' : '!text-left')} dir={dir}>
                                                        {clinic.earnings_count} {t('earnings')}
                                                    </p>
                                                </div>
                                                <Button
                                                    variant="default"
                                                    size="sm"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleOpenProcessPayoutModalForClinic(clinic);
                                                    }}
                                                    className={cn(flexDirection)}
                                                >
                                                    <DollarSign className={cn("h-4 w-4", iconMargin('md'))} />
                                                    {t('process_payout')}
                                                </Button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className={cn("space-y-4", isRTL ? '!text-right' : '!text-left')} dir={dir}>
                            <div className={cn("flex justify-between items-center border-b pb-2", flexDirection)}>
                                <div className={cn(isRTL ? '!text-right' : '!text-left')} dir={dir}>
                                    <h3 className={cn("font-semibold text-base", isRTL ? '!text-right' : '!text-left')} dir={dir}>
                                        {getLocalizedName(selectedClinic.clinic_name_en, selectedClinic.clinic_name_ar, locale)}
                                    </h3>
                                    <p className={cn("text-sm text-muted-foreground", isRTL ? '!text-right' : '!text-left')} dir={dir}>
                                        {t('total_available')}: <span className="font-semibold">{calculatedTotals.totalAmount.toFixed(2)} KWD</span>
                                    </p>
                                    <p className={cn("text-sm font-medium", isRTL ? '!text-right' : '!text-left')} dir="ltr">
                                        {t('final_total')}: <span className={cn(calculatedTotals.isNegative ? 'text-red-600 dark:text-red-400' : 'text-foreground')}>{calculatedTotals.finalTotal.toFixed(2)} KWD</span>
                                    </p>
                                    {calculatedTotals.isNegative && (
                                        <p className={cn("text-sm text-red-600 dark:text-red-400 font-medium", isRTL ? '!text-right' : '!text-left')} dir={dir}>
                                            {t('clinic_out_of_amount')}
                                        </p>
                                    )}
                                    <p className={cn("text-xs text-muted-foreground", isRTL ? '!text-right' : '!text-left')} dir={dir}>
                                        {t('selected_bookings')}: {selectedEarningIds.length} / {selectedClinic.earnings.length}
                                    </p>
                                </div>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => {
                                        setSelectedClinic(null);
                                        setSelectedEarningIds([]);
                                        payoutForm.reset();
                                    }}
                                    className={cn(flexDirection)}
                                >
                                    {t('back')}
                                </Button>
                            </div>

                            {/* Earnings Table */}
                            <div className={cn("border rounded-lg overflow-hidden", isRTL ? '!text-right' : '!text-left')} dir={dir}>
                                <div className={cn("max-h-64 overflow-y-auto", isRTL ? '!text-right' : '!text-left')} dir={dir}>
                                    <table className={cn("w-full text-sm", isRTL ? '!text-right' : '!text-left')} dir={dir}>
                                        <thead className={cn("bg-muted sticky top-0", isRTL ? '!text-right' : '!text-left')} dir={dir}>
                                            <tr className={cn(isRTL ? '!text-right' : '!text-left')} dir={dir}>
                                                <th className={cn("p-2 font-semibold text-center w-12", isRTL ? '!text-right' : '!text-left')} dir={dir}>
                                                    <input
                                                        type="checkbox"
                                                        checked={selectedEarningIds.length === selectedClinic.earnings.length}
                                                        onChange={(e) => {
                                                            if (e.target.checked) {
                                                                const allIds = selectedClinic.earnings.map((e) => e.id);
                                                                setSelectedEarningIds(allIds);
                                                                payoutForm.setData('earning_ids', allIds);
                                                            } else {
                                                                setSelectedEarningIds([]);
                                                                payoutForm.setData('earning_ids', []);
                                                            }
                                                        }}
                                                        className="cursor-pointer"
                                                    />
                                                </th>
                                                <th className={cn("p-2 font-semibold", isRTL ? '!text-right' : '!text-left')} dir={dir}>{t('booking_reference')}</th>
                                                <th className={cn("p-2 font-semibold", isRTL ? '!text-right' : '!text-left')} dir="ltr">{t('net_amount')}</th>
                                                <th className={cn("p-2 font-semibold", isRTL ? '!text-right' : '!text-left')} dir={dir}>{t('created_at')}</th>
                                            </tr>
                                        </thead>
                                        <tbody className={cn(isRTL ? '!text-right' : '!text-left')} dir={dir}>
                                            {selectedClinic.earnings.map((earning) => (
                                                <tr key={earning.id} className={cn("border-t hover:bg-accent", isRTL ? '!text-right' : '!text-left')} dir={dir}>
                                                    <td className={cn("p-2 text-center", isRTL ? '!text-right' : '!text-left')} dir={dir}>
                                                        <input
                                                            type="checkbox"
                                                            checked={selectedEarningIds.includes(earning.id)}
                                                            onChange={(e) => {
                                                                if (e.target.checked) {
                                                                    const newIds = [...selectedEarningIds, earning.id];
                                                                    setSelectedEarningIds(newIds);
                                                                    payoutForm.setData('earning_ids', newIds);
                                                                } else {
                                                                    const newIds = selectedEarningIds.filter(id => id !== earning.id);
                                                                    setSelectedEarningIds(newIds);
                                                                    payoutForm.setData('earning_ids', newIds);
                                                                }
                                                            }}
                                                            className="cursor-pointer"
                                                        />
                                                    </td>
                                                    <td className={cn("p-2 font-mono", isRTL ? '!text-right' : '!text-left')} dir="ltr">{earning.booking_reference || t('n_a')}</td>
                                                    <td className={cn("p-2 font-medium", isRTL ? '!text-right' : '!text-left')} dir="ltr">
                                                        {(Math.round(earning.net_amount * 100) / 100).toFixed(2)} {earning.currency}
                                                    </td>
                                                    <td className={cn("p-2 text-xs text-muted-foreground", isRTL ? '!text-right' : '!text-left')} dir={dir}>
                                                        {formatHumanDate(earning.created_at, t)}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>

                            {/* Payout Form */}
                            <div className={cn("space-y-4", isRTL ? '!text-right' : '!text-left')} dir={dir}>
                                <div className={cn("space-y-2", isRTL ? '!text-right' : '!text-left')} dir={dir}>
                                    <Label htmlFor="payout_reference" className={cn("font-medium", isRTL ? '!text-right' : '!text-left')} dir={dir}>
                                        {t('payout_reference')} <span className="text-red-500">*</span>
                                    </Label>
                                    <Input
                                        id="payout_reference"
                                        value={payoutForm.data.payout_reference}
                                        onChange={(e) => payoutForm.setData('payout_reference', e.target.value)}
                                        placeholder={t('enter_payout_reference')}
                                        required
                                        dir={getFieldDir('text')}
                                        className={cn("mt-1", getInputTextAlign('text'))}
                                    />
                                    {payoutForm.errors.payout_reference && (
                                        <p className={cn("text-sm text-red-600 dark:text-red-400 mt-1", isRTL ? '!text-right' : '!text-left')} dir={dir}>{payoutForm.errors.payout_reference}</p>
                                    )}
                                </div>

                                <div className={cn("space-y-2", isRTL ? '!text-right' : '!text-left')} dir={dir}>
                                    <Label htmlFor="amount" className={cn("font-medium", isRTL ? '!text-right' : '!text-left')} dir={dir}>
                                        {t('amount')} <span className="text-red-500">*</span>
                                    </Label>
                                    <Input
                                        id="amount"
                                        type="text"
                                        inputMode="decimal"
                                        value={payoutForm.data.amount}
                                        onChange={(e) => {
                                            const value = e.target.value;
                                            // Allow empty, numbers, and single decimal point
                                            if (value === '' || /^\d*\.?\d*$/.test(value)) {
                                                payoutForm.setData('amount', value);
                                            }
                                        }}
                                        onBlur={(e) => {
                                            const value = e.target.value;
                                            // Format to 2 decimal places on blur if valid number
                                            if (value && !isNaN(parseFloat(value))) {
                                                const numValue = parseFloat(value);
                                                if (numValue > 0) {
                                                    const rounded = Math.round(numValue * 100) / 100;
                                                    const maxAmount = calculatedTotals.maxAmount;
                                                    const finalValue = rounded > maxAmount ? maxAmount : rounded;
                                                    payoutForm.setData('amount', finalValue.toFixed(2));
                                                } else {
                                                    payoutForm.setData('amount', '');
                                                }
                                            } else if (value === '') {
                                                payoutForm.setData('amount', '');
                                            }
                                        }}
                                        placeholder={calculatedTotals.maxAmount.toFixed(2)}
                                        required
                                        dir={getFieldDir('number')}
                                        className={cn("mt-1", getInputTextAlign('number'))}
                                    />
                                    <p className={cn("text-xs text-muted-foreground mt-1", isRTL ? '!text-right' : '!text-left')} dir={dir}>
                                        {t('max_amount')}: <span className="font-semibold">{calculatedTotals.maxAmount.toFixed(2)} KWD</span>
                                    </p>
                                    <p className={cn("text-xs text-muted-foreground", isRTL ? '!text-right' : '!text-left')} dir={dir}>
                                        {t('total_amount')}: <span className="font-semibold">{calculatedTotals.totalAmount.toFixed(2)} KWD</span>
                                    </p>
                                    {payoutForm.errors.amount && (
                                        <p className={cn("text-sm text-red-600 dark:text-red-400 mt-1", isRTL ? '!text-right' : '!text-left')} dir={dir}>{payoutForm.errors.amount}</p>
                                    )}
                                </div>

                                <div className={cn("space-y-2", isRTL ? '!text-right' : '!text-left')} dir={dir}>
                                    <Label htmlFor="notes" className={cn("font-medium", isRTL ? '!text-right' : '!text-left')} dir={dir}>{t('notes')}</Label>
                                    <Textarea
                                        id="notes"
                                        value={payoutForm.data.notes}
                                        onChange={(e) => payoutForm.setData('notes', e.target.value)}
                                        placeholder={t('add_notes_about_this_payout')}
                                        rows={3}
                                        dir={getFieldDir('textarea')}
                                        className={cn("mt-1", getInputTextAlign('textarea'))}
                                    />
                                    {payoutForm.errors.notes && (
                                        <p className={cn("text-sm text-red-600 dark:text-red-400 mt-1", isRTL ? '!text-right' : '!text-left')} dir={dir}>{payoutForm.errors.notes}</p>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}

                    <DialogFooter className={cn(flexDirection)}>
                        {selectedClinic && (
                            <>
                                <Button
                                    variant="outline"
                                    onClick={() => {
                                        setSelectedClinic(null);
                                        setSelectedEarningIds([]);
                                        payoutForm.reset();
                                    }}
                                    className={cn(flexDirection)}
                                >
                                    {t('cancel')}
                                </Button>
                                <Button
                                    onClick={handleProcessPayout}
                                    disabled={payoutForm.processing || !payoutForm.data.payout_reference || !payoutForm.data.amount || parseFloat(payoutForm.data.amount || '0') <= 0 || calculatedTotals.isNegative}
                                    className={cn(flexDirection)}
                                >
                                    {payoutForm.processing ? t('processing') : t('generate_payout')}
                                </Button>
                            </>
                        )}
                        {!selectedClinic && (
                            <Button
                                variant="outline"
                                onClick={() => setShowProcessPayoutModal(false)}
                                className={cn(flexDirection)}
                            >
                                {t('close')}
                            </Button>
                        )}
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </AppLayout>
    );
}
