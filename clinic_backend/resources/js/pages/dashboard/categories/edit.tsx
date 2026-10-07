import { type BreadcrumbItem } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useTranslation } from '@/hooks/use-translation';
import { useRTL } from '@/hooks/use-rtl';
import { useRTLInit } from '@/hooks/use-rtl-init';
import AppLayout from '@/layouts/app-layout';
import { index as dashboard } from '@/routes/dashboard';
import { Head, Link, useForm, usePage } from '@inertiajs/react';
import { ArrowLeft, Eye } from 'lucide-react';
import { FormEventHandler, useState, useEffect } from 'react';
import { customToast } from '@/components/ui/custom-toast';
import { cn } from '@/lib/utils';
import { type SharedData } from '@/types';

interface Category {
    id: number;
    name_en: string;
    name_ar: string;
    description_en?: string;
    description_ar?: string;
    parent_id?: number;
    status: 'active' | 'inactive';
    sort_order: number;
    media?: Array<{
        id: number;
        url: string;
        file_name?: string;
        collection_name?: string;
    }>;
}

interface ParentCategory {
    id: number;
    name_en: string;
    name_ar: string;
}

interface EditCategoryProps {
    category: Category;
    parentCategories?: ParentCategory[] | null;
}

// Breadcrumbs will be set inside component to use translation

export default function EditCategory({ category, parentCategories }: EditCategoryProps) {
    useRTLInit();
    const { t, locale } = useTranslation();
    const page = usePage<SharedData>();
    const { locale: pageLocale } = page.props;
    const isRTL = pageLocale === 'ar';
    const dir = isRTL ? 'rtl' : 'ltr';
    const { flexDirection, getFieldDir, getInputTextAlign, iconMargin } = useRTL();
    const { flash } = usePage<SharedData>().props;
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [imagePreview, setImagePreview] = useState<string | null>(null);

    // Get existing image URL from media relationship
    const getExistingImageUrl = () => {
        if (!category.media || category.media.length === 0) {
            return null;
        }
        
        // Find image from category_images or images collection
        const categoryImage = category.media.find(m => 
            m.collection_name === 'category_images' || m.collection_name === 'images'
        ) || category.media[0];
        
        if (!categoryImage) {
            return null;
        }
        
        // file_name already contains the full URL according to MediaService
        if (categoryImage.file_name) {
            // Check if it's already a full URL
            if (categoryImage.file_name.startsWith('http://') || categoryImage.file_name.startsWith('https://')) {
                return categoryImage.file_name;
            }
            // Otherwise, it's a path, prepend storage
            return `/storage/${categoryImage.file_name.replace(/^storage\//, '')}`;
        }
        
        // Fallback to url if available
        if (categoryImage.url) {
            return categoryImage.url;
        }
        
        return null;
    };
    
    const existingImageUrl = getExistingImageUrl();

    // Flash messages
    useEffect(() => {
        if (flash?.success) {
            customToast.success(flash.success);
        }
        if (flash?.error) {
            customToast.error(flash.error);
        }
    }, [flash]);

    // Set initial preview from existing image
    useEffect(() => {
        if (existingImageUrl && !imageFile) {
            setImagePreview(existingImageUrl);
        }
    }, [existingImageUrl]);

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
            title: t('edit_category'),
            href: '#',
        },
    ];

    const { data, setData, post, processing, errors } = useForm({
        name_en: category.name_en || '',
        name_ar: category.name_ar || '',
        description_en: category.description_en || '',
        description_ar: category.description_ar || '',
        parent_id: (category.parent_id ?? null) as number | null,
        status: category.status || 'active',
        image: null as File | null,
        _method: 'PATCH',
    });

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        
        post(`/dashboard/categories/${category.id}`, {
            forceFormData: true,
            preserveScroll: true,
            onSuccess: () => {
                // Reset file previews on success
                setImageFile(null);
                // Keep existing image preview if no new file was uploaded
                if (!imageFile) {
                    setImagePreview(existingImageUrl);
                }
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
        
        // Create preview URL for new file
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setImagePreview(reader.result as string);
            };
            reader.readAsDataURL(file);
        } else {
            // Reset to existing image if file is cleared
            setImagePreview(existingImageUrl);
        }
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`${t('edit_category')} - ${category.name_en}`} />

            <div className={cn("flex h-full flex-1 flex-col gap-6 overflow-x-auto rounded-xl bg-card dark:bg-card p-6 border border-border", isRTL ? '!text-right' : '!text-left')} dir={dir}>
                {/* Header */}
                <div className={cn("flex items-center justify-between border-b pb-4", flexDirection)}>
                    <div className={cn(isRTL ? '!text-right' : '!text-left')}>
                        <h1 className={cn("text-3xl font-bold text-foreground", isRTL ? '!text-right' : '!text-left')}>{t('edit_category')}</h1>
                        <p className={cn("text-muted-foreground mt-1", isRTL ? '!text-right' : '!text-left')}>{t('update_category_information')}</p>
                    </div>
                    
                    <div className={cn("flex items-center gap-3", flexDirection)}>
                        <Link href={`/dashboard/categories/${category.id}`}>
                            <Button variant="outline" className={cn("flex items-center gap-2", flexDirection)}>
                                <Eye className={cn("h-4 w-4", iconMargin('md'))} />
                                {t('view')}
                            </Button>
                        </Link>
                        <Link href="/dashboard/categories">
                            <Button variant="outline" className={cn("flex items-center gap-2", flexDirection)}>
                                <ArrowLeft className={cn("h-4 w-4", isRTL && 'rotate-180')} />
                                {t('back')}
                            </Button>
                        </Link>
                    </div>
                </div>

                <form onSubmit={submit} className={cn("space-y-6", isRTL ? '!text-right' : '!text-left')} dir={dir}>
                    {/* Name (English) */}
                    <div className={cn("space-y-2", isRTL ? '!text-right' : '!text-left')}>
                        <Label htmlFor="name_en" className={cn(isRTL ? '!text-right' : '!text-left')}>
                            {isRTL ? <><span className="text-red-500">*</span> {t('name_en')}</> : <>{t('name_en')} <span className="text-red-500">*</span></>}
                        </Label>
                        <Input
                            id="name_en"
                            type="text"
                            value={data.name_en}
                            onChange={(e) => {
                                const value = e.target.value.slice(0, 50);
                                setData('name_en', value);
                            }}
                            placeholder={t('enter_name_en')}
                            dir={getFieldDir('text')}
                            className={cn(errors.name_en ? 'border-red-500' : '', getInputTextAlign('text'))}
                            maxLength={50}
                            required
                        />
                        {errors.name_en && (
                            <p className={cn("text-sm text-red-500", isRTL ? '!text-right' : '!text-left')}>{t(errors.name_en) || errors.name_en}</p>
                        )}
                    </div>

                    {/* Name (Arabic) */}
                    <div className={cn("space-y-2", isRTL ? '!text-right' : '!text-left')}>
                        <Label htmlFor="name_ar" className={cn(isRTL ? '!text-right' : '!text-left')}>
                            {isRTL ? <><span className="text-red-500">*</span> {t('name_ar')}</> : <>{t('name_ar')} <span className="text-red-500">*</span></>}
                        </Label>
                        <Input
                            id="name_ar"
                            type="text"
                            value={data.name_ar}
                            onChange={(e) => {
                                const value = e.target.value.slice(0, 50);
                                setData('name_ar', value);
                            }}
                            placeholder={t('enter_name_ar')}
                            dir="rtl"
                            className={cn(errors.name_ar ? 'border-red-500' : '', 'text-right')}
                            maxLength={50}
                            required
                        />
                        {errors.name_ar && (
                            <p className={cn("text-sm text-red-500", isRTL ? '!text-right' : '!text-left')}>{t(errors.name_ar) || errors.name_ar}</p>
                        )}
                    </div>

                    {/* Description (English) */}
                    <div className={cn("space-y-2", isRTL ? '!text-right' : '!text-left')}>
                        <Label htmlFor="description_en" className={cn(isRTL ? '!text-right' : '!text-left')}>{t('description_en')}</Label>
                        <Textarea
                            id="description_en"
                            value={data.description_en}
                            onChange={(e) => setData('description_en', e.target.value)}
                            placeholder={t('enter_description_en')}
                            rows={4}
                            dir={getFieldDir('textarea')}
                            className={cn(errors.description_en ? 'border-red-500' : '', getInputTextAlign('textarea'))}
                        />
                        {errors.description_en && (
                            <p className={cn("text-sm text-red-500", isRTL ? '!text-right' : '!text-left')}>{t(errors.description_en) || errors.description_en}</p>
                        )}
                    </div>

                    {/* Description (Arabic) */}
                    <div className={cn("space-y-2", isRTL ? '!text-right' : '!text-left')}>
                        <Label htmlFor="description_ar" className={cn(isRTL ? '!text-right' : '!text-left')}>{t('description_ar')}</Label>
                        <Textarea
                            id="description_ar"
                            value={data.description_ar}
                            onChange={(e) => setData('description_ar', e.target.value)}
                            placeholder={t('enter_description_ar')}
                            rows={4}
                            dir="rtl"
                            className={cn(errors.description_ar ? 'border-red-500' : '', 'text-right')}
                        />
                        {errors.description_ar && (
                            <p className={cn("text-sm text-red-500", isRTL ? '!text-right' : '!text-left')}>{t(errors.description_ar) || errors.description_ar}</p>
                        )}
                    </div>

                    {/* Parent Category */}
                    <div className={cn("space-y-2", isRTL ? '!text-right' : '!text-left')}>
                        <Label htmlFor="parent_id" className={cn(isRTL ? '!text-right' : '!text-left')}>{t('parent_category')}</Label>
                        <Select
                            value={data.parent_id !== null ? data.parent_id.toString() : 'none'}
                            onValueChange={(value) => setData('parent_id', value === 'none' ? null : Number(value))}
                        >
                            <SelectTrigger className={cn(errors.parent_id ? 'border-red-500' : '', isRTL ? '!text-right' : '!text-left')} dir={dir}>
                                <SelectValue placeholder={t('select_parent_category')} />
                            </SelectTrigger>
                            <SelectContent dir={dir}>
                                <SelectItem value="none" className={cn(isRTL ? '!text-right' : '!text-left')}>{t('no_parent_category')}</SelectItem>
                                {Array.isArray(parentCategories) && parentCategories.length > 0 ? (
                                    parentCategories.map((cat) => (
                                        <SelectItem key={cat.id} value={cat.id.toString()} className={cn(isRTL ? '!text-right' : '!text-left')}>
                                            {isRTL ? cat.name_ar : cat.name_en}
                                        </SelectItem>
                                    ))
                                ) : null}
                            </SelectContent>
                        </Select>
                        {errors.parent_id && (
                            <p className={cn("text-sm text-red-500", isRTL ? '!text-right' : '!text-left')}>{t(errors.parent_id) || errors.parent_id}</p>
                        )}
                    </div>

                    {/* Status */}
                    <div className={cn("space-y-2", isRTL ? '!text-right' : '!text-left')}>
                        <Label htmlFor="status" className={cn(isRTL ? '!text-right' : '!text-left')}>
                            {isRTL ? <><span className="text-red-500">*</span> {t('status')}</> : <>{t('status')} <span className="text-red-500">*</span></>}
                        </Label>
                        <Select
                            value={data.status}
                            onValueChange={(value) => setData('status', value as 'active' | 'inactive')}
                        >
                            <SelectTrigger className={cn(errors.status ? 'border-red-500' : '', isRTL ? '!text-right' : '!text-left')} dir={dir}>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent dir={dir}>
                                <SelectItem value="active" className={cn(isRTL ? '!text-right' : '!text-left')}>{t('active')}</SelectItem>
                                <SelectItem value="inactive" className={cn(isRTL ? '!text-right' : '!text-left')}>{t('inactive')}</SelectItem>
                            </SelectContent>
                        </Select>
                        {errors.status && (
                            <p className={cn("text-sm text-red-500", isRTL ? '!text-right' : '!text-left')}>{t(errors.status) || errors.status}</p>
                        )}
                    </div>

                    {/* Category Image Upload */}
                    <div className={cn("space-y-2", isRTL ? '!text-right' : '!text-left')}>
                        <Label htmlFor="image" className={cn(isRTL ? '!text-right' : '!text-left')}>{t('category_image')}</Label>
                        <Input
                            id="image"
                            type="file"
                            accept="image/*"
                            onChange={handleImageChange}
                            className={errors.image ? 'border-red-500' : ''}
                        />
                        {imagePreview && (
                            <div className={cn("mt-4 text-center", isRTL ? '!text-right' : '!text-left')}>
                                <img 
                                    src={imagePreview} 
                                    alt={t('category_preview')}
                                    className="max-h-48 mx-auto rounded border"
                                />
                            </div>
                        )}
                        {!imageFile && existingImageUrl && (
                            <p className={cn("text-xs text-muted-foreground mt-1", isRTL ? '!text-right' : '!text-left')}>
                                {t('leave_empty_to_keep_current_image')}
                            </p>
                        )}
                        {errors.image && (
                            <p className={cn("text-sm text-red-500", isRTL ? '!text-right' : '!text-left')}>{t(errors.image) || errors.image}</p>
                        )}
                    </div>

                    {/* Actions */}
                    <div className={cn("flex items-center gap-3 pt-4 border-t", flexDirection, isRTL ? 'justify-start' : 'justify-end')}>
                        <Button type="submit" disabled={processing}>
                            {processing ? t('updating') : t('update_category')}
                        </Button>
                        <Link href="/dashboard/categories">
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

