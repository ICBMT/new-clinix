import AuthenticatedSessionController from '@/actions/App/Http/Controllers/Auth/AuthenticatedSessionController';
import InputError from '@/components/input-error';
import TextLink from '@/components/text-link';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useTranslation } from '@/hooks/use-translation';
import { useRTLInit } from '@/hooks/use-rtl-init';
import { useRTL } from '@/hooks/use-rtl';
import { register } from '@/routes';
// import { request } from '@/routes/password'; // Commented out - password reset disabled
import { Form, Head, usePage, Link } from '@inertiajs/react';
import { LoaderCircle } from 'lucide-react';
import { useEffect } from 'react';
import { customToast } from '@/components/ui/custom-toast';
import { LanguageSwitcher } from '@/components/language-switcher';
import { PasswordInput } from '@/components/password-input';
import { type SharedData } from '@/types';
import { getLocalizedName } from '@/utils/localization';
import { cn } from '@/lib/utils';

interface LoginProps {
    status?: string;
    canResetPassword: boolean;
}

export default function Login({ status }: LoginProps) {
    useRTLInit();
    const { t, locale } = useTranslation();
    const page = usePage<SharedData>();
    const { locale: pageLocale, siteSettings, flash } = page.props as SharedData & { flash?: { success?: string; error?: string } };
    
    // Force RTL detection from page props
    const isRTL = pageLocale === 'ar';
    const dir = isRTL ? 'rtl' : 'ltr';
    const flexDirection = isRTL ? 'flex-row-reverse' : 'flex-row';
    
    const { 
        iconMargin, 
        getFieldDir, 
        getInputTextAlign 
    } = useRTL();
    
    const appName = getLocalizedName(siteSettings?.app_name_en, siteSettings?.app_name_ar, locale) || t('app_name');
    const appLogo = siteSettings?.app_logo;
    const appInitial = appName.charAt(0).toUpperCase();
    
    // Show toast notifications for flash messages
    useEffect(() => {
        // Ensure DOM is ready before showing toasts
        if (typeof window !== 'undefined' && document.body) {
            if (flash?.success) {
                customToast.success(flash.success);
            }
            if (flash?.error) {
                // Check if error matches session expired message (EN or AR) and use translation
                const enMessage = 'Your session has expired. Please login again.';
                const arMessage = 'انتهت صلاحية جلستك. يرجى تسجيل الدخول مرة أخرى.';
                const errorMessage = flash.error === enMessage || 
                                   flash.error === `.${enMessage}` ||
                                   flash.error === arMessage ||
                                   flash.error === `.${arMessage}` ||
                                   flash.error?.trim() === enMessage ||
                                   flash.error?.trim() === arMessage ||
                                   flash.error?.includes('Your session has expired') ||
                                   flash.error?.includes('انتهت صلاحية جلستك')
                    ? t('session_expired_please_login')
                    : flash.error;
                customToast.error(errorMessage);
            }
        }
    }, [flash, t]);
    
    return (
        <div className="min-h-screen bg-gradient-to-br from-[#A8B5FF] via-[#8B7FD9] to-[#6B46C1] dark:from-slate-900 dark:via-[#4C1D95] dark:to-[#3B0F6B] flex items-center justify-center p-6 relative" dir={dir}>
            {/* Logo */}
            <div className={cn("absolute top-6 z-10", isRTL ? "right-6" : "left-6")}>
                <Link href="/" className={cn("flex items-center gap-3", flexDirection)}>
                    {appLogo ? (
                        <img
                            src={appLogo}
                            alt={appName}
                            className="h-8 w-8 object-contain"
                        />
                    ) : (
                        <div className="h-8 w-8 rounded bg-primary-gradient flex items-center justify-center">
                            <span className="text-white text-sm font-bold">{appInitial}</span>
                        </div>
                    )}
                    <div className={cn("text-xl font-bold text-slate-800 dark:text-slate-100", isRTL ? "!text-right" : "!text-left")}>
                        {appName}
                    </div>
                </Link>
            </div>
            {/* Language Switcher */}
            <div className={cn("absolute top-6 z-10", isRTL ? "left-6" : "right-6")}>
                <LanguageSwitcher />
            </div>
            <div className="w-full max-w-md">
                {/* Header */}
                <div className="text-center mb-8">
                    <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100 mb-2 text-center">
                        {t('log_in')}
                    </h1>
                    <p className={cn("text-slate-600 dark:text-slate-300 text-center")}>
                        {t('login_now_to_access_your_dashboard')}
                    </p>
                </div>

                {/* Main Card */}
                <div className={cn("bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-2xl p-8 border border-slate-200/50 dark:border-slate-700/50 shadow-xl", isRTL ? "!text-right" : "!text-left")} dir={dir}>
                    <Head title={t('log_in')} />

                    {flash?.error && (
                        <div
                            className={cn("mb-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl text-sm font-medium text-red-700 dark:text-red-300", isRTL ? "!text-right" : "!text-left")}
                            dir={dir}
                        >
                            {(() => {
                                // Check if error matches session expired message (EN or AR) and use translation
                                const enMessage = 'Your session has expired. Please login again.';
                                const arMessage = 'انتهت صلاحية جلستك. يرجى تسجيل الدخول مرة أخرى.';
                                const isSessionExpired = flash.error === enMessage || 
                                                       flash.error === `.${enMessage}` ||
                                                       flash.error === arMessage ||
                                                       flash.error === `.${arMessage}` ||
                                                       flash.error?.trim() === enMessage ||
                                                       flash.error?.trim() === arMessage ||
                                                       flash.error?.includes('Your session has expired') ||
                                                       flash.error?.includes('انتهت صلاحية جلستك');
                                return isSessionExpired ? t('session_expired_please_login') : flash.error;
                            })()}
                        </div>
                    )}

                    <Form
                        {...AuthenticatedSessionController.store.form()}
                        className="flex flex-col gap-6"
                        onSuccess={() => {
                            // Reload page after login to ensure layout is properly loaded
                            setTimeout(() => {
                                window.location.reload();
                            }, 100);
                        }}
                    >
                        {({ processing, errors }) => (
                            <>
                                <div className="grid gap-6">
                                    <div className={cn("grid gap-3", isRTL ? "!text-right" : "!text-left")}>
                                        <Label htmlFor="email" className={cn(isRTL ? "!text-right" : "!text-left")}>{t('email_address')}</Label>
                                        <Input
                                            id="email"
                                            type="email"
                                            name="email"
                                            required
                                            autoFocus
                                            tabIndex={1}
                                            autoComplete="off"
                                            placeholder={t('email_example')}
                                            dir={getFieldDir('email')}
                                            className={cn(
                                                "bg-white/50 dark:bg-slate-700/50 border-slate-200 dark:border-slate-600 focus:border-primary focus:ring-primary dark:text-slate-100",
                                                getInputTextAlign('email')
                                            )}
                                        />
                                        <div className={cn(isRTL ? "!text-right" : "!text-left")} dir={dir}>
                                            <InputError message={errors.email} className="inline-block" />
                                        </div>
                                    </div>

                                    <div className={cn("grid gap-2", isRTL ? "!text-right" : "!text-left")}>
                                        <Label htmlFor="password" className={cn(isRTL ? "!text-right" : "!text-left")}>{t('password')}</Label>
                                        <PasswordInput
                                            id="password"
                                            name="password"
                                            required
                                            tabIndex={2}
                                            autoComplete="off"
                                            placeholder={t('password')}
                                            className={cn(
                                                "bg-white/50 dark:bg-slate-700/50 border-slate-200 dark:border-slate-600 focus:border-primary focus:ring-primary dark:text-slate-100",
                                                getInputTextAlign('text')
                                            )}
                                            error={errors.password}
                                        />
                                        <div className={cn(isRTL ? "!text-right" : "!text-left")} dir={dir}>
                                            <InputError message={errors.password} className="inline-block" />
                                        </div>
                                    </div>

                                    <div className={cn("flex items-center justify-between", flexDirection)}>
                                        <div className={cn("flex items-center gap-4", flexDirection)}>
                                            <Checkbox
                                                id="remember"
                                                name="remember"
                                                value="1"
                                                tabIndex={3}
                                            />
                                            <Label htmlFor="remember" className={cn("text-slate-700 dark:text-slate-300", isRTL ? "!text-right" : "!text-left")}>{t('remember_me')}</Label>
                                        </div>
                                        {/* Password reset button commented out */}
                                        {/* {canResetPassword && (
                                            <TextLink
                                                href={request()}
                                                className="text-sm text-primary hover:text-primary/80"
                                                tabIndex={5}
                                            >
                                                {t('forgot_password')}
                                            </TextLink>
                                        )} */}
                                    </div>

                                    <Button
                                        type="submit"
                                        className={cn("mt-4 w-full bg-primary-gradient hover:opacity-90 text-white dark:text-white font-semibold py-3 rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl", flexDirection)}
                                        tabIndex={4}
                                        disabled={processing}
                                        data-test="login-button"
                                    >
                                        {processing && (
                                            <LoaderCircle className={cn("h-4 w-4 animate-spin", iconMargin('md'))} />
                                        )}
                                        <span className="text-white">{t('log_in')}</span>
                                    </Button>
                                </div>

                                <div className={cn("text-sm text-slate-600 dark:text-slate-300", isRTL ? "!text-right" : "text-center")} dir={dir}>
                                    {t('already_have_account')}{' '}
                                    <TextLink href={register()} tabIndex={5} className="text-primary hover:text-primary/80 font-medium">
                                        {t('create_account')}
                                    </TextLink>
                                </div>
                            </>
                        )}
                    </Form>

                    {status && (
                        <div className={cn("mt-4 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl text-sm font-medium text-green-700 dark:text-green-300", isRTL ? "!text-right" : "text-center")} dir={dir}>
                            {status}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
