import { type BreadcrumbItem } from '@/types';
import { Badge } from '@/components/ui/badge';
import { ViewLayout, ViewDetailsSection, ViewField, ViewFieldWithIcon } from '@/components/view';
import { useRTLInit } from '@/hooks/use-rtl-init';
import { useTranslation } from '@/hooks/use-translation';
import { getLocalizedName } from '@/utils/localization';
import { index as dashboard } from '@/routes/dashboard';
import { Calendar, Clock, Star, Zap, Package } from 'lucide-react';

interface Service {
    id: number;
    name_en: string;
    name_ar: string;
    description_en?: string;
    description_ar?: string;
    vendor?: { id: number; name: string };
    category?: { id: number; name_en: string; name_ar: string };
    base_price: string;
    discount_type?: string;
    discount_value?: string;
    final_price?: string;
    has_discount?: boolean;
    status: 'pending' | 'approved' | 'rejected';
    is_featured: boolean;
    is_fast_booking: boolean;
    auto_confirm?: boolean;
    rejection_reason?: string;
    created_at: string;
    updated_at: string;
}

interface ShowServiceProps {
    service: Service;
}

export default function ShowService({ service }: ShowServiceProps) {
    useRTLInit();
    const { t, locale } = useTranslation();
    
    const breadcrumbs: BreadcrumbItem[] = [
        {
            title: t('dashboard'),
            href: dashboard.url(),
        },
        {
            title: t('services_management'),
            href: '/dashboard/services',
        },
        {
            title: t('view_service'),
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

    return (
        <ViewLayout
            breadcrumbs={breadcrumbs}
            title={t('service_details')}
            description={t('view_service_information')}
            status={{
                value: service.status,
                variant: service.status === 'approved' ? 'default' : service.status === 'rejected' ? 'destructive' : 'secondary',
                className: service.status === 'approved' 
                    ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300' 
                    : service.status === 'rejected'
                    ? 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300'
                    : 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300',
            }}
            editUrl={`/dashboard/services/${service.id}/edit`}
            backUrl="/dashboard/services"
            editLabel={t('edit_service')}
            headTitle={`${t('service_details')} - ${service.name_en}`}
        >
            <ViewDetailsSection title={t('basic_information')} icon={Package}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <ViewField
                        label={t('name_en')}
                        value={service.name_en}
                        dir="ltr"
                    />
                    <ViewField
                        label={t('name_ar')}
                        value={service.name_ar}
                        dir="rtl"
                    />
                    {service.vendor && (
                        <ViewField
                            label={t('vendor')}
                            value={service.vendor.name}
                        />
                    )}
                    {service.category && (
                        <ViewField
                            label={t('category')}
                            value={getLocalizedName(service.category.name_en, service.category.name_ar, locale)}
                        />
                    )}
                    <ViewField
                        label={t('base_price')}
                        value={service.base_price}
                        dir="ltr"
                    />
                    <ViewField
                        label={t('features')}
                        value={
                            <div className="flex flex-wrap gap-2">
                                {service.is_featured && (
                                    <Badge variant="outline" className="flex items-center gap-1">
                                        <Star className="h-3 w-3 text-yellow-500 fill-yellow-500" />
                                        {t('featured')}
                                    </Badge>
                                )}
                                {service.is_fast_booking && (
                                    <Badge variant="outline" className="flex items-center gap-1">
                                        <Zap className="h-3 w-3 text-purple-500 dark:text-purple-400" />
                                        {t('fast_booking')}
                                    </Badge>
                                )}
                                {service.auto_confirm && (
                                    <Badge variant="outline">
                                        {t('auto_confirm')}
                                    </Badge>
                                )}
                            </div>
                        }
                    />
                    <ViewFieldWithIcon
                        label={t('created_at')}
                        value={formatDate(service.created_at)}
                        icon={Calendar}
                    />
                    <ViewFieldWithIcon
                        label={t('updated_at')}
                        value={formatDate(service.updated_at)}
                        icon={Clock}
                    />
                </div>

                {service.description_en && (
                    <ViewField
                        label={t('description_en')}
                        value={service.description_en}
                        spanCols={2}
                        dir="ltr"
                        valueClassName="text-base"
                    />
                )}

                {service.description_ar && (
                    <ViewField
                        label={t('description_ar')}
                        value={service.description_ar}
                        spanCols={2}
                        dir="rtl"
                        valueClassName="text-base"
                    />
                )}

                {service.rejection_reason && (
                    <div className="space-y-2 pt-4 border-t">
                        <p className="text-sm text-muted-foreground">{t('rejection_reason')}</p>
                        <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-4 border border-red-200 dark:border-red-800">
                            <p className="text-base text-red-600 dark:text-red-400">{service.rejection_reason}</p>
                        </div>
                    </div>
                )}
            </ViewDetailsSection>
        </ViewLayout>
    );
}

