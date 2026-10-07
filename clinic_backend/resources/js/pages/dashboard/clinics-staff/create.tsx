import { type BreadcrumbItem } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { SearchableSelect, type SearchableSelectOption } from '@/components/ui/searchable-select';
import { SearchableMultiSelect, type SearchableMultiSelectOption } from '@/components/ui/searchable-multi-select';
import { getLocalizedName } from '@/utils/localization';
import { PasswordInput } from '@/components/password-input';
import { PhoneInput } from '@/components/phone-input';
import { useTranslation } from '@/hooks/use-translation';
import { useRTL } from '@/hooks/use-rtl';
import { useRTLInit } from '@/hooks/use-rtl-init';
import AppLayout from '@/layouts/app-layout';
import { index as dashboard } from '@/routes/dashboard';
import { Head, Link, useForm, usePage } from '@inertiajs/react';
import { ArrowLeft } from 'lucide-react';
import { FormEventHandler, useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { cn } from '@/lib/utils';
import { type SharedData } from '@/types';

interface Clinic {
    id: number;
    name_en: string;
    name_ar: string;
    status?: string;
}

interface User {
    id: number;
    name: string;
    email: string;
    phone?: string;
    status?: string;
    created_at?: string;
}

interface CreateStaffProps {
    users?: User[];
}


export default function CreateStaff({ users = [] }: CreateStaffProps) {
    useRTLInit();
    const { t, locale } = useTranslation();
    const page = usePage<SharedData>();
    const { locale: pageLocale } = page.props;
    const auth = page.props.auth;
    const userRoles = auth?.user?.roles || [];
    const isClinicRole = userRoles.includes('clinic') && !userRoles.includes('super-admin');
    const isClinicManagerRole = userRoles.includes('clinic_manager') && !userRoles.includes('super-admin');
    const isRestrictedClinicRole = isClinicRole || isClinicManagerRole;
    const isRTL = pageLocale === 'ar';
    const dir = isRTL ? 'rtl' : 'ltr';
    const { flexDirection, getFieldDir, getInputTextAlign } = useRTL();
    const defaultOwnerId =
        isRestrictedClinicRole && users.length === 1 ? users[0].id.toString() : '';
    const [selectedOwnerId, setSelectedOwnerId] = useState<string>(defaultOwnerId);
    const [availableClinics, setAvailableClinics] = useState<Clinic[]>([]);
    const [loadingClinics, setLoadingClinics] = useState(false);
    const prevOwnerIdRef = useRef<string>('');
    const currentClinicIdsRef = useRef<string[]>([]);
    
    const breadcrumbs: BreadcrumbItem[] = [
        {
            title: t('dashboard'),
            href: dashboard.url(),
        },
        {
            title: t('clinics_staff_management'),
            href: '/dashboard/clinics-staff',
        },
        {
            title: t('create_staff'),
            href: '#',
        },
    ];

    const { data, setData, post, processing, errors } = useForm({
        name: '',
        email: '',
        phone: '',
        password: '',
        password_confirmation: '',
        status: 'active',
        owner_id: defaultOwnerId,
        clinic_ids: [] as string[],
    });

    // Fetch clinics when owner is selected
    useEffect(() => {
        // Reset clinic_ids when owner changes from a value to empty
        if (!selectedOwnerId && prevOwnerIdRef.current) {
            setData('clinic_ids', []);
            currentClinicIdsRef.current = [];
        }
        prevOwnerIdRef.current = selectedOwnerId;

        if (selectedOwnerId) {
            setLoadingClinics(true);
            fetch(`/dashboard/clinics-staff/clinics-by-owner?owner_id=${selectedOwnerId}`)
                .then(response => {
                    if (!response.ok) {
                        throw new Error('Failed to fetch clinics');
                    }
                    return response.json();
                })
                .then(clinics => {
                    // Ensure clinics is an array and filter only approved clinics
                    const clinicsArray = Array.isArray(clinics) ? clinics : [];
                    // Filter to only approved clinics (backend should already do this, but double-check)
                    const approvedClinics = clinicsArray.filter((clinic: Clinic) => !clinic.status || clinic.status === 'approved');
                    setAvailableClinics(approvedClinics);
                    setLoadingClinics(false);
                })
                .catch(error => {
                    console.error('Error fetching clinics:', error);
                    setAvailableClinics([]);
                    setLoadingClinics(false);
                });
        } else {
            setAvailableClinics([]);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [selectedOwnerId]);

    // Convert users to SearchableSelect options (memoized to prevent re-renders)
    const userOptions: SearchableSelectOption[] = useMemo(() => {
        return users.map(user => ({
            value: user.id.toString(),
            label: `${user.name} (${user.email}${user.phone ? ` - ${user.phone}` : ''})`,
        }));
    }, [users]);

    // Convert clinics to SearchableMultiSelect options (memoized to prevent re-renders)
    const clinicOptions: SearchableMultiSelectOption[] = useMemo(() => {
        return availableClinics.map(clinic => ({
            value: clinic.id.toString(),
            label: getLocalizedName(clinic.name_en, clinic.name_ar, locale),
        }));
    }, [availableClinics, locale]);

    // Handle owner selection (single select)
    const handleOwnerChange = useCallback((ownerId: string) => {
        // Only update if the value actually changed
        if (ownerId !== selectedOwnerId) {
            setSelectedOwnerId(ownerId);
            setData('owner_id', ownerId);
            setData('clinic_ids', []); // Reset clinic selection when owner changes
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [selectedOwnerId]);

    // Handle clinic selection change (memoized to prevent re-renders)
    const handleClinicIdsChange = useCallback((values: string[]) => {
        // Compare with the ref value (tracks last value we set)
        const currentIds = currentClinicIdsRef.current;
        
        // Create sorted copies for comparison to handle order differences
        const currentSorted = [...currentIds].sort().join(',');
        const valuesSorted = [...values].sort().join(',');
        
        // Only update if the values actually changed
        if (currentSorted !== valuesSorted) {
            // Update ref BEFORE calling setData to prevent race conditions
            currentClinicIdsRef.current = [...values];
            setData('clinic_ids', values);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        post('/dashboard/clinics-staff');
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={t('create_staff')} />

            <div className={cn("flex h-full flex-1 flex-col gap-6 overflow-x-auto rounded-xl bg-card dark:bg-card p-6 border border-border", isRTL ? '!text-right' : '!text-left')} dir={dir}>
                {/* Header */}
                <div className={cn("flex items-center justify-between border-b pb-4", flexDirection)}>
                    <div className={cn(isRTL ? '!text-right' : '!text-left')}>
                            <h1 className={cn("text-3xl font-bold text-foreground", isRTL ? '!text-right' : '!text-left')}>{t('create_staff')}</h1>
                            <p className={cn("text-muted-foreground mt-1", isRTL ? '!text-right' : '!text-left')}>{t('add_staff')}</p>
                    </div>
                    
                    <Link href="/dashboard/clinics-staff">
                        <Button variant="outline" className={cn("flex items-center gap-2", flexDirection)}>
                            <ArrowLeft className={cn("h-4 w-4", isRTL && 'rotate-180')} />
                            {t('back')}
                        </Button>
                    </Link>
                </div>

                <form onSubmit={submit} className={cn("space-y-8", isRTL ? '!text-right' : '!text-left')} dir={dir}>
                    {/* Basic Information Card */}
                    <div className={cn("bg-card border border-border rounded-lg p-6", isRTL ? '!text-right' : '!text-left')}>
                        <div className={cn("space-y-6", isRTL ? '!text-right' : '!text-left')}>
                            <div className={cn("border-b pb-4", isRTL ? '!text-right' : '!text-left')}>
                                <h2 className={cn("text-xl font-semibold text-foreground", isRTL ? '!text-right' : '!text-left')}>{t('basic_information')}</h2>
                                <p className={cn("text-sm text-muted-foreground mt-1", isRTL ? '!text-right' : '!text-left')}>{t('staff_basic_info_description')}</p>
                            </div>

                            <div className="grid gap-6 md:grid-cols-2">
                                {/* Name */}
                            <div className={cn("space-y-2", isRTL ? '!text-right' : '!text-left')}>
                                    <Label htmlFor="name" className={cn(isRTL ? '!text-right' : '!text-left')}>
                                        {isRTL ? <><span className="text-red-500">*</span> {t('full_name')}</> : <>{t('full_name')} <span className="text-red-500">*</span></>}
                                </Label>
                                <Input
                                    id="name"
                                    value={data.name}
                                    onChange={(e) => setData('name', e.target.value)}
                                    dir={getFieldDir('text')}
                                    className={cn(errors.name ? 'border-red-500' : '', getInputTextAlign('text'))}
                                        placeholder={t('enter_full_name')}
                                    required
                                />
                                {errors.name && (
                                        <p className={cn("text-sm text-red-500", isRTL ? '!text-right' : '!text-left')}>
                                            {t(errors.name) || errors.name}
                                        </p>
                                )}
                            </div>

                                {/* Email */}
                            <div className={cn("space-y-2", isRTL ? '!text-right' : '!text-left')}>
                                    <Label htmlFor="email" className={cn(isRTL ? '!text-right' : '!text-left')}>
                                        {isRTL ? <><span className="text-red-500">*</span> {t('email_address')}</> : <>{t('email_address')} <span className="text-red-500">*</span></>}
                                </Label>
                                <Input
                                    id="email"
                                    type="email"
                                    value={data.email}
                                    onChange={(e) => setData('email', e.target.value)}
                                    dir={getFieldDir('email')}
                                    className={cn(errors.email ? 'border-red-500' : '', getInputTextAlign('email'))}
                                        placeholder={t('enter_email_address')}
                                    required
                                />
                                {errors.email && (
                                        <p className={cn("text-sm text-red-500", isRTL ? '!text-right' : '!text-left')}>
                                            {t(errors.email) || errors.email}
                                        </p>
                                )}
                            </div>

                                {/* Phone */}
                            <div className={cn("space-y-2", isRTL ? '!text-right' : '!text-left')}>
                                    <Label htmlFor="phone" className={cn(isRTL ? '!text-right' : '!text-left')}>
                                        {t('phone_number')}
                                    </Label>
                                    <PhoneInput
                                    id="phone"
                                    value={data.phone}
                                        onChange={(value) => setData('phone', value)}
                                    className={cn(errors.phone ? 'border-red-500' : '', isRTL ? '!text-right' : '!text-left')}
                                />
                                    <p className={cn("text-xs text-muted-foreground", isRTL ? '!text-right' : '!text-left')}>
                                        {t('phone_format_hint')}
                                    </p>
                                {errors.phone && (
                                        <p className={cn("text-sm text-red-500", isRTL ? '!text-right' : '!text-left')}>
                                            {t(errors.phone) || errors.phone}
                                        </p>
                                )}
                            </div>

                                {/* Status */}
                            <div className={cn("space-y-2", isRTL ? '!text-right' : '!text-left')}>
                                    <Label htmlFor="status" className={cn(isRTL ? '!text-right' : '!text-left')}>
                                        {isRTL ? <><span className="text-red-500">*</span> {t('account_status')}</> : <>{t('account_status')} <span className="text-red-500">*</span></>}
                                </Label>
                                <Select
                                    value={data.status}
                                    onValueChange={(value) => setData('status', value)}
                                >
                                        <SelectTrigger className={cn(errors.status ? 'border-red-500' : '', isRTL ? '!text-right' : '!text-left')}>
                                            <SelectValue placeholder={t('select_status')} />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="active" className={cn(isRTL ? '!text-right' : '!text-left')}>{t('active')}</SelectItem>
                                        <SelectItem value="inactive" className={cn(isRTL ? '!text-right' : '!text-left')}>{t('inactive')}</SelectItem>
                                    </SelectContent>
                                </Select>
                                {errors.status && (
                                        <p className={cn("text-sm text-red-500", isRTL ? '!text-right' : '!text-left')}>
                                            {t(errors.status) || errors.status}
                                        </p>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Security Information Card */}
                    <div className={cn("bg-card border border-border rounded-lg p-6", isRTL ? '!text-right' : '!text-left')}>
                        <div className={cn("space-y-6", isRTL ? '!text-right' : '!text-left')}>
                            <div className={cn("border-b pb-4", isRTL ? '!text-right' : '!text-left')}>
                                <h2 className={cn("text-xl font-semibold text-foreground", isRTL ? '!text-right' : '!text-left')}>{t('security_information')}</h2>
                                <p className={cn("text-sm text-muted-foreground mt-1", isRTL ? '!text-right' : '!text-left')}>{t('set_login_credentials')}</p>
                            </div>

                            <div className="grid gap-6 md:grid-cols-2">
                                {/* Password */}
                            <div className={cn("space-y-2", isRTL ? '!text-right' : '!text-left')}>
                                    <Label htmlFor="password" className={cn(isRTL ? '!text-right' : '!text-left')}>
                                    {isRTL ? <><span className="text-red-500">*</span> {t('password')}</> : <>{t('password')} <span className="text-red-500">*</span></>}
                                </Label>
                                <PasswordInput
                                    id="password"
                                    value={data.password}
                                    onChange={(e) => setData('password', e.target.value)}
                                    placeholder={t('enter_password')}
                                    error={errors.password}
                                    required
                                    className={cn(isRTL ? '!text-right' : '!text-left')}
                                />
                                    <p className={cn("text-xs text-muted-foreground", isRTL ? '!text-right' : '!text-left')}>
                                        {t('password_requirements')}
                                    </p>
                                {errors.password && (
                                        <p className={cn("text-sm text-red-500", isRTL ? '!text-right' : '!text-left')}>
                                            {t(errors.password) || errors.password}
                                        </p>
                                )}
                            </div>

                                {/* Confirm Password */}
                            <div className={cn("space-y-2", isRTL ? '!text-right' : '!text-left')}>
                                    <Label htmlFor="password_confirmation" className={cn(isRTL ? '!text-right' : '!text-left')}>
                                    {isRTL ? <><span className="text-red-500">*</span> {t('confirm_password')}</> : <>{t('confirm_password')} <span className="text-red-500">*</span></>}
                                </Label>
                                <PasswordInput
                                    id="password_confirmation"
                                    value={data.password_confirmation}
                                    onChange={(e) => setData('password_confirmation', e.target.value)}
                                    placeholder={t('confirm_password')}
                                    error={errors.password_confirmation}
                                    required
                                    className={cn(isRTL ? '!text-right' : '!text-left')}
                                />
                                {errors.password_confirmation && (
                                        <p className={cn("text-sm text-red-500", isRTL ? '!text-right' : '!text-left')}>
                                            {t(errors.password_confirmation) || errors.password_confirmation}
                                        </p>
                                )}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Clinic Assignment Card */}
                    <div className={cn("bg-card border border-border rounded-lg p-6", isRTL ? '!text-right' : '!text-left')}>
                        <div className={cn("space-y-6", isRTL ? '!text-right' : '!text-left')}>
                            <div className={cn("border-b pb-4", isRTL ? '!text-right' : '!text-left')}>
                                <h2 className={cn("text-xl font-semibold text-foreground", isRTL ? '!text-right' : '!text-left')}>{t('clinic_assignment')}</h2>
                                <p className={cn("text-sm text-muted-foreground mt-1", isRTL ? '!text-right' : '!text-left')}>{t('assign_staff_to_clinics')}</p>
                            </div>

                            <div className="grid gap-6 md:grid-cols-2">
                                {/* Clinic Owner */}
                                <div className={cn("space-y-2", isRTL ? '!text-right' : '!text-left')}>
                                    <Label htmlFor="owner_id" className={cn(isRTL ? '!text-right' : '!text-left')}>
                                        {isRTL ? <><span className="text-red-500">*</span> {t('clinic_owner')}</> : <>{t('clinic_owner')} <span className="text-red-500">*</span></>}
                                    </Label>
                                    <div dir={dir}>
                                        <SearchableSelect
                                            options={userOptions}
                                            value={selectedOwnerId}
                                            onChange={handleOwnerChange}
                                            placeholder={t('select_clinic_owner')}
                                            searchPlaceholder={t('search_users')}
                                            disabled={isRestrictedClinicRole}
                                            className={cn(errors.owner_id ? 'border-red-500' : '', isRTL ? '!text-right' : '!text-left')}
                                        />
                                    </div>
                                    <p className={cn("text-xs text-muted-foreground", isRTL ? '!text-right' : '!text-left')}>
                                        {t('select_owner_to_see_clinics')}
                                    </p>
                                    {errors.owner_id && (
                                        <p className={cn("text-sm text-red-500", isRTL ? '!text-right' : '!text-left')}>
                                            {t(errors.owner_id) || errors.owner_id}
                                        </p>
                                    )}
                                </div>

                                {/* Clinic Locations */}
                                <div className={cn("space-y-2", isRTL ? '!text-right' : '!text-left')}>
                                    <Label htmlFor="clinic_ids" className={cn(isRTL ? '!text-right' : '!text-left')}>
                                        {isRTL ? <><span className="text-red-500">*</span> {t('clinic_locations')}</> : <>{t('clinic_locations')} <span className="text-red-500">*</span></>}
                                    </Label>
                                    <div dir={dir}>
                                        <SearchableMultiSelect
                                            options={clinicOptions}
                                            value={data.clinic_ids}
                                            onChange={handleClinicIdsChange}
                                            placeholder={
                                                !selectedOwnerId 
                                                    ? t('select_owner_first')
                                                    : loadingClinics
                                                    ? t('loading_clinics')
                                                    : clinicOptions.length === 0
                                                    ? t('no_clinics_available_for_owner')
                                                    : t('select_clinic_locations')
                                            }
                                            searchPlaceholder={t('search_clinics')}
                                            disabled={!selectedOwnerId || loadingClinics || clinicOptions.length === 0}
                                            className={cn(errors.clinic_ids ? 'border-red-500' : '', isRTL ? '!text-right' : '!text-left')}
                                        />
                                    </div>
                                    {loadingClinics && (
                                        <p className={cn("text-xs text-muted-foreground", isRTL ? '!text-right' : '!text-left')}>
                                            {t('loading_clinics')}...
                                        </p>
                                    )}
                                    {selectedOwnerId && availableClinics.length === 0 && !loadingClinics && (
                                        <p className={cn("text-xs text-muted-foreground", isRTL ? '!text-right' : '!text-left')}>
                                            {t('no_clinics_available_for_owner')}
                                        </p>
                                    )}
                                    {errors.clinic_ids && (
                                        <p className={cn("text-sm text-red-500", isRTL ? '!text-right' : '!text-left')}>
                                            {t(errors.clinic_ids) || errors.clinic_ids}
                                        </p>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Action Buttons */}
                    <div className={cn("flex gap-3 pt-6 border-t", flexDirection)}>
                        <Link href="/dashboard/clinics-staff">
                            <Button type="button" variant="outline">
                                {t('cancel')}
                            </Button>
                        </Link>
                        <Button 
                            type="submit" 
                            disabled={processing}
                            className={cn("flex items-center gap-2", flexDirection)}
                        >
                            {processing ? t('creating') : t('create_staff')}
                        </Button>
                    </div>
                </form>
            </div>
        </AppLayout>
    );
}
