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
import { Head, Link, useForm, usePage } from '@inertiajs/react';
import { type VisitOptions } from '@inertiajs/core';
import { ArrowLeft } from 'lucide-react';
import { FormEventHandler, useMemo } from 'react';
import InputError from '@/components/input-error';
import { customToast } from '@/components/ui/custom-toast';
import { cn } from '@/lib/utils';

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

interface CreateMachineProps {
    clinics?: Clinic[];
    categories?: Category[];
    isClinicRole?: boolean;
}

export default function CreateMachine({ clinics = [], categories = [], isClinicRole = false }: CreateMachineProps) {
    useRTLInit();
    const { t, locale } = useTranslation();
    const { isRTL, dir, textAlign, flexDirection, iconMargin, getFieldDir, getInputTextAlign } = useRTL();
    const page = usePage();
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
            title: t('create_machine'),
            href: '/dashboard/machines/create',
        },
    ];

    const { data, setData, post, processing, errors } = useForm({
        clinic_id: undefined as string | undefined,
        category_ids: [] as string[],
        model_en: '',
        model_ar: '',
        serial_number: '',
        manufacturer_en: '',
        manufacturer_ar: '',
        image: null as File | null,
        description_en: '',
        description_ar: '',
        status: 'ready' as 'ready' | 'maintenance' | 'busy',
        request_status: 'approved' as 'pending' | 'approved' | 'rejected',
    });

    // Convert categories to SearchableMultiSelect options
    const categoryOptions: SearchableMultiSelectOption[] = useMemo(() => {
        return categories.map(category => ({
            value: category.id.toString(),
            label: getLocalizedName(category.name_en, category.name_ar, locale),
        }));
    }, [categories, locale]);

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        
        // Build FormData manually to handle category_ids array
        const formData = new FormData();
        formData.append('clinic_id', data.clinic_id || '');
        if (data.category_ids && data.category_ids.length > 0) {
            data.category_ids.forEach((id: string) => {
                formData.append('category_ids[]', id);
            });
        }
        formData.append('model_en', data.model_en);
        formData.append('model_ar', data.model_ar);
        formData.append('serial_number', data.serial_number);
        formData.append('manufacturer_en', data.manufacturer_en);
        formData.append('manufacturer_ar', data.manufacturer_ar);
        formData.append('description_en', data.description_en);
        formData.append('description_ar', data.description_ar);
        formData.append('status', data.status);
        formData.append('request_status', data.request_status);
        if (data.image) {
            formData.append('image', data.image);
        }
        
        const options: VisitOptions = {
            data: formData as FormData,
            forceFormData: true,
            onSuccess: () => {
                customToast.success(t('machine_created_successfully'));
            },
            onError: (errors: Record<string, string | string[]>) => {
                Object.values(errors || {}).forEach((error) => {
                    if (typeof error === 'string') {
                        customToast.error(error);
                    } else if (Array.isArray(error)) {
                        error.forEach((err) => customToast.error(String(err)));
                    }
                });
            },
        };

        post('/dashboard/machines', options);
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={t('create_machine')} />

            <div className={cn("flex h-full flex-1 flex-col gap-6 overflow-x-auto rounded-xl bg-card dark:bg-card p-6 border border-border", isRTL ? '!text-right' : '!text-left')} dir={dir}>
                {/* Header */}
                <div className={cn("flex items-center justify-between border-b pb-4", flexDirection)}>
                    <div className={cn(isRTL ? '!text-right' : '!text-left')}>
                        <h1 className={cn("text-3xl font-bold text-foreground", isRTL ? '!text-right' : '!text-left')}>{t('create_machine')}</h1>
                        <p className={cn("text-muted-foreground mt-1", isRTL ? '!text-right' : '!text-left')}>{t('create_new_machine') || t('add_new_machine')}</p>
                    </div>
                    
                    <Link href="/dashboard/machines">
                        <Button variant="outline" className={cn("flex items-center gap-2", flexDirection)}>
                            <ArrowLeft className={cn("h-4 w-4", isRTL && 'rotate-180')} />
                            {t('back')}
                        </Button>
                    </Link>
                </div>

                <form onSubmit={submit} encType="multipart/form-data" className={cn("space-y-6", isRTL ? '!text-right' : '!text-left')} dir={dir}>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className={cn("space-y-2", isRTL ? '!text-right' : '!text-left')} dir={dir}>
                            <Label htmlFor="clinic_id" className={cn(isRTL ? '!text-right' : '!text-left')}>
                                {isRTL ? (
                                    <>
                                        {isClinicRole && <span className="text-red-500">*</span>} {t('clinic')} {!isClinicRole && <span className="text-muted-foreground text-xs">({t('optional')})</span>}
                                    </>
                                ) : (
                                    <>
                                        {t('clinic')} {!isClinicRole && <span className="text-muted-foreground text-xs">({t('optional')})</span>}
                                        {isClinicRole && <span className="text-red-500">*</span>}
                                    </>
                                )}
                            </Label>
                            <Select
                                value={data.clinic_id || 'none'}
                                onValueChange={(value) => setData('clinic_id', value === 'none' ? undefined : value)}
                                required={isClinicRole}
                            >
                                <SelectTrigger className={cn(errors.clinic_id ? 'border-red-500' : '', isRTL ? '!text-right' : '!text-left')} dir={dir}>
                                    <SelectValue placeholder={t('select_clinic') || t('select')} />
                                </SelectTrigger>
                                <SelectContent dir={dir}>
                                    {!isClinicRole && (
                                        <SelectItem value="none" className={cn(isRTL ? '!text-right' : '!text-left')}>{t('none')} ({t('global_machine')})</SelectItem>
                                    )}
                                    {Array.isArray(clinics) && clinics.length > 0 ? (
                                        clinics.map((clinic) => (
                                            <SelectItem key={clinic.id} value={clinic.id.toString()} className={cn(isRTL ? '!text-right' : '!text-left')}>
                                                {isRTL && clinic.name_ar ? clinic.name_ar : (clinic.name_en || t('clinic'))}
                                            </SelectItem>
                                        ))
                                    ) : isClinicRole ? (
                                        <SelectItem value="no-approved-clinics" disabled className={cn(isRTL ? '!text-right' : '!text-left')}>
                                            {t('no_approved_clinics')}
                                        </SelectItem>
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
                            <InputError message={errors.clinic_id} className={cn("mt-1", isRTL ? '!text-right' : '!text-left')} />
                        </div>

                        <div className={cn("space-y-2", isRTL ? '!text-right' : '!text-left')} dir={dir}>
                            <Label htmlFor="category_ids" className={cn(isRTL ? '!text-right' : '!text-left')}>
                                {t('categories')} ({t('optional')})
                            </Label>
                            <div dir={dir}>
                                <SearchableMultiSelect
                                    options={categoryOptions}
                                    value={data.category_ids || []}
                                    onChange={(values) => setData('category_ids', values)}
                                    placeholder={t('select_categories')}
                                    searchPlaceholder={t('search_categories')}
                                    emptyMessage={t('no_categories_found')}
                                    className={errors.category_ids ? 'border-red-500' : ''}
                                />
                            </div>
                            <InputError message={errors.category_ids} className={cn("mt-1", isRTL ? '!text-right' : '!text-left')} />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className={cn("space-y-2", isRTL ? '!text-right' : '!text-left')} dir={dir}>
                            <Label htmlFor="model_en" className={cn(isRTL ? '!text-right' : '!text-left')}>
                                {isRTL ? <><span className="text-red-500">*</span> {t('model_en')}</> : <>{t('model_en')} <span className="text-red-500">*</span></>}
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
                            <InputError message={errors.model_en} className={cn("mt-1", isRTL ? '!text-right' : '!text-left')} />
                        </div>

                        <div className={cn("space-y-2", isRTL ? '!text-right' : '!text-left')} dir={dir}>
                            <Label htmlFor="model_ar" className={cn(isRTL ? '!text-right' : '!text-left')}>
                                {isRTL ? <><span className="text-red-500">*</span> {t('model_ar')}</> : <>{t('model_ar')} <span className="text-red-500">*</span></>}
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
                            <InputError message={errors.model_ar} className={cn("mt-1", isRTL ? '!text-right' : '!text-left')} />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className={cn("space-y-2", isRTL ? '!text-right' : '!text-left')} dir={dir}>
                            <Label htmlFor="manufacturer_en" className={cn(isRTL ? '!text-right' : '!text-left')}>
                                {isRTL ? <><span className="text-red-500">*</span> {t('manufacturer_en')}</> : <>{t('manufacturer_en')} <span className="text-red-500">*</span></>}
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
                            <InputError message={errors.manufacturer_en} className={cn("mt-1", isRTL ? '!text-right' : '!text-left')} />
                        </div>

                        <div className={cn("space-y-2", isRTL ? '!text-right' : '!text-left')} dir={dir}>
                            <Label htmlFor="manufacturer_ar" className={cn(isRTL ? '!text-right' : '!text-left')}>
                                {t('manufacturer_ar')}
                            </Label>
                            <Input
                                id="manufacturer_ar"
                                type="text"
                                value={data.manufacturer_ar}
                                onChange={(e) => setData('manufacturer_ar', e.target.value)}
                                placeholder={t('enter_manufacturer_ar')}
                                dir={getFieldDir('text')}
                                className={cn(errors.manufacturer_ar ? 'border-red-500' : '', getInputTextAlign('text'))}
                            />
                            <InputError message={errors.manufacturer_ar} className={cn("mt-1", isRTL ? '!text-right' : '!text-left')} />
                        </div>
                    </div>

                    <div className={cn("space-y-2", isRTL ? '!text-right' : '!text-left')} dir={dir}>
                        <Label htmlFor="serial_number" className={cn(isRTL ? '!text-right' : '!text-left')}>
                            {t('serial_number')}
                        </Label>
                        <Input
                            id="serial_number"
                            type="text"
                            value={data.serial_number}
                            onChange={(e) => setData('serial_number', e.target.value)}
                            placeholder={t('enter_serial_number')}
                            dir={getFieldDir('text')}
                            className={cn("font-mono", errors.serial_number ? 'border-red-500' : '', getInputTextAlign('text'))}
                        />
                        <InputError message={errors.serial_number} className={cn("mt-1", isRTL ? '!text-right' : '!text-left')} />
                    </div>

                    <div className={cn("space-y-2", isRTL ? '!text-right' : '!text-left')} dir={dir}>
                        <Label htmlFor="image" className={cn(isRTL ? '!text-right' : '!text-left')}>
                            {t('image')}
                        </Label>
                        <Input
                            id="image"
                            type="file"
                            accept="image/*"
                            onChange={(e) => setData('image', e.target.files?.[0] || null)}
                            className={errors.image ? 'border-red-500' : ''}
                            dir={dir}
                        />
                        <InputError message={errors.image} className={cn("mt-1", isRTL ? '!text-right' : '!text-left')} />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className={cn("space-y-2", isRTL ? '!text-right' : '!text-left')} dir={dir}>
                            <Label htmlFor="description_en" className={cn(isRTL ? '!text-right' : '!text-left')}>
                                {t('description_en')}
                            </Label>
                            <Textarea
                                id="description_en"
                                value={data.description_en}
                                onChange={(e) => setData('description_en', e.target.value)}
                                placeholder={t('enter_description_en')}
                                dir={getFieldDir('textarea')}
                                className={cn(errors.description_en ? 'border-red-500' : '', getInputTextAlign('textarea'))}
                                rows={4}
                            />
                            <InputError message={errors.description_en} className={cn("mt-1", isRTL ? '!text-right' : '!text-left')} />
                        </div>

                        <div className={cn("space-y-2", isRTL ? '!text-right' : '!text-left')} dir={dir}>
                            <Label htmlFor="description_ar" className={cn(isRTL ? '!text-right' : '!text-left')}>
                                {t('description_ar')}
                            </Label>
                            <Textarea
                                id="description_ar"
                                value={data.description_ar}
                                onChange={(e) => setData('description_ar', e.target.value)}
                                placeholder={t('enter_description_ar')}
                                dir={getFieldDir('textarea')}
                                className={cn(errors.description_ar ? 'border-red-500' : '', getInputTextAlign('textarea'))}
                                rows={4}
                            />
                            <InputError message={errors.description_ar} className={cn("mt-1", isRTL ? '!text-right' : '!text-left')} />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {!shouldHideStatus && (
                        <div className={cn("space-y-2", isRTL ? '!text-right' : '!text-left')} dir={dir}>
                            <Label htmlFor="status" className={cn(isRTL ? '!text-right' : '!text-left')}>
                                {isRTL ? <><span className="text-red-500">*</span> {t('status')}</> : <>{t('status')} <span className="text-red-500">*</span></>}
                            </Label>
                            <Select value={data.status} onValueChange={(value) => setData('status', value as 'ready' | 'maintenance' | 'busy')}>
                                <SelectTrigger className={cn(errors.status ? 'border-red-500' : '', isRTL ? '!text-right' : '!text-left')} dir={dir}>
                                    <SelectValue placeholder={t('select_status') || t('select')} />
                                </SelectTrigger>
                                <SelectContent dir={dir}>
                                    <SelectItem value="ready" className={cn(isRTL ? '!text-right' : '!text-left')}>{t('ready')}</SelectItem>
                                    <SelectItem value="maintenance" className={cn(isRTL ? '!text-right' : '!text-left')}>{t('maintenance')}</SelectItem>
                                    <SelectItem value="busy" className={cn(isRTL ? '!text-right' : '!text-left')}>{t('busy')}</SelectItem>
                                </SelectContent>
                            </Select>
                            <InputError message={errors.status} className={cn("mt-1", isRTL ? '!text-right' : '!text-left')} />
                        </div>
                        )}

                        {!shouldHideStatus && (
                            <div className={cn("space-y-2", isRTL ? '!text-right' : '!text-left')} dir={dir}>
                                <Label htmlFor="request_status" className={cn(isRTL ? '!text-right' : '!text-left')}>
                                    {t('request_status')}
                                </Label>
                                <Select value={data.request_status} onValueChange={(value) => setData('request_status', value as 'pending' | 'approved' | 'rejected')}>
                                    <SelectTrigger className={cn(errors.request_status ? 'border-red-500' : '', isRTL ? '!text-right' : '!text-left')} dir={dir}>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent dir={dir}>
                                        <SelectItem value="pending" className={cn(isRTL ? '!text-right' : '!text-left')}>{t('pending')}</SelectItem>
                                        <SelectItem value="approved" className={cn(isRTL ? '!text-right' : '!text-left')}>{t('approved')}</SelectItem>
                                        <SelectItem value="rejected" className={cn(isRTL ? '!text-right' : '!text-left')}>{t('rejected')}</SelectItem>
                                    </SelectContent>
                                </Select>
                                <InputError message={errors.request_status} className={cn("mt-1", isRTL ? '!text-right' : '!text-left')} />
                            </div>
                        )}
                    </div>

                    <div className={cn("flex items-center gap-3 pt-4 border-t", flexDirection, isRTL ? 'justify-start' : 'justify-end')} dir={dir}>
                        <Button type="submit" disabled={processing}>
                            {processing ? t('creating') : t('create_machine')}
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
