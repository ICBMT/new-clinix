import { useTranslation } from '@/hooks/use-translation';
import { useRTLInit } from '@/hooks/use-rtl-init';
import { useRTL } from '@/hooks/use-rtl';
import { type SharedData } from '@/types';
import { usePage } from '@inertiajs/react';
import { CheckCircle } from 'lucide-react';
import { useEffect, useMemo } from 'react';
import FrontendLayout from '@/layouts/frontend-layout';
import { cn } from '@/lib/utils';

export default function PaymentSuccess() {
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
    
    const amount = searchParams.get('amount');
    const totalAmount = searchParams.get('total_amount');
    const remainingAmount = searchParams.get('remaining_amount');
    const paymentType = searchParams.get('payment_type');
    const bookingCount = searchParams.get('booking_count');
    const paymentId = searchParams.get('payment_id');
    const message = searchParams.get('message');

    useEffect(() => {
        const timer = setTimeout(() => {
            window.location.href = '/';
        }, 10000);

        return () => clearTimeout(timer);
    }, []);

    return (
        <FrontendLayout title={t('payment_successful')} showFooter={true} showHeader={true}>
            <div className="flex-1 flex items-center justify-center p-4" dir={dir}>
                <div className={cn("max-w-md w-full bg-white dark:bg-slate-800 rounded-2xl shadow-xl p-8", isRTL ? "!text-right" : "!text-left")} dir={dir}>
                    <div className="flex justify-center mb-6">
                        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center animate-bounce">
                            <CheckCircle className="text-green-500 w-12 h-12" />
                        </div>
                    </div>

                    <h1 className="text-3xl font-bold text-gray-800 dark:text-slate-100 mb-4 text-center">
                        {t('payment_successful')}
                    </h1>

                    <p className={cn("text-gray-600 dark:text-slate-300 mb-6", isRTL ? "!text-right" : "text-center")}>
                        {message || t('your_payment_has_been_processed_successfully')}
                    </p>

                    <div className={cn("bg-gray-50 dark:bg-slate-700/50 rounded-xl p-4 mb-6 space-y-3", isRTL ? "!text-right" : "!text-left")} dir={dir}>
                        {paymentId && (
                            <div className={cn("flex items-center", flexDirection, "justify-between")}>
                                <span className={cn("text-sm text-gray-600 dark:text-slate-300", isRTL ? "!text-right" : "!text-left")}>{t('payment_id')}</span>
                                <span className={cn("text-sm font-semibold text-gray-800 dark:text-slate-100", isRTL ? "!text-right" : "!text-left")} dir="ltr">{paymentId}</span>
                            </div>
                        )}

                        {paymentType && (
                            <div className={cn("flex items-center", flexDirection, "justify-between")}>
                                <span className={cn("text-sm text-gray-600 dark:text-slate-300", isRTL ? "!text-right" : "!text-left")}>{t('payment_type')}</span>
                                <span className={cn("text-sm font-semibold text-gray-800 dark:text-slate-100 capitalize", isRTL ? "!text-right" : "!text-left")}>{paymentType}</span>
                            </div>
                        )}

                        {amount && (
                            <div className={cn("flex items-center", flexDirection, "justify-between")}>
                                <span className={cn("text-sm text-gray-600 dark:text-slate-300", isRTL ? "!text-right" : "!text-left")}>{t('amount_paid')}</span>
                                <span className={cn("text-sm font-semibold text-gray-800 dark:text-slate-100", isRTL ? "!text-right" : "!text-left")} dir="ltr">
                                    {parseFloat(amount).toFixed(3)} KWD
                                </span>
                            </div>
                        )}

                        {totalAmount && (
                            <div className={cn("flex items-center", flexDirection, "justify-between")}>
                                <span className={cn("text-sm text-gray-600 dark:text-slate-300", isRTL ? "!text-right" : "!text-left")}>{t('total_amount')}</span>
                                <span className={cn("text-sm font-semibold text-gray-800 dark:text-slate-100", isRTL ? "!text-right" : "!text-left")} dir="ltr">
                                    {parseFloat(totalAmount).toFixed(3)} KWD
                                </span>
                            </div>
                        )}

                        {remainingAmount && parseFloat(remainingAmount) > 0 && (
                            <div className={cn("flex items-center", flexDirection, "justify-between")}>
                                <span className={cn("text-sm text-gray-600", isRTL ? "!text-right" : "!text-left")}>{t('remaining_amount')}</span>
                                <span className={cn("text-sm font-semibold text-orange-600", isRTL ? "!text-right" : "!text-left")} dir="ltr">
                                    {parseFloat(remainingAmount).toFixed(3)} KWD
                                </span>
                            </div>
                        )}

                        {bookingCount && (
                            <div className={cn("flex items-center", flexDirection, "justify-between")}>
                                <span className={cn("text-sm text-gray-600 dark:text-slate-300", isRTL ? "!text-right" : "!text-left")}>{t('bookings')}</span>
                                <span className={cn("text-sm font-semibold text-gray-800 dark:text-slate-100", isRTL ? "!text-right" : "!text-left")} dir="ltr">{bookingCount}</span>
                            </div>
                        )}
                    </div>

                    <p className={cn("mt-6 text-sm text-gray-500 dark:text-slate-400", isRTL ? "!text-right" : "text-center")}>
                        {t('auto_redirecting_in_10_seconds')}
                    </p>
                </div>
            </div>
        </FrontendLayout>
    );
}

