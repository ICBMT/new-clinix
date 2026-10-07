import { type BreadcrumbItem } from '@/types';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { PermissionTable } from '@/components/permission-table';
import { ViewPageLayout, PageHeader } from '@/components/page-layouts';
import { useRTLInit } from '@/hooks/use-rtl-init';
import { useTranslation } from '@/hooks/use-translation';
import { useRTL } from '@/hooks/use-rtl';
import AppLayout from '@/layouts/app-layout';
import { index as dashboard } from '@/routes/dashboard';
import { Head, Link, usePage } from '@inertiajs/react';
import { ArrowLeft, Edit, Shield, Users, Calendar } from 'lucide-react';
import { cn } from '@/lib/utils';
import { type SharedData } from '@/types';

interface Permission {
    id: number;
    name: string;
}

interface Role {
    id: number;
    name: string;
    alias?: string;
    guard_name: string;
    users_count: number;
    created_at: string;
    updated_at: string;
    permissions: Permission[];
}

interface ShowRoleProps {
    role: Role;
    permissionGroups: Record<string, any>;
}

export default function ShowRole({ role, permissionGroups }: ShowRoleProps) {
    useRTLInit();
    const { t, locale } = useTranslation();
    const page = usePage<SharedData>();
    const { locale: pageLocale } = page.props;
    const isRTL = pageLocale === 'ar';
    const dir = isRTL ? 'rtl' : 'ltr';
    const { flexDirection, iconMargin } = useRTL();

    const isSystemRole = ['super-admin'].includes(role.name);

    const breadcrumbItems: BreadcrumbItem[] = [
        { title: t('dashboard'), href: dashboard.url() },
        { title: t('role_management'), href: '/dashboard/roles' },
        { title: t('view_role'), href: `/dashboard/roles/${role.id}` },
    ];

    return (
        <AppLayout breadcrumbs={breadcrumbItems}>
            <Head title={t('view_role')} />

            <ViewPageLayout>
                <PageHeader
                    title={t('view_role')}
                    description={t('view_role_information')}
                    actions={
                        <div className={cn("flex items-center gap-3", flexDirection)}>
                            {!isSystemRole && (
                                <Link href={`/dashboard/roles/${role.id}/edit`}>
                                    <Button className={cn("flex items-center gap-2", flexDirection)}>
                                        <Edit className={cn("h-4 w-4", iconMargin('md'))} />
                                        {t('edit_role')}
                                    </Button>
                                </Link>
                            )}
                            <Link href="/dashboard/roles">
                                <Button variant="outline" className={cn("flex items-center gap-2", flexDirection)}>
                                    <ArrowLeft className={cn("h-4 w-4", isRTL && 'rotate-180', iconMargin('md'))} />
                                    {t('back')}
                                </Button>
                            </Link>
                        </div>
                    }
                />

                {/* Role Information */}
                <div className={cn("rounded-lg border bg-card p-6", isRTL ? '!text-right' : '!text-left')}>
                    <h3 className={cn("text-lg font-semibold mb-4 flex items-center gap-2", flexDirection)}>
                        <Shield className={cn("h-5 w-5 text-primary", iconMargin('md'))} />
                        {t('role_information')}
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        <div className={cn(isRTL ? '!text-right' : '!text-left')}>
                            <p className={cn("text-sm text-muted-foreground mb-1", isRTL ? '!text-right' : '!text-left')}>{t('role_alias')}</p>
                            <p className={cn("font-medium", isRTL ? '!text-right' : '!text-left')} dir={dir}>{role.alias || role.name}</p>
                        </div>

                        <div className={cn(isRTL ? '!text-right' : '!text-left')}>
                            <p className={cn("text-sm text-muted-foreground mb-1", isRTL ? '!text-right' : '!text-left')}>{t('role_name')}</p>
                            <div className={cn("flex items-center gap-2", flexDirection)}>
                                <p className={cn("font-medium", isRTL ? '!text-right' : '!text-left')} dir="ltr">{role.name}</p>
                                {isSystemRole && (
                                    <Badge variant="secondary" className={cn("text-xs", isRTL ? '!text-right' : '!text-left')}>
                                        {t('system')}
                                    </Badge>
                                )}
                            </div>
                        </div>

                        <div className={cn(isRTL ? '!text-right' : '!text-left')}>
                            <p className={cn("text-sm text-muted-foreground mb-1", isRTL ? '!text-right' : '!text-left')}>{t('guard_name')}</p>
                            <p className={cn("font-medium", isRTL ? '!text-right' : '!text-left')} dir="ltr">{role.guard_name}</p>
                        </div>

                        <div className={cn(isRTL ? '!text-right' : '!text-left')}>
                            <p className={cn("text-sm text-muted-foreground mb-1 flex items-center gap-1", flexDirection)}>
                                <Users className={cn("h-4 w-4", iconMargin('md'))} />
                                {t('users_count')}
                            </p>
                            <p className={cn("font-medium", isRTL ? '!text-right' : '!text-left')} dir="ltr">
                                {role.users_count} {role.users_count === 1 ? t('user') : t('users')}
                            </p>
                        </div>

                        <div className={cn(isRTL ? '!text-right' : '!text-left')}>
                            <p className={cn("text-sm text-muted-foreground mb-1 flex items-center gap-1", flexDirection)}>
                                <Calendar className={cn("h-4 w-4", iconMargin('md'))} />
                                {t('created_at')}
                            </p>
                            <p className={cn("font-medium", isRTL ? '!text-right' : '!text-left')} dir={dir}>
                                {new Date(role.created_at).toLocaleDateString()}
                            </p>
                        </div>

                        <div className={cn(isRTL ? '!text-right' : '!text-left')}>
                            <p className={cn("text-sm text-muted-foreground mb-1 flex items-center gap-1", flexDirection)}>
                                <Calendar className={cn("h-4 w-4", iconMargin('md'))} />
                                {t('updated_at')}
                            </p>
                            <p className={cn("font-medium", isRTL ? '!text-right' : '!text-left')} dir={dir}>
                                {new Date(role.updated_at).toLocaleDateString()}
                            </p>
                        </div>

                        <div className={cn(isRTL ? '!text-right' : '!text-left')}>
                            <p className={cn("text-sm text-muted-foreground mb-1", isRTL ? '!text-right' : '!text-left')}>{t('permissions')}</p>
                            <Badge variant="secondary" className={cn(isRTL ? '!text-right' : '!text-left')} dir="ltr">
                                {role.permissions.length} {t('permissions')}
                            </Badge>
                        </div>
                    </div>
                </div>

                {/* Permissions */}
                <div className={cn("rounded-lg border bg-card p-6", isRTL ? '!text-right' : '!text-left')}>
                    <div className={cn("mb-4", isRTL ? '!text-right' : '!text-left')}>
                        <h3 className={cn("text-lg font-semibold", isRTL ? '!text-right' : '!text-left')}>{t('assigned_permissions')}</h3>
                        <p className={cn("text-sm text-muted-foreground", isRTL ? '!text-right' : '!text-left')} dir={dir}>
                            {role.permissions.length > 0
                                ? t('permission_count', { count: role.permissions.length.toString() })
                                : t('no_permissions_assigned')}
                        </p>
                    </div>

                    {role.permissions.length > 0 ? (
                        <PermissionTable
                            permissionGroups={permissionGroups}
                            selectedPermissions={role.permissions.map((p) => p.name)}
                            readonly
                        />
                    ) : (
                        <div className={cn("text-center py-8 text-muted-foreground", isRTL ? '!text-right' : '!text-left')} dir={dir}>
                            {t('no_permissions_assigned')}
                        </div>
                    )}
                </div>
            </ViewPageLayout>
        </AppLayout>
    );
}
