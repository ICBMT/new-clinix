import { ConfirmationDialog } from '@/components/confirmation-dialog';
import InputError from '@/components/input-error';
import StaffLeaveLayout, {
    staffLeaveUrl,
} from '@/components/staff-leave-layout';
import { Badge } from '@/components/ui/badge';
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
import { usePermissions } from '@/hooks/use-permissions';
import { useTranslation } from '@/hooks/use-translation';
import type { LeaveClinic, StaffLeave } from '@/types/staff-leave';
import { Link, router, useForm } from '@inertiajs/react';
import { Plus } from 'lucide-react';
import { useState, type FormEvent } from 'react';

interface Props {
    leaves: {
        data: StaffLeave[];
        total: number;
        current_page: number;
        last_page: number;
        prev_page_url: string | null;
        next_page_url: string | null;
    };
    clinics: LeaveClinic[];
    filters: { search?: string; clinic_id?: string; status?: string };
    statuses: string[];
}

export default function StaffLeaves({
    leaves,
    clinics,
    filters,
    statuses,
}: Props) {
    const { t, isRTL } = useTranslation();
    const { can } = usePermissions();
    const [deleting, setDeleting] = useState<StaffLeave | null>(null);
    const [busy, setBusy] = useState(false);
    const { data, setData, get, errors, processing } = useForm({
        search: filters.search ?? '',
        clinic_id: String(filters.clinic_id ?? ''),
        status: filters.status ?? '',
    });
    const submit = (event: FormEvent) => {
        event.preventDefault();
        get(staffLeaveUrl, { preserveState: true, replace: true });
    };
    const remove = () => {
        if (!deleting || busy) return;
        setBusy(true);
        router.delete(`${staffLeaveUrl}/${deleting.id}`, {
            preserveScroll: true,
            onFinish: () => setBusy(false),
        });
    };

    return (
        <StaffLeaveLayout
            title={t('staff_leaves')}
            actions={
                can('staff-leaves.create') && (
                    <Button asChild>
                        <Link href={`${staffLeaveUrl}/create`}>
                            <Plus className="h-4 w-4" />
                            {t('staff_leave_create')}
                        </Link>
                    </Button>
                )
            }
        >
            <form
                onSubmit={submit}
                className="grid gap-4 rounded-xl border bg-card p-4 sm:grid-cols-2 lg:grid-cols-4"
            >
                <div className="space-y-2">
                    <Label htmlFor="search">{t('staff_leave_search')}</Label>
                    <Input
                        id="search"
                        value={data.search}
                        maxLength={100}
                        onChange={(e) => setData('search', e.target.value)}
                    />
                    <InputError message={errors.search} />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="clinic-filter">{t('clinic')}</Label>
                    <Select
                        value={data.clinic_id || 'all'}
                        onValueChange={(v) =>
                            setData('clinic_id', v === 'all' ? '' : v)
                        }
                    >
                        <SelectTrigger id="clinic-filter">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">{t('all')}</SelectItem>
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
                    <Label htmlFor="status-filter">{t('status')}</Label>
                    <Select
                        value={data.status || 'all'}
                        onValueChange={(v) =>
                            setData('status', v === 'all' ? '' : v)
                        }
                    >
                        <SelectTrigger id="status-filter">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">{t('all')}</SelectItem>
                            {statuses.map((status) => (
                                <SelectItem key={status} value={status}>
                                    {t(`staff_leave_status_${status}`)}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    <InputError message={errors.status} />
                </div>
                <div className="flex items-end gap-2">
                    <Button disabled={processing}>{t('search')}</Button>
                    <Button
                        type="button"
                        variant="outline"
                        onClick={() => router.get(staffLeaveUrl)}
                    >
                        {t('staff_leave_reset')}
                    </Button>
                </div>
            </form>

            <div className="overflow-x-auto rounded-xl border bg-card">
                <table className="w-full text-sm">
                    <thead className="border-b bg-muted/50">
                        <tr>
                            {[
                                'staff_leave_staff',
                                'clinic',
                                'staff_leave_type',
                                'staff_leave_start',
                                'staff_leave_end',
                                'status',
                                'actions',
                            ].map((key) => (
                                <th
                                    key={key}
                                    className="p-4 text-start font-medium whitespace-nowrap"
                                >
                                    {t(key)}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {leaves.data.map((leave) => (
                            <tr
                                key={leave.id}
                                className="border-b last:border-0"
                            >
                                <td className="p-4 font-medium">
                                    {leave.staff?.name ?? '—'}
                                </td>
                                <td className="p-4">
                                    {isRTL
                                        ? leave.clinic?.name_ar ||
                                          leave.clinic?.name_en
                                        : leave.clinic?.name_en}
                                </td>
                                <td className="p-4">
                                    {t(`staff_leave_type_${leave.leave_type}`)}
                                </td>
                                <td className="p-4 whitespace-nowrap">
                                    {leave.start_date}
                                </td>
                                <td className="p-4 whitespace-nowrap">
                                    {leave.end_date}
                                </td>
                                <td className="p-4">
                                    <Badge
                                        variant={
                                            leave.status === 'approved'
                                                ? 'default'
                                                : 'secondary'
                                        }
                                    >
                                        {t(
                                            `staff_leave_status_${leave.status}`,
                                        )}
                                    </Badge>
                                </td>
                                <td className="p-4">
                                    <div className="flex gap-2">
                                        {can('staff-leaves.show') && (
                                            <Button
                                                asChild
                                                size="sm"
                                                variant="outline"
                                            >
                                                <Link
                                                    href={`${staffLeaveUrl}/${leave.id}`}
                                                >
                                                    {t('view')}
                                                </Link>
                                            </Button>
                                        )}
                                        {can('staff-leaves.edit') && (
                                            <Button
                                                asChild
                                                size="sm"
                                                variant="outline"
                                            >
                                                <Link
                                                    href={`${staffLeaveUrl}/${leave.id}/edit`}
                                                >
                                                    {t('edit')}
                                                </Link>
                                            </Button>
                                        )}
                                        {can('staff-leaves.destroy') && (
                                            <Button
                                                size="sm"
                                                variant="destructive"
                                                disabled={busy}
                                                onClick={() =>
                                                    setDeleting(leave)
                                                }
                                            >
                                                {t('delete')}
                                            </Button>
                                        )}
                                    </div>
                                </td>
                            </tr>
                        ))}
                        {!leaves.data.length && (
                            <tr>
                                <td
                                    colSpan={7}
                                    className="p-12 text-center text-muted-foreground"
                                >
                                    {t('staff_leave_empty')}
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
            <nav
                className="flex flex-wrap items-center justify-between gap-3"
                aria-label={t('staff_leave_pagination')}
            >
                <p className="text-sm text-muted-foreground">
                    {t('staff_leave_page', {
                        page: leaves.current_page,
                        pages: leaves.last_page,
                        total: leaves.total,
                    })}
                </p>
                <div className="flex gap-2">
                    <Button
                        variant="outline"
                        disabled={!leaves.prev_page_url}
                        onClick={() =>
                            leaves.prev_page_url &&
                            router.get(leaves.prev_page_url)
                        }
                    >
                        {t('previous')}
                    </Button>
                    <Button
                        variant="outline"
                        disabled={!leaves.next_page_url}
                        onClick={() =>
                            leaves.next_page_url &&
                            router.get(leaves.next_page_url)
                        }
                    >
                        {t('next')}
                    </Button>
                </div>
            </nav>
            <ConfirmationDialog
                open={!!deleting}
                onOpenChange={(open) => !open && setDeleting(null)}
                onConfirm={remove}
                title={t('staff_leave_delete')}
                description={t('staff_leave_delete_confirm', {
                    name: deleting?.staff?.name ?? '',
                })}
                confirmText={t('delete')}
            />
        </StaffLeaveLayout>
    );
}
