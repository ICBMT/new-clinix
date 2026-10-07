import { type BreadcrumbItem } from '@/types';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
import { useRTLInit } from '@/hooks/use-rtl-init';
import { useTranslation } from '@/hooks/use-translation';
import { useRTL } from '@/hooks/use-rtl';
import { usePermissions } from '@/hooks/use-permissions';
import { getLocalizedName } from '@/utils/localization';
import AppLayout from '@/layouts/app-layout';
import { index as dashboard } from '@/routes/dashboard';
import { Head, Link, router, useForm } from '@inertiajs/react';
import { ArrowLeft, Building2, FileText, Calendar, User, CreditCard, DollarSign } from 'lucide-react';
import { formatHumanDate } from '@/utils/date-utils';
import { useState, useEffect } from 'react';
import { customToast } from '@/components/ui/custom-toast';
import { cn } from '@/lib/utils';
import { usePage } from '@inertiajs/react';
import { type SharedData } from '@/types';

interface ShowEarningProps {
    earning: {
        id: number;
        booking_reference?: string;
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
        paid_at?: string;
        payout_id?: number;
        // Calculated values from current settings
        calculated_commission_rate?: number;
        calculated_commission_amount?: number;
        calculated_platform_fee?: number;
        calculated_fixed_charges?: number;
        calculated_net_amount?: number;
        clinic?: {
            id: number;
            name_en: string;
            name_ar: string;
            email?: string;
            phone?: string;
            owner?: {
                id: number;
                name: string;
                email: string;
            };
            category?: {
                id: number;
                name_en: string;
                name_ar: string;
            };
        };
        booking?: {
            id: number;
            booking_reference: string;
            total_amount: string;
            payment_status?: string;
            user?: {
                id: number;
                name: string;
                email: string;
            };
        };
        payout?: {
            id: number;
            payout_reference: string;
            net_amount: string;
            status: string;
            processed_at?: string;
        };
        history?: Array<{
            id: number;
            payout_reference: string;
            amount_paid: string;
            remaining_amount_before?: string;
            remaining_amount_after?: string;
            currency: string;
            notes?: string;
            processed_at: string;
            processed_by?: {
                id: number;
                name: string;
                email: string;
            };
        }>;
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

export default function ShowEarning({ earning }: ShowEarningProps) {
    useRTLInit();
    const { t, locale } = useTranslation();
    const page = usePage<SharedData>();
    const { locale: pageLocale } = page.props;
    const isRTL = pageLocale === 'ar';
    const dir = isRTL ? 'rtl' : 'ltr';
    const { flexDirection, iconMargin, textAlign, getFieldDir, getInputTextAlign } = useRTL();
    const { can } = usePermissions();
    const [showProcessPayoutModal, setShowProcessPayoutModal] = useState(false);
    const [selectedClinic, setSelectedClinic] = useState<GroupedClinic | null>(null);
    const [selectedEarningIds, setSelectedEarningIds] = useState<number[]>([]);
    const [groupedClinics, setGroupedClinics] = useState<GroupedClinic[]>([]);
    const [loadingClinics, setLoadingClinics] = useState(false);
    
    // Calculate max tab number
    const maxTab = (() => {
        if (!earning) return 3;
        let max = 3; // Earning Information, Clinic, Booking
        if (earning.history && earning.history.length > 0) max++;
        return max;
    })();
    
    // Get initial tab from URL parameter or default to 1
    const [activeTab, setActiveTab] = useState<number>(1);
    
    // Sync with URL parameter on mount
    useEffect(() => {
        const urlParams = new URLSearchParams(window.location.search);
        const tab = urlParams.get('tab');
        if (tab) {
            const tabNum = parseInt(tab);
            if (!isNaN(tabNum) && tabNum >= 1 && tabNum <= maxTab) {
                setActiveTab(tabNum);
            }
        }
    }, [maxTab]);
    
    // Handle tab change and update URL
    const handleTabChange = (value: string | number) => {
        const tabNum = typeof value === 'string' ? parseInt(value) : value;
        setActiveTab(tabNum);
        // Update URL using Inertia router to preserve state
        const url = new URL(window.location.href);
        url.searchParams.set('tab', tabNum.toString());
        router.visit(url.toString(), {
            preserveScroll: true,
            preserveState: true,
            only: [],
        });
    };

    const payoutForm = useForm({
        payout_reference: '',
        amount: '',
        notes: '',
        earning_ids: [] as number[],
    });

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

        if (!payoutForm.data.amount || parseFloat(payoutForm.data.amount) <= 0) {
            customToast.error(t('amount_required'));
            return;
        }

        payoutForm.post(`/dashboard/earnings/clinics/${selectedClinic.clinic_id}/generate-payout`, {
            preserveScroll: true,
            onSuccess: () => {
                setShowProcessPayoutModal(false);
                setSelectedClinic(null);
                setSelectedEarningIds([]);
                payoutForm.reset();
                router.reload();
            },
            onError: (errors) => {
                console.error('Payout generation error:', errors);
            },
        });
    };
    
    const breadcrumbs: BreadcrumbItem[] = [
        {
            title: t('dashboard'),
            href: dashboard.url(),
        },
        {
            title: t('earnings_management'),
            href: '/dashboard/earnings',
        },
        {
            title: t('view_earning'),
            href: '#',
        },
    ];

    if (!earning) {
        return (
            <AppLayout breadcrumbs={breadcrumbs}>
                <Head title={t('earning_not_found')} />
                <div className={cn("flex h-full flex-1 flex-col gap-6 overflow-x-auto rounded-xl bg-card dark:bg-card p-6 border border-border", isRTL ? '!text-right' : '!text-left')} dir={dir}>
                    <p className={cn(isRTL ? '!text-right' : '!text-left')}>{t('earning_not_found')}</p>
                </div>
            </AppLayout>
        );
    }

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
    const netAmount = earning.calculated_net_amount !== undefined 
        ? earning.calculated_net_amount 
        : parseFloat(earning.net_amount || '0');
    // Round all values to 2 decimal places to avoid floating point precision issues
    const roundedCommissionRate = Math.round(commissionRate * 100) / 100;
    const roundedCommission = Math.round(commission * 100) / 100;
    const roundedPlatformFee = Math.round(platformFee * 100) / 100;
    const roundedNetAmount = Math.round(netAmount * 100) / 100;
    // Only include admin commission and platform fees in deductions (no fixed charges)
    const totalDeductions = Math.round((roundedCommission + roundedPlatformFee) * 100) / 100;
    const roundedGross = Math.round(parseFloat(earning.gross_amount || '0') * 100) / 100;

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`${t('view_earning')} - ${earning.booking_reference || earning.id}`} />

            <div className={cn("flex h-full flex-1 flex-col gap-6 overflow-x-auto rounded-xl bg-card dark:bg-card p-6 border border-border", isRTL ? '!text-right' : '!text-left')} dir={dir}>
                {/* Header */}
                <div className={cn("flex items-center justify-between border-b pb-4", flexDirection)}>
                    <div className={cn(isRTL ? '!text-right' : '!text-left')}>
                        <div className={cn("flex items-center gap-3", flexDirection)}>
                            <h1 className={cn("text-3xl font-bold text-foreground", isRTL ? '!text-right' : '!text-left')}>{t('view_earning')}</h1>
                            <Badge 
                                variant={earning.status === 'paid' ? 'default' : 'secondary'}
                                className={cn(
                                    "text-base px-4 py-1",
                                    earning.status === 'paid' 
                                        ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 border-green-200 dark:border-green-800'
                                        : 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300 border-yellow-200 dark:border-yellow-800',
                                    isRTL ? '!text-right' : '!text-left'
                                )}
                            >
                                {t(earning.status)}
                            </Badge>
                        </div>
                        <p className={cn("text-muted-foreground mt-1", isRTL ? '!text-right' : '!text-left')}>{t('view_earning_description')}</p>
                    </div>
                    
                    <div className={cn("flex items-center gap-3", flexDirection)}>
                        {can('payouts.process') && earning.status === 'pending' && !earning.payout_id && earning.clinic && (
                            <Button
                                variant="default"
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
                        )}
                        <Link href="/dashboard/earnings">
                            <Button variant="outline" className={cn("flex items-center gap-2", flexDirection)}>
                                <ArrowLeft className={cn("h-4 w-4", isRTL && 'rotate-180', iconMargin('md'))} />
                                {t('back')}
                            </Button>
                        </Link>
                    </div>
                </div>

                {/* Earning Information Tabs */}
                <Tabs value={activeTab.toString()} onValueChange={(value) => handleTabChange(value)} className="w-full">
                    <TabsList className={cn("grid w-full", (() => {
                        let cols = 3; // Earning Information, Clinic, Booking
                        if (earning.history && earning.history.length > 0) cols++;
                        return cols === 3 ? "grid-cols-3" : "grid-cols-4";
                    })(), flexDirection)}>
                        <TabsTrigger value="1" className={cn(isRTL ? '!text-right' : '!text-left')}>
                            {t('earning_information')}
                        </TabsTrigger>
                        <TabsTrigger value="2" className={cn(isRTL ? '!text-right' : '!text-left')}>
                            {t('clinic')}
                        </TabsTrigger>
                        <TabsTrigger value="3" className={cn(isRTL ? '!text-right' : '!text-left')}>
                            {t('booking')}
                        </TabsTrigger>
                        {(earning.history && earning.history.length > 0) && (
                            <TabsTrigger value="4" className={cn(isRTL ? '!text-right' : '!text-left')}>
                                {t('payment_history')}
                            </TabsTrigger>
                        )}
                    </TabsList>

                    {/* Tab 1: Earning Information */}
                    <TabsContent value="1" className={cn("space-y-6", isRTL ? '!text-right' : '!text-left')} dir={dir}>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Earning Information */}
                            <div className={cn("space-y-4", isRTL ? '!text-right' : '!text-left')} dir={dir}>
                                <h2 className={cn("text-xl font-semibold flex items-center gap-2", flexDirection)}>
                                    <DollarSign className="h-5 w-5" />
                                    {t('earning_information')}
                                </h2>
                                
                                <div className={cn("space-y-3", isRTL ? '!text-right' : '!text-left')} dir={dir}>
                                    <div className={cn("flex justify-between items-center border-b pb-2", flexDirection)}>
                                        <span className={cn("text-muted-foreground", isRTL ? '!text-right' : '!text-left')}>{t('booking_reference')}</span>
                                        <span className={cn("font-mono font-medium", isRTL ? '!text-right' : '!text-left')} dir="ltr">{earning.booking_reference || t('n_a')}</span>
                                    </div>
                                    
                                    <div className={cn("flex justify-between items-center border-b pb-2", flexDirection)}>
                                        <span className={cn("text-muted-foreground", isRTL ? '!text-right' : '!text-left')}>{t('status')}</span>
                                        <Badge 
                                            variant={earning.status === 'paid' ? 'default' : 'secondary'}
                                            className={cn(
                                                earning.status === 'paid' 
                                                    ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300'
                                                    : 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300',
                                                isRTL ? '!text-right' : '!text-left'
                                            )}
                                        >
                                            {t(earning.status)}
                                        </Badge>
                                    </div>
                                    
                                    <div className={cn("flex justify-between items-center border-b pb-2", flexDirection)}>
                                        <span className={cn("text-muted-foreground", isRTL ? '!text-right' : '!text-left')}>{t('created_at')}</span>
                                        <span className={cn("font-medium", isRTL ? '!text-right' : '!text-left')} dir={dir}>{formatHumanDate(earning.created_at, t)}</span>
                                    </div>
                                    
                                    {earning.paid_at && (
                                        <div className={cn("flex justify-between items-center border-b pb-2", flexDirection)}>
                                            <span className={cn("text-muted-foreground", isRTL ? '!text-right' : '!text-left')}>{t('paid_at')}</span>
                                            <span className={cn("font-medium", isRTL ? '!text-right' : '!text-left')} dir={dir}>{formatHumanDate(earning.paid_at, t)}</span>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Financial Breakdown */}
                            <div className={cn("space-y-4", isRTL ? '!text-right' : '!text-left')} dir={dir}>
                                <h2 className={cn("text-xl font-semibold flex items-center gap-2", flexDirection)}>
                                    <CreditCard className="h-5 w-5" />
                                    {t('financial_breakdown')}
                                </h2>
                                
                                <div className={cn("space-y-3", isRTL ? '!text-right' : '!text-left')} dir={dir}>
                                    <div className={cn("flex justify-between items-center border-b pb-2", flexDirection)}>
                                        <span className={cn("text-muted-foreground", isRTL ? '!text-right' : '!text-left')}>{t('gross_amount')}</span>
                                        <span className={cn("font-bold text-lg", isRTL ? '!text-right' : '!text-left')} dir="ltr">{roundedGross.toFixed(2)} {earning.currency}</span>
                                    </div>
                                    
                                    <div className={cn("flex justify-between items-center border-b pb-2", flexDirection)}>
                                        <span className={cn("text-muted-foreground", isRTL ? '!text-right' : '!text-left')}>
                                            {t('commission')} ({roundedCommissionRate.toFixed(2)}%)
                                        </span>
                                        <span className={cn("font-medium text-red-600 dark:text-red-400", isRTL ? '!text-right' : '!text-left')} dir="ltr">
                                            -{roundedCommission.toFixed(2)} {earning.currency}
                                        </span>
                                    </div>
                                    
                                    <div className={cn("flex justify-between items-center border-b pb-2", flexDirection)}>
                                        <span className={cn("text-muted-foreground", isRTL ? '!text-right' : '!text-left')}>{t('platform_fee')}</span>
                                        <span className={cn("font-medium text-red-600 dark:text-red-400", isRTL ? '!text-right' : '!text-left')} dir="ltr">
                                            -{roundedPlatformFee.toFixed(2)} {earning.currency}
                                        </span>
                                    </div>
                                    
                                    <div className={cn("flex justify-between items-center border-b-2 border-primary pb-2 pt-2", flexDirection)}>
                                        <span className={cn("text-lg font-semibold", isRTL ? '!text-right' : '!text-left')}>{t('total_deductions')}</span>
                                        <span className={cn("font-bold text-lg text-red-600 dark:text-red-400", isRTL ? '!text-right' : '!text-left')} dir="ltr">
                                            -{totalDeductions.toFixed(2)} {earning.currency}
                                        </span>
                                    </div>
                                    
                                    <div className={cn("flex justify-between items-center pt-2", flexDirection)}>
                                        <span className={cn("text-xl font-bold", isRTL ? '!text-right' : '!text-left')}>{t('net_amount')}</span>
                                        <span className={cn("font-bold text-2xl text-green-600 dark:text-green-400", isRTL ? '!text-right' : '!text-left')} dir="ltr">
                                            {roundedNetAmount.toFixed(2)} {earning.currency}
                                        </span>
                                    </div>
                                    
                                    {(() => {
                                        const paidAmount = Math.round(parseFloat((earning.paid_amount || 0).toString()) * 100) / 100;
                                        const remainingAmount = earning.remaining_amount !== undefined 
                                            ? Math.round(earning.remaining_amount * 100) / 100
                                            : Math.max(0, Math.round((roundedNetAmount - paidAmount) * 100) / 100);
                                        
                                        return (
                                            <>
                                                {paidAmount > 0 && (
                                                    <div className={cn("flex justify-between items-center border-t pt-2 mt-2", flexDirection)}>
                                                        <span className={cn("text-muted-foreground", isRTL ? '!text-right' : '!text-left')}>{t('paid_amount')}</span>
                                                        <span className={cn("font-medium text-green-600 dark:text-green-400", isRTL ? '!text-right' : '!text-left')} dir="ltr">
                                                            {paidAmount.toFixed(2)} {earning.currency}
                                                        </span>
                                                    </div>
                                                )}
                                                
                                                <div className={cn("flex justify-between items-center border-t pt-2 mt-2", flexDirection)}>
                                                    <span className={cn("text-xl font-bold", isRTL ? '!text-right' : '!text-left')}>{t('remaining_to_be_paid')}</span>
                                                    <span className={cn(`font-bold text-2xl ${remainingAmount > 0 ? 'text-yellow-600 dark:text-yellow-400' : 'text-green-600 dark:text-green-400'}`, isRTL ? '!text-right' : '!text-left')} dir="ltr">
                                                        {remainingAmount.toFixed(2)} {earning.currency}
                                                    </span>
                                                </div>
                                            </>
                                        );
                                    })()}
                                </div>
                            </div>
                        </div>
                    </TabsContent>

                    {/* Tab 2: Clinic */}
                    <TabsContent value="2" className={cn("space-y-6", isRTL ? '!text-right' : '!text-left')} dir={dir}>
                        {earning.clinic ? (
                            <div className={cn("space-y-4", isRTL ? '!text-right' : '!text-left')} dir={dir}>
                                <h2 className={cn("text-xl font-semibold flex items-center gap-2", flexDirection)}>
                                    <Building2 className="h-5 w-5" />
                                    {t('clinic_information')}
                                </h2>
                                
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className={cn("space-y-3", isRTL ? '!text-right' : '!text-left')} dir={dir}>
                                        <div className={cn("flex justify-between items-center border-b pb-2", flexDirection)}>
                                            <span className={cn("text-muted-foreground", isRTL ? '!text-right' : '!text-left')}>{t('clinic_name')}</span>
                                            <span className={cn("font-medium", isRTL ? '!text-right' : '!text-left')} dir={dir}>
                                                {getLocalizedName(earning.clinic.name_en, earning.clinic.name_ar, locale)}
                                            </span>
                                        </div>
                                        
                                        {earning.clinic.category && (
                                            <div className={cn("flex justify-between items-center border-b pb-2", flexDirection)}>
                                                <span className={cn("text-muted-foreground", isRTL ? '!text-right' : '!text-left')}>{t('category')}</span>
                                                <span className={cn("font-medium", isRTL ? '!text-right' : '!text-left')} dir={dir}>
                                                    {getLocalizedName(earning.clinic.category.name_en, earning.clinic.category.name_ar, locale)}
                                                </span>
                                            </div>
                                        )}
                                        
                                        {earning.clinic.email && (
                                            <div className={cn("flex justify-between items-center border-b pb-2", flexDirection)}>
                                                <span className={cn("text-muted-foreground", isRTL ? '!text-right' : '!text-left')}>{t('email')}</span>
                                                <span className={cn("font-medium", isRTL ? '!text-right' : '!text-left')} dir="ltr">{earning.clinic.email}</span>
                                            </div>
                                        )}
                                        
                                        {earning.clinic.phone && (
                                            <div className={cn("flex justify-between items-center border-b pb-2", flexDirection)}>
                                                <span className={cn("text-muted-foreground", isRTL ? '!text-right' : '!text-left')}>{t('phone')}</span>
                                                <span className={cn("font-medium", isRTL ? '!text-right' : '!text-left')} dir="ltr">{earning.clinic.phone}</span>
                                            </div>
                                        )}
                                    </div>
                                    
                                    {earning.clinic.owner && (
                                        <div className={cn("space-y-3", isRTL ? '!text-right' : '!text-left')} dir={dir}>
                                            <h3 className={cn("text-lg font-semibold flex items-center gap-2", flexDirection)}>
                                                <User className="h-4 w-4" />
                                                {t('owner')}
                                            </h3>
                                            
                                            <div className={cn("flex justify-between items-center border-b pb-2", flexDirection)}>
                                                <span className={cn("text-muted-foreground", isRTL ? '!text-right' : '!text-left')}>{t('name')}</span>
                                                <span className={cn("font-medium", isRTL ? '!text-right' : '!text-left')} dir={dir}>{earning.clinic.owner.name}</span>
                                            </div>
                                            
                                            <div className={cn("flex justify-between items-center border-b pb-2", flexDirection)}>
                                                <span className={cn("text-muted-foreground", isRTL ? '!text-right' : '!text-left')}>{t('email')}</span>
                                                <span className={cn("font-medium", isRTL ? '!text-right' : '!text-left')} dir="ltr">{earning.clinic.owner.email}</span>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        ) : (
                            <p className={cn("text-muted-foreground", isRTL ? '!text-right' : '!text-left')} dir={dir}>{t('no_clinic_information')}</p>
                        )}
                    </TabsContent>

                    {/* Tab 3: Booking */}
                    <TabsContent value="3" className={cn("space-y-6", isRTL ? '!text-right' : '!text-left')} dir={dir}>
                        {earning.booking ? (
                            <div className={cn("space-y-4", isRTL ? '!text-right' : '!text-left')} dir={dir}>
                                <h2 className={cn("text-xl font-semibold flex items-center gap-2", flexDirection)}>
                                    <FileText className="h-5 w-5" />
                                    {t('booking_information')}
                                </h2>
                                
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className={cn("space-y-3", isRTL ? '!text-right' : '!text-left')} dir={dir}>
                                        <div className={cn("flex justify-between items-center border-b pb-2", flexDirection)}>
                                            <span className={cn("text-muted-foreground", isRTL ? '!text-right' : '!text-left')}>{t('booking_reference')}</span>
                                            <span className={cn("font-mono font-medium", isRTL ? '!text-right' : '!text-left')} dir="ltr">{earning.booking.booking_reference}</span>
                                        </div>
                                        
                                        <div className={cn("flex justify-between items-center border-b pb-2", flexDirection)}>
                                            <span className={cn("text-muted-foreground", isRTL ? '!text-right' : '!text-left')}>{t('total_amount')}</span>
                                            <span className={cn("font-medium", isRTL ? '!text-right' : '!text-left')} dir="ltr">{parseFloat(earning.booking.total_amount || '0').toFixed(2)} {earning.currency}</span>
                                        </div>
                                        
                                        {earning.booking.payment_status && (
                                            <div className={cn("flex justify-between items-center border-b pb-2", flexDirection)}>
                                                <span className={cn("text-muted-foreground", isRTL ? '!text-right' : '!text-left')}>{t('payment_status')}</span>
                                                <Badge 
                                                    variant={earning.booking.payment_status === 'paid' ? 'default' : 'secondary'}
                                                    className={cn(
                                                        earning.booking.payment_status === 'paid'
                                                            ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300'
                                                            : 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300',
                                                        isRTL ? '!text-right' : '!text-left'
                                                    )}
                                                >
                                                    {t(earning.booking.payment_status)}
                                                </Badge>
                                            </div>
                                        )}
                                    </div>
                                    
                                    {earning.booking.user && (
                                        <div className={cn("space-y-3", isRTL ? '!text-right' : '!text-left')} dir={dir}>
                                            <h3 className={cn("text-lg font-semibold flex items-center gap-2", flexDirection)}>
                                                <User className="h-4 w-4" />
                                                {t('user')}
                                            </h3>
                                            
                                            <div className={cn("flex justify-between items-center border-b pb-2", flexDirection)}>
                                                <span className={cn("text-muted-foreground", isRTL ? '!text-right' : '!text-left')}>{t('name')}</span>
                                                <span className={cn("font-medium", isRTL ? '!text-right' : '!text-left')} dir={dir}>{earning.booking.user.name}</span>
                                            </div>
                                            
                                            <div className={cn("flex justify-between items-center border-b pb-2", flexDirection)}>
                                                <span className={cn("text-muted-foreground", isRTL ? '!text-right' : '!text-left')}>{t('email')}</span>
                                                <span className={cn("font-medium", isRTL ? '!text-right' : '!text-left')} dir="ltr">{earning.booking.user.email}</span>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        ) : (
                            <p className={cn("text-muted-foreground", isRTL ? '!text-right' : '!text-left')} dir={dir}>{t('no_booking_information')}</p>
                        )}
                    </TabsContent>

                    {/* Tab 4: Payment History */}
                    {(earning.history && earning.history.length > 0) && (
                        <TabsContent value="4" className={cn("space-y-6", isRTL ? '!text-right' : '!text-left')} dir={dir}>
                            <div className={cn("space-y-4", isRTL ? '!text-right' : '!text-left')} dir={dir}>
                                <h2 className={cn("text-xl font-semibold flex items-center gap-2", flexDirection)}>
                                    <Calendar className="h-5 w-5" />
                                    {t('payment_history')}
                                </h2>
                                
                                <div className="border rounded-lg overflow-hidden">
                                    <div className="overflow-x-auto">
                                        <table className={cn("w-full text-sm", isRTL ? '!text-right' : '!text-left')} dir={dir}>
                                            <thead className={cn("bg-muted", isRTL ? '!text-right' : '!text-left')} dir={dir}>
                                                <tr>
                                                    <th className={cn("p-3", isRTL ? '!text-right' : '!text-left')} dir={dir}>{t('payout_reference')}</th>
                                                    <th className={cn("p-3", isRTL ? '!text-right' : '!text-left')} dir="ltr">{t('amount_paid')}</th>
                                                    <th className={cn("p-3", isRTL ? '!text-right' : '!text-left')} dir="ltr">{t('remaining_before')}</th>
                                                    <th className={cn("p-3", isRTL ? '!text-right' : '!text-left')} dir="ltr">{t('remaining_after')}</th>
                                                    <th className={cn("p-3", isRTL ? '!text-right' : '!text-left')} dir={dir}>{t('processed_by')}</th>
                                                    <th className={cn("p-3", isRTL ? '!text-right' : '!text-left')} dir={dir}>{t('processed_at')}</th>
                                                    <th className={cn("p-3", isRTL ? '!text-right' : '!text-left')} dir={dir}>{t('notes')}</th>
                                                </tr>
                                            </thead>
                                            <tbody className={cn(isRTL ? '!text-right' : '!text-left')} dir={dir}>
                                                {earning.history.map((historyItem) => (
                                                    <tr key={historyItem.id} className={cn("border-t hover:bg-accent", isRTL ? '!text-right' : '!text-left')} dir={dir}>
                                                        <td className={cn("p-3 font-mono text-xs", isRTL ? '!text-right' : '!text-left')} dir="ltr">{historyItem.payout_reference}</td>
                                                        <td className={cn("p-3 font-medium", isRTL ? '!text-right' : '!text-left')} dir="ltr">
                                                            {parseFloat(historyItem.amount_paid).toFixed(2)} {historyItem.currency}
                                                        </td>
                                                        <td className={cn("p-3 text-muted-foreground", isRTL ? '!text-right' : '!text-left')} dir="ltr">
                                                            {historyItem.remaining_amount_before 
                                                                ? `${parseFloat(historyItem.remaining_amount_before).toFixed(2)} ${historyItem.currency}`
                                                                : '-'}
                                                        </td>
                                                        <td className={cn("p-3 text-muted-foreground", isRTL ? '!text-right' : '!text-left')} dir="ltr">
                                                            {historyItem.remaining_amount_after 
                                                                ? `${parseFloat(historyItem.remaining_amount_after).toFixed(2)} ${historyItem.currency}`
                                                                : '-'}
                                                        </td>
                                                        <td className={cn("p-3", isRTL ? '!text-right' : '!text-left')} dir={dir}>
                                                            {historyItem.processed_by ? (
                                                                <div className={cn(isRTL ? '!text-right' : '!text-left')} dir={dir}>
                                                                    <div className={cn("font-medium", isRTL ? '!text-right' : '!text-left')} dir={dir}>{historyItem.processed_by.name}</div>
                                                                    <div className={cn("text-xs text-muted-foreground", isRTL ? '!text-right' : '!text-left')} dir="ltr">{historyItem.processed_by.email}</div>
                                                                </div>
                                                            ) : (
                                                                <span className={cn("text-muted-foreground", isRTL ? '!text-right' : '!text-left')}>—</span>
                                                            )}
                                                        </td>
                                                        <td className={cn("p-3 text-muted-foreground", isRTL ? '!text-right' : '!text-left')} dir={dir}>
                                                            {formatHumanDate(historyItem.processed_at, t)}
                                                        </td>
                                                        <td className={cn("p-3 text-muted-foreground", isRTL ? '!text-right' : '!text-left')} dir={dir}>
                                                            {historyItem.notes || '—'}
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            </div>
                        </TabsContent>
                    )}
                </Tabs>
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
                <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>{t('process_payout')}</DialogTitle>
                        <DialogDescription>
                            {selectedClinic 
                                ? t('process_payout_for_clinic')
                                : t('select_clinic_and_earnings_to_process_payout')}
                        </DialogDescription>
                    </DialogHeader>

                    {loadingClinics ? (
                        <div className="flex items-center justify-center p-8">
                            <p>{t('loading')}</p>
                        </div>
                    ) : !selectedClinic ? (
                        <div className="space-y-4">
                            {groupedClinics.length === 0 ? (
                                <p className="text-center text-muted-foreground p-8">
                                    {t('no_pending_earnings')}
                                </p>
                            ) : (
                                <div className="space-y-2 max-h-96 overflow-y-auto">
                                    {groupedClinics.map((clinic) => (
                                        <div
                                            key={clinic.clinic_id}
                                            className="border rounded-lg p-4 hover:bg-accent cursor-pointer transition-colors"
                                            onClick={() => handleOpenProcessPayoutModalForClinic(clinic)}
                                        >
                                            <div className="flex justify-between items-center">
                                                <div>
                                                    <h3 className="font-semibold">
                                                        {getLocalizedName(clinic.clinic_name_en, clinic.clinic_name_ar, locale)}
                                                    </h3>
                                                    {clinic.owner_name && (
                                                        <p className="text-sm text-muted-foreground">{clinic.owner_name}</p>
                                                    )}
                                                    <p className="text-sm text-muted-foreground mt-1">
                                                        {t('total_available')}: {(Math.round(clinic.total_net_amount * 100) / 100).toFixed(2)} KWD
                                                    </p>
                                                    <p className="text-xs text-muted-foreground">
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
                                                >
                                                    <DollarSign className="h-4 w-4 mr-2" />
                                                    {t('process_payout')}
                                                </Button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="space-y-4">
                            <div className="flex justify-between items-center border-b pb-2">
                                <div>
                                    <h3 className="font-semibold">
                                        {getLocalizedName(selectedClinic.clinic_name_en, selectedClinic.clinic_name_ar, locale)}
                                    </h3>
                                    <p className="text-sm text-muted-foreground">
                                        {t('total_available')}: {(Math.round((selectedClinic.total_remaining_amount !== undefined ? selectedClinic.total_remaining_amount : selectedClinic.total_net_amount) * 100) / 100).toFixed(2)} KWD
                                    </p>
                                    {selectedClinic.total_remaining_amount !== undefined && selectedClinic.total_remaining_amount < selectedClinic.total_net_amount && (
                                        <p className="text-xs text-muted-foreground">
                                            {t('total_net')}: {(Math.round(selectedClinic.total_net_amount * 100) / 100).toFixed(2)} KWD
                                        </p>
                                    )}
                                </div>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => {
                                        setSelectedClinic(null);
                                        setSelectedEarningIds([]);
                                        payoutForm.reset();
                                    }}
                                >
                                    {t('back')}
                                </Button>
                            </div>

                            {/* Earnings Table */}
                            <div className="border rounded-lg overflow-hidden">
                                <div className="max-h-64 overflow-y-auto">
                                    <table className="w-full text-sm">
                                        <thead className="bg-muted sticky top-0">
                                            <tr>
                                                <th className="p-2 text-left">
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
                                                    />
                                                </th>
                                                <th className="p-2 text-left">{t('booking_reference')}</th>
                                                <th className="p-2 text-right">{t('net_amount')}</th>
                                                <th className="p-2 text-right">{t('created_at')}</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {selectedClinic.earnings.map((earning) => (
                                                <tr key={earning.id} className="border-t hover:bg-accent">
                                                    <td className="p-2">
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
                                                        />
                                                    </td>
                                                    <td className="p-2 font-mono">{earning.booking_reference || t('n_a')}</td>
                                                    <td className="p-2 text-right font-medium">
                                                        {(Math.round(earning.net_amount * 100) / 100).toFixed(2)} {earning.currency}
                                                    </td>
                                                    <td className="p-2 text-right text-xs text-muted-foreground">
                                                        {formatHumanDate(earning.created_at, t)}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>

                            {/* Payout Form */}
                            <div className="space-y-4">
                                <div className={cn("space-y-2", textAlign)}>
                                    <Label htmlFor="payout_reference" className={textAlign}>{t('payout_reference')} <span className="text-red-500">*</span></Label>
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
                                        <p className={cn("text-sm text-red-600 dark:text-red-400 mt-1", textAlign)} dir={dir}>{payoutForm.errors.payout_reference}</p>
                                    )}
                                </div>

                                <div className={cn("space-y-2", textAlign)}>
                                    <Label htmlFor="amount" className={textAlign}>{t('amount')} <span className="text-red-500">*</span></Label>
                                    <Input
                                        id="amount"
                                        type="text"
                                        inputMode="numeric"
                                        value={payoutForm.data.amount}
                                        onChange={(e) => {
                                            const rawValue = e.target.value;
                                            // Remove any non-numeric characters except decimal point
                                            let cleanedValue = rawValue.replace(/[^\d.]/g, '');
                                            
                                            // Ensure only one decimal point
                                            const parts = cleanedValue.split('.');
                                            if (parts.length > 2) {
                                                cleanedValue = parts[0] + '.' + parts.slice(1).join('');
                                            }
                                            
                                            // Limit decimal places to 2 during typing
                                            if (parts.length === 2 && parts[1].length > 2) {
                                                cleanedValue = parts[0] + '.' + parts[1].substring(0, 2);
                                            }
                                            
                                            // Allow empty string or valid number format
                                            if (cleanedValue === '' || cleanedValue === '.' || /^\d+\.?\d*$/.test(cleanedValue)) {
                                                payoutForm.setData('amount', cleanedValue);
                                            }
                                        }}
                                        onBlur={(e) => {
                                            const value = e.target.value.trim();
                                            // Format to 2 decimal places on blur if valid number
                                            if (value && value !== '.' && !isNaN(parseFloat(value))) {
                                                const numValue = parseFloat(value);
                                                if (numValue > 0) {
                                                    const maxAmount = Math.round((selectedClinic.total_remaining_amount !== undefined ? selectedClinic.total_remaining_amount : selectedClinic.total_net_amount) * 100) / 100;
                                                    const rounded = Math.round(numValue * 100) / 100;
                                                    const finalValue = rounded > maxAmount ? maxAmount : rounded;
                                                    payoutForm.setData('amount', finalValue.toFixed(2));
                                                } else {
                                                    payoutForm.setData('amount', '');
                                                }
                                            } else if (value === '' || value === '.') {
                                                payoutForm.setData('amount', '');
                                            }
                                        }}
                                        placeholder={(Math.round((selectedClinic.total_remaining_amount !== undefined ? selectedClinic.total_remaining_amount : selectedClinic.total_net_amount) * 100) / 100).toFixed(2)}
                                        required
                                        dir={getFieldDir('number')}
                                        className={cn("mt-1", getInputTextAlign('number'))}
                                    />
                                    <p className={cn("text-xs text-muted-foreground mt-1", textAlign)} dir={dir}>
                                        {t('max_amount')}: <span className="font-semibold">{(Math.round((selectedClinic.total_remaining_amount !== undefined ? selectedClinic.total_remaining_amount : selectedClinic.total_net_amount) * 100) / 100).toFixed(2)} KWD</span>
                                    </p>
                                    {payoutForm.errors.amount && (
                                        <p className={cn("text-sm text-red-600 dark:text-red-400 mt-1", textAlign)} dir={dir}>{payoutForm.errors.amount}</p>
                                    )}
                                </div>

                                <div className={cn("space-y-2", textAlign)}>
                                    <Label htmlFor="notes" className={textAlign}>{t('notes')}</Label>
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
                                        <p className={cn("text-sm text-red-600 dark:text-red-400 mt-1", textAlign)} dir={dir}>{payoutForm.errors.notes}</p>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}

                    <DialogFooter>
                        {selectedClinic && (
                            <>
                                <Button
                                    variant="outline"
                                    onClick={() => {
                                        setSelectedClinic(null);
                                        setSelectedEarningIds([]);
                                        payoutForm.reset();
                                    }}
                                >
                                    {t('cancel')}
                                </Button>
                                <Button
                                    onClick={handleProcessPayout}
                                    disabled={payoutForm.processing}
                                >
                                    {payoutForm.processing ? t('processing') : t('generate_payout')}
                                </Button>
                            </>
                        )}
                        {!selectedClinic && (
                            <Button
                                variant="outline"
                                onClick={() => setShowProcessPayoutModal(false)}
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

