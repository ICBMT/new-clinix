import { type BreadcrumbItem } from '@/types';
import { Badge } from '@/components/ui/badge';
import { ViewLayout, ViewDetailsSection, ViewField, ViewFieldWithIcon } from '@/components/view';
import { useRTLInit } from '@/hooks/use-rtl-init';
import { useTranslation } from '@/hooks/use-translation';
import { index as dashboard } from '@/routes/dashboard';
import { Calendar, Clock, FileText } from 'lucide-react';

interface ReportReason {
    id: number;
    name_en: string;
    name_ar: string;
    key: string;
    is_active: boolean;
    sort_order: number;
    requires_description: boolean;
    created_at: string;
    updated_at: string;
}

interface ShowReportReasonProps {
    reportReason: ReportReason;
}

export default function ShowReportReason({ reportReason }: ShowReportReasonProps) {
    useRTLInit();
    const { t, locale } = useTranslation();
    
    const breadcrumbs: BreadcrumbItem[] = [
        {
            title: t('dashboard'),
            href: dashboard.url(),
        },
        {
            title: t('report_reasons_management'),
            href: '/dashboard/report-reasons',
        },
        {
            title: t('view_report_reason'),
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

    const displayName = locale === 'ar' ? reportReason.name_ar : reportReason.name_en;

    return (
        <ViewLayout
            breadcrumbs={breadcrumbs}
            title={t('report_reason_details')}
            description={t('view_report_reason_information')}
            status={{
                value: reportReason.is_active ? 'active' : 'inactive',
                variant: reportReason.is_active ? 'default' : 'secondary',
                className: reportReason.is_active 
                    ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300' 
                    : 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300',
            }}
            editUrl={`/dashboard/report-reasons/${reportReason.id}/edit`}
            backUrl="/dashboard/report-reasons"
            editLabel={t('edit_report_reason')}
            headTitle={`${t('report_reason_details')} - ${displayName}`}
        >
            <ViewDetailsSection title={t('basic_information')} icon={FileText}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <ViewField
                        label={t('name_en')}
                        value={reportReason.name_en}
                        dir="ltr"
                    />
                    <ViewField
                        label={t('name_ar')}
                        value={reportReason.name_ar}
                        dir="rtl"
                    />
                    <ViewField
                        label={t('key')}
                        value={<Badge variant="outline" dir="ltr">{reportReason.key}</Badge>}
                    />
                    <ViewField
                        label={t('status')}
                        value={
                            <Badge 
                                variant={reportReason.is_active ? 'default' : 'secondary'}
                                className={reportReason.is_active 
                                    ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300' 
                                    : 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300'
                                }
                            >
                                {reportReason.is_active ? t('active') : t('inactive')}
                            </Badge>
                        }
                    />
                    <ViewField
                        label={t('requires_description')}
                        value={
                            <Badge variant={reportReason.requires_description ? 'default' : 'outline'}>
                                {reportReason.requires_description ? t('yes') : t('no')}
                            </Badge>
                        }
                    />
                    <ViewField
                        label={t('sort_order')}
                        value={reportReason.sort_order}
                        dir="ltr"
                    />
                    <ViewFieldWithIcon
                        label={t('created_at')}
                        value={formatDate(reportReason.created_at)}
                        icon={Calendar}
                    />
                    <ViewFieldWithIcon
                        label={t('updated_at')}
                        value={formatDate(reportReason.updated_at)}
                        icon={Clock}
                    />
                </div>
            </ViewDetailsSection>
        </ViewLayout>
    );
}

