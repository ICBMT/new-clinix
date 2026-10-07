import { type BreadcrumbItem } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { PhoneInput } from '@/components/phone-input';
import { FormPageLayout, FormContent, PageHeader } from '@/components/page-layouts';
import { useTranslation } from '@/hooks/use-translation';
import { useRTL } from '@/hooks/use-rtl';
import { useRTLInit } from '@/hooks/use-rtl-init';
import AppLayout from '@/layouts/app-layout';
import { index as dashboard } from '@/routes/dashboard';
import { Head, Link, useForm, usePage } from '@inertiajs/react';
import { ArrowLeft, Upload } from 'lucide-react';
import { FormEventHandler, useState } from 'react';
import { cn } from '@/lib/utils';
import { type SharedData } from '@/types';

export default function CreateVendor() {
    useRTLInit();
    const { t, locale } = useTranslation();
    const page = usePage<SharedData>();
    const { locale: pageLocale } = page.props;
    const isRTL = pageLocale === 'ar';
    const dir = isRTL ? 'rtl' : 'ltr';
    const { flexDirection, iconMargin, getFieldDir, getInputTextAlign } = useRTL();
    const [businessLicenseFile, setBusinessLicenseFile] = useState<File | null>(null);
    const [idDocumentFile, setIdDocumentFile] = useState<File | null>(null);

    const breadcrumbs: BreadcrumbItem[] = [
        {
            title: t('dashboard'),
            href: dashboard.url(),
        },
        {
            title: t('vendors_management'),
            href: '/dashboard/vendors',
        },
        {
            title: t('create_vendor'),
            href: '/dashboard/vendors/create',
        },
    ];

    const { data, setData, post, processing, errors } = useForm({
        name: '',
        email: '',
        phone: '',
        password: '',
        password_confirmation: '',
        description_en: '',
        description_ar: '',
        business_license: null as File | null,
        id_document: null as File | null,
    });

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        post('/dashboard/vendors');
    };

    const handleBusinessLicenseChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0] || null;
        setBusinessLicenseFile(file);
        setData('business_license', file);
    };

    const handleIdDocumentChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0] || null;
        setIdDocumentFile(file);
        setData('id_document', file);
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={t('create_vendor')} />

            <FormPageLayout>
                <PageHeader
                    title={t('create_vendor')}
                    description={t('create_new_vendor_account')}
                    actions={
                        <Link href="/dashboard/vendors">
                            <Button variant="outline" className={cn("flex items-center gap-2", flexDirection)}>
                                <ArrowLeft className={cn("h-4 w-4", isRTL && 'rotate-180', iconMargin('md'))} />
                                {t('back')}
                            </Button>
                        </Link>
                    }
                />

                {/* Form */}
                <FormContent onSubmit={submit} className="max-w-4xl">
                    {/* Basic Information */}
                    <div className={cn("space-y-4", isRTL ? '!text-right' : '!text-left')}>
                        <h3 className={cn("text-lg font-semibold text-foreground", isRTL ? '!text-right' : '!text-left')}>{t('basic_information')}</h3>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {/* Company Name */}
                            <div className={cn("space-y-2", isRTL ? '!text-right' : '!text-left')}>
                                <Label htmlFor="name" className={cn(isRTL ? '!text-right' : '!text-left')}>
                                    {isRTL ? <><span className="text-red-500">*</span> {t('company_name')}</> : <>{t('company_name')} <span className="text-red-500">*</span></>}
                                </Label>
                                <Input
                                    id="name"
                                    type="text"
                                    value={data.name}
                                    onChange={(e) => setData('name', e.target.value)}
                                    placeholder={t('enter_company_name')}
                                    dir={getFieldDir('text')}
                                    className={cn(errors.name ? 'border-red-500' : '', getInputTextAlign('text'))}
                                    required
                                />
                                {errors.name && (
                                    <p className={cn("text-sm text-red-500", isRTL ? '!text-right' : '!text-left')} dir={dir}>{t(errors.name) || errors.name}</p>
                                )}
                            </div>

                            {/* Email */}
                            <div className={cn("space-y-2", isRTL ? '!text-right' : '!text-left')}>
                                <Label htmlFor="email" className={cn(isRTL ? '!text-right' : '!text-left')}>
                                    {isRTL ? <><span className="text-red-500">*</span> {t('email')}</> : <>{t('email')} <span className="text-red-500">*</span></>}
                                </Label>
                                <Input
                                    id="email"
                                    type="email"
                                    value={data.email}
                                    onChange={(e) => setData('email', e.target.value)}
                                    placeholder={t('enter_email')}
                                    dir={getFieldDir('email')}
                                    className={cn(errors.email ? 'border-red-500' : '', getInputTextAlign('email'))}
                                    required
                                />
                                {errors.email && (
                                    <p className={cn("text-sm text-red-500", isRTL ? '!text-right' : '!text-left')} dir={dir}>{t(errors.email) || errors.email}</p>
                                )}
                            </div>

                            {/* Phone Number */}
                            <div className={cn("space-y-2", isRTL ? '!text-right' : '!text-left')}>
                                <Label htmlFor="phone" className={cn(isRTL ? '!text-right' : '!text-left')}>
                                    {isRTL ? <><span className="text-red-500">*</span> {t('phone_number')}</> : <>{t('phone_number')} <span className="text-red-500">*</span></>}
                                </Label>
                                <PhoneInput
                                    id="phone"
                                    value={data.phone}
                                    onChange={(value) => setData('phone', value)}
                                    className={cn(errors.phone ? 'border-red-500' : '', getInputTextAlign('phone'))}
                                    required
                                />
                                <p className={cn("text-sm text-muted-foreground", isRTL ? '!text-right' : '!text-left')} dir={dir}>{t('phone_format_hint')}</p>
                                {errors.phone && (
                                    <p className={cn("text-sm text-red-500", isRTL ? '!text-right' : '!text-left')} dir={dir}>{t(errors.phone) || errors.phone}</p>
                                )}
                            </div>
                        </div>

                        {/* Description */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className={cn("space-y-2", isRTL ? '!text-right' : '!text-left')}>
                                <Label htmlFor="description_en" className={cn(isRTL ? '!text-right' : '!text-left')}>{t('description_english')}</Label>
                                <Textarea
                                    id="description_en"
                                    value={data.description_en}
                                    onChange={(e) => setData('description_en', e.target.value)}
                                    placeholder={t('enter_description_english')}
                                    rows={4}
                                    dir={getFieldDir('textarea')}
                                    className={cn(errors.description_en ? 'border-red-500' : '', getInputTextAlign('textarea'))}
                                />
                                {errors.description_en && (
                                    <p className={cn("text-sm text-red-500", isRTL ? '!text-right' : '!text-left')} dir={dir}>{t(errors.description_en) || errors.description_en}</p>
                                )}
                            </div>

                            <div className={cn("space-y-2", isRTL ? '!text-right' : '!text-left')}>
                                <Label htmlFor="description_ar" className={cn(isRTL ? '!text-right' : '!text-left')}>{t('description_arabic')}</Label>
                                <Textarea
                                    id="description_ar"
                                    value={data.description_ar}
                                    onChange={(e) => setData('description_ar', e.target.value)}
                                    placeholder={t('enter_description_arabic')}
                                    rows={4}
                                    dir="rtl"
                                    className={cn(errors.description_ar ? 'border-red-500' : '', getInputTextAlign('textarea'))}
                                />
                                {errors.description_ar && (
                                    <p className={cn("text-sm text-red-500", isRTL ? '!text-right' : '!text-left')} dir={dir}>{t(errors.description_ar) || errors.description_ar}</p>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Password Section */}
                    <div className={cn("pt-4 border-t space-y-4", isRTL ? '!text-right' : '!text-left')}>
                        <h3 className={cn("text-lg font-semibold text-foreground", isRTL ? '!text-right' : '!text-left')}>{t('password')}</h3>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {/* Password */}
                            <div className={cn("space-y-2", isRTL ? '!text-right' : '!text-left')}>
                                <Label htmlFor="password" className={cn(isRTL ? '!text-right' : '!text-left')}>
                                    {isRTL ? <><span className="text-red-500">*</span> {t('password')}</> : <>{t('password')} <span className="text-red-500">*</span></>}
                                </Label>
                                <Input
                                    id="password"
                                    type="password"
                                    value={data.password}
                                    onChange={(e) => setData('password', e.target.value)}
                                    placeholder={t('enter_password')}
                                    dir={getFieldDir('text')}
                                    className={cn(errors.password ? 'border-red-500' : '', getInputTextAlign('text'))}
                                    required
                                />
                                {errors.password && (
                                    <p className={cn("text-sm text-red-500", isRTL ? '!text-right' : '!text-left')} dir={dir}>{t(errors.password) || errors.password}</p>
                                )}
                            </div>

                            {/* Confirm Password */}
                            <div className={cn("space-y-2", isRTL ? '!text-right' : '!text-left')}>
                                <Label htmlFor="password_confirmation" className={cn(isRTL ? '!text-right' : '!text-left')}>
                                    {isRTL ? <><span className="text-red-500">*</span> {t('confirm_password')}</> : <>{t('confirm_password')} <span className="text-red-500">*</span></>}
                                </Label>
                                <Input
                                    id="password_confirmation"
                                    type="password"
                                    value={data.password_confirmation}
                                    onChange={(e) => setData('password_confirmation', e.target.value)}
                                    placeholder={t('enter_password')}
                                    dir={getFieldDir('text')}
                                    className={cn(errors.password_confirmation ? 'border-red-500' : '', getInputTextAlign('text'))}
                                    required
                                />
                                {errors.password_confirmation && (
                                    <p className={cn("text-sm text-red-500", isRTL ? '!text-right' : '!text-left')} dir={dir}>{t(errors.password_confirmation) || errors.password_confirmation}</p>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Documents Section */}
                    <div className={cn("pt-4 border-t space-y-4", isRTL ? '!text-right' : '!text-left')}>
                        <h3 className={cn("text-lg font-semibold text-foreground", isRTL ? '!text-right' : '!text-left')}>{t('documents')}</h3>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {/* Business License */}
                            <div className={cn("space-y-2", isRTL ? '!text-right' : '!text-left')}>
                                <Label htmlFor="business_license" className={cn(isRTL ? '!text-right' : '!text-left')}>{t('business_license')}</Label>
                                <div className={cn("flex items-center gap-2", flexDirection)}>
                                    <Input
                                        id="business_license"
                                        type="file"
                                        onChange={handleBusinessLicenseChange}
                                        accept=".pdf,.jpg,.jpeg,.png"
                                        className={errors.business_license ? 'border-red-500' : ''}
                                    />
                                    {businessLicenseFile && (
                                        <span className={cn("text-sm text-muted-foreground", isRTL ? '!text-right' : '!text-left')}>{businessLicenseFile.name}</span>
                                    )}
                                </div>
                                <p className={cn("text-sm text-muted-foreground", isRTL ? '!text-right' : '!text-left')} dir={dir}>{t('accepted_formats')}: PDF, JPG, PNG (Max: 2MB)</p>
                                {errors.business_license && (
                                    <p className={cn("text-sm text-red-500", isRTL ? '!text-right' : '!text-left')} dir={dir}>{t(errors.business_license) || errors.business_license}</p>
                                )}
                            </div>

                            {/* ID Document */}
                            <div className={cn("space-y-2", isRTL ? '!text-right' : '!text-left')}>
                                <Label htmlFor="id_document" className={cn(isRTL ? '!text-right' : '!text-left')}>{t('id_document')}</Label>
                                <div className={cn("flex items-center gap-2", flexDirection)}>
                                    <Input
                                        id="id_document"
                                        type="file"
                                        onChange={handleIdDocumentChange}
                                        accept=".pdf,.jpg,.jpeg,.png"
                                        className={errors.id_document ? 'border-red-500' : ''}
                                    />
                                    {idDocumentFile && (
                                        <span className={cn("text-sm text-muted-foreground", isRTL ? '!text-right' : '!text-left')}>{idDocumentFile.name}</span>
                                    )}
                                </div>
                                <p className={cn("text-sm text-muted-foreground", isRTL ? '!text-right' : '!text-left')} dir={dir}>{t('accepted_formats')}: PDF, JPG, PNG (Max: 2MB)</p>
                                {errors.id_document && (
                                    <p className={cn("text-sm text-red-500", isRTL ? '!text-right' : '!text-left')} dir={dir}>{t(errors.id_document) || errors.id_document}</p>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Actions */}
                    <div className={cn("flex items-center gap-3 pt-4 border-t", flexDirection)}>
                        <Button type="submit" disabled={processing}>
                            {processing ? t('creating') : t('create_vendor')}
                        </Button>
                        <Link href="/dashboard/vendors">
                            <Button type="button" variant="outline">
                                {t('cancel')}
                            </Button>
                        </Link>
                    </div>
                </FormContent>
            </FormPageLayout>
        </AppLayout>
    );
}

