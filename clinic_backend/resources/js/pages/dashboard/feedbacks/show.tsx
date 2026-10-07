import { type BreadcrumbItem } from '@/types';
import { Badge } from '@/components/ui/badge';
import { ViewLayout, ViewDetailsSection, ViewField, ViewFieldWithIcon } from '@/components/view';
import { useRTLInit } from '@/hooks/use-rtl-init';
import { useTranslation } from '@/hooks/use-translation';
import { index as dashboard } from '@/routes/dashboard';
import { Link } from '@inertiajs/react';
import { Calendar, Star, MessageSquare, User } from 'lucide-react';

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

export default function ShowServiceFeedback({ feedback }: ShowFeedbackProps) {
    useRTLInit();
    const { t, locale } = useTranslation();

    const breadcrumbs: BreadcrumbItem[] = [
        {
            title: t('dashboard'),
            href: dashboard.url(),
        },
        {
            title: t('feedbacks_management'),
            href: '/dashboard/feedbacks',
        },
        {
            title: t('view_feedback'),
            href: '#',
        },
    ];

    const formatDate = (date: string) => {
        return new Date(date).toLocaleDateString(locale === 'ar' ? 'ar-SA' : 'en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    return (
        <ViewLayout
            breadcrumbs={breadcrumbs}
            title={t('feedback_details')}
            description={t('view_feedback_information')}
            status={{
                value: feedback.status,
                variant: feedback.status === 'resolved' ? 'default' : 'secondary',
                className: feedback.status === 'resolved' 
                    ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300' 
                    : 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300',
            }}
            backUrl="/dashboard/feedbacks"
            headTitle={`${t('feedback_details')} - #${feedback.id}`}
        >
            <ViewDetailsSection title={t('basic_information')} icon={MessageSquare}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {feedback.user && (
                        <ViewFieldWithIcon
                            label={t('user')}
                            value={
                                <div>
                                    <Link 
                                        href={`/dashboard/users/${feedback.user.id}`}
                                        className="text-primary hover:underline font-medium"
                                    >
                                        {feedback.user.name}
                                    </Link>
                                    <p className="text-sm text-muted-foreground" dir="ltr">{feedback.user.email}</p>
                                </div>
                            }
                            icon={User}
                        />
                    )}
                    <ViewField
                        label={t('type')}
                        value={<Badge variant="outline">{t(feedback.type)}</Badge>}
                    />
                    {feedback.subject && (
                        <ViewField
                            label={t('subject')}
                            value={feedback.subject}
                            spanCols={2}
                        />
                    )}
                    {feedback.rating && (
                        <ViewField
                            label={t('rating')}
                            value={
                                <div className="flex items-center gap-1">
                                    {Array.from({ length: 5 }).map((_, i) => (
                                        <Star
                                            key={i}
                                            className={`h-5 w-5 ${
                                                i < feedback.rating! 
                                                    ? 'text-yellow-500 fill-yellow-500' 
                                                    : 'text-gray-300 dark:text-gray-600'
                                            }`}
                                        />
                                    ))}
                                    <span className="text-sm" dir="ltr">{feedback.rating}/5</span>
                                </div>
                            }
                        />
                    )}
                    <ViewFieldWithIcon
                        label={t('created_at')}
                        value={formatDate(feedback.created_at)}
                        icon={Calendar}
                    />
                </div>

                {feedback.message && (
                    <div className="space-y-2 pt-4 border-t">
                        <p className="text-sm text-muted-foreground">{t('message')}</p>
                        <div className="bg-muted/50 dark:bg-muted/30 p-4 rounded border">
                            <p className="text-base text-foreground whitespace-pre-wrap">{feedback.message}</p>
                        </div>
                    </div>
                )}

                {feedback.admin_response && (
                    <div className="space-y-2 pt-4 border-t">
                        <p className="text-sm text-muted-foreground">{t('admin_response')}</p>
                        <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded border border-blue-200 dark:border-blue-800">
                            <p className="text-base text-foreground whitespace-pre-wrap">{feedback.admin_response}</p>
                        </div>
                    </div>
                )}
            </ViewDetailsSection>
        </ViewLayout>
    );
}

