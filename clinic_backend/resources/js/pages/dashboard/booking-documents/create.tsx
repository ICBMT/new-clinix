import { type BreadcrumbItem } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useTranslation } from '@/hooks/use-translation';
import { useRTL } from '@/hooks/use-rtl';
import { useRTLInit } from '@/hooks/use-rtl-init';
import AppLayout from '@/layouts/app-layout';
import { index as dashboard } from '@/routes/dashboard';
import { Head, Link, useForm, usePage } from '@inertiajs/react';
import { ArrowLeft, Upload, File } from 'lucide-react';
import { FormEventHandler, useState } from 'react';
import { cn } from '@/lib/utils';
import { type SharedData } from '@/types';

interface Booking {
    id: number;
    booking_reference: string;
}

interface CreateBookingDocumentProps {
    booking?: Booking | null;
}

export default function CreateBookingDocument({ booking }: CreateBookingDocumentProps) {
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
            title: t('create_booking_document'),
            href: '/dashboard/booking-documents/create',
        },
    ];

    const { data, setData, post, processing, errors } = useForm({
        booking_id: booking?.id?.toString() || '',
        name: '',
        file: null as File | null,
    });

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        post('/dashboard/booking-documents', {
            forceFormData: true,
        });
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setSelectedFile(file);
            setData('file', file);
            if (!data.name) {
                setData('name', file.name);
            }
        }
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={t('create_booking_document')} />

            <div className={cn("flex h-full flex-1 flex-col gap-6 overflow-x-auto rounded-xl bg-card dark:bg-card p-6 border border-border", isRTL ? '!text-right' : '!text-left')} dir={dir}>
                {/* Header */}
                <div className={cn("flex items-center justify-between border-b pb-4", flexDirection)}>
                    <div className={cn(isRTL ? '!text-right' : '!text-left')}>
                        <h1 className={cn("text-3xl font-bold text-foreground", isRTL ? '!text-right' : '!text-left')}>{t('create_booking_document')}</h1>
                        <p className={cn("text-muted-foreground mt-1", isRTL ? '!text-right' : '!text-left')}>{t('upload_new_document')}</p>
                    </div>
                    
                    <Link href="/dashboard/booking-documents">
                        <Button variant="outline" className={cn("flex items-center gap-2", flexDirection)}>
                            <ArrowLeft className={cn("h-4 w-4", isRTL && 'rotate-180')} />
                            {t('back')}
                        </Button>
                    </Link>
                </div>

                {/* Form */}
                <form onSubmit={submit} className={cn("max-w-2xl space-y-6", isRTL ? '!text-right' : '!text-left')} dir={dir}>
                    {/* Booking ID */}
                    <div className={cn("space-y-2", isRTL ? '!text-right' : '!text-left')}>
                        <Label htmlFor="booking_id" className={cn(isRTL ? '!text-right' : '!text-left')}>
                            {isRTL ? <><span className="text-red-500">*</span> {t('booking')}</> : <>{t('booking')} <span className="text-red-500">*</span></>}
                        </Label>
                        {booking ? (
                            <div className={cn("p-3 bg-muted rounded-md", isRTL ? '!text-right' : '!text-left')} dir={dir}>
                                <p className={cn("font-medium", isRTL ? '!text-right' : '!text-left')}>{booking.booking_reference}</p>
                            </div>
                        ) : (
                            <Input
                                id="booking_id"
                                type="text"
                                value={data.booking_id}
                                onChange={(e) => setData('booking_id', e.target.value)}
                                placeholder={t('enter_booking_id')}
                                dir={getFieldDir('text')}
                                className={cn(errors.booking_id ? 'border-red-500' : '', getInputTextAlign('text'))}
                                required
                            />
                        )}
                        {errors.booking_id && (
                            <p className={cn("text-sm text-red-500", isRTL ? '!text-right' : '!text-left')}>{t(errors.booking_id) || errors.booking_id}</p>
                        )}
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

                    {/* File Upload */}
                    <div className={cn("space-y-2", isRTL ? '!text-right' : '!text-left')}>
                        <Label htmlFor="file" className={cn(isRTL ? '!text-right' : '!text-left')}>
                            {isRTL ? <><span className="text-red-500">*</span> {t('file')}</> : <>{t('file')} <span className="text-red-500">*</span></>}
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
                                    <div className={cn("mt-4 flex items-center gap-2 p-3 bg-muted rounded-md", flexDirection)}>
                                        <File className="h-5 w-5" />
                                        <span className={cn("text-sm font-medium", isRTL ? '!text-right' : '!text-left')}>{selectedFile.name}</span>
                                        <span className={cn("text-xs text-muted-foreground", isRTL ? '!text-right' : '!text-left')}>
                                            ({(selectedFile.size / 1024 / 1024).toFixed(2)} MB)
                                        </span>
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
                            {processing ? t('uploading') : t('upload_document')}
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

