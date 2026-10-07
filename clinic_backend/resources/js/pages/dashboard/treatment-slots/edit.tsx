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
import { Head, Link, useForm } from '@inertiajs/react';
import { ArrowLeft, Eye } from 'lucide-react';
import { FormEventHandler } from 'react';
import { cn } from '@/lib/utils';

interface Treatment {
    id: number;
    name_en: string;
    name_ar: string;
}

interface TreatmentSlot {
    id: number;
    treatment_id: number;
    slot_date: string;
    start_time: string;
    end_time: string;
    buffer_time_minutes?: number;
    max_bookings_per_slot?: number;
    slot_duration?: number;
    status: 'available' | 'booked' | 'blocked' | 'maintenance';
    price?: string;
    notes_en?: string;
    notes_ar?: string;
}

interface EditTreatmentSlotProps {
    treatmentSlot: TreatmentSlot;
    treatments: Treatment[];
}

export default function EditTreatmentSlot({ treatmentSlot, treatments }: EditTreatmentSlotProps) {
    useRTLInit();
    const { t, locale } = useTranslation();
    const { isRTL, dir, textAlign, flexDirection, iconMargin, getFieldDir, getInputTextAlign } = useRTL();
    
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
            title: t('edit_treatment_slot'),
            href: '#',
        },
    ];

    const { data, setData, put, processing, errors } = useForm({
        treatment_id: treatmentSlot.treatment_id?.toString() || '',
        slot_date: treatmentSlot.slot_date || '',
        start_time: treatmentSlot.start_time || '',
        end_time: treatmentSlot.end_time || '',
        buffer_time_minutes: treatmentSlot.buffer_time_minutes?.toString() || '',
        max_bookings_per_slot: treatmentSlot.max_bookings_per_slot?.toString() || '',
        slot_duration: treatmentSlot.slot_duration?.toString() || '',
        status: treatmentSlot.status || 'available',
        price: treatmentSlot.price || '',
        notes_en: treatmentSlot.notes_en || '',
        notes_ar: treatmentSlot.notes_ar || '',
    });

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        put(`/dashboard/treatment-slots/${treatmentSlot.id}`);
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={t('edit_treatment_slot')} />
            
            <div className={cn("flex h-full flex-1 flex-col gap-6 overflow-x-auto rounded-xl bg-card dark:bg-card p-6 border border-border", textAlign)} dir={dir}>
                <div className={cn("flex items-center justify-between border-b pb-4", flexDirection)}>
                    <div className={textAlign}>
                        <h1 className={cn("text-3xl font-bold text-foreground", textAlign)}>{t('edit_treatment_slot')}</h1>
                        <p className={cn("text-muted-foreground mt-1", textAlign)}>{t('update_treatment_slot_information')}</p>
                    </div>
                    <div className={cn("flex items-center gap-3", flexDirection)}>
                        <Link href={`/dashboard/treatment-slots/${treatmentSlot.id}`}>
                            <Button variant="outline" className={cn("flex items-center gap-2", flexDirection)}>
                                <Eye className={cn("h-4 w-4", iconMargin('md'))} />
                                {t('view')}
                            </Button>
                        </Link>
                        <Link href="/dashboard/treatment-slots">
                            <Button variant="outline" className={cn("flex items-center gap-2", flexDirection)}>
                                <ArrowLeft className={cn("h-4 w-4", isRTL && 'rotate-180', iconMargin('md'))} />
                                {t('back')}
                            </Button>
                        </Link>
                    </div>
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
                            {processing ? t('updating') : t('update')}
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

