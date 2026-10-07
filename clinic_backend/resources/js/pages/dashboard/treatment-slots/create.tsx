import { type BreadcrumbItem } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useRTLInit } from '@/hooks/use-rtl-init';
import { useTranslation } from '@/hooks/use-translation';
import { useRTL } from '@/hooks/use-rtl';
import AppLayout from '@/layouts/app-layout';
import { index as dashboard } from '@/routes/dashboard';
import { Head, Link, useForm, usePage } from '@inertiajs/react';
import { ArrowLeft } from 'lucide-react';
import { FormEventHandler, useEffect } from 'react';
import { customToast } from '@/components/ui/custom-toast';
import { cn } from '@/lib/utils';

interface Treatment {
    id: number;
    name_en: string;
    name_ar: string;
}

interface CreateTreatmentSlotProps {
    treatments: Treatment[];
}

export default function CreateTreatmentSlot({ treatments }: CreateTreatmentSlotProps) {
    useRTLInit();
    const { t, locale } = useTranslation();
    const { isRTL, dir, textAlign, flexDirection, iconMargin, getFieldDir, getInputTextAlign } = useRTL();
    const { flash } = usePage().props as { flash?: { success?: string; error?: string } };

    // Flash messages
    useEffect(() => {
        if (flash?.success) {
            customToast.success(flash.success);
        }
        if (flash?.error) {
            customToast.error(flash.error);
        }
    }, [flash]);
    
    const breadcrumbs: BreadcrumbItem[] = [
        {
            title: t('dashboard'),
            href: dashboard.url(),
        },
        {
            title: t('treatment_slots_management'),
            href: '/dashboard/treatment-slots',
        },
        {
            title: t('create_treatment_slot'),
            href: '/dashboard/treatment-slots/create',
        },
    ];

    const { data, setData, post, processing, errors } = useForm({
        treatment_id: '',
        slot_date: '',
        start_time: '',
        end_time: '',
        buffer_time_minutes: '',
        max_bookings_per_slot: '',
        slot_duration: '',
        status: 'available',
        price: '',
        notes_en: '',
        notes_ar: '',
    });

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        post('/dashboard/treatment-slots', {
            onSuccess: () => {
                customToast.success(t('treatment_slot_created_successfully'));
            },
            onError: (errors) => {
                if (errors && Object.keys(errors).length > 0) {
                    Object.values(errors).forEach((error) => {
                        if (typeof error === 'string') {
                            customToast.error(error);
                        } else if (Array.isArray(error)) {
                            error.forEach((err: any) => customToast.error(err));
                        }
                    });
                }
            },
        });
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={t('create_treatment_slot')} />
            
            <div className={cn("flex h-full flex-1 flex-col gap-6 overflow-x-auto rounded-xl bg-card dark:bg-card p-6 border border-border", textAlign)} dir={dir}>
                {/* Header */}
                <div className={cn("flex items-center justify-between border-b pb-4", flexDirection)}>
                    <div className={textAlign}>
                        <h1 className={cn("text-3xl font-bold text-foreground", textAlign)}>{t('create_treatment_slot')}</h1>
                        <p className={cn("text-muted-foreground mt-1", textAlign)}>{t('create_new_treatment_slot_description')}</p>
                    </div>
                    
                    <Link href="/dashboard/treatment-slots">
                        <Button variant="outline" className={cn("flex items-center gap-2", flexDirection)}>
                            <ArrowLeft className={cn("h-4 w-4", isRTL && 'rotate-180', iconMargin('md'))} />
                            {t('back')}
                        </Button>
                    </Link>
                </div>

                <form onSubmit={submit} className={cn("space-y-6", textAlign)} dir={dir}>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className={cn("space-y-2", textAlign)}>
                            <Label htmlFor="treatment_id" className={textAlign}>{t('treatment')}</Label>
                            <Select value={data.treatment_id} onValueChange={(value) => setData('treatment_id', value)}>
                                <SelectTrigger className={cn(errors.treatment_id ? 'border-red-500' : '', textAlign)} dir={dir}>
                                    <SelectValue placeholder={t('select_treatment')} />
                                </SelectTrigger>
                                <SelectContent dir={dir}>
                                    {treatments.map((treatment) => (
                                        <SelectItem key={treatment.id} value={treatment.id.toString()}>
                                            {treatment.name_en} / {treatment.name_ar}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            {errors.treatment_id && <p className={cn("text-sm text-red-500", textAlign)} dir={dir}>{errors.treatment_id}</p>}
                        </div>

                        <div className={cn("space-y-2", textAlign)}>
                            <Label htmlFor="slot_date" className={textAlign}>{t('date')}</Label>
                            <Input
                                id="slot_date"
                                type="date"
                                value={data.slot_date}
                                onChange={(e) => setData('slot_date', e.target.value)}
                                dir={getFieldDir('text')}
                                className={cn(errors.slot_date ? 'border-red-500' : '', getInputTextAlign('text'))}
                            />
                            {errors.slot_date && <p className={cn("text-sm text-red-500", textAlign)} dir={dir}>{errors.slot_date}</p>}
                        </div>

                        <div className={cn("space-y-2", textAlign)}>
                            <Label htmlFor="start_time" className={textAlign}>{t('start_time')}</Label>
                            <Input
                                id="start_time"
                                type="time"
                                value={data.start_time}
                                onChange={(e) => setData('start_time', e.target.value)}
                                dir={getFieldDir('text')}
                                className={cn(errors.start_time ? 'border-red-500' : '', getInputTextAlign('text'))}
                            />
                            {errors.start_time && <p className={cn("text-sm text-red-500", textAlign)} dir={dir}>{errors.start_time}</p>}
                        </div>

                        <div className={cn("space-y-2", textAlign)}>
                            <Label htmlFor="end_time" className={textAlign}>{t('end_time')}</Label>
                            <Input
                                id="end_time"
                                type="time"
                                value={data.end_time}
                                onChange={(e) => setData('end_time', e.target.value)}
                                dir={getFieldDir('text')}
                                className={cn(errors.end_time ? 'border-red-500' : '', getInputTextAlign('text'))}
                            />
                            {errors.end_time && <p className={cn("text-sm text-red-500", textAlign)} dir={dir}>{errors.end_time}</p>}
                        </div>

                        <div className={cn("space-y-2", textAlign)}>
                            <Label htmlFor="price" className={textAlign}>{t('price')}</Label>
                            <Input
                                id="price"
                                type="number"
                                step="0.01"
                                value={data.price}
                                onChange={(e) => setData('price', e.target.value)}
                                dir={getFieldDir('number')}
                                className={cn(errors.price ? 'border-red-500' : '', getInputTextAlign('number'))}
                            />
                            {errors.price && <p className={cn("text-sm text-red-500", textAlign)} dir={dir}>{errors.price}</p>}
                        </div>

                        <div className={cn("space-y-2", textAlign)}>
                            <Label htmlFor="status" className={textAlign}>{t('status')}</Label>
                            <Select value={data.status} onValueChange={(value) => setData('status', value)}>
                                <SelectTrigger className={textAlign} dir={dir}>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent dir={dir}>
                                    <SelectItem value="available">{t('available')}</SelectItem>
                                    <SelectItem value="booked">{t('booked')}</SelectItem>
                                    <SelectItem value="blocked">{t('blocked')}</SelectItem>
                                    <SelectItem value="maintenance">{t('maintenance')}</SelectItem>
                                </SelectContent>
                            </Select>
                            {errors.status && <p className={cn("text-sm text-red-500", textAlign)} dir={dir}>{errors.status}</p>}
                        </div>

                        <div className={cn("space-y-2", textAlign)}>
                            <Label htmlFor="slot_duration" className={textAlign}>{t('slot_duration')} ({t('minutes')})</Label>
                            <Input
                                id="slot_duration"
                                type="number"
                                value={data.slot_duration}
                                onChange={(e) => setData('slot_duration', e.target.value)}
                                dir={getFieldDir('number')}
                                className={cn(errors.slot_duration ? 'border-red-500' : '', getInputTextAlign('number'))}
                                placeholder="30"
                            />
                            {errors.slot_duration && <p className={cn("text-sm text-red-500", textAlign)} dir={dir}>{errors.slot_duration}</p>}
                        </div>

                        <div className={cn("space-y-2", textAlign)}>
                            <Label htmlFor="buffer_time_minutes" className={textAlign}>{t('buffer_time_minutes')} ({t('optional')})</Label>
                            <Input
                                id="buffer_time_minutes"
                                type="number"
                                min="0"
                                value={data.buffer_time_minutes}
                                onChange={(e) => setData('buffer_time_minutes', e.target.value)}
                                dir={getFieldDir('number')}
                                className={cn(errors.buffer_time_minutes ? 'border-red-500' : '', getInputTextAlign('number'))}
                                placeholder="0"
                            />
                            {errors.buffer_time_minutes && <p className={cn("text-sm text-red-500", textAlign)} dir={dir}>{errors.buffer_time_minutes}</p>}
                        </div>

                        <div className={cn("space-y-2", textAlign)}>
                            <Label htmlFor="max_bookings_per_slot" className={textAlign}>{t('max_bookings_per_slot')}</Label>
                            <Input
                                id="max_bookings_per_slot"
                                type="number"
                                min="1"
                                value={data.max_bookings_per_slot}
                                onChange={(e) => setData('max_bookings_per_slot', e.target.value)}
                                dir={getFieldDir('number')}
                                className={cn(errors.max_bookings_per_slot ? 'border-red-500' : '', getInputTextAlign('number'))}
                                placeholder="1"
                            />
                            {errors.max_bookings_per_slot && <p className={cn("text-sm text-red-500", textAlign)} dir={dir}>{errors.max_bookings_per_slot}</p>}
                        </div>
                    </div>

                    <div className={cn("space-y-2", textAlign)}>
                        <Label htmlFor="notes_en" className={textAlign}>{t('notes_en')} ({t('optional')})</Label>
                        <Input
                            id="notes_en"
                            type="text"
                            value={data.notes_en}
                            onChange={(e) => setData('notes_en', e.target.value)}
                            dir={getFieldDir('text')}
                            className={cn(errors.notes_en ? 'border-red-500' : '', getInputTextAlign('text'))}
                            placeholder={t('enter_notes_en')}
                        />
                        {errors.notes_en && <p className={cn("text-sm text-red-500", textAlign)} dir={dir}>{errors.notes_en}</p>}
                    </div>

                    <div className={cn("space-y-2", textAlign)}>
                        <Label htmlFor="notes_ar" className={textAlign}>{t('notes_ar')} ({t('optional')})</Label>
                        <Input
                            id="notes_ar"
                            type="text"
                            value={data.notes_ar}
                            onChange={(e) => setData('notes_ar', e.target.value)}
                            dir={getFieldDir('text')}
                            className={cn(errors.notes_ar ? 'border-red-500' : '', getInputTextAlign('text'))}
                            placeholder={t('enter_notes_ar')}
                        />
                        {errors.notes_ar && <p className={cn("text-sm text-red-500", textAlign)} dir={dir}>{errors.notes_ar}</p>}
                    </div>

                    <div className={cn("flex items-center gap-4", flexDirection)}>
                        <Button type="submit" disabled={processing}>
                            {processing ? t('creating') : t('create_treatment_slot')}
                        </Button>
                        <Link href="/dashboard/treatment-slots">
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

