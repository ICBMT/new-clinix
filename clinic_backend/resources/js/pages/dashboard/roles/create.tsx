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
import { index as dashboard } from '@/routes/dashboard';
import { Head, Link, useForm, usePage } from '@inertiajs/react';
import { ArrowLeft } from 'lucide-react';
import { FormEventHandler } from 'react';
import { cn } from '@/lib/utils';
import { type SharedData } from '@/types';

interface CreateRoleProps {
    permissionGroups: Record<string, any>;
}

export default function CreateRole({ permissionGroups }: CreateRoleProps) {
    useRTLInit();
    const { t, locale } = useTranslation();
    const page = usePage<SharedData>();
    const { locale: pageLocale } = page.props;
    const isRTL = pageLocale === 'ar';
    const dir = isRTL ? 'rtl' : 'ltr';
    const { flexDirection, iconMargin, getFieldDir, getInputTextAlign } = useRTL();

    const { data, setData, post, processing, errors } = useForm({
        name: '',
        guard_name: 'web',
        permissions: [] as string[],
    });

    const handleSubmit: FormEventHandler = (e) => {
        e.preventDefault();
        post('/dashboard/roles');
    };

    const handlePermissionsChange = (permissions: string[]) => {
        setData('permissions', permissions);
    };

    const breadcrumbItems: BreadcrumbItem[] = [
        { title: t('dashboard'), href: dashboard.url() },
        { title: t('role_management'), href: '/dashboard/roles' },
        { title: t('create_role'), href: '/dashboard/roles/create' },
    ];

    return (
        <AppLayout breadcrumbs={breadcrumbItems}>
            <Head title={t('create_role')} />

            <FormPageLayout>
                <PageHeader
                    title={t('create_role')}
                    description={t('create_new_role')}
                    actions={
                        <Link href="/dashboard/roles">
                            <Button variant="outline" className={cn("flex items-center gap-2", flexDirection)}>
                                <ArrowLeft className={cn("h-4 w-4", isRTL && 'rotate-180', iconMargin('md'))} />
                                {t('back')}
                            </Button>
                        </Link>
                    }
                />

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
                                    required
                                />
                                {errors.alias && (
                                    <p className={cn("text-sm text-destructive", isRTL ? '!text-right' : '!text-left')} dir={dir}>{errors.alias}</p>
                                )}
                                <p className={cn("text-xs text-muted-foreground", isRTL ? '!text-right' : '!text-left')} dir={dir}>
                                    {t('role_alias_description')}
                                </p>
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
                                    required
                                    readOnly
                                />
                                {errors.name && (
                                    <p className={cn("text-sm text-destructive", isRTL ? '!text-right' : '!text-left')} dir={dir}>{errors.name}</p>
                                )}
                                <p className={cn("text-xs text-muted-foreground", isRTL ? '!text-right' : '!text-left')} dir={dir}>
                                    {t('role_name_auto_generated')}
                                </p>
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
                        />

                        {errors.permissions && (
                            <p className={cn("text-sm text-destructive mt-2", isRTL ? '!text-right' : '!text-left')} dir={dir}>{errors.permissions}</p>
                        )}
                    </div>

                    {/* Submit Button */}
                    <div className={cn("flex items-center gap-3 pt-4 border-t", flexDirection)}>
                        <Button type="submit" disabled={processing}>
                            {processing ? t('creating') : t('create_role')}
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
