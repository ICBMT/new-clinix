import { Head, usePage } from '@inertiajs/react';
import { useTranslation } from '@/hooks/use-translation';
import { useRTLInit } from '@/hooks/use-rtl-init';
import { useRTL } from '@/hooks/use-rtl';
import { type SharedData } from '@/types';
import { cn } from '@/lib/utils';

export default function Success({ userId, paymentId }: { userId?: string; paymentId?: string }) {
    useRTLInit();
    const { t } = useTranslation();
    const page = usePage<SharedData>();
    const { locale: pageLocale } = page.props;
    
    // Force RTL detection from page props
    const isRTL = pageLocale === 'ar';
    const dir = isRTL ? 'rtl' : 'ltr';
    const flexDirection = isRTL ? 'flex-row-reverse' : 'flex-row';
    
    const { iconMargin } = useRTL();

    return (
        <>
            <Head title={t('payment_successful')} />
            <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-[#A8B5FF] via-[#8B7FD9] to-[#6B46C1] dark:from-slate-900 dark:via-[#4C1D95] dark:to-[#3B0F6B] p-6" dir={dir}>
                <div className="mb-8">
                    <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30">
                        <svg className="h-12 w-12 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                        </svg>
                    </div>
                </div>
                <div className={cn("max-w-md mx-auto", isRTL ? "!text-right" : "text-center")} dir={dir}>
                    <h1 className="mb-4 text-4xl font-bold text-foreground text-center">{t('payment_successful')}</h1>
                    <p className={cn("mb-2 text-lg text-muted-foreground", isRTL ? "!text-right" : "text-center")}>{t('payment_thank_you')}</p>
                    <p className={cn("mb-8 text-muted-foreground", isRTL ? "!text-right" : "text-center")}>{t('payment_booking_confirmed')}</p>
                    <div className={cn("flex items-center justify-center gap-4", flexDirection)}>
                        <button onClick={() => window.close()} className={cn("rounded-full bg-primary-gradient px-8 py-4 font-semibold text-white shadow-lg transition-all duration-200 hover:-translate-y-0.5 hover:opacity-90 hover:shadow-xl", flexDirection)}>
                            {t('close')}
                        </button>
                        <button onClick={() => (window.location.href = (window as any).APP_DEEP_LINK || '/')} className={cn("rounded-full border border-border bg-card px-8 py-4 font-semibold text-foreground shadow-sm transition-all duration-200 hover:bg-muted hover:shadow-md", flexDirection)}>
                            {t('view_booking')}
                        </button>
                    </div>
                </div>
            </div>
        </>
    );
}



