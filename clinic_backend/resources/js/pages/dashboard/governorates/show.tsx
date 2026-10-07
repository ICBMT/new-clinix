import { type BreadcrumbItem } from '@/types';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ViewPageLayout, PageHeader } from '@/components/page-layouts';
import { useRTLInit } from '@/hooks/use-rtl-init';
import { useTranslation } from '@/hooks/use-translation';
import { useRTL } from '@/hooks/use-rtl';
import AppLayout from '@/layouts/app-layout';
import { index as dashboard } from '@/routes/dashboard';
import { Head, Link, usePage } from '@inertiajs/react';
import { ArrowLeft, Edit, Calendar, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';
import { type SharedData } from '@/types';

interface Governorate {
    id: number;
    name_en: string;
    name_ar: string;
    is_active: boolean;
    created_at: string;
    updated_at: string;
    areas?: Array<{ id: number; name_en: string; name_ar: string }>;
}

interface ShowGovernorateProps {
    governorate: Governorate;
}

export default function ShowGovernorate({ governorate }: ShowGovernorateProps) {
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
            title: t('governorates_management'),
            href: '/dashboard/governorates',
        },
        {
            title: t('view_governorate'),
            href: '#',
        },
    ];
    
    if (!governorate) {
        return (
            <AppLayout breadcrumbs={breadcrumbs}>
                <Head title={t('governorate_not_found')} />
                <ViewPageLayout>
                    <p className={cn(isRTL ? '!text-right' : '!text-left')}>{t('governorate_not_found')}</p>
                </ViewPageLayout>
            </AppLayout>
        );
    }

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
            <Head title={`${t('governorate_details')} - ${governorate.name_en}`} />

            <ViewPageLayout>
                <PageHeader
                    title={t('governorate_details')}
                    description={t('view_governorate_information')}
                    actions={
                        <div className={cn("flex items-center gap-3", flexDirection)}>
                            <Link href={`/dashboard/governorates/${governorate.id}/edit`}>
                                <Button className={cn("flex items-center gap-2", flexDirection)}>
                                    <Edit className={cn("h-4 w-4", iconMargin('md'))} />
                                    {t('edit_governorate')}
                                </Button>
                            </Link>
                            <Link href="/dashboard/governorates">
                                <Button variant="outline" className={cn("flex items-center gap-2", flexDirection)}>
                                    <ArrowLeft className={cn("h-4 w-4", isRTL && 'rotate-180', iconMargin('md'))} />
                                    {t('back')}
                                </Button>
                            </Link>
                        </div>
                    }
                />

                <div className={cn("space-y-4", isRTL ? '!text-right' : '!text-left')} dir={dir}>
                    <h3 className={cn("text-lg font-semibold text-foreground", isRTL ? '!text-right' : '!text-left')} dir={dir}>{t('basic_information')}</h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6" dir={dir}>
                        <div className={cn("space-y-2", isRTL ? '!text-right' : '!text-left')} dir={dir}>
                            <p className={cn("text-sm text-muted-foreground", isRTL ? '!text-right' : '!text-left')} dir={dir}>{t('name_en')}</p>
                            <p className={cn("text-base font-medium text-foreground", isRTL ? '!text-right' : '!text-left')} dir="ltr">{governorate.name_en}</p>
                        </div>

                        <div className={cn("space-y-2", isRTL ? '!text-right' : '!text-left')} dir={dir}>
                            <p className={cn("text-sm text-muted-foreground", isRTL ? '!text-right' : '!text-left')} dir={dir}>{t('name_ar')}</p>
                            <p className={cn("text-base font-medium text-foreground", isRTL ? '!text-right' : '!text-left')} dir="rtl">{governorate.name_ar}</p>
                        </div>

                        <div className={cn("space-y-2", isRTL ? '!text-right' : '!text-left')} dir={dir}>
                            <p className={cn("text-sm text-muted-foreground", isRTL ? '!text-right' : '!text-left')} dir={dir}>{t('status')}</p>
                            <div className={cn(isRTL ? '!text-right' : '!text-left')} dir={dir}>
                                <Badge 
                                    variant={governorate.is_active ? 'default' : 'secondary'}
                                    className={cn(
                                        governorate.is_active 
                                            ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300' 
                                            : 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300',
                                        isRTL ? '!text-right' : '!text-left'
                                    )}
                                    dir={dir}
                                >
                                    {governorate.is_active ? t('active') : t('inactive')}
                                </Badge>
                            </div>
                        </div>

                        <div className={cn("space-y-2", isRTL ? '!text-right' : '!text-left')} dir={dir}>
                            <p className={cn("text-sm text-muted-foreground", isRTL ? '!text-right' : '!text-left')} dir={dir}>{t('created_at')}</p>
                            <div className={cn("flex items-center gap-2", flexDirection)} dir={dir}>
                                <Calendar className={cn("h-4 w-4 text-gray-400", iconMargin('md'))} />
                                <p className={cn("text-base font-medium text-foreground", isRTL ? '!text-right' : '!text-left')} dir={dir}>{formatDate(governorate.created_at)}</p>
                            </div>
                        </div>

                        <div className={cn("space-y-2", isRTL ? '!text-right' : '!text-left')} dir={dir}>
                            <p className={cn("text-sm text-muted-foreground", isRTL ? '!text-right' : '!text-left')} dir={dir}>{t('updated_at')}</p>
                            <div className={cn("flex items-center gap-2", flexDirection)} dir={dir}>
                                <Clock className={cn("h-4 w-4 text-gray-400", iconMargin('md'))} />
                                <p className={cn("text-base font-medium text-foreground", isRTL ? '!text-right' : '!text-left')} dir={dir}>{formatDate(governorate.updated_at)}</p>
                            </div>
                        </div>
                    </div>

                    {governorate.areas && governorate.areas.length > 0 && (
                        <div className={cn("space-y-2", isRTL ? '!text-right' : '!text-left')} dir={dir}>
                            <p className={cn("text-sm text-muted-foreground", isRTL ? '!text-right' : '!text-left')} dir={dir}>{t('areas')}</p>
                            <div className={cn("flex flex-wrap gap-2", flexDirection)} dir={dir}>
                                {governorate.areas.map((area) => (
                                    <Badge key={area.id} variant="outline" className={cn(isRTL ? '!text-right' : '!text-left')} dir={dir}>
                                        {area.name_en} / {area.name_ar}
                                    </Badge>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </ViewPageLayout>
        </AppLayout>
    );
}

