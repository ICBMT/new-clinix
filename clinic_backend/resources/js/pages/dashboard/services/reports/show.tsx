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
import { ArrowLeft, Calendar, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Report {
    id: number;
    user?: { id: number; name: string; email: string };
    service?: { id: number; name_en: string; name_ar: string };
    vendor?: { id: number; name: string };
    reason_id: number;
    description?: string;
    attachments?: string[];
    status: 'pending' | 'approved' | 'rejected' | 'resolved' | 'open' | 'in_review' | 'dismissed';
    admin_notes?: string;
    resolution_notes?: string;
    resolved_at?: string;
    created_at: string;
    updated_at: string;
}

interface ShowReportProps {
    report: Report;
}

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'dashboard',
        href: dashboard.url(),
    },
    {
        title: 'Services Reports',
        href: '/dashboard/services-reports',
    },
    {
        title: 'View Report',
        href: '#',
    },
];

export default function ShowServiceReport({ report }: ShowReportProps) {
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
            <Head title={`${t('report_details')} - #${report.id}`} />

            <div className="flex h-full flex-1 flex-col gap-6 overflow-x-auto rounded-xl bg-card dark:bg-card p-6 border border-border" dir={isRTL ? 'rtl' : 'ltr'}>
                {/* Header */}
                <div className="border-b pb-4 space-y-4">
                    {/* Back button - always on the left */}
                    <div className="flex justify-start">
                        <Link href="/dashboard/services-reports">
                            <Button variant="outline" className={`flex items-center gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
                                <ArrowLeft className={`h-4 w-4 ${isRTL ? 'rotate-180' : ''}`} />
                                {t('back')}
                            </Button>
                        </Link>
                    </div>
                    
                    {/* Title */}
                    <div className={isRTL ? 'text-right' : ''}>
                        <h1 className="text-3xl font-bold text-foreground">{t('report_details')}</h1>
                        <p className="text-muted-foreground mt-1">{t('view_report_information')}</p>
                    </div>
                </div>

                <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-foreground">{t('basic_information')}</h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {report.service && (
                            <div className={`space-y-2 ${isRTL ? 'text-right' : ''}`}>
                                <p className="text-sm text-muted-foreground">{t('service')}</p>
                                <p className="text-base font-medium text-foreground">
                                    {isRTL ? report.service.name_ar : report.service.name_en}
                                </p>
                            </div>
                        )}

                        {report.vendor && (
                            <div className={`space-y-2 ${isRTL ? 'text-right' : ''}`}>
                                <p className="text-sm text-muted-foreground">{t('vendor')}</p>
                                <p className="text-base font-medium text-foreground">{report.vendor.name}</p>
                            </div>
                        )}

                        {report.user && (
                            <div className={`space-y-2 ${isRTL ? 'text-right' : ''}`}>
                                <p className="text-sm text-muted-foreground">{t('reported_by')}</p>
                                <div>
                                    <p className="text-base font-medium text-foreground">{report.user.name}</p>
                                    <p className="text-sm text-muted-foreground">{report.user.email}</p>
                                </div>
                            </div>
                        )}

                        <div className={`space-y-2 ${isRTL ? 'text-right' : ''}`}>
                            <p className="text-sm text-muted-foreground">{t('status')}</p>
                            <Badge 
                                variant={
                                    report.status === 'resolved' ? 'default' : 
                                    report.status === 'rejected' || report.status === 'dismissed' ? 'destructive' : 'secondary'
                                }
                                className={
                                    report.status === 'resolved' 
                                        ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300' 
                                        : report.status === 'rejected' || report.status === 'dismissed'
                                        ? 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300'
                                        : 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300'
                                }
                            >
                                {t(report.status)}
                            </Badge>
                        </div>

                        <div className={`space-y-2 ${isRTL ? 'text-right' : ''}`}>
                            <p className="text-sm text-muted-foreground">{t('created_at')}</p>
                            <div className={`flex items-center gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
                                <Calendar className="h-4 w-4 text-gray-400" />
                                <p className="text-base font-medium text-foreground">{formatDate(report.created_at)}</p>
                            </div>
                        </div>

                        {report.resolved_at && (
                            <div className={`space-y-2 ${isRTL ? 'text-right' : ''}`}>
                                <p className="text-sm text-muted-foreground">{t('resolved_at')}</p>
                                <div className={`flex items-center gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
                                    <Clock className="h-4 w-4 text-gray-400" />
                                    <p className="text-base font-medium text-foreground">{formatDate(report.resolved_at)}</p>
                                </div>
                            </div>
                        )}
                    </div>

                    {report.description && (
                        <div className={`space-y-2 ${isRTL ? 'text-right' : ''}`}>
                            <p className="text-sm text-muted-foreground">{t('description')}</p>
                            <p className="text-base text-foreground">{report.description}</p>
                        </div>
                    )}

                    {report.admin_notes && (
                        <div className={`space-y-2 ${isRTL ? 'text-right' : ''}`}>
                            <p className="text-sm text-muted-foreground">{t('admin_notes')}</p>
                            <p className="text-base text-foreground bg-yellow-50 p-3 rounded">{report.admin_notes}</p>
                        </div>
                    )}

                    {report.resolution_notes && (
                        <div className={`space-y-2 ${isRTL ? 'text-right' : ''}`}>
                            <p className="text-sm text-muted-foreground">{t('resolution_notes')}</p>
                            <p className="text-base text-foreground bg-green-50 p-3 rounded">{report.resolution_notes}</p>
                        </div>
                    )}

                    {report.attachments && report.attachments.length > 0 && (
                        <div className={`space-y-2 ${isRTL ? 'text-right' : ''}`}>
                            <p className="text-sm text-muted-foreground">{t('attachments')}</p>
                            <div className="flex flex-wrap gap-2">
                                {report.attachments.map((attachment, index) => (
                                    <a
                                        key={index}
                                        href={attachment}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-purple-600 dark:text-purple-400 hover:underline"
                                    >
                                        {t('attachment')} {index + 1}
                                    </a>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </AppLayout>
    );
}

