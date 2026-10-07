import { type BreadcrumbItem } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useTranslation } from '@/hooks/use-translation';
import { useRTL } from '@/hooks/use-rtl';
import { useRTLInit } from '@/hooks/use-rtl-init';
import { cn } from '@/lib/utils';
import AppLayout from '@/layouts/app-layout';
import { index as dashboard } from '@/routes/dashboard';
import { Head, Link, useForm, usePage } from '@inertiajs/react';
import { ArrowLeft } from 'lucide-react';
import { FormEventHandler, useState } from 'react';
import { customToast } from '@/components/ui/custom-toast';
import { type SharedData } from '@/types';
import InputError from '@/components/input-error';

interface ParentCategory {
    id: number;
    name_en: string;
    name_ar: string;
}

interface CreateCategoryProps {
    parentCategories?: ParentCategory[] | null;
}

// Breadcrumbs will be set inside component to use translation

export default function CreateCategory({ parentCategories }: CreateCategoryProps) {
    useRTLInit();
    const { t, locale } = useTranslation();
    const page = usePage<SharedData>();
    const { locale: pageLocale } = page.props;
    const isRTL = pageLocale === 'ar';
    const dir = isRTL ? 'rtl' : 'ltr';
    const { flexDirection, getFieldDir, getInputTextAlign, iconMargin } = useRTL();
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    // Note: Flash messages are handled on the index page after redirect
    // We show success toast in onSuccess callback instead

    const breadcrumbs: BreadcrumbItem[] = [
        {
            title: t('dashboard'),
            href: dashboard.url(),
        },
        {
            title: t('categories_management'),
            href: '/dashboard/categories',
        },
        {
            title: t('create_category'),
            href: '/dashboard/categories/create',
        },
    ];

    const { data, setData, post, processing, errors } = useForm({
        name_en: '',
        name_ar: '',
        description_en: '',
        description_ar: '',
        parent_id: null as number | null,
        status: 'active',
        image: null as File | null,
    });

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        
        post('/dashboard/categories', {
            forceFormData: true,
            onSuccess: () => {
                // Success toast will be shown on index page via flash message
                // No need to show toast here to avoid duplicate notifications
                // Reset file previews on success
                setImageFile(null);
                setImagePreview(null);
            },
            onError: (errors) => {
                // Show validation errors
                if (errors.image) {
                    customToast.error(Array.isArray(errors.image) ? errors.image[0] : errors.image);
                }
                if (errors.message) {
                    customToast.error(errors.message);
                }
            },
        });
    };

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0] || null;
        setImageFile(file);
        setData('image', file);
        
        // Create preview URL
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setImagePreview(reader.result as string);
            };
            reader.readAsDataURL(file);
        } else {
            setImagePreview(null);
        }
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={t('create_category')} />

            <div className={cn("flex h-full flex-1 flex-col gap-6 overflow-x-auto rounded-xl bg-card dark:bg-card p-6 border border-border", isRTL ? '!text-right' : '!text-left')} dir={dir}>
                {/* Header */}
                <div className={cn("flex items-center justify-between border-b pb-4", flexDirection)}>
                    <div className={cn(isRTL ? '!text-right' : '!text-left')} dir={dir}>
                        <h1 className={cn("text-3xl font-bold text-foreground", isRTL ? '!text-right' : '!text-left')} dir={dir}>{t('create_category')}</h1>
                        <p className={cn("text-muted-foreground mt-1", isRTL ? '!text-right' : '!text-left')} dir={dir}>{t('create_new_category')}</p>
                    </div>
                    
                    <Link href="/dashboard/categories">
                        <Button variant="outline" className={cn("flex items-center gap-2", flexDirection)}>
                            <ArrowLeft className={cn("h-4 w-4", isRTL && 'rotate-180')} />
                            {t('back')}
                        </Button>
                    </Link>
                </div>

                <form onSubmit={submit} encType="multipart/form-data" className={cn("space-y-6", isRTL ? '!text-right' : '!text-left')} dir={dir}>
                    {/* Name (English) */}
                    <div className={cn("space-y-2", isRTL ? '!text-right' : '!text-left')} dir={dir}>
                        <Label htmlFor="name_en" className={cn(isRTL ? '!text-right' : '!text-left')} dir={dir}>
                            {isRTL ? <><span className="text-red-500">*</span> {t('name_en')}</> : <>{t('name_en')} <span className="text-red-500">*</span></>}
                        </Label>
                        <Input
                            id="name_en"
                            type="text"
                            dir={getFieldDir('text')}
                            value={data.name_en}
                            onChange={(e) => {
                                const value = e.target.value.slice(0, 50);
                                setData('name_en', value);
                            }}
                            placeholder={t('enter_name_en')}
                            className={cn(
                                errors.name_en ? 'border-red-500' : '',
                                getInputTextAlign('text'),
                                'dark:bg-slate-800 dark:text-slate-100 dark:border-slate-600'
                            )}
                            maxLength={50}
                            required
                        />
                        {errors.name_en && (
                            <InputError message={errors.name_en} className={cn(isRTL ? '!text-right' : '!text-left')} />
                        )}
                    </div>

                    {/* Name (Arabic) */}
                    <div className={cn("space-y-2", isRTL ? '!text-right' : '!text-left')} dir={dir}>
                        <Label htmlFor="name_ar" className={cn(isRTL ? '!text-right' : '!text-left')} dir={dir}>
                            {isRTL ? <><span className="text-red-500">*</span> {t('name_ar')}</> : <>{t('name_ar')} <span className="text-red-500">*</span></>}
                        </Label>
                        <Input
                            id="name_ar"
                            type="text"
                            dir="rtl"
                            value={data.name_ar}
                            onChange={(e) => {
                                const value = e.target.value.slice(0, 50);
                                setData('name_ar', value);
                            }}
                            placeholder={t('enter_name_ar')}
                            className={cn(
                                errors.name_ar ? 'border-red-500' : '',
                                'text-right',
                                'dark:bg-slate-800 dark:text-slate-100 dark:border-slate-600'
                            )}
                            maxLength={50}
                            required
                        />
                        {errors.name_ar && (
                            <InputError message={errors.name_ar} className={cn(isRTL ? '!text-right' : '!text-left')} />
                        )}
                    </div>

                    {/* Description (English) */}
                    <div className={cn("space-y-2", isRTL ? '!text-right' : '!text-left')} dir={dir}>
                        <Label htmlFor="description_en" className={cn(isRTL ? '!text-right' : '!text-left')} dir={dir}>{t('description_en')}</Label>
                        <Textarea
                            id="description_en"
                            dir={getFieldDir('textarea')}
                            value={data.description_en}
                            onChange={(e) => setData('description_en', e.target.value)}
                            placeholder={t('enter_description_en')}
                            rows={4}
                            className={cn(
                                errors.description_en ? 'border-red-500' : '',
                                getInputTextAlign('textarea'),
                                'dark:bg-slate-800 dark:text-slate-100 dark:border-slate-600'
                            )}
                        />
                        {errors.description_en && (
                            <InputError message={errors.description_en} className={cn(isRTL ? '!text-right' : '!text-left')} />
                        )}
                    </div>

                    {/* Description (Arabic) */}
                    <div className={cn("space-y-2", isRTL ? '!text-right' : '!text-left')} dir={dir}>
                        <Label htmlFor="description_ar" className={cn(isRTL ? '!text-right' : '!text-left')} dir={dir}>{t('description_ar')}</Label>
                        <Textarea
                            id="description_ar"
                            dir="rtl"
                            value={data.description_ar}
                            onChange={(e) => setData('description_ar', e.target.value)}
                            placeholder={t('enter_description_ar')}
                            rows={4}
                            className={cn(
                                errors.description_ar ? 'border-red-500' : '',
                                'text-right',
                                'dark:bg-slate-800 dark:text-slate-100 dark:border-slate-600'
                            )}
                        />
                        {errors.description_ar && (
                            <InputError message={errors.description_ar} className={cn(isRTL ? '!text-right' : '!text-left')} />
                        )}
                    </div>

                    {/* Parent Category */}
                    <div className={cn("space-y-2", isRTL ? '!text-right' : '!text-left')} dir={dir}>
                        <Label htmlFor="parent_id" className={cn(isRTL ? '!text-right' : '!text-left')} dir={dir}>{t('parent_category')}</Label>
                        <Select
                            value={data.parent_id !== null ? data.parent_id.toString() : undefined}
                            onValueChange={(value) => setData('parent_id', value ? Number(value) : null)}
                        >
                            <SelectTrigger className={cn(
                                errors.parent_id ? 'border-red-500' : '',
                                isRTL ? '!text-right' : '!text-left',
                                'dark:bg-slate-800 dark:text-slate-100 dark:border-slate-600'
                            )} dir={dir}>
                                <SelectValue placeholder={t('select_parent_category')} />
                            </SelectTrigger>
                            <SelectContent dir={dir}>
                                {Array.isArray(parentCategories) && parentCategories.length > 0 ? (
                                    parentCategories.map((category) => (
                                        <SelectItem key={category.id} value={category.id.toString()} className={cn(isRTL ? '!text-right' : '!text-left')} dir={dir}>
                                            {isRTL ? category.name_ar : category.name_en}
                                        </SelectItem>
                                    ))
                                ) : (
                                    <SelectItem value="no-parents" disabled className={cn(isRTL ? '!text-right' : '!text-left')} dir={dir}>
                                        {t('no_parent_categories_available')}
                                    </SelectItem>
                                )}
                            </SelectContent>
                        </Select>
                        {errors.parent_id && (
                            <InputError message={errors.parent_id} className={cn(isRTL ? '!text-right' : '!text-left')} />
                        )}
                    </div>

                    {/* Category Image Upload */}
                    <div className={cn("space-y-2", isRTL ? '!text-right' : '!text-left')} dir={dir}>
                        <Label htmlFor="image" className={cn(isRTL ? '!text-right' : '!text-left')} dir={dir}>{t('category_image')}</Label>
                        <Input
                            id="image"
                            type="file"
                            accept="image/*"
                            onChange={handleImageChange}
                            className={cn(
                                errors.image ? 'border-red-500' : '',
                                'dark:bg-slate-800 dark:text-slate-100 dark:border-slate-600'
                            )}
                            dir={dir}
                        />
                        {imagePreview && (
                            <div className={cn("mt-4 text-center", isRTL ? '!text-right' : '!text-left')} dir={dir}>
                                <img 
                                    src={imagePreview} 
                                    alt={t('category_preview')}
                                    className="max-h-48 mx-auto rounded border"
                                />
                            </div>
                        )}
                        {errors.image && (
                            <InputError message={errors.image} className={cn(isRTL ? '!text-right' : '!text-left')} />
                        )}
                    </div>

                    {/* Status */}
                    <div className={cn("space-y-2", isRTL ? '!text-right' : '!text-left')} dir={dir}>
                        <Label htmlFor="status" className={cn(isRTL ? '!text-right' : '!text-left')} dir={dir}>
                            {isRTL ? <><span className="text-red-500">*</span> {t('status')}</> : <>{t('status')} <span className="text-red-500">*</span></>}
                        </Label>
                        <Select
                            value={data.status || undefined}
                            onValueChange={(value) => setData('status', value as 'active' | 'inactive')}
                        >
                            <SelectTrigger className={cn(
                                errors.status ? 'border-red-500' : '',
                                isRTL ? '!text-right' : '!text-left',
                                'dark:bg-slate-800 dark:text-slate-100 dark:border-slate-600'
                            )} dir={dir}>
                                <SelectValue placeholder={t('select_status')} />
                            </SelectTrigger>
                            <SelectContent dir={dir}>
                                <SelectItem value="active" className={cn(isRTL ? '!text-right' : '!text-left')} dir={dir}>{t('active')}</SelectItem>
                                <SelectItem value="inactive" className={cn(isRTL ? '!text-right' : '!text-left')} dir={dir}>{t('inactive')}</SelectItem>
                            </SelectContent>
                        </Select>
                        {errors.status && (
                            <InputError message={errors.status} className={cn(isRTL ? '!text-right' : '!text-left')} />
                        )}
                    </div>

                    {/* Actions */}
                    <div className={cn("flex items-center gap-3 pt-4 border-t", flexDirection)} dir={dir}>
                        <Button type="submit" disabled={processing} className={cn("flex items-center gap-2", flexDirection)}>
                            {processing ? t('creating') : t('create_category')}
                        </Button>
                        <Link href="/dashboard/categories">
                            <Button type="button" variant="outline" className={cn("flex items-center gap-2", flexDirection)}>
                                {t('cancel')}
                            </Button>
                        </Link>
                    </div>
                </form>
            </div>
        </AppLayout>
    );
}

