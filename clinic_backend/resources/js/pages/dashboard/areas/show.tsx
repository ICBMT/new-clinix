import { type BreadcrumbItem, type SharedData } from '@/types';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useRTLInit } from '@/hooks/use-rtl-init';
import { useTranslation } from '@/hooks/use-translation';
import { useRTL } from '@/hooks/use-rtl';
import { getLocalizedName } from '@/utils/localization';
import AppLayout from '@/layouts/app-layout';
import { index as dashboard } from '@/routes/dashboard';
import { Head, Link, router, usePage } from '@inertiajs/react';
import { ArrowLeft, Edit, FileText, Calendar, Clock, MapPin } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useEffect, useState } from 'react';
import { formatHumanDate } from '@/utils/date-utils';

interface Area {
    id: number;
    name_en: string;
    name_ar: string;
    governorate_id: number;
    governorate?: { id: number; name_en: string; name_ar: string };
    is_active: boolean;
    created_at: string;
    updated_at: string;
}

interface ShowAreaProps {
    area: Area;
}

export default function ShowArea({ area }: ShowAreaProps) {
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
            if (!isNaN(tabNum) && tabNum >= 1 && tabNum <= 1) {
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
    
    if (!area) {
        return (
            <AppLayout breadcrumbs={[]}>
                <Head title={t('area_not_found')} />
                <div className={cn("flex h-full flex-1 flex-col gap-6 overflow-x-auto rounded-xl bg-card dark:bg-card p-6 border border-border", isRTL ? '!text-right' : '!text-left')} dir={dir}>
                    <p className={cn(isRTL ? '!text-right' : '!text-left')} dir={dir}>{t('area_not_found')}</p>
                </div>
            </AppLayout>
        );
    }
    
    const breadcrumbs: BreadcrumbItem[] = [
        {
            title: t('dashboard'),
            href: dashboard.url(),
        },
        {
            title: t('areas_management'),
            href: '/dashboard/areas',
        },
        {
            title: t('view_area'),
            href: '#',
        },
    ];

    const displayName = getLocalizedName(area.name_en, area.name_ar, locale);

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`${t('view_area')} - ${displayName}`} />

            <div className={cn("flex h-full flex-1 flex-col gap-6 overflow-x-auto rounded-xl bg-card dark:bg-card p-6 border border-border", isRTL ? '!text-right' : '!text-left')} dir={dir}>
                {/* Header */}
                <div className={cn("flex items-center justify-between border-b pb-4", flexDirection)}>
                    <div className={cn(isRTL ? '!text-right' : '!text-left')} dir={dir}>
                        <div className={cn("flex items-center gap-3", flexDirection)}>
                            <h1 className={cn("text-3xl font-bold text-foreground", isRTL ? '!text-right' : '!text-left')} dir={dir}>{t('view_area')}</h1>
                            <Badge 
                                variant={area.is_active ? 'default' : 'secondary'}
                                className={cn(
                                    "text-base px-4 py-1",
                                    area.is_active 
                                        ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 border-green-200 dark:border-green-800' 
                                        : 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300 border-red-200 dark:border-red-800',
                                    isRTL ? '!text-right' : '!text-left'
                                )}
                            >
                                {area.is_active ? t('active') : t('inactive')}
                            </Badge>
                        </div>
                        <p className={cn("text-muted-foreground mt-1", isRTL ? '!text-right' : '!text-left')} dir={dir}>{t('view_area_information')}</p>
                    </div>
                    
                    <div className={cn("flex items-center gap-3", flexDirection)}>
                        <Link href={`/dashboard/areas/${area.id}/edit`}>
                            <Button 
                                className={cn("flex items-center gap-2", flexDirection)}
                                aria-label={t('edit_area')}
                            >
                                <Edit className={cn("h-4 w-4", iconMargin('md'))} />
                                {t('edit_area')}
                            </Button>
                        </Link>
                        <Link href="/dashboard/areas">
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

                {/* Area Information Tabs */}
                <Tabs value={activeTab.toString()} onValueChange={(value) => handleTabChange(value)} className="w-full">
                    <TabsList className={cn("grid w-full grid-cols-1", flexDirection)}>
                        <TabsTrigger value="1" className={cn(isRTL ? '!text-right' : '!text-left')} dir={dir}>
                            {t('basic_information')}
                        </TabsTrigger>
                    </TabsList>

                    {/* Tab 1: Basic Information */}
                    <TabsContent value="1" className={cn("mt-6", isRTL ? '!text-right' : '!text-left')} dir={dir}>
                        <div className={cn("space-y-6", isRTL ? '!text-right' : '!text-left')} dir={dir}>
                            <div className={cn("flex items-center gap-3 mb-6", flexDirection)}>
                                <FileText className="h-6 w-6 text-primary" />
                                <h2 className={cn("text-2xl font-semibold text-foreground", isRTL ? '!text-right' : '!text-left')} dir={dir}>
                                    {t('basic_information')}
                                </h2>
                            </div>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className={cn("space-y-2", isRTL ? '!text-right' : '!text-left')} dir={dir}>
                                    <p className={cn("text-sm text-muted-foreground", isRTL ? '!text-right' : '!text-left')} dir={dir}>{t('name_en')}</p>
                                    <p className={cn("text-base font-medium text-foreground", isRTL ? '!text-right' : '!text-left')} dir="ltr">{area.name_en}</p>
                                </div>
                                <div className={cn("space-y-2", isRTL ? '!text-right' : '!text-left')} dir={dir}>
                                    <p className={cn("text-sm text-muted-foreground", isRTL ? '!text-right' : '!text-left')} dir={dir}>{t('name_ar')}</p>
                                    <p className={cn("text-base font-medium text-foreground", isRTL ? '!text-right' : '!text-left')} dir="rtl">{area.name_ar}</p>
                                </div>
                                {area.governorate && (
                                    <div className={cn("space-y-2", isRTL ? '!text-right' : '!text-left')} dir={dir}>
                                        <div className={cn("flex items-center gap-2", flexDirection)}>
                                            <MapPin className="h-4 w-4 text-gray-400" />
                                            <p className={cn("text-sm text-muted-foreground", isRTL ? '!text-right' : '!text-left')} dir={dir}>{t('governorate')}</p>
                                        </div>
                                        <p className={cn("text-base font-medium text-foreground", isRTL ? '!text-right' : '!text-left')} dir={dir}>
                                            {getLocalizedName(area.governorate.name_en, area.governorate.name_ar, locale)}
                                        </p>
                                    </div>
                                )}
                                <div className={cn("space-y-2", isRTL ? '!text-right' : '!text-left')} dir={dir}>
                                    <p className={cn("text-sm text-muted-foreground", isRTL ? '!text-right' : '!text-left')} dir={dir}>{t('status')}</p>
                                    <Badge 
                                        variant={area.is_active ? 'default' : 'secondary'}
                                        className={cn(
                                            area.is_active 
                                                ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300' 
                                                : 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300',
                                            isRTL ? '!text-right' : '!text-left'
                                        )}
                                    >
                                        {area.is_active ? t('active') : t('inactive')}
                                    </Badge>
                                </div>
                                <div className={cn("space-y-2", isRTL ? '!text-right' : '!text-left')} dir={dir}>
                                    <div className={cn("flex items-center gap-2", flexDirection)}>
                                        <Calendar className="h-4 w-4 text-gray-400" />
                                        <p className={cn("text-sm text-muted-foreground", isRTL ? '!text-right' : '!text-left')} dir={dir}>{t('created_at')}</p>
                                    </div>
                                    <p className={cn("text-base font-medium text-foreground", isRTL ? '!text-right' : '!text-left')} dir={dir}>
                                        {formatHumanDate(area.created_at, t)}
                                    </p>
                                </div>
                                <div className={cn("space-y-2", isRTL ? '!text-right' : '!text-left')} dir={dir}>
                                    <div className={cn("flex items-center gap-2", flexDirection)}>
                                        <Clock className="h-4 w-4 text-gray-400" />
                                        <p className={cn("text-sm text-muted-foreground", isRTL ? '!text-right' : '!text-left')} dir={dir}>{t('updated_at')}</p>
                                    </div>
                                    <p className={cn("text-base font-medium text-foreground", isRTL ? '!text-right' : '!text-left')} dir={dir}>
                                        {formatHumanDate(area.updated_at, t)}
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
