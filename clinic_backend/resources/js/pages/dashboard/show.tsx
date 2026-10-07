import { type BreadcrumbItem } from '@/types';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useTranslation } from '@/hooks/use-translation';
import { cn } from '@/lib/utils';
import { useRTL } from '@/hooks/use-rtl';
import { cn } from '@/lib/utils';
import AppLayout from '@/layouts/app-layout';
import { cn } from '@/lib/utils';
import { index as dashboard } from '@/routes/dashboard';
import { cn } from '@/lib/utils';
import { Head, Link } from '@inertiajs/react';
import { cn } from '@/lib/utils';
import { ArrowLeft, Edit, Calendar, Clock, ExternalLink } from 'lucide-react';
import { cn } from '@/lib/utils';

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
    category?: { id: number; name_en: string; name_ar: string };
    service?: { id: number; name_en: string; name_ar: string };
    position?: string;
    sort_order: number;
    start_date?: string;
    end_date?: string;
    status: 'active' | 'inactive';
    click_count: number;
    view_count: number;
    created_at: string;
    updated_at: string;
}

interface ShowBannerProps {
    banner: Banner;
}

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'dashboard',
        href: dashboard.url(),
    },
    {
        title: 'Banners Management',
        href: '/dashboard/banners',
    },
    {
        title: 'View Banner',
        href: '#',
    },
];

export default function ShowBanner({ banner }: ShowBannerProps) {
    const { t, locale } = useTranslation();
    const { isRTL } = useRTL();

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
            <Head title={`${t('banner_details')} - ${banner.title_en}`} />

            <div className="flex h-full flex-1 flex-col gap-6 overflow-x-auto rounded-xl bg-card dark:bg-card p-6 border border-border" dir={isRTL ? 'rtl' : 'ltr'}>
                {/* Header */}
                <div className="border-b pb-4 space-y-4">
                    {/* Back button - always on the left */}
                    <div className="flex justify-start">
                        <Link href="/dashboard/banners">
                            <Button variant="outline" className={`flex items-center gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
                                <ArrowLeft className={`h-4 w-4 ${isRTL ? 'rotate-180' : ''}`} />
                                {t('back')}
                            </Button>
                        </Link>
                    </div>
                    
                    {/* Title and Actions */}
                    <div className={`flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 ${isRTL ? 'sm:flex-row-reverse' : ''}`}>
                        <div className={isRTL ? 'text-right' : ''}>
                            <h1 className="text-3xl font-bold text-foreground">{t('banner_details')}</h1>
                            <p className="text-muted-foreground mt-1">{t('view_banner_information')}</p>
                        </div>
                        <div className={`flex items-center gap-3 ${isRTL ? 'flex-row-reverse' : ''}`}>
                            <Link href={`/dashboard/banners/${banner.id}/edit`}>
                                <Button className={`flex items-center gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
                                    <Edit className="h-4 w-4" />
                                    {t('edit_banner')}
                                </Button>
                            </Link>
                        </div>
                    </div>
                </div>

                <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-foreground">{t('basic_information')}</h3>
                    
                    {(banner.image_url || banner.mobile_image_url) && (
                        <div className={`space-y-2 ${isRTL ? 'text-right' : ''}`}>
                            <p className="text-sm text-muted-foreground">{t('images')}</p>
                            <div className="flex gap-4">
                                {banner.image_url && (
                                    <div>
                                        <p className="text-xs text-muted-foreground mb-1">{t('desktop_image')}</p>
                                        <img src={banner.image_url} alt={banner.title_en} className="w-48 h-32 object-cover rounded" />
                                    </div>
                                )}
                                {banner.mobile_image_url && (
                                    <div>
                                        <p className="text-xs text-muted-foreground mb-1">{t('mobile_image')}</p>
                                        <img src={banner.mobile_image_url} alt={banner.title_en} className="w-32 h-48 object-cover rounded" />
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className={`space-y-2 ${isRTL ? 'text-right' : ''}`}>
                            <p className="text-sm text-muted-foreground">{t('title_en')}</p>
                            <p className="text-base font-medium text-foreground">{banner.title_en}</p>
                        </div>

                        <div className={`space-y-2 ${isRTL ? 'text-right' : ''}`}>
                            <p className="text-sm text-muted-foreground">{t('title_ar')}</p>
                            <p className="text-base font-medium text-foreground">{banner.title_ar}</p>
                        </div>

                        {banner.category && (
                            <div className={`space-y-2 ${isRTL ? 'text-right' : ''}`}>
                                <p className="text-sm text-muted-foreground">{t('category')}</p>
                                <p className="text-base font-medium text-foreground">
                                    {isRTL ? banner.category.name_ar : banner.category.name_en}
                                </p>
                            </div>
                        )}

                        {banner.service && (
                            <div className={`space-y-2 ${isRTL ? 'text-right' : ''}`}>
                                <p className="text-sm text-muted-foreground">{t('service')}</p>
                                <p className="text-base font-medium text-foreground">
                                    {isRTL ? banner.service.name_ar : banner.service.name_en}
                                </p>
                            </div>
                        )}

                        {banner.type && (
                            <div className={`space-y-2 ${isRTL ? 'text-right' : ''}`}>
                                <p className="text-sm text-muted-foreground">{t('type')}</p>
                                <Badge variant="outline">{banner.type}</Badge>
                            </div>
                        )}

                        {banner.position && (
                            <div className={`space-y-2 ${isRTL ? 'text-right' : ''}`}>
                                <p className="text-sm text-muted-foreground">{t('position')}</p>
                                <p className="text-base font-medium text-foreground">{banner.position}</p>
                            </div>
                        )}

                        <div className={`space-y-2 ${isRTL ? 'text-right' : ''}`}>
                            <p className="text-sm text-muted-foreground">{t('status')}</p>
                            <Badge 
                                variant={banner.status === 'active' ? 'default' : 'secondary'}
                                className={
                                    banner.status === 'active' 
                                        ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300' 
                                        : 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300'
                                }
                            >
                                {t(banner.status)}
                            </Badge>
                        </div>

                        <div className={`space-y-2 ${isRTL ? 'text-right' : ''}`}>
                            <p className="text-sm text-muted-foreground">{t('sort_order')}</p>
                            <p className="text-base font-medium text-foreground">{banner.sort_order}</p>
                        </div>

                        {banner.start_date && (
                            <div className={`space-y-2 ${isRTL ? 'text-right' : ''}`}>
                                <p className="text-sm text-muted-foreground">{t('start_date')}</p>
                                <div className={`flex items-center gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
                                    <Calendar className="h-4 w-4 text-gray-400" />
                                    <p className="text-base font-medium text-foreground">{formatDate(banner.start_date)}</p>
                                </div>
                            </div>
                        )}

                        {banner.end_date && (
                            <div className={`space-y-2 ${isRTL ? 'text-right' : ''}`}>
                                <p className="text-sm text-muted-foreground">{t('end_date')}</p>
                                <div className={`flex items-center gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
                                    <Calendar className="h-4 w-4 text-gray-400" />
                                    <p className="text-base font-medium text-foreground">{formatDate(banner.end_date)}</p>
                                </div>
                            </div>
                        )}

                        <div className={`space-y-2 ${isRTL ? 'text-right' : ''}`}>
                            <p className="text-sm text-muted-foreground">{t('click_count')}</p>
                            <p className="text-base font-medium text-foreground">{banner.click_count || 0}</p>
                        </div>

                        <div className={`space-y-2 ${isRTL ? 'text-right' : ''}`}>
                            <p className="text-sm text-muted-foreground">{t('view_count')}</p>
                            <p className="text-base font-medium text-foreground">{banner.view_count || 0}</p>
                        </div>

                        <div className={`space-y-2 ${isRTL ? 'text-right' : ''}`}>
                            <p className="text-sm text-muted-foreground">{t('created_at')}</p>
                            <div className={`flex items-center gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
                                <Calendar className="h-4 w-4 text-gray-400" />
                                <p className="text-base font-medium text-foreground">{formatDate(banner.created_at)}</p>
                            </div>
                        </div>

                        <div className={`space-y-2 ${isRTL ? 'text-right' : ''}`}>
                            <p className="text-sm text-muted-foreground">{t('updated_at')}</p>
                            <div className={`flex items-center gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
                                <Clock className="h-4 w-4 text-gray-400" />
                                <p className="text-base font-medium text-foreground">{formatDate(banner.updated_at)}</p>
                            </div>
                        </div>
                    </div>

                    {banner.description_en && (
                        <div className={`space-y-2 ${isRTL ? 'text-right' : ''}`}>
                            <p className="text-sm text-muted-foreground">{t('description_en')}</p>
                            <p className="text-base text-foreground">{banner.description_en}</p>
                        </div>
                    )}

                    {banner.description_ar && (
                        <div className={`space-y-2 ${isRTL ? 'text-right' : ''}`}>
                            <p className="text-sm text-muted-foreground">{t('description_ar')}</p>
                            <p className="text-base text-foreground">{banner.description_ar}</p>
                        </div>
                    )}

                    {banner.link_url && (
                        <div className={`space-y-2 ${isRTL ? 'text-right' : ''}`}>
                            <p className="text-sm text-muted-foreground">{t('link_url')}</p>
                            <a 
                                href={banner.link_url} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="flex items-center gap-2 text-purple-600 dark:text-purple-400 hover:underline"
                            >
                                {banner.link_url}
                                <ExternalLink className="h-4 w-4" />
                            </a>
                        </div>
                    )}
                </div>
            </div>
        </AppLayout>
    );
}

