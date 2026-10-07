import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
    InputOTP,
    InputOTPGroup,
    InputOTPSlot,
} from '@/components/ui/input-otp';
import { OTP_MAX_LENGTH } from '@/hooks/use-two-factor-auth';
import { useTranslation } from '@/hooks/use-translation';
import { useRTLInit } from '@/hooks/use-rtl-init';
import { useRTL } from '@/hooks/use-rtl';
import { store } from '@/routes/two-factor/login';
import { Form, Head, usePage, Link } from '@inertiajs/react';
import { REGEXP_ONLY_DIGITS } from 'input-otp';
import { useMemo, useState } from 'react';
import { LoaderCircle } from 'lucide-react';
import { type SharedData } from '@/types';
import { getLocalizedName } from '@/utils/localization';
import { cn } from '@/lib/utils';

export default function TwoFactorChallenge() {
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
    const [showRecoveryInput, setShowRecoveryInput] = useState<boolean>(false);
    const [code, setCode] = useState<string>('');

    const authConfigContent = useMemo<{
        title: string;
        description: string;
        toggleText: string;
    }>(() => {
        if (showRecoveryInput) {
            return {
                title: t('recovery_code'),
                description: t('recovery_code_description'),
                toggleText: t('login_using_authentication_code'),
            };
        }

        return {
            title: t('authentication_code'),
            description: t('authentication_code_description'),
            toggleText: t('login_using_recovery_code'),
        };
    }, [showRecoveryInput, t]);

    const toggleRecoveryMode = (clearErrors: () => void): void => {
        setShowRecoveryInput(!showRecoveryInput);
        clearErrors();
        setCode('');
    };

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
                        {authConfigContent.title}
                    </h1>
                    <p className={cn("text-slate-600 dark:text-slate-300", isRTL ? "!text-right" : "text-center")}>
                        {authConfigContent.description}
                    </p>
                </div>

                {/* Main Card */}
                <div className={cn("bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-2xl p-8 border border-slate-200/50 dark:border-slate-700/50 shadow-xl", isRTL ? "!text-right" : "!text-left")} dir={dir}>
                    <Head title={t('two_factor_challenge')} />

                    <div className="space-y-6">
                        <Form
                            {...store.form()}
                            className="space-y-4"
                            resetOnError
                            resetOnSuccess={!showRecoveryInput}
                        >
                            {({ errors, processing, clearErrors }) => (
                                <>
                                    {showRecoveryInput ? (
                                        <div className={cn("space-y-2", isRTL ? "!text-right" : "!text-left")}>
                                            <Input
                                                name="recovery_code"
                                                type="text"
                                                placeholder={t('enter_recovery_code')}
                                                autoFocus={showRecoveryInput}
                                                required
                                                dir={getFieldDir('text')}
                                                className={cn(
                                                    "bg-white/50 dark:bg-slate-700/50 border-slate-200 dark:border-slate-600 focus:border-primary focus:ring-primary dark:text-slate-100",
                                                    getInputTextAlign('text')
                                                )}
                                            />
                                            <InputError
                                                message={errors.recovery_code}
                                                className={cn(isRTL ? "!text-right" : "!text-left")}
                                                dir={dir}
                                            />
                                        </div>
                                    ) : (
                                        <div className={cn("flex flex-col items-center justify-center space-y-3", isRTL ? "!text-right" : "text-center")}>
                                            <div className="flex w-full items-center justify-center">
                                                <InputOTP
                                                    name="code"
                                                    maxLength={OTP_MAX_LENGTH}
                                                    value={code}
                                                    onChange={(value) => setCode(value)}
                                                    disabled={processing}
                                                    pattern={REGEXP_ONLY_DIGITS}
                                                >
                                                    <InputOTPGroup>
                                                        {Array.from(
                                                            { length: OTP_MAX_LENGTH },
                                                            (_, index) => (
                                                                <InputOTPSlot
                                                                    key={index}
                                                                    index={index}
                                                                />
                                                            ),
                                                        )}
                                                    </InputOTPGroup>
                                                </InputOTP>
                                            </div>
                                            <InputError message={errors.code} className={cn(isRTL ? "!text-right" : "text-center")} dir={dir} />
                                        </div>
                                    )}

                                    <Button
                                        type="submit"
                                        className={cn("w-full bg-primary-gradient hover:opacity-90 text-white font-semibold py-3 rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl", flexDirection)}
                                        disabled={processing}
                                    >
                                        {processing && (
                                            <LoaderCircle className={cn("h-4 w-4 animate-spin", iconMargin('md'))} />
                                        )}
                                        {t('continue')}
                                    </Button>

                                    <div className={cn("text-sm text-slate-600 dark:text-slate-300", isRTL ? "!text-right" : "text-center")}>
                                        <span>{t('or_you_can')} </span>
                                        <button
                                            type="button"
                                            className="cursor-pointer text-primary hover:text-primary/80 font-medium underline decoration-neutral-300 underline-offset-4 transition-colors duration-300 ease-out hover:decoration-current! dark:decoration-neutral-500"
                                            onClick={() =>
                                                toggleRecoveryMode(clearErrors)
                                            }
                                        >
                                            {authConfigContent.toggleText}
                                        </button>
                                    </div>
                                </>
                            )}
                        </Form>
                    </div>
                </div>
            </div>
        </div>
    );
}
