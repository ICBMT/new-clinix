import { type BreadcrumbItem } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { SearchableMultiSelect, type SearchableMultiSelectOption } from '@/components/ui/searchable-multi-select';
import InputError from '@/components/input-error';
import { useRTLInit } from '@/hooks/use-rtl-init';
import { useTranslation } from '@/hooks/use-translation';
import { useRTL } from '@/hooks/use-rtl';
import AppLayout from '@/layouts/app-layout';
import { index as dashboard } from '@/routes/dashboard';
import { Head, Link, useForm, usePage, router } from '@inertiajs/react';
import { ArrowLeft, Eye } from 'lucide-react';
import { FormEventHandler, useMemo, useState, useEffect } from 'react';
import { customToast } from '@/components/ui/custom-toast';
import { cn } from '@/lib/utils';
import { type SharedData } from '@/types';

interface Category {
    id: number;
    name_en: string;
    name_ar: string;
}

interface Clinic {
    id: number;
    name: string;
}

interface Machine {
    id: number;
    name: string;
    manufacturer?: string;
    clinic_id?: number | null;
    is_global?: boolean;
}

interface Treatment {
    id: number;
    name_en: string;
    name_ar: string;
    description_en?: string | null;
    description_ar?: string | null;
    clinic_id?: number;
    category_id?: number;
    base_price: string;
    final_price?: string;
    discount_type?: string;
    discount_value?: string;
    has_discount?: boolean;
    status: string;
    is_featured: boolean;
    machines?: Array<{ id: number }>;
}

interface EditTreatmentProps {
    treatment: Treatment;
    categories: Category[];
    clinics: Clinic[];
    availableMachines?: Machine[];
    isClinicRole?: boolean;
}

export default function EditTreatment({ treatment, categories, clinics, availableMachines = [] }: EditTreatmentProps) {
    useRTLInit();
    const { t } = useTranslation();
    const page = usePage<SharedData>();
    const { locale: pageLocale } = page.props;
    const isRTL = pageLocale === 'ar';
    const dir = isRTL ? 'rtl' : 'ltr';
    const { flexDirection, iconMargin, getFieldDir, getInputTextAlign } = useRTL();
    const { flash } = page.props as { flash?: { success?: string; error?: string } };
    const auth = (page.props as { auth?: { user?: { roles?: string[] } } }).auth;
    const userRoles = auth?.user?.roles || [];
    const shouldHideStatus = userRoles.includes('clinic') || userRoles.includes('clinic_manager');
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    
    // Load existing treatment image if available
    useEffect(() => {
        interface TreatmentWithMedia extends Treatment {
            media?: Array<{ id: number; file_name?: string; url?: string }>;
        }
        const treatmentWithMedia = treatment as TreatmentWithMedia;
        if (treatmentWithMedia?.media && Array.isArray(treatmentWithMedia.media) && treatmentWithMedia.media.length > 0) {
            const imageUrl = treatmentWithMedia.media[0]?.file_name || treatmentWithMedia.media[0]?.url;
            if (imageUrl) {
                setImagePreview(imageUrl);
            }
        }
    }, [treatment]);

    // Flash messages
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
            title: t('treatments_management'),
            href: '/dashboard/treatments',
        },
        {
            title: t('edit_treatment'),
            href: '#',
        },
    ];

    const [selectedClinicId, setSelectedClinicId] = useState<string>(treatment.clinic_id?.toString() || '');

    const { data, setData, processing, errors } = useForm({
        name_en: treatment?.name_en || '',
        name_ar: treatment?.name_ar || '',
        description_en: treatment?.description_en || '',
        description_ar: treatment?.description_ar || '',
        clinic_id: treatment?.clinic_id?.toString() || '',
        category_id: treatment?.category_id?.toString() || '',
        machine_ids: treatment?.machines?.map((m) => m.id) || [],
        base_price: treatment?.base_price?.toString() || '',
        final_price: treatment?.final_price?.toString() || treatment?.base_price?.toString() || '',
        discount_type: treatment?.discount_type || 'percentage',
        discount_value: treatment?.discount_value?.toString() || '',
        has_discount: treatment?.has_discount || false,
        service_duration_minutes: treatment?.service_duration_minutes?.toString() || '',
        sessions_required: treatment?.sessions_required?.toString() || '1',
        currency: treatment?.currency || 'KWD',
        status: treatment?.status || 'pending',
        is_featured: treatment?.is_featured || false,
        image: null as File | null,
    });

    // Update selected clinic when form data changes
    useEffect(() => {
        setSelectedClinicId(data.clinic_id);
    }, [data.clinic_id]);

    // Filter machines based on selected clinic
    // Always show global machines + machines from selected clinic (if any)
    const filteredMachines = useMemo(() => {
        if (!selectedClinicId) {
            // If no clinic selected, show all available machines (already filtered by backend for clinic roles)
            // This includes global machines + machines from user's accessible clinics
            return availableMachines;
        }
        // When clinic is selected: show global machines + machines from selected clinic
        return availableMachines.filter(
            (machine) => {
                // Always include global machines
                const isGlobal = machine.is_global || machine.clinic_id === null;
                // Include machines from selected clinic
                const isFromSelectedClinic = machine.clinic_id?.toString() === selectedClinicId;
                return isGlobal || isFromSelectedClinic;
            }
        );
    }, [availableMachines, selectedClinicId]);

    // Convert machines to SearchableMultiSelect options
    const machineOptions: SearchableMultiSelectOption[] = useMemo(() => {
        return filteredMachines.map((machine) => ({
            value: machine.id.toString(),
            label: `${machine.name}${machine.manufacturer ? ` (${machine.manufacturer})` : ''}${machine.is_global ? ' [Global]' : ''}`,
        }));
    }, [filteredMachines]);

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0] || null;
        if (file) {
            setData('image', file);
            const reader = new FileReader();
            reader.onloadend = () => {
                setImagePreview(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        
        // Validate final_price <= base_price before submission
        const basePrice = parseFloat(data.base_price) || 0;
        const finalPrice = parseFloat(data.final_price) || 0;
        
        if (finalPrice > basePrice) {
            customToast.error(t('discounted_price_cannot_exceed_base_price'));
            return;
        }
        
        // Create FormData manually to ensure all fields are sent correctly
        const formData = new FormData();
        
        // Required fields - always append, even if empty
        formData.append('name_en', String(data.name_en || ''));
        formData.append('name_ar', String(data.name_ar || ''));
        formData.append('clinic_id', String(data.clinic_id || ''));
        formData.append('category_id', String(data.category_id || ''));
        // Machine IDs - append each as machine_ids[]
        if (data.machine_ids && Array.isArray(data.machine_ids) && data.machine_ids.length > 0) {
            data.machine_ids.forEach((machineId) => {
                formData.append('machine_ids[]', String(machineId));
            });
        }
        formData.append('base_price', String(data.base_price || ''));
        formData.append('final_price', String(data.final_price || data.base_price || ''));
        formData.append('service_duration_minutes', String(data.service_duration_minutes || ''));
        formData.append('sessions_required', String(data.sessions_required || '1'));
        formData.append('status', String(data.status || 'pending'));
        formData.append('currency', String(data.currency || 'KWD'));
        
        // Optional fields - convert empty strings to null
        if (data.description_en && data.description_en.trim()) {
            formData.append('description_en', data.description_en.trim());
        }
        if (data.description_ar && data.description_ar.trim()) {
            formData.append('description_ar', data.description_ar.trim());
        }
        
        // Discount fields
        formData.append('has_discount', data.has_discount ? '1' : '0');
        if (data.has_discount) {
            if (data.discount_type) {
                formData.append('discount_type', data.discount_type);
            }
            if (data.discount_value) {
                formData.append('discount_value', data.discount_value);
            }
        }
        
        // Boolean fields
        formData.append('is_featured', data.is_featured ? '1' : '0');
        
        // Image file if provided
        if (data.image instanceof File) {
            formData.append('image', data.image);
        }
        
        formData.append('_method', 'PUT');
        
        // Use router.post with FormData (PUT via _method)
        router.post(`/dashboard/treatments/${treatment.id}`, formData, {
            forceFormData: true,
            preserveState: true,
            preserveScroll: true,
            onSuccess: () => {
                // Flash message will be shown via useEffect
            },
            onError: (errors) => {
                if (errors && Object.keys(errors).length > 0) {
                    Object.values(errors).forEach((error) => {
                        if (typeof error === 'string') {
                            customToast.error(error);
                        } else if (Array.isArray(error)) {
                            error.forEach((err: string) => customToast.error(err));
                        }
                    });
                }
            },
        });
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={t('edit_treatment')} />
            
            <div className={cn("flex h-full flex-1 flex-col gap-6 overflow-x-auto rounded-xl bg-card dark:bg-card p-6 border border-border", isRTL ? '!text-right' : '!text-left')} dir={dir}>
                {/* Header */}
                <div className={cn("flex items-center justify-between border-b pb-4", flexDirection)}>
                    <div className={isRTL ? '!text-right' : '!text-left'}>
                        <h1 className={cn("text-3xl font-bold text-foreground", isRTL ? '!text-right' : '!text-left')}>{t('edit_treatment')}</h1>
                        <p className={cn("text-muted-foreground mt-1", isRTL ? '!text-right' : '!text-left')}>{t('update_treatment_information')}</p>
                    </div>
                    <div className={cn("flex items-center gap-3", flexDirection)}>
                        <Link href={`/dashboard/treatments/${treatment.id}`}>
                            <Button variant="outline" className={cn("flex items-center gap-2", flexDirection)}>
                                <Eye className={cn("h-4 w-4", iconMargin('md'))} />
                                {t('view')}
                            </Button>
                        </Link>
                        <Link href="/dashboard/treatments">
                            <Button variant="outline" className={cn("flex items-center gap-2", flexDirection)}>
                                <ArrowLeft className={cn("h-4 w-4", isRTL && 'rotate-180')} />
                                {t('back')}
                            </Button>
                        </Link>
                    </div>
                </div>

                <form onSubmit={submit} className={cn("space-y-6", isRTL ? '!text-right' : '!text-left')} dir={dir}>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className={cn("space-y-2", isRTL ? '!text-right' : '!text-left')}>
                        <Label htmlFor="name_en" className={isRTL ? '!text-right' : '!text-left'}>{t('name_en')}</Label>
                            <Input
                                id="name_en"
                                value={data.name_en}
                                onChange={(e) => setData('name_en', e.target.value)}
                                dir={getFieldDir('text')}
                                className={cn(errors.name_en ? 'border-red-500' : '', getInputTextAlign('text'))}
                            />
                            {errors.name_en && <p className={cn("text-sm text-red-500", isRTL ? '!text-right' : '!text-left')} dir={dir}>{errors.name_en}</p>}
                        </div>

                        <div className={cn("space-y-2", isRTL ? '!text-right' : '!text-left')}>
                        <Label htmlFor="name_ar" className={isRTL ? '!text-right' : '!text-left'}>{t('name_ar')}</Label>
                            <Input
                                id="name_ar"
                                value={data.name_ar}
                                onChange={(e) => setData('name_ar', e.target.value)}
                                dir={getFieldDir('text')}
                                className={cn(errors.name_ar ? 'border-red-500' : '', getInputTextAlign('text'))}
                            />
                            {errors.name_ar && <p className={cn("text-sm text-red-500", isRTL ? '!text-right' : '!text-left')} dir={dir}>{errors.name_ar}</p>}
                        </div>

                        <div className={cn("space-y-2", isRTL ? '!text-right' : '!text-left')}>
                        <Label htmlFor="clinic_id" className={isRTL ? '!text-right' : '!text-left'}>{t('clinic')} <span className="text-red-500">*</span></Label>
                            <Select value={data.clinic_id} onValueChange={(value) => {
                                setData('clinic_id', value);
                                setSelectedClinicId(value);
                            }}>
                                <SelectTrigger className={cn(errors.clinic_id ? 'border-red-500' : '', isRTL ? '!text-right' : '!text-left')} dir={dir}>
                                    <SelectValue placeholder={t('select_clinic')} />
                                </SelectTrigger>
                                <SelectContent dir={dir}>
                                    {clinics.map((clinic) => (
                                        <SelectItem key={clinic.id} value={clinic.id.toString()}>
                                            {clinic.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            {errors.clinic_id && <p className={cn("text-sm text-red-500", isRTL ? '!text-right' : '!text-left')} dir={dir}>{errors.clinic_id}</p>}
                        </div>

                        <div className={cn("space-y-2", isRTL ? '!text-right' : '!text-left')}>
                            <Label htmlFor="machine_ids" className={isRTL ? '!text-right' : '!text-left'}>{t('machines')} ({t('optional') ?? 'Optional'})</Label>
                            <SearchableMultiSelect
                                options={machineOptions}
                                value={data.machine_ids?.map((id) => id.toString()) || []}
                                onChange={(values) => {
                                    setData('machine_ids', values.map((v) => parseInt(v)));
                                }}
                                placeholder={t('select_machines') || t('select')}
                                searchPlaceholder={t('search_machines') || t('search')}
                                emptyMessage={t('no_machines_found') || t('no_results')}
                                className={cn(errors.machine_ids ? 'border-red-500' : '', isRTL ? '!text-right' : '!text-left')}
                            />
                            {!selectedClinicId && (
                                <p className={cn("text-xs text-muted-foreground mt-1", isRTL ? '!text-right' : '!text-left')} dir={dir}>
                                    {t('select_clinic_to_see_machines') || 'Global machines are shown. Select a clinic to see clinic-specific machines.'}
                                </p>
                            )}
                            {selectedClinicId && (
                                <p className={cn("text-xs text-muted-foreground mt-1", isRTL ? '!text-right' : '!text-left')} dir={dir}>
                                    {t('showing_global_and_clinic_machines') || 'Showing global machines and machines from selected clinic.'}
                                </p>
                            )}
                            {errors.machine_ids && <p className={cn("text-sm text-red-500", isRTL ? '!text-right' : '!text-left')} dir={dir}>{errors.machine_ids}</p>}
                        </div>

                        <div className={cn("space-y-2", isRTL ? '!text-right' : '!text-left')}>
                        <Label htmlFor="category_id" className={isRTL ? '!text-right' : '!text-left'}>{t('category')}</Label>
                            <Select value={data.category_id} onValueChange={(value) => setData('category_id', value)}>
                                <SelectTrigger className={cn(errors.category_id ? 'border-red-500' : '', isRTL ? '!text-right' : '!text-left')} dir={dir}>
                                    <SelectValue placeholder={t('select_category')} />
                                </SelectTrigger>
                                <SelectContent dir={dir}>
                                    {categories.map((category) => (
                                        <SelectItem key={category.id} value={category.id.toString()}>
                                            {category.name_en} / {category.name_ar}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            {errors.category_id && <p className={cn("text-sm text-red-500", isRTL ? '!text-right' : '!text-left')} dir={dir}>{errors.category_id}</p>}
                        </div>

                        <div className={cn("space-y-2", isRTL ? '!text-right' : '!text-left')}>
                        <Label htmlFor="base_price" className={isRTL ? '!text-right' : '!text-left'}>{t('base_price')} <span className="text-red-500">*</span></Label>
                            <Input
                                id="base_price"
                                type="number"
                                step="0.01"
                                min="0"
                                max="2000000"
                                value={data.base_price}
                                onChange={(e) => {
                                    setData('base_price', e.target.value);
                                    // Recalculate final price if discount is applied
                                    if (data.has_discount && data.discount_type && data.discount_value) {
                                        const base = parseFloat(e.target.value) || 0;
                                        const discount = parseFloat(data.discount_value) || 0;
                                        if (data.discount_type === 'percentage') {
                                            setData('final_price', (base * (1 - discount / 100)).toFixed(2));
                                        } else {
                                            setData('final_price', Math.max(0, base - discount).toFixed(2));
                                        }
                                    } else if (!data.has_discount) {
                                        setData('final_price', e.target.value);
                                    }
                                }}
                                dir={getFieldDir('number')}
                                className={cn(errors.base_price ? 'border-red-500' : '', getInputTextAlign('number'))}
                                required
                            />
                            {errors.base_price && <p className={cn("text-sm text-red-500", isRTL ? '!text-right' : '!text-left')} dir={dir}>{errors.base_price}</p>}
                        </div>

                        <div className={cn("space-y-2", isRTL ? '!text-right' : '!text-left')}>
                            <div className={cn("flex items-center gap-2", flexDirection)}>
                                <Switch
                                    id="has_discount"
                                    checked={data.has_discount}
                                    onCheckedChange={(checked) => {
                                        setData('has_discount', checked);
                                        const base = parseFloat(data.base_price) || 0;
                                        if (!checked) {
                                            setData('final_price', base.toString());
                                            setData('discount_type', 'percentage');
                                            setData('discount_value', '');
                                        } else {
                                            // Recalculate if discount fields are already set
                                            if (data.discount_type && data.discount_value) {
                                                const discount = parseFloat(data.discount_value) || 0;
                                                if (data.discount_type === 'percentage') {
                                                    setData('final_price', (base * (1 - discount / 100)).toFixed(2));
                                                } else {
                                                    setData('final_price', Math.max(0, base - discount).toFixed(2));
                                                }
                                            } else {
                                                setData('final_price', base.toString());
                                            }
                                        }
                                    }}
                                />
                                <Label htmlFor="has_discount" className={cn("cursor-pointer", isRTL ? '!text-right' : '!text-left')} dir={dir}>{t('has_discount')}</Label>
                            </div>
                        </div>

                        {data.has_discount && (
                            <>
                                <div className={cn("space-y-2", isRTL ? '!text-right' : '!text-left')}>
                        <Label htmlFor="discount_type" className={isRTL ? '!text-right' : '!text-left'}>{t('discount_type')} <span className="text-red-500">*</span></Label>
                                    <Select
                                        value={data.discount_type}
                                        onValueChange={(value) => {
                                            setData('discount_type', value);
                                            // Recalculate final price
                                            const base = parseFloat(data.base_price) || 0;
                                            const discount = parseFloat(data.discount_value) || 0;
                                            if (value === 'percentage') {
                                                setData('final_price', (base * (1 - discount / 100)).toFixed(2));
                                            } else {
                                                setData('final_price', Math.max(0, base - discount).toFixed(2));
                                            }
                                        }}
                                    >
                                        <SelectTrigger className={cn(errors.discount_type ? 'border-red-500' : '', isRTL ? '!text-right' : '!text-left')} dir={dir}>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent dir={dir}>
                                            <SelectItem value="percentage">{t('percentage')}</SelectItem>
                                            <SelectItem value="fixed">{t('fixed')}</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    {errors.discount_type && <p className={cn("text-sm text-red-500", isRTL ? '!text-right' : '!text-left')} dir={dir}>{errors.discount_type}</p>}
                                </div>

                                <div className={cn("space-y-2", isRTL ? '!text-right' : '!text-left')}>
                        <Label htmlFor="discount_value" className={isRTL ? '!text-right' : '!text-left'}>{t('discount_value')} <span className="text-red-500">*</span></Label>
                                    <Input
                                        id="discount_value"
                                        type="number"
                                        step="0.01"
                                        value={data.discount_value}
                                        onChange={(e) => {
                                            setData('discount_value', e.target.value);
                                            // Recalculate final price
                                            const base = parseFloat(data.base_price) || 0;
                                            const discount = parseFloat(e.target.value) || 0;
                                            if (data.discount_type === 'percentage') {
                                                setData('final_price', (base * (1 - discount / 100)).toFixed(2));
                                            } else {
                                                setData('final_price', Math.max(0, base - discount).toFixed(2));
                                            }
                                        }}
                                        dir={getFieldDir('number')}
                                        className={cn(errors.discount_value ? 'border-red-500' : '', getInputTextAlign('number'))}
                                    />
                                    {errors.discount_value && <p className={cn("text-sm text-red-500", isRTL ? '!text-right' : '!text-left')} dir={dir}>{errors.discount_value}</p>}
                                </div>
                            </>
                        )}

                        <div className={cn("space-y-2", isRTL ? '!text-right' : '!text-left')}>
                        <Label htmlFor="final_price" className={isRTL ? '!text-right' : '!text-left'}>{t('final_price')}</Label>
                            <Input
                                id="final_price"
                                type="number"
                                step="0.01"
                                value={data.final_price}
                                readOnly
                                disabled
                                dir={getFieldDir('number')}
                                className={cn(errors.final_price ? 'border-red-500' : '', getInputTextAlign('number'), "bg-muted cursor-not-allowed")}
                            />
                            <p className={cn("text-xs text-muted-foreground", isRTL ? '!text-right' : '!text-left')} dir={dir}>
                                {t('auto_calculated')}
                            </p>
                            {errors.final_price && <p className={cn("text-sm text-red-500", isRTL ? '!text-right' : '!text-left')} dir={dir}>{errors.final_price}</p>}
                        </div>

                        <div className={cn("space-y-2", isRTL ? '!text-right' : '!text-left')}>
                        <Label htmlFor="service_duration_minutes" className={isRTL ? '!text-right' : '!text-left'}>{t('treatment_duration') || t('service_duration_minutes')} <span className="text-red-500">*</span></Label>
                            <Input
                                id="service_duration_minutes"
                                type="number"
                                min="1"
                                value={data.service_duration_minutes}
                                onChange={(e) => setData('service_duration_minutes', e.target.value)}
                                dir={getFieldDir('number')}
                                className={cn(errors.service_duration_minutes ? 'border-red-500' : '', getInputTextAlign('number'))}
                                placeholder="60"
                                required
                            />
                            {errors.service_duration_minutes && <p className={cn("text-sm text-red-500", isRTL ? '!text-right' : '!text-left')} dir={dir}>{errors.service_duration_minutes}</p>}
                        </div>

                        <div className={cn("space-y-2", isRTL ? '!text-right' : '!text-left')}>
                        <Label htmlFor="sessions_required" className={isRTL ? '!text-right' : '!text-left'}>{t('sessions_required')} <span className="text-red-500">*</span></Label>
                            <Input
                                id="sessions_required"
                                type="number"
                                min="1"
                                value={data.sessions_required}
                                onChange={(e) => setData('sessions_required', e.target.value)}
                                dir={getFieldDir('number')}
                                className={cn(errors.sessions_required ? 'border-red-500' : '', getInputTextAlign('number'))}
                                required
                            />
                            {errors.sessions_required && <p className={cn("text-sm text-red-500", isRTL ? '!text-right' : '!text-left')} dir={dir}>{errors.sessions_required}</p>}
                        </div>

                        <div className={cn("space-y-2", isRTL ? '!text-right' : '!text-left')}>
                        <Label htmlFor="currency" className={isRTL ? '!text-right' : '!text-left'}>{t('currency')}</Label>
                            <Input
                                id="currency"
                                value={data.currency}
                                readOnly
                                disabled
                                dir={getFieldDir('text')}
                                className={cn("bg-muted cursor-not-allowed", isRTL ? '!text-right' : '!text-left')}
                            />
                            {errors.currency && <p className={cn("text-sm text-red-500", isRTL ? '!text-right' : '!text-left')} dir={dir}>{errors.currency}</p>}
                        </div>

                        {!shouldHideStatus && (
                        <div className={cn("space-y-2", isRTL ? '!text-right' : '!text-left')}>
                            <Label htmlFor="status" className={isRTL ? '!text-right' : '!text-left'}>{t('status')}</Label>
                            <Select value={data.status} onValueChange={(value) => setData('status', value as 'pending' | 'approved' | 'rejected')}>
                                <SelectTrigger className={cn(errors.status ? 'border-red-500' : '', isRTL ? '!text-right' : '!text-left')} dir={dir}>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent dir={dir}>
                                    <SelectItem value="approved">{t('approved')}</SelectItem>
                                    <SelectItem value="rejected">{t('rejected')}</SelectItem>
                                    <SelectItem value="pending">{t('pending')}</SelectItem>
                                </SelectContent>
                            </Select>
                            {errors.status && <p className={cn("text-sm text-red-500", isRTL ? '!text-right' : '!text-left')} dir={dir}>{errors.status}</p>}
                        </div>
                        )}
                    </div>

                    <div className={cn("space-y-2", isRTL ? '!text-right' : '!text-left')}>
                        <Label htmlFor="description_en" className={isRTL ? '!text-right' : '!text-left'}>{t('description_en')} ({t('optional')})</Label>
                        <Textarea
                            id="description_en"
                            value={data.description_en || ''}
                            onChange={(e) => setData('description_en', e.target.value)}
                            rows={4}
                            dir={getFieldDir('textarea')}
                            className={cn(errors.description_en ? 'border-red-500' : '', getInputTextAlign('textarea'))}
                        />
                        {errors.description_en && <p className={cn("text-sm text-red-500", isRTL ? '!text-right' : '!text-left')} dir={dir}>{errors.description_en}</p>}
                    </div>

                    <div className={cn("space-y-2", isRTL ? '!text-right' : '!text-left')}>
                        <Label htmlFor="description_ar" className={isRTL ? '!text-right' : '!text-left'}>{t('description_ar')} ({t('optional')})</Label>
                        <Textarea
                            id="description_ar"
                            value={data.description_ar || ''}
                            onChange={(e) => setData('description_ar', e.target.value)}
                            rows={4}
                            dir={getFieldDir('textarea')}
                            className={cn(errors.description_ar ? 'border-red-500' : '', getInputTextAlign('textarea'))}
                        />
                        {errors.description_ar && <p className={cn("text-sm text-red-500", isRTL ? '!text-right' : '!text-left')} dir={dir}>{errors.description_ar}</p>}
                    </div>

                    <div className={cn("space-y-2", isRTL ? '!text-right' : '!text-left')}>
                        <Label htmlFor="image" className={isRTL ? '!text-right' : '!text-left'}>{t('image')}</Label>
                        {imagePreview && (
                            <div className={cn("mb-2", isRTL ? '!text-right' : '!text-left')}>
                                <img 
                                    src={imagePreview} 
                                    alt={treatment.name_en || treatment.name_ar || t('treatment_image')}
                                    className="w-32 h-32 rounded-lg object-cover"
                                />
                                <p className={cn("text-sm text-muted-foreground mt-1", isRTL ? '!text-right' : '!text-left')} dir={dir}>{t('current_image')}</p>
                            </div>
                        )}
                        <Input
                            id="image"
                            type="file"
                            accept="image/*"
                            onChange={handleImageChange}
                            className={errors.image ? 'border-red-500' : ''}
                        />
                        <InputError message={errors.image} className={cn("mt-1", isRTL ? '!text-right' : '!text-left')} />
                    </div>


                    <div className={cn("flex items-center gap-4", flexDirection)}>
                        <Button type="submit" disabled={processing}>
                            {processing ? t('updating') : t('update')}
                        </Button>
                        <Link href="/dashboard/treatments">
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
