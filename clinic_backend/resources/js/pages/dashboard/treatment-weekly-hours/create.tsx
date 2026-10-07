import { type BreadcrumbItem } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { SearchableSelect } from '@/components/ui/searchable-select';
import { useRTLInit } from '@/hooks/use-rtl-init';
import { useTranslation } from '@/hooks/use-translation';
import { useRTL } from '@/hooks/use-rtl';
import AppLayout from '@/layouts/app-layout';
import { index as dashboard } from '@/routes/dashboard';
import { Head, Link, useForm, usePage, router } from '@inertiajs/react';
import { ArrowLeft } from 'lucide-react';
import { FormEventHandler, useState, useEffect, useMemo } from 'react';
import { customToast } from '@/components/ui/custom-toast';
import { usePermissions } from '@/hooks/use-permissions';
import { cn } from '@/lib/utils';

interface Clinic {
    id: number;
    name_en: string;
    name_ar: string;
}

interface Treatment {
    id: number;
    clinic_id: number;
    name_en: string;
    name_ar: string;
}

interface OperatingHour {
    day_of_week: string;
    is_open: boolean;
    closed_all_day: boolean;
    opening_time: string | null;
    closing_time: string | null;
}

interface CreateTreatmentWeeklyHoursProps {
    clinics: Clinic[];
    treatments: Treatment[];
    operatingHours?: Record<number, Record<string, OperatingHour>>;
    isClinicRole?: boolean;
    existingSchedules?: Record<string, boolean>;
}

const DAYS_OF_WEEK = [
    { value: 'monday', labelKey: 'monday' },
    { value: 'tuesday', labelKey: 'tuesday' },
    { value: 'wednesday', labelKey: 'wednesday' },
    { value: 'thursday', labelKey: 'thursday' },
    { value: 'friday', labelKey: 'friday' },
    { value: 'saturday', labelKey: 'saturday' },
    { value: 'sunday', labelKey: 'sunday' },
];

const defaultWeeklySchedule = DAYS_OF_WEEK.map(day => ({
    day_of_week: day.value,
    is_open: false,
    closed_all_day: false,
    opening_time: '',
    closing_time: '',
    notes_en: '',
    notes_ar: '',
}));

export default function CreateTreatmentWeeklyHours({ clinics, treatments, operatingHours = {}, isClinicRole: isClinicRoleProp, existingSchedules = {} }: CreateTreatmentWeeklyHoursProps) {
    useRTLInit();
    const { t, locale } = useTranslation();
    const { isRTL, dir, textAlign, flexDirection, iconMargin, getFieldDir, getInputTextAlign } = useRTL();
    const { flash } = usePage().props as { flash?: { success?: string; error?: string } };
    const { isClinic, isClinicManager } = usePermissions();
    const isClinicRole = isClinicRoleProp ?? (isClinic || isClinicManager);
    const page = usePage();
    const isSuperAdmin = (page.props as any).auth?.user?.roles?.some((r: any) => r.name === 'super-admin') || false;
    const urlParams = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : null;
    const initialClinicId = urlParams?.get('clinic_id') || '';

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
            title: t('treatment_weekly_hours'),
            href: '/dashboard/treatment-weekly-hours',
        },
        {
            title: t('create_weekly_schedule'),
            href: '/dashboard/treatment-weekly-hours/create',
        },
    ];

    const [selectedClinicId, setSelectedClinicId] = useState<string>(initialClinicId);
    const [weeklySchedule, setWeeklySchedule] = useState(defaultWeeklySchedule);

    const clinicOptions = useMemo(() => {
        return clinics.map(clinic => ({
            value: clinic.id.toString(),
            label: isRTL && clinic.name_ar ? clinic.name_ar : clinic.name_en,
        }));
    }, [clinics, locale]);

    const filteredTreatments = useMemo(() => {
        if (!selectedClinicId) return [];
        return treatments.filter(t => t.clinic_id.toString() === selectedClinicId);
    }, [selectedClinicId, treatments]);

    const treatmentOptions = useMemo(() => {
        // Filter out treatments that already have schedules for the selected clinic
        return filteredTreatments
            .filter(treatment => {
                if (!selectedClinicId) return true;
                const scheduleKey = `${selectedClinicId}-${treatment.id}`;
                // Exclude treatments that already have schedules
                return !existingSchedules[scheduleKey];
            })
            .map(treatment => ({
                value: treatment.id.toString(),
                label: isRTL && treatment.name_ar ? treatment.name_ar : treatment.name_en,
            }));
    }, [filteredTreatments, selectedClinicId, existingSchedules, locale]);

    const { data, setData, post, processing, errors } = useForm({
        clinic_id: initialClinicId,
        treatment_id: '',
        weekly_schedule: weeklySchedule,
        slot_duration: '',
        buffer_time_minutes: '',
        max_bookings_per_slot: '',
        notes_en: '',
        notes_ar: '',
    });

    useEffect(() => {
        setData('clinic_id', selectedClinicId);
        // Always clear treatment selection when clinic changes
        // Treatments with existing schedules are filtered out from the dropdown
        setData('treatment_id', '');
        
        // Update weekly schedule based on clinic operating hours
        if (selectedClinicId) {
            const clinicHours = operatingHours[parseInt(selectedClinicId)] || {};
            setWeeklySchedule(prevSchedule => {
                return DAYS_OF_WEEK.map((day, index) => {
                    const clinicDayHours = clinicHours[day.value];
                    const existingSchedule = prevSchedule[index];
                    
                    // If clinic is closed on this day, disable it
                    if (clinicDayHours && (clinicDayHours.closed_all_day || !clinicDayHours.is_open)) {
                        return {
                            ...existingSchedule,
                            day_of_week: day.value,
                            is_open: false,
                            opening_time: '',
                            closing_time: '',
                        };
                    }
                    
                    // If clinic is open, pre-fill with clinic hours if not already set
                    if (clinicDayHours && clinicDayHours.is_open && !clinicDayHours.closed_all_day) {
                        return {
                            ...existingSchedule,
                            day_of_week: day.value,
                            opening_time: existingSchedule.opening_time || clinicDayHours.opening_time || '',
                            closing_time: existingSchedule.closing_time || clinicDayHours.closing_time || '',
                        };
                    }
                    
                    return existingSchedule;
                });
            });
        }
    }, [selectedClinicId, operatingHours]);

    useEffect(() => {
        setData('weekly_schedule', weeklySchedule);
    }, [weeklySchedule]);

    const updateDaySchedule = (dayIndex: number, field: string, value: any) => {
        const updated = [...weeklySchedule];
        updated[dayIndex] = { ...updated[dayIndex], [field]: value };
        
        // Validate time when updating opening_time or closing_time
        if (field === 'opening_time' || field === 'closing_time') {
            const daySchedule = updated[dayIndex];
            if (daySchedule.is_open && daySchedule.opening_time && daySchedule.closing_time) {
                const openingTime = new Date(`2000-01-01T${daySchedule.opening_time}`);
                const closingTime = new Date(`2000-01-01T${daySchedule.closing_time}`);
                
                if (openingTime >= closingTime) {
                    // Clear the invalid time
                    if (field === 'opening_time') {
                        updated[dayIndex].opening_time = '';
                    } else {
                        updated[dayIndex].closing_time = '';
                    }
                }
            }
        }
        
        setWeeklySchedule(updated);
    };

    const validateSchedule = (): boolean => {
        if (!selectedClinicId) {
            customToast.error(t('please_select_clinic'));
            return false;
        }

        let isValid = true;
        const validationErrors: string[] = [];
        
        // Get clinic operating hours
        const clinicHours = operatingHours[parseInt(selectedClinicId)] || {};
        
        weeklySchedule.forEach((daySchedule, index) => {
            const dayOfWeek = daySchedule.day_of_week;
            const clinicDayHours = clinicHours[dayOfWeek];
            
            // If clinic is closed on this day, treatment must also be closed
            if (clinicDayHours && (clinicDayHours.closed_all_day || !clinicDayHours.is_open)) {
                if (daySchedule.is_open) {
                    const dayName = t(DAYS_OF_WEEK[index].labelKey) || DAYS_OF_WEEK[index].labelKey;
                    validationErrors.push(`${dayName}: ${t('treatment_cannot_be_open_when_clinic_closed')}`);
                    isValid = false;
                }
                return;
            }
            
            if (daySchedule.is_open) {
                if (!daySchedule.opening_time) {
                    const dayName = t(DAYS_OF_WEEK[index].labelKey) || DAYS_OF_WEEK[index].labelKey;
                    validationErrors.push(`${dayName}: ${t('opening_time_required')}`);
                    isValid = false;
                }
                if (!daySchedule.closing_time) {
                    const dayName = t(DAYS_OF_WEEK[index].labelKey) || DAYS_OF_WEEK[index].labelKey;
                    validationErrors.push(`${dayName}: ${t('closing_time_required')}`);
                    isValid = false;
                }
                if (daySchedule.opening_time && daySchedule.closing_time) {
                    const openingTime = new Date(`2000-01-01T${daySchedule.opening_time}`);
                    const closingTime = new Date(`2000-01-01T${daySchedule.closing_time}`);
                    
                    if (openingTime >= closingTime) {
                        const dayName = t(DAYS_OF_WEEK[index].labelKey) || DAYS_OF_WEEK[index].labelKey;
                        validationErrors.push(`${dayName}: ${t('opening_time_must_be_before_closing_time')}`);
                        isValid = false;
                    }
                    
                    // Check if times are within clinic operating hours
                    if (clinicDayHours && clinicDayHours.is_open && !clinicDayHours.closed_all_day && clinicDayHours.opening_time && clinicDayHours.closing_time) {
                        const clinicOpeningTime = new Date(`2000-01-01T${clinicDayHours.opening_time}`);
                        const clinicClosingTime = new Date(`2000-01-01T${clinicDayHours.closing_time}`);
                        const dayName = t(DAYS_OF_WEEK[index].labelKey) || DAYS_OF_WEEK[index].labelKey;
                        
                        if (openingTime < clinicOpeningTime) {
                            validationErrors.push(`${dayName}: ${t('treatment_opening_time_before_clinic', { time: clinicDayHours.opening_time })}`);
                            isValid = false;
                        }
                        
                        if (closingTime > clinicClosingTime) {
                            validationErrors.push(`${dayName}: ${t('treatment_closing_time_after_clinic', { time: clinicDayHours.closing_time })}`);
                            isValid = false;
                        }
                    }
                }
            }
        });
        
        if (!isValid && validationErrors.length > 0) {
            validationErrors.forEach(error => {
                customToast.error(error);
            });
        }
        
        return isValid;
    };

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        
        if (!validateSchedule()) {
            return;
        }
        
        // Check if schedule already exists
        const scheduleKey = `${data.clinic_id}-${data.treatment_id}`;
        if (existingSchedules[scheduleKey] && !isSuperAdmin) {
            // For non-admin users, redirect to edit page
            customToast.warning(t('schedule_already_exists_redirecting_to_edit'));
            setTimeout(() => {
                router.visit(`/dashboard/treatment-weekly-hours/${data.clinic_id}/${data.treatment_id}/edit`);
            }, 1500);
            return;
        }

        // For super admin or if no existing schedule, proceed with create (which will replace existing)
        if (existingSchedules[scheduleKey] && isSuperAdmin) {
            customToast.info(t('existing_schedule_will_be_replaced'));
        }

        post('/dashboard/treatment-weekly-hours', {
            onSuccess: () => {
                customToast.success(t('treatment_weekly_schedule_created_successfully'));
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
            <Head title={t('create_weekly_schedule')} />
            
            <div className={cn("flex h-full flex-1 flex-col gap-6 overflow-x-auto rounded-xl bg-card dark:bg-card p-6 border border-border", isRTL ? '!text-right' : '!text-left')} dir={dir}>
                <div className={cn("flex items-center justify-between border-b pb-4", flexDirection)}>
                    <div className={cn(isRTL ? '!text-right' : '!text-left')} dir={dir}>
                        <h1 className={cn("text-3xl font-bold text-foreground", isRTL ? '!text-right' : '!text-left')} dir={dir}>{t('create_weekly_schedule')}</h1>
                        <p className={cn("text-muted-foreground mt-1", isRTL ? '!text-right' : '!text-left')} dir={dir}>{t('create_weekly_schedule_description')}</p>
                    </div>
                    
                    <Link href="/dashboard/treatment-weekly-hours">
                        <Button variant="outline" className={cn("flex items-center gap-2", flexDirection)}>
                            <ArrowLeft className={cn("h-4 w-4", isRTL && 'rotate-180', iconMargin('md'))} />
                            {t('back')}
                        </Button>
                    </Link>
                </div>

                <form onSubmit={submit} className={cn("space-y-6", isRTL ? '!text-right' : '!text-left')} dir={dir}>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className={cn("space-y-2", isRTL ? '!text-right' : '!text-left')} dir={dir}>
                            <Label htmlFor="clinic_id" className={cn(isRTL ? '!text-right' : '!text-left')} dir={dir}>
                                {isRTL ? <><span className="text-red-500">*</span> {t('clinic')}</> : <>{t('clinic')} <span className="text-red-500">*</span></>}
                                {isClinicRole && <span className={cn("text-xs text-muted-foreground", isRTL ? 'mr-2' : 'ml-2')}>({t('required')})</span>}
                            </Label>
                            <SearchableSelect
                                options={clinicOptions}
                                value={selectedClinicId}
                                onChange={setSelectedClinicId}
                                placeholder={t('select_clinic')}
                                searchPlaceholder={t('search_clinics')}
                                className={cn(errors.clinic_id ? 'border-red-500' : '', isRTL ? '!text-right' : '!text-left')}
                                required={isClinicRole}
                            />
                            {errors.clinic_id && <p className={cn("text-sm text-red-500", isRTL ? '!text-right' : '!text-left')} dir={dir}>{errors.clinic_id}</p>}
                        </div>

                        <div className={cn("space-y-2", isRTL ? '!text-right' : '!text-left')} dir={dir}>
                            <Label htmlFor="treatment_id" className={cn(isRTL ? '!text-right' : '!text-left')} dir={dir}>
                                {isRTL ? <><span className="text-red-500">*</span> {t('treatment')}</> : <>{t('treatment')} <span className="text-red-500">*</span></>}
                            </Label>
                            <SearchableSelect
                                options={treatmentOptions}
                                value={data.treatment_id}
                                onChange={(value) => setData('treatment_id', value)}
                                placeholder={selectedClinicId ? t('select_treatment') : t('select_clinic_first')}
                                searchPlaceholder={t('search_treatments')}
                                className={cn(errors.treatment_id ? 'border-red-500' : '', isRTL ? '!text-right' : '!text-left')}
                                disabled={!selectedClinicId}
                            />
                            {errors.treatment_id && <p className={cn("text-sm text-red-500", isRTL ? '!text-right' : '!text-left')} dir={dir}>{errors.treatment_id}</p>}
                            {selectedClinicId && treatmentOptions.length === 0 && filteredTreatments.length > 0 && (
                                <p className={cn("text-sm text-muted-foreground", isRTL ? '!text-right' : '!text-left')} dir={dir}>
                                    {t('all_treatments_have_schedules')}
                                </p>
                            )}
                        </div>
                    </div>

                    <div className={cn("space-y-4", isRTL ? '!text-right' : '!text-left')} dir={dir}>
                        <h3 className={cn("text-lg font-semibold", isRTL ? '!text-right' : '!text-left')} dir={dir}>{t('weekly_schedule')}</h3>
                        
                        {DAYS_OF_WEEK.map((day, index) => {
                            const daySchedule = weeklySchedule[index];
                            const clinicHours = selectedClinicId ? (operatingHours[parseInt(selectedClinicId)] || {}) : {};
                            const clinicDayHours = clinicHours[day.value];
                            const isClinicClosed = clinicDayHours && (clinicDayHours.closed_all_day || !clinicDayHours.is_open);
                            
                            return (
                                <div key={day.value} className={cn("border rounded-lg p-4 space-y-4", isClinicClosed ? 'opacity-60' : '', isRTL ? '!text-right' : '!text-left')} dir={dir}>
                                    <div className={cn("flex items-center justify-between", flexDirection)}>
                                        <div className={cn("flex flex-col gap-1", isRTL ? '!text-right' : '!text-left')} dir={dir}>
                                        <Label className={cn("text-base font-medium", isRTL ? '!text-right' : '!text-left')} dir={dir}>{t(day.labelKey)}</Label>
                                            {selectedClinicId && clinicDayHours && (
                                                <span className={cn("text-xs text-muted-foreground", isRTL ? '!text-right' : '!text-left')} dir={dir}>
                                                    {isClinicClosed 
                                                        ? `(${t('clinic_closed')})`
                                                        : clinicDayHours.opening_time && clinicDayHours.closing_time
                                                        ? `${t('clinic_hours')}: ${clinicDayHours.opening_time} - ${clinicDayHours.closing_time}`
                                                        : ''
                                                    }
                                                </span>
                                            )}
                                        </div>
                                        <div className={cn("flex items-center gap-4", flexDirection)}>
                                            <div className={cn("flex items-center gap-2", flexDirection)}>
                                                <Switch
                                                    checked={daySchedule.is_open}
                                                    onCheckedChange={(checked) => {
                                                        // Allow closing even when clinic is closed
                                                        // But prevent opening when clinic is closed
                                                        if (checked && isClinicClosed) {
                                                            customToast.error(t('treatment_cannot_be_open_when_clinic_closed'));
                                                            return;
                                                        }
                                                        updateDaySchedule(index, 'is_open', checked);
                                                        if (!checked) {
                                                            updateDaySchedule(index, 'closed_all_day', false);
                                                        }
                                                    }}
                                                />
                                                <span className={cn("text-sm", isRTL ? '!text-right' : '!text-left')} dir={dir}>{t('open')}</span>
                                            </div>
                                        </div>
                                    </div>

                                    {daySchedule.is_open && !isClinicClosed && (
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div className={cn("space-y-2", isRTL ? '!text-right' : '!text-left')} dir={dir}>
                                                <Label className={cn(isRTL ? '!text-right' : '!text-left')} dir={dir}>
                                                    {isRTL ? <><span className="text-red-500">*</span> {t('opening_time')}</> : <>{t('opening_time')} <span className="text-red-500">*</span></>}
                                                </Label>
                                                <Input
                                                    type="time"
                                                    value={daySchedule.opening_time}
                                                    onChange={(e) => updateDaySchedule(index, 'opening_time', e.target.value)}
                                                    dir={getFieldDir('text')}
                                                    className={cn(errors[`weekly_schedule.${index}.opening_time`] ? 'border-red-500' : '', getInputTextAlign('text'))}
                                                    disabled={isClinicClosed}
                                                />
                                                {errors[`weekly_schedule.${index}.opening_time`] && (
                                                    <p className={cn("text-sm text-red-500", isRTL ? '!text-right' : '!text-left')} dir={dir}>{errors[`weekly_schedule.${index}.opening_time`]}</p>
                                                )}
                                            </div>

                                            <div className={cn("space-y-2", isRTL ? '!text-right' : '!text-left')} dir={dir}>
                                                <Label className={cn(isRTL ? '!text-right' : '!text-left')} dir={dir}>
                                                    {isRTL ? <><span className="text-red-500">*</span> {t('closing_time')}</> : <>{t('closing_time')} <span className="text-red-500">*</span></>}
                                                </Label>
                                                <Input
                                                    type="time"
                                                    value={daySchedule.closing_time}
                                                    onChange={(e) => updateDaySchedule(index, 'closing_time', e.target.value)}
                                                    dir={getFieldDir('text')}
                                                    className={cn(errors[`weekly_schedule.${index}.closing_time`] ? 'border-red-500' : '', getInputTextAlign('text'))}
                                                    disabled={isClinicClosed}
                                                />
                                                {errors[`weekly_schedule.${index}.closing_time`] && (
                                                    <p className={cn("text-sm text-red-500", isRTL ? '!text-right' : '!text-left')} dir={dir}>{errors[`weekly_schedule.${index}.closing_time`]}</p>
                                                )}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className={cn("space-y-2", isRTL ? '!text-right' : '!text-left')} dir={dir}>
                            <Label htmlFor="slot_duration" className={cn(isRTL ? '!text-right' : '!text-left')} dir={dir}>{t('slot_duration')} ({t('minutes')})</Label>
                            <Input
                                id="slot_duration"
                                type="number"
                                value={data.slot_duration}
                                onChange={(e) => setData('slot_duration', e.target.value)}
                                dir={getFieldDir('number')}
                                className={cn(errors.slot_duration ? 'border-red-500' : '', getInputTextAlign('number'))}
                                placeholder="30"
                            />
                            {errors.slot_duration && <p className={cn("text-sm text-red-500", isRTL ? '!text-right' : '!text-left')} dir={dir}>{errors.slot_duration}</p>}
                        </div>

                        <div className={cn("space-y-2", isRTL ? '!text-right' : '!text-left')} dir={dir}>
                            <Label htmlFor="buffer_time_minutes" className={cn(isRTL ? '!text-right' : '!text-left')} dir={dir}>{t('buffer_time_minutes')} ({t('optional')})</Label>
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
                            {errors.buffer_time_minutes && <p className={cn("text-sm text-red-500", isRTL ? '!text-right' : '!text-left')} dir={dir}>{errors.buffer_time_minutes}</p>}
                        </div>

                        <div className={cn("space-y-2", isRTL ? '!text-right' : '!text-left')} dir={dir}>
                            <Label htmlFor="max_bookings_per_slot" className={cn(isRTL ? '!text-right' : '!text-left')} dir={dir}>{t('max_bookings_per_slot')}</Label>
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
                            {errors.max_bookings_per_slot && <p className={cn("text-sm text-red-500", isRTL ? '!text-right' : '!text-left')} dir={dir}>{errors.max_bookings_per_slot}</p>}
                        </div>
                    </div>

                    <div className={cn("space-y-2", isRTL ? '!text-right' : '!text-left')} dir={dir}>
                        <Label htmlFor="notes_en" className={cn(isRTL ? '!text-right' : '!text-left')} dir={dir}>{t('notes_en')} ({t('optional')})</Label>
                        <Textarea
                            id="notes_en"
                            value={data.notes_en}
                            onChange={(e) => setData('notes_en', e.target.value)}
                            dir={getFieldDir('textarea')}
                            className={cn(errors.notes_en ? 'border-red-500' : '', getInputTextAlign('textarea'))}
                            placeholder={t('enter_notes_en')}
                            rows={3}
                        />
                        {errors.notes_en && <p className={cn("text-sm text-red-500", isRTL ? '!text-right' : '!text-left')} dir={dir}>{errors.notes_en}</p>}
                    </div>

                    <div className={cn("space-y-2", isRTL ? '!text-right' : '!text-left')} dir={dir}>
                        <Label htmlFor="notes_ar" className={cn(isRTL ? '!text-right' : '!text-left')} dir={dir}>{t('notes_ar')} ({t('optional')})</Label>
                        <Textarea
                            id="notes_ar"
                            value={data.notes_ar}
                            onChange={(e) => setData('notes_ar', e.target.value)}
                            dir={getFieldDir('textarea')}
                            className={cn(errors.notes_ar ? 'border-red-500' : '', getInputTextAlign('textarea'))}
                            placeholder={t('enter_notes_ar')}
                            rows={3}
                        />
                        {errors.notes_ar && <p className={cn("text-sm text-red-500", isRTL ? '!text-right' : '!text-left')} dir={dir}>{errors.notes_ar}</p>}
                    </div>

                    <div className={cn("flex items-center gap-4", flexDirection)}>
                        <Button type="submit" disabled={processing}>
                            {processing ? t('creating') : t('create_weekly_schedule')}
                        </Button>
                        <Link href="/dashboard/treatment-weekly-hours">
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
