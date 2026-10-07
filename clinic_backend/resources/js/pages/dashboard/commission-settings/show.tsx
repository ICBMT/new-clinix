import { BreadcrumbItem } from '@/components/breadcrumb';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useRTLInit } from '@/hooks/use-rtl-init';
import { useTranslation } from '@/hooks/use-translation';
import { useRTL } from '@/hooks/use-rtl';
import AppLayout from '@/layouts/app-layout';
import { index as dashboard } from '@/routes/dashboard';
import { Head, Link } from '@inertiajs/react';
import { ArrowLeft, Edit, Calendar, DollarSign, User } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ShowCommissionSettingProps {
    setting: {
        id: number;
        commission_rate: number;
        frequency: 'weekly' | 'monthly' | 'quarterly' | 'yearly';
        is_default: boolean;
        is_active: boolean;
        description?: string;
        created_at: string;
        updated_at: string;
        vendor?: {
            id: number;
            name: string;
            email: string;
        } | null;
    };
}

export default function ShowCommissionSetting({ setting }: ShowCommissionSettingProps) {
    useRTLInit();
    const { t, locale } = useTranslation();
    const { isRTL, dir, textAlign, flexDirection, iconMargin } = useRTL();
    
    const breadcrumbs: BreadcrumbItem[] = [
        {
            title: t('dashboard'),
            href: dashboard.url(),
        },
        {
            title: t('commission_settings'),
            href: '/dashboard/commission-settings',
        },
        {
            title: t('view_setting'),
            href: '#',
        },
    ];

    const formatDate = (date: string) => {
        return new Date(date).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    const getStatusBadge = (isActive: boolean) => {
        return (
            <Badge variant={isActive ? 'default' : 'secondary'}>
                {isActive ? t('active') : t('inactive')}
            </Badge>
        );
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`${t('commission_setting_details')} - #${setting.id}`} />

            <div className={cn("flex h-full flex-1 flex-col gap-6 overflow-x-auto rounded-xl bg-card dark:bg-card p-6 border border-border", textAlign)} dir={dir}>
                {/* Header */}
                <div className={cn("flex items-center justify-between border-b pb-4", flexDirection)}>
                    <div className={textAlign}>
                        <h1 className={cn("text-3xl font-bold text-foreground", textAlign)}>{t('commission_setting_details')}</h1>
                        <p className={cn("text-muted-foreground mt-1", textAlign)}>{t('view_commission_setting_information')}</p>
                    </div>
                    <div className={cn("flex items-center gap-3", flexDirection)}>
                        <Link href={`/dashboard/commission-settings/${setting.id}/edit`}>
                            <Button className={cn("flex items-center gap-2", flexDirection)}>
                                <Edit className={cn("h-4 w-4", iconMargin('md'))} />
                                {t('edit_setting')}
                            </Button>
                        </Link>
                        <Link href="/dashboard/commission-settings">
                            <Button variant="outline" className={cn("flex items-center gap-2", flexDirection)}>
                                <ArrowLeft className={cn("h-4 w-4", isRTL && 'rotate-180', iconMargin('md'))} />
                                {t('back')}
                            </Button>
                        </Link>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {setting.vendor ? (
                        <div className={cn("space-y-2", textAlign)}>
                            <p className={cn("text-sm text-muted-foreground flex items-center gap-2", flexDirection)}>
                                <User className={cn("h-4 w-4", iconMargin('md'))} />
                                {t('vendor')}
                            </p>
                            <div className={cn("bg-gray-50 dark:bg-gray-800 rounded-lg p-4", textAlign)} dir={dir}>
                                <p className={cn("font-medium", textAlign)}>{setting.vendor.name}</p>
                                <p className={cn("text-sm text-muted-foreground", textAlign)} dir="ltr">{setting.vendor.email}</p>
                            </div>
                        </div>
                    ) : (
                        <div className={cn("space-y-2", textAlign)}>
                            <p className={cn("text-sm text-muted-foreground", textAlign)}>{t('type')}</p>
                            <div className={cn("flex items-center gap-2", flexDirection)}>
                                <Badge variant="outline">{t('default')}</Badge>
                                {setting.is_default && (
                                    <Badge variant="secondary">{t('default_setting')}</Badge>
                                )}
                            </div>
                        </div>
                    )}

                    <div className={cn("space-y-2", textAlign)}>
                        <p className={cn("text-sm text-muted-foreground flex items-center gap-2", flexDirection)}>
                            <DollarSign className={cn("h-4 w-4", iconMargin('md'))} />
                            {t('commission_rate')}
                        </p>
                        <p className={cn("text-4xl font-bold", textAlign)}>{setting.commission_rate}%</p>
                    </div>

                    <div className={cn("space-y-2", textAlign)}>
                        <p className={cn("text-sm text-muted-foreground", textAlign)}>{t('frequency')}</p>
                        <p className={cn("text-lg font-medium", textAlign)}>{t(setting.frequency)}</p>
                    </div>

                    <div className={cn("space-y-2", textAlign)}>
                        <p className={cn("text-sm text-muted-foreground", textAlign)}>{t('status')}</p>
                        {getStatusBadge(setting.is_active)}
                    </div>

                    <div className={cn("space-y-2", textAlign)}>
                        <p className={cn("text-sm text-muted-foreground flex items-center gap-2", flexDirection)}>
                            <Calendar className={cn("h-4 w-4", iconMargin('md'))} />
                            {t('created_at')}
                        </p>
                        <p className={cn("text-base font-medium text-foreground", textAlign)} dir={dir}>{formatDate(setting.created_at)}</p>
                    </div>

                    <div className={cn("space-y-2", textAlign)}>
                        <p className={cn("text-sm text-muted-foreground", textAlign)}>{t('updated_at')}</p>
                        <p className={cn("text-base font-medium text-foreground", textAlign)} dir={dir}>{formatDate(setting.updated_at)}</p>
                    </div>
                </div>

                {setting.description && (
                    <div className={cn("space-y-2 pt-4 border-t", textAlign)}>
                        <p className={cn("text-sm text-muted-foreground", textAlign)}>{t('description')}</p>
                        <div className={cn("bg-gray-50 dark:bg-gray-800 rounded-lg p-4", textAlign)} dir={dir}>
                            <p className={cn("text-base text-foreground whitespace-pre-wrap", textAlign)} dir={dir}>{setting.description}</p>
                        </div>
                    </div>
                )}
            </div>
        </AppLayout>
    );
}

