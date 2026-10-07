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
import { Head, Link, useForm, router, usePage } from '@inertiajs/react';
import { ArrowLeft } from 'lucide-react';
import { FormEventHandler, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { customToast } from '@/components/ui/custom-toast';
import { type SharedData } from '@/types';

export default function CreateSubscriptionPackage() {
    useRTLInit();
    const { t, locale } = useTranslation();
    const { isRTL, dir, textAlign, flexDirection, iconMargin, getFieldDir, getInputTextAlign } = useRTL();
    const { flash } = usePage<SharedData>().props;
    
    // Flash messages (for errors on create page)
    useEffect(() => {
        if (flash?.success) {
            customToast.success(flash.success);
        }
        if (flash?.error) {
            customToast.error(flash.error);
        }
    }, [flash]);
    
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
            title: t('create_package'),
            href: '/dashboard/subscription-packages/create',
        },
    ];

    const { data, setData, processing, errors } = useForm({
        name_en: '',
        name_ar: '',
        description_en: '',
        description_ar: '',
        price: '',
        currency: 'KWD' as string,
        billing_cycle: 'monthly' as 'monthly' | 'quarterly' | 'yearly' | '',
        duration_days: '30',
        features: [] as string[],
        max_services: '',
        max_bookings_per_month: '',
        featured_listing: false,
        priority_support: false,
        analytics_access: false,
        custom_branding: false,
        status: 'active' as 'active' | 'inactive' | '',
        sort_order: '0',
    });

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        
        // Prepare data with proper types
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
                // Set to max value if exceeds limit
                durationDays = 3650;
            }
        }
        
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
        
        // Use router.post to send transformed data
        router.post('/dashboard/subscription-packages', submitData, {
            preserveScroll: true,
            onSuccess: () => {
                // Success message will show on index page via flash message
                customToast.success(t('package_created_successfully'));
            },
            onError: (errors) => {
                // Handle validation errors
                if (errors && Object.keys(errors).length > 0) {
                    // Show general error message
                    const firstError = Object.values(errors)[0];
                    if (typeof firstError === 'string') {
                        customToast.error(firstError);
                    } else if (Array.isArray(firstError) && firstError.length > 0) {
                        customToast.error(firstError[0]);
                    } else {
                        customToast.error(t('validation_error_occurred'));
                    }
                } else {
                    customToast.error(t('failed_to_create_package'));
                }
            },
        });
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={t('create_package')} />

            <div className={cn("flex h-full flex-1 flex-col gap-6 overflow-x-auto rounded-xl bg-card dark:bg-card p-6 border border-border", textAlign)} dir={dir}>
                {/* Header */}
                <div className={cn("flex items-center justify-between border-b pb-4", flexDirection)}>
                    <div className={textAlign}>
                        <h1 className={cn("text-3xl font-bold text-foreground", textAlign)}>{t('create_package')}</h1>
                        <p className={cn("text-muted-foreground mt-1", textAlign)}>{t('add_a_new_subscription_package')}</p>
                    </div>
                    
                    <Link href="/dashboard/subscription-packages">
                        <Button variant="outline" className={cn("flex items-center gap-2", flexDirection)}>
                            <ArrowLeft className={cn("h-4 w-4", isRTL && 'rotate-180', iconMargin('md'))} />
                            {t('back')}
                        </Button>
                    </Link>
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
                                className={cn(errors.name_en ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : '', getInputTextAlign('text'))}
                                required
                            />
                            {errors.name_en && (
                                <p className={cn("text-sm text-red-500", textAlign)} dir={dir}>{errors.name_en}</p>
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
                                className={cn(errors.name_ar ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : '', getInputTextAlign('text'))}
                            />
                            {errors.name_ar && (
                                <p className={cn("text-sm text-red-500", textAlign)} dir={dir}>{errors.name_ar}</p>
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
                                className={cn(errors.description_en ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : '', getInputTextAlign('textarea'))}
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
                                className={cn(errors.description_ar ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : '', getInputTextAlign('textarea'))}
                                rows={4}
                            />
                            {errors.description_ar && (
                                <p className={cn("text-sm text-red-500", textAlign)} dir={dir}>{errors.description_ar}</p>
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
                                className={cn(errors.price ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : '', getInputTextAlign('number'))}
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
                            <Select value={data.currency || undefined} onValueChange={(value) => setData('currency', value)}>
                                <SelectTrigger className={cn(errors.currency ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : '', textAlign)} dir={dir}>
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
                            <Select value={data.billing_cycle || undefined} onValueChange={(value) => setData('billing_cycle', value as 'monthly' | 'quarterly' | 'yearly')}>
                                <SelectTrigger className={cn(errors.billing_cycle ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : '', textAlign)} dir={dir}>
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
                                max="3650"
                                value={data.duration_days}
                                onChange={(e) => {
                                    const value = e.target.value;
                                    if (value === '') {
                                        setData('duration_days', '30');
                                    } else {
                                        const numValue = parseInt(value, 10);
                                        if (!isNaN(numValue) && numValue >= 1) {
                                            // Cap at 3650 to prevent crashes
                                            setData('duration_days', Math.min(numValue, 3650).toString());
                                        }
                                    }
                                }}
                                placeholder="30"
                                dir={getFieldDir('number')}
                                className={cn(errors.duration_days ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : '', getInputTextAlign('number'))}
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
                                className={cn(errors.max_services ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : '', getInputTextAlign('number'))}
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
                                className={cn(errors.max_bookings_per_month ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : '', getInputTextAlign('number'))}
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
                            <Select value={data.status || undefined} onValueChange={(value) => setData('status', value as 'active' | 'inactive')}>
                                <SelectTrigger className={cn(errors.status ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : '', textAlign)} dir={dir}>
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
                                className={cn(errors.sort_order ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : '', getInputTextAlign('number'))}
                            />
                            {errors.sort_order && (
                                <p className={cn("text-sm text-red-500", textAlign)} dir={dir}>{errors.sort_order}</p>
                            )}
                        </div>
                    </div>

                    <div className={cn("flex items-center gap-3 pt-4 border-t", flexDirection)}>
                        <Button type="submit" disabled={processing}>
                            {processing ? t('creating') : t('create_package')}
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

