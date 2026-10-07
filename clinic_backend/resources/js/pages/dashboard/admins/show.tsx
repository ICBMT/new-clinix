import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ViewPageLayout, PageHeader } from '@/components/page-layouts';
import { useTranslation } from '@/hooks/use-translation';
import { useRTL } from '@/hooks/use-rtl';
import { useRTLInit } from '@/hooks/use-rtl-init';
import AppLayout from '@/layouts/app-layout';
import { Head, Link, usePage } from '@inertiajs/react';
import { index as dashboard } from '@/routes/dashboard';
import { ArrowLeft, Edit, Shield, Calendar, Mail, Phone } from 'lucide-react';
import { type BreadcrumbItem } from '@/types';
import { cn } from '@/lib/utils';
import { type SharedData } from '@/types';

interface Admin {
    id: number;
    name: string;
    email: string;
    phone: string;
    email_verified_at: string | null;
    phone_verified_at: string | null;
    created_at: string;
    updated_at: string;
    roles: Array<{
        name: string;
        alias?: string;
    }>;
}

interface ShowAdminProps {
    admin: Admin;
}

export default function ShowAdmin({ admin }: ShowAdminProps) {
    useRTLInit();
    const { t, locale } = useTranslation();
    const page = usePage<SharedData>();
    const { locale: pageLocale } = page.props;
    const isRTL = pageLocale === 'ar';
    const dir = isRTL ? 'rtl' : 'ltr';
    const { flexDirection, iconMargin } = useRTL();

    const isSystemAdmin = admin.roles?.some(role => role.name === 'super-admin') || false;

    const breadcrumbItems: BreadcrumbItem[] = [
        { title: t('dashboard'), href: dashboard.url() },
        { title: t('admin_management'), href: '/dashboard/admins' },
        { title: t('view_admin'), href: `/dashboard/admins/${admin.id}` },
    ];

    return (
        <AppLayout breadcrumbs={breadcrumbItems}>
            <Head title={t('view_admin')} />

            <ViewPageLayout>
                <PageHeader
                    title={t('view_admin')}
                    description={t('view_admin_information')}
                    actions={
                        <div className={cn("flex items-center gap-3", flexDirection)}>
                            {!isSystemAdmin && (
                                <Link href={`/dashboard/admins/${admin.id}/edit`}>
                                    <Button className={cn("flex items-center gap-2", flexDirection)}>
                                        <Edit className={cn("h-4 w-4", iconMargin('md'))} />
                                        {t('edit_admin')}
                                    </Button>
                                </Link>
                            )}
                            <Link href="/dashboard/admins">
                                <Button variant="outline" className={cn("flex items-center gap-2", flexDirection)}>
                                    <ArrowLeft className={cn("h-4 w-4", isRTL && 'rotate-180', iconMargin('md'))} />
                                    {t('back')}
                                </Button>
                            </Link>
                        </div>
                    }
                />

                {/* Admin Information */}
                <div className={cn("rounded-lg border bg-card p-4 sm:p-6", isRTL ? '!text-right' : '!text-left')}>
                    <h3 className={cn("text-base sm:text-lg font-semibold mb-4 flex items-center gap-2", flexDirection)}>
                        <Shield className={cn("h-4 w-4 sm:h-5 sm:w-5 text-primary", iconMargin('md'))} />
                        {t('admin_information')}
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                        <div className={cn(isRTL ? '!text-right' : '!text-left')}>
                            <p className={cn("text-sm text-muted-foreground mb-1", isRTL ? '!text-right' : '!text-left')}>{t('name')}</p>
                            <div className={cn("flex items-center gap-2", flexDirection)}>
                                <p className={cn("font-medium", isRTL ? '!text-right' : '!text-left')}>{admin.name}</p>
                                {isSystemAdmin && (
                                    <Badge variant="secondary" className={cn("text-xs", isRTL ? '!text-right' : '!text-left')}>
                                        {t('super_admin')}
                                    </Badge>
                                )}
                            </div>
                        </div>

                        <div className={cn(isRTL ? '!text-right' : '!text-left')}>
                            <p className={cn("text-sm text-muted-foreground mb-1 flex items-center gap-1", flexDirection)}>
                                <Mail className={cn("h-4 w-4", iconMargin('md'))} />
                                {t('email')}
                            </p>
                            <p className={cn("font-medium", isRTL ? '!text-right' : '!text-left')}>{admin.email}</p>
                        </div>

                        <div className={cn(isRTL ? '!text-right' : '!text-left')}>
                            <p className={cn("text-sm text-muted-foreground mb-1 flex items-center gap-1", flexDirection)}>
                                <Phone className={cn("h-4 w-4", iconMargin('md'))} />
                                {t('phone')}
                            </p>
                            <p className={cn("font-medium font-mono", isRTL ? '!text-right' : '!text-left')} dir="ltr">{admin.phone}</p>
                        </div>

                        <div className={cn(isRTL ? '!text-right' : '!text-left')}>
                            <p className={cn("text-sm text-muted-foreground mb-1", isRTL ? '!text-right' : '!text-left')}>{t('roles')}</p>
                            <div className={cn("flex flex-wrap gap-1", flexDirection)}>
                                {admin.roles?.map((role, index) => (
                                    <Badge key={index} variant="outline" className={cn("text-xs", isRTL ? '!text-right' : '!text-left')}>
                                        {role.alias || role.name}
                                    </Badge>
                                )) || <span className={cn("text-sm text-muted-foreground", isRTL ? '!text-right' : '!text-left')}>{t('no_roles')}</span>}
                            </div>
                        </div>

                        <div className={cn(isRTL ? '!text-right' : '!text-left')}>
                            <p className={cn("text-sm text-muted-foreground mb-1 flex items-center gap-1", flexDirection)}>
                                <Calendar className={cn("h-4 w-4", iconMargin('md'))} />
                                {t('created_at')}
                            </p>
                            <p className={cn("font-medium", isRTL ? '!text-right' : '!text-left')} dir={dir}>
                                {new Date(admin.created_at).toLocaleDateString(locale === 'ar' ? 'ar-SA' : 'en-US', {
                                    year: 'numeric',
                                    month: 'long',
                                    day: 'numeric',
                                    hour: '2-digit',
                                    minute: '2-digit',
                                })}
                            </p>
                        </div>

                        <div className={cn(isRTL ? '!text-right' : '!text-left')}>
                            <p className={cn("text-sm text-muted-foreground mb-1 flex items-center gap-1", flexDirection)}>
                                <Calendar className={cn("h-4 w-4", iconMargin('md'))} />
                                {t('updated_at')}
                            </p>
                            <p className={cn("font-medium", isRTL ? '!text-right' : '!text-left')} dir={dir}>
                                {new Date(admin.updated_at).toLocaleDateString(locale === 'ar' ? 'ar-SA' : 'en-US', {
                                    year: 'numeric',
                                    month: 'long',
                                    day: 'numeric',
                                    hour: '2-digit',
                                    minute: '2-digit',
                                })}
                            </p>
                        </div>
                    </div>
                </div>

                {isSystemAdmin && (
                    <div className={cn("rounded-lg border border-purple-200 dark:border-purple-800 bg-purple-50 dark:bg-purple-900/20 p-4", isRTL ? '!text-right' : '!text-left')}>
                        <div className={cn("flex items-center gap-2", flexDirection)}>
                            <Shield className={cn("h-5 w-5 text-purple-600 dark:text-purple-400", iconMargin('md'))} />
                            <p className={cn("text-sm text-purple-800 dark:text-purple-300", isRTL ? '!text-right' : '!text-left')} dir={dir}>
                                <strong>{t('system_admin_notice')}</strong> {t('system_admin_description')}
                            </p>
                        </div>
                    </div>
                )}
            </ViewPageLayout>
        </AppLayout>
    );
}
