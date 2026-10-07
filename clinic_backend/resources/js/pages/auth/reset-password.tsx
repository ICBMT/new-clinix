import NewPasswordController from '@/actions/App/Http/Controllers/Auth/NewPasswordController';
import { Form, Head, usePage, Link } from '@inertiajs/react';
import { LoaderCircle } from 'lucide-react';

import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useTranslation } from '@/hooks/use-translation';
import { useRTLInit } from '@/hooks/use-rtl-init';
import { useRTL } from '@/hooks/use-rtl';
import { type SharedData } from '@/types';
import { getLocalizedName } from '@/utils/localization';
import { cn } from '@/lib/utils';

interface ResetPasswordProps {
    token: string;
    email: string;
}

export default function ResetPassword({ token, email }: ResetPasswordProps) {
    useRTLInit();
    const { t, locale } = useTranslation();
    const page = usePage<SharedData>();
    const { locale: pageLocale, siteSettings } = page.props;
    
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
            <div className="w-full max-w-md">
                {/* Header */}
                <div className={cn("mb-8", isRTL ? "!text-right" : "text-center")}>
                    <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100 mb-2 text-center">
                        {t('reset_password')}
                    </h1>
                    <p className={cn("text-slate-600 dark:text-slate-300", isRTL ? "!text-right" : "text-center")}>
                        {t('reset_password_description')}
                    </p>
                </div>

                {/* Main Card */}
                <div className={cn("bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-2xl p-8 border border-slate-200/50 dark:border-slate-700/50 shadow-xl", isRTL ? "!text-right" : "!text-left")} dir={dir}>
                    <Head title={t('reset_password')} />

                    <Form
                        {...NewPasswordController.store.form()}
                        transform={(data) => ({ ...data, token, email })}
                        resetOnSuccess={['password', 'password_confirmation']}
                    >
                        {({ processing, errors }) => (
                            <div className="grid gap-6">
                                <div className={cn("grid gap-2", isRTL ? "!text-right" : "!text-left")}>
                                    <Label htmlFor="email" className={cn(isRTL ? "!text-right" : "!text-left")}>{t('email')}</Label>
                                    <Input
                                        id="email"
                                        type="email"
                                        name="email"
                                        autoComplete="off"
                                        value={email}
                                        dir={getFieldDir('email')}
                                        className={cn(
                                            "mt-1 block w-full bg-slate-100 dark:bg-slate-700 border-slate-200 dark:border-slate-600 text-slate-500 dark:text-slate-400",
                                            getInputTextAlign('email')
                                        )}
                                        readOnly
                                    />
                                    <InputError
                                        message={errors.email}
                                        className={cn("mt-2", isRTL ? "!text-right" : "!text-left")}
                                        dir={dir}
                                    />
                                </div>

                                <div className={cn("grid gap-2", isRTL ? "!text-right" : "!text-left")}>
                                    <Label htmlFor="password" className={cn(isRTL ? "!text-right" : "!text-left")}>{t('password')}</Label>
                                    <Input
                                        id="password"
                                        type="password"
                                        name="password"
                                        autoComplete="off"
                                        autoFocus
                                        placeholder={t('password')}
                                        dir={getFieldDir('text')}
                                        className={cn(
                                            "mt-1 block w-full bg-white/50 dark:bg-slate-700/50 border-slate-200 dark:border-slate-600 focus:border-primary focus:ring-primary dark:text-slate-100",
                                            getInputTextAlign('text')
                                        )}
                                    />
                                    <InputError message={errors.password} className={cn(isRTL ? "!text-right" : "!text-left")} dir={dir} />
                                </div>

                                <div className={cn("grid gap-2", isRTL ? "!text-right" : "!text-left")}>
                                    <Label htmlFor="password_confirmation" className={cn(isRTL ? "!text-right" : "!text-left")}>
                                        {t('confirm_password')}
                                    </Label>
                                    <Input
                                        id="password_confirmation"
                                        type="password"
                                        name="password_confirmation"
                                        autoComplete="off"
                                        placeholder={t('confirm_password')}
                                        dir={getFieldDir('text')}
                                        className={cn(
                                            "mt-1 block w-full bg-white/50 dark:bg-slate-700/50 border-slate-200 dark:border-slate-600 focus:border-primary focus:ring-primary dark:text-slate-100",
                                            getInputTextAlign('text')
                                        )}
                                    />
                                    <InputError
                                        message={errors.password_confirmation}
                                        className={cn("mt-2", isRTL ? "!text-right" : "!text-left")}
                                        dir={dir}
                                    />
                                </div>

                                <Button
                                    type="submit"
                                    className={cn("mt-4 w-full bg-primary-gradient hover:opacity-90 text-white font-semibold py-3 rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl", flexDirection)}
                                    disabled={processing}
                                    data-test="reset-password-button"
                                >
                                    {processing && (
                                        <LoaderCircle className={cn("h-4 w-4 animate-spin", iconMargin('md'))} />
                                    )}
                                    {t('reset_password')}
                                </Button>
                            </div>
                        )}
                    </Form>
                </div>
            </div>
        </div>
    );
}
