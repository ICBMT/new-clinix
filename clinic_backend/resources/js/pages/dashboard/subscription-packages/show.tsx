import { type BreadcrumbItem } from '@/types';
import { Badge } from '@/components/ui/badge';
import { ViewLayoutWithTabs, ViewDetailsSection, ViewField, ViewFieldWithIcon } from '@/components/view';
import { useRTLInit } from '@/hooks/use-rtl-init';
import { useTranslation } from '@/hooks/use-translation';
import { index as dashboard } from '@/routes/dashboard';
import { Calendar, Clock, Star, CheckCircle, Package } from 'lucide-react';
import { getLocalizedName } from '@/utils/localization';

interface ShowSubscriptionPackageProps {
    package: {
        id: number;
        name_en: string;
        name_ar?: string;
        description_en?: string;
        description_ar?: string;
        price: string;
        currency: string;
        billing_cycle: 'monthly' | 'quarterly' | 'yearly';
        duration_days: number;
        features?: string[];
        max_services?: number;
        max_bookings_per_month?: number;
        featured_listing: boolean;
        priority_support: boolean;
        analytics_access: boolean;
        custom_branding: boolean;
        status: 'active' | 'inactive';
        sort_order: number;
        created_at: string;
        updated_at: string;
    };
}

export default function ShowSubscriptionPackage({ package: pkg }: ShowSubscriptionPackageProps) {
    useRTLInit();
    const { t, locale } = useTranslation();
    
    const breadcrumbs: BreadcrumbItem[] = [
        {
            title: t('dashboard'),
            href: dashboard.url(),
        },
        {
            title: t('subscription_packages'),
            href: '/dashboard/subscription-packages',
        },
        {
            title: t('view_package') || t('package_details'),
            href: '#',
        },
    ];

    const formatDate = (date: string) => {
        return new Date(date).toLocaleDateString(locale === 'ar' ? 'ar-SA' : 'en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    const tabs = [
        {
            value: 'details',
            label: t('details'),
            content: (
                <ViewDetailsSection title={t('package_details')} icon={Package}>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <ViewField
                            label={t('price')}
                            value={
                                <div>
                                    <p className="text-3xl font-bold" dir="ltr">{pkg.price} {pkg.currency}</p>
                                    <p className="text-sm text-muted-foreground">{t(pkg.billing_cycle)}</p>
                                </div>
                            }
                            dir="ltr"
                        />
                        <ViewField
                            label={t('duration')}
                            value={
                                <p className="text-2xl font-bold" dir="ltr">{pkg.duration_days} {t('days')}</p>
                            }
                            dir="ltr"
                        />
                        <ViewField
                            label={t('status')}
                            value={
                                <Badge variant={pkg.status === 'active' ? 'default' : 'secondary'}>
                                    {t(pkg.status)}
                                </Badge>
                            }
                        />
                        <ViewField
                            label={t('sort_order')}
                            value={pkg.sort_order}
                            dir="ltr"
                            valueClassName="font-mono text-lg"
                        />
                        <ViewFieldWithIcon
                            label={t('created_at')}
                            value={formatDate(pkg.created_at)}
                            icon={Calendar}
                        />
                        <ViewFieldWithIcon
                            label={t('updated_at')}
                            value={formatDate(pkg.updated_at)}
                            icon={Clock}
                        />
                    </div>

                    {pkg.name_ar && (
                        <ViewField
                            label={t('name_ar')}
                            value={pkg.name_ar}
                            spanCols={2}
                            dir="rtl"
                            valueClassName="text-lg"
                        />
                    )}

                    {pkg.description_en && (
                        <ViewField
                            label={t('description_en')}
                            value={pkg.description_en}
                            spanCols={2}
                            dir="ltr"
                            valueClassName="text-base whitespace-pre-wrap"
                        />
                    )}

                    {pkg.description_ar && (
                        <ViewField
                            label={t('description_ar')}
                            value={pkg.description_ar}
                            spanCols={2}
                            dir="rtl"
                            valueClassName="text-base whitespace-pre-wrap"
                        />
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t">
                        {pkg.max_services !== undefined && (
                            <ViewField
                                label={t('max_services')}
                                value={<p className="text-xl font-bold" dir="ltr">{pkg.max_services}</p>}
                                dir="ltr"
                            />
                        )}
                        {pkg.max_bookings_per_month !== undefined && (
                            <ViewField
                                label={t('max_bookings_per_month')}
                                value={<p className="text-xl font-bold" dir="ltr">{pkg.max_bookings_per_month}</p>}
                                dir="ltr"
                            />
                        )}
                    </div>
                </ViewDetailsSection>
            ),
        },
        {
            value: 'features',
            label: t('features'),
            content: (
                <ViewDetailsSection title={t('features')} icon={CheckCircle}>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="flex items-center gap-3 p-4 bg-muted/50 dark:bg-muted/30 rounded-lg border">
                            <CheckCircle className={`h-5 w-5 ${pkg.featured_listing ? 'text-green-600' : 'text-gray-400'}`} />
                            <div>
                                <p className="font-medium">{t('featured_listing')}</p>
                                <p className="text-sm text-muted-foreground">{pkg.featured_listing ? t('enabled') : t('disabled')}</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3 p-4 bg-muted/50 dark:bg-muted/30 rounded-lg border">
                            <CheckCircle className={`h-5 w-5 ${pkg.priority_support ? 'text-green-600' : 'text-gray-400'}`} />
                            <div>
                                <p className="font-medium">{t('priority_support')}</p>
                                <p className="text-sm text-muted-foreground">{pkg.priority_support ? t('enabled') : t('disabled')}</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3 p-4 bg-muted/50 dark:bg-muted/30 rounded-lg border">
                            <CheckCircle className={`h-5 w-5 ${pkg.analytics_access ? 'text-green-600' : 'text-gray-400'}`} />
                            <div>
                                <p className="font-medium">{t('analytics_access')}</p>
                                <p className="text-sm text-muted-foreground">{pkg.analytics_access ? t('enabled') : t('disabled')}</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3 p-4 bg-muted/50 dark:bg-muted/30 rounded-lg border">
                            <CheckCircle className={`h-5 w-5 ${pkg.custom_branding ? 'text-green-600' : 'text-gray-400'}`} />
                            <div>
                                <p className="font-medium">{t('custom_branding')}</p>
                                <p className="text-sm text-muted-foreground">{pkg.custom_branding ? t('enabled') : t('disabled')}</p>
                            </div>
                        </div>
                    </div>

                    {pkg.features && pkg.features.length > 0 && (
                        <div className="space-y-2 pt-4 border-t">
                            <p className="text-sm text-muted-foreground">{t('additional_features')}</p>
                            <div className="flex flex-wrap gap-2">
                                {pkg.features.map((feature, index) => (
                                    <Badge key={index} variant="outline">{t(feature) || feature}</Badge>
                                ))}
                            </div>
                        </div>
                    )}
                </ViewDetailsSection>
            ),
        },
    ];

    return (
        <ViewLayoutWithTabs
            breadcrumbs={breadcrumbs}
            title={getLocalizedName(pkg.name_en, pkg.name_ar, locale)}
            description={t('view_subscription_package_details')}
            status={{
                value: pkg.status,
                variant: pkg.status === 'active' ? 'default' : 'secondary',
                className: pkg.status === 'active'
                    ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300'
                    : 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300',
            }}
            editUrl={`/dashboard/subscription-packages/${pkg.id}/edit`}
            backUrl="/dashboard/subscription-packages"
            editLabel={t('edit_package')}
            tabs={tabs}
            defaultTab="details"
            headTitle={`${t('package_details')} - ${pkg.name_en}`}
            syncUrlTab={true}
        />
    );
}

