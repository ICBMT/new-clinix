import { type BreadcrumbItem } from '@/types';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useRTLInit } from '@/hooks/use-rtl-init';
import { useTranslation } from '@/hooks/use-translation';
import { useRTL } from '@/hooks/use-rtl';
import AppLayout from '@/layouts/app-layout';
import { index as dashboard } from '@/routes/dashboard';
import { Head, Link, router, usePage } from '@inertiajs/react';
import { ArrowLeft, Edit, FileText, Package, Info, Clock } from 'lucide-react';
import { getLocalizedName } from '@/utils/localization';
import { cn } from '@/lib/utils';
import { useEffect, useState } from 'react';
import { type SharedData } from '@/types';
import { ClinicCard } from '@/components/clinic-card';

interface Treatment {
    id: number;
    name_en: string;
    name_ar: string;
    description_en?: string;
    description_ar?: string;
    preparation_instructions_en?: string;
    preparation_instructions_ar?: string;
    aftercare_instructions_en?: string;
    aftercare_instructions_ar?: string;
    side_effects_en?: string;
    side_effects_ar?: string;
    warnings_en?: string;
    warnings_ar?: string;
    treatment_steps_en?: string[] | string;
    treatment_steps_ar?: string[] | string;
    clinic?: { id: number; name_en: string; name_ar: string; status?: string; email?: string; phone?: string; logo?: string | null };
    category?: { id: number; name_en: string; name_ar: string };
    status: 'pending' | 'approved' | 'rejected';
    rejection_reason?: string;
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
    suitable_for_skin_types?: string[];
    suitable_for_conditions?: string[];
    video_url?: string;
    faq?: Array<{ question_en?: string; question_ar?: string; answer_en?: string; answer_ar?: string }> | string;
    average_rating?: number;
    total_reviews?: number;
    total_bookings?: number;
    popularity_score?: number;
    featured_until?: string;
    slug_en?: string;
    slug_ar?: string;
    meta_description_en?: string;
    meta_description_ar?: string;
    meta_keywords_en?: string;
    meta_keywords_ar?: string;
    created_at: string;
    updated_at: string;
    machines?: Array<{ id: number; model_en?: string; model_ar?: string; manufacturer_en?: string; manufacturer_ar?: string; status?: string }>;
    addOns?: Array<{ id: number; name_en?: string; name_ar?: string; price: string; description_en?: string; description_ar?: string }>;
    media?: Array<{ id: number; file_name?: string; url?: string; collection_name?: string }>;
}

interface ShowTreatmentProps {
    treatment: Treatment;
}

export default function ShowTreatment({ treatment }: ShowTreatmentProps) {
    useRTLInit();
    const { t, locale } = useTranslation();
    const page = usePage<SharedData>();
    const { locale: pageLocale } = page.props;
    const isRTL = pageLocale === 'ar';
    const dir = isRTL ? 'rtl' : 'ltr';
    const { flexDirection, iconMargin } = useRTL();
    
    // Get initial tab from URL parameter or default to 1
    const [activeTab, setActiveTab] = useState<number>(1);
    
    // Sync with URL parameter on mount
    useEffect(() => {
        const urlParams = new URLSearchParams(window.location.search);
        const tab = urlParams.get('tab');
        if (tab) {
            const tabNum = parseInt(tab);
            if (!isNaN(tabNum) && tabNum >= 1 && tabNum <= 2) {
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
    
    if (!treatment) {
        return (
            <AppLayout breadcrumbs={[]}>
                <Head title={t('treatment_not_found')} />
                <div className={cn("flex h-full flex-1 flex-col gap-6 overflow-x-auto rounded-xl bg-card dark:bg-card p-6 border border-border", isRTL ? '!text-right' : '!text-left')} dir={dir}>
                    <p className={cn(isRTL ? '!text-right' : '!text-left')} dir={dir}>{t('treatment_not_found')}</p>
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
            title: t('treatments_management'),
        href: '/dashboard/treatments',
    },
    {
            title: t('view_treatment'),
        href: '#',
    },
];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={t('view_treatment')} />
            
            <div className={cn("flex h-full flex-1 flex-col gap-6 overflow-x-auto rounded-xl bg-card dark:bg-card p-6 border border-border", isRTL ? '!text-right' : '!text-left')} dir={dir}>
                {/* Header */}
                <div className={cn("flex items-center justify-between border-b pb-4", flexDirection)}>
                    <div className={cn(isRTL ? '!text-right' : '!text-left')}>
                        <div className={cn("flex items-center gap-3", flexDirection)}>
                            <h1 className={cn("text-3xl font-bold text-foreground", isRTL ? '!text-right' : '!text-left')} dir={dir}>{t('view_treatment')}</h1>
                            <Badge 
                                variant={
                                    treatment.status === 'approved' ? 'default' : 
                                    treatment.status === 'pending' ? 'secondary' : 'destructive'
                                }
                                className={cn(
                                    "text-base px-4 py-1",
                                    treatment.status === 'approved' ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 border-green-200 dark:border-green-800' :
                                    treatment.status === 'pending' ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300 border-yellow-200 dark:border-yellow-800' :
                                    'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300 border-red-200 dark:border-red-800',
                                    isRTL ? '!text-right' : '!text-left'
                                )}
                            >
                                {t(treatment.status)}
                            </Badge>
                        </div>
                        <p className={cn("text-muted-foreground mt-1", isRTL ? '!text-right' : '!text-left')} dir={dir}>{t('view_treatment_description') || t('view_treatment_information')}</p>
                    </div>
                    
                    <div className={cn("flex items-center gap-3", flexDirection)}>
                        <Link href={`/dashboard/treatments/${treatment.id}/edit`}>
                            <Button 
                                className={cn("flex items-center gap-2", flexDirection)}
                                aria-label={t('edit')}
                            >
                                <Edit className={cn("h-4 w-4", iconMargin('md'))} />
                                {t('edit')}
                            </Button>
                        </Link>
                        <Link href="/dashboard/treatments">
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

                {/* Treatment Information Tabs */}
                <Tabs value={activeTab.toString()} onValueChange={(value) => handleTabChange(value)} className="w-full">
                    <TabsList className={cn("grid w-full grid-cols-2", flexDirection)}>
                        <TabsTrigger value="1" className={cn(isRTL ? '!text-right' : '!text-left')}>
                            {t('basic_information')}
                        </TabsTrigger>
                        <TabsTrigger value="2" className={cn(isRTL ? '!text-right' : '!text-left')}>
                            {t('additional_information')}
                        </TabsTrigger>
                    </TabsList>

                    {/* Tab 1: Basic Information */}
                    <TabsContent value="1" className={cn("mt-6", isRTL ? '!text-right' : '!text-left')} dir={dir}>
                        <div className={cn("space-y-6", isRTL ? '!text-right' : '!text-left')} dir={dir}>
                            <div className={cn("flex items-center gap-3 mb-6", flexDirection)}>
                                <FileText className="h-6 w-6 text-primary" />
                                <h2 className={cn("text-2xl font-semibold text-foreground", isRTL ? '!text-right' : '!text-left')}>
                                    {t('basic_information')}
                                </h2>
                            </div>
                            
                            {/* Treatment Name & Image */}
                            <div className={cn("flex items-start gap-4 mb-6", flexDirection)}>
                            {treatment.media && treatment.media.length > 0 && (
                                <img 
                                    src={treatment.media[0].file_name || treatment.media[0].url || ''} 
                                    alt={getLocalizedName(treatment.name_en, treatment.name_ar, locale)}
                                    className="w-24 h-24 rounded-lg object-cover border"
                                    dir="ltr"
                                />
                            )}
                            <div className="flex-1">
                                    <h3 className={cn("text-xl font-semibold text-foreground mb-2", isRTL ? '!text-right' : '!text-left')} dir={dir}>
                            {getLocalizedName(treatment.name_en, treatment.name_ar, locale)}
                                    </h3>
                                    <div className={cn("flex items-center gap-2 flex-wrap", flexDirection)}>
                                    {treatment.is_featured && (
                                        <Badge variant="outline" className={cn("bg-yellow-50 dark:bg-yellow-900/20 text-yellow-800 dark:text-yellow-300", isRTL ? '!text-right' : '!text-left')} dir={dir}>
                                            {t('featured')}
                                        </Badge>
                                    )}
                                    {treatment.average_rating !== undefined && treatment.average_rating !== null && !isNaN(Number(treatment.average_rating)) && (
                                        <Badge variant="outline" className={cn(isRTL ? '!text-right' : '!text-left')} dir="ltr">
                                            ⭐ {Number(treatment.average_rating).toFixed(1)} ({treatment.total_reviews || 0} {t('reviews')})
                                        </Badge>
                                    )}
                            </div>
                        </div>
                    </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className={cn("space-y-2", isRTL ? '!text-right' : '!text-left')} dir={dir}>
                                    <p className={cn("text-sm text-muted-foreground mb-2", isRTL ? '!text-right' : '!text-left')}>{t('clinic')}</p>
                                    {treatment.clinic ? (
                                        <div
                                            className="cursor-pointer"
                                            onClick={() => router.visit(`/dashboard/clinics/${treatment.clinic?.id}`)}
                                        >
                                            <ClinicCard
                                                clinic={{
                                                    id: treatment.clinic.id,
                                                    company_name_en: treatment.clinic.name_en,
                                                    company_name_ar: treatment.clinic.name_ar,
                                                    email: treatment.clinic.email || '',
                                                    phone: treatment.clinic.phone || '',
                                                    logo: treatment.clinic.logo || null,
                                                }}
                                                locale={locale}
                                                variant="default"
                                            />
                                        </div>
                                    ) : (
                                        <p className={cn("text-base font-medium text-foreground", isRTL ? '!text-right' : '!text-left')} dir={dir}>—</p>
                                    )}
                                </div>
                                <div className={cn("space-y-2", isRTL ? '!text-right' : '!text-left')} dir={dir}>
                                    <p className={cn("text-sm text-muted-foreground", isRTL ? '!text-right' : '!text-left')}>{t('category')}</p>
                                    <p className={cn("text-base font-medium text-foreground", isRTL ? '!text-right' : '!text-left')} dir={dir}>
                                {treatment.category ? getLocalizedName(treatment.category.name_en, treatment.category.name_ar, locale) : '—'}
                            </p>
                        </div>
                                <div className={cn("space-y-2", isRTL ? '!text-right' : '!text-left')} dir={dir}>
                                    <p className={cn("text-sm text-muted-foreground", isRTL ? '!text-right' : '!text-left')}>{t('status')}</p>
                                    <p className={cn("text-base font-medium text-foreground", isRTL ? '!text-right' : '!text-left')} dir={dir}>{t(treatment.status)}</p>
                                </div>
                                {treatment.rejection_reason && (
                                    <div className={cn("space-y-2 md:col-span-2", isRTL ? '!text-right' : '!text-left')} dir={dir}>
                                        <p className={cn("text-sm text-muted-foreground", isRTL ? '!text-right' : '!text-left')}>{t('rejection_reason')}</p>
                                        <p className={cn("text-base font-medium text-foreground text-red-600 dark:text-red-400", isRTL ? '!text-right' : '!text-left')} dir={dir}>{treatment.rejection_reason}</p>
                                    </div>
                                )}
                            </div>

                            {/* Pricing */}
                            <div className={cn("mt-6", isRTL ? '!text-right' : '!text-left')} dir={dir}>
                                <div className={cn("flex items-center gap-3 mb-4", flexDirection)}>
                                    <Package className="h-5 w-5 text-primary" />
                                    <h3 className={cn("text-lg font-semibold text-foreground", isRTL ? '!text-right' : '!text-left')}>{t('pricing')}</h3>
                                </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                                    <div className={cn("space-y-2", isRTL ? '!text-right' : '!text-left')} dir={dir}>
                                        <p className={cn("text-sm text-muted-foreground", isRTL ? '!text-right' : '!text-left')}>{t('base_price')}</p>
                                        <p className={cn("text-base font-medium text-foreground", isRTL ? '!text-right' : '!text-left')} dir="ltr">{treatment.base_price} {treatment.currency || 'KWD'}</p>
                            </div>
                            {treatment.has_discount && treatment.final_price && treatment.final_price !== treatment.base_price && (
                                <>
                                            <div className={cn("space-y-2", isRTL ? '!text-right' : '!text-left')} dir={dir}>
                                                <p className={cn("text-sm text-muted-foreground", isRTL ? '!text-right' : '!text-left')}>{t('final_price')}</p>
                                                <p className={cn("text-base font-medium text-foreground text-green-600 dark:text-green-400", isRTL ? '!text-right' : '!text-left')} dir="ltr">
                                            {treatment.final_price} {treatment.currency || 'KWD'}
                                        </p>
                                    </div>
                                    {treatment.discount_type && treatment.discount_value && (
                                                <div className={cn("space-y-2", isRTL ? '!text-right' : '!text-left')} dir={dir}>
                                                    <p className={cn("text-sm text-muted-foreground", isRTL ? '!text-right' : '!text-left')}>{t('discount')}</p>
                                                    <p className={cn("text-base font-medium text-foreground", isRTL ? '!text-right' : '!text-left')} dir={dir}>
                                                {treatment.discount_type === 'percentage' 
                                                    ? `${treatment.discount_value}% ${t('off')}`
                                                    : `${treatment.discount_value} ${treatment.currency || 'KWD'} ${t('off')}`
                                                }
                                            </p>
                                        </div>
                                    )}
                                </>
                            )}
                                    <div className={cn("space-y-2", isRTL ? '!text-right' : '!text-left')} dir={dir}>
                                        <p className={cn("text-sm text-muted-foreground", isRTL ? '!text-right' : '!text-left')}>{t('currency')}</p>
                                        <p className={cn("text-base font-medium text-foreground", isRTL ? '!text-right' : '!text-left')} dir="ltr">{treatment.currency || 'KWD'}</p>
                            </div>
                        </div>
                    </div>

                            {/* Sessions & Duration */}
                            <div className={cn("mt-6", isRTL ? '!text-right' : '!text-left')} dir={dir}>
                                <div className={cn("flex items-center gap-3 mb-4", flexDirection)}>
                                    <Clock className="h-5 w-5 text-primary" />
                                    <h3 className={cn("text-lg font-semibold text-foreground", isRTL ? '!text-right' : '!text-left')}>{t('sessions_duration')}</h3>
                                </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                            {treatment.service_duration_minutes && (
                                        <div className={cn("space-y-2", isRTL ? '!text-right' : '!text-left')} dir={dir}>
                                            <p className={cn("text-sm text-muted-foreground", isRTL ? '!text-right' : '!text-left')}>{t('service_duration')}</p>
                                            <p className={cn("text-base font-medium text-foreground", isRTL ? '!text-right' : '!text-left')} dir="ltr">{treatment.service_duration_minutes} {t('minutes')}</p>
                            </div>
                        )}
                        {treatment.sessions_required && (
                                        <div className={cn("space-y-2", isRTL ? '!text-right' : '!text-left')} dir={dir}>
                                            <p className={cn("text-sm text-muted-foreground", isRTL ? '!text-right' : '!text-left')}>{t('sessions_required')}</p>
                                            <p className={cn("text-base font-medium text-foreground", isRTL ? '!text-right' : '!text-left')} dir="ltr">{treatment.sessions_required}</p>
                            </div>
                        )}
                        {treatment.max_sessions && (
                                        <div className={cn("space-y-2", isRTL ? '!text-right' : '!text-left')} dir={dir}>
                                            <p className={cn("text-sm text-muted-foreground", isRTL ? '!text-right' : '!text-left')}>{t('max_sessions')}</p>
                                            <p className={cn("text-base font-medium text-foreground", isRTL ? '!text-right' : '!text-left')} dir="ltr">{treatment.max_sessions}</p>
                            </div>
                        )}
                            {treatment.sessions_interval_days && (
                                        <div className={cn("space-y-2", isRTL ? '!text-right' : '!text-left')} dir={dir}>
                                            <p className={cn("text-sm text-muted-foreground", isRTL ? '!text-right' : '!text-left')}>{t('sessions_interval')}</p>
                                            <p className={cn("text-base font-medium text-foreground", isRTL ? '!text-right' : '!text-left')} dir="ltr">{treatment.sessions_interval_days} {t('days')}</p>
                                </div>
                            )}
                        {treatment.estimated_recovery_days && (
                                        <div className={cn("space-y-2", isRTL ? '!text-right' : '!text-left')} dir={dir}>
                                            <p className={cn("text-sm text-muted-foreground", isRTL ? '!text-right' : '!text-left')}>{t('estimated_recovery_days')}</p>
                                            <p className={cn("text-base font-medium text-foreground", isRTL ? '!text-right' : '!text-left')} dir="ltr">{treatment.estimated_recovery_days} {t('days')}</p>
                            </div>
                        )}
                        </div>
                    </div>

                            {/* Description & Instructions */}
                            {(treatment.description_en || treatment.description_ar || 
                              treatment.preparation_instructions_en || treatment.preparation_instructions_ar || 
                              treatment.aftercare_instructions_en || treatment.aftercare_instructions_ar ||
                              treatment.treatment_steps_en || treatment.treatment_steps_ar) && (
                                <div className={cn("mt-6", isRTL ? '!text-right' : '!text-left')} dir={dir}>
                                    <div className={cn("flex items-center gap-3 mb-4", flexDirection)}>
                                        <FileText className="h-5 w-5 text-primary" />
                                        <h3 className={cn("text-lg font-semibold text-foreground", isRTL ? '!text-right' : '!text-left')}>{t('description_instructions')}</h3>
                                    </div>
                                    
                    {treatment.description_en || treatment.description_ar ? (
                                        <div className={cn("space-y-2 mb-4", isRTL ? '!text-right' : '!text-left')} dir={dir}>
                                            <h4 className={cn("text-base font-semibold text-foreground", isRTL ? '!text-right' : '!text-left')}>{t('description')}</h4>
                                            <div className={cn("bg-gray-50 dark:bg-gray-800 rounded-lg p-4", isRTL ? '!text-right' : '!text-left')} dir={dir}>
                                                <p className={cn("text-base text-foreground whitespace-pre-line", isRTL ? '!text-right' : '!text-left')} dir={dir}>
                                {getLocalizedName(treatment.description_en, treatment.description_ar, locale)}
                            </p>
                                            </div>
                        </div>
                    ) : null}

                    {(treatment.preparation_instructions_en || treatment.preparation_instructions_ar || 
                      treatment.aftercare_instructions_en || treatment.aftercare_instructions_ar ||
                      treatment.treatment_steps_en || treatment.treatment_steps_ar) && (
                                        <div className={cn("space-y-4", isRTL ? '!text-right' : '!text-left')} dir={dir}>
                    {treatment.preparation_instructions_en || treatment.preparation_instructions_ar ? (
                                                <div className={cn("space-y-2", isRTL ? '!text-right' : '!text-left')} dir={dir}>
                                                    <h4 className={cn("text-base font-semibold text-foreground", isRTL ? '!text-right' : '!text-left')}>{t('preparation_instructions')}</h4>
                                                    <div className={cn("bg-gray-50 dark:bg-gray-800 rounded-lg p-4", isRTL ? '!text-right' : '!text-left')} dir={dir}>
                                                        <p className={cn("text-base text-foreground whitespace-pre-line", isRTL ? '!text-right' : '!text-left')} dir={dir}>
                                {getLocalizedName(treatment.preparation_instructions_en, treatment.preparation_instructions_ar, locale)}
                            </p>
                                                    </div>
                        </div>
                    ) : null}

                                {treatment.treatment_steps_en || treatment.treatment_steps_ar ? (
                                                <div className={cn("space-y-2", isRTL ? '!text-right' : '!text-left')} dir={dir}>
                                                    <h4 className={cn("text-base font-semibold text-foreground", isRTL ? '!text-right' : '!text-left')}>{t('treatment_steps')}</h4>
                                                    <div className={cn("bg-gray-50 dark:bg-gray-800 rounded-lg p-4", isRTL ? '!text-right' : '!text-left')} dir={dir}>
                                        {Array.isArray(treatment.treatment_steps_en) || Array.isArray(treatment.treatment_steps_ar) ? (
                                            <ol className={cn("list-decimal list-inside space-y-2", isRTL ? '!text-right' : '!text-left')} dir={dir}>
                                                {(Array.isArray(treatment.treatment_steps_en) ? treatment.treatment_steps_en : 
                                                  Array.isArray(treatment.treatment_steps_ar) ? treatment.treatment_steps_ar : []).map((step: string, idx: number) => (
                                                                    <li key={idx} className={cn("text-base text-foreground", isRTL ? '!text-right' : '!text-left')} dir={dir}>{step}</li>
                                                ))}
                                            </ol>
                                        ) : (
                                                            <p className={cn("text-base text-foreground whitespace-pre-line", isRTL ? '!text-right' : '!text-left')} dir={dir}>
                                                {getLocalizedName(treatment.treatment_steps_en as string, treatment.treatment_steps_ar as string, locale)}
                                            </p>
                                        )}
                                                    </div>
                                    </div>
                                ) : null}

                    {treatment.aftercare_instructions_en || treatment.aftercare_instructions_ar ? (
                                                <div className={cn("space-y-2", isRTL ? '!text-right' : '!text-left')} dir={dir}>
                                                    <h4 className={cn("text-base font-semibold text-foreground", isRTL ? '!text-right' : '!text-left')}>{t('aftercare_instructions')}</h4>
                                                    <div className={cn("bg-gray-50 dark:bg-gray-800 rounded-lg p-4", isRTL ? '!text-right' : '!text-left')} dir={dir}>
                                                        <p className={cn("text-base text-foreground whitespace-pre-line", isRTL ? '!text-right' : '!text-left')} dir={dir}>
                                {getLocalizedName(treatment.aftercare_instructions_en, treatment.aftercare_instructions_ar, locale)}
                            </p>
                                                    </div>
                        </div>
                    ) : null}
                            </div>
                                    )}
                        </div>
                    )}
                        </div>
                    </TabsContent>

                    {/* Tab 2: Additional Information */}
                    <TabsContent value="2" className={cn("mt-6", isRTL ? '!text-right' : '!text-left')} dir={dir}>
                        <div className={cn("space-y-6", isRTL ? '!text-right' : '!text-left')} dir={dir}>
                            <div className={cn("flex items-center gap-3 mb-6", flexDirection)}>
                                <Info className="h-6 w-6 text-primary" />
                                <h2 className={cn("text-2xl font-semibold text-foreground", isRTL ? '!text-right' : '!text-left')}>
                                    {t('additional_information')}
                                </h2>
                            </div>

                            {/* Machines */}
                    {treatment.machines && treatment.machines.length > 0 && (
                                <div className={cn("space-y-4", isRTL ? '!text-right' : '!text-left')} dir={dir}>
                                    <h3 className={cn("text-lg font-semibold text-foreground", isRTL ? '!text-right' : '!text-left')}>{t('machines')}</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                                {treatment.machines.map((machine) => (
                                            <div key={machine.id} className={cn("p-3 border rounded-lg", isRTL ? '!text-right' : '!text-left')} dir={dir}>
                                        <p className={cn("font-medium text-foreground", isRTL ? '!text-right' : '!text-left')} dir={dir}>
                                        {getLocalizedName(machine.model_en, machine.model_ar, locale)}
                                        </p>
                                        {machine.manufacturer_en || machine.manufacturer_ar ? (
                                            <p className={cn("text-sm text-muted-foreground", isRTL ? '!text-right' : '!text-left')} dir={dir}>
                                                {getLocalizedName(machine.manufacturer_en, machine.manufacturer_ar, locale)}
                                            </p>
                                        ) : null}
                                        {machine.status && (
                                            <Badge variant="outline" className={cn("mt-2 text-xs", isRTL ? '!text-right' : '!text-left')} dir={dir}>
                                                {t(machine.status)}
                                    </Badge>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                            {/* FAQ */}
                    {treatment.faq && (
                                <div className={cn("space-y-4", isRTL ? '!text-right' : '!text-left')} dir={dir}>
                                    <h3 className={cn("text-lg font-semibold text-foreground", isRTL ? '!text-right' : '!text-left')}>{t('faq')}</h3>
                                    <div className={cn("space-y-4", isRTL ? '!text-right' : '!text-left')} dir={dir}>
                                {Array.isArray(treatment.faq) ? (
                                            treatment.faq.map((item: { question_en?: string; question_ar?: string; answer_en?: string; answer_ar?: string }, idx: number) => (
                                                <div key={idx} className={cn("border-b pb-3 last:border-0", isRTL ? '!text-right' : '!text-left')} dir={dir}>
                                                    <h4 className={cn("font-medium text-foreground mb-1", isRTL ? '!text-right' : '!text-left')} dir={dir}>
                                                {getLocalizedName(item.question_en, item.question_ar, locale)}
                                                    </h4>
                                            <p className={cn("text-sm text-muted-foreground", isRTL ? '!text-right' : '!text-left')} dir={dir}>
                                                {getLocalizedName(item.answer_en, item.answer_ar, locale)}
                                            </p>
                                        </div>
                                    ))
                                ) : (
                                            <div className={cn("bg-gray-50 dark:bg-gray-800 rounded-lg p-4", isRTL ? '!text-right' : '!text-left')} dir={dir}>
                                                <p className={cn("text-base text-foreground whitespace-pre-line", isRTL ? '!text-right' : '!text-left')} dir={dir}>{treatment.faq}</p>
                                            </div>
                                )}
                            </div>
                        </div>
                    )}

                            {/* Media */}
                    {treatment.media && treatment.media.length > 0 && (
                                <div className={cn("space-y-4", isRTL ? '!text-right' : '!text-left')} dir={dir}>
                                    <h3 className={cn("text-lg font-semibold text-foreground", isRTL ? '!text-right' : '!text-left')}>{t('media')}</h3>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                {treatment.media.map((media) => (
                                    <div key={media.id} className="relative">
                                        <img 
                                            src={media.file_name || media.url || ''} 
                                            alt={`${getLocalizedName(treatment.name_en, treatment.name_ar, locale)} - ${media.collection_name || 'image'}`}
                                            className="w-full h-32 rounded-lg object-cover border"
                                            dir="ltr"
                                        />
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                            {/* Video */}
                    {treatment.video_url && (
                                <div className={cn("space-y-4", isRTL ? '!text-right' : '!text-left')} dir={dir}>
                                    <h3 className={cn("text-lg font-semibold text-foreground", isRTL ? '!text-right' : '!text-left')}>{t('video')}</h3>
                            <div className="aspect-video">
                                <iframe
                                    src={treatment.video_url}
                                    className="w-full h-full rounded-lg"
                                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                    allowFullScreen
                                    dir="ltr"
                                />
                            </div>
                        </div>
                    )}
                        </div>
                    </TabsContent>
                </Tabs>
            </div>
        </AppLayout>
    );
}
