// Components
import EmailVerificationNotificationController from '@/actions/App/Http/Controllers/Auth/EmailVerificationNotificationController';
import { logout } from '@/routes';
import { Form, Head, usePage, Link } from '@inertiajs/react';
import { LoaderCircle } from 'lucide-react';

import TextLink from '@/components/text-link';
import { Button } from '@/components/ui/button';
import { useTranslation } from '@/hooks/use-translation';
import { useRTLInit } from '@/hooks/use-rtl-init';
import { useRTL } from '@/hooks/use-rtl';
import { type SharedData } from '@/types';
import { getLocalizedName } from '@/utils/localization';
import { cn } from '@/lib/utils';

export default function VerifyEmail({ status }: { status?: string }) {
    useRTLInit();
    const { t, locale } = useTranslation();
    const page = usePage<SharedData>();
    const { locale: pageLocale, siteSettings } = page.props;
    
    // Force RTL detection from page props
    const isRTL = pageLocale === 'ar';
    const dir = isRTL ? 'rtl' : 'ltr';
    const flexDirection = isRTL ? 'flex-row-reverse' : 'flex-row';
    
    const { iconMargin } = useRTL();
    
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
                        {t('verify_email')}
                    </h1>
                    <p className={cn("text-slate-600 dark:text-slate-300", isRTL ? "!text-right" : "text-center")}>
                        {t('verify_email_description')}
                    </p>
                </div>

                {/* Main Card */}
                <div className={cn("bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-2xl p-8 border border-slate-200/50 dark:border-slate-700/50 shadow-xl", isRTL ? "!text-right" : "!text-left")} dir={dir}>
                    <Head title={t('verify_email')} />

                    {status === 'verification-link-sent' && (
                        <div className={cn("mb-6 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl text-sm font-medium text-green-700 dark:text-green-300", isRTL ? "!text-right" : "text-center")} dir={dir}>
                            {t('verification_link_sent')}
                        </div>
                    )}

                    <Form
                        {...EmailVerificationNotificationController.store.form()}
                        className={cn("space-y-6", isRTL ? "!text-right" : "text-center")}
                    >
                        {({ processing }) => (
                            <>
                                <Button 
                                    disabled={processing} 
                                    variant="secondary"
                                    className={cn("w-full bg-primary-gradient hover:opacity-90 text-white font-semibold py-3 rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl", flexDirection)}
                                >
                                    {processing && (
                                        <LoaderCircle className={cn("h-4 w-4 animate-spin", iconMargin('md'))} />
                                    )}
                                    {t('resend_verification_email')}
                                </Button>

                                <TextLink
                                    href={logout()}
                                    className={cn("block text-sm text-primary hover:text-primary/80 font-medium", isRTL ? "!text-right" : "mx-auto")}
                                >
                                    {t('log_out')}
                                </TextLink>
                            </>
                        )}
                    </Form>
                </div>
            </div>
        </div>
    );
}
