import { usePage } from '@inertiajs/react';
import { useTranslation } from '@/hooks/use-translation';
import { useRTLInit } from '@/hooks/use-rtl-init';
import { useRTL } from '@/hooks/use-rtl';
import { type SharedData } from '@/types';
import FrontendLayout from '@/layouts/frontend-layout';
import { cn } from '@/lib/utils';

export default function Terms() {
    useRTLInit();
    const { t } = useTranslation();
    const page = usePage<SharedData>();
    const { locale: pageLocale, siteSettings } = page.props;
    
    // Force RTL detection from page props
    const isRTL = pageLocale === 'ar';
    const dir = isRTL ? 'rtl' : 'ltr';
    
    const { iconMargin } = useRTL();
    
    const termsContent = isRTL
        ? (siteSettings?.terms_conditions_ar || siteSettings?.terms_conditions_en || t('terms_conditions_content_placeholder'))
        : (siteSettings?.terms_conditions_en || t('terms_conditions_content_placeholder'));

    return (
        <FrontendLayout title={t('terms_conditions')}>
            <div className="flex-1 flex items-center justify-center p-6 pt-24 pb-32" dir={dir}>
                <div className={cn("max-w-4xl mx-auto", isRTL ? "!text-right" : "!text-left")}>
                    <h1 className="text-3xl font-bold mb-8 text-slate-900 dark:text-slate-100 text-center">
                        {t('terms_conditions')}
                    </h1>
                    
                    <div 
                        className={cn(
                            "prose prose-lg max-w-none bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-lg p-8 prose-slate dark:prose-invert",
                            isRTL && "prose-rtl"
                        )}
                        dir={dir}
                        dangerouslySetInnerHTML={{ __html: termsContent || t('terms_conditions_not_available') }}
                    />
                </div>
            </div>
        </FrontendLayout>
    );
}
