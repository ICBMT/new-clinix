import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import InputError from '@/components/input-error';
import { Clock, X, Plus } from 'lucide-react';
import { useTranslation } from '@/hooks/use-translation';
import { useRTL } from '@/hooks/use-rtl';

interface OfficeHour {
    day_of_week: string;
    opening_time: string;
    closing_time: string;
    is_closed: boolean;
    notes?: string;
}

interface ClinicData {
    company_name_en: string;
    company_name_ar: string;
    description_en: string;
    description_ar: string;
    address?: string;
    area_id?: string;
    phone?: string;
    business_license?: File | null;
    id_document_front?: File | null;
    id_document_back?: File | null;
    office_hours: OfficeHour[];
}

interface ClinicFormSectionProps {
    clinicIndex: number;
    clinic: ClinicData;
    errors?: Record<string, string>;
    onChange: (index: number, field: keyof ClinicData, value: any) => void;
    onRemove?: (index: number) => void;
    canRemove?: boolean;
}

const DAYS_OF_WEEK = [
    { value: 'monday', label: 'Monday' },
    { value: 'tuesday', label: 'Tuesday' },
    { value: 'wednesday', label: 'Wednesday' },
    { value: 'thursday', label: 'Thursday' },
    { value: 'friday', label: 'Friday' },
    { value: 'saturday', label: 'Saturday' },
    { value: 'sunday', label: 'Sunday' },
];

export function ClinicFormSection({
    clinicIndex,
    clinic,
    errors = {},
    onChange,
    onRemove,
    canRemove = false,
}: ClinicFormSectionProps) {
    const { t, locale } = useTranslation();
    const { isRTL } = useRTL();

    const updateOfficeHour = (dayIndex: number, field: keyof OfficeHour, value: any) => {
        const updatedHours = [...clinic.office_hours];
        updatedHours[dayIndex] = { ...updatedHours[dayIndex], [field]: value };
        onChange(clinicIndex, 'office_hours', updatedHours);
    };

    return (
        <div className={`border border-slate-200 dark:border-slate-700 rounded-xl p-6 bg-slate-50/50 dark:bg-slate-800/50 ${isRTL ? 'text-right' : ''}`}>
            <div className={`flex items-center justify-between mb-6 ${isRTL ? 'flex-row-reverse' : ''}`}>
                <h3 className="text-xl font-semibold text-slate-900 dark:text-slate-100">
                    {t('clinic')} {clinicIndex + 1}
                </h3>
                {canRemove && onRemove && (
                    <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => onRemove(clinicIndex)}
                        className={`text-red-600 hover:text-red-700 hover:bg-red-50 dark:text-red-400 dark:hover:text-red-300 dark:hover:bg-red-900/20 ${isRTL ? 'flex-row-reverse' : ''}`}
                    >
                        <X className={`h-4 w-4 ${isRTL ? 'ml-2' : 'mr-2'}`} />
                        {t('remove_clinic')}
                    </Button>
                )}
            </div>

            {/* Clinic Basic Information */}
            <div className="space-y-6 mb-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                        <Label htmlFor={`clinic_${clinicIndex}_company_name_en`}>
                            {t('company_name')} ({t('english')}) <span className="text-red-500">*</span>
                        </Label>
                        <Input
                            id={`clinic_${clinicIndex}_company_name_en`}
                            type="text"
                            required
                            value={clinic.company_name_en}
                            onChange={(e) => onChange(clinicIndex, 'company_name_en', e.target.value)}
                            placeholder={isRTL ? t('enter_company_name_en') + ' (English)' : t('enter_company_name_en')}
                            className="bg-slate-50 dark:bg-slate-700/50 border-slate-200 dark:border-slate-600 dark:text-slate-100"
                            maxLength={255}
                            dir="ltr"
                        />
                        <InputError message={errors[`clinics.${clinicIndex}.company_name_en`]} />
                        {clinic.company_name_en.length >= 255 && (
                            <p className="text-sm text-red-500">{t('clinic_name_en_max')}</p>
                        )}
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor={`clinic_${clinicIndex}_company_name_ar`}>
                            {t('company_name')} ({t('arabic')}) <span className="text-red-500">*</span>
                        </Label>
                        <Input
                            id={`clinic_${clinicIndex}_company_name_ar`}
                            type="text"
                            required
                            value={clinic.company_name_ar}
                            onChange={(e) => onChange(clinicIndex, 'company_name_ar', e.target.value)}
                            placeholder={isRTL ? t('enter_company_name_ar') : t('enter_company_name_ar') + ' (Arabic)'}
                            className="bg-slate-50 dark:bg-slate-700/50 border-slate-200 dark:border-slate-600 dark:text-slate-100"
                            dir="rtl"
                            maxLength={255}
                        />
                        <InputError message={errors[`clinics.${clinicIndex}.company_name_ar`]} />
                        {clinic.company_name_ar.length >= 255 && (
                            <p className="text-sm text-red-500">{t('clinic_name_ar_max')}</p>
                        )}
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="space-y-2">
                        <Label htmlFor={`clinic_${clinicIndex}_description_en`}>
                            {t('description_english')} <span className="text-red-500">*</span>
                        </Label>
                        <Textarea
                            id={`clinic_${clinicIndex}_description_en`}
                            required
                            value={clinic.description_en}
                            onChange={(e) => onChange(clinicIndex, 'description_en', e.target.value)}
                            placeholder={t('description_english_placeholder')}
                            className="bg-slate-50 dark:bg-slate-700/50 border-slate-200 dark:border-slate-600 dark:text-slate-100 min-h-[100px]"
                            rows={4}
                        />
                        <InputError message={errors[`clinics.${clinicIndex}.description_en`]} />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor={`clinic_${clinicIndex}_description_ar`}>
                            {t('description_arabic')} <span className="text-red-500">*</span>
                        </Label>
                        <Textarea
                            id={`clinic_${clinicIndex}_description_ar`}
                            required
                            value={clinic.description_ar}
                            onChange={(e) => onChange(clinicIndex, 'description_ar', e.target.value)}
                            placeholder={t('description_arabic_placeholder')}
                            className="bg-slate-50 dark:bg-slate-700/50 border-slate-200 dark:border-slate-600 dark:text-slate-100 min-h-[100px]"
                            rows={4}
                            dir="rtl"
                        />
                        <InputError message={errors[`clinics.${clinicIndex}.description_ar`]} />
                    </div>
                </div>
            </div>

            {/* Office Hours */}
            <div className="space-y-4">
                <div className={`flex items-center gap-2 mb-4 ${isRTL ? 'flex-row-reverse' : ''}`}>
                    <Clock className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                    <h4 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                        {t('office_hours')}
                    </h4>
                </div>

                <div className="space-y-3">
                    {DAYS_OF_WEEK.map((day, dayIndex) => {
                        const officeHour = clinic.office_hours.find(oh => oh.day_of_week === day.value) || {
                            day_of_week: day.value,
                            opening_time: '09:00',
                            closing_time: '17:00',
                            is_closed: false,
                        };

                        return (
                            <div
                                key={day.value}
                                className="grid grid-cols-1 md:grid-cols-5 gap-4 p-4 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700"
                            >
                                <div className="flex items-center">
                                    <Label className="font-medium text-slate-700 dark:text-slate-300">
                                        {day.label}
                                    </Label>
                                </div>

                                <div className="flex items-center gap-2">
                                    <input
                                        type="checkbox"
                                        checked={!officeHour.is_closed}
                                        onChange={(e) => {
                                            const updatedHours = clinic.office_hours.filter(oh => oh.day_of_week !== day.value);
                                            if (e.target.checked) {
                                                updatedHours.push({
                                                    day_of_week: day.value,
                                                    opening_time: '09:00',
                                                    closing_time: '17:00',
                                                    is_closed: false,
                                                });
                                            } else {
                                                updatedHours.push({
                                                    day_of_week: day.value,
                                                    opening_time: '09:00',
                                                    closing_time: '17:00',
                                                    is_closed: true,
                                                });
                                            }
                                            onChange(clinicIndex, 'office_hours', updatedHours);
                                        }}
                                        className="rounded border-slate-300 dark:border-slate-600"
                                    />
                                    <Label className="text-sm text-slate-600 dark:text-slate-400">
                                        {t('open')}
                                    </Label>
                                </div>

                                {!officeHour.is_closed && (
                                    <>
                                        <div className="space-y-1">
                                            <Label className="text-xs text-slate-500 dark:text-slate-400">
                                                {t('opening_time')}
                                            </Label>
                                            <Input
                                                type="time"
                                                value={officeHour.opening_time}
                                                onChange={(e) => updateOfficeHour(
                                                    clinic.office_hours.findIndex(oh => oh.day_of_week === day.value),
                                                    'opening_time',
                                                    e.target.value
                                                )}
                                                className="bg-slate-50 dark:bg-slate-700/50 border-slate-200 dark:border-slate-600 dark:text-slate-100"
                                            />
                                        </div>

                                        <div className="space-y-1">
                                            <Label className="text-xs text-slate-500 dark:text-slate-400">
                                                {t('closing_time')}
                                            </Label>
                                            <Input
                                                type="time"
                                                value={officeHour.closing_time}
                                                onChange={(e) => updateOfficeHour(
                                                    clinic.office_hours.findIndex(oh => oh.day_of_week === day.value),
                                                    'closing_time',
                                                    e.target.value
                                                )}
                                                className="bg-slate-50 dark:bg-slate-700/50 border-slate-200 dark:border-slate-600 dark:text-slate-100"
                                            />
                                        </div>

                                        <div className="space-y-1">
                                            <Label className="text-xs text-slate-500 dark:text-slate-400">
                                                {t('notes')} ({t('optional')})
                                            </Label>
                                            <Input
                                                type="text"
                                                value={officeHour.notes || ''}
                                                onChange={(e) => updateOfficeHour(
                                                    clinic.office_hours.findIndex(oh => oh.day_of_week === day.value),
                                                    'notes',
                                                    e.target.value
                                                )}
                                                placeholder={t('e.g._closed_for_lunch')}
                                                className="bg-slate-50 dark:bg-slate-700/50 border-slate-200 dark:border-slate-600 dark:text-slate-100 text-sm"
                                            />
                                        </div>
                                    </>
                                )}

                                {officeHour.is_closed && (
                                    <div className="md:col-span-3 flex items-center text-slate-500 dark:text-slate-400 text-sm">
                                        {t('closed')}
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Documents */}
            <div className="mt-6 space-y-4">
                <h4 className={`text-lg font-semibold text-slate-900 dark:text-slate-100 ${isRTL ? 'text-right' : ''}`}>
                    {t('required_documents')}
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="space-y-2">
                        <Label htmlFor={`clinic_${clinicIndex}_business_license`}>
                            {t('business_license')} <span className="text-red-500">*</span>
                        </Label>
                        <Input
                            id={`clinic_${clinicIndex}_business_license`}
                            type="file"
                            required
                            accept=".pdf,.jpg,.jpeg,.png"
                            onChange={(e) => onChange(clinicIndex, 'business_license', e.target.files?.[0] || null)}
                            className="bg-slate-50 dark:bg-slate-700/50 border-slate-200 dark:border-slate-600"
                        />
                        <InputError message={errors[`clinics.${clinicIndex}.business_license`]} />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor={`clinic_${clinicIndex}_id_document_front`}>
                            {t('id_document_front')} <span className="text-red-500">*</span>
                        </Label>
                        <Input
                            id={`clinic_${clinicIndex}_id_document_front`}
                            type="file"
                            required
                            accept=".pdf,.jpg,.jpeg,.png"
                            onChange={(e) => onChange(clinicIndex, 'id_document_front', e.target.files?.[0] || null)}
                            className="bg-slate-50 dark:bg-slate-700/50 border-slate-200 dark:border-slate-600"
                        />
                        <InputError message={errors[`clinics.${clinicIndex}.id_document_front`]} />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor={`clinic_${clinicIndex}_id_document_back`}>
                            {t('id_document_back')} <span className="text-red-500">*</span>
                        </Label>
                        <Input
                            id={`clinic_${clinicIndex}_id_document_back`}
                            type="file"
                            required
                            accept=".pdf,.jpg,.jpeg,.png"
                            onChange={(e) => onChange(clinicIndex, 'id_document_back', e.target.files?.[0] || null)}
                            className="bg-slate-50 dark:bg-slate-700/50 border-slate-200 dark:border-slate-600"
                        />
                        <InputError message={errors[`clinics.${clinicIndex}.id_document_back`]} />
                    </div>
                </div>
            </div>
        </div>
    );
}

