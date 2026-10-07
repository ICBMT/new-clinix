import { type BreadcrumbItem } from '@/types';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useTranslation } from '@/hooks/use-translation';
import { useRTL } from '@/hooks/use-rtl';
import { useRTLInit } from '@/hooks/use-rtl-init';
import { getLocalizedName } from '@/utils/localization';
import AppLayout from '@/layouts/app-layout';
import { index as dashboard } from '@/routes/dashboard';
import { Head, Link, usePage } from '@inertiajs/react';
import { ArrowLeft, Edit, Calendar, DollarSign, Building2, Package } from 'lucide-react';
import { formatHumanDate } from '@/utils/date-utils';
import { type SharedData } from '@/types';

interface Subscription {
    id: number;
    clinic_id: number;
    subscription_package_id: number;
    status: string;
    start_date: string;
    end_date?: string;
    amount_paid?: string;
    currency?: string;
    clinic?: {
        id: number;
        name_en: string;
        name_ar: string;
    };
    subscriptionPackage?: {
        id: number;
        name_en: string;
        name_ar: string;
    };
    transaction?: {
        id: number;
        transaction_id: string;
        amount: string;
    };
    created_at: string;
    updated_at: string;
}

interface ShowSubscriptionProps {
    subscription: Subscription;
}

export default function ShowSubscription({ subscription }: ShowSubscriptionProps) {
    useRTLInit();
    const { t, locale } = useTranslation();
    const page = usePage<SharedData>();
    const { locale: pageLocale } = page.props;
    const isRTL = pageLocale === 'ar';
    const dir = isRTL ? 'rtl' : 'ltr';
    const { flexDirection, iconMargin } = useRTL();
    
    const breadcrumbs: BreadcrumbItem[] = [
        {
            title: t('dashboard'),
            href: dashboard.url(),
        },
        {
            title: t('clinics_subscriptions_management'),
            href: '/dashboard/clinics-subscriptions',
        },
        {
            title: t('subscription_details'),
            href: '#',
        },
    ];

    const getStatusBadge = (status: string) => {
        const variants: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
            active: 'default',
            expired: 'destructive',
            cancelled: 'outline',
            inactive: 'secondary',
        };
        return (
            <Badge variant={variants[status] || 'outline'} className={cn(isRTL ? '!text-right' : '!text-left')}>
                {t(status)}
            </Badge>
        );
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`${t('subscription_details')} - #${subscription.id}`} />

            <div className={cn("flex h-full flex-1 flex-col gap-6 overflow-x-auto rounded-xl bg-card dark:bg-card p-6 border border-border", isRTL ? '!text-right' : '!text-left')} dir={dir}>
                {/* Header */}
                <div className={cn("border-b pb-4 space-y-4", isRTL ? '!text-right' : '!text-left')}>
                    <div className={cn("flex items-center gap-4", flexDirection)}>
                        <Link href="/dashboard/clinics-subscriptions">
                            <Button variant="ghost" size="icon">
                                <ArrowLeft className={cn("h-4 w-4", isRTL && 'rotate-180')} />
                            </Button>
                        </Link>
                        <div className={cn(isRTL ? '!text-right' : '!text-left')}>
                            <h1 className={cn("text-3xl font-bold text-foreground", isRTL ? '!text-right' : '!text-left')}>{t('subscription_details')}</h1>
                            <p className={cn("text-muted-foreground mt-1", isRTL ? '!text-right' : '!text-left')}>#{subscription.id}</p>
                        </div>
                    </div>
                    <div className={cn("flex items-center gap-2", flexDirection)}>
                        {getStatusBadge(subscription.status)}
                        <Link href={`/dashboard/clinics-subscriptions/${subscription.id}/edit`}>
                            <Button className={cn("flex items-center gap-2", flexDirection)}>
                                <Edit className={cn("h-4 w-4", iconMargin('md'))} />
                                {t('edit')}
                            </Button>
                        </Link>
                    </div>
                </div>

                <div className={cn("grid gap-6 md:grid-cols-2", flexDirection)}>
                    {/* Clinic Information */}
                    <div className={cn("space-y-4", isRTL ? '!text-right' : '!text-left')}>
                        <h3 className={cn("text-lg font-semibold flex items-center gap-2", flexDirection)}>
                            <Building2 className={cn("h-5 w-5", iconMargin('md'))} />
                            {t('clinic_information')}
                        </h3>
                        <div className={cn("space-y-2", isRTL ? '!text-right' : '!text-left')}>
                            <div>
                                <p className={cn("text-sm text-muted-foreground", isRTL ? '!text-right' : '!text-left')}>{t('clinic')}</p>
                                <p className={cn("font-medium", isRTL ? '!text-right' : '!text-left')} dir={isRTL && subscription.clinic?.name_ar ? 'rtl' : 'ltr'}>
                                    {subscription.clinic 
                                        ? getLocalizedName(subscription.clinic.name_en, subscription.clinic.name_ar, locale)
                                        : t('n_a')
                                    }
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Subscription Package Information */}
                    <div className={cn("space-y-4", isRTL ? '!text-right' : '!text-left')}>
                        <h3 className={cn("text-lg font-semibold flex items-center gap-2", flexDirection)}>
                            <Package className={cn("h-5 w-5", iconMargin('md'))} />
                            {t('subscription_package')}
                        </h3>
                        <div className={cn("space-y-2", isRTL ? '!text-right' : '!text-left')}>
                            <div>
                                <p className={cn("text-sm text-muted-foreground", isRTL ? '!text-right' : '!text-left')}>{t('package')}</p>
                                <p className={cn("font-medium", isRTL ? '!text-right' : '!text-left')} dir={isRTL && subscription.subscriptionPackage?.name_ar ? 'rtl' : 'ltr'}>
                                    {subscription.subscriptionPackage 
                                        ? getLocalizedName(subscription.subscriptionPackage.name_en, subscription.subscriptionPackage.name_ar, locale)
                                        : t('n_a')
                                    }
                                </p>
                            </div>
                        </div>
                    </div>
                    {/* Subscription Details */}
                    <div className={cn("space-y-4", isRTL ? '!text-right' : '!text-left')}>
                        <h3 className={cn("text-lg font-semibold flex items-center gap-2", flexDirection)}>
                            <Calendar className={cn("h-5 w-5", iconMargin('md'))} />
                            {t('subscription_details')}
                        </h3>
                        <div className={cn("space-y-2", isRTL ? '!text-right' : '!text-left')}>
                            <div>
                                <p className={cn("text-sm text-muted-foreground", isRTL ? '!text-right' : '!text-left')}>{t('status')}</p>
                                <div className={cn("mt-1", isRTL ? '!text-right' : '!text-left')}>{getStatusBadge(subscription.status)}</div>
                            </div>
                            <div>
                                <p className={cn("text-sm text-muted-foreground", isRTL ? '!text-right' : '!text-left')}>{t('start_date')}</p>
                                <p className={cn("font-medium", isRTL ? '!text-right' : '!text-left')}>{formatHumanDate(subscription.start_date)}</p>
                            </div>
                            {subscription.end_date && (
                                <div>
                                    <p className={cn("text-sm text-muted-foreground", isRTL ? '!text-right' : '!text-left')}>{t('end_date')}</p>
                                    <p className={cn("font-medium", isRTL ? '!text-right' : '!text-left')}>{formatHumanDate(subscription.end_date)}</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Payment Information */}
                    {subscription.amount_paid && (
                        <div className={cn("space-y-4", isRTL ? '!text-right' : '!text-left')}>
                            <h3 className={cn("text-lg font-semibold flex items-center gap-2", flexDirection)}>
                                <DollarSign className={cn("h-5 w-5", iconMargin('md'))} />
                                {t('payment_information')}
                            </h3>
                            <div className={cn("space-y-2", isRTL ? '!text-right' : '!text-left')}>
                                <div>
                                    <p className={cn("text-sm text-muted-foreground", isRTL ? '!text-right' : '!text-left')}>{t('amount_paid')}</p>
                                    <p className={cn("font-medium text-lg", isRTL ? '!text-right' : '!text-left')}>{subscription.amount_paid} {subscription.currency || 'KWD'}</p>
                                </div>
                                {subscription.transaction && (
                                    <div>
                                        <p className={cn("text-sm text-muted-foreground", isRTL ? '!text-right' : '!text-left')}>{t('transaction_id')}</p>
                                        <p className={cn("font-medium", isRTL ? '!text-right' : '!text-left')}>{subscription.transaction.transaction_id}</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Dates */}
                    <div className={cn("space-y-4", isRTL ? '!text-right' : '!text-left')}>
                        <h3 className={cn("text-lg font-semibold", isRTL ? '!text-right' : '!text-left')}>{t('dates')}</h3>
                        <div className={cn("space-y-2", isRTL ? '!text-right' : '!text-left')}>
                            <div>
                                <p className={cn("text-sm text-muted-foreground", isRTL ? '!text-right' : '!text-left')}>{t('created_at')}</p>
                                <p className={cn("font-medium", isRTL ? '!text-right' : '!text-left')}>{formatHumanDate(subscription.created_at)}</p>
                            </div>
                            <div>
                                <p className={cn("text-sm text-muted-foreground", isRTL ? '!text-right' : '!text-left')}>{t('updated_at')}</p>
                                <p className={cn("font-medium", isRTL ? '!text-right' : '!text-left')}>{formatHumanDate(subscription.updated_at)}</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}

