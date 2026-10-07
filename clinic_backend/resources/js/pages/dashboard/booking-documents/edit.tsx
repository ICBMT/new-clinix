import { type BreadcrumbItem } from '@/types';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useTranslation } from '@/hooks/use-translation';
import { useRTL } from '@/hooks/use-rtl';
import { useRTLInit } from '@/hooks/use-rtl-init';
import AppLayout from '@/layouts/app-layout';
import { index as dashboard } from '@/routes/dashboard';
import { Head, Link, useForm, usePage } from '@inertiajs/react';
import { ArrowLeft, Eye, Upload, File, X } from 'lucide-react';
import { FormEventHandler, useState } from 'react';
import { type SharedData } from '@/types';

interface BookingDocument {
    id: number;
    booking_id: number;
    name: string;
    file_path: string;
    file_name: string;
    file_type?: string;
    file_size?: number;
    booking?: {
        id: number;
        booking_reference: string;
    };
}

interface EditBookingDocumentProps {
    document: BookingDocument;
}

export default function EditBookingDocument({ document }: EditBookingDocumentProps) {
    useRTLInit();
    const { t, locale } = useTranslation();
    const page = usePage<SharedData>();
    const { locale: pageLocale } = page.props;
    const isRTL = pageLocale === 'ar';
    const dir = isRTL ? 'rtl' : 'ltr';
    const { flexDirection, getFieldDir, getInputTextAlign, iconMargin } = useRTL();
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    
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
            title: t('edit_booking_document'),
            href: '#',
        },
    ];

    const { data, setData, post, processing, errors } = useForm({
        booking_id: document.booking_id.toString(),
        name: document.name || '',
        file: null as File | null,
        _method: 'PATCH',
    });

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        post(`/dashboard/booking-documents/${document.id}`, {
            forceFormData: true,
        });
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setSelectedFile(file);
            setData('file', file);
        }
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`${t('edit_booking_document')} - ${document.name}`} />

            <div className={cn("flex h-full flex-1 flex-col gap-6 overflow-x-auto rounded-xl bg-card dark:bg-card p-6 border border-border", isRTL ? '!text-right' : '!text-left')} dir={dir}>
                {/* Header */}
                <div className={cn("flex items-center justify-between border-b pb-4", flexDirection)}>
                    <div className={cn(isRTL ? '!text-right' : '!text-left')}>
                        <h1 className={cn("text-3xl font-bold text-foreground", isRTL ? '!text-right' : '!text-left')}>{t('edit_booking_document')}</h1>
                        <p className={cn("text-muted-foreground mt-1", isRTL ? '!text-right' : '!text-left')}>{t('update_document_information')}</p>
                    </div>
                    <div className={cn("flex items-center gap-3", flexDirection)}>
                        <Link href={`/dashboard/booking-documents/${document.id}`}>
                            <Button variant="outline" className={cn("flex items-center gap-2", flexDirection)}>
                                <Eye className={cn("h-4 w-4", iconMargin('md'))} />
                                {t('view')}
                            </Button>
                        </Link>
                        <Link href="/dashboard/booking-documents">
                            <Button variant="outline" className={cn("flex items-center gap-2", flexDirection)}>
                                <ArrowLeft className={cn("h-4 w-4", isRTL && 'rotate-180')} />
                                {t('back')}
                            </Button>
                        </Link>
                    </div>
                </div>

                {/* Form */}
                <form onSubmit={submit} className={cn("max-w-2xl space-y-6", isRTL ? '!text-right' : '!text-left')} dir={dir}>
                    {/* Booking */}
                    <div className={cn("space-y-2", isRTL ? '!text-right' : '!text-left')}>
                        <Label className={cn(isRTL ? '!text-right' : '!text-left')}>{t('booking')}</Label>
                        <div className={cn("p-3 bg-muted rounded-md", isRTL ? '!text-right' : '!text-left')} dir={dir}>
                            <p className={cn("font-medium", isRTL ? '!text-right' : '!text-left')}>
                                {document.booking?.booking_reference || `#${document.booking_id}`}
                            </p>
                        </div>
                    </div>

                    {/* Document Name */}
                    <div className={cn("space-y-2", isRTL ? '!text-right' : '!text-left')}>
                        <Label htmlFor="name" className={cn(isRTL ? '!text-right' : '!text-left')}>
                            {isRTL ? <><span className="text-red-500">*</span> {t('document_name')}</> : <>{t('document_name')} <span className="text-red-500">*</span></>}
                        </Label>
                        <Input
                            id="name"
                            type="text"
                            value={data.name}
                            onChange={(e) => setData('name', e.target.value)}
                            placeholder={t('enter_document_name')}
                            dir={getFieldDir('text')}
                            className={cn(errors.name ? 'border-red-500' : '', getInputTextAlign('text'))}
                            required
                        />
                        {errors.name && (
                            <p className={cn("text-sm text-red-500", isRTL ? '!text-right' : '!text-left')}>{t(errors.name) || errors.name}</p>
                        )}
                    </div>

                    {/* Current File */}
                    <div className={cn("space-y-2", isRTL ? '!text-right' : '!text-left')}>
                        <Label className={cn(isRTL ? '!text-right' : '!text-left')}>{t('current_file')}</Label>
                        <div className={cn("p-3 bg-muted rounded-md flex items-center justify-between", flexDirection)}>
                            <div className={cn("flex items-center gap-2", flexDirection)}>
                                <File className="h-5 w-5" />
                                <span className={cn("font-medium", isRTL ? '!text-right' : '!text-left')}>{document.file_name}</span>
                                {document.file_size && (
                                    <span className={cn("text-sm text-muted-foreground", isRTL ? '!text-right' : '!text-left')}>
                                        ({(document.file_size / 1024 / 1024).toFixed(2)} MB)
                                    </span>
                                )}
                            </div>
                            <Link href={`/dashboard/booking-documents/${document.id}/download`}>
                                <Button variant="outline" size="sm">
                                    {t('download')}
                                </Button>
                            </Link>
                        </div>
                    </div>

                    {/* New File Upload (Optional) */}
                    <div className={cn("space-y-2", isRTL ? '!text-right' : '!text-left')}>
                        <Label htmlFor="file" className={cn(isRTL ? '!text-right' : '!text-left')}>
                            {t('replace_file')} ({t('optional')})
                        </Label>
                        <div className={cn("border-2 border-dashed border-border rounded-lg p-6", isRTL ? '!text-right' : '!text-left')} dir={dir}>
                            <div className="flex flex-col items-center justify-center gap-4">
                                <Upload className="h-12 w-12 text-muted-foreground" />
                                <div className={cn("text-center", isRTL ? '!text-right' : '!text-left')}>
                                    <Label htmlFor="file" className={cn("cursor-pointer", isRTL ? '!text-right' : '!text-left')}>
                                        <span className="text-primary hover:underline">
                                            {t('click_to_upload')}
                                        </span>
                                        {' '}{t('or_drag_and_drop')}
                                    </Label>
                                    <p className={cn("text-sm text-muted-foreground mt-1", isRTL ? '!text-right' : '!text-left')}>
                                        {t('supported_formats')}: PDF, DOC, DOCX, JPG, JPEG, PNG (Max 10MB)
                                    </p>
                                </div>
                                <Input
                                    id="file"
                                    type="file"
                                    onChange={handleFileChange}
                                    accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                                    className="hidden"
                                />
                                {selectedFile && (
                                    <div className={cn("mt-4 flex items-center gap-2 p-3 bg-muted rounded-md w-full", flexDirection)}>
                                        <File className="h-5 w-5" />
                                        <span className={cn("text-sm font-medium flex-1", isRTL ? '!text-right' : '!text-left')}>{selectedFile.name}</span>
                                        <span className={cn("text-xs text-muted-foreground", isRTL ? '!text-right' : '!text-left')}>
                                            ({(selectedFile.size / 1024 / 1024).toFixed(2)} MB)
                                        </span>
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => {
                                                setSelectedFile(null);
                                                setData('file', null);
                                            }}
                                        >
                                            <X className="h-4 w-4" />
                                        </Button>
                                    </div>
                                )}
                            </div>
                        </div>
                        {errors.file && (
                            <p className={cn("text-sm text-red-500", isRTL ? '!text-right' : '!text-left')}>{t(errors.file) || errors.file}</p>
                        )}
                    </div>

                    {/* Actions */}
                    <div className={cn("flex items-center gap-3 pt-4 border-t", flexDirection)}>
                        <Button type="submit" disabled={processing}>
                            {processing ? t('updating') : t('update_document')}
                        </Button>
                        <Link href="/dashboard/booking-documents">
                            <Button type="button" variant="outline">
                                {t('cancel')}
                            </Button>
                        </Link>
                    </div>
                </form>
            </div>
        </AppLayout>
    );
}

