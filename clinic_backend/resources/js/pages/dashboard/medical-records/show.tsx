import { type BreadcrumbItem } from '@/types';
import { Button } from '@/components/ui/button';
import { ViewLayout, ViewDetailsSection, ViewField, ViewFieldWithIcon } from '@/components/view';
import { useRTLInit } from '@/hooks/use-rtl-init';
import { useTranslation } from '@/hooks/use-translation';
import { useRTL } from '@/hooks/use-rtl';
import { cn } from '@/lib/utils';
import { index as dashboard } from '@/routes/dashboard';
import { Link } from '@inertiajs/react';
import { Download, Calendar, User, FileText } from 'lucide-react';

interface ShowMedicalRecordProps {
    record: {
        id: number;
        file_name: string;
        file_size?: number;
        mime_type?: string;
        disk?: string;
        created_at: string;
        mediable?: {
            id: number;
            name: string;
            email: string;
            phone?: string;
        } | null;
    };
}

export default function ShowMedicalRecord({ record }: ShowMedicalRecordProps) {
    useRTLInit();
    const { t, locale } = useTranslation();
    const { flexDirection, iconMargin } = useRTL();
    
    const breadcrumbs: BreadcrumbItem[] = [
        {
            title: t('dashboard'),
            href: dashboard.url(),
        },
        {
            title: t('medical_records_management'),
            href: '/dashboard/medical-records',
        },
        {
            title: t('view_record'),
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

    const formatFileSize = (bytes?: number) => {
        if (!bytes) return t('unknown');
        const kb = bytes / 1024;
        const mb = kb / 1024;
        if (mb >= 1) return `${mb.toFixed(2)} MB`;
        return `${kb.toFixed(2)} KB`;
    };

    return (
        <ViewLayout
            breadcrumbs={breadcrumbs}
            title={t('medical_record_details')}
            description={t('view_medical_record_information')}
            actions={
                <Button
                    onClick={() => {
                        window.open(`/dashboard/medical-records/${record.id}/download`, '_blank');
                    }}
                    className={cn("flex items-center gap-2", flexDirection)}
                >
                    <Download className={cn("h-4 w-4", iconMargin('md'))} />
                    {t('download')}
                </Button>
            }
            backUrl="/dashboard/medical-records"
            headTitle={`${t('medical_record_details')} - ${record.file_name}`}
        >
            <ViewDetailsSection title={t('file_information')} icon={FileText}>
                {/* File Header */}
                <div className={cn("flex items-start gap-6 mb-6", flexDirection)}>
                    <div className="bg-muted/50 dark:bg-muted/30 rounded-lg p-8 border">
                        <FileText className="h-16 w-16 text-muted-foreground" />
                    </div>
                    <div className="flex-1">
                        <h2 className="text-2xl font-bold">{record.file_name}</h2>
                        {record.mime_type && (
                            <p className="text-lg text-muted-foreground">{record.mime_type}</p>
                        )}
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {record.mediable && (
                        <ViewFieldWithIcon
                            label={t('user')}
                            value={
                                <div className="bg-muted/50 dark:bg-muted/30 rounded-lg p-4 border">
                                    <Link 
                                        href={`/dashboard/users/${record.mediable.id}`}
                                        className="text-primary hover:underline font-medium block"
                                    >
                                        {record.mediable.name}
                                    </Link>
                                    <p className="text-sm text-muted-foreground" dir="ltr">{record.mediable.email}</p>
                                    {record.mediable.phone && (
                                        <p className="text-sm text-muted-foreground" dir="ltr">{record.mediable.phone}</p>
                                    )}
                                </div>
                            }
                            icon={User}
                            spanCols={2}
                        />
                    )}
                    <ViewField
                        label={t('file_size')}
                        value={formatFileSize(record.file_size)}
                        dir="ltr"
                    />
                    <ViewFieldWithIcon
                        label={t('uploaded_at')}
                        value={formatDate(record.created_at)}
                        icon={Calendar}
                    />
                    {record.disk && (
                        <ViewField
                            label={t('storage_disk')}
                            value={record.disk}
                            dir="ltr"
                            valueClassName="font-mono"
                        />
                    )}
                </div>
            </ViewDetailsSection>
        </ViewLayout>
    );
}

