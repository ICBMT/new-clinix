import StaffLeaveLayout, {
    staffLeaveUrl,
} from '@/components/staff-leave-layout';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { usePermissions } from '@/hooks/use-permissions';
import { useTranslation } from '@/hooks/use-translation';
import type { StaffLeave } from '@/types/staff-leave';
import { Link } from '@inertiajs/react';

export default function ShowStaffLeave({ leave }: { leave: StaffLeave }) {
    const { t, isRTL } = useTranslation();
    const { can } = usePermissions();
    const fields = [
        ['staff_leave_staff', leave.staff?.name ?? '—'],
        [
            'clinic',
            (isRTL
                ? leave.clinic?.name_ar || leave.clinic?.name_en
                : leave.clinic?.name_en) ?? '—',
        ],
        ['staff_leave_type', t(`staff_leave_type_${leave.leave_type}`)],
        ['staff_leave_start', leave.start_date],
        ['staff_leave_end', leave.end_date],
    ];

    return (
        <StaffLeaveLayout
            title={t('staff_leave_details')}
            actions={
                <div className="flex gap-2">
                    {can('staff-leaves.edit') && (
                        <Button asChild>
                            <Link href={`${staffLeaveUrl}/${leave.id}/edit`}>
                                {t('edit')}
                            </Link>
                        </Button>
                    )}
                    <Button asChild variant="outline">
                        <Link href={staffLeaveUrl}>{t('back')}</Link>
                    </Button>
                </div>
            }
        >
            <dl className="grid max-w-3xl gap-6 rounded-xl border bg-card p-6 sm:grid-cols-2">
                {fields.map(([label, value]) => (
                    <div key={label}>
                        <dt className="text-sm text-muted-foreground">
                            {t(label)}
                        </dt>
                        <dd className="mt-1 font-medium">{value}</dd>
                    </div>
                ))}
                <div>
                    <dt className="text-sm text-muted-foreground">
                        {t('status')}
                    </dt>
                    <dd className="mt-1">
                        <Badge>{t(`staff_leave_status_${leave.status}`)}</Badge>
                    </dd>
                </div>
                <div className="sm:col-span-2">
                    <dt className="text-sm text-muted-foreground">
                        {t('staff_leave_reason')}
                    </dt>
                    <dd className="mt-1 break-words whitespace-pre-wrap">
                        {leave.reason}
                    </dd>
                </div>
            </dl>
        </StaffLeaveLayout>
    );
}
