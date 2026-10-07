import { AddressAutocomplete } from '@/components/address-autocomplete';
import InputError from '@/components/input-error';
import { PasswordInput } from '@/components/password-input';
import { PhoneInput } from '@/components/phone-input';
import { Button } from '@/components/ui/button';
import { customToast } from '@/components/ui/custom-toast';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { useTranslation } from '@/hooks/use-translation';
import { useRTL } from '@/hooks/use-rtl';
import { useForm } from '@inertiajs/react';
import {
    Building2,
    Check,
    ChevronLeft,
    ChevronRight,
    Clock,
    CreditCard,
    FileText,
    LoaderCircle,
    MapPin,
    Settings,
    Upload,
} from 'lucide-react';
import {
    FormEventHandler,
    useCallback,
    useEffect,
    useMemo,
    useRef,
    useState,
} from 'react';

// This is a placeholder - the full implementation will be extracted from register.tsx
// Due to the large size (3379 lines), I'll create a structured component that can be gradually populated

export interface ClinicFormData {
    // User fields (for register mode)
    name?: string;
    email?: string;
    phone?: string;
    password?: string;
    password_confirmation?: string;
    
    // Clinic fields
    clinic: {
        name_en: string;
        name_ar: string;
        bio_en: string;
        bio_ar: string;
        phone: string;
        email: string;
        category_id: string;
        logo: File | null;
        governorate_id: string;
        area_id: string;
        address: string;
        block: string;
        street: string;
        avenue: string;
        house: string;
        floor: string;
        apt: string;
        city: string;
        state: string;
        country: string;
        postal_code: string;
        latitude: string;
        longitude: string;
        auto_confirm_bookings: boolean;
        cancellation_policy_en: string;
        cancellation_policy_ar: string;
        refund_policy_en: string;
        refund_policy_ar: string;
        privacy_policy_en: string;
        privacy_policy_ar: string;
        terms_and_conditions_en: string;
        terms_and_conditions_ar: string;
        reschedule_policy_en: string;
        reschedule_policy_ar: string;
        business_license: File | null;
        id_document_front: File | null;
        id_document_back: File | null;
        operating_hours: OperatingHour[];
        subscription_package_id: string;
    };
}

export interface OperatingHour {
    day_of_week: string;
    is_open: boolean;
    closed_all_day: boolean;
    opening_time: string;
    closing_time: string;
}

interface Governorate {
    id: number;
    name_en: string;
    name_ar: string;
}

interface Area {
    id: number;
    name_en: string;
    name_ar: string;
    governorate_id: number;
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

interface User {
    id: number;
    name: string;
    email: string;
}

interface ClinicRegistrationFormProps {
    mode: 'register' | 'create' | 'edit' | 'view';
    initialData?: Partial<ClinicFormData>;
    governorates?: Governorate[];
    categories?: Category[];
    subscriptionPackages?: SubscriptionPackage[];
    users?: User[];
    areas?: Area[]; // Areas for address selection
    documents?: Array<{
        // Existing documents for view/edit mode
        id: number;
        file_name: string;
        file_url: string;
        collection_name: string;
        disk: string;
        size: number;
        created_at: string;
    }>;
    ownerMode?: 'select' | 'create';
    onOwnerModeChange?: (mode: 'select' | 'create') => void;
    user_id?: string;
    onUserIdChange?: (userId: string) => void;
    canChangeOwner?: boolean; // If false, owner selection is disabled
    onSubmit?: (data: ClinicFormData) => void;
    onDataChange?: (data: ClinicFormData) => void;
    onStepChange?: (step: number) => void;
    showAsTabs?: boolean;
    readOnly?: boolean;
    processing?: boolean;
    errors?: Record<string, string>;
    showUserFields?: boolean; // Override to show user fields even in create/edit mode
    hideNavigation?: boolean; // Hide next/previous buttons
    lockStep?: number; // Lock to a specific step (1-6) - subscription step hidden
}

const DAYS_OF_WEEK = [
    { value: 'monday', labelKey: 'monday' },
    { value: 'tuesday', labelKey: 'tuesday' },
    { value: 'wednesday', labelKey: 'wednesday' },
    { value: 'thursday', labelKey: 'thursday' },
    { value: 'friday', labelKey: 'friday' },
    { value: 'saturday', labelKey: 'saturday' },
    { value: 'sunday', labelKey: 'sunday' },
];

const TOTAL_STEPS = 6; // Changed from 7 to 6 - subscription step hidden

export function ClinicRegistrationForm({
    mode = 'register',
    initialData,
    governorates = [],
    categories = [],
    subscriptionPackages = [],
    users = [],
    areas: areasProp = [],
    documents: documentsProp = [],
    ownerMode,
    onOwnerModeChange,
    user_id,
    onUserIdChange,
    canChangeOwner = true,
    onSubmit,
    onDataChange,
    onStepChange,
    showAsTabs = false,
    readOnly = false,
    processing = false,
    errors: externalErrors = {},
    showUserFields: showUserFieldsProp,
    hideNavigation = false,
    lockStep,
}: ClinicRegistrationFormProps) {
    const { t, locale } = useTranslation();
    const { isRTL, flexDirection, iconMargin } = useRTL();
    
    // Determine if we should show user fields (register mode or explicit prop)
    const showUserFields =
        showUserFieldsProp !== undefined
            ? showUserFieldsProp
            : mode === 'register';
    
    // Initialize state first (before helper functions that use it)
    const [currentStep, setCurrentStep] = useState(lockStep || 1);
    const [touchedFields, setTouchedFields] = useState<Set<string>>(new Set());
    const [isNextLoading, setIsNextLoading] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    
    // Sync with URL params if in tab mode
    useEffect(() => {
        if (showAsTabs && !lockStep) {
            const urlParams = new URLSearchParams(window.location.search);
            const tab = urlParams.get('tab');
            if (tab) {
                const tabNum = parseInt(tab);
                if (tabNum >= 1 && tabNum <= TOTAL_STEPS) {
                    setCurrentStep(tabNum);
                }
            }
        }
    }, [showAsTabs, lockStep]);
    
    // Lock step if lockStep is provided
    useEffect(() => {
        if (lockStep) {
            setCurrentStep(lockStep);
        }
    }, [lockStep]);
    
    // Calculate effective step - maps UI step to actual form step
    // If not showing user fields, step 1 in UI = step 2 in form (clinic info)
    const getEffectiveStep = (): number => {
        if (!showUserFields) {
            // When hiding user fields, UI step 1 = form step 2 (clinic info)
            // UI step 2 = form step 3 (address), etc.
            return currentStep + 1;
        }
        return currentStep;
    };
    
    // Get total steps for display
    const getTotalSteps = (): number => {
        // Subscription step (step 7) is hidden, so return 6 when showing user fields, 5 when not
        return showUserFields ? 6 : 5;
    };
    
    const effectiveStep = getEffectiveStep();
    const totalSteps = getTotalSteps();
    
    // Reset submitting state when processing completes
    useEffect(() => {
        if (!processing && isSubmitting) {
            setIsSubmitting(false);
        }
    }, [processing, isSubmitting]);
    
    // Helper function for phone validation
    const isValidPhone = (phone: string): boolean => {
        if (!phone.trim()) return false;
        const phoneRegex = /^\+965\d{8}$/;
        return phoneRegex.test(phone.replace(/\s/g, ''));
    };
    
    // Helper function to get CSRF token
    const getCsrfToken = (): string => {
        const metaToken = document
            .querySelector('meta[name="csrf-token"]')
            ?.getAttribute('content');
        if (metaToken) return metaToken;
        
        const cookies = document.cookie.split(';');
        for (const cookie of cookies) {
            const [name, value] = cookie.trim().split('=');
            if (name === 'XSRF-TOKEN') {
                try {
                    return decodeURIComponent(value);
                } catch {
                    return value;
                }
            }
        }
        return '';
    };
    
    // Helper function to map backend field names to frontend field names
    const mapBackendFieldToFrontend = (
        backendField: string,
        step: number,
    ): string => {
        if (step === 1) return backendField;
        if (step >= 2 && step <= 6) { // Changed from 7 to 6 - subscription step hidden
            const fieldMap: Record<string, string> = {
                name_en: 'clinic.name_en',
                name_ar: 'clinic.name_ar',
                bio_en: 'clinic.bio_en',
                bio_ar: 'clinic.bio_ar',
                phone: 'clinic.phone',
                email: 'clinic.email',
                category_id: 'clinic.category_id',
                logo: 'clinic.logo',
                business_license: 'clinic.business_license',
                id_document_front: 'clinic.id_document_front',
                id_document_back: 'clinic.id_document_back',
                subscription_package_id: 'clinic.subscription_package_id',
            };
            return fieldMap[backendField] || `clinic.${backendField}`;
        }
        return backendField;
    };
    
    // Validation functions will be defined after useForm hook
    
    // Check user email uniqueness (direct check, not using /register route)
    const checkUserEmailUniqueness = useCallback(
        async (
            email: string,
        ): Promise<{ available: boolean; message?: string }> => {
        if (!email || !email.trim() || !email.includes('@')) {
            return { available: true };
        }

        try {
            const response = await fetch('/register/check-user-email', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                        Accept: 'application/json',
                    'X-CSRF-TOKEN': getCsrfToken(),
                },
                body: JSON.stringify({ email: email.trim() }),
            });

            if (response.ok) {
                const contentType = response.headers.get('content-type');
                    if (
                        contentType &&
                        contentType.includes('application/json')
                    ) {
                    const result = await response.json();
                    return result;
                }
                // If response is not JSON, it's likely an error page - skip validation
                return { available: true };
            }
            return { available: true };
        } catch (error) {
            console.error('Error checking user email:', error);
            return { available: true }; // Allow on error, backend will catch it on final submit
        }
        },
        [],
    );

    // Check user phone uniqueness (direct check, not using /register route)
    const checkUserPhoneUniqueness = useCallback(
        async (
            phone: string,
        ): Promise<{ available: boolean; message?: string }> => {
        if (!phone || !phone.trim()) {
            return { available: true };
        }

        try {
            const response = await fetch('/register/check-user-phone', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                        Accept: 'application/json',
                    'X-CSRF-TOKEN': getCsrfToken(),
                },
                body: JSON.stringify({ phone: phone.trim() }),
            });

            if (response.ok) {
                const contentType = response.headers.get('content-type');
                    if (
                        contentType &&
                        contentType.includes('application/json')
                    ) {
                    const result = await response.json();
                    return result;
                }
                // If response is not JSON, it's likely an error page - skip validation
                return { available: true };
            }
            return { available: true };
        } catch (error) {
            console.error('Error checking user phone:', error);
            return { available: true }; // Allow on error, backend will catch it on final submit
        }
        },
        [],
    );

    // Backend validation function (now defined after data initialization)
    const validateStepWithBackend = async (
        step: number,
    ): Promise<{ valid: boolean; errors: Record<string, string[]> }> => {
        // Determine endpoint based on mode
        const endpoint = mode === 'create' ? '/dashboard/clinics' : '/register';
        let payload: Record<string, unknown> = { step };

        switch (step) {
            case 1:
                // For create mode, include create_new_user flag and user_id if selecting existing user
                if (mode === 'create') {
                    const createNewUser = !user_id || user_id === '';
                    payload = {
                        step: 1,
                        create_new_user: createNewUser,
                    };
                    if (createNewUser) {
                        payload = {
                            ...payload,
                            name: data.name,
                            email: data.email,
                            phone: data.phone,
                            password: data.password,
                            password_confirmation: data.password_confirmation,
                        };
                    } else {
                        payload = {
                            ...payload,
                            user_id: user_id,
                        };
                    }
                } else {
                    payload = {
                        step: 1,
                        name: data.name,
                        email: data.email,
                        phone: data.phone,
                        password: data.password,
                        password_confirmation: data.password_confirmation,
                    };
                }
                break;
            case 2:
                payload = {
                    step: 2,
                    name_en: data.clinic.name_en,
                    name_ar: data.clinic.name_ar,
                    bio_en: data.clinic.bio_en,
                    bio_ar: data.clinic.bio_ar,
                    phone: data.clinic.phone,
                    email: data.clinic.email,
                    category_id: data.clinic.category_id,
                };
                break;
            case 3:
                payload = {
                    step: 3,
                    governorate_id: data.clinic.governorate_id,
                    area_id: data.clinic.area_id,
                    address: data.clinic.address,
                    block: data.clinic.block,
                    street: data.clinic.street,
                    avenue: data.clinic.avenue,
                    house: data.clinic.house,
                    floor: data.clinic.floor,
                    apt: data.clinic.apt,
                    city: data.clinic.city,
                    state: data.clinic.state,
                    country: data.clinic.country,
                    postal_code: data.clinic.postal_code,
                    latitude: data.clinic.latitude,
                    longitude: data.clinic.longitude,
                };
                break;
            case 4:
                payload = {
                    step: 4,
                    auto_confirm_bookings: data.clinic.auto_confirm_bookings,
                    cancellation_policy_en: data.clinic.cancellation_policy_en,
                    cancellation_policy_ar: data.clinic.cancellation_policy_ar,
                    privacy_policy_en: data.clinic.privacy_policy_en,
                    privacy_policy_ar: data.clinic.privacy_policy_ar,
                    terms_and_conditions_en:
                        data.clinic.terms_and_conditions_en,
                    terms_and_conditions_ar:
                        data.clinic.terms_and_conditions_ar,
                    refund_policy_en: data.clinic.refund_policy_en,
                    refund_policy_ar: data.clinic.refund_policy_ar,
                    reschedule_policy_en: data.clinic.reschedule_policy_en,
                    reschedule_policy_ar: data.clinic.reschedule_policy_ar,
                };
                break;
            case 5:
                payload = {
                    step: 5,
                    operating_hours: data.clinic.operating_hours,
                };
                break;
            case 6:
                // Handle file uploads separately
                const formData = new FormData();
                formData.append('step', '6');
                if (data.clinic.logo instanceof File) {
                    formData.append('logo', data.clinic.logo);
                }
                if (data.clinic.business_license instanceof File) {
                    formData.append(
                        'business_license',
                        data.clinic.business_license,
                    );
                }
                if (data.clinic.id_document_front instanceof File) {
                    formData.append(
                        'id_document_front',
                        data.clinic.id_document_front,
                    );
                }
                if (data.clinic.id_document_back instanceof File) {
                    formData.append(
                        'id_document_back',
                        data.clinic.id_document_back,
                    );
                }
                
                try {
                    const response = await fetch(endpoint, {
                        method: 'POST',
                        headers: {
                            Accept: 'application/json',
                            'X-Requested-With': 'XMLHttpRequest',
                            'X-CSRF-TOKEN': getCsrfToken(),
                        },
                        body: formData,
                    });

                    if (response.status === 422) {
                        try {
                            const contentType =
                                response.headers.get('content-type');
                            if (
                                contentType &&
                                contentType.includes('application/json')
                            ) {
                                const errorResult = await response.json();
                                if (errorResult.errors) {
                                    const mappedErrors: Record<
                                        string,
                                        string[]
                                    > = {};
                                    Object.keys(errorResult.errors).forEach(
                                        (key) => {
                                            const frontendKey =
                                                mapBackendFieldToFrontend(
                                                    key,
                                                    step,
                                                );
                                            mappedErrors[frontendKey] =
                                                errorResult.errors[key];
                                        },
                                    );
                                    return {
                                        valid: false,
                                        errors: mappedErrors,
                                    };
                                }
                            } else {
                                const errorMsg = t('validation_failed');
                                customToast.error(errorMsg);
                                return { valid: false, errors: {} };
                            }
                        } catch (parseError) {
                            console.error(
                                'Error parsing validation response:',
                                parseError,
                            );
                            const errorMsg =
                                t('validation_failed') ||
                                'Validation failed. Please check your input.';
                            customToast.error(errorMsg);
                            return { valid: false, errors: {} };
                        }
                    }

                    if (!response.ok) {
                        const mappedErrors: Record<string, string[]> = {};
                        try {
                            const contentType =
                                response.headers.get('content-type');
                            if (
                                contentType &&
                                contentType.includes('application/json')
                            ) {
                                const errorResult = await response.json();
                                if (
                                    errorResult.errors &&
                                    typeof errorResult.errors === 'object'
                                ) {
                                    Object.keys(errorResult.errors).forEach(
                                        (key) => {
                                            const frontendKey =
                                                mapBackendFieldToFrontend(
                                                    key,
                                                    step,
                                                );
                                            if (
                                                Array.isArray(
                                                    errorResult.errors[key],
                                                )
                                            ) {
                                                mappedErrors[frontendKey] =
                                                    errorResult.errors[key];
                                        } else {
                                                mappedErrors[frontendKey] = [
                                                    String(
                                                        errorResult.errors[key],
                                                    ),
                                                ];
                                        }
                                        },
                                    );
                                }
                                if (Object.keys(mappedErrors).length > 0) {
                                    return {
                                        valid: false,
                                        errors: mappedErrors,
                                    };
                                }
                            } else {
                                const errorMsg = t('validation_failed');
                                customToast.error(errorMsg);
                                return { valid: false, errors: {} };
                            }
                        } catch (parseError) {
                            console.error(
                                'Error parsing error response:',
                                parseError,
                            );
                            const errorMsg =
                                t('validation_failed') ||
                                'Validation failed. Please check your input.';
                            customToast.error(errorMsg);
                            return { valid: false, errors: {} };
                        }
                        const errorMsg = t('validation_failed');
                        customToast.error(errorMsg);
                        return { valid: false, errors: {} };
                    }

                    const contentType = response.headers.get('content-type');
                    if (
                        !contentType ||
                        !contentType.includes('application/json')
                    ) {
                        const errorMsg = t('validation_failed') || t('something_went_wrong');
                        customToast.error(errorMsg);
                        return { valid: false, errors: {} };
                    }

                    const result = await response.json();
                    if (result.valid) {
                        return { valid: true, errors: {} };
                    } else {
                        const mappedErrors: Record<string, string[]> = {};
                        if (result.errors) {
                            Object.keys(result.errors).forEach((key) => {
                                const frontendKey = mapBackendFieldToFrontend(
                                    key,
                                    step,
                                );
                                mappedErrors[frontendKey] = result.errors[key];
                            });
                        }
                        return { valid: false, errors: mappedErrors };
                    }
                } catch (error) {
                    console.error('Validation error:', error);
                    return {
                        valid: false,
                        errors: {
                            _general: [
                                t('something_went_wrong') ||
                                    'Validation failed',
                            ],
                        },
                    };
                }
            // case 7: // COMMENTED OUT - Subscription step hidden
            //     payload = {
            //         step: 7,
            //         subscription_package_id:
            //             data.clinic.subscription_package_id || null,
            //     };
            //     break;
        }

        // Handle JSON payloads for steps 1-6 (subscription step 7 is hidden)
        try {
            const response = await fetch(endpoint, {
                method: 'POST',
                headers: {
                    Accept: 'application/json',
                    'Content-Type': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest',
                    'X-CSRF-TOKEN': getCsrfToken(),
                },
                body: JSON.stringify(payload),
            });

            if (response.status === 422) {
                try {
                    const contentType = response.headers.get('content-type');
                    if (
                        contentType &&
                        contentType.includes('application/json')
                    ) {
                        const errorResult = await response.json();
                        if (errorResult.errors) {
                            const mappedErrors: Record<string, string[]> = {};
                            Object.keys(errorResult.errors).forEach((key) => {
                                const frontendKey = mapBackendFieldToFrontend(
                                    key,
                                    step,
                                );
                                // Ensure errors are always arrays
                                if (Array.isArray(errorResult.errors[key])) {
                                    mappedErrors[frontendKey] =
                                        errorResult.errors[key];
                                } else {
                                    mappedErrors[frontendKey] = [
                                        String(errorResult.errors[key]),
                                    ];
                                }
                            });
                            return { valid: false, errors: mappedErrors };
                        }
                    } else {
                        // Response is not JSON (likely HTML error page) - show as toast only, no field errors
                        const errorMsg =
                            t('validation_failed') ||
                            'Validation failed. Please check your input.';
                        customToast.error(errorMsg);
                        return { valid: false, errors: {} };
                    }
                } catch (parseError) {
                    // If parsing fails, it's likely HTML - show as toast only
                    console.error(
                        'Error parsing validation response:',
                        parseError,
                    );
                    const errorMsg =
                        t('validation_failed') ||
                        'Validation failed. Please check your input.';
                    customToast.error(errorMsg);
                    return { valid: false, errors: {} };
                }
            }

            if (!response.ok) {
                const mappedErrors: Record<string, string[]> = {};
                try {
                    const contentType = response.headers.get('content-type');
                    if (
                        contentType &&
                        contentType.includes('application/json')
                    ) {
                        const errorResult = await response.json();
                        if (
                            errorResult.errors &&
                            typeof errorResult.errors === 'object'
                        ) {
                            Object.keys(errorResult.errors).forEach((key) => {
                                const frontendKey = mapBackendFieldToFrontend(
                                    key,
                                    step,
                                );
                                if (Array.isArray(errorResult.errors[key])) {
                                    mappedErrors[frontendKey] =
                                        errorResult.errors[key];
                                } else {
                                    mappedErrors[frontendKey] = [
                                        String(errorResult.errors[key]),
                                    ];
                                }
                            });
                        }
                        if (Object.keys(mappedErrors).length > 0) {
                            return { valid: false, errors: mappedErrors };
                        }
                    } else {
                        // Response is not JSON (likely HTML error page) - show as toast only
                        const errorMsg =
                            t('validation_failed') ||
                            'Validation failed. Please check your input.';
                        customToast.error(errorMsg);
                        return { valid: false, errors: {} };
                    }
                } catch (parseError) {
                    // If parsing fails, it's likely HTML - show as toast only
                    console.error('Error parsing error response:', parseError);
                    const errorMsg =
                        t('validation_failed') ||
                        'Validation failed. Please check your input.';
                    customToast.error(errorMsg);
                    return { valid: false, errors: {} };
                }
                // If we get here, show toast and return empty errors
                const errorMsg = t('validation_failed') || 'Validation failed';
                customToast.error(errorMsg);
                return { valid: false, errors: {} };
            }

            const contentType = response.headers.get('content-type');
            if (!contentType || !contentType.includes('application/json')) {
                const errorMsg =
                    t('validation_failed') || 'Invalid response from server';
                customToast.error(errorMsg);
                return { valid: false, errors: {} };
            }

            try {
                const result = await response.json();
                if (result.valid) {
                    return { valid: true, errors: {} };
                } else {
                    const mappedErrors: Record<string, string[]> = {};
                    if (result.errors) {
                        Object.keys(result.errors).forEach((key) => {
                            const frontendKey = mapBackendFieldToFrontend(
                                key,
                                step,
                            );
                            mappedErrors[frontendKey] = result.errors[key];
                        });
                    }
                    return { valid: false, errors: mappedErrors };
                }
            } catch (parseError) {
                console.error('Error parsing success response:', parseError);
                const errorMsg =
                    t('validation_failed') || 'Invalid response from server';
                customToast.error(errorMsg);
                return { valid: false, errors: {} };
            }
        } catch (error) {
            console.error('Validation error:', error);
            const errorMsg = t('something_went_wrong') || 'Validation failed';
            customToast.error(errorMsg);
            return { valid: false, errors: {} };
        }
    };
    
    // Initialize form data
    const defaultOperatingHours: OperatingHour[] = DAYS_OF_WEEK.map((day) => ({
        day_of_week: day.value,
        is_open: true,
        closed_all_day: false,
        opening_time: '09:00',
        closing_time: '17:00',
    }));

    const {
        data,
        setData,
        errors: formErrors,
    } = useForm<ClinicFormData>({
        name: initialData?.name || '',
        email: initialData?.email || '',
        phone: initialData?.phone || '',
        password: '',
        password_confirmation: '',
        clinic: {
            name_en: initialData?.clinic?.name_en || '',
            name_ar: initialData?.clinic?.name_ar || '',
            bio_en: initialData?.clinic?.bio_en || '',
            bio_ar: initialData?.clinic?.bio_ar || '',
            phone: initialData?.clinic?.phone || '',
            email: initialData?.clinic?.email || '',
            category_id: initialData?.clinic?.category_id || '',
            logo: null,
            governorate_id: initialData?.clinic?.governorate_id || '',
            area_id: initialData?.clinic?.area_id || '',
            address: initialData?.clinic?.address || '',
            block: initialData?.clinic?.block || '',
            street: initialData?.clinic?.street || '',
            avenue: initialData?.clinic?.avenue || '',
            house: initialData?.clinic?.house || '',
            floor: initialData?.clinic?.floor || '',
            apt: initialData?.clinic?.apt || '',
            city: initialData?.clinic?.city || '',
            state: initialData?.clinic?.state || '',
            country: initialData?.clinic?.country || 'Kuwait',
            postal_code: initialData?.clinic?.postal_code || '',
            latitude: initialData?.clinic?.latitude || '',
            longitude: initialData?.clinic?.longitude || '',
            auto_confirm_bookings:
                initialData?.clinic?.auto_confirm_bookings || false,
            cancellation_policy_en:
                initialData?.clinic?.cancellation_policy_en || '',
            cancellation_policy_ar:
                initialData?.clinic?.cancellation_policy_ar || '',
            refund_policy_en: initialData?.clinic?.refund_policy_en || '',
            refund_policy_ar: initialData?.clinic?.refund_policy_ar || '',
            privacy_policy_en:
                initialData?.clinic?.privacy_policy_en || '',
            privacy_policy_ar:
                initialData?.clinic?.privacy_policy_ar || '',
            terms_and_conditions_en:
                initialData?.clinic?.terms_and_conditions_en || '',
            terms_and_conditions_ar:
                initialData?.clinic?.terms_and_conditions_ar || '',
            reschedule_policy_en: initialData?.clinic?.reschedule_policy_en || '',
            reschedule_policy_ar: initialData?.clinic?.reschedule_policy_ar || '',
            business_license: null,
            id_document_front: null,
            id_document_back: null,
            operating_hours:
                initialData?.clinic?.operating_hours || defaultOperatingHours,
            subscription_package_id:
                initialData?.clinic?.subscription_package_id || '',
        },
    });

    const [areas, setAreas] = useState<Area[]>(areasProp || []);
    
    // Initialize areas from prop when component mounts or prop changes
    useEffect(() => {
        if (areasProp && areasProp.length > 0) {
            setAreas(areasProp);
        }
    }, [areasProp]);
    const [selectedGovernorate, setSelectedGovernorate] = useState<
        number | null
    >(null);
    const [validationErrors, setValidationErrors] = useState<
        Record<string, string>
    >({});
    const [checkingEmail, setCheckingEmail] = useState(false);
    const [logoPreview, setLogoPreview] = useState<string | null>(null);
    const [logoFileName, setLogoFileName] = useState<string | null>(null);
    const [businessLicensePreview, setBusinessLicensePreview] = useState<
        string | null
    >(null);
    const [businessLicenseFileName, setBusinessLicenseFileName] = useState<
        string | null
    >(null);
    const [idDocumentFrontPreview, setIdDocumentFrontPreview] = useState<
        string | null
    >(null);
    const [idDocumentFrontFileName, setIdDocumentFrontFileName] = useState<
        string | null
    >(null);
    const [idDocumentBackPreview, setIdDocumentBackPreview] = useState<
        string | null
    >(null);
    const [idDocumentBackFileName, setIdDocumentBackFileName] = useState<
        string | null
    >(null);
    
    // Helper function to get error for a field (safely handles all error sources)
    const getFieldError = useCallback(
        (fieldName: string): string | undefined => {
        // Don't show user field errors when selecting existing user in create mode
        if (mode === 'create' && ownerMode === 'select' && user_id) {
                const userFields = [
                    'name',
                    'email',
                    'phone',
                    'password',
                    'password_confirmation',
                ];
            if (userFields.includes(fieldName)) {
                return undefined;
            }
        }
            return (
                validationErrors[fieldName] ||
               (externalErrors as Record<string, string>)[fieldName] || 
               (formErrors as Record<string, string>)[fieldName] ||
                undefined
            );
        },
        [
            formErrors,
            externalErrors,
            validationErrors,
            mode,
            ownerMode,
            user_id,
        ],
    );
    
    // Merge external errors with form errors (for backward compatibility)
    const allErrors = useMemo(() => {
        const formErrs = formErrors || {};
        const extErrs = externalErrors || {};
        const valErrs = validationErrors || {};
        return { ...formErrs, ...extErrs, ...valErrs };
    }, [formErrors, externalErrors, validationErrors]);
    
    // Handle governorate change
    const handleGovernorateChange = async (governorateId: string) => {
        (setData as any)('clinic.governorate_id', governorateId);
        setSelectedGovernorate(parseInt(governorateId));
        
        if (governorateId) {
            try {
                const response = await fetch(
                    `/api/governorates/${governorateId}/areas`,
                    {
                    method: 'GET',
                    headers: {
                            Accept: 'application/json',
                        'Content-Type': 'application/json',
                    },
                    },
                );
                
                if (response.ok) {
                    const areasData = await response.json();
                    setAreas(areasData || []);
                } else {
                    console.error(
                        'Failed to fetch areas:',
                        response.status,
                        response.statusText,
                    );
                    setAreas([]);
                }
            } catch (error) {
                console.error('Error fetching areas:', error);
                setAreas([]);
            }
        } else {
            setAreas([]);
            (setData as any)('clinic.area_id', '');
        }
    };
    
    // Handle file change
    const handleFileChange = (
        field:
            | 'logo'
            | 'business_license'
            | 'id_document_front'
            | 'id_document_back',
        file: File | null, 
        previewSetter?: (preview: string) => void,
        fileNameSetter?: (fileName: string) => void,
    ) => {
        if (previewSetter) previewSetter('');
        if (fileNameSetter) fileNameSetter('');
        
        if (!file) {
            if (field === 'logo') {
                (setData as any)('clinic.logo', null);
            } else if (field === 'business_license') {
                (setData as any)('clinic.business_license', null);
            } else if (field === 'id_document_front') {
                (setData as any)('clinic.id_document_front', null);
            } else if (field === 'id_document_back') {
                (setData as any)('clinic.id_document_back', null);
            }
            return;
        }

        try {
            // Validate file type for logo (only JPG, JPEG, PNG allowed)
            if (field === 'logo') {
                const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png'];
                const fileExtension = file.name.split('.').pop()?.toLowerCase();
                const isValidType =
                    allowedTypes.includes(file.type) ||
                    (fileExtension &&
                        ['jpg', 'jpeg', 'png'].includes(fileExtension));

                if (!isValidType) {
                    const errorMessage =
                        t('logo_invalid_format') ||
                        'Invalid file format. Only JPG, JPEG, and PNG files are allowed.';
                    setValidationErrors((prev) => ({
                        ...prev,
                        'clinic.logo': errorMessage,
                    }));
                    customToast.error(
                        t('invalid_file_format') || 'Invalid file format',
                        errorMessage,
                    );
                    // Clear any previous file data
                    (setData as any)('clinic.logo', null);
                    if (previewSetter) previewSetter('');
                    if (fileNameSetter) fileNameSetter('');
                    return;
                } else {
                    // Clear validation error if file type is valid
                    setValidationErrors((prev) => {
                        const newErrors = { ...prev };
                        delete newErrors['clinic.logo'];
                        return newErrors;
                    });
                }
            }

            const maxSize = 10 * 1024 * 1024;
            if (file.size > maxSize) {
                customToast.error(
                    t('file_too_large') || 'File too large', 
                    t('file_size_exceeds_max') ||
                        `File size (${(file.size / (1024 * 1024)).toFixed(2)}MB) exceeds maximum allowed size (10MB). Please compress or use a smaller file.`,
                );
                if (field === 'logo') {
                    (setData as any)('clinic.logo', null);
                    setValidationErrors((prev) => {
                        const newErrors = { ...prev };
                        delete newErrors['clinic.logo'];
                        return newErrors;
                    });
                } else if (field === 'business_license') {
                    (setData as any)('clinic.business_license', null);
                } else if (field === 'id_document_front') {
                    (setData as any)('clinic.id_document_front', null);
                } else if (field === 'id_document_back') {
                    (setData as any)('clinic.id_document_back', null);
                }
                return;
            }
            
            const warningSize = 8 * 1024 * 1024;
            if (file.size > warningSize) {
                customToast.warning(
                    t('file_large_warning') || 'Large file detected',
                    t('file_size_warning') ||
                        `File size is ${(file.size / (1024 * 1024)).toFixed(2)}MB. Upload may fail if server limits are exceeded.`,
                );
            }
                
            // Try to generate preview for all images up to max size (10MB)
            // For larger files, use longer timeout to allow processing
            const previewMaxSize = 10 * 1024 * 1024; // Allow previews up to max file size
            const shouldGeneratePreview =
                file.size <= previewMaxSize && file.type.startsWith('image/');

            if (fileNameSetter) {
                fileNameSetter(file.name);
            }
                
            // Generate preview for images (including large ones)
            if (file.type.startsWith('image/') && shouldGeneratePreview) {
                try {
                    const reader = new FileReader();
                    // Use longer timeout for larger files (30 seconds for files > 5MB, 15 seconds otherwise)
                    const timeoutDuration =
                        file.size > 5 * 1024 * 1024 ? 30000 : 15000;
                    const timeoutId = setTimeout(() => {
                        try {
                            reader.abort();
                            customToast.error(
                                t('file_too_large') || 'File too large', 
                                t('file_size_too_large') ||
                                    'File processing took too long. Please select a smaller file.',
                            );
                            if (previewSetter) previewSetter('');
                            if (fileNameSetter) fileNameSetter('');
                            if (field === 'logo') {
                                (setData as any)('clinic.logo', null);
                            } else if (field === 'business_license') {
                                (setData as any)(
                                    'clinic.business_license',
                                    null,
                                );
                            } else if (field === 'id_document_front') {
                                (setData as any)(
                                    'clinic.id_document_front',
                                    null,
                                );
                            } else if (field === 'id_document_back') {
                                (setData as any)(
                                    'clinic.id_document_back',
                                    null,
                                );
                            }
                        } catch (abortError) {
                            console.error(
                                'Error aborting file read:',
                                abortError,
                            );
                        }
                    }, timeoutDuration);

                    reader.onerror = () => {
                        clearTimeout(timeoutId);
                        customToast.error(
                            t('file_too_large') || 'File too large', 
                            t('file_size_too_large') ||
                                'Unable to read file. Please select a smaller file.',
                        );
                        if (previewSetter) previewSetter('');
                        if (fileNameSetter) fileNameSetter('');
                        if (field === 'logo') {
                            (setData as any)('clinic.logo', null);
                        } else if (field === 'business_license') {
                            (setData as any)('clinic.business_license', null);
                        } else if (field === 'id_document_front') {
                            (setData as any)('clinic.id_document_front', null);
                        } else if (field === 'id_document_back') {
                            (setData as any)('clinic.id_document_back', null);
                        }
                    };

                    reader.onloadend = () => {
                        clearTimeout(timeoutId);
                        try {
                            if (
                                reader.result &&
                                reader.readyState === FileReader.DONE &&
                                previewSetter
                            ) {
                                previewSetter(reader.result as string);
                            }
                        } catch (error) {
                            console.error(
                                'Error processing file preview:',
                                error,
                            );
                            customToast.error(
                                t('file_too_large') || 'File too large', 
                                t('file_size_too_large') ||
                                    'Unable to process file. Please select a smaller file.',
                            );
                            if (previewSetter) previewSetter('');
                            if (fileNameSetter) fileNameSetter('');
                            if (field === 'logo') {
                                (setData as any)('clinic.logo', null);
                            } else if (field === 'business_license') {
                                (setData as any)(
                                    'clinic.business_license',
                                    null,
                                );
                            } else if (field === 'id_document_front') {
                                (setData as any)(
                                    'clinic.id_document_front',
                                    null,
                                );
                            } else if (field === 'id_document_back') {
                                (setData as any)(
                                    'clinic.id_document_back',
                                    null,
                                );
                            }
                        }
                    };

                    reader.readAsDataURL(file);
                } catch (error) {
                    console.error('Error setting up file reader:', error);
                    customToast.error(
                        t('file_too_large') || 'File too large', 
                        t('file_size_too_large') ||
                            'Unable to read file. Please select a smaller file.',
                    );
                    if (previewSetter) previewSetter('');
                    if (fileNameSetter) fileNameSetter('');
                    if (field === 'logo') {
                        (setData as any)('clinic.logo', null);
                    } else if (field === 'business_license') {
                        (setData as any)('clinic.business_license', null);
                    } else if (field === 'id_document_front') {
                        (setData as any)('clinic.id_document_front', null);
                    } else if (field === 'id_document_back') {
                        (setData as any)('clinic.id_document_back', null);
                    }
                    return;
                }
            } else if (file.type === 'application/pdf') {
                // For PDFs, just show file type indicator
                if (previewSetter) previewSetter('pdf');
            } else if (
                file.type.startsWith('image/') &&
                !shouldGeneratePreview
            ) {
                // Fallback for images that couldn't generate preview (shouldn't happen with new limit)
                if (previewSetter) previewSetter('large-image');
            }

            // Set the file in data - use direct object update to ensure it's set immediately
            if (field === 'logo') {
                (setData as any)('clinic.logo', file);
            } else if (field === 'business_license') {
                (setData as any)('clinic.business_license', file);
                // Force clear errors immediately
                setValidationErrors((prev) => {
                    const newErrors = { ...prev };
                    delete newErrors['clinic.business_license'];
                    return newErrors;
                });
            } else if (field === 'id_document_front') {
                (setData as any)('clinic.id_document_front', file);
                // Force clear errors immediately
                setValidationErrors((prev) => {
                    const newErrors = { ...prev };
                    delete newErrors['clinic.id_document_front'];
                    return newErrors;
                });
            } else if (field === 'id_document_back') {
                (setData as any)('clinic.id_document_back', file);
            }
            
            // Immediately sync files to parent component when they change
            // IMPORTANT: We need to use a callback to get the latest data state after setData
            if (onDataChange && (mode === 'create' || mode === 'edit')) {
                // Use setTimeout to ensure setData has completed
                setTimeout(() => {
                    // Get the latest data after setData has updated
                    const updatedData = {
                        ...data,
                        clinic: {
                            ...data.clinic,
                            [field]: file, // Use the file directly, not from data state
                        },
                    };
                    
                    console.log(`📤 Syncing ${field} file to parent:`, {
                        field,
                        file: file
                            ? `${file.name} (${file.size} bytes)`
                            : 'null',
                        isFile: file instanceof File,
                        currentDataHasFile: data.clinic[field] instanceof File,
                    });
                    
                    onDataChange(updatedData);
                }, 10); // Small delay to ensure setData has processed
            }
            
            // Also remove from touchedFields to prevent stale validation
            if (field === 'business_license' || field === 'id_document_front') {
                const fieldKey = `clinic.${field}`;
                setTouchedFields((prev) => {
                    const newTouched = new Set(prev);
                    newTouched.delete(fieldKey);
                    return newTouched;
                });
            }
        } catch (error) {
            console.error('Error handling file:', error);
            customToast.error(
                t('file_too_large') || 'File too large', 
                t('file_size_too_large') ||
                    'An error occurred while processing the file. Please try again with a smaller file.',
            );
            if (previewSetter) previewSetter('');
            if (fileNameSetter) fileNameSetter('');
            if (field === 'logo') {
                (setData as any)('clinic.logo', null);
            } else if (field === 'business_license') {
                (setData as any)('clinic.business_license', null);
            } else if (field === 'id_document_front') {
                (setData as any)('clinic.id_document_front', null);
            } else if (field === 'id_document_back') {
                (setData as any)('clinic.id_document_back', null);
            }
        }
    };
    
    // Validate operating hours time
    const validateOperatingHoursTime = (
        hours: OperatingHour[],
        index: number,
    ) => {
        const hour = hours[index];
        if (
            hour.is_open &&
            !hour.closed_all_day &&
            hour.opening_time &&
            hour.closing_time
        ) {
            const opening = new Date(`2000-01-01T${hour.opening_time}`);
            const closing = new Date(`2000-01-01T${hour.closing_time}`);
            if (opening >= closing) {
                // Use clearer message: start time must not be greater than end time
                const error =
                    t('start_time_must_not_be_greater_than_end_time') ||
                    'Start time must not be greater than end time';
                setValidationErrors((prev) => ({
                    ...prev,
                    [`operating_hours.${index}`]: error,
                }));
                return false;
            } else {
                // Clear error if validation passes
                setValidationErrors((prev) => {
                    const newErrors = { ...prev };
                    delete newErrors[`operating_hours.${index}`];
                    return newErrors;
                });
                return true;
            }
        } else {
            // Clear error if day is closed or times are not set
            setValidationErrors((prev) => {
                const newErrors = { ...prev };
                delete newErrors[`operating_hours.${index}`];
                return newErrors;
            });
            return true;
        }
    };
    
    // Update operating hour
    const updateOperatingHour = (
        index: number,
        field: keyof OperatingHour,
        value: string | boolean,
    ) => {
        const updated = [...data.clinic.operating_hours];
        updated[index] = { ...updated[index], [field]: value };
        (setData as any)('clinic.operating_hours', updated);
        
        // Validate time if opening_time or closing_time changed
        if (field === 'opening_time' || field === 'closing_time') {
            setTimeout(() => {
                validateOperatingHoursTime(updated, index);
            }, 0);
        }
    };

    const updateOperatingHourMultiple = (
        index: number,
        updates: Partial<OperatingHour>,
    ) => {
        const updated = [...data.clinic.operating_hours];
        updated[index] = { ...updated[index], ...updates };
        (setData as any)('clinic.operating_hours', updated);
    };
    
    // Sync data changes to parent component (only when in create/edit mode and data actually changes)
    // Note: We can't use JSON.stringify because File objects can't be stringified
    // Instead, we'll track changes by watching specific file fields and clinic data
    const prevFilesRef = useRef<{
        business_license: File | null;
        id_document_front: File | null;
        logo: File | null;
        id_document_back: File | null;
    }>({
        business_license: null,
        id_document_front: null,
        logo: null,
        id_document_back: null,
    });
    const prevClinicDataRef = useRef<string>('');
    
    useEffect(() => {
        if (onDataChange && (mode === 'create' || mode === 'edit')) {
            // Check if files have changed
            const filesChanged = 
                prevFilesRef.current.business_license !==
                    data.clinic.business_license ||
                prevFilesRef.current.id_document_front !==
                    data.clinic.id_document_front ||
                prevFilesRef.current.logo !== data.clinic.logo ||
                prevFilesRef.current.id_document_back !==
                    data.clinic.id_document_back;
            
            // Check if other clinic data has changed (excluding files)
            const clinicDataWithoutFiles: any = { ...data.clinic };
            if ('business_license' in clinicDataWithoutFiles)
                delete clinicDataWithoutFiles.business_license;
            if ('id_document_front' in clinicDataWithoutFiles)
                delete clinicDataWithoutFiles.id_document_front;
            if ('logo' in clinicDataWithoutFiles)
                delete clinicDataWithoutFiles.logo;
            if ('id_document_back' in clinicDataWithoutFiles)
                delete clinicDataWithoutFiles.id_document_back;
            const dataString = JSON.stringify(clinicDataWithoutFiles);
            
            if (filesChanged || dataString !== prevClinicDataRef.current) {
                // Update refs
                prevFilesRef.current = {
                    business_license: data.clinic.business_license || null,
                    id_document_front: data.clinic.id_document_front || null,
                    logo: data.clinic.logo || null,
                    id_document_back: data.clinic.id_document_back || null,
                };
                prevClinicDataRef.current = dataString;
                // Sync to parent - ensure files are included
                onDataChange({
                    ...data,
                    clinic: {
                        ...data.clinic,
                        // Explicitly include files to ensure they're synced
                        business_license: data.clinic.business_license,
                        id_document_front: data.clinic.id_document_front,
                        logo: data.clinic.logo,
                        id_document_back: data.clinic.id_document_back,
                    },
                });
            }
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [
        data.clinic,
        mode,
        data.clinic.business_license,
        data.clinic.id_document_front,
        data.clinic.logo,
        data.clinic.id_document_back,
    ]);

    // Clear user field validation errors when selecting existing user
    useEffect(() => {
        if (mode === 'create' && ownerMode === 'select' && user_id) {
            setValidationErrors((prev) => {
                const newErrors = { ...prev };
                // Remove all user field errors
                delete newErrors.name;
                delete newErrors.email;
                delete newErrors.phone;
                delete newErrors.password;
                delete newErrors.password_confirmation;
                return newErrors;
            });
        }
    }, [mode, ownerMode, user_id]);

    // Client-side validation function (full implementation from register.tsx)
    const validateStep = useCallback(
        (
            step: number,
        ): {
            valid: boolean;
            errors: string[];
            fieldErrors?: Record<string, string>;
        } => {
        const isArabicText = (text: string): boolean => {
            if (!text.trim()) return false;
                const arabicPattern =
                    /^[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF\s\u0660-\u0669\u06F0-\u06F9.,;:!?\-_()[\]{}""''«»/]+$/u;
            return arabicPattern.test(text);
        };

        const isEnglishText = (text: string): boolean => {
            if (!text.trim()) return false;
                const englishPattern =
                    /^[a-zA-Z0-9\s\-_.,;:!?@#$%^&*()[\]{}""''/]+$/;
            return englishPattern.test(text);
        };

        const isValidPassword = (password: string): boolean => {
            if (!password || password.length < 8) return false;
            if (!/[A-Z]/.test(password)) return false;
            if (!/[a-z]/.test(password)) return false;
            if (!/[0-9]/.test(password)) return false;
                if (!/[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(password))
                    return false;
            return true;
        };
        
        const errors: string[] = [];
        const fieldErrors: Record<string, string> = {};
        
        switch (step) {
            case 1: {
                // Skip validation if not showing user fields
                    if (!showUserFields)
                        return { valid: true, errors: [], fieldErrors: {} };
                
                // Skip validation if selecting existing user in create mode
                // Check both ownerMode and user_id to be safe
                    const hasUserId =
                        user_id &&
                    user_id !== '' && 
                    user_id !== null && 
                    user_id !== undefined &&
                    user_id !== '0' &&
                        String(user_id).trim() !== '';
                    const isSelectingExistingUser =
                        mode === 'create' &&
                        (ownerMode === 'select' || hasUserId);
                
                if (isSelectingExistingUser) {
                    return { valid: true, errors: [], fieldErrors: {} };
                }
                
                const trimmedName = data.name?.trim();
                const trimmedEmail = data.email?.trim();
                const trimmedPhone = data.phone?.trim();
                const trimmedPassword = data.password?.trim();
                    const trimmedPasswordConfirmation =
                        data.password_confirmation?.trim();

                if (!trimmedName || trimmedName.length === 0) {
                    const error = t('name_required');
                    errors.push(error);
                    fieldErrors.name = error;
                } else if (trimmedName.length < 2) {
                    const error = t('name_too_short');
                    errors.push(error);
                    fieldErrors.name = error;
                } else if (trimmedName.length > 30) {
                        const error =
                            t('name_too_long') ||
                            t('name_must_not_exceed_30_characters') ||
                            'Name must not exceed 30 characters';
                    errors.push(error);
                    fieldErrors.name = error;
                }

                if (!trimmedEmail || !trimmedEmail.includes('@')) {
                    const error = t('email_invalid');
                    errors.push(error);
                    fieldErrors.email = error;
                }

                if (!trimmedPhone || !isValidPhone(trimmedPhone)) {
                    const error = t('phone_invalid_format');
                    errors.push(error);
                    fieldErrors.phone = error;
                }

                if (!trimmedPassword) {
                        const error =
                            t('password_required') ||
                            t('password_min_length') ||
                            'Password is required';
                    errors.push(error);
                    fieldErrors.password = error;
                } else if (!isValidPassword(trimmedPassword)) {
                        let error =
                            t('password_min_length') ||
                            'Password must be at least 8 characters';
                    if (trimmedPassword.length >= 8) {
                        if (!/[A-Z]/.test(trimmedPassword)) {
                                error =
                                    t('password_must_contain_uppercase') ||
                                    'Password must contain at least one uppercase letter';
                        } else if (!/[a-z]/.test(trimmedPassword)) {
                                error =
                                    t('password_must_contain_lowercase') ||
                                    'Password must contain at least one lowercase letter';
                        } else if (!/[0-9]/.test(trimmedPassword)) {
                                error =
                                    t('password_must_contain_digit') ||
                                    'Password must contain at least one digit';
                            } else if (
                                !/[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(
                                    trimmedPassword,
                                )
                            ) {
                                error =
                                    t('password_must_contain_special') ||
                                    'Password must contain at least one special character';
                        }
                    }
                    errors.push(error);
                    fieldErrors.password = error;
                }

                    if (
                        !trimmedPasswordConfirmation ||
                        trimmedPassword !== trimmedPasswordConfirmation
                    ) {
                    const error = t('passwords_do_not_match');
                    errors.push(error);
                    fieldErrors.password_confirmation = error;
                }

                return { valid: errors.length === 0, errors, fieldErrors };
            }

            case 2: {
                const trimmedClinicNameEn = data.clinic.name_en?.trim();
                const trimmedClinicNameAr = data.clinic.name_ar?.trim();
                const trimmedClinicPhone = data.clinic.phone?.trim();

                    if (
                        !trimmedClinicNameEn ||
                        trimmedClinicNameEn.length === 0
                    ) {
                    const error = t('clinic_name_en_required');
                    errors.push(error);
                    fieldErrors['clinic.name_en'] = error;
                } else if (!isEnglishText(trimmedClinicNameEn)) {
                    const error = t('clinic_name_en_must_be_english');
                    errors.push(error);
                    fieldErrors['clinic.name_en'] = error;
                } else if (trimmedClinicNameEn.length > 30) {
                        const error =
                            t('clinic_name_en_too_long') ||
                            t('name_must_not_exceed_30_characters') ||
                            'Clinic name must not exceed 30 characters';
                    errors.push(error);
                    fieldErrors['clinic.name_en'] = error;
                }

                    if (
                        !trimmedClinicNameAr ||
                        trimmedClinicNameAr.length === 0
                    ) {
                    const error = t('clinic_name_ar_required');
                    errors.push(error);
                    fieldErrors['clinic.name_ar'] = error;
                } else if (!isArabicText(trimmedClinicNameAr)) {
                    const error = t('clinic_name_ar_must_be_arabic');
                    errors.push(error);
                    fieldErrors['clinic.name_ar'] = error;
                } else if (trimmedClinicNameAr.length > 30) {
                        const error =
                            t('clinic_name_ar_too_long') ||
                            t('name_must_not_exceed_30_characters') ||
                            'Clinic name must not exceed 30 characters';
                    errors.push(error);
                    fieldErrors['clinic.name_ar'] = error;
                }

                    if (
                        !trimmedClinicPhone ||
                        !isValidPhone(trimmedClinicPhone)
                    ) {
                    const error = t('clinic_phone_invalid_format');
                    errors.push(error);
                    fieldErrors['clinic.phone'] = error;
                }

                // Category is now required
                    if (
                        !data.clinic.category_id ||
                        data.clinic.category_id.trim() === ''
                    ) {
                        const error =
                            t('category_required') || 'Category is required';
                    errors.push(error);
                    fieldErrors['clinic.category_id'] = error;
                }

                if (data.clinic.email && data.clinic.email.trim()) {
                    const trimmedClinicEmail = data.clinic.email.trim();
                    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                    if (!emailRegex.test(trimmedClinicEmail)) {
                            const error =
                                t('email_invalid') || 'Invalid email format';
                        errors.push(error);
                        fieldErrors['clinic.email'] = error;
                    }
                }

                if (data.clinic.bio_en && data.clinic.bio_en.trim()) {
                    if (!isEnglishText(data.clinic.bio_en)) {
                            const fieldName =
                                t('description_en') || 'Description (English)';
                            const error =
                                t('description_en_must_be_english') ||
                                t('field_must_be_english_only')?.replace(
                                    ':attribute',
                                    fieldName,
                                ) ||
                                `${fieldName} must contain only English characters`;
                        errors.push(error);
                        fieldErrors['clinic.bio_en'] = error;
                    } else if (data.clinic.bio_en.length > 2000) {
                            const error =
                                t('description_too_long') ||
                                t(
                                    'description_must_not_exceed_2000_characters',
                                ) ||
                                'Description must not exceed 2000 characters';
                        errors.push(error);
                        fieldErrors['clinic.bio_en'] = error;
                    }
                }
                if (data.clinic.bio_ar && data.clinic.bio_ar.trim()) {
                    if (!isArabicText(data.clinic.bio_ar)) {
                            const fieldName =
                                t('description_ar') || 'Description (Arabic)';
                            const error =
                                t('description_ar_must_be_arabic') ||
                                t('field_must_be_arabic_only')?.replace(
                                    ':attribute',
                                    fieldName,
                                ) ||
                                `${fieldName} must contain only Arabic characters`;
                        errors.push(error);
                        fieldErrors['clinic.bio_ar'] = error;
                    } else if (data.clinic.bio_ar.length > 2000) {
                            const error =
                                t('description_too_long') ||
                                t(
                                    'description_must_not_exceed_2000_characters',
                                ) ||
                                'Description must not exceed 2000 characters';
                        errors.push(error);
                        fieldErrors['clinic.bio_ar'] = error;
                    }
                }

                return { valid: errors.length === 0, errors, fieldErrors };
            }

            case 3: {
                if (!data.clinic.governorate_id) {
                    const error = t('governorate_required');
                    errors.push(error);
                    fieldErrors['clinic.governorate_id'] = error;
                }
                if (!data.clinic.area_id) {
                    const error = t('area_required');
                    errors.push(error);
                    fieldErrors['clinic.area_id'] = error;
                }
                
                // Address is now required
                const trimmedAddress = data.clinic.address?.trim() || '';
                if (!trimmedAddress || trimmedAddress.length === 0) {
                        const error =
                            t('address_required') ||
                            t('address_cannot_be_empty') ||
                            t('address_invalid') ||
                            'Address is required';
                    errors.push(error);
                    fieldErrors['clinic.address'] = error;
                } else if (trimmedAddress.length < 3) {
                        const error =
                            t('address_too_short') ||
                            t('address_must_be_at_least_3_characters') ||
                            'Address must be at least 3 characters';
                    errors.push(error);
                    fieldErrors['clinic.address'] = error;
                } else if (trimmedAddress.length > 500) {
                        const error =
                            t('address_too_long') ||
                            t('address_must_not_exceed_500_characters') ||
                            'Address must not exceed 500 characters';
                    errors.push(error);
                    fieldErrors['clinic.address'] = error;
                }
                
                const fieldMaxLengths: Record<string, number> = {
                    city: 100,
                    apt: 50,
                    house: 50,
                    block: 50,
                    street: 100,
                    avenue: 100,
                    floor: 50,
                    state: 100,
                    postal_code: 20,
                };
                
                    const addressFields = [
                        'block',
                        'street',
                        'avenue',
                        'house',
                        'floor',
                        'apt',
                        'city',
                        'state',
                        'postal_code',
                    ];
                    addressFields.forEach((field) => {
                        const fieldKey =
                            `clinic.${field}` as keyof typeof data.clinic;
                    const fieldValue = data.clinic[fieldKey];
                        if (
                            fieldValue !== null &&
                            fieldValue !== undefined &&
                            typeof fieldValue === 'string'
                        ) {
                        const trimmedValue = fieldValue.trim();
                        const maxLength = fieldMaxLengths[field] || 255;
                        
                        if (trimmedValue.length > 0) {
                            if (trimmedValue.length < 1) {
                                    const error =
                                        t(`${field}_cannot_be_empty`) ||
                                        t('field_cannot_be_empty') ||
                                        `The ${field} field cannot be empty`;
                                errors.push(error);
                                fieldErrors[fieldKey] = error;
                            } else if (trimmedValue.length > maxLength) {
                                    const error =
                                        t(`clinic_${field}_max_length`) ||
                                        t(`${field}_too_long`) ||
                                        t(
                                            'field_must_not_exceed_characters',
                                        )?.replace(
                                            ':max',
                                            maxLength.toString(),
                                        ) ||
                                        `The ${field} field must not be greater than ${maxLength} characters`;
                                errors.push(error);
                                fieldErrors[fieldKey] = error;
                            }
                            
                                if (
                                    field === 'postal_code' &&
                                    trimmedValue &&
                                    !/^\d+$/.test(trimmedValue)
                                ) {
                                    const error =
                                        t('postal_code_must_be_digits') ||
                                        t('postal_code_invalid') ||
                                        'Postal code must contain only digits';
                                errors.push(error);
                                fieldErrors[fieldKey] = error;
                            }
                        } else if (fieldValue.length > 0) {
                                const error =
                                    t(`${field}_cannot_be_empty`) ||
                                    t('field_cannot_be_empty') ||
                                    `The ${field} field cannot be empty`;
                            errors.push(error);
                            fieldErrors[fieldKey] = error;
                        }
                    }
                });
                
                    if (
                        data.clinic.latitude !== null &&
                        data.clinic.latitude !== undefined &&
                        data.clinic.latitude.trim()
                    ) {
                    const lat = parseFloat(data.clinic.latitude.trim());
                    if (isNaN(lat) || lat < -90 || lat > 90) {
                            const error =
                                t('latitude_invalid') ||
                                'Latitude must be between -90 and 90';
                        errors.push(error);
                        fieldErrors['clinic.latitude'] = error;
                    }
                }
                
                    if (
                        data.clinic.longitude !== null &&
                        data.clinic.longitude !== undefined &&
                        data.clinic.longitude.trim()
                    ) {
                    const lng = parseFloat(data.clinic.longitude.trim());
                    if (isNaN(lng) || lng < -180 || lng > 180) {
                            const error =
                                t('longitude_invalid') ||
                                'Longitude must be between -180 and 180';
                        errors.push(error);
                        fieldErrors['clinic.longitude'] = error;
                    }
                }
                
                return { valid: errors.length === 0, errors, fieldErrors };
            }

            case 4:
                // Validate boolean fields - ensure they are actual booleans
                const booleanFields: Record<string, any> = {};
                
                    Object.entries(booleanFields).forEach(
                        ([fieldKey, value]) => {
                    // Check if value is explicitly undefined or null (not set)
                    if (value === undefined || value === null) {
                                const error =
                                    t(
                                        `${fieldKey.replace('clinic.', '')}_required`,
                                    ) ||
                                    `${fieldKey.replace('clinic.', '')} must be true or false`;
                        errors.push(error);
                        fieldErrors[fieldKey] = error;
                            } else if (
                                typeof value !== 'boolean' &&
                                value !== '1' &&
                                value !== '0' &&
                                value !== 1 &&
                                value !== 0
                            ) {
                                const error =
                                    t(
                                        `${fieldKey.replace('clinic.', '')}_must_be_boolean`,
                                    ) ||
                                    `The ${fieldKey.replace('clinic.', '')} field must be true or false`;
                        errors.push(error);
                        fieldErrors[fieldKey] = error;
                    }
                        },
                    );
                
                    // Validate cancellation_policy_en (required)
                    if (!data.clinic.cancellation_policy_en || !data.clinic.cancellation_policy_en.trim()) {
                        const error = t('cancellation_policy_en_required') || 'Cancellation Policy (English) is required';
                        errors.push(error);
                        fieldErrors['clinic.cancellation_policy_en'] = error;
                    } else if (!isEnglishText(data.clinic.cancellation_policy_en)) {
                        const fieldName = t('cancellation_policy_en') || 'Cancellation Policy (English)';
                        const error = t('clinic_name_en_must_be_english') ||
                            t('field_must_be_english_only')?.replace(':attribute', fieldName) ||
                                `${fieldName} must contain only English characters`;
                        errors.push(error);
                        fieldErrors['clinic.cancellation_policy_en'] = error;
                    } else if (data.clinic.cancellation_policy_en.length > 10000) {
                        const error = t('policy_too_long') ||
                            t('policy_must_not_exceed_10000_characters') ||
                            'Policy must not exceed 10000 characters';
                        errors.push(error);
                        fieldErrors['clinic.cancellation_policy_en'] = error;
                    }
                    
                    // Validate cancellation_policy_ar (required)
                    if (!data.clinic.cancellation_policy_ar || !data.clinic.cancellation_policy_ar.trim()) {
                        const error = t('cancellation_policy_ar_required') || 'Cancellation Policy (Arabic) is required';
                        errors.push(error);
                        fieldErrors['clinic.cancellation_policy_ar'] = error;
                    } else if (!isArabicText(data.clinic.cancellation_policy_ar)) {
                        const fieldName = t('cancellation_policy_ar') || 'Cancellation Policy (Arabic)';
                        const error = t('clinic_name_ar_must_be_arabic') ||
                            t('field_must_be_arabic_only')?.replace(':attribute', fieldName) ||
                                `${fieldName} must contain only Arabic characters`;
                        errors.push(error);
                        fieldErrors['clinic.cancellation_policy_ar'] = error;
                    } else if (data.clinic.cancellation_policy_ar.length > 10000) {
                        const error = t('policy_too_long') ||
                            t('policy_must_not_exceed_10000_characters') ||
                            'Policy must not exceed 10000 characters';
                        errors.push(error);
                        fieldErrors['clinic.cancellation_policy_ar'] = error;
                    }
                    
                    // Validate refund_policy_en (required)
                    if (!data.clinic.refund_policy_en || !data.clinic.refund_policy_en.trim()) {
                        const error = t('refund_policy_en_required') || 'Refund Policy (English) is required';
                        errors.push(error);
                        fieldErrors['clinic.refund_policy_en'] = error;
                    } else if (!isEnglishText(data.clinic.refund_policy_en)) {
                        const fieldName = t('refund_policy_en') || 'Refund Policy (English)';
                        const error = t('clinic_name_en_must_be_english') ||
                            t('field_must_be_english_only')?.replace(':attribute', fieldName) ||
                                `${fieldName} must contain only English characters`;
                        errors.push(error);
                        fieldErrors['clinic.refund_policy_en'] = error;
                    } else if (data.clinic.refund_policy_en.length > 10000) {
                        const error = t('policy_too_long') ||
                            t('policy_must_not_exceed_10000_characters') ||
                            'Policy must not exceed 10000 characters';
                        errors.push(error);
                        fieldErrors['clinic.refund_policy_en'] = error;
                    }
                    
                    // Validate refund_policy_ar (required)
                    if (!data.clinic.refund_policy_ar || !data.clinic.refund_policy_ar.trim()) {
                        const error = t('refund_policy_ar_required') || 'Refund Policy (Arabic) is required';
                        errors.push(error);
                        fieldErrors['clinic.refund_policy_ar'] = error;
                    } else if (!isArabicText(data.clinic.refund_policy_ar)) {
                        const fieldName = t('refund_policy_ar') || 'Refund Policy (Arabic)';
                        const error = t('clinic_name_ar_must_be_arabic') ||
                            t('field_must_be_arabic_only')?.replace(':attribute', fieldName) ||
                                `${fieldName} must contain only Arabic characters`;
                        errors.push(error);
                        fieldErrors['clinic.refund_policy_ar'] = error;
                    } else if (data.clinic.refund_policy_ar.length > 10000) {
                        const error = t('policy_too_long') ||
                            t('policy_must_not_exceed_10000_characters') ||
                            'Policy must not exceed 10000 characters';
                        errors.push(error);
                        fieldErrors['clinic.refund_policy_ar'] = error;
                    }
                    
                    if (data.clinic.privacy_policy_en && data.clinic.privacy_policy_en.trim()) {
                        if (!isEnglishText(data.clinic.privacy_policy_en)) {
                            const fieldName = t('privacy_policy_en') || 'Privacy Policy (English)';
                            const error = t('clinic_name_en_must_be_english') ||
                                t('field_must_be_english_only')?.replace(':attribute', fieldName) ||
                                `${fieldName} must contain only English characters`;
                            errors.push(error);
                            fieldErrors['clinic.privacy_policy_en'] = error;
                        } else if (data.clinic.privacy_policy_en.length > 10000) {
                            const error = t('policy_too_long') ||
                                t('policy_must_not_exceed_10000_characters') ||
                                'Policy must not exceed 10000 characters';
                            errors.push(error);
                            fieldErrors['clinic.privacy_policy_en'] = error;
                        }
                    }
                    if (data.clinic.privacy_policy_ar && data.clinic.privacy_policy_ar.trim()) {
                        if (!isArabicText(data.clinic.privacy_policy_ar)) {
                            const fieldName = t('privacy_policy_ar') || 'Privacy Policy (Arabic)';
                            const error = t('clinic_name_ar_must_be_arabic') ||
                                t('field_must_be_arabic_only')?.replace(':attribute', fieldName) ||
                                `${fieldName} must contain only Arabic characters`;
                            errors.push(error);
                            fieldErrors['clinic.privacy_policy_ar'] = error;
                        } else if (data.clinic.privacy_policy_ar.length > 10000) {
                            const error = t('policy_too_long') ||
                                t('policy_must_not_exceed_10000_characters') ||
                                'Policy must not exceed 10000 characters';
                            errors.push(error);
                            fieldErrors['clinic.privacy_policy_ar'] = error;
                        }
                    }
                    if (data.clinic.terms_and_conditions_en && data.clinic.terms_and_conditions_en.trim()) {
                        if (!isEnglishText(data.clinic.terms_and_conditions_en)) {
                            const fieldName = t('terms_and_conditions_en') || 'Terms & Conditions (English)';
                            const error = t('clinic_name_en_must_be_english') ||
                                t('field_must_be_english_only')?.replace(':attribute', fieldName) ||
                                `${fieldName} must contain only English characters`;
                            errors.push(error);
                            fieldErrors['clinic.terms_and_conditions_en'] = error;
                        } else if (data.clinic.terms_and_conditions_en.length > 10000) {
                            const error = t('policy_too_long') ||
                                t('policy_must_not_exceed_10000_characters') ||
                                'Policy must not exceed 10000 characters';
                            errors.push(error);
                            fieldErrors['clinic.terms_and_conditions_en'] = error;
                        }
                    }
                    if (data.clinic.terms_and_conditions_ar && data.clinic.terms_and_conditions_ar.trim()) {
                        if (!isArabicText(data.clinic.terms_and_conditions_ar)) {
                            const fieldName = t('terms_and_conditions_ar') || 'Terms & Conditions (Arabic)';
                            const error = t('clinic_name_ar_must_be_arabic') ||
                                t('field_must_be_arabic_only')?.replace(':attribute', fieldName) ||
                                `${fieldName} must contain only Arabic characters`;
                            errors.push(error);
                            fieldErrors['clinic.terms_and_conditions_ar'] = error;
                        } else if (data.clinic.terms_and_conditions_ar.length > 10000) {
                            const error = t('policy_too_long') ||
                                t('policy_must_not_exceed_10000_characters') ||
                                'Policy must not exceed 10000 characters';
                            errors.push(error);
                            fieldErrors['clinic.terms_and_conditions_ar'] = error;
                        }
                    }
                    
                    // Validate reschedule_policy_en (required)
                    if (!data.clinic.reschedule_policy_en || !data.clinic.reschedule_policy_en.trim()) {
                        const error = t('reschedule_policy_en_required') || 'Reschedule Policy (English) is required';
                        errors.push(error);
                        fieldErrors['clinic.reschedule_policy_en'] = error;
                    } else if (!isEnglishText(data.clinic.reschedule_policy_en)) {
                        const fieldName = t('reschedule_policy_en') || 'Reschedule Policy (English)';
                        const error = t('clinic_name_en_must_be_english') ||
                            t('field_must_be_english_only')?.replace(':attribute', fieldName) ||
                            `${fieldName} must contain only English characters`;
                        errors.push(error);
                        fieldErrors['clinic.reschedule_policy_en'] = error;
                    } else if (data.clinic.reschedule_policy_en.length > 10000) {
                        const error = t('policy_too_long') ||
                            t('policy_must_not_exceed_10000_characters') ||
                            'Policy must not exceed 10000 characters';
                        errors.push(error);
                        fieldErrors['clinic.reschedule_policy_en'] = error;
                    }
                    
                    // Validate reschedule_policy_ar (required)
                    if (!data.clinic.reschedule_policy_ar || !data.clinic.reschedule_policy_ar.trim()) {
                        const error = t('reschedule_policy_ar_required') || 'Reschedule Policy (Arabic) is required';
                        errors.push(error);
                        fieldErrors['clinic.reschedule_policy_ar'] = error;
                    } else if (!isArabicText(data.clinic.reschedule_policy_ar)) {
                        const fieldName = t('reschedule_policy_ar') || 'Reschedule Policy (Arabic)';
                        const error = t('clinic_name_ar_must_be_arabic') ||
                            t('field_must_be_arabic_only')?.replace(':attribute', fieldName) ||
                            `${fieldName} must contain only Arabic characters`;
                        errors.push(error);
                        fieldErrors['clinic.reschedule_policy_ar'] = error;
                    } else if (data.clinic.reschedule_policy_ar.length > 10000) {
                        const error = t('policy_too_long') ||
                            t('policy_must_not_exceed_10000_characters') ||
                            'Policy must not exceed 10000 characters';
                        errors.push(error);
                        fieldErrors['clinic.reschedule_policy_ar'] = error;
                }
                return { valid: errors.length === 0, errors, fieldErrors };

            case 5: {
                let hasValidTimeSlot = false;
                let hasTimeValidationError = false;
                
                    for (
                        let i = 0;
                        i < data.clinic.operating_hours.length;
                        i++
                    ) {
                    const hour = data.clinic.operating_hours[i];
                    if (!hour.closed_all_day && hour.is_open) {
                        if (hour.opening_time && hour.closing_time) {
                                const opening = new Date(
                                    `2000-01-01T${hour.opening_time}`,
                                );
                                const closing = new Date(
                                    `2000-01-01T${hour.closing_time}`,
                                );
                            if (opening >= closing) {
                                    // Use clearer message: start time must not be greater than end time
                                    const error = t('opening_time_cannot_be_greater_than_closing_time') || t('start_time_must_not_be_greater_than_end_time') || t('opening_time_must_be_before_closing_time') || 'Start time must not be greater than end time';
                                errors.push(error);
                                fieldErrors[`operating_hours.${i}`] = error;
                                hasTimeValidationError = true;
                                // Don't break - continue checking other days for time validation errors
                                continue;
                            } else {
                                hasValidTimeSlot = true;
                            }
                            } else if (
                                !hour.opening_time ||
                                !hour.closing_time
                            ) {
                                const error = t(
                                    'opening_and_closing_time_required',
                                );
                            errors.push(error);
                            fieldErrors[`operating_hours.${i}`] = error;
                            // Don't break - continue checking other days
                            continue;
                        }
                    }
                }
                
                // Only show "at least one" error if there are no valid time slots AND no time validation errors
                // (time validation errors should take precedence)
                if (!hasValidTimeSlot && !hasTimeValidationError) {
                        const error =
                            t('at_least_one_operating_hour_required') ||
                            'At least one time of availability should be selected';
                    errors.push(error);
                    if (data.clinic.operating_hours.length > 0) {
                        fieldErrors['operating_hours.0'] = error;
                    }
                    fieldErrors['operating_hours'] = error;
                }
                
                return { valid: errors.length === 0, errors, fieldErrors };
            }

            case 6:
                // Check if files are actually File instances - be very explicit
                const businessLicense = data.clinic.business_license;
                const idDocumentFront = data.clinic.id_document_front;
                
                // File is valid if it's a File instance (not null, not undefined, not empty string)
                const hasBusinessLicense = businessLicense instanceof File;
                const hasIdDocumentFront = idDocumentFront instanceof File;
                
                if (!hasBusinessLicense) {
                    const error = t('business_license_required');
                    errors.push(error);
                    fieldErrors['clinic.business_license'] = error;
                }
                if (!hasIdDocumentFront) {
                    const error = t('id_document_front_required');
                    errors.push(error);
                    fieldErrors['clinic.id_document_front'] = error;
                }
                return { valid: errors.length === 0, errors, fieldErrors };

            case 7:
                return { valid: true, errors: [], fieldErrors: {} };

            default:
                return { valid: true, errors: [], fieldErrors: {} };
        }
        },
        [data, showUserFields, t, isValidPhone],
    );
    
    // Check clinic email uniqueness
    const checkClinicEmailUniqueness = useCallback(
        async (email: string) => {
        if (!email || !email.trim() || !email.includes('@')) {
            return;
        }

        setCheckingEmail(true);
        try {
            const response = await fetch('/register/check-clinic-email', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': getCsrfToken(),
                },
                body: JSON.stringify({ email: email.trim() }),
            });

            const result = await response.json();
            
            if (!result.available) {
                    setValidationErrors((prev) => ({
                    ...prev,
                        'clinic.email':
                            t('clinic_email_already_taken') ||
                            result.message ||
                            'This email is already taken',
                }));
            } else {
                    setValidationErrors((prev) => {
                    const newErrors = { ...prev };
                        if (
                            newErrors['clinic.email'] ===
                            (t('clinic_email_already_taken') ||
                                'This email is already taken')
                        ) {
                        delete newErrors['clinic.email'];
                    }
                    return newErrors;
                });
            }
        } catch (error) {
            console.error('Error checking email:', error);
        } finally {
            setCheckingEmail(false);
        }
        },
        [t],
    );
    
    // Handle field blur
    const handleFieldBlur = useCallback(
        (fieldName: string) => {
            if (
                fieldName === 'clinic.email' &&
                data.clinic.email &&
                data.clinic.email.trim()
            ) {
            checkClinicEmailUniqueness(data.clinic.email);
        }

        if (touchedFields.has(fieldName)) {
            requestAnimationFrame(() => {
                const validation = validateStep(effectiveStep);
                if (!validation.valid && validation.fieldErrors) {
                        setValidationErrors((prev) => {
                            const newErrors = {
                                ...prev,
                                ...validation.fieldErrors!,
                            };
                        if (!validation.fieldErrors![fieldName]) {
                            delete newErrors[fieldName];
                        }
                        return newErrors;
                    });
                } else if (validation.valid) {
                        setValidationErrors((prev) => {
                        const newErrors = { ...prev };
                        delete newErrors[fieldName];
                        return newErrors;
                    });
                }
            });
        }
        },
        [
            effectiveStep,
            validateStep,
            touchedFields,
            data.clinic.email,
            checkClinicEmailUniqueness,
        ],
    );
    
    // Handle next step with validation
    const handleNextStep = async () => {
        setIsNextLoading(true);
        const stepToValidate = effectiveStep;
        
        // Mark fields as touched
        const stepFields: string[] = [];
        switch (stepToValidate) {
            case 1:
                // Only mark user fields as touched if creating new user (not selecting existing)
                if (
                    showUserFields &&
                    !(mode === 'create' && ownerMode === 'select' && user_id)
                ) {
                    stepFields.push(
                        'name',
                        'email',
                        'phone',
                        'password',
                        'password_confirmation',
                    );
                }
                break;
            case 2:
                stepFields.push(
                    'clinic.name_en',
                    'clinic.name_ar',
                    'clinic.phone',
                    'clinic.category_id',
                );
                break;
            case 3:
                stepFields.push(
                    'clinic.governorate_id',
                    'clinic.area_id',
                    'clinic.address',
                );
                break;
            case 4:
                // Mark boolean fields as touched for step 4 (settings/policies)
                // No notification fields to validate
                break;
            case 6:
                stepFields.push(
                    'clinic.business_license',
                    'clinic.id_document_front',
                );
                break;
        }
        
        const newTouchedFields = new Set(touchedFields);
        stepFields.forEach((field) => {
            newTouchedFields.add(field);
        });
        setTouchedFields(newTouchedFields);
        
        // Client-side validation
        const validation = validateStep(stepToValidate);
        
        // For step 6, if files are actually File instances, clear errors even if validation failed
        if (stepToValidate === 6) {
            const hasBusinessLicense =
                data.clinic.business_license instanceof File;
            const hasIdDocumentFront =
                data.clinic.id_document_front instanceof File;
            
            // If files are actually File instances, override validation errors
            if (hasBusinessLicense && hasIdDocumentFront) {
                // Clear file-related errors since files are present
                if (validation.fieldErrors) {
                    delete validation.fieldErrors['clinic.business_license'];
                    delete validation.fieldErrors['clinic.id_document_front'];
                    // Recalculate valid status
                    const remainingErrors = Object.keys(
                        validation.fieldErrors,
                    ).length;
                    if (remainingErrors === 0) {
                        validation.valid = true;
                        validation.errors = [];
                    }
                }
            }
        }
        
        if (validation.fieldErrors) {
            setValidationErrors(validation.fieldErrors);
        } else {
            setValidationErrors({});
        }
        
        if (!validation.valid) {
            if (validation.errors.length > 0) {
                validation.errors.forEach((error) => {
                    customToast.error(error);
                });
            }
            window.scrollTo({ top: 0, behavior: 'smooth' });
            setIsNextLoading(false);
            return;
        }

        // Backend validation - check email/phone uniqueness for step 1 when creating new user
        // Only for register mode - for create mode, backend validation will handle it
        if (stepToValidate === 1 && mode === 'register' && showUserFields) {
            try {
                // Check email uniqueness
                if (data.email && data.email.trim()) {
                    const emailCheck = await checkUserEmailUniqueness(
                        data.email,
                    );
                    if (!emailCheck.available) {
                        const emailError =
                            emailCheck.message ||
                            t('email_already_taken') ||
                            'The email has already been taken.';
                        setValidationErrors((prev) => ({
                            ...prev,
                            email: emailError,
                        }));
                        customToast.error(emailError);
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                        // Scroll to email field
                        setTimeout(() => {
                            const emailField = document.getElementById('email');
                            if (emailField) {
                                emailField.scrollIntoView({
                                    behavior: 'smooth',
                                    block: 'center',
                                });
                                emailField.focus();
                            }
                        }, 100);
                        setIsNextLoading(false);
                        return;
                    }
                }

                // Check phone uniqueness
                if (data.phone && data.phone.trim()) {
                    const phoneCheck = await checkUserPhoneUniqueness(
                        data.phone,
                    );
                    if (!phoneCheck.available) {
                        const phoneError =
                            phoneCheck.message ||
                            t('phone_already_taken') ||
                            'The phone number has already been taken.';
                        setValidationErrors((prev) => ({
                            ...prev,
                            phone: phoneError,
                        }));
                        customToast.error(phoneError);
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                        // Scroll to phone field
                        setTimeout(() => {
                            const phoneField = document.getElementById('phone');
                            if (phoneField) {
                                phoneField.scrollIntoView({
                                    behavior: 'smooth',
                                    block: 'center',
                                });
                                phoneField.focus();
                            }
                        }, 100);
                        setIsNextLoading(false);
                        return;
                    }
                }
            } catch (error) {
                console.error(
                    'Error checking user email/phone uniqueness:',
                    error,
                );
                // Silently fail - backend validation will catch it
                setIsNextLoading(false);
            }
        }

        // Backend validation (for register and create modes)
        try {
            const backendValidation =
                await validateStepWithBackend(stepToValidate);
            
            if (!backendValidation.valid) {
                const fieldErrors: Record<string, string> = {};
                const newTouchedFields2 = new Set(touchedFields);
                
                // Filter out user field errors when selecting existing user
                const userFields = [
                    'name',
                    'email',
                    'phone',
                    'password',
                    'password_confirmation',
                    'user_id',
                    'user',
                ];
                const shouldFilterUserFields =
                    mode === 'create' && ownerMode === 'select' && user_id;
                
                // For step 6, ALWAYS filter out file errors if files are File instances
                if (stepToValidate === 6) {
                    const hasBusinessLicense =
                        data.clinic.business_license instanceof File;
                    const hasIdDocumentFront =
                        data.clinic.id_document_front instanceof File;
                    
                    Object.keys(backendValidation.errors).forEach((key) => {
                        // ALWAYS skip file errors if files are File instances - backend might not see them but frontend does
                        if (
                            key === 'clinic.business_license' ||
                            key === 'business_license'
                        ) {
                            if (hasBusinessLicense) {
                                return; // Skip this error - file is present
                            }
                        }
                        if (
                            key === 'clinic.id_document_front' ||
                            key === 'id_document_front'
                        ) {
                            if (hasIdDocumentFront) {
                                return; // Skip this error - file is present
                            }
                        }
                        
                        // Skip user field errors if selecting existing user
                        if (
                            shouldFilterUserFields &&
                            (userFields.includes(key) ||
                                key.toLowerCase().includes('user'))
                        ) {
                            return;
                        }
                        
                        const errors = backendValidation.errors[key];
                        if (Array.isArray(errors) && errors.length > 0) {
                            fieldErrors[key] = errors[0];
                            newTouchedFields2.add(key);
                        } else if (typeof errors === 'string') {
                            fieldErrors[key] = errors;
                            newTouchedFields2.add(key);
                        }
                    });
                } else {
                    Object.keys(backendValidation.errors).forEach((key) => {
                        // Skip user field errors if selecting existing user (including user_id and user)
                        if (
                            shouldFilterUserFields &&
                            (userFields.includes(key) ||
                                key.toLowerCase().includes('user'))
                        ) {
                            return;
                        }
                        
                        const errors = backendValidation.errors[key];
                        if (Array.isArray(errors) && errors.length > 0) {
                            fieldErrors[key] = errors[0];
                            newTouchedFields2.add(key);
                        } else if (typeof errors === 'string') {
                            fieldErrors[key] = errors;
                            newTouchedFields2.add(key);
                        }
                    });
                }
                
                setValidationErrors(fieldErrors);
                setTouchedFields(newTouchedFields2);
                
                // Show toast for each error and scroll to first error field
                Object.entries(backendValidation.errors).forEach(
                    ([key, errorArray]) => {
                    if (key === '_general') {
                        // Show general errors as toast
                        if (Array.isArray(errorArray)) {
                                errorArray.forEach((error) =>
                                    customToast.error(error),
                                );
                        } else if (typeof errorArray === 'string') {
                            customToast.error(errorArray);
                        }
                    } else {
                        // Show field-specific errors as toast
                        if (Array.isArray(errorArray)) {
                                errorArray.forEach((error) =>
                                    customToast.error(error),
                                );
                        } else if (typeof errorArray === 'string') {
                            customToast.error(errorArray);
                        }
                    }
                    },
                );
                
                // Scroll to first error field
                const firstErrorField = Object.keys(fieldErrors).find(
                    (key) => key !== '_general',
                );
                if (firstErrorField) {
                    const fieldName = firstErrorField.replace(/clinic\./g, '');
                    const selectors = [
                        `[name="${firstErrorField}"]`,
                        `[name="${fieldName}"]`,
                        `#${firstErrorField}`,
                        `#${fieldName}`,
                        `input[id*="${fieldName}"]`,
                    ];
                    
                    for (const selector of selectors) {
                        try {
                            const errorElement =
                                document.querySelector(selector);
                            if (errorElement) {
                                setTimeout(() => {
                                    errorElement.scrollIntoView({
                                        behavior: 'smooth',
                                        block: 'center',
                                    });
                                    (errorElement as HTMLElement).focus();
                                }, 100);
                                break;
                            }
                        } catch {
                            // Ignore selector errors
                        }
                    }
                } else {
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                }
                
                setIsNextLoading(false);
                return;
            }
        } catch (error) {
            console.error('Backend validation error:', error);
            const errorMessage =
                error instanceof Error
                ? error.message 
                    : t('something_went_wrong') ||
                      'Something went wrong. Please try again later.';
            
            customToast.error(errorMessage);
            window.scrollTo({ top: 0, behavior: 'smooth' });
            setIsNextLoading(false);
            return;
        }

        if (currentStep < totalSteps) {
            setValidationErrors({});
            setTouchedFields(new Set());
            setCurrentStep(currentStep + 1);
            onStepChange?.(currentStep + 1);
            window.scrollTo({ top: 0, behavior: 'smooth' });
            // Reset loading after a brief delay to ensure UI updates
            requestAnimationFrame(() => {
                setIsNextLoading(false);
            });
        } else {
            setIsNextLoading(false);
        }
    };

    // Steps configuration - adjust based on showUserFields
    const steps = showUserFields
        ? [
        { number: 1, title: t('account_information'), icon: Building2 },
        { number: 2, title: t('clinic_basic_info'), icon: FileText },
        { number: 3, title: t('address_location'), icon: MapPin },
        { number: 4, title: t('settings_policies'), icon: Settings },
        { number: 5, title: t('operating_hours'), icon: Clock },
        { number: 6, title: t('documents'), icon: Upload },
        // { number: 7, title: t('subscription'), icon: CreditCard }, // COMMENTED OUT - Subscription step hidden
          ]
        : [
        { number: 1, title: t('clinic_basic_info'), icon: Building2 },
        { number: 2, title: t('address_location'), icon: MapPin },
        { number: 3, title: t('settings_policies'), icon: Settings },
        { number: 4, title: t('operating_hours'), icon: Clock },
        { number: 5, title: t('documents'), icon: Upload },
        // { number: 6, title: t('subscription'), icon: CreditCard }, // COMMENTED OUT - Subscription step hidden
    ];

    const handleSubmit: FormEventHandler = (e) => {
        e.preventDefault();
        if (readOnly) return;
        
        if (onSubmit) {
            onSubmit(data);
        }
    };

    // If showing as tabs, render tabs layout
    if (showAsTabs) {
        return (
            <form onSubmit={handleSubmit} encType="multipart/form-data">
                <Tabs
                    value={currentStep.toString()}
                    onValueChange={(value) => {
                const step = parseInt(value);
                setCurrentStep(step);
                onStepChange?.(step);
                    }}
                    className="w-full"
                >
                <TabsList className="grid w-full grid-cols-6">
                    {steps.map((step) => {
                        const StepIcon = step.icon;
                        return (
                                <TabsTrigger
                                    key={step.number}
                                    value={step.number.toString()}
                                >
                                    <StepIcon className="mr-2 h-4 w-4" />
                                {step.title}
                            </TabsTrigger>
                        );
                    })}
                </TabsList>
                
                {steps.map((step) => {
                    // Calculate effective step for this tab to match wizard logic
                        const tabEffectiveStep = showUserFields
                            ? step.number
                            : step.number + 1;
                    
                    return (
                            <TabsContent
                                key={step.number}
                                value={step.number.toString()}
                                className="mt-6"
                            >
                                <div className="rounded-lg border bg-card p-6">
                                {/* Render step content directly in tab - duplicate wizard content but check tabEffectiveStep */}
                                {/* The wizard content below is hidden in tab mode, so we render it here */}
                                {(() => {
                                    // Temporarily override effectiveStep to render this tab's content
                                        const savedEffectiveStep =
                                            effectiveStep;
                                    const renderStep = tabEffectiveStep;
                                    
                                    // Step 1: Account Information
                                        if (
                                            showUserFields &&
                                            renderStep === 1
                                        ) {
                                        return (
                                            <div className="space-y-6">
                                                    <div className="mb-6 flex items-center gap-3">
                                                    <Building2 className="h-6 w-6 text-primary" />
                                                    <h2 className="text-2xl font-semibold text-foreground">
                                                            {t(
                                                                'account_information',
                                                            )}
                                                    </h2>
                                                </div>
                                                
                                                {/* Owner Selection (only in create mode, not in edit mode) */}
                                                    {mode === 'create' &&
                                                        ownerMode !==
                                                            undefined &&
                                                        onOwnerModeChange && (
                                                            <div className="mb-6 space-y-4 rounded-lg border bg-muted/50 p-4">
                                                                <Label className="text-base font-semibold">
                                                                    {t(
                                                                        'clinic_owner',
                                                                    )}
                                                                </Label>
                                                        {canChangeOwner ? (
                                                        <div className="flex gap-4">
                                                            <Button
                                                                type="button"
                                                                            variant={
                                                                                ownerMode ===
                                                                                'create'
                                                                                    ? 'default'
                                                                                    : 'outline'
                                                                            }
                                                                size="sm"
                                                                            onClick={() =>
                                                                                onOwnerModeChange(
                                                                                    'create',
                                                                                )
                                                                            }
                                                            >
                                                                            {t(
                                                                                'add_personal_information',
                                                                            ) ||
                                                                                'Add Personal Information'}
                                                            </Button>
                                                            <Button
                                                                type="button"
                                                                            variant={
                                                                                ownerMode ===
                                                                                'select'
                                                                                    ? 'default'
                                                                                    : 'outline'
                                                                            }
                                                                size="sm"
                                                                            onClick={() =>
                                                                                onOwnerModeChange(
                                                                                    'select',
                                                                                )
                                                                            }
                                                            >
                                                                            {t(
                                                                                'select_existing_owner',
                                                                            ) ||
                                                                                'Select Existing Owner'}
                                                            </Button>
                                                        </div>
                                                        ) : (
                                                            <p className="text-sm text-muted-foreground">
                                                                {t('owner_selection_locked') || 'Owner selection is locked based on your role.'}
                                                            </p>
                                                        )}

                                                                {(ownerMode ===
                                                                    'select' ||
                                                                    (mode ===
                                                                        'edit' &&
                                                                        ownerMode ===
                                                                            'select')) && (
                                                                    <div className="mt-4 space-y-2">
                                                                <Label htmlFor="user_id_tab">
                                                                            {t(
                                                                                'select_user',
                                                                            )}{' '}
                                                                            <span className="text-red-500">
                                                                                *
                                                                            </span>
                                                                </Label>
                                                                <Select 
                                                                            value={
                                                                                user_id ||
                                                                                ''
                                                                            }
                                                                            onValueChange={(
                                                                                value,
                                                                            ) => {
                                                                                // Prevent changing owner if not allowed
                                                                                if (!canChangeOwner) {
                                                                                    return;
                                                                                }
                                                                                onUserIdChange?.(
                                                                                    value,
                                                                                );
                                                                            }}
                                                                            disabled={!canChangeOwner}
                                                                >
                                                                            <SelectTrigger
                                                                                className={
                                                                                    (
                                                                                        externalErrors as any
                                                                                    )
                                                                                        .user_id
                                                                                        ? 'border-red-500'
                                                                                        : ''
                                                                                }
                                                                                disabled={!canChangeOwner}
                                                                            >
                                                                                <SelectValue
                                                                                    placeholder={t(
                                                                                        'select_user',
                                                                                    )}
                                                                                />
                                                                    </SelectTrigger>
                                                                    <SelectContent>
                                                                                {users.map(
                                                                                    (
                                                                                        user,
                                                                                    ) => (
                                                                                        <SelectItem
                                                                                            key={
                                                                                                user.id
                                                                                            }
                                                                                            value={user.id.toString()}
                                                                                        >
                                                                                            {
                                                                                                user.name
                                                                                            }{' '}
                                                                                            (
                                                                                            {
                                                                                                user.email
                                                                                            }
                                                                                            )
                                                                            </SelectItem>
                                                                                    ),
                                                                                )}
                                                                    </SelectContent>
                                                                </Select>
                                                                        <InputError
                                                                            message={
                                                                                (
                                                                                    externalErrors as any
                                                                                )
                                                                                    .user_id
                                                                            }
                                                                        />
                                                            </div>
                                                        )}
                                                    </div>
                                                )}
                                                
                                                {/* User Selection for Edit Mode (when ownerMode is select) */}
                                                    {mode === 'edit' &&
                                                        ownerMode ===
                                                            'select' && (
                                <div className="space-y-4">
                                                        <div className="space-y-2">
                                                            <Label htmlFor="user_id_edit_tab">
                                                                        {t(
                                                                            'clinic_owner',
                                                                        )}{' '}
                                                                        <span className="text-red-500">
                                                                            *
                                                                        </span>
                                                            </Label>
                                                            <Select 
                                                                        value={
                                                                            user_id ||
                                                                            ''
                                                                        }
                                                                        onValueChange={(
                                                                            value,
                                                                        ) =>
                                                                            onUserIdChange?.(
                                                                                value,
                                                                            )
                                                                        }
                                                            >
                                                                        <SelectTrigger
                                                                            className={
                                                                                (
                                                                                    externalErrors as any
                                                                                )
                                                                                    .user_id
                                                                                    ? 'border-red-500'
                                                                                    : ''
                                                                            }
                                                                        >
                                                                            <SelectValue
                                                                                placeholder={t(
                                                                                    'select_user',
                                                                                )}
                                                                            />
                                                                </SelectTrigger>
                                                                <SelectContent>
                                                                            {users.map(
                                                                                (
                                                                                    user,
                                                                                ) => (
                                                                                    <SelectItem
                                                                                        key={
                                                                                            user.id
                                                                                        }
                                                                                        value={user.id.toString()}
                                                                                    >
                                                                                        {
                                                                                            user.name
                                                                                        }{' '}
                                                                                        (
                                                                                        {
                                                                                            user.email
                                                                                        }
                                                                                        )
                                                                        </SelectItem>
                                                                                ),
                                                                            )}
                                                                </SelectContent>
                                                            </Select>
                                                                    <InputError
                                                                        message={
                                                                            (
                                                                                externalErrors as any
                                                                            )
                                                                                .user_id
                                                                        }
                                                                    />
                                                            <p className="text-sm text-muted-foreground">
                                                                        {t(
                                                                            'select_clinic_owner_description',
                                                                        ) ||
                                                                            'Select the user who owns this clinic.'}
                                                            </p>
                                                        </div>
                                                        
                                                        {/* Display Selected Owner Information */}
                                                                {user_id &&
                                                                    (() => {
                                                                        const selectedUser =
                                                                            users.find(
                                                                                (
                                                                                    u,
                                                                                ) =>
                                                                                    u.id.toString() ===
                                                                                    user_id,
                                                                            );
                                                            return selectedUser ? (
                                                                            <div className="space-y-2 rounded-lg border bg-muted/50 p-4">
                                                                                <p className="text-sm font-medium text-muted-foreground">
                                                                                    {t(
                                                                                        'selected_owner',
                                                                                    ) ||
                                                                                        'Selected Owner'}
                                                                                </p>
                                                                                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                                                        <div>
                                                                                        <p className="text-xs text-muted-foreground">
                                                                                            {t(
                                                                                                'full_name',
                                                                                            )}
                                                                                        </p>
                                                                                        <p className="text-base font-medium text-foreground">
                                                                                            {
                                                                                                selectedUser.name
                                                                                            }
                                                                                        </p>
                                                                        </div>
                                                                        <div>
                                                                                        <p className="text-xs text-muted-foreground">
                                                                                            {t(
                                                                                                'email',
                                                                                            )}
                                                                                        </p>
                                                                                        <p className="text-base font-medium text-foreground">
                                                                                            {
                                                                                                selectedUser.email
                                                                                            }
                                                                                        </p>
                                                                        </div>
                                                                        {selectedUser.phone && (
                                                                            <div>
                                                                                            <p className="text-xs text-muted-foreground">
                                                                                                {t(
                                                                                                    'phone_number',
                                                                                                )}
                                                                                            </p>
                                                                                            <p className="text-base font-medium text-foreground">
                                                                                                {
                                                                                                    selectedUser.phone
                                                                                                }
                                                                                            </p>
                                                                            </div>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                            ) : null;
                                                        })()}
                                                    </div>
                                                )}
                                                
                                                {/* Display Owner Information in View Mode */}
                                                {mode === 'view' && (
                                                        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                                                        <div className="space-y-2">
                                                                <Label className="text-sm font-medium text-muted-foreground">
                                                                    {t(
                                                                        'full_name',
                                                                    )}
                                                                </Label>
                                                                <div className="text-base font-medium text-foreground">
                                                                    {data.name ||
                                                                        '—'}
                                                                </div>
                                                        </div>
                                                        <div className="space-y-2">
                                                                <Label className="text-sm font-medium text-muted-foreground">
                                                                    {t('email')}
                                                                </Label>
                                                                <div className="text-base font-medium text-foreground">
                                                                    {data.email ||
                                                                        '—'}
                                                                </div>
                                                        </div>
                                                        <div className="space-y-2">
                                                                <Label className="text-sm font-medium text-muted-foreground">
                                                                    {t(
                                                                        'phone_number',
                                                                    )}
                                                                </Label>
                                                                <div className="text-base font-medium text-foreground">
                                                                    {data.phone ||
                                                                        '—'}
                                                                </div>
                                                        </div>
                                                        {data.user_id && (
                                                            <div className="space-y-2">
                                                                    <Label className="text-sm font-medium text-muted-foreground">
                                                                        {t(
                                                                            'user_id',
                                                                        ) ||
                                                                            'User ID'}
                                                                    </Label>
                                                                    <div className="text-base font-medium text-foreground">
                                                                        #
                                                                        {
                                                                            data.user_id
                                                                        }
                                                                    </div>
                                                            </div>
                                                        )}
                                                    </div>
                                                )}
                                                
                                                {/* User Account Fields */}
                                                    {(mode === 'register' ||
                                                        (mode === 'create' &&
                                                            ownerMode ===
                                                                'create') ||
                                                        (mode === 'edit' &&
                                                            ownerMode ===
                                                                'create')) && (
                                                        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                                                        <div className="space-y-2">
                                                            <Label htmlFor="name_tab">
                                                                    {t(
                                                                        'full_name',
                                                                    )}{' '}
                                                                    <span className="text-red-500">
                                                                        *
                                                                    </span>
                                                            </Label>
                                                            <Input
                                                                id="name_tab"
                                                                type="text"
                                                                required
                                                                    value={
                                                                        data.name ||
                                                                        ''
                                                                    }
                                                                    maxLength={
                                                                        30
                                                                    }
                                                                    onChange={(
                                                                        e,
                                                                    ) => {
                                                                        const value =
                                                                            e.target.value.trimStart();
                                                                        const limitedValue =
                                                                            value.slice(
                                                                                0,
                                                                                30,
                                                                            );
                                                                        setData(
                                                                            'name' as any,
                                                                            limitedValue,
                                                                        );
                                                                        if (
                                                                            validationErrors.name
                                                                        ) {
                                                                            setValidationErrors(
                                                                                (
                                                                                    prev,
                                                                                ) => {
                                                                                    const newErrors =
                                                                                        {
                                                                                            ...prev,
                                                                                        };
                                                                            delete newErrors.name;
                                                                            return newErrors;
                                                                                },
                                                                            );
                                                                    }
                                                                }}
                                                                    onBlur={(
                                                                        e,
                                                                    ) => {
                                                                        const trimmed =
                                                                            e.target.value.trim();
                                                                        setData(
                                                                            'name' as any,
                                                                            trimmed,
                                                                        );
                                                                        handleFieldBlur(
                                                                            'name',
                                                                        );
                                                                }}
                                                                    placeholder={t(
                                                                        'enter_full_name',
                                                                    )}
                                                                    className={`${formErrors.name || (externalErrors as any).name || validationErrors.name ? 'border-red-500' : ''}`}
                                                                    disabled={
                                                                        readOnly
                                                                    }
                                                            />
                                                                <InputError
                                                                    message={
                                                                        formErrors.name ||
                                                                        (
                                                                            externalErrors as any
                                                                        )
                                                                            .name ||
                                                                        validationErrors.name
                                                                    }
                                                                />
                                                        </div>

                                                        <div className="space-y-2">
                                                            <Label htmlFor="phone_tab">
                                                                    {t(
                                                                        'phone_number',
                                                                    )}{' '}
                                                                    <span className="text-red-500">
                                                                        *
                                                                    </span>
                                                            </Label>
                                                            <PhoneInput
                                                                id="phone_tab"
                                                                required
                                                                    value={
                                                                        data.phone ||
                                                                        ''
                                                                    }
                                                                    onChange={(
                                                                        value,
                                                                    ) => {
                                                                        setData(
                                                                            'phone' as any,
                                                                            value,
                                                                        );
                                                                        if (
                                                                            validationErrors.phone
                                                                        ) {
                                                                            setValidationErrors(
                                                                                (
                                                                                    prev,
                                                                                ) => {
                                                                                    const newErrors =
                                                                                        {
                                                                                            ...prev,
                                                                                        };
                                                                            delete newErrors.phone;
                                                                            return newErrors;
                                                                                },
                                                                            );
                                                                    }
                                                                }}
                                                                    onBlur={() =>
                                                                        handleFieldBlur(
                                                                            'phone',
                                                                        )
                                                                    }
                                                                    className={
                                                                        formErrors.phone ||
                                                                        (
                                                                            externalErrors as any
                                                                        )
                                                                            .phone ||
                                                                        validationErrors.phone
                                                                            ? 'border-red-500'
                                                                            : ''
                                                                    }
                                                                    disabled={
                                                                        readOnly
                                                                    }
                                                            />
                                                                <InputError
                                                                    message={
                                                                        formErrors.phone ||
                                                                        (
                                                                            externalErrors as any
                                                                        )
                                                                            .phone ||
                                                                        validationErrors.phone
                                                                    }
                                                                />
                                                                <p className="text-xs text-muted-foreground">
                                                                    {t(
                                                                        'phone_format_hint',
                                                                    )}
                                                                </p>
                                        </div>

                                                        <div className="space-y-2">
                                                            <Label htmlFor="email_tab">
                                                                    {t(
                                                                        'email_address',
                                                                    )}{' '}
                                                                    <span className="text-red-500">
                                                                        *
                                                                    </span>
                                                            </Label>
                                                            <div className="relative">
                                                                <Input
                                                                    id="email_tab"
                                                                    type="email"
                                                                    required
                                                                        value={
                                                                            data.email ||
                                                                            ''
                                                                        }
                                                                        onChange={(
                                                                            e,
                                                                        ) => {
                                                                            const value =
                                                                                e.target.value.trimStart();
                                                                            setData(
                                                                                'email' as any,
                                                                                value,
                                                                            );
                                                                            if (
                                                                                validationErrors.email
                                                                            ) {
                                                                                setValidationErrors(
                                                                                    (
                                                                                        prev,
                                                                                    ) => {
                                                                                        const newErrors =
                                                                                            {
                                                                                                ...prev,
                                                                                            };
                                                                                delete newErrors.email;
                                                                                return newErrors;
                                                                                    },
                                                                                );
                                                                        }
                                                                    }}
                                                                        onBlur={(
                                                                            e,
                                                                        ) => {
                                                                            const trimmed =
                                                                                e.target.value
                                                                                    .trim()
                                                                                    .toLowerCase();
                                                                            setData(
                                                                                'email' as any,
                                                                                trimmed,
                                                                            );
                                                                            handleFieldBlur(
                                                                                'email',
                                                                            );
                                                                    }}
                                                                        placeholder={t(
                                                                            'email_example',
                                                                        )}
                                                                        className={`${formErrors.email || (externalErrors as any).email || validationErrors.email ? 'border-red-500' : ''}`}
                                                                        disabled={
                                                                            readOnly
                                                                        }
                                                                />
                                                            </div>
                                                                <InputError
                                                                    message={
                                                                        formErrors.email ||
                                                                        (
                                                                            externalErrors as any
                                                                        )
                                                                            .email ||
                                                                        validationErrors.email
                                                                    }
                                                                />
                                                        </div>

                                                        <div className="space-y-2">
                                                            <Label htmlFor="password_tab">
                                                                    {t(
                                                                        'password',
                                                                    )}{' '}
                                                                    <span className="text-red-500">
                                                                        *
                                                                    </span>
                                                            </Label>
                                                            <PasswordInput
                                                                id="password_tab"
                                                                required
                                                                    value={
                                                                        data.password ||
                                                                        ''
                                                                    }
                                                                    showValidation={
                                                                        true
                                                                    }
                                                                    onChange={(
                                                                        e,
                                                                    ) => {
                                                                        setData(
                                                                            'password' as any,
                                                                            e
                                                                                .target
                                                                                .value,
                                                                        );
                                                                        if (
                                                                            validationErrors.password
                                                                        ) {
                                                                            setValidationErrors(
                                                                                (
                                                                                    prev,
                                                                                ) => {
                                                                                    const newErrors =
                                                                                        {
                                                                                            ...prev,
                                                                                        };
                                                                            delete newErrors.password;
                                                                            return newErrors;
                                                                                },
                                                                            );
                                                                    }
                                                                }}
                                                                    onBlur={() =>
                                                                        handleFieldBlur(
                                                                            'password',
                                                                        )
                                                                    }
                                                                    placeholder={t(
                                                                        'password',
                                                                    )}
                                                                    error={
                                                                        formErrors.password ||
                                                                        (
                                                                            externalErrors as any
                                                                        )
                                                                            .password ||
                                                                        validationErrors.password
                                                                    }
                                                                    disabled={
                                                                        readOnly
                                                                    }
                                                            />
                                                                <InputError
                                                                    message={
                                                                        formErrors.password ||
                                                                        (
                                                                            externalErrors as any
                                                                        )
                                                                            .password ||
                                                                        validationErrors.password
                                                                    }
                                                                />
                                                </div>

                                                        <div className="space-y-2 md:col-span-2">
                                                            <Label htmlFor="password_confirmation_tab">
                                                                    {t(
                                                                        'confirm_password',
                                                                    )}{' '}
                                                                    <span className="text-red-500">
                                                                        *
                                                                    </span>
                                                            </Label>
                                                            <PasswordInput
                                                                id="password_confirmation_tab"
                                                                required
                                                                    value={
                                                                        data.password_confirmation ||
                                                                        ''
                                                                    }
                                                                    onChange={(
                                                                        e,
                                                                    ) => {
                                                                        setData(
                                                                            'password_confirmation' as any,
                                                                            e
                                                                                .target
                                                                                .value,
                                                                        );
                                                                        if (
                                                                            validationErrors.password_confirmation
                                                                        ) {
                                                                            setValidationErrors(
                                                                                (
                                                                                    prev,
                                                                                ) => {
                                                                                    const newErrors =
                                                                                        {
                                                                                            ...prev,
                                                                                        };
                                                                            delete newErrors.password_confirmation;
                                                                            return newErrors;
                                                                                },
                                                                            );
                                                                    }
                                                                }}
                                                                    onBlur={() =>
                                                                        handleFieldBlur(
                                                                            'password_confirmation',
                                                                        )
                                                                    }
                                                                    placeholder={t(
                                                                        'confirm_password',
                                                                    )}
                                                                    error={
                                                                        formErrors.password_confirmation ||
                                                                        (
                                                                            externalErrors as any
                                                                        )
                                                                            .password_confirmation ||
                                                                        validationErrors.password_confirmation
                                                                    }
                                                                    disabled={
                                                                        readOnly
                                                                    }
                                                            />
                                                                <InputError
                                                                    message={
                                                                        formErrors.password_confirmation ||
                                                                        (
                                                                            externalErrors as any
                                                                        )
                                                                            .password_confirmation ||
                                                                        validationErrors.password_confirmation
                                                                    }
                                                                />
                                    </div>
                                </div>
                                                )}
                                                
                                                {/* Show message when selecting existing owner */}
                                                    {mode === 'create' &&
                                                        ownerMode ===
                                                            'select' &&
                                                        user_id && (
                                                            <div className="rounded-lg border border-green-200 bg-green-50 p-4 dark:border-green-800 dark:bg-green-900/20">
                                                        <p className="text-sm text-green-800 dark:text-green-200">
                                                                    {t(
                                                                        'owner_selected',
                                                                    ) ||
                                                                        'Owner selected. Proceed to clinic information.'}
                                                        </p>
                                                    </div>
                            )}
                                                </div>
                                            );
                                    }
                                    
                                    // Step 2: Clinic Basic Information
                                    if (renderStep === 2) {
                                        return (
                                            <div className="space-y-6">
                                                    <div className="mb-6 flex items-center gap-3">
                                                    <FileText className="h-6 w-6 text-primary" />
                                                    <h2 className="text-2xl font-semibold text-foreground">
                                                            {t(
                                                                'clinic_basic_info',
                                                            )}
                                                    </h2>
                                    </div>
                                                
                                                    <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                                                    <div className="space-y-2">
                                                        <Label htmlFor="clinic.name_en_tab">
                                                                {t(
                                                                    'clinic_name_en',
                                                                )}{' '}
                                                                <span className="text-red-500">
                                                                    *
                                                                </span>
                                                        </Label>
                                                        <Input
                                                            id="clinic.name_en_tab"
                                                            type="text"
                                                            required
                                                                value={
                                                                    data.clinic
                                                                        .name_en
                                                                }
                                                            maxLength={30}
                                                                onChange={(
                                                                    e,
                                                                ) => {
                                                                    const value =
                                                                        e.target.value.trimStart();
                                                                    const limitedValue =
                                                                        value.slice(
                                                                            0,
                                                                            30,
                                                                        );
                                                                    (
                                                                        setData as any
                                                                    )(
                                                                        'clinic.name_en',
                                                                        limitedValue,
                                                                    );
                                                                    if (
                                                                        value &&
                                                                        value.trim()
                                                                    ) {
                                                                        const englishPattern =
                                                                            /^[a-zA-Z0-9\s\-_.,;:!?@#$%^&*()[\]{}""''/]+$/;
                                                                        if (
                                                                            !englishPattern.test(
                                                                                value,
                                                                            )
                                                                        ) {
                                                                            setValidationErrors(
                                                                                (
                                                                                    prev,
                                                                                ) => ({
                                                                            ...prev,
                                                                                    'clinic.name_en':
                                                                                        t(
                                                                                            'clinic_name_en_must_be_english',
                                                                                        ),
                                                                                }),
                                                                            );
                                                                    } else {
                                                                            setValidationErrors(
                                                                                (
                                                                                    prev,
                                                                                ) => {
                                                                                    const newErrors =
                                                                                        {
                                                                                            ...prev,
                                                                                        };
                                                                                    delete newErrors[
                                                                                        'clinic.name_en'
                                                                                    ];
                                                                            return newErrors;
                                                                                },
                                                                            );
                                                                    }
                                                                } else {
                                                                        setValidationErrors(
                                                                            (
                                                                                prev,
                                                                            ) => {
                                                                                const newErrors =
                                                                                    {
                                                                                        ...prev,
                                                                                    };
                                                                                delete newErrors[
                                                                                    'clinic.name_en'
                                                                                ];
                                                                        return newErrors;
                                                                            },
                                                                        );
                                                                }
                                                            }}
                                                            onBlur={(e) => {
                                                                    const trimmed =
                                                                        e.target.value.trim();
                                                                    (
                                                                        setData as any
                                                                    )(
                                                                        'clinic.name_en',
                                                                        trimmed,
                                                                    );
                                                                    handleFieldBlur(
                                                                        'clinic.name_en',
                                                                    );
                                                            }}
                                                                placeholder={t(
                                                                    'enter_clinic_name_en',
                                                                )}
                                                            className={`${getFieldError('clinic.name_en') ? 'border-red-500' : ''}`}
                                                                disabled={
                                                                    readOnly
                                                                }
                                                        />
                                                            <InputError
                                                                message={getFieldError(
                                                                    'clinic.name_en',
                                                                )}
                                                            />
                                </div>

                                                    <div className="space-y-2">
                                                        <Label htmlFor="clinic.name_ar_tab">
                                                                {t(
                                                                    'clinic_name_ar',
                                                                )}{' '}
                                                                <span className="text-red-500">
                                                                    *
                                                                </span>
                                                        </Label>
                                                        <Input
                                                            id="clinic.name_ar_tab"
                                                            type="text"
                                                            required
                                                                value={
                                                                    data.clinic
                                                                        .name_ar
                                                                }
                                                            maxLength={30}
                                                                onChange={(
                                                                    e,
                                                                ) => {
                                                                    const value =
                                                                        e.target.value.trimStart();
                                                                    const limitedValue =
                                                                        value.slice(
                                                                            0,
                                                                            30,
                                                                        );
                                                                    (
                                                                        setData as any
                                                                    )(
                                                                        'clinic.name_ar',
                                                                        limitedValue,
                                                                    );
                                                                    if (
                                                                        value &&
                                                                        value.trim()
                                                                    ) {
                                                                        const arabicPattern =
                                                                            /^[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF\s\u0660-\u0669\u06F0-\u06F9.,;:!?\-_()[\]{}""''«»/]+$/u;
                                                                        if (
                                                                            !arabicPattern.test(
                                                                                value,
                                                                            )
                                                                        ) {
                                                                            setValidationErrors(
                                                                                (
                                                                                    prev,
                                                                                ) => ({
                                                                            ...prev,
                                                                                    'clinic.name_ar':
                                                                                        t(
                                                                                            'clinic_name_ar_must_be_arabic',
                                                                                        ),
                                                                                }),
                                                                            );
                                                                    } else {
                                                                            setValidationErrors(
                                                                                (
                                                                                    prev,
                                                                                ) => {
                                                                                    const newErrors =
                                                                                        {
                                                                                            ...prev,
                                                                                        };
                                                                                    delete newErrors[
                                                                                        'clinic.name_ar'
                                                                                    ];
                                                                            return newErrors;
                                                                                },
                                                                            );
                                                                    }
                                                                } else {
                                                                        setValidationErrors(
                                                                            (
                                                                                prev,
                                                                            ) => {
                                                                                const newErrors =
                                                                                    {
                                                                                        ...prev,
                                                                                    };
                                                                                delete newErrors[
                                                                                    'clinic.name_ar'
                                                                                ];
                                                                        return newErrors;
                                                                            },
                                                                        );
                                                                }
                                                            }}
                                                            onBlur={(e) => {
                                                                    const trimmed =
                                                                        e.target.value.trim();
                                                                    (
                                                                        setData as any
                                                                    )(
                                                                        'clinic.name_ar',
                                                                        trimmed,
                                                                    );
                                                                    handleFieldBlur(
                                                                        'clinic.name_ar',
                                                                    );
                                                            }}
                                                                placeholder={t(
                                                                    'enter_clinic_name_ar',
                                                                )}
                                                            className={`${getFieldError('clinic.name_ar') ? 'border-red-500' : ''}`}
                                                                disabled={
                                                                    readOnly
                                                                }
                                                        />
                                                            <InputError
                                                                message={getFieldError(
                                                                    'clinic.name_ar',
                                                                )}
                                                            />
                                                    </div>

                                                    <div className="space-y-2">
                                                        <Label htmlFor="clinic.phone_tab">
                                                                {t(
                                                                    'clinic_phone',
                                                                )}{' '}
                                                                <span className="text-red-500">
                                                                    *
                                                                </span>
                                                        </Label>
                                                        <PhoneInput
                                                            id="clinic.phone_tab"
                                                            required
                                                                value={
                                                                    data.clinic
                                                                        .phone
                                                                }
                                                                onChange={(
                                                                    value,
                                                                ) =>
                                                                    (
                                                                        setData as any
                                                                    )(
                                                                        'clinic.phone',
                                                                        value,
                                                                    )
                                                                }
                                                                className={
                                                                    formErrors[
                                                                        'clinic.phone'
                                                                    ] ||
                                                                    (
                                                                        externalErrors as any
                                                                    )[
                                                                        'clinic.phone'
                                                                    ]
                                                                        ? 'border-red-500'
                                                                        : ''
                                                                }
                                                                disabled={
                                                                    readOnly
                                                                }
                                                        />
                                                            <InputError
                                                                message={
                                                                    formErrors[
                                                                        'clinic.phone'
                                                                    ] ||
                                                                    (
                                                                        externalErrors as any
                                                                    )[
                                                                        'clinic.phone'
                                                                    ]
                                                                }
                                                            />
                                                    </div>

                                                    <div className="space-y-2">
                                                        <Label htmlFor="clinic.email_tab">
                                                                {t(
                                                                    'clinic_email',
                                                                )}{' '}
                                                                <span className="text-sm text-muted-foreground">
                                                                    (
                                                                    {t(
                                                                        'optional',
                                                                    )}
                                                                    )
                                                                </span>
                                                        </Label>
                                                        <div className="relative">
                                                            <Input
                                                                id="clinic.email_tab"
                                                                type="email"
                                                                    value={
                                                                        data
                                                                            .clinic
                                                                            .email
                                                                    }
                                                                    onChange={(
                                                                        e,
                                                                    ) => {
                                                                        (
                                                                            setData as any
                                                                        )(
                                                                            'clinic.email',
                                                                            e
                                                                                .target
                                                                                .value,
                                                                        );
                                                                        if (
                                                                            validationErrors[
                                                                                'clinic.email'
                                                                            ]
                                                                        ) {
                                                                            setValidationErrors(
                                                                                (
                                                                                    prev,
                                                                                ) => {
                                                                                    const newErrors =
                                                                                        {
                                                                                            ...prev,
                                                                                        };
                                                                                    delete newErrors[
                                                                                        'clinic.email'
                                                                                    ];
                                                                            return newErrors;
                                                                                },
                                                                            );
                                                                    }
                                                                }}
                                                                    onBlur={() =>
                                                                        handleFieldBlur(
                                                                            'clinic.email',
                                                                        )
                                                                    }
                                                                    placeholder={t(
                                                                        'clinic_email_placeholder',
                                                                    )}
                                                                    className={`${formErrors['clinic.email'] || (externalErrors as any)['clinic.email'] || validationErrors['clinic.email'] ? 'border-red-500' : ''}`}
                                                                    disabled={
                                                                        readOnly ||
                                                                        checkingEmail
                                                                    }
                                                            />
                                                            {checkingEmail && (
                                                                    <div className="absolute top-1/2 right-3 -translate-y-1/2">
                                                                    <LoaderCircle className="h-4 w-4 animate-spin text-muted-foreground" />
                                                                </div>
                                                            )}
                                                        </div>
                                                            <InputError
                                                                message={
                                                                    formErrors[
                                                                        'clinic.email'
                                                                    ] ||
                                                                    (
                                                                        externalErrors as any
                                                                    )[
                                                                        'clinic.email'
                                                                    ] ||
                                                                    validationErrors[
                                                                        'clinic.email'
                                                                    ]
                                                                }
                                                            />
                                                    </div>

                                                    <div className="space-y-2">
                                                        <Label htmlFor="clinic.category_id_tab">
                                                                {t('category')}{' '}
                                                                <span className="text-red-500">
                                                                    *
                                                                </span>
                                                        </Label>
                                                        <Select
                                                                value={
                                                                    data.clinic
                                                                        .category_id ||
                                                                    undefined
                                                                }
                                                                onValueChange={(
                                                                    value,
                                                                ) =>
                                                                    (
                                                                        setData as any
                                                                    )(
                                                                        'clinic.category_id',
                                                                        value,
                                                                    )
                                                                }
                                                                disabled={
                                                                    readOnly
                                                                }
                                                        >
                                                            <SelectTrigger>
                                                                    <SelectValue
                                                                        placeholder={t(
                                                                            'select_category',
                                                                        )}
                                                                    />
                                                            </SelectTrigger>
                                                            <SelectContent>
                                                                    {categories &&
                                                                    categories.length >
                                                                        0 ? (
                                                                        categories.map(
                                                                            (
                                                                                category,
                                                                            ) => (
                                                                                <SelectItem
                                                                                    key={
                                                                                        category.id
                                                                                    }
                                                                                    value={category.id.toString()}
                                                                                >
                                                                                    {locale ===
                                                                                    'ar'
                                                                                        ? category.name_ar
                                                                                        : category.name_en}
                                                                        </SelectItem>
                                                                            ),
                                                                        )
                                                                ) : (
                                                                        <SelectItem
                                                                            value="no-categories"
                                                                            disabled
                                                                        >
                                                                            {t(
                                                                                'no_categories_available',
                                                                            )}
                                                                    </SelectItem>
                                                                )}
                                                            </SelectContent>
                                                        </Select>
                                                    </div>

                                                    <div className="space-y-2">
                                                        <Label htmlFor="clinic.logo_tab">
                                                                {t(
                                                                    'clinic_logo',
                                                                )}{' '}
                                                                <span className="text-sm text-muted-foreground">
                                                                    (
                                                                    {t(
                                                                        'optional',
                                                                    )}
                                                                    )
                                                                </span>
                                                        </Label>
                                                            <div className="rounded-lg border-2 border-dashed border-border p-6">
                                                            <Input
                                                                id="clinic.logo_tab"
                                                                type="file"
                                                                    accept="image/jpeg,image/jpg,image/png"
                                                                    onChange={(
                                                                        e,
                                                                    ) =>
                                                                        handleFileChange(
                                                                            'logo',
                                                                            e
                                                                                .target
                                                                                .files?.[0] ||
                                                                                null,
                                                                            setLogoPreview,
                                                                            setLogoFileName,
                                                                        )
                                                                    }
                                                                className="hidden"
                                                                    disabled={
                                                                        readOnly
                                                                    }
                                                            />
                                                                <Label
                                                                    htmlFor="clinic.logo_tab"
                                                                    className={`flex cursor-pointer flex-col items-center gap-2 ${readOnly ? 'cursor-default' : ''}`}
                                                                >
                                                                <Upload className="h-8 w-8 text-muted-foreground" />
                                                                <span className="text-sm text-primary hover:underline">
                                                                        {t(
                                                                            'click_to_upload',
                                                                        )}{' '}
                                                                        {t(
                                                                            'clinic_logo',
                                                                        )}
                                                                </span>
                                                                <p className="text-xs text-muted-foreground">
                                                                        JPG,
                                                                        JPEG,
                                                                        PNG (Max
                                                                        10MB)
                                                                </p>
                                                            </Label>
                                                                <InputError
                                                                    message={getFieldError(
                                                                        'clinic.logo',
                                                                    )}
                                                                />
                                                                {(logoPreview ||
                                                                    logoFileName) && (
                                                                    <div className="mt-4 space-y-2 text-center">
                                                                        {logoPreview &&
                                                                        logoPreview !==
                                                                            'pdf' &&
                                                                        logoPreview !==
                                                                            'large-image' ? (
                                                                        <div className="relative inline-block">
                                                                                <img
                                                                                    src={
                                                                                        logoPreview
                                                                                    }
                                                                                    alt="Logo Preview"
                                                                                    className="mx-auto h-16 w-auto rounded border"
                                                                                />
                                                                            {!readOnly && (
                                                                                <Button
                                                                                    type="button"
                                                                                    variant="destructive"
                                                                                    size="sm"
                                                                                    className="absolute top-2 right-2"
                                                                                    onClick={() => {
                                                                                            setLogoPreview(
                                                                                                null,
                                                                                            );
                                                                                            setLogoFileName(
                                                                                                null,
                                                                                            );
                                                                                            (
                                                                                                setData as any
                                                                                            )(
                                                                                                'clinic.logo',
                                                                                                null,
                                                                                            );
                                                                                            const input =
                                                                                                document.getElementById(
                                                                                                    'clinic.logo_tab',
                                                                                                ) as HTMLInputElement;
                                                                                            if (
                                                                                                input
                                                                                            )
                                                                                                input.value =
                                                                                                    '';
                                                                                    }}
                                                                                >
                                                                                    ×
                                                                                </Button>
                            )}
                        </div>
                                                                    ) : (
                                                                        <div className="flex items-center justify-center gap-2 text-sm text-green-600">
                                                                            <Check className="h-4 w-4" />
                                                                                <span>
                                                                                    {logoFileName ||
                                                                                        t(
                                                                                            'file_uploaded',
                                                                                        )}
                                                                                </span>
                                                                            {!readOnly && (
                                                                                <Button
                                                                                    type="button"
                                                                                    variant="ghost"
                                                                                    size="sm"
                                                                                    onClick={() => {
                                                                                            setLogoPreview(
                                                                                                null,
                                                                                            );
                                                                                            setLogoFileName(
                                                                                                null,
                                                                                            );
                                                                                            (
                                                                                                setData as any
                                                                                            )(
                                                                                                'clinic.logo',
                                                                                                null,
                                                                                            );
                                                                                            const input =
                                                                                                document.getElementById(
                                                                                                    'clinic.logo_tab',
                                                                                                ) as HTMLInputElement;
                                                                                            if (
                                                                                                input
                                                                                            )
                                                                                                input.value =
                                                                                                    '';
                                                                                    }}
                                                                                >
                                                                                        {t(
                                                                                            'remove',
                                                                                        ) ||
                                                                                            'Remove'}
                                                                                </Button>
                                                                            )}
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            )}
                                                        </div>
                                                            <InputError
                                                                message={
                                                                    formErrors[
                                                                        'clinic.logo'
                                                                    ] ||
                                                                    (
                                                                        externalErrors as any
                                                                    )[
                                                                        'clinic.logo'
                                                                    ] ||
                                                                    validationErrors[
                                                                        'clinic.logo'
                                                                    ]
                                                                }
                                                            />
                                                    </div>

                                                    <div className="space-y-2 md:col-span-2">
                                                        <Label htmlFor="clinic.bio_en_tab">
                                                                {t(
                                                                    'description_en',
                                                                )}{' '}
                                                                <span className="text-sm text-muted-foreground">
                                                                    (
                                                                    {t(
                                                                        'optional',
                                                                    )}
                                                                    )
                                                                </span>
                                                        </Label>
                                                        <Textarea
                                                            id="clinic.bio_en_tab"
                                                                value={
                                                                    data.clinic
                                                                        .bio_en
                                                                }
                                                            maxLength={2000}
                                                                onChange={(
                                                                    e,
                                                                ) => {
                                                                    const value =
                                                                        e.target
                                                                            .value;
                                                                    const limitedValue =
                                                                        value.slice(
                                                                            0,
                                                                            2000,
                                                                        );
                                                                    (
                                                                        setData as any
                                                                    )(
                                                                        'clinic.bio_en',
                                                                        limitedValue,
                                                                    );
                                                                    if (
                                                                        value &&
                                                                        value.trim()
                                                                    ) {
                                                                        const englishPattern =
                                                                            /^[a-zA-Z0-9\s\-_.,;:!?@#$%^&*()[\]{}""''/]+$/;
                                                                        if (
                                                                            !englishPattern.test(
                                                                                value,
                                                                            )
                                                                        ) {
                                                                            const fieldName =
                                                                                t(
                                                                                    'description_en',
                                                                                ) ||
                                                                                'Description (English)';
                                                                            const errorMsg =
                                                                                t(
                                                                                    'description_en_must_be_english',
                                                                                ) ||
                                                                                t(
                                                                                    'field_must_be_english_only',
                                                                                )?.replace(
                                                                                    ':attribute',
                                                                                    fieldName,
                                                                                ) ||
                                                                                `${fieldName} must contain only English characters`;
                                                                            setValidationErrors(
                                                                                (
                                                                                    prev,
                                                                                ) => ({
                                                                            ...prev,
                                                                                    'clinic.bio_en':
                                                                                        errorMsg,
                                                                                }),
                                                                            );
                                                                    } else {
                                                                            setValidationErrors(
                                                                                (
                                                                                    prev,
                                                                                ) => {
                                                                                    const newErrors =
                                                                                        {
                                                                                            ...prev,
                                                                                        };
                                                                                    delete newErrors[
                                                                                        'clinic.bio_en'
                                                                                    ];
                                                                            return newErrors;
                                                                                },
                                                                            );
                                                                    }
                                                                } else {
                                                                        setValidationErrors(
                                                                            (
                                                                                prev,
                                                                            ) => {
                                                                                const newErrors =
                                                                                    {
                                                                                        ...prev,
                                                                                    };
                                                                                delete newErrors[
                                                                                    'clinic.bio_en'
                                                                                ];
                                                                        return newErrors;
                                                                            },
                                                                        );
                                                                }
                                                            }}
                                                                onBlur={() =>
                                                                    handleFieldBlur(
                                                                        'clinic.bio_en',
                                                                    )
                                                                }
                                                                placeholder={t(
                                                                    'enter_description_en',
                                                                )}
                                                            rows={4}
                                                            className={`${getFieldError('clinic.bio_en') ? 'border-red-500' : ''}`}
                                                                disabled={
                                                                    readOnly
                                                                }
                                                        />
                                                            <InputError
                                                                message={getFieldError(
                                                                    'clinic.bio_en',
                                                                )}
                                                            />
                                                    </div>

                                                    <div className="space-y-2 md:col-span-2">
                                                        <Label htmlFor="clinic.bio_ar_tab">
                                                                {t(
                                                                    'description_ar',
                                                                )}{' '}
                                                                <span className="text-sm text-muted-foreground">
                                                                    (
                                                                    {t(
                                                                        'optional',
                                                                    )}
                                                                    )
                                                                </span>
                                                        </Label>
                                                        <Textarea
                                                            id="clinic.bio_ar_tab"
                                                                value={
                                                                    data.clinic
                                                                        .bio_ar
                                                                }
                                                            maxLength={2000}
                                                                onChange={(
                                                                    e,
                                                                ) => {
                                                                    const value =
                                                                        e.target
                                                                            .value;
                                                                    const limitedValue =
                                                                        value.slice(
                                                                            0,
                                                                            2000,
                                                                        );
                                                                    (
                                                                        setData as any
                                                                    )(
                                                                        'clinic.bio_ar',
                                                                        limitedValue,
                                                                    );
                                                                    if (
                                                                        value &&
                                                                        value.trim()
                                                                    ) {
                                                                        const arabicPattern =
                                                                            /^[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF\s\u0660-\u0669\u06F0-\u06F9.,;:!?\-_()[\]{}""''«»/]+$/u;
                                                                        if (
                                                                            !arabicPattern.test(
                                                                                value,
                                                                            )
                                                                        ) {
                                                                            const fieldName =
                                                                                t(
                                                                                    'description_ar',
                                                                                ) ||
                                                                                'Description (Arabic)';
                                                                            const errorMsg =
                                                                                t(
                                                                                    'description_ar_must_be_arabic',
                                                                                ) ||
                                                                                t(
                                                                                    'field_must_be_arabic_only',
                                                                                )?.replace(
                                                                                    ':attribute',
                                                                                    fieldName,
                                                                                ) ||
                                                                                `${fieldName} must contain only Arabic characters`;
                                                                            setValidationErrors(
                                                                                (
                                                                                    prev,
                                                                                ) => ({
                                                                            ...prev,
                                                                                    'clinic.bio_ar':
                                                                                        errorMsg,
                                                                                }),
                                                                            );
                                                                    } else {
                                                                            setValidationErrors(
                                                                                (
                                                                                    prev,
                                                                                ) => {
                                                                                    const newErrors =
                                                                                        {
                                                                                            ...prev,
                                                                                        };
                                                                                    delete newErrors[
                                                                                        'clinic.bio_ar'
                                                                                    ];
                                                                            return newErrors;
                                                                                },
                                                                            );
                                                                    }
                                                                } else {
                                                                        setValidationErrors(
                                                                            (
                                                                                prev,
                                                                            ) => {
                                                                                const newErrors =
                                                                                    {
                                                                                        ...prev,
                                                                                    };
                                                                                delete newErrors[
                                                                                    'clinic.bio_ar'
                                                                                ];
                                                                        return newErrors;
                                                                            },
                                                                        );
                                                                }
                                                            }}
                                                                onBlur={() =>
                                                                    handleFieldBlur(
                                                                        'clinic.bio_ar',
                                                                    )
                                                                }
                                                                placeholder={t(
                                                                    'enter_description_ar',
                                                                )}
                                                            rows={4}
                                                            className={`${getFieldError('clinic.bio_ar') ? 'border-red-500' : ''}`}
                                                                disabled={
                                                                    readOnly
                                                                }
                                                        />
                                                            <InputError
                                                                message={getFieldError(
                                                                    'clinic.bio_ar',
                                                                )}
                                                            />
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    }
                                    
                                    // Step 3: Address & Location
                                    if (renderStep === 3) {
        return (
                                            <div className="space-y-6">
                                                    <div className="mb-6 flex items-center gap-3">
                                                    <MapPin className="h-6 w-6 text-primary" />
                                                    <h2 className="text-2xl font-semibold text-foreground">
                                                            {t(
                                                                'address_location',
                                                            )}
                                                    </h2>
                                                </div>
                                                
                                                    <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                                                    <div className="space-y-2">
                                                        <Label htmlFor="clinic.governorate_id_tab">
                                                                {t(
                                                                    'governorate',
                                                                )}{' '}
                                                                <span className="text-red-500">
                                                                    *
                                                                </span>
                                                        </Label>
                                                        <Select
                                                                value={
                                                                    data.clinic
                                                                        .governorate_id ||
                                                                    undefined
                                                                }
                                                                onValueChange={
                                                                    handleGovernorateChange
                                                                }
                                                                disabled={
                                                                    readOnly
                                                                }
                                                        >
                                                                <SelectTrigger
                                                                    className={`${getFieldError('clinic.governorate_id') ? 'border-red-500' : ''}`}
                                                                >
                                                                    <SelectValue
                                                                        placeholder={t(
                                                                            'select_governorate',
                                                                        )}
                                                                    />
                                                            </SelectTrigger>
                                                            <SelectContent>
                                                                    {governorates &&
                                                                    governorates.length >
                                                                        0 ? (
                                                                        governorates.map(
                                                                            (
                                                                                gov,
                                                                            ) => (
                                                                                <SelectItem
                                                                                    key={
                                                                                        gov.id
                                                                                    }
                                                                                    value={gov.id.toString()}
                                                                                >
                                                                                    {locale ===
                                                                                    'ar'
                                                                                        ? gov.name_ar
                                                                                        : gov.name_en}
                                                                        </SelectItem>
                                                                            ),
                                                                        )
                                                                ) : (
                                                                        <SelectItem
                                                                            value="no-governorates"
                                                                            disabled
                                                                        >
                                                                            {t(
                                                                                'no_governorates_available',
                                                                            )}
                                                                    </SelectItem>
                                                                )}
                                                            </SelectContent>
                                                        </Select>
                                                            <InputError
                                                                message={getFieldError(
                                                                    'clinic.governorate_id',
                                                                )}
                                                            />
                                                    </div>

                                                    <div className="space-y-2">
                                                        <Label htmlFor="clinic.area_id_tab">
                                                                {t('area')}{' '}
                                                                <span className="text-red-500">
                                                                    *
                                                                </span>
                                                        </Label>
                                                        <Select
                                                                value={
                                                                    data.clinic
                                                                        .area_id ||
                                                                    undefined
                                                                }
                                                                onValueChange={(
                                                                    value,
                                                                ) =>
                                                                    (
                                                                        setData as any
                                                                    )(
                                                                        'clinic.area_id',
                                                                        value,
                                                                    )
                                                                }
                                                                disabled={
                                                                    readOnly ||
                                                                    !selectedGovernorate
                                                                }
                                                        >
                                                                <SelectTrigger
                                                                    className={`${getFieldError('clinic.area_id') ? 'border-red-500' : ''}`}
                                                                >
                                                                    <SelectValue
                                                                        placeholder={
                                                                            selectedGovernorate
                                                                                ? t(
                                                                                      'select_area',
                                                                                  )
                                                                                : t(
                                                                                      'select_governorate_first',
                                                                                  )
                                                                        }
                                                                    />
                                                            </SelectTrigger>
                                                            <SelectContent>
                                                                    {areas &&
                                                                    areas.length >
                                                                        0 ? (
                                                                        areas.map(
                                                                            (
                                                                                area,
                                                                            ) => (
                                                                                <SelectItem
                                                                                    key={
                                                                                        area.id
                                                                                    }
                                                                                    value={area.id.toString()}
                                                                                >
                                                                                    {locale ===
                                                                                    'ar'
                                                                                        ? area.name_ar
                                                                                        : area.name_en}
                                                                        </SelectItem>
                                                                            ),
                                                                        )
                                                                ) : (
                                                                        <SelectItem
                                                                            value="no-areas"
                                                                            disabled
                                                                        >
                                                                            {selectedGovernorate
                                                                                ? t(
                                                                                      'no_areas_available',
                                                                                  )
                                                                                : t(
                                                                                      'select_governorate_first',
                                                                                  )}
                                                                    </SelectItem>
                                                                )}
                                                            </SelectContent>
                                                        </Select>
                                                            <InputError
                                                                message={getFieldError(
                                                                    'clinic.area_id',
                                                                )}
                                                            />
                                                    </div>

                                                    <div className="space-y-2 md:col-span-2">
                                                        <AddressAutocomplete
                                                            id="clinic.address_tab"
                                                                label={t(
                                                                    'address',
                                                                )}
                                                                value={
                                                                    data.clinic
                                                                        .address
                                                                }
                                                                onChange={(
                                                                    field,
                                                                    value,
                                                                ) => {
                                                                    const limitedValue =
                                                                        value.slice(
                                                                            0,
                                                                            500,
                                                                        );
                                                                    (
                                                                        setData as any
                                                                    )(
                                                                        'clinic.address',
                                                                        limitedValue,
                                                                    );
                                                                    if (
                                                                        validationErrors[
                                                                            'clinic.address'
                                                                        ]
                                                                    ) {
                                                                        setValidationErrors(
                                                                            (
                                                                                prev,
                                                                            ) => {
                                                                                const newErrors =
                                                                                    {
                                                                                        ...prev,
                                                                                    };
                                                                                delete newErrors[
                                                                                    'clinic.address'
                                                                                ];
                                                                        return newErrors;
                                                                            },
                                                                        );
                                                                }
                                                            }}
                                                                onAddressChange={(
                                                                    components,
                                                                ) => {
                                                                    if (
                                                                        components.address
                                                                    ) {
                                                                        (
                                                                            setData as any
                                                                        )(
                                                                            'clinic.address',
                                                                            components.address,
                                                                        );
                                                                    }
                                                                    if (
                                                                        components.block !==
                                                                        undefined
                                                                    ) {
                                                                        (
                                                                            setData as any
                                                                        )(
                                                                            'clinic.block',
                                                                            components.block ||
                                                                                '',
                                                                        );
                                                                    }
                                                                    if (
                                                                        components.street !==
                                                                        undefined
                                                                    ) {
                                                                        (
                                                                            setData as any
                                                                        )(
                                                                            'clinic.street',
                                                                            components.street ||
                                                                                '',
                                                                        );
                                                                    }
                                                                    if (
                                                                        components.avenue !==
                                                                        undefined
                                                                    ) {
                                                                        (
                                                                            setData as any
                                                                        )(
                                                                            'clinic.avenue',
                                                                            components.avenue ||
                                                                                '',
                                                                        );
                                                                    }
                                                                    if (
                                                                        components.house !==
                                                                        undefined
                                                                    ) {
                                                                        (
                                                                            setData as any
                                                                        )(
                                                                            'clinic.house',
                                                                            components.house ||
                                                                                '',
                                                                        );
                                                                    }
                                                                    if (
                                                                        components.floor !==
                                                                        undefined
                                                                    ) {
                                                                        (
                                                                            setData as any
                                                                        )(
                                                                            'clinic.floor',
                                                                            components.floor ||
                                                                                '',
                                                                        );
                                                                    }
                                                                    if (
                                                                        components.apt !==
                                                                        undefined
                                                                    ) {
                                                                        (
                                                                            setData as any
                                                                        )(
                                                                            'clinic.apt',
                                                                            components.apt ||
                                                                                '',
                                                                        );
                                                                    }
                                                                    if (
                                                                        components.city !==
                                                                        undefined
                                                                    ) {
                                                                        (
                                                                            setData as any
                                                                        )(
                                                                            'clinic.city',
                                                                            components.city ||
                                                                                '',
                                                                        );
                                                                    }
                                                                    if (
                                                                        components.state !==
                                                                        undefined
                                                                    ) {
                                                                        (
                                                                            setData as any
                                                                        )(
                                                                            'clinic.state',
                                                                            components.state ||
                                                                                '',
                                                                        );
                                                                    }
                                                                    if (
                                                                        components.country !==
                                                                        undefined
                                                                    ) {
                                                                        (
                                                                            setData as any
                                                                        )(
                                                                            'clinic.country',
                                                                            components.country ||
                                                                                'Kuwait',
                                                                        );
                                                                    }
                                                                    if (
                                                                        components.postal_code !==
                                                                        undefined
                                                                    ) {
                                                                        (
                                                                            setData as any
                                                                        )(
                                                                            'clinic.postal_code',
                                                                            components.postal_code ||
                                                                                '',
                                                                        );
                                                                    }
                                                                    if (
                                                                        components.latitude !==
                                                                        undefined
                                                                    ) {
                                                                        (
                                                                            setData as any
                                                                        )(
                                                                            'clinic.latitude',
                                                                            components.latitude ||
                                                                                '',
                                                                        );
                                                                    }
                                                                    if (
                                                                        components.longitude !==
                                                                        undefined
                                                                    ) {
                                                                        (
                                                                            setData as any
                                                                        )(
                                                                            'clinic.longitude',
                                                                            components.longitude ||
                                                                                '',
                                                                        );
                                                                    }
                                                                }}
                                                                placeholder={t(
                                                                    'enter_full_address',
                                                                )}
                                                                error={
                                                                    formErrors[
                                                                        'clinic.address'
                                                                    ] ||
                                                                    (
                                                                        externalErrors as any
                                                                    )[
                                                                        'clinic.address'
                                                                    ] ||
                                                                    validationErrors[
                                                                        'clinic.address'
                                                                    ]
                                                                }
                                                            required
                                                            maxLength={500}
                                                            rows={2}
                                                                disabled={
                                                                    readOnly
                                                                }
                                                            countryRestriction="KW"
                                                                governorateName={
                                                                    data.clinic
                                                                        .governorate_id &&
                                                                    governorates
                                                                        ? governorates.find(
                                                                              (
                                                                                  g,
                                                                              ) =>
                                                                                  g.id.toString() ===
                                                                                  data
                                                                                      .clinic
                                                                                      .governorate_id,
                                                                          )
                                                                            ? locale ===
                                                                              'ar'
                                                                                ? governorates.find(
                                                                                      (
                                                                                          g,
                                                                                      ) =>
                                                                                          g.id.toString() ===
                                                                                          data
                                                                                              .clinic
                                                                                              .governorate_id,
                                                                                  )
                                                                                      ?.name_ar
                                                                                : governorates.find(
                                                                                      (
                                                                                          g,
                                                                                      ) =>
                                                                                          g.id.toString() ===
                                                                                          data
                                                                                              .clinic
                                                                                              .governorate_id,
                                                                                  )
                                                                                      ?.name_en
                                                                            : undefined
                                                                        : undefined
                                                                }
                                                                areaName={
                                                                    data.clinic
                                                                        .area_id &&
                                                                    areas
                                                                        ? areas.find(
                                                                              (
                                                                                  a,
                                                                              ) =>
                                                                                  a.id.toString() ===
                                                                                  data
                                                                                      .clinic
                                                                                      .area_id,
                                                                          )
                                                                            ? locale ===
                                                                              'ar'
                                                                                ? areas.find(
                                                                                      (
                                                                                          a,
                                                                                      ) =>
                                                                                          a.id.toString() ===
                                                                                          data
                                                                                              .clinic
                                                                                              .area_id,
                                                                                  )
                                                                                      ?.name_ar
                                                                                : areas.find(
                                                                                      (
                                                                                          a,
                                                                                      ) =>
                                                                                          a.id.toString() ===
                                                                                          data
                                                                                              .clinic
                                                                                              .area_id,
                                                                                  )
                                                                                      ?.name_en
                                                                            : undefined
                                                                        : undefined
                                                                }
                                                                requireGovernorateAndArea={
                                                                    true
                                                                }
                                                        />
                                                    </div>

                                                    <div className="space-y-2">
                                                        <Label htmlFor="clinic.block_tab">
                                                                {t('block')}{' '}
                                                                <span className="text-sm text-muted-foreground">
                                                                    (
                                                                    {t(
                                                                        'optional',
                                                                    )}
                                                                    )
                                                                </span>
                                                        </Label>
                                                        <Input
                                                            id="clinic.block_tab"
                                                            type="text"
                                                                value={
                                                                    data.clinic
                                                                        .block
                                                                }
                                                            maxLength={50}
                                                                onChange={(
                                                                    e,
                                                                ) => {
                                                                    const value =
                                                                        e.target.value.slice(
                                                                            0,
                                                                            50,
                                                                        );
                                                                    (
                                                                        setData as any
                                                                    )(
                                                                        'clinic.block',
                                                                        value,
                                                                    );
                                                                    if (
                                                                        validationErrors[
                                                                            'clinic.block'
                                                                        ]
                                                                    ) {
                                                                        setValidationErrors(
                                                                            (
                                                                                prev,
                                                                            ) => {
                                                                                const newErrors =
                                                                                    {
                                                                                        ...prev,
                                                                                    };
                                                                                delete newErrors[
                                                                                    'clinic.block'
                                                                                ];
                                                                        return newErrors;
                                                                            },
                                                                        );
                                                                }
                                                            }}
                                                                onBlur={() =>
                                                                    handleFieldBlur(
                                                                        'clinic.block',
                                                                    )
                                                                }
                                                                placeholder={t(
                                                                    'enter_block',
                                                                )}
                                                                className={`${formErrors['clinic.block'] || (externalErrors as any)['clinic.block'] || validationErrors['clinic.block'] ? 'border-red-500' : ''}`}
                                                                disabled={
                                                                    readOnly ||
                                                                    !data.clinic
                                                                        .governorate_id ||
                                                                    !data.clinic
                                                                        .area_id
                                                                }
                                                        />
                                                            <InputError
                                                                message={
                                                                    formErrors[
                                                                        'clinic.block'
                                                                    ] ||
                                                                    (
                                                                        externalErrors as any
                                                                    )[
                                                                        'clinic.block'
                                                                    ] ||
                                                                    validationErrors[
                                                                        'clinic.block'
                                                                    ]
                                                                }
                                                            />
                                                    </div>

                                                    <div className="space-y-2">
                                                        <Label htmlFor="clinic.street_tab">
                                                                {t('street')}{' '}
                                                                <span className="text-sm text-muted-foreground">
                                                                    (
                                                                    {t(
                                                                        'optional',
                                                                    )}
                                                                    )
                                                                </span>
                                                        </Label>
                                                        <Input
                                                            id="clinic.street_tab"
                                                            type="text"
                                                                value={
                                                                    data.clinic
                                                                        .street
                                                                }
                                                            maxLength={100}
                                                                onChange={(
                                                                    e,
                                                                ) => {
                                                                    const value =
                                                                        e.target.value.slice(
                                                                            0,
                                                                            100,
                                                                        );
                                                                    (
                                                                        setData as any
                                                                    )(
                                                                        'clinic.street',
                                                                        value,
                                                                    );
                                                                    if (
                                                                        validationErrors[
                                                                            'clinic.street'
                                                                        ]
                                                                    ) {
                                                                        setValidationErrors(
                                                                            (
                                                                                prev,
                                                                            ) => {
                                                                                const newErrors =
                                                                                    {
                                                                                        ...prev,
                                                                                    };
                                                                                delete newErrors[
                                                                                    'clinic.street'
                                                                                ];
                                                                        return newErrors;
                                                                            },
                                                                        );
                                                                }
                                                            }}
                                                                onBlur={() =>
                                                                    handleFieldBlur(
                                                                        'clinic.street',
                                                                    )
                                                                }
                                                                placeholder={t(
                                                                    'enter_street',
                                                                )}
                                                                className={`${formErrors['clinic.street'] || (externalErrors as any)['clinic.street'] || validationErrors['clinic.street'] ? 'border-red-500' : ''}`}
                                                                disabled={
                                                                    readOnly ||
                                                                    !data.clinic
                                                                        .governorate_id ||
                                                                    !data.clinic
                                                                        .area_id
                                                                }
                                                        />
                                                            <InputError
                                                                message={
                                                                    formErrors[
                                                                        'clinic.street'
                                                                    ] ||
                                                                    (
                                                                        externalErrors as any
                                                                    )[
                                                                        'clinic.street'
                                                                    ] ||
                                                                    validationErrors[
                                                                        'clinic.street'
                                                                    ]
                                                                }
                                                            />
                                                    </div>

                                                    <div className="space-y-2">
                                                        <Label htmlFor="clinic.avenue_tab">
                                                                {t('avenue')}{' '}
                                                                <span className="text-sm text-muted-foreground">
                                                                    (
                                                                    {t(
                                                                        'optional',
                                                                    )}
                                                                    )
                                                                </span>
                                                        </Label>
                                                        <Input
                                                            id="clinic.avenue_tab"
                                                            type="text"
                                                                value={
                                                                    data.clinic
                                                                        .avenue
                                                                }
                                                            maxLength={100}
                                                                onChange={(
                                                                    e,
                                                                ) => {
                                                                    const value =
                                                                        e.target.value.slice(
                                                                            0,
                                                                            100,
                                                                        );
                                                                    (
                                                                        setData as any
                                                                    )(
                                                                        'clinic.avenue',
                                                                        value,
                                                                    );
                                                                    if (
                                                                        validationErrors[
                                                                            'clinic.avenue'
                                                                        ]
                                                                    ) {
                                                                        setValidationErrors(
                                                                            (
                                                                                prev,
                                                                            ) => {
                                                                                const newErrors =
                                                                                    {
                                                                                        ...prev,
                                                                                    };
                                                                                delete newErrors[
                                                                                    'clinic.avenue'
                                                                                ];
                                                                        return newErrors;
                                                                            },
                                                                        );
                                                                }
                                                            }}
                                                                onBlur={() =>
                                                                    handleFieldBlur(
                                                                        'clinic.avenue',
                                                                    )
                                                                }
                                                                placeholder={t(
                                                                    'enter_avenue',
                                                                )}
                                                                className={`${formErrors['clinic.avenue'] || (externalErrors as any)['clinic.avenue'] || validationErrors['clinic.avenue'] ? 'border-red-500' : ''}`}
                                                                disabled={
                                                                    readOnly ||
                                                                    !data.clinic
                                                                        .governorate_id ||
                                                                    !data.clinic
                                                                        .area_id
                                                                }
                                                        />
                                                            <InputError
                                                                message={
                                                                    formErrors[
                                                                        'clinic.avenue'
                                                                    ] ||
                                                                    (
                                                                        externalErrors as any
                                                                    )[
                                                                        'clinic.avenue'
                                                                    ] ||
                                                                    validationErrors[
                                                                        'clinic.avenue'
                                                                    ]
                                                                }
                                                            />
                                                    </div>

                                                    <div className="space-y-2">
                                                        <Label htmlFor="clinic.house_tab">
                                                                {t('house')}{' '}
                                                                <span className="text-sm text-muted-foreground">
                                                                    (
                                                                    {t(
                                                                        'optional',
                                                                    )}
                                                                    )
                                                                </span>
                                                        </Label>
                                                        <Input
                                                            id="clinic.house_tab"
                                                            type="text"
                                                                value={
                                                                    data.clinic
                                                                        .house
                                                                }
                                                            maxLength={50}
                                                                onChange={(
                                                                    e,
                                                                ) => {
                                                                    const value =
                                                                        e.target.value.slice(
                                                                            0,
                                                                            50,
                                                                        );
                                                                    (
                                                                        setData as any
                                                                    )(
                                                                        'clinic.house',
                                                                        value,
                                                                    );
                                                            }}
                                                                onBlur={() =>
                                                                    handleFieldBlur(
                                                                        'clinic.house',
                                                                    )
                                                                }
                                                                placeholder={t(
                                                                    'enter_house',
                                                                )}
                                                                className={`${formErrors['clinic.house'] || (externalErrors as any)['clinic.house'] || validationErrors['clinic.house'] ? 'border-red-500' : ''}`}
                                                                disabled={
                                                                    readOnly ||
                                                                    !data.clinic
                                                                        .governorate_id ||
                                                                    !data.clinic
                                                                        .area_id
                                                                }
                                                        />
                                                            <InputError
                                                                message={
                                                                    formErrors[
                                                                        'clinic.house'
                                                                    ] ||
                                                                    (
                                                                        externalErrors as any
                                                                    )[
                                                                        'clinic.house'
                                                                    ] ||
                                                                    validationErrors[
                                                                        'clinic.house'
                                                                    ]
                                                                }
                                                            />
                                                    </div>

                                                    <div className="space-y-2">
                                                        <Label htmlFor="clinic.floor_tab">
                                                                {t('floor')}{' '}
                                                                <span className="text-sm text-muted-foreground">
                                                                    (
                                                                    {t(
                                                                        'optional',
                                                                    )}
                                                                    )
                                                                </span>
                                                        </Label>
                                                        <Input
                                                            id="clinic.floor_tab"
                                                            type="text"
                                                                value={
                                                                    data.clinic
                                                                        .floor
                                                                }
                                                            maxLength={50}
                                                                onChange={(
                                                                    e,
                                                                ) => {
                                                                    const value =
                                                                        e.target.value.slice(
                                                                            0,
                                                                            50,
                                                                        );
                                                                    (
                                                                        setData as any
                                                                    )(
                                                                        'clinic.floor',
                                                                        value,
                                                                    );
                                                                    if (
                                                                        validationErrors[
                                                                            'clinic.floor'
                                                                        ]
                                                                    ) {
                                                                        setValidationErrors(
                                                                            (
                                                                                prev,
                                                                            ) => {
                                                                                const newErrors =
                                                                                    {
                                                                                        ...prev,
                                                                                    };
                                                                                delete newErrors[
                                                                                    'clinic.floor'
                                                                                ];
                                                                        return newErrors;
                                                                            },
                                                                        );
                                                                }
                                                            }}
                                                                onBlur={() =>
                                                                    handleFieldBlur(
                                                                        'clinic.floor',
                                                                    )
                                                                }
                                                                placeholder={t(
                                                                    'enter_floor',
                                                                )}
                                                                className={`${formErrors['clinic.floor'] || (externalErrors as any)['clinic.floor'] || validationErrors['clinic.floor'] ? 'border-red-500' : ''}`}
                                                                disabled={
                                                                    readOnly ||
                                                                    !data.clinic
                                                                        .governorate_id ||
                                                                    !data.clinic
                                                                        .area_id
                                                                }
                                                        />
                                                            <InputError
                                                                message={
                                                                    formErrors[
                                                                        'clinic.floor'
                                                                    ] ||
                                                                    (
                                                                        externalErrors as any
                                                                    )[
                                                                        'clinic.floor'
                                                                    ] ||
                                                                    validationErrors[
                                                                        'clinic.floor'
                                                                    ]
                                                                }
                                                            />
                                                    </div>

                                                    <div className="space-y-2">
                                                        <Label htmlFor="clinic.apt_tab">
                                                                {t('apartment')}{' '}
                                                                <span className="text-sm text-muted-foreground">
                                                                    (
                                                                    {t(
                                                                        'optional',
                                                                    )}
                                                                    )
                                                                </span>
                                                        </Label>
                                                        <Input
                                                            id="clinic.apt_tab"
                                                            type="text"
                                                                value={
                                                                    data.clinic
                                                                        .apt
                                                                }
                                                            maxLength={50}
                                                                onChange={(
                                                                    e,
                                                                ) => {
                                                                    const value =
                                                                        e.target.value.slice(
                                                                            0,
                                                                            50,
                                                                        );
                                                                    (
                                                                        setData as any
                                                                    )(
                                                                        'clinic.apt',
                                                                        value,
                                                                    );
                                                                    if (
                                                                        validationErrors[
                                                                            'clinic.apt'
                                                                        ]
                                                                    ) {
                                                                        setValidationErrors(
                                                                            (
                                                                                prev,
                                                                            ) => {
                                                                                const newErrors =
                                                                                    {
                                                                                        ...prev,
                                                                                    };
                                                                                delete newErrors[
                                                                                    'clinic.apt'
                                                                                ];
                                                                        return newErrors;
                                                                            },
                                                                        );
                                                                }
                                                            }}
                                                                onBlur={() =>
                                                                    handleFieldBlur(
                                                                        'clinic.apt',
                                                                    )
                                                                }
                                                                placeholder={t(
                                                                    'enter_apartment',
                                                                )}
                                                                className={`${formErrors['clinic.apt'] || (externalErrors as any)['clinic.apt'] || validationErrors['clinic.apt'] ? 'border-red-500' : ''}`}
                                                                disabled={
                                                                    readOnly ||
                                                                    !data.clinic
                                                                        .governorate_id ||
                                                                    !data.clinic
                                                                        .area_id
                                                                }
                                                        />
                                                            <InputError
                                                                message={
                                                                    formErrors[
                                                                        'clinic.apt'
                                                                    ] ||
                                                                    (
                                                                        externalErrors as any
                                                                    )[
                                                                        'clinic.apt'
                                                                    ] ||
                                                                    validationErrors[
                                                                        'clinic.apt'
                                                                    ]
                                                                }
                                                            />
                                                    </div>

                                                    <div className="space-y-2">
                                                        <Label htmlFor="clinic.city_tab">
                                                                {t('city')}{' '}
                                                                <span className="text-sm text-muted-foreground">
                                                                    (
                                                                    {t(
                                                                        'optional',
                                                                    )}
                                                                    )
                                                                </span>
                                                        </Label>
                                                        <Input
                                                            id="clinic.city_tab"
                                                            type="text"
                                                                value={
                                                                    data.clinic
                                                                        .city
                                                                }
                                                            maxLength={100}
                                                                onChange={(
                                                                    e,
                                                                ) => {
                                                                    const value =
                                                                        e.target.value.slice(
                                                                            0,
                                                                            100,
                                                                        );
                                                                    (
                                                                        setData as any
                                                                    )(
                                                                        'clinic.city',
                                                                        value,
                                                                    );
                                                                    if (
                                                                        validationErrors[
                                                                            'clinic.city'
                                                                        ]
                                                                    ) {
                                                                        setValidationErrors(
                                                                            (
                                                                                prev,
                                                                            ) => {
                                                                                const newErrors =
                                                                                    {
                                                                                        ...prev,
                                                                                    };
                                                                                delete newErrors[
                                                                                    'clinic.city'
                                                                                ];
                                                                        return newErrors;
                                                                            },
                                                                        );
                                                                }
                                                            }}
                                                                onBlur={() =>
                                                                    handleFieldBlur(
                                                                        'clinic.city',
                                                                    )
                                                                }
                                                                placeholder={t(
                                                                    'enter_city',
                                                                )}
                                                                className={`${formErrors['clinic.city'] || (externalErrors as any)['clinic.city'] || validationErrors['clinic.city'] ? 'border-red-500' : ''}`}
                                                                disabled={
                                                                    readOnly ||
                                                                    !data.clinic
                                                                        .governorate_id ||
                                                                    !data.clinic
                                                                        .area_id
                                                                }
                                                        />
                                                            <InputError
                                                                message={
                                                                    formErrors[
                                                                        'clinic.city'
                                                                    ] ||
                                                                    (
                                                                        externalErrors as any
                                                                    )[
                                                                        'clinic.city'
                                                                    ] ||
                                                                    validationErrors[
                                                                        'clinic.city'
                                                                    ]
                                                                }
                                                            />
                                                    </div>

                                                    <div className="space-y-2">
                                                        <Label htmlFor="clinic.postal_code_tab">
                                                                {t(
                                                                    'postal_code',
                                                                )}{' '}
                                                                <span className="text-sm text-muted-foreground">
                                                                    (
                                                                    {t(
                                                                        'optional',
                                                                    )}
                                                                    )
                                                                </span>
                                                        </Label>
                                                        <Input
                                                            id="clinic.postal_code_tab"
                                                            type="text"
                                                                value={
                                                                    data.clinic
                                                                        .postal_code
                                                                }
                                                            maxLength={20}
                                                                onChange={(
                                                                    e,
                                                                ) => {
                                                                    const value =
                                                                        e.target.value
                                                                            .replace(
                                                                                /\D/g,
                                                                                '',
                                                                            )
                                                                            .slice(
                                                                                0,
                                                                                20,
                                                                            );
                                                                    (
                                                                        setData as any
                                                                    )(
                                                                        'clinic.postal_code',
                                                                        value,
                                                                    );
                                                                    if (
                                                                        validationErrors[
                                                                            'clinic.postal_code'
                                                                        ]
                                                                    ) {
                                                                        setValidationErrors(
                                                                            (
                                                                                prev,
                                                                            ) => {
                                                                                const newErrors =
                                                                                    {
                                                                                        ...prev,
                                                                                    };
                                                                                delete newErrors[
                                                                                    'clinic.postal_code'
                                                                                ];
                                                                        return newErrors;
                                                                            },
                                                                        );
                                                                }
                                                            }}
                                                                onBlur={() =>
                                                                    handleFieldBlur(
                                                                        'clinic.postal_code',
                                                                    )
                                                                }
                                                                placeholder={t(
                                                                    'enter_postal_code',
                                                                )}
                                                                className={`${formErrors['clinic.postal_code'] || (externalErrors as any)['clinic.postal_code'] || validationErrors['clinic.postal_code'] ? 'border-red-500' : ''}`}
                                                                disabled={
                                                                    readOnly ||
                                                                    !data.clinic
                                                                        .governorate_id ||
                                                                    !data.clinic
                                                                        .area_id
                                                                }
                                                        />
                                                            <InputError
                                                                message={
                                                                    formErrors[
                                                                        'clinic.postal_code'
                                                                    ] ||
                                                                    (
                                                                        externalErrors as any
                                                                    )[
                                                                        'clinic.postal_code'
                                                                    ] ||
                                                                    validationErrors[
                                                                        'clinic.postal_code'
                                                                    ]
                                                                }
                                                            />
                                                    </div>

                                                    <div className="space-y-2">
                                                        <Label htmlFor="clinic.latitude_tab">
                                                                {t('latitude')}{' '}
                                                                <span className="text-sm text-muted-foreground">
                                                                    (
                                                                    {t(
                                                                        'optional',
                                                                    )}
                                                                    )
                                                                </span>
                                                        </Label>
                                                        <Input
                                                            id="clinic.latitude_tab"
                                                            type="number"
                                                            step="any"
                                                                value={
                                                                    data.clinic
                                                                        .latitude
                                                                }
                                                                onChange={(
                                                                    e,
                                                                ) => {
                                                                    const value =
                                                                        e.target
                                                                            .value;
                                                                    (
                                                                        setData as any
                                                                    )(
                                                                        'clinic.latitude',
                                                                        value,
                                                                    );
                                                                    if (
                                                                        validationErrors[
                                                                            'clinic.latitude'
                                                                        ]
                                                                    ) {
                                                                        setValidationErrors(
                                                                            (
                                                                                prev,
                                                                            ) => {
                                                                                const newErrors =
                                                                                    {
                                                                                        ...prev,
                                                                                    };
                                                                                delete newErrors[
                                                                                    'clinic.latitude'
                                                                                ];
                                                                        return newErrors;
                                                                            },
                                                                        );
                                                                }
                                                            }}
                                                            onBlur={(e) => {
                                                                    const value =
                                                                        e.target.value.trim();
                                                                if (value) {
                                                                        const lat =
                                                                            parseFloat(
                                                                                value,
                                                                            );
                                                                        if (
                                                                            isNaN(
                                                                                lat,
                                                                            ) ||
                                                                            lat <
                                                                                -90 ||
                                                                            lat >
                                                                                90
                                                                        ) {
                                                                            setValidationErrors(
                                                                                (
                                                                                    prev,
                                                                                ) => ({
                                                                            ...prev,
                                                                                    'clinic.latitude':
                                                                                        t(
                                                                                            'latitude_invalid',
                                                                                        ) ||
                                                                                        'Latitude must be a number between -90 and 90',
                                                                                }),
                                                                            );
                                                                    } else {
                                                                            setValidationErrors(
                                                                                (
                                                                                    prev,
                                                                                ) => {
                                                                                    const newErrors =
                                                                                        {
                                                                                            ...prev,
                                                                                        };
                                                                                    delete newErrors[
                                                                                        'clinic.latitude'
                                                                                    ];
                                                                            return newErrors;
                                                                                },
                                                                            );
                                                                    }
                                                                }
                                                                    handleFieldBlur(
                                                                        'clinic.latitude',
                                                                    );
                                                            }}
                                                            placeholder="29.3759"
                                                                className={`${formErrors['clinic.latitude'] || (externalErrors as any)['clinic.latitude'] || validationErrors['clinic.latitude'] ? 'border-red-500' : ''}`}
                                                                disabled={
                                                                    readOnly ||
                                                                    !data.clinic
                                                                        .governorate_id ||
                                                                    !data.clinic
                                                                        .area_id
                                                                }
                                                        />
                                                            <InputError
                                                                message={
                                                                    formErrors[
                                                                        'clinic.latitude'
                                                                    ] ||
                                                                    (
                                                                        externalErrors as any
                                                                    )[
                                                                        'clinic.latitude'
                                                                    ] ||
                                                                    validationErrors[
                                                                        'clinic.latitude'
                                                                    ]
                                                                }
                                                            />
                                                    </div>

                                                    <div className="space-y-2">
                                                        <Label htmlFor="clinic.longitude_tab">
                                                                {t('longitude')}{' '}
                                                                <span className="text-sm text-muted-foreground">
                                                                    (
                                                                    {t(
                                                                        'optional',
                                                                    )}
                                                                    )
                                                                </span>
                                                        </Label>
                                                        <Input
                                                            id="clinic.longitude_tab"
                                                            type="number"
                                                            step="any"
                                                                value={
                                                                    data.clinic
                                                                        .longitude
                                                                }
                                                                onChange={(
                                                                    e,
                                                                ) => {
                                                                    const value =
                                                                        e.target
                                                                            .value;
                                                                    (
                                                                        setData as any
                                                                    )(
                                                                        'clinic.longitude',
                                                                        value,
                                                                    );
                                                                    if (
                                                                        validationErrors[
                                                                            'clinic.longitude'
                                                                        ]
                                                                    ) {
                                                                        setValidationErrors(
                                                                            (
                                                                                prev,
                                                                            ) => {
                                                                                const newErrors =
                                                                                    {
                                                                                        ...prev,
                                                                                    };
                                                                                delete newErrors[
                                                                                    'clinic.longitude'
                                                                                ];
                                                                        return newErrors;
                                                                            },
                                                                        );
                                                                }
                                                            }}
                                                            onBlur={(e) => {
                                                                    const value =
                                                                        e.target.value.trim();
                                                                if (value) {
                                                                        const lng =
                                                                            parseFloat(
                                                                                value,
                                                                            );
                                                                        if (
                                                                            isNaN(
                                                                                lng,
                                                                            ) ||
                                                                            lng <
                                                                                -180 ||
                                                                            lng >
                                                                                180
                                                                        ) {
                                                                            setValidationErrors(
                                                                                (
                                                                                    prev,
                                                                                ) => ({
                                                                            ...prev,
                                                                                    'clinic.longitude':
                                                                                        t(
                                                                                            'longitude_invalid',
                                                                                        ) ||
                                                                                        'Longitude must be a number between -180 and 180',
                                                                                }),
                                                                            );
                                                                    } else {
                                                                            setValidationErrors(
                                                                                (
                                                                                    prev,
                                                                                ) => {
                                                                                    const newErrors =
                                                                                        {
                                                                                            ...prev,
                                                                                        };
                                                                                    delete newErrors[
                                                                                        'clinic.longitude'
                                                                                    ];
                                                                            return newErrors;
                                                                                },
                                                                            );
                                                                    }
                                                                }
                                                                    handleFieldBlur(
                                                                        'clinic.longitude',
                                                                    );
                                                            }}
                                                            placeholder="47.9774"
                                                                className={`${formErrors['clinic.longitude'] || (externalErrors as any)['clinic.longitude'] || validationErrors['clinic.longitude'] ? 'border-red-500' : ''}`}
                                                                disabled={
                                                                    readOnly ||
                                                                    !data.clinic
                                                                        .governorate_id ||
                                                                    !data.clinic
                                                                        .area_id
                                                                }
                                                        />
                                                            <InputError
                                                                message={
                                                                    formErrors[
                                                                        'clinic.longitude'
                                                                    ] ||
                                                                    (
                                                                        externalErrors as any
                                                                    )[
                                                                        'clinic.longitude'
                                                                    ] ||
                                                                    validationErrors[
                                                                        'clinic.longitude'
                                                                    ]
                                                                }
                                                            />
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    }
                                    
                                    // Step 4: Settings & Policies
                                    if (renderStep === 4) {
                                        return (
                                            <div className="space-y-6">
                                                    <div className="mb-6 flex items-center gap-3">
                                                    <Settings className="h-6 w-6 text-primary" />
                                                    <h2 className="text-2xl font-semibold text-foreground">
                                                            {t(
                                                                'settings_policies',
                                                            )}
                                                    </h2>
                                                </div>
                                                
                                                <div className="space-y-6">
                                                    <div className="space-y-4 border-b pb-6">
                                                            <h3 className="text-lg font-semibold">
                                                                {t(
                                                                    'booking_settings',
                                                                )}
                                                            </h3>
                                                        
                                                            <div
                                                                className={`flex items-center justify-between gap-3 ${isRTL ? 'flex-row-reverse' : ''}`}
                                                            >
                                                                <Label htmlFor="auto_confirm_tab">
                                                                    {t(
                                                                        'auto_confirm_bookings',
                                                                    )}
                                                                </Label>
                                                            <Switch
                                                                id="auto_confirm_tab"
                                                                    checked={
                                                                        data
                                                                            .clinic
                                                                            .auto_confirm_bookings
                                                                    }
                                                                    onCheckedChange={(
                                                                        checked,
                                                                    ) =>
                                                                        (
                                                                            setData as any
                                                                        )(
                                                                            'clinic.auto_confirm_bookings',
                                                                            checked,
                                                                        )
                                                                    }
                                                                    disabled={
                                                                        readOnly
                                                                    }
                                                            />
                                                        </div>
                                                    </div>

                                <div className="space-y-4">
                                                            <h3 className="text-lg font-semibold">
                                                                {t('policies')}
                                                            </h3>
                                                        
                                                        <div className="space-y-2">
                                                            <Label htmlFor="cancellation_policy_en_tab">
                                                                    {t(
                                                                        'cancellation_policy_en',
                                                                    )}{' '}
                                                                    <span className="text-red-500">*</span>
                                                            </Label>
                                                            <Textarea
                                                                id="cancellation_policy_en_tab"
                                                                    value={
                                                                        data
                                                                            .clinic
                                                                            .cancellation_policy_en
                                                                    }
                                                                    maxLength={
                                                                        10000
                                                                    }
                                                                    onChange={(
                                                                        e,
                                                                    ) => {
                                                                        const value =
                                                                            e
                                                                                .target
                                                                                .value;
                                                                        const limitedValue =
                                                                            value.slice(
                                                                                0,
                                                                                10000,
                                                                            );
                                                                        (
                                                                            setData as any
                                                                        )(
                                                                            'clinic.cancellation_policy_en',
                                                                            limitedValue,
                                                                        );
                                                                        const englishPattern =
                                                                            /^[a-zA-Z0-9\s\-_.,;:!?@#$%^&*()[\]{}""''/]+$/;
                                                                        if (
                                                                            value &&
                                                                            value.trim()
                                                                        ) {
                                                                            if (
                                                                                !englishPattern.test(
                                                                                    value,
                                                                                )
                                                                            ) {
                                                                                const fieldName =
                                                                                    t(
                                                                                        'cancellation_policy_en',
                                                                                    ) ||
                                                                                    'Cancellation Policy (English)';
                                                                                const errorMsg =
                                                                                    t(
                                                                                        'clinic_name_en_must_be_english',
                                                                                    ) ||
                                                                                    t(
                                                                                        'field_must_be_english_only',
                                                                                    )?.replace(
                                                                                        ':attribute',
                                                                                        fieldName,
                                                                                    ) ||
                                                                                    `${fieldName} must contain only English characters`;
                                                                                setValidationErrors(
                                                                                    (
                                                                                        prev,
                                                                                    ) => ({
                                                                                ...prev,
                                                                                        'clinic.cancellation_policy_en':
                                                                                            errorMsg,
                                                                                    }),
                                                                                );
                                                                        } else {
                                                                                setValidationErrors(
                                                                                    (
                                                                                        prev,
                                                                                    ) => {
                                                                                        const newErrors =
                                                                                            {
                                                                                                ...prev,
                                                                                            };
                                                                                        delete newErrors[
                                                                                            'clinic.cancellation_policy_en'
                                                                                        ];
                                                                                return newErrors;
                                                                                    },
                                                                                );
                                                                        }
                                                                    } else {
                                                                            setValidationErrors(
                                                                                (
                                                                                    prev,
                                                                                ) => {
                                                                                    const newErrors =
                                                                                        {
                                                                                            ...prev,
                                                                                        };
                                                                                    delete newErrors[
                                                                                        'clinic.cancellation_policy_en'
                                                                                    ];
                                                                            return newErrors;
                                                                                },
                                                                            );
                                                                    }
                                                                }}
                                                                    onBlur={() =>
                                                                        handleFieldBlur(
                                                                            'clinic.cancellation_policy_en',
                                                                        )
                                                                    }
                                                                    placeholder={t(
                                                                        'enter_cancellation_policy_en',
                                                                    )}
                                                                rows={4}
                                                                className={`${getFieldError('clinic.cancellation_policy_en') ? 'border-red-500' : ''}`}
                                                                    disabled={
                                                                        readOnly
                                                                    }
                                                            />
                                                                <InputError
                                                                    message={getFieldError(
                                                                        'clinic.cancellation_policy_en',
                                                                    )}
                                                                />
                                                        </div>

                                                        <div className="space-y-2">
                                                            <Label htmlFor="cancellation_policy_ar_tab">
                                                                    {t(
                                                                        'cancellation_policy_ar',
                                                                    )}{' '}
                                                                    <span className="text-red-500">*</span>
                                                            </Label>
                                                            <Textarea
                                                                id="cancellation_policy_ar_tab"
                                                                    value={
                                                                        data
                                                                            .clinic
                                                                            .cancellation_policy_ar
                                                                    }
                                                                    maxLength={
                                                                        10000
                                                                    }
                                                                    onChange={(
                                                                        e,
                                                                    ) => {
                                                                        const value =
                                                                            e
                                                                                .target
                                                                                .value;
                                                                        const limitedValue =
                                                                            value.slice(
                                                                                0,
                                                                                10000,
                                                                            );
                                                                        (
                                                                            setData as any
                                                                        )(
                                                                            'clinic.cancellation_policy_ar',
                                                                            limitedValue,
                                                                        );
                                                                        const arabicPattern =
                                                                            /^[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF\s\u0660-\u0669\u06F0-\u06F9.,;:!?\-_()[\]{}""''«»/]+$/u;
                                                                        if (
                                                                            value &&
                                                                            value.trim()
                                                                        ) {
                                                                            if (
                                                                                !arabicPattern.test(
                                                                                    value,
                                                                                )
                                                                            ) {
                                                                                const fieldName =
                                                                                    t(
                                                                                        'cancellation_policy_ar',
                                                                                    ) ||
                                                                                    'Cancellation Policy (Arabic)';
                                                                                const errorMsg =
                                                                                    t(
                                                                                        'clinic_name_ar_must_be_arabic',
                                                                                    ) ||
                                                                                    t(
                                                                                        'field_must_be_arabic_only',
                                                                                    )?.replace(
                                                                                        ':attribute',
                                                                                        fieldName,
                                                                                    ) ||
                                                                                    `${fieldName} must contain only Arabic characters`;
                                                                                setValidationErrors(
                                                                                    (
                                                                                        prev,
                                                                                    ) => ({
                                                                                ...prev,
                                                                                        'clinic.cancellation_policy_ar':
                                                                                            errorMsg,
                                                                                    }),
                                                                                );
                                                                        } else {
                                                                                setValidationErrors(
                                                                                    (
                                                                                        prev,
                                                                                    ) => {
                                                                                        const newErrors =
                                                                                            {
                                                                                                ...prev,
                                                                                            };
                                                                                        delete newErrors[
                                                                                            'clinic.cancellation_policy_ar'
                                                                                        ];
                                                                                return newErrors;
                                                                                    },
                                                                                );
                                                                        }
                                                                    } else {
                                                                            setValidationErrors(
                                                                                (
                                                                                    prev,
                                                                                ) => {
                                                                                    const newErrors =
                                                                                        {
                                                                                            ...prev,
                                                                                        };
                                                                                    delete newErrors[
                                                                                        'clinic.cancellation_policy_ar'
                                                                                    ];
                                                                            return newErrors;
                                                                                },
                                                                            );
                                                                    }
                                                                }}
                                                                    onBlur={() =>
                                                                        handleFieldBlur(
                                                                            'clinic.cancellation_policy_ar',
                                                                        )
                                                                    }
                                                                    placeholder={t(
                                                                        'enter_cancellation_policy_ar',
                                                                    )}
                                                                rows={4}
                                                                className={`${getFieldError('clinic.cancellation_policy_ar') ? 'border-red-500' : ''}`}
                                                                    disabled={
                                                                        readOnly
                                                                    }
                                                            />
                                                                <InputError
                                                                    message={getFieldError(
                                                                        'clinic.cancellation_policy_ar',
                                                                    )}
                                                                />
                                                        </div>

                                                        <div className="space-y-2">
                                                            <Label htmlFor="refund_policy_en_tab">
                                                                    {t(
                                                                        'refund_policy_en',
                                                                    )}{' '}
                                                                    <span className="text-red-500">*</span>
                                                            </Label>
                                                            <Textarea
                                                                id="refund_policy_en_tab"
                                                                    value={
                                                                        data
                                                                            .clinic
                                                                            .refund_policy_en
                                                                    }
                                                                    maxLength={
                                                                        10000
                                                                    }
                                                                    onChange={(
                                                                        e,
                                                                    ) => {
                                                                        const value =
                                                                            e
                                                                                .target
                                                                                .value;
                                                                        const limitedValue =
                                                                            value.slice(
                                                                                0,
                                                                                10000,
                                                                            );
                                                                        (
                                                                            setData as any
                                                                        )(
                                                                            'clinic.refund_policy_en',
                                                                            limitedValue,
                                                                        );
                                                                        const englishPattern =
                                                                            /^[a-zA-Z0-9\s\-_.,;:!?@#$%^&*()[\]{}""''/]+$/;
                                                                        if (
                                                                            value &&
                                                                            value.trim()
                                                                        ) {
                                                                            if (
                                                                                !englishPattern.test(
                                                                                    value,
                                                                                )
                                                                            ) {
                                                                                const fieldName =
                                                                                    t(
                                                                                        'refund_policy_en',
                                                                                    ) ||
                                                                                    'Refund Policy (English)';
                                                                                const errorMsg =
                                                                                    t(
                                                                                        'clinic_name_en_must_be_english',
                                                                                    ) ||
                                                                                    t(
                                                                                        'field_must_be_english_only',
                                                                                    )?.replace(
                                                                                        ':attribute',
                                                                                        fieldName,
                                                                                    ) ||
                                                                                    `${fieldName} must contain only English characters`;
                                                                                setValidationErrors(
                                                                                    (
                                                                                        prev,
                                                                                    ) => ({
                                                                                ...prev,
                                                                                        'clinic.refund_policy_en':
                                                                                            errorMsg,
                                                                                    }),
                                                                                );
                                                                        } else {
                                                                                setValidationErrors(
                                                                                    (
                                                                                        prev,
                                                                                    ) => {
                                                                                        const newErrors =
                                                                                            {
                                                                                                ...prev,
                                                                                            };
                                                                                        delete newErrors[
                                                                                            'clinic.refund_policy_en'
                                                                                        ];
                                                                                return newErrors;
                                                                                    },
                                                                                );
                                                                        }
                                                                    } else {
                                                                            setValidationErrors(
                                                                                (
                                                                                    prev,
                                                                                ) => {
                                                                                    const newErrors =
                                                                                        {
                                                                                            ...prev,
                                                                                        };
                                                                                    delete newErrors[
                                                                                        'clinic.refund_policy_en'
                                                                                    ];
                                                                            return newErrors;
                                                                                },
                                                                            );
                                                                    }
                                                                }}
                                                                    onBlur={() =>
                                                                        handleFieldBlur(
                                                                            'clinic.refund_policy_en',
                                                                        )
                                                                    }
                                                                    placeholder={t(
                                                                        'enter_refund_policy_en',
                                                                    )}
                                                                rows={4}
                                                                className={`${getFieldError('clinic.refund_policy_en') ? 'border-red-500' : ''}`}
                                                                    disabled={
                                                                        readOnly
                                                                    }
                                                            />
                                                                <InputError
                                                                    message={getFieldError(
                                                                        'clinic.refund_policy_en',
                                                                    )}
                                                                />
                                                        </div>

                                                        <div className="space-y-2">
                                                            <Label htmlFor="refund_policy_ar_tab">
                                                                    {t(
                                                                        'refund_policy_ar',
                                                                    )}{' '}
                                                                    <span className="text-red-500">*</span>
                                                            </Label>
                                                            <Textarea
                                                                id="refund_policy_ar_tab"
                                                                    value={
                                                                        data
                                                                            .clinic
                                                                            .refund_policy_ar
                                                                    }
                                                                    maxLength={
                                                                        10000
                                                                    }
                                                                    onChange={(
                                                                        e,
                                                                    ) => {
                                                                        const value =
                                                                            e
                                                                                .target
                                                                                .value;
                                                                        const limitedValue =
                                                                            value.slice(
                                                                                0,
                                                                                10000,
                                                                            );
                                                                        (
                                                                            setData as any
                                                                        )(
                                                                            'clinic.refund_policy_ar',
                                                                            limitedValue,
                                                                        );
                                                                        const arabicPattern =
                                                                            /^[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF\s\u0660-\u0669\u06F0-\u06F9.,;:!?\-_()[\]{}""''«»/]+$/u;
                                                                        if (
                                                                            value &&
                                                                            value.trim()
                                                                        ) {
                                                                            if (
                                                                                !arabicPattern.test(
                                                                                    value,
                                                                                )
                                                                            ) {
                                                                                const fieldName =
                                                                                    t(
                                                                                        'refund_policy_ar',
                                                                                    ) ||
                                                                                    'Refund Policy (Arabic)';
                                                                                const errorMsg =
                                                                                    t(
                                                                                        'clinic_name_ar_must_be_arabic',
                                                                                    ) ||
                                                                                    t(
                                                                                        'field_must_be_arabic_only',
                                                                                    )?.replace(
                                                                                        ':attribute',
                                                                                        fieldName,
                                                                                    ) ||
                                                                                    `${fieldName} must contain only Arabic characters`;
                                                                                setValidationErrors(
                                                                                    (
                                                                                        prev,
                                                                                    ) => ({
                                                                                ...prev,
                                                                                        'clinic.refund_policy_ar':
                                                                                            errorMsg,
                                                                                    }),
                                                                                );
                                                                        } else {
                                                                                setValidationErrors(
                                                                                    (
                                                                                        prev,
                                                                                    ) => {
                                                                                        const newErrors =
                                                                                            {
                                                                                                ...prev,
                                                                                            };
                                                                                        delete newErrors[
                                                                                            'clinic.refund_policy_ar'
                                                                                        ];
                                                                                return newErrors;
                                                                                    },
                                                                                );
                                                                        }
                                                                    } else {
                                                                            setValidationErrors(
                                                                                (
                                                                                    prev,
                                                                                ) => {
                                                                                    const newErrors =
                                                                                        {
                                                                                            ...prev,
                                                                                        };
                                                                                    delete newErrors[
                                                                                        'clinic.refund_policy_ar'
                                                                                    ];
                                                                            return newErrors;
                                                                                },
                                                                            );
                                                                    }
                                                                }}
                                                                    onBlur={() =>
                                                                        handleFieldBlur(
                                                                            'clinic.refund_policy_ar',
                                                                        )
                                                                    }
                                                                    placeholder={t(
                                                                        'enter_refund_policy_ar',
                                                                    )}
                                                                rows={4}
                                                                className={`${getFieldError('clinic.refund_policy_ar') ? 'border-red-500' : ''}`}
                                                                    disabled={
                                                                        readOnly
                                                                    }
                                                            />
                                                                <InputError
                                                                    message={getFieldError(
                                                                        'clinic.refund_policy_ar',
                                                                    )}
                                                                />
                                                        </div>

                                                        <div className="space-y-2">
                                                            <Label htmlFor="privacy_policy_en_tab">
                                                                {t('privacy_policy_en')}
                                                            </Label>
                                                            <Textarea
                                                                id="privacy_policy_en_tab"
                                                                value={
                                                                    data
                                                                        .clinic
                                                                        .privacy_policy_en
                                                                }
                                                                maxLength={
                                                                    10000
                                                                }
                                                                onChange={(
                                                                    e,
                                                                ) => {
                                                                    const value =
                                                                        e
                                                                            .target
                                                                            .value;
                                                                    const limitedValue =
                                                                        value.slice(
                                                                            0,
                                                                            10000,
                                                                        );
                                                                    (
                                                                        setData as any
                                                                    )(
                                                                        'clinic.privacy_policy_en',
                                                                        limitedValue,
                                                                    );
                                                                    const englishPattern =
                                                                        /^[a-zA-Z0-9\s\-_.,;:!?@#$%^&*()[\]{}""''/]+$/;
                                                                    if (
                                                                        value &&
                                                                        value.trim()
                                                                    ) {
                                                                        if (
                                                                            !englishPattern.test(
                                                                                value,
                                                                            )
                                                                        ) {
                                                                            const fieldName =
                                                                                t(
                                                                                    'privacy_policy_en',
                                                                                ) ||
                                                                                'Privacy Policy (English)';
                                                                            const errorMsg =
                                                                                t(
                                                                                    'clinic_name_en_must_be_english',
                                                                                ) ||
                                                                                t(
                                                                                    'field_must_be_english_only',
                                                                                )?.replace(
                                                                                    ':attribute',
                                                                                    fieldName,
                                                                                ) ||
                                                                                `${fieldName} must contain only English characters`;
                                                                            setValidationErrors(
                                                                                (
                                                                                    prev,
                                                                                ) => ({
                                                                                    ...prev,
                                                                                    'clinic.privacy_policy_en':
                                                                                        errorMsg,
                                                                                }),
                                                                            );
                                                                        } else {
                                                                            setValidationErrors(
                                                                                (
                                                                                    prev,
                                                                                ) => {
                                                                                    const newErrors =
                                                                                        {
                                                                                            ...prev,
                                                                                        };
                                                                                    delete newErrors[
                                                                                        'clinic.privacy_policy_en'
                                                                                    ];
                                                                                    return newErrors;
                                                                                },
                                                                            );
                                                                        }
                                                                    } else {
                                                                        setValidationErrors(
                                                                            (
                                                                                prev,
                                                                            ) => {
                                                                                const newErrors =
                                                                                    {
                                                                                        ...prev,
                                                                                    };
                                                                                delete newErrors[
                                                                                    'clinic.privacy_policy_en'
                                                                                ];
                                                                                return newErrors;
                                                                            },
                                                                        );
                                                                    }
                                                                }}
                                                                onBlur={() =>
                                                                    handleFieldBlur(
                                                                        'clinic.privacy_policy_en',
                                                                    )
                                                                }
                                                                placeholder={t(
                                                                    'enter_privacy_policy_en',
                                                                )}
                                                                rows={4}
                                                                className={`${getFieldError('clinic.privacy_policy_en') ? 'border-red-500' : ''}`}
                                                                disabled={
                                                                    readOnly
                                                                }
                                                            />
                                                            <InputError
                                                                message={getFieldError(
                                                                    'clinic.privacy_policy_en',
                                                                )}
                                                            />
                                                        </div>

                                                        <div className="space-y-2">
                                                            <Label htmlFor="privacy_policy_ar_tab">
                                                                {t('privacy_policy_ar')}
                                                            </Label>
                                                            <Textarea
                                                                id="privacy_policy_ar_tab"
                                                                value={
                                                                    data
                                                                        .clinic
                                                                        .privacy_policy_ar
                                                                }
                                                                maxLength={
                                                                    10000
                                                                }
                                                                onChange={(
                                                                    e,
                                                                ) => {
                                                                    const value =
                                                                        e
                                                                            .target
                                                                            .value;
                                                                    const limitedValue =
                                                                        value.slice(
                                                                            0,
                                                                            10000,
                                                                        );
                                                                    (
                                                                        setData as any
                                                                    )(
                                                                        'clinic.privacy_policy_ar',
                                                                        limitedValue,
                                                                    );
                                                                    const arabicPattern =
                                                                        /^[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF\s\u0660-\u0669\u06F0-\u06F9.,;:!?\-_()[\]{}""''«»/]+$/u;
                                                                    if (
                                                                        value &&
                                                                        value.trim()
                                                                    ) {
                                                                        if (
                                                                            !arabicPattern.test(
                                                                                value,
                                                                            )
                                                                        ) {
                                                                            const fieldName =
                                                                                t(
                                                                                    'privacy_policy_ar',
                                                                                ) ||
                                                                                'Privacy Policy (Arabic)';
                                                                            const errorMsg =
                                                                                t(
                                                                                    'clinic_name_ar_must_be_arabic',
                                                                                ) ||
                                                                                t(
                                                                                    'field_must_be_arabic_only',
                                                                                )?.replace(
                                                                                    ':attribute',
                                                                                    fieldName,
                                                                                ) ||
                                                                                `${fieldName} must contain only Arabic characters`;
                                                                            setValidationErrors(
                                                                                (
                                                                                    prev,
                                                                                ) => ({
                                                                                    ...prev,
                                                                                    'clinic.privacy_policy_ar':
                                                                                        errorMsg,
                                                                                }),
                                                                            );
                                                                        } else {
                                                                            setValidationErrors(
                                                                                (
                                                                                    prev,
                                                                                ) => {
                                                                                    const newErrors =
                                                                                        {
                                                                                            ...prev,
                                                                                        };
                                                                                    delete newErrors[
                                                                                        'clinic.privacy_policy_ar'
                                                                                    ];
                                                                                    return newErrors;
                                                                                },
                                                                            );
                                                                        }
                                                                    } else {
                                                                        setValidationErrors(
                                                                            (
                                                                                prev,
                                                                            ) => {
                                                                                const newErrors =
                                                                                    {
                                                                                        ...prev,
                                                                                    };
                                                                                delete newErrors[
                                                                                    'clinic.privacy_policy_ar'
                                                                                ];
                                                                                return newErrors;
                                                                            },
                                                                        );
                                                                    }
                                                                }}
                                                                onBlur={() =>
                                                                    handleFieldBlur(
                                                                        'clinic.privacy_policy_ar',
                                                                    )
                                                                }
                                                                placeholder={t(
                                                                    'enter_privacy_policy_ar',
                                                                )}
                                                                rows={4}
                                                                className={`${getFieldError('clinic.privacy_policy_ar') ? 'border-red-500' : ''}`}
                                                                disabled={
                                                                    readOnly
                                                                }
                                                            />
                                                            <InputError
                                                                message={getFieldError(
                                                                    'clinic.privacy_policy_ar',
                                                                )}
                                                            />
                                                        </div>

                                                        <div className="space-y-2">
                                                            <Label htmlFor="terms_and_conditions_en_tab">
                                                                {t('terms_and_conditions_en')}
                                                            </Label>
                                                            <Textarea
                                                                id="terms_and_conditions_en_tab"
                                                                value={
                                                                    data
                                                                        .clinic
                                                                        .terms_and_conditions_en
                                                                }
                                                                maxLength={
                                                                    10000
                                                                }
                                                                onChange={(
                                                                    e,
                                                                ) => {
                                                                    const value =
                                                                        e
                                                                            .target
                                                                            .value;
                                                                    const limitedValue =
                                                                        value.slice(
                                                                            0,
                                                                            10000,
                                                                        );
                                                                    (
                                                                        setData as any
                                                                    )(
                                                                        'clinic.terms_and_conditions_en',
                                                                        limitedValue,
                                                                    );
                                                                    const englishPattern =
                                                                        /^[a-zA-Z0-9\s\-_.,;:!?@#$%^&*()[\]{}""''/]+$/;
                                                                    if (
                                                                        value &&
                                                                        value.trim()
                                                                    ) {
                                                                        if (
                                                                            !englishPattern.test(
                                                                                value,
                                                                            )
                                                                        ) {
                                                                            const fieldName =
                                                                                t(
                                                                                    'terms_and_conditions_en',
                                                                                ) ||
                                                                                'Terms & Conditions (English)';
                                                                            const errorMsg =
                                                                                t(
                                                                                    'clinic_name_en_must_be_english',
                                                                                ) ||
                                                                                t(
                                                                                    'field_must_be_english_only',
                                                                                )?.replace(
                                                                                    ':attribute',
                                                                                    fieldName,
                                                                                ) ||
                                                                                `${fieldName} must contain only English characters`;
                                                                            setValidationErrors(
                                                                                (
                                                                                    prev,
                                                                                ) => ({
                                                                                    ...prev,
                                                                                    'clinic.terms_and_conditions_en':
                                                                                        errorMsg,
                                                                                }),
                                                                            );
                                                                        } else {
                                                                            setValidationErrors(
                                                                                (
                                                                                    prev,
                                                                                ) => {
                                                                                    const newErrors =
                                                                                        {
                                                                                            ...prev,
                                                                                        };
                                                                                    delete newErrors[
                                                                                        'clinic.terms_and_conditions_en'
                                                                                    ];
                                                                                    return newErrors;
                                                                                },
                                                                            );
                                                                        }
                                                                    } else {
                                                                        setValidationErrors(
                                                                            (
                                                                                prev,
                                                                            ) => {
                                                                                const newErrors =
                                                                                    {
                                                                                        ...prev,
                                                                                    };
                                                                                delete newErrors[
                                                                                    'clinic.terms_and_conditions_en'
                                                                                ];
                                                                                return newErrors;
                                                                            },
                                                                        );
                                                                    }
                                                                }}
                                                                onBlur={() =>
                                                                    handleFieldBlur(
                                                                        'clinic.terms_and_conditions_en',
                                                                    )
                                                                }
                                                                placeholder={t(
                                                                    'enter_terms_and_conditions_en',
                                                                )}
                                                                rows={4}
                                                                className={`${getFieldError('clinic.terms_and_conditions_en') ? 'border-red-500' : ''}`}
                                                                disabled={
                                                                    readOnly
                                                                }
                                                            />
                                                            <InputError
                                                                message={getFieldError(
                                                                    'clinic.terms_and_conditions_en',
                                                                )}
                                                            />
                                                        </div>

                                                        <div className="space-y-2">
                                                            <Label htmlFor="terms_and_conditions_ar_tab">
                                                                {t('terms_and_conditions_ar')}
                                                            </Label>
                                                            <Textarea
                                                                id="terms_and_conditions_ar_tab"
                                                                value={
                                                                    data
                                                                        .clinic
                                                                        .terms_and_conditions_ar
                                                                }
                                                                maxLength={
                                                                    10000
                                                                }
                                                                onChange={(
                                                                    e,
                                                                ) => {
                                                                    const value =
                                                                        e
                                                                            .target
                                                                            .value;
                                                                    const limitedValue =
                                                                        value.slice(
                                                                            0,
                                                                            10000,
                                                                        );
                                                                    (
                                                                        setData as any
                                                                    )(
                                                                        'clinic.terms_and_conditions_ar',
                                                                        limitedValue,
                                                                    );
                                                                    const arabicPattern =
                                                                        /^[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF\s\u0660-\u0669\u06F0-\u06F9.,;:!?\-_()[\]{}""''«»/]+$/u;
                                                                    if (
                                                                        value &&
                                                                        value.trim()
                                                                    ) {
                                                                        if (
                                                                            !arabicPattern.test(
                                                                                value,
                                                                            )
                                                                        ) {
                                                                            const fieldName =
                                                                                t(
                                                                                    'terms_and_conditions_ar',
                                                                                ) ||
                                                                                'Terms & Conditions (Arabic)';
                                                                            const errorMsg =
                                                                                t(
                                                                                    'clinic_name_ar_must_be_arabic',
                                                                                ) ||
                                                                                t(
                                                                                    'field_must_be_arabic_only',
                                                                                )?.replace(
                                                                                    ':attribute',
                                                                                    fieldName,
                                                                                ) ||
                                                                                `${fieldName} must contain only Arabic characters`;
                                                                            setValidationErrors(
                                                                                (
                                                                                    prev,
                                                                                ) => ({
                                                                                    ...prev,
                                                                                    'clinic.terms_and_conditions_ar':
                                                                                        errorMsg,
                                                                                }),
                                                                            );
                                                                        } else {
                                                                            setValidationErrors(
                                                                                (
                                                                                    prev,
                                                                                ) => {
                                                                                    const newErrors =
                                                                                        {
                                                                                            ...prev,
                                                                                        };
                                                                                    delete newErrors[
                                                                                        'clinic.terms_and_conditions_ar'
                                                                                    ];
                                                                                    return newErrors;
                                                                                },
                                                                            );
                                                                        }
                                                                    } else {
                                                                        setValidationErrors(
                                                                            (
                                                                                prev,
                                                                            ) => {
                                                                                const newErrors =
                                                                                    {
                                                                                        ...prev,
                                                                                    };
                                                                                delete newErrors[
                                                                                    'clinic.terms_and_conditions_ar'
                                                                                ];
                                                                                return newErrors;
                                                                            },
                                                                        );
                                                                    }
                                                                }}
                                                                onBlur={() =>
                                                                    handleFieldBlur(
                                                                        'clinic.terms_and_conditions_ar',
                                                                    )
                                                                }
                                                                placeholder={t(
                                                                    'enter_terms_and_conditions_ar',
                                                                )}
                                                                rows={4}
                                                                className={`${getFieldError('clinic.terms_and_conditions_ar') ? 'border-red-500' : ''}`}
                                                                disabled={
                                                                    readOnly
                                                                }
                                                            />
                                                            <InputError
                                                                message={getFieldError(
                                                                    'clinic.terms_and_conditions_ar',
                                                                )}
                                                            />
                                                        </div>

                                                        <div className="space-y-2">
                                                            <Label htmlFor="reschedule_policy_en_tab">
                                                                    {t(
                                                                        'reschedule_policy_en',
                                                                    )}{' '}
                                                                    <span className="text-red-500">*</span>
                                                            </Label>
                                                            <Textarea
                                                                id="reschedule_policy_en_tab"
                                                                    value={
                                                                        data
                                                                            .clinic
                                                                            .reschedule_policy_en
                                                                    }
                                                                    maxLength={
                                                                        10000
                                                                    }
                                                                    onChange={(
                                                                        e,
                                                                    ) => {
                                                                        const value =
                                                                            e
                                                                                .target
                                                                                .value;
                                                                        const limitedValue =
                                                                            value.slice(
                                                                                0,
                                                                                10000,
                                                                            );
                                                                        (
                                                                            setData as any
                                                                        )(
                                                                            'clinic.reschedule_policy_en',
                                                                            limitedValue,
                                                                        );
                                                                        const englishPattern =
                                                                            /^[a-zA-Z0-9\s\-_.,;:!?@#$%^&*()[\]{}""''/]+$/;
                                                                        if (
                                                                            value &&
                                                                            value.trim()
                                                                        ) {
                                                                            if (
                                                                                !englishPattern.test(
                                                                                    value,
                                                                                )
                                                                            ) {
                                                                                const fieldName =
                                                                                    t(
                                                                                        'reschedule_policy_en',
                                                                                    ) ||
                                                                                    'Reschedule Policy (English)';
                                                                                const errorMsg =
                                                                                    t(
                                                                                        'clinic_name_en_must_be_english',
                                                                                    ) ||
                                                                                    t(
                                                                                        'field_must_be_english_only',
                                                                                    )?.replace(
                                                                                        ':attribute',
                                                                                        fieldName,
                                                                                    ) ||
                                                                                    `${fieldName} must contain only English characters`;
                                                                                setValidationErrors(
                                                                                    (
                                                                                        prev,
                                                                                    ) => ({
                                                                                ...prev,
                                                                                        'clinic.reschedule_policy_en':
                                                                                            errorMsg,
                                                                                    }),
                                                                                );
                                                                        } else {
                                                                                setValidationErrors(
                                                                                    (
                                                                                        prev,
                                                                                    ) => {
                                                                                        const newErrors =
                                                                                            {
                                                                                                ...prev,
                                                                                            };
                                                                                        delete newErrors[
                                                                                            'clinic.reschedule_policy_en'
                                                                                        ];
                                                                                return newErrors;
                                                                                    },
                                                                                );
                                                                        }
                                                                    } else {
                                                                            setValidationErrors(
                                                                                (
                                                                                    prev,
                                                                                ) => {
                                                                                    const newErrors =
                                                                                        {
                                                                                            ...prev,
                                                                                        };
                                                                                    delete newErrors[
                                                                                        'clinic.reschedule_policy_en'
                                                                                    ];
                                                                            return newErrors;
                                                                                },
                                                                            );
                                                                    }
                                                                }}
                                                                    onBlur={() =>
                                                                        handleFieldBlur(
                                                                            'clinic.reschedule_policy_en',
                                                                        )
                                                                    }
                                                                    placeholder={t(
                                                                        'enter_reschedule_policy_en',
                                                                    )}
                                                                rows={4}
                                                                className={`${getFieldError('clinic.reschedule_policy_en') ? 'border-red-500' : ''}`}
                                                                    disabled={
                                                                        readOnly
                                                                    }
                                                            />
                                                                <InputError
                                                                    message={getFieldError(
                                                                        'clinic.reschedule_policy_en',
                                                                    )}
                                                                />
                                                        </div>

                                                        <div className="space-y-2">
                                                            <Label htmlFor="reschedule_policy_ar_tab">
                                                                    {t(
                                                                        'reschedule_policy_ar',
                                                                    )}{' '}
                                                                    <span className="text-red-500">*</span>
                                                            </Label>
                                                            <Textarea
                                                                id="reschedule_policy_ar_tab"
                                                                    value={
                                                                        data
                                                                            .clinic
                                                                            .reschedule_policy_ar
                                                                    }
                                                                    maxLength={
                                                                        10000
                                                                    }
                                                                    onChange={(
                                                                        e,
                                                                    ) => {
                                                                        const value =
                                                                            e
                                                                                .target
                                                                                .value;
                                                                        const limitedValue =
                                                                            value.slice(
                                                                                0,
                                                                                10000,
                                                                            );
                                                                        (
                                                                            setData as any
                                                                        )(
                                                                            'clinic.reschedule_policy_ar',
                                                                            limitedValue,
                                                                        );
                                                                        const arabicPattern =
                                                                            /^[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF\s\u0660-\u0669\u06F0-\u06F9.,;:!?\-_()[\]{}""''«»/]+$/u;
                                                                        if (
                                                                            value &&
                                                                            value.trim()
                                                                        ) {
                                                                            if (
                                                                                !arabicPattern.test(
                                                                                    value,
                                                                                )
                                                                            ) {
                                                                                const fieldName =
                                                                                    t(
                                                                                        'reschedule_policy_ar',
                                                                                    ) ||
                                                                                    'Reschedule Policy (Arabic)';
                                                                                const errorMsg =
                                                                                    t(
                                                                                        'clinic_name_ar_must_be_arabic',
                                                                                    ) ||
                                                                                    t(
                                                                                        'field_must_be_arabic_only',
                                                                                    )?.replace(
                                                                                        ':attribute',
                                                                                        fieldName,
                                                                                    ) ||
                                                                                    `${fieldName} must contain only Arabic characters`;
                                                                                setValidationErrors(
                                                                                    (
                                                                                        prev,
                                                                                    ) => ({
                                                                                ...prev,
                                                                                        'clinic.reschedule_policy_ar':
                                                                                            errorMsg,
                                                                                    }),
                                                                                );
                                                                        } else {
                                                                                setValidationErrors(
                                                                                    (
                                                                                        prev,
                                                                                    ) => {
                                                                                        const newErrors =
                                                                                            {
                                                                                                ...prev,
                                                                                            };
                                                                                        delete newErrors[
                                                                                            'clinic.reschedule_policy_ar'
                                                                                        ];
                                                                                return newErrors;
                                                                                    },
                                                                                );
                                                                        }
                                                                    } else {
                                                                            setValidationErrors(
                                                                                (
                                                                                    prev,
                                                                                ) => {
                                                                                    const newErrors =
                                                                                        {
                                                                                            ...prev,
                                                                                        };
                                                                                    delete newErrors[
                                                                                        'clinic.reschedule_policy_ar'
                                                                                    ];
                                                                            return newErrors;
                                                                                },
                                                                            );
                                                                    }
                                                                }}
                                                                    onBlur={() =>
                                                                        handleFieldBlur(
                                                                            'clinic.reschedule_policy_ar',
                                                                        )
                                                                    }
                                                                    placeholder={t(
                                                                        'enter_reschedule_policy_ar',
                                                                    )}
                                                                rows={4}
                                                                className={`${getFieldError('clinic.reschedule_policy_ar') ? 'border-red-500' : ''}`}
                                                                    disabled={
                                                                        readOnly
                                                                    }
                                                            />
                                                                <InputError
                                                                    message={getFieldError(
                                                                        'clinic.reschedule_policy_ar',
                                                                    )}
                                                                />
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    }
                                    
                                    // Step 5: Operating Hours
                                    if (renderStep === 5) {
                                        return (
                                            <div className="space-y-6">
                                                    <div className="mb-6 flex items-center gap-3">
                                                    <Clock className="h-6 w-6 text-primary" />
                                                    <h2 className="text-2xl font-semibold text-foreground">
                                                            {t(
                                                                'operating_hours',
                                                            )}
                                                    </h2>
                                                </div>
                                                
                                                    {(validationErrors[
                                                        'operating_hours'
                                                    ] ||
                                                        validationErrors[
                                                            'operating_hours.0'
                                                        ]) && (
                                                        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 dark:border-red-800 dark:bg-red-900/20">
                                                            <InputError
                                                                message={
                                                                    validationErrors[
                                                                        'operating_hours'
                                                                    ] ||
                                                                    validationErrors[
                                                                        'operating_hours.0'
                                                                    ]
                                                                }
                                                            />
                                                    </div>
                                                )}
                                                <div className="space-y-4">
                                                        {data.clinic.operating_hours.map(
                                                            (hour, index) => {
                                                                const dayInfo =
                                                                    DAYS_OF_WEEK.find(
                                                                        (d) =>
                                                                            d.value ===
                                                                            hour.day_of_week,
                                                                    );
                                                                const dayLabel =
                                                                    dayInfo
                                                                        ? t(
                                                                              dayInfo.labelKey,
                                                                          )
                                                                        : hour.day_of_week;
                                                        
                                                        return (
                                                                    <div
                                                                        key={
                                                                            index
                                                                        }
                                                                        className="space-y-4 rounded-lg border p-4"
                                                                    >
                                                                        <div
                                                                            className={`flex items-center justify-between ${isRTL ? 'flex-row-reverse' : ''}`}
                                                                        >
                                                                            <h4 className="font-semibold">
                                                                                {
                                                                                    dayLabel
                                                                                }
                                                                            </h4>
                                                                            <div
                                                                                className={`flex items-center gap-4 ${isRTL ? 'flex-row-reverse' : ''}`}
                                                                            >
                                                                                <div
                                                                                    className={`flex items-center gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}
                                                                                >
                                                                            <Switch
                                                                                        checked={
                                                                                            hour.is_open &&
                                                                                            !hour.closed_all_day
                                                                                        }
                                                                                        onCheckedChange={(
                                                                                            checked,
                                                                                        ) => {
                                                                                            updateOperatingHourMultiple(
                                                                                                index,
                                                                                                {
                                                                                                    closed_all_day:
                                                                                                        !checked,
                                                                                                    is_open:
                                                                                                        checked,
                                                                                                },
                                                                                            );
                                                                                            if (
                                                                                                validationErrors[
                                                                                                    'operating_hours'
                                                                                                ] ||
                                                                                                validationErrors[
                                                                                                    'operating_hours.0'
                                                                                                ]
                                                                                            ) {
                                                                                                setValidationErrors(
                                                                                                    (
                                                                                                        prev,
                                                                                                    ) => {
                                                                                                        const newErrors =
                                                                                                            {
                                                                                                                ...prev,
                                                                                                            };
                                                                                                        delete newErrors[
                                                                                                            'operating_hours'
                                                                                                        ];
                                                                                                        delete newErrors[
                                                                                                            'operating_hours.0'
                                                                                                        ];
                                                                                            return newErrors;
                                                                                                    },
                                                                                                );
                                                                                    }
                                                                                            if (
                                                                                                validationErrors[
                                                                                                    `operating_hours.${index}`
                                                                                                ]
                                                                                            ) {
                                                                                                setValidationErrors(
                                                                                                    (
                                                                                                        prev,
                                                                                                    ) => {
                                                                                                        const newErrors =
                                                                                                            {
                                                                                                                ...prev,
                                                                                                            };
                                                                                                        delete newErrors[
                                                                                                            `operating_hours.${index}`
                                                                                                        ];
                                                                                            return newErrors;
                                                                                                    },
                                                                                                );
                                                                                    }
                                                                                }}
                                                                                        disabled={
                                                                                            readOnly
                                                                                        }
                                                                            />
                                                                                    <Label>
                                                                                        {t(
                                                                                            'open',
                                                                                        )}
                                                                                    </Label>
                                                                        </div>
                                                                    </div>
                                                                </div>

                                                                {!hour.closed_all_day && (
                                                                    <div className="grid grid-cols-2 gap-4">
                                                                        <div className="space-y-2">
                                                                                    <Label>
                                                                                        {t(
                                                                                            'opening_time',
                                                                                        )}
                                                                                    </Label>
                                                                            <Input
                                                                                type="time"
                                                                                        value={
                                                                                            hour.opening_time ||
                                                                                            ''
                                                                                        }
                                                                                        onChange={(
                                                                                            e,
                                                                                        ) => {
                                                                                            updateOperatingHour(
                                                                                                index,
                                                                                                'opening_time',
                                                                                                e
                                                                                                    .target
                                                                                                    .value,
                                                                                            );
                                                                                }}
                                                                                className={`${validationErrors[`operating_hours.${index}`] ? 'border-red-500' : ''}`}
                                                                                        disabled={
                                                                                            readOnly
                                                                                        }
                                                                            />
                                                                        </div>
                                                                        <div className="space-y-2">
                                                                                    <Label>
                                                                                        {t(
                                                                                            'closing_time',
                                                                                        )}
                                                                                    </Label>
                                                                            <Input
                                                                                type="time"
                                                                                        value={
                                                                                            hour.closing_time ||
                                                                                            ''
                                                                                        }
                                                                                        onChange={(
                                                                                            e,
                                                                                        ) => {
                                                                                            updateOperatingHour(
                                                                                                index,
                                                                                                'closing_time',
                                                                                                e
                                                                                                    .target
                                                                                                    .value,
                                                                                            );
                                                                                }}
                                                                                className={`${validationErrors[`operating_hours.${index}`] ? 'border-red-500' : ''}`}
                                                                                        disabled={
                                                                                            readOnly
                                                                                        }
                                                                            />
                                                                        </div>
                                                                                {validationErrors[
                                                                                    `operating_hours.${index}`
                                                                                ] && (
                                                                            <div className="col-span-2">
                                                                                        <InputError
                                                                                            message={
                                                                                                validationErrors[
                                                                                                    `operating_hours.${index}`
                                                                                                ]
                                                                                            }
                                                                                        />
                                                                            </div>
                                                                        )}
                                                                    </div>
                                                                )}
                                                            </div>
                                                        );
                                                            },
                                                        )}
                                                </div>
                                            </div>
                                        );
                                    }
                                    
                                    // Step 6: Documents
                                    if (renderStep === 6) {
                                        return (
                                            <div className="space-y-6">
                                                    <div className="mb-6 flex items-center gap-3">
                                                    <Upload className="h-6 w-6 text-primary" />
                                                    <h2 className="text-2xl font-semibold text-foreground">
                                                        {t('documents')}
                                                    </h2>
                                                </div>

                                                <div className="space-y-4">
                                                        <div className="rounded-lg border border-blue-200 bg-blue-50 p-3 dark:border-blue-800 dark:bg-blue-900/20">
                                                        <p className="text-sm text-blue-800 dark:text-blue-200">
                                                                {t(
                                                                    'documents_upload_info',
                                                                )}
                                                        </p>
                                                    </div>

                                                    <div className="space-y-2">
                                                        <Label htmlFor="business_license_tab">
                                                                {t(
                                                                    'business_license',
                                                                )}{' '}
                                                                <span className="text-red-500">
                                                                    *
                                                                </span>
                                                        </Label>
                                                        <div className="flex items-center gap-4">
                                                                <div className="flex-1 rounded-lg border-2 border-dashed border-border p-3">
                                                                <Input
                                                                    id="business_license_tab"
                                                                    type="file"
                                                                    accept=".pdf,.jpg,.jpeg,.png"
                                                                        onChange={(
                                                                            e,
                                                                        ) =>
                                                                            handleFileChange(
                                                                                'business_license',
                                                                                e
                                                                                    .target
                                                                                    .files?.[0] ||
                                                                                    null,
                                                                                setBusinessLicensePreview,
                                                                                setBusinessLicenseFileName,
                                                                            )
                                                                        }
                                                                    className="hidden"
                                                                        disabled={
                                                                            readOnly
                                                                        }
                                                                />
                                                                    <Label
                                                                        htmlFor="business_license_tab"
                                                                        className={`flex cursor-pointer flex-col items-center gap-1 ${readOnly ? 'cursor-default' : ''}`}
                                                                    >
                                                                    <Upload className="h-6 w-6 text-muted-foreground" />
                                                                    <span className="text-xs text-primary hover:underline">
                                                                            {t(
                                                                                'click_to_upload',
                                                                            )}
                                                                    </span>
                                                                    <p className="text-xs text-muted-foreground">
                                                                            PDF,
                                                                            JPG,
                                                                            PNG
                                                                            (Max
                                                                            10MB)
                                                                    </p>
                                                                </Label>
                                                            </div>
                                                                {(businessLicensePreview ||
                                                                    businessLicenseFileName) && (
                                                                <div className="flex-shrink-0">
                                                                        {businessLicensePreview &&
                                                                        businessLicensePreview !==
                                                                            'pdf' &&
                                                                        businessLicensePreview !==
                                                                            'large-image' ? (
                                                                        <div className="relative">
                                                                                <img
                                                                                    src={
                                                                                        businessLicensePreview
                                                                                    }
                                                                                    alt="Business License Preview"
                                                                                    className="h-12 w-auto rounded border"
                                                                                />
                                                                            {!readOnly && (
                                                                                <Button
                                                                                    type="button"
                                                                                    variant="destructive"
                                                                                    size="sm"
                                                                                        className="absolute -top-2 -right-2 h-5 w-5 rounded-full p-0"
                                                                                    onClick={() => {
                                                                                            setBusinessLicensePreview(
                                                                                                null,
                                                                                            );
                                                                                            setBusinessLicenseFileName(
                                                                                                null,
                                                                                            );
                                                                                            (
                                                                                                setData as any
                                                                                            )(
                                                                                                'clinic.business_license',
                                                                                                null,
                                                                                            );
                                                                                            const input =
                                                                                                document.getElementById(
                                                                                                    'business_license_tab',
                                                                                                ) as HTMLInputElement;
                                                                                            if (
                                                                                                input
                                                                                            )
                                                                                                input.value =
                                                                                                    '';
                                                                                    }}
                                                                                >
                                                                                    ×
                                                                                </Button>
                                                                            )}
                                                                        </div>
                                                                    ) : (
                                                                            <div className="flex items-center gap-2 rounded bg-green-50 px-2 py-1 text-xs text-green-600 dark:bg-green-900/20">
                                                                            <Check className="h-3 w-3" />
                                                                                <span className="max-w-[120px] truncate">
                                                                                    {businessLicenseFileName ||
                                                                                        t(
                                                                                            'file_uploaded',
                                                                                        )}
                                                                                </span>
                                                                            {!readOnly && (
                                                                                <Button
                                                                                    type="button"
                                                                                    variant="ghost"
                                                                                    size="sm"
                                                                                    className="h-5 px-1 text-xs"
                                                                                    onClick={() => {
                                                                                            setBusinessLicensePreview(
                                                                                                null,
                                                                                            );
                                                                                            setBusinessLicenseFileName(
                                                                                                null,
                                                                                            );
                                                                                            (
                                                                                                setData as any
                                                                                            )(
                                                                                                'clinic.business_license',
                                                                                                null,
                                                                                            );
                                                                                            const input =
                                                                                                document.getElementById(
                                                                                                    'business_license_tab',
                                                                                                ) as HTMLInputElement;
                                                                                            if (
                                                                                                input
                                                                                            )
                                                                                                input.value =
                                                                                                    '';
                                                                                    }}
                                                                                >
                                                                                    ×
                                                                                </Button>
                                                                            )}
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            )}
                                                        </div>
                                                            <InputError
                                                                message={
                                                                    formErrors[
                                                                        'clinic.business_license'
                                                                    ] ||
                                                                    (
                                                                        externalErrors as any
                                                                    )[
                                                                        'clinic.business_license'
                                                                    ] ||
                                                                    validationErrors[
                                                                        'clinic.business_license'
                                                                    ]
                                                                }
                                                            />
                                                    </div>

                                                    <div className="space-y-2">
                                                        <Label htmlFor="id_document_front_tab">
                                                                {t(
                                                                    'id_document_front',
                                                                )}{' '}
                                                                <span className="text-red-500">
                                                                    *
                                                                </span>
                                                        </Label>
                                                        <div className="flex items-center gap-4">
                                                                <div className="flex-1 rounded-lg border-2 border-dashed border-border p-3">
                                                                <Input
                                                                    id="id_document_front_tab"
                                                                    type="file"
                                                                    accept=".pdf,.jpg,.jpeg,.png"
                                                                        onChange={(
                                                                            e,
                                                                        ) =>
                                                                            handleFileChange(
                                                                                'id_document_front',
                                                                                e
                                                                                    .target
                                                                                    .files?.[0] ||
                                                                                    null,
                                                                                setIdDocumentFrontPreview,
                                                                                setIdDocumentFrontFileName,
                                                                            )
                                                                        }
                                                                    className="hidden"
                                                                        disabled={
                                                                            readOnly
                                                                        }
                                                                />
                                                                    <Label
                                                                        htmlFor="id_document_front_tab"
                                                                        className={`flex cursor-pointer flex-col items-center gap-1 ${readOnly ? 'cursor-default' : ''}`}
                                                                    >
                                                                    <Upload className="h-6 w-6 text-muted-foreground" />
                                                                    <span className="text-xs text-primary hover:underline">
                                                                            {t(
                                                                                'click_to_upload',
                                                                            )}
                                                                    </span>
                                                                    <p className="text-xs text-muted-foreground">
                                                                            PDF,
                                                                            JPG,
                                                                            PNG
                                                                            (Max
                                                                            10MB)
                                                                    </p>
                                                                </Label>
                                                            </div>
                                                                {(idDocumentFrontPreview ||
                                                                    idDocumentFrontFileName) && (
                                                                <div className="flex-shrink-0">
                                                                        {idDocumentFrontPreview &&
                                                                        idDocumentFrontPreview !==
                                                                            'pdf' &&
                                                                        idDocumentFrontPreview !==
                                                                            'large-image' ? (
                                                                        <div className="relative">
                                                                                <img
                                                                                    src={
                                                                                        idDocumentFrontPreview
                                                                                    }
                                                                                    alt="ID Document Front Preview"
                                                                                    className="h-12 w-auto rounded border"
                                                                                />
                                                                            {!readOnly && (
                                                                                <Button
                                                                                    type="button"
                                                                                    variant="destructive"
                                                                                    size="sm"
                                                                                        className="absolute -top-2 -right-2 h-5 w-5 rounded-full p-0"
                                                                                    onClick={() => {
                                                                                            setIdDocumentFrontPreview(
                                                                                                null,
                                                                                            );
                                                                                            setIdDocumentFrontFileName(
                                                                                                null,
                                                                                            );
                                                                                            (
                                                                                                setData as any
                                                                                            )(
                                                                                                'clinic.id_document_front',
                                                                                                null,
                                                                                            );
                                                                                            const input =
                                                                                                document.getElementById(
                                                                                                    'id_document_front_tab',
                                                                                                ) as HTMLInputElement;
                                                                                            if (
                                                                                                input
                                                                                            )
                                                                                                input.value =
                                                                                                    '';
                                                                                    }}
                                                                                >
                                                                                    ×
                                                                                </Button>
                                                                            )}
                                                                        </div>
                                                                    ) : (
                                                                            <div className="flex items-center gap-2 rounded bg-green-50 px-2 py-1 text-xs text-green-600 dark:bg-green-900/20">
                                                                            <Check className="h-3 w-3" />
                                                                                <span className="max-w-[120px] truncate">
                                                                                    {idDocumentFrontFileName ||
                                                                                        t(
                                                                                            'file_uploaded',
                                                                                        )}
                                                                                </span>
                                                                            {!readOnly && (
                                                                                <Button
                                                                                    type="button"
                                                                                    variant="ghost"
                                                                                    size="sm"
                                                                                    className="h-5 px-1 text-xs"
                                                                                    onClick={() => {
                                                                                            setIdDocumentFrontPreview(
                                                                                                null,
                                                                                            );
                                                                                            setIdDocumentFrontFileName(
                                                                                                null,
                                                                                            );
                                                                                            (
                                                                                                setData as any
                                                                                            )(
                                                                                                'clinic.id_document_front',
                                                                                                null,
                                                                                            );
                                                                                            const input =
                                                                                                document.getElementById(
                                                                                                    'id_document_front_tab',
                                                                                                ) as HTMLInputElement;
                                                                                            if (
                                                                                                input
                                                                                            )
                                                                                                input.value =
                                                                                                    '';
                                                                                    }}
                                                                                >
                                                                                    ×
                                                                                </Button>
                                                                            )}
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            )}
                                                        </div>
                                                            <InputError
                                                                message={
                                                                    formErrors[
                                                                        'clinic.id_document_front'
                                                                    ] ||
                                                                    (
                                                                        externalErrors as any
                                                                    )[
                                                                        'clinic.id_document_front'
                                                                    ] ||
                                                                    validationErrors[
                                                                        'clinic.id_document_front'
                                                                    ]
                                                                }
                                                            />
                                                    </div>

                                                    <div className="space-y-2">
                                                        <Label htmlFor="id_document_back_tab">
                                                                {t(
                                                                    'id_document_back',
                                                                )}{' '}
                                                                ({t('optional')}
                                                                )
                                                        </Label>
                                                        <div className="flex items-center gap-4">
                                                                <div className="flex-1 rounded-lg border-2 border-dashed border-border p-3">
                                                                <Input
                                                                    id="id_document_back_tab"
                                                                    type="file"
                                                                    accept=".pdf,.jpg,.jpeg,.png"
                                                                        onChange={(
                                                                            e,
                                                                        ) =>
                                                                            handleFileChange(
                                                                                'id_document_back',
                                                                                e
                                                                                    .target
                                                                                    .files?.[0] ||
                                                                                    null,
                                                                                setIdDocumentBackPreview,
                                                                                setIdDocumentBackFileName,
                                                                            )
                                                                        }
                                                                    className="hidden"
                                                                        disabled={
                                                                            readOnly
                                                                        }
                                                                />
                                                                    <Label
                                                                        htmlFor="id_document_back_tab"
                                                                        className={`flex cursor-pointer flex-col items-center gap-1 ${readOnly ? 'cursor-default' : ''}`}
                                                                    >
                                                                    <Upload className="h-6 w-6 text-muted-foreground" />
                                                                    <span className="text-xs text-primary hover:underline">
                                                                            {t(
                                                                                'click_to_upload',
                                                                            )}
                                                                    </span>
                                                                    <p className="text-xs text-muted-foreground">
                                                                            PDF,
                                                                            JPG,
                                                                            PNG
                                                                            (Max
                                                                            10MB)
                                                                    </p>
                                                                </Label>
                                                            </div>
                                                                {(idDocumentBackPreview ||
                                                                    idDocumentBackFileName) && (
                                                                <div className="flex-shrink-0">
                                                                        {idDocumentBackPreview &&
                                                                        idDocumentBackPreview !==
                                                                            'pdf' &&
                                                                        idDocumentBackPreview !==
                                                                            'large-image' ? (
                                                                        <div className="relative">
                                                                                <img
                                                                                    src={
                                                                                        idDocumentBackPreview
                                                                                    }
                                                                                    alt="ID Document Back Preview"
                                                                                    className="h-12 w-auto rounded border"
                                                                                />
                                                                            {!readOnly && (
                                                                                <Button
                                                                                    type="button"
                                                                                    variant="destructive"
                                                                                    size="sm"
                                                                                        className="absolute -top-2 -right-2 h-5 w-5 rounded-full p-0"
                                                                                    onClick={() => {
                                                                                            setIdDocumentBackPreview(
                                                                                                null,
                                                                                            );
                                                                                            setIdDocumentBackFileName(
                                                                                                null,
                                                                                            );
                                                                                            (
                                                                                                setData as any
                                                                                            )(
                                                                                                'clinic.id_document_back',
                                                                                                null,
                                                                                            );
                                                                                            const input =
                                                                                                document.getElementById(
                                                                                                    'id_document_back_tab',
                                                                                                ) as HTMLInputElement;
                                                                                            if (
                                                                                                input
                                                                                            )
                                                                                                input.value =
                                                                                                    '';
                                                                                    }}
                                                                                >
                                                                                    ×
                                                                                </Button>
                                                                            )}
                                                                        </div>
                                                                    ) : (
                                                                            <div className="flex items-center gap-2 rounded bg-green-50 px-2 py-1 text-xs text-green-600 dark:bg-green-900/20">
                                                                            <Check className="h-3 w-3" />
                                                                                <span className="max-w-[120px] truncate">
                                                                                    {idDocumentBackFileName ||
                                                                                        t(
                                                                                            'file_uploaded',
                                                                                        )}
                                                                                </span>
                                                                            {!readOnly && (
                                                                                <Button
                                                                                    type="button"
                                                                                    variant="ghost"
                                                                                    size="sm"
                                                                                    className="h-5 px-1 text-xs"
                                                                                    onClick={() => {
                                                                                            setIdDocumentBackPreview(
                                                                                                null,
                                                                                            );
                                                                                            setIdDocumentBackFileName(
                                                                                                null,
                                                                                            );
                                                                                            (
                                                                                                setData as any
                                                                                            )(
                                                                                                'clinic.id_document_back',
                                                                                                null,
                                                                                            );
                                                                                            const input =
                                                                                                document.getElementById(
                                                                                                    'id_document_back_tab',
                                                                                                ) as HTMLInputElement;
                                                                                            if (
                                                                                                input
                                                                                            )
                                                                                                input.value =
                                                                                                    '';
                                                                                    }}
                                                                                >
                                                                                    ×
                                                                                </Button>
                                                                            )}
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    }
                                    
                                    // Step 7: Subscription - COMMENTED OUT
                                    if (false && renderStep === 7) {
                                        return (
                                            <div className="space-y-6">
                                                    <div className="mb-6 flex items-center gap-3">
                                                    <CreditCard className="h-6 w-6 text-primary" />
                                                    <h2 className="text-2xl font-semibold text-foreground">
                                                        {t('subscription')}
                                                    </h2>
                                                </div>

                                                    <div className="mb-6 rounded-lg border border-blue-200 bg-blue-50 p-4 dark:border-blue-800 dark:bg-blue-900/20">
                                                    <p className="text-sm text-blue-800 dark:text-blue-200">
                                                            {t(
                                                                'subscription_selection_info',
                                                            ) ||
                                                                'Select a subscription package for your clinic. You can change this later.'}
                                                    </p>
                                                </div>

                                                    {subscriptionPackages &&
                                                    subscriptionPackages.length >
                                                        0 ? (
                                                        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
                                        <div
                                            onClick={() => {
                                                                    if (
                                                                        !readOnly
                                                                    ) {
                                                                        (
                                                                            setData as any
                                                                        )(
                                                                            'clinic.subscription_package_id',
                                                                            '',
                                                                        );
                                                                        if (
                                                                            validationErrors[
                                                                                'clinic.subscription_package_id'
                                                                            ]
                                                                        ) {
                                                                            setValidationErrors(
                                                                                (
                                                                                    prev,
                                                                                ) => {
                                                                                    const newErrors =
                                                                                        {
                                                                                            ...prev,
                                                                                        };
                                                                                    delete newErrors[
                                                                                        'clinic.subscription_package_id'
                                                                                    ];
                                                                            return newErrors;
                                                                                },
                                                                            );
                                                                    }
                                                }
                                            }}
                                                                className={`relative cursor-pointer rounded-lg border-2 p-6 transition-all ${
                                                                    !data.clinic
                                                                        .subscription_package_id
                                                    ? 'border-primary bg-primary/5'
                                                    : 'border-border hover:border-primary/50'
                                                                } ${readOnly ? 'cursor-default' : ''} `}
                                        >
                                                                <div className="mb-4 flex items-center justify-between">
                                                                <h3 className="text-lg font-semibold">
                                                                        {t(
                                                                            'no_subscription',
                                                                        ) ||
                                                                            'No Subscription'}
                                                                </h3>
                                                                    {!data
                                                                        .clinic
                                                                        .subscription_package_id && (
                                                                        <div className="flex h-5 w-5 items-center justify-center rounded-full bg-primary">
                                                                        <Check className="h-3 w-3 text-white" />
                                        </div>
                                                                )}
                                                            </div>
                                                                <p className="mb-4 text-sm text-muted-foreground">
                                                                    {t(
                                                                        'no_subscription_description',
                                                                    ) ||
                                                                        'Continue without a subscription package. You can subscribe later.'}
                                                            </p>
                                                            <div className="text-2xl font-bold">
                                                                    {t(
                                                                        'free',
                                                                    ) || 'Free'}
                                                            </div>
                                                        </div>

                                                            {subscriptionPackages.map(
                                                                (pkg) => {
                                                                    const isSelected =
                                                                        data
                                                                            .clinic
                                                                            .subscription_package_id ===
                                                                        pkg.id.toString();
                                                                    const packageName =
                                                                        locale ===
                                                                        'ar'
                                                                            ? pkg.name_ar
                                                                            : pkg.name_en;
                                                                    const packageDescription =
                                                                        locale ===
                                                                        'ar'
                                                                            ? pkg.description_ar ||
                                                                              pkg.description_en
                                                                            : pkg.description_en ||
                                                                              pkg.description_ar;
                                                            
                                            return (
                                                <div
                                                                            key={
                                                                                pkg.id
                                                                            }
                                                    onClick={() => {
                                                                                if (
                                                                                    !readOnly
                                                                                ) {
                                                                                    (
                                                                                        setData as any
                                                                                    )(
                                                                                        'clinic.subscription_package_id',
                                                                                        pkg.id.toString(),
                                                                                    );
                                                                                    if (
                                                                                        validationErrors[
                                                                                            'clinic.subscription_package_id'
                                                                                        ]
                                                                                    ) {
                                                                                        setValidationErrors(
                                                                                            (
                                                                                                prev,
                                                                                            ) => {
                                                                                                const newErrors =
                                                                                                    {
                                                                                                        ...prev,
                                                                                                    };
                                                                                                delete newErrors[
                                                                                                    'clinic.subscription_package_id'
                                                                                                ];
                                                                                    return newErrors;
                                                                                            },
                                                                                        );
                                                                            }
                                                        }
                                                    }}
                                                                            className={`relative cursor-pointer rounded-lg border-2 p-6 transition-all ${
                                                                                isSelected
                                                            ? 'border-primary bg-primary/5'
                                                            : 'border-border hover:border-primary/50'
                                                                            } ${readOnly ? 'cursor-default' : ''} `}
                                                >
                                                                    {isSelected && (
                                                                                <div className="absolute top-4 right-4 flex h-5 w-5 items-center justify-center rounded-full bg-primary">
                                                                            <Check className="h-3 w-3 text-white" />
                                                                        </div>
                                                                    )}
                                                                    <div className="mb-4">
                                                                                <h3 className="mb-2 text-lg font-semibold">
                                                                                    {
                                                                                        packageName
                                                                                    }
                                                                        </h3>
                                                                        {packageDescription && (
                                                                                    <p className="line-clamp-2 text-sm text-muted-foreground">
                                                                                        {
                                                                                            packageDescription
                                                                                        }
                                                                            </p>
                                                                        )}
                                                                    </div>
                                                                            <div className="mb-4 flex items-baseline gap-2">
                                                                        <span className="text-2xl font-bold">
                                                                                    {pkg.price ||
                                                                                        '0'}{' '}
                                                                                    {pkg.currency ||
                                                                                        'KWD'}
                                                                        </span>
                                                                        <span className="text-sm text-muted-foreground">
                                                                                    /{' '}
                                                                                    {pkg.billing_cycle ===
                                                                                    'monthly'
                                                                                        ? t(
                                                                                              'month',
                                                                                          )
                                                                                        : t(
                                                                                              'year',
                                                                                          )}
                                                                        </span>
                                                                    </div>
                                                                            {pkg.features &&
                                                                                Array.isArray(
                                                                                    pkg.features,
                                                                                ) &&
                                                                                pkg
                                                                                    .features
                                                                                    .length >
                                                                                    0 && (
                                                                        <ul className="space-y-2 text-sm text-muted-foreground">
                                                                                        {pkg.features
                                                                                            .slice(
                                                                                                0,
                                                                                                3,
                                                                                            )
                                                                                            .map(
                                                                                                (
                                                                                                    feature,
                                                                                                    idx,
                                                                                                ) => (
                                                                                                    <li
                                                                                                        key={
                                                                                                            idx
                                                                                                        }
                                                                                                        className="flex items-start gap-2"
                                                                                                    >
                                                                                                        <Check className="mt-0.5 h-4 w-4 flex-shrink-0 text-primary" />
                                                                                                        <span>
                                                                                                            {
                                                                                                                feature
                                                                                                            }
                                                                                                        </span>
                                                                                </li>
                                                                                                ),
                                                                                            )}
                                                                                        {pkg
                                                                                            .features
                                                                                            .length >
                                                                                            3 && (
                                                                                <li className="text-xs text-muted-foreground">
                                                                                                +
                                                                                                {pkg
                                                                                                    .features
                                                                                                    .length -
                                                                                                    3}{' '}
                                                                                                {t(
                                                                                                    'more_features',
                                                                                                ) ||
                                                                                                    'more features'}
                                                                                </li>
                                                                            )}
                                                                        </ul>
                                                                    )}
                                                </div>
                                            );
                                                                },
                                                            )}
                                </div>
                            ) : (
                                                        <div className="py-12 text-center">
                                <p className="text-muted-foreground">
                                                                {t(
                                                                    'no_subscription_packages_available',
                                                                ) ||
                                                                    'No subscription packages available at the moment.'}
                                </p>
                                                    </div>
                            )}
                                                    <InputError
                                                        message={
                                                            formErrors[
                                                                'clinic.subscription_package_id'
                                                            ] ||
                                                            (
                                                                externalErrors as any
                                                            )[
                                                                'clinic.subscription_package_id'
                                                            ] ||
                                                            validationErrors[
                                                                'clinic.subscription_package_id'
                                                            ]
                                                        }
                                                    />
                        </div>
                                        );
                                    }
                                    
                                    // Fallback for any other step
                                    return null;
                                })()}
                        </div>
                    </TabsContent>
                        );
                    })}
            </Tabs>
            
            {/* Save Button for Tab Mode */}
            {!readOnly && (
                    <div
                        className={`mt-8 flex items-center justify-end border-t pt-6 ${isRTL ? 'flex-row-reverse' : ''}`}
                    >
                    <Button
                        type="submit"
                        disabled={processing || isSubmitting}
                        className="min-w-[150px]"
                    >
                        {processing || isSubmitting ? (
                            <>
                                    <LoaderCircle
                                        className={`h-4 w-4 ${isRTL ? 'ml-2' : 'mr-2'} animate-spin`}
                                    />
                                {t('saving') || t('loading') || 'Saving...'}
                            </>
                        ) : (
                            <>
                                    {mode === 'edit'
                                        ? t('save_changes') || 'Save Changes'
                                        : t('save') || 'Save'}
                            </>
                        )}
                    </Button>
                        </div>
            )}
            </form>
        );
    }

    // Helper to render step content - used in both wizard and tab modes
    const renderStepContentByEffectiveStep = (stepToRender: number) => {
        // Step 1: User Account Information (only if showUserFields)
        if (showUserFields && stepToRender === 1) {
            return renderAccountInfoStep();
        }
        // Step 2: Clinic Basic Information
        if (stepToRender === 2) {
            return renderClinicBasicInfoStep();
        }
        // Step 3: Address & Location
        if (stepToRender === 3) {
            return renderAddressLocationStep();
        }
        // Step 4: Settings & Policies
        if (stepToRender === 4) {
            return renderSettingsPoliciesStep();
        }
        // Step 5: Operating Hours
        if (stepToRender === 5) {
            return renderOperatingHoursStep();
        }
        // Step 6: Documents
        if (stepToRender === 6) {
            return renderDocumentsStep();
        }
        // Step 7: Subscription - COMMENTED OUT
        // if (stepToRender === 7) {
        //     return renderSubscriptionStep();
        // }
        return null;
    };
    
    // Always render wizard layout for create mode (not tabs)
    // For create/edit mode, always show as wizard
    const shouldShowAsWizard =
        mode === 'create' || mode === 'register' || !showAsTabs;
    
    // Wizard layout
    return (
        <div className="space-y-6">
            {/* Form Content - No form wrapper for create mode (parent handles it) */}
            <div
                className={
                    hideNavigation ? '' : 'overflow-hidden rounded-3xl border'
                }
            >
                <div className={hideNavigation ? '' : 'p-8'}>
                    {/* Step 1: User Account Information (only if showUserFields) */}
                    {showUserFields &&
                        (showAsTabs
                            ? showUserFields
                                ? currentStep === 1
                                : false
                            : effectiveStep === 1) && (
                        <div className="space-y-6">
                            {!hideNavigation && (
                                    <div className="mb-6 flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <Building2 className="h-6 w-6 text-primary" />
                                        <h2 className="text-2xl font-semibold text-foreground">
                                            {t('account_information')}
                                        </h2>
                                    </div>
                                        <span className="rounded-full bg-muted px-3 py-1 text-sm text-muted-foreground">
                                            {t('step')} {currentStep} {t('of')}{' '}
                                            {totalSteps}
                                    </span>
                                </div>
                            )}
                            
                            {/* Owner Selection (only in create mode, not in edit mode) */}
                                 {mode === 'create' &&
                                     ownerMode !== undefined &&
                                     onOwnerModeChange && (
                                         <div className="mb-6 space-y-4 rounded-lg border bg-muted/50 p-4">
                                             <Label className="text-base font-semibold">
                                                 {t('clinic_owner')}
                                             </Label>
                                     {canChangeOwner ? (
                                    <div className="flex gap-4">
                                        <Button
                                            type="button"
                                                         variant={
                                                             ownerMode === 'create'
                                                                 ? 'default'
                                                                 : 'outline'
                                                         }
                                            size="sm"
                                                         onClick={() =>
                                                             onOwnerModeChange(
                                                                 'create',
                                                             )
                                                         }
                                        >
                                                         {t(
                                                             'add_personal_information',
                                                         ) ||
                                                             'Add Personal Information'}
                                        </Button>
                                        <Button
                                            type="button"
                                                         variant={
                                                             ownerMode === 'select'
                                                                 ? 'default'
                                                                 : 'outline'
                                                         }
                                            size="sm"
                                                         onClick={() =>
                                                             onOwnerModeChange(
                                                                 'select',
                                                             )
                                                         }
                                        >
                                                         {t(
                                                             'select_existing_owner',
                                                         ) ||
                                                             'Select Existing Owner'}
                                        </Button>
                                    </div>
                                     ) : (
                                         <p className="text-sm text-muted-foreground">
                                             {t('owner_selection_locked') || 'Owner selection is locked based on your role.'}
                                         </p>
                                     )}

                                            {(ownerMode === 'select' ||
                                                (mode === 'edit' &&
                                                    ownerMode ===
                                                        'select')) && (
                                                <div className="mt-4 space-y-2">
                                            <Label htmlFor="user_id">
                                                        {t('select_user')}{' '}
                                                        <span className="text-red-500">
                                                            *
                                                        </span>
                                            </Label>
                                            <Select 
                                                value={user_id || ''} 
                                                        onValueChange={(
                                                            value,
                                                        ) => {
                                                            // Prevent changing owner if not allowed
                                                            if (!canChangeOwner) {
                                                                return;
                                                            }
                                                            onUserIdChange?.(
                                                                value,
                                                            );
                                                        }}
                                                        disabled={!canChangeOwner}
                                            >
                                                        <SelectTrigger
                                                            className={
                                                                (
                                                                    externalErrors as any
                                                                ).user_id
                                                                    ? 'border-red-500'
                                                                    : ''
                                                            }
                                                            disabled={!canChangeOwner}
                                                        >
                                                            <SelectValue
                                                                placeholder={t(
                                                                    'select_user',
                                                                )}
                                                            />
                                                </SelectTrigger>
                                                <SelectContent>
                                                            {users.map(
                                                                (user) => (
                                                                    <SelectItem
                                                                        key={
                                                                            user.id
                                                                        }
                                                                        value={user.id.toString()}
                                                                    >
                                                                        {
                                                                            user.name
                                                                        }{' '}
                                                                        (
                                                                        {
                                                                            user.email
                                                                        }
                                                                        )
                                                        </SelectItem>
                                                                ),
                                                            )}
                                                </SelectContent>
                                            </Select>
                                                    <InputError
                                                        message={
                                                            (
                                                                externalErrors as any
                                                            ).user_id
                                                        }
                                                    />
                                        </div>
                                    )}
                                </div>
                            )}
                            
                            {/* User Selection for Edit Mode (when ownerMode is select) */}
                            {mode === 'edit' && ownerMode === 'select' && (
                                <div className="space-y-2">
                                    <Label htmlFor="user_id">
                                            {t('clinic_owner')}{' '}
                                            <span className="text-red-500">
                                                *
                                            </span>
                                    </Label>
                                    <Select 
                                        value={user_id || ''} 
                                            onValueChange={(value) => {
                                                // Prevent changing owner if not allowed
                                                if (!canChangeOwner) {
                                                    return;
                                                }
                                                onUserIdChange?.(value);
                                            }}
                                            disabled={!canChangeOwner}
                                    >
                                            <SelectTrigger
                                                className={
                                                    (externalErrors as any)
                                                        .user_id
                                                        ? 'border-red-500'
                                                        : ''
                                                }
                                                disabled={!canChangeOwner}
                                            >
                                                <SelectValue
                                                    placeholder={t(
                                                        'select_user',
                                                    )}
                                                />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {users.map((user) => (
                                                    <SelectItem
                                                        key={user.id}
                                                        value={user.id.toString()}
                                                    >
                                                        {user.name} (
                                                        {user.email})
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    {!canChangeOwner && (
                                        <p className="text-xs text-muted-foreground">
                                            {t('owner_selection_locked') || 'Owner selection is locked based on your role.'}
                                        </p>
                                    )}
                                        <InputError
                                            message={
                                                (externalErrors as any).user_id
                                            }
                                        />
                                    <p className="text-sm text-muted-foreground">
                                            {t(
                                                'select_clinic_owner_description',
                                            ) ||
                                                'Select the user who owns this clinic.'}
                                    </p>
                                </div>
                            )}
                            
                            {/* User Account Fields (show for register mode, or when creating new user in create mode, or in edit mode when creating new user) */}
                                {(mode === 'register' ||
                                    (mode === 'create' &&
                                        ownerMode === 'create') ||
                                    (mode === 'edit' &&
                                        ownerMode === 'create')) && (
                                    <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                                <div className="space-y-2">
                                    <Label htmlFor="name">
                                                {t('full_name')}{' '}
                                                <span className="text-red-500">
                                                    *
                                                </span>
                                    </Label>
                                    <Input
                                        id="name"
                                        type="text"
                                        required
                                        value={data.name || ''}
                                        maxLength={30}
                                        onChange={(e) => {
                                                    const value =
                                                        e.target.value.trimStart();
                                                    const limitedValue =
                                                        value.slice(0, 30);
                                                    setData(
                                                        'name' as any,
                                                        limitedValue,
                                                    );
                                            if (validationErrors.name) {
                                                        setValidationErrors(
                                                            (prev) => {
                                                                const newErrors =
                                                                    { ...prev };
                                                    delete newErrors.name;
                                                    return newErrors;
                                                            },
                                                        );
                                            }
                                        }}
                                        onBlur={(e) => {
                                                    const trimmed =
                                                        e.target.value.trim();
                                                    setData(
                                                        'name' as any,
                                                        trimmed,
                                                    );
                                            handleFieldBlur('name');
                                        }}
                                                placeholder={t(
                                                    'enter_full_name',
                                                )}
                                                className={`${formErrors.name || (externalErrors as any).name || validationErrors.name ? 'border-red-500' : ''}`}
                                                disabled={!canChangeOwner || readOnly}
                                                readOnly={!canChangeOwner || readOnly}
                                    />
                                            <InputError
                                                message={
                                                    formErrors.name ||
                                                    (externalErrors as any)
                                                        .name ||
                                                    validationErrors.name
                                                }
                                            />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="phone">
                                                {t('phone_number')}{' '}
                                                <span className="text-red-500">
                                                    *
                                                </span>
                                    </Label>
                                    <PhoneInput
                                        id="phone"
                                        required
                                        value={data.phone || ''}
                                        onChange={(value) => {
                                                    setData(
                                                        'phone' as any,
                                                        value,
                                                    );
                                                    if (
                                                        validationErrors.phone
                                                    ) {
                                                        setValidationErrors(
                                                            (prev) => {
                                                                const newErrors =
                                                                    { ...prev };
                                                    delete newErrors.phone;
                                                    return newErrors;
                                                            },
                                                        );
                                            }
                                        }}
                                                onBlur={() =>
                                                    handleFieldBlur('phone')
                                                }
                                                className={
                                                    formErrors.phone ||
                                                    (externalErrors as any)
                                                        .phone ||
                                                    validationErrors.phone
                                                        ? 'border-red-500'
                                                        : ''
                                                }
                                                disabled={!canChangeOwner || readOnly}
                                                readOnly={!canChangeOwner || readOnly}
                                    />
                                            <InputError
                                                message={
                                                    formErrors.phone ||
                                                    (externalErrors as any)
                                                        .phone ||
                                                    validationErrors.phone
                                                }
                                            />
                                            <p className="text-xs text-muted-foreground">
                                                {t('phone_format_hint')}
                                            </p>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="email">
                                                {t('email_address')}{' '}
                                                <span className="text-red-500">
                                                    *
                                                </span>
                                    </Label>
                                    <div className="relative">
                                        <Input
                                            id="email"
                                            type="email"
                                            required
                                            value={data.email || ''}
                                            onChange={(e) => {
                                                        const value =
                                                            e.target.value.trimStart();
                                                        setData(
                                                            'email' as any,
                                                            value,
                                                        );
                                                        if (
                                                            validationErrors.email
                                                        ) {
                                                            setValidationErrors(
                                                                (prev) => {
                                                                    const newErrors =
                                                                        {
                                                                            ...prev,
                                                                        };
                                                        delete newErrors.email;
                                                        return newErrors;
                                                                },
                                                            );
                                                }
                                            }}
                                            onBlur={(e) => {
                                                        const trimmed =
                                                            e.target.value
                                                                .trim()
                                                                .toLowerCase();
                                                        setData(
                                                            'email' as any,
                                                            trimmed,
                                                        );
                                                        handleFieldBlur(
                                                            'email',
                                                        );
                                            }}
                                                    placeholder={t(
                                                        'email_example',
                                                    )}
                                                    className={`${formErrors.email || (externalErrors as any).email || validationErrors.email ? 'border-red-500' : ''}`}
                                                    disabled={!canChangeOwner || readOnly}
                                                    readOnly={!canChangeOwner || readOnly}
                                        />
                                    </div>
                                            <InputError
                                                message={
                                                    formErrors.email ||
                                                    (externalErrors as any)
                                                        .email ||
                                                    validationErrors.email
                                                }
                                            />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="password">
                                                {t('password')}{' '}
                                                <span className="text-red-500">
                                                    *
                                                </span>
                                    </Label>
                                    <PasswordInput
                                        id="password"
                                        required
                                        value={data.password || ''}
                                        showValidation={true}
                                        onChange={(e) => {
                                                    setData(
                                                        'password' as any,
                                                        e.target.value,
                                                    );
                                                    if (
                                                        validationErrors.password
                                                    ) {
                                                        setValidationErrors(
                                                            (prev) => {
                                                                const newErrors =
                                                                    { ...prev };
                                                    delete newErrors.password;
                                                    return newErrors;
                                                            },
                                                        );
                                            }
                                        }}
                                                onBlur={() =>
                                                    handleFieldBlur('password')
                                                }
                                        placeholder={t('password')}
                                                error={
                                                    formErrors.password ||
                                                    (externalErrors as any)
                                                        .password ||
                                                    validationErrors.password
                                                }
                                    />
                                            <InputError
                                                message={
                                                    formErrors.password ||
                                                    (externalErrors as any)
                                                        .password ||
                                                    validationErrors.password
                                                }
                                            />
                                </div>

                                <div className="space-y-2 md:col-span-2">
                                    <Label htmlFor="password_confirmation">
                                                {t('confirm_password')}{' '}
                                                <span className="text-red-500">
                                                    *
                                                </span>
                                    </Label>
                                    <PasswordInput
                                        id="password_confirmation"
                                        required
                                                value={
                                                    data.password_confirmation ||
                                                    ''
                                                }
                                        onChange={(e) => {
                                                    setData(
                                                        'password_confirmation' as any,
                                                        e.target.value,
                                                    );
                                                    if (
                                                        validationErrors.password_confirmation
                                                    ) {
                                                        setValidationErrors(
                                                            (prev) => {
                                                                const newErrors =
                                                                    { ...prev };
                                                    delete newErrors.password_confirmation;
                                                    return newErrors;
                                                            },
                                                        );
                                            }
                                        }}
                                                onBlur={() =>
                                                    handleFieldBlur(
                                                        'password_confirmation',
                                                    )
                                                }
                                                placeholder={t(
                                                    'confirm_password',
                                                )}
                                                error={
                                                    formErrors.password_confirmation ||
                                                    (externalErrors as any)
                                                        .password_confirmation ||
                                                    validationErrors.password_confirmation
                                                }
                                    />
                                            <InputError
                                                message={
                                                    formErrors.password_confirmation ||
                                                    (externalErrors as any)
                                                        .password_confirmation ||
                                                    validationErrors.password_confirmation
                                                }
                                            />
                                </div>
                            </div>
                            )}
                            
                            {/* Show message when selecting existing owner */}
                                {mode === 'create' &&
                                    ownerMode === 'select' &&
                                    user_id && (
                                        <div className="rounded-lg border border-green-200 bg-green-50 p-4 dark:border-green-800 dark:bg-green-900/20">
                                    <p className="text-sm text-green-800 dark:text-green-200">
                                                {t('owner_selected') ||
                                                    'Owner selected. Proceed to clinic information.'}
                                    </p>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Step 2: Clinic Basic Information */}
                    {(showAsTabs
                        ? showUserFields
                            ? currentStep === 2
                            : currentStep === 1
                        : effectiveStep === 2) && (
                        <div className="space-y-6">
                            <div className="mb-6 flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <FileText className="h-6 w-6 text-primary" />
                                    <h2 className="text-2xl font-semibold text-foreground">
                                        {t('clinic_basic_info')}
                                    </h2>
                                </div>
                                <span className="rounded-full bg-muted px-3 py-1 text-sm text-muted-foreground">
                                    {t('step')} {currentStep} {t('of')}{' '}
                                    {totalSteps}
                                </span>
                            </div>
                            
                            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                                <div className="space-y-2">
                                    <Label htmlFor="clinic.name_en">
                                        {t('clinic_name_en')}{' '}
                                        <span className="text-red-500">*</span>
                                    </Label>
                                    <Input
                                        id="clinic.name_en"
                                        type="text"
                                        required
                                        value={data.clinic.name_en}
                                        maxLength={30}
                                        onChange={(e) => {
                                            const value =
                                                e.target.value.trimStart();
                                            const limitedValue = value.slice(
                                                0,
                                                30,
                                            );
                                            (setData as any)(
                                                'clinic.name_en',
                                                limitedValue,
                                            );
                                            
                                            // Real-time validation for English only
                                            if (value && value.trim()) {
                                                const englishPattern =
                                                    /^[a-zA-Z0-9\s\-_.,;:!?@#$%^&*()[\]{}""''/]+$/;
                                                if (
                                                    !englishPattern.test(value)
                                                ) {
                                                    setValidationErrors(
                                                        (prev) => ({
                                                        ...prev,
                                                            'clinic.name_en': t(
                                                                'clinic_name_en_must_be_english',
                                                            ),
                                                        }),
                                                    );
                                                } else {
                                                    setValidationErrors(
                                                        (prev) => {
                                                            const newErrors = {
                                                                ...prev,
                                                            };
                                                            delete newErrors[
                                                                'clinic.name_en'
                                                            ];
                                                        return newErrors;
                                                        },
                                                    );
                                                }
                                            } else {
                                                setValidationErrors((prev) => {
                                                    const newErrors = {
                                                        ...prev,
                                                    };
                                                    delete newErrors[
                                                        'clinic.name_en'
                                                    ];
                                                    return newErrors;
                                                });
                                            }
                                        }}
                                        onBlur={(e) => {
                                            const trimmed =
                                                e.target.value.trim();
                                            (setData as any)(
                                                'clinic.name_en',
                                                trimmed,
                                            );
                                            handleFieldBlur('clinic.name_en');
                                        }}
                                        placeholder={t('enter_clinic_name_en')}
                                        className={`${getFieldError('clinic.name_en') ? 'border-red-500' : ''}`}
                                    />
                                    <InputError
                                        message={getFieldError(
                                            'clinic.name_en',
                                        )}
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="clinic.name_ar">
                                        {t('clinic_name_ar')}{' '}
                                        <span className="text-red-500">*</span>
                                    </Label>
                                    <Input
                                        id="clinic.name_ar"
                                        type="text"
                                        required
                                        value={data.clinic.name_ar}
                                        maxLength={30}
                                        onChange={(e) => {
                                            const value =
                                                e.target.value.trimStart();
                                            const limitedValue = value.slice(
                                                0,
                                                30,
                                            );
                                            (setData as any)(
                                                'clinic.name_ar',
                                                limitedValue,
                                            );
                                            
                                            // Real-time validation for Arabic only
                                            if (value && value.trim()) {
                                                const arabicPattern =
                                                    /^[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF\s\u0660-\u0669\u06F0-\u06F9.,;:!?\-_()[\]{}""''«»/]+$/u;
                                                if (
                                                    !arabicPattern.test(value)
                                                ) {
                                                    setValidationErrors(
                                                        (prev) => ({
                                                        ...prev,
                                                            'clinic.name_ar': t(
                                                                'clinic_name_ar_must_be_arabic',
                                                            ),
                                                        }),
                                                    );
                                                } else {
                                                    setValidationErrors(
                                                        (prev) => {
                                                            const newErrors = {
                                                                ...prev,
                                                            };
                                                            delete newErrors[
                                                                'clinic.name_ar'
                                                            ];
                                                        return newErrors;
                                                        },
                                                    );
                                                }
                                            } else {
                                                setValidationErrors((prev) => {
                                                    const newErrors = {
                                                        ...prev,
                                                    };
                                                    delete newErrors[
                                                        'clinic.name_ar'
                                                    ];
                                                    return newErrors;
                                                });
                                            }
                                        }}
                                        onBlur={(e) => {
                                            const trimmed =
                                                e.target.value.trim();
                                            (setData as any)(
                                                'clinic.name_ar',
                                                trimmed,
                                            );
                                            handleFieldBlur('clinic.name_ar');
                                        }}
                                        placeholder={t('enter_clinic_name_ar')}
                                        className={`${getFieldError('clinic.name_ar') ? 'border-red-500' : ''}`}
                                    />
                                    <InputError
                                        message={getFieldError(
                                            'clinic.name_ar',
                                        )}
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="clinic.phone">
                                        {t('clinic_phone')}{' '}
                                        <span className="text-red-500">*</span>
                                    </Label>
                                    <PhoneInput
                                        id="clinic.phone"
                                        required
                                        value={data.clinic.phone}
                                        onChange={(value) =>
                                            (setData as any)(
                                                'clinic.phone',
                                                value,
                                            )
                                        }
                                        className={
                                            formErrors['clinic.phone'] ||
                                            (externalErrors as any)[
                                                'clinic.phone'
                                            ]
                                                ? 'border-red-500'
                                                : ''
                                        }
                                    />
                                    <InputError
                                        message={
                                            formErrors['clinic.phone'] ||
                                            (externalErrors as any)[
                                                'clinic.phone'
                                            ]
                                        }
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="clinic.email">
                                        {t('clinic_email')}{' '}
                                        <span className="text-sm text-muted-foreground">
                                            ({t('optional')})
                                        </span>
                                    </Label>
                                    <div className="relative">
                                        <Input
                                            id="clinic.email"
                                            type="email"
                                            value={data.clinic.email}
                                            onChange={(e) => {
                                                (setData as any)(
                                                    'clinic.email',
                                                    e.target.value,
                                                );
                                                if (
                                                    validationErrors[
                                                        'clinic.email'
                                                    ]
                                                ) {
                                                    setValidationErrors(
                                                        (prev) => {
                                                            const newErrors = {
                                                                ...prev,
                                                            };
                                                            delete newErrors[
                                                                'clinic.email'
                                                            ];
                                                        return newErrors;
                                                        },
                                                    );
                                                }
                                            }}
                                            onBlur={() =>
                                                handleFieldBlur('clinic.email')
                                            }
                                            placeholder={t(
                                                'clinic_email_placeholder',
                                            )}
                                            className={`${formErrors['clinic.email'] || (externalErrors as any)['clinic.email'] || validationErrors['clinic.email'] ? 'border-red-500' : ''}`}
                                            disabled={checkingEmail}
                                        />
                                        {checkingEmail && (
                                            <div className="absolute top-1/2 right-3 -translate-y-1/2">
                                                <LoaderCircle className="h-4 w-4 animate-spin text-muted-foreground" />
                                            </div>
                                        )}
                                    </div>
                                    <InputError
                                        message={
                                            formErrors['clinic.email'] ||
                                            (externalErrors as any)[
                                                'clinic.email'
                                            ] ||
                                            validationErrors['clinic.email']
                                        }
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="clinic.category_id">
                                        {t('category')}{' '}
                                        <span className="text-red-500">*</span>
                                    </Label>
                                    <Select
                                        value={
                                            data.clinic.category_id || undefined
                                        }
                                        onValueChange={(value) =>
                                            (setData as any)(
                                                'clinic.category_id',
                                                value,
                                            )
                                        }
                                    >
                                        <SelectTrigger>
                                            <SelectValue
                                                placeholder={t(
                                                    'select_category',
                                                )}
                                            />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {categories &&
                                            categories.length > 0 ? (
                                                categories.map((category) => (
                                                    <SelectItem
                                                        key={category.id}
                                                        value={category.id.toString()}
                                                    >
                                                        {isRTL
                                                            ? category.name_ar
                                                            : category.name_en}
                                                    </SelectItem>
                                                ))
                                            ) : (
                                                <SelectItem
                                                    value="no-categories"
                                                    disabled
                                                >
                                                    {t(
                                                        'no_categories_available',
                                                    )}
                                                </SelectItem>
                                            )}
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="clinic.logo">
                                        {t('clinic_logo')}{' '}
                                        <span className="text-sm text-muted-foreground">
                                            ({t('optional')})
                                        </span>
                                    </Label>
                                    <div className="rounded-lg border-2 border-dashed border-border p-6">
                                        <Input
                                            id="clinic.logo"
                                            type="file"
                                            accept="image/*"
                                            onChange={(e) =>
                                                handleFileChange(
                                                    'logo',
                                                    e.target.files?.[0] || null,
                                                    setLogoPreview,
                                                    setLogoFileName,
                                                )
                                            }
                                            className="hidden"
                                        />
                                        <Label
                                            htmlFor="clinic.logo"
                                            className="flex cursor-pointer flex-col items-center gap-2"
                                        >
                                            <Upload className="h-8 w-8 text-muted-foreground" />
                                            <span className="text-sm text-primary hover:underline">
                                                {t('click_to_upload')}{' '}
                                                {t('clinic_logo')}
                                            </span>
                                            <p className="text-xs text-muted-foreground">
                                                JPG, JPEG, PNG (Max 10MB)
                                            </p>
                                        </Label>
                                        {(logoPreview || logoFileName) && (
                                            <div className="mt-4 space-y-2 text-center">
                                                {logoPreview &&
                                                logoPreview !== 'pdf' &&
                                                logoPreview !==
                                                    'large-image' ? (
                                                    <div className="relative inline-block">
                                                        <img
                                                            src={logoPreview}
                                                            alt="Logo Preview"
                                                            className="mx-auto h-16 w-auto rounded border"
                                                        />
                                                        <Button
                                                            type="button"
                                                            variant="destructive"
                                                            size="sm"
                                                            className="absolute top-2 right-2"
                                                            onClick={() => {
                                                                setLogoPreview(
                                                                    null,
                                                                );
                                                                setLogoFileName(
                                                                    null,
                                                                );
                                                                (
                                                                    setData as any
                                                                )(
                                                                    'clinic.logo',
                                                                    null,
                                                                );
                                                                const input =
                                                                    document.getElementById(
                                                                        'clinic.logo',
                                                                    ) as HTMLInputElement;
                                                                if (input)
                                                                    input.value =
                                                                        '';
                                                            }}
                                                        >
                                                            ×
                                                        </Button>
                                                    </div>
                                                ) : (
                                                    <div className="flex items-center justify-center gap-2 text-sm text-green-600">
                                                        <Check className="h-4 w-4" />
                                                        <span>
                                                            {logoFileName ||
                                                                t(
                                                                    'file_uploaded',
                                                                )}
                                                        </span>
                                                        <Button
                                                            type="button"
                                                            variant="ghost"
                                                            size="sm"
                                                            onClick={() => {
                                                                setLogoPreview(
                                                                    null,
                                                                );
                                                                setLogoFileName(
                                                                    null,
                                                                );
                                                                (
                                                                    setData as any
                                                                )(
                                                                    'clinic.logo',
                                                                    null,
                                                                );
                                                                const input =
                                                                    document.getElementById(
                                                                        'clinic.logo',
                                                                    ) as HTMLInputElement;
                                                                if (input)
                                                                    input.value =
                                                                        '';
                                                            }}
                                                        >
                                                            {t('remove') ||
                                                                'Remove'}
                                                        </Button>
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                    <InputError
                                        message={
                                            formErrors['clinic.logo'] ||
                                            (externalErrors as any)[
                                                'clinic.logo'
                                            ] ||
                                            validationErrors['clinic.logo']
                                        }
                                    />
                                </div>

                                <div className="space-y-2 md:col-span-2">
                                    <Label htmlFor="clinic.bio_en">
                                        {t('description_en')}{' '}
                                        <span className="text-sm text-muted-foreground">
                                            ({t('optional')})
                                        </span>
                                    </Label>
                                    <Textarea
                                        id="clinic.bio_en"
                                        value={data.clinic.bio_en}
                                        maxLength={2000}
                                        onChange={(e) => {
                                            const value = e.target.value;
                                            const limitedValue = value.slice(
                                                0,
                                                2000,
                                            );
                                            (setData as any)(
                                                'clinic.bio_en',
                                                limitedValue,
                                            );
                                            
                                            // Real-time validation for English only
                                            if (value && value.trim()) {
                                                const englishPattern =
                                                    /^[a-zA-Z0-9\s\-_.,;:!?@#$%^&*()[\]{}""''/]+$/;
                                                if (
                                                    !englishPattern.test(value)
                                                ) {
                                                    const fieldName =
                                                        t('description_en') ||
                                                        'Description (English)';
                                                    const errorMsg =
                                                        t(
                                                            'description_en_must_be_english',
                                                        ) ||
                                                        t(
                                                            'field_must_be_english_only',
                                                        )?.replace(
                                                            ':attribute',
                                                            fieldName,
                                                        ) ||
                                                        `${fieldName} must contain only English characters`;
                                                    setValidationErrors(
                                                        (prev) => ({
                                                        ...prev,
                                                            'clinic.bio_en':
                                                                errorMsg,
                                                        }),
                                                    );
                                                } else {
                                                    setValidationErrors(
                                                        (prev) => {
                                                            const newErrors = {
                                                                ...prev,
                                                            };
                                                            delete newErrors[
                                                                'clinic.bio_en'
                                                            ];
                                                        return newErrors;
                                                        },
                                                    );
                                                }
                                            } else {
                                                setValidationErrors((prev) => {
                                                    const newErrors = {
                                                        ...prev,
                                                    };
                                                    delete newErrors[
                                                        'clinic.bio_en'
                                                    ];
                                                    return newErrors;
                                                });
                                            }
                                        }}
                                        onBlur={() =>
                                            handleFieldBlur('clinic.bio_en')
                                        }
                                        placeholder={t('enter_description_en')}
                                        rows={4}
                                        className={`${getFieldError('clinic.bio_en') ? 'border-red-500' : ''}`}
                                    />
                                    <InputError
                                        message={getFieldError('clinic.bio_en')}
                                    />
                                </div>

                                <div className="space-y-2 md:col-span-2">
                                    <Label htmlFor="clinic.bio_ar">
                                        {t('description_ar')}{' '}
                                        <span className="text-sm text-muted-foreground">
                                            ({t('optional')})
                                        </span>
                                    </Label>
                                    <Textarea
                                        id="clinic.bio_ar"
                                        value={data.clinic.bio_ar}
                                        maxLength={2000}
                                        onChange={(e) => {
                                            const value = e.target.value;
                                            const limitedValue = value.slice(
                                                0,
                                                2000,
                                            );
                                            (setData as any)(
                                                'clinic.bio_ar',
                                                limitedValue,
                                            );
                                            
                                            // Real-time validation for Arabic only
                                            if (value && value.trim()) {
                                                const arabicPattern =
                                                    /^[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF\s\u0660-\u0669\u06F0-\u06F9.,;:!?\-_()[\]{}""''«»/]+$/u;
                                                if (
                                                    !arabicPattern.test(value)
                                                ) {
                                                    const fieldName =
                                                        t('description_ar') ||
                                                        'Description (Arabic)';
                                                    const errorMsg =
                                                        t(
                                                            'description_ar_must_be_arabic',
                                                        ) ||
                                                        t(
                                                            'field_must_be_arabic_only',
                                                        )?.replace(
                                                            ':attribute',
                                                            fieldName,
                                                        ) ||
                                                        `${fieldName} must contain only Arabic characters`;
                                                    setValidationErrors(
                                                        (prev) => ({
                                                        ...prev,
                                                            'clinic.bio_ar':
                                                                errorMsg,
                                                        }),
                                                    );
                                                } else {
                                                    setValidationErrors(
                                                        (prev) => {
                                                            const newErrors = {
                                                                ...prev,
                                                            };
                                                            delete newErrors[
                                                                'clinic.bio_ar'
                                                            ];
                                                        return newErrors;
                                                        },
                                                    );
                                                }
                                            } else {
                                                setValidationErrors((prev) => {
                                                    const newErrors = {
                                                        ...prev,
                                                    };
                                                    delete newErrors[
                                                        'clinic.bio_ar'
                                                    ];
                                                    return newErrors;
                                                });
                                            }
                                        }}
                                        onBlur={() =>
                                            handleFieldBlur('clinic.bio_ar')
                                        }
                                        placeholder={t('enter_description_ar')}
                                        rows={4}
                                        className={`${getFieldError('clinic.bio_ar') ? 'border-red-500' : ''}`}
                                    />
                                    <InputError
                                        message={getFieldError('clinic.bio_ar')}
                                    />
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Step 3: Address & Location */}
                    {(showAsTabs
                        ? showUserFields
                            ? currentStep === 3
                            : currentStep === 2
                        : effectiveStep === 3) && (
                        <div className="space-y-6">
                            <div className="mb-6 flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <MapPin className="h-6 w-6 text-primary" />
                                    <h2 className="text-2xl font-semibold text-foreground">
                                        {t('address_location')}
                                    </h2>
                                </div>
                                <span className="rounded-full bg-muted px-3 py-1 text-sm text-muted-foreground">
                                    {t('step')} {currentStep} {t('of')}{' '}
                                    {totalSteps}
                                </span>
                            </div>
                            
                            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                                <div className="space-y-2">
                                    <Label htmlFor="clinic.governorate_id">
                                        {t('governorate')}{' '}
                                        <span className="text-red-500">*</span>
                                    </Label>
                                    <Select
                                        value={
                                            data.clinic.governorate_id ||
                                            undefined
                                        }
                                        onValueChange={handleGovernorateChange}
                                    >
                                        <SelectTrigger
                                            className={`${getFieldError('clinic.governorate_id') ? 'border-red-500' : ''}`}
                                        >
                                            <SelectValue
                                                placeholder={t(
                                                    'select_governorate',
                                                )}
                                            />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {governorates &&
                                            governorates.length > 0 ? (
                                                governorates.map((gov) => (
                                                    <SelectItem
                                                        key={gov.id}
                                                        value={gov.id.toString()}
                                                    >
                                                        {isRTL
                                                            ? gov.name_ar
                                                            : gov.name_en}
                                                    </SelectItem>
                                                ))
                                            ) : (
                                                <SelectItem
                                                    value="no-governorates"
                                                    disabled
                                                >
                                                    {t(
                                                        'no_governorates_available',
                                                    )}
                                                </SelectItem>
                                            )}
                                        </SelectContent>
                                    </Select>
                                    <InputError
                                        message={getFieldError(
                                            'clinic.governorate_id',
                                        )}
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="clinic.area_id">
                                        {t('area')}{' '}
                                        <span className="text-red-500">*</span>
                                    </Label>
                                    <Select
                                        value={data.clinic.area_id || undefined}
                                        onValueChange={(value) =>
                                            (setData as any)(
                                                'clinic.area_id',
                                                value,
                                            )
                                        }
                                        disabled={!selectedGovernorate}
                                    >
                                        <SelectTrigger
                                            className={`${getFieldError('clinic.area_id') ? 'border-red-500' : ''}`}
                                        >
                                            <SelectValue
                                                placeholder={
                                                    selectedGovernorate
                                                        ? t('select_area')
                                                        : t(
                                                              'select_governorate_first',
                                                          )
                                                }
                                            />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {areas && areas.length > 0 ? (
                                                areas.map((area) => (
                                                    <SelectItem
                                                        key={area.id}
                                                        value={area.id.toString()}
                                                    >
                                                        {isRTL
                                                            ? area.name_ar
                                                            : area.name_en}
                                                    </SelectItem>
                                                ))
                                            ) : (
                                                <SelectItem
                                                    value="no-areas"
                                                    disabled
                                                >
                                                    {selectedGovernorate
                                                        ? t(
                                                              'no_areas_available',
                                                          )
                                                        : t(
                                                              'select_governorate_first',
                                                          )}
                                                </SelectItem>
                                            )}
                                        </SelectContent>
                                    </Select>
                                    <InputError
                                        message={getFieldError(
                                            'clinic.area_id',
                                        )}
                                    />
                                </div>

                                <div className="space-y-2 md:col-span-2">
                                    <AddressAutocomplete
                                        id="clinic.address"
                                        label={t('address')}
                                        value={data.clinic.address}
                                        onChange={(field, value) => {
                                            const limitedValue = value.slice(
                                                0,
                                                500,
                                            );
                                            (setData as any)(
                                                'clinic.address',
                                                limitedValue,
                                            );
                                            if (
                                                validationErrors[
                                                    'clinic.address'
                                                ]
                                            ) {
                                                setValidationErrors((prev) => {
                                                    const newErrors = {
                                                        ...prev,
                                                    };
                                                    delete newErrors[
                                                        'clinic.address'
                                                    ];
                                                    return newErrors;
                                                });
                                            }
                                        }}
                                        onAddressChange={(components) => {
                                            if (components.address) {
                                                (setData as any)(
                                                    'clinic.address',
                                                    components.address,
                                                );
                                            }
                                            if (
                                                components.block !== undefined
                                            ) {
                                                (setData as any)(
                                                    'clinic.block',
                                                    components.block || '',
                                                );
                                            }
                                            if (
                                                components.street !== undefined
                                            ) {
                                                (setData as any)(
                                                    'clinic.street',
                                                    components.street || '',
                                                );
                                            }
                                            if (
                                                components.avenue !== undefined
                                            ) {
                                                (setData as any)(
                                                    'clinic.avenue',
                                                    components.avenue || '',
                                                );
                                            }
                                            if (
                                                components.house !== undefined
                                            ) {
                                                (setData as any)(
                                                    'clinic.house',
                                                    components.house || '',
                                                );
                                            }
                                            if (
                                                components.floor !== undefined
                                            ) {
                                                (setData as any)(
                                                    'clinic.floor',
                                                    components.floor || '',
                                                );
                                            }
                                            if (components.apt !== undefined) {
                                                (setData as any)(
                                                    'clinic.apt',
                                                    components.apt || '',
                                                );
                                            }
                                            if (components.city !== undefined) {
                                                (setData as any)(
                                                    'clinic.city',
                                                    components.city || '',
                                                );
                                            }
                                            if (
                                                components.state !== undefined
                                            ) {
                                                (setData as any)(
                                                    'clinic.state',
                                                    components.state || '',
                                                );
                                            }
                                            if (
                                                components.country !== undefined
                                            ) {
                                                (setData as any)(
                                                    'clinic.country',
                                                    components.country ||
                                                        'Kuwait',
                                                );
                                            }
                                            if (
                                                components.postal_code !==
                                                undefined
                                            ) {
                                                (setData as any)(
                                                    'clinic.postal_code',
                                                    components.postal_code ||
                                                        '',
                                                );
                                            }
                                            if (
                                                components.latitude !==
                                                undefined
                                            ) {
                                                (setData as any)(
                                                    'clinic.latitude',
                                                    components.latitude || '',
                                                );
                                            }
                                            if (
                                                components.longitude !==
                                                undefined
                                            ) {
                                                (setData as any)(
                                                    'clinic.longitude',
                                                    components.longitude || '',
                                                );
                                            }
                                        }}
                                        placeholder={t('enter_full_address')}
                                        error={
                                            formErrors['clinic.address'] ||
                                            (externalErrors as any)[
                                                'clinic.address'
                                            ] ||
                                            validationErrors['clinic.address']
                                        }
                                        required
                                        maxLength={500}
                                        rows={2}
                                        countryRestriction="KW"
                                        governorateName={
                                            data.clinic.governorate_id &&
                                            governorates
                                                ? governorates.find(
                                                      (g) =>
                                                          g.id.toString() ===
                                                          data.clinic
                                                              .governorate_id,
                                                  )
                                                    ? isRTL
                                                        ? governorates.find(
                                                              (g) =>
                                                                  g.id.toString() ===
                                                                  data.clinic
                                                                      .governorate_id,
                                                          )?.name_ar
                                                        : governorates.find(
                                                              (g) =>
                                                                  g.id.toString() ===
                                                                  data.clinic
                                                                      .governorate_id,
                                                          )?.name_en
                                                    : undefined
                                                : undefined
                                        }
                                        areaName={
                                            data.clinic.area_id && areas
                                                ? areas.find(
                                                      (a) =>
                                                          a.id.toString() ===
                                                          data.clinic.area_id,
                                                  )
                                                    ? isRTL
                                                        ? areas.find(
                                                              (a) =>
                                                                  a.id.toString() ===
                                                                  data.clinic
                                                                      .area_id,
                                                          )?.name_ar
                                                        : areas.find(
                                                              (a) =>
                                                                  a.id.toString() ===
                                                                  data.clinic
                                                                      .area_id,
                                                          )?.name_en
                                                    : undefined
                                                : undefined
                                        }
                                        requireGovernorateAndArea={true}
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="clinic.block">
                                        {t('block')}{' '}
                                        <span className="text-sm text-muted-foreground">
                                            ({t('optional')})
                                        </span>
                                    </Label>
                                    <Input
                                        id="clinic.block"
                                        type="text"
                                        value={data.clinic.block}
                                        maxLength={50}
                                        onChange={(e) => {
                                            const value = e.target.value.slice(
                                                0,
                                                50,
                                            );
                                            (setData as any)(
                                                'clinic.block',
                                                value,
                                            );
                                            if (
                                                validationErrors['clinic.block']
                                            ) {
                                                setValidationErrors((prev) => {
                                                    const newErrors = {
                                                        ...prev,
                                                    };
                                                    delete newErrors[
                                                        'clinic.block'
                                                    ];
                                                    return newErrors;
                                                });
                                            }
                                        }}
                                        onBlur={() =>
                                            handleFieldBlur('clinic.block')
                                        }
                                        placeholder={t('enter_block')}
                                        className={`${formErrors['clinic.block'] || (externalErrors as any)['clinic.block'] || validationErrors['clinic.block'] ? 'border-red-500' : ''}`}
                                        disabled={
                                            !data.clinic.governorate_id ||
                                            !data.clinic.area_id
                                        }
                                    />
                                    <InputError
                                        message={
                                            formErrors['clinic.block'] ||
                                            (externalErrors as any)[
                                                'clinic.block'
                                            ] ||
                                            validationErrors['clinic.block']
                                        }
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="clinic.street">
                                        {t('street')}{' '}
                                        <span className="text-sm text-muted-foreground">
                                            ({t('optional')})
                                        </span>
                                    </Label>
                                    <Input
                                        id="clinic.street"
                                        type="text"
                                        value={data.clinic.street}
                                        maxLength={100}
                                        onChange={(e) => {
                                            const value = e.target.value.slice(
                                                0,
                                                100,
                                            );
                                            (setData as any)(
                                                'clinic.street',
                                                value,
                                            );
                                            if (
                                                validationErrors[
                                                    'clinic.street'
                                                ]
                                            ) {
                                                setValidationErrors((prev) => {
                                                    const newErrors = {
                                                        ...prev,
                                                    };
                                                    delete newErrors[
                                                        'clinic.street'
                                                    ];
                                                    return newErrors;
                                                });
                                            }
                                        }}
                                        onBlur={() =>
                                            handleFieldBlur('clinic.street')
                                        }
                                        placeholder={t('enter_street')}
                                        className={`${formErrors['clinic.street'] || (externalErrors as any)['clinic.street'] || validationErrors['clinic.street'] ? 'border-red-500' : ''}`}
                                        disabled={
                                            !data.clinic.governorate_id ||
                                            !data.clinic.area_id
                                        }
                                    />
                                    <InputError
                                        message={
                                            formErrors['clinic.street'] ||
                                            (externalErrors as any)[
                                                'clinic.street'
                                            ] ||
                                            validationErrors['clinic.street']
                                        }
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="clinic.avenue">
                                        {t('avenue')}{' '}
                                        <span className="text-sm text-muted-foreground">
                                            ({t('optional')})
                                        </span>
                                    </Label>
                                    <Input
                                        id="clinic.avenue"
                                        type="text"
                                        value={data.clinic.avenue}
                                        maxLength={100}
                                        onChange={(e) => {
                                            const value = e.target.value.slice(
                                                0,
                                                100,
                                            );
                                            (setData as any)(
                                                'clinic.avenue',
                                                value,
                                            );
                                            if (
                                                validationErrors[
                                                    'clinic.avenue'
                                                ]
                                            ) {
                                                setValidationErrors((prev) => {
                                                    const newErrors = {
                                                        ...prev,
                                                    };
                                                    delete newErrors[
                                                        'clinic.avenue'
                                                    ];
                                                    return newErrors;
                                                });
                                            }
                                        }}
                                        onBlur={() =>
                                            handleFieldBlur('clinic.avenue')
                                        }
                                        placeholder={t('enter_avenue')}
                                        className={`${formErrors['clinic.avenue'] || (externalErrors as any)['clinic.avenue'] || validationErrors['clinic.avenue'] ? 'border-red-500' : ''}`}
                                        disabled={
                                            !data.clinic.governorate_id ||
                                            !data.clinic.area_id
                                        }
                                    />
                                    <InputError
                                        message={
                                            formErrors['clinic.avenue'] ||
                                            (externalErrors as any)[
                                                'clinic.avenue'
                                            ] ||
                                            validationErrors['clinic.avenue']
                                        }
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="clinic.house">
                                        {t('house')}{' '}
                                        <span className="text-sm text-muted-foreground">
                                            ({t('optional')})
                                        </span>
                                    </Label>
                                    <Input
                                        id="clinic.house"
                                        type="text"
                                        value={data.clinic.house}
                                        maxLength={50}
                                        onChange={(e) => {
                                            const value = e.target.value.slice(
                                                0,
                                                50,
                                            );
                                            (setData as any)(
                                                'clinic.house',
                                                value,
                                            );
                                        }}
                                        onBlur={() =>
                                            handleFieldBlur('clinic.house')
                                        }
                                        placeholder={t('enter_house')}
                                        className={`${formErrors['clinic.house'] || (externalErrors as any)['clinic.house'] || validationErrors['clinic.house'] ? 'border-red-500' : ''}`}
                                        disabled={
                                            !data.clinic.governorate_id ||
                                            !data.clinic.area_id
                                        }
                                    />
                                    <InputError
                                        message={
                                            formErrors['clinic.house'] ||
                                            (externalErrors as any)[
                                                'clinic.house'
                                            ] ||
                                            validationErrors['clinic.house']
                                        }
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="clinic.floor">
                                        {t('floor')}{' '}
                                        <span className="text-sm text-muted-foreground">
                                            ({t('optional')})
                                        </span>
                                    </Label>
                                    <Input
                                        id="clinic.floor"
                                        type="text"
                                        value={data.clinic.floor}
                                        maxLength={50}
                                        onChange={(e) => {
                                            const value = e.target.value.slice(
                                                0,
                                                50,
                                            );
                                            (setData as any)(
                                                'clinic.floor',
                                                value,
                                            );
                                            if (
                                                validationErrors['clinic.floor']
                                            ) {
                                                setValidationErrors((prev) => {
                                                    const newErrors = {
                                                        ...prev,
                                                    };
                                                    delete newErrors[
                                                        'clinic.floor'
                                                    ];
                                                    return newErrors;
                                                });
                                            }
                                        }}
                                        onBlur={() =>
                                            handleFieldBlur('clinic.floor')
                                        }
                                        placeholder={t('enter_floor')}
                                        className={`${formErrors['clinic.floor'] || (externalErrors as any)['clinic.floor'] || validationErrors['clinic.floor'] ? 'border-red-500' : ''}`}
                                        disabled={
                                            !data.clinic.governorate_id ||
                                            !data.clinic.area_id
                                        }
                                    />
                                    <InputError
                                        message={
                                            formErrors['clinic.floor'] ||
                                            (externalErrors as any)[
                                                'clinic.floor'
                                            ] ||
                                            validationErrors['clinic.floor']
                                        }
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="clinic.apt">
                                        {t('apartment')}{' '}
                                        <span className="text-sm text-muted-foreground">
                                            ({t('optional')})
                                        </span>
                                    </Label>
                                    <Input
                                        id="clinic.apt"
                                        type="text"
                                        value={data.clinic.apt}
                                        maxLength={50}
                                        onChange={(e) => {
                                            const value = e.target.value.slice(
                                                0,
                                                50,
                                            );
                                            (setData as any)(
                                                'clinic.apt',
                                                value,
                                            );
                                            if (
                                                validationErrors['clinic.apt']
                                            ) {
                                                setValidationErrors((prev) => {
                                                    const newErrors = {
                                                        ...prev,
                                                    };
                                                    delete newErrors[
                                                        'clinic.apt'
                                                    ];
                                                    return newErrors;
                                                });
                                            }
                                        }}
                                        onBlur={() =>
                                            handleFieldBlur('clinic.apt')
                                        }
                                        placeholder={t('enter_apartment')}
                                        className={`${formErrors['clinic.apt'] || (externalErrors as any)['clinic.apt'] || validationErrors['clinic.apt'] ? 'border-red-500' : ''}`}
                                        disabled={
                                            !data.clinic.governorate_id ||
                                            !data.clinic.area_id
                                        }
                                    />
                                    <InputError
                                        message={
                                            formErrors['clinic.apt'] ||
                                            (externalErrors as any)[
                                                'clinic.apt'
                                            ] ||
                                            validationErrors['clinic.apt']
                                        }
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="clinic.city">
                                        {t('city')}{' '}
                                        <span className="text-sm text-muted-foreground">
                                            ({t('optional')})
                                        </span>
                                    </Label>
                                    <Input
                                        id="clinic.city"
                                        type="text"
                                        value={data.clinic.city}
                                        maxLength={100}
                                        onChange={(e) => {
                                            const value = e.target.value.slice(
                                                0,
                                                100,
                                            );
                                            (setData as any)(
                                                'clinic.city',
                                                value,
                                            );
                                            if (
                                                validationErrors['clinic.city']
                                            ) {
                                                setValidationErrors((prev) => {
                                                    const newErrors = {
                                                        ...prev,
                                                    };
                                                    delete newErrors[
                                                        'clinic.city'
                                                    ];
                                                    return newErrors;
                                                });
                                            }
                                        }}
                                        onBlur={() =>
                                            handleFieldBlur('clinic.city')
                                        }
                                        placeholder={t('enter_city')}
                                        className={`${formErrors['clinic.city'] || (externalErrors as any)['clinic.city'] || validationErrors['clinic.city'] ? 'border-red-500' : ''}`}
                                        disabled={
                                            !data.clinic.governorate_id ||
                                            !data.clinic.area_id
                                        }
                                    />
                                    <InputError
                                        message={
                                            formErrors['clinic.city'] ||
                                            (externalErrors as any)[
                                                'clinic.city'
                                            ] ||
                                            validationErrors['clinic.city']
                                        }
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="clinic.postal_code">
                                        {t('postal_code')}{' '}
                                        <span className="text-sm text-muted-foreground">
                                            ({t('optional')})
                                        </span>
                                    </Label>
                                    <Input
                                        id="clinic.postal_code"
                                        type="text"
                                        value={data.clinic.postal_code}
                                        maxLength={20}
                                        onChange={(e) => {
                                            const value = e.target.value
                                                .replace(/\D/g, '')
                                                .slice(0, 20);
                                            (setData as any)(
                                                'clinic.postal_code',
                                                value,
                                            );
                                            if (
                                                validationErrors[
                                                    'clinic.postal_code'
                                                ]
                                            ) {
                                                setValidationErrors((prev) => {
                                                    const newErrors = {
                                                        ...prev,
                                                    };
                                                    delete newErrors[
                                                        'clinic.postal_code'
                                                    ];
                                                    return newErrors;
                                                });
                                            }
                                        }}
                                        onBlur={() =>
                                            handleFieldBlur(
                                                'clinic.postal_code',
                                            )
                                        }
                                        placeholder={t('enter_postal_code')}
                                        className={`${formErrors['clinic.postal_code'] || (externalErrors as any)['clinic.postal_code'] || validationErrors['clinic.postal_code'] ? 'border-red-500' : ''}`}
                                        disabled={
                                            !data.clinic.governorate_id ||
                                            !data.clinic.area_id
                                        }
                                    />
                                    <InputError
                                        message={
                                            formErrors['clinic.postal_code'] ||
                                            (externalErrors as any)[
                                                'clinic.postal_code'
                                            ] ||
                                            validationErrors[
                                                'clinic.postal_code'
                                            ]
                                        }
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="clinic.latitude">
                                        {t('latitude')}{' '}
                                        <span className="text-sm text-muted-foreground">
                                            ({t('optional')})
                                        </span>
                                    </Label>
                                    <Input
                                        id="clinic.latitude"
                                        type="number"
                                        step="any"
                                        value={data.clinic.latitude}
                                        onChange={(e) => {
                                            const value = e.target.value;
                                            (setData as any)(
                                                'clinic.latitude',
                                                value,
                                            );
                                            if (
                                                validationErrors[
                                                    'clinic.latitude'
                                                ]
                                            ) {
                                                setValidationErrors((prev) => {
                                                    const newErrors = {
                                                        ...prev,
                                                    };
                                                    delete newErrors[
                                                        'clinic.latitude'
                                                    ];
                                                    return newErrors;
                                                });
                                            }
                                        }}
                                        onBlur={(e) => {
                                            const value = e.target.value.trim();
                                            if (value) {
                                                const lat = parseFloat(value);
                                                if (
                                                    isNaN(lat) ||
                                                    lat < -90 ||
                                                    lat > 90
                                                ) {
                                                    setValidationErrors(
                                                        (prev) => ({
                                                        ...prev,
                                                            'clinic.latitude':
                                                                t(
                                                                    'latitude_invalid',
                                                                ) ||
                                                                'Latitude must be a number between -90 and 90',
                                                        }),
                                                    );
                                                } else {
                                                    setValidationErrors(
                                                        (prev) => {
                                                            const newErrors = {
                                                                ...prev,
                                                            };
                                                            delete newErrors[
                                                                'clinic.latitude'
                                                            ];
                                                        return newErrors;
                                                        },
                                                    );
                                                }
                                            }
                                            handleFieldBlur('clinic.latitude');
                                        }}
                                        placeholder="29.3759"
                                        className={`${formErrors['clinic.latitude'] || (externalErrors as any)['clinic.latitude'] || validationErrors['clinic.latitude'] ? 'border-red-500' : ''}`}
                                        disabled={
                                            !data.clinic.governorate_id ||
                                            !data.clinic.area_id
                                        }
                                    />
                                    <InputError
                                        message={
                                            formErrors['clinic.latitude'] ||
                                            (externalErrors as any)[
                                                'clinic.latitude'
                                            ] ||
                                            validationErrors['clinic.latitude']
                                        }
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="clinic.longitude">
                                        {t('longitude')}{' '}
                                        <span className="text-sm text-muted-foreground">
                                            ({t('optional')})
                                        </span>
                                    </Label>
                                    <Input
                                        id="clinic.longitude"
                                        type="number"
                                        step="any"
                                        value={data.clinic.longitude}
                                        onChange={(e) => {
                                            const value = e.target.value;
                                            (setData as any)(
                                                'clinic.longitude',
                                                value,
                                            );
                                            if (
                                                validationErrors[
                                                    'clinic.longitude'
                                                ]
                                            ) {
                                                setValidationErrors((prev) => {
                                                    const newErrors = {
                                                        ...prev,
                                                    };
                                                    delete newErrors[
                                                        'clinic.longitude'
                                                    ];
                                                    return newErrors;
                                                });
                                            }
                                        }}
                                        onBlur={(e) => {
                                            const value = e.target.value.trim();
                                            if (value) {
                                                const lng = parseFloat(value);
                                                if (
                                                    isNaN(lng) ||
                                                    lng < -180 ||
                                                    lng > 180
                                                ) {
                                                    setValidationErrors(
                                                        (prev) => ({
                                                        ...prev,
                                                            'clinic.longitude':
                                                                t(
                                                                    'longitude_invalid',
                                                                ) ||
                                                                'Longitude must be a number between -180 and 180',
                                                        }),
                                                    );
                                                } else {
                                                    setValidationErrors(
                                                        (prev) => {
                                                            const newErrors = {
                                                                ...prev,
                                                            };
                                                            delete newErrors[
                                                                'clinic.longitude'
                                                            ];
                                                        return newErrors;
                                                        },
                                                    );
                                                }
                                            }
                                            handleFieldBlur('clinic.longitude');
                                        }}
                                        placeholder="47.9774"
                                        className={`${formErrors['clinic.longitude'] || (externalErrors as any)['clinic.longitude'] || validationErrors['clinic.longitude'] ? 'border-red-500' : ''}`}
                                        disabled={
                                            !data.clinic.governorate_id ||
                                            !data.clinic.area_id
                                        }
                                    />
                                    <InputError
                                        message={
                                            formErrors['clinic.longitude'] ||
                                            (externalErrors as any)[
                                                'clinic.longitude'
                                            ] ||
                                            validationErrors['clinic.longitude']
                                        }
                                    />
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Step 4: Settings & Policies */}
                    {(showAsTabs
                        ? showUserFields
                            ? currentStep === 4
                            : currentStep === 3
                        : effectiveStep === 4) && (
                        <div className="space-y-6">
                            <div className="mb-6 flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <Settings className="h-6 w-6 text-primary" />
                                    <h2 className="text-2xl font-semibold text-foreground">
                                        {t('settings_policies')}
                                    </h2>
                                </div>
                                <span className="rounded-full bg-muted px-3 py-1 text-sm text-muted-foreground">
                                    {t('step')} {currentStep} {t('of')}{' '}
                                    {totalSteps}
                                </span>
                            </div>
                            
                            <div className="space-y-6">
                                <div className="space-y-4 border-b pb-6">
                                    <h3 className="text-lg font-semibold">
                                        {t('booking_settings')}
                                    </h3>
                                    
                                    <div
                                        className={`flex items-center justify-between gap-3 ${isRTL ? 'flex-row-reverse' : ''}`}
                                    >
                                        <Label htmlFor="auto_confirm">
                                            {t('auto_confirm_bookings')}
                                        </Label>
                                        <Switch
                                            id="auto_confirm"
                                            checked={
                                                data.clinic
                                                    .auto_confirm_bookings
                                            }
                                            onCheckedChange={(checked) =>
                                                (setData as any)(
                                                    'clinic.auto_confirm_bookings',
                                                    checked,
                                                )
                                            }
                                        />
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <h3 className="text-lg font-semibold">
                                        {t('policies')}
                                    </h3>
                                    
                                    <div className="space-y-2">
                                        <Label htmlFor="cancellation_policy_en">
                                            {t('cancellation_policy_en')} <span className="text-red-500">*</span>
                                        </Label>
                                        <Textarea
                                            id="cancellation_policy_en"
                                            value={
                                                data.clinic
                                                    .cancellation_policy_en
                                            }
                                            maxLength={2000}
                                            onChange={(e) => {
                                                const value = e.target.value;
                                                const limitedValue =
                                                    value.slice(0, 2000);
                                                (setData as any)(
                                                    'clinic.cancellation_policy_en',
                                                    limitedValue,
                                                );
                                                const englishPattern =
                                                    /^[a-zA-Z0-9\s\-_.,;:!?@#$%^&*()[\]{}""''/]+$/;
                                                if (value && value.trim()) {
                                                    if (
                                                        !englishPattern.test(
                                                            value,
                                                        )
                                                    ) {
                                                        const fieldName =
                                                            t(
                                                                'cancellation_policy_en',
                                                            ) ||
                                                            'Cancellation Policy (English)';
                                                        const errorMsg =
                                                            t(
                                                                'clinic_name_en_must_be_english',
                                                            ) ||
                                                            t(
                                                                'field_must_be_english_only',
                                                            )?.replace(
                                                                ':attribute',
                                                                fieldName,
                                                            ) ||
                                                            `${fieldName} must contain only English characters`;
                                                        setValidationErrors(
                                                            (prev) => ({
                                                            ...prev,
                                                                'clinic.cancellation_policy_en':
                                                                    errorMsg,
                                                            }),
                                                        );
                                                    } else {
                                                        setValidationErrors(
                                                            (prev) => {
                                                                const newErrors =
                                                                    { ...prev };
                                                                delete newErrors[
                                                                    'clinic.cancellation_policy_en'
                                                                ];
                                                            return newErrors;
                                                            },
                                                        );
                                                    }
                                                } else {
                                                    setValidationErrors(
                                                        (prev) => {
                                                            const newErrors = {
                                                                ...prev,
                                                            };
                                                            delete newErrors[
                                                                'clinic.cancellation_policy_en'
                                                            ];
                                                        return newErrors;
                                                        },
                                                    );
                                                }
                                            }}
                                            onBlur={() =>
                                                handleFieldBlur(
                                                    'clinic.cancellation_policy_en',
                                                )
                                            }
                                            placeholder={t(
                                                'enter_cancellation_policy_en',
                                            )}
                                            rows={4}
                                            className={`${getFieldError('clinic.cancellation_policy_en') ? 'border-red-500' : ''}`}
                                        />
                                        <InputError
                                            message={getFieldError(
                                                'clinic.cancellation_policy_en',
                                            )}
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="cancellation_policy_ar">
                                            {t('cancellation_policy_ar')} <span className="text-red-500">*</span>
                                        </Label>
                                        <Textarea
                                            id="cancellation_policy_ar"
                                            value={
                                                data.clinic
                                                    .cancellation_policy_ar
                                            }
                                            maxLength={2000}
                                            onChange={(e) => {
                                                const value = e.target.value;
                                                const limitedValue =
                                                    value.slice(0, 2000);
                                                (setData as any)(
                                                    'clinic.cancellation_policy_ar',
                                                    limitedValue,
                                                );
                                                const arabicPattern =
                                                    /^[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF\s\u0660-\u0669\u06F0-\u06F9.,;:!?\-_()[\]{}""''«»/]+$/u;
                                                if (value && value.trim()) {
                                                    if (
                                                        !arabicPattern.test(
                                                            value,
                                                        )
                                                    ) {
                                                        const fieldName =
                                                            t(
                                                                'cancellation_policy_ar',
                                                            ) ||
                                                            'Cancellation Policy (Arabic)';
                                                        const errorMsg =
                                                            t(
                                                                'clinic_name_ar_must_be_arabic',
                                                            ) ||
                                                            t(
                                                                'field_must_be_arabic_only',
                                                            )?.replace(
                                                                ':attribute',
                                                                fieldName,
                                                            ) ||
                                                            `${fieldName} must contain only Arabic characters`;
                                                        setValidationErrors(
                                                            (prev) => ({
                                                            ...prev,
                                                                'clinic.cancellation_policy_ar':
                                                                    errorMsg,
                                                            }),
                                                        );
                                                    } else {
                                                        setValidationErrors(
                                                            (prev) => {
                                                                const newErrors =
                                                                    { ...prev };
                                                                delete newErrors[
                                                                    'clinic.cancellation_policy_ar'
                                                                ];
                                                            return newErrors;
                                                            },
                                                        );
                                                    }
                                                } else {
                                                    setValidationErrors(
                                                        (prev) => {
                                                            const newErrors = {
                                                                ...prev,
                                                            };
                                                            delete newErrors[
                                                                'clinic.cancellation_policy_ar'
                                                            ];
                                                        return newErrors;
                                                        },
                                                    );
                                                }
                                            }}
                                            onBlur={() =>
                                                handleFieldBlur(
                                                    'clinic.cancellation_policy_ar',
                                                )
                                            }
                                            placeholder={t(
                                                'enter_cancellation_policy_ar',
                                            )}
                                            rows={4}
                                            className={`${getFieldError('clinic.cancellation_policy_ar') ? 'border-red-500' : ''}`}
                                        />
                                        <InputError
                                            message={getFieldError(
                                                'clinic.cancellation_policy_ar',
                                            )}
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="refund_policy_en">
                                            {t('refund_policy_en')} <span className="text-red-500">*</span>
                                        </Label>
                                        <Textarea
                                            id="refund_policy_en"
                                            value={data.clinic.refund_policy_en}
                                            maxLength={2000}
                                            onChange={(e) => {
                                                const value = e.target.value;
                                                const limitedValue =
                                                    value.slice(0, 2000);
                                                (setData as any)(
                                                    'clinic.refund_policy_en',
                                                    limitedValue,
                                                );
                                                const englishPattern =
                                                    /^[a-zA-Z0-9\s\-_.,;:!?@#$%^&*()[\]{}""''/]+$/;
                                                if (value && value.trim()) {
                                                    if (
                                                        !englishPattern.test(
                                                            value,
                                                        )
                                                    ) {
                                                        const fieldName =
                                                            t(
                                                                'refund_policy_en',
                                                            ) ||
                                                            'Refund Policy (English)';
                                                        const errorMsg =
                                                            t(
                                                                'clinic_name_en_must_be_english',
                                                            ) ||
                                                            t(
                                                                'field_must_be_english_only',
                                                            )?.replace(
                                                                ':attribute',
                                                                fieldName,
                                                            ) ||
                                                            `${fieldName} must contain only English characters`;
                                                        setValidationErrors(
                                                            (prev) => ({
                                                            ...prev,
                                                                'clinic.refund_policy_en':
                                                                    errorMsg,
                                                            }),
                                                        );
                                                    } else {
                                                        setValidationErrors(
                                                            (prev) => {
                                                                const newErrors =
                                                                    { ...prev };
                                                                delete newErrors[
                                                                    'clinic.refund_policy_en'
                                                                ];
                                                            return newErrors;
                                                            },
                                                        );
                                                    }
                                                } else {
                                                    setValidationErrors(
                                                        (prev) => {
                                                            const newErrors = {
                                                                ...prev,
                                                            };
                                                            delete newErrors[
                                                                'clinic.refund_policy_en'
                                                            ];
                                                        return newErrors;
                                                        },
                                                    );
                                                }
                                            }}
                                            onBlur={() =>
                                                handleFieldBlur(
                                                    'clinic.refund_policy_en',
                                                )
                                            }
                                            placeholder={t(
                                                'enter_refund_policy_en',
                                            )}
                                            rows={4}
                                            className={`${getFieldError('clinic.refund_policy_en') ? 'border-red-500' : ''}`}
                                        />
                                        <InputError
                                            message={getFieldError(
                                                'clinic.refund_policy_en',
                                            )}
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="refund_policy_ar">
                                            {t('refund_policy_ar')} <span className="text-red-500">*</span>
                                        </Label>
                                        <Textarea
                                            id="refund_policy_ar"
                                            value={data.clinic.refund_policy_ar}
                                            maxLength={2000}
                                            onChange={(e) => {
                                                const value = e.target.value;
                                                const limitedValue =
                                                    value.slice(0, 2000);
                                                (setData as any)(
                                                    'clinic.refund_policy_ar',
                                                    limitedValue,
                                                );
                                                const arabicPattern =
                                                    /^[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF\s\u0660-\u0669\u06F0-\u06F9.,;:!?\-_()[\]{}""''«»/]+$/u;
                                                if (value && value.trim()) {
                                                    if (
                                                        !arabicPattern.test(
                                                            value,
                                                        )
                                                    ) {
                                                        const fieldName =
                                                            t(
                                                                'refund_policy_ar',
                                                            ) ||
                                                            'Refund Policy (Arabic)';
                                                        const errorMsg =
                                                            t(
                                                                'clinic_name_ar_must_be_arabic',
                                                            ) ||
                                                            t(
                                                                'field_must_be_arabic_only',
                                                            )?.replace(
                                                                ':attribute',
                                                                fieldName,
                                                            ) ||
                                                            `${fieldName} must contain only Arabic characters`;
                                                        setValidationErrors(
                                                            (prev) => ({
                                                            ...prev,
                                                                'clinic.refund_policy_ar':
                                                                    errorMsg,
                                                            }),
                                                        );
                                                    } else {
                                                        setValidationErrors(
                                                            (prev) => {
                                                                const newErrors =
                                                                    { ...prev };
                                                                delete newErrors[
                                                                    'clinic.refund_policy_ar'
                                                                ];
                                                            return newErrors;
                                                            },
                                                        );
                                                    }
                                                } else {
                                                    setValidationErrors(
                                                        (prev) => {
                                                            const newErrors = {
                                                                ...prev,
                                                            };
                                                            delete newErrors[
                                                                'clinic.refund_policy_ar'
                                                            ];
                                                        return newErrors;
                                                        },
                                                    );
                                                }
                                            }}
                                            onBlur={() =>
                                                handleFieldBlur(
                                                    'clinic.refund_policy_ar',
                                                )
                                            }
                                            placeholder={t(
                                                'enter_refund_policy_ar',
                                            )}
                                            rows={4}
                                            className={`${getFieldError('clinic.refund_policy_ar') ? 'border-red-500' : ''}`}
                                        />
                                        <InputError
                                            message={getFieldError(
                                                'clinic.refund_policy_ar',
                                            )}
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="reschedule_policy_en">
                                            {t('reschedule_policy_en')} <span className="text-red-500">*</span>
                                        </Label>
                                        <Textarea
                                            id="reschedule_policy_en"
                                            value={data.clinic.reschedule_policy_en}
                                            maxLength={2000}
                                            onChange={(e) => {
                                                const value = e.target.value;
                                                const limitedValue =
                                                    value.slice(0, 2000);
                                                (setData as any)(
                                                    'clinic.reschedule_policy_en',
                                                    limitedValue,
                                                );
                                                const englishPattern =
                                                    /^[a-zA-Z0-9\s\-_.,;:!?@#$%^&*()[\]{}""''/]+$/;
                                                if (value && value.trim()) {
                                                    if (
                                                        !englishPattern.test(
                                                            value,
                                                        )
                                                    ) {
                                                        const fieldName =
                                                            t(
                                                                'reschedule_policy_en',
                                                            ) ||
                                                            'Reschedule Policy (English)';
                                                        const errorMsg =
                                                            t(
                                                                'clinic_name_en_must_be_english',
                                                            ) ||
                                                            t(
                                                                'field_must_be_english_only',
                                                            )?.replace(
                                                                ':attribute',
                                                                fieldName,
                                                            ) ||
                                                            `${fieldName} must contain only English characters`;
                                                        setValidationErrors(
                                                            (prev) => ({
                                                            ...prev,
                                                                'clinic.reschedule_policy_en':
                                                                    errorMsg,
                                                            }),
                                                        );
                                                    } else {
                                                        setValidationErrors(
                                                            (prev) => {
                                                                const newErrors =
                                                                    { ...prev };
                                                                delete newErrors[
                                                                    'clinic.reschedule_policy_en'
                                                                ];
                                                            return newErrors;
                                                            },
                                                        );
                                                    }
                                                } else {
                                                    setValidationErrors(
                                                        (prev) => {
                                                            const newErrors = {
                                                                ...prev,
                                                            };
                                                            delete newErrors[
                                                                'clinic.reschedule_policy_en'
                                                            ];
                                                        return newErrors;
                                                        },
                                                    );
                                                }
                                            }}
                                            onBlur={() =>
                                                handleFieldBlur(
                                                    'clinic.reschedule_policy_en',
                                                )
                                            }
                                            placeholder={t(
                                                'enter_reschedule_policy_en',
                                            )}
                                            rows={4}
                                            className={`${getFieldError('clinic.reschedule_policy_en') ? 'border-red-500' : ''}`}
                                        />
                                        <InputError
                                            message={getFieldError(
                                                'clinic.reschedule_policy_en',
                                            )}
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="reschedule_policy_ar">
                                            {t('reschedule_policy_ar')} <span className="text-red-500">*</span>
                                        </Label>
                                        <Textarea
                                            id="reschedule_policy_ar"
                                            value={data.clinic.reschedule_policy_ar}
                                            maxLength={2000}
                                            onChange={(e) => {
                                                const value = e.target.value;
                                                const limitedValue =
                                                    value.slice(0, 2000);
                                                (setData as any)(
                                                    'clinic.reschedule_policy_ar',
                                                    limitedValue,
                                                );
                                                const arabicPattern =
                                                    /^[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF\s\u0660-\u0669\u06F0-\u06F9.,;:!?\-_()[\]{}""''«»/]+$/u;
                                                if (value && value.trim()) {
                                                    if (
                                                        !arabicPattern.test(
                                                            value,
                                                        )
                                                    ) {
                                                        const fieldName =
                                                            t(
                                                                'reschedule_policy_ar',
                                                            ) ||
                                                            'Reschedule Policy (Arabic)';
                                                        const errorMsg =
                                                            t(
                                                                'clinic_name_ar_must_be_arabic',
                                                            ) ||
                                                            t(
                                                                'field_must_be_arabic_only',
                                                            )?.replace(
                                                                ':attribute',
                                                                fieldName,
                                                            ) ||
                                                            `${fieldName} must contain only Arabic characters`;
                                                        setValidationErrors(
                                                            (prev) => ({
                                                            ...prev,
                                                                'clinic.reschedule_policy_ar':
                                                                    errorMsg,
                                                            }),
                                                        );
                                                    } else {
                                                        setValidationErrors(
                                                            (prev) => {
                                                                const newErrors =
                                                                    { ...prev };
                                                                delete newErrors[
                                                                    'clinic.reschedule_policy_ar'
                                                                ];
                                                            return newErrors;
                                                            },
                                                        );
                                                    }
                                                } else {
                                                    setValidationErrors(
                                                        (prev) => {
                                                            const newErrors = {
                                                                ...prev,
                                                            };
                                                            delete newErrors[
                                                                'clinic.reschedule_policy_ar'
                                                            ];
                                                        return newErrors;
                                                        },
                                                    );
                                                }
                                            }}
                                            onBlur={() =>
                                                handleFieldBlur(
                                                    'clinic.reschedule_policy_ar',
                                                )
                                            }
                                            placeholder={t(
                                                'enter_reschedule_policy_ar',
                                            )}
                                            rows={4}
                                            className={`${getFieldError('clinic.reschedule_policy_ar') ? 'border-red-500' : ''}`}
                                        />
                                        <InputError
                                            message={getFieldError(
                                                'clinic.reschedule_policy_ar',
                                            )}
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="privacy_policy_en">
                                            {t('privacy_policy_en')}
                                        </Label>
                                        <Textarea
                                            id="privacy_policy_en"
                                            value={
                                                data.clinic.privacy_policy_en
                                            }
                                            maxLength={2000}
                                            onChange={(e) => {
                                                const value = e.target.value;
                                                const limitedValue =
                                                    value.slice(0, 2000);
                                                (setData as any)(
                                                    'clinic.privacy_policy_en',
                                                    limitedValue,
                                                );
                                                const englishPattern =
                                                    /^[a-zA-Z0-9\s\-_.,;:!?@#$%^&*()[\]{}""''/]+$/;
                                                if (value && value.trim()) {
                                                    if (
                                                        !englishPattern.test(
                                                            value,
                                                        )
                                                    ) {
                                                        const fieldName =
                                                            t(
                                                                'privacy_policy_en',
                                                            ) ||
                                                            'Privacy Policy (English)';
                                                        const errorMsg =
                                                            t(
                                                                'clinic_name_en_must_be_english',
                                                            ) ||
                                                            t(
                                                                'field_must_be_english_only',
                                                            )?.replace(
                                                                ':attribute',
                                                                fieldName,
                                                            ) ||
                                                            `${fieldName} must contain only English characters`;
                                                        setValidationErrors(
                                                            (prev) => ({
                                                                ...prev,
                                                                'clinic.privacy_policy_en':
                                                                    errorMsg,
                                                            }),
                                                        );
                                                    } else {
                                                        setValidationErrors(
                                                            (prev) => {
                                                                const newErrors =
                                                                    { ...prev };
                                                                delete newErrors[
                                                                    'clinic.privacy_policy_en'
                                                                ];
                                                                return newErrors;
                                                            },
                                                        );
                                                    }
                                                } else {
                                                    setValidationErrors(
                                                        (prev) => {
                                                            const newErrors = {
                                                                ...prev,
                                                            };
                                                            delete newErrors[
                                                                'clinic.privacy_policy_en'
                                                            ];
                                                            return newErrors;
                                                        },
                                                    );
                                                }
                                            }}
                                            onBlur={() =>
                                                handleFieldBlur(
                                                    'clinic.privacy_policy_en',
                                                )
                                            }
                                            placeholder={t(
                                                'enter_privacy_policy_en',
                                            )}
                                            rows={4}
                                            className={`${getFieldError('clinic.privacy_policy_en') ? 'border-red-500' : ''}`}
                                        />
                                        <InputError
                                            message={getFieldError(
                                                'clinic.privacy_policy_en',
                                            )}
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="privacy_policy_ar">
                                            {t('privacy_policy_ar')}
                                        </Label>
                                        <Textarea
                                            id="privacy_policy_ar"
                                            value={
                                                data.clinic.privacy_policy_ar
                                            }
                                            maxLength={2000}
                                            onChange={(e) => {
                                                const value = e.target.value;
                                                const limitedValue =
                                                    value.slice(0, 2000);
                                                (setData as any)(
                                                    'clinic.privacy_policy_ar',
                                                    limitedValue,
                                                );
                                                const arabicPattern =
                                                    /^[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF\s\u0660-\u0669\u06F0-\u06F9.,;:!?\-_()[\]{}""''«»/]+$/u;
                                                if (value && value.trim()) {
                                                    if (
                                                        !arabicPattern.test(
                                                            value,
                                                        )
                                                    ) {
                                                        const fieldName =
                                                            t(
                                                                'privacy_policy_ar',
                                                            ) ||
                                                            'Privacy Policy (Arabic)';
                                                        const errorMsg =
                                                            t(
                                                                'clinic_name_ar_must_be_arabic',
                                                            ) ||
                                                            t(
                                                                'field_must_be_arabic_only',
                                                            )?.replace(
                                                                ':attribute',
                                                                fieldName,
                                                            ) ||
                                                            `${fieldName} must contain only Arabic characters`;
                                                        setValidationErrors(
                                                            (prev) => ({
                                                                ...prev,
                                                                'clinic.privacy_policy_ar':
                                                                    errorMsg,
                                                            }),
                                                        );
                                                    } else {
                                                        setValidationErrors(
                                                            (prev) => {
                                                                const newErrors =
                                                                    { ...prev };
                                                                delete newErrors[
                                                                    'clinic.privacy_policy_ar'
                                                                ];
                                                                return newErrors;
                                                            },
                                                        );
                                                    }
                                                } else {
                                                    setValidationErrors(
                                                        (prev) => {
                                                            const newErrors = {
                                                                ...prev,
                                                            };
                                                            delete newErrors[
                                                                'clinic.privacy_policy_ar'
                                                            ];
                                                            return newErrors;
                                                        },
                                                    );
                                                }
                                            }}
                                            onBlur={() =>
                                                handleFieldBlur(
                                                    'clinic.privacy_policy_ar',
                                                )
                                            }
                                            placeholder={t(
                                                'enter_privacy_policy_ar',
                                            )}
                                            rows={4}
                                            className={`${getFieldError('clinic.privacy_policy_ar') ? 'border-red-500' : ''}`}
                                        />
                                        <InputError
                                            message={getFieldError(
                                                'clinic.privacy_policy_ar',
                                            )}
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="terms_and_conditions_en">
                                            {t('terms_and_conditions_en')}
                                        </Label>
                                        <Textarea
                                            id="terms_and_conditions_en"
                                            value={
                                                data.clinic
                                                    .terms_and_conditions_en
                                            }
                                            maxLength={2000}
                                            onChange={(e) => {
                                                const value = e.target.value;
                                                const limitedValue =
                                                    value.slice(0, 2000);
                                                (setData as any)(
                                                    'clinic.terms_and_conditions_en',
                                                    limitedValue,
                                                );
                                                const englishPattern =
                                                    /^[a-zA-Z0-9\s\-_.,;:!?@#$%^&*()[\]{}""''/]+$/;
                                                if (value && value.trim()) {
                                                    if (
                                                        !englishPattern.test(
                                                            value,
                                                        )
                                                    ) {
                                                        const fieldName =
                                                            t(
                                                                'terms_and_conditions_en',
                                                            ) ||
                                                            'Terms & Conditions (English)';
                                                        const errorMsg =
                                                            t(
                                                                'clinic_name_en_must_be_english',
                                                            ) ||
                                                            t(
                                                                'field_must_be_english_only',
                                                            )?.replace(
                                                                ':attribute',
                                                                fieldName,
                                                            ) ||
                                                            `${fieldName} must contain only English characters`;
                                                        setValidationErrors(
                                                            (prev) => ({
                                                                ...prev,
                                                                'clinic.terms_and_conditions_en':
                                                                    errorMsg,
                                                            }),
                                                        );
                                                    } else {
                                                        setValidationErrors(
                                                            (prev) => {
                                                                const newErrors =
                                                                    { ...prev };
                                                                delete newErrors[
                                                                    'clinic.terms_and_conditions_en'
                                                                ];
                                                                return newErrors;
                                                            },
                                                        );
                                                    }
                                                } else {
                                                    setValidationErrors(
                                                        (prev) => {
                                                            const newErrors = {
                                                                ...prev,
                                                            };
                                                            delete newErrors[
                                                                'clinic.terms_and_conditions_en'
                                                            ];
                                                            return newErrors;
                                                        },
                                                    );
                                                }
                                            }}
                                            onBlur={() =>
                                                handleFieldBlur(
                                                    'clinic.terms_and_conditions_en',
                                                )
                                            }
                                            placeholder={t(
                                                'enter_terms_and_conditions_en',
                                            )}
                                            rows={4}
                                            className={`${getFieldError('clinic.terms_and_conditions_en') ? 'border-red-500' : ''}`}
                                        />
                                        <InputError
                                            message={getFieldError(
                                                'clinic.terms_and_conditions_en',
                                            )}
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="terms_and_conditions_ar">
                                            {t('terms_and_conditions_ar')}
                                        </Label>
                                        <Textarea
                                            id="terms_and_conditions_ar"
                                            value={
                                                data.clinic
                                                    .terms_and_conditions_ar
                                            }
                                            maxLength={2000}
                                            onChange={(e) => {
                                                const value = e.target.value;
                                                const limitedValue =
                                                    value.slice(0, 2000);
                                                (setData as any)(
                                                    'clinic.terms_and_conditions_ar',
                                                    limitedValue,
                                                );
                                                const arabicPattern =
                                                    /^[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF\s\u0660-\u0669\u06F0-\u06F9.,;:!?\-_()[\]{}""''«»/]+$/u;
                                                if (value && value.trim()) {
                                                    if (
                                                        !arabicPattern.test(
                                                            value,
                                                        )
                                                    ) {
                                                        const fieldName =
                                                            t(
                                                                'terms_and_conditions_ar',
                                                            ) ||
                                                            'Terms & Conditions (Arabic)';
                                                        const errorMsg =
                                                            t(
                                                                'clinic_name_ar_must_be_arabic',
                                                            ) ||
                                                            t(
                                                                'field_must_be_arabic_only',
                                                            )?.replace(
                                                                ':attribute',
                                                                fieldName,
                                                            ) ||
                                                            `${fieldName} must contain only Arabic characters`;
                                                        setValidationErrors(
                                                            (prev) => ({
                                                                ...prev,
                                                                'clinic.terms_and_conditions_ar':
                                                                    errorMsg,
                                                            }),
                                                        );
                                                    } else {
                                                        setValidationErrors(
                                                            (prev) => {
                                                                const newErrors =
                                                                    { ...prev };
                                                                delete newErrors[
                                                                    'clinic.terms_and_conditions_ar'
                                                                ];
                                                                return newErrors;
                                                            },
                                                        );
                                                    }
                                                } else {
                                                    setValidationErrors(
                                                        (prev) => {
                                                            const newErrors = {
                                                                ...prev,
                                                            };
                                                            delete newErrors[
                                                                'clinic.terms_and_conditions_ar'
                                                            ];
                                                            return newErrors;
                                                        },
                                                    );
                                                }
                                            }}
                                            onBlur={() =>
                                                handleFieldBlur(
                                                    'clinic.terms_and_conditions_ar',
                                                )
                                            }
                                            placeholder={t(
                                                'enter_terms_and_conditions_ar',
                                            )}
                                            rows={4}
                                            className={`${getFieldError('clinic.terms_and_conditions_ar') ? 'border-red-500' : ''}`}
                                        />
                                        <InputError
                                            message={getFieldError(
                                                'clinic.terms_and_conditions_ar',
                                            )}
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Step 5: Operating Hours */}
                    {(showAsTabs
                        ? showUserFields
                            ? currentStep === 5
                            : currentStep === 4
                        : effectiveStep === 5) && (
                        <div className="space-y-6">
                            <div className="mb-6 flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <Clock className="h-6 w-6 text-primary" />
                                    <h2 className="text-2xl font-semibold text-foreground">
                                        {t('operating_hours')}
                                    </h2>
                                </div>
                                <span className="rounded-full bg-muted px-3 py-1 text-sm text-muted-foreground">
                                    {t('step')} {currentStep} {t('of')}{' '}
                                    {totalSteps}
                                </span>
                            </div>
                            
                            {(validationErrors['operating_hours'] ||
                                validationErrors['operating_hours.0']) && (
                                <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 dark:border-red-800 dark:bg-red-900/20">
                                    <InputError
                                        message={
                                            validationErrors[
                                                'operating_hours'
                                            ] ||
                                            validationErrors[
                                                'operating_hours.0'
                                            ]
                                        }
                                    />
                                </div>
                            )}
                            <div className="space-y-4">
                                {data.clinic.operating_hours.map(
                                    (hour, index) => {
                                        const dayInfo = DAYS_OF_WEEK.find(
                                            (d) => d.value === hour.day_of_week,
                                        );
                                        const dayLabel = dayInfo
                                            ? t(dayInfo.labelKey)
                                            : hour.day_of_week;
                                    
                                    return (
                                            <div
                                                key={index}
                                                className="space-y-4 rounded-lg border p-4"
                                            >
                                                <div
                                                    className={`flex items-center justify-between ${isRTL ? 'flex-row-reverse' : ''}`}
                                                >
                                                    <h4 className="font-semibold">
                                                        {dayLabel}
                                                    </h4>
                                                    <div
                                                        className={`flex items-center gap-4 ${isRTL ? 'flex-row-reverse' : ''}`}
                                                    >
                                                        <div
                                                            className={`flex items-center gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}
                                                        >
                                                        <Switch
                                                                checked={
                                                                    hour.is_open &&
                                                                    !hour.closed_all_day
                                                                }
                                                                onCheckedChange={(
                                                                    checked,
                                                                ) => {
                                                                    updateOperatingHourMultiple(
                                                                        index,
                                                                        {
                                                                            closed_all_day:
                                                                                !checked,
                                                                            is_open:
                                                                                checked,
                                                                        },
                                                                    );
                                                                    if (
                                                                        validationErrors[
                                                                            'operating_hours'
                                                                        ] ||
                                                                        validationErrors[
                                                                            'operating_hours.0'
                                                                        ]
                                                                    ) {
                                                                        setValidationErrors(
                                                                            (
                                                                                prev,
                                                                            ) => {
                                                                                const newErrors =
                                                                                    {
                                                                                        ...prev,
                                                                                    };
                                                                                delete newErrors[
                                                                                    'operating_hours'
                                                                                ];
                                                                                delete newErrors[
                                                                                    'operating_hours.0'
                                                                                ];
                                                                        return newErrors;
                                                                            },
                                                                        );
                                                                }
                                                                    if (
                                                                        validationErrors[
                                                                            `operating_hours.${index}`
                                                                        ]
                                                                    ) {
                                                                        setValidationErrors(
                                                                            (
                                                                                prev,
                                                                            ) => {
                                                                                const newErrors =
                                                                                    {
                                                                                        ...prev,
                                                                                    };
                                                                                delete newErrors[
                                                                                    `operating_hours.${index}`
                                                                                ];
                                                                        return newErrors;
                                                                            },
                                                                        );
                                                                }
                                                            }}
                                                        />
                                                            <Label>
                                                                {t('open')}
                                                            </Label>
                                                    </div>
                                                </div>
                                            </div>

                                            {!hour.closed_all_day && (
                                                <div className="grid grid-cols-2 gap-4">
                                                    <div className="space-y-2">
                                                            <Label>
                                                                {t(
                                                                    'opening_time',
                                                                )}
                                                            </Label>
                                                        <Input
                                                            type="time"
                                                                value={
                                                                    hour.opening_time ||
                                                                    ''
                                                                }
                                                                onChange={(
                                                                    e,
                                                                ) => {
                                                                    updateOperatingHour(
                                                                        index,
                                                                        'opening_time',
                                                                        e.target
                                                                            .value,
                                                                    );
                                                            }}
                                                            className={`${validationErrors[`operating_hours.${index}`] ? 'border-red-500' : ''}`}
                                                        />
                                                    </div>
                                                    <div className="space-y-2">
                                                            <Label>
                                                                {t(
                                                                    'closing_time',
                                                                )}
                                                            </Label>
                                                        <Input
                                                            type="time"
                                                                value={
                                                                    hour.closing_time ||
                                                                    ''
                                                                }
                                                                onChange={(
                                                                    e,
                                                                ) => {
                                                                    updateOperatingHour(
                                                                        index,
                                                                        'closing_time',
                                                                        e.target
                                                                            .value,
                                                                    );
                                                            }}
                                                            className={`${validationErrors[`operating_hours.${index}`] ? 'border-red-500' : ''}`}
                                                        />
                                                    </div>
                                                        {validationErrors[
                                                            `operating_hours.${index}`
                                                        ] && (
                                                        <div className="col-span-2">
                                                                <InputError
                                                                    message={
                                                                        validationErrors[
                                                                            `operating_hours.${index}`
                                                                        ]
                                                                    }
                                                                />
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    );
                                    },
                                )}
                            </div>
                        </div>
                    )}

                    {/* Step 6: Documents */}
                    {(showAsTabs
                        ? showUserFields
                            ? currentStep === 6
                            : currentStep === 5
                        : effectiveStep === 6) && (
                        <div className="space-y-6">
                            <div className="mb-6 flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <Upload className="h-6 w-6 text-primary" />
                                    <h2 className="text-2xl font-semibold text-foreground">
                                        {t('documents')}
                                    </h2>
                                </div>
                                <span className="rounded-full bg-muted px-3 py-1 text-sm text-muted-foreground">
                                    {t('step')} {currentStep} {t('of')}{' '}
                                    {totalSteps}
                                </span>
                            </div>

                            <div className="space-y-4">
                                <div className="rounded-lg border border-blue-200 bg-blue-50 p-3 dark:border-blue-800 dark:bg-blue-900/20">
                                    <p className="text-sm text-blue-800 dark:text-blue-200">
                                        {t('documents_upload_info')}
                                    </p>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="business_license">
                                        {t('business_license')}{' '}
                                        <span className="text-red-500">*</span>
                                    </Label>
                                    <div className="flex items-center gap-4">
                                        <div className="flex-1 rounded-lg border-2 border-dashed border-border p-3">
                                            <Input
                                                id="business_license"
                                                type="file"
                                                accept=".pdf,.jpg,.jpeg,.png"
                                                onChange={(e) =>
                                                    handleFileChange(
                                                        'business_license',
                                                        e.target.files?.[0] ||
                                                            null,
                                                        setBusinessLicensePreview,
                                                        setBusinessLicenseFileName,
                                                    )
                                                }
                                                className="hidden"
                                            />
                                            <Label
                                                htmlFor="business_license"
                                                className="flex cursor-pointer flex-col items-center gap-1"
                                            >
                                                <Upload className="h-6 w-6 text-muted-foreground" />
                                                <span className="text-xs text-primary hover:underline">
                                                    {t('click_to_upload')}
                                                </span>
                                                <p className="text-xs text-muted-foreground">
                                                    PDF, JPG, PNG (Max 10MB)
                                                </p>
                                            </Label>
                                        </div>
                                        {(businessLicensePreview ||
                                            businessLicenseFileName) && (
                                            <div className="flex-shrink-0">
                                                {businessLicensePreview &&
                                                businessLicensePreview !==
                                                    'pdf' &&
                                                businessLicensePreview !==
                                                    'large-image' ? (
                                                    <div className="relative">
                                                        <img
                                                            src={
                                                                businessLicensePreview
                                                            }
                                                            alt="Business License Preview"
                                                            className="h-12 w-auto rounded border"
                                                        />
                                                        <Button
                                                            type="button"
                                                            variant="destructive"
                                                            size="sm"
                                                            className="absolute -top-2 -right-2 h-5 w-5 rounded-full p-0"
                                                            onClick={() => {
                                                                setBusinessLicensePreview(
                                                                    null,
                                                                );
                                                                setBusinessLicenseFileName(
                                                                    null,
                                                                );
                                                                (
                                                                    setData as any
                                                                )(
                                                                    'clinic.business_license',
                                                                    null,
                                                                );
                                                                const input =
                                                                    document.getElementById(
                                                                        'business_license',
                                                                    ) as HTMLInputElement;
                                                                if (input)
                                                                    input.value =
                                                                        '';
                                                            }}
                                                        >
                                                            ×
                                                        </Button>
                                                    </div>
                                                ) : (
                                                    <div className="flex items-center gap-2 rounded bg-green-50 px-2 py-1 text-xs text-green-600 dark:bg-green-900/20">
                                                        <Check className="h-3 w-3" />
                                                        <span className="max-w-[120px] truncate">
                                                            {businessLicenseFileName ||
                                                                t(
                                                                    'file_uploaded',
                                                                )}
                                                        </span>
                                                        <Button
                                                            type="button"
                                                            variant="ghost"
                                                            size="sm"
                                                            className="h-5 px-1 text-xs"
                                                            onClick={() => {
                                                                setBusinessLicensePreview(
                                                                    null,
                                                                );
                                                                setBusinessLicenseFileName(
                                                                    null,
                                                                );
                                                                (
                                                                    setData as any
                                                                )(
                                                                    'clinic.business_license',
                                                                    null,
                                                                );
                                                                const input =
                                                                    document.getElementById(
                                                                        'business_license',
                                                                    ) as HTMLInputElement;
                                                                if (input)
                                                                    input.value =
                                                                        '';
                                                            }}
                                                        >
                                                            ×
                                                        </Button>
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                    <InputError
                                        message={
                                            formErrors[
                                                'clinic.business_license'
                                            ] ||
                                            (externalErrors as any)[
                                                'clinic.business_license'
                                            ] ||
                                            validationErrors[
                                                'clinic.business_license'
                                            ]
                                        }
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="id_document_front">
                                        {t('id_document_front')}{' '}
                                        <span className="text-red-500">*</span>
                                    </Label>
                                    <div className="flex items-center gap-4">
                                        <div className="flex-1 rounded-lg border-2 border-dashed border-border p-3">
                                            <Input
                                                id="id_document_front"
                                                type="file"
                                                accept=".pdf,.jpg,.jpeg,.png"
                                                onChange={(e) =>
                                                    handleFileChange(
                                                        'id_document_front',
                                                        e.target.files?.[0] ||
                                                            null,
                                                        setIdDocumentFrontPreview,
                                                        setIdDocumentFrontFileName,
                                                    )
                                                }
                                                className="hidden"
                                            />
                                            <Label
                                                htmlFor="id_document_front"
                                                className="flex cursor-pointer flex-col items-center gap-1"
                                            >
                                                <Upload className="h-6 w-6 text-muted-foreground" />
                                                <span className="text-xs text-primary hover:underline">
                                                    {t('click_to_upload')}
                                                </span>
                                                <p className="text-xs text-muted-foreground">
                                                    PDF, JPG, PNG (Max 10MB)
                                                </p>
                                            </Label>
                                        </div>
                                        {(idDocumentFrontPreview ||
                                            idDocumentFrontFileName) && (
                                            <div className="flex-shrink-0">
                                                {idDocumentFrontPreview &&
                                                idDocumentFrontPreview !==
                                                    'pdf' &&
                                                idDocumentFrontPreview !==
                                                    'large-image' ? (
                                                    <div className="relative">
                                                        <img
                                                            src={
                                                                idDocumentFrontPreview
                                                            }
                                                            alt="ID Document Front Preview"
                                                            className="h-12 w-auto rounded border"
                                                        />
                                                        <Button
                                                            type="button"
                                                            variant="destructive"
                                                            size="sm"
                                                            className="absolute -top-2 -right-2 h-5 w-5 rounded-full p-0"
                                                            onClick={() => {
                                                                setIdDocumentFrontPreview(
                                                                    null,
                                                                );
                                                                setIdDocumentFrontFileName(
                                                                    null,
                                                                );
                                                                (
                                                                    setData as any
                                                                )(
                                                                    'clinic.id_document_front',
                                                                    null,
                                                                );
                                                                const input =
                                                                    document.getElementById(
                                                                        'id_document_front',
                                                                    ) as HTMLInputElement;
                                                                if (input)
                                                                    input.value =
                                                                        '';
                                                            }}
                                                        >
                                                            ×
                                                        </Button>
                                                    </div>
                                                ) : (
                                                    <div className="flex items-center gap-2 rounded bg-green-50 px-2 py-1 text-xs text-green-600 dark:bg-green-900/20">
                                                        <Check className="h-3 w-3" />
                                                        <span className="max-w-[120px] truncate">
                                                            {idDocumentFrontFileName ||
                                                                t(
                                                                    'file_uploaded',
                                                                )}
                                                        </span>
                                                        <Button
                                                            type="button"
                                                            variant="ghost"
                                                            size="sm"
                                                            className="h-5 px-1 text-xs"
                                                            onClick={() => {
                                                                setIdDocumentFrontPreview(
                                                                    null,
                                                                );
                                                                setIdDocumentFrontFileName(
                                                                    null,
                                                                );
                                                                (
                                                                    setData as any
                                                                )(
                                                                    'clinic.id_document_front',
                                                                    null,
                                                                );
                                                                const input =
                                                                    document.getElementById(
                                                                        'id_document_front',
                                                                    ) as HTMLInputElement;
                                                                if (input)
                                                                    input.value =
                                                                        '';
                                                            }}
                                                        >
                                                            ×
                                                        </Button>
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                    <InputError
                                        message={
                                            formErrors[
                                                'clinic.id_document_front'
                                            ] ||
                                            (externalErrors as any)[
                                                'clinic.id_document_front'
                                            ] ||
                                            validationErrors[
                                                'clinic.id_document_front'
                                            ]
                                        }
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="id_document_back">
                                        {t('id_document_back')} ({t('optional')}
                                        )
                                    </Label>
                                    <div className="flex items-center gap-4">
                                        <div className="flex-1 rounded-lg border-2 border-dashed border-border p-3">
                                            <Input
                                                id="id_document_back"
                                                type="file"
                                                accept=".pdf,.jpg,.jpeg,.png"
                                                onChange={(e) =>
                                                    handleFileChange(
                                                        'id_document_back',
                                                        e.target.files?.[0] ||
                                                            null,
                                                        setIdDocumentBackPreview,
                                                        setIdDocumentBackFileName,
                                                    )
                                                }
                                                className="hidden"
                                            />
                                            <Label
                                                htmlFor="id_document_back"
                                                className="flex cursor-pointer flex-col items-center gap-1"
                                            >
                                                <Upload className="h-6 w-6 text-muted-foreground" />
                                                <span className="text-xs text-primary hover:underline">
                                                    {t('click_to_upload')}
                                                </span>
                                                <p className="text-xs text-muted-foreground">
                                                    PDF, JPG, PNG (Max 10MB)
                                                </p>
                                            </Label>
                                        </div>
                                        {(idDocumentBackPreview ||
                                            idDocumentBackFileName) && (
                                            <div className="flex-shrink-0">
                                                {idDocumentBackPreview &&
                                                idDocumentBackPreview !==
                                                    'pdf' &&
                                                idDocumentBackPreview !==
                                                    'large-image' ? (
                                                    <div className="relative">
                                                        <img
                                                            src={
                                                                idDocumentBackPreview
                                                            }
                                                            alt="ID Document Back Preview"
                                                            className="h-12 w-auto rounded border"
                                                        />
                                                        <Button
                                                            type="button"
                                                            variant="destructive"
                                                            size="sm"
                                                            className="absolute -top-2 -right-2 h-5 w-5 rounded-full p-0"
                                                            onClick={() => {
                                                                setIdDocumentBackPreview(
                                                                    null,
                                                                );
                                                                setIdDocumentBackFileName(
                                                                    null,
                                                                );
                                                                (
                                                                    setData as any
                                                                )(
                                                                    'clinic.id_document_back',
                                                                    null,
                                                                );
                                                                const input =
                                                                    document.getElementById(
                                                                        'id_document_back',
                                                                    ) as HTMLInputElement;
                                                                if (input)
                                                                    input.value =
                                                                        '';
                                                            }}
                                                        >
                                                            ×
                                                        </Button>
                                                    </div>
                                                ) : (
                                                    <div className="flex items-center gap-2 rounded bg-green-50 px-2 py-1 text-xs text-green-600 dark:bg-green-900/20">
                                                        <Check className="h-3 w-3" />
                                                        <span className="max-w-[120px] truncate">
                                                            {idDocumentBackFileName ||
                                                                t(
                                                                    'file_uploaded',
                                                                )}
                                                        </span>
                                                        <Button
                                                            type="button"
                                                            variant="ghost"
                                                            size="sm"
                                                            className="h-5 px-1 text-xs"
                                                            onClick={() => {
                                                                setIdDocumentBackPreview(
                                                                    null,
                                                                );
                                                                setIdDocumentBackFileName(
                                                                    null,
                                                                );
                                                                (
                                                                    setData as any
                                                                )(
                                                                    'clinic.id_document_back',
                                                                    null,
                                                                );
                                                                const input =
                                                                    document.getElementById(
                                                                        'id_document_back',
                                                                    ) as HTMLInputElement;
                                                                if (input)
                                                                    input.value =
                                                                        '';
                                                            }}
                                                        >
                                                            ×
                                                        </Button>
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Step 7: Subscription - COMMENTED OUT */}
                    {false && (showAsTabs
                        ? showUserFields
                            ? currentStep === 7
                            : currentStep === 6
                        : effectiveStep === 7) && (
                        <div className="space-y-6">
                            <div className="mb-6 flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <CreditCard className="h-6 w-6 text-primary" />
                                    <h2 className="text-2xl font-semibold text-foreground">
                                        {t('subscription')}
                                    </h2>
                                </div>
                                <span className="rounded-full bg-muted px-3 py-1 text-sm text-muted-foreground">
                                    {t('step')} {currentStep} {t('of')}{' '}
                                    {totalSteps}
                                </span>
                            </div>

                            <div className="mb-6 rounded-lg border border-blue-200 bg-blue-50 p-4 dark:border-blue-800 dark:bg-blue-900/20">
                                <p className="text-sm text-blue-800 dark:text-blue-200">
                                    {t('subscription_selection_info') ||
                                        'Select a subscription package for your clinic. You can change this later.'}
                                </p>
                            </div>

                            {subscriptionPackages &&
                            subscriptionPackages.length > 0 ? (
                                <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
                                    <div
                                        onClick={() => {
                                            (setData as any)(
                                                'clinic.subscription_package_id',
                                                '',
                                            );
                                            if (
                                                validationErrors[
                                                    'clinic.subscription_package_id'
                                                ]
                                            ) {
                                                setValidationErrors((prev) => {
                                                    const newErrors = {
                                                        ...prev,
                                                    };
                                                    delete newErrors[
                                                        'clinic.subscription_package_id'
                                                    ];
                                                    return newErrors;
                                                });
                                            }
                                        }}
                                        className={`relative cursor-pointer rounded-lg border-2 p-6 transition-all ${
                                            !data.clinic.subscription_package_id
                                                ? 'border-primary bg-primary/5'
                                                : 'border-border hover:border-primary/50'
                                        } `}
                                    >
                                        <div className="mb-4 flex items-center justify-between">
                                            <h3 className="text-lg font-semibold">
                                                {t('no_subscription') ||
                                                    'No Subscription'}
                                            </h3>
                                            {!data.clinic
                                                .subscription_package_id && (
                                                <div className="flex h-5 w-5 items-center justify-center rounded-full bg-primary">
                                                    <Check className="h-3 w-3 text-white" />
                                                </div>
                                            )}
                                        </div>
                                        <p className="mb-4 text-sm text-muted-foreground">
                                            {t('no_subscription_description') ||
                                                'Continue without a subscription package. You can subscribe later.'}
                                        </p>
                                        <div className="text-2xl font-bold">
                                            {t('free') || 'Free'}
                                        </div>
                                    </div>

                                    {subscriptionPackages.map((pkg) => {
                                        const isSelected =
                                            data.clinic
                                                .subscription_package_id ===
                                            pkg.id.toString();
                                        const packageName =
                                            isRTL
                                                ? pkg.name_ar
                                                : pkg.name_en;
                                        const packageDescription =
                                            isRTL
                                                ? pkg.description_ar ||
                                                  pkg.description_en
                                                : pkg.description_en ||
                                                  pkg.description_ar;
                                        
                                        return (
                                            <div
                                                key={pkg.id}
                                                onClick={() => {
                                                    (setData as any)(
                                                        'clinic.subscription_package_id',
                                                        pkg.id.toString(),
                                                    );
                                                    if (
                                                        validationErrors[
                                                            'clinic.subscription_package_id'
                                                        ]
                                                    ) {
                                                        setValidationErrors(
                                                            (prev) => {
                                                                const newErrors =
                                                                    { ...prev };
                                                                delete newErrors[
                                                                    'clinic.subscription_package_id'
                                                                ];
                                                            return newErrors;
                                                            },
                                                        );
                                                    }
                                                }}
                                                className={`relative cursor-pointer rounded-lg border-2 p-6 transition-all ${
                                                    isSelected
                                                        ? 'border-primary bg-primary/5'
                                                        : 'border-border hover:border-primary/50'
                                                } `}
                                            >
                                                {isSelected && (
                                                    <div className="absolute top-4 right-4 flex h-5 w-5 items-center justify-center rounded-full bg-primary">
                                                        <Check className="h-3 w-3 text-white" />
                                                    </div>
                                                )}
                                                <div className="mb-4">
                                                    <h3 className="mb-2 text-lg font-semibold">
                                                        {packageName}
                                                    </h3>
                                                    {packageDescription && (
                                                        <p className="line-clamp-2 text-sm text-muted-foreground">
                                                            {packageDescription}
                                                        </p>
                                                    )}
                                                </div>
                                                <div className="mb-4 flex items-baseline gap-2">
                                                    <span className="text-2xl font-bold">
                                                        {pkg.price || '0'}{' '}
                                                        {pkg.currency || 'KWD'}
                                                    </span>
                                                    <span className="text-sm text-muted-foreground">
                                                        /{' '}
                                                        {pkg.billing_cycle ===
                                                        'monthly'
                                                            ? t('month')
                                                            : t('year')}
                                                    </span>
                                                </div>
                                                {pkg.features &&
                                                    Array.isArray(
                                                        pkg.features,
                                                    ) &&
                                                    pkg.features.length > 0 && (
                                                    <ul className="space-y-2 text-sm text-muted-foreground">
                                                            {pkg.features
                                                                .slice(0, 3)
                                                                .map(
                                                                    (
                                                                        feature,
                                                                        idx,
                                                                    ) => (
                                                                        <li
                                                                            key={
                                                                                idx
                                                                            }
                                                                            className="flex items-start gap-2"
                                                                        >
                                                                            <Check className="mt-0.5 h-4 w-4 flex-shrink-0 text-primary" />
                                                                            <span>
                                                                                {
                                                                                    feature
                                                                                }
                                                                            </span>
                                                            </li>
                                                                    ),
                                                                )}
                                                            {pkg.features
                                                                .length > 3 && (
                                                            <li className="text-xs text-muted-foreground">
                                                                    +
                                                                    {pkg
                                                                        .features
                                                                        .length -
                                                                        3}{' '}
                                                                    {t(
                                                                        'more_features',
                                                                    ) ||
                                                                        'more features'}
                                                            </li>
                                                        )}
                                                    </ul>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            ) : (
                                <div className="py-12 text-center">
                                    <p className="text-muted-foreground">
                                        {t(
                                            'no_subscription_packages_available',
                                        ) ||
                                            'No subscription packages available at the moment.'}
                                    </p>
                                </div>
                            )}
                            <InputError
                                message={
                                    formErrors[
                                        'clinic.subscription_package_id'
                                    ] ||
                                    (externalErrors as any)[
                                        'clinic.subscription_package_id'
                                    ] ||
                                    validationErrors[
                                        'clinic.subscription_package_id'
                                    ]
                                }
                            />
                        </div>
                    )}
                </div>
            </div>

            {/* Navigation Buttons */}
            {!readOnly && !hideNavigation && (
                <div
                    className={`mt-8 flex items-center justify-between border-t pt-6 ${flexDirection}`}
                >
                    <Button
                        type="button"
                        variant="outline"
                        onClick={() => {
                            if (currentStep > 1) {
                                setCurrentStep(currentStep - 1);
                                onStepChange?.(currentStep - 1);
                            }
                        }}
                        disabled={currentStep === 1}
                        className={`flex items-center gap-2 ${flexDirection}`}
                    >
                        {isRTL ? (
                            <>
                                {t('previous')}
                                <ChevronRight className={iconMargin('md')} />
                            </>
                        ) : (
                            <>
                                <ChevronLeft className={iconMargin('md')} />
                                {t('previous')}
                            </>
                        )}
                    </Button>

                    <div
                        className={`flex items-center gap-3 ${flexDirection}`}
                    >
                        {currentStep < totalSteps ? (
                            <Button
                                type="button"
                                onClick={handleNextStep}
                                disabled={isNextLoading}
                                className={`flex items-center gap-2 ${flexDirection}`}
                            >
                                {isNextLoading ? (
                                    <>
                                        <LoaderCircle
                                            className={`h-4 w-4 ${iconMargin('md')} animate-spin`}
                                        />
                                        {t('validating') ||
                                            t('loading') ||
                                            'Loading...'}
                                    </>
                                ) : isRTL ? (
                                    <>
                                        <ChevronLeft className={iconMargin('md')} />
                                        {t('next')}
                                    </>
                                ) : (
                                    <>
                                        {t('next')}
                                        <ChevronRight className={iconMargin('md')} />
                                    </>
                                )}
                            </Button>
                        ) : (
                            <Button 
                                type="button"
                                onClick={() => {
                                    setIsSubmitting(true);
                                    if (onSubmit) {
                                        onSubmit(data);
                                    }
                                }}
                                disabled={processing || isSubmitting}
                                className={`flex items-center gap-2 ${flexDirection}`}
                            >
                                {processing || isSubmitting ? (
                                    <>
                                        <LoaderCircle
                                            className={`h-4 w-4 ${iconMargin('md')} animate-spin`}
                                        />
                                        {t('submitting') ||
                                            t('loading') ||
                                            'Submitting...'}
                                    </>
                                ) : (
                                    <>
                                        <Upload
                                            className={`h-4 w-4 ${iconMargin('md')}`}
                                        />
                                        {mode === 'edit'
                                            ? t('update_clinic')
                                            : mode === 'register'
                                              ? t('submit_application')
                                              : t('create_clinic')}
                                    </>
                                )}
                            </Button>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
