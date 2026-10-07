import { type BreadcrumbItem } from '@/types';
import { Badge } from '@/components/ui/badge';
import { ViewLayout, ViewDetailsSection, ViewField, ViewFieldWithIcon } from '@/components/view';
import { useRTLInit } from '@/hooks/use-rtl-init';
import { useTranslation } from '@/hooks/use-translation';
import { index as dashboard } from '@/routes/dashboard';
import { Calendar, Clock, Star, Tag } from 'lucide-react';

interface DiscountCoupon {
    id: number;
    code: string;
    title_en?: string;
    title_ar?: string;
    description_en?: string;
    description_ar?: string;
    coupon_type: string;
    discount_type: string;
    discount_value: string;
    min_order_amount?: string;
    max_discount_amount?: string;
    usage_limit?: number;
    usage_limit_per_user?: number;
    used_count?: number;
    status: 'active' | 'inactive';
    is_featured: boolean;
    valid_from?: string;
    valid_until?: string;
    created_at: string;
    updated_at: string;
}

interface ShowDiscountCouponProps {
    coupon: DiscountCoupon;
}

export default function ShowDiscountCoupon({ coupon }: ShowDiscountCouponProps) {
    useRTLInit();
    const { t, locale } = useTranslation();
    
    const breadcrumbs: BreadcrumbItem[] = [
        {
            title: t('dashboard'),
            href: dashboard.url(),
        },
        {
            title: t('discount_coupons_management'),
            href: '/dashboard/discount-coupons',
        },
        {
            title: t('view_discount_coupon'),
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
            title={t('discount_coupon_details')}
            description={t('view_discount_coupon_information')}
            status={{
                value: coupon.status,
                variant: coupon.status === 'active' ? 'default' : 'secondary',
                className: coupon.status === 'active' 
                    ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300' 
                    : 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300',
            }}
            editUrl={`/dashboard/discount-coupons/${coupon.id}/edit`}
            backUrl="/dashboard/discount-coupons"
            editLabel={t('edit_discount_coupon')}
            headTitle={`${t('discount_coupon_details')} - ${coupon.code}`}
        >
            <ViewDetailsSection title={t('basic_information')} icon={Tag}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <ViewField
                        label={t('coupon_code')}
                        value={coupon.code}
                        dir="ltr"
                        valueClassName="font-mono"
                    />
                    <ViewField
                        label={t('coupon_type')}
                        value={<Badge variant="outline">{t(coupon.coupon_type)}</Badge>}
                    />
                    {coupon.title_en && (
                        <ViewField
                            label={t('title_en')}
                            value={coupon.title_en}
                            dir="ltr"
                        />
                    )}
                    {coupon.title_ar && (
                        <ViewField
                            label={t('title_ar')}
                            value={coupon.title_ar}
                            dir="rtl"
                        />
                    )}
                    <ViewField
                        label={t('discount')}
                        value={coupon.discount_type === 'percentage' 
                            ? `${coupon.discount_value}%` 
                            : `${coupon.discount_value}`}
                        dir="ltr"
                    />
                    {coupon.is_featured && (
                        <ViewField
                            label={t('features')}
                            value={
                                <Badge variant="outline" className="flex items-center gap-1 w-fit">
                                    <Star className="h-3 w-3 text-yellow-500 fill-yellow-500" />
                                    {t('featured')}
                                </Badge>
                            }
                        />
                    )}
                    {coupon.usage_limit && (
                        <ViewField
                            label={t('usage')}
                            value={`${coupon.used_count || 0} / ${coupon.usage_limit}`}
                            dir="ltr"
                        />
                    )}
                    {coupon.valid_from && (
                        <ViewFieldWithIcon
                            label={t('valid_from')}
                            value={formatDate(coupon.valid_from)}
                            icon={Calendar}
                        />
                    )}
                    {coupon.valid_until && (
                        <ViewFieldWithIcon
                            label={t('valid_until')}
                            value={formatDate(coupon.valid_until)}
                            icon={Calendar}
                        />
                    )}
                    <ViewFieldWithIcon
                        label={t('created_at')}
                        value={formatDate(coupon.created_at)}
                        icon={Clock}
                    />
                </div>

                {coupon.description_en && (
                    <ViewField
                        label={t('description_en')}
                        value={coupon.description_en}
                        spanCols={2}
                        dir="ltr"
                        valueClassName="text-base"
                    />
                )}

                {coupon.description_ar && (
                    <ViewField
                        label={t('description_ar')}
                        value={coupon.description_ar}
                        spanCols={2}
                        dir="rtl"
                        valueClassName="text-base"
                    />
                )}
            </ViewDetailsSection>
        </ViewLayout>
    );
}

