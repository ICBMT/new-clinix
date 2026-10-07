import { PasswordInput } from '@/components/password-input';
import { PhoneInput } from '@/components/phone-input';
import { Button } from '@/components/ui/button';
import { customToast } from '@/components/ui/custom-toast';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    SearchableMultiSelect,
    type SearchableMultiSelectOption,
} from '@/components/ui/searchable-multi-select';
import {
    SearchableSelect,
    type SearchableSelectOption,
} from '@/components/ui/searchable-select';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { useRTL } from '@/hooks/use-rtl';
import { useRTLInit } from '@/hooks/use-rtl-init';
import { useTranslation } from '@/hooks/use-translation';
import AppLayout from '@/layouts/app-layout';
import { cn } from '@/lib/utils';
import { index as dashboard } from '@/routes/dashboard';
import { type BreadcrumbItem } from '@/types';
import { getLocalizedName } from '@/utils/localization';
import { Head, Link, useForm, usePage } from '@inertiajs/react';
import { ArrowLeft, Eye } from 'lucide-react';
import {
    FormEventHandler,
    useCallback,
    useEffect,
    useMemo,
    useRef,
    useState,
} from 'react';
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

interface Staff {
    id: number;
    name: string;
    email?: string;
    phone?: string;
    status: string;
    clinics?: Array<{
        id: number;
        name_en: string;
        name_ar: string;
        owner_id?: number;
    }>;
    roles?: Array<{
        id: number;
        name: string;
    }>;
}

interface EditStaffProps {
    staff: Staff;
    users?: User[];
    currentOwnerId?: number | null;
}

export default function EditStaff({
    staff,
    users = [],
    currentOwnerId,
}: EditStaffProps) {
    useRTLInit();
    const { t, locale } = useTranslation();
    const page = usePage<SharedData>();
    const { locale: pageLocale } = page.props;
    const isRTL = pageLocale === 'ar';
    const dir = isRTL ? 'rtl' : 'ltr';
    const { flexDirection, getFieldDir, getInputTextAlign, iconMargin } = useRTL();
    const { flash } = usePage<SharedData>().props;
    const auth = page.props.auth;
    const userRoles = auth?.user?.roles || [];
    const isClinicRole = userRoles.includes('clinic') && !userRoles.includes('super-admin');
    const isClinicManagerRole = userRoles.includes('clinic_manager') && !userRoles.includes('super-admin');
    const isRestrictedClinicRole = isClinicRole || isClinicManagerRole;
    const defaultOwnerId =
        isRestrictedClinicRole && users.length === 1
            ? users[0].id.toString()
            : currentOwnerId?.toString() || '';
    const [selectedOwnerId, setSelectedOwnerId] = useState<string>(
        defaultOwnerId,
    );
    const [availableClinics, setAvailableClinics] = useState<Clinic[]>([]);
    const [loadingClinics, setLoadingClinics] = useState(false);
    const prevOwnerIdRef = useRef<string>('');
    const currentClinicIdsRef = useRef<string[]>([]);

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
            title: t('clinics_staff_management'),
            href: '/dashboard/clinics-staff',
        },
        {
            title: t('edit_staff'),
            href: '#',
        },
    ];

    const { data, setData, patch, processing, errors } = useForm({
        name: staff.name || '',
        email: staff.email || '',
        phone: staff.phone || '',
        password: '',
        password_confirmation: '',
        status: staff.status || 'active',
        owner_id: defaultOwnerId,
        clinic_ids: (staff.clinics || []).map((c) => c.id.toString()),
    });

    // Initialize clinic_ids ref
    useEffect(() => {
        currentClinicIdsRef.current = data.clinic_ids;
    }, []);

    // Load clinics on initial mount if owner is already selected
    useEffect(() => {
        if (currentOwnerId && selectedOwnerId) {
            setLoadingClinics(true);
            fetch(
                `/dashboard/clinics-staff/clinics-by-owner?owner_id=${selectedOwnerId}`,
            )
                .then((response) => {
                    if (!response.ok) {
                        throw new Error('Failed to fetch clinics');
                    }
                    return response.json();
                })
                .then((clinics) => {
                    const clinicsArray = Array.isArray(clinics) ? clinics : [];
                    const approvedClinics = clinicsArray.filter(
                        (clinic: Clinic) =>
                            !clinic.status || clinic.status === 'approved',
                    );
                    setAvailableClinics(approvedClinics);
                    setLoadingClinics(false);
                })
                .catch((error) => {
                    console.error('Error fetching clinics:', error);
                    setAvailableClinics([]);
                    setLoadingClinics(false);
                });
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

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
            fetch(
                `/dashboard/clinics-staff/clinics-by-owner?owner_id=${selectedOwnerId}`,
            )
                .then((response) => {
                    if (!response.ok) {
                        throw new Error('Failed to fetch clinics');
                    }
                    return response.json();
                })
                .then((clinics) => {
                    // Ensure clinics is an array and filter only approved clinics
                    const clinicsArray = Array.isArray(clinics) ? clinics : [];
                    // Filter to only approved clinics (backend should already do this, but double-check)
                    const approvedClinics = clinicsArray.filter(
                        (clinic: Clinic) =>
                            !clinic.status || clinic.status === 'approved',
                    );
                    setAvailableClinics(approvedClinics);
                    setLoadingClinics(false);
                })
                .catch((error) => {
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
        return users.map((user) => ({
            value: user.id.toString(),
            label: `${user.name} (${user.email}${user.phone ? ` - ${user.phone}` : ''})`,
        }));
    }, [users]);

    // Convert clinics to SearchableMultiSelect options (memoized to prevent re-renders)
    const clinicOptions: SearchableMultiSelectOption[] = useMemo(() => {
        return availableClinics.map((clinic) => ({
            value: clinic.id.toString(),
            label: getLocalizedName(clinic.name_en, clinic.name_ar, locale),
        }));
    }, [availableClinics, locale]);

    // Handle owner selection (single select)
    const handleOwnerChange = useCallback(
        (ownerId: string) => {
            // Only update if the value actually changed
            if (ownerId !== selectedOwnerId) {
                setSelectedOwnerId(ownerId);
                setData('owner_id', ownerId);
                setData('clinic_ids', []); // Reset clinic selection when owner changes
            }
             
        },
        [selectedOwnerId],
    );

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

        // Build FormData to handle password fields conditionally
        const formData = new FormData();
        formData.append('name', data.name || '');
        formData.append('email', data.email || '');
        formData.append('phone', data.phone || '');
        formData.append('status', data.status || 'active');
        formData.append('owner_id', data.owner_id || '');

        // Only include password if provided
        if (data.password && data.password !== '') {
            formData.append('password', data.password);
            formData.append(
                'password_confirmation',
                data.password_confirmation || '',
            );
        }

        // Add clinic_ids
        if (data.clinic_ids && Array.isArray(data.clinic_ids)) {
            data.clinic_ids.forEach((id: string) => {
                formData.append('clinic_ids[]', id);
            });
        }

        patch(`/dashboard/clinics-staff/${staff.id}`, formData, {
            forceFormData: true,
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
            <Head title={`${t('edit_staff')} - ${staff.name}`} />

            <div
                className={cn("flex h-full flex-1 flex-col gap-6 overflow-x-auto rounded-xl border border-border bg-card p-6 dark:bg-card", isRTL ? '!text-right' : '!text-left')}
                dir={dir}
            >
                {/* Header */}
                <div
                    className={cn("flex items-center justify-between border-b pb-4", flexDirection)}
                >
                    <div className={cn(isRTL ? '!text-right' : '!text-left')}>
                        <h1 className={cn("text-3xl font-bold text-foreground", isRTL ? '!text-right' : '!text-left')}>
                            {t('edit_staff')}
                        </h1>
                        <p className={cn("mt-1 text-muted-foreground", isRTL ? '!text-right' : '!text-left')}>
                            {t('update_staff_information')}
                        </p>
                    </div>

                    <div
                        className={cn("flex items-center gap-3", flexDirection)}
                    >
                        <Link href={`/dashboard/clinics-staff/${staff.id}`}>
                            <Button
                                variant="outline"
                                className={cn("flex items-center gap-2", flexDirection)}
                            >
                                <Eye className={cn("h-4 w-4", iconMargin('md'))} />
                                {t('view')}
                            </Button>
                        </Link>
                        <Link href="/dashboard/clinics-staff">
                            <Button
                                variant="outline"
                                className={cn("flex items-center gap-2", flexDirection)}
                            >
                                <ArrowLeft
                                    className={cn(
                                        'h-4 w-4',
                                        isRTL && 'rotate-180',
                                    )}
                                />
                                {t('back')}
                            </Button>
                        </Link>
                    </div>
                </div>

                <form onSubmit={submit} className={cn("space-y-8", isRTL ? '!text-right' : '!text-left')} dir={dir}>
                    {/* Basic Information Card */}
                    <div className={cn("rounded-lg border border-border bg-card p-6", isRTL ? '!text-right' : '!text-left')}>
                        <div className={cn("space-y-6", isRTL ? '!text-right' : '!text-left')}>
                            <div
                                className={cn("border-b pb-4", isRTL ? '!text-right' : '!text-left')}
                            >
                                <h2 className={cn("text-xl font-semibold text-foreground", isRTL ? '!text-right' : '!text-left')}>
                                    {t('basic_information')}
                                </h2>
                                <p className={cn("mt-1 text-sm text-muted-foreground", isRTL ? '!text-right' : '!text-left')}>
                                    {t('staff_basic_info_description')}
                                </p>
                            </div>

                            <div className={cn("grid gap-6 md:grid-cols-2", flexDirection)}>
                                {/* Name */}
                                <div
                                    className={cn("space-y-2", isRTL ? '!text-right' : '!text-left')}
                                >
                                    <Label
                                        htmlFor="name"
                                        className={cn(isRTL ? '!text-right' : '!text-left')}
                                    >
                                        {isRTL ? (
                                            <>
                                                <span className="text-red-500">
                                                    *
                                                </span>{' '}
                                                {t('full_name')}
                                            </>
                                        ) : (
                                            <>
                                                {t('full_name')}{' '}
                                                <span className="text-red-500">
                                                    *
                                                </span>
                                            </>
                                        )}
                                    </Label>
                                    <Input
                                        id="name"
                                        value={data.name}
                                        onChange={(e) =>
                                            setData('name', e.target.value)
                                        }
                                        dir={getFieldDir('text')}
                                        className={cn(errors.name ? 'border-red-500' : '', getInputTextAlign('text'))}
                                        placeholder={t('enter_full_name')}
                                        required
                                    />
                                    {errors.name && (
                                        <p
                                            className={cn("text-sm text-red-500", isRTL ? '!text-right' : '!text-left')}
                                        >
                                            {t(errors.name) || errors.name}
                                        </p>
                                    )}
                                </div>

                                {/* Email */}
                                <div
                                    className={cn("space-y-2", isRTL ? '!text-right' : '!text-left')}
                                >
                                    <Label
                                        htmlFor="email"
                                        className={cn(isRTL ? '!text-right' : '!text-left')}
                                    >
                                        {isRTL ? (
                                            <>
                                                <span className="text-red-500">
                                                    *
                                                </span>{' '}
                                                {t('email_address')}
                                            </>
                                        ) : (
                                            <>
                                                {t('email_address')}{' '}
                                                <span className="text-red-500">
                                                    *
                                                </span>
                                            </>
                                        )}
                                    </Label>
                                    <Input
                                        id="email"
                                        type="email"
                                        value={data.email}
                                        onChange={(e) =>
                                            setData('email', e.target.value)
                                        }
                                        dir={getFieldDir('email')}
                                        className={cn(errors.email ? 'border-red-500' : '', getInputTextAlign('email'))}
                                        placeholder={t('enter_email_address')}
                                        required
                                    />
                                    {errors.email && (
                                        <p
                                            className={cn("text-sm text-red-500", isRTL ? '!text-right' : '!text-left')}
                                        >
                                            {t(errors.email) || errors.email}
                                        </p>
                                    )}
                                </div>

                                {/* Phone */}
                                <div
                                    className={cn("space-y-2", isRTL ? '!text-right' : '!text-left')}
                                >
                                    <Label
                                        htmlFor="phone"
                                        className={cn(isRTL ? '!text-right' : '!text-left')}
                                    >
                                        {t('phone_number')}
                                    </Label>
                                    <PhoneInput
                                        id="phone"
                                        value={data.phone}
                                        onChange={(value) =>
                                            setData('phone', value)
                                        }
                                        className={cn(
                                            errors.phone ? 'border-red-500' : '',
                                            isRTL ? '!text-right' : '!text-left'
                                        )}
                                    />
                                    <p
                                        className={cn("text-xs text-muted-foreground", isRTL ? '!text-right' : '!text-left')}
                                    >
                                        {t('phone_format_hint')}
                                    </p>
                                    {errors.phone && (
                                        <p
                                            className={cn("text-sm text-red-500", isRTL ? '!text-right' : '!text-left')}
                                        >
                                            {t(errors.phone) || errors.phone}
                                        </p>
                                    )}
                                </div>

                                {/* Status */}
                                <div
                                    className={cn("space-y-2", isRTL ? '!text-right' : '!text-left')}
                                >
                                    <Label
                                        htmlFor="status"
                                        className={cn(isRTL ? '!text-right' : '!text-left')}
                                    >
                                        {isRTL ? (
                                            <>
                                                <span className="text-red-500">
                                                    *
                                                </span>{' '}
                                                {t('account_status')}
                                            </>
                                        ) : (
                                            <>
                                                {t('account_status')}{' '}
                                                <span className="text-red-500">
                                                    *
                                                </span>
                                            </>
                                        )}
                                    </Label>
                                    <Select
                                        value={data.status}
                                        onValueChange={(value) =>
                                            setData('status', value)
                                        }
                                    >
                                        <SelectTrigger
                                            dir={dir}
                                            className={cn(errors.status ? 'border-red-500' : '', isRTL ? '!text-right' : '!text-left')}
                                        >
                                            <SelectValue
                                                placeholder={t('select_status')}
                                            />
                                        </SelectTrigger>
                                        <SelectContent dir={dir}>
                                            <SelectItem value="active" className={cn(isRTL ? '!text-right' : '!text-left')}>
                                                {t('active')}
                                            </SelectItem>
                                            <SelectItem value="inactive" className={cn(isRTL ? '!text-right' : '!text-left')}>
                                                {t('inactive')}
                                            </SelectItem>
                                        </SelectContent>
                                    </Select>
                                    {errors.status && (
                                        <p
                                            className={cn("text-sm text-red-500", isRTL ? '!text-right' : '!text-left')}
                                        >
                                            {t(errors.status) || errors.status}
                                        </p>
                                    )}
                                </div>

                                {/* Password Section */}
                                <div
                                    className={cn("space-y-2 md:col-span-2", isRTL ? '!text-right' : '!text-left')}
                                >
                                    <div className={cn("border-t pt-4", isRTL ? '!text-right' : '!text-left')}>
                                        <h3 className={cn("mb-4 text-lg font-semibold text-foreground", isRTL ? '!text-right' : '!text-left')}>
                                            {t('change_password')}
                                        </h3>
                                        <p className={cn("mb-4 text-sm text-muted-foreground", isRTL ? '!text-right' : '!text-left')}>
                                            {t('leave_blank_to_keep_current')}
                                        </p>

                                        <div className={cn("space-y-4", isRTL ? '!text-right' : '!text-left')}>
                                            <div
                                                className={cn("space-y-2", isRTL ? '!text-right' : '!text-left')}
                                            >
                                                <Label
                                                    htmlFor="password"
                                                    className={cn(isRTL ? '!text-right' : '!text-left')}
                                                >
                                                    {t('new_password')}
                                                </Label>
                                                <PasswordInput
                                                    id="password"
                                                    value={data.password}
                                                    onChange={(e) =>
                                                        setData(
                                                            'password',
                                                            e.target.value,
                                                        )
                                                    }
                                                    placeholder={t(
                                                        'enter_new_password',
                                                    )}
                                                    className={cn(
                                                        errors.password
                                                            ? 'border-red-500'
                                                            : '',
                                                        isRTL ? '!text-right' : '!text-left'
                                                    )}
                                                    error={errors.password}
                                                />
                                                {errors.password && (
                                                    <p
                                                        className={cn("text-sm text-red-500", isRTL ? '!text-right' : '!text-left')}
                                                    >
                                                        {t(errors.password) ||
                                                            errors.password}
                                                    </p>
                                                )}
                                            </div>

                                            {data.password && (
                                                <div
                                                    className={cn("space-y-2", isRTL ? '!text-right' : '!text-left')}
                                                >
                                                    <Label
                                                        htmlFor="password_confirmation"
                                                        className={cn(isRTL ? '!text-right' : '!text-left')}
                                                    >
                                                        {isRTL ? (
                                                            <>
                                                                <span className="text-red-500">
                                                                    *
                                                                </span>{' '}
                                                                {t(
                                                                    'confirm_password',
                                                                )}
                                                            </>
                                                        ) : (
                                                            <>
                                                                {t(
                                                                    'confirm_password',
                                                                )}{' '}
                                                                <span className="text-red-500">
                                                                    *
                                                                </span>
                                                            </>
                                                        )}
                                                    </Label>
                                                    <PasswordInput
                                                        id="password_confirmation"
                                                        value={
                                                            data.password_confirmation
                                                        }
                                                        onChange={(e) =>
                                                            setData(
                                                                'password_confirmation',
                                                                e.target.value,
                                                            )
                                                        }
                                                        placeholder={t(
                                                            'confirm_password',
                                                        )}
                                                        className={cn(
                                                            errors.password_confirmation
                                                                ? 'border-red-500'
                                                                : '',
                                                            isRTL ? '!text-right' : '!text-left'
                                                        )}
                                                        error={
                                                            errors.password_confirmation
                                                        }
                                                    />
                                                    {errors.password_confirmation && (
                                                        <p
                                                            className={cn("text-sm text-red-500", isRTL ? '!text-right' : '!text-left')}
                                                        >
                                                            {t(
                                                                errors.password_confirmation,
                                                            ) ||
                                                                errors.password_confirmation}
                                                        </p>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Clinic Assignment Card */}
                    <div className={cn("rounded-lg border border-border bg-card p-6", isRTL ? '!text-right' : '!text-left')}>
                        <div className={cn("space-y-6", isRTL ? '!text-right' : '!text-left')}>
                            <div
                                className={cn("border-b pb-4", isRTL ? '!text-right' : '!text-left')}
                            >
                                <h2 className={cn("text-xl font-semibold text-foreground", isRTL ? '!text-right' : '!text-left')}>
                                    {t('clinic_assignment')}
                                </h2>
                                <p className={cn("mt-1 text-sm text-muted-foreground", isRTL ? '!text-right' : '!text-left')}>
                                    {t('assign_staff_to_clinics')}
                                </p>
                            </div>

                            <div className={cn("grid gap-6 md:grid-cols-2", flexDirection)}>
                                {/* Clinic Owner */}
                                <div
                                    className={cn("space-y-2", isRTL ? '!text-right' : '!text-left')}
                                >
                                    <Label
                                        htmlFor="owner_id"
                                        className={cn(isRTL ? '!text-right' : '!text-left')}
                                    >
                                        {isRTL ? (
                                            <>
                                                <span className="text-red-500">
                                                    *
                                                </span>{' '}
                                                {t('clinic_owner')}
                                            </>
                                        ) : (
                                            <>
                                                {t('clinic_owner')}{' '}
                                                <span className="text-red-500">
                                                    *
                                                </span>
                                            </>
                                        )}
                                    </Label>
                                    <div dir={dir}>
                                        <SearchableSelect
                                            options={userOptions}
                                            value={selectedOwnerId}
                                            onChange={handleOwnerChange}
                                            placeholder={t(
                                                'select_clinic_owner',
                                            )}
                                            searchPlaceholder={t(
                                                'search_users',
                                            )}
                                            disabled={isRestrictedClinicRole}
                                            className={cn(
                                                errors.owner_id
                                                    ? 'border-red-500'
                                                    : '',
                                                isRTL ? '!text-right' : '!text-left'
                                            )}
                                        />
                                    </div>
                                    <p
                                        className={cn("text-xs text-muted-foreground", isRTL ? '!text-right' : '!text-left')}
                                    >
                                        {t('select_owner_to_see_clinics')}
                                    </p>
                                    {errors.owner_id && (
                                        <p
                                            className={cn("text-sm text-red-500", isRTL ? '!text-right' : '!text-left')}
                                        >
                                            {t(errors.owner_id) ||
                                                errors.owner_id}
                                        </p>
                                    )}
                                </div>

                                {/* Clinic Locations */}
                                <div
                                    className={cn("space-y-2", isRTL ? '!text-right' : '!text-left')}
                                >
                                    <Label
                                        htmlFor="clinic_ids"
                                        className={cn(isRTL ? '!text-right' : '!text-left')}
                                    >
                                        {isRTL ? (
                                            <>
                                                <span className="text-red-500">
                                                    *
                                                </span>{' '}
                                                {t('clinic_locations')}
                                            </>
                                        ) : (
                                            <>
                                                {t('clinic_locations')}{' '}
                                                <span className="text-red-500">
                                                    *
                                                </span>
                                            </>
                                        )}
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
                                                      : clinicOptions.length ===
                                                          0
                                                        ? t(
                                                              'no_clinics_available_for_owner',
                                                          )
                                                        : t(
                                                              'select_clinic_locations',
                                                          )
                                            }
                                            searchPlaceholder={t(
                                                'search_clinics',
                                            )}
                                            disabled={
                                                !selectedOwnerId ||
                                                loadingClinics ||
                                                clinicOptions.length === 0
                                            }
                                            className={cn(
                                                errors.clinic_ids
                                                    ? 'border-red-500'
                                                    : '',
                                                isRTL ? '!text-right' : '!text-left'
                                            )}
                                        />
                                    </div>
                                    {loadingClinics && (
                                        <p
                                            className={cn("text-xs text-muted-foreground", isRTL ? '!text-right' : '!text-left')}
                                        >
                                            {t('loading_clinics')}...
                                        </p>
                                    )}
                                    {selectedOwnerId &&
                                        availableClinics.length === 0 &&
                                        !loadingClinics && (
                                            <p
                                                className={cn("text-xs text-muted-foreground", isRTL ? '!text-right' : '!text-left')}
                                            >
                                                {t(
                                                    'no_clinics_available_for_owner',
                                                )}
                                            </p>
                                        )}
                                    {errors.clinic_ids && (
                                        <p
                                            className={cn("text-sm text-red-500", isRTL ? '!text-right' : '!text-left')}
                                        >
                                            {t(errors.clinic_ids) ||
                                                errors.clinic_ids}
                                        </p>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Action Buttons */}
                    <div
                        className={cn("flex gap-3 border-t pt-6", isRTL ? 'justify-start' : 'justify-end', flexDirection)}
                    >
                        <Link href="/dashboard/clinics-staff">
                            <Button
                                type="button"
                                variant="outline"
                                className={flexDirection}
                            >
                                {t('cancel')}
                            </Button>
                        </Link>
                        <Button
                            type="submit"
                            disabled={processing}
                            className={flexDirection}
                        >
                            {processing ? t('updating') : t('update')}
                        </Button>
                    </div>
                </form>
            </div>
        </AppLayout>
    );
}
