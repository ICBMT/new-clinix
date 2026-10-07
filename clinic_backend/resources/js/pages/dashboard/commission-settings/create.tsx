import { BreadcrumbItem } from '@/components/breadcrumb';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { useRTLInit } from '@/hooks/use-rtl-init';
import { useTranslation } from '@/hooks/use-translation';
import { useRTL } from '@/hooks/use-rtl';
import AppLayout from '@/layouts/app-layout';
import { index as dashboard } from '@/routes/dashboard';
import { Head, Link, useForm } from '@inertiajs/react';
import { ArrowLeft } from 'lucide-react';
import { FormEventHandler } from 'react';
import { cn } from '@/lib/utils';

export default function CreateCommissionSetting() {
    useRTLInit();
    const { t, locale } = useTranslation();
    const { isRTL, dir, textAlign, flexDirection, iconMargin, getFieldDir, getInputTextAlign } = useRTL();
    
    const breadcrumbs: BreadcrumbItem[] = [
        {
            title: t('dashboard'),
            href: dashboard.url(),
        },
        {
            title: t('commission_settings'),
            href: '/dashboard/commission-settings',
        },
        {
            title: t('create_setting'),
            href: '/dashboard/commission-settings/create',
        },
    ];

    const { data, setData, post, processing, errors } = useForm({
        vendor_id: '',
        commission_rate: '',
        frequency: 'monthly' as 'weekly' | 'monthly' | 'quarterly' | 'yearly',
        is_default: false,
        is_active: true,
        description: '',
    });

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        post('/dashboard/commission-settings');
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={t('create_setting')} />

            <div className={cn("flex h-full flex-1 flex-col gap-6 overflow-x-auto rounded-xl bg-card dark:bg-card p-6 border border-border", textAlign)} dir={dir}>
                {/* Header */}
                <div className={cn("flex items-center justify-between border-b pb-4", flexDirection)}>
                    <div className={textAlign}>
                        <h1 className={cn("text-3xl font-bold text-foreground", textAlign)}>{t('create_setting')}</h1>
                        <p className={cn("text-muted-foreground mt-1", textAlign)}>{t('add_new_commission_setting')}</p>
                    </div>
                    
                    <Link href="/dashboard/commission-settings">
                        <Button variant="outline" className={cn("flex items-center gap-2", flexDirection)}>
                            <ArrowLeft className={cn("h-4 w-4", isRTL && 'rotate-180', iconMargin('md'))} />
                            {t('back')}
                        </Button>
                    </Link>
                </div>

                <form onSubmit={submit} className={cn("max-w-2xl space-y-6", textAlign)} dir={dir}>
                    <div className={cn("space-y-2", textAlign)}>
                        <Label htmlFor="vendor_id" className={textAlign}>{t('vendor')}</Label>
                        <Input
                            id="vendor_id"
                            type="number"
                            value={data.vendor_id}
                            onChange={(e) => setData('vendor_id', e.target.value)}
                            placeholder={t('leave_empty_for_default_setting')}
                            dir={getFieldDir('number')}
                            className={cn(errors.vendor_id ? 'border-red-500' : '', getInputTextAlign('number'))}
                        />
                        <p className={cn("text-sm text-muted-foreground", textAlign)}>{t('leave_empty_for_default')}</p>
                        {errors.vendor_id && (
                            <p className={cn("text-sm text-red-500", textAlign)} dir={dir}>{errors.vendor_id}</p>
                        )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className={cn("space-y-2", textAlign)}>
                            <Label htmlFor="commission_rate" className={textAlign}>
                                {t('commission_rate')} <span className="text-red-500">*</span>
                            </Label>
                            <Input
                                id="commission_rate"
                                type="number"
                                step="0.01"
                                min="0"
                                max="100"
                                value={data.commission_rate}
                                onChange={(e) => setData('commission_rate', e.target.value)}
                                placeholder="10.00"
                                dir={getFieldDir('number')}
                                className={cn(errors.commission_rate ? 'border-red-500' : '', getInputTextAlign('number'))}
                                required
                            />
                            <p className={cn("text-sm text-muted-foreground", textAlign)}>{t('percentage')}</p>
                            {errors.commission_rate && (
                                <p className={cn("text-sm text-red-500", textAlign)} dir={dir}>{errors.commission_rate}</p>
                            )}
                        </div>

                        <div className={cn("space-y-2", textAlign)}>
                            <Label htmlFor="frequency" className={textAlign}>
                                {t('frequency')} <span className="text-red-500">*</span>
                            </Label>
                            <Select value={data.frequency} onValueChange={(value) => setData('frequency', value as 'weekly' | 'monthly' | 'quarterly' | 'yearly')}>
                                <SelectTrigger className={cn(errors.frequency ? 'border-red-500' : '', textAlign)}>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="weekly">{t('weekly')}</SelectItem>
                                    <SelectItem value="monthly">{t('monthly')}</SelectItem>
                                    <SelectItem value="quarterly">{t('quarterly')}</SelectItem>
                                    <SelectItem value="yearly">{t('yearly')}</SelectItem>
                                </SelectContent>
                            </Select>
                            {errors.frequency && (
                                <p className={cn("text-sm text-red-500", textAlign)} dir={dir}>{errors.frequency}</p>
                            )}
                        </div>
                    </div>

                    <div className={cn("space-y-2", textAlign)}>
                        <Label htmlFor="description" className={textAlign}>{t('description')}</Label>
                        <Textarea
                            id="description"
                            value={data.description}
                            onChange={(e) => setData('description', e.target.value)}
                            placeholder={t('enter_description')}
                            dir={getFieldDir('textarea')}
                            className={cn(errors.description ? 'border-red-500' : '', getInputTextAlign('textarea'))}
                            rows={4}
                        />
                        {errors.description && (
                            <p className={cn("text-sm text-red-500", textAlign)} dir={dir}>{errors.description}</p>
                        )}
                    </div>

                    <div className={cn("space-y-4 pt-4 border-t", textAlign)}>
                        <div className={cn("flex items-center", flexDirection, isRTL ? 'space-x-reverse' : 'space-x-2')}>
                            <Checkbox
                                id="is_default"
                                checked={data.is_default}
                                onCheckedChange={(checked) => setData('is_default', checked as boolean)}
                            />
                            <Label htmlFor="is_default" className={cn("cursor-pointer", textAlign)}>{t('set_as_default')}</Label>
                        </div>

                        <div className={cn("flex items-center", flexDirection, isRTL ? 'space-x-reverse' : 'space-x-2')}>
                            <Checkbox
                                id="is_active"
                                checked={data.is_active}
                                onCheckedChange={(checked) => setData('is_active', checked as boolean)}
                            />
                            <Label htmlFor="is_active" className={cn("cursor-pointer", textAlign)}>{t('active')}</Label>
                        </div>
                    </div>

                    <div className={cn("flex items-center gap-3 pt-4 border-t", flexDirection)}>
                        <Button type="submit" disabled={processing}>
                            {processing ? t('creating') : t('create_setting')}
                        </Button>
                        <Link href="/dashboard/commission-settings">
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

