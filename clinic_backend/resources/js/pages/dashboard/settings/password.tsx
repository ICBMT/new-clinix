import PasswordController from '@/actions/App/Http/Controllers/Dashboard/PasswordController';
import InputError from '@/components/input-error';
import { useRTLInit } from '@/hooks/use-rtl-init';
import { useTranslation } from '@/hooks/use-translation';
import { useRTL } from '@/hooks/use-rtl';
import AppLayout from '@/layouts/app-layout';
import SettingsLayout from '@/layouts/dashboard/settings-layout';
import { type BreadcrumbItem } from '@/types';
import { Transition } from '@headlessui/react';
import { Form, Head } from '@inertiajs/react';
import { useRef } from 'react';

import HeadingSmall from '@/components/heading-small';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { PasswordInput } from '@/components/password-input';
import { edit } from '@/routes/dashboard/password';
import { cn } from '@/lib/utils';

export default function Password() {
    useRTLInit();
    const { t, locale } = useTranslation();
    const { isRTL, dir, textAlign, flexDirection, iconMargin, getFieldDir, getInputTextAlign } = useRTL();
    const passwordInput = useRef<HTMLInputElement>(null);
    const currentPasswordInput = useRef<HTMLInputElement>(null);
    
    const breadcrumbs: BreadcrumbItem[] = [
        {
            title: t('password_settings'),
            href: edit().url,
        },
    ];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={t('password_settings')} />

            <SettingsLayout>
                <div className={cn("space-y-6", isRTL ? '!text-right' : '!text-left')} dir={dir}>
                    <HeadingSmall
                        title={t('update_password')}
                        description={t('password_security_description')}
                    />

                    <Form
                        {...PasswordController.update.form()}
                        options={{
                            preserveScroll: true,
                        }}
                        resetOnError={[
                            'password',
                            'password_confirmation',
                            'current_password',
                        ]}
                        resetOnSuccess
                        onError={(errors) => {
                            if (errors.password) {
                                passwordInput.current?.focus();
                            }

                            if (errors.current_password) {
                                currentPasswordInput.current?.focus();
                            }
                        }}
                        className={cn("space-y-6", isRTL ? '!text-right' : '!text-left')}
                        dir={dir}
                    >
                        {({ errors, processing, recentlySuccessful }) => (
                            <>
                                <div className={cn("grid gap-2", isRTL ? '!text-right' : '!text-left')} dir={dir}>
                                    <Label htmlFor="current_password" className={cn(isRTL ? '!text-right' : '!text-left')} dir={dir}>
                                        {t('current_password')}
                                    </Label>

                                    <PasswordInput
                                        id="current_password"
                                        ref={currentPasswordInput}
                                        name="current_password"
                                        className={cn("mt-1 block w-full", getInputTextAlign('text'))}
                                        dir={getFieldDir('text')}
                                        autoComplete="current-password"
                                        placeholder={t('current_password')}
                                        error={errors.current_password}
                                    />

                                    <InputError
                                        className={cn(isRTL ? '!text-right' : '!text-left')}
                                        message={errors.current_password}
                                    />
                                </div>

                                <div className={cn("grid gap-2", isRTL ? '!text-right' : '!text-left')} dir={dir}>
                                    <Label htmlFor="password" className={cn(isRTL ? '!text-right' : '!text-left')} dir={dir}>
                                        {t('new_password')}
                                    </Label>

                                    <PasswordInput
                                        id="password"
                                        ref={passwordInput}
                                        name="password"
                                        className={cn("mt-1 block w-full", getInputTextAlign('text'))}
                                        dir={getFieldDir('text')}
                                        autoComplete="new-password"
                                        placeholder={t('new_password')}
                                        error={errors.password}
                                        showValidation={true}
                                    />

                                    <InputError 
                                        className={cn(isRTL ? '!text-right' : '!text-left')}
                                        message={errors.password} 
                                    />
                                </div>

                                <div className={cn("grid gap-2", isRTL ? '!text-right' : '!text-left')} dir={dir}>
                                    <Label htmlFor="password_confirmation" className={cn(isRTL ? '!text-right' : '!text-left')} dir={dir}>
                                        {t('confirm_password')}
                                    </Label>

                                    <PasswordInput
                                        id="password_confirmation"
                                        name="password_confirmation"
                                        className={cn("mt-1 block w-full", getInputTextAlign('text'))}
                                        dir={getFieldDir('text')}
                                        autoComplete="new-password"
                                        placeholder={t('confirm_password')}
                                        error={errors.password_confirmation}
                                    />

                                    <InputError
                                        className={cn(isRTL ? '!text-right' : '!text-left')}
                                        message={errors.password_confirmation}
                                    />
                                </div>

                                <div className={cn("flex items-center gap-4", flexDirection)}>
                                    <Button
                                        disabled={processing}
                                        data-test="update-password-button"
                                    >
                                        {t('save_password')}
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
            </SettingsLayout>
        </AppLayout>
    );
}
