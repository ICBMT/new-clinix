import { type BreadcrumbItem } from '@/types';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ViewPageLayout, PageHeader } from '@/components/page-layouts';
import { useRTLInit } from '@/hooks/use-rtl-init';
import { useTranslation } from '@/hooks/use-translation';
import { useRTL } from '@/hooks/use-rtl';
import AppLayout from '@/layouts/app-layout';
import { index as dashboard } from '@/routes/dashboard';
import { Head, Link, usePage } from '@inertiajs/react';
import { ArrowLeft, Edit, Calendar, HelpCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { type SharedData } from '@/types';

interface ShowFaqProps {
    faq: {
        id: number;
        question_en: string;
        question_ar?: string;
        answer_en: string;
        answer_ar?: string;
        category?: string;
        is_active: boolean;
        sort_order: number;
        created_at: string;
        updated_at: string;
    };
}

export default function ShowFaq({ faq }: ShowFaqProps) {
    useRTLInit();
    const { t, locale } = useTranslation();
    const page = usePage<SharedData>();
    const { locale: pageLocale } = page.props;
    const isRTL = pageLocale === 'ar';
    const dir = isRTL ? 'rtl' : 'ltr';
    const { flexDirection, iconMargin } = useRTL();
    
    const breadcrumbs: BreadcrumbItem[] = [
        {
            title: t('dashboard'),
            href: dashboard.url(),
        },
        {
            title: t('faq_management'),
            href: '/dashboard/faqs',
        },
        {
            title: t('view_faq'),
            href: '#',
        },
    ];

    // Helper function to get localized question
    const getLocalizedQuestion = (): string => {
        if (isRTL && faq.question_ar) {
            return faq.question_ar;
        }
        return faq.question_en || '';
    };

    // Helper function to get localized answer
    const getLocalizedAnswer = (): string => {
        if (isRTL && faq.answer_ar) {
            return faq.answer_ar;
        }
        return faq.answer_en || '';
    };

    const formatDate = (date: string) => {
        return new Date(date).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    const getStatusBadge = (isActive: boolean) => {
        return (
            <Badge variant={isActive ? 'default' : 'secondary'}>
                {isActive ? t('active') : t('inactive')}
            </Badge>
        );
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`${t('faq_details')} - ${getLocalizedQuestion()}`} />

            <ViewPageLayout>
                <PageHeader
                    title={t('faq_details')}
                    description={t('view_faq_description')}
                    actions={
                        <div className={cn("flex items-center gap-3", flexDirection)}>
                            <Link href={`/dashboard/faqs/${faq.id}/edit`}>
                                <Button className={cn("flex items-center gap-2", flexDirection)}>
                                    <Edit className={cn("h-4 w-4", iconMargin('md'))} />
                                    {t('edit_faq')}
                                </Button>
                            </Link>
                            <Link href="/dashboard/faqs">
                                <Button variant="outline" className={cn("flex items-center gap-2", flexDirection)}>
                                    <ArrowLeft className={cn("h-4 w-4", isRTL && 'rotate-180', iconMargin('md'))} />
                                    {t('back')}
                                </Button>
                            </Link>
                        </div>
                    }
                />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className={cn("space-y-2", isRTL ? '!text-right' : '!text-left')}>
                        <p className={cn("text-sm text-muted-foreground flex items-center gap-2", flexDirection)}>
                            <HelpCircle className={cn("h-4 w-4", iconMargin('md'))} />
                            {t('question')}
                        </p>
                        <p className={cn("text-xl font-bold", isRTL ? '!text-right' : '!text-left')} dir={dir}>{getLocalizedQuestion()}</p>
                    </div>

                    <div className={cn("space-y-2", isRTL ? '!text-right' : '!text-left')}>
                        <p className={cn("text-sm text-muted-foreground", isRTL ? '!text-right' : '!text-left')}>{t('status')}</p>
                        <div className={cn(isRTL ? '!text-right' : '!text-left')}>
                            {getStatusBadge(faq.is_active)}
                        </div>
                    </div>

                    <div className={cn("space-y-2", isRTL ? '!text-right' : '!text-left')}>
                        <p className={cn("text-sm text-muted-foreground flex items-center gap-2", flexDirection)}>
                            <Calendar className={cn("h-4 w-4", iconMargin('md'))} />
                            {t('created_at')}
                        </p>
                        <p className={cn("text-base font-medium text-foreground", isRTL ? '!text-right' : '!text-left')} dir={dir}>{formatDate(faq.created_at)}</p>
                    </div>
                </div>

                <div className={cn("space-y-2 pt-4 border-t", isRTL ? '!text-right' : '!text-left')}>
                    <p className={cn("text-sm text-muted-foreground", isRTL ? '!text-right' : '!text-left')}>{t('answer')}</p>
                    <div className={cn("bg-gray-50 dark:bg-gray-800 rounded-lg p-4", isRTL ? '!text-right' : '!text-left')} dir={dir}>
                        <p className={cn("text-base text-foreground whitespace-pre-wrap", isRTL ? '!text-right' : '!text-left')} dir={dir}>{getLocalizedAnswer()}</p>
                    </div>
                </div>
            </ViewPageLayout>
        </AppLayout>
    );
}

