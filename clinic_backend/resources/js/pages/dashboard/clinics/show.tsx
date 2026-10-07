import { type BreadcrumbItem } from '@/types';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useTranslation } from '@/hooks/use-translation';
import { useRTL } from '@/hooks/use-rtl';
import { useRTLInit } from '@/hooks/use-rtl-init';
import { getLocalizedName } from '@/utils/localization';
import AppLayout from '@/layouts/app-layout';
import { cn } from '@/lib/utils';
import { index as dashboard } from '@/routes/dashboard';
import { Head, Link, router, usePage } from '@inertiajs/react';
import { ArrowLeft, Edit, Building2, FileText, MapPin, Settings, Clock, File, CreditCard, User, Mail, Phone } from 'lucide-react';
import { DocumentPreview } from '@/components/document-preview';
import { useEffect, useState } from 'react';
import { type SharedData } from '@/types';

interface OperatingHour {
    id: number;
    day_of_week: string;
    opening_time: string | null;
    closing_time: string | null;
    is_open: boolean;
    closed_all_day: boolean;
}

interface Document {
    id: number;
    file_name: string;
    file_url: string;
    file_type?: string;
    mime_type?: string;
    collection_name: string;
    disk: string;
    size: number;
    created_at: string;
}

interface ShowClinicProps {
    clinic: {
        id: number;
        name_en: string;
        name_ar: string;
        bio_en?: string;
        bio_ar?: string;
        status: 'pending' | 'approved' | 'rejected' | 'suspended';
        rejection_reason?: string | null;
        logo?: string;
        created_at: string;
        updated_at: string;
        approved_at?: string | null;
        phone?: string;
        email?: string;
        address?: string;
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
        latitude?: string;
        longitude?: string;
        auto_confirm_bookings?: boolean;
        cancellation_policy_en?: string;
        cancellation_policy_ar?: string;
        refund_policy_en?: string;
        refund_policy_ar?: string;
        rescheduling_policy_en?: string;
        rescheduling_policy_ar?: string;
        rescheduling_buffer_hours?: number | null;
        cancellation_buffer_hours?: number | null;
        refund_policy_type?: string | null;
        refund_policy_percentage?: number | null;
        category_id?: number;
        governorate_id?: number;
        area_id?: number;
        owner?: {
            id: number;
            name: string;
            email: string;
            phone?: string;
            avatar?: string;
            admin_commission?: number | null;
        } | null;
        category?: {
            id: number;
            name_en: string;
            name_ar: string;
        } | null;
        governorate?: {
            id: number;
            name_en: string;
            name_ar: string;
        } | null;
        area?: {
            id: number;
            name_en: string;
            name_ar: string;
        } | null;
        activeSubscription?: {
            id?: number;
            subscription_package_id?: number;
            status?: string;
            start_date?: string;
            end_date?: string;
            subscriptionPackage?: {
                id: number;
                name_en: string;
                name_ar: string;
                description_en?: string;
                description_ar?: string;
                price?: string;
                currency?: string;
                billing_cycle?: string;
                duration_days?: number;
            };
        };
        documents?: Document[];
    };
    categories?: Array<{ id: number; name_en: string; name_ar: string }>;
    governorates?: Array<{ id: number; name_en: string; name_ar: string }>;
    areas?: Array<{ id: number; name_en: string; name_ar: string; governorate_id: number }>;
    subscriptionPackages?: Array<{ 
        id: number; 
        name_en: string; 
        name_ar: string;
        description_en?: string;
        description_ar?: string;
        price: string;
        currency: string;
        billing_cycle: 'monthly' | 'yearly';
        duration_days: number;
        features?: string[];
    }>;
    operatingHours?: OperatingHour[];
    documents?: Document[];
    subscriptions?: Array<{
        id: number;
        subscription_package_id: number;
        status: string;
        start_date?: string;
        end_date?: string;
        subscriptionPackage?: {
            id: number;
            name_en: string;
            name_ar: string;
        };
    }>;
    siteSettings?: {
        rescheduling_buffer_hours: number;
        cancellation_buffer_hours: number;
        user_cancellation_penalty_type: string;
        user_cancellation_penalty_value: number;
        clinic_refund_policy_type: string;
        clinic_refund_policy_value: number;
        clinic_refund_policy_percentage: number;
    };
}

const DAYS_OF_WEEK = [
    { value: 'monday', labelKey: 'monday' },
    { value: 'tuesday', labelKey: 'tuesday' },
    { value: 'wednesday', labelKey: 'wednesday' },
    { value: 'thursday', labelKey: 'thursday' },
    { value: 'friday', labelKey: 'friday' },
    { value: 'saturday', labelKey: 'saturday' },
    { value: 'sunday', labelKey: 'sunday' },
];


export default function ShowClinic({ 
    clinic, 
    documents = [],
    subscriptionPackages = [],
    operatingHours = [],
    subscriptions = [],
    siteSettings = {
        rescheduling_buffer_hours: 24,
        cancellation_buffer_hours: 24,
        user_cancellation_penalty_type: 'percentage',
        user_cancellation_penalty_value: 5,
        clinic_refund_policy_type: 'partial',
        clinic_refund_policy_value: 20,
        clinic_refund_policy_percentage: 20,
    },
}: ShowClinicProps) {
    useRTLInit();
    const { t, locale } = useTranslation();
    const page = usePage<SharedData>();
    const { locale: pageLocale } = page.props;
    const isRTL = pageLocale === 'ar';
    const dir = isRTL ? 'rtl' : 'ltr';
    const { flexDirection, iconMargin, textAlign } = useRTL();
    
    // Get initial tab from URL parameter or default to 1
    const [activeTab, setActiveTab] = useState<number>(1);
    
    // Sync with URL parameter on mount
    useEffect(() => {
        const urlParams = new URLSearchParams(window.location.search);
        const tab = urlParams.get('tab');
        if (tab) {
            const tabNum = parseInt(tab);
            if (!isNaN(tabNum) && tabNum >= 1 && tabNum <= 6) { // Changed from 7 to 6 - subscription tab hidden
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
    
    if (!clinic) {
        return (
            <AppLayout breadcrumbs={[]}>
                <Head title={t('clinic_not_found')} />
                <div className={cn("flex h-full flex-1 flex-col gap-6 overflow-x-auto rounded-xl bg-card dark:bg-card p-6 border border-border", isRTL ? '!text-right' : '!text-left')} dir={dir}>
                    <p className={cn(isRTL ? '!text-right' : '!text-left')}>{t('clinic_not_found')}</p>
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
            title: t('clinics_management'),
            href: '/dashboard/clinics',
        },
        {
            title: t('view_clinic'),
            href: '#',
        },
    ];
    

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={t('view_clinic')} />

                <div className={cn("flex h-full flex-1 flex-col gap-6 overflow-x-auto rounded-xl bg-card dark:bg-card p-6 border border-border", isRTL ? '!text-right' : '!text-left')} dir={dir}>
                {/* Header */}
                <div className={cn("flex items-center justify-between border-b pb-4", flexDirection)}>
                    <div className={cn(isRTL ? '!text-right' : '!text-left')}>
                        <div className={cn("flex items-center gap-3", flexDirection)}>
                            <h1 className={cn("text-3xl font-bold text-foreground", isRTL ? '!text-right' : '!text-left')}>{t('view_clinic')}</h1>
                            <Badge 
                                variant={
                                    clinic.status === 'approved' ? 'default' : 
                                    clinic.status === 'pending' ? 'secondary' : 'destructive'
                                }
                                className={cn(
                                    "text-base px-4 py-1",
                                    clinic.status === 'approved' ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 border-green-200 dark:border-green-800' :
                                    clinic.status === 'pending' ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300 border-yellow-200 dark:border-yellow-800' :
                                    'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300 border-red-200 dark:border-red-800',
                                    isRTL ? '!text-right' : '!text-left'
                                )}
                            >
                                {t(clinic.status)}
                            </Badge>
                        </div>
                        <p className={cn("text-muted-foreground mt-1", isRTL ? '!text-right' : '!text-left')}>{t('view_clinic_description')}</p>
                    </div>
                    
                    <div className={cn("flex items-center gap-3", flexDirection)}>
                        <Link href={`/dashboard/clinics/${clinic.id}/edit`}>
                            <Button 
                                className={cn("flex items-center gap-2", flexDirection)}
                                aria-label={t('edit')}
                            >
                                <Edit className={cn("h-4 w-4", iconMargin('md'))} />
                                {t('edit')}
                            </Button>
                        </Link>
                        <Link href="/dashboard/clinics">
                            <Button 
                                variant="outline" 
                                className={cn("flex items-center gap-2", flexDirection)}
                                aria-label={t('back')}
                            >
                                <ArrowLeft className={cn("h-4 w-4", isRTL && 'rotate-180')} />
                                {t('back')}
                            </Button>
                        </Link>
                    </div>
                </div>

                {/* Clinic Information Tabs */}
                <Tabs value={activeTab.toString()} onValueChange={(value) => handleTabChange(value)} className="w-full">
                    <TabsList className={cn("grid w-full grid-cols-6", flexDirection)}> {/* Changed from grid-cols-7 to grid-cols-6 - subscription tab hidden */}
                        <TabsTrigger value="1" className={cn(isRTL ? '!text-right' : '!text-left')}>
                            {t('account_information')}
                        </TabsTrigger>
                        <TabsTrigger value="2" className={cn(isRTL ? '!text-right' : '!text-left')}>
                            {t('clinic_basic_info')}
                        </TabsTrigger>
                        <TabsTrigger value="3" className={cn(isRTL ? '!text-right' : '!text-left')}>
                            {t('address_location')}
                        </TabsTrigger>
                        <TabsTrigger value="4" className={cn(isRTL ? '!text-right' : '!text-left')}>
                            {t('settings_policies')}
                        </TabsTrigger>
                        <TabsTrigger value="5" className={cn(isRTL ? '!text-right' : '!text-left')}>
                            {t('operating_hours')}
                        </TabsTrigger>
                        <TabsTrigger value="6" className={cn(isRTL ? '!text-right' : '!text-left')}>
                            {t('documents')}
                        </TabsTrigger>
                        {/* <TabsTrigger value="7" className={cn(isRTL ? '!text-right' : '!text-left')}> COMMENTED OUT - Subscription tab hidden
                            {t('subscription')}
                        </TabsTrigger> */}
                    </TabsList>

                    {/* Tab 1: Account Information */}
                    <TabsContent value="1" className={cn("mt-6", isRTL ? '!text-right' : '!text-left')} dir={dir}>
                        <div className={cn("space-y-6", isRTL ? '!text-right' : '!text-left')} dir={dir}>
                            <div className={cn("flex items-center gap-3 mb-6", flexDirection)}>
                                <Building2 className="h-6 w-6 text-primary" />
                                <h2 className={cn("text-2xl font-semibold text-foreground", isRTL ? '!text-right' : '!text-left')}>
                                    {t('account_information')}
                                </h2>
                            </div>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className={cn("space-y-2", isRTL ? '!text-right' : '!text-left')}>
                                    <p className={cn("text-sm text-muted-foreground", isRTL ? '!text-right' : '!text-left')}>{t('full_name')}</p>
                                    <p className={cn("text-base font-medium text-foreground", isRTL ? '!text-right' : '!text-left')}>{clinic.owner?.name || '—'}</p>
                                </div>
                                <div className={cn("space-y-2", isRTL ? '!text-right' : '!text-left')}>
                                    <p className={cn("text-sm text-muted-foreground", isRTL ? '!text-right' : '!text-left')}>{t('email')}</p>
                                    <div className={cn("flex items-center gap-2", flexDirection)}>
                                        <Mail className="h-4 w-4 text-gray-400" />
                                        <p className={cn("text-base font-medium text-foreground", isRTL ? '!text-right' : '!text-left')}>{clinic.owner?.email || '—'}</p>
                                    </div>
                                </div>
                                <div className={cn("space-y-2", isRTL ? '!text-right' : '!text-left')}>
                                    <p className={cn("text-sm text-muted-foreground", isRTL ? '!text-right' : '!text-left')}>{t('phone_number')}</p>
                                    <div className={cn("flex items-center gap-2", flexDirection)}>
                                        <Phone className="h-4 w-4 text-gray-400" />
                                        <p className={cn("text-base font-medium text-foreground", isRTL ? '!text-right' : '!text-left')}>{clinic.owner?.phone || '—'}</p>
                                    </div>
                                </div>
                                {clinic.owner?.id && (
                                    <div className={cn("space-y-2", isRTL ? '!text-right' : '!text-left')}>
                                        <p className={cn("text-sm text-muted-foreground", isRTL ? '!text-right' : '!text-left')}>{t('user_id')}</p>
                                        <p className={cn("text-base font-medium text-foreground", isRTL ? '!text-right' : '!text-left')}>#{clinic.owner.id}</p>
                                    </div>
                                )}
                                {clinic.owner?.admin_commission !== null && clinic.owner?.admin_commission !== undefined && (
                                    <div className={cn("space-y-2", isRTL ? '!text-right' : '!text-left')}>
                                        <p className={cn("text-sm text-muted-foreground", isRTL ? '!text-right' : '!text-left')}>{t('admin_commission')}</p>
                                        <p className={cn("text-base font-medium text-foreground", isRTL ? '!text-right' : '!text-left')}>{clinic.owner.admin_commission}%</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </TabsContent>

                    {/* Tab 2: Clinic Basic Information */}
                    <TabsContent value="2" className={cn("mt-6", isRTL ? '!text-right' : '!text-left')} dir={dir}>
                        <div className={cn("space-y-6", isRTL ? '!text-right' : '!text-left')} dir={dir}>
                            <div className={cn("flex items-center gap-3 mb-6", flexDirection)}>
                                <FileText className="h-6 w-6 text-primary" />
                                <h2 className={cn("text-2xl font-semibold text-foreground", isRTL ? '!text-right' : '!text-left')}>
                                    {t('clinic_basic_info')}
                                </h2>
                            </div>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className={cn("space-y-2", isRTL ? '!text-right' : '!text-left')} dir={dir}>
                                    <p className={cn("text-sm text-muted-foreground", isRTL ? '!text-right' : '!text-left')}>{t('clinic_name_en')}</p>
                                    <p className={cn("text-base font-medium text-foreground", isRTL ? '!text-right' : '!text-left')} dir="ltr">{clinic.name_en || '—'}</p>
                                </div>
                                <div className={cn("space-y-2", isRTL ? '!text-right' : '!text-left')} dir={dir}>
                                    <p className={cn("text-sm text-muted-foreground", isRTL ? '!text-right' : '!text-left')}>{t('clinic_name_ar')}</p>
                                    <p className={cn("text-base font-medium text-foreground", isRTL ? '!text-right' : '!text-left')} dir="rtl">{clinic.name_ar || '—'}</p>
                                </div>
                                {clinic.bio_en && (
                                    <div className={cn("space-y-2", isRTL ? '!text-right' : '!text-left')} dir={dir}>
                                        <p className={cn("text-sm text-muted-foreground", isRTL ? '!text-right' : '!text-left')}>{t('bio_en')}</p>
                                        <p className={cn("text-base text-foreground", isRTL ? '!text-right' : '!text-left')} dir="ltr">{clinic.bio_en}</p>
                                    </div>
                                )}
                                {clinic.bio_ar && (
                                    <div className={cn("space-y-2", isRTL ? '!text-right' : '!text-left')} dir={dir}>
                                        <p className={cn("text-sm text-muted-foreground", isRTL ? '!text-right' : '!text-left')}>{t('bio_ar')}</p>
                                        <p className={cn("text-base text-foreground", isRTL ? '!text-right' : '!text-left')} dir="rtl">{clinic.bio_ar}</p>
                                    </div>
                                )}
                                <div className={cn("space-y-2", isRTL ? '!text-right' : '!text-left')} dir={dir}>
                                    <p className={cn("text-sm text-muted-foreground", isRTL ? '!text-right' : '!text-left')}>{t('phone')}</p>
                                    <p className={cn("text-base font-medium text-foreground", isRTL ? '!text-right' : '!text-left')} dir={dir}>{clinic.phone || '—'}</p>
                                </div>
                                <div className={cn("space-y-2", isRTL ? '!text-right' : '!text-left')} dir={dir}>
                                    <p className={cn("text-sm text-muted-foreground", isRTL ? '!text-right' : '!text-left')}>{t('email')}</p>
                                    <p className={cn("text-base font-medium text-foreground", isRTL ? '!text-right' : '!text-left')} dir="ltr">{clinic.email || '—'}</p>
                                </div>
                                {clinic.category && (
                                    <div className={cn("space-y-2", isRTL ? '!text-right' : '!text-left')} dir={dir}>
                                        <p className={cn("text-sm text-muted-foreground", isRTL ? '!text-right' : '!text-left')}>{t('category')}</p>
                                        <p className={cn("text-base font-medium text-foreground", isRTL ? '!text-right' : '!text-left')} dir={dir}>
                                            {getLocalizedName(clinic.category.name_en, clinic.category.name_ar, locale)}
                                        </p>
                                    </div>
                                )}
                                {clinic.logo && (
                                    <div className={cn("space-y-2", isRTL ? '!text-right' : '!text-left')} dir={dir}>
                                        <p className={cn("text-sm text-muted-foreground", isRTL ? '!text-right' : '!text-left')}>{t('logo')}</p>
                                        <img src={clinic.logo} alt={clinic.name_en} className="w-32 h-32 object-cover rounded" />
                                    </div>
                                )}
                            </div>
                        </div>
                    </TabsContent>

                    {/* Tab 3: Address & Location */}
                    <TabsContent value="3" className={cn("mt-6", isRTL ? '!text-right' : '!text-left')} dir={dir}>
                        <div className={cn("space-y-6", isRTL ? '!text-right' : '!text-left')} dir={dir}>
                            <div className={cn("flex items-center gap-3 mb-6", flexDirection)}>
                                <MapPin className="h-6 w-6 text-primary" />
                                <h2 className={cn("text-2xl font-semibold text-foreground", isRTL ? '!text-right' : '!text-left')}>
                                    {t('address_location')}
                                </h2>
                            </div>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {clinic.governorate && (
                                    <div className={cn("space-y-2", isRTL ? '!text-right' : '!text-left')} dir={dir}>
                                        <p className={cn("text-sm text-muted-foreground", isRTL ? '!text-right' : '!text-left')}>{t('governorate')}</p>
                                        <p className={cn("text-base font-medium text-foreground", isRTL ? '!text-right' : '!text-left')} dir={dir}>
                                            {getLocalizedName(clinic.governorate.name_en, clinic.governorate.name_ar, locale)}
                                        </p>
                                    </div>
                                )}
                                {clinic.area && (
                                    <div className={cn("space-y-2", isRTL ? '!text-right' : '!text-left')} dir={dir}>
                                        <p className={cn("text-sm text-muted-foreground", isRTL ? '!text-right' : '!text-left')}>{t('area')}</p>
                                        <p className={cn("text-base font-medium text-foreground", isRTL ? '!text-right' : '!text-left')} dir={dir}>
                                            {getLocalizedName(clinic.area.name_en, clinic.area.name_ar, locale)}
                                        </p>
                                    </div>
                                )}
                                {clinic.address && (
                                    <div className={cn("space-y-2 md:col-span-2", isRTL ? '!text-right' : '!text-left')} dir={dir}>
                                        <p className={cn("text-sm text-muted-foreground", isRTL ? '!text-right' : '!text-left')}>{t('address')}</p>
                                        <p className={cn("text-base font-medium text-foreground", isRTL ? '!text-right' : '!text-left')} dir={dir}>{clinic.address}</p>
                                    </div>
                                )}
                                {clinic.block && (
                                    <div className={cn("space-y-2", isRTL ? '!text-right' : '!text-left')} dir={dir}>
                                        <p className={cn("text-sm text-muted-foreground", isRTL ? '!text-right' : '!text-left')}>{t('block')}</p>
                                        <p className={cn("text-base font-medium text-foreground", isRTL ? '!text-right' : '!text-left')} dir={dir}>{clinic.block}</p>
                                    </div>
                                )}
                                {clinic.street && (
                                    <div className={cn("space-y-2", isRTL ? '!text-right' : '!text-left')} dir={dir}>
                                        <p className={cn("text-sm text-muted-foreground", isRTL ? '!text-right' : '!text-left')}>{t('street')}</p>
                                        <p className={cn("text-base font-medium text-foreground", isRTL ? '!text-right' : '!text-left')} dir={dir}>{clinic.street}</p>
                                    </div>
                                )}
                                {clinic.avenue && (
                                    <div className={cn("space-y-2", isRTL ? '!text-right' : '!text-left')} dir={dir}>
                                        <p className={cn("text-sm text-muted-foreground", isRTL ? '!text-right' : '!text-left')}>{t('avenue')}</p>
                                        <p className={cn("text-base font-medium text-foreground", isRTL ? '!text-right' : '!text-left')} dir={dir}>{clinic.avenue}</p>
                                    </div>
                                )}
                                {clinic.house && (
                                    <div className={cn("space-y-2", isRTL ? '!text-right' : '!text-left')} dir={dir}>
                                        <p className={cn("text-sm text-muted-foreground", isRTL ? '!text-right' : '!text-left')}>{t('house')}</p>
                                        <p className={cn("text-base font-medium text-foreground", isRTL ? '!text-right' : '!text-left')} dir={dir}>{clinic.house}</p>
                                    </div>
                                )}
                                {clinic.floor && (
                                    <div className={cn("space-y-2", isRTL ? '!text-right' : '!text-left')} dir={dir}>
                                        <p className={cn("text-sm text-muted-foreground", isRTL ? '!text-right' : '!text-left')}>{t('floor')}</p>
                                        <p className={cn("text-base font-medium text-foreground", isRTL ? '!text-right' : '!text-left')} dir={dir}>{clinic.floor}</p>
                                    </div>
                                )}
                                {clinic.apt && (
                                    <div className={cn("space-y-2", isRTL ? '!text-right' : '!text-left')} dir={dir}>
                                        <p className={cn("text-sm text-muted-foreground", isRTL ? '!text-right' : '!text-left')}>{t('apt')}</p>
                                        <p className={cn("text-base font-medium text-foreground", isRTL ? '!text-right' : '!text-left')} dir={dir}>{clinic.apt}</p>
                                    </div>
                                )}
                                {clinic.city && (
                                    <div className={cn("space-y-2", isRTL ? '!text-right' : '!text-left')} dir={dir}>
                                        <p className={cn("text-sm text-muted-foreground", isRTL ? '!text-right' : '!text-left')}>{t('city')}</p>
                                        <p className={cn("text-base font-medium text-foreground", isRTL ? '!text-right' : '!text-left')} dir={dir}>{clinic.city}</p>
                                    </div>
                                )}
                                {clinic.country && (
                                    <div className={cn("space-y-2", isRTL ? '!text-right' : '!text-left')} dir={dir}>
                                        <p className={cn("text-sm text-muted-foreground", isRTL ? '!text-right' : '!text-left')}>{t('country')}</p>
                                        <p className={cn("text-base font-medium text-foreground", isRTL ? '!text-right' : '!text-left')} dir={dir}>{clinic.country}</p>
                                    </div>
                                )}
                                {clinic.postal_code && (
                                    <div className={cn("space-y-2", isRTL ? '!text-right' : '!text-left')} dir={dir}>
                                        <p className={cn("text-sm text-muted-foreground", isRTL ? '!text-right' : '!text-left')}>{t('postal_code')}</p>
                                        <p className={cn("text-base font-medium text-foreground", isRTL ? '!text-right' : '!text-left')} dir={dir}>{clinic.postal_code}</p>
                                    </div>
                                )}
                                {clinic.latitude && clinic.longitude && (
                                    <div className={cn("space-y-2 md:col-span-2", isRTL ? '!text-right' : '!text-left')} dir={dir}>
                                        <p className={cn("text-sm text-muted-foreground", isRTL ? '!text-right' : '!text-left')}>{t('coordinates')}</p>
                                        <p className={cn("text-base font-medium text-foreground", isRTL ? '!text-right' : '!text-left')} dir="ltr">{clinic.latitude}, {clinic.longitude}</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </TabsContent>

                    {/* Tab 4: Settings & Policies */}
                    <TabsContent value="4" className={cn("mt-6", isRTL ? '!text-right' : '!text-left')} dir={dir}>
                        <div className={cn("space-y-6", isRTL ? '!text-right' : '!text-left')} dir={dir}>
                            <div className={cn("flex items-center gap-3 mb-6", flexDirection)}>
                                <Settings className="h-6 w-6 text-primary" />
                                <h2 className={cn("text-2xl font-semibold text-foreground", isRTL ? '!text-right' : '!text-left')}>
                                    {t('settings_policies')}
                                </h2>
                            </div>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className={cn("space-y-2", isRTL ? '!text-right' : '!text-left')} dir={dir}>
                                    <p className={cn("text-sm text-muted-foreground", isRTL ? '!text-right' : '!text-left')}>{t('auto_confirm_bookings')}</p>
                                    <Badge variant={clinic.auto_confirm_bookings ? 'default' : 'secondary'} className={cn(isRTL ? '!text-right' : '!text-left')}>
                                        {clinic.auto_confirm_bookings ? t('yes') : t('no')}
                                    </Badge>
                                </div>
                                {clinic.owner?.admin_commission !== null && clinic.owner?.admin_commission !== undefined && (
                                    <div className={cn("space-y-2", isRTL ? '!text-right' : '!text-left')} dir={dir}>
                                        <p className={cn("text-sm text-muted-foreground", isRTL ? '!text-right' : '!text-left')}>{t('admin_commission')}</p>
                                        <p className={cn("text-base font-medium text-foreground", isRTL ? '!text-right' : '!text-left')} dir={dir}>{clinic.owner.admin_commission}%</p>
                                    </div>
                                )}
                                
                                {/* Rescheduling Buffer Hours */}
                                <div className={cn("space-y-2", isRTL ? '!text-right' : '!text-left')} dir={dir}>
                                    <p className={cn("text-sm text-muted-foreground", isRTL ? '!text-right' : '!text-left')}>{t('rescheduling_buffer_hours')}</p>
                                    <p className={cn("text-base font-medium text-foreground", isRTL ? '!text-right' : '!text-left')} dir="ltr">
                                        {clinic.rescheduling_buffer_hours !== null && clinic.rescheduling_buffer_hours !== undefined 
                                            ? `${clinic.rescheduling_buffer_hours} ${t('hours')}`
                                            : `${siteSettings.rescheduling_buffer_hours} ${t('hours')} (${t('default')})`}
                                    </p>
                                </div>
                                
                                {/* Cancellation Buffer Hours */}
                                <div className={cn("space-y-2", isRTL ? '!text-right' : '!text-left')} dir={dir}>
                                    <p className={cn("text-sm text-muted-foreground", isRTL ? '!text-right' : '!text-left')}>{t('cancellation_buffer_hours')}</p>
                                    <p className={cn("text-base font-medium text-foreground", isRTL ? '!text-right' : '!text-left')} dir="ltr">
                                        {clinic.cancellation_buffer_hours !== null && clinic.cancellation_buffer_hours !== undefined 
                                            ? `${clinic.cancellation_buffer_hours} ${t('hours')}`
                                            : `${siteSettings.cancellation_buffer_hours} ${t('hours')} (${t('default')})`}
                                    </p>
                                </div>
                                
                                {/* Refund Policy Type */}
                                <div className={cn("space-y-2", isRTL ? '!text-right' : '!text-left')} dir={dir}>
                                    <p className={cn("text-sm text-muted-foreground", isRTL ? '!text-right' : '!text-left')}>{t('refund_policy_type')}</p>
                                    <p className={cn("text-base font-medium text-foreground", isRTL ? '!text-right' : '!text-left')} dir={dir}>
                                        {clinic.refund_policy_type 
                                            ? t(clinic.refund_policy_type === 'full' ? 'full_refund' : clinic.refund_policy_type === 'fixed' ? 'fixed_refund' : 'partial_refund')
                                            : t(siteSettings.clinic_refund_policy_type === 'full' ? 'full_refund' : siteSettings.clinic_refund_policy_type === 'fixed' ? 'fixed_refund' : 'partial_refund') + ` (${t('default')})`}
                                    </p>
                                </div>
                                
                                {/* Refund Policy Value */}
                                {(clinic.refund_policy_type === 'partial' || clinic.refund_policy_type === 'fixed' || (!clinic.refund_policy_type && (siteSettings.clinic_refund_policy_type === 'partial' || siteSettings.clinic_refund_policy_type === 'fixed'))) && (
                                    <div className={cn("space-y-2", isRTL ? '!text-right' : '!text-left')} dir={dir}>
                                        <p className={cn("text-sm text-muted-foreground", isRTL ? '!text-right' : '!text-left')}>
                                            {clinic.refund_policy_type === 'fixed' || (!clinic.refund_policy_type && siteSettings.clinic_refund_policy_type === 'fixed')
                                                ? t('refund_policy_fixed_amount')
                                                : t('refund_policy_percentage')}
                                        </p>
                                        <p className={cn("text-base font-medium text-foreground", isRTL ? '!text-right' : '!text-left')} dir="ltr">
                                            {clinic.refund_policy_percentage !== null && clinic.refund_policy_percentage !== undefined
                                                ? clinic.refund_policy_type === 'fixed' || (!clinic.refund_policy_type && siteSettings.clinic_refund_policy_type === 'fixed')
                                                    ? `${clinic.refund_policy_percentage} KWD`
                                                    : `${clinic.refund_policy_percentage}%`
                                                : clinic.refund_policy_type === 'fixed' || (!clinic.refund_policy_type && siteSettings.clinic_refund_policy_type === 'fixed')
                                                    ? `${siteSettings.clinic_refund_policy_value ?? siteSettings.clinic_refund_policy_percentage} KWD (${t('default')})`
                                                    : `${siteSettings.clinic_refund_policy_value ?? siteSettings.clinic_refund_policy_percentage}% (${t('default')})`}
                                        </p>
                                    </div>
                                )}
                                
                                {(clinic.cancellation_policy_en || clinic.cancellation_policy_ar) && (
                                    <div className={cn("space-y-2 md:col-span-2", isRTL ? '!text-right' : '!text-left')} dir={dir}>
                                        <p className={cn("text-sm font-medium text-muted-foreground", isRTL ? '!text-right' : '!text-left')}>{t('cancellation_policy')}</p>
                                        <div className={cn("bg-gray-50 dark:bg-gray-800 rounded-lg p-4", isRTL ? '!text-right' : '!text-left')} dir={dir}>
                                            <p className={cn("text-base text-foreground whitespace-pre-wrap", isRTL ? '!text-right' : '!text-left')} dir={isRTL ? 'rtl' : 'ltr'}>
                                                {isRTL && clinic.cancellation_policy_ar
                                                    ? clinic.cancellation_policy_ar
                                                    : clinic.cancellation_policy_en || clinic.cancellation_policy_ar}
                                            </p>
                                        </div>
                                    </div>
                                )}
                                {(clinic.refund_policy_en || clinic.refund_policy_ar) && (
                                    <div className={cn("space-y-2 md:col-span-2", isRTL ? '!text-right' : '!text-left')} dir={dir}>
                                        <p className={cn("text-sm font-medium text-muted-foreground", isRTL ? '!text-right' : '!text-left')}>{t('refund_policy')}</p>
                                        <div className={cn("bg-gray-50 dark:bg-gray-800 rounded-lg p-4", isRTL ? '!text-right' : '!text-left')} dir={dir}>
                                            <p className={cn("text-base text-foreground whitespace-pre-wrap", isRTL ? '!text-right' : '!text-left')} dir={isRTL ? 'rtl' : 'ltr'}>
                                                {isRTL && clinic.refund_policy_ar
                                                    ? clinic.refund_policy_ar
                                                    : clinic.refund_policy_en || clinic.refund_policy_ar}
                                            </p>
                                        </div>
                                    </div>
                                )}
                                {(clinic.rescheduling_policy_en || clinic.rescheduling_policy_ar) && (
                                    <div className={cn("space-y-2 md:col-span-2", isRTL ? '!text-right' : '!text-left')} dir={dir}>
                                        <p className={cn("text-sm font-medium text-muted-foreground", isRTL ? '!text-right' : '!text-left')}>{t('rescheduling_policy')}</p>
                                        <div className={cn("bg-gray-50 dark:bg-gray-800 rounded-lg p-4", isRTL ? '!text-right' : '!text-left')} dir={dir}>
                                            <p className={cn("text-base text-foreground whitespace-pre-wrap", isRTL ? '!text-right' : '!text-left')} dir={isRTL ? 'rtl' : 'ltr'}>
                                                {isRTL && clinic.rescheduling_policy_ar
                                                    ? clinic.rescheduling_policy_ar
                                                    : clinic.rescheduling_policy_en || clinic.rescheduling_policy_ar}
                                            </p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </TabsContent>

                    {/* Tab 5: Operating Hours */}
                    <TabsContent value="5" className={cn("mt-6", isRTL ? '!text-right' : '!text-left')} dir={dir}>
                        <div className={cn("space-y-6", isRTL ? '!text-right' : '!text-left')} dir={dir}>
                            <div className={cn("flex items-center gap-3 mb-6", flexDirection)}>
                                <Clock className="h-6 w-6 text-primary" />
                                <h2 className={cn("text-2xl font-semibold text-foreground", isRTL ? '!text-right' : '!text-left')}>
                                    {t('operating_hours')}
                                </h2>
                            </div>
                            
                            <div className="space-y-4">
                                {DAYS_OF_WEEK.map((day) => {
                                    const operatingHour = operatingHours.find(oh => oh.day_of_week === day.value);
                                    return (
                                        <div key={day.value} className={cn("flex items-center justify-between p-4 border rounded-lg", flexDirection)} dir={dir}>
                                            <div className={cn("flex-1", isRTL ? '!text-right' : '!text-left')} dir={dir}>
                                                <p className={cn("text-base font-medium text-foreground", isRTL ? '!text-right' : '!text-left')} dir={dir}>{t(day.labelKey)}</p>
                                            </div>
                                            <div className={cn("flex items-center gap-4", flexDirection)}>
                                                {operatingHour && !operatingHour.closed_all_day && operatingHour.is_open ? (
                                                    <>
                                                        <p className={cn("text-sm text-muted-foreground", isRTL ? '!text-right' : '!text-left')} dir={dir}>{t('from')}</p>
                                                        <p className={cn("text-base font-medium text-foreground", isRTL ? '!text-right' : '!text-left')} dir="ltr">{operatingHour.opening_time || '—'}</p>
                                                        <p className={cn("text-sm text-muted-foreground", isRTL ? '!text-right' : '!text-left')} dir={dir}>{t('to')}</p>
                                                        <p className={cn("text-base font-medium text-foreground", isRTL ? '!text-right' : '!text-left')} dir="ltr">{operatingHour.closing_time || '—'}</p>
                                                    </>
                                                ) : (
                                                    <Badge variant="secondary" className={cn(isRTL ? '!text-right' : '!text-left')}>{t('closed')}</Badge>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </TabsContent>

                    {/* Tab 6: Documents */}
                    <TabsContent value="6" className={cn("mt-6", isRTL ? '!text-right' : '!text-left')} dir={dir}>
                        <div className={cn("space-y-6", isRTL ? '!text-right' : '!text-left')} dir={dir}>
                            <div className={cn("flex items-center gap-3 mb-6", flexDirection)}>
                                <File className="h-6 w-6 text-primary" />
                                <h2 className={cn("text-2xl font-semibold text-foreground", isRTL ? '!text-right' : '!text-left')}>
                                    {t('documents')}
                                </h2>
                            </div>
                            
                            {documents && documents.length > 0 ? (
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                    {documents.map((doc) => (
                                        <DocumentPreview
                                            key={doc.id}
                                            file={doc}
                                            collectionName={doc.collection_name}
                                        />
                                    ))}
                                </div>
                            ) : (
                                <p className={cn("text-muted-foreground", isRTL ? '!text-right' : '!text-left')} dir={dir}>{t('no_documents')}</p>
                            )}
                        </div>
                    </TabsContent>

                    {/* Tab 7: Subscription - COMMENTED OUT */}
                    {false && <TabsContent value="7" className="mt-6">
                        <div className="space-y-6">
                            <div className="flex items-center gap-3 mb-6">
                                <CreditCard className="h-6 w-6 text-primary" />
                                <h2 className="text-2xl font-semibold text-foreground">
                                    {t('subscription')}
                                </h2>
                            </div>
                            
                            <div className="space-y-6">
                                {/* Active Subscription */}
                                {(() => {
                                    // First, try to use the subscriptionPackage from activeSubscription relationship
                                    const subscriptionPackage = clinic.activeSubscription?.subscriptionPackage;
                                    
                                    // If not available, try to find it in subscriptionPackages array
                                    const packageFromArray = subscriptionPackages?.find(
                                        pkg => pkg.id === clinic.activeSubscription?.subscription_package_id
                                    );
                                    
                                    // Also try to find from subscriptions array if available
                                    const packageFromSubscriptions = subscriptions?.length > 0 
                                        ? subscriptionPackages?.find(
                                            pkg => pkg.id === subscriptions[0]?.subscription_package_id
                                        )
                                        : null;
                                    
                                    const activePackage = subscriptionPackage || packageFromArray || packageFromSubscriptions;
                                    
                                    // Check if we have activeSubscription or can get it from subscriptions
                                    const activeSub = clinic.activeSubscription || (subscriptions?.length > 0 ? subscriptions[0] : null);
                                    
                                    if (activeSub && activePackage) {
                                        return (
                                            <div className="space-y-4">
                                                <h3 className="text-lg font-semibold text-foreground">{t('active_subscription')}</h3>
                                                <div className="border rounded-lg p-6">
                                                    <div className={`space-y-4 ${isRTL ? 'text-right' : ''}`}>
                                                        <div>
                                                            <p className="text-sm text-muted-foreground">{t('package_name')}</p>
                                                            <p className="text-lg font-semibold text-foreground">
                                                                {getLocalizedName(activePackage.name_en, activePackage.name_ar, locale)}
                                                            </p>
                                                        </div>
                                                        {(activePackage.description_en || activePackage.description_ar) && (
                                                            <div>
                                                                <p className="text-sm text-muted-foreground">{t('description')}</p>
                                                                <p className="text-base text-foreground">
                                                                    {isRTL && activePackage.description_ar 
                                                                        ? activePackage.description_ar 
                                                                        : activePackage.description_en}
                                                                </p>
                                                            </div>
                                                        )}
                                                        {activePackage.price && (
                                                            <div>
                                                                <p className="text-sm text-muted-foreground">{t('price')}</p>
                                                                <p className="text-base font-medium text-foreground">
                                                                    {activePackage.price} {activePackage.currency || ''}
                                                                </p>
                                                            </div>
                                                        )}
                                                        {activePackage.billing_cycle && (
                                                            <div>
                                                                <p className="text-sm text-muted-foreground">{t('billing_cycle')}</p>
                                                                <p className="text-base font-medium text-foreground">{t(activePackage.billing_cycle)}</p>
                                                            </div>
                                                        )}
                                                        {activeSub.status && (
                                                            <div>
                                                                <p className="text-sm text-muted-foreground">{t('status')}</p>
                                                                <Badge variant={activeSub.status === 'active' ? 'default' : 'secondary'}>
                                                                    {t(activeSub.status)}
                                                                </Badge>
                                                            </div>
                                                        )}
                                                        {activeSub.start_date && (
                                                            <div>
                                                                <p className="text-sm text-muted-foreground">{t('start_date')}</p>
                                                                <p className="text-base font-medium text-foreground">
                                                                    {new Date(activeSub.start_date).toLocaleDateString(isRTL ? 'ar-SA' : 'en-US')}
                                                                </p>
                                                            </div>
                                                        )}
                                                        {activeSub.end_date && (
                                                            <div>
                                                                <p className="text-sm text-muted-foreground">{t('end_date')}</p>
                                                                <p className="text-base font-medium text-foreground">
                                                                    {new Date(activeSub.end_date).toLocaleDateString(isRTL ? 'ar-SA' : 'en-US')}
                                                                </p>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    } else {
                                        return (
                                            <div className="space-y-4">
                                                <h3 className="text-lg font-semibold text-foreground">{t('active_subscription')}</h3>
                                                <div className="border rounded-lg p-6">
                                                    <div className={`space-y-4 ${isRTL ? 'text-right' : ''}`}>
                                                        <div>
                                                            <p className="text-sm text-muted-foreground">{t('package_name')}</p>
                                                            <p className="text-lg font-semibold text-foreground">
                                                                {t('free_plan')}
                                                            </p>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    }
                                })()}

                                {/* All Available Packages */}
                                {subscriptionPackages && subscriptionPackages.length > 0 && (
                                    <div className="space-y-4">
                                        <h3 className="text-lg font-semibold text-foreground">{t('available_packages')}</h3>
                                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                            {subscriptionPackages.map((pkg) => {
                                                const isActive = clinic.activeSubscription?.subscription_package_id === pkg.id;
                                                return (
                                                    <div 
                                                        key={pkg.id} 
                                                        className={`border rounded-lg p-4 ${isActive ? 'border-primary bg-primary/5' : ''}`}
                                                    >
                                                        <div className={`space-y-3 ${isRTL ? 'text-right' : ''}`}>
                                                            <div className="flex items-center justify-between">
                                                                <p className="text-base font-semibold text-foreground">
                                                                    {getLocalizedName(pkg.name_en, pkg.name_ar, locale)}
                                                                </p>
                                                                {isActive && (
                                                                    <Badge variant="default" className="text-xs">
                                                                        {t('active')}
                                                                    </Badge>
                                                                )}
                                                            </div>
                                                            {(pkg.description_en || pkg.description_ar) && (
                                                                <p className="text-sm text-muted-foreground line-clamp-2">
                                                                    {isRTL && pkg.description_ar 
                                                                        ? pkg.description_ar 
                                                                        : pkg.description_en}
                                                                </p>
                                                            )}
                                                            <div className="space-y-1">
                                                                <p className="text-sm font-medium text-foreground">
                                                                    {pkg.price} {pkg.currency}
                                                                </p>
                                                                {pkg.billing_cycle && (
                                                                    <p className="text-xs text-muted-foreground">
                                                                        {t('billing_cycle')}: {t(pkg.billing_cycle)}
                                                                    </p>
                                                                )}
                                                                {pkg.duration_days && (
                                                                    <p className="text-xs text-muted-foreground">
                                                                        {t('duration')}: {pkg.duration_days} {t('days') || 'days'}
                                                                    </p>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </TabsContent>}
                </Tabs>
            </div>
        </AppLayout>
    );
}
