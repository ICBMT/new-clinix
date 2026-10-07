import { type BreadcrumbItem } from '@/types';
import { Badge } from '@/components/ui/badge';
import { ViewLayout, ViewDetailsSection, ViewField, ViewFieldWithIcon } from '@/components/view';
import { useRTLInit } from '@/hooks/use-rtl-init';
import { useTranslation } from '@/hooks/use-translation';
import { index as dashboard } from '@/routes/dashboard';
import { Link } from '@inertiajs/react';
import { Calendar, Clock } from 'lucide-react';
import { formatHumanDate } from '@/utils/date-utils';
import { getLocalizedName } from '@/utils/localization';

interface TreatmentSlot {
    id: number;
    treatment_id: number;
    treatment?: { id: number; name_en: string; name_ar: string };
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
    created_at: string;
    updated_at: string;
}

interface ShowTreatmentSlotProps {
    treatmentSlot: TreatmentSlot;
}

export default function ShowTreatmentSlot({ treatmentSlot }: ShowTreatmentSlotProps) {
    useRTLInit();
    const { t, locale } = useTranslation();
    
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
            title: t('view_treatment_slot'),
            href: '#',
        },
    ];

    const getStatusVariant = (status: string): 'default' | 'secondary' | 'destructive' => {
        if (status === 'available') return 'default';
        if (status === 'booked') return 'secondary';
        if (status === 'blocked') return 'destructive';
        return 'secondary';
    };

    return (
        <ViewLayout
            breadcrumbs={breadcrumbs}
            title={`${t('treatment_slot')} #${treatmentSlot.id}`}
            description={t('view_treatment_slot_information')}
            status={{
                value: treatmentSlot.status,
                variant: getStatusVariant(treatmentSlot.status),
                className: treatmentSlot.status === 'available' 
                    ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300'
                    : treatmentSlot.status === 'blocked'
                    ? 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300'
                    : 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300',
            }}
            editUrl={`/dashboard/treatment-slots/${treatmentSlot.id}/edit`}
            backUrl="/dashboard/treatment-slots"
            editLabel={t('edit_treatment_slot')}
            headTitle={`${t('treatment_slot')} #${treatmentSlot.id}`}
        >
            <ViewDetailsSection title={t('basic_information')} icon={Calendar}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {treatmentSlot.treatment && (
                        <ViewField
                            label={t('treatment')}
                            value={
                                <Link
                                    href={`/dashboard/treatments/${treatmentSlot.treatment.id}`}
                                    className="text-primary hover:underline font-medium"
                                >
                                    {getLocalizedName(treatmentSlot.treatment.name_en, treatmentSlot.treatment.name_ar, locale)}
                                </Link>
                            }
                        />
                    )}
                    <ViewField
                        label={t('date')}
                        value={formatHumanDate(treatmentSlot.slot_date)}
                    />
                    <ViewField
                        label={t('start_time')}
                        value={treatmentSlot.start_time}
                        dir="ltr"
                    />
                    <ViewField
                        label={t('end_time')}
                        value={treatmentSlot.end_time}
                        dir="ltr"
                    />
                    {treatmentSlot.price && (
                        <ViewField
                            label={t('price')}
                            value={treatmentSlot.price}
                            dir="ltr"
                            valueClassName="font-medium"
                        />
                    )}
                    <ViewFieldWithIcon
                        label={t('created_at')}
                        value={formatHumanDate(treatmentSlot.created_at)}
                        icon={Clock}
                    />
                </div>
            </ViewDetailsSection>
        </ViewLayout>
    );
}

