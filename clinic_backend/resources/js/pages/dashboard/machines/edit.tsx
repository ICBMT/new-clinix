import { type BreadcrumbItem } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { SearchableMultiSelect, type SearchableMultiSelectOption } from '@/components/ui/searchable-multi-select';
import { useRTLInit } from '@/hooks/use-rtl-init';
import { useTranslation } from '@/hooks/use-translation';
import { useRTL } from '@/hooks/use-rtl';
import { getLocalizedName } from '@/utils/localization';
import AppLayout from '@/layouts/app-layout';
import { index as dashboard } from '@/routes/dashboard';
import { Head, Link, useForm, router, usePage } from '@inertiajs/react';
import { ArrowLeft, Eye } from 'lucide-react';
import { FormEventHandler, useEffect, useMemo, useCallback } from 'react';
import { customToast } from '@/components/ui/custom-toast';
import { cn } from '@/lib/utils';
import { type SharedData } from '@/types';

interface Clinic {
    id: number;
    name_en: string;
    name_ar: string;
}

interface Category {
    id: number;
    name_en: string;
    name_ar: string;
}

interface EditMachineProps {
    machine: {
        id: number;
        clinic_id?: number;
        category_id?: number;
        category?: Category;
        categories?: Category[];
        model_en?: string;
        model?: string; // Keep for backward compatibility
        model_ar?: string;
        serial_number?: string;
        manufacturer_en?: string;
        manufacturer?: string; // Keep for backward compatibility
        manufacturer_ar?: string;
        image?: string;
        description_en?: string;
        description_ar?: string;
        status: 'ready' | 'maintenance' | 'busy';
        request_status?: 'pending' | 'approved' | 'rejected';
    };
    clinics?: Clinic[];
    categories?: Category[];
    isClinicRole?: boolean;
}

export default function EditMachine({ machine, clinics = [], categories = [], isClinicRole = false }: EditMachineProps) {
    useRTLInit();
    const { t, locale } = useTranslation();
    const page = usePage<SharedData>();
    const { locale: pageLocale } = page.props;
    const isRTL = pageLocale === 'ar';
    const dir = isRTL ? 'rtl' : 'ltr';
    const { flexDirection, iconMargin, getFieldDir, getInputTextAlign } = useRTL();
    const pageErrors = (page.props as { errors?: Record<string, string | string[]> }).errors || {};
    const auth = (page.props as { auth?: { user?: { roles?: string[] } } }).auth;
    const userRoles = auth?.user?.roles || [];
    const shouldHideStatus = userRoles.includes('clinic') || userRoles.includes('clinic_manager');
    
    const breadcrumbs: BreadcrumbItem[] = [
        {
            title: t('dashboard'),
            href: dashboard.url(),
        },
        {
            title: t('machines_management'),
            href: '/dashboard/machines',
        },
        {
            title: t('edit_machine'),
            href: '#',
        },
    ];

    // Get initial category IDs from machine
    const initialCategoryIds = useMemo(() => {
        if (machine.categories && Array.isArray(machine.categories) && machine.categories.length > 0) {
            return machine.categories.map(cat => cat.id.toString());
        }
        // Fallback to single category for backward compatibility
        if (machine.category_id || machine.category?.id) {
            return [(machine.category_id?.toString() || machine.category?.id?.toString())];
        }
        return [];
    }, [machine.categories, machine.category_id, machine.category]);

    const { data, setData, processing, errors: formErrors, setError } = useForm({
        clinic_id: machine.clinic_id ? machine.clinic_id.toString() : 'none',
        category_ids: initialCategoryIds,
        model_en: machine.model_en || machine.model || '',
        model_ar: machine.model_ar || '',
        serial_number: machine.serial_number || '',
        manufacturer_en: machine.manufacturer_en || machine.manufacturer || '',
        manufacturer_ar: machine.manufacturer_ar || '',
        image: null as File | null,
        description_en: machine.description_en || '',
        description_ar: machine.description_ar || '',
        status: machine.status || 'ready',
        request_status: machine.request_status || 'approved',
    });

    // Convert categories to SearchableMultiSelect options
    const categoryOptions: SearchableMultiSelectOption[] = useMemo(() => {
        return categories.map(category => ({
            value: category.id.toString(),
            label: getLocalizedName(category.name_en, category.name_ar, locale),
        }));
    }, [categories, locale]);

    // Handle category change
    const handleCategoryChange = useCallback((values: string[]) => {
        setData('category_ids', values);
    }, [setData]);

    // Get errors from page props (Inertia passes validation errors here)
    const errors: Record<string, string> = { ...formErrors };
    if (pageErrors) {
        Object.keys(pageErrors).forEach((key) => {
            const errorValue = pageErrors[key];
            if (typeof errorValue === 'string') {
                errors[key] = errorValue;
            } else if (Array.isArray(errorValue) && errorValue.length > 0) {
                errors[key] = errorValue[0];
            }
        });
    }

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        
        // Prepare FormData for file uploads
        const formData = new FormData();
        
        // Add all form fields
        formData.append('clinic_id', data.clinic_id === 'none' || data.clinic_id === '' ? '' : data.clinic_id);
        // Handle category_ids array
        if (data.category_ids && Array.isArray(data.category_ids) && data.category_ids.length > 0) {
            data.category_ids.forEach((id: string) => {
                formData.append('category_ids[]', id);
            });
        }
        formData.append('model_en', data.model_en || '');
        formData.append('model_ar', data.model_ar || '');
        formData.append('serial_number', data.serial_number || '');
        formData.append('manufacturer_en', data.manufacturer_en || '');
        formData.append('manufacturer_ar', data.manufacturer_ar || '');
        formData.append('description_en', data.description_en || '');
        formData.append('description_ar', data.description_ar || '');
        formData.append('status', data.status || 'ready');
        formData.append('request_status', data.request_status || 'approved');
        
        // Add image file if provided
        if (data.image instanceof File) {
            formData.append('image', data.image);
        }
        
        formData.append('_method', 'PATCH');
        
        // Use router.post with FormData (PATCH via _method)
        router.post(`/dashboard/machines/${machine.id}`, formData, {
            forceFormData: true,
            preserveState: true,
            preserveScroll: true,
            onSuccess: () => {
                customToast.success(t('machine_updated_successfully'));
            },
            onError: (errors) => {
                // Set errors to form state
                if (errors && Object.keys(errors).length > 0) {
                    Object.keys(errors).forEach((key) => {
                        const errorValue = errors[key];
                        if (typeof errorValue === 'string') {
                            setError(key as any, errorValue);
                            customToast.error(errorValue);
                        } else if (Array.isArray(errorValue)) {
                            const firstError = errorValue[0];
                            setError(key as any, firstError);
                            errorValue.forEach((err: any) => customToast.error(err));
                        }
                    });
                } else {
                    customToast.error(t('update_failed'));
                }
            },
        });
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`${t('edit_machine')} - ${getLocalizedName(machine.model_en, machine.model_ar, locale) || machine.model || ''}`} />

            <div className={cn("flex h-full flex-1 flex-col gap-6 overflow-x-auto rounded-xl bg-card dark:bg-card p-6 border border-border", isRTL ? '!text-right' : '!text-left')} dir={dir}>
                <div className={cn("flex items-center justify-between border-b pb-4", flexDirection)}>
                    <div className={cn(isRTL ? '!text-right' : '!text-left')}>
                        <h1 className={cn("text-3xl font-bold text-foreground", isRTL ? '!text-right' : '!text-left')}>{t('edit_machine')}</h1>
                        <p className={cn("text-muted-foreground mt-1", isRTL ? '!text-right' : '!text-left')}>{t('update_machine_information') || t('update_machine')}</p>
                    </div>
                    <div className={cn("flex items-center gap-3", flexDirection)}>
                        <Link href={`/dashboard/machines/${machine.id}`}>
                            <Button variant="outline" className={cn("flex items-center gap-2", flexDirection)}>
                                <Eye className={cn("h-4 w-4", iconMargin('md'))} />
                                {t('view')}
                            </Button>
                        </Link>
                        <Link href="/dashboard/machines">
                            <Button variant="outline" className={cn("flex items-center gap-2", flexDirection)}>
                                <ArrowLeft className={cn("h-4 w-4", isRTL && 'rotate-180')} />
                                {t('back')}
                            </Button>
                        </Link>
                    </div>
                </div>

                {machine.image && (
                    <div className={cn("flex items-center gap-4", flexDirection)}>
                        <img 
                            src={machine.image} 
                            alt={machine.model_en || machine.model || t('machine_image')}
                            className="w-20 h-20 rounded-lg object-cover"
                        />
                        <p className={cn("text-sm text-muted-foreground", isRTL ? '!text-right' : '!text-left')} dir={dir}>{t('current_image')}</p>
                    </div>
                )}

                <form onSubmit={submit} className={cn("space-y-6", isRTL ? '!text-right' : '!text-left')} dir={dir}>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className={cn("space-y-2", isRTL ? '!text-right' : '!text-left')}>
                            <Label htmlFor="clinic_id" className={cn(isRTL ? '!text-right' : '!text-left')}>
                                {t('clinic')} {!isClinicRole && <span className="text-muted-foreground text-xs">({t('optional')})</span>}
                                {isClinicRole && <span className="text-red-500">*</span>}
                            </Label>
                            <Select
                                value={data.clinic_id === '' ? 'none' : (data.clinic_id || 'none')}
                                onValueChange={(value) => setData('clinic_id', value === 'none' ? '' : value)}
                                required={isClinicRole}
                            >
                                <SelectTrigger className={cn(errors.clinic_id ? 'border-red-500' : '', isRTL ? '!text-right' : '!text-left')} dir={dir}>
                                    <SelectValue placeholder={t('select_clinic') || t('select')} />
                                </SelectTrigger>
                                <SelectContent dir={dir}>
                                    {!isClinicRole && (
                                        <SelectItem value="none">{t('none')} ({t('global_machine')})</SelectItem>
                                    )}
                                    {Array.isArray(clinics) && clinics.length > 0 ? (
                                        clinics.map((clinic) => (
                                            <SelectItem key={clinic.id} value={clinic.id.toString()}>
                                                {isRTL && clinic.name_ar ? clinic.name_ar : clinic.name_en}
                                            </SelectItem>
                                        ))
                                    ) : null}
                                </SelectContent>
                            </Select>
                            {!isClinicRole && (
                                <p className={cn("text-xs text-muted-foreground mt-1", isRTL ? '!text-right' : '!text-left')} dir={dir}>
                                    {t('machine_without_clinic_description')}
                                </p>
                            )}
                            {isClinicRole && (
                                <p className={cn("text-xs text-muted-foreground mt-1", isRTL ? '!text-right' : '!text-left')} dir={dir}>
                                    {t('machine_clinic_required')}
                                </p>
                            )}
                            {errors.clinic_id && (
                                <p className={cn("text-sm text-red-500", isRTL ? '!text-right' : '!text-left')} dir={dir}>{t(errors.clinic_id) || errors.clinic_id}</p>
                            )}
                        </div>

                        <div className={cn("space-y-2", isRTL ? '!text-right' : '!text-left')}>
                            <Label htmlFor="category_ids" className={cn(isRTL ? '!text-right' : '!text-left')}>
                                {t('categories')} ({t('optional')})
                            </Label>
                            <div dir={dir}>
                                <SearchableMultiSelect
                                    options={categoryOptions}
                                    value={Array.isArray(data.category_ids) ? data.category_ids : []}
                                    onChange={handleCategoryChange}
                                    placeholder={t('select_categories')}
                                    searchPlaceholder={t('search_categories')}
                                    emptyMessage={t('no_categories_found')}
                                    className={errors.category_ids ? 'border-red-500' : ''}
                                />
                            </div>
                            {errors.category_ids && (
                                <p className={cn("text-sm text-red-500", isRTL ? '!text-right' : '!text-left')} dir={dir}>{t(errors.category_ids) || errors.category_ids}</p>
                            )}
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className={cn("space-y-2", isRTL ? '!text-right' : '!text-left')}>
                            <Label htmlFor="model_en" className={cn(isRTL ? '!text-right' : '!text-left')}>
                                {t('model_en')} <span className="text-red-500">*</span>
                            </Label>
                            <Input
                                id="model_en"
                                type="text"
                                value={data.model_en}
                                onChange={(e) => setData('model_en', e.target.value)}
                                placeholder={t('enter_model_en')}
                                dir={getFieldDir('text')}
                                className={cn(errors.model_en ? 'border-red-500' : '', getInputTextAlign('text'))}
                                required
                            />
                            {errors.model_en && (
                                <p className={cn("text-sm text-red-500", isRTL ? '!text-right' : '!text-left')} dir={dir}>{t(errors.model_en) || errors.model_en}</p>
                            )}
                        </div>

                        <div className={cn("space-y-2", isRTL ? '!text-right' : '!text-left')}>
                            <Label htmlFor="model_ar" className={cn(isRTL ? '!text-right' : '!text-left')}>
                                {t('model_ar')} <span className="text-red-500">*</span>
                            </Label>
                            <Input
                                id="model_ar"
                                type="text"
                                value={data.model_ar}
                                onChange={(e) => setData('model_ar', e.target.value)}
                                placeholder={t('enter_model_ar')}
                                dir={getFieldDir('text')}
                                className={cn(errors.model_ar ? 'border-red-500' : '', getInputTextAlign('text'))}
                                required
                            />
                            {errors.model_ar && (
                                <p className={cn("text-sm text-red-500", isRTL ? '!text-right' : '!text-left')} dir={dir}>{t(errors.model_ar) || errors.model_ar}</p>
                            )}
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className={cn("space-y-2", isRTL ? '!text-right' : '!text-left')}>
                            <Label htmlFor="manufacturer_en" className={cn(isRTL ? '!text-right' : '!text-left')}>
                                {t('manufacturer_en')} <span className="text-red-500">*</span>
                            </Label>
                            <Input
                                id="manufacturer_en"
                                type="text"
                                value={data.manufacturer_en}
                                onChange={(e) => setData('manufacturer_en', e.target.value)}
                                placeholder={t('enter_manufacturer_en')}
                                dir={getFieldDir('text')}
                                className={cn(errors.manufacturer_en ? 'border-red-500' : '', getInputTextAlign('text'))}
                                required
                            />
                            {errors.manufacturer_en && (
                                <p className={cn("text-sm text-red-500", isRTL ? '!text-right' : '!text-left')} dir={dir}>{t(errors.manufacturer_en) || errors.manufacturer_en}</p>
                            )}
                        </div>

                        <div className={cn("space-y-2", isRTL ? '!text-right' : '!text-left')}>
                            <Label htmlFor="manufacturer_ar" className={cn(isRTL ? '!text-right' : '!text-left')}>{t('manufacturer_ar')}</Label>
                            <Input
                                id="manufacturer_ar"
                                type="text"
                                value={data.manufacturer_ar}
                                onChange={(e) => setData('manufacturer_ar', e.target.value)}
                                placeholder={t('enter_manufacturer_ar')}
                                dir={getFieldDir('text')}
                                className={cn(errors.manufacturer_ar ? 'border-red-500' : '', getInputTextAlign('text'))}
                            />
                            {errors.manufacturer_ar && (
                                <p className={cn("text-sm text-red-500", isRTL ? '!text-right' : '!text-left')} dir={dir}>{t(errors.manufacturer_ar) || errors.manufacturer_ar}</p>
                            )}
                        </div>
                    </div>

                    <div className={cn("space-y-2", isRTL ? '!text-right' : '!text-left')}>
                        <Label htmlFor="serial_number" className={cn(isRTL ? '!text-right' : '!text-left')}>{t('serial_number')}</Label>
                        <Input
                            id="serial_number"
                            type="text"
                            value={data.serial_number}
                            onChange={(e) => setData('serial_number', e.target.value)}
                            placeholder={t('enter_serial_number')}
                            dir={getFieldDir('text')}
                            className={cn("font-mono", errors.serial_number ? 'border-red-500' : '', getInputTextAlign('text'))}
                        />
                        {errors.serial_number && (
                            <p className={cn("text-sm text-red-500", isRTL ? '!text-right' : '!text-left')} dir={dir}>{t(errors.serial_number) || errors.serial_number}</p>
                        )}
                    </div>

                    <div className={cn("space-y-2", isRTL ? '!text-right' : '!text-left')}>
                        <Label htmlFor="image" className={cn(isRTL ? '!text-right' : '!text-left')}>{t('image')}</Label>
                        <Input
                            id="image"
                            type="file"
                            accept="image/*"
                            onChange={(e) => setData('image', e.target.files?.[0] || null)}
                            className={errors.image ? 'border-red-500' : ''}
                        />
                        {errors.image && (
                            <p className={cn("text-sm text-red-500", isRTL ? '!text-right' : '!text-left')} dir={dir}>{t(errors.image) || errors.image}</p>
                        )}
                        <p className={cn("text-sm text-muted-foreground", isRTL ? '!text-right' : '!text-left')} dir={dir}>{t('leave_blank_to_keep_current_image') || t('leave_blank_to_keep_current')}</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className={cn("space-y-2", isRTL ? '!text-right' : '!text-left')}>
                            <Label htmlFor="description_en" className={cn(isRTL ? '!text-right' : '!text-left')}>{t('description_en')}</Label>
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
                                <p className={cn("text-sm text-red-500", isRTL ? '!text-right' : '!text-left')} dir={dir}>{t(errors.description_en) || errors.description_en}</p>
                            )}
                        </div>

                        <div className={cn("space-y-2", isRTL ? '!text-right' : '!text-left')}>
                            <Label htmlFor="description_ar" className={cn(isRTL ? '!text-right' : '!text-left')}>{t('description_ar')}</Label>
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
                                <p className={cn("text-sm text-red-500", isRTL ? '!text-right' : '!text-left')} dir={dir}>{t(errors.description_ar) || errors.description_ar}</p>
                            )}
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {!shouldHideStatus && (
                        <div className={cn("space-y-2", isRTL ? '!text-right' : '!text-left')}>
                            <Label htmlFor="status" className={cn(isRTL ? '!text-right' : '!text-left')}>
                                {t('status')} <span className="text-red-500">*</span>
                            </Label>
                            <Select value={data.status} onValueChange={(value) => setData('status', value as 'ready' | 'maintenance' | 'busy')}>
                                <SelectTrigger className={cn(errors.status ? 'border-red-500' : '', isRTL ? '!text-right' : '!text-left')} dir={dir}>
                                    <SelectValue placeholder={t('select_status') || t('select')} />
                                </SelectTrigger>
                                <SelectContent dir={dir}>
                                    <SelectItem value="ready">{t('ready')}</SelectItem>
                                    <SelectItem value="maintenance">{t('maintenance')}</SelectItem>
                                    <SelectItem value="busy">{t('busy')}</SelectItem>
                                </SelectContent>
                            </Select>
                            {errors.status && (
                                <p className={cn("text-sm text-red-500", isRTL ? '!text-right' : '!text-left')} dir={dir}>{t(errors.status) || errors.status}</p>
                            )}
                        </div>
                        )}

                        {!shouldHideStatus && (
                            <div className={cn("space-y-2", isRTL ? '!text-right' : '!text-left')}>
                                <Label htmlFor="request_status" className={cn(isRTL ? '!text-right' : '!text-left')}>
                                    {t('request_status')}
                                </Label>
                                <Select value={data.request_status} onValueChange={(value) => setData('request_status', value as 'pending' | 'approved' | 'rejected')}>
                                    <SelectTrigger className={cn(errors.request_status ? 'border-red-500' : '', isRTL ? '!text-right' : '!text-left')} dir={dir}>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent dir={dir}>
                                        <SelectItem value="pending">{t('pending')}</SelectItem>
                                        <SelectItem value="approved">{t('approved')}</SelectItem>
                                        <SelectItem value="rejected">{t('rejected')}</SelectItem>
                                    </SelectContent>
                                </Select>
                                {errors.request_status && (
                                    <p className={cn("text-sm text-red-500", isRTL ? '!text-right' : '!text-left')} dir={dir}>{t(errors.request_status) || errors.request_status}</p>
                                )}
                            </div>
                        )}
                    </div>

                    <div className={cn("flex items-center gap-3 pt-4 border-t", flexDirection, isRTL ? 'justify-start' : 'justify-end')}>
                        <Button type="submit" disabled={processing}>
                            {processing ? t('updating') : t('update_machine')}
                        </Button>
                        <Link href="/dashboard/machines">
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

