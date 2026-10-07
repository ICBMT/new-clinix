import { type BreadcrumbItem } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { useTranslation } from '@/hooks/use-translation';
import { useRTL } from '@/hooks/use-rtl';
import { useRTLInit } from '@/hooks/use-rtl-init';
import AppLayout from '@/layouts/app-layout';
import { index as dashboard } from '@/routes/dashboard';
import { Head, Link, useForm, usePage } from '@inertiajs/react';
import { ArrowLeft } from 'lucide-react';
import { FormEventHandler, useEffect } from 'react';
import { customToast } from '@/components/ui/custom-toast';
import { cn } from '@/lib/utils';
import { type SharedData } from '@/types';

export default function CreateFaq() {
    useRTLInit();
    const { t } = useTranslation();
    const page = usePage<SharedData>();
    const { locale: pageLocale } = page.props;
    const isRTL = pageLocale === 'ar';
    const dir = isRTL ? 'rtl' : 'ltr';
    const { flexDirection, getFieldDir, getInputTextAlign, iconMargin } = useRTL();
    const { flash } = page.props;

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
            title: t('faq_management'),
            href: '/dashboard/faqs',
        },
        {
            title: t('create_faq'),
            href: '/dashboard/faqs/create',
        },
    ];

    const { data, setData, post, processing, errors } = useForm({
        question_en: '',
        question_ar: '',
        answer_en: '',
        answer_ar: '',
        is_active: true,
    });

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        post('/dashboard/faqs', {
            onSuccess: () => {
                customToast.success(t('faq_created_successfully'));
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
            },
        });
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={t('create_faq')} />

            <div className={cn("flex h-full flex-1 flex-col gap-6 overflow-x-auto rounded-xl bg-card dark:bg-card p-6 border border-border", isRTL ? '!text-right' : '!text-left')} dir={dir}>
                {/* Header */}
                <div className={cn("flex items-center justify-between border-b pb-4", flexDirection)}>
                    <div className={cn(isRTL ? '!text-right' : '!text-left')}>
                        <h1 className={cn("text-3xl font-bold text-foreground", isRTL ? '!text-right' : '!text-left')}>{t('create_faq')}</h1>
                        <p className={cn("text-muted-foreground mt-1", isRTL ? '!text-right' : '!text-left')}>{t('add_new_faq_description')}</p>
                    </div>
                    
                    <Link href="/dashboard/faqs">
                        <Button variant="outline" className={cn("flex items-center gap-2", flexDirection)}>
                            <ArrowLeft className={cn("h-4 w-4", isRTL && 'rotate-180', iconMargin('md'))} />
                            {t('back')}
                        </Button>
                    </Link>
                </div>

                {/* Form */}
                <form onSubmit={submit} className={cn("space-y-6", isRTL ? '!text-right' : '!text-left')} dir={dir}>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className={cn("space-y-2", isRTL ? '!text-right' : '!text-left')} dir={dir}>
                            <Label htmlFor="question_en" className={cn(isRTL ? '!text-right' : '!text-left')} dir={dir}>
                                {t('question_en')} <span className="text-red-500">*</span>
                            </Label>
                            <Input
                                id="question_en"
                                type="text"
                                value={data.question_en}
                                onChange={(e) => setData('question_en', e.target.value)}
                                placeholder={t('enter_question_en') || t('enter_question') + ' (English)'}
                                className={cn(errors.question_en ? 'border-red-500' : '', getInputTextAlign())}
                                dir={getFieldDir('text')}
                                required
                            />
                            {errors.question_en && (
                                <p className={cn("text-sm text-red-500", isRTL ? '!text-right' : '!text-left')} dir={dir}>{t(errors.question_en) || errors.question_en}</p>
                            )}
                        </div>

                        <div className={cn("space-y-2", isRTL ? '!text-right' : '!text-left')} dir={dir}>
                            <Label htmlFor="question_ar" className={cn(isRTL ? '!text-right' : '!text-left')} dir={dir}>
                                {t('question_ar')} <span className="text-red-500">*</span>
                            </Label>
                            <Input
                                id="question_ar"
                                type="text"
                                value={data.question_ar}
                                onChange={(e) => setData('question_ar', e.target.value)}
                                placeholder={t('enter_question_ar') || t('enter_question') + ' (Arabic)'}
                                dir="rtl"
                                className={cn(errors.question_ar ? 'border-red-500' : '', getInputTextAlign())}
                                required
                            />
                            {errors.question_ar && (
                                <p className={cn("text-sm text-red-500", isRTL ? '!text-right' : '!text-left')} dir={dir}>{t(errors.question_ar) || errors.question_ar}</p>
                            )}
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className={cn("space-y-2", isRTL ? '!text-right' : '!text-left')} dir={dir}>
                            <Label htmlFor="answer_en" className={cn(isRTL ? '!text-right' : '!text-left')} dir={dir}>
                                {t('answer_en')} <span className="text-red-500">*</span>
                            </Label>
                            <Textarea
                                id="answer_en"
                                value={data.answer_en}
                                onChange={(e) => setData('answer_en', e.target.value)}
                                placeholder={t('enter_answer_en') || t('enter_answer') + ' (English)'}
                                className={cn(errors.answer_en ? 'border-red-500' : '', getInputTextAlign())}
                                dir={getFieldDir('textarea')}
                                rows={6}
                                required
                            />
                            {errors.answer_en && (
                                <p className={cn("text-sm text-red-500", isRTL ? '!text-right' : '!text-left')} dir={dir}>{t(errors.answer_en) || errors.answer_en}</p>
                            )}
                        </div>

                        <div className={cn("space-y-2", isRTL ? '!text-right' : '!text-left')} dir={dir}>
                            <Label htmlFor="answer_ar" className={cn(isRTL ? '!text-right' : '!text-left')} dir={dir}>
                                {t('answer_ar')} <span className="text-red-500">*</span>
                            </Label>
                            <Textarea
                                id="answer_ar"
                                value={data.answer_ar}
                                onChange={(e) => setData('answer_ar', e.target.value)}
                                placeholder={t('enter_answer_ar') || t('enter_answer') + ' (Arabic)'}
                                dir="rtl"
                                className={cn(errors.answer_ar ? 'border-red-500' : '', getInputTextAlign())}
                                rows={6}
                                required
                            />
                            {errors.answer_ar && (
                                <p className={cn("text-sm text-red-500", isRTL ? '!text-right' : '!text-left')} dir={dir}>{t(errors.answer_ar) || errors.answer_ar}</p>
                            )}
                        </div>
                    </div>

                    <div className={cn("space-y-2", isRTL ? '!text-right' : '!text-left')} dir={dir}>
                        <div className={cn("flex items-center gap-2", flexDirection)}>
                            <Checkbox
                                id="is_active"
                                checked={data.is_active}
                                onCheckedChange={(checked) => setData('is_active', checked as boolean)}
                            />
                            <Label htmlFor="is_active" className={cn("cursor-pointer", isRTL ? '!text-right' : '!text-left')} dir={dir}>{t('active')}</Label>
                        </div>
                    </div>

                    <div className={cn("flex items-center gap-3 pt-4 border-t", flexDirection)}>
                        <Button type="submit" disabled={processing}>
                            {processing ? t('creating') : t('create_faq')}
                        </Button>
                        <Link href="/dashboard/faqs">
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

