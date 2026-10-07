import { type BreadcrumbItem, type SharedData } from '@/types';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useRTLInit } from '@/hooks/use-rtl-init';
import { useTranslation } from '@/hooks/use-translation';
import { useRTL } from '@/hooks/use-rtl';
import AppLayout from '@/layouts/app-layout';
import { index as dashboard } from '@/routes/dashboard';
import { Head, Link, router, usePage } from '@inertiajs/react';
import { ArrowLeft, Bell, Calendar, Clock, User, Mail } from 'lucide-react';
import { formatHumanDate } from '@/utils/date-utils';
import { getLocalizedName } from '@/utils/localization';
import { cn } from '@/lib/utils';
import { useEffect, useState } from 'react';

interface ShowNotificationProps {
    notification: {
        id: number;
        title_en: string;
        title_ar: string;
        description_en: string;
        description_ar: string;
        recipient_type: string;
        recipient_id?: string | null;
        is_read: boolean;
        created_at: string;
        updated_at: string;
        recipient?: {
            id: number;
            name: string;
            email: string;
        } | null;
    };
}

export default function ShowNotification({ notification }: ShowNotificationProps) {
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
            if (!isNaN(tabNum) && tabNum >= 1 && tabNum <= 2) {
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
    
    const breadcrumbs: BreadcrumbItem[] = [
        {
            title: t('dashboard'),
            href: dashboard.url(),
        },
        {
            title: t('notifications_management'),
            href: '/dashboard/notifications',
        },
        {
            title: t('view_notification'),
            href: '#',
        },
    ];

    const getRecipientTypeBadgeVariant = (type: string): 'default' | 'secondary' | 'destructive' => {
        switch (type) {
            case 'admin':
                return 'default';
            case 'vendor':
                return 'secondary';
            default:
                return 'secondary';
        }
    };

    const displayTitle = getLocalizedName(notification.title_en, notification.title_ar, locale);

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`${t('view_notification')} - ${displayTitle}`} />

            <div className={cn("flex h-full flex-1 flex-col gap-6 overflow-x-auto rounded-xl bg-card dark:bg-card p-6 border border-border", isRTL ? '!text-right' : '!text-left')} dir={dir}>
                {/* Header */}
                <div className={cn("flex items-center justify-between border-b pb-4", flexDirection)}>
                    <div className={cn(isRTL ? '!text-right' : '!text-left')} dir={dir}>
                        <div className={cn("flex items-center gap-3", flexDirection)}>
                            <h1 className={cn("text-3xl font-bold text-foreground", isRTL ? '!text-right' : '!text-left')} dir={dir}>{t('view_notification')}</h1>
                            <Badge 
                                variant={notification.is_read ? 'default' : 'destructive'}
                                className={cn(
                                    "text-base px-4 py-1",
                                    notification.is_read
                                        ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 border-green-200 dark:border-green-800'
                                        : 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300 border-yellow-200 dark:border-yellow-800',
                                    isRTL ? '!text-right' : '!text-left'
                                )}
                            >
                                {notification.is_read ? t('read') : t('unread')}
                            </Badge>
                        </div>
                        <p className={cn("text-muted-foreground mt-1", isRTL ? '!text-right' : '!text-left')} dir={dir}>{t('view_detailed_notification_information')}</p>
                    </div>
                    
                    <div className={cn("flex items-center gap-3", flexDirection)}>
                        <Link href="/dashboard/notifications">
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

                {/* Notification Card */}
                <div className={cn("rounded-lg bg-muted/50 dark:bg-muted/30 p-6 border border-border", isRTL ? '!text-right' : '!text-left')} dir={dir}>
                    <div className={cn("flex items-center gap-4", flexDirection)}>
                        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 dark:bg-primary/20">
                            <Bell className="h-8 w-8 text-primary" />
                        </div>
                        <div className="flex-1">
                            <h3 className={cn("text-xl font-semibold text-foreground", isRTL ? '!text-right' : '!text-left')} dir="ltr">{notification.title_en}</h3>
                            <p className={cn("text-muted-foreground mt-1", isRTL ? '!text-right' : '!text-left')} dir="rtl">{notification.title_ar}</p>
                            <div className={cn("flex items-center gap-2 mt-2", flexDirection)}>
                                <Badge variant={notification.is_read ? 'default' : 'destructive'} className={cn(isRTL ? '!text-right' : '!text-left')}>
                                    {notification.is_read ? t('read') : t('unread')}
                                </Badge>
                                <span className="text-sm text-muted-foreground">•</span>
                                <div className={cn("flex items-center gap-1", flexDirection)}>
                                    <Calendar className="h-4 w-4 text-muted-foreground" />
                                    <span className={cn("text-sm text-muted-foreground", isRTL ? '!text-right' : '!text-left')} dir={dir}>
                                        {formatHumanDate(notification.created_at, t)}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Notification Information Tabs */}
                <Tabs value={activeTab.toString()} onValueChange={(value) => handleTabChange(value)} className="w-full">
                    <TabsList className={cn("grid w-full grid-cols-2", flexDirection)}>
                        <TabsTrigger value="1" className={cn(isRTL ? '!text-right' : '!text-left')} dir={dir}>
                            {t('notification_details')}
                        </TabsTrigger>
                        <TabsTrigger value="2" className={cn(isRTL ? '!text-right' : '!text-left')} dir={dir}>
                            {t('recipient_information')}
                        </TabsTrigger>
                    </TabsList>

                    {/* Tab 1: Notification Details */}
                    <TabsContent value="1" className={cn("mt-6", isRTL ? '!text-right' : '!text-left')} dir={dir}>
                        <div className={cn("space-y-6", isRTL ? '!text-right' : '!text-left')} dir={dir}>
                            <div className={cn("flex items-center gap-3 mb-6", flexDirection)}>
                                <Bell className="h-6 w-6 text-primary" />
                                <h2 className={cn("text-2xl font-semibold text-foreground", isRTL ? '!text-right' : '!text-left')} dir={dir}>
                                    {t('notification_information')}
                                </h2>
                            </div>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className={cn("space-y-2", isRTL ? '!text-right' : '!text-left')} dir={dir}>
                                    <p className={cn("text-sm text-muted-foreground", isRTL ? '!text-right' : '!text-left')} dir={dir}>{t('notification_title')} ({t('english')})</p>
                                    <p className={cn("text-base font-medium text-foreground", isRTL ? '!text-right' : '!text-left')} dir="ltr">{notification.title_en}</p>
                                </div>
                                <div className={cn("space-y-2", isRTL ? '!text-right' : '!text-left')} dir={dir}>
                                    <p className={cn("text-sm text-muted-foreground", isRTL ? '!text-right' : '!text-left')} dir={dir}>{t('notification_title')} ({t('arabic')})</p>
                                    <p className={cn("text-base font-medium text-foreground", isRTL ? '!text-right' : '!text-left')} dir="rtl">{notification.title_ar}</p>
                                </div>
                                <div className={cn("space-y-2 md:col-span-2", isRTL ? '!text-right' : '!text-left')} dir={dir}>
                                    <p className={cn("text-sm text-muted-foreground", isRTL ? '!text-right' : '!text-left')} dir={dir}>{t('notification_message')} ({t('english')})</p>
                                    <p className={cn("text-base text-foreground", isRTL ? '!text-right' : '!text-left')} dir="ltr">{notification.description_en}</p>
                                </div>
                                <div className={cn("space-y-2 md:col-span-2", isRTL ? '!text-right' : '!text-left')} dir={dir}>
                                    <p className={cn("text-sm text-muted-foreground", isRTL ? '!text-right' : '!text-left')} dir={dir}>{t('notification_message')} ({t('arabic')})</p>
                                    <p className={cn("text-base text-foreground", isRTL ? '!text-right' : '!text-left')} dir="rtl">{notification.description_ar}</p>
                                </div>
                                <div className={cn("space-y-2", isRTL ? '!text-right' : '!text-left')} dir={dir}>
                                    <p className={cn("text-sm text-muted-foreground", isRTL ? '!text-right' : '!text-left')} dir={dir}>{t('recipient_type')}</p>
                                    <Badge variant={getRecipientTypeBadgeVariant(notification.recipient_type)} className={cn(isRTL ? '!text-right' : '!text-left')}>
                                        {t(notification.recipient_type)}
                                    </Badge>
                                </div>
                                <div className={cn("space-y-2", isRTL ? '!text-right' : '!text-left')} dir={dir}>
                                    <p className={cn("text-sm text-muted-foreground", isRTL ? '!text-right' : '!text-left')} dir={dir}>{t('is_read')}</p>
                                    <Badge variant={notification.is_read ? 'default' : 'destructive'} className={cn(isRTL ? '!text-right' : '!text-left')}>
                                        {notification.is_read ? t('read') : t('unread')}
                                    </Badge>
                                </div>
                                <div className={cn("space-y-2", isRTL ? '!text-right' : '!text-left')} dir={dir}>
                                    <div className={cn("flex items-center gap-2", flexDirection)}>
                                        <Calendar className="h-4 w-4 text-gray-400" />
                                        <p className={cn("text-sm text-muted-foreground", isRTL ? '!text-right' : '!text-left')} dir={dir}>{t('created_at')}</p>
                                    </div>
                                    <p className={cn("text-base font-medium text-foreground", isRTL ? '!text-right' : '!text-left')} dir={dir}>
                                        {formatHumanDate(notification.created_at, t)}
                                    </p>
                                </div>
                                <div className={cn("space-y-2", isRTL ? '!text-right' : '!text-left')} dir={dir}>
                                    <div className={cn("flex items-center gap-2", flexDirection)}>
                                        <Clock className="h-4 w-4 text-gray-400" />
                                        <p className={cn("text-sm text-muted-foreground", isRTL ? '!text-right' : '!text-left')} dir={dir}>{t('updated_at')}</p>
                                    </div>
                                    <p className={cn("text-base font-medium text-foreground", isRTL ? '!text-right' : '!text-left')} dir={dir}>
                                        {formatHumanDate(notification.updated_at, t)}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </TabsContent>

                    {/* Tab 2: Recipient Information */}
                    <TabsContent value="2" className={cn("mt-6", isRTL ? '!text-right' : '!text-left')} dir={dir}>
                        <div className={cn("space-y-6", isRTL ? '!text-right' : '!text-left')} dir={dir}>
                            <div className={cn("flex items-center gap-3 mb-6", flexDirection)}>
                                <User className="h-6 w-6 text-primary" />
                                <h2 className={cn("text-2xl font-semibold text-foreground", isRTL ? '!text-right' : '!text-left')} dir={dir}>
                                    {t('recipient_information')}
                                </h2>
                            </div>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className={cn("space-y-2", isRTL ? '!text-right' : '!text-left')} dir={dir}>
                                    <p className={cn("text-sm text-muted-foreground", isRTL ? '!text-right' : '!text-left')} dir={dir}>{t('recipient_type')}</p>
                                    <Badge variant={getRecipientTypeBadgeVariant(notification.recipient_type)} className={cn(isRTL ? '!text-right' : '!text-left')}>
                                        {t(notification.recipient_type)}
                                    </Badge>
                                </div>
                                <div className={cn("space-y-2", isRTL ? '!text-right' : '!text-left')} dir={dir}>
                                    <p className={cn("text-sm text-muted-foreground", isRTL ? '!text-right' : '!text-left')} dir={dir}>{t('recipient')} ID</p>
                                    <p className={cn("text-base font-medium text-foreground", isRTL ? '!text-right' : '!text-left')} dir="ltr">
                                        {notification.recipient_id || t('all_recipients')}
                                    </p>
                                </div>
                                {notification.recipient && (
                                    <>
                                        <div className={cn("space-y-2", isRTL ? '!text-right' : '!text-left')} dir={dir}>
                                            <div className={cn("flex items-center gap-2", flexDirection)}>
                                                <User className="h-4 w-4 text-gray-400" />
                                                <p className={cn("text-sm text-muted-foreground", isRTL ? '!text-right' : '!text-left')} dir={dir}>{t('recipient_name')}</p>
                                            </div>
                                            <Link
                                                href={`/dashboard/users/${notification.recipient.id}`}
                                                className={cn("text-primary hover:underline font-medium", isRTL ? '!text-right' : '!text-left')}
                                            >
                                                {notification.recipient.name}
                                            </Link>
                                        </div>
                                        <div className={cn("space-y-2", isRTL ? '!text-right' : '!text-left')} dir={dir}>
                                            <div className={cn("flex items-center gap-2", flexDirection)}>
                                                <Mail className="h-4 w-4 text-gray-400" />
                                                <p className={cn("text-sm text-muted-foreground", isRTL ? '!text-right' : '!text-left')} dir={dir}>{t('recipient_email')}</p>
                                            </div>
                                            <p className={cn("text-base font-medium text-foreground", isRTL ? '!text-right' : '!text-left')} dir="ltr">
                                                {notification.recipient.email}
                                            </p>
                                        </div>
                                    </>
                                )}
                            </div>
                        </div>
                    </TabsContent>
                </Tabs>
            </div>
        </AppLayout>
    );
}
