import { type BreadcrumbItem, type SharedData } from '@/types';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useRTLInit } from '@/hooks/use-rtl-init';
import { useTranslation } from '@/hooks/use-translation';
import { useRTL } from '@/hooks/use-rtl';
import AppLayout from '@/layouts/app-layout';
import { index as dashboard } from '@/routes/dashboard';
import { Head, Link, router, usePage } from '@inertiajs/react';
import { ArrowLeft, Edit, Smartphone, Globe, CreditCard, Calendar, Clock } from 'lucide-react';
import { formatHumanDate } from '@/utils/date-utils';
import { formatCurrency } from '@/utils/currency-utils';
import { getLocalizedName } from '@/utils/localization';
import { cn } from '@/lib/utils';
import { useEffect, useState } from 'react';

interface PaymentMethod {
    id: number;
    payment_method_id?: string;
    payment_method_ar: string;
    payment_method_en: string;
    payment_method_code?: string;
    is_direct_payment: boolean;
    service_charge: string;
    total_amount: string;
    currency_iso?: string;
    image_url?: string;
    is_embedded_supported: boolean;
    payment_currency_iso?: string;
    status: string;
    is_ios_supported: boolean;
    is_android_supported: boolean;
    is_web_supported: boolean;
    created_at: string;
    updated_at: string;
}

interface ShowPaymentMethodProps {
    paymentMethod: PaymentMethod;
}

export default function ShowPaymentMethod({ paymentMethod }: ShowPaymentMethodProps) {
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
            if (!isNaN(tabNum) && tabNum >= 1 && tabNum <= 3) {
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
    
    const breadcrumbs: BreadcrumbItem[] = [
        {
            title: t('dashboard'),
            href: dashboard.url(),
        },
        {
            title: t('payment_methods'),
            href: '/dashboard/payment-methods',
        },
        {
            title: t('view_payment_method'),
            href: '#',
        },
    ];

    const statusVariants: Record<string, { variant: 'default' | 'secondary' | 'destructive', className: string }> = {
        active: { variant: 'default', className: 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300' },
        inactive: { variant: 'secondary', className: 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300' },
    };

    const statusConfig = statusVariants[paymentMethod.status] || statusVariants.active;
    const displayName = getLocalizedName(paymentMethod.payment_method_en, paymentMethod.payment_method_ar, locale);

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`${t('view_payment_method')} - ${displayName}`} />

            <div className={cn("flex h-full flex-1 flex-col gap-6 overflow-x-auto rounded-xl bg-card dark:bg-card p-6 border border-border", isRTL ? '!text-right' : '!text-left')} dir={dir}>
                {/* Header */}
                <div className={cn("flex items-center justify-between border-b pb-4", flexDirection)}>
                    <div className={cn(isRTL ? '!text-right' : '!text-left')} dir={dir}>
                        <div className={cn("flex items-center gap-3", flexDirection)}>
                            <h1 className={cn("text-3xl font-bold text-foreground", isRTL ? '!text-right' : '!text-left')} dir={dir}>{t('view_payment_method')}</h1>
                            <Badge 
                                variant={statusConfig.variant}
                                className={cn(
                                    "text-base px-4 py-1",
                                    statusConfig.className,
                                    isRTL ? '!text-right' : '!text-left'
                                )}
                            >
                                {t(paymentMethod.status)}
                            </Badge>
                        </div>
                        <p className={cn("text-muted-foreground mt-1", isRTL ? '!text-right' : '!text-left')} dir={dir}>{t('view_payment_method_information')}</p>
                    </div>
                    
                    <div className={cn("flex items-center gap-3", flexDirection)}>
                        <Link href={`/dashboard/payment-methods/${paymentMethod.id}/edit`}>
                            <Button 
                                className={cn("flex items-center gap-2", flexDirection)}
                                aria-label={t('edit_payment_method')}
                            >
                                <Edit className={cn("h-4 w-4", iconMargin('md'))} />
                                {t('edit_payment_method')}
                            </Button>
                        </Link>
                        <Link href="/dashboard/payment-methods">
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

                {/* Image */}
                {paymentMethod.image_url && (
                    <div className={cn("flex justify-center mb-6", isRTL ? '!text-right' : '!text-left')} dir={dir}>
                        <img 
                            src={paymentMethod.image_url} 
                            alt={displayName}
                            className="h-32 w-32 object-contain rounded-lg border border-border"
                        />
                    </div>
                )}

                {/* Payment Method Information Tabs */}
                <Tabs value={activeTab.toString()} onValueChange={(value) => handleTabChange(value)} className="w-full">
                    <TabsList className={cn("grid w-full grid-cols-3", flexDirection)}>
                        <TabsTrigger value="1" className={cn(isRTL ? '!text-right' : '!text-left')} dir={dir}>
                            {t('basic_information')}
                        </TabsTrigger>
                        <TabsTrigger value="2" className={cn(isRTL ? '!text-right' : '!text-left')} dir={dir}>
                            {t('financial_information')}
                        </TabsTrigger>
                        <TabsTrigger value="3" className={cn(isRTL ? '!text-right' : '!text-left')} dir={dir}>
                            {t('settings')}
                        </TabsTrigger>
                    </TabsList>

                    {/* Tab 1: Basic Information */}
                    <TabsContent value="1" className={cn("mt-6", isRTL ? '!text-right' : '!text-left')} dir={dir}>
                        <div className={cn("space-y-6", isRTL ? '!text-right' : '!text-left')} dir={dir}>
                            <div className={cn("flex items-center gap-3 mb-6", flexDirection)}>
                                <CreditCard className="h-6 w-6 text-primary" />
                                <h2 className={cn("text-2xl font-semibold text-foreground", isRTL ? '!text-right' : '!text-left')} dir={dir}>
                                    {t('basic_information')}
                                </h2>
                            </div>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className={cn("space-y-2", isRTL ? '!text-right' : '!text-left')} dir={dir}>
                                    <p className={cn("text-sm text-muted-foreground", isRTL ? '!text-right' : '!text-left')} dir={dir}>{t('name_en')}</p>
                                    <p className={cn("text-base font-medium text-foreground", isRTL ? '!text-right' : '!text-left')} dir="ltr">{paymentMethod.payment_method_en}</p>
                                </div>
                                <div className={cn("space-y-2", isRTL ? '!text-right' : '!text-left')} dir={dir}>
                                    <p className={cn("text-sm text-muted-foreground", isRTL ? '!text-right' : '!text-left')} dir={dir}>{t('name_ar')}</p>
                                    <p className={cn("text-base font-medium text-foreground", isRTL ? '!text-right' : '!text-left')} dir="rtl">{paymentMethod.payment_method_ar}</p>
                                </div>
                                {paymentMethod.payment_method_code && (
                                    <div className={cn("space-y-2", isRTL ? '!text-right' : '!text-left')} dir={dir}>
                                        <p className={cn("text-sm text-muted-foreground", isRTL ? '!text-right' : '!text-left')} dir={dir}>{t('payment_method_code')}</p>
                                        <Badge variant="secondary" className={cn("text-base", isRTL ? '!text-right' : '!text-left')} dir="ltr">
                                            {paymentMethod.payment_method_code}
                                        </Badge>
                                    </div>
                                )}
                                {paymentMethod.payment_method_id && (
                                    <div className={cn("space-y-2", isRTL ? '!text-right' : '!text-left')} dir={dir}>
                                        <p className={cn("text-sm text-muted-foreground", isRTL ? '!text-right' : '!text-left')} dir={dir}>{t('payment_method_id')}</p>
                                        <p className={cn("text-base font-medium text-foreground", isRTL ? '!text-right' : '!text-left')} dir="ltr">{paymentMethod.payment_method_id}</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </TabsContent>

                    {/* Tab 2: Financial Information */}
                    <TabsContent value="2" className={cn("mt-6", isRTL ? '!text-right' : '!text-left')} dir={dir}>
                        <div className={cn("space-y-6", isRTL ? '!text-right' : '!text-left')} dir={dir}>
                            <div className={cn("flex items-center gap-3 mb-6", flexDirection)}>
                                <CreditCard className="h-6 w-6 text-primary" />
                                <h2 className={cn("text-2xl font-semibold text-foreground", isRTL ? '!text-right' : '!text-left')} dir={dir}>
                                    {t('financial_information')}
                                </h2>
                            </div>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className={cn("space-y-2", isRTL ? '!text-right' : '!text-left')} dir={dir}>
                                    <p className={cn("text-sm text-muted-foreground", isRTL ? '!text-right' : '!text-left')} dir={dir}>{t('total_amount')}</p>
                                    <p className={cn("text-base font-medium text-foreground", isRTL ? '!text-right' : '!text-left')} dir="ltr">
                                        {formatCurrency(paymentMethod.total_amount, paymentMethod.currency_iso || 'KWD')}
                                    </p>
                                </div>
                                {paymentMethod.currency_iso && (
                                    <div className={cn("space-y-2", isRTL ? '!text-right' : '!text-left')} dir={dir}>
                                        <p className={cn("text-sm text-muted-foreground", isRTL ? '!text-right' : '!text-left')} dir={dir}>{t('currency_iso')}</p>
                                        <Badge variant="secondary" className={cn("text-base", isRTL ? '!text-right' : '!text-left')} dir="ltr">
                                            {paymentMethod.currency_iso}
                                        </Badge>
                                    </div>
                                )}
                                {paymentMethod.payment_currency_iso && (
                                    <div className={cn("space-y-2", isRTL ? '!text-right' : '!text-left')} dir={dir}>
                                        <p className={cn("text-sm text-muted-foreground", isRTL ? '!text-right' : '!text-left')} dir={dir}>{t('payment_currency_iso')}</p>
                                        <Badge variant="secondary" className={cn("text-base", isRTL ? '!text-right' : '!text-left')} dir="ltr">
                                            {paymentMethod.payment_currency_iso}
                                        </Badge>
                                    </div>
                                )}
                            </div>
                        </div>
                    </TabsContent>

                    {/* Tab 3: Settings */}
                    <TabsContent value="3" className={cn("mt-6", isRTL ? '!text-right' : '!text-left')} dir={dir}>
                        <div className={cn("space-y-6", isRTL ? '!text-right' : '!text-left')} dir={dir}>
                            <div className={cn("flex items-center gap-3 mb-6", flexDirection)}>
                                <CreditCard className="h-6 w-6 text-primary" />
                                <h2 className={cn("text-2xl font-semibold text-foreground", isRTL ? '!text-right' : '!text-left')} dir={dir}>
                                    {t('settings')}
                                </h2>
                            </div>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className={cn("space-y-2", isRTL ? '!text-right' : '!text-left')} dir={dir}>
                                    <p className={cn("text-sm text-muted-foreground", isRTL ? '!text-right' : '!text-left')} dir={dir}>{t('is_direct_payment')}</p>
                                    <Badge variant={paymentMethod.is_direct_payment ? 'default' : 'secondary'} className={cn(isRTL ? '!text-right' : '!text-left')}>
                                        {paymentMethod.is_direct_payment ? t('yes') : t('no')}
                                    </Badge>
                                </div>
                                <div className={cn("space-y-2", isRTL ? '!text-right' : '!text-left')} dir={dir}>
                                    <p className={cn("text-sm text-muted-foreground", isRTL ? '!text-right' : '!text-left')} dir={dir}>{t('is_embedded_supported')}</p>
                                    <Badge variant={paymentMethod.is_embedded_supported ? 'default' : 'secondary'} className={cn(isRTL ? '!text-right' : '!text-left')}>
                                        {paymentMethod.is_embedded_supported ? t('yes') : t('no')}
                                    </Badge>
                                </div>
                                <div className={cn("space-y-2 md:col-span-2", isRTL ? '!text-right' : '!text-left')} dir={dir}>
                                    <p className={cn("text-sm text-muted-foreground", isRTL ? '!text-right' : '!text-left')} dir={dir}>{t('platform_support')}</p>
                                    <div className={cn("flex flex-wrap gap-2", flexDirection)}>
                                        {paymentMethod.is_ios_supported && (
                                            <Badge variant="secondary" className={cn("flex items-center gap-1", isRTL ? '!text-right' : '!text-left')} dir="ltr">
                                                <Smartphone className="h-3 w-3" />
                                                iOS
                                            </Badge>
                                        )}
                                        {paymentMethod.is_android_supported && (
                                            <Badge variant="secondary" className={cn("flex items-center gap-1", isRTL ? '!text-right' : '!text-left')} dir="ltr">
                                                <Smartphone className="h-3 w-3" />
                                                Android
                                            </Badge>
                                        )}
                                        {paymentMethod.is_web_supported && (
                                            <Badge variant="secondary" className={cn("flex items-center gap-1", isRTL ? '!text-right' : '!text-left')} dir="ltr">
                                                <Globe className="h-3 w-3" />
                                                Web
                                            </Badge>
                                        )}
                                    </div>
                                </div>
                                <div className={cn("space-y-2", isRTL ? '!text-right' : '!text-left')} dir={dir}>
                                    <div className={cn("flex items-center gap-2", flexDirection)}>
                                        <Calendar className="h-4 w-4 text-gray-400" />
                                        <p className={cn("text-sm text-muted-foreground", isRTL ? '!text-right' : '!text-left')} dir={dir}>{t('created_at')}</p>
                                    </div>
                                    <p className={cn("text-base font-medium text-foreground", isRTL ? '!text-right' : '!text-left')} dir={dir}>
                                        {formatHumanDate(paymentMethod.created_at, t)}
                                    </p>
                                </div>
                                <div className={cn("space-y-2", isRTL ? '!text-right' : '!text-left')} dir={dir}>
                                    <div className={cn("flex items-center gap-2", flexDirection)}>
                                        <Clock className="h-4 w-4 text-gray-400" />
                                        <p className={cn("text-sm text-muted-foreground", isRTL ? '!text-right' : '!text-left')} dir={dir}>{t('updated_at')}</p>
                                    </div>
                                    <p className={cn("text-base font-medium text-foreground", isRTL ? '!text-right' : '!text-left')} dir={dir}>
                                        {formatHumanDate(paymentMethod.updated_at, t)}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </TabsContent>
                </Tabs>
            </div>
        </AppLayout>
    );
}
