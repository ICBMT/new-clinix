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
import { Head, Link, useForm, usePage, router } from '@inertiajs/react';
import { ArrowLeft, Eye } from 'lucide-react';
import { FormEventHandler, useState, useEffect } from 'react';
import { customToast } from '@/components/ui/custom-toast';
import { cn } from '@/lib/utils';
import { type SharedData } from '@/types';

interface Banner {
    id: number;
    title_en: string;
    title_ar: string;
    description_en?: string;
    description_ar?: string;
    image_url?: string;
    mobile_image_url?: string;
    link_url?: string;
    type?: string;
    linkable_type?: string;
    linkable_id?: number;
    position?: string;
    sort_order: number;
    start_date?: string;
    end_date?: string;
    status: 'active' | 'inactive';
    linkable?: {
        id: number;
        name_en?: string;
        name_ar?: string;
        title_en?: string;
        title_ar?: string;
    } | null;
}

interface Category {
    id: number;
    name_en: string;
    name_ar: string;
}

interface EditBannerProps {
    banner: Banner;
    categories?: Category[] | null;
}


export default function EditBanner({ banner, categories = [] }: EditBannerProps) {
    useRTLInit();
    const { t, locale } = useTranslation();
    const page = usePage<SharedData>();
    const { locale: pageLocale } = page.props;
    const isRTL = pageLocale === 'ar';
    const dir = isRTL ? 'rtl' : 'ltr';
    const { flexDirection, getFieldDir, getInputTextAlign, iconMargin } = useRTL();
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [imagePreview, setImagePreview] = useState<string | null>(banner.image_url || null);
    const { flash } = usePage<SharedData>().props;

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
            title: t('banners_management'),
            href: '/dashboard/banners',
        },
        {
            title: t('edit_banner'),
            href: `/dashboard/banners/${banner.id}/edit`,
        },
    ];

    // Extract linkable info if exists
    const linkableType = banner.linkable_type || '';
    const linkableId = banner.linkable_id?.toString() || '';
    const isCategory = linkableType === 'App\\Models\\Category' || linkableType === 'category';
    
    // Format dates for date inputs (YYYY-MM-DD format)
    const formatDateForInput = (date: string | null | undefined): string => {
        if (!date) return '';
        try {
            // If date is already in YYYY-MM-DD format, return as is
            if (typeof date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(date)) {
                return date;
            }
            // Otherwise, parse and format
            const dateObj = new Date(date);
            if (isNaN(dateObj.getTime())) return '';
            const year = dateObj.getFullYear();
            const month = String(dateObj.getMonth() + 1).padStart(2, '0');
            const day = String(dateObj.getDate()).padStart(2, '0');
            return `${year}-${month}-${day}`;
        } catch {
            return '';
        }
    };
    
    const { data, setData, processing, errors } = useForm({
        title_en: banner.title_en || '',
        title_ar: banner.title_ar || '',
        description_en: banner.description_en || '',
        description_ar: banner.description_ar || '',
        link_url: banner.link_url || '',
        linkable_type: linkableType || '',
        linkable_id: linkableId || '',
        category_id: isCategory ? linkableId : '',
        sort_order: banner.sort_order ?? 0,
        start_date: formatDateForInput(banner.start_date),
        end_date: formatDateForInput(banner.end_date),
        status: banner.status || 'active',
        image: null as File | null,
        _method: 'PATCH',
    });

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        
        // Trim title fields to ensure they're not just whitespace
        const trimmedTitleEn = (data.title_en || '').trim();
        const trimmedTitleAr = (data.title_ar || '').trim();
        
        // Prepare clean data for submission
        let categoryId: number | null = null;
        
        // Handle category_id - convert "none" to null
        if (data.category_id && data.category_id !== 'none' && data.category_id !== '') {
            categoryId = parseInt(data.category_id.toString()) || null;
        }
        
        // Build FormData manually to ensure all fields are sent
        const formData = new FormData();
        
        // Always include required fields
        formData.append('title_en', trimmedTitleEn || '');
        formData.append('title_ar', trimmedTitleAr || '');
        formData.append('status', data.status || 'active');
        
        // Include optional fields (even if empty)
        formData.append('description_en', data.description_en || '');
        formData.append('description_ar', data.description_ar || '');
        formData.append('link_url', data.link_url || '');
        formData.append('sort_order', (data.sort_order ?? 0).toString());
        formData.append('start_date', data.start_date || '');
        formData.append('end_date', data.end_date || '');
        
        // Handle category_id
        if (categoryId) {
            formData.append('category_id', categoryId.toString());
        }
        
        // Include image file if selected
        if (data.image) {
            formData.append('image', data.image);
        }
        
        // Use router.post() directly with FormData - POST route will handle the update
        router.post(`/dashboard/banners/${banner.id}`, formData, {
            forceFormData: true,
            preserveScroll: true,
            onSuccess: () => {
                // Flash message will be shown via useEffect
                setImageFile(null);
                // Keep preview if no new image was uploaded
                if (!data.image) {
                    setImagePreview(banner.image_url || null);
                }
            },
            onError: (errors: Record<string, string | string[]>) => {
                if (errors && Object.keys(errors).length > 0) {
                    Object.values(errors).forEach((error) => {
                        if (typeof error === 'string') {
                            customToast.error(error);
                        } else if (Array.isArray(error)) {
                            error.forEach((err: string) => customToast.error(err));
                        }
                    });
                }
            }
        });
    };

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0] || null;
        setImageFile(file);
        setData('image', file);
        
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setImagePreview(reader.result as string);
            };
            reader.readAsDataURL(file);
        } else {
            // Reset to existing image if file is cleared
            setImagePreview(banner.image_url || null);
        }
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`${t('edit_banner')} - ${banner.title_en}`} />

            <div className={cn("flex h-full flex-1 flex-col gap-6 overflow-x-auto rounded-xl bg-card dark:bg-card p-6 border border-border", isRTL ? '!text-right' : '!text-left')} dir={dir}>
                {/* Header */}
                <div className={cn("flex items-center justify-between border-b pb-4", flexDirection)}>
                    <div className={cn(isRTL ? '!text-right' : '!text-left')}>
                        <h1 className={cn("text-3xl font-bold text-foreground", isRTL ? '!text-right' : '!text-left')}>{t('edit_banner')}</h1>
                        <p className={cn("text-muted-foreground mt-1", isRTL ? '!text-right' : '!text-left')}>{t('update_banner_information')}</p>
                    </div>
                    <div className={cn("flex items-center gap-3", flexDirection)}>
                        <Link href={`/dashboard/banners/${banner.id}`}>
                            <Button variant="outline" className={cn("flex items-center gap-2", flexDirection)}>
                                <Eye className={cn("h-4 w-4", iconMargin('md'))} />
                                {t('view')}
                            </Button>
                        </Link>
                        <Link href="/dashboard/banners">
                            <Button variant="outline" className={cn("flex items-center gap-2", flexDirection)}>
                                <ArrowLeft className={cn("h-4 w-4", isRTL && 'rotate-180')} />
                                {t('back')}
                            </Button>
                        </Link>
                    </div>
                </div>

                <form onSubmit={submit} className={cn("space-y-6", isRTL ? '!text-right' : '!text-left')} dir={dir} encType="multipart/form-data">
                    <div className={cn("space-y-2", isRTL ? '!text-right' : '!text-left')}>
                        <Label htmlFor="title_en" className={cn(isRTL ? '!text-right' : '!text-left')}>
                            {isRTL ? <><span className="text-red-500">*</span> {t('title_en')}</> : <>{t('title_en')} <span className="text-red-500">*</span></>}
                        </Label>
                        <Input
                            id="title_en"
                            type="text"
                            value={data.title_en}
                            onChange={(e) => setData('title_en', e.target.value)}
                            placeholder={t('enter_title_en')}
                            dir={getFieldDir('text')}
                            className={cn(errors.title_en ? 'border-red-500' : '', getInputTextAlign('text'))}
                            required
                        />
                        {errors.title_en && (
                            <p className={cn("text-sm text-red-500", isRTL ? '!text-right' : '!text-left')}>{t(errors.title_en) || errors.title_en}</p>
                        )}
                    </div>

                    <div className={cn("space-y-2", isRTL ? '!text-right' : '!text-left')}>
                        <Label htmlFor="title_ar" className={cn(isRTL ? '!text-right' : '!text-left')}>
                            {isRTL ? <><span className="text-red-500">*</span> {t('title_ar')}</> : <>{t('title_ar')} <span className="text-red-500">*</span></>}
                        </Label>
                        <Input
                            id="title_ar"
                            type="text"
                            value={data.title_ar}
                            onChange={(e) => setData('title_ar', e.target.value)}
                            placeholder={t('enter_title_ar')}
                            dir="rtl"
                            className={cn(errors.title_ar ? 'border-red-500' : '', getInputTextAlign('text'))}
                            required
                        />
                        {errors.title_ar && (
                            <p className={cn("text-sm text-red-500", isRTL ? '!text-right' : '!text-left')}>{t(errors.title_ar) || errors.title_ar}</p>
                        )}
                    </div>

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

                    <div className={cn("space-y-2", isRTL ? '!text-right' : '!text-left')}>
                        <Label htmlFor="description_ar" className={cn(isRTL ? '!text-right' : '!text-left')}>{t('description_ar')}</Label>
                        <Textarea
                            id="description_ar"
                            value={data.description_ar}
                            onChange={(e) => setData('description_ar', e.target.value)}
                            placeholder={t('enter_description_ar')}
                            rows={4}
                            dir="rtl"
                            className={cn(errors.description_ar ? 'border-red-500' : '', getInputTextAlign('textarea'))}
                        />
                        {errors.description_ar && (
                            <p className={cn("text-sm text-red-500", isRTL ? '!text-right' : '!text-left')}>{t(errors.description_ar) || errors.description_ar}</p>
                        )}
                    </div>

                    <div className={cn("space-y-2", isRTL ? '!text-right' : '!text-left')}>
                        <Label htmlFor="link_url" className={cn(isRTL ? '!text-right' : '!text-left')}>{t('link_url')}</Label>
                        <Input
                            id="link_url"
                            type="url"
                            value={data.link_url}
                            onChange={(e) => setData('link_url', e.target.value)}
                            placeholder={t('enter_link_url') || 'https://example.com'}
                            dir={getFieldDir('url')}
                            className={cn(errors.link_url ? 'border-red-500' : '', getInputTextAlign('url'))}
                        />
                        {errors.link_url && (
                            <p className={cn("text-sm text-red-500", isRTL ? '!text-right' : '!text-left')}>{t(errors.link_url) || errors.link_url}</p>
                        )}
                    </div>

                    <div className={cn("space-y-2", isRTL ? '!text-right' : '!text-left')}>
                        <Label htmlFor="category_id" className={cn(isRTL ? '!text-right' : '!text-left')}>{t('category')}</Label>
                        <Select
                            value={data.category_id || 'none'}
                            onValueChange={(value) => setData('category_id', value === 'none' ? '' : value)}
                        >
                            <SelectTrigger className={cn(isRTL ? '!text-right' : '!text-left')}>
                                <SelectValue placeholder={t('select_category')} />
                            </SelectTrigger>
                            <SelectContent dir={dir}>
                                <SelectItem value="none" className={cn(isRTL ? '!text-right' : '!text-left')} dir={dir}>{t('none')}</SelectItem>
                                {Array.isArray(categories) && categories.map((category) => (
                                    <SelectItem key={category.id} value={category.id.toString()} className={cn(isRTL ? '!text-right' : '!text-left')} dir={dir}>
                                        <span className={cn("block", isRTL ? '!text-right' : '!text-left')}>
                                            {isRTL ? category.name_ar : category.name_en}
                                        </span>
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className={cn("space-y-2", isRTL ? '!text-right' : '!text-left')}>
                            <Label htmlFor="start_date" className={cn(isRTL ? '!text-right' : '!text-left')}>{t('start_date')}</Label>
                            <Input
                                id="start_date"
                                type="date"
                                value={data.start_date}
                                onChange={(e) => setData('start_date', e.target.value)}
                                className={cn(errors.start_date ? 'border-red-500' : '', getInputTextAlign('text'))}
                            />
                            {errors.start_date && (
                                <p className={cn("text-sm text-red-500", isRTL ? '!text-right' : '!text-left')}>{t(errors.start_date) || errors.start_date}</p>
                            )}
                        </div>

                        <div className={cn("space-y-2", isRTL ? '!text-right' : '!text-left')}>
                            <Label htmlFor="end_date" className={cn(isRTL ? '!text-right' : '!text-left')}>{t('end_date')}</Label>
                            <Input
                                id="end_date"
                                type="date"
                                value={data.end_date}
                                onChange={(e) => setData('end_date', e.target.value)}
                                className={cn(errors.end_date ? 'border-red-500' : '', getInputTextAlign('text'))}
                            />
                            {errors.end_date && (
                                <p className={cn("text-sm text-red-500", isRTL ? '!text-right' : '!text-left')}>{t(errors.end_date) || errors.end_date}</p>
                            )}
                        </div>
                    </div>

                    <div className={cn("space-y-2", isRTL ? '!text-right' : '!text-left')}>
                        <Label htmlFor="sort_order" className={cn(isRTL ? '!text-right' : '!text-left')}>{t('sort_order')}</Label>
                        <Input
                            id="sort_order"
                            type="number"
                            min="0"
                            value={data.sort_order === 0 ? '0' : data.sort_order}
                            onChange={(e) => {
                                const value = e.target.value;
                                if (value === '') {
                                    setData('sort_order', 0);
                                } else if (!isNaN(parseInt(value)) && parseInt(value) >= 0) {
                                    setData('sort_order', parseInt(value));
                                }
                            }}
                            placeholder="0"
                            dir={getFieldDir('number')}
                            className={cn(errors.sort_order ? 'border-red-500' : '', getInputTextAlign('number'))}
                        />
                        {errors.sort_order && (
                            <p className={cn("text-sm text-red-500", isRTL ? '!text-right' : '!text-left')}>{t(errors.sort_order) || errors.sort_order}</p>
                        )}
                    </div>

                    <div className={cn("space-y-2", isRTL ? '!text-right' : '!text-left')}>
                        <Label htmlFor="image" className={cn(isRTL ? '!text-right' : '!text-left')}>
                            {t('image')}
                        </Label>
                        <div className="space-y-3">
                            {imagePreview && (
                                <div className="relative w-full max-w-md border rounded-lg overflow-hidden">
                                    <img
                                        src={imagePreview}
                                        alt="Preview"
                                        className="w-full h-48 object-cover"
                                        onError={(e) => {
                                            const target = e.target as HTMLImageElement;
                                            target.style.display = 'none';
                                        }}
                                    />
                                    <Button
                                        type="button"
                                        variant="destructive"
                                        size="sm"
                                        className={cn("absolute top-2", isRTL ? "left-2" : "right-2")}
                                        onClick={() => {
                                            setImageFile(null);
                                            setImagePreview(null);
                                            setData('image', null);
                                        }}
                                    >
                                        {t('remove')}
                                    </Button>
                                </div>
                            )}
                            <Input
                                id="image"
                                type="file"
                                accept="image/jpeg,image/jpg,image/png"
                                onChange={handleImageChange}
                                className={errors.image ? 'border-red-500' : ''}
                            />
                            <p className={cn("text-xs text-muted-foreground", isRTL ? '!text-right' : '!text-left')}>
                                {t('accepted_formats')}: JPG, JPEG, PNG (Max: 2MB)
                            </p>
                            <p className={cn("text-xs text-muted-foreground italic", isRTL ? '!text-right' : '!text-left')}>
                                {t('leave_empty_to_keep_current_image')}
                            </p>
                        </div>
                        {errors.image && (
                            <p className={cn("text-sm text-red-500", isRTL ? '!text-right' : '!text-left')}>{t(errors.image) || errors.image}</p>
                        )}
                    </div>

                    <div className={cn("space-y-2", isRTL ? '!text-right' : '!text-left')}>
                        <Label htmlFor="status" className={cn(isRTL ? '!text-right' : '!text-left')}>
                            {isRTL ? <><span className="text-red-500">*</span> {t('status')}</> : <>{t('status')} <span className="text-red-500">*</span></>}
                        </Label>
                        <Select
                            value={data.status}
                            onValueChange={(value) => setData('status', value as 'active' | 'inactive')}
                        >
                            <SelectTrigger className={cn(errors.status ? 'border-red-500' : '', isRTL ? '!text-right' : '!text-left')}>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent dir={dir}>
                                <SelectItem value="active" className={cn(isRTL ? '!text-right' : '!text-left')} dir={dir}>{t('active')}</SelectItem>
                                <SelectItem value="inactive" className={cn(isRTL ? '!text-right' : '!text-left')} dir={dir}>{t('inactive')}</SelectItem>
                            </SelectContent>
                        </Select>
                        {errors.status && (
                            <p className={cn("text-sm text-red-500", isRTL ? '!text-right' : '!text-left')}>{t(errors.status) || errors.status}</p>
                        )}
                    </div>

                    <div className={cn("flex items-center gap-3 pt-4 border-t", flexDirection, isRTL ? 'justify-start' : 'justify-end')}>
                        <Button type="submit" disabled={processing}>
                            {processing ? t('updating') : t('update_banner')}
                        </Button>
                        <Link href="/dashboard/banners">
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

