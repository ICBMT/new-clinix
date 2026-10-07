import { type BreadcrumbItem } from '@/types';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useRTLInit } from '@/hooks/use-rtl-init';
import { useTranslation } from '@/hooks/use-translation';
import { useRTL } from '@/hooks/use-rtl';
import AppLayout from '@/layouts/app-layout';
import { index as dashboard } from '@/routes/dashboard';
import { Head, Link } from '@inertiajs/react';
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

export default function ShowServiceReport({ report }: ShowReportProps) {
    useRTLInit();
    const { t, locale } = useTranslation();
    const { isRTL, dir, textAlign, flexDirection, iconMargin } = useRTL();
    
    const breadcrumbs: BreadcrumbItem[] = [
        {
            title: t('dashboard'),
            href: dashboard.url(),
        },
        {
            title: t('services_reports'),
            href: '/dashboard/services-reports',
        },
        {
            title: t('view_report'),
            href: '#',
        },
    ];

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

            <div className={cn("flex h-full flex-1 flex-col gap-6 overflow-x-auto rounded-xl bg-card dark:bg-card p-6 border border-border", textAlign)} dir={dir}>
                <div className={cn("border-b pb-4 space-y-4", textAlign)}>
                    {/* Back button */}
                    <div className={cn("flex", isRTL ? 'justify-end' : 'justify-start')}>
                        <Link href="/dashboard/reports">
                            <Button variant="outline" className={cn("flex items-center gap-2", flexDirection)}>
                                <ArrowLeft className={cn("h-4 w-4", isRTL && 'rotate-180', iconMargin('md'))} />
                                {t('back')}
                            </Button>
                        </Link>
                    </div>
                    
                    {/* Title */}
                    <div className={textAlign}>
                        <h1 className={cn("text-3xl font-bold text-foreground", textAlign)}>{t('report_details')}</h1>
                        <p className={cn("text-muted-foreground mt-1", textAlign)}>{t('view_report_information')}</p>
                    </div>
                    
                </div>

                <div className={cn("space-y-4", textAlign)}>
                    <h3 className={cn("text-lg font-semibold text-foreground", textAlign)}>{t('basic_information')}</h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {report.service && (
                            <div className={cn("space-y-2", textAlign)}>
                                <p className={cn("text-sm text-muted-foreground", textAlign)}>{t('service')}</p>
                                <p className={cn("text-base font-medium text-foreground", textAlign)} dir={dir}>
                                    {isRTL ? report.service.name_ar : report.service.name_en}
                                </p>
                            </div>
                        )}

                        {report.vendor && (
                            <div className={cn("space-y-2", textAlign)}>
                                <p className={cn("text-sm text-muted-foreground", textAlign)}>{t('vendor')}</p>
                                <p className={cn("text-base font-medium text-foreground", textAlign)} dir={dir}>{report.vendor.name}</p>
                            </div>
                        )}

                        {report.user && (
                            <div className={cn("space-y-2", textAlign)}>
                                <p className={cn("text-sm text-muted-foreground", textAlign)}>{t('reported_by')}</p>
                                <div className={textAlign}>
                                    <p className={cn("text-base font-medium text-foreground", textAlign)} dir={dir}>{report.user.name}</p>
                                    <p className={cn("text-sm text-muted-foreground", textAlign)} dir="ltr">{report.user.email}</p>
                                </div>
                            </div>
                        )}

                        <div className={cn("space-y-2", textAlign)}>
                            <p className={cn("text-sm text-muted-foreground", textAlign)}>{t('status')}</p>
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

                        <div className={cn("space-y-2", textAlign)}>
                            <p className={cn("text-sm text-muted-foreground", textAlign)}>{t('created_at')}</p>
                            <div className={cn("flex items-center gap-2", flexDirection)}>
                                <Calendar className={cn("h-4 w-4 text-gray-400", iconMargin('md'))} />
                                <p className={cn("text-base font-medium text-foreground", textAlign)} dir={dir}>{formatDate(report.created_at)}</p>
                            </div>
                        </div>

                        {report.resolved_at && (
                            <div className={cn("space-y-2", textAlign)}>
                                <p className={cn("text-sm text-muted-foreground", textAlign)}>{t('resolved_at')}</p>
                                <div className={cn("flex items-center gap-2", flexDirection)}>
                                    <Clock className={cn("h-4 w-4 text-gray-400", iconMargin('md'))} />
                                    <p className={cn("text-base font-medium text-foreground", textAlign)} dir={dir}>{formatDate(report.resolved_at)}</p>
                                </div>
                            </div>
                        )}
                    </div>

                    {report.description && (
                        <div className={cn("space-y-2", textAlign)}>
                            <p className={cn("text-sm text-muted-foreground", textAlign)}>{t('description')}</p>
                            <p className={cn("text-base text-foreground", textAlign)} dir={dir}>{report.description}</p>
                        </div>
                    )}

                    {report.admin_notes && (
                        <div className={cn("space-y-2", textAlign)}>
                            <p className={cn("text-sm text-muted-foreground", textAlign)}>{t('admin_notes')}</p>
                            <p className={cn("text-base text-foreground bg-yellow-50 p-3 rounded", textAlign)} dir={dir}>{report.admin_notes}</p>
                        </div>
                    )}

                    {report.resolution_notes && (
                        <div className={cn("space-y-2", textAlign)}>
                            <p className={cn("text-sm text-muted-foreground", textAlign)}>{t('resolution_notes')}</p>
                            <p className={cn("text-base text-foreground bg-green-50 p-3 rounded", textAlign)} dir={dir}>{report.resolution_notes}</p>
                        </div>
                    )}

                    {report.attachments && report.attachments.length > 0 && (
                        <div className={cn("space-y-2", textAlign)}>
                            <p className={cn("text-sm text-muted-foreground", textAlign)}>{t('attachments')}</p>
                            <div className={cn("flex flex-wrap gap-2", flexDirection)}>
                                {report.attachments.map((attachment, index) => (
                                    <a
                                        key={index}
                                        href={attachment}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className={cn("text-purple-600 dark:text-purple-400 hover:underline", textAlign)}
                                        dir="ltr"
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

