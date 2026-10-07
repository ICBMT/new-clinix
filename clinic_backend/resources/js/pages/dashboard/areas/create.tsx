import { type BreadcrumbItem } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { useTranslation } from '@/hooks/use-translation';
import { useRTLInit } from '@/hooks/use-rtl-init';
import { useRTL } from '@/hooks/use-rtl';
import AppLayout from '@/layouts/app-layout';
import { index as dashboard } from '@/routes/dashboard';
import { Head, Link, useForm, usePage } from '@inertiajs/react';
import { ArrowLeft } from 'lucide-react';
import { FormEventHandler, useState, useEffect } from 'react';
import { customToast } from '@/components/ui/custom-toast';
import { cn } from '@/lib/utils';

interface Governorate {
    id: number;
    name_en: string;
    name_ar: string;
}

interface CreateAreaProps {
    governorates?: Governorate[] | null;
}

export default function CreateArea({ governorates }: CreateAreaProps) {
    useRTLInit();
    const { t } = useTranslation();
    const { isRTL, dir, textAlign, flexDirection, getFieldDir, getInputTextAlign } = useRTL();
    const { flash } = usePage().props as { flash?: { success?: string; error?: string } };

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
            title: t('areas_management'),
        href: '/dashboard/areas',
    },
    {
            title: t('create_area'),
        href: '/dashboard/areas/create',
    },
];
    const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

    const { data, setData, post, processing, errors } = useForm({
        governorate_id: '',
        name_en: '',
        name_ar: '',
        is_active: true,
    });

    const isArabicText = (text: string): boolean => {
        if (!text.trim()) return false;
        const arabicPattern = /^[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF\s\u0660-\u0669\u06F0-\u06F9.,;:!?\-_()[\]{}""''«»/]+$/u;
        return arabicPattern.test(text);
    };

    const isEnglishText = (text: string): boolean => {
        if (!text.trim()) return false;
        const englishPattern = /^[a-zA-Z0-9\s\-_.,;:!?@#$%^&*()[\]{}""''/]+$/;
        return englishPattern.test(text);
    };

    const validateNameEn = (value: string) => {
        if (value && !isEnglishText(value)) {
            setValidationErrors(prev => ({ ...prev, name_en: t('name_en_english_only') }));
        } else {
            setValidationErrors(prev => {
                const newErrors = { ...prev };
                delete newErrors.name_en;
                return newErrors;
            });
        }
    };

    const validateNameAr = (value: string) => {
        if (value && !isArabicText(value)) {
            setValidationErrors(prev => ({ ...prev, name_ar: t('name_ar_arabic_only') }));
        } else {
            setValidationErrors(prev => {
                const newErrors = { ...prev };
                delete newErrors.name_ar;
                return newErrors;
            });
        }
    };

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        post('/dashboard/areas');
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={t('create_area')} />

            <div className={cn("flex h-full flex-1 flex-col gap-6 overflow-x-auto rounded-xl bg-card dark:bg-card p-6 border border-border", isRTL ? '!text-right' : '!text-left')} dir={dir}>
                {/* Header */}
                <div className={cn("flex items-center justify-between border-b pb-4", flexDirection)}>
                    <div className={cn(isRTL ? '!text-right' : '!text-left')} dir={dir}>
                        <h1 className={cn("text-3xl font-bold text-foreground", isRTL ? '!text-right' : '!text-left')} dir={dir}>{t('create_area')}</h1>
                        <p className={cn("text-muted-foreground mt-1", isRTL ? '!text-right' : '!text-left')} dir={dir}>{t('create_new_area')}</p>
                    </div>
                    
                    <Link href="/dashboard/areas">
                        <Button variant="outline" className={cn("flex items-center gap-2", flexDirection)}>
                            <ArrowLeft className={cn("h-4 w-4", isRTL && 'rotate-180')} />
                            {t('back')}
                        </Button>
                    </Link>
                </div>

                {/* Form */}
                <form onSubmit={submit} className={cn("space-y-6", isRTL ? '!text-right' : '!text-left')} dir={dir}>
                    <div className={cn("space-y-2", isRTL ? '!text-right' : '!text-left')} dir={dir}>
                        <Label htmlFor="governorate_id" className={cn(isRTL ? '!text-right' : '!text-left')} dir={dir}>
                            {isRTL ? <><span className="text-red-500">*</span> {t('governorate')}</> : <>{t('governorate')} <span className="text-red-500">*</span></>}
                        </Label>
                        <Select
                            value={data.governorate_id || undefined}
                            onValueChange={(value) => setData('governorate_id', value)}
                        >
                            <SelectTrigger className={cn(errors.governorate_id ? 'border-red-500' : '', isRTL ? '!text-right' : '!text-left')} dir={dir}>
                                <SelectValue 
                                    placeholder={t('select_governorate')}
                                />
                            </SelectTrigger>
                            <SelectContent>
                                {Array.isArray(governorates) && governorates.map((governorate) => (
                                    <SelectItem 
                                        key={governorate.id} 
                                        value={governorate.id.toString()}
                                    >
                                        {isRTL ? governorate.name_ar : governorate.name_en}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        {errors.governorate_id && (
                            <p className={cn("text-sm text-red-500", isRTL ? '!text-right' : '!text-left')} dir={dir}>{t(errors.governorate_id) || errors.governorate_id}</p>
                        )}
                    </div>

                    <div className={cn("space-y-2", isRTL ? '!text-right' : '!text-left')} dir={dir}>
                        <Label htmlFor="name_en" className={cn(isRTL ? '!text-right' : '!text-left')} dir={dir}>
                            {isRTL ? <><span className="text-red-500">*</span> {t('name_en')}</> : <>{t('name_en')} <span className="text-red-500">*</span></>}
                        </Label>
                        <Input
                            id="name_en"
                            type="text"
                            value={data.name_en}
                            onChange={(e) => {
                                setData('name_en', e.target.value);
                                validateNameEn(e.target.value);
                            }}
                            placeholder={t('enter_name_en')}
                            dir={getFieldDir('text')}
                            className={cn(errors.name_en || validationErrors.name_en ? 'border-red-500' : '', getInputTextAlign('text'))}
                            required
                        />
                        {(errors.name_en || validationErrors.name_en) && (
                            <p className={cn("text-sm text-red-500", isRTL ? '!text-right' : '!text-left')} dir={dir}>{errors.name_en || validationErrors.name_en}</p>
                        )}
                    </div>

                    <div className={cn("space-y-2", isRTL ? '!text-right' : '!text-left')} dir={dir}>
                        <Label htmlFor="name_ar" className={cn(isRTL ? '!text-right' : '!text-left')} dir={dir}>
                            {isRTL ? <><span className="text-red-500">*</span> {t('name_ar')}</> : <>{t('name_ar')} <span className="text-red-500">*</span></>}
                        </Label>
                        <Input
                            id="name_ar"
                            type="text"
                            value={data.name_ar}
                            onChange={(e) => {
                                setData('name_ar', e.target.value);
                                validateNameAr(e.target.value);
                            }}
                            placeholder={t('enter_name_ar')}
                            dir={getFieldDir('text')}
                            className={cn(errors.name_ar || validationErrors.name_ar ? 'border-red-500' : '', getInputTextAlign('text'))}
                            required
                        />
                        {(errors.name_ar || validationErrors.name_ar) && (
                            <p className={cn("text-sm text-red-500", isRTL ? '!text-right' : '!text-left')} dir={dir}>{errors.name_ar || validationErrors.name_ar}</p>
                        )}
                    </div>

                    <div className={cn("flex items-center justify-between gap-2 pt-4 border-t", flexDirection)}>
                        <Label htmlFor="is_active" className={cn("flex flex-col space-y-1", isRTL ? '!text-right' : '!text-left')} dir={dir}>
                            <span>{t('is_active')}</span>
                        </Label>
                        <Switch
                            id="is_active"
                            checked={data.is_active}
                            onCheckedChange={(checked) => setData('is_active', checked)}
                        />
                    </div>

                    <div className={cn("flex items-center gap-3 pt-4 border-t", flexDirection)}>
                        <Button type="submit" disabled={processing}>
                            {processing ? t('creating') : t('create_area')}
                        </Button>
                        <Link href="/dashboard/areas">
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

