import { useRTLInit } from '@/hooks/use-rtl-init';
import { useTranslation } from '@/hooks/use-translation';
import AppLayout from '@/layouts/app-layout';
import { Head, usePage } from '@inertiajs/react';
import type { ReactNode } from 'react';

export const staffLeaveUrl = '/dashboard/staff-leaves';

export default function StaffLeaveLayout({
    title,
    children,
    actions,
}: {
    title: string;
    children: ReactNode;
    actions?: ReactNode;
}) {
    useRTLInit();
    const { t, isRTL } = useTranslation();
    const { flash } = usePage().props as {
        flash?: { success?: string; error?: string };
    };

    return (
        <AppLayout
            breadcrumbs={[
                { title: t('dashboard'), href: '/dashboard' },
                { title: t('staff_leaves'), href: staffLeaveUrl },
            ]}
        >
            <Head title={title} />
            <div
                className="flex flex-1 flex-col gap-6 p-4 md:p-6"
                dir={isRTL ? 'rtl' : 'ltr'}
            >
                <header className="flex flex-wrap items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold">{title}</h1>
                        <p className="mt-1 text-sm text-muted-foreground">
                            {t('staff_leave_description')}
                        </p>
                    </div>
                    {actions}
                </header>
                {flash?.success && (
                    <p
                        role="status"
                        className="rounded-md border border-green-600/30 bg-green-600/10 p-3 text-sm"
                    >
                        {flash.success}
                    </p>
                )}
                {flash?.error && (
                    <p
                        role="alert"
                        className="rounded-md border border-destructive p-3 text-sm text-destructive"
                    >
                        {flash.error}
                    </p>
                )}
                {children}
            </div>
        </AppLayout>
    );
}
