import { type BreadcrumbItem } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useRTLInit } from '@/hooks/use-rtl-init';
import { useTranslation } from '@/hooks/use-translation';
import { useRTL } from '@/hooks/use-rtl';
import AppLayout from '@/layouts/app-layout';
import { index as dashboard } from '@/routes/dashboard';
import { Head, Link, useForm, usePage } from '@inertiajs/react';
import { ArrowLeft, Eye } from 'lucide-react';
import { FormEventHandler, useEffect } from 'react';
import { customToast } from '@/components/ui/custom-toast';
import { usePermissions } from '@/hooks/use-permissions';
import { cn } from '@/lib/utils';
import { type SharedData } from '@/types';

interface Clinic {
    id: number;
    name: string;
}

interface EditReviewProps {
    review: {
        id: number;
        rating: number;
        comment: string;
        status: 'pending' | 'approved' | 'rejected';
        rejection_reason?: string | null;
        clinic_id?: number | null;
        user?: {
            id: number;
            name: string;
        } | null;
        clinic?: {
            id: number;
            name_en?: string;
            name_ar?: string;
        } | null;
    };
    clinics?: Clinic[];
    isClinicRole?: boolean;
}

export default function EditReview({ review, clinics = [], isClinicRole: isClinicRoleProp }: EditReviewProps) {
    useRTLInit();
    const { t, locale } = useTranslation();
    const page = usePage<SharedData>();
    const { locale: pageLocale } = page.props;
    const isRTL = pageLocale === 'ar';
    const dir = isRTL ? 'rtl' : 'ltr';
    const { flexDirection, iconMargin, getFieldDir, getInputTextAlign } = useRTL();

    const breadcrumbs: BreadcrumbItem[] = [
        {
            title: t('dashboard'),
            href: dashboard.url(),
        },
        {
            title: t('reviews_management'),
            href: '/dashboard/reviews',
        },
        {
            title: t('edit_review'),
            href: '#',
        },
    ];
    const { flash } = page.props;
    const { isClinic, isClinicManager } = usePermissions();
    const isClinicRole = isClinicRoleProp ?? (isClinic || isClinicManager);

    // Flash messages
    useEffect(() => {
        if (flash?.success) {
            customToast.success(flash.success);
        }
        if (flash?.error) {
            customToast.error(flash.error);
        }
    }, [flash]);

    // Get current clinic_id from review (either from clinic relationship or clinic_id field)
    const currentClinicId = review.clinic_id || review.clinic?.id;

    const { data, setData, patch, processing, errors } = useForm({
        rating: review.rating.toString(),
        comment: review.comment || '',
        status: review.status,
        rejection_reason: review.rejection_reason || '',
        clinic_id: currentClinicId ? currentClinicId.toString() : '',
    });

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        patch(`/dashboard/reviews/${review.id}`, {
            onSuccess: () => {
                // Flash message will be shown via useEffect
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
            },
        });
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`${t('edit_review')} - #${review.id}`} />

            <div className={cn("flex h-full flex-1 flex-col gap-6 overflow-x-auto rounded-xl bg-card dark:bg-card p-6 border border-border", isRTL ? '!text-right' : '!text-left')} dir={dir}>
                <div className={cn("flex items-center justify-between border-b pb-4", flexDirection)}>
                    <div className={isRTL ? '!text-right' : '!text-left'}>
                        <h1 className={cn("text-3xl font-bold text-foreground", isRTL ? '!text-right' : '!text-left')}>{t('edit_review')}</h1>
                        <p className={cn("text-muted-foreground mt-1", isRTL ? '!text-right' : '!text-left')}>{t('update_review_information')}</p>
                    </div>
                    <div className={cn("flex items-center gap-3", flexDirection)}>
                        <Link href={`/dashboard/reviews/${review.id}`}>
                            <Button variant="outline" className={cn("flex items-center gap-2", flexDirection)}>
                                <Eye className={cn("h-4 w-4", iconMargin('md'))} />
                                {t('view')}
                            </Button>
                        </Link>
                        <Link href="/dashboard/reviews">
                            <Button variant="outline" className={cn("flex items-center gap-2", flexDirection)}>
                                <ArrowLeft className={cn("h-4 w-4", isRTL && 'rotate-180')} />
                                {t('back')}
                            </Button>
                        </Link>
                    </div>
                </div>

                <form onSubmit={submit} className={cn("space-y-6", isRTL ? '!text-right' : '!text-left')} dir={dir}>
                    <div className={cn("bg-gray-50 dark:bg-gray-800 rounded-lg p-4", isRTL ? '!text-right' : '!text-left')}>
                        <p className={cn("text-sm text-muted-foreground", isRTL ? '!text-right' : '!text-left')}>{t('user')}</p>
                        <p className={cn("font-medium", isRTL ? '!text-right' : '!text-left')} dir={dir}>{review.user?.name || t('unknown')}</p>
                    </div>

                    {clinics.length > 0 && (
                        <div className={cn("space-y-2", isRTL ? '!text-right' : '!text-left')}>
                            <Label htmlFor="clinic_id" className={isRTL ? '!text-right' : '!text-left'}>
                                {t('clinic')} {isClinicRole && <span className="text-red-500">*</span>}
                            </Label>
                            <Select 
                                value={data.clinic_id || ''} 
                                onValueChange={(value) => setData('clinic_id', value)}
                                required={isClinicRole}
                            >
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
                            {errors.clinic_id && (
                                <p className={cn("text-sm text-red-500", isRTL ? '!text-right' : '!text-left')} dir={dir}>{errors.clinic_id}</p>
                            )}
                        </div>
                    )}

                    <div className={cn("space-y-2", isRTL ? '!text-right' : '!text-left')}>
                        <Label htmlFor="rating" className={isRTL ? '!text-right' : '!text-left'}>
                            {t('rating')} <span className="text-red-500">*</span>
                        </Label>
                        <Select value={data.rating} onValueChange={(value) => setData('rating', value)}>
                            <SelectTrigger className={cn(errors.rating ? 'border-red-500' : '', isRTL ? '!text-right' : '!text-left')} dir={dir}>
                                <SelectValue placeholder={t('select_rating')} />
                            </SelectTrigger>
                            <SelectContent dir={dir}>
                                <SelectItem value="1">1 ⭐</SelectItem>
                                <SelectItem value="2">2 ⭐⭐</SelectItem>
                                <SelectItem value="3">3 ⭐⭐⭐</SelectItem>
                                <SelectItem value="4">4 ⭐⭐⭐⭐</SelectItem>
                                <SelectItem value="5">5 ⭐⭐⭐⭐⭐</SelectItem>
                            </SelectContent>
                        </Select>
                        {errors.rating && (
                            <p className={cn("text-sm text-red-500", isRTL ? '!text-right' : '!text-left')} dir={dir}>{errors.rating}</p>
                        )}
                    </div>

                    <div className={cn("space-y-2", isRTL ? '!text-right' : '!text-left')}>
                        <Label htmlFor="comment" className={isRTL ? '!text-right' : '!text-left'}>{t('comment')}</Label>
                        <Textarea
                            id="comment"
                            value={data.comment}
                            onChange={(e) => setData('comment', e.target.value)}
                            placeholder={t('enter_comment')}
                            dir={getFieldDir('textarea')}
                            className={cn(errors.comment ? 'border-red-500' : '', getInputTextAlign('textarea'))}
                            rows={5}
                        />
                        {errors.comment && (
                            <p className={cn("text-sm text-red-500", isRTL ? '!text-right' : '!text-left')} dir={dir}>{errors.comment}</p>
                        )}
                    </div>

                    <div className={cn("space-y-2", isRTL ? '!text-right' : '!text-left')}>
                        <Label htmlFor="status" className={isRTL ? '!text-right' : '!text-left'}>
                            {t('status')} <span className="text-red-500">*</span>
                        </Label>
                        <Select value={data.status} onValueChange={(value) => setData('status', value as 'pending' | 'approved' | 'rejected')}>
                            <SelectTrigger className={cn(errors.status ? 'border-red-500' : '', isRTL ? '!text-right' : '!text-left')} dir={dir}>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent dir={dir}>
                                <SelectItem value="pending">{t('pending')}</SelectItem>
                                <SelectItem value="approved">{t('approved')}</SelectItem>
                                <SelectItem value="rejected">{t('rejected')}</SelectItem>
                            </SelectContent>
                        </Select>
                        {errors.status && (
                            <p className={cn("text-sm text-red-500", isRTL ? '!text-right' : '!text-left')} dir={dir}>{errors.status}</p>
                        )}
                    </div>

                    {data.status === 'rejected' && (
                        <div className={cn("space-y-2", isRTL ? '!text-right' : '!text-left')}>
                            <Label htmlFor="rejection_reason" className={isRTL ? '!text-right' : '!text-left'}>
                                {t('rejection_reason')} <span className="text-red-500">*</span>
                            </Label>
                            <Textarea
                                id="rejection_reason"
                                value={data.rejection_reason}
                                onChange={(e) => setData('rejection_reason', e.target.value)}
                                placeholder={t('enter_rejection_reason')}
                                dir={getFieldDir('textarea')}
                                className={cn(errors.rejection_reason ? 'border-red-500' : '', getInputTextAlign('textarea'))}
                                rows={3}
                            />
                            {errors.rejection_reason && (
                                <p className={cn("text-sm text-red-500", isRTL ? '!text-right' : '!text-left')} dir={dir}>{errors.rejection_reason}</p>
                            )}
                        </div>
                    )}

                    <div className={cn("flex items-center gap-3 pt-4 border-t", flexDirection, isRTL ? 'justify-start' : 'justify-end')}>
                        <Button type="submit" disabled={processing}>
                            {processing ? t('updating') : t('update_review')}
                        </Button>
                        <Link href="/dashboard/reviews">
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

