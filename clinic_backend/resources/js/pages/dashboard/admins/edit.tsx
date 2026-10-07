import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { FormPageLayout, FormContent, PageHeader } from '@/components/page-layouts';
import { useTranslation } from '@/hooks/use-translation';
import { useRTL } from '@/hooks/use-rtl';
import { useRTLInit } from '@/hooks/use-rtl-init';
import AppLayout from '@/layouts/app-layout';
import { Head, Link, useForm, usePage } from '@inertiajs/react';
import { index as dashboard } from '@/routes/dashboard';
import { ArrowLeft, Eye } from 'lucide-react';
import { FormEventHandler, useEffect } from 'react';
import { customToast } from '@/components/ui/custom-toast';
import { type BreadcrumbItem } from '@/types';
import { PasswordInput } from '@/components/password-input';
import { PhoneInput } from '@/components/phone-input';
import { cn } from '@/lib/utils';
import { type SharedData } from '@/types';

interface AvailableRole {
    value: string;
    label: string;
}

interface Admin {
    id: number;
    name: string;
    email: string;
    phone: string;
    roles: Array<{
        name: string;
    }>;
}

interface EditAdminProps {
    admin: Admin;
    availableRoles: AvailableRole[];
}

export default function EditAdmin({ admin, availableRoles }: EditAdminProps) {
    useRTLInit();
    const { t, locale } = useTranslation();
    const page = usePage<SharedData>();
    const { locale: pageLocale } = page.props;
    const isRTL = pageLocale === 'ar';
    const dir = isRTL ? 'rtl' : 'ltr';
    const { flexDirection, iconMargin, getFieldDir, getInputTextAlign } = useRTL();
    const { flash } = usePage<SharedData>().props;

    // Flash messages
    useEffect(() => {
        if (flash?.success) {
            customToast.success(flash.success, admin.name);
        }
        if (flash?.error) {
            customToast.error(flash.error);
        }
    }, [flash, admin.name]);

    // Get the current admin's role, ensuring it exists in availableRoles
    const currentRole = admin.roles?.[0]?.name || '';
    const validRole = availableRoles.some(r => r.value === currentRole) 
        ? currentRole 
        : (availableRoles[0]?.value || '');

    const { data, setData, patch, processing, errors } = useForm({
        name: admin.name,
        email: admin.email,
        phone: admin.phone,
        password: '',
        password_confirmation: '',
        role: validRole,
    });

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        patch(`/dashboard/admins/${admin.id}`, {
            onSuccess: () => {
                // Flash message will be shown via useEffect
            },
            onError: (errors) => {
                // Handle validation errors
                if (errors && Object.keys(errors).length > 0) {
                    const firstError = Object.values(errors)[0];
                    if (typeof firstError === 'string') {
                        customToast.error(firstError);
                    } else if (Array.isArray(firstError) && firstError.length > 0) {
                        customToast.error(firstError[0]);
                    }
                }
            },
        });
    };

    const isSystemAdmin = admin.roles?.some(role => role.name === 'super-admin') || false;

    const breadcrumbItems: BreadcrumbItem[] = [
        { title: t('dashboard'), href: dashboard.url() },
        { title: t('admin_management'), href: '/dashboard/admins' },
        { title: t('edit_admin'), href: `/dashboard/admins/${admin.id}/edit` },
    ];

    return (
        <AppLayout breadcrumbs={breadcrumbItems}>
            <Head title={t('edit_admin')} />

            <FormPageLayout>
                <PageHeader
                    title={t('edit_admin')}
                    description={t('update_admin_information')}
                    actions={
                        <div className={cn("flex items-center gap-3", flexDirection)}>
                            <Link href={`/dashboard/admins/${admin.id}`}>
                                <Button variant="outline" className={cn("flex items-center gap-2", flexDirection)}>
                                    <Eye className={cn("h-4 w-4", iconMargin('md'))} />
                                    {t('view')}
                                </Button>
                            </Link>
                            <Link href="/dashboard/admins">
                                <Button variant="outline" className={cn("flex items-center gap-2", flexDirection)}>
                                    <ArrowLeft className={cn("h-4 w-4", isRTL && 'rotate-180', iconMargin('md'))} />
                                    {t('back')}
                                </Button>
                            </Link>
                        </div>
                    }
                />

                {isSystemAdmin && (
                    <div className={cn("rounded-lg border border-orange-200 bg-orange-50 dark:bg-orange-900/20 p-4", isRTL ? '!text-right' : '!text-left')}>
                        <p className={cn("text-sm text-orange-800 dark:text-orange-300", isRTL ? '!text-right' : '!text-left')} dir={dir}>
                            ⚠️ {t('system_admin_warning')}
                        </p>
                    </div>
                )}

                <FormContent onSubmit={submit} className="w-full">
                    {/* Basic Information */}
                    <div className={cn("rounded-lg border bg-card p-4 sm:p-6", isRTL ? '!text-right' : '!text-left')}>
                        <h3 className={cn("text-base sm:text-lg font-semibold mb-4", isRTL ? '!text-right' : '!text-left')}>{t('basic_information')}</h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className={cn("space-y-2", isRTL ? '!text-right' : '!text-left')}>
                                <Label htmlFor="name" className={cn(isRTL ? '!text-right' : '!text-left')}>
                                    {isRTL ? <><span className="text-red-500">*</span> {t('name')}</> : <>{t('name')} <span className="text-red-500">*</span></>}
                                </Label>
                                <Input
                                    id="name"
                                    type="text"
                                    value={data.name}
                                    onChange={(e) => setData('name', e.target.value)}
                                    placeholder={t('enter_name')}
                                    dir={getFieldDir('text')}
                                    className={cn(errors.name ? 'border-destructive' : '', getInputTextAlign('text'))}
                                    disabled={isSystemAdmin}
                                    required
                                />
                                {errors.name && (
                                    <p className={cn("text-sm text-destructive", isRTL ? '!text-right' : '!text-left')} dir={dir}>{t(errors.name) || errors.name}</p>
                                )}
                            </div>

                            <div className={cn("space-y-2", isRTL ? '!text-right' : '!text-left')}>
                                <Label htmlFor="email" className={cn(isRTL ? '!text-right' : '!text-left')}>
                                    {isRTL ? <><span className="text-red-500">*</span> {t('email')}</> : <>{t('email')} <span className="text-red-500">*</span></>}
                                </Label>
                                <Input
                                    id="email"
                                    type="email"
                                    value={data.email}
                                    onChange={(e) => setData('email', e.target.value)}
                                    placeholder={t('enter_email')}
                                    dir={getFieldDir('email')}
                                    className={cn(errors.email ? 'border-destructive' : '', getInputTextAlign('email'))}
                                    disabled={isSystemAdmin}
                                    required
                                />
                                {errors.email && (
                                    <p className={cn("text-sm text-destructive", isRTL ? '!text-right' : '!text-left')} dir={dir}>{t(errors.email) || errors.email}</p>
                                )}
                            </div>

                            <div className={cn("space-y-2", isRTL ? '!text-right' : '!text-left')}>
                                <Label htmlFor="phone" className={cn(isRTL ? '!text-right' : '!text-left')}>
                                    {isRTL ? <><span className="text-red-500">*</span> {t('phone')}</> : <>{t('phone')} <span className="text-red-500">*</span></>}
                                </Label>
                                <PhoneInput
                                    id="phone"
                                    value={data.phone}
                                    onChange={(value) => setData('phone', value)}
                                    className={cn(errors.phone ? 'border-destructive' : '', getInputTextAlign('phone'))}
                                    disabled={isSystemAdmin}
                                    required
                                />
                                <p className={cn("text-xs text-muted-foreground", isRTL ? '!text-right' : '!text-left')} dir={dir}>{t('phone_format_hint')}</p>
                                {errors.phone && (
                                    <p className={cn("text-sm text-destructive", isRTL ? '!text-right' : '!text-left')} dir={dir}>{t(errors.phone) || errors.phone}</p>
                                )}
                            </div>

                            <div className={cn("space-y-2", isRTL ? '!text-right' : '!text-left')}>
                                <Label htmlFor="role" className={cn(isRTL ? '!text-right' : '!text-left')}>
                                    {isRTL ? <><span className="text-red-500">*</span> {t('role')}</> : <>{t('role')} <span className="text-red-500">*</span></>}
                                </Label>
                                <Select 
                                    value={data.role} 
                                    onValueChange={(value) => setData('role', value)}
                                    disabled={isSystemAdmin}
                                >
                                    <SelectTrigger className={cn(errors.role ? 'border-destructive' : '', isRTL ? '!text-right' : '!text-left')}>
                                        <SelectValue placeholder={t('select_role') || t('select')} />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {availableRoles.map((role) => (
                                            <SelectItem key={role.value} value={role.value} className={cn(isRTL ? '!text-right' : '!text-left')}>
                                                {role.label}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                {errors.role && (
                                    <p className={cn("text-sm text-destructive", isRTL ? '!text-right' : '!text-left')} dir={dir}>{t(errors.role) || errors.role}</p>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Password Section */}
                    <div className={cn("rounded-lg border bg-card p-4 sm:p-6", isRTL ? '!text-right' : '!text-left')}>
                        <h3 className={cn("text-base sm:text-lg font-semibold mb-4", isRTL ? '!text-right' : '!text-left')}>{t('change_password')}</h3>
                        <p className={cn("text-sm text-muted-foreground mb-4", isRTL ? '!text-right' : '!text-left')} dir={dir}>{t('password_change_description')}</p>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className={cn("space-y-2", isRTL ? '!text-right' : '!text-left')}>
                                <Label htmlFor="password" className={cn(isRTL ? '!text-right' : '!text-left')}>
                                    {t('new_password')}
                                </Label>
                                <PasswordInput
                                    id="password"
                                    value={data.password}
                                    onChange={(e) => setData('password', e.target.value)}
                                    placeholder={t('enter_new_password')}
                                    error={errors.password}
                                    showValidation={true}
                                />
                                {errors.password && (
                                    <p className={cn("text-sm text-destructive", isRTL ? '!text-right' : '!text-left')} dir={dir}>{t(errors.password) || errors.password}</p>
                                )}
                            </div>

                            <div className={cn("space-y-2", isRTL ? '!text-right' : '!text-left')}>
                                <Label htmlFor="password_confirmation" className={cn(isRTL ? '!text-right' : '!text-left')}>
                                    {t('confirm_new_password')}
                                </Label>
                                <PasswordInput
                                    id="password_confirmation"
                                    value={data.password_confirmation}
                                    onChange={(e) => setData('password_confirmation', e.target.value)}
                                    placeholder={t('confirm_new_password')}
                                    error={errors.password_confirmation}
                                />
                                {errors.password_confirmation && (
                                    <p className={cn("text-sm text-destructive", isRTL ? '!text-right' : '!text-left')} dir={dir}>{t(errors.password_confirmation) || errors.password_confirmation}</p>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Submit Button */}
                    <div className={cn("flex items-center gap-3 pt-4 border-t", flexDirection)}>
                        <Button type="submit" disabled={processing}>
                            {processing ? t('updating') : t('update_admin')}
                        </Button>
                        <Link href="/dashboard/admins">
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
