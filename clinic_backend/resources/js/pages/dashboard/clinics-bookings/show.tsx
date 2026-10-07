import { type BreadcrumbItem } from '@/types';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useTranslation } from '@/hooks/use-translation';
import { useRTL } from '@/hooks/use-rtl';
import { useRTLInit } from '@/hooks/use-rtl-init';
import { getLocalizedName } from '@/utils/localization';
import AppLayout from '@/layouts/app-layout';
import { index as dashboard } from '@/routes/dashboard';
import { Head, Link, useForm, usePage } from '@inertiajs/react';
import { useState } from 'react';
import { ArrowLeft, Calendar, Clock, DollarSign, User, Building2, FileText, Check, X, RotateCcw } from 'lucide-react';
import { type SharedData } from '@/types';

interface BookingSession {
    id: number;
    slot_date: string;
    slot_time: string;
    created_at: string;
}

interface ShowClinicBookingProps {
    booking: {
        id: number;
        booking_reference: string;
        user?: {
            id: number;
            name: string;
            email: string;
            phone?: string;
        };
        clinic?: {
            id: number;
            name_en: string;
            name_ar: string;
            email?: string;
            phone?: string;
            address?: {
                full_address?: string;
                governorate_id?: number;
                governorate_name?: string;
                area_id?: number;
                area_name?: string;
                block?: string;
                street?: string;
                avenue?: string;
                house?: string;
                floor?: string;
                apt?: string;
                city?: string;
                state?: string;
                country?: string;
                postal_code?: string;
                latitude?: number;
                longitude?: number;
            };
            governorate?: {
                id: number;
                name_en: string;
                name_ar: string;
            };
            area?: {
                id: number;
                name_en: string;
                name_ar: string;
            };
            cancellation_policy_en?: string;
            cancellation_policy_ar?: string;
            refund_policy_en?: string;
            refund_policy_ar?: string;
        };
        treatment?: {
            id: number;
            name_en: string;
            name_ar: string;
        };
        machine?: {
            id: number;
            serial_number: string;
        };
        status: string;
        payment_status: string;
        total_amount: string;
        currency: string;
        notes?: string;
        special_instructions?: string;
        cancellation_reason?: string;
        confirmed_at?: string;
        completed_at?: string;
        cancelled_at?: string;
        created_at: string;
        sessions?: BookingSession[];
    };
}

export default function ShowClinicBooking({ booking }: ShowClinicBookingProps) {
    useRTLInit();
    const { t, locale } = useTranslation();
    const page = usePage<SharedData>();
    const { locale: pageLocale } = page.props;
    const isRTL = pageLocale === 'ar';
    const dir = isRTL ? 'rtl' : 'ltr';
    const { flexDirection, getFieldDir, getInputTextAlign, iconMargin } = useRTL();
    const [showAcceptDialog, setShowAcceptDialog] = useState(false);
    const [showRejectDialog, setShowRejectDialog] = useState(false);
    const [showCompleteDialog, setShowCompleteDialog] = useState(false);
    const [showRescheduleDialog, setShowRescheduleDialog] = useState(false);

    const acceptForm = useForm({});
    const rejectForm = useForm({
        rejection_reason: '',
    });
    const completeForm = useForm({});
    const rescheduleForm = useForm({
        slot_date: '',
        slot_time: '',
        reschedule_reason: '',
    });

    const handleAccept = () => {
        acceptForm.post(`/dashboard/clinics-bookings/${booking.id}/accept`, {
            preserveScroll: true,
            onSuccess: () => {
                setShowAcceptDialog(false);
            },
        });
    };

    const handleReject = () => {
        rejectForm.post(`/dashboard/clinics-bookings/${booking.id}/reject`, {
            preserveScroll: true,
            onSuccess: () => {
                setShowRejectDialog(false);
            },
        });
    };

    const handleComplete = () => {
        completeForm.post(`/dashboard/clinics-bookings/${booking.id}/complete`, {
            preserveScroll: true,
            onSuccess: () => {
                setShowCompleteDialog(false);
            },
        });
    };

    const handleReschedule = () => {
        rescheduleForm.post(`/dashboard/clinics-bookings/${booking.id}/reschedule`, {
            preserveScroll: true,
            onSuccess: () => {
                setShowRescheduleDialog(false);
            },
        });
    };
    
    if (!booking) {
        return (
            <AppLayout breadcrumbs={[]}>
                <Head title={t('booking_not_found')} />
                <div className="flex h-full flex-1 flex-col gap-6 overflow-x-auto rounded-xl bg-card dark:bg-card p-6 border border-border" dir={isRTL ? 'rtl' : 'ltr'}>
                    <p>{t('booking_not_found')}</p>
                </div>
            </AppLayout>
        );
    }
    
    const breadcrumbs: BreadcrumbItem[] = [
        {
            title: t('dashboard'),
            href: dashboard.url(),
        },
        {
            title: t('clinics_bookings_management'),
            href: '/dashboard/clinics-bookings',
        },
        {
            title: booking.booking_reference || t('booking_details'),
            href: '#',
        },
    ];

    const getStatusBadge = (status: string) => {
        const colors: Record<string, string> = {
            pending: 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-700 hover:bg-amber-200 dark:hover:bg-amber-900/50',
            confirmed: 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-700 hover:bg-blue-200 dark:hover:bg-blue-900/50',
            cancelled: 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 border-red-200 dark:border-red-700 hover:bg-red-200 dark:hover:bg-red-900/50',
            completed: 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-700 hover:bg-emerald-200 dark:hover:bg-emerald-900/50',
        };
        
        const indicatorColors: Record<string, string> = {
            pending: 'bg-amber-500',
            confirmed: 'bg-blue-500',
            cancelled: 'bg-red-500',
            completed: 'bg-emerald-500',
        };
        
        return (
            <Badge 
                variant="secondary"
                className={cn("font-semibold", colors[status] || '', isRTL ? '!text-right' : '!text-left')}
            >
                <div className={cn("w-2 h-2 rounded-full", isRTL ? 'ml-2' : 'mr-2', indicatorColors[status] || 'bg-gray-500')} />
                {t(status)}
            </Badge>
        );
    };

    const getPaymentStatusBadge = (status: string) => {
        const colors: Record<string, string> = {
            pending: 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-700 hover:bg-amber-200 dark:hover:bg-amber-900/50',
            paid: 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-700 hover:bg-emerald-200 dark:hover:bg-emerald-900/50',
            refunded: 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 border-red-200 dark:border-red-700 hover:bg-red-200 dark:hover:bg-red-900/50',
            partial: 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 border-indigo-200 dark:border-indigo-700 hover:bg-indigo-200 dark:hover:bg-indigo-900/50',
        };
        
        const indicatorColors: Record<string, string> = {
            pending: 'bg-amber-500',
            paid: 'bg-emerald-500',
            refunded: 'bg-red-500',
            partial: 'bg-indigo-500',
        };
        
        return (
            <Badge 
                variant="secondary"
                className={cn("font-semibold", colors[status] || '', isRTL ? '!text-right' : '!text-left')}
            >
                <div className={cn("w-2 h-2 rounded-full", isRTL ? 'ml-2' : 'mr-2', indicatorColors[status] || 'bg-gray-500')} />
                {t(status)}
            </Badge>
        );
    };

    const formatDate = (date: string | null) => {
        if (!date) return t('n_a');
        return new Date(date).toLocaleDateString(locale === 'ar' ? 'ar-SA' : 'en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`${t('booking_details')} - ${booking.booking_reference}`} />

            <div className={cn("flex h-full flex-1 flex-col gap-6 overflow-x-auto rounded-xl bg-card dark:bg-card p-6 border border-border", isRTL ? '!text-right' : '!text-left')} dir={dir}>
                {/* Header */}
                <div className={cn("border-b pb-4 space-y-4", isRTL ? '!text-right' : '!text-left')}>
                    <div className={cn("flex items-center gap-4", flexDirection)}>
                        <Link href="/dashboard/clinics-bookings">
                            <Button variant="ghost" size="icon">
                                <ArrowLeft className={cn("h-4 w-4", isRTL && 'rotate-180')} />
                            </Button>
                        </Link>
                        <div className={cn(isRTL ? '!text-right' : '!text-left')}>
                            <h1 className={cn("text-3xl font-bold text-foreground", isRTL ? '!text-right' : '!text-left')}>{booking.booking_reference}</h1>
                            <p className={cn("text-muted-foreground mt-1", isRTL ? '!text-right' : '!text-left')}>{t('booking_details')}</p>
                        </div>
                    </div>
                    <div className={cn("flex flex-wrap items-center gap-4", flexDirection)}>
                        {/* Status Cards */}
                        <div className={cn("flex items-center gap-3 p-3 rounded-lg bg-muted/50 border", flexDirection)}>
                            <div className={cn("flex flex-col", isRTL ? 'items-end' : 'items-start')}>
                                <span className={cn("text-xs font-medium text-muted-foreground uppercase tracking-wide", isRTL ? '!text-right' : '!text-left')}>{t('booking_status')}</span>
                                <div className="mt-1">
                                    {getStatusBadge(booking.status)}
                                </div>
                            </div>
                        </div>
                        
                        {booking.payment_status && (
                            <div className={cn("flex items-center gap-3 p-3 rounded-lg bg-muted/50 border", flexDirection)}>
                                <div className={cn("flex flex-col", isRTL ? 'items-end' : 'items-start')}>
                                    <span className={cn("text-xs font-medium text-muted-foreground uppercase tracking-wide", isRTL ? '!text-right' : '!text-left')}>{t('payment_status')}</span>
                                    <div className="mt-1">
                                        {getPaymentStatusBadge(booking.payment_status)}
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Action Buttons */}
                        <div className={cn("flex items-center gap-3", isRTL ? 'mr-auto ml-0' : 'ml-auto')}>
                            {booking.status === 'pending' && (
                                <>
                                    <Button
                                        variant="default"
                                        onClick={() => setShowAcceptDialog(true)}
                                        className={cn("bg-emerald-600 hover:bg-emerald-700", flexDirection)}
                                        size="sm"
                                    >
                                        <Check className={cn("h-4 w-4", iconMargin('sm'))} />
                                        {t('accept')}
                                    </Button>
                                    <Button
                                        variant="destructive"
                                        onClick={() => setShowRejectDialog(true)}
                                        className={flexDirection}
                                        size="sm"
                                    >
                                        <X className={cn("h-4 w-4", iconMargin('sm'))} />
                                        {t('reject')}
                                    </Button>
                                </>
                            )}
                            
                            {(booking.status === 'confirmed' || booking.status === 'accepted') && (
                                <>
                                    <Button
                                        variant="default"
                                        onClick={() => setShowCompleteDialog(true)}
                                        className={cn("bg-emerald-600 hover:bg-emerald-700", flexDirection)}
                                        size="sm"
                                    >
                                        <Check className={cn("h-4 w-4", iconMargin('sm'))} />
                                        {t('complete')}
                                    </Button>
                                    <Button
                                        variant="outline"
                                        onClick={() => setShowRescheduleDialog(true)}
                                        className={flexDirection}
                                        size="sm"
                                    >
                                        <RotateCcw className={cn("h-4 w-4", iconMargin('sm'))} />
                                        {t('reschedule')}
                                    </Button>
                                </>
                            )}
                        </div>
                    </div>
                </div>

                <Tabs defaultValue="details" className="w-full">
                    <TabsList className={flexDirection}>
                        <TabsTrigger value="details" className={cn(isRTL ? '!text-right' : '!text-left')}>{t('details')}</TabsTrigger>
                        <TabsTrigger value="sessions" className={cn(isRTL ? '!text-right' : '!text-left')}>{t('sessions')}</TabsTrigger>
                        {booking.notes && <TabsTrigger value="notes" className={cn(isRTL ? '!text-right' : '!text-left')}>{t('notes')}</TabsTrigger>}
                    </TabsList>

                    <TabsContent value="details" className={cn("space-y-6", isRTL ? '!text-right' : '!text-left')} dir={dir}>
                        <div className="grid gap-6 md:grid-cols-2">
                            {/* User Information */}
                            <div className={cn("space-y-4", isRTL ? '!text-right' : '!text-left')}>
                                <h3 className={cn("text-lg font-semibold flex items-center gap-2", flexDirection)}>
                                    <User className="h-5 w-5" />
                                    {t('user_information')}
                                </h3>
                                <div className={cn("space-y-2", isRTL ? '!text-right' : '!text-left')}>
                                    <div className={cn(isRTL ? '!text-right' : '!text-left')}>
                                        <p className={cn("text-sm text-muted-foreground", isRTL ? '!text-right' : '!text-left')}>{t('name')}</p>
                                        <p className={cn("font-medium", isRTL ? '!text-right' : '!text-left')}>{booking.user?.name || t('n_a')}</p>
                                    </div>
                                    {booking.user?.email && (
                                        <div className={cn(isRTL ? '!text-right' : '!text-left')}>
                                            <p className={cn("text-sm text-muted-foreground", isRTL ? '!text-right' : '!text-left')}>{t('email')}</p>
                                            <p className={cn("font-medium", isRTL ? '!text-right' : '!text-left')}>{booking.user.email}</p>
                                        </div>
                                    )}
                                    {booking.user?.phone && (
                                        <div className={cn(isRTL ? '!text-right' : '!text-left')}>
                                            <p className={cn("text-sm text-muted-foreground", isRTL ? '!text-right' : '!text-left')}>{t('phone')}</p>
                                            <p className={cn("font-medium", isRTL ? '!text-right' : '!text-left')}>{booking.user.phone}</p>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Clinic Information */}
                            <div className={cn("space-y-4", isRTL ? '!text-right' : '!text-left')}>
                                <h3 className={cn("text-lg font-semibold flex items-center gap-2", flexDirection)}>
                                    <Building2 className="h-5 w-5" />
                                    {t('clinic_information')}
                                </h3>
                                <div className={cn("space-y-2", isRTL ? '!text-right' : '!text-left')}>
                                    <div className={cn(isRTL ? '!text-right' : '!text-left')}>
                                        <p className={cn("text-sm text-muted-foreground", isRTL ? '!text-right' : '!text-left')}>{t('clinic')}</p>
                                        <p className={cn("font-medium", isRTL ? '!text-right' : '!text-left')}>{getLocalizedName(booking.clinic?.name_en, booking.clinic?.name_ar, locale)}</p>
                                    </div>
                                    {booking.clinic?.phone && (
                                        <div className={cn(isRTL ? '!text-right' : '!text-left')}>
                                            <p className={cn("text-sm text-muted-foreground", isRTL ? '!text-right' : '!text-left')}>{t('phone')}</p>
                                            <p className={cn("font-medium", isRTL ? '!text-right' : '!text-left')}>{booking.clinic.phone}</p>
                                        </div>
                                    )}
                                    {booking.clinic?.email && (
                                        <div className={cn(isRTL ? '!text-right' : '!text-left')}>
                                            <p className={cn("text-sm text-muted-foreground", isRTL ? '!text-right' : '!text-left')}>{t('email')}</p>
                                            <p className={cn("font-medium", isRTL ? '!text-right' : '!text-left')}>{booking.clinic.email}</p>
                                        </div>
                                    )}
                                    {booking.clinic?.address && (
                                        <div className={cn(isRTL ? '!text-right' : '!text-left')}>
                                            <p className={cn("text-sm text-muted-foreground", isRTL ? '!text-right' : '!text-left')}>{t('address')}</p>
                                            <div className={cn("font-medium space-y-1", isRTL ? '!text-right' : '!text-left')} dir={dir}>
                                                {booking.clinic.address.full_address && (
                                                    <p className={cn(isRTL ? '!text-right' : '!text-left')}>{booking.clinic.address.full_address}</p>
                                                )}
                                                {(booking.clinic.address.governorate_name || booking.clinic.address.area_name) && (
                                                    <p className={cn(isRTL ? '!text-right' : '!text-left')}>
                                                        {[booking.clinic.address.governorate_name, booking.clinic.address.area_name]
                                                            .filter(Boolean)
                                                            .join(', ')}
                                                    </p>
                                                )}
                                                {booking.clinic.address.block && (
                                                    <p className={cn(isRTL ? '!text-right' : '!text-left')}>{t('block')}: {booking.clinic.address.block}</p>
                                                )}
                                                {booking.clinic.address.street && (
                                                    <p className={cn(isRTL ? '!text-right' : '!text-left')}>{t('street')}: {booking.clinic.address.street}</p>
                                                )}
                                            </div>
                                        </div>
                                    )}
                                    {(booking.clinic?.cancellation_policy_en || booking.clinic?.cancellation_policy_ar) && (
                                        <div className={cn("pt-3 border-t", isRTL ? '!text-right' : '!text-left')} dir={dir}>
                                            <p className={cn("text-sm text-muted-foreground mb-1", isRTL ? '!text-right' : '!text-left')}>{t('cancellation_policy')}</p>
                                            <p className={cn("font-medium whitespace-pre-wrap", isRTL ? '!text-right' : '!text-left')} dir={dir}>
                                                {isRTL && booking.clinic.cancellation_policy_ar
                                                    ? booking.clinic.cancellation_policy_ar
                                                    : booking.clinic.cancellation_policy_en || booking.clinic.cancellation_policy_ar}
                                            </p>
                                        </div>
                                    )}
                                    {(booking.clinic?.refund_policy_en || booking.clinic?.refund_policy_ar) && (
                                        <div className={cn("pt-3 border-t", isRTL ? '!text-right' : '!text-left')} dir={dir}>
                                            <p className={cn("text-sm text-muted-foreground mb-1", isRTL ? '!text-right' : '!text-left')}>{t('refund_policy')}</p>
                                            <p className={cn("font-medium whitespace-pre-wrap", isRTL ? '!text-right' : '!text-left')} dir={dir}>
                                                {isRTL && booking.clinic.refund_policy_ar
                                                    ? booking.clinic.refund_policy_ar
                                                    : booking.clinic.refund_policy_en || booking.clinic.refund_policy_ar}
                                            </p>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Treatment Information */}
                            <div className={cn("space-y-4", isRTL ? '!text-right' : '!text-left')}>
                                <h3 className={cn("text-lg font-semibold flex items-center gap-2", flexDirection)}>
                                    <FileText className="h-5 w-5" />
                                    {t('treatment_information')}
                                </h3>
                                <div className={cn("space-y-2", isRTL ? '!text-right' : '!text-left')}>
                                    <div className={cn(isRTL ? '!text-right' : '!text-left')}>
                                        <p className={cn("text-sm text-muted-foreground", isRTL ? '!text-right' : '!text-left')}>{t('treatment')}</p>
                                        <p className={cn("font-medium", isRTL ? '!text-right' : '!text-left')}>{getLocalizedName(booking.treatment?.name_en, booking.treatment?.name_ar, locale)}</p>
                                    </div>
                                    {booking.machine && (
                                        <div className={cn(isRTL ? '!text-right' : '!text-left')}>
                                            <p className={cn("text-sm text-muted-foreground", isRTL ? '!text-right' : '!text-left')}>{t('machine')}</p>
                                            <p className={cn("font-medium", isRTL ? '!text-right' : '!text-left')}>{booking.machine.serial_number}</p>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Payment Information */}
                            <div className={cn("space-y-4", isRTL ? '!text-right' : '!text-left')}>
                                <h3 className={cn("text-lg font-semibold flex items-center gap-2", flexDirection)}>
                                    <DollarSign className="h-5 w-5" />
                                    {t('payment_information')}
                                </h3>
                                <div className={cn("space-y-2", isRTL ? '!text-right' : '!text-left')}>
                                    <div className={cn(isRTL ? '!text-right' : '!text-left')}>
                                        <p className={cn("text-sm text-muted-foreground", isRTL ? '!text-right' : '!text-left')}>{t('total_amount')}</p>
                                        <p className={cn("font-medium text-lg", isRTL ? '!text-right' : '!text-left')}>{booking.total_amount} {booking.currency}</p>
                                    </div>
                                    <div className={cn(isRTL ? '!text-right' : '!text-left')}>
                                        <p className={cn("text-sm text-muted-foreground", isRTL ? '!text-right' : '!text-left')}>{t('payment_status')}</p>
                                        <div className="mt-1">{getPaymentStatusBadge(booking.payment_status)}</div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Dates */}
                        <div className={cn("space-y-4 border-t pt-4", isRTL ? '!text-right' : '!text-left')}>
                            <h3 className={cn("text-lg font-semibold flex items-center gap-2", flexDirection)}>
                                <Calendar className="h-5 w-5" />
                                {t('dates')}
                            </h3>
                            <div className="grid gap-4 md:grid-cols-2">
                                <div className={cn(isRTL ? '!text-right' : '!text-left')}>
                                    <p className={cn("text-sm text-muted-foreground", isRTL ? '!text-right' : '!text-left')}>{t('created_at')}</p>
                                    <p className={cn("font-medium", isRTL ? '!text-right' : '!text-left')}>{formatDate(booking.created_at)}</p>
                                </div>
                                {booking.confirmed_at && (
                                    <div className={cn(isRTL ? '!text-right' : '!text-left')}>
                                        <p className={cn("text-sm text-muted-foreground", isRTL ? '!text-right' : '!text-left')}>{t('confirmed_at')}</p>
                                        <p className={cn("font-medium", isRTL ? '!text-right' : '!text-left')}>{formatDate(booking.confirmed_at)}</p>
                                    </div>
                                )}
                                {booking.completed_at && (
                                    <div className={cn(isRTL ? '!text-right' : '!text-left')}>
                                        <p className={cn("text-sm text-muted-foreground", isRTL ? '!text-right' : '!text-left')}>{t('completed_at')}</p>
                                        <p className={cn("font-medium", isRTL ? '!text-right' : '!text-left')}>{formatDate(booking.completed_at)}</p>
                                    </div>
                                )}
                                {booking.cancelled_at && (
                                    <div className={cn(isRTL ? '!text-right' : '!text-left')}>
                                        <p className={cn("text-sm text-muted-foreground", isRTL ? '!text-right' : '!text-left')}>{t('cancelled_at')}</p>
                                        <p className={cn("font-medium", isRTL ? '!text-right' : '!text-left')}>{formatDate(booking.cancelled_at)}</p>
                                    </div>
                                )}
                            </div>
                            {booking.cancellation_reason && (
                                <div className={cn(isRTL ? '!text-right' : '!text-left')}>
                                    <p className={cn("text-sm text-muted-foreground", isRTL ? '!text-right' : '!text-left')}>{t('cancellation_reason')}</p>
                                    <p className={cn("font-medium", isRTL ? '!text-right' : '!text-left')} dir={dir}>{booking.cancellation_reason}</p>
                                </div>
                            )}
                        </div>
                    </TabsContent>

                    <TabsContent value="sessions" className={cn("space-y-4", isRTL ? '!text-right' : '!text-left')} dir={dir}>
                        <h3 className={cn("text-lg font-semibold", isRTL ? '!text-right' : '!text-left')}>{t('booking_sessions')}</h3>
                        {booking.sessions && booking.sessions.length > 0 ? (
                            <div className={cn("space-y-2", isRTL ? '!text-right' : '!text-left')}>
                                {booking.sessions.map((session, index) => (
                                    <div key={session.id} className={cn("flex items-center justify-between p-4 border rounded-lg", flexDirection)}>
                                        <div className={cn("flex items-center gap-4", flexDirection)}>
                                            <div className="flex items-center justify-center w-10 h-10 rounded-full bg-primary/10">
                                                <span className="font-semibold text-primary">{index + 1}</span>
                                            </div>
                                            <div className={cn(isRTL ? '!text-right' : '!text-left')}>
                                                <p className={cn("font-medium", isRTL ? '!text-right' : '!text-left')}>{formatDate(session.slot_date)}</p>
                                                <p className={cn("text-sm text-muted-foreground flex items-center gap-1", flexDirection)}>
                                                    <Clock className="h-3 w-3" />
                                                    {session.slot_time}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className={cn("text-muted-foreground", isRTL ? '!text-right' : '!text-left')}>{t('no_sessions_found')}</p>
                        )}
                    </TabsContent>

                    {booking.notes && (
                        <TabsContent value="notes" className={cn("space-y-4", isRTL ? '!text-right' : '!text-left')} dir={dir}>
                            <h3 className={cn("text-lg font-semibold", isRTL ? '!text-right' : '!text-left')}>{t('notes')}</h3>
                            <div className={cn("p-4 bg-muted rounded-lg", isRTL ? '!text-right' : '!text-left')} dir={dir}>
                                <p className={cn("whitespace-pre-wrap", isRTL ? '!text-right' : '!text-left')} dir={dir}>{booking.notes}</p>
                            </div>
                            {booking.special_instructions && (
                                <div className={cn(isRTL ? '!text-right' : '!text-left')}>
                                    <h4 className={cn("font-semibold mb-2", isRTL ? '!text-right' : '!text-left')}>{t('special_instructions')}</h4>
                                    <div className={cn("p-4 bg-muted rounded-lg", isRTL ? '!text-right' : '!text-left')} dir={dir}>
                                        <p className={cn("whitespace-pre-wrap", isRTL ? '!text-right' : '!text-left')} dir={dir}>{booking.special_instructions}</p>
                                    </div>
                                </div>
                            )}
                        </TabsContent>
                    )}
                </Tabs>
            </div>

            {/* Accept Confirmation Dialog */}
            <Dialog open={showAcceptDialog} onOpenChange={setShowAcceptDialog}>
                <DialogContent className={cn(isRTL ? 'rtl' : 'ltr', isRTL ? '!text-right' : '!text-left')} dir={dir}>
                    <DialogHeader>
                        <DialogTitle className={cn(isRTL ? '!text-right' : '!text-left')}>{t('accept_booking')}</DialogTitle>
                        <DialogDescription className={cn(isRTL ? '!text-right' : '!text-left')}>
                            {t('accept_booking_description')}
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter className={flexDirection}>
                        <Button variant="outline" onClick={() => setShowAcceptDialog(false)}>
                            {t('cancel')}
                        </Button>
                        <Button 
                            onClick={handleAccept}
                            disabled={acceptForm.processing}
                            className="bg-emerald-600 hover:bg-emerald-700"
                        >
                            {acceptForm.processing ? t('processing') : t('accept')}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Reject Dialog */}
            <Dialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
                <DialogContent className={cn(isRTL ? 'rtl' : 'ltr', isRTL ? '!text-right' : '!text-left')} dir={dir}>
                    <DialogHeader>
                        <DialogTitle className={cn(isRTL ? '!text-right' : '!text-left')}>{t('reject_booking')}</DialogTitle>
                        <DialogDescription className={cn(isRTL ? '!text-right' : '!text-left')}>
                            {t('reject_booking_description')}
                        </DialogDescription>
                    </DialogHeader>
                    <div className={cn("space-y-4", isRTL ? '!text-right' : '!text-left')} dir={dir}>
                        <div>
                            <Label htmlFor="rejection_reason" className={cn(isRTL ? '!text-right' : '!text-left')}>{t('rejection_reason')} ({t('optional')})</Label>
                            <Textarea
                                id="rejection_reason"
                                value={rejectForm.data.rejection_reason}
                                onChange={(e) => rejectForm.setData('rejection_reason', e.target.value)}
                                placeholder={t('enter_rejection_reason')}
                                rows={3}
                                dir={getFieldDir('textarea')}
                                className={cn(getInputTextAlign('textarea'))}
                            />
                        </div>
                    </div>
                    <DialogFooter className={flexDirection}>
                        <Button variant="outline" onClick={() => setShowRejectDialog(false)}>
                            {t('cancel')}
                        </Button>
                        <Button 
                            variant="destructive"
                            onClick={handleReject}
                            disabled={rejectForm.processing}
                        >
                            {rejectForm.processing ? t('processing') : t('reject')}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Complete Confirmation Dialog */}
            <Dialog open={showCompleteDialog} onOpenChange={setShowCompleteDialog}>
                <DialogContent className={cn(isRTL ? 'rtl' : 'ltr', isRTL ? '!text-right' : '!text-left')} dir={dir}>
                    <DialogHeader>
                        <DialogTitle className={cn(isRTL ? '!text-right' : '!text-left')}>{t('complete_booking')}</DialogTitle>
                        <DialogDescription className={cn(isRTL ? '!text-right' : '!text-left')}>
                            {t('complete_booking_description')}
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter className={flexDirection}>
                        <Button variant="outline" onClick={() => setShowCompleteDialog(false)}>
                            {t('cancel')}
                        </Button>
                        <Button 
                            onClick={handleComplete}
                            disabled={completeForm.processing}
                            className="bg-emerald-600 hover:bg-emerald-700"
                        >
                            {completeForm.processing ? t('processing') : t('complete')}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Reschedule Dialog */}
            <Dialog open={showRescheduleDialog} onOpenChange={setShowRescheduleDialog}>
                <DialogContent className={cn(isRTL ? 'rtl' : 'ltr', isRTL ? '!text-right' : '!text-left')} dir={dir}>
                    <DialogHeader>
                        <DialogTitle className={cn(isRTL ? '!text-right' : '!text-left')}>{t('reschedule_booking')}</DialogTitle>
                        <DialogDescription className={cn(isRTL ? '!text-right' : '!text-left')}>
                            {t('reschedule_booking_description')}
                        </DialogDescription>
                    </DialogHeader>
                    <div className={cn("space-y-4", isRTL ? '!text-right' : '!text-left')} dir={dir}>
                        <div className="grid grid-cols-2 gap-4">
                            <div className={cn(isRTL ? '!text-right' : '!text-left')}>
                                <Label htmlFor="slot_date" className={cn(isRTL ? '!text-right' : '!text-left')}>{t('new_date')} *</Label>
                                <Input
                                    id="slot_date"
                                    type="date"
                                    value={rescheduleForm.data.slot_date}
                                    onChange={(e) => rescheduleForm.setData('slot_date', e.target.value)}
                                    min={new Date().toISOString().split('T')[0]}
                                    required
                                />
                            </div>
                            <div className={cn(isRTL ? '!text-right' : '!text-left')}>
                                <Label htmlFor="slot_time" className={cn(isRTL ? '!text-right' : '!text-left')}>{t('new_time')} *</Label>
                                <Input
                                    id="slot_time"
                                    type="time"
                                    value={rescheduleForm.data.slot_time}
                                    onChange={(e) => rescheduleForm.setData('slot_time', e.target.value)}
                                    required
                                />
                            </div>
                        </div>
                        <div className={cn(isRTL ? '!text-right' : '!text-left')}>
                            <Label htmlFor="reschedule_reason" className={cn(isRTL ? '!text-right' : '!text-left')}>{t('reschedule_reason')} ({t('optional')})</Label>
                            <Textarea
                                id="reschedule_reason"
                                value={rescheduleForm.data.reschedule_reason}
                                onChange={(e) => rescheduleForm.setData('reschedule_reason', e.target.value)}
                                placeholder={t('enter_reschedule_reason')}
                                rows={3}
                                dir={getFieldDir('textarea')}
                                className={cn(getInputTextAlign('textarea'))}
                            />
                        </div>
                    </div>
                    <DialogFooter className={flexDirection}>
                        <Button variant="outline" onClick={() => setShowRescheduleDialog(false)}>
                            {t('cancel')}
                        </Button>
                        <Button 
                            onClick={handleReschedule}
                            disabled={rescheduleForm.processing || !rescheduleForm.data.slot_date || !rescheduleForm.data.slot_time}
                        >
                            {rescheduleForm.processing ? t('processing') : t('reschedule')}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </AppLayout>
    );
}

