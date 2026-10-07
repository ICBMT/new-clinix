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
import { Head, Link, useForm, usePage } from '@inertiajs/react';
import { ArrowLeft, Eye } from 'lucide-react';
import { FormEventHandler } from 'react';
import { type SharedData } from '@/types';
import { cn } from '@/lib/utils';

interface Service {
    id: number;
    vendor_id: number;
    category_id: number;
    name_en: string;
    name_ar: string;
    description_en?: string;
    description_ar?: string;
    base_price: string;
    discount_type?: string;
    discount_value?: string;
    final_price?: string;
    has_discount?: boolean;
    status: 'pending' | 'approved' | 'rejected';
    is_featured: boolean;
    is_fast_booking: boolean;
    auto_confirm?: boolean;
    working_days?: string[];
    daily_start_time?: string;
    daily_end_time?: string;
    service_duration_minutes?: number;
    buffer_time_minutes?: number;
    min_advance_booking_hours?: number;
    max_advance_booking_days?: number;
    rejection_reason?: string;
}

interface Category {
    id: number;
    name_en: string;
    name_ar: string;
}

interface Vendor {
    id: number;
    name: string;
}

interface EditServiceProps {
    service: Service;
    categories?: Category[] | null;
    vendors?: Vendor[] | null;
    is_vendor?: boolean;
    current_vendor_id?: number;
}

export default function EditService({ service, categories, vendors, is_vendor = false, current_vendor_id }: EditServiceProps) {
    useRTLInit();
    const { t, locale } = useTranslation();
    const { isRTL, dir, textAlign, flexDirection, iconMargin, getFieldDir, getInputTextAlign } = useRTL();
    const { auth } = usePage<SharedData>().props;
    
    const breadcrumbs: BreadcrumbItem[] = [
        {
            title: t('dashboard'),
            href: dashboard.url(),
        },
        {
            title: t('services_management'),
            href: '/dashboard/services',
        },
        {
            title: t('edit_service'),
            href: '#',
        },
    ];
    
    // Check if user is vendor from auth (fallback)
    const userIsVendor = is_vendor || auth?.user?.roles?.includes('vendor') || false;

    const { data, setData, patch, processing, errors } = useForm({
        vendor_id: userIsVendor && current_vendor_id ? current_vendor_id.toString() : (service.vendor_id?.toString() || ''),
        category_id: service.category_id?.toString() || '',
        name_en: service.name_en || '',
        name_ar: service.name_ar || '',
        description_en: service.description_en || '',
        description_ar: service.description_ar || '',
        base_price: service.base_price || '',
        discount_type: service.discount_type || 'percentage',
        discount_value: service.discount_value || '',
        final_price: service.final_price || '',
        has_discount: service.has_discount || false,
        status: service.status || 'pending',
        is_featured: service.is_featured ?? false,
        is_fast_booking: service.is_fast_booking ?? false,
        auto_confirm: service.auto_confirm ?? false,
        working_days: service.working_days || [],
        daily_start_time: service.daily_start_time || '',
        daily_end_time: service.daily_end_time || '',
        service_duration_minutes: service.service_duration_minutes || 60,
        buffer_time_minutes: service.buffer_time_minutes || 0,
        min_advance_booking_hours: service.min_advance_booking_hours || 24,
        max_advance_booking_days: service.max_advance_booking_days || 30,
        rejection_reason: service.rejection_reason || '',
        _method: 'PATCH',
    });

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        patch(`/dashboard/services/${service.id}`);
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`${t('edit_service')} - ${service.name_en}`} />

            <div className={cn("flex h-full flex-1 flex-col gap-6 overflow-x-auto rounded-xl bg-card dark:bg-card p-6 border border-border", textAlign)} dir={dir}>
                <div className={cn("flex items-center justify-between border-b pb-4", flexDirection)}>
                    <div className={textAlign}>
                        <h1 className={cn("text-3xl font-bold text-foreground", textAlign)}>{t('edit_service')}</h1>
                        <p className={cn("text-muted-foreground mt-1", textAlign)}>{t('update_service_information')}</p>
                    </div>
                    <div className={cn("flex items-center gap-3", flexDirection)}>
                        <Link href={`/dashboard/services/${service.id}`}>
                            <Button variant="outline" className={cn("flex items-center gap-2", flexDirection)}>
                                <Eye className={cn("h-4 w-4", iconMargin('md'))} />
                                {t('view')}
                            </Button>
                        </Link>
                        <Link href="/dashboard/services">
                            <Button variant="outline" className={cn("flex items-center gap-2", flexDirection)}>
                                <ArrowLeft className={cn("h-4 w-4", isRTL && 'rotate-180', iconMargin('md'))} />
                                {t('back')}
                            </Button>
                        </Link>
                    </div>
                </div>

                <form onSubmit={submit} className={cn("max-w-2xl space-y-6", textAlign)} dir={dir}>
                    {!userIsVendor && (
                        <div className={cn("space-y-2", textAlign)}>
                            <Label htmlFor="vendor_id" className={textAlign}>
                                {t('vendor')} <span className="text-red-500">*</span>
                            </Label>
                            <Select
                                value={data.vendor_id || undefined}
                                onValueChange={(value) => setData('vendor_id', value)}
                            >
                                <SelectTrigger className={cn(errors.vendor_id ? 'border-red-500' : '', textAlign)} dir={dir}>
                                    <SelectValue placeholder={t('select_vendor')} />
                                </SelectTrigger>
                                <SelectContent dir={dir}>
                                    {Array.isArray(vendors) && vendors.map((vendor) => (
                                        <SelectItem key={vendor.id} value={vendor.id.toString()}>
                                            {vendor.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            {errors.vendor_id && (
                                <p className={cn("text-sm text-red-500", textAlign)} dir={dir}>{errors.vendor_id}</p>
                            )}
                        </div>
                    )}

                    <div className={cn("space-y-2", textAlign)}>
                        <Label htmlFor="category_id" className={textAlign}>
                            {t('category')} <span className="text-red-500">*</span>
                        </Label>
                        <Select
                            value={data.category_id || undefined}
                            onValueChange={(value) => setData('category_id', value)}
                        >
                            <SelectTrigger className={cn(errors.category_id ? 'border-red-500' : '', textAlign)} dir={dir}>
                                <SelectValue placeholder={t('select_category')} />
                            </SelectTrigger>
                            <SelectContent dir={dir}>
                                {Array.isArray(categories) && categories.map((category) => (
                                    <SelectItem key={category.id} value={category.id.toString()}>
                                        {isRTL ? category.name_ar : category.name_en}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        {errors.category_id && (
                            <p className={cn("text-sm text-red-500", textAlign)} dir={dir}>{errors.category_id}</p>
                        )}
                    </div>

                    <div className={cn("space-y-2", textAlign)}>
                        <Label htmlFor="name_en" className={textAlign}>
                            {t('name_en')} <span className="text-red-500">*</span>
                        </Label>
                        <Input
                            id="name_en"
                            type="text"
                            value={data.name_en}
                            onChange={(e) => setData('name_en', e.target.value)}
                            placeholder={t('enter_name_en')}
                            dir={getFieldDir('text')}
                            className={cn(errors.name_en ? 'border-red-500' : '', getInputTextAlign('text'))}
                            required
                        />
                        {errors.name_en && (
                            <p className={cn("text-sm text-red-500", textAlign)} dir={dir}>{errors.name_en}</p>
                        )}
                    </div>

                    <div className={cn("space-y-2", textAlign)}>
                        <Label htmlFor="name_ar" className={textAlign}>
                            {t('name_ar')} <span className="text-red-500">*</span>
                        </Label>
                        <Input
                            id="name_ar"
                            type="text"
                            value={data.name_ar}
                            onChange={(e) => setData('name_ar', e.target.value)}
                            placeholder={t('enter_name_ar')}
                            dir={getFieldDir('text')}
                            className={cn(errors.name_ar ? 'border-red-500' : '', getInputTextAlign('text'))}
                            required
                        />
                        {errors.name_ar && (
                            <p className={cn("text-sm text-red-500", textAlign)} dir={dir}>{errors.name_ar}</p>
                        )}
                    </div>

                    <div className={cn("space-y-2", textAlign)}>
                        <Label htmlFor="description_en" className={textAlign}>{t('description_en')}</Label>
                        <Textarea
                            id="description_en"
                            value={data.description_en}
                            onChange={(e) => setData('description_en', e.target.value)}
                            placeholder={t('enter_description_en')}
                            dir={getFieldDir('textarea')}
                            className={cn(errors.description_en ? 'border-red-500' : '', getInputTextAlign('textarea'))}
                            rows={4}
                        />
                        {errors.description_en && (
                            <p className={cn("text-sm text-red-500", textAlign)} dir={dir}>{errors.description_en}</p>
                        )}
                    </div>

                    <div className={cn("space-y-2", textAlign)}>
                        <Label htmlFor="description_ar" className={textAlign}>{t('description_ar')}</Label>
                        <Textarea
                            id="description_ar"
                            value={data.description_ar}
                            onChange={(e) => setData('description_ar', e.target.value)}
                            placeholder={t('enter_description_ar')}
                            dir={getFieldDir('textarea')}
                            className={cn(errors.description_ar ? 'border-red-500' : '', getInputTextAlign('textarea'))}
                            rows={4}
                        />
                        {errors.description_ar && (
                            <p className={cn("text-sm text-red-500", textAlign)} dir={dir}>{errors.description_ar}</p>
                        )}
                    </div>

                    <div className={cn("space-y-2", textAlign)}>
                        <Label htmlFor="base_price" className={textAlign}>
                            {t('base_price')} <span className="text-red-500">*</span>
                        </Label>
                        <Input
                            id="base_price"
                            type="number"
                            step="0.01"
                            value={data.base_price}
                            onChange={(e) => setData('base_price', e.target.value)}
                            placeholder="0.00"
                            dir={getFieldDir('number')}
                            className={cn(errors.base_price ? 'border-red-500' : '', getInputTextAlign('number'))}
                            required
                        />
                        {errors.base_price && (
                            <p className={cn("text-sm text-red-500", textAlign)} dir={dir}>{errors.base_price}</p>
                        )}
                    </div>

                    <div className={cn("space-y-2", textAlign)}>
                        <Label htmlFor="status" className={textAlign}>
                            {t('status')} <span className="text-red-500">*</span>
                        </Label>
                        <Select
                            value={data.status}
                            onValueChange={(value) => setData('status', value as 'pending' | 'approved' | 'rejected')}
                        >
                            <SelectTrigger className={cn(errors.status ? 'border-red-500' : '', textAlign)} dir={dir}>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent dir={dir}>
                                <SelectItem value="pending">{t('pending')}</SelectItem>
                                <SelectItem value="approved">{t('approved')}</SelectItem>
                                <SelectItem value="rejected">{t('rejected')}</SelectItem>
                            </SelectContent>
                        </Select>
                        {errors.status && (
                            <p className={cn("text-sm text-red-500", textAlign)} dir={dir}>{errors.status}</p>
                        )}
                    </div>

                    {data.status === 'rejected' && (
                        <div className={cn("space-y-2", textAlign)}>
                            <Label htmlFor="rejection_reason" className={textAlign}>{t('rejection_reason')}</Label>
                            <Textarea
                                id="rejection_reason"
                                value={data.rejection_reason}
                                onChange={(e) => setData('rejection_reason', e.target.value)}
                                placeholder={t('enter_rejection_reason')}
                                dir={getFieldDir('textarea')}
                                className={cn(errors.rejection_reason ? 'border-red-500' : '', getInputTextAlign('textarea'))}
                                rows={3}
                            />
                            {errors.rejection_reason && (
                                <p className={cn("text-sm text-red-500", textAlign)} dir={dir}>{errors.rejection_reason}</p>
                            )}
                        </div>
                    )}

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

                    <div className={cn("flex items-center justify-between pt-4 border-t", flexDirection)}>
                        <Label htmlFor="is_fast_booking" className={cn("flex flex-col", textAlign)}>
                            <span className={textAlign}>{t('is_fast_booking')}</span>
                        </Label>
                        <Switch
                            id="is_fast_booking"
                            checked={data.is_fast_booking}
                            onCheckedChange={(checked) => setData('is_fast_booking', checked)}
                        />
                    </div>

                    <div className={cn("flex items-center justify-between pt-4 border-t", flexDirection)}>
                        <Label htmlFor="auto_confirm" className={cn("flex flex-col", textAlign)}>
                            <span className={textAlign}>{t('auto_confirm')}</span>
                        </Label>
                        <Switch
                            id="auto_confirm"
                            checked={data.auto_confirm}
                            onCheckedChange={(checked) => setData('auto_confirm', checked)}
                        />
                    </div>

                    <div className={cn("flex items-center gap-3 pt-4 border-t", flexDirection)}>
                        <Button type="submit" disabled={processing}>
                            {processing ? t('updating') : t('update_service')}
                        </Button>
                        <Link href="/dashboard/services">
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

