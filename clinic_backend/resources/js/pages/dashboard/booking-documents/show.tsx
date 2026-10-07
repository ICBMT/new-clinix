import { type BreadcrumbItem } from '@/types';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ViewLayout, ViewDetailsSection, ViewField, ViewFieldWithIcon } from '@/components/view';
import { useTranslation } from '@/hooks/use-translation';
import { useRTLInit } from '@/hooks/use-rtl-init';
import { useRTL } from '@/hooks/use-rtl';
import { cn } from '@/lib/utils';
import { index as dashboard } from '@/routes/dashboard';
import { Link } from '@inertiajs/react';
import { ArrowLeft, Edit, Calendar, File, Download, Receipt } from 'lucide-react';
import { formatHumanDate } from '@/utils/date-utils';
import { formatFileSize } from '@/utils/file-utils';

interface BookingDocument {
    id: number;
    booking_id: number;
    name: string;
    file_path: string;
    file_name: string;
    file_type?: string;
    file_size?: number;
    created_at: string;
    updated_at: string;
    booking?: {
        id: number;
        booking_reference: string;
    };
}

interface ShowBookingDocumentProps {
    document: BookingDocument;
}

export default function ShowBookingDocument({ document }: ShowBookingDocumentProps) {
    useRTLInit();
    const { t } = useTranslation();
    const { flexDirection, iconMargin } = useRTL();
    
    const breadcrumbs: BreadcrumbItem[] = [
        {
            title: t('dashboard'),
            href: dashboard.url(),
        },
        {
            title: t('booking_documents'),
            href: '/dashboard/booking-documents',
        },
        {
            title: t('document_details'),
            href: '#',
        },
    ];

    return (
        <ViewLayout
            breadcrumbs={breadcrumbs}
            title={t('document_details')}
            description={document.name}
            actions={
                <>
                    <Link href={`/dashboard/booking-documents/${document.id}/download`}>
                        <Button className={cn("flex items-center gap-2", flexDirection)}>
                            <Download className={cn("h-4 w-4", iconMargin('md'))} />
                            {t('download')}
                        </Button>
                    </Link>
                    <Link href={`/dashboard/booking-documents/${document.id}/edit`}>
                        <Button variant="outline" className={cn("flex items-center gap-2", flexDirection)}>
                            <Edit className={cn("h-4 w-4", iconMargin('md'))} />
                            {t('edit')}
                        </Button>
                    </Link>
                    <Link href="/dashboard/booking-documents">
                        <Button variant="outline" className={cn("flex items-center gap-2", flexDirection)}>
                            <ArrowLeft className={cn("h-4 w-4", iconMargin('md'))} />
                            {t('back')}
                        </Button>
                    </Link>
                </>
            }
            backUrl="/dashboard/booking-documents"
            headTitle={`${t('document_details')} - ${document.name}`}
        >
            <ViewDetailsSection title={t('basic_information')} icon={File}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <ViewFieldWithIcon
                        label={t('document_name')}
                        value={document.name}
                        icon={File}
                    />
                    <ViewFieldWithIcon
                        label={t('booking')}
                        value={
                            document.booking ? (
                                <Link 
                                    href={`/dashboard/bookings/${document.booking.id}`}
                                    className="text-primary hover:underline"
                                >
                                    {document.booking.booking_reference}
                                </Link>
                            ) : (
                                '—'
                            )
                        }
                        icon={Receipt}
                    />
                    <ViewField
                        label={t('file_name')}
                        value={document.file_name}
                    />
                    {document.file_type && (
                        <ViewField
                            label={t('file_type')}
                            value={<Badge variant="secondary">{document.file_type}</Badge>}
                        />
                    )}
                    {document.file_size && (
                        <ViewField
                            label={t('file_size')}
                            value={formatFileSize(document.file_size)}
                            dir="ltr"
                        />
                    )}
                    <ViewFieldWithIcon
                        label={t('created_at')}
                        value={formatHumanDate(document.created_at, t)}
                        icon={Calendar}
                    />
                    <ViewFieldWithIcon
                        label={t('updated_at')}
                        value={formatHumanDate(document.updated_at, t)}
                        icon={Calendar}
                    />
                </div>
            </ViewDetailsSection>
        </ViewLayout>
    );
}

