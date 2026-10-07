import { useTranslation } from '@/hooks/use-translation';
import { useRTLInit } from '@/hooks/use-rtl-init';
import { useRTL } from '@/hooks/use-rtl';
import { type SharedData } from '@/types';
import { usePage } from '@inertiajs/react';
import { XCircle, AlertCircle, Lightbulb } from 'lucide-react';
import { useMemo } from 'react';
import FrontendLayout from '@/layouts/frontend-layout';
import { cn } from '@/lib/utils';

export default function PaymentError() {
    useRTLInit();
    const { t } = useTranslation();
    const page = usePage<SharedData>();
    const { locale: pageLocale } = page.props;
    
    // Force RTL detection from page props
    const isRTL = pageLocale === 'ar';
    const dir = isRTL ? 'rtl' : 'ltr';
    const flexDirection = isRTL ? 'flex-row-reverse' : 'flex-row';
    
    const { iconMargin } = useRTL();
    
    const searchParams = useMemo(() => {
        if (typeof window !== 'undefined') {
            return new URLSearchParams(window.location.search);
        }
        return new URLSearchParams();
    }, []);
    
    const message = searchParams.get('message');
    const invoiceStatus = searchParams.get('invoice_status');

    return (
        <FrontendLayout title={t('payment_failed')} showFooter={true} showHeader={true}>
            <div className="flex-1 flex items-center justify-center p-4" dir={dir}>
                <div className={cn("max-w-md w-full bg-white dark:bg-slate-800 rounded-2xl shadow-xl p-8", isRTL ? "!text-right" : "!text-left")} dir={dir}>
                    <div className="flex justify-center mb-6">
                        <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center">
                            <XCircle className="text-red-500 w-12 h-12" />
                        </div>
                    </div>

                    <h1 className="text-3xl font-bold text-gray-800 dark:text-slate-100 mb-4 text-center">
                        {t('payment_failed')}
                    </h1>

                    <p className={cn("text-gray-600 dark:text-slate-300 mb-6", isRTL ? "!text-right" : "text-center")}>
                        {message ? decodeURIComponent(message) : t('payment_could_not_be_processed')}
                    </p>

                    {invoiceStatus && (
                        <div className={cn("bg-red-50 border border-red-200 rounded-xl p-4 mb-6", isRTL ? "!text-right" : "!text-left")} dir={dir}>
                            <div className={cn("flex items-start", flexDirection)}>
                                <AlertCircle className={cn("text-red-500 w-5 h-5 flex-shrink-0 mt-0.5", iconMargin('md'))} />
                                <div className={cn(isRTL ? "!text-right" : "!text-left")}>
                                    <p className={cn("text-sm text-red-800 font-semibold mb-1", isRTL ? "!text-right" : "!text-left")}>
                                        {t('invoice_status')}
                                    </p>
                                    <p className={cn("text-sm text-red-700", isRTL ? "!text-right" : "!text-left")}>{invoiceStatus}</p>
                                </div>
                            </div>
                        </div>
                    )}

                    <div className={cn("bg-gray-50 dark:bg-slate-700/50 rounded-xl p-4 mb-6", isRTL ? "!text-right" : "!text-left")} dir={dir}>
                        <div className={cn("flex items-start mb-3", flexDirection)}>
                            <Lightbulb className={cn("text-yellow-500 w-5 h-5 flex-shrink-0 mt-0.5", iconMargin('md'))} />
                            <p className={cn("text-sm text-gray-600 dark:text-slate-300 font-medium", isRTL ? "!text-right" : "!text-left")}>
                                {t('payment_error_help')}
                            </p>
                        </div>
                        <ul className={cn("text-sm text-gray-600 dark:text-slate-300 space-y-2 list-disc", isRTL ? "!text-right mr-7" : "ml-7")}>
                            <li className={isRTL ? "!text-right" : "!text-left"}>{t('check_payment_details')}</li>
                            <li className={isRTL ? "!text-right" : "!text-left"}>{t('ensure_sufficient_balance')}</li>
                            <li className={isRTL ? "!text-right" : "!text-left"}>{t('try_different_payment_method')}</li>
                        </ul>
                    </div>
                </div>
            </div>
        </FrontendLayout>
    );
}

