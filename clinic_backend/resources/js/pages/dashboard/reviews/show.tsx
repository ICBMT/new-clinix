import { type BreadcrumbItem } from '@/types';
import { Badge } from '@/components/ui/badge';
import { ViewLayoutWithTabs, ViewDetailsSection, ViewField, ViewFieldWithIcon } from '@/components/view';
import { UserCard } from '@/components/user-card';
import { useRTLInit } from '@/hooks/use-rtl-init';
import { useTranslation } from '@/hooks/use-translation';
import { useRTL } from '@/hooks/use-rtl';
import { index as dashboard } from '@/routes/dashboard';
import { Link, usePage } from '@inertiajs/react';
import { type SharedData } from '@/types';
import { Star, Calendar, User, Package, MessageSquare } from 'lucide-react';
import { cn } from '@/lib/utils';
import { getLocalizedName } from '@/utils/localization';

interface ShowReviewProps {
    review: {
        id: number;
        rating: number;
        comment: string;
        status: 'pending' | 'approved' | 'rejected';
        rejection_reason?: string | null;
        vendor_response?: string | null;
        vendor_response_at?: string | null;
        created_at: string;
        updated_at: string;
        user?: {
            id: number;
            name: string;
            email: string;
        } | null;
        treatment?: {
            id: number;
            name_en: string;
            name_ar: string;
        } | null;
        booking?: {
            id: number;
            booking_reference: string;
            booking_date: string;
        } | null;
    };
}

export default function ShowReview({ review }: ShowReviewProps) {
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
            title: t('reviews_management'),
            href: '/dashboard/reviews',
        },
        {
            title: t('view_review'),
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

    const getStatusBadgeVariant = (status: string): 'default' | 'secondary' | 'destructive' => {
        const variants: Record<string, 'default' | 'secondary' | 'destructive'> = {
            approved: 'default',
            pending: 'secondary',
            rejected: 'destructive',
        };
        return variants[status] || 'secondary';
    };

    const tabs = [
        {
            value: 'details',
            label: t('details'),
            content: (
                <ViewDetailsSection title={t('review_details')} icon={MessageSquare}>
                    <div className={cn("grid grid-cols-1 md:grid-cols-2 gap-6", isRTL ? '!text-right' : '!text-left')} dir={dir}>
                        <ViewFieldWithIcon
                            label={t('rating')}
                            value={
                                <div className={cn("flex items-center gap-2", flexDirection)} dir={dir}>
                                    <div className={cn("flex", flexDirection)} dir={dir}>
                                        {Array.from({ length: 5 }).map((_, i) => (
                                            <Star
                                                key={i}
                                                className={cn(
                                                    "h-5 w-5",
                                                    i < review.rating 
                                                        ? 'text-yellow-500 fill-yellow-500' 
                                                        : 'text-gray-300 dark:text-gray-600',
                                                    iconMargin('sm')
                                                )}
                                            />
                                        ))}
                                    </div>
                                    <span className={cn("text-lg font-medium", isRTL ? '!text-right' : '!text-left')} dir="ltr">({review.rating}/5)</span>
                                </div>
                            }
                            icon={Star}
                        />
                        <ViewField
                            label={t('status')}
                            value={
                                <Badge 
                                    variant={getStatusBadgeVariant(review.status)}
                                    className={cn(isRTL ? '!text-right' : '!text-left')}
                                    dir={dir}
                                >
                                    {t(review.status)}
                                </Badge>
                            }
                        />
                        <ViewFieldWithIcon
                            label={t('created_at')}
                            value={formatDate(review.created_at)}
                            icon={Calendar}
                        />
                        <ViewFieldWithIcon
                            label={t('updated_at')}
                            value={formatDate(review.updated_at)}
                            icon={Calendar}
                        />
                    </div>

                    <div className={cn("space-y-2 pt-4 border-t", isRTL ? '!text-right' : '!text-left')} dir={dir}>
                        <p className={cn("text-sm text-muted-foreground", isRTL ? '!text-right' : '!text-left')} dir={dir}>{t('comment')}</p>
                        <div className={cn("bg-muted/50 dark:bg-muted/30 rounded-lg p-4 border", isRTL ? '!text-right' : '!text-left')} dir={dir}>
                            <p className={cn("text-base text-foreground whitespace-pre-wrap", isRTL ? '!text-right' : '!text-left')} dir={dir}>
                                {review.comment || t('no_comment')}
                            </p>
                        </div>
                    </div>

                    {review.rejection_reason && (
                        <div className={cn("space-y-2 pt-4 border-t", isRTL ? '!text-right' : '!text-left')} dir={dir}>
                            <p className={cn("text-sm text-muted-foreground text-red-600 dark:text-red-400", isRTL ? '!text-right' : '!text-left')} dir={dir}>{t('rejection_reason')}</p>
                            <div className={cn("bg-red-50 dark:bg-red-900/20 rounded-lg p-4 border border-red-200 dark:border-red-800", isRTL ? '!text-right' : '!text-left')} dir={dir}>
                                <p className={cn("text-base text-foreground", isRTL ? '!text-right' : '!text-left')} dir={dir}>{review.rejection_reason}</p>
                            </div>
                        </div>
                    )}

                    {review.vendor_response && (
                        <div className={cn("space-y-2 pt-4 border-t", isRTL ? '!text-right' : '!text-left')} dir={dir}>
                            <p className={cn("text-sm text-muted-foreground", isRTL ? '!text-right' : '!text-left')} dir={dir}>{t('vendor_response')}</p>
                            <div className={cn("bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 border border-blue-200 dark:border-blue-800", isRTL ? '!text-right' : '!text-left')} dir={dir}>
                                <p className={cn("text-base text-foreground whitespace-pre-wrap", isRTL ? '!text-right' : '!text-left')} dir={dir}>{review.vendor_response}</p>
                                {review.vendor_response_at && (
                                    <p className={cn("text-sm text-muted-foreground mt-2", isRTL ? '!text-right' : '!text-left')} dir={dir}>
                                        {t('responded_at')}: {formatDate(review.vendor_response_at)}
                                    </p>
                                )}
                            </div>
                        </div>
                    )}
                </ViewDetailsSection>
            ),
        },
        {
            value: 'related',
            label: t('related_information'),
            content: (
                <ViewDetailsSection title={t('related_information')} icon={Package}>
                    <div className={cn("grid grid-cols-1 md:grid-cols-2 gap-6", isRTL ? '!text-right' : '!text-left')} dir={dir}>
                        {review.user && (
                            <ViewFieldWithIcon
                                label={t('user')}
                                value={
                                    <Link
                                        href={`/dashboard/users/${review.user.id}`}
                                        className={cn("block", isRTL ? '!text-right' : '!text-left')}
                                        dir={dir}
                                    >
                                        <UserCard user={review.user} variant="card" showVerificationBadges={false} />
                                    </Link>
                                }
                                icon={User}
                            />
                        )}
                        {review.treatment && (
                            <ViewFieldWithIcon
                                label={t('treatment')}
                                value={
                                    <div className={cn("bg-muted/50 dark:bg-muted/30 rounded-lg p-4 border", isRTL ? '!text-right' : '!text-left')} dir={dir}>
                                        <p className={cn("font-medium", isRTL ? '!text-right' : '!text-left')} dir={dir}>
                                            {getLocalizedName(review.treatment.name_en, review.treatment.name_ar, locale)}
                                        </p>
                                        {locale === 'en' && review.treatment.name_ar && (
                                            <p className={cn("text-sm text-muted-foreground mt-1", isRTL ? '!text-right' : '!text-left')} dir="rtl">{review.treatment.name_ar}</p>
                                        )}
                                        {locale === 'ar' && review.treatment.name_en && (
                                            <p className={cn("text-sm text-muted-foreground mt-1", isRTL ? '!text-right' : '!text-left')} dir="ltr">{review.treatment.name_en}</p>
                                        )}
                                    </div>
                                }
                                icon={Package}
                            />
                        )}
                        {review.booking && (
                            <ViewFieldWithIcon
                                label={t('booking')}
                                value={
                                    <div className={cn("bg-muted/50 dark:bg-muted/30 rounded-lg p-4 border", isRTL ? '!text-right' : '!text-left')} dir={dir}>
                                        <Link 
                                            href={`/dashboard/bookings/${review.booking.id}`}
                                            className={cn("font-medium font-mono text-primary hover:underline block", isRTL ? '!text-right' : '!text-left')}
                                            dir="ltr"
                                        >
                                            {review.booking.booking_reference}
                                        </Link>
                                        {review.booking.booking_date && (
                                            <p className={cn("text-sm text-muted-foreground mt-1", isRTL ? '!text-right' : '!text-left')} dir={dir}>
                                                {formatDate(review.booking.booking_date)}
                                            </p>
                                        )}
                                    </div>
                                }
                                icon={Calendar}
                            />
                        )}
                    </div>
                </ViewDetailsSection>
            ),
        },
    ];

    return (
        <ViewLayoutWithTabs
            breadcrumbs={breadcrumbs}
            title={t('review_details')}
            description={t('view_review_information_and_details')}
            status={{
                value: review.status,
                variant: getStatusBadgeVariant(review.status),
                className: review.status === 'approved' 
                    ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300' 
                    : review.status === 'rejected'
                    ? 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300'
                    : 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300',
            }}
            editUrl={`/dashboard/reviews/${review.id}/edit`}
            backUrl="/dashboard/reviews"
            editLabel={t('edit_review')}
            tabs={tabs}
            defaultTab="details"
            headTitle={`${t('review_details')} - #${review.id}`}
            syncUrlTab={true}
        />
    );
}

