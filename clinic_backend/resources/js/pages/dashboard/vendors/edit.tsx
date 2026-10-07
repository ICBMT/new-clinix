import { type BreadcrumbItem } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { UserCard } from '@/components/user-card';
import { Badge } from '@/components/ui/badge';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { PhoneInput } from '@/components/phone-input';
import { FormPageLayout, FormContent, PageHeader } from '@/components/page-layouts';
import { useTranslation } from '@/hooks/use-translation';
import { useRTL } from '@/hooks/use-rtl';
import { useRTLInit } from '@/hooks/use-rtl-init';
import AppLayout from '@/layouts/app-layout';
import { index as dashboard } from '@/routes/dashboard';
import { Head, Link, useForm, usePage } from '@inertiajs/react';
import { cn } from '@/lib/utils';
import { ArrowLeft, Eye, Download } from 'lucide-react';
import { FormEventHandler } from 'react';
import { type SharedData } from '@/types';

interface EditVendorProps {
    vendor: {
        id: number;
        name: string;
        email: string;
        phone?: string;
        email_verified_at?: string | null;
        phone_verified_at?: string | null;
        verification_status: 'pending' | 'approved' | 'rejected';
        description_en?: string;
        description_ar?: string;
        business_license_path?: string;
        id_document_path?: string;
        rejection_reason?: string;
    };
}

export default function EditVendor({ vendor }: EditVendorProps) {
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
            title: t('vendors_management'),
            href: '/dashboard/vendors',
        },
        {
            title: t('edit_vendor'),
            href: '#',
        },
    ];

    const { data, setData, post, processing, errors } = useForm({
        name: vendor.name || '',
        email: vendor.email || '',
        phone: vendor.phone || '',
        password: '',
        password_confirmation: '',
        description_en: vendor.description_en || '',
        description_ar: vendor.description_ar || '',
        verification_status: vendor.verification_status || 'pending',
        rejection_reason: vendor.rejection_reason || '',
        business_license: null as File | null,
        id_document: null as File | null,
        _method: 'PATCH',
    });

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        post(`/dashboard/vendors/${vendor.id}`);
    };

    const handleBusinessLicenseChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0] || null;
        setData('business_license', file);
    };

    const handleIdDocumentChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0] || null;
        setData('id_document', file);
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`${t('edit_vendor')} - ${vendor.name}`} />

            <FormPageLayout>
                <PageHeader
                    title={t('edit_vendor')}
                    description={t('update_vendor_information')}
                    actions={
                        <div className={cn("flex items-center gap-3", flexDirection)}>
                            <Link href={`/dashboard/vendors/${vendor.id}`}>
                                <Button variant="outline" className={cn("flex items-center gap-2", flexDirection)}>
                                    <Eye className={cn("h-4 w-4", iconMargin('md'))} />
                                    {t('view')}
                                </Button>
                            </Link>
                            <Link href="/dashboard/vendors">
                                <Button variant="outline" className={cn("flex items-center gap-2", flexDirection)}>
                                    <ArrowLeft className={cn("h-4 w-4", isRTL && 'rotate-180', iconMargin('md'))} />
                                    {t('back')}
                                </Button>
                            </Link>
                        </div>
                    }
                />

                {/* Vendor Card */}
                <div className={cn("bg-gray-50 dark:bg-gray-800 rounded-lg p-6 flex items-center justify-between", flexDirection)}>
                    <UserCard user={vendor} showVerificationBadges={true} />
                    <Badge 
                        variant={
                            vendor.verification_status === 'approved' ? 'default' : 
                            vendor.verification_status === 'pending' ? 'secondary' : 'destructive'
                        }
                        className={cn(
                            "text-base px-4 py-1",
                            vendor.verification_status === 'approved' ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 border-green-200 dark:border-green-800' :
                            vendor.verification_status === 'pending' ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300 border-yellow-200 dark:border-yellow-800' :
                            'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300 border-red-200 dark:border-red-800',
                            isRTL ? '!text-right' : '!text-left'
                        )}
                    >
                        {t(vendor.verification_status)}
                    </Badge>
                </div>

                {/* Profile Tab */}
                <Tabs defaultValue="profile" className="w-full">
                    <TabsList className={cn(flexDirection)}>
                        <TabsTrigger value="profile" className={cn(isRTL ? '!text-right' : '!text-left')}>{t('profile')}</TabsTrigger>
                    </TabsList>

                    <TabsContent value="profile" className={cn("space-y-6 mt-6", isRTL ? '!text-right' : '!text-left')}>
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
                                <Label htmlFor="phone" className={cn(isRTL ? '!text-right' : '!text-left')}>{t('phone_number')}</Label>
                                <PhoneInput
                                    id="phone"
                                    value={data.phone}
                                    onChange={(value) => setData('phone', value)}
                                    className={cn(errors.phone ? 'border-red-500' : '', getInputTextAlign('phone'))}
                                />
                                <p className={cn("text-sm text-muted-foreground", isRTL ? '!text-right' : '!text-left')} dir={dir}>{t('phone_format_hint')}</p>
                                {errors.phone && (
                                    <p className={cn("text-sm text-red-500", isRTL ? '!text-right' : '!text-left')} dir={dir}>{t(errors.phone) || errors.phone}</p>
                                )}
                            </div>

                            {/* Verification Status */}
                            <div className={cn("space-y-2", isRTL ? '!text-right' : '!text-left')}>
                                <Label htmlFor="verification_status" className={cn(isRTL ? '!text-right' : '!text-left')}>{t('verification_status')}</Label>
                                <Select
                                    value={data.verification_status}
                                    onValueChange={(value) => setData('verification_status', value as 'pending' | 'approved' | 'rejected')}
                                >
                                    <SelectTrigger className={cn(isRTL ? '!text-right' : '!text-left')}>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="pending" className={cn(isRTL ? '!text-right' : '!text-left')}>{t('pending')}</SelectItem>
                                        <SelectItem value="approved" className={cn(isRTL ? '!text-right' : '!text-left')}>{t('approved')}</SelectItem>
                                        <SelectItem value="rejected" className={cn(isRTL ? '!text-right' : '!text-left')}>{t('rejected')}</SelectItem>
                                    </SelectContent>
                                </Select>
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

                        {/* Rejection Reason */}
                        {data.verification_status === 'rejected' && (
                            <div className={cn("space-y-2", isRTL ? '!text-right' : '!text-left')}>
                                <Label htmlFor="rejection_reason" className={cn(isRTL ? '!text-right' : '!text-left')}>{t('rejection_reason')}</Label>
                                <Textarea
                                    id="rejection_reason"
                                    value={data.rejection_reason}
                                    onChange={(e) => setData('rejection_reason', e.target.value)}
                                    placeholder={t('enter_rejection_reason')}
                                    rows={4}
                                    dir={getFieldDir('textarea')}
                                    className={cn(errors.rejection_reason ? 'border-red-500' : '', getInputTextAlign('textarea'))}
                                />
                                {errors.rejection_reason && (
                                    <p className={cn("text-sm text-red-500", isRTL ? '!text-right' : '!text-left')} dir={dir}>{t(errors.rejection_reason) || errors.rejection_reason}</p>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Password Section */}
                    <div className={cn("pt-6 border-t", isRTL ? '!text-right' : '!text-left')}>
                        <h3 className={cn("text-lg font-semibold text-foreground mb-4", isRTL ? '!text-right' : '!text-left')}>{t('change_password')}</h3>
                        <p className={cn("text-sm text-muted-foreground mb-4", isRTL ? '!text-right' : '!text-left')} dir={dir}>{t('leave_blank_to_keep_current')}</p>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {/* Password */}
                            <div className={cn("space-y-2", isRTL ? '!text-right' : '!text-left')}>
                                <Label htmlFor="password" className={cn(isRTL ? '!text-right' : '!text-left')}>{t('new_password')}</Label>
                                <Input
                                    id="password"
                                    type="password"
                                    value={data.password}
                                    onChange={(e) => setData('password', e.target.value)}
                                    placeholder={t('enter_password')}
                                    dir={getFieldDir('text')}
                                    className={cn(errors.password ? 'border-red-500' : '', getInputTextAlign('text'))}
                                />
                                {errors.password && (
                                    <p className={cn("text-sm text-red-500", isRTL ? '!text-right' : '!text-left')} dir={dir}>{t(errors.password) || errors.password}</p>
                                )}
                            </div>

                            {/* Confirm Password */}
                            <div className={cn("space-y-2", isRTL ? '!text-right' : '!text-left')}>
                                <Label htmlFor="password_confirmation" className={cn(isRTL ? '!text-right' : '!text-left')}>{t('confirm_password')}</Label>
                                <Input
                                    id="password_confirmation"
                                    type="password"
                                    value={data.password_confirmation}
                                    onChange={(e) => setData('password_confirmation', e.target.value)}
                                    placeholder={t('enter_password')}
                                    dir={getFieldDir('text')}
                                    className={cn(errors.password_confirmation ? 'border-red-500' : '', getInputTextAlign('text'))}
                                />
                                {errors.password_confirmation && (
                                    <p className={cn("text-sm text-red-500", isRTL ? '!text-right' : '!text-left')} dir={dir}>{t(errors.password_confirmation) || errors.password_confirmation}</p>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Documents Section */}
                    <div className={cn("pt-6 border-t", isRTL ? '!text-right' : '!text-left')}>
                        <h3 className={cn("text-lg font-semibold text-foreground mb-4", isRTL ? '!text-right' : '!text-left')}>{t('documents')}</h3>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {/* Business License */}
                            <div className={cn("space-y-2", isRTL ? '!text-right' : '!text-left')}>
                                <Label htmlFor="business_license" className={cn(isRTL ? '!text-right' : '!text-left')}>{t('business_license')}</Label>
                                {vendor.business_license_path && (
                                    <div className={cn("mb-2 p-3 bg-gray-50 dark:bg-gray-800 rounded-md flex items-center justify-between", flexDirection)}>
                                        <span className={cn("text-sm text-foreground", isRTL ? '!text-right' : '!text-left')}>{t('current_file_uploaded')}</span>
                                        <Button type="button" variant="outline" size="sm" className={cn("flex items-center gap-2", flexDirection)}>
                                            <Download className={cn("h-4 w-4", iconMargin('md'))} />
                                            {t('download')}
                                        </Button>
                                    </div>
                                )}
                                <Input
                                    id="business_license"
                                    type="file"
                                    onChange={handleBusinessLicenseChange}
                                    accept=".pdf,.jpg,.jpeg,.png"
                                    className={errors.business_license ? 'border-red-500' : ''}
                                />
                                <p className={cn("text-sm text-muted-foreground", isRTL ? '!text-right' : '!text-left')} dir={dir}>{t('accepted_formats')}: PDF, JPG, PNG (Max: 2MB)</p>
                                {errors.business_license && (
                                    <p className={cn("text-sm text-red-500", isRTL ? '!text-right' : '!text-left')} dir={dir}>{t(errors.business_license) || errors.business_license}</p>
                                )}
                            </div>

                            {/* ID Document */}
                            <div className={cn("space-y-2", isRTL ? '!text-right' : '!text-left')}>
                                <Label htmlFor="id_document" className={cn(isRTL ? '!text-right' : '!text-left')}>{t('id_document')}</Label>
                                {vendor.id_document_path && (
                                    <div className={cn("mb-2 p-3 bg-gray-50 dark:bg-gray-800 rounded-md flex items-center justify-between", flexDirection)}>
                                        <span className={cn("text-sm text-foreground", isRTL ? '!text-right' : '!text-left')}>{t('current_file_uploaded')}</span>
                                        <Button type="button" variant="outline" size="sm" className={cn("flex items-center gap-2", flexDirection)}>
                                            <Download className={cn("h-4 w-4", iconMargin('md'))} />
                                            {t('download')}
                                        </Button>
                                    </div>
                                )}
                                <Input
                                    id="id_document"
                                    type="file"
                                    onChange={handleIdDocumentChange}
                                    accept=".pdf,.jpg,.jpeg,.png"
                                    className={errors.id_document ? 'border-red-500' : ''}
                                />
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
                            {processing ? t('updating') : t('update_vendor')}
                        </Button>
                        <Link href="/dashboard/vendors">
                            <Button type="button" variant="outline">
                                {t('cancel')}
                            </Button>
                        </Link>
                    </div>
                </FormContent>
                    </TabsContent>
                </Tabs>
            </FormPageLayout>
        </AppLayout>
    );
}

