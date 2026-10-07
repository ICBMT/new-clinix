import { type BreadcrumbItem } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useTranslation } from '@/hooks/use-translation';
import { useRTL } from '@/hooks/use-rtl';
import AppLayout from '@/layouts/app-layout';
import { index as dashboard } from '@/routes/dashboard';
import { Head, Link, useForm, router, usePage } from '@inertiajs/react';
import { ArrowLeft } from 'lucide-react';
import { FormEventHandler, useState, useEffect } from 'react';
import { customToast } from '@/components/ui/custom-toast';
import { cn } from '@/lib/utils';

interface Category {
    id: number;
    name_en: string;
    name_ar: string;
}

interface CreateBannerProps {
    categories?: Category[] | null;
}


export default function CreateBanner({ categories = [] }: CreateBannerProps) {
    const { t, locale } = useTranslation();
    const { isRTL } = useRTL();
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const { flash } = usePage().props as { flash?: { success?: string; error?: string } };

    // Flash messages
    useEffect(() => {
        if (flash?.success) {
            customToast.success(flash.success);
        }
        if (flash?.error) {
            customToast.error(flash.error);
        }
    }, [flash]);
    
    // Ensure categories is an array
    const safeCategories = Array.isArray(categories) ? categories : [];
    
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
            title: t('create_banner'),
            href: '/dashboard/banners/create',
        },
    ];

    const { data, setData, post, processing, errors } = useForm({
        title_en: '',
        title_ar: '',
        description_en: '',
        description_ar: '',
        link_url: '',
        type: 'homepage', // Default type - hidden from form but set in model
        category_id: '',
        sort_order: 0, // Default value, not shown in form
        start_date: '',
        end_date: '',
        status: 'active',
        image: null as File | null,
    });

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        
        // Trim title fields to ensure they're not just whitespace
        const trimmedTitleEn = (data.title_en || '').trim();
        const trimmedTitleAr = (data.title_ar || '').trim();
        
        // Update form data with trimmed values
        setData('title_en', trimmedTitleEn);
        setData('title_ar', trimmedTitleAr);
        
        // Validate that image is uploaded
        if (!data.image) {
            customToast.error(t('image_required'));
            return;
        }
        
        // Prepare clean data for submission
        let categoryId: number | null = null;
        
        // Handle category_id - convert "none" to null
        if (data.category_id && data.category_id !== 'none' && data.category_id !== '') {
            categoryId = parseInt(data.category_id.toString()) || null;
        }
        
        // Update form data with cleaned values (use null instead of empty string)
        setData('category_id', categoryId ? categoryId.toString() : '');
        
        // Inertia automatically handles FormData when files are present
        post('/dashboard/banners', {
            forceFormData: true,
            onSuccess: () => {
                customToast.success(t('banner_created_successfully'));
                // Reset file previews on success
                setImageFile(null);
                setImagePreview(null);
            },
            onError: (errors) => {
                if (errors && Object.keys(errors).length > 0) {
                    Object.values(errors).forEach((error) => {
                        if (typeof error === 'string') {
                            customToast.error(error);
                        } else if (Array.isArray(error)) {
                            error.forEach((err: any) => customToast.error(err));
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
            setImagePreview(null);
        }
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={t('create_banner')} />

            <div className="flex h-full flex-1 flex-col gap-6 overflow-x-auto rounded-xl bg-card dark:bg-card p-6 border border-border" dir={isRTL ? 'rtl' : 'ltr'}>
                {/* Header */}
                <div className={`flex items-center justify-between border-b pb-4 ${isRTL ? 'flex-row-reverse' : ''}`}>
                    <div className={isRTL ? 'text-right' : ''}>
                        <h1 className="text-3xl font-bold text-foreground">{t('create_banner')}</h1>
                        <p className="text-muted-foreground mt-1">{t('create_new_banner')}</p>
                    </div>
                    
                    <Link href="/dashboard/banners">
                        <Button variant="outline" className={`flex items-center gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
                            <ArrowLeft className={cn("h-4 w-4", isRTL && 'rotate-180')} />
                            {t('back')}
                        </Button>
                    </Link>
                </div>

                <form onSubmit={submit} className="max-w-2xl space-y-6">
                    <div className={`space-y-2 ${isRTL ? 'text-right' : ''}`}>
                        <Label htmlFor="title_en" className={isRTL ? 'text-right' : ''}>
                            {t('title_en')} <span className="text-red-500">*</span>
                        </Label>
                        <Input
                            id="title_en"
                            type="text"
                            value={data.title_en}
                            onChange={(e) => setData('title_en', e.target.value)}
                            placeholder={t('enter_title_en')}
                            className={errors.title_en ? 'border-red-500' : ''}
                            required
                        />
                        {errors.title_en && (
                            <p className="text-sm text-red-500">{t(errors.title_en) || errors.title_en}</p>
                        )}
                    </div>

                    <div className={`space-y-2 ${isRTL ? 'text-right' : ''}`}>
                        <Label htmlFor="title_ar" className={isRTL ? 'text-right' : ''}>
                            {t('title_ar')} <span className="text-red-500">*</span>
                        </Label>
                        <Input
                            id="title_ar"
                            type="text"
                            value={data.title_ar}
                            onChange={(e) => setData('title_ar', e.target.value)}
                            placeholder={t('enter_title_ar')}
                            className={errors.title_ar ? 'border-red-500' : ''}
                            dir="rtl"
                            required
                        />
                        {errors.title_ar && (
                            <p className="text-sm text-red-500">{t(errors.title_ar) || errors.title_ar}</p>
                        )}
                    </div>

                    <div className={`space-y-2 ${isRTL ? 'text-right' : ''}`}>
                        <Label htmlFor="description_en" className={isRTL ? 'text-right' : ''}>{t('description_en')}</Label>
                        <Textarea
                            id="description_en"
                            value={data.description_en}
                            onChange={(e) => setData('description_en', e.target.value)}
                            placeholder={t('enter_description_en')}
                            rows={4}
                            className={errors.description_en ? 'border-red-500' : ''}
                        />
                        {errors.description_en && (
                            <p className="text-sm text-red-500">{t(errors.description_en) || errors.description_en}</p>
                        )}
                    </div>

                    <div className={`space-y-2 ${isRTL ? 'text-right' : ''}`}>
                        <Label htmlFor="description_ar" className={isRTL ? 'text-right' : ''}>{t('description_ar')}</Label>
                        <Textarea
                            id="description_ar"
                            value={data.description_ar}
                            onChange={(e) => setData('description_ar', e.target.value)}
                            placeholder={t('enter_description_ar')}
                            rows={4}
                            className={errors.description_ar ? 'border-red-500' : ''}
                            dir="rtl"
                        />
                        {errors.description_ar && (
                            <p className="text-sm text-red-500">{t(errors.description_ar) || errors.description_ar}</p>
                        )}
                    </div>

                    <div className={`space-y-2 ${isRTL ? 'text-right' : ''}`}>
                        <Label htmlFor="link_url" className={isRTL ? 'text-right' : ''}>{t('link_url')}</Label>
                        <Input
                            id="link_url"
                            type="url"
                            value={data.link_url}
                            onChange={(e) => setData('link_url', e.target.value)}
                            placeholder={t('enter_link_url')}
                            className={errors.link_url ? 'border-red-500' : ''}
                        />
                        {errors.link_url && (
                            <p className="text-sm text-red-500">{t(errors.link_url) || errors.link_url}</p>
                        )}
                    </div>

                    <div className={`space-y-2 ${isRTL ? 'text-right' : ''}`}>
                        <Label htmlFor="category_id" className={isRTL ? 'text-right' : ''}>{t('category')}</Label>
                        <Select
                            value={data.category_id || 'none'}
                            onValueChange={(value) => setData('category_id', value === 'none' ? '' : value)}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder={t('select_category')} />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="none">{t('none')}</SelectItem>
                                {safeCategories.map((category) => (
                                    <SelectItem key={category.id} value={category.id.toString()}>
                                        {isRTL ? category.name_ar : category.name_en}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className={`space-y-2 ${isRTL ? 'text-right' : ''}`}>
                            <Label htmlFor="start_date" className={isRTL ? 'text-right' : ''}>{t('start_date')}</Label>
                            <Input
                                id="start_date"
                                type="date"
                                value={data.start_date}
                                onChange={(e) => setData('start_date', e.target.value)}
                                className={errors.start_date ? 'border-red-500' : ''}
                            />
                            {errors.start_date && (
                                <p className="text-sm text-red-500">{t(errors.start_date) || errors.start_date}</p>
                            )}
                        </div>

                        <div className={`space-y-2 ${isRTL ? 'text-right' : ''}`}>
                            <Label htmlFor="end_date" className={isRTL ? 'text-right' : ''}>{t('end_date')}</Label>
                            <Input
                                id="end_date"
                                type="date"
                                value={data.end_date}
                                onChange={(e) => setData('end_date', e.target.value)}
                                className={errors.end_date ? 'border-red-500' : ''}
                            />
                            {errors.end_date && (
                                <p className="text-sm text-red-500">{t(errors.end_date) || errors.end_date}</p>
                            )}
                        </div>
                    </div>

                    <div className={`space-y-2 ${isRTL ? 'text-right' : ''}`}>
                        <Label htmlFor="image" className={isRTL ? 'text-right' : ''}>
                            {isRTL ? <><span className="text-red-500">*</span> {t('image')}</> : <>{t('image')} <span className="text-red-500">*</span></>}
                        </Label>
                        <div className="space-y-3">
                            {imagePreview && (
                                <div className="relative w-full max-w-md border rounded-lg overflow-hidden">
                                    <img
                                        src={imagePreview}
                                        alt="Preview"
                                        className="w-full h-48 object-cover"
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
                                required
                            />
                            <p className="text-xs text-muted-foreground">
                                {t('accepted_formats')}: JPG, JPEG, PNG (Max: 2MB)
                            </p>
                        </div>
                        {errors.image && (
                            <p className="text-sm text-red-500">{t(errors.image) || errors.image}</p>
                        )}
                    </div>

                    <div className={`space-y-2 ${isRTL ? 'text-right' : ''}`}>
                        <Label htmlFor="status" className={isRTL ? 'text-right' : ''}>
                            {t('status')} <span className="text-red-500">*</span>
                        </Label>
                        <Select
                            value={data.status}
                            onValueChange={(value) => setData('status', value as 'active' | 'inactive')}
                        >
                            <SelectTrigger className={errors.status ? 'border-red-500' : ''}>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="active">{t('active')}</SelectItem>
                                <SelectItem value="inactive">{t('inactive')}</SelectItem>
                            </SelectContent>
                        </Select>
                        {errors.status && (
                            <p className="text-sm text-red-500">{t(errors.status) || errors.status}</p>
                        )}
                    </div>

                    <div className={`flex items-center gap-3 pt-4 border-t ${isRTL ? 'flex-row-reverse' : ''}`}>
                        <Button type="submit" disabled={processing}>
                            {processing ? t('creating') : t('create_banner')}
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

