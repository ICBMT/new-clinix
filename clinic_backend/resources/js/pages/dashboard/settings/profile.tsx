import ProfileController from '@/actions/App/Http/Controllers/Dashboard/ProfileController';
import { send } from '@/routes/verification';
import { type BreadcrumbItem, type SharedData } from '@/types';
import { Transition } from '@headlessui/react';
import { Form, Head, Link, usePage } from '@inertiajs/react';

import DeleteUser from '@/components/delete-user';
import HeadingSmall from '@/components/heading-small';
import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { useRTLInit } from '@/hooks/use-rtl-init';
import { useTranslation } from '@/hooks/use-translation';
import { usePermissions } from '@/hooks/use-permissions';
import { useRTL } from '@/hooks/use-rtl';
import AppLayout from '@/layouts/app-layout';
import SettingsLayout from '@/layouts/dashboard/settings-layout';
import { edit } from '@/routes/dashboard/profile';
import { useState } from 'react';
import { Upload, X } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function Profile({
    mustVerifyEmail,
    status,
}: {
    mustVerifyEmail: boolean;
    status?: string;
}) {
    useRTLInit();
    const { t, locale } = useTranslation();
    const { isRTL, dir, textAlign, flexDirection, iconMargin, getFieldDir, getInputTextAlign } = useRTL();
    const { auth } = usePage<SharedData>().props;
    const { can, isSuperAdmin } = usePermissions();
    const [avatarPreview, setAvatarPreview] = useState<string | null>(auth.user.avatar || null);
    const [avatarFile, setAvatarFile] = useState<File | null>(null);
    
    // Hide delete account button for super admin
    // Super admin should never be able to delete their account
    const canDelete = !isSuperAdmin && can('profile.destroy');
    
    const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setAvatarFile(file);
            const reader = new FileReader();
            reader.onloadend = () => {
                setAvatarPreview(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };
    
    const handleRemoveAvatar = () => {
        setAvatarFile(null);
        setAvatarPreview(null);
    };
    
    const breadcrumbs: BreadcrumbItem[] = [
        {
            title: t('profile_settings'),
            href: edit().url,
        },
    ];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={t('profile_settings')} />

            <SettingsLayout>
                <div className={cn("space-y-6", isRTL ? '!text-right' : '!text-left')} dir={dir}>
                    <HeadingSmall
                        title={t('profile_information')}
                        description={t('profile_description')}
                    />

                    <Form
                        {...ProfileController.update.form()}
                        options={{
                            preserveScroll: true,
                        }}
                        className={cn("space-y-6", isRTL ? '!text-right' : '!text-left')}
                        dir={dir}
                        encType="multipart/form-data"
                    >
                        {({ processing, recentlySuccessful, errors, data, setData }) => (
                            <>
                                {/* Avatar Upload */}
                                <div className={cn("grid gap-2", isRTL ? '!text-right' : '!text-left')} dir={dir}>
                                    <Label className={cn(isRTL ? '!text-right' : '!text-left')} dir={dir}>{t('profile_picture') || t('avatar')}</Label>
                                    <div className={cn("flex items-center gap-4", flexDirection)}>
                                        <Avatar className="h-20 w-20">
                                            <AvatarImage src={avatarPreview || auth.user.avatar || undefined} alt={auth.user.name} />
                                            <AvatarFallback className="bg-primary/10 text-primary font-semibold text-lg">
                                                {auth.user.name.charAt(0).toUpperCase()}
                                            </AvatarFallback>
                                        </Avatar>
                                        <div className={cn("flex flex-col gap-2", isRTL ? '!text-right' : '!text-left')} dir={dir}>
                                            <Label
                                                htmlFor="avatar"
                                                className={cn("cursor-pointer flex items-center gap-2 px-4 py-2 border rounded-md hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors bg-white dark:bg-slate-800", flexDirection)}
                                            >
                                                <Upload className={cn("h-4 w-4", iconMargin('md'))} />
                                                <span className={cn(isRTL ? '!text-right' : '!text-left')} dir={dir}>{avatarPreview ? t('change_avatar') || t('change') : t('upload_avatar') || t('upload')}</span>
                                            </Label>
                                            <Input
                                                id="avatar"
                                                type="file"
                                                accept="image/*"
                                                className="hidden"
                                                onChange={(e) => {
                                                    handleAvatarChange(e);
                                                    const file = e.target.files?.[0];
                                                    if (file) {
                                                        setData('avatar', file);
                                                    }
                                                }}
                                            />
                                            {avatarPreview && (
                                                <Button
                                                    type="button"
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={handleRemoveAvatar}
                                                    className={cn("text-red-600 hover:text-red-700 hover:bg-red-50", flexDirection)}
                                                >
                                                    <X className={cn("h-4 w-4", iconMargin('md'))} />
                                                    {t('remove')}
                                                </Button>
                                            )}
                                        </div>
                                    </div>
                                    <p className={cn("text-xs text-muted-foreground", isRTL ? '!text-right' : '!text-left')} dir={dir}>
                                        {t('avatar_hint')}
                                    </p>
                                    {errors.avatar && (
                                        <InputError
                                            className={cn("mt-2", isRTL ? '!text-right' : '!text-left')}
                                            message={errors.avatar}
                                        />
                                    )}
                                </div>

                                <div className={cn("grid gap-2", isRTL ? '!text-right' : '!text-left')} dir={dir}>
                                    <Label htmlFor="name" className={cn(isRTL ? '!text-right' : '!text-left')} dir={dir}>{t('name')}</Label>

                                    <Input
                                        id="name"
                                        dir={getFieldDir('text')}
                                        className={cn("mt-1 block w-full dark:bg-slate-800 dark:text-slate-100 dark:border-slate-600", getInputTextAlign('text'))}
                                        defaultValue={auth.user.name}
                                        name="name"
                                        required
                                        autoComplete="name"
                                        placeholder={t('full_name')}
                                    />

                                    <InputError
                                        className={cn("mt-2", isRTL ? '!text-right' : '!text-left')}
                                        message={errors.name}
                                    />
                                </div>

                                <div className={cn("grid gap-2", isRTL ? '!text-right' : '!text-left')} dir={dir}>
                                    <Label htmlFor="email" className={cn(isRTL ? '!text-right' : '!text-left')} dir={dir}>{t('email_address')}</Label>

                                    <Input
                                        id="email"
                                        type="email"
                                        dir={getFieldDir('email')}
                                        className={cn("mt-1 block w-full dark:bg-slate-800 dark:text-slate-100 dark:border-slate-600", getInputTextAlign('email'))}
                                        defaultValue={auth.user.email}
                                        name="email"
                                        required
                                        autoComplete="username"
                                        placeholder={t('email_address')}
                                    />

                                    <InputError
                                        className={cn("mt-2", isRTL ? '!text-right' : '!text-left')}
                                        message={errors.email}
                                    />
                                </div>

                                {mustVerifyEmail &&
                                    auth.user.email_verified_at === null && (
                                        <div className={cn(isRTL ? '!text-right' : '!text-left')} dir={dir}>
                                            <p className={cn("-mt-4 text-sm text-muted-foreground", isRTL ? '!text-right' : '!text-left')} dir={dir}>
                                                {t('email_unverified')}{' '}
                                                <Link
                                                    href={send()}
                                                    as="button"
                                                    className={cn("text-foreground underline decoration-neutral-300 underline-offset-4 transition-colors duration-300 ease-out hover:decoration-current! dark:decoration-neutral-500", isRTL ? '!text-right' : '!text-left')}
                                                >
                                                    {t('resend_verification')}
                                                </Link>
                                            </p>

                                            {status ===
                                                'verification-link-sent' && (
                                                <div className={cn("mt-2 text-sm font-medium text-green-600", isRTL ? '!text-right' : '!text-left')} dir={dir}>
                                                    {t('verification_sent')}
                                                </div>
                                            )}
                                        </div>
                                    )}

                                <div className={cn("flex items-center gap-4", flexDirection)}>
                                    <Button
                                        disabled={processing}
                                        data-test="update-profile-button"
                                    >
                                        {t('save')}
                                    </Button>

                                    <Transition
                                        show={recentlySuccessful}
                                        enter="transition ease-in-out"
                                        enterFrom="opacity-0"
                                        leave="transition ease-in-out"
                                        leaveTo="opacity-0"
                                    >
                                        <p className={cn("text-sm text-neutral-600", isRTL ? '!text-right' : '!text-left')} dir={dir}>
                                            {t('saved')}
                                        </p>
                                    </Transition>
                                </div>
                            </>
                        )}
                    </Form>
                </div>

                {canDelete && <DeleteUser />}
            </SettingsLayout>
        </AppLayout>
    );
}
