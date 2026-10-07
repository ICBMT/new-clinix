import { type BreadcrumbItem } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { useRTLInit } from '@/hooks/use-rtl-init';
import { useTranslation } from '@/hooks/use-translation';
import { useRTL } from '@/hooks/use-rtl';
import AppLayout from '@/layouts/app-layout';
import { index as dashboard } from '@/routes/dashboard';
import { Head, Link, useForm, usePage } from '@inertiajs/react';
import { ArrowLeft, Eye } from 'lucide-react';
import { FormEventHandler, useEffect } from 'react';
import { customToast } from '@/components/ui/custom-toast';
import { cn } from '@/lib/utils';

interface EditSubscriptionPackageProps {
    package: {
        id: number;
        name_en: string;
        name_ar?: string;
        description_en?: string;
        description_ar?: string;
        price?: string | number;
        currency?: string;
        billing_cycle?: 'monthly' | 'quarterly' | 'yearly';
        duration_days?: number;
        features?: string[];
        max_services?: number;
        max_bookings_per_month?: number;
        max_machines?: number;
        max_treatments?: number;
        featured_listing?: boolean;
        priority_support?: boolean;
        analytics_access?: boolean;
        custom_branding?: boolean;
        status?: 'active' | 'inactive';
        sort_order?: number;
    };
}

export default function EditSubscriptionPackage({ package: pkg }: EditSubscriptionPackageProps) {
    useRTLInit();
    const { t } = useTranslation();
    const { isRTL, dir, textAlign, flexDirection, iconMargin, getFieldDir, getInputTextAlign } = useRTL();
    const page = usePage();
    const { flash, errors: pageErrors } = page.props as { 
        flash?: { success?: string; error?: string };
        errors?: Record<string, string | string[]>;
    };

    // Flash messages
    useEffect(() => {
        if (flash?.success) {
            customToast.success(flash.success, pkg.name_en);
        }
        if (flash?.error) {
            customToast.error(flash.error);
        }
    }, [flash, pkg.name_en]);
    
    const breadcrumbs: BreadcrumbItem[] = [
        {
            title: t('dashboard'),
            href: dashboard.url(),
        },
        {
            title: t('subscription_packages'),
            href: '/dashboard/subscription-packages',
        },
        {
            title: t('edit_package'),
            href: '#',
        },
    ];

    const { data, setData, patch, processing, errors: formErrors } = useForm({
        name_en: pkg.name_en || '',
        name_ar: pkg.name_ar || '',
        description_en: pkg.description_en || '',
        description_ar: pkg.description_ar || '',
        price: pkg.price || '',
        currency: pkg.currency || '',
        billing_cycle: pkg.billing_cycle || 'monthly',
        duration_days: pkg.duration_days?.toString() || '30',
        features: pkg.features || [],
        max_services: pkg.max_services?.toString() || '',
        max_bookings_per_month: pkg.max_bookings_per_month?.toString() || '',
        featured_listing: pkg.featured_listing ?? false,
        priority_support: pkg.priority_support ?? false,
        analytics_access: pkg.analytics_access ?? false,
        custom_branding: pkg.custom_branding ?? false,
        status: pkg.status || 'active',
        sort_order: pkg.sort_order?.toString() || '0',
    });

    // Combine form errors and page errors for display
    const errors = { ...formErrors, ...pageErrors };

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        
        // Prepare data with proper types - same logic as create page
        const nameArTrimmed = (data.name_ar || '').trim();
        const descriptionEnTrimmed = (data.description_en || '').trim();
        const descriptionArTrimmed = (data.description_ar || '').trim();
        
        // Validate duration_days to prevent large numbers
        const durationDaysValue = data.duration_days.toString().trim();
        let durationDays = 30;
        if (durationDaysValue) {
            const parsed = parseInt(durationDaysValue, 10);
            if (!isNaN(parsed) && parsed >= 1 && parsed <= 3650) {
                durationDays = parsed;
            } else if (parsed > 3650) {
                durationDays = 3650;
            }
        }
        
        // Prepare transformed data for submission
        const submitData = {
            name_en: data.name_en.trim(),
            name_ar: nameArTrimmed || null, // Send null instead of empty string for nullable fields
            description_en: descriptionEnTrimmed || null,
            description_ar: descriptionArTrimmed || null,
            price: parseFloat(data.price.toString()) || 0,
            currency: data.currency || 'KWD',
            billing_cycle: data.billing_cycle || 'monthly',
            duration_days: durationDays,
            features: data.features || [],
            max_services: data.max_services && data.max_services.toString().trim() ? parseInt(data.max_services.toString(), 10) : null,
            max_bookings_per_month: data.max_bookings_per_month && data.max_bookings_per_month.toString().trim() ? parseInt(data.max_bookings_per_month.toString(), 10) : null,
            featured_listing: data.featured_listing || false,
            priority_support: data.priority_support || false,
            analytics_access: data.analytics_access || false,
            custom_branding: data.custom_branding || false,
            status: data.status || 'active',
            sort_order: parseInt(data.sort_order.toString(), 10) || 0,
        };
        
        // Update form data with transformed values before submitting
        // This ensures the form data matches what we're sending
        setData({
            name_en: submitData.name_en,
            name_ar: submitData.name_ar || '',
            description_en: submitData.description_en || '',
            description_ar: submitData.description_ar || '',
            price: submitData.price.toString(),
            currency: submitData.currency,
            billing_cycle: submitData.billing_cycle,
            duration_days: submitData.duration_days.toString(),
            features: submitData.features,
            max_services: submitData.max_services?.toString() || '',
            max_bookings_per_month: submitData.max_bookings_per_month?.toString() || '',
            featured_listing: submitData.featured_listing,
            priority_support: submitData.priority_support,
            analytics_access: submitData.analytics_access,
            custom_branding: submitData.custom_branding,
            status: submitData.status,
            sort_order: submitData.sort_order.toString(),
        });
        
        // Use patch from useForm to properly handle validation errors
        // This will automatically populate the errors object
        patch(`/dashboard/subscription-packages/${pkg.id}`, {
            preserveScroll: true,
            onError: (validationErrors) => {
                // Show toast for validation errors
                if (validationErrors.name_en) {
                    customToast.error(Array.isArray(validationErrors.name_en) ? validationErrors.name_en[0] : validationErrors.name_en);
                } else if (validationErrors.name_ar) {
                    customToast.error(Array.isArray(validationErrors.name_ar) ? validationErrors.name_ar[0] : validationErrors.name_ar);
                } else if (validationErrors.description_en) {
                    customToast.error(Array.isArray(validationErrors.description_en) ? validationErrors.description_en[0] : validationErrors.description_en);
                } else if (validationErrors.description_ar) {
                    customToast.error(Array.isArray(validationErrors.description_ar) ? validationErrors.description_ar[0] : validationErrors.description_ar);
                } else {
                    // Show first error if available
                    const firstError = Object.values(validationErrors)[0];
                    if (firstError) {
                        customToast.error(Array.isArray(firstError) ? firstError[0] : firstError);
                    } else {
                        customToast.error(t('validation_error_occurred'));
                    }
                }
            },
            onSuccess: () => {
                customToast.success(t('subscription_package_updated_successfully'));
            },
        });
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`${t('edit_package')} - ${pkg.name_en}`} />

            <div className={cn("flex h-full flex-1 flex-col gap-6 overflow-x-auto rounded-xl bg-card dark:bg-card p-6 border border-border", textAlign)} dir={dir}>
                <div className={cn("flex items-center justify-between border-b pb-4", flexDirection)}>
                    <div className={textAlign}>
                        <h1 className={cn("text-3xl font-bold text-foreground", textAlign)}>{t('edit_package')}</h1>
                        <p className={cn("text-muted-foreground mt-1", textAlign)}>{t('update_subscription_package_information')}</p>
                    </div>
                    <div className={cn("flex items-center gap-3", flexDirection)}>
                        <Link href={`/dashboard/subscription-packages/${pkg.id}`}>
                            <Button variant="outline" className={cn("flex items-center gap-2", flexDirection)}>
                                <Eye className={cn("h-4 w-4", iconMargin('md'))} />
                                {t('view')}
                            </Button>
                        </Link>
                        <Link href="/dashboard/subscription-packages">
                            <Button variant="outline" className={cn("flex items-center gap-2", flexDirection)}>
                                <ArrowLeft className={cn("h-4 w-4", isRTL && 'rotate-180', iconMargin('md'))} />
                                {t('back')}
                            </Button>
                        </Link>
                    </div>
                </div>

                <form onSubmit={submit} className={cn("max-w-2xl space-y-6", textAlign)} dir={dir}>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className={cn("space-y-2", textAlign)}>
                            <Label htmlFor="name_en" className={textAlign}>
                                {t('name_en')} <span className="text-red-500">*</span>
                            </Label>
                            <Input
                                id="name_en"
                                type="text"
                                value={data.name_en}
                                maxLength={50}
                                onChange={(e) => {
                                    const value = e.target.value.slice(0, 50);
                                    setData('name_en', value);
                                }}
                                placeholder={t('enter_name_en')}
                                dir={getFieldDir('text')}
                                className={cn(errors.name_en ? 'border-red-500' : '', getInputTextAlign('text'))}
                                required
                            />
                            {errors.name_en && (
                                <p className={cn("text-sm text-red-500", textAlign)} dir={dir}>
                                    {Array.isArray(errors.name_en) ? errors.name_en[0] : errors.name_en}
                                </p>
                            )}
                        </div>

                        <div className={cn("space-y-2", textAlign)}>
                            <Label htmlFor="name_ar" className={textAlign}>{t('name_ar')}</Label>
                            <Input
                                id="name_ar"
                                type="text"
                                value={data.name_ar}
                                maxLength={50}
                                onChange={(e) => {
                                    const value = e.target.value.slice(0, 50);
                                    setData('name_ar', value);
                                }}
                                placeholder={t('enter_name_ar')}
                                dir={getFieldDir('text')}
                                className={cn(errors.name_ar ? 'border-red-500' : '', getInputTextAlign('text'))}
                            />
                            {errors.name_ar && (
                                <p className={cn("text-sm text-red-500", textAlign)} dir={dir}>
                                    {Array.isArray(errors.name_ar) ? errors.name_ar[0] : errors.name_ar}
                                </p>
                            )}
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                                <p className={cn("text-sm text-red-500", textAlign)} dir={dir}>
                                    {Array.isArray(errors.description_en) ? errors.description_en[0] : errors.description_en}
                                </p>
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
                                <p className={cn("text-sm text-red-500", textAlign)} dir={dir}>
                                    {Array.isArray(errors.description_ar) ? errors.description_ar[0] : errors.description_ar}
                                </p>
                            )}
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className={cn("space-y-2", textAlign)}>
                            <Label htmlFor="price" className={textAlign}>
                                {t('price')} <span className="text-red-500">*</span>
                            </Label>
                            <Input
                                id="price"
                                type="text"
                                value={data.price}
                                onChange={(e) => setData('price', e.target.value)}
                                placeholder="0.00"
                                dir={getFieldDir('number')}
                                className={cn(errors.price ? 'border-red-500' : '', getInputTextAlign('number'))}
                                required
                            />
                            {errors.price && (
                                <p className={cn("text-sm text-red-500", textAlign)} dir={dir}>{errors.price}</p>
                            )}
                        </div>

                        <div className={cn("space-y-2", textAlign)}>
                            <Label htmlFor="currency" className={textAlign}>
                                {t('currency')} <span className="text-red-500">*</span>
                            </Label>
                            <Select value={data.currency} onValueChange={(value) => setData('currency', value)}>
                                <SelectTrigger className={cn(errors.currency ? 'border-red-500' : '', textAlign)} dir={dir}>
                                    <SelectValue placeholder={t('select_currency')} />
                                </SelectTrigger>
                                <SelectContent dir={dir}>
                                    <SelectItem value="KWD">KWD</SelectItem>
                                    <SelectItem value="USD">USD</SelectItem>
                                    <SelectItem value="EUR">EUR</SelectItem>
                                </SelectContent>
                            </Select>
                            {errors.currency && (
                                <p className={cn("text-sm text-red-500", textAlign)} dir={dir}>{errors.currency}</p>
                            )}
                        </div>

                        <div className={cn("space-y-2", textAlign)}>
                            <Label htmlFor="billing_cycle" className={textAlign}>
                                {t('billing_cycle')} <span className="text-red-500">*</span>
                            </Label>
                            <Select value={data.billing_cycle} onValueChange={(value) => setData('billing_cycle', value as 'monthly' | 'quarterly' | 'yearly')}>
                                <SelectTrigger className={cn(errors.billing_cycle ? 'border-red-500' : '', textAlign)} dir={dir}>
                                    <SelectValue placeholder={t('select_billing_cycle')} />
                                </SelectTrigger>
                                <SelectContent dir={dir}>
                                    <SelectItem value="monthly">{t('monthly')}</SelectItem>
                                    <SelectItem value="quarterly">{t('quarterly')}</SelectItem>
                                    <SelectItem value="yearly">{t('yearly')}</SelectItem>
                                </SelectContent>
                            </Select>
                            {errors.billing_cycle && (
                                <p className={cn("text-sm text-red-500", textAlign)} dir={dir}>{errors.billing_cycle}</p>
                            )}
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className={cn("space-y-2", textAlign)}>
                            <Label htmlFor="duration_days" className={textAlign}>
                                {t('duration')} ({t('days')}) <span className="text-red-500">*</span>
                            </Label>
                            <Input
                                id="duration_days"
                                type="number"
                                min="1"
                                value={data.duration_days}
                                onChange={(e) => setData('duration_days', e.target.value)}
                                placeholder="30"
                                dir={getFieldDir('number')}
                                className={cn(errors.duration_days ? 'border-red-500' : '', getInputTextAlign('number'))}
                                required
                            />
                            {errors.duration_days && (
                                <p className={cn("text-sm text-red-500", textAlign)} dir={dir}>{errors.duration_days}</p>
                            )}
                        </div>

                        <div className={cn("space-y-2", textAlign)}>
                            <Label htmlFor="max_services" className={textAlign}>{t('max_services')}</Label>
                            <Input
                                id="max_services"
                                type="number"
                                min="0"
                                value={data.max_services}
                                onChange={(e) => setData('max_services', e.target.value)}
                                placeholder={t('unlimited') || 'Unlimited'}
                                dir={getFieldDir('number')}
                                className={cn(errors.max_services ? 'border-red-500' : '', getInputTextAlign('number'))}
                            />
                            {errors.max_services && (
                                <p className={cn("text-sm text-red-500", textAlign)} dir={dir}>{errors.max_services}</p>
                            )}
                        </div>

                        <div className={cn("space-y-2", textAlign)}>
                            <Label htmlFor="max_bookings_per_month" className={textAlign}>{t('max_bookings_per_month')}</Label>
                            <Input
                                id="max_bookings_per_month"
                                type="number"
                                min="0"
                                value={data.max_bookings_per_month}
                                onChange={(e) => setData('max_bookings_per_month', e.target.value)}
                                placeholder={t('unlimited') || 'Unlimited'}
                                dir={getFieldDir('number')}
                                className={cn(errors.max_bookings_per_month ? 'border-red-500' : '', getInputTextAlign('number'))}
                            />
                            {errors.max_bookings_per_month && (
                                <p className={cn("text-sm text-red-500", textAlign)} dir={dir}>{errors.max_bookings_per_month}</p>
                            )}
                        </div>
                    </div>

                    <div className={cn("space-y-4 pt-4 border-t", textAlign)}>
                        <Label className={textAlign}>{t('features')}</Label>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className={cn("flex items-center", flexDirection)}>
                                <Checkbox
                                    id="featured_listing"
                                    checked={data.featured_listing}
                                    onCheckedChange={(checked) => setData('featured_listing', checked as boolean)}
                                />
                                <Label htmlFor="featured_listing" className={cn("cursor-pointer", textAlign)} dir={dir}>{t('featured_listing')}</Label>
                            </div>

                            <div className={cn("flex items-center", flexDirection)}>
                                <Checkbox
                                    id="priority_support"
                                    checked={data.priority_support}
                                    onCheckedChange={(checked) => setData('priority_support', checked as boolean)}
                                />
                                <Label htmlFor="priority_support" className={cn("cursor-pointer", textAlign)} dir={dir}>{t('priority_support')}</Label>
                            </div>

                            <div className={cn("flex items-center", flexDirection)}>
                                <Checkbox
                                    id="analytics_access"
                                    checked={data.analytics_access}
                                    onCheckedChange={(checked) => setData('analytics_access', checked as boolean)}
                                />
                                <Label htmlFor="analytics_access" className={cn("cursor-pointer", textAlign)} dir={dir}>{t('analytics_access')}</Label>
                            </div>

                            <div className={cn("flex items-center", flexDirection)}>
                                <Checkbox
                                    id="custom_branding"
                                    checked={data.custom_branding}
                                    onCheckedChange={(checked) => setData('custom_branding', checked as boolean)}
                                />
                                <Label htmlFor="custom_branding" className={cn("cursor-pointer", textAlign)} dir={dir}>{t('custom_branding')}</Label>
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className={cn("space-y-2", textAlign)}>
                            <Label htmlFor="status" className={textAlign}>
                                {t('status')} <span className="text-red-500">*</span>
                            </Label>
                            <Select value={data.status} onValueChange={(value) => setData('status', value as 'active' | 'inactive')}>
                                <SelectTrigger className={cn(errors.status ? 'border-red-500' : '', textAlign)} dir={dir}>
                                    <SelectValue placeholder={t('select_status')} />
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

                        <div className={cn("space-y-2", textAlign)}>
                            <Label htmlFor="sort_order" className={textAlign}>{t('sort_order')}</Label>
                            <Input
                                id="sort_order"
                                type="number"
                                min="0"
                                value={data.sort_order}
                                onChange={(e) => setData('sort_order', e.target.value)}
                                placeholder="0"
                                dir={getFieldDir('number')}
                                className={cn(errors.sort_order ? 'border-red-500' : '', getInputTextAlign('number'))}
                            />
                            {errors.sort_order && (
                                <p className={cn("text-sm text-red-500", textAlign)} dir={dir}>{errors.sort_order}</p>
                            )}
                        </div>
                    </div>

                    <div className={cn("flex items-center gap-3 pt-4 border-t", flexDirection)}>
                        <Button type="submit" disabled={processing}>
                            {processing ? t('updating') : t('update_package')}
                        </Button>
                        <Link href="/dashboard/subscription-packages">
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

