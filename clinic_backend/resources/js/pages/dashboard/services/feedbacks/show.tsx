import { type BreadcrumbItem } from '@/types';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useTranslation } from '@/hooks/use-translation';
import { cn } from '@/lib/utils';
import { useRTL } from '@/hooks/use-rtl';
import { cn } from '@/lib/utils';
import AppLayout from '@/layouts/app-layout';
import { cn } from '@/lib/utils';
import { index as dashboard } from '@/routes/dashboard';
import { cn } from '@/lib/utils';
import { Head, Link } from '@inertiajs/react';
import { cn } from '@/lib/utils';
import { ArrowLeft, Calendar, Clock, Star } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Feedback {
    id: number;
    user?: { id: number; name: string; email: string };
    type: string;
    subject?: string;
    message?: string;
    rating?: number;
    status: string;
    admin_response?: string;
    created_at: string;
    updated_at: string;
}

interface ShowFeedbackProps {
    feedback: Feedback;
}

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'dashboard',
        href: dashboard.url(),
    },
    {
        title: 'Services Feedbacks',
        href: '/dashboard/services-feedbacks',
    },
    {
        title: 'View Feedback',
        href: '#',
    },
];

export default function ShowServiceFeedback({ feedback }: ShowFeedbackProps) {
    const { t, locale } = useTranslation();
    const { isRTL } = useRTL();

    const formatDate = (date: string) => {
        return new Date(date).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`${t('feedback_details')} - #${feedback.id}`} />

            <div className="flex h-full flex-1 flex-col gap-6 overflow-x-auto rounded-xl bg-card dark:bg-card p-6 border border-border" dir={isRTL ? 'rtl' : 'ltr'}>
                {/* Header */}
                <div className="border-b pb-4 space-y-4">
                    {/* Back button - always on the left */}
                    <div className="flex justify-start">
                        <Link href="/dashboard/services-feedbacks">
                            <Button variant="outline" className={`flex items-center gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
                                <ArrowLeft className={`h-4 w-4 ${isRTL ? 'rotate-180' : ''}`} />
                                {t('back')}
                            </Button>
                        </Link>
                    </div>
                    
                    {/* Title */}
                    <div className={isRTL ? 'text-right' : ''}>
                        <h1 className="text-3xl font-bold text-foreground">{t('feedback_details')}</h1>
                        <p className="text-muted-foreground mt-1">{t('view_feedback_information')}</p>
                    </div>
                </div>

                <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-foreground">{t('basic_information')}</h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {feedback.user && (
                            <div className={`space-y-2 ${isRTL ? 'text-right' : ''}`}>
                                <p className="text-sm text-muted-foreground">{t('user')}</p>
                                <div>
                                    <p className="text-base font-medium text-foreground">{feedback.user.name}</p>
                                    <p className="text-sm text-muted-foreground">{feedback.user.email}</p>
                                </div>
                            </div>
                        )}

                        <div className={`space-y-2 ${isRTL ? 'text-right' : ''}`}>
                            <p className="text-sm text-muted-foreground">{t('type')}</p>
                            <Badge variant="outline">{t(feedback.type)}</Badge>
                        </div>

                        {feedback.subject && (
                            <div className={`space-y-2 ${isRTL ? 'text-right' : ''}`}>
                                <p className="text-sm text-muted-foreground">{t('subject')}</p>
                                <p className="text-base font-medium text-foreground">{feedback.subject}</p>
                            </div>
                        )}

                        {feedback.rating && (
                            <div className={`space-y-2 ${isRTL ? 'text-right' : ''}`}>
                                <p className="text-sm text-muted-foreground">{t('rating')}</p>
                                <div className="flex items-center gap-1">
                                    {Array.from({ length: 5 }).map((_, i) => (
                                        <Star
                                            key={i}
                                            className={`h-5 w-5 ${
                                                i < feedback.rating! 
                                                    ? 'text-yellow-500 fill-yellow-500' 
                                                    : 'text-gray-300'
                                            }`}
                                        />
                                    ))}
                                    <span className="ml-2 text-sm">{feedback.rating}/5</span>
                                </div>
                            </div>
                        )}

                        <div className={`space-y-2 ${isRTL ? 'text-right' : ''}`}>
                            <p className="text-sm text-muted-foreground">{t('status')}</p>
                            <Badge 
                                variant={feedback.status === 'resolved' ? 'default' : 'secondary'}
                                className={
                                    feedback.status === 'resolved' 
                                        ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300' 
                                        : 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300'
                                }
                            >
                                {t(feedback.status)}
                            </Badge>
                        </div>

                        <div className={`space-y-2 ${isRTL ? 'text-right' : ''}`}>
                            <p className="text-sm text-muted-foreground">{t('created_at')}</p>
                            <div className={`flex items-center gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
                                <Calendar className="h-4 w-4 text-gray-400" />
                                <p className="text-base font-medium text-foreground">{formatDate(feedback.created_at)}</p>
                            </div>
                        </div>
                    </div>

                    {feedback.message && (
                        <div className={`space-y-2 ${isRTL ? 'text-right' : ''}`}>
                            <p className="text-sm text-muted-foreground">{t('message')}</p>
                            <p className="text-base text-foreground bg-gray-50 p-4 rounded">{feedback.message}</p>
                        </div>
                    )}

                    {feedback.admin_response && (
                        <div className={`space-y-2 ${isRTL ? 'text-right' : ''}`}>
                            <p className="text-sm text-muted-foreground">{t('admin_response')}</p>
                            <p className="text-base text-foreground bg-blue-50 p-4 rounded">{feedback.admin_response}</p>
                        </div>
                    )}
                </div>
            </div>
        </AppLayout>
    );
}

