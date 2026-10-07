import { type BreadcrumbItem } from '@/types';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useTranslation } from '@/hooks/use-translation';
import { useRTL } from '@/hooks/use-rtl';
import { useRTLInit } from '@/hooks/use-rtl-init';
import AppLayout from '@/layouts/app-layout';
import { index as dashboard } from '@/routes/dashboard';
import { Head, Link, useForm, usePage } from '@inertiajs/react';
import { ArrowLeft, Eye } from 'lucide-react';
import { FormEventHandler } from 'react';
import { type SharedData } from '@/types';

interface Subscription {
    id: number;
    clinic_id: number;
    subscription_package_id: number | null;
    status: string;
    start_date: string | null;
    end_date?: string | null;
    auto_renew?: boolean | null;
    clinic?: {
        id: number;
        name_en: string;
        name_ar: string;
    };
    subscriptionPackage?: {
        id: number;
        name_en: string;
        name_ar: string;
    };
}

interface Package {
    id: number;
    name_en: string;
    name_ar: string;
}

interface EditSubscriptionProps {
    subscription: Subscription;
    packages?: Package[];
}

export default function EditSubscription({ subscription, packages = [] }: EditSubscriptionProps) {
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
            title: t('clinics_subscriptions_management'),
            href: '/dashboard/clinics-subscriptions',
        },
        {
            title: t('edit_subscription'),
            href: '#',
        },
    ];

    // Safety check - if subscription is not provided, show error
    if (!subscription || !subscription.id) {
        return (
            <AppLayout breadcrumbs={breadcrumbs}>
                <div className={cn("flex h-full flex-1 flex-col gap-6 overflow-x-auto rounded-xl bg-card dark:bg-card p-6 border border-border", isRTL ? '!text-right' : '!text-left')} dir={dir}>
                    <div className={cn("text-center py-8", isRTL ? '!text-right' : '!text-left')}>
                        <p className={cn("text-red-500", isRTL ? '!text-right' : '!text-left')}>{t('subscription_not_found')}</p>
                    </div>
                </div>
            </AppLayout>
        );
    }

    // Helper function to safely format date
    const formatDate = (date: string | null | undefined): string => {
        if (!date) return '';
        try {
            const dateObj = new Date(date);
            if (isNaN(dateObj.getTime())) return '';
            return dateObj.toISOString().split('T')[0];
        } catch {
            return '';
        }
    };

    const { data, setData, patch, processing, errors } = useForm({
        subscription_package_id: subscription?.subscription_package_id?.toString() || '',
        start_date: formatDate(subscription?.start_date),
        end_date: formatDate(subscription?.end_date),
        status: subscription?.status || 'active',
        auto_renew: subscription?.auto_renew ?? false,
    });

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        patch(`/dashboard/clinics-subscriptions/${subscription.id}`);
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`${t('edit_subscription')} - #${subscription.id}`} />

            <div className={cn("flex h-full flex-1 flex-col gap-6 overflow-x-auto rounded-xl bg-card dark:bg-card p-6 border border-border", isRTL ? '!text-right' : '!text-left')} dir={dir}>
                {/* Header */}
                <div className={cn("flex items-center justify-between border-b pb-4", flexDirection)}>
                    <div className={cn(isRTL ? '!text-right' : '!text-left')}>
                        <h1 className={cn("text-3xl font-bold text-foreground", isRTL ? '!text-right' : '!text-left')}>{t('edit_subscription')}</h1>
                        <p className={cn("text-muted-foreground mt-1", isRTL ? '!text-right' : '!text-left')}>{t('update_subscription_information')}</p>
                    </div>
                    <div className={cn("flex items-center gap-3", flexDirection)}>
                        <Link href={`/dashboard/clinics-subscriptions/${subscription.id}`}>
                            <Button variant="outline" className={cn("flex items-center gap-2", flexDirection)}>
                                <Eye className={cn("h-4 w-4", iconMargin('md'))} />
                                {t('view')}
                            </Button>
                        </Link>
                        <Link href="/dashboard/clinics-subscriptions">
                            <Button variant="outline" className={cn("flex items-center gap-2", flexDirection)}>
                                <ArrowLeft className={cn("h-4 w-4", isRTL && 'rotate-180')} />
                                {t('back')}
                            </Button>
                        </Link>
                    </div>
                </div>

                <form onSubmit={submit} className={cn("space-y-6", isRTL ? '!text-right' : '!text-left')} dir={dir}>
                    {/* Subscription Package */}
                    <div className={cn("space-y-2", isRTL ? '!text-right' : '!text-left')}>
                        <Label htmlFor="subscription_package_id" className={cn(isRTL ? '!text-right' : '!text-left')}>
                            {isRTL ? <><span className="text-red-500">*</span> {t('subscription_package')}</> : <>{t('subscription_package')} <span className="text-red-500">*</span></>}
                        </Label>
                        <Select
                            value={data.subscription_package_id}
                            onValueChange={(value) => setData('subscription_package_id', value)}
                        >
                            <SelectTrigger dir={dir} className={cn(errors.subscription_package_id ? 'border-red-500' : '', isRTL ? '!text-right' : '!text-left')}>
                                <SelectValue placeholder={t('select_package')} />
                            </SelectTrigger>
                            <SelectContent dir={dir}>
                                {packages.map((pkg) => (
                                    <SelectItem key={pkg.id} value={pkg.id.toString()} className={cn(isRTL ? '!text-right' : '!text-left')}>
                                        {isRTL ? pkg.name_ar : pkg.name_en}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        {errors.subscription_package_id && (
                            <p className={cn("text-sm text-red-500", isRTL ? '!text-right' : '!text-left')}>{t(errors.subscription_package_id) || errors.subscription_package_id}</p>
                        )}
                    </div>

                    {/* Dates */}
                    <div className={cn("grid gap-4 md:grid-cols-2", flexDirection)}>
                        <div className={cn("space-y-2", isRTL ? '!text-right' : '!text-left')}>
                            <Label htmlFor="start_date" className={cn(isRTL ? '!text-right' : '!text-left')}>
                                {isRTL ? <><span className="text-red-500">*</span> {t('start_date')}</> : <>{t('start_date')} <span className="text-red-500">*</span></>}
                            </Label>
                            <Input
                                id="start_date"
                                type="date"
                                value={data.start_date}
                                onChange={(e) => setData('start_date', e.target.value)}
                                className={cn(errors.start_date ? 'border-red-500' : '', isRTL ? '!text-right' : '!text-left')}
                                required
                            />
                            {errors.start_date && (
                                <p className={cn("text-sm text-red-500", isRTL ? '!text-right' : '!text-left')}>{t(errors.start_date) || errors.start_date}</p>
                            )}
                        </div>

                        <div className={cn("space-y-2", isRTL ? '!text-right' : '!text-left')}>
                            <Label htmlFor="end_date" className={cn(isRTL ? '!text-right' : '!text-left')}>
                                {isRTL ? <><span className="text-red-500">*</span> {t('end_date')}</> : <>{t('end_date')} <span className="text-red-500">*</span></>}
                            </Label>
                            <Input
                                id="end_date"
                                type="date"
                                value={data.end_date || ''}
                                onChange={(e) => setData('end_date', e.target.value)}
                                className={cn(errors.end_date ? 'border-red-500' : '', isRTL ? '!text-right' : '!text-left')}
                                required
                            />
                            {errors.end_date && (
                                <p className={cn("text-sm text-red-500", isRTL ? '!text-right' : '!text-left')}>{t(errors.end_date) || errors.end_date}</p>
                            )}
                        </div>
                    </div>

                    {/* Status */}
                    <div className={cn("space-y-2", isRTL ? '!text-right' : '!text-left')}>
                        <Label htmlFor="status" className={cn(isRTL ? '!text-right' : '!text-left')}>
                            {isRTL ? <><span className="text-red-500">*</span> {t('status')}</> : <>{t('status')} <span className="text-red-500">*</span></>}
                        </Label>
                        <Select
                            value={data.status}
                            onValueChange={(value) => setData('status', value)}
                        >
                            <SelectTrigger dir={dir} className={cn(errors.status ? 'border-red-500' : '', isRTL ? '!text-right' : '!text-left')}>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent dir={dir}>
                                <SelectItem value="active" className={cn(isRTL ? '!text-right' : '!text-left')}>{t('active')}</SelectItem>
                                <SelectItem value="inactive" className={cn(isRTL ? '!text-right' : '!text-left')}>{t('inactive')}</SelectItem>
                                <SelectItem value="expired" className={cn(isRTL ? '!text-right' : '!text-left')}>{t('expired')}</SelectItem>
                                <SelectItem value="cancelled" className={cn(isRTL ? '!text-right' : '!text-left')}>{t('cancelled')}</SelectItem>
                            </SelectContent>
                        </Select>
                        {errors.status && (
                            <p className={cn("text-sm text-red-500", isRTL ? '!text-right' : '!text-left')}>{t(errors.status) || errors.status}</p>
                        )}
                    </div>

                    {/* Auto Renew */}
                    <div className={cn("space-y-2", isRTL ? '!text-right' : '!text-left')}>
                        <div className={cn("flex items-center gap-2", flexDirection)}>
                            <input
                                type="checkbox"
                                id="auto_renew"
                                checked={data.auto_renew || false}
                                onChange={(e) => setData('auto_renew', e.target.checked)}
                                className="h-4 w-4 rounded border-gray-300"
                            />
                            <Label htmlFor="auto_renew" className={cn("cursor-pointer", isRTL ? '!text-right' : '!text-left')}>
                                {t('auto_renew')}
                            </Label>
                        </div>
                        {errors.auto_renew && (
                            <p className={cn("text-sm text-red-500", isRTL ? '!text-right' : '!text-left')}>{t(errors.auto_renew) || errors.auto_renew}</p>
                        )}
                    </div>

                    {/* Actions */}
                    <div className={cn("flex items-center gap-3 border-t pt-4", isRTL ? 'justify-start' : 'justify-end', flexDirection)}>
                        <Link href="/dashboard/clinics-subscriptions">
                            <Button type="button" variant="outline">
                                {t('cancel')}
                            </Button>
                        </Link>
                        <Button type="submit" disabled={processing} className={flexDirection}>
                            {processing ? t('updating') : t('update')}
                        </Button>
                    </div>
                </form>
            </div>
        </AppLayout>
    );
}

