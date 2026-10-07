import { type BreadcrumbItem } from '@/types';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useRTLInit } from '@/hooks/use-rtl-init';
import { useTranslation } from '@/hooks/use-translation';
import { useRTL } from '@/hooks/use-rtl';
import AppLayout from '@/layouts/app-layout';
import { index as dashboard } from '@/routes/dashboard';
import { Head, Link } from '@inertiajs/react';
import { ArrowLeft, Edit, Calendar, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';

interface UserLoyaltyCoupon {
    id: number;
    user_id: number;
    user?: { id: number; name: string; email: string };
    code: string;
    title_en?: string;
    title_ar?: string;
    description_en?: string;
    description_ar?: string;
    discount_type: string;
    discount_value: string;
    usage_limit?: number;
    used_count?: number;
    status: 'active' | 'inactive' | 'used' | 'expired';
    valid_from?: string;
    valid_until?: string;
    created_at: string;
    updated_at: string;
}

interface ShowUserLoyaltyCouponProps {
    coupon: UserLoyaltyCoupon;
}

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'dashboard',
        href: dashboard.url(),
    },
    {
        title: 'User Loyalty Coupons Management',
        href: '/dashboard/user-loyalty-coupons',
    },
    {
        title: 'View User Loyalty Coupon',
        href: '#',
    },
];

export default function ShowUserLoyaltyCoupon({ coupon }: ShowUserLoyaltyCouponProps) {
    useRTLInit();
    const { t, locale } = useTranslation();
    const { isRTL, dir, textAlign, flexDirection, iconMargin } = useRTL();

    const formatDate = (date: string) => {
        return new Date(date).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`${t('user_loyalty_coupon_details')} - ${coupon.code}`} />

            <div className={cn("flex h-full flex-1 flex-col gap-6 overflow-x-auto rounded-xl bg-card dark:bg-card p-6 border border-border", textAlign)} dir={dir}>
                <div className={cn("border-b pb-4 space-y-4", textAlign)}>
                    {/* Back button */}
                    <div className={cn("flex", isRTL ? 'justify-end' : 'justify-start')}>
                        <Link href="/dashboard/user-loyalty-coupons">
                            <Button variant="outline" className={cn("flex items-center gap-2", flexDirection)}>
                                <ArrowLeft className={cn("h-4 w-4", isRTL && 'rotate-180', iconMargin('md'))} />
                                {t('back')}
                            </Button>
                        </Link>
                    </div>
                    
                    {/* Title */}
                    <div className={cn("flex items-center justify-between", flexDirection)}>
                        <div className={textAlign}>
                            <h1 className={cn("text-3xl font-bold text-foreground", textAlign)}>{t('user_loyalty_coupon_details')}</h1>
                            <p className={cn("text-muted-foreground mt-1", textAlign)}>{t('view_user_loyalty_coupon_information')}</p>
                        </div>
                        <div className={cn("flex items-center gap-3", flexDirection)}>
                            <Link href={`/dashboard/user-loyalty-coupons/${coupon.id}/edit`}>
                                <Button className={cn("flex items-center gap-2", flexDirection)}>
                                    <Edit className={cn("h-4 w-4", iconMargin('md'))} />
                                    {t('edit_user_loyalty_coupon')}
                                </Button>
                            </Link>
                        </div>
                    </div>
                </div>

                <div className={cn("space-y-4", textAlign)}>
                    <h3 className={cn("text-lg font-semibold text-foreground", textAlign)} dir={dir}>{t('basic_information')}</h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className={cn("space-y-2", textAlign)}>
                            <p className={cn("text-sm text-muted-foreground", textAlign)} dir={dir}>{t('coupon_code')}</p>
                            <p className={cn("text-base font-medium text-foreground font-mono", textAlign)} dir="ltr">{coupon.code}</p>
                        </div>

                        {coupon.user && (
                            <div className={cn("space-y-2", textAlign)}>
                                <p className={cn("text-sm text-muted-foreground", textAlign)} dir={dir}>{t('user')}</p>
                                <div className={textAlign}>
                                    <p className={cn("text-base font-medium text-foreground", textAlign)} dir={dir}>{coupon.user.name}</p>
                                    <p className={cn("text-sm text-muted-foreground", textAlign)} dir="ltr">{coupon.user.email}</p>
                                </div>
                            </div>
                        )}

                        {coupon.title_en && (
                            <div className={cn("space-y-2", textAlign)}>
                                <p className={cn("text-sm text-muted-foreground", textAlign)} dir={dir}>{t('title_en')}</p>
                                <p className={cn("text-base font-medium text-foreground", textAlign)} dir={dir}>{coupon.title_en}</p>
                            </div>
                        )}

                        {coupon.title_ar && (
                            <div className={cn("space-y-2", textAlign)}>
                                <p className={cn("text-sm text-muted-foreground", textAlign)} dir={dir}>{t('title_ar')}</p>
                                <p className={cn("text-base font-medium text-foreground", textAlign)} dir={dir}>{coupon.title_ar}</p>
                            </div>
                        )}

                        <div className={cn("space-y-2", textAlign)}>
                            <p className={cn("text-sm text-muted-foreground", textAlign)} dir={dir}>{t('discount')}</p>
                            <p className={cn("text-base font-medium text-foreground", textAlign)} dir="ltr">
                                {coupon.discount_type === 'percentage' 
                                    ? `${coupon.discount_value}%` 
                                    : `${coupon.discount_value}`}
                            </p>
                        </div>

                        <div className={cn("space-y-2", textAlign)}>
                            <p className={cn("text-sm text-muted-foreground", textAlign)} dir={dir}>{t('status')}</p>
                            <Badge 
                                variant={
                                    coupon.status === 'active' ? 'default' : 
                                    coupon.status === 'used' ? 'secondary' : 'destructive'
                                }
                                className={cn(
                                    coupon.status === 'active' 
                                        ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300' 
                                        : coupon.status === 'used'
                                        ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-300'
                                        : 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300',
                                    textAlign
                                )}
                            >
                                {t(coupon.status)}
                            </Badge>
                        </div>

                        {coupon.usage_limit && (
                            <div className={cn("space-y-2", textAlign)}>
                                <p className={cn("text-sm text-muted-foreground", textAlign)} dir={dir}>{t('usage')}</p>
                                <p className={cn("text-base font-medium text-foreground", textAlign)} dir="ltr">
                                    {coupon.used_count || 0} / {coupon.usage_limit}
                                </p>
                            </div>
                        )}

                        {coupon.valid_from && (
                            <div className={cn("space-y-2", textAlign)}>
                                <p className={cn("text-sm text-muted-foreground", textAlign)} dir={dir}>{t('valid_from')}</p>
                                <div className={cn("flex items-center gap-2", flexDirection)}>
                                    <Calendar className={cn("h-4 w-4 text-gray-400", iconMargin('sm'))} />
                                    <p className={cn("text-base font-medium text-foreground", textAlign)} dir={dir}>{formatDate(coupon.valid_from)}</p>
                                </div>
                            </div>
                        )}

                        {coupon.valid_until && (
                            <div className={cn("space-y-2", textAlign)}>
                                <p className={cn("text-sm text-muted-foreground", textAlign)} dir={dir}>{t('valid_until')}</p>
                                <div className={cn("flex items-center gap-2", flexDirection)}>
                                    <Calendar className={cn("h-4 w-4 text-gray-400", iconMargin('sm'))} />
                                    <p className={cn("text-base font-medium text-foreground", textAlign)} dir={dir}>{formatDate(coupon.valid_until)}</p>
                                </div>
                            </div>
                        )}

                        <div className={cn("space-y-2", textAlign)}>
                            <p className={cn("text-sm text-muted-foreground", textAlign)} dir={dir}>{t('created_at')}</p>
                            <div className={cn("flex items-center gap-2", flexDirection)}>
                                <Clock className={cn("h-4 w-4 text-gray-400", iconMargin('sm'))} />
                                <p className={cn("text-base font-medium text-foreground", textAlign)} dir={dir}>{formatDate(coupon.created_at)}</p>
                            </div>
                        </div>
                    </div>

                    {coupon.description_en && (
                        <div className={cn("space-y-2", textAlign)}>
                            <p className={cn("text-sm text-muted-foreground", textAlign)} dir={dir}>{t('description_en')}</p>
                            <p className={cn("text-base text-foreground", textAlign)} dir={dir}>{coupon.description_en}</p>
                        </div>
                    )}

                    {coupon.description_ar && (
                        <div className={cn("space-y-2", textAlign)}>
                            <p className={cn("text-sm text-muted-foreground", textAlign)} dir={dir}>{t('description_ar')}</p>
                            <p className={cn("text-base text-foreground", textAlign)} dir={dir}>{coupon.description_ar}</p>
                        </div>
                    )}
                </div>
            </div>
        </AppLayout>
    );
}

