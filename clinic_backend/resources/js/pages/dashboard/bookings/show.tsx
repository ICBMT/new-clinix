import { type BreadcrumbItem } from '@/types';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { useTranslation } from '@/hooks/use-translation';
import { useRTL } from '@/hooks/use-rtl';
import { useRTLInit } from '@/hooks/use-rtl-init';
import { getLocalizedName } from '@/utils/localization';
import AppLayout from '@/layouts/app-layout';
import { index as dashboard } from '@/routes/dashboard';
import { Head, Link, useForm, router, usePage } from '@inertiajs/react';
import { ArrowLeft, Calendar, Clock, DollarSign, User, Building2, MapPin, FileText, Download, Package, Check, X, Image as ImageIcon, File, Eye } from 'lucide-react';
import { useState, useEffect } from 'react';
import { customToast } from '@/components/ui/custom-toast';
import { type SharedData } from '@/types';
import { UserCard } from '@/components/user-card';
import { ClinicCard } from '@/components/clinic-card';
import { DataTable } from '@/components/data-table';

interface BookingSession {
    id: number;
    slot_date: string;
    slot_time: string;
    status: string;
    treatment_slot_id?: number;
    created_at?: string;
    updated_at?: string;
}

interface BookingDocument {
    id: number;
    file_name?: string;
    name?: string;
    file_path?: string;
    url?: string;
    document_type?: string;
    mime_type?: string;
    file_type?: string;
    created_at: string;
}


interface ShowBookingProps {
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
            cancellation_policy_en?: string;
            cancellation_policy_ar?: string;
            refund_policy_en?: string;
            refund_policy_ar?: string;
        };
        treatment?: {
            id: number;
            name_en: string;
            name_ar: string;
            category?: {
                id: number;
                name_en: string;
                name_ar: string;
            };
        };
        machine?: {
            id: number;
            serial_number: string;
            model_en?: string;
            model_ar?: string;
        };
        patient_body_part?: {
            id: number;
            name_en: string;
            name_ar: string;
        };
        address?: {
            id: number;
            address: string;
            block?: string;
            street?: string;
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
        };
        total_sessions: number;
        base_price: string;
        subtotal: string;
        tax_amount: string;
        total_amount: string;
        currency: string;
        payment_type: string;
        deposit_amount?: string;
        balance_amount?: string;
        status: 'upcoming' | 'accepted' | 'cancelled' | 'completed' | 'past';
        payment_status?: string;
        special_instructions?: string;
        notes?: string;
        cancellation_reason?: string;
        rejection_reason?: string;
        confirmed_at?: string;
        completed_at?: string;
        cancelled_at?: string;
        rejected_at?: string;
        sessions?: BookingSession[];
        documents?: BookingDocument[];
        media?: BookingDocument[];
        reviews?: Array<{
            id: number;
            rating: number;
            comment?: string;
            user?: {
                id: number;
                name: string;
                email: string;
            };
            created_at: string;
        }>;
        created_at: string;
        updated_at: string;
    };
}

// Breadcrumbs will be created dynamically inside component for translation

export default function ShowBooking({ booking }: ShowBookingProps) {
    useRTLInit();
    const { t, locale } = useTranslation();
    const page = usePage<SharedData>();
    const { locale: pageLocale } = page.props;
    const isRTL = pageLocale === 'ar';
    const dir = isRTL ? 'rtl' : 'ltr';
    const { flexDirection, iconMargin, getFieldDir, getInputTextAlign } = useRTL();
    
    // Helper function to get file URL - handles both full URLs and relative paths
    const getFileUrl = (doc: BookingDocument): string => {
        // First try file_path or url (which should be full URLs)
        if (doc.file_path) {
            return doc.file_path;
        }
        if (doc.url) {
            return doc.url;
        }
        // If file_name exists, check if it's already a full URL
        if (doc.file_name) {
            // If file_name already starts with http:// or https://, use it directly
            if (doc.file_name.startsWith('http://') || doc.file_name.startsWith('https://')) {
                return doc.file_name;
            }
            // Otherwise, prepend /storage/ for relative paths
            return `/storage/${doc.file_name}`;
        }
        return '';
    };
    
    // Create breadcrumbs dynamically for translation
    const breadcrumbs: BreadcrumbItem[] = [
        {
            title: t('dashboard'),
            href: dashboard.url(),
        },
        {
            title: t('bookings'),
            href: '/dashboard/bookings',
        },
        {
            title: t('view_booking'),
            href: '#',
        },
    ];
    // Get initial tab from URL parameter or default to 1
    const [activeTab, setActiveTab] = useState<number>(1);
    
    // Sync with URL parameter on mount
    useEffect(() => {
        const urlParams = new URLSearchParams(window.location.search);
        const tab = urlParams.get('tab');
        if (tab) {
            const tabNum = parseInt(tab);
            if (!isNaN(tabNum) && tabNum >= 1 && tabNum <= 5) {
                setActiveTab(tabNum);
            }
        }
    }, []);
    
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
    const [showAcceptDialog, setShowAcceptDialog] = useState(false);
    const [showRejectDialog, setShowRejectDialog] = useState(false);
    const [showCompleteDialog, setShowCompleteDialog] = useState(false);
    const [updatingSessions, setUpdatingSessions] = useState<Set<number>>(new Set());

    const statusForm = useForm({
        status: booking.status,
    });

    const rejectForm = useForm({
        rejection_reason: '',
    });



    const handleAccept = () => {
        statusForm.post(`/dashboard/bookings/${booking.id}/accept`, {
            preserveScroll: true,
            onSuccess: () => {
                setShowAcceptDialog(false);
                customToast.success(t('booking_accepted_successfully'));
                window.location.reload();
            },
            onError: (errors) => {
                console.error('Accept booking error:', errors);
                // Show toast error for payment required or other validation errors
                if (errors.payment_status) {
                    customToast.error(Array.isArray(errors.payment_status) ? errors.payment_status[0] : errors.payment_status);
                } else {
                    customToast.error(t('booking_accept_failed'));
                }
            },
        });
    };

    const handleReject = () => {
        rejectForm.post(`/dashboard/bookings/${booking.id}/reject`, {
            preserveScroll: true,
            onSuccess: () => {
                setShowRejectDialog(false);
                customToast.success(t('booking_rejected_successfully'));
                window.location.reload();
            },
        });
    };

    const handleComplete = () => {
        statusForm.post(`/dashboard/bookings/${booking.id}/complete`, {
            preserveScroll: true,
            onSuccess: () => {
                customToast.success(t('booking_completed_successfully'));
                setShowCompleteDialog(false);
                window.location.reload();
            },
            onError: (errors) => {
                console.error('Complete booking error:', errors);
                if (errors.payment_status) {
                    customToast.error(Array.isArray(errors.payment_status) ? errors.payment_status[0] : errors.payment_status);
                } else {
                    customToast.error(t('booking_complete_failed'));
                }
            },
        });
    };


    const handleToggleSessionStatus = (sessionId: number, currentStatus: string) => {
        // Toggle between pending and completed
        const newStatus = currentStatus === 'completed' ? 'pending' : 'completed';
        
        setUpdatingSessions(prev => new Set(prev).add(sessionId));
        
        router.patch(`/dashboard/bookings/${booking.id}/sessions/${sessionId}/status`, {
            status: newStatus,
        }, {
            preserveScroll: true,
            preserveState: true,
            onSuccess: () => {
                setUpdatingSessions(prev => {
                    const next = new Set(prev);
                    next.delete(sessionId);
                    return next;
                });
            },
            onError: () => {
                setUpdatingSessions(prev => {
                    const next = new Set(prev);
                    next.delete(sessionId);
                    return next;
                });
            },
        });
    };


    const formatDate = (date: string) => {
        return new Date(date).toLocaleDateString(locale === 'ar' ? 'ar-SA' : 'en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
        });
    };

    const formatDateTime = (date: string) => {
        return new Date(date).toLocaleString(locale === 'ar' ? 'ar-SA' : 'en-US', {
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
                <div className={cn("flex items-center justify-between border-b pb-4", flexDirection)}>
                    <div className={cn(isRTL ? '!text-right' : '!text-left')}>
                        <div className={cn("flex items-center gap-3", flexDirection)}>
                            <h1 className={cn("text-3xl font-bold text-foreground", isRTL ? '!text-right' : '!text-left')}>{t('booking_details')}</h1>
                            <Badge
                                variant="secondary"
                                className={cn(
                                    "text-base px-4 py-1",
                                    booking.status === 'completed' ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-800 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800' :
                                    booking.status === 'accepted' ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 border-blue-200 dark:border-blue-800' :
                                    booking.status === 'upcoming' ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-300 border-amber-200 dark:border-amber-800' :
                                    booking.status === 'past' ? 'bg-gray-100 dark:bg-gray-900/30 text-gray-800 dark:text-gray-300 border-gray-200 dark:border-gray-800' :
                                    'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300 border-red-200 dark:border-red-800',
                                    isRTL ? '!text-right' : '!text-left'
                                )}
                            >
                                {t(booking.status)}
                            </Badge>
                        </div>
                        <p className={cn("text-muted-foreground mt-1", isRTL ? '!text-right' : '!text-left')}>{t('view_booking_information')}</p>
                    </div>
                    <div className={cn("flex items-center gap-3", flexDirection)}>
                        {/* Show Accept/Reject buttons for upcoming status */}
                        {booking.status === 'upcoming' && (
                            <>
                                <Button
                                    variant="default"
                                    onClick={() => setShowAcceptDialog(true)}
                                    className={cn("bg-emerald-600 hover:bg-emerald-700 flex items-center gap-2", flexDirection)}
                                >
                                    <Check className={cn("h-4 w-4", iconMargin('md'))} />
                                    {t('accept')}
                                </Button>
                                <Button
                                    variant="destructive"
                                    onClick={() => setShowRejectDialog(true)}
                                    className={cn("flex items-center gap-2", flexDirection)}
                                >
                                    <X className={cn("h-4 w-4", iconMargin('md'))} />
                                    {t('reject')}
                                </Button>
                            </>
                        )}
                        {/* Show Complete button for accepted status */}
                        {booking.status === 'accepted' && (
                            <Button
                                variant="default"
                                onClick={() => setShowCompleteDialog(true)}
                                className={cn("bg-emerald-600 hover:bg-emerald-700 flex items-center gap-2", flexDirection)}
                            >
                                <Check className={cn("h-4 w-4", iconMargin('md'))} />
                                {t('complete')}
                            </Button>
                        )}
                        <Link href="/dashboard/bookings">
                            <Button variant="outline" className={cn("flex items-center gap-2", flexDirection)}>
                                <ArrowLeft className={cn("h-4 w-4", isRTL && 'rotate-180')} />
                                {t('back')}
                            </Button>
                        </Link>
                    </div>
                </div>

                {/* Payment Status Badge */}
                {booking.payment_status && (
                    <div className={cn("flex items-center gap-3 p-3 rounded-lg bg-muted/50 border", flexDirection)}>
                        <div className={cn("flex flex-col", isRTL ? '!text-right' : '!text-left')}>
                            <span className={cn("text-xs font-medium text-muted-foreground uppercase tracking-wide", isRTL ? '!text-right' : '!text-left')}>{t('payment_status')}</span>
                            <Badge 
                                variant="secondary"
                                className={cn(
                                    "mt-1 font-semibold",
                                    booking.payment_status === 'paid' ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-700 hover:bg-emerald-200 dark:hover:bg-emerald-900/50' :
                                    booking.payment_status === 'partial' ? 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 border-indigo-200 dark:border-indigo-700 hover:bg-indigo-200 dark:hover:bg-indigo-900/50' :
                                    booking.payment_status === 'refunded' ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 border-red-200 dark:border-red-700 hover:bg-red-200 dark:hover:bg-red-900/50' :
                                    'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-700 hover:bg-amber-200 dark:hover:bg-amber-900/50',
                                    isRTL ? '!text-right' : '!text-left'
                                )}
                            >
                                <div className={cn(
                                    "w-2 h-2 rounded-full",
                                    isRTL ? 'ml-2' : 'mr-2',
                                    booking.payment_status === 'paid' ? 'bg-emerald-500' :
                                    booking.payment_status === 'partial' ? 'bg-indigo-500' :
                                    booking.payment_status === 'refunded' ? 'bg-red-500' : 'bg-amber-500'
                                )} />
                                {t(booking.payment_status)}
                            </Badge>
                        </div>
                    </div>
                )}

                {/* Tabs */}
                <Tabs value={activeTab.toString()} onValueChange={(value) => handleTabChange(value)} className="w-full">
                    <TabsList className={cn("grid w-full grid-cols-5", flexDirection)}>
                        <TabsTrigger value="1" className={cn(isRTL ? '!text-right' : '!text-left')}>{t('details')}</TabsTrigger>
                        <TabsTrigger value="2" className={cn(isRTL ? '!text-right' : '!text-left')}>{t('sessions')}</TabsTrigger>
                        <TabsTrigger value="3" className={cn(isRTL ? '!text-right' : '!text-left')}>{t('documents')}</TabsTrigger>
                        <TabsTrigger value="4" className={cn(isRTL ? '!text-right' : '!text-left')}>{t('reviews')}</TabsTrigger>
                        <TabsTrigger value="5" className={cn(isRTL ? '!text-right' : '!text-left')}>{t('related_information')}</TabsTrigger>
                    </TabsList>

                    {/* Tab 1: Details */}
                    <TabsContent value="1" className={cn("mt-6", isRTL ? '!text-right' : '!text-left')} dir={dir}>
                        <div className={cn("space-y-6", isRTL ? '!text-right' : '!text-left')} dir={dir}>
                            <div className={cn("flex items-center gap-3 mb-6", flexDirection)}>
                                <FileText className="h-6 w-6 text-primary" />
                                <h2 className={cn("text-2xl font-semibold text-foreground", isRTL ? '!text-right' : '!text-left')}>
                                    {t('details')}
                                </h2>
                            </div>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Booking Reference */}
                            <div className={cn("space-y-2", isRTL ? '!text-right' : '!text-left')}>
                                <p className={cn("text-sm text-muted-foreground flex items-center gap-2", flexDirection)}>
                                    <FileText className="h-4 w-4" />
                                    {t('booking_reference')}
                                </p>
                                <p className={cn("font-medium font-mono text-lg", isRTL ? '!text-right' : '!text-left')}>{booking.booking_reference}</p>
                            </div>

                            {/* User */}
                            <div className={cn("space-y-2", isRTL ? '!text-right' : '!text-left')} dir={dir}>
                                <p className={cn("text-sm text-muted-foreground flex items-center gap-2", flexDirection)}>
                                    <User className="h-4 w-4" />
                                    {t('user')}
                                </p>
                                {booking.user ? (
                                    <Link href={`/dashboard/users/${booking.user.id}`} className="block">
                                        <UserCard 
                                            user={{
                                                id: booking.user.id,
                                                name: booking.user.name,
                                                email: booking.user.email,
                                                phone: booking.user.phone,
                                            }}
                                            variant="card"
                                        />
                                    </Link>
                                ) : (
                                    <p className={cn("text-muted-foreground", isRTL ? '!text-right' : '!text-left')}>{t('n_a')}</p>
                                )}
                            </div>

                            {/* Clinic */}
                            <div className={cn("space-y-2", isRTL ? '!text-right' : '!text-left')} dir={dir}>
                                <p className={cn("text-sm text-muted-foreground flex items-center gap-2", flexDirection)}>
                                    <Building2 className="h-4 w-4" />
                                    {t('clinic')}
                                </p>
                                {booking.clinic ? (
                                    <Link href={`/dashboard/clinics/${booking.clinic.id}`} className="block">
                                        <ClinicCard
                                            clinic={{
                                                id: booking.clinic.id,
                                                company_name_en: booking.clinic.name_en,
                                                company_name_ar: booking.clinic.name_ar,
                                                email: booking.clinic.email,
                                                phone: booking.clinic.phone,
                                                logo: null,
                                            }}
                                            locale={locale}
                                            variant="card"
                                        />
                                    </Link>
                                ) : (
                                    <p className={cn("text-muted-foreground", isRTL ? '!text-right' : '!text-left')}>{t('n_a')}</p>
                                )}
                            </div>

                            {/* Treatment */}
                            <div className={cn("space-y-2", isRTL ? '!text-right' : '!text-left')} dir={dir}>
                                <p className={cn("text-sm text-muted-foreground flex items-center gap-2", flexDirection)}>
                                    <Package className="h-4 w-4" />
                                    {t('treatment')}
                                </p>
                                {booking.treatment ? (
                                    <Link href={`/dashboard/treatments/${booking.treatment.id}`} className="block">
                                        <div className={cn("bg-gray-50 dark:bg-gray-800/50 rounded-lg p-4 border border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors cursor-pointer", isRTL ? '!text-right' : '!text-left')} dir={dir}>
                                            <p className={cn("font-medium text-foreground", isRTL ? '!text-right' : '!text-left')}>
                                                {getLocalizedName(booking.treatment.name_en, booking.treatment.name_ar, locale)}
                                            </p>
                                            {booking.treatment.category && (
                                                <p className={cn("text-sm text-muted-foreground mt-1", isRTL ? '!text-right' : '!text-left')}>
                                                    {getLocalizedName(booking.treatment.category.name_en, booking.treatment.category.name_ar, locale)}
                                                </p>
                                            )}
                                        </div>
                                    </Link>
                                ) : (
                                    <p className={cn("text-muted-foreground", isRTL ? '!text-right' : '!text-left')}>{t('n_a')}</p>
                                )}
                            </div>

                            {/* Machine */}
                            {booking.machine && (
                                <div className={cn("space-y-2", isRTL ? '!text-right' : '!text-left')}>
                                    <p className={cn("text-sm text-muted-foreground", isRTL ? '!text-right' : '!text-left')}>{t('machine')}</p>
                                    <p className={cn("font-medium font-mono", isRTL ? '!text-right' : '!text-left')}>{booking.machine.serial_number}</p>
                                    {booking.machine.model_en && (
                                        <p className={cn("text-sm text-muted-foreground", isRTL ? '!text-right' : '!text-left')}>
                                            {getLocalizedName(booking.machine.model_en, booking.machine.model_ar || '', locale)}
                                        </p>
                                    )}
                                </div>
                            )}

                            {/* Body Part */}
                            {booking.patient_body_part && (
                                <div className={cn("space-y-2", isRTL ? '!text-right' : '!text-left')}>
                                    <p className={cn("text-sm text-muted-foreground", isRTL ? '!text-right' : '!text-left')}>{t('body_part')}</p>
                                    <p className={cn("font-medium text-foreground", isRTL ? '!text-right' : '!text-left')}>
                                        {getLocalizedName(booking.patient_body_part.name_en, booking.patient_body_part.name_ar, locale)}
                                    </p>
                                </div>
                            )}

                            {/* Total Sessions */}
                            <div className={cn("space-y-2", isRTL ? '!text-right' : '!text-left')}>
                                <p className={cn("text-sm text-muted-foreground", isRTL ? '!text-right' : '!text-left')}>{t('total_sessions')}</p>
                                <p className={cn("text-2xl font-bold text-foreground", isRTL ? '!text-right' : '!text-left')}>{booking.total_sessions}</p>
                            </div>

                            {/* Total Amount */}
                            <div className={cn("space-y-2", isRTL ? '!text-right' : '!text-left')}>
                                <p className={cn("text-sm text-muted-foreground flex items-center gap-2", flexDirection)}>
                                    <DollarSign className="h-4 w-4" />
                                    {t('total_amount')}
                                </p>
                                <p className={cn("text-2xl font-bold text-foreground", isRTL ? '!text-right' : '!text-left')}>
                                    {parseFloat(booking.total_amount).toFixed(2)} {booking.currency}
                                </p>
                            </div>

                            {/* Base Price */}
                            <div className={cn("space-y-2", isRTL ? '!text-right' : '!text-left')}>
                                <p className={cn("text-sm text-muted-foreground", isRTL ? '!text-right' : '!text-left')}>{t('base_price')}</p>
                                <p className={cn("text-base font-medium text-foreground", isRTL ? '!text-right' : '!text-left')}>
                                    {parseFloat(booking.base_price).toFixed(2)} {booking.currency}
                                </p>
                            </div>

                            {/* Subtotal */}
                            <div className={cn("space-y-2", isRTL ? '!text-right' : '!text-left')}>
                                <p className={cn("text-sm text-muted-foreground", isRTL ? '!text-right' : '!text-left')}>{t('subtotal')}</p>
                                <p className={cn("text-base font-medium text-foreground", isRTL ? '!text-right' : '!text-left')}>
                                    {parseFloat(booking.subtotal).toFixed(2)} {booking.currency}
                                </p>
                            </div>

                            {/* Tax Amount */}
                            {parseFloat(booking.tax_amount || '0') > 0 && (
                                <div className={cn("space-y-2", isRTL ? '!text-right' : '!text-left')}>
                                    <p className={cn("text-sm text-muted-foreground", isRTL ? '!text-right' : '!text-left')}>{t('tax_amount')}</p>
                                    <p className={cn("text-base font-medium text-foreground", isRTL ? '!text-right' : '!text-left')}>
                                        {parseFloat(booking.tax_amount).toFixed(2)} {booking.currency}
                                    </p>
                                </div>
                            )}

                            {/* Payment Type */}
                            <div className={cn("space-y-2", isRTL ? '!text-right' : '!text-left')}>
                                <p className={cn("text-sm text-muted-foreground", isRTL ? '!text-right' : '!text-left')}>{t('payment_type')}</p>
                                <p className={cn("text-base font-medium text-foreground", isRTL ? '!text-right' : '!text-left')}>{t(booking.payment_type)}</p>
                            </div>

                            {/* Deposit Amount */}
                            {booking.deposit_amount && parseFloat(booking.deposit_amount) > 0 && (
                                <div className={cn("space-y-2", isRTL ? '!text-right' : '!text-left')}>
                                    <p className={cn("text-sm text-muted-foreground", isRTL ? '!text-right' : '!text-left')}>{t('deposit_amount')}</p>
                                    <p className={cn("text-base font-medium text-foreground", isRTL ? '!text-right' : '!text-left')}>
                                        {parseFloat(booking.deposit_amount).toFixed(2)} {booking.currency}
                                    </p>
                                </div>
                            )}

                            {/* Balance Amount */}
                            {booking.balance_amount && parseFloat(booking.balance_amount) > 0 && (
                                <div className={cn("space-y-2", isRTL ? '!text-right' : '!text-left')}>
                                    <p className={cn("text-sm text-muted-foreground", isRTL ? '!text-right' : '!text-left')}>{t('balance_amount')}</p>
                                    <p className={cn("text-base font-medium text-foreground", isRTL ? '!text-right' : '!text-left')}>
                                        {parseFloat(booking.balance_amount).toFixed(2)} {booking.currency}
                                    </p>
                                </div>
                            )}

                            {/* Special Instructions */}
                            {booking.special_instructions && (
                                <div className={cn("space-y-2 md:col-span-2", isRTL ? '!text-right' : '!text-left')}>
                                    <p className={cn("text-sm text-muted-foreground", isRTL ? '!text-right' : '!text-left')}>{t('special_instructions')}</p>
                                    <p className={cn("text-base text-foreground bg-gray-50 dark:bg-gray-800/50 p-3 rounded-lg", isRTL ? '!text-right' : '!text-left')} dir={dir}>
                                        {booking.special_instructions}
                                    </p>
                                </div>
                            )}

                            {/* Notes */}
                            {booking.notes && (
                                <div className={cn("space-y-2 md:col-span-2", isRTL ? '!text-right' : '!text-left')}>
                                    <p className={cn("text-sm text-muted-foreground", isRTL ? '!text-right' : '!text-left')}>{t('notes')}</p>
                                    <p className={cn("text-base text-foreground bg-gray-50 dark:bg-gray-800/50 p-3 rounded-lg", isRTL ? '!text-right' : '!text-left')} dir={dir}>
                                        {booking.notes}
                                    </p>
                                </div>
                            )}

                            {/* Cancellation Reason */}
                            {booking.cancellation_reason && (
                                <div className={cn("space-y-2 md:col-span-2", isRTL ? '!text-right' : '!text-left')}>
                                    <p className={cn("text-sm text-muted-foreground text-red-600 dark:text-red-400", isRTL ? '!text-right' : '!text-left')}>{t('cancellation_reason')}</p>
                                    <p className={cn("text-base text-foreground bg-red-50 dark:bg-red-900/20 p-3 rounded-lg border border-red-200 dark:border-red-800", isRTL ? '!text-right' : '!text-left')} dir={dir}>
                                        {booking.cancellation_reason}
                                    </p>
                                </div>
                            )}

                            {/* Rejection Reason */}
                            {booking.rejection_reason && (
                                <div className={cn("space-y-2 md:col-span-2", isRTL ? '!text-right' : '!text-left')}>
                                    <p className={cn("text-sm text-muted-foreground text-red-600 dark:text-red-400", isRTL ? '!text-right' : '!text-left')}>{t('rejection_reason')}</p>
                                    <p className={cn("text-base text-foreground bg-red-50 dark:bg-red-900/20 p-3 rounded-lg border border-red-200 dark:border-red-800", isRTL ? '!text-right' : '!text-left')} dir={dir}>
                                        {booking.rejection_reason}
                                    </p>
                                </div>
                            )}
                            </div>
                        </div>
                    </TabsContent>

                    {/* Tab 2: Sessions */}
                    <TabsContent value="2" className={cn("mt-6", isRTL ? '!text-right' : '!text-left')} dir={dir}>
                        <div className={cn("space-y-6", isRTL ? '!text-right' : '!text-left')} dir={dir}>
                            <div className={cn("flex items-center gap-3 mb-6", flexDirection)}>
                                <Clock className="h-6 w-6 text-primary" />
                                <h2 className={cn("text-2xl font-semibold text-foreground", isRTL ? '!text-right' : '!text-left')}>
                                    {t('booking_sessions')}
                                </h2>
                            </div>
                            
                            {booking.sessions && booking.sessions.length > 0 ? (
                                <DataTable
                                    data={booking.sessions}
                                    columns={[
                                        {
                                            key: 'slot_date',
                                            label: t('date'),
                                            render: (_: unknown, session: BookingSession) => (
                                                <div className={cn("flex items-center gap-2", flexDirection)}>
                                                    <Calendar className="h-4 w-4 text-muted-foreground" />
                                                    <span className={cn("font-medium", isRTL ? 'text-right' : 'text-left')} dir={dir}>
                                                        {formatDate(session.slot_date)}
                                                    </span>
                                                </div>
                                            ),
                                        },
                                        {
                                            key: 'slot_time',
                                            label: t('time'),
                                            render: (_: unknown, session: BookingSession) => (
                                                <div className={cn("flex items-center gap-2", flexDirection)}>
                                                    <Clock className="h-4 w-4 text-muted-foreground" />
                                                    <span className={cn("font-medium", isRTL ? 'text-right' : 'text-left')} dir={dir}>
                                                        {session.slot_time ? new Date(`2000-01-01T${session.slot_time}`).toLocaleTimeString(locale === 'ar' ? 'ar-SA' : 'en-US', { hour: '2-digit', minute: '2-digit', hour12: true }) : session.slot_time}
                                                    </span>
                                                </div>
                                            ),
                                        },
                                        {
                                            key: 'status',
                                            label: t('status'),
                                            render: (_: unknown, session: BookingSession) => (
                                                <div className={cn("flex items-center gap-3", flexDirection)}>
                                                    <Switch
                                                        id={`session-${session.id}-toggle`}
                                                        checked={session.status === 'completed'}
                                                        onCheckedChange={() => handleToggleSessionStatus(session.id, session.status)}
                                                        disabled={updatingSessions.has(session.id)}
                                                    />
                                                    <Badge 
                                                        variant={session.status === 'completed' ? 'default' : 'secondary'} 
                                                        className={cn(isRTL ? 'text-right' : 'text-left')}
                                                    >
                                                        {t(session.status)}
                                                    </Badge>
                                                </div>
                                            ),
                                        },
                                    ]}
                                    total={booking.sessions.length}
                                    currentPage={1}
                                    perPage={booking.sessions.length}
                                    onPageChange={() => {}}
                                    onPerPageChange={() => {}}
                                />
                            ) : (
                                <div className={cn("p-4 bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-lg text-center", isRTL ? '!text-right' : '!text-left')} dir={dir}>
                                    <p className={cn("text-sm text-muted-foreground", isRTL ? '!text-right' : '!text-left')}>{t('no_sessions')}</p>
                                </div>
                            )}
                        </div>
                    </TabsContent>

                    {/* Tab 3: Documents */}
                    <TabsContent value="3" className={cn("mt-6", isRTL ? '!text-right' : '!text-left')} dir={dir}>
                        <div className={cn("space-y-6", isRTL ? '!text-right' : '!text-left')} dir={dir}>
                            <div className={cn("flex items-center gap-3 mb-6", flexDirection)}>
                                <FileText className="h-6 w-6 text-primary" />
                                <h2 className={cn("text-2xl font-semibold text-foreground", isRTL ? '!text-right' : '!text-left')}>
                                    {t('documents')}
                                </h2>
                            </div>
                            
                            {((booking.documents && booking.documents.length > 0) || (booking.media && booking.media.length > 0)) ? (
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                    {/* Show documents first (medical records) */}
                                    {booking.documents && booking.documents.length > 0 && booking.documents.map((doc: BookingDocument) => {
                                        const fileUrl = getFileUrl(doc);
                                        const isImage = doc.mime_type?.startsWith('image/') || doc.file_type === 'image' || /\.(jpg|jpeg|png|gif|webp|svg)$/i.test(fileUrl);
                                        const fileName = doc.file_name || doc.name || fileUrl.split('/').pop() || t('document');
                                        const displayName = fileName.length > 30 ? fileName.substring(0, 30) + '...' : fileName;
                                        
                                        return (
                                            <div key={doc.id} className="group relative bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 overflow-hidden hover:shadow-lg transition-shadow">
                                                {/* Image Preview for images */}
                                                {isImage && fileUrl ? (
                                                    <div className="relative w-full h-48 bg-slate-100 dark:bg-slate-900 overflow-hidden">
                                                        <img 
                                                            src={fileUrl} 
                                                            alt={displayName}
                                                            className="w-full h-full object-cover"
                                                            onError={(e) => {
                                                                const target = e.target as HTMLImageElement;
                                                                target.style.display = 'none';
                                                                const parent = target.parentElement;
                                                                if (parent && !parent.querySelector('.image-fallback')) {
                                                                    const fallback = window.document.createElement('div');
                                                                    fallback.className = 'image-fallback flex items-center justify-center h-full';
                                                                    fallback.innerHTML = '<svg class="h-12 w-12 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>';
                                                                    parent.appendChild(fallback);
                                                                }
                                                            }}
                                                        />
                                                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                                                            <Button 
                                                                variant="secondary" 
                                                                size="sm"
                                                                asChild
                                                                className="bg-white/90 hover:bg-white"
                                                            >
                                                                <a href={fileUrl} target="_blank" rel="noopener noreferrer">
                                                                    <Eye className="h-4 w-4 mr-2" />
                                                                    {t('view')}
                                                                </a>
                                                            </Button>
                                                    </div>
                                                </div>
                                                ) : (
                                                    <div className="w-full h-48 bg-gradient-to-br from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 flex items-center justify-center">
                                                        {isImage ? (
                                                            <ImageIcon className="h-16 w-16 text-purple-400 dark:text-purple-500" />
                                                        ) : (
                                                            <File className="h-16 w-16 text-purple-400 dark:text-purple-500" />
                                                        )}
                                                    </div>
                                                )}
                                                
                                                {/* Document Info */}
                                                <div className="p-4">
                                                    <div className="flex items-start justify-between gap-2 mb-3">
                                                        <div className="flex-1 min-w-0">
                                                            <p className="font-medium text-foreground truncate" title={fileName}>
                                                                {displayName}
                                                            </p>
                                                            <p className="text-xs text-muted-foreground mt-1">
                                                                {doc.mime_type || doc.file_type || t('document')}
                                                            </p>
                                                            <p className="text-xs text-muted-foreground mt-1">
                                                                {formatDate(doc.created_at)}
                                                            </p>
                                                        </div>
                                                    </div>
                                                    
                                                    {/* Action Buttons */}
                                                    <div className={cn("flex items-center gap-2", flexDirection)}>
                                                        {isImage && fileUrl && (
                                                            <Button 
                                                                variant="outline" 
                                                                size="sm" 
                                                                asChild
                                                                className="flex-1"
                                                            >
                                                                <a href={fileUrl} target="_blank" rel="noopener noreferrer" className={cn("flex items-center gap-2", flexDirection)}>
                                                                    <Eye className={cn("h-4 w-4", iconMargin('sm'))} />
                                                                    {t('view')}
                                                                </a>
                                                            </Button>
                                                        )}
                                                        <Button 
                                                            variant="default" 
                                                            size="sm" 
                                                            asChild
                                                            className={isImage && fileUrl ? "flex-1" : "w-full"}
                                                        >
                                                            <a href={fileUrl} download target="_blank" rel="noopener noreferrer" className={cn("flex items-center gap-2", flexDirection)}>
                                                        <Download className={cn("h-4 w-4", iconMargin('sm'))} />
                                                        {t('download')}
                                                    </a>
                                                </Button>
                                            </div>
                                        </div>
                                            </div>
                                        );
                                    })}
                                    {/* Show media files */}
                                    {booking.media && booking.media.length > 0 && booking.media.map((doc: BookingDocument) => {
                                        const fileUrl = getFileUrl(doc);
                                        const isImage = doc.mime_type?.startsWith('image/') || doc.file_type === 'image' || /\.(jpg|jpeg|png|gif|webp|svg)$/i.test(fileUrl);
                                        const fileName = doc.file_name || doc.name || fileUrl.split('/').pop() || t('document');
                                        const displayName = fileName.length > 30 ? fileName.substring(0, 30) + '...' : fileName;
                                        
                                        return (
                                            <div key={doc.id} className={cn("group relative bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 overflow-hidden hover:shadow-lg transition-shadow", isRTL ? '!text-right' : '!text-left')} dir={dir}>
                                                {/* Image Preview for images */}
                                                {isImage && fileUrl ? (
                                                    <div className="relative w-full h-48 bg-slate-100 dark:bg-slate-900 overflow-hidden">
                                                        <img 
                                                            src={fileUrl} 
                                                            alt={displayName}
                                                            className="w-full h-full object-cover"
                                                            onError={(e) => {
                                                                const target = e.target as HTMLImageElement;
                                                                target.style.display = 'none';
                                                                const parent = target.parentElement;
                                                                if (parent && !parent.querySelector('.image-fallback')) {
                                                                    const fallback = window.document.createElement('div');
                                                                    fallback.className = 'image-fallback flex items-center justify-center h-full';
                                                                    fallback.innerHTML = '<svg class="h-12 w-12 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>';
                                                                    parent.appendChild(fallback);
                                                                }
                                                            }}
                                                        />
                                                        <div className={cn("absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100", flexDirection)}>
                                                            <Button 
                                                                variant="secondary" 
                                                                size="sm"
                                                                asChild
                                                                className="bg-white/90 hover:bg-white"
                                                            >
                                                                <a href={fileUrl} target="_blank" rel="noopener noreferrer" className={cn("flex items-center gap-2", flexDirection)}>
                                                                    <Eye className={cn("h-4 w-4", iconMargin('sm'))} />
                                                                    {t('view')}
                                                                </a>
                                                            </Button>
                                                        </div>
                                </div>
                            ) : (
                                                    <div className="w-full h-48 bg-gradient-to-br from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 flex items-center justify-center">
                                                        {isImage ? (
                                                            <ImageIcon className="h-16 w-16 text-purple-400 dark:text-purple-500" />
                                                        ) : (
                                                            <File className="h-16 w-16 text-purple-400 dark:text-purple-500" />
                                                        )}
                                                    </div>
                                                )}
                                                
                                                {/* Document Info */}
                                                <div className={cn("p-4", isRTL ? '!text-right' : '!text-left')} dir={dir}>
                                                    <div className={cn("flex items-start justify-between gap-2 mb-3", flexDirection)}>
                                                        <div className={cn("flex-1 min-w-0", isRTL ? '!text-right' : '!text-left')}>
                                                            <p className={cn("font-medium text-foreground truncate", isRTL ? '!text-right' : '!text-left')} title={fileName}>
                                                                {displayName}
                                                            </p>
                                                            <p className={cn("text-xs text-muted-foreground mt-1", isRTL ? '!text-right' : '!text-left')}>
                                                                {doc.mime_type || doc.file_type || t('document')}
                                                            </p>
                                                            <p className={cn("text-xs text-muted-foreground mt-1", isRTL ? '!text-right' : '!text-left')}>
                                                                {formatDate(doc.created_at)}
                                                            </p>
                                                        </div>
                                                    </div>
                                                    
                                                    {/* Action Buttons */}
                                                    <div className={cn("flex items-center gap-2", flexDirection)}>
                                                        {isImage && fileUrl && (
                                                            <Button 
                                                                variant="outline" 
                                                                size="sm" 
                                                                asChild
                                                                className="flex-1"
                                                            >
                                                                <a href={fileUrl} target="_blank" rel="noopener noreferrer" className={cn("flex items-center gap-2", flexDirection)}>
                                                                    <Eye className={cn("h-4 w-4", iconMargin('sm'))} />
                                                                    {t('view')}
                                                                </a>
                                                            </Button>
                                                        )}
                                                        <Button 
                                                            variant="default" 
                                                            size="sm" 
                                                            asChild
                                                            className={isImage && fileUrl ? "flex-1" : "w-full"}
                                                        >
                                                            <a href={fileUrl} download target="_blank" rel="noopener noreferrer" className={cn("flex items-center gap-2", flexDirection)}>
                                                                <Download className={cn("h-4 w-4", iconMargin('sm'))} />
                                                                {t('download')}
                                                            </a>
                                                        </Button>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            ) : (
                                <div className={cn("p-12 bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-lg text-center", isRTL ? '!text-right' : '!text-left')} dir={dir}>
                                    <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-50" />
                                    <p className={cn("text-sm text-muted-foreground", isRTL ? '!text-right' : '!text-left')}>{t('no_documents')}</p>
                                </div>
                            )}
                        </div>
                    </TabsContent>

                    {/* Tab 4: Reviews */}
                    <TabsContent value="4" className={cn("mt-6", isRTL ? '!text-right' : '!text-left')} dir={dir}>
                        <div className={cn("space-y-6", isRTL ? '!text-right' : '!text-left')} dir={dir}>
                            <div className={cn("flex items-center gap-3 mb-6", flexDirection)}>
                                <FileText className="h-6 w-6 text-primary" />
                                <h2 className={cn("text-2xl font-semibold text-foreground", isRTL ? '!text-right' : '!text-left')}>
                                    {t('reviews')}
                                </h2>
                            </div>
                            
                            {booking.reviews && booking.reviews.length > 0 ? (
                            <div className="space-y-4">
                                {booking.reviews.map((review) => (
                                    <div key={review.id} className={cn("border rounded-lg p-4 space-y-3", isRTL ? '!text-right' : '!text-left')} dir={dir}>
                                        <div className={cn("flex items-center justify-between", flexDirection)}>
                                            <div className={cn("flex items-center gap-3", flexDirection)}>
                                                {review.user ? (
                                                    <div className={cn(isRTL ? '!text-right' : '!text-left')}>
                                                        <p className={cn("font-medium text-foreground", isRTL ? '!text-right' : '!text-left')}>{review.user.name || t('n_a')}</p>
                                                        <p className={cn("text-sm text-muted-foreground", isRTL ? '!text-right' : '!text-left')}>{review.user.email || t('n_a')}</p>
                                                    </div>
                                                ) : (
                                                    <div className={cn(isRTL ? '!text-right' : '!text-left')}>
                                                        <p className={cn("text-sm text-muted-foreground", isRTL ? '!text-right' : '!text-left')}>{t('n_a')}</p>
                                                    </div>
                                                )}
                                            </div>
                                            <div className={cn("flex items-center gap-2", flexDirection)}>
                                                <div className={cn("flex items-center gap-1", flexDirection)}>
                                                    {Array.from({ length: 5 }).map((_, i) => (
                                                        <span
                                                            key={i}
                                                            className={cn(
                                                                "text-lg",
                                                                i < review.rating
                                                                    ? 'text-yellow-400'
                                                                    : 'text-gray-300 dark:text-gray-600'
                                                            )}
                                                        >
                                                            ★
                                                        </span>
                                                    ))}
                                                    <span className={cn("text-sm text-muted-foreground", isRTL ? '!text-right' : '!text-left')} dir="ltr">
                                                        ({review.rating}/5)
                                                    </span>
                                                </div>
                                                <span className={cn("text-sm text-muted-foreground", isRTL ? '!text-right' : '!text-left')}>
                                                    {formatDateTime(review.created_at)}
                                                </span>
                                            </div>
                                        </div>
                                        <div className={cn("mt-3", isRTL ? '!text-right' : '!text-left')} dir={dir}>
                                            <p className={cn("text-sm text-muted-foreground mb-1", isRTL ? '!text-right' : '!text-left')}>{t('comment')}</p>
                                            <p className={cn("text-foreground whitespace-pre-wrap", isRTL ? '!text-right' : '!text-left')} dir={dir}>
                                                {review.comment || t('no_comment')}
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className={cn("text-center py-12", isRTL ? '!text-right' : '!text-left')} dir={dir}>
                                <p className={cn("text-muted-foreground", isRTL ? '!text-right' : '!text-left')}>{t('no_reviews_available')}</p>
                            </div>
                        )}
                        </div>
                    </TabsContent>

                    {/* Tab 5: Related Information */}
                    <TabsContent value="5" className={cn("mt-6", isRTL ? '!text-right' : '!text-left')} dir={dir}>
                        <div className={cn("space-y-6", isRTL ? '!text-right' : '!text-left')} dir={dir}>
                            <div className={cn("flex items-center gap-3 mb-6", flexDirection)}>
                                <FileText className="h-6 w-6 text-primary" />
                                <h2 className={cn("text-2xl font-semibold text-foreground", isRTL ? '!text-right' : '!text-left')}>
                                    {t('related_information')}
                                </h2>
                            </div>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {/* Address */}
                                {booking.address && (
                                    <div className={cn("space-y-2", isRTL ? '!text-right' : '!text-left')} dir={dir}>
                                        <p className={cn("text-sm text-muted-foreground flex items-center gap-2", flexDirection)}>
                                            <MapPin className="h-4 w-4" />
                                            {t('address')}
                                        </p>
                                        <div className={cn("flex flex-col", isRTL ? '!text-right' : '!text-left')} dir={dir}>
                                            <p className={cn("font-medium text-foreground", isRTL ? '!text-right' : '!text-left')}>{booking.address.address}</p>
                                            {booking.address.governorate && (
                                                <p className={cn("text-sm text-muted-foreground", isRTL ? '!text-right' : '!text-left')}>
                                                    {getLocalizedName(booking.address.governorate.name_en, booking.address.governorate.name_ar, locale)}
                                                </p>
                                            )}
                                            {booking.address.area && (
                                                <p className={cn("text-sm text-muted-foreground", isRTL ? '!text-right' : '!text-left')}>
                                                    {getLocalizedName(booking.address.area.name_en, booking.address.area.name_ar, locale)}
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                )}

                                {/* Created At */}
                                <div className={cn("space-y-2", isRTL ? '!text-right' : '!text-left')} dir={dir}>
                                    <p className={cn("text-sm text-muted-foreground", isRTL ? '!text-right' : '!text-left')}>{t('created_at')}</p>
                                    <p className={cn("text-base font-medium text-foreground", isRTL ? '!text-right' : '!text-left')}>{formatDateTime(booking.created_at)}</p>
                                </div>

                                {/* Confirmed At */}
                                {booking.confirmed_at && (
                                    <div className={cn("space-y-2", isRTL ? '!text-right' : '!text-left')} dir={dir}>
                                        <p className={cn("text-sm text-muted-foreground", isRTL ? '!text-right' : '!text-left')}>{t('confirmed_at')}</p>
                                        <p className={cn("text-base font-medium text-foreground", isRTL ? '!text-right' : '!text-left')}>{formatDateTime(booking.confirmed_at)}</p>
                                    </div>
                                )}

                                {/* Completed At */}
                                {booking.completed_at && (
                                    <div className={cn("space-y-2", isRTL ? '!text-right' : '!text-left')} dir={dir}>
                                        <p className={cn("text-sm text-muted-foreground", isRTL ? '!text-right' : '!text-left')}>{t('completed_at')}</p>
                                        <p className={cn("text-base font-medium text-foreground", isRTL ? '!text-right' : '!text-left')}>{formatDateTime(booking.completed_at)}</p>
                                    </div>
                                )}

                                {/* Cancelled At */}
                                {booking.cancelled_at && (
                                    <div className={cn("space-y-2", isRTL ? '!text-right' : '!text-left')} dir={dir}>
                                        <p className={cn("text-sm text-muted-foreground", isRTL ? '!text-right' : '!text-left')}>{t('cancelled_at')}</p>
                                        <p className={cn("text-base font-medium text-foreground", isRTL ? '!text-right' : '!text-left')}>{formatDateTime(booking.cancelled_at)}</p>
                                    </div>
                                )}

                                {/* Updated At */}
                                <div className={cn("space-y-2", isRTL ? '!text-right' : '!text-left')} dir={dir}>
                                    <p className={cn("text-sm text-muted-foreground", isRTL ? '!text-right' : '!text-left')}>{t('updated_at')}</p>
                                    <p className={cn("text-base font-medium text-foreground", isRTL ? '!text-right' : '!text-left')}>{formatDateTime(booking.updated_at)}</p>
                                </div>
                            </div>
                        </div>
                    </TabsContent>
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
                            disabled={statusForm.processing}
                            className="!bg-emerald-600 hover:!bg-emerald-700 focus:!bg-emerald-700"
                        >
                            {statusForm.processing ? t('processing') : t('accept')}
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
                            disabled={statusForm.processing}
                            className="!bg-emerald-600 hover:!bg-emerald-700 focus:!bg-emerald-700"
                        >
                            {statusForm.processing ? t('processing') : t('complete')}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </AppLayout>
    );
}

