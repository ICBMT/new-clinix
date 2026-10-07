import { type BreadcrumbItem } from '@/types';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ViewPageLayout, PageHeader } from '@/components/page-layouts';
import { useTranslation } from '@/hooks/use-translation';
import { useRTL } from '@/hooks/use-rtl';
import { useRTLInit } from '@/hooks/use-rtl-init';
import AppLayout from '@/layouts/app-layout';
import { index as dashboard } from '@/routes/dashboard';
import { Head, Link, usePage } from '@inertiajs/react';
import { ArrowLeft, Edit, Calendar, Clock, ExternalLink } from 'lucide-react';
import { type SharedData } from '@/types';

interface Banner {
    id: number;
    title_en: string;
    title_ar: string;
    description_en?: string;
    description_ar?: string;
    image_url?: string;
    mobile_image_url?: string;
    link_url?: string;
    type?: string;
    linkable_type?: string;
    linkable_id?: number;
    linkable?: {
        id: number;
        name_en?: string;
        name_ar?: string;
        title_en?: string;
        title_ar?: string;
    } | null;
    position?: string;
    sort_order: number;
    start_date?: string;
    end_date?: string;
    status: 'active' | 'inactive';
    click_count: number;
    view_count?: number;
    created_at: string;
    updated_at: string;
}

interface ShowBannerProps {
    banner: Banner;
}


export default function ShowBanner({ banner }: ShowBannerProps) {
    useRTLInit();
    const { t, locale } = useTranslation();
    const page = usePage<SharedData>();
    const { locale: pageLocale } = page.props;
    const isRTL = pageLocale === 'ar';
    const dir = isRTL ? 'rtl' : 'ltr';
    const { flexDirection, iconMargin } = useRTL();
    
    if (!banner) {
        return (
            <AppLayout breadcrumbs={[]}>
                <Head title={t('banner_not_found')} />
                <ViewPageLayout>
                    <p className={cn(isRTL ? '!text-right' : '!text-left')}>{t('banner_not_found')}</p>
                </ViewPageLayout>
            </AppLayout>
        );
    }
    
    const breadcrumbs: BreadcrumbItem[] = [
        {
            title: t('dashboard'),
            href: dashboard.url(),
        },
        {
            title: t('banners_management'),
            href: '/dashboard/banners',
        },
        {
            title: t('view_banner'),
            href: `/dashboard/banners/${banner.id}`,
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
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`${t('banner_details')} - ${banner.title_en}`} />

            <ViewPageLayout>
                <PageHeader
                    title={t('banner_details')}
                    description={t('view_banner_information')}
                    actions={
                        <div className={cn("flex items-center gap-3", flexDirection)}>
                            <Link href={`/dashboard/banners/${banner.id}/edit`}>
                                <Button className={cn("flex items-center gap-2", flexDirection)}>
                                    <Edit className={cn("h-4 w-4", iconMargin('md'))} />
                                    {t('edit_banner')}
                                </Button>
                            </Link>
                            <Link href="/dashboard/banners">
                                <Button variant="outline" className={cn("flex items-center gap-2", flexDirection)}>
                                    <ArrowLeft className={cn("h-4 w-4", isRTL && 'rotate-180', iconMargin('md'))} />
                                    {t('back')}
                                </Button>
                            </Link>
                        </div>
                    }
                />

                <div className={cn("space-y-4", isRTL ? '!text-right' : '!text-left')} dir={dir}>
                    <h3 className={cn("text-lg font-semibold text-foreground", isRTL ? '!text-right' : '!text-left')}>{t('basic_information')}</h3>
                    
                    {(banner.image_url || banner.mobile_image_url) && (
                        <div className={cn("space-y-2", isRTL ? '!text-right' : '!text-left')}>
                            <p className={cn("text-sm text-muted-foreground", isRTL ? '!text-right' : '!text-left')}>{t('images')}</p>
                            <div className={cn("flex gap-4", flexDirection)}>
                                {banner.image_url && (
                                    <div>
                                        <p className={cn("text-xs text-muted-foreground mb-1", isRTL ? '!text-right' : '!text-left')}>{t('desktop_image')}</p>
                                        <img 
                                            src={banner.image_url || ''} 
                                            alt={banner.title_en} 
                                            className="w-48 h-32 object-cover rounded"
                                            onError={(e) => {
                                                const target = e.target as HTMLImageElement;
                                                target.style.display = 'none';
                                            }}
                                        />
                                    </div>
                                )}
                                {banner.mobile_image_url && (
                                    <div>
                                        <p className={cn("text-xs text-muted-foreground mb-1", isRTL ? '!text-right' : '!text-left')}>{t('mobile_image')}</p>
                                        <img 
                                            src={banner.mobile_image_url || ''} 
                                            alt={banner.title_en} 
                                            className="w-32 h-48 object-cover rounded"
                                            onError={(e) => {
                                                const target = e.target as HTMLImageElement;
                                                target.style.display = 'none';
                                            }}
                                        />
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className={cn("space-y-2", isRTL ? '!text-right' : '!text-left')}>
                            <p className={cn("text-sm text-muted-foreground", isRTL ? '!text-right' : '!text-left')}>{t('title_en')}</p>
                            <p className={cn("text-base font-medium text-foreground", isRTL ? '!text-right' : '!text-left')}>{banner.title_en}</p>
                        </div>

                        <div className={cn("space-y-2", isRTL ? '!text-right' : '!text-left')}>
                            <p className={cn("text-sm text-muted-foreground", isRTL ? '!text-right' : '!text-left')}>{t('title_ar')}</p>
                            <p className={cn("text-base font-medium text-foreground", isRTL ? '!text-right' : '!text-left')}>{banner.title_ar}</p>
                        </div>

                        {banner.linkable && banner.linkable_type && (
                            <div className={cn("space-y-2", isRTL ? '!text-right' : '!text-left')}>
                                <p className={cn("text-sm text-muted-foreground", isRTL ? '!text-right' : '!text-left')}>
                                    {banner.linkable_type === 'App\\Models\\Category' || banner.linkable_type === 'category' 
                                        ? t('category') 
                                        : t('service')}
                                </p>
                                <p className={cn("text-base font-medium text-foreground", isRTL ? '!text-right' : '!text-left')}>
                                    {isRTL 
                                        ? (banner.linkable?.name_ar || banner.linkable?.title_ar || '')
                                        : (banner.linkable?.name_en || banner.linkable?.title_en || '')}
                                </p>
                            </div>
                        )}

                        <div className={cn("space-y-2", isRTL ? '!text-right' : '!text-left')}>
                            <p className={cn("text-sm text-muted-foreground", isRTL ? '!text-right' : '!text-left')}>{t('status')}</p>
                            <Badge 
                                variant={banner.status === 'active' ? 'default' : 'secondary'}
                                className={cn(
                                    banner.status === 'active' 
                                        ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300' 
                                        : 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300',
                                    isRTL ? '!text-right' : '!text-left'
                                )}
                            >
                                {t(banner.status)}
                            </Badge>
                        </div>

                        <div className={cn("space-y-2", isRTL ? '!text-right' : '!text-left')}>
                            <p className={cn("text-sm text-muted-foreground", isRTL ? '!text-right' : '!text-left')}>{t('sort_order')}</p>
                            <p className={cn("text-base font-medium text-foreground", isRTL ? '!text-right' : '!text-left')}>{banner.sort_order}</p>
                        </div>

                        {banner.start_date && (
                            <div className={cn("space-y-2", isRTL ? '!text-right' : '!text-left')}>
                                <p className={cn("text-sm text-muted-foreground", isRTL ? '!text-right' : '!text-left')}>{t('start_date')}</p>
                                <div className={cn("flex items-center gap-2", flexDirection)}>
                                    <Calendar className="h-4 w-4 text-gray-400" />
                                    <p className={cn("text-base font-medium text-foreground", isRTL ? '!text-right' : '!text-left')}>{formatDate(banner.start_date)}</p>
                                </div>
                            </div>
                        )}

                        {banner.end_date && (
                            <div className={cn("space-y-2", isRTL ? '!text-right' : '!text-left')}>
                                <p className={cn("text-sm text-muted-foreground", isRTL ? '!text-right' : '!text-left')}>{t('end_date')}</p>
                                <div className={cn("flex items-center gap-2", flexDirection)}>
                                    <Calendar className="h-4 w-4 text-gray-400" />
                                    <p className={cn("text-base font-medium text-foreground", isRTL ? '!text-right' : '!text-left')}>{formatDate(banner.end_date)}</p>
                                </div>
                            </div>
                        )}

                        {banner.view_count !== undefined && (
                            <div className={cn("space-y-2", isRTL ? '!text-right' : '!text-left')}>
                                <p className={cn("text-sm text-muted-foreground", isRTL ? '!text-right' : '!text-left')}>{t('view_count')}</p>
                                <p className={cn("text-base font-medium text-foreground", isRTL ? '!text-right' : '!text-left')}>{banner.view_count || 0}</p>
                            </div>
                        )}

                        <div className={cn("space-y-2", isRTL ? '!text-right' : '!text-left')}>
                            <p className={cn("text-sm text-muted-foreground", isRTL ? '!text-right' : '!text-left')}>{t('created_at')}</p>
                            <div className={cn("flex items-center gap-2", flexDirection)}>
                                <Calendar className="h-4 w-4 text-gray-400" />
                                <p className={cn("text-base font-medium text-foreground", isRTL ? '!text-right' : '!text-left')}>{formatDate(banner.created_at)}</p>
                            </div>
                        </div>

                        <div className={cn("space-y-2", isRTL ? '!text-right' : '!text-left')}>
                            <p className={cn("text-sm text-muted-foreground", isRTL ? '!text-right' : '!text-left')}>{t('updated_at')}</p>
                            <div className={cn("flex items-center gap-2", flexDirection)}>
                                <Clock className="h-4 w-4 text-gray-400" />
                                <p className={cn("text-base font-medium text-foreground", isRTL ? '!text-right' : '!text-left')}>{formatDate(banner.updated_at)}</p>
                            </div>
                        </div>
                    </div>

                    {banner.description_en && (
                        <div className={cn("space-y-2", isRTL ? '!text-right' : '!text-left')}>
                            <p className={cn("text-sm text-muted-foreground", isRTL ? '!text-right' : '!text-left')}>{t('description_en')}</p>
                            <p className={cn("text-base text-foreground", isRTL ? '!text-right' : '!text-left')}>{banner.description_en}</p>
                        </div>
                    )}

                    {banner.description_ar && (
                        <div className={cn("space-y-2", isRTL ? '!text-right' : '!text-left')}>
                            <p className={cn("text-sm text-muted-foreground", isRTL ? '!text-right' : '!text-left')}>{t('description_ar')}</p>
                            <p className={cn("text-base text-foreground", isRTL ? '!text-right' : '!text-left')}>{banner.description_ar}</p>
                        </div>
                    )}

                    {banner.link_url && (
                        <div className={cn("space-y-2", isRTL ? '!text-right' : '!text-left')}>
                            <p className={cn("text-sm text-muted-foreground", isRTL ? '!text-right' : '!text-left')}>{t('link_url')}</p>
                            <a 
                                href={banner.link_url} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className={cn("flex items-center gap-2 text-purple-600 dark:text-purple-400 hover:underline", flexDirection)}
                            >
                                {banner.link_url}
                                <ExternalLink className="h-4 w-4" />
                            </a>
                        </div>
                    )}
                </div>
            </ViewPageLayout>
        </AppLayout>
    );
}

