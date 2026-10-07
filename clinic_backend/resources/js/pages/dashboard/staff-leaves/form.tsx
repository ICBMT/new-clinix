import InputError from '@/components/input-error';
import StaffLeaveLayout, {
    staffLeaveUrl,
} from '@/components/staff-leave-layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useTranslation } from '@/hooks/use-translation';
import type { LeaveClinic, StaffLeave } from '@/types/staff-leave';
import { Link, useForm } from '@inertiajs/react';
import type { FormEvent } from 'react';

export default function StaffLeaveForm({
    leave,
    clinics,
    types,
    statuses,
}: {
    leave?: StaffLeave;
    clinics: LeaveClinic[];
    types: string[];
    statuses: string[];
}) {
    const { t, isRTL } = useTranslation();
    const { data, setData, post, put, processing, errors } = useForm({
        clinic_id: String(
            leave?.clinic_id ?? (clinics.length === 1 ? clinics[0].id : ''),
        ),
        staff_id: String(leave?.staff_id ?? ''),
        leave_type: leave?.leave_type ?? 'annual',
        start_date: leave?.start_date ?? '',
        end_date: leave?.end_date ?? '',
        reason: leave?.reason ?? '',
        status: leave?.status ?? 'pending',
    });
    const staff =
        clinics.find((clinic) => String(clinic.id) === data.clinic_id)?.staff ??
        [];
    const selectedStaffIsMissing =
        !!data.staff_id &&
        !staff.some((member) => String(member.id) === data.staff_id);
    const submit = (event: FormEvent) => {
        event.preventDefault();
        if (leave) put(`${staffLeaveUrl}/${leave.id}`);
        else post(staffLeaveUrl);
    };

    return (
        <StaffLeaveLayout
            title={t(leave ? 'staff_leave_edit' : 'staff_leave_create')}
            actions={
                <Button asChild variant="outline">
                    <Link href={staffLeaveUrl}>{t('back')}</Link>
                </Button>
            }
        >
            <form
                onSubmit={submit}
                className="max-w-3xl space-y-6 rounded-xl border bg-card p-6"
            >
                {!clinics.length && (
                    <p role="status" className="text-sm text-muted-foreground">
                        {t('staff_leave_no_clinics')}
                    </p>
                )}
                <div className="grid gap-6 sm:grid-cols-2">
                    <div className="space-y-2">
                        <Label htmlFor="clinic_id">{t('clinic')} *</Label>
                        <Select
                            value={data.clinic_id}
                            onValueChange={(value) =>
                                setData({
                                    ...data,
                                    clinic_id: value,
                                    staff_id: '',
                                })
                            }
                        >
                            <SelectTrigger
                                id="clinic_id"
                                aria-invalid={!!errors.clinic_id}
                            >
                                <SelectValue
                                    placeholder={t('staff_leave_select_clinic')}
                                />
                            </SelectTrigger>
                            <SelectContent>
                                {clinics.map((clinic) => (
                                    <SelectItem
                                        key={clinic.id}
                                        value={String(clinic.id)}
                                    >
                                        {isRTL
                                            ? clinic.name_ar || clinic.name_en
                                            : clinic.name_en}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <InputError message={errors.clinic_id} />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="staff_id">
                            {t('staff_leave_staff')} *
                        </Label>
                        <Select
                            value={selectedStaffIsMissing ? '' : data.staff_id}
                            onValueChange={(value) =>
                                setData('staff_id', value)
                            }
                            disabled={!data.clinic_id || !staff.length}
                        >
                            <SelectTrigger
                                id="staff_id"
                                aria-invalid={!!errors.staff_id}
                            >
                                <SelectValue
                                    placeholder={t('staff_leave_select_staff')}
                                />
                            </SelectTrigger>
                            <SelectContent>
                                {staff.map((member) => (
                                    <SelectItem
                                        key={member.id}
                                        value={String(member.id)}
                                    >
                                        {member.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        {data.clinic_id && !staff.length && (
                            <p className="text-sm text-muted-foreground">
                                {t('staff_leave_no_staff')}
                            </p>
                        )}
                        {selectedStaffIsMissing && (
                            <p
                                role="alert"
                                className="text-sm text-destructive"
                            >
                                {t('staff_leave_reselect_staff')}
                            </p>
                        )}
                        <InputError message={errors.staff_id} />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="leave_type">
                            {t('staff_leave_type')} *
                        </Label>
                        <Select
                            value={data.leave_type}
                            onValueChange={(value) =>
                                setData('leave_type', value)
                            }
                        >
                            <SelectTrigger id="leave_type">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                {types.map((type) => (
                                    <SelectItem key={type} value={type}>
                                        {t(`staff_leave_type_${type}`)}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <InputError message={errors.leave_type} />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="status">{t('status')} *</Label>
                        <Select
                            value={data.status}
                            onValueChange={(value) => setData('status', value)}
                        >
                            <SelectTrigger id="status">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                {statuses.map((status) => (
                                    <SelectItem key={status} value={status}>
                                        {t(`staff_leave_status_${status}`)}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <InputError message={errors.status} />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="start_date">
                            {t('staff_leave_start')} *
                        </Label>
                        <Input
                            id="start_date"
                            type="date"
                            required
                            value={data.start_date}
                            onChange={(event) =>
                                setData('start_date', event.target.value)
                            }
                            aria-invalid={!!errors.start_date}
                        />
                        <InputError message={errors.start_date} />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="end_date">
                            {t('staff_leave_end')} *
                        </Label>
                        <Input
                            id="end_date"
                            type="date"
                            required
                            min={data.start_date || undefined}
                            value={data.end_date}
                            onChange={(event) =>
                                setData('end_date', event.target.value)
                            }
                            aria-invalid={!!errors.end_date}
                        />
                        <InputError message={errors.end_date} />
                    </div>
                </div>
                <div className="space-y-2">
                    <Label htmlFor="reason">{t('staff_leave_reason')} *</Label>
                    <Textarea
                        id="reason"
                        value={data.reason}
                        onChange={(event) =>
                            setData('reason', event.target.value)
                        }
                        required
                        maxLength={2000}
                        rows={4}
                        aria-invalid={!!errors.reason}
                    />
                    <InputError message={errors.reason} />
                </div>
                <p className="text-sm text-muted-foreground">
                    {t('staff_leave_date_help')}
                </p>
                <div className="flex gap-3 border-t pt-4">
                    <Button
                        disabled={
                            processing ||
                            !data.clinic_id ||
                            !data.staff_id ||
                            selectedStaffIsMissing
                        }
                    >
                        {t('save')}
                    </Button>
                    <Button asChild variant="outline">
                        <Link href={staffLeaveUrl}>{t('cancel')}</Link>
                    </Button>
                </div>
            </form>
        </StaffLeaveLayout>
    );
}
