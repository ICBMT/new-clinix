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
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ConfirmationDialog } from '@/components/confirmation-dialog';
import { UserCard } from '@/components/user-card';
import { ClinicCard } from '@/components/clinic-card';
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
import { Head, Link, router, usePage } from '@inertiajs/react';
import { type SharedData } from '@/types';
import { cn } from '@/lib/utils';
import { Eye, Filter, Check, X, Calendar, Clock, CheckCircle, XCircle } from 'lucide-react';
import { useState, useEffect, useCallback } from 'react';
import { customToast } from '@/components/ui/custom-toast';
import { index as dashboard } from '@/routes/dashboard';
import { type BreadcrumbItem } from '@/types';
import { formatHumanDate } from '@/utils/date-utils';

interface Booking {
    id: number;
    user?: { 
        id: number; 
        name: string; 
        email: string; 
        phone?: string;
        avatar?: string;
        email_verified_at?: string | null;
        phone_verified_at?: string | null;
    };
    treatment?: { id: number; name_en: string; name_ar: string; name?: string };
    vendor?: { id: number; name: string };
    clinic?: { id: number; name_en: string; name_ar: string; email?: string; phone?: string; logo?: string | null };
    status: 'upcoming' | 'accepted' | 'cancelled' | 'completed' | 'past';
    total_amount: string;
    payment_status?: string;
    created_at: string;
    sessions?: Array<{ 
        id: number; 
        slot_date: string; 
        slot_time: string; 
        status: string;
        treatment_slot_id?: number;
    }>;
}

interface Clinic {
    id: number;
    name_en: string;
    name_ar: string;
}

interface BookingsPageProps {
    bookings?: {
        data: Booking[];
        current_page: number;
        last_page: number;
        per_page: number;
        total: number;
    };
    filters?: {
        search?: string;
        status?: string;
        clinic_id?: string;
        created_from?: string;
        created_to?: string;
    };
    accessibleClinics?: Clinic[];
    tab?: string;
}

// Breadcrumbs will be created dynamically inside component for translation

export default function BookingsIndex({ bookings, filters: initialFilters, accessibleClinics, tab: initialTab }: BookingsPageProps) {
    useRTLInit();
    const { t, locale } = useTranslation();
    const page = usePage<SharedData>();
    const { locale: pageLocale } = page.props;
    const isRTL = pageLocale === 'ar';
    const dir = isRTL ? 'rtl' : 'ltr';
    const { flexDirection, iconMargin, getFieldDir, getInputTextAlign } = useRTL();
    
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
    ];
    const [activeTab, setActiveTab] = useState(initialTab || 'all');
    const [optimisticBookings, setOptimisticBookings] = useState(bookings?.data || []);
    const [showFilters, setShowFilters] = useState(false);
    const [isInitialLoad, setIsInitialLoad] = useState(true);
    const [rescheduleModalOpen, setRescheduleModalOpen] = useState(false);
    const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
    const [selectedSessionId, setSelectedSessionId] = useState<number | null>(null);
    const [rescheduleData, setRescheduleData] = useState({
        slot_date: '',
        slot_time: '',
        reschedule_reason: '',
    });
    const [availableSlots, setAvailableSlots] = useState<Array<{ start_time: string; end_time: string; available: boolean }>>([]);
    const [loadingSlots, setLoadingSlots] = useState(false);
    const [acceptDialog, setAcceptDialog] = useState<{ open: boolean; bookingId: number | null }>({ open: false, bookingId: null });
    const [cancelDialog, setCancelDialog] = useState<{ open: boolean; bookingId: number | null }>({ open: false, bookingId: null });
    const [completeDialog, setCompleteDialog] = useState<{ open: boolean; bookingId: number | null }>({ open: false, bookingId: null });

    const [filters, setFilters] = useState({
        search: initialFilters?.search || '',
        status: initialFilters?.status || 'all',
        clinic_id: initialFilters?.clinic_id || 'all',
        created_from: initialFilters?.created_from || '',
        created_to: initialFilters?.created_to || '',
    });

    const applyFiltersToBackend = useCallback((filtersToApply: typeof filters, selectedTab: string) => {
        const statusFilter = selectedTab !== 'all' ? selectedTab : (filtersToApply.status && filtersToApply.status !== 'all' ? filtersToApply.status : undefined);
        
        router.get('/dashboard/bookings', {
            page: 1,
            tab: selectedTab !== 'all' ? selectedTab : undefined,
            search: filtersToApply.search || undefined,
            clinic_id: filtersToApply.clinic_id && filtersToApply.clinic_id !== 'all' ? filtersToApply.clinic_id : undefined,
            filters: {
                status: statusFilter,
                created_from: filtersToApply.created_from || undefined,
                created_to: filtersToApply.created_to || undefined,
            },
        }, { preserveState: true, preserveScroll: true });
    }, []);

    useEffect(() => {
        if (bookings?.data) {
            setOptimisticBookings(bookings.data);
        }
    }, [bookings?.data]);

    useEffect(() => {
        if (isInitialLoad) {
            setIsInitialLoad(false);
            return;
        }
        const timeoutId = setTimeout(() => {
            applyFiltersToBackend(filters, activeTab);
        }, 300);
        return () => clearTimeout(timeoutId);
    }, [filters, activeTab, isInitialLoad, applyFiltersToBackend]);

    const handleTabChange = (tab: string) => {
        setActiveTab(tab);
        applyFiltersToBackend(filters, tab);
    };

    const statusOptions: SelectOption[] = [
        { value: 'all', label: t('all') },
        { value: 'upcoming', label: t('upcoming') },
        { value: 'accepted', label: t('accepted') },
        { value: 'cancelled', label: t('cancelled') },
        { value: 'completed', label: t('completed') },
        { value: 'past', label: t('past') },
    ];

    const clinicOptions: SelectOption[] = [
        { value: 'all', label: t('all_clinics') },
        ...(accessibleClinics || []).map(clinic => ({
            value: clinic.id.toString(),
            label: isRTL ? clinic.name_ar : clinic.name_en,
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

        if (activeTab === 'all' && filters.status && filters.status !== 'all') {
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

    const getStatusBadgeVariant = (status: string) => {
        switch (status) {
            case 'accepted':
            case 'confirmed':
            case 'completed':
                return 'default';
            case 'cancelled':
                return 'destructive';
            case 'past':
                return 'secondary';
            default:
                return 'secondary';
        }
    };

    const getStatusBadgeClass = (status: string) => {
        switch (status) {
            case 'accepted':
            case 'confirmed':
            case 'completed':
                return 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300';
            case 'cancelled':
                return 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300';
            case 'past':
                return 'bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-300';
            default:
                return 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300';
        }
    };

    const columns = [
        {
            key: 'user_treatment',
            label: t('user_treatment'),
            render: (_: unknown, booking: Booking) => (
                <div className={cn("p-2 space-y-2", isRTL ? '!text-right' : '!text-left')} dir={dir}>
                    {/* User */}
                    {booking.user ? (
                        <UserCard 
                            user={{
                                id: booking.user.id,
                                name: booking.user.name,
                                email: booking.user.email || '',
                                phone: booking.user.phone || '',
                                avatar: booking.user.avatar,
                                email_verified_at: booking.user.email_verified_at || null,
                                phone_verified_at: booking.user.phone_verified_at || null,
                            }} 
                            showVerificationBadges={false}
                        />
                    ) : (
                        <span className={cn("text-muted-foreground", isRTL ? '!text-right' : '!text-left')} dir={dir}>—</span>
                    )}
                    
                    {/* Treatment with link */}
                    {booking.treatment ? (
                        <div className={cn("mt-2", isRTL ? '!text-right' : '!text-left')} dir={dir}>
                            <Link
                                href={`/dashboard/treatments/${booking.treatment.id}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className={cn("block cursor-pointer hover:opacity-80 transition-opacity", isRTL ? '!text-right' : '!text-left')}
                                onClick={(e) => e.stopPropagation()}
                                dir={isRTL && booking.treatment.name_ar ? 'rtl' : 'ltr'}
                            >
                                <span className={cn("font-medium text-primary hover:underline", isRTL ? '!text-right' : '!text-left')} dir={isRTL && booking.treatment.name_ar ? 'rtl' : 'ltr'}>
                                    {isRTL 
                                        ? (booking.treatment.name_ar || booking.treatment.name) 
                                        : (booking.treatment.name_en || booking.treatment.name)}
                                </span>
                            </Link>
                        </div>
                    ) : (
                        <span className={cn("text-muted-foreground text-sm", isRTL ? '!text-right' : '!text-left')} dir={dir}>—</span>
                    )}
                </div>
            ),
        },
        {
            key: 'clinic',
            label: t('clinic'),
            render: (_: unknown, booking: Booking) => (
                <div className={cn("p-2", isRTL ? '!text-right' : '!text-left')} dir={dir}>
                    {booking.clinic ? (
                        <div
                            className="cursor-pointer"
                            onClick={() => router.visit(`/dashboard/clinics/${booking.clinic?.id}`)}
                        >
                            <ClinicCard
                                clinic={{
                                    id: booking.clinic.id,
                                    company_name_en: booking.clinic.name_en,
                                    company_name_ar: booking.clinic.name_ar,
                                    email: booking.clinic.email || '',
                                    phone: booking.clinic.phone || '',
                                    logo: booking.clinic.logo || null,
                                }}
                                locale={locale}
                                variant="default"
                            />
                        </div>
                    ) : (
                        <span className={cn("text-muted-foreground", isRTL ? '!text-right' : '!text-left')} dir={dir}>—</span>
                    )}
                </div>
            ),
        },
        {
            key: 'date_sessions',
            label: t('date_time_sessions'),
            render: (_: unknown, booking: Booking) => {
                const sessions = booking.sessions || [];
                
                return (
                    <div className={cn("p-2 space-y-2", isRTL ? '!text-right' : '!text-left')} dir={dir}>
                        {/* Sessions */}
                        {sessions.length > 0 ? (
                            <div className={cn("space-y-2", isRTL ? '!text-right' : '!text-left')} dir={dir}>
                                {/* Session Count Header */}
                                <div className={cn("text-xs font-semibold text-muted-foreground mb-2", isRTL ? '!text-right' : '!text-left')} dir={dir}>
                                    {t('sessions')} ({sessions.length}):
                                </div>
                                
                                {sessions.map((session, index) => {
                                    // Format session date - plain format (YYYY-MM-DD), not Arabic numerals
                                    let sessionDateFormatted = '';
                                    if (session.slot_date) {
                                        const sessionDate = new Date(session.slot_date);
                                        // Use plain date format: YYYY-MM-DD (always English numerals)
                                        const year = sessionDate.getFullYear();
                                        const month = String(sessionDate.getMonth() + 1).padStart(2, '0');
                                        const day = String(sessionDate.getDate()).padStart(2, '0');
                                        sessionDateFormatted = `${year}-${month}-${day}`;
                                    }
                                    
                                    // Format session time - plain format, don't convert
                                    let sessionTimeFormatted = '';
                                    if (session.slot_time) {
                                        try {
                                            // Handle both time formats (HH:MM:SS or HH:MM)
                                            const timeStr = session.slot_time.includes(':') ? session.slot_time : `${session.slot_time}:00`;
                                            const [hours, minutes] = timeStr.split(':');
                                            const hour24 = parseInt(hours || '0', 10);
                                            const min = parseInt(minutes || '0', 10);
                                            
                                            // Format as HH:MM AM/PM (12-hour format) - plain format, no locale conversion
                                            const hour12 = hour24 % 12 || 12;
                                            const ampm = hour24 >= 12 ? 'PM' : 'AM';
                                            sessionTimeFormatted = `${String(hour12).padStart(2, '0')}:${String(min).padStart(2, '0')} ${ampm}`;
                                        } catch {
                                            // If parsing fails, use the time as-is
                                            sessionTimeFormatted = session.slot_time;
                                        }
                                    }
                                    
                                    const sessionNumber = index + 1;
                                    
                                    // Determine icon based on status
                                    const isPositiveStatus = session.status === 'completed' || session.status === 'pending';
                                    const StatusIcon = isPositiveStatus ? CheckCircle : XCircle;
                                    const iconColor = isPositiveStatus ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400';
                                    
                                    return (
                                        <div key={session.id || index} className={cn("space-y-1 text-sm border-b border-border pb-2 last:border-b-0 last:pb-0", isRTL ? '!text-right' : '!text-left')} dir={dir}>
                                            {/* Session number with calendar icon and status icon */}
                                            <div className={cn("flex items-center gap-2", flexDirection)} dir={dir}>
                                                <Calendar className={cn("h-4 w-4 text-muted-foreground", iconMargin('sm'))} />
                                                <span className={cn("font-semibold text-foreground", isRTL ? '!text-right' : '!text-left')} dir="ltr">
                                                    {t('session')} {sessionNumber}
                                                </span>
                                                <StatusIcon className={cn("h-4 w-4 flex-shrink-0", iconColor, iconMargin('sm'))} />
                                            </div>
                                            
                                            {/* Date and time with clock icon - aligned with Session tag */}
                                            {sessionDateFormatted && (
                                                <div className={cn("flex items-center gap-2", flexDirection)} dir={dir}>
                                                    <Clock className={cn("h-3.5 w-3.5 text-muted-foreground", iconMargin('sm'))} />
                                                    <span className={cn("text-muted-foreground", isRTL ? '!text-right' : '!text-left')} dir="ltr">
                                                        {sessionDateFormatted}{sessionTimeFormatted && ` - ${sessionTimeFormatted}`}
                                                    </span>
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        ) : (
                            <span className={cn("text-sm text-muted-foreground", isRTL ? '!text-right' : '!text-left')} dir={dir}>
                                {t('no_sessions')}
                            </span>
                        )}
                    </div>
                );
            },
        },
        {
            key: 'booking_status',
            label: t('booking_status'),
            render: (_: unknown, booking: Booking) => (
                <div className={cn("p-2", isRTL ? '!text-right' : '!text-left')} dir={dir}>
                    <Badge 
                        variant={getStatusBadgeVariant(booking.status)}
                        className={cn(getStatusBadgeClass(booking.status), isRTL ? '!text-right' : '!text-left')}
                        dir={dir}
                    >
                        {t(booking.status)}
                    </Badge>
                </div>
            ),
        },
        {
            key: 'payment_status',
            label: t('payment_status'),
            render: (_: unknown, booking: Booking) => {
                const paymentStatus = booking.payment_status || 'pending';
                let variant: 'default' | 'secondary' | 'destructive' = 'secondary';
                let className = '';
                
                if (paymentStatus === 'paid') {
                    variant = 'default';
                    className = 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300';
                } else if (paymentStatus === 'pending') {
                    variant = 'secondary';
                    className = 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300';
                } else if (paymentStatus === 'failed' || paymentStatus === 'cancelled') {
                    variant = 'destructive';
                    className = 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300';
                }
                
                return (
                    <div className={cn("p-2", isRTL ? '!text-right' : '!text-left')} dir={dir}>
                        <Badge variant={variant} className={cn(className, isRTL ? '!text-right' : '!text-left')} dir={dir}>
                            {t(paymentStatus) || paymentStatus}
                        </Badge>
                    </div>
                );
            },
        },
        {
            key: 'total_amount',
            label: t('amount'),
            render: (_: unknown, booking: Booking) => (
                <div className={cn("p-2", isRTL ? '!text-right' : '!text-left')} dir={dir}>
                    <span className={cn("font-medium", isRTL ? '!text-right' : '!text-left')} dir="ltr">
                        {booking.total_amount} KWD
                    </span>
                </div>
            ),
        },
        {
            key: 'actions',
            label: t('actions'),
            render: (_: unknown, booking: Booking) => {
                // Check if booking is in past tab (status upcoming but all sessions are in the past)
                const isPastBooking = activeTab === 'past' || (
                    booking.status === 'upcoming' && 
                    booking.sessions && 
                    booking.sessions.length > 0 &&
                    booking.sessions.every(session => {
                        const sessionDate = new Date(session.slot_date);
                        const today = new Date();
                        today.setHours(0, 0, 0, 0);
                        return sessionDate < today;
                    })
                );
                
                return (
                    <div className={cn("flex items-center gap-1 w-full", isRTL ? 'justify-start flex-row-reverse' : 'justify-end')} dir={dir}>
                        {/* Quick Actions based on status - Hide accept/reject for past bookings */}
                        {!isPastBooking && booking.status === 'upcoming' && (
                            <>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleQuickAccept(booking.id)}
                                    className={cn("text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 flex items-center gap-1", flexDirection)}
                                    title={t('accept')}
                                    aria-label={t('accept')}
                                    dir={dir}
                                >
                                    <Check className={cn("h-4 w-4", iconMargin('sm'))} />
                                    {t('accept')}
                                </Button>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleQuickReject(booking.id)}
                                    className={cn("text-red-600 hover:text-red-700 hover:bg-red-50 flex items-center gap-1", flexDirection)}
                                    title={t('reject')}
                                    aria-label={t('reject')}
                                    dir={dir}
                                >
                                    <X className={cn("h-4 w-4", iconMargin('sm'))} />
                                    {t('reject')}
                                </Button>
                            </>
                        )}
                        
                        {booking.status === 'accepted' && (
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleQuickComplete(booking.id)}
                                className={cn("text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 flex items-center gap-1", flexDirection)}
                                title={t('complete')}
                                aria-label={t('complete')}
                                dir={dir}
                            >
                                <Check className={cn("h-4 w-4", iconMargin('sm'))} />
                                {t('complete')}
                            </Button>
                        )}
                        
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => router.visit(`/dashboard/bookings/${booking.id}`)}
                            title={t('view')}
                            aria-label={t('view')}
                            dir={dir}
                        >
                            <Eye className="h-4 w-4" />
                        </Button>
                    </div>
                );
            },
        },
    ];

    const handlePageChange = (page: number) => {
        const statusFilter = activeTab !== 'all' ? activeTab : (filters.status && filters.status !== 'all' ? filters.status : undefined);
        
        router.get('/dashboard/bookings', {
            page,
            per_page: bookings?.per_page || 15,
            tab: activeTab !== 'all' ? activeTab : undefined,
            search: filters.search || undefined,
            clinic_id: filters.clinic_id && filters.clinic_id !== 'all' ? filters.clinic_id : undefined,
            filters: {
                status: statusFilter,
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

    // Quick action handlers
    const handleQuickAccept = (bookingId: number) => {
        setAcceptDialog({ open: true, bookingId });
    };

    const confirmAccept = () => {
        if (acceptDialog.bookingId) {
            router.post(`/dashboard/bookings/${acceptDialog.bookingId}/accept`, {}, {
                preserveScroll: true,
                onSuccess: () => {
                    // Optimistically update the booking status
                    setOptimisticBookings(prev => 
                        prev.map(booking => 
                            booking.id === acceptDialog.bookingId 
                                ? { ...booking, status: 'accepted' as const }
                                : booking
                        )
                    );
                    setAcceptDialog({ open: false, bookingId: null });
                    customToast.success(t('booking_accepted_successfully'));
                },
                onError: (errors) => {
                    console.error('Accept booking error:', errors);
                    // Show toast error for payment required or other validation errors
                    if (errors.payment_status) {
                        customToast.error(Array.isArray(errors.payment_status) ? errors.payment_status[0] : errors.payment_status);
                    } else {
                        customToast.error(t('booking_accept_failed'));
                    }
                }
            });
        }
    };

    const handleQuickReject = (bookingId: number) => {
        setCancelDialog({ open: true, bookingId });
    };

    const confirmCancel = () => {
        if (cancelDialog.bookingId) {
            router.post(`/dashboard/bookings/${cancelDialog.bookingId}/reject`, {}, {
                preserveScroll: true,
                onSuccess: () => {
                    // Optimistically update the booking status
                    setOptimisticBookings(prev => 
                        prev.map(booking => 
                            booking.id === cancelDialog.bookingId 
                                ? { ...booking, status: 'cancelled' as const }
                                : booking
                        )
                    );
                    setCancelDialog({ open: false, bookingId: null });
                }
            });
        }
    };

    const handleQuickComplete = (bookingId: number) => {
        setCompleteDialog({ open: true, bookingId });
    };

    const confirmComplete = () => {
        if (completeDialog.bookingId) {
            router.post(`/dashboard/bookings/${completeDialog.bookingId}/complete`, {}, {
                preserveScroll: true,
                onSuccess: () => {
                    // Optimistically update the booking status
                    setOptimisticBookings(prev => 
                        prev.map(booking => 
                            booking.id === completeDialog.bookingId 
                                ? { ...booking, status: 'completed' as const }
                                : booking
                        )
                    );
                    setCompleteDialog({ open: false, bookingId: null });
                    customToast.success(t('booking_completed_successfully'));
                },
                onError: (errors) => {
                    console.error('Complete booking error:', errors);
                    // Show toast error for payment required or other validation errors
                    if (errors.payment_status) {
                        customToast.error(Array.isArray(errors.payment_status) ? errors.payment_status[0] : errors.payment_status);
                    } else {
                        customToast.error(t('booking_complete_failed'));
                    }
                }
            });
        }
    };

    const handleOpenReschedule = (booking: Booking) => {
        setSelectedBooking(booking);
        // Set initial date/time from first session
        const firstSession = booking.sessions && booking.sessions.length > 0 
            ? booking.sessions[0] 
            : null;
        setSelectedSessionId(firstSession?.id || null);
        const initialDate = firstSession?.slot_date || '';
        setRescheduleData({
            slot_date: initialDate,
            slot_time: firstSession?.slot_time || '',
            reschedule_reason: '',
        });
        setAvailableSlots([]);
        setRescheduleModalOpen(true);
        
        // Fetch available slots if date is set
        if (initialDate && booking.treatment?.id) {
            fetchAvailableSlots(booking.id, initialDate);
        }
    };

    const fetchAvailableSlots = async (bookingId: number, date: string) => {
        if (!date || !selectedBooking?.treatment?.id) {
            setAvailableSlots([]);
            return;
        }

        setLoadingSlots(true);
        try {
            const response = await fetch(`/dashboard/bookings/${bookingId}/available-slots?date=${date}`);
            const data = await response.json();
            
            if (data.success && data.data?.slots) {
                // Filter only available slots
                const available = data.data.slots.filter((slot: { available: boolean }) => slot.available);
                setAvailableSlots(available);
            } else {
                setAvailableSlots([]);
            }
        } catch (error) {
            console.error('Error fetching available slots:', error);
            setAvailableSlots([]);
        } finally {
            setLoadingSlots(false);
        }
    };

    const handleReschedule = () => {
        if (!selectedBooking || !selectedSessionId) {
            const alertMessage = t('please_select_session');
            alert(alertMessage);
            return;
        }
        
        if (!rescheduleData.slot_date || !rescheduleData.slot_time) {
            const alertMessage = t('please_select_date_and_time');
            alert(alertMessage);
            return;
        }

        // Send reschedule request with session data
        const sessionPayload: any = {
            slot_date: rescheduleData.slot_date,
            slot_time: rescheduleData.slot_time,
        };
        
        // Include session id
        if (selectedSessionId) {
            sessionPayload.id = selectedSessionId;
        }
        
        router.post(`/dashboard/bookings/${selectedBooking.id}/reschedule`, {
            sessions: [sessionPayload],
            reschedule_reason: rescheduleData.reschedule_reason || '',
        }, {
            preserveScroll: true,
            forceFormData: false,
            onSuccess: () => {
                setRescheduleModalOpen(false);
                setSelectedBooking(null);
                setSelectedSessionId(null);
                setRescheduleData({ slot_date: '', slot_time: '', reschedule_reason: '' });
                setAvailableSlots([]);
                // Reload to get updated booking data
                router.reload({ only: ['bookings'], preserveScroll: true });
            },
            onError: (errors) => {
                console.error('Reschedule error:', errors);
                const errorMessage = errors && typeof errors === 'object' 
                    ? Object.values(errors).flat().join(', ')
                    : t('reschedule_failed');
                alert(errorMessage);
            }
        });
    };

    const handleQuickCancel = (bookingId: number) => {
        setCancelDialog({ open: true, bookingId });
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={t('bookings')} />
            
            <div className={cn("flex h-full flex-1 flex-col gap-6 overflow-x-auto rounded-xl bg-card dark:bg-card p-6 border border-border", isRTL ? '!text-right' : '!text-left')} dir={dir}>
                {/* Header */}
                <div className={cn("flex items-center justify-between border-b pb-4", flexDirection)} dir={dir}>
                    <div className={cn(isRTL ? '!text-right' : '!text-left')} dir={dir}>
                        <h1 className={cn("text-3xl font-bold text-foreground", isRTL ? '!text-right' : '!text-left')} dir={dir}>{t('bookings')}</h1>
                        <p className={cn("text-muted-foreground mt-1", isRTL ? '!text-right' : '!text-left')} dir={dir}>{t('manage_bookings')}</p>
                    </div>
                </div>

                {/* Tabs for filtering by status */}
                <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
                    <TabsList className={cn("grid w-full grid-cols-5", flexDirection)}>
                        <TabsTrigger value="all" className={cn(isRTL ? '!text-right' : '!text-left')}>{t('all')}</TabsTrigger>
                        <TabsTrigger value="upcoming" className={cn(isRTL ? '!text-right' : '!text-left')}>{t('upcoming')}</TabsTrigger>
                        <TabsTrigger value="accepted" className={cn(isRTL ? '!text-right' : '!text-left')}>{t('accepted')}</TabsTrigger>
                        <TabsTrigger value="cancelled" className={cn(isRTL ? '!text-right' : '!text-left')}>{t('cancelled')}</TabsTrigger>
                        <TabsTrigger value="past" className={cn(isRTL ? '!text-right' : '!text-left')}>{t('past')}</TabsTrigger>
                    </TabsList>
                </Tabs>

                {/* Pagination Info and Show Filters Button */}
                <div className={cn("flex items-center justify-between", flexDirection)} dir={dir}>
                    <div className={cn("flex items-center gap-2", flexDirection)} dir={dir}>
                        <span className={cn("text-sm text-foreground", isRTL ? '!text-right' : '!text-left')} dir={dir}>
                            {t('showing')} {((bookings?.current_page || 1) - 1) * (bookings?.per_page || 15) + 1} {t('of')} {bookings?.total || 0} {t('results')}
                        </span>
                        <Select value={(bookings?.per_page || 15).toString()} onValueChange={(value) => handlePerPageChange(Number(value))}>
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
                            placeholder={t('search_bookings')}
                        />
                        
                        {activeTab === 'all' && (
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
                    data={optimisticBookings}
                    columns={columns}
                    total={bookings?.total || 0}
                    currentPage={bookings?.current_page || 1}
                    perPage={bookings?.per_page || 15}
                    onPageChange={handlePageChange}
                    onPerPageChange={handlePerPageChange}
                    locale={locale}
                />
            </div>

            {/* Reschedule Modal */}
            <Dialog open={rescheduleModalOpen} onOpenChange={(open) => {
                setRescheduleModalOpen(open);
                if (!open) {
                    setSelectedBooking(null);
                    setSelectedSessionId(null);
                    setRescheduleData({ slot_date: '', slot_time: '', reschedule_reason: '' });
                    setAvailableSlots([]);
                }
            }}>
                <DialogContent className={cn(isRTL ? 'rtl' : 'ltr', isRTL ? '!text-right' : '!text-left')} dir={dir}>
                    <DialogHeader>
                        <DialogTitle className={cn(isRTL ? '!text-right' : '!text-left')}>{t('reschedule_booking')}</DialogTitle>
                        <DialogDescription className={cn(isRTL ? '!text-right' : '!text-left')}>
                            {t('reschedule_booking_description')}
                        </DialogDescription>
                    </DialogHeader>
                    <div className={cn("grid gap-4 py-4", isRTL ? '!text-right' : '!text-left')} dir={dir}>
                        {selectedBooking && selectedBooking.sessions && selectedBooking.sessions.length > 0 ? (
                            <>
                                <div className="grid gap-2">
                                    <Label htmlFor="session_select" className={cn(isRTL ? '!text-right' : '!text-left')}>{t('select_session')} *</Label>
                                    <Select
                                        value={selectedSessionId?.toString() || ''}
                                        onValueChange={(value) => {
                                            const sessionId = parseInt(value);
                                            setSelectedSessionId(sessionId);
                                            const session = selectedBooking.sessions?.find(s => s.id === sessionId);
                                            if (session) {
                                                setRescheduleData(prev => ({
                                                    ...prev,
                                                    slot_date: session.slot_date || '',
                                                    slot_time: session.slot_time || '',
                                                }));
                                            }
                                        }}
                                    >
                                        <SelectTrigger className={cn(isRTL ? '!text-right' : '!text-left')}>
                                            <SelectValue placeholder={t('select_session')} />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {selectedBooking.sessions.map((session) => (
                                                <SelectItem key={session.id} value={session.id.toString()} className={cn(isRTL ? '!text-right' : '!text-left')}>
                                                    <span className={cn("block", isRTL ? '!text-right' : '!text-left')}>
                                                        {formatHumanDate(session.slot_date)} {t('at')} {session.slot_time} ({t(session.status) || session.status})
                                                    </span>
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="slot_date" className={cn(isRTL ? '!text-right' : '!text-left')}>{t('new_date')} *</Label>
                                    <Input
                                        id="slot_date"
                                        type="date"
                                        value={rescheduleData.slot_date}
                                        onChange={(e) => {
                                            const newDate = e.target.value;
                                            setRescheduleData(prev => ({ ...prev, slot_date: newDate, slot_time: '' }));
                                            // Fetch available slots when date changes
                                            if (selectedBooking?.id && selectedBooking?.treatment?.id && newDate) {
                                                fetchAvailableSlots(selectedBooking.id, newDate);
                                            } else {
                                                setAvailableSlots([]);
                                            }
                                        }}
                                        min={new Date().toISOString().split('T')[0]}
                                        required
                                    />
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="slot_time" className={cn(isRTL ? '!text-right' : '!text-left')}>{t('new_time')} *</Label>
                                    {loadingSlots ? (
                                        <div className={cn("text-sm text-muted-foreground py-2", isRTL ? '!text-right' : '!text-left')}>{t('loading')}</div>
                                    ) : availableSlots.length > 0 ? (
                                        <Select
                                            value={rescheduleData.slot_time}
                                            onValueChange={(value) => setRescheduleData(prev => ({ ...prev, slot_time: value }))}
                                        >
                                            <SelectTrigger className={cn(isRTL ? '!text-right' : '!text-left')}>
                                                <SelectValue placeholder={t('select_time_slot')} />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {availableSlots.map((slot, index) => (
                                                    <SelectItem key={index} value={slot.start_time} className={cn(isRTL ? '!text-right' : '!text-left')}>
                                                        <span className={cn("block", isRTL ? '!text-right' : '!text-left')}>
                                                            {slot.start_time} - {slot.end_time}
                                                        </span>
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    ) : rescheduleData.slot_date ? (
                                        <div className={cn("text-sm text-muted-foreground py-2", isRTL ? '!text-right' : '!text-left')}>
                                            {t('no_available_slots')}
                                        </div>
                                    ) : (
                                        <Input
                                            id="slot_time"
                                            type="time"
                                            value={rescheduleData.slot_time}
                                            onChange={(e) => setRescheduleData(prev => ({ ...prev, slot_time: e.target.value }))}
                                            required
                                        />
                                    )}
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="reschedule_reason" className={cn(isRTL ? '!text-right' : '!text-left')}>{t('reason')} ({t('optional')})</Label>
                                    <Textarea
                                        id="reschedule_reason"
                                        value={rescheduleData.reschedule_reason}
                                        onChange={(e) => setRescheduleData(prev => ({ ...prev, reschedule_reason: e.target.value }))}
                                        placeholder={t('reschedule_reason_placeholder')}
                                        rows={3}
                                        dir={getFieldDir('textarea')}
                                        className={cn(getInputTextAlign('textarea'))}
                                    />
                                </div>
                            </>
                        ) : (
                            <div className={cn("text-center py-4 text-muted-foreground", isRTL ? '!text-right' : '!text-left')}>
                                {t('no_sessions_available')}
                            </div>
                        )}
                    </div>
                    <DialogFooter className={cn(flexDirection)}>
                        <Button
                            variant="outline"
                            onClick={() => {
                                setRescheduleModalOpen(false);
                                setSelectedBooking(null);
                                setSelectedSessionId(null);
                                setRescheduleData({ slot_date: '', slot_time: '', reschedule_reason: '' });
                                setAvailableSlots([]);
                            }}
                        >
                            {t('cancel')}
                        </Button>
                        <Button 
                            onClick={handleReschedule}
                            disabled={!selectedSessionId || !rescheduleData.slot_date || !rescheduleData.slot_time}
                        >
                            {t('reschedule')}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Accept Confirmation Dialog */}
            <ConfirmationDialog
                open={acceptDialog.open}
                onOpenChange={(open) => setAcceptDialog({ open, bookingId: null })}
                onConfirm={confirmAccept}
                title={t('accept_booking')}
                description={t('accept_booking_description')}
                variant="info"
                confirmText={t('accept')}
                cancelText={t('cancel')}
            />

            {/* Cancel Confirmation Dialog */}
            <ConfirmationDialog
                open={cancelDialog.open}
                onOpenChange={(open) => setCancelDialog({ open, bookingId: null })}
                onConfirm={confirmCancel}
                title={t('cancel_booking')}
                description={t('cancel_booking_confirmation')}
                variant="danger"
                confirmText={t('cancel')}
                cancelText={t('keep_booking')}
            />

            {/* Complete Confirmation Dialog */}
            <ConfirmationDialog
                open={completeDialog.open}
                onOpenChange={(open) => setCompleteDialog({ open, bookingId: null })}
                onConfirm={confirmComplete}
                title={t('complete_booking')}
                description={t('complete_booking_description')}
                variant="success"
                confirmText={t('complete')}
                cancelText={t('cancel')}
            />
        </AppLayout>
    );
}

