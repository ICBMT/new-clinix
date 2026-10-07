import { type BreadcrumbItem } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { useRTLInit } from '@/hooks/use-rtl-init';
import { useTranslation } from '@/hooks/use-translation';
import { useRTL } from '@/hooks/use-rtl';
import AppLayout from '@/layouts/app-layout';
import { index as dashboard } from '@/routes/dashboard';
import { Head, Link, useForm } from '@inertiajs/react';
import { ArrowLeft, Eye } from 'lucide-react';
import { FormEventHandler } from 'react';
import { cn } from '@/lib/utils';

interface ReportReason {
    id: number;
    name_en: string;
    name_ar: string;
    key: string;
    is_active: boolean;
    sort_order: number;
    requires_description: boolean;
}

interface EditReportReasonProps {
    reportReason: ReportReason;
}

export default function EditReportReason({ reportReason }: EditReportReasonProps) {
    useRTLInit();
    const { t, locale } = useTranslation();
    const { isRTL, dir, textAlign, flexDirection, iconMargin, getFieldDir, getInputTextAlign } = useRTL();
    
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
            title: t('edit_report_reason'),
            href: '#',
        },
    ];

    const { data, setData, patch, processing, errors } = useForm({
        name_en: reportReason.name_en || '',
        name_ar: reportReason.name_ar || '',
        key: reportReason.key || '',
        is_active: reportReason.is_active ?? true,
        sort_order: reportReason.sort_order || 0,
        requires_description: reportReason.requires_description ?? false,
        _method: 'PATCH',
    });

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        patch(`/dashboard/report-reasons/${reportReason.id}`);
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`${t('edit_report_reason')} - ${reportReason.name_en}`} />

            <div className={cn("flex h-full flex-1 flex-col gap-6 overflow-x-auto rounded-xl bg-card dark:bg-card p-6 border border-border", textAlign)} dir={dir}>
                <div className={cn("flex items-center justify-between border-b pb-4", flexDirection)}>
                    <div className={textAlign}>
                        <h1 className={cn("text-3xl font-bold text-foreground", textAlign)}>{t('edit_report_reason')}</h1>
                        <p className={cn("text-muted-foreground mt-1", textAlign)}>{t('update_report_reason_information')}</p>
                    </div>
                    <div className={cn("flex items-center gap-3", flexDirection)}>
                        <Link href={`/dashboard/report-reasons/${reportReason.id}`}>
                            <Button variant="outline" className={cn("flex items-center gap-2", flexDirection)}>
                                <Eye className={cn("h-4 w-4", iconMargin('md'))} />
                                {t('view')}
                            </Button>
                        </Link>
                        <Link href="/dashboard/report-reasons">
                            <Button variant="outline" className={cn("flex items-center gap-2", flexDirection)}>
                                <ArrowLeft className={cn("h-4 w-4", isRTL && 'rotate-180', iconMargin('md'))} />
                                {t('back')}
                            </Button>
                        </Link>
                    </div>
                </div>

                <form onSubmit={submit} className={cn("max-w-2xl space-y-6", textAlign)} dir={dir}>
                    <div className={cn("space-y-2", textAlign)}>
                        <Label htmlFor="name_en" className={textAlign}>
                            {t('name_en')} <span className="text-red-500">*</span>
                        </Label>
                        <Input
                            id="name_en"
                            type="text"
                            value={data.name_en}
                            onChange={(e) => setData('name_en', e.target.value)}
                            placeholder={t('enter_name_en')}
                            dir={getFieldDir('text')}
                            className={cn(errors.name_en ? 'border-red-500' : '', getInputTextAlign('text'))}
                            required
                        />
                        {errors.name_en && (
                            <p className={cn("text-sm text-red-500", textAlign)} dir={dir}>{errors.name_en}</p>
                        )}
                    </div>

                    <div className={cn("space-y-2", textAlign)}>
                        <Label htmlFor="name_ar" className={textAlign}>
                            {t('name_ar')} <span className="text-red-500">*</span>
                        </Label>
                        <Input
                            id="name_ar"
                            type="text"
                            value={data.name_ar}
                            onChange={(e) => setData('name_ar', e.target.value)}
                            placeholder={t('enter_name_ar')}
                            dir={getFieldDir('text')}
                            className={cn(errors.name_ar ? 'border-red-500' : '', getInputTextAlign('text'))}
                            required
                        />
                        {errors.name_ar && (
                            <p className={cn("text-sm text-red-500", textAlign)} dir={dir}>{errors.name_ar}</p>
                        )}
                    </div>

                    <div className={cn("space-y-2", textAlign)}>
                        <Label htmlFor="key" className={textAlign}>
                            {t('key')} <span className="text-red-500">*</span>
                        </Label>
                        <Input
                            id="key"
                            type="text"
                            value={data.key}
                            onChange={(e) => setData('key', e.target.value.toLowerCase().replace(/\s+/g, '_'))}
                            placeholder={t('key_placeholder') || 'e.g., inappropriate_content'}
                            dir={getFieldDir('text')}
                            className={cn(errors.key ? 'border-red-500' : '', getInputTextAlign('text'))}
                            required
                        />
                        <p className={cn("text-xs text-muted-foreground", textAlign)} dir={dir}>{t('key_helper_text')}</p>
                        {errors.key && (
                            <p className={cn("text-sm text-red-500", textAlign)} dir={dir}>{errors.key}</p>
                        )}
                    </div>

                    <div className={cn("space-y-2", textAlign)}>
                        <Label htmlFor="sort_order" className={textAlign}>{t('sort_order')}</Label>
                        <Input
                            id="sort_order"
                            type="number"
                            value={data.sort_order}
                            onChange={(e) => setData('sort_order', parseInt(e.target.value) || 0)}
                            placeholder="0"
                            min="0"
                            dir={getFieldDir('number')}
                            className={cn(errors.sort_order ? 'border-red-500' : '', getInputTextAlign('number'))}
                        />
                        {errors.sort_order && (
                            <p className={cn("text-sm text-red-500", textAlign)} dir={dir}>{errors.sort_order}</p>
                        )}
                    </div>

                    <div className={cn("flex items-center justify-between pt-4 border-t", flexDirection)}>
                        <Label htmlFor="is_active" className={cn("flex flex-col", textAlign)}>
                            <span className={textAlign}>{t('is_active')}</span>
                        </Label>
                        <Switch
                            id="is_active"
                            checked={data.is_active}
                            onCheckedChange={(checked) => setData('is_active', checked)}
                        />
                    </div>

                    <div className={cn("flex items-center justify-between pt-4 border-t", flexDirection)}>
                        <Label htmlFor="requires_description" className={cn("flex flex-col", textAlign)}>
                            <span className={textAlign}>{t('requires_description')}</span>
                            <span className={cn("text-xs text-muted-foreground", textAlign)} dir={dir}>{t('requires_description_helper')}</span>
                        </Label>
                        <Switch
                            id="requires_description"
                            checked={data.requires_description}
                            onCheckedChange={(checked) => setData('requires_description', checked)}
                        />
                    </div>

                    <div className={cn("flex items-center gap-3 pt-4 border-t", flexDirection)}>
                        <Button type="submit" disabled={processing}>
                            {processing ? t('updating') : t('update_report_reason')}
                        </Button>
                        <Link href="/dashboard/report-reasons">
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

