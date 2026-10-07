import { type BreadcrumbItem } from '@/types';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { useTranslation } from '@/hooks/use-translation';
import { useRTL } from '@/hooks/use-rtl';
import { useRTLInit } from '@/hooks/use-rtl-init';
import AppLayout from '@/layouts/app-layout';
import { index as dashboard } from '@/routes/dashboard';
import { Head, Link, useForm, usePage } from '@inertiajs/react';
import { ArrowLeft, Eye } from 'lucide-react';
import { FormEventHandler } from 'react';
import { type SharedData } from '@/types';

interface OperatingHour {
    id: number;
    clinic_id: number;
    day_of_week: string;
    opening_time?: string;
    closing_time?: string;
    is_closed: boolean;
    break_start?: string;
    break_end?: string;
    clinic?: {
        id: number;
        name_en: string;
        name_ar: string;
    };
}

interface EditOperatingHourProps {
    operatingHour: OperatingHour;
}

export default function EditOperatingHour({ operatingHour }: EditOperatingHourProps) {
    useRTLInit();
    const { t, locale } = useTranslation();
    const page = usePage<SharedData>();
    const { locale: pageLocale } = page.props;
    const isRTL = pageLocale === 'ar';
    const dir = isRTL ? 'rtl' : 'ltr';
    const { flexDirection, getFieldDir, getInputTextAlign, iconMargin } = useRTL();
    
    const breadcrumbs: BreadcrumbItem[] = [
        {
            title: t('dashboard'),
            href: dashboard.url(),
        },
        {
            title: t('clinics_operating_hours_management'),
            href: '/dashboard/clinics-operating-hours',
        },
        {
            title: t('edit_operating_hours'),
            href: '#',
        },
    ];

    const { data, setData, patch, processing, errors } = useForm({
        is_open: !operatingHour.is_closed,
        opening_time: operatingHour.opening_time || '',
        closing_time: operatingHour.closing_time || '',
        break_start: operatingHour.break_start || '',
        break_end: operatingHour.break_end || '',
    });

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        patch(`/dashboard/clinics-operating-hours/${operatingHour.id}`);
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`${t('edit_operating_hours')} - ${operatingHour.clinic?.name_en || operatingHour.clinic?.name_ar}`} />

            <div className={cn("flex h-full flex-1 flex-col gap-6 overflow-x-auto rounded-xl bg-card dark:bg-card p-6 border border-border", isRTL ? '!text-right' : '!text-left')} dir={dir}>
                {/* Header */}
                <div className={cn("flex items-center justify-between border-b pb-4", flexDirection)}>
                    <div className={cn(isRTL ? '!text-right' : '!text-left')}>
                        <h1 className={cn("text-3xl font-bold text-foreground", isRTL ? '!text-right' : '!text-left')}>{t('edit_operating_hours')}</h1>
                        <p className={cn("text-muted-foreground mt-1", isRTL ? '!text-right' : '!text-left')}>{t('update_operating_hours')}</p>
                    </div>
                    <div className={cn("flex items-center gap-3", flexDirection)}>
                        <Link href={`/dashboard/clinics-operating-hours/${operatingHour.id}`}>
                            <Button variant="outline" className={cn("flex items-center gap-2", flexDirection)}>
                                <Eye className={cn("h-4 w-4", iconMargin('md'))} />
                                {t('view')}
                            </Button>
                        </Link>
                        <Link href="/dashboard/clinics-operating-hours">
                            <Button variant="outline" className={cn("flex items-center gap-2", flexDirection)}>
                                <ArrowLeft className={cn("h-4 w-4", isRTL && 'rotate-180')} />
                                {t('back')}
                            </Button>
                        </Link>
                    </div>
                </div>

                <form onSubmit={submit} className={cn("space-y-6", isRTL ? '!text-right' : '!text-left')} dir={dir}>
                    {/* Day of Week (Read-only) */}
                    <div className={cn("space-y-2", isRTL ? '!text-right' : '!text-left')}>
                        <Label className={cn(isRTL ? '!text-right' : '!text-left')}>{t('day_of_week')}</Label>
                        <Input
                            value={t(operatingHour.day_of_week)}
                            disabled
                            className={cn("bg-muted", isRTL ? '!text-right' : '!text-left')}
                        />
                    </div>

                    {/* Is Open */}
                    <div className={cn("flex items-center justify-between p-4 border rounded-lg", flexDirection)}>
                        <div className={cn("space-y-0.5", isRTL ? '!text-right' : '!text-left')}>
                            <Label htmlFor="is_open" className={cn(isRTL ? '!text-right' : '!text-left')}>{t('is_open')}</Label>
                            <p className={cn("text-sm text-muted-foreground", isRTL ? '!text-right' : '!text-left')}>{t('is_open_description')}</p>
                        </div>
                        <Switch
                            id="is_open"
                            checked={data.is_open}
                            onCheckedChange={(checked) => setData('is_open', checked)}
                        />
                    </div>

                    {/* Operating Hours */}
                    {data.is_open && (
                        <div className={cn("space-y-4", isRTL ? '!text-right' : '!text-left')}>
                            <h3 className={cn("text-lg font-semibold", isRTL ? '!text-right' : '!text-left')}>{t('operating_hours')}</h3>
                            <div className="grid gap-4 md:grid-cols-2">
                                <div className={cn("space-y-2", isRTL ? '!text-right' : '!text-left')}>
                                    <Label htmlFor="opening_time" className={cn(isRTL ? '!text-right' : '!text-left')}>
                                        {isRTL ? <><span className="text-red-500">*</span> {t('opening_time')}</> : <>{t('opening_time')} <span className="text-red-500">*</span></>}
                                    </Label>
                                    <Input
                                        id="opening_time"
                                        type="time"
                                        value={data.opening_time}
                                        onChange={(e) => setData('opening_time', e.target.value)}
                                        className={cn(errors.opening_time ? 'border-red-500' : '', isRTL ? '!text-right' : '!text-left')}
                                        required={data.is_open}
                                    />
                                    {errors.opening_time && (
                                        <p className={cn("text-sm text-red-500", isRTL ? '!text-right' : '!text-left')}>{t(errors.opening_time) || errors.opening_time}</p>
                                    )}
                                </div>

                                <div className={cn("space-y-2", isRTL ? '!text-right' : '!text-left')}>
                                    <Label htmlFor="closing_time" className={cn(isRTL ? '!text-right' : '!text-left')}>
                                        {isRTL ? <><span className="text-red-500">*</span> {t('closing_time')}</> : <>{t('closing_time')} <span className="text-red-500">*</span></>}
                                    </Label>
                                    <Input
                                        id="closing_time"
                                        type="time"
                                        value={data.closing_time}
                                        onChange={(e) => setData('closing_time', e.target.value)}
                                        className={cn(errors.closing_time ? 'border-red-500' : '', isRTL ? '!text-right' : '!text-left')}
                                        required={data.is_open}
                                    />
                                    {errors.closing_time && (
                                        <p className={cn("text-sm text-red-500", isRTL ? '!text-right' : '!text-left')}>{t(errors.closing_time) || errors.closing_time}</p>
                                    )}
                                </div>
                            </div>

                            {/* Break Time (Optional) */}
                            <div className={cn("space-y-4", isRTL ? '!text-right' : '!text-left')}>
                                <h4 className={cn("text-md font-semibold", isRTL ? '!text-right' : '!text-left')}>{t('break_time')} ({t('optional')})</h4>
                                <div className="grid gap-4 md:grid-cols-2">
                                    <div className={cn("space-y-2", isRTL ? '!text-right' : '!text-left')}>
                                        <Label htmlFor="break_start" className={cn(isRTL ? '!text-right' : '!text-left')}>{t('break_start')}</Label>
                                        <Input
                                            id="break_start"
                                            type="time"
                                            value={data.break_start}
                                            onChange={(e) => setData('break_start', e.target.value)}
                                            className={cn(errors.break_start ? 'border-red-500' : '', isRTL ? '!text-right' : '!text-left')}
                                        />
                                        {errors.break_start && (
                                            <p className={cn("text-sm text-red-500", isRTL ? '!text-right' : '!text-left')}>{t(errors.break_start) || errors.break_start}</p>
                                        )}
                                    </div>

                                    <div className={cn("space-y-2", isRTL ? '!text-right' : '!text-left')}>
                                        <Label htmlFor="break_end" className={cn(isRTL ? '!text-right' : '!text-left')}>{t('break_end')}</Label>
                                        <Input
                                            id="break_end"
                                            type="time"
                                            value={data.break_end}
                                            onChange={(e) => setData('break_end', e.target.value)}
                                            className={cn(errors.break_end ? 'border-red-500' : '', isRTL ? '!text-right' : '!text-left')}
                                        />
                                        {errors.break_end && (
                                            <p className={cn("text-sm text-red-500", isRTL ? '!text-right' : '!text-left')}>{t(errors.break_end) || errors.break_end}</p>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Actions */}
                    <div className={cn("flex items-center justify-end gap-3 border-t pt-4", flexDirection)}>
                        <Link href={`/dashboard/clinics-operating-hours/${operatingHour.id}`}>
                            <Button type="button" variant="outline">
                                {t('cancel')}
                            </Button>
                        </Link>
                        <Button type="submit" disabled={processing}>
                            {processing ? t('updating') : t('update')}
                        </Button>
                    </div>
                </form>
            </div>
        </AppLayout>
    );
}

