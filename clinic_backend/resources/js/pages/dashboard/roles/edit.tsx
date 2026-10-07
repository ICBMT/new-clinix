import { type BreadcrumbItem } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { PermissionTable } from '@/components/permission-table';
import { FormPageLayout, FormContent, PageHeader } from '@/components/page-layouts';
import { useRTLInit } from '@/hooks/use-rtl-init';
import { useTranslation } from '@/hooks/use-translation';
import { useRTL } from '@/hooks/use-rtl';
import AppLayout from '@/layouts/app-layout';
import { Head, Link, useForm, usePage } from '@inertiajs/react';
import { index as dashboard } from '@/routes/dashboard';
import { ArrowLeft, Eye } from 'lucide-react';
import { FormEventHandler, useEffect } from 'react';
import { customToast } from '@/components/ui/custom-toast';
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
    permissions: Permission[];
}

interface EditRoleProps {
    role: Role;
    permissionGroups: Record<string, any>;
}

export default function EditRole({ role, permissionGroups }: EditRoleProps) {
    useRTLInit();
    const { t, locale } = useTranslation();
    const page = usePage<SharedData>();
    const { locale: pageLocale } = page.props;
    const isRTL = pageLocale === 'ar';
    const dir = isRTL ? 'rtl' : 'ltr';
    const { flexDirection, iconMargin, getFieldDir, getInputTextAlign } = useRTL();
    const { flash } = usePage<SharedData>().props;

    const { data, setData, patch, processing, errors } = useForm({
        name: role.name,
        alias: role.alias || '',
        guard_name: role.guard_name,
        permissions: role.permissions.map((p) => p.name),
    });

    // Flash messages
    useEffect(() => {
        if (flash?.success) {
            customToast.success(flash.success, role.alias || role.name);
        }
        if (flash?.error) {
            customToast.error(flash.error);
        }
    }, [flash, role.alias, role.name]);

    const handleSubmit: FormEventHandler = (e) => {
        e.preventDefault();
        patch(`/dashboard/roles/${role.id}`);
    };

    const handlePermissionsChange = (permissions: string[]) => {
        setData('permissions', permissions);
    };

    const isSystemRole = ['super-admin'].includes(role.name);

    const breadcrumbItems: BreadcrumbItem[] = [
        { title: t('dashboard'), href: dashboard.url() },
        { title: t('role_management'), href: '/dashboard/roles' },
        { title: t('edit_role'), href: '#' },
    ];

    return (
        <AppLayout breadcrumbs={breadcrumbItems}>
            <Head title={t('edit_role')} />

            <FormPageLayout>
                <PageHeader
                    title={t('edit_role')}
                    description={t('update_role_information')}
                    actions={
                        <div className={cn("flex items-center gap-3", flexDirection)}>
                            <Link href={`/dashboard/roles/${role.id}`}>
                                <Button variant="outline" className={cn("flex items-center gap-2", flexDirection)}>
                                    <Eye className={cn("h-4 w-4", iconMargin('md'))} />
                                    {t('view')}
                                </Button>
                            </Link>
                            <Link href="/dashboard/roles">
                                <Button variant="outline" className={cn("flex items-center gap-2", flexDirection)}>
                                    <ArrowLeft className={cn("h-4 w-4", isRTL && 'rotate-180', iconMargin('md'))} />
                                    {t('back')}
                                </Button>
                            </Link>
                        </div>
                    }
                />

                {isSystemRole && (
                    <div className={cn("rounded-lg border border-orange-200 bg-orange-50 dark:bg-orange-900/20 p-4", isRTL ? '!text-right' : '!text-left')}>
                        <p className={cn("text-sm text-orange-800 dark:text-orange-300", isRTL ? '!text-right' : '!text-left')} dir={dir}>
                            ⚠️ {t('system_role_warning')}
                        </p>
                    </div>
                )}

                <FormContent onSubmit={handleSubmit} className="w-full">
                    {/* Basic Information */}
                    <div className={cn("rounded-lg border bg-card p-6", isRTL ? '!text-right' : '!text-left')}>
                        <h3 className={cn("text-lg font-semibold mb-4", isRTL ? '!text-right' : '!text-left')}>{t('basic_information')}</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className={cn("space-y-2", isRTL ? '!text-right' : '!text-left')}>
                                <Label htmlFor="alias" className={cn(isRTL ? '!text-right' : '!text-left')}>
                                    {isRTL ? <><span className="text-red-500">*</span> {t('role_alias')}</> : <>{t('role_alias')} <span className="text-red-500">*</span></>}
                                </Label>
                                <Input
                                    id="alias"
                                    type="text"
                                    value={data.alias || ''}
                                    onChange={(e) => {
                                        const alias = e.target.value;
                                        const generatedName = alias.toLowerCase()
                                            .replace(/[^a-z0-9\s]/g, '') // Remove special chars
                                            .replace(/\s+/g, '-') // Replace spaces with hyphens
                                            .replace(/-+/g, '-') // Replace multiple hyphens with single
                                            .replace(/^-|-$/g, ''); // Remove leading/trailing hyphens
                                        
                                        setData('alias', alias);
                                        setData('name', generatedName);
                                    }}
                                    placeholder={t('role_alias_placeholder')}
                                    dir={getFieldDir('text')}
                                    className={cn(errors.alias ? 'border-destructive' : '', getInputTextAlign('text'))}
                                    disabled={isSystemRole}
                                    required
                                />
                                {errors.alias && (
                                    <p className={cn("text-sm text-destructive", isRTL ? '!text-right' : '!text-left')} dir={dir}>{errors.alias}</p>
                                )}
                                {!isSystemRole && (
                                    <p className={cn("text-xs text-muted-foreground", isRTL ? '!text-right' : '!text-left')} dir={dir}>
                                        {t('role_alias_description')}
                                    </p>
                                )}
                            </div>

                            <div className={cn("space-y-2", isRTL ? '!text-right' : '!text-left')}>
                                <Label htmlFor="name" className={cn(isRTL ? '!text-right' : '!text-left')}>
                                    {isRTL ? <><span className="text-red-500">*</span> {t('role_name')}</> : <>{t('role_name')} <span className="text-red-500">*</span></>}
                                </Label>
                                <Input
                                    id="name"
                                    type="text"
                                    value={data.name}
                                    onChange={(e) => setData('name', e.target.value)}
                                    placeholder={t('role_name_placeholder')}
                                    dir={getFieldDir('text')}
                                    className={cn(errors.name ? 'border-destructive' : '', "bg-muted", getInputTextAlign('text'))}
                                    disabled={isSystemRole}
                                    required
                                    readOnly
                                />
                                {errors.name && (
                                    <p className={cn("text-sm text-destructive", isRTL ? '!text-right' : '!text-left')} dir={dir}>{errors.name}</p>
                                )}
                                {!isSystemRole && (
                                    <p className={cn("text-xs text-muted-foreground", isRTL ? '!text-right' : '!text-left')} dir={dir}>
                                        {t('role_name_auto_generated')}
                                    </p>
                                )}
                            </div>
                        </div>

                        <div className="grid grid-cols-1 gap-4 mt-4">
                            <div className={cn("space-y-2", isRTL ? '!text-right' : '!text-left')}>
                                <Label htmlFor="guard_name" className={cn(isRTL ? '!text-right' : '!text-left')}>{t('guard_name')}</Label>
                                <Input
                                    id="guard_name"
                                    type="text"
                                    value={data.guard_name}
                                    disabled
                                    dir={getFieldDir('text')}
                                    className={cn("bg-muted", getInputTextAlign('text'))}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Permissions */}
                    <div className={cn("rounded-lg border bg-card p-6", isRTL ? '!text-right' : '!text-left')}>
                        <div className={cn("mb-4", isRTL ? '!text-right' : '!text-left')}>
                            <h3 className={cn("text-lg font-semibold", isRTL ? '!text-right' : '!text-left')}>{t('permissions')}</h3>
                            <p className={cn("text-sm text-muted-foreground", isRTL ? '!text-right' : '!text-left')} dir={dir}>
                                {t('assign_permissions_to_role')}
                            </p>
                        </div>

                        <PermissionTable
                            permissionGroups={permissionGroups}
                            selectedPermissions={data.permissions}
                            onChange={handlePermissionsChange}
                            readonly={isSystemRole}
                        />

                        {errors.permissions && (
                            <p className={cn("text-sm text-destructive mt-2", isRTL ? '!text-right' : '!text-left')} dir={dir}>{errors.permissions}</p>
                        )}
                    </div>

                    {/* Submit Button */}
                    <div className={cn("flex items-center gap-3 pt-4 border-t", flexDirection)}>
                        <Button type="submit" disabled={processing || isSystemRole}>
                            {processing ? t('updating') : t('update_role')}
                        </Button>
                        <Link href="/dashboard/roles">
                            <Button type="button" variant="outline">
                                {t('cancel')}
                            </Button>
                        </Link>
                    </div>
                </FormContent>
            </FormPageLayout>
        </AppLayout>
    );
}
