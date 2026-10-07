import { type BreadcrumbItem } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
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
import { type SharedData } from '@/types';

interface Governorate {
    id: number;
    name_en: string;
    name_ar: string;
    is_active: boolean;
}

interface EditGovernorateProps {
    governorate: Governorate;
}

export default function EditGovernorate({ governorate }: EditGovernorateProps) {
    useRTLInit();
    const { t, locale } = useTranslation();
    const page = usePage<SharedData>();
    const { locale: pageLocale } = page.props;
    const isRTL = pageLocale === 'ar';
    const dir = isRTL ? 'rtl' : 'ltr';
    const { flexDirection, iconMargin, getFieldDir, getInputTextAlign } = useRTL();
    const { flash } = usePage<SharedData>().props;
    
    const breadcrumbs: BreadcrumbItem[] = [
        {
            title: t('dashboard'),
            href: dashboard.url(),
        },
        {
            title: t('governorates_management'),
            href: '/dashboard/governorates',
        },
        {
            title: t('edit_governorate'),
            href: '#',
        },
    ];

    const { data, setData, patch, processing, errors } = useForm({
        name_en: governorate.name_en || '',
        name_ar: governorate.name_ar || '',
        is_active: governorate.is_active ?? true,
        _method: 'PATCH',
    });

    // Flash messages
    useEffect(() => {
        if (flash?.success) {
            customToast.success(flash.success);
        }
        if (flash?.error) {
            customToast.error(flash.error);
        }
    }, [flash]);

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        patch(`/dashboard/governorates/${governorate.id}`);
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`${t('edit_governorate')} - ${governorate.name_en}`} />

            <div className={cn("flex h-full flex-1 flex-col gap-6 overflow-x-auto rounded-xl bg-card dark:bg-card p-6 border border-border", isRTL ? '!text-right' : '!text-left')} dir={dir}>
                {/* Header */}
                <div className={cn("flex items-center justify-between border-b pb-4", flexDirection)}>
                    <div className={cn(isRTL ? '!text-right' : '!text-left')}>
                        <h1 className={cn("text-3xl font-bold text-foreground", isRTL ? '!text-right' : '!text-left')}>{t('edit_governorate')}</h1>
                        <p className={cn("text-muted-foreground mt-1", isRTL ? '!text-right' : '!text-left')}>{t('update_governorate_information')}</p>
                    </div>
                    <div className={cn("flex items-center gap-3", flexDirection)}>
                        <Link href={`/dashboard/governorates/${governorate.id}`}>
                            <Button variant="outline" className={cn("flex items-center gap-2", flexDirection)}>
                                <Eye className={cn("h-4 w-4", iconMargin('md'))} />
                                {t('view')}
                            </Button>
                        </Link>
                        <Link href="/dashboard/governorates">
                            <Button variant="outline" className={cn("flex items-center gap-2", flexDirection)}>
                                <ArrowLeft className={cn("h-4 w-4", isRTL && 'rotate-180')} />
                                {t('back')}
                            </Button>
                        </Link>
                    </div>
                </div>

                <form onSubmit={submit} className={cn("space-y-6", isRTL ? '!text-right' : '!text-left')} dir={dir}>
                    <div className={cn("space-y-2", isRTL ? '!text-right' : '!text-left')}>
                        <Label htmlFor="name_en" className={cn(isRTL ? '!text-right' : '!text-left')}>
                            {isRTL ? <><span className="text-red-500">*</span> {t('name_en')}</> : <>{t('name_en')} <span className="text-red-500">*</span></>}
                        </Label>
                        <Input
                            id="name_en"
                            type="text"
                            value={data.name_en}
                            onChange={(e) => setData('name_en', e.target.value)}
                            placeholder={t('enter_name_en')}
                            dir={getFieldDir('text')}
                            className={cn(errors.name_en ? 'border-red-500' : '', getInputTextAlign('text'))}
                            required
                        />
                        {errors.name_en && (
                            <p className={cn("text-sm text-red-500", isRTL ? '!text-right' : '!text-left')} dir={dir}>{t(errors.name_en) || errors.name_en}</p>
                        )}
                    </div>

                    <div className={cn("space-y-2", isRTL ? '!text-right' : '!text-left')}>
                        <Label htmlFor="name_ar" className={cn(isRTL ? '!text-right' : '!text-left')}>
                            {isRTL ? <><span className="text-red-500">*</span> {t('name_ar')}</> : <>{t('name_ar')} <span className="text-red-500">*</span></>}
                        </Label>
                        <Input
                            id="name_ar"
                            type="text"
                            value={data.name_ar}
                            onChange={(e) => setData('name_ar', e.target.value)}
                            placeholder={t('enter_name_ar')}
                            dir={getFieldDir('text')}
                            className={cn(errors.name_ar ? 'border-red-500' : '', getInputTextAlign('text'))}
                            required
                        />
                        {errors.name_ar && (
                            <p className={cn("text-sm text-red-500", isRTL ? '!text-right' : '!text-left')} dir={dir}>{t(errors.name_ar) || errors.name_ar}</p>
                        )}
                    </div>

                    <div className={cn("flex items-center justify-between gap-2 pt-4 border-t", flexDirection)}>
                        <Label htmlFor="is_active" className={cn("flex flex-col", isRTL ? '!text-right' : '!text-left')}>
                            <span>{t('is_active')}</span>
                        </Label>
                        <Switch
                            id="is_active"
                            checked={data.is_active}
                            onCheckedChange={(checked) => setData('is_active', checked)}
                        />
                    </div>

                    <div className={cn("flex items-center gap-3 pt-4 border-t", flexDirection, isRTL ? 'justify-start' : 'justify-end')}>
                        <Button type="submit" disabled={processing}>
                            {processing ? t('updating') : t('update_governorate')}
                        </Button>
                        <Link href="/dashboard/governorates">
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

