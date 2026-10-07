export interface ClinicFormStepProps {
    data: any;
    setData: (key: string, value: any) => void;
    errors?: Record<string, string>;
    locale?: 'en' | 'ar';
    readOnly?: boolean;
    onDataChange?: (data: any) => void;
}

export interface ClinicBasicInfoStepProps extends ClinicFormStepProps {
    categories: Array<{ id: number; name_en: string; name_ar: string }>;
    logoPreview?: string | null;
    logoFileName?: string | null;
    onLogoChange?: (file: File | null) => void;
    onLogoRemove?: () => void;
    checkingEmail?: boolean;
    getFieldError?: (field: string) => string | undefined;
    validationErrors?: Record<string, string>;
    formErrors?: Record<string, string>;
}

export interface AddressLocationStepProps extends ClinicFormStepProps {
    governorates: Array<{ id: number; name_en: string; name_ar: string }>;
    areas: Array<{ id: number; name_en: string; name_ar: string; governorate_id: number }>;
    selectedGovernorate: number | null;
    onGovernorateChange: (governorateId: string) => void;
    getFieldError?: (field: string) => string | undefined;
    validationErrors?: Record<string, string>;
    formErrors?: Record<string, string>;
}

export interface SettingsPoliciesStepProps extends ClinicFormStepProps {
    getFieldError?: (field: string) => string | undefined;
    validationErrors?: Record<string, string>;
    formErrors?: Record<string, string>;
}

export interface OperatingHoursStepProps extends ClinicFormStepProps {
    operatingHours: Array<{
        day_of_week: string;
        is_open: boolean;
        closed_all_day: boolean;
        opening_time: string;
        closing_time: string;
    }>;
    onOperatingHourChange: (index: number, field: string, value: any) => void;
    onOperatingHourMultipleChange: (index: number, updates: Partial<OperatingHoursStepProps['operatingHours'][0]>) => void;
    validationErrors?: Record<string, string>;
    daysOfWeek: Array<{ value: string; labelKey: string }>;
}

export interface DocumentsStepProps extends ClinicFormStepProps {
    businessLicensePreview?: string | null;
    businessLicenseFileName?: string | null;
    onBusinessLicenseChange?: (file: File | null) => void;
    onBusinessLicenseRemove?: () => void;
    idDocumentFrontPreview?: string | null;
    idDocumentFrontFileName?: string | null;
    onIdDocumentFrontChange?: (file: File | null) => void;
    onIdDocumentFrontRemove?: () => void;
    idDocumentBackPreview?: string | null;
    idDocumentBackFileName?: string | null;
    onIdDocumentBackChange?: (file: File | null) => void;
    onIdDocumentBackRemove?: () => void;
    validationErrors?: Record<string, string>;
    formErrors?: Record<string, string>;
}

export interface SubscriptionStepProps extends ClinicFormStepProps {
    subscriptionPackages: Array<{
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
    }>;
    validationErrors?: Record<string, string>;
    formErrors?: Record<string, string>;
}

export interface AccountInformationStepProps extends ClinicFormStepProps {
    mode?: 'register' | 'create' | 'edit' | 'view';
    ownerMode?: 'select' | 'create';
    onOwnerModeChange?: (mode: 'select' | 'create') => void;
    users?: Array<{ id: number; name: string; email: string }>;
    user_id?: string;
    onUserIdChange?: (userId: string) => void;
    showUserFields?: boolean;
    validationErrors?: Record<string, string>;
    formErrors?: Record<string, string>;
    onFieldBlur?: (field: string) => void;
    checkingEmail?: boolean;
    checkingPhone?: boolean;
}

