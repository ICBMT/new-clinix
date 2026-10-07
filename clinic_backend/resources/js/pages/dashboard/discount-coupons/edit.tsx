import { type BreadcrumbItem } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { useRTLInit } from '@/hooks/use-rtl-init';
import { useTranslation } from '@/hooks/use-translation';
import { useRTL } from '@/hooks/use-rtl';
import AppLayout from '@/layouts/app-layout';
import { index as dashboard } from '@/routes/dashboard';
import { Head, Link, useForm } from '@inertiajs/react';
import { ArrowLeft, Eye } from 'lucide-react';
import { FormEventHandler } from 'react';
import { cn } from '@/lib/utils';

interface DiscountCoupon {
    id: number;
    code: string;
    title_en?: string;
    title_ar?: string;
    coupon_type: string;
    discount_type: string;
    discount_value: string;
    status: 'active' | 'inactive';
    is_featured: boolean;
    valid_from?: string;
    valid_until?: string;
}

interface Category {
    id: number;
    name_en: string;
    name_ar: string;
}

interface Service {
    id: number;
    name_en: string;
    name_ar: string;
}

interface EditDiscountCouponProps {
    coupon: DiscountCoupon;
    categories?: Category[] | null;
    services?: Service[] | null;
}

export default function EditDiscountCoupon({ coupon, categories, services }: EditDiscountCouponProps) {
    useRTLInit();
    const { t, locale } = useTranslation();
    const { isRTL, dir, textAlign, flexDirection, iconMargin, getFieldDir, getInputTextAlign } = useRTL();
    
    const breadcrumbs: BreadcrumbItem[] = [
        {
            title: t('dashboard'),
            href: dashboard.url(),
        },
        {
            title: t('discount_coupons_management'),
            href: '/dashboard/discount-coupons',
        },
        {
            title: t('edit_discount_coupon'),
            href: '#',
        },
    ];

    const { data, setData, patch, processing, errors } = useForm({
        code: coupon.code || '',
        title_en: coupon.title_en || '',
        title_ar: coupon.title_ar || '',
        coupon_type: coupon.coupon_type || 'discount_code',
        discount_type: coupon.discount_type || 'percentage',
        discount_value: coupon.discount_value || '',
        status: coupon.status || 'active',
        is_featured: coupon.is_featured ?? false,
        valid_from: coupon.valid_from || '',
        valid_until: coupon.valid_until || '',
        _method: 'PATCH',
    });

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        patch(`/dashboard/discount-coupons/${coupon.id}`);
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`${t('edit_discount_coupon')} - ${coupon.code}`} />

            <div className={cn("flex h-full flex-1 flex-col gap-6 overflow-x-auto rounded-xl bg-card dark:bg-card p-6 border border-border", textAlign)} dir={dir}>
                <div className={cn("flex items-center justify-between border-b pb-4", flexDirection)}>
                    <div className={textAlign}>
                        <h1 className={cn("text-3xl font-bold text-foreground", textAlign)}>{t('edit_discount_coupon')}</h1>
                        <p className={cn("text-muted-foreground mt-1", textAlign)}>{t('update_discount_coupon_information')}</p>
                    </div>
                    <div className={cn("flex items-center gap-3", flexDirection)}>
                        <Link href={`/dashboard/discount-coupons/${coupon.id}`}>
                            <Button variant="outline" className={cn("flex items-center gap-2", flexDirection)}>
                                <Eye className={cn("h-4 w-4", iconMargin('md'))} />
                                {t('view')}
                            </Button>
                        </Link>
                        <Link href="/dashboard/discount-coupons">
                            <Button variant="outline" className={cn("flex items-center gap-2", flexDirection)}>
                                <ArrowLeft className={cn("h-4 w-4", isRTL && 'rotate-180', iconMargin('md'))} />
                                {t('back')}
                            </Button>
                        </Link>
                    </div>
                </div>

                <form onSubmit={submit} className={cn("max-w-2xl space-y-6", textAlign)} dir={dir}>
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
                                <SelectTrigger className={cn(errors.discount_type ? 'border-red-500' : '', textAlign)}>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
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
                            <SelectTrigger className={cn(errors.status ? 'border-red-500' : '', textAlign)}>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="active">{t('active')}</SelectItem>
                                <SelectItem value="inactive">{t('inactive')}</SelectItem>
                            </SelectContent>
                        </Select>
                        {errors.status && (
                            <p className={cn("text-sm text-red-500", textAlign)} dir={dir}>{errors.status}</p>
                        )}
                    </div>

                    <div className={cn("flex items-center justify-between pt-4 border-t", flexDirection)}>
                        <Label htmlFor="is_featured" className={cn("flex flex-col", textAlign)}>
                            <span className={textAlign}>{t('is_featured')}</span>
                        </Label>
                        <Switch
                            id="is_featured"
                            checked={data.is_featured}
                            onCheckedChange={(checked) => setData('is_featured', checked)}
                        />
                    </div>

                    <div className={cn("flex items-center gap-3 pt-4 border-t", flexDirection)}>
                        <Button type="submit" disabled={processing}>
                            {processing ? t('updating') : t('update_discount_coupon')}
                        </Button>
                        <Link href="/dashboard/discount-coupons">
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

