import { type BreadcrumbItem } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { useTranslation } from '@/hooks/use-translation';
import { useRTL } from '@/hooks/use-rtl';
import { useRTLInit } from '@/hooks/use-rtl-init';
import AppLayout from '@/layouts/app-layout';
import { index as dashboard } from '@/routes/dashboard';
import { Head, Link, useForm, router, usePage } from '@inertiajs/react';
import { ArrowLeft } from 'lucide-react';
import { FormEventHandler, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { type SharedData } from '@/types';

interface Clinic {
    id: number;
    name_en: string;
    name_ar: string;
}

interface Package {
    id: number;
    name_en: string;
    name_ar: string;
    price: number;
    currency: string;
    duration_days: number;
}

interface CreateSubscriptionProps {
    clinics?: Clinic[];
    packages?: Package[];
}

export default function CreateSubscription({ clinics = [], packages = [] }: CreateSubscriptionProps) {
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
            title: t('create_subscription'),
            href: '#',
        },
    ];

    const { data, setData, post, processing, errors } = useForm({
        clinic_id: '',
        subscription_package_id: '',
        transaction_id: '',
        amount_paid: '',
        currency: 'KWD',
        start_date: new Date().toISOString().split('T')[0],
        end_date: '',
        status: 'active' as 'active' | 'expired' | 'cancelled' | 'suspended',
        auto_renew: false,
        cancellation_reason: '',
    });

    // Update amount and currency when package is selected
    useEffect(() => {
        if (data.subscription_package_id) {
            const selectedPackage = packages.find(p => p.id.toString() === data.subscription_package_id);
            if (selectedPackage) {
                setData('amount_paid', selectedPackage.price.toString());
                setData('currency', selectedPackage.currency || 'KWD');
                
                // Calculate end date if start date is set
                if (data.start_date) {
                    const startDate = new Date(data.start_date);
                    const endDate = new Date(startDate);
                    endDate.setDate(endDate.getDate() + (selectedPackage.duration_days || 30));
                    setData('end_date', endDate.toISOString().split('T')[0]);
                }
            }
        }
    }, [data.subscription_package_id, data.start_date, packages, setData]);

    // Update end date when start date changes (if package is selected)
    useEffect(() => {
        if (data.start_date && data.subscription_package_id) {
            const selectedPackage = packages.find(p => p.id.toString() === data.subscription_package_id);
            if (selectedPackage) {
                const startDate = new Date(data.start_date);
                const endDate = new Date(startDate);
                endDate.setDate(endDate.getDate() + (selectedPackage.duration_days || 30));
                setData('end_date', endDate.toISOString().split('T')[0]);
            }
        }
    }, [data.start_date, data.subscription_package_id, packages, setData]);

    const getLocalizedName = (nameEn: string, nameAr: string, currentLocale: string) => {
        return currentLocale === 'ar' ? nameAr : nameEn;
    };

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        post('/dashboard/clinics-subscriptions', {
            preserveScroll: true,
        });
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={t('create_subscription')} />

            <div className={cn("flex h-full flex-1 flex-col gap-6 overflow-x-auto rounded-xl bg-card dark:bg-card p-6 border border-border", isRTL ? '!text-right' : '!text-left')} dir={dir}>
                {/* Header */}
                <div className={cn("flex items-center justify-between border-b pb-4", flexDirection)}>
                    <div className={cn(isRTL ? '!text-right' : '!text-left')}>
                        <h1 className={cn("text-3xl font-bold text-foreground", isRTL ? '!text-right' : '!text-left')}>{t('create_subscription')}</h1>
                        <p className={cn("text-muted-foreground mt-1", isRTL ? '!text-right' : '!text-left')}>{t('create_new_clinic_subscription')}</p>
                    </div>
                    <Link href="/dashboard/clinics-subscriptions">
                        <Button variant="outline" className={cn("flex items-center gap-2", flexDirection)}>
                            <ArrowLeft className={cn("h-4 w-4", isRTL && 'rotate-180')} />
                            {t('back')}
                        </Button>
                    </Link>
                </div>

                <form onSubmit={submit} className={cn("space-y-6", isRTL ? '!text-right' : '!text-left')} dir={dir}>
                    {/* Clinic Selection */}
                    <div className={cn("space-y-2", isRTL ? '!text-right' : '!text-left')}>
                        <Label htmlFor="clinic_id" className={cn(isRTL ? '!text-right' : '!text-left')}>
                            {isRTL ? <><span className="text-red-500">*</span> {t('clinic')}</> : <>{t('clinic')} <span className="text-red-500">*</span></>}
                        </Label>
                        <Select
                            value={data.clinic_id}
                            onValueChange={(value) => setData('clinic_id', value)}
                        >
                            <SelectTrigger dir={dir} className={cn(errors.clinic_id ? 'border-red-500' : '', isRTL ? '!text-right' : '!text-left')}>
                                <SelectValue placeholder={t('select_clinic')} />
                            </SelectTrigger>
                            <SelectContent dir={dir}>
                                {clinics.map((clinic) => (
                                    <SelectItem key={clinic.id} value={clinic.id.toString()} className={cn(isRTL ? '!text-right' : '!text-left')}>
                                        {getLocalizedName(clinic.name_en, clinic.name_ar, locale)}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        {errors.clinic_id && (
                            <p className={cn("text-sm text-red-500", isRTL ? '!text-right' : '!text-left')}>{t(errors.clinic_id) || errors.clinic_id}</p>
                        )}
                    </div>

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
                                        {getLocalizedName(pkg.name_en, pkg.name_ar, locale)} - {pkg.price} {pkg.currency}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        {errors.subscription_package_id && (
                            <p className={cn("text-sm text-red-500", isRTL ? '!text-right' : '!text-left')}>{t(errors.subscription_package_id) || errors.subscription_package_id}</p>
                        )}
                    </div>

                    {/* Amount and Currency */}
                    <div className={cn("grid gap-4 md:grid-cols-2", flexDirection)}>
                        <div className={cn("space-y-2", isRTL ? '!text-right' : '!text-left')}>
                            <Label htmlFor="amount_paid" className={cn(isRTL ? '!text-right' : '!text-left')}>
                                {isRTL ? <><span className="text-red-500">*</span> {t('amount_paid')}</> : <>{t('amount_paid')} <span className="text-red-500">*</span></>}
                            </Label>
                            <Input
                                id="amount_paid"
                                type="number"
                                step="0.01"
                                min="0"
                                value={data.amount_paid}
                                onChange={(e) => setData('amount_paid', e.target.value)}
                                dir={getFieldDir('number')}
                                className={cn(errors.amount_paid ? 'border-red-500' : '', getInputTextAlign('number'))}
                                required
                            />
                            {errors.amount_paid && (
                                <p className={cn("text-sm text-red-500", isRTL ? '!text-right' : '!text-left')}>{t(errors.amount_paid) || errors.amount_paid}</p>
                            )}
                        </div>

                        <div className={cn("space-y-2", isRTL ? '!text-right' : '!text-left')}>
                            <Label htmlFor="currency" className={cn(isRTL ? '!text-right' : '!text-left')}>
                                {isRTL ? <><span className="text-red-500">*</span> {t('currency')}</> : <>{t('currency')} <span className="text-red-500">*</span></>}
                            </Label>
                            <Select
                                value={data.currency}
                                onValueChange={(value) => setData('currency', value)}
                            >
                                <SelectTrigger dir={dir} className={cn(errors.currency ? 'border-red-500' : '', isRTL ? '!text-right' : '!text-left')}>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent dir={dir}>
                                    <SelectItem value="KWD" className={cn(isRTL ? '!text-right' : '!text-left')}>KWD</SelectItem>
                                    <SelectItem value="USD" className={cn(isRTL ? '!text-right' : '!text-left')}>USD</SelectItem>
                                    <SelectItem value="EUR" className={cn(isRTL ? '!text-right' : '!text-left')}>EUR</SelectItem>
                                </SelectContent>
                            </Select>
                            {errors.currency && (
                                <p className={cn("text-sm text-red-500", isRTL ? '!text-right' : '!text-left')}>{t(errors.currency) || errors.currency}</p>
                            )}
                        </div>
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
                                value={data.end_date}
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
                            onValueChange={(value) => setData('status', value as typeof data.status)}
                        >
                            <SelectTrigger dir={dir} className={cn(errors.status ? 'border-red-500' : '', isRTL ? '!text-right' : '!text-left')}>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent dir={dir}>
                                <SelectItem value="active" className={cn(isRTL ? '!text-right' : '!text-left')}>{t('active')}</SelectItem>
                                <SelectItem value="expired" className={cn(isRTL ? '!text-right' : '!text-left')}>{t('expired')}</SelectItem>
                                <SelectItem value="cancelled" className={cn(isRTL ? '!text-right' : '!text-left')}>{t('cancelled')}</SelectItem>
                                <SelectItem value="suspended" className={cn(isRTL ? '!text-right' : '!text-left')}>{t('suspended')}</SelectItem>
                            </SelectContent>
                        </Select>
                        {errors.status && (
                            <p className={cn("text-sm text-red-500", isRTL ? '!text-right' : '!text-left')}>{t(errors.status) || errors.status}</p>
                        )}
                    </div>

                    {/* Transaction ID (Optional) */}
                    <div className={cn("space-y-2", isRTL ? '!text-right' : '!text-left')}>
                        <Label htmlFor="transaction_id" className={cn(isRTL ? '!text-right' : '!text-left')}>
                            {t('transaction_id')} ({t('optional')})
                        </Label>
                        <Input
                            id="transaction_id"
                            type="number"
                            value={data.transaction_id}
                            onChange={(e) => setData('transaction_id', e.target.value)}
                            dir={getFieldDir('number')}
                            className={cn(errors.transaction_id ? 'border-red-500' : '', getInputTextAlign('number'))}
                        />
                        {errors.transaction_id && (
                            <p className={cn("text-sm text-red-500", isRTL ? '!text-right' : '!text-left')}>{t(errors.transaction_id) || errors.transaction_id}</p>
                        )}
                    </div>

                    {/* Auto Renew */}
                    <div className={cn("space-y-2", isRTL ? '!text-right' : '!text-left')}>
                        <div className={cn("flex items-center gap-2", flexDirection)}>
                            <Checkbox
                                id="auto_renew"
                                checked={data.auto_renew}
                                onCheckedChange={(checked) => setData('auto_renew', checked === true)}
                            />
                            <Label htmlFor="auto_renew" className={cn("cursor-pointer", isRTL ? '!text-right' : '!text-left')}>
                                {t('auto_renew')}
                            </Label>
                        </div>
                        {errors.auto_renew && (
                            <p className={cn("text-sm text-red-500", isRTL ? '!text-right' : '!text-left')}>{t(errors.auto_renew) || errors.auto_renew}</p>
                        )}
                    </div>

                    {/* Cancellation Reason (Optional) */}
                    <div className={cn("space-y-2", isRTL ? '!text-right' : '!text-left')}>
                        <Label htmlFor="cancellation_reason" className={cn(isRTL ? '!text-right' : '!text-left')}>
                            {t('cancellation_reason')} ({t('optional')})
                        </Label>
                        <Input
                            id="cancellation_reason"
                            type="text"
                            value={data.cancellation_reason}
                            onChange={(e) => setData('cancellation_reason', e.target.value)}
                            dir={getFieldDir('text')}
                            className={cn(errors.cancellation_reason ? 'border-red-500' : '', getInputTextAlign('text'))}
                            maxLength={500}
                        />
                        {errors.cancellation_reason && (
                            <p className={cn("text-sm text-red-500", isRTL ? '!text-right' : '!text-left')}>{t(errors.cancellation_reason) || errors.cancellation_reason}</p>
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
                            {processing ? t('creating') : t('create_subscription')}
                        </Button>
                    </div>
                </form>
            </div>
        </AppLayout>
    );
}

