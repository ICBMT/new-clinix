import { type BreadcrumbItem } from '@/types';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ClinicRegistrationForm } from '@/components/clinic-registration-form';
import { useTranslation } from '@/hooks/use-translation';
import { useRTL } from '@/hooks/use-rtl';
import { useRTLInit } from '@/hooks/use-rtl-init';
import AppLayout from '@/layouts/app-layout';
import { index as dashboard } from '@/routes/dashboard';
import { Head, Link, useForm, router, usePage } from '@inertiajs/react';
import { ArrowLeft } from 'lucide-react';
import { FormEventHandler, useState, useRef, useEffect } from 'react';
import InputError from '@/components/input-error';
import { customToast } from '@/components/ui/custom-toast';
import { cn } from '@/lib/utils';
import { type SharedData } from '@/types';

interface Governorate {
    id: number;
    name_en: string;
    name_ar: string;
}

interface Category {
    id: number;
    name_en: string;
    name_ar: string;
}

interface SubscriptionPackage {
    id: number;
    name_en: string;
    name_ar: string;
    description_en?: string;
    description_ar?: string;
    price: string;
    currency: string;
    billing_cycle: 'monthly' | 'yearly';
    duration_days: number;
    features?: string[];
}

interface CreateClinicProps {
    users?: Array<{ id: number; name: string; email: string }>;
    governorates?: Governorate[];
    categories?: Category[];
    subscriptionPackages?: SubscriptionPackage[];
    currentUser?: {
        id: number;
        name: string;
        email: string;
        roles: string[];
    } | null;
    clinicOwnerId?: number | null;
}

export default function CreateClinic({ 
    users = [], 
    governorates = [], 
    categories = [],
    subscriptionPackages = [],
    currentUser = null,
    clinicOwnerId = null,
}: CreateClinicProps) {
    useRTLInit();
    const { t, locale } = useTranslation();
    const page = usePage<SharedData>();
    const { locale: pageLocale } = page.props;
    const isRTL = pageLocale === 'ar';
    const dir = isRTL ? 'rtl' : 'ltr';
    const { flexDirection, iconMargin } = useRTL();
    
    const breadcrumbs: BreadcrumbItem[] = [
        {
            title: t('dashboard'),
            href: dashboard.url(),
        },
        {
            title: t('clinics_management'),
            href: '/dashboard/clinics',
        },
        {
            title: t('create_clinic'),
            href: '/dashboard/clinics/create',
        },
    ];

    // Determine owner mode and user_id based on role
    const isClinicRole = currentUser?.roles?.includes('clinic') && !currentUser?.roles?.includes('super-admin');
    const isClinicManagerRole = currentUser?.roles?.includes('clinic_manager') && !currentUser?.roles?.includes('super-admin');
    const canChangeOwner = !isClinicRole && !isClinicManagerRole;
    
    // Auto-select user based on role
    const defaultUserId = isClinicRole 
        ? currentUser?.id?.toString() || ''
        : (isClinicManagerRole && clinicOwnerId)
            ? clinicOwnerId.toString()
            : '';
    
    const [ownerMode, setOwnerMode] = useState<'select' | 'create'>(() => {
        // If clinic or clinic_manager role, force select mode with pre-selected user
        if (isClinicRole || isClinicManagerRole) {
            return 'select';
        }
        return 'create';
    });
    
    // Store files directly in a ref to ensure they're always available
    const filesRef = useRef<{
        business_license: File | null;
        id_document_front: File | null;
        id_document_back: File | null;
        logo: File | null;
    }>({
        business_license: null,
        id_document_front: null,
        id_document_back: null,
        logo: null,
    });

    const { data, setData, post, processing, errors } = useForm({
        // User fields (for creating new user - will be handled by ClinicRegistrationForm)
        name: '',
        email: '',
        phone: '',
        password: '',
        password_confirmation: '',
        // Existing user selection - auto-select based on role
        user_id: defaultUserId,
        // Clinic data (will be synced from ClinicRegistrationForm)
        clinic: {},
    });
    
    // Auto-set user_id when component mounts if role requires it
    useEffect(() => {
        if (defaultUserId && !data.user_id) {
            setData('user_id', defaultUserId);
        }
    }, [defaultUserId]);

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        
        // Validate owner selection
        if (ownerMode === 'select') {
            if (!data.user_id) {
                customToast.error(t('please_select_user'));
                return;
            }
        }

        const formData = new FormData();
        
        // Add user data based on mode
        if (ownerMode === 'select') {
            formData.append('user_id', data.user_id);
            // Explicitly set create_new_user to '0' when selecting existing user
            formData.append('create_new_user', '0');
        } else {
            // User data will come from ClinicRegistrationForm
            if (data.name) formData.append('name', data.name);
            if (data.email) formData.append('email', data.email);
            if (data.phone) formData.append('phone', data.phone);
            if (data.password) formData.append('password', data.password);
            if (data.password_confirmation) formData.append('password_confirmation', data.password_confirmation);
            // Explicitly set create_new_user to '1' when creating new user
            formData.append('create_new_user', '1');
        }
        
        // FIRST: Append files from ref (they're stored here, not in form data)
        // Also check data.clinic as fallback in case ref wasn't updated
        const businessLicense = filesRef.current.business_license || (data.clinic as any)?.business_license;
        if (businessLicense instanceof File) {
            formData.append('business_license', businessLicense);
            console.log('✅ Appended business_license:', businessLicense.name);
        } else {
            console.warn('❌ business_license NOT found in ref or data');
        }
        
        const idDocumentFront = filesRef.current.id_document_front || (data.clinic as any)?.id_document_front;
        if (idDocumentFront instanceof File) {
            formData.append('id_document_front', idDocumentFront);
            console.log('✅ Appended id_document_front:', idDocumentFront.name);
        } else {
            console.warn('❌ id_document_front NOT found in ref or data');
        }
        
        const idDocumentBack = filesRef.current.id_document_back || (data.clinic as any)?.id_document_back;
        if (idDocumentBack instanceof File) {
            formData.append('id_document_back', idDocumentBack);
        }
        
        const logo = filesRef.current.logo || (data.clinic as any)?.logo;
        if (logo instanceof File) {
            formData.append('logo', logo);
        }
        
        // THEN: Append other clinic data from form state (nested under clinic[])
        const clinicData = data.clinic as any;
        if (clinicData && typeof clinicData === 'object') {
            Object.keys(clinicData).forEach(key => {
                const value = clinicData[key];
                
                // Skip files - they're already appended at root level
                if (key === 'business_license' || key === 'id_document_front' || key === 'id_document_back' || key === 'logo') {
                    return;
                }
                
                if (value !== null && value !== undefined) {
                    // Always send required fields (address, governorate_id, area_id) even if empty for validation
                    const requiredFields = ['address', 'governorate_id', 'area_id'];
                    const shouldSend = requiredFields.includes(key) || value !== '';
                    
                    if (shouldSend) {
                        // Handle boolean fields - convert to "1" or "0"
                        const booleanFields = ['auto_confirm_bookings'];
                        if (booleanFields.includes(key)) {
                            formData.append(`clinic[${key}]`, value === true || value === '1' || value === 1 ? '1' : '0');
                        } else if (Array.isArray(value)) {
                            if (key === 'operating_hours') {
                                value.forEach((oh: any, index: number) => {
                                    formData.append(`clinic[operating_hours][${index}][day_of_week]`, oh.day_of_week || '');
                                    formData.append(`clinic[operating_hours][${index}][is_open]`, oh.is_open ? '1' : '0');
                                    formData.append(`clinic[operating_hours][${index}][closed_all_day]`, oh.closed_all_day ? '1' : '0');
                                    if (oh.opening_time) formData.append(`clinic[operating_hours][${index}][opening_time]`, oh.opening_time);
                                    if (oh.closing_time) formData.append(`clinic[operating_hours][${index}][closing_time]`, oh.closing_time);
                                });
                            } else {
                                formData.append(`clinic[${key}]`, JSON.stringify(value));
                            }
                        } else if (typeof value === 'object') {
                            formData.append(`clinic[${key}]`, JSON.stringify(value));
                        } else {
                            formData.append(`clinic[${key}]`, String(value));
                        }
                    }
                }
            });
        }

        // Use router.post directly with FormData to ensure files are sent correctly
        router.post('/dashboard/clinics', formData, {
            forceFormData: true,
            onSuccess: () => {
                customToast.success(t('clinic_created_successfully'));
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
            <Head title={t('create_clinic')} />

            <div className={cn("flex h-full flex-1 flex-col gap-6 overflow-x-auto rounded-xl bg-card dark:bg-card p-6 border border-border", isRTL ? '!text-right' : '!text-left')} dir={dir}>
                {/* Header */}
                <div className={cn("flex items-center justify-between border-b pb-4", flexDirection)}>
                    <div className={cn(isRTL ? '!text-right' : '!text-left')}>
                        <h1 className={cn("text-3xl font-bold text-foreground", isRTL ? '!text-right' : '!text-left')}>{t('create_clinic')}</h1>
                        <p className={cn("text-muted-foreground mt-1", isRTL ? '!text-right' : '!text-left')}>{t('create_new_clinic')}</p>
                    </div>
                    
                    <Link href="/dashboard/clinics">
                        <Button variant="outline" className={cn("flex items-center gap-2", flexDirection)}>
                            <ArrowLeft className={cn("h-4 w-4", isRTL && 'rotate-180')} />
                            {t('back')}
                        </Button>
                    </Link>
                </div>

                <form onSubmit={submit} encType="multipart/form-data">
                    {/* Clinic Registration Form */}
                    <ClinicRegistrationForm
                        mode="create"
                        governorates={governorates}
                        categories={categories}
                        subscriptionPackages={[]} // COMMENTED OUT - Subscription hidden
                        users={users}
                        ownerMode={ownerMode}
                        onOwnerModeChange={(mode) => {
                            // Prevent changing owner mode for clinic/clinic_manager roles
                            if (!canChangeOwner) {
                                return;
                            }
                            setOwnerMode(mode);
                            if (mode === 'select') {
                                setData('name', '');
                                setData('email', '');
                                setData('phone', '');
                                setData('password', '');
                                setData('password_confirmation', '');
                            } else {
                                setData('user_id', '');
                            }
                        }}
                        canChangeOwner={canChangeOwner}
                        initialData={{
                            name: ownerMode === 'create' ? data.name : '',
                            email: ownerMode === 'create' ? data.email : '',
                            phone: ownerMode === 'create' ? data.phone : '',
                            password: ownerMode === 'create' ? data.password : '',
                            password_confirmation: ownerMode === 'create' ? data.password_confirmation : '',
                            clinic: data.clinic,
                        }}
                        showUserFields={true}
                        user_id={data.user_id}
                        onUserIdChange={(userId) => setData('user_id', userId)}
                        onDataChange={(formData) => {
                            // Sync user fields if creating new user
                            if (ownerMode === 'create') {
                                setData('name', formData.name || '');
                                setData('email', formData.email || '');
                                setData('phone', formData.phone || '');
                                setData('password', formData.password || '');
                                setData('password_confirmation', formData.password_confirmation || '');
                            }
                            // Sync clinic data - IMPORTANT: Store files in ref immediately
                            const newClinic = formData.clinic || {};
                            
                            // Store files in ref if they're File objects
                            if (newClinic.business_license instanceof File) {
                                filesRef.current.business_license = newClinic.business_license;
                                console.log('✅ Stored business_license in ref:', newClinic.business_license.name);
                            }
                            if (newClinic.id_document_front instanceof File) {
                                filesRef.current.id_document_front = newClinic.id_document_front;
                                console.log('✅ Stored id_document_front in ref:', newClinic.id_document_front.name);
                            }
                            if (newClinic.id_document_back instanceof File) {
                                filesRef.current.id_document_back = newClinic.id_document_back;
                            }
                            if (newClinic.logo instanceof File) {
                                filesRef.current.logo = newClinic.logo;
                            }
                            
                            // Sync clinic data (without files - they're in ref)
                            const clinicWithoutFiles: any = { ...newClinic };
                            // Remove files from synced data (they're stored in ref)
                            if ('business_license' in clinicWithoutFiles) delete clinicWithoutFiles.business_license;
                            if ('id_document_front' in clinicWithoutFiles) delete clinicWithoutFiles.id_document_front;
                            if ('id_document_back' in clinicWithoutFiles) delete clinicWithoutFiles.id_document_back;
                            if ('logo' in clinicWithoutFiles) delete clinicWithoutFiles.logo;
                            
                            setData('clinic', clinicWithoutFiles);
                        }}
                        onSubmit={() => {
                            // Handle form submission from ClinicRegistrationForm
                            submit(new Event('submit') as any);
                        }}
                        processing={processing}
                        errors={errors}
                        showAsTabs={false}
                        readOnly={false}
                    />

                </form>
            </div>
        </AppLayout>
    );
}
