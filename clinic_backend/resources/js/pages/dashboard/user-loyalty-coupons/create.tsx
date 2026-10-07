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
import { ArrowLeft } from 'lucide-react';
import { FormEventHandler } from 'react';
import { cn } from '@/lib/utils';

interface User {
    id: number;
    name: string;
    email: string;
}

interface CreateUserLoyaltyCouponProps {
    users?: User[] | null;
}

export default function CreateUserLoyaltyCoupon({ users }: CreateUserLoyaltyCouponProps) {
    useRTLInit();
    const { t, locale } = useTranslation();
    const { isRTL, dir, textAlign, flexDirection, iconMargin, getFieldDir, getInputTextAlign } = useRTL();

    const breadcrumbs: BreadcrumbItem[] = [
        {
            title: t('dashboard'),
            href: dashboard.url(),
        },
        {
            title: t('user_loyalty_coupons_management'),
            href: '/dashboard/user-loyalty-coupons',
        },
        {
            title: t('create_user_loyalty_coupon'),
            href: '/dashboard/user-loyalty-coupons/create',
        },
    ];

    const { data, setData, post, processing, errors } = useForm({
        user_id: '',
        code: '',
        title_en: '',
        title_ar: '',
        description_en: '',
        description_ar: '',
        discount_type: 'percentage',
        discount_value: '',
        usage_limit: '',
        status: 'active',
        valid_from: '',
        valid_until: '',
    });

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        post('/dashboard/user-loyalty-coupons');
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={t('create_user_loyalty_coupon')} />

            <div className={cn("flex h-full flex-1 flex-col gap-6 overflow-x-auto rounded-xl bg-card dark:bg-card p-6 border border-border", textAlign)} dir={dir}>
                {/* Header */}
                <div className={cn("flex items-center justify-between border-b pb-4", flexDirection)}>
                    <div className={textAlign}>
                        <h1 className={cn("text-3xl font-bold text-foreground", textAlign)}>{t('create_user_loyalty_coupon')}</h1>
                        <p className={cn("text-muted-foreground mt-1", textAlign)}>{t('create_new_user_loyalty_coupon')}</p>
                    </div>
                    
                    <Link href="/dashboard/user-loyalty-coupons">
                        <Button variant="outline" className={cn("flex items-center gap-2", flexDirection)}>
                            <ArrowLeft className={cn("h-4 w-4", isRTL && 'rotate-180', iconMargin('md'))} />
                            {t('back')}
                        </Button>
                    </Link>
                </div>

                <form onSubmit={submit} className={cn("max-w-2xl space-y-6", textAlign)} dir={dir}>
                    <div className={cn("space-y-2", textAlign)}>
                        <Label htmlFor="user_id" className={textAlign}>
                            {t('user')} <span className="text-red-500">*</span>
                        </Label>
                        <Select
                            value={data.user_id || undefined}
                            onValueChange={(value) => setData('user_id', value)}
                        >
                            <SelectTrigger className={cn(errors.user_id ? 'border-red-500' : '', textAlign)} dir={dir}>
                                <SelectValue placeholder={t('select_user')} />
                            </SelectTrigger>
                            <SelectContent dir={dir}>
                                {Array.isArray(users) && users.map((user) => (
                                    <SelectItem key={user.id} value={user.id.toString()}>
                                        {user.name} ({user.email})
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        {errors.user_id && (
                            <p className={cn("text-sm text-red-500", textAlign)} dir={dir}>{errors.user_id}</p>
                        )}
                    </div>

                    <div className={cn("space-y-2", textAlign)}>
                        <Label htmlFor="code" className={textAlign}>
                            {t('coupon_code')} <span className="text-red-500">*</span>
                        </Label>
                        <Input
                            id="code"
                            type="text"
                            value={data.code}
                            onChange={(e) => setData('code', e.target.value.toUpperCase())}
                            placeholder={t('enter_coupon_code')}
                            dir={getFieldDir('text')}
                            className={cn(errors.code ? 'border-red-500' : '', getInputTextAlign('text'))}
                            required
                        />
                        {errors.code && (
                            <p className={cn("text-sm text-red-500", textAlign)} dir={dir}>{errors.code}</p>
                        )}
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className={cn("space-y-2", textAlign)}>
                            <Label htmlFor="discount_type" className={textAlign}>
                                {t('discount_type')} <span className="text-red-500">*</span>
                            </Label>
                            <Select
                                value={data.discount_type}
                                onValueChange={(value) => setData('discount_type', value)}
                            >
                                <SelectTrigger className={cn(errors.discount_type ? 'border-red-500' : '', textAlign)} dir={dir}>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent dir={dir}>
                                    <SelectItem value="percentage">{t('percentage')}</SelectItem>
                                    <SelectItem value="fixed_amount">{t('fixed_amount')}</SelectItem>
                                </SelectContent>
                            </Select>
                            {errors.discount_type && (
                                <p className={cn("text-sm text-red-500", textAlign)} dir={dir}>{errors.discount_type}</p>
                            )}
                        </div>

                        <div className={cn("space-y-2", textAlign)}>
                            <Label htmlFor="discount_value" className={textAlign}>
                                {t('discount_value')} <span className="text-red-500">*</span>
                            </Label>
                            <Input
                                id="discount_value"
                                type="number"
                                step="0.01"
                                value={data.discount_value}
                                onChange={(e) => setData('discount_value', e.target.value)}
                                placeholder={data.discount_type === 'percentage' ? '10' : '50.00'}
                                dir={getFieldDir('number')}
                                className={cn(errors.discount_value ? 'border-red-500' : '', getInputTextAlign('number'))}
                                required
                            />
                            {errors.discount_value && (
                                <p className={cn("text-sm text-red-500", textAlign)} dir={dir}>{errors.discount_value}</p>
                            )}
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className={cn("space-y-2", textAlign)}>
                            <Label htmlFor="valid_from" className={textAlign}>{t('valid_from')}</Label>
                            <Input
                                id="valid_from"
                                type="datetime-local"
                                value={data.valid_from}
                                onChange={(e) => setData('valid_from', e.target.value)}
                                dir={getFieldDir('text')}
                                className={cn(errors.valid_from ? 'border-red-500' : '', getInputTextAlign('text'))}
                            />
                            {errors.valid_from && (
                                <p className={cn("text-sm text-red-500", textAlign)} dir={dir}>{errors.valid_from}</p>
                            )}
                        </div>

                        <div className={cn("space-y-2", textAlign)}>
                            <Label htmlFor="valid_until" className={textAlign}>{t('valid_until')}</Label>
                            <Input
                                id="valid_until"
                                type="datetime-local"
                                value={data.valid_until}
                                onChange={(e) => setData('valid_until', e.target.value)}
                                dir={getFieldDir('text')}
                                className={cn(errors.valid_until ? 'border-red-500' : '', getInputTextAlign('text'))}
                            />
                            {errors.valid_until && (
                                <p className={cn("text-sm text-red-500", textAlign)} dir={dir}>{errors.valid_until}</p>
                            )}
                        </div>
                    </div>

                    <div className={cn("space-y-2", textAlign)}>
                        <Label htmlFor="status" className={textAlign}>
                            {t('status')} <span className="text-red-500">*</span>
                        </Label>
                        <Select
                            value={data.status}
                            onValueChange={(value) => setData('status', value as 'active' | 'inactive')}
                        >
                            <SelectTrigger className={cn(errors.status ? 'border-red-500' : '', textAlign)} dir={dir}>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent dir={dir}>
                                <SelectItem value="active">{t('active')}</SelectItem>
                                <SelectItem value="inactive">{t('inactive')}</SelectItem>
                            </SelectContent>
                        </Select>
                        {errors.status && (
                            <p className={cn("text-sm text-red-500", textAlign)} dir={dir}>{errors.status}</p>
                        )}
                    </div>

                    <div className={cn("flex items-center gap-3 pt-4 border-t", flexDirection)}>
                        <Button type="submit" disabled={processing}>
                            {processing ? t('creating') : t('create_user_loyalty_coupon')}
                        </Button>
                        <Link href="/dashboard/user-loyalty-coupons">
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

