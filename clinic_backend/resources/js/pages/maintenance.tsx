import { useTranslation } from '@/hooks/use-translation';
import { useRTLInit } from '@/hooks/use-rtl-init';
import { useRTL } from '@/hooks/use-rtl';
import { type SharedData } from '@/types';
import { Head, usePage } from '@inertiajs/react';
import FrontendLayout from '@/layouts/frontend-layout';
import { cn } from '@/lib/utils';

export default function Maintenance() {
    useRTLInit();
    const { t } = useTranslation();
    const page = usePage<SharedData & {
        title_en?: string;
        body_en?: string;
    }>();
    const { locale: pageLocale, title_en, body_en } = page.props;
    
    // Force RTL detection from page props
    const isRTL = pageLocale === 'ar';
    const dir = isRTL ? 'rtl' : 'ltr';
    const flexDirection = isRTL ? 'flex-row-reverse' : 'flex-row';
    
    const { iconMargin } = useRTL();

    const title = title_en || t('site_under_maintenance');
    const description = body_en || t('maintenance_default_message');

    return (
        <>
            <Head title={title}>
                <link rel="preconnect" href="https://fonts.bunny.net" />
                <link href="https://fonts.bunny.net/css?family=instrument-sans:400,500,600" rel="stylesheet" />
            </Head>
            <FrontendLayout title={title}>
                <div className="flex-1 flex items-center justify-center p-6 pt-24 pb-32" dir={dir}>
                    <div className={cn("max-w-4xl mx-auto", isRTL ? "!text-right" : "text-center")}>
                        <div className={cn("mb-8 inline-flex items-center gap-2 rounded-full border border-primary/20 dark:border-primary/30 bg-white/80 dark:bg-slate-800/80 px-4 py-2 backdrop-blur-sm", flexDirection)}>
                            <div className="h-2 w-2 animate-pulse rounded-full bg-amber-500 dark:bg-amber-400"></div>
                            <span className={cn("text-sm font-medium text-foreground", isRTL ? "!text-right" : "!text-left")}>{t('maintenance')}</span>
                        </div>

                        <h1 className="mb-6 text-5xl leading-tight font-bold text-foreground md:text-6xl text-center">
                            {title}
                        </h1>
                        <p className={cn("mx-auto mb-12 max-w-2xl text-lg leading-relaxed text-slate-100 dark:text-slate-200", isRTL ? "!text-right" : "!text-left")}>
                            {description}
                        </p>
                    </div>
                </div>
            </FrontendLayout>
        </>
    );
}


