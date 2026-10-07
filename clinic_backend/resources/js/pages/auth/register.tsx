import { login } from '@/routes';
import { Head, useForm, usePage, Link } from '@inertiajs/react';
import { LoaderCircle, Upload, ChevronRight, ChevronLeft, Check, MapPin, Building2, Settings, Clock, FileText, CreditCard } from 'lucide-react';
import { useState, FormEventHandler, useEffect, useCallback, useMemo } from 'react';
import { type SharedData } from '@/types';

import InputError from '@/components/input-error';
import TextLink from '@/components/text-link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { useTranslation } from '@/hooks/use-translation';
import { useRTLInit } from '@/hooks/use-rtl-init';
import { useRTL } from '@/hooks/use-rtl';
import { customToast } from '@/components/ui/custom-toast';
import { Progress } from '@/components/ui/progress';
import { LanguageSwitcher } from '@/components/language-switcher';
import { PasswordInput } from '@/components/password-input';
import { PhoneInput } from '@/components/phone-input';
import { AddressAutocomplete } from '@/components/address-autocomplete';
import { getLocalizedName } from '@/utils/localization';
import { cn } from '@/lib/utils';

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

interface OperatingHour {
    day_of_week: string;
    is_open: boolean;
    closed_all_day: boolean;
    opening_time: string;
    closing_time: string;
}

interface RegisterPageProps {
    governorates?: Governorate[];
    categories?: Category[];
    subscriptionPackages?: SubscriptionPackage[];
}

// Days of week will be translated in the component using t() function
const DAYS_OF_WEEK = [
    { value: 'monday', labelKey: 'monday' },
    { value: 'tuesday', labelKey: 'tuesday' },
    { value: 'wednesday', labelKey: 'wednesday' },
    { value: 'thursday', labelKey: 'thursday' },
    { value: 'friday', labelKey: 'friday' },
    { value: 'saturday', labelKey: 'saturday' },
    { value: 'sunday', labelKey: 'sunday' },
];

const TOTAL_STEPS = 6; // Changed from 7 to 6 - subscription step commented out

export default function Register({ governorates = [], categories = [], subscriptionPackages = [] }: RegisterPageProps) {
    useRTLInit();
    const { t, locale } = useTranslation();
    const page = usePage<SharedData>();
    const { locale: pageLocale, siteSettings } = page.props;
    
    // Force RTL detection from page props
    const isRTL = pageLocale === 'ar';
    const dir = isRTL ? 'rtl' : 'ltr';
    const flexDirection = isRTL ? 'flex-row-reverse' : 'flex-row';
    
    const { 
        iconMargin, 
        getFieldDir, 
        getInputTextAlign 
    } = useRTL();
    
    const appName = getLocalizedName(siteSettings?.app_name_en, siteSettings?.app_name_ar, locale) || t('app_name');
    const appLogo = siteSettings?.app_logo;
    const appInitial = appName.charAt(0).toUpperCase();
    // Always start at step 1 - no persistence on refresh
    const [currentStep, setCurrentStep] = useState(1);
    
    // Clear all sessionStorage on mount to ensure fresh start
    useEffect(() => {
        // Clear all registration-related sessionStorage
        sessionStorage.removeItem('registerCurrentStep');
        sessionStorage.removeItem('registerFormData');
        
        // Reset to step 1 on every page load/refresh
        setCurrentStep(1);
        
        // Clear sessionStorage when user navigates away
        const handleBeforeUnload = () => {
            sessionStorage.removeItem('registerCurrentStep');
            sessionStorage.removeItem('registerFormData');
        };
        
        window.addEventListener('beforeunload', handleBeforeUnload);
        return () => {
            window.removeEventListener('beforeunload', handleBeforeUnload);
        };
    }, []);
    const [areas, setAreas] = useState<Area[]>([]);
    const [selectedGovernorate, setSelectedGovernorate] = useState<number | null>(null);
    const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
    const [touchedFields, setTouchedFields] = useState<Set<string>>(new Set());
    const [checkingEmail, setCheckingEmail] = useState(false);
    const [validating, setValidating] = useState(false);
    
    // Helper function for phone validation (accessible outside validateStep)
    const isValidPhone = (phone: string): boolean => {
        if (!phone.trim()) return false;
        const phoneRegex = /^\+965\d{8}$/;
        return phoneRegex.test(phone.replace(/\s/g, ''));
    };
    
    // Don't save step to sessionStorage - always start fresh on page load
    
    // Debug: Log received data
    useEffect(() => {
        if (governorates && governorates.length > 0) {
            console.log('Governorates loaded:', governorates.length);
        } else {
            console.warn('No governorates received');
        }
        if (categories && categories.length > 0) {
            console.log('Categories loaded:', categories.length);
        } else {
            console.warn('No categories received');
        }
    }, [governorates, categories]);
    const [logoPreview, setLogoPreview] = useState<string | null>(null);
    const [businessLicensePreview, setBusinessLicensePreview] = useState<string | null>(null);
    const [businessLicenseFileName, setBusinessLicenseFileName] = useState<string | null>(null);
    const [idDocumentFrontPreview, setIdDocumentFrontPreview] = useState<string | null>(null);
    const [idDocumentFrontFileName, setIdDocumentFrontFileName] = useState<string | null>(null);
    const [idDocumentBackPreview, setIdDocumentBackPreview] = useState<string | null>(null);
    const [idDocumentBackFileName, setIdDocumentBackFileName] = useState<string | null>(null);

    const defaultOperatingHours: OperatingHour[] = DAYS_OF_WEEK.map(day => ({
    day_of_week: day.value,
        is_open: true,
        closed_all_day: false,
    opening_time: '09:00',
    closing_time: '17:00',
    }));

    const { data, setData, processing, errors, post } = useForm({
        // User fields
        name: '',
        email: '',
        phone: '',
        password: '',
        password_confirmation: '',
        
        // Clinic basic information
        clinic: {
            name_en: '',
            name_ar: '',
            bio_en: '',
            bio_ar: '',
            phone: '',
            email: '',
            category_id: '',
            logo: null as File | null,
            
            // Address fields
            governorate_id: '',
            area_id: '',
            address: '',
            block: '',
            street: '',
            avenue: '',
            house: '',
            floor: '',
            apt: '',
            city: '',
            state: '',
            country: 'Kuwait',
            postal_code: '',
            latitude: '',
            longitude: '',
            
            // Settings
            auto_confirm_bookings: false,
            cancellation_policy_en: '',
            cancellation_policy_ar: '',
            refund_policy_en: '',
            refund_policy_ar: '',
            privacy_policy_en: '',
            privacy_policy_ar: '',
            terms_and_conditions_en: '',
            terms_and_conditions_ar: '',
            reschedule_policy_en: '',
            reschedule_policy_ar: '',
            
            // Documents
            business_license: null as File | null,
            id_document_front: null as File | null,
            id_document_back: null as File | null,
            
            // Operating hours
            operating_hours: defaultOperatingHours,
            
            // Subscription - COMMENTED OUT
            // subscription_package_id: '',
        },
    });

    // Handle address autocomplete change
    const handleAddressChange = useCallback((components: {
        address?: string;
        block?: string;
        street?: string;
        avenue?: string;
        house?: string;
        floor?: string;
        apt?: string;
        city?: string;
        state?: string;
        country?: string;
        postal_code?: string;
        latitude?: string;
        longitude?: string;
    }) => {
        if (components.address) {
            setData('clinic.address', components.address);
        }
        if (components.block !== undefined) {
            setData('clinic.block', components.block || '');
        }
        if (components.street !== undefined) {
            setData('clinic.street', components.street || '');
        }
        if (components.avenue !== undefined) {
            setData('clinic.avenue', components.avenue || '');
        }
        if (components.house !== undefined) {
            setData('clinic.house', components.house || '');
        }
        if (components.floor !== undefined) {
            setData('clinic.floor', components.floor || '');
        }
        if (components.apt !== undefined) {
            setData('clinic.apt', components.apt || '');
        }
        if (components.city !== undefined) {
            setData('clinic.city', components.city || '');
        }
        if (components.state !== undefined) {
            setData('clinic.state', components.state || '');
        }
        if (components.country !== undefined) {
            setData('clinic.country', components.country || 'Kuwait');
        }
        if (components.postal_code !== undefined) {
            setData('clinic.postal_code', components.postal_code || '');
        }
        if (components.latitude !== undefined) {
            setData('clinic.latitude', components.latitude || '');
        }
        if (components.longitude !== undefined) {
            setData('clinic.longitude', components.longitude || '');
        }
    }, [setData]);

    const handleGovernorateChange = async (governorateId: string) => {
        setData('clinic.governorate_id', governorateId);
        setSelectedGovernorate(parseInt(governorateId));
        
        if (governorateId) {
            try {
                const response = await fetch(`/api/governorates/${governorateId}/areas`, {
                    method: 'GET',
                    headers: {
                        'Accept': 'application/json',
                        'Content-Type': 'application/json',
                    },
                });
                
                if (response.ok) {
                    const areasData = await response.json();
                    setAreas(areasData || []);
                } else {
                    console.error('Failed to fetch areas:', response.status, response.statusText);
                    setAreas([]);
                }
            } catch (error) {
                console.error('Error fetching areas:', error);
                setAreas([]);
            }
        } else {
            setAreas([]);
            setData('clinic.area_id', '');
        }
    };

    const handleFileChange = (
        field: 'logo' | 'business_license' | 'id_document_front' | 'id_document_back', 
        file: File | null, 
        previewSetter?: (preview: string) => void,
        fileNameSetter?: (fileName: string) => void
    ) => {
        // Clear previews and file names first
        if (previewSetter) previewSetter('');
        if (fileNameSetter) fileNameSetter('');
        
        // Clear file data if no file selected
        if (!file) {
            if (field === 'logo') {
                setData('clinic.logo', null);
            } else if (field === 'business_license') {
                setData('clinic.business_license', null);
            } else if (field === 'id_document_front') {
                setData('clinic.id_document_front', null);
            } else if (field === 'id_document_back') {
                setData('clinic.id_document_back', null);
            }
                    return;
                }

        try {
            // Validate file type for logo (only JPG, JPEG, PNG allowed)
            if (field === 'logo') {
                const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png'];
                const fileExtension = file.name.split('.').pop()?.toLowerCase();
                const isValidType = allowedTypes.includes(file.type) || 
                                   (fileExtension && ['jpg', 'jpeg', 'png'].includes(fileExtension));
                
                if (!isValidType) {
                    const errorMessage = t('logo_invalid_format');
                    setValidationErrors(prev => ({
                        ...prev,
                        'clinic.logo': errorMessage
                    }));
                    customToast.error(
                        t('invalid_file_format'),
                        errorMessage
                    );
                    // Clear any previous file data
                    setData('clinic.logo', null);
                    if (previewSetter) previewSetter('');
                    if (fileNameSetter) fileNameSetter('');
                    return;
                } else {
                    // Clear validation error if file type is valid
                    setValidationErrors(prev => {
                        const newErrors = { ...prev };
                        delete newErrors['clinic.logo'];
                        return newErrors;
                    });
                }
            }
            
            // Check file size FIRST before doing anything else (10MB = 10 * 1024 * 1024 bytes)
            // Use 10MB as safe limit to account for PHP post_max_size overhead
            const maxSize = 10 * 1024 * 1024; // 10MB to be safe
            if (file.size > maxSize) {
                customToast.error(
                    t('file_too_large'), 
                    t('file_size_exceeds_max')
                );
                // Clear any previous file data
                if (field === 'logo') {
                    setData('clinic.logo', null);
                    setValidationErrors(prev => {
                        const newErrors = { ...prev };
                        delete newErrors['clinic.logo'];
                        return newErrors;
                    });
                } else if (field === 'business_license') {
                    setData('clinic.business_license', null);
                } else if (field === 'id_document_front') {
                    setData('clinic.id_document_front', null);
                } else if (field === 'id_document_back') {
                    setData('clinic.id_document_back', null);
                }
                return;
            }
            
            // Additional check: warn if file is close to limit (above 8MB)
            const warningSize = 8 * 1024 * 1024; // 8MB
            if (file.size > warningSize) {
                customToast.warning(
                    t('file_large_warning') || 'Large file detected',
                    t('file_size_warning') || `File size is ${(file.size / (1024 * 1024)).toFixed(2)}MB. Upload may fail if server limits are exceeded.`
                );
            }
                
            // Try to generate preview for all images up to max size (10MB)
            // For larger files, use longer timeout to allow processing
            const previewMaxSize = 10 * 1024 * 1024; // Allow previews up to max file size
            const shouldGeneratePreview = file.size <= previewMaxSize && file.type.startsWith('image/');

            // Set file name first
                if (fileNameSetter) {
                    fileNameSetter(file.name);
                }
                
            // Generate preview for images (including large ones)
            if (file.type.startsWith('image/') && shouldGeneratePreview) {
                        try {
                            const reader = new FileReader();
                    
                    // Set timeout to abort if reading takes too long (10 seconds)
                    const timeoutId = setTimeout(() => {
                        try {
                            reader.abort();
                            customToast.error(
                                t('file_too_large') || 'File too large', 
                                t('file_size_too_large') || 'File processing took too long. Please select a smaller file.'
                            );
                            if (previewSetter) previewSetter('');
                            if (fileNameSetter) fileNameSetter('');
                            // Clear file data
                            if (field === 'logo') {
                                setData('clinic.logo', null);
                            } else if (field === 'business_license') {
                                setData('clinic.business_license', null);
                            } else if (field === 'id_document_front') {
                                setData('clinic.id_document_front', null);
                            } else if (field === 'id_document_back') {
                                setData('clinic.id_document_back', null);
                            }
                        } catch (abortError) {
                            console.error('Error aborting file read:', abortError);
                        }
                    }, 10000);

                            reader.onerror = () => {
                        clearTimeout(timeoutId);
                        customToast.error(
                            t('file_too_large') || 'File too large', 
                            t('file_size_too_large') || 'Unable to read file. Please select a smaller file.'
                        );
                                if (previewSetter) previewSetter('');
                                if (fileNameSetter) fileNameSetter('');
                        // Clear file data
                        if (field === 'logo') {
                            setData('clinic.logo', null);
                        } else if (field === 'business_license') {
                            setData('clinic.business_license', null);
                        } else if (field === 'id_document_front') {
                            setData('clinic.id_document_front', null);
                        } else if (field === 'id_document_back') {
                            setData('clinic.id_document_back', null);
                        }
                    };

                            reader.onloadend = () => {
                        clearTimeout(timeoutId);
                                try {
                            if (reader.result && reader.readyState === FileReader.DONE && previewSetter) {
                                        previewSetter(reader.result as string);
                                    }
                                } catch (error) {
                            console.error('Error processing file preview:', error);
                            customToast.error(
                                t('file_too_large') || 'File too large', 
                                t('file_size_too_large') || 'Unable to process file. Please select a smaller file.'
                            );
                                    if (previewSetter) previewSetter('');
                                    if (fileNameSetter) fileNameSetter('');
                            // Clear file data
                            if (field === 'logo') {
                                setData('clinic.logo', null);
                            } else if (field === 'business_license') {
                                setData('clinic.business_license', null);
                            } else if (field === 'id_document_front') {
                                setData('clinic.id_document_front', null);
                            } else if (field === 'id_document_back') {
                                setData('clinic.id_document_back', null);
                            }
                        }
                    };

                    // Use readAsDataURL with error handling
                            reader.readAsDataURL(file);
                        } catch (error) {
                    console.error('Error setting up file reader:', error);
                    customToast.error(
                        t('file_too_large') || 'File too large', 
                        t('file_size_too_large') || 'Unable to read file. Please select a smaller file.'
                    );
                            if (previewSetter) previewSetter('');
                            if (fileNameSetter) fileNameSetter('');
                    // Clear file data
                    if (field === 'logo') {
                        setData('clinic.logo', null);
                    } else if (field === 'business_license') {
                        setData('clinic.business_license', null);
                    } else if (field === 'id_document_front') {
                        setData('clinic.id_document_front', null);
                    } else if (field === 'id_document_back') {
                        setData('clinic.id_document_back', null);
                    }
                    return;
                        }
                    } else if (file.type === 'application/pdf') {
                // For PDFs, just show file type indicator
                if (previewSetter) previewSetter('pdf');
            }

            // Only set file data AFTER all checks pass and preview is handled
            // This prevents storing large files in state if preview generation fails
            if (field === 'logo') {
                setData('clinic.logo', file);
            } else if (field === 'business_license') {
                setData('clinic.business_license', file);
            } else if (field === 'id_document_front') {
                setData('clinic.id_document_front', file);
            } else if (field === 'id_document_back') {
                setData('clinic.id_document_back', file);
            }
        } catch (error) {
            console.error('Error handling file:', error);
            customToast.error(
                t('file_too_large') || 'File too large', 
                t('file_size_too_large') || 'An error occurred while processing the file. Please try again with a smaller file.'
            );
                if (previewSetter) previewSetter('');
                if (fileNameSetter) fileNameSetter('');
            // Clear file data on error
                if (field === 'logo') {
                    setData('clinic.logo', null);
                } else if (field === 'business_license') {
                    setData('clinic.business_license', null);
                } else if (field === 'id_document_front') {
                    setData('clinic.id_document_front', null);
                } else if (field === 'id_document_back') {
                    setData('clinic.id_document_back', null);
                }
        }
    };

    const updateOperatingHour = (index: number, field: keyof OperatingHour, value: string | boolean) => {
        const updated = [...data.clinic.operating_hours];
        updated[index] = { ...updated[index], [field]: value };
        setData('clinic.operating_hours', updated);
    };

    const updateOperatingHourMultiple = (index: number, updates: Partial<OperatingHour>) => {
        const updated = [...data.clinic.operating_hours];
        updated[index] = { ...updated[index], ...updates };
        setData('clinic.operating_hours', updated);
    };

    const nextStep = () => {
        if (currentStep < TOTAL_STEPS) {
            setCurrentStep(currentStep + 1);
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    };

    // Helper function to get CSRF token
    const getCsrfToken = (): string => {
        // Try to get from meta tag
        const metaToken = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content');
        if (metaToken) {
            return metaToken;
        }
        
        // Try to get from cookie (XSRF-TOKEN)
        const cookies = document.cookie.split(';');
        for (const cookie of cookies) {
            const [name, value] = cookie.trim().split('=');
            if (name === 'XSRF-TOKEN') {
                return decodeURIComponent(value);
            }
        }
        
        return '';
    };

    // Helper function to map backend field names to frontend field names
    const mapBackendFieldToFrontend = (backendField: string, step: number): string => {
        // Step 1: User fields (no prefix needed)
        if (step === 1) {
            return backendField;
        }
        
        // Step 2: Clinic fields need 'clinic.' prefix
        if (step === 2) {
            const fieldMap: Record<string, string> = {
                'name_en': 'clinic.name_en',
                'name_ar': 'clinic.name_ar',
                'bio_en': 'clinic.bio_en',
                'bio_ar': 'clinic.bio_ar',
                'phone': 'clinic.phone',
                'email': 'clinic.email',
                'category_id': 'clinic.category_id',
            };
            return fieldMap[backendField] || `clinic.${backendField}`;
        }
        
        // Step 3: Address fields need 'clinic.' prefix
        if (step === 3) {
            return `clinic.${backendField}`;
        }
        
        // Step 4: Settings fields need 'clinic.' prefix
        if (step === 4) {
            return `clinic.${backendField}`;
        }
        
        // Step 5: Operating hours
        if (step === 5) {
            if (backendField.includes('operating_hours')) {
                return `clinic.${backendField}`;
            }
            return `clinic.${backendField}`;
        }
        
        // Step 6: File fields need 'clinic.' prefix
        if (step === 6) {
            const fieldMap: Record<string, string> = {
                'logo': 'clinic.logo',
                'business_license': 'clinic.business_license',
                'id_document_front': 'clinic.id_document_front',
                'id_document_back': 'clinic.id_document_back',
            };
            return fieldMap[backendField] || `clinic.${backendField}`;
        }
        
        // Step 7: Subscription fields need 'clinic.' prefix - COMMENTED OUT
        // if (step === 7) {
        //     return `clinic.${backendField}`;
        // }
        
        return backendField;
    };

    // Helper function to call backend validation endpoint
    const validateStepWithBackend = async (step: number): Promise<{ valid: boolean; errors: Record<string, string[]> }> => {
        const endpoint = '/register';
        let payload: Record<string, unknown> = { step };

        switch (step) {
            case 1:
                payload = {
                    step: 1,
                    name: data.name,
                    email: data.email,
                    phone: data.phone,
                    password: data.password,
                    password_confirmation: data.password_confirmation,
                };
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
                    terms_and_conditions_en: data.clinic.terms_and_conditions_en,
                    terms_and_conditions_ar: data.clinic.terms_and_conditions_ar,
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
                // Case 6 is handled separately below (file uploads)
                break;
            // case 7: // COMMENTED OUT - Subscription step
            //     payload = {
            //         step: 7,
            //         subscription_package_id: data.clinic.subscription_package_id || null,
            //     };
            //     break;
        }

        // Handle case 6 separately (file uploads)
        if (step === 6) {
            const formData = new FormData();
            formData.append('step', '6');
            if (data.clinic.logo instanceof File) {
                formData.append('logo', data.clinic.logo);
            }
            if (data.clinic.business_license instanceof File) {
                formData.append('business_license', data.clinic.business_license);
            }
            if (data.clinic.id_document_front instanceof File) {
                formData.append('id_document_front', data.clinic.id_document_front);
            }
            if (data.clinic.id_document_back instanceof File) {
                formData.append('id_document_back', data.clinic.id_document_back);
            }
            
            try {
                const response = await fetch(endpoint, {
                    method: 'POST',
                    headers: {
                        'Accept': 'application/json',
                        'X-Requested-With': 'XMLHttpRequest',
                        'X-CSRF-TOKEN': getCsrfToken(),
                    },
                    body: formData,
                });

                    // Handle validation errors (422 status)
                    if (response.status === 422) {
                        try {
                            const errorResult = await response.json();
                            if (errorResult.errors) {
                                // Map backend field names to frontend field names
                                const mappedErrors: Record<string, string[]> = {};
                                Object.keys(errorResult.errors).forEach(key => {
                                    const frontendKey = mapBackendFieldToFrontend(key, step);
                                    mappedErrors[frontendKey] = errorResult.errors[key];
                                });
                                return { valid: false, errors: mappedErrors };
                            }
                        } catch (parseError) {
                            console.error('Error parsing validation response:', parseError);
                        }
                    }

                    // Handle non-OK responses
                    if (!response.ok) {
                        let errorMessage = t('validation_failed') || 'Validation failed. Please try again.';
                        let hasValidationErrors = false;
                        const mappedErrors: Record<string, string[]> = {};
                        
                        try {
                            const errorResult = await response.json();
                            
                            // Always try to extract validation errors first
                            if (errorResult.errors && typeof errorResult.errors === 'object') {
                                hasValidationErrors = true;
                                Object.keys(errorResult.errors).forEach(key => {
                                    const frontendKey = mapBackendFieldToFrontend(key, step);
                                    if (Array.isArray(errorResult.errors[key])) {
                                        mappedErrors[frontendKey] = errorResult.errors[key];
                                    } else {
                                        mappedErrors[frontendKey] = [String(errorResult.errors[key])];
                                    }
                                });
                            }
                            
                            // If we have validation errors, return them
                            if (hasValidationErrors && Object.keys(mappedErrors).length > 0) {
                                return { valid: false, errors: mappedErrors };
                            }
                            
                            // Otherwise use the message
                            if (errorResult.message) {
                                errorMessage = errorResult.message;
                            }
                        } catch {
                            // If response is not JSON, use status-specific messages
                            if (response.status === 419) {
                                errorMessage = t('csrf_token_expired') || 'Your session has expired. Please refresh the page and try again.';
                            } else if (response.status === 500) {
                                errorMessage = t('server_error') || 'A server error occurred. Please try again later.';
                            } else if (response.status === 422) {
                                errorMessage = t('validation_failed') || 'Validation failed. Please check your input.';
                            }
                        }
                        
                        return { valid: false, errors: { _general: [errorMessage] } };
                    }

                    const result = await response.json();
                    
                    if (result.valid) {
                        return { valid: true, errors: {} };
                    } else {
                        // Map backend field names to frontend field names
                        const mappedErrors: Record<string, string[]> = {};
                        if (result.errors) {
                            Object.keys(result.errors).forEach(key => {
                                const frontendKey = mapBackendFieldToFrontend(key, step);
                                mappedErrors[frontendKey] = result.errors[key];
                            });
                        }
                        return { valid: false, errors: mappedErrors };
                    }
                } catch (error) {
                    console.error('Validation error:', error);
                    const errorMessage = error instanceof Error 
                        ? error.message 
                        : (t('something_went_wrong') || t('validation_failed') || 'Validation failed. Please try again.');
                    return { valid: false, errors: { _general: [errorMessage] } };
                }
        }

        // Handle all other steps (1-5, 7) with JSON payload
        try {
            const response = await fetch(endpoint, {
                method: 'POST',
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
                },
                body: JSON.stringify(payload),
            });

            // Handle validation errors (422 status)
            if (response.status === 422) {
                try {
                    const errorResult = await response.json();
                    if (errorResult.errors) {
                        // Map backend field names to frontend field names
                        const mappedErrors: Record<string, string[]> = {};
                        Object.keys(errorResult.errors).forEach(key => {
                            const frontendKey = mapBackendFieldToFrontend(key, step);
                            mappedErrors[frontendKey] = errorResult.errors[key];
                        });
                        return { valid: false, errors: mappedErrors };
                    }
                        } catch (parseError) {
                            console.error('Error parsing validation response:', parseError);
                        }
            }

            // Handle non-OK responses
            if (!response.ok) {
                let errorMessage = t('validation_failed') || 'Validation failed. Please try again.';
                let hasValidationErrors = false;
                const mappedErrors: Record<string, string[]> = {};
                
                try {
                    const errorResult = await response.json();
                    
                    // Always try to extract validation errors first
                    if (errorResult.errors && typeof errorResult.errors === 'object') {
                        hasValidationErrors = true;
                        Object.keys(errorResult.errors).forEach(key => {
                            const frontendKey = mapBackendFieldToFrontend(key, step);
                            if (Array.isArray(errorResult.errors[key])) {
                                mappedErrors[frontendKey] = errorResult.errors[key];
                            } else {
                                mappedErrors[frontendKey] = [String(errorResult.errors[key])];
                            }
                        });
                    }
                    
                    // If we have validation errors, return them
                    if (hasValidationErrors && Object.keys(mappedErrors).length > 0) {
                        return { valid: false, errors: mappedErrors };
                    }
                    
                    // Otherwise use the message
                    if (errorResult.message) {
                        errorMessage = errorResult.message;
                    }
                } catch {
                    // If response is not JSON, use status-specific messages
                    if (response.status === 419) {
                        errorMessage = t('csrf_token_expired') || 'Your session has expired. Please refresh the page and try again.';
                    } else if (response.status === 500) {
                        errorMessage = t('server_error') || 'A server error occurred. Please try again later.';
                    } else if (response.status === 422) {
                        errorMessage = t('validation_failed') || 'Validation failed. Please check your input.';
                    }
                }
                
                return { valid: false, errors: { _general: [errorMessage] } };
            }

            const result = await response.json();
            
            if (result.valid) {
                return { valid: true, errors: {} };
            } else {
                // Map backend field names to frontend field names
                const mappedErrors: Record<string, string[]> = {};
                if (result.errors) {
                    Object.keys(result.errors).forEach(key => {
                        const frontendKey = mapBackendFieldToFrontend(key, step);
                        mappedErrors[frontendKey] = result.errors[key];
                    });
                }
                return { valid: false, errors: mappedErrors };
            }
        } catch (error) {
            console.error('Validation error:', error);
            const errorMessage = error instanceof Error 
                ? error.message 
                : (t('something_went_wrong') || t('validation_failed') || 'Validation failed. Please try again.');
            return { valid: false, errors: { _general: [errorMessage] } };
        }
    };

    const prevStep = () => {
        if (currentStep > 1) {
            setCurrentStep(currentStep - 1);
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    };

    const validateStep = useCallback((step: number): { valid: boolean; errors: string[]; fieldErrors?: Record<string, string> } => {
        // Helper functions defined inside useCallback to avoid dependency issues
        const isArabicText = (text: string): boolean => {
            if (!text.trim()) return false;
            // Check that text contains ONLY Arabic characters, numbers, spaces, newlines, and common punctuation
            // Arabic Unicode ranges and Arabic-Indic digits
            // \s includes spaces, tabs, and newlines
            const arabicPattern = /^[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF\s\u0660-\u0669\u06F0-\u06F9.,;:!?\-_()[\]{}""''«»/\n\r]+$/u;
            return arabicPattern.test(text);
        };

        const isEnglishText = (text: string): boolean => {
            if (!text.trim()) return false;
            // Check that text contains ONLY ASCII characters (English letters, numbers, spaces, punctuation, newlines)
            // This explicitly excludes Arabic and other Unicode characters
            // \s includes spaces, tabs, and newlines
            const englishPattern = /^[a-zA-Z0-9\s\-_.,;:!?@#$%^&*()[\]{}""''/\n\r]+$/;
            return englishPattern.test(text);
        };


        const isValidPassword = (password: string): boolean => {
            if (!password || password.length < 8) return false;
            // Must contain at least one uppercase letter
            if (!/[A-Z]/.test(password)) return false;
            // Must contain at least one lowercase letter
            if (!/[a-z]/.test(password)) return false;
            // Must contain at least one digit
            if (!/[0-9]/.test(password)) return false;
            // Must contain at least one special character
            if (!/[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(password)) return false;
            return true;
        };
        const errors: string[] = [];
        const fieldErrors: Record<string, string> = {};
        
        switch (step) {
            case 1: {
                const trimmedName = data.name?.trim();
                const trimmedEmail = data.email?.trim();
                const trimmedPhone = data.phone?.trim();
                const trimmedPassword = data.password?.trim();
                const trimmedPasswordConfirmation = data.password_confirmation?.trim();

                if (!trimmedName || trimmedName.length === 0) {
                    const error = t('name_required');
                    errors.push(error);
                    fieldErrors.name = error;
                } else if (trimmedName.length < 2) {
                    const error = t('name_too_short');
                    errors.push(error);
                    fieldErrors.name = error;
                } else if (trimmedName.length > 30) {
                    const error = t('name_too_long') || t('name_must_not_exceed_30_characters') || 'Name must not exceed 30 characters';
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
                    const error = t('password_required') || t('password_min_length') || 'Password is required';
                    errors.push(error);
                    fieldErrors.password = error;
                } else if (!isValidPassword(trimmedPassword)) {
                    let error = t('password_min_length') || 'Password must be at least 8 characters';
                    if (trimmedPassword.length >= 8) {
                        if (!/[A-Z]/.test(trimmedPassword)) {
                            error = t('password_must_contain_uppercase') || 'Password must contain at least one uppercase letter';
                        } else if (!/[a-z]/.test(trimmedPassword)) {
                            error = t('password_must_contain_lowercase') || 'Password must contain at least one lowercase letter';
                        } else if (!/[0-9]/.test(trimmedPassword)) {
                            error = t('password_must_contain_digit') || 'Password must contain at least one digit';
                        } else if (!/[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(trimmedPassword)) {
                            error = t('password_must_contain_special') || 'Password must contain at least one special character';
                        }
                    }
                    errors.push(error);
                    fieldErrors.password = error;
                }

                if (!trimmedPasswordConfirmation || trimmedPassword !== trimmedPasswordConfirmation) {
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

                if (!trimmedClinicNameEn || trimmedClinicNameEn.length === 0) {
                    const error = t('clinic_name_en_required');
                    errors.push(error);
                    fieldErrors['clinic.name_en'] = error;
                } else if (!isEnglishText(trimmedClinicNameEn)) {
                    const error = t('clinic_name_en_must_be_english');
                    errors.push(error);
                    fieldErrors['clinic.name_en'] = error;
                } else if (trimmedClinicNameEn.length > 30) {
                    const error = t('clinic_name_en_too_long') || t('name_must_not_exceed_30_characters') || 'Clinic name must not exceed 30 characters';
                    errors.push(error);
                    fieldErrors['clinic.name_en'] = error;
                }

                if (!trimmedClinicNameAr || trimmedClinicNameAr.length === 0) {
                    const error = t('clinic_name_ar_required');
                    errors.push(error);
                    fieldErrors['clinic.name_ar'] = error;
                } else if (!isArabicText(trimmedClinicNameAr)) {
                    const error = t('clinic_name_ar_must_be_arabic');
                    errors.push(error);
                    fieldErrors['clinic.name_ar'] = error;
                } else if (trimmedClinicNameAr.length > 30) {
                    const error = t('clinic_name_ar_too_long') || t('name_must_not_exceed_30_characters') || 'Clinic name must not exceed 30 characters';
                    errors.push(error);
                    fieldErrors['clinic.name_ar'] = error;
                }

                if (!trimmedClinicPhone || !isValidPhone(trimmedClinicPhone)) {
                    const error = t('clinic_phone_invalid_format');
                    errors.push(error);
                    fieldErrors['clinic.phone'] = error;
                }

                // Category is now required
                if (!data.clinic.category_id || data.clinic.category_id.trim() === '') {
                    const error = t('category_required') || 'Category is required';
                    errors.push(error);
                    fieldErrors['clinic.category_id'] = error;
                }

                // Validate clinic email if provided
                if (data.clinic.email && data.clinic.email.trim()) {
                    const trimmedClinicEmail = data.clinic.email.trim();
                    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                    if (!emailRegex.test(trimmedClinicEmail)) {
                        const error = t('email_invalid') || 'Invalid email format';
                        errors.push(error);
                        fieldErrors['clinic.email'] = error;
                    }
                    // Note: Uniqueness check is done via API on blur, but we still validate format here
                }

                // Validate bio fields
                if (data.clinic.bio_en && data.clinic.bio_en.trim()) {
                    if (!isEnglishText(data.clinic.bio_en)) {
                        const fieldName = t('description_en') || 'Description (English)';
                        const error = t('description_en_must_be_english') || t('field_must_be_english_only')?.replace(':attribute', fieldName) || `${fieldName} must contain only English characters`;
                        errors.push(error);
                        fieldErrors['clinic.bio_en'] = error;
                    } else if (data.clinic.bio_en.length > 2000) {
                        const error = t('description_too_long') || t('description_must_not_exceed_2000_characters') || 'Description must not exceed 2000 characters';
                    errors.push(error);
                    fieldErrors['clinic.bio_en'] = error;
                }
                }
                if (data.clinic.bio_ar && data.clinic.bio_ar.trim()) {
                    if (!isArabicText(data.clinic.bio_ar)) {
                        const fieldName = t('description_ar') || 'Description (Arabic)';
                        const error = t('description_ar_must_be_arabic') || t('field_must_be_arabic_only')?.replace(':attribute', fieldName) || `${fieldName} must contain only Arabic characters`;
                        errors.push(error);
                        fieldErrors['clinic.bio_ar'] = error;
                    } else if (data.clinic.bio_ar.length > 2000) {
                        const error = t('description_too_long') || t('description_must_not_exceed_2000_characters') || 'Description must not exceed 2000 characters';
                    errors.push(error);
                    fieldErrors['clinic.bio_ar'] = error;
                    }
                }

                return { valid: errors.length === 0, errors, fieldErrors };
            }

            case 3: {
                // Required fields validation
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
                    const error = t('address_required') || t('address_cannot_be_empty') || t('address_invalid') || 'Address is required';
                    errors.push(error);
                    fieldErrors['clinic.address'] = error;
                } else if (trimmedAddress.length < 3) {
                    const error = t('address_too_short') || t('address_must_be_at_least_3_characters') || 'Address must be at least 3 characters';
                    errors.push(error);
                    fieldErrors['clinic.address'] = error;
                } else if (trimmedAddress.length > 500) {
                    const error = t('address_too_long') || t('address_must_not_exceed_500_characters') || 'Address must not exceed 500 characters';
                    errors.push(error);
                    fieldErrors['clinic.address'] = error;
                }
                
                // Validate other address fields if provided
                // Define field-specific max lengths to match backend validation
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
                
                const addressFields = ['block', 'street', 'avenue', 'house', 'floor', 'apt', 'city', 'state', 'postal_code'];
                addressFields.forEach(field => {
                    const fieldKey = `clinic.${field}` as keyof typeof data.clinic;
                    const fieldValue = data.clinic[fieldKey];
                    if (fieldValue !== null && fieldValue !== undefined && typeof fieldValue === 'string') {
                        const trimmedValue = fieldValue.trim();
                        const maxLength = fieldMaxLengths[field] || 255;
                        
                        // If field has content, validate it
                        if (trimmedValue.length > 0) {
                            // Check minimum length (at least 1 character for meaningful content)
                            if (trimmedValue.length < 1) {
                                const error = t(`${field}_cannot_be_empty`) || t('field_cannot_be_empty') || `The ${field} field cannot be empty`;
                                errors.push(error);
                                fieldErrors[fieldKey] = error;
                            } else if (trimmedValue.length > maxLength) {
                                const error = t(`clinic_${field}_max_length`) || t(`${field}_too_long`) || t('field_must_not_exceed_characters')?.replace(':max', maxLength.toString()) || `The ${field} field must not be greater than ${maxLength} characters`;
                                errors.push(error);
                                fieldErrors[fieldKey] = error;
                            }
                            
                            // Validate postal code format (only digits)
                            if (field === 'postal_code' && trimmedValue && !/^\d+$/.test(trimmedValue)) {
                                const error = t('postal_code_must_be_digits') || t('postal_code_invalid') || 'Postal code must contain only digits';
                                errors.push(error);
                                fieldErrors[fieldKey] = error;
                            }
                        } else if (fieldValue.length > 0) {
                            // User entered only whitespace
                            const error = t(`${field}_cannot_be_empty`) || t('field_cannot_be_empty') || `The ${field} field cannot be empty`;
                            errors.push(error);
                            fieldErrors[fieldKey] = error;
                        }
                    }
                });
                
                // Validate latitude if provided
                if (data.clinic.latitude !== null && data.clinic.latitude !== undefined && data.clinic.latitude.trim()) {
                    const lat = parseFloat(data.clinic.latitude.trim());
                    if (isNaN(lat) || lat < -90 || lat > 90) {
                        const error = t('latitude_invalid') || 'Latitude must be between -90 and 90';
                        errors.push(error);
                        fieldErrors['clinic.latitude'] = error;
                    }
                }
                
                // Validate longitude if provided
                if (data.clinic.longitude !== null && data.clinic.longitude !== undefined && data.clinic.longitude.trim()) {
                    const lng = parseFloat(data.clinic.longitude.trim());
                    if (isNaN(lng) || lng < -180 || lng > 180) {
                        const error = t('longitude_invalid') || 'Longitude must be between -180 and 180';
                        errors.push(error);
                        fieldErrors['clinic.longitude'] = error;
                    }
                }
                
                return { valid: errors.length === 0, errors, fieldErrors };
            }

            case 4:
                // Step 4 validation (no slot duration validation needed)
                
                // Validate policies - English fields must be English only
                // Check if field has content, and if it does, validate it's English
                if (data.clinic.cancellation_policy_en && data.clinic.cancellation_policy_en.trim()) {
                    if (!isEnglishText(data.clinic.cancellation_policy_en)) {
                        const fieldName = t('cancellation_policy_en') || 'Cancellation Policy (English)';
                        const error = t('clinic_name_en_must_be_english') || t('field_must_be_english_only')?.replace(':attribute', fieldName) || `${fieldName} must contain only English characters`;
                        errors.push(error);
                        fieldErrors['clinic.cancellation_policy_en'] = error;
                    } else if (data.clinic.cancellation_policy_en.length > 2000) {
                        const error = t('policy_too_long') || t('policy_must_not_exceed_2000_characters') || 'Policy must not exceed 2000 characters';
                        errors.push(error);
                        fieldErrors['clinic.cancellation_policy_en'] = error;
                    }
                }
                // Validate policies - Arabic fields must be Arabic only
                if (data.clinic.cancellation_policy_ar && data.clinic.cancellation_policy_ar.trim()) {
                    if (!isArabicText(data.clinic.cancellation_policy_ar)) {
                        const fieldName = t('cancellation_policy_ar') || 'Cancellation Policy (Arabic)';
                        const error = t('clinic_name_ar_must_be_arabic') || t('field_must_be_arabic_only')?.replace(':attribute', fieldName) || `${fieldName} must contain only Arabic characters`;
                        errors.push(error);
                        fieldErrors['clinic.cancellation_policy_ar'] = error;
                    } else if (data.clinic.cancellation_policy_ar.length > 2000) {
                        const error = t('policy_too_long') || t('policy_must_not_exceed_2000_characters') || 'Policy must not exceed 2000 characters';
                        errors.push(error);
                        fieldErrors['clinic.cancellation_policy_ar'] = error;
                    }
                }
                if (data.clinic.refund_policy_en && data.clinic.refund_policy_en.trim()) {
                    if (!isEnglishText(data.clinic.refund_policy_en)) {
                        const fieldName = t('refund_policy_en') || 'Refund Policy (English)';
                        const error = t('clinic_name_en_must_be_english') || t('field_must_be_english_only')?.replace(':attribute', fieldName) || `${fieldName} must contain only English characters`;
                        errors.push(error);
                        fieldErrors['clinic.refund_policy_en'] = error;
                    } else if (data.clinic.refund_policy_en.length > 2000) {
                        const error = t('policy_too_long') || t('policy_must_not_exceed_2000_characters') || 'Policy must not exceed 2000 characters';
                        errors.push(error);
                        fieldErrors['clinic.refund_policy_en'] = error;
                    }
                }
                if (data.clinic.refund_policy_ar && data.clinic.refund_policy_ar.trim()) {
                    if (!isArabicText(data.clinic.refund_policy_ar)) {
                        const fieldName = t('refund_policy_ar') || 'Refund Policy (Arabic)';
                        const error = t('clinic_name_ar_must_be_arabic') || t('field_must_be_arabic_only')?.replace(':attribute', fieldName) || `${fieldName} must contain only Arabic characters`;
                        errors.push(error);
                        fieldErrors['clinic.refund_policy_ar'] = error;
                    } else if (data.clinic.refund_policy_ar.length > 2000) {
                        const error = t('policy_too_long') || t('policy_must_not_exceed_2000_characters') || 'Policy must not exceed 2000 characters';
                        errors.push(error);
                        fieldErrors['clinic.refund_policy_ar'] = error;
                    }
                }
                if (data.clinic.privacy_policy_en && data.clinic.privacy_policy_en.trim()) {
                    if (!isEnglishText(data.clinic.privacy_policy_en)) {
                        const fieldName = t('privacy_policy_en') || 'Privacy Policy (English)';
                        const error = t('clinic_name_en_must_be_english') || t('field_must_be_english_only')?.replace(':attribute', fieldName) || `${fieldName} must contain only English characters`;
                        errors.push(error);
                        fieldErrors['clinic.privacy_policy_en'] = error;
                    } else if (data.clinic.privacy_policy_en.length > 2000) {
                        const error = t('policy_too_long') || t('policy_must_not_exceed_2000_characters') || 'Policy must not exceed 2000 characters';
                        errors.push(error);
                        fieldErrors['clinic.privacy_policy_en'] = error;
                    }
                }
                if (data.clinic.privacy_policy_ar && data.clinic.privacy_policy_ar.trim()) {
                    if (!isArabicText(data.clinic.privacy_policy_ar)) {
                        const fieldName = t('privacy_policy_ar') || 'Privacy Policy (Arabic)';
                        const error = t('clinic_name_ar_must_be_arabic') || t('field_must_be_arabic_only')?.replace(':attribute', fieldName) || `${fieldName} must contain only Arabic characters`;
                        errors.push(error);
                        fieldErrors['clinic.privacy_policy_ar'] = error;
                    } else if (data.clinic.privacy_policy_ar.length > 2000) {
                        const error = t('policy_too_long') || t('policy_must_not_exceed_2000_characters') || 'Policy must not exceed 2000 characters';
                        errors.push(error);
                        fieldErrors['clinic.privacy_policy_ar'] = error;
                    }
                }
                if (data.clinic.terms_and_conditions_en && data.clinic.terms_and_conditions_en.trim()) {
                    if (!isEnglishText(data.clinic.terms_and_conditions_en)) {
                        const fieldName = t('terms_and_conditions_en') || 'Terms & Conditions (English)';
                        const error = t('clinic_name_en_must_be_english') || t('field_must_be_english_only')?.replace(':attribute', fieldName) || `${fieldName} must contain only English characters`;
                        errors.push(error);
                        fieldErrors['clinic.terms_and_conditions_en'] = error;
                    } else if (data.clinic.terms_and_conditions_en.length > 2000) {
                        const error = t('policy_too_long') || t('policy_must_not_exceed_2000_characters') || 'Policy must not exceed 2000 characters';
                        errors.push(error);
                        fieldErrors['clinic.terms_and_conditions_en'] = error;
                    }
                }
                if (data.clinic.terms_and_conditions_ar && data.clinic.terms_and_conditions_ar.trim()) {
                    if (!isArabicText(data.clinic.terms_and_conditions_ar)) {
                        const fieldName = t('terms_and_conditions_ar') || 'Terms & Conditions (Arabic)';
                        const error = t('clinic_name_ar_must_be_arabic') || t('field_must_be_arabic_only')?.replace(':attribute', fieldName) || `${fieldName} must contain only Arabic characters`;
                        errors.push(error);
                        fieldErrors['clinic.terms_and_conditions_ar'] = error;
                    } else if (data.clinic.terms_and_conditions_ar.length > 2000) {
                        const error = t('policy_too_long') || t('policy_must_not_exceed_2000_characters') || 'Policy must not exceed 2000 characters';
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
                    const error = t('clinic_name_en_must_be_english') || t('field_must_be_english_only')?.replace(':attribute', fieldName) || `${fieldName} must contain only English characters`;
                    errors.push(error);
                    fieldErrors['clinic.reschedule_policy_en'] = error;
                } else if (data.clinic.reschedule_policy_en.length > 10000) {
                    const error = t('policy_too_long') || t('policy_must_not_exceed_10000_characters') || 'Policy must not exceed 10000 characters';
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
                    const error = t('clinic_name_ar_must_be_arabic') || t('field_must_be_arabic_only')?.replace(':attribute', fieldName) || `${fieldName} must contain only Arabic characters`;
                    errors.push(error);
                    fieldErrors['clinic.reschedule_policy_ar'] = error;
                } else if (data.clinic.reschedule_policy_ar.length > 10000) {
                    const error = t('policy_too_long') || t('policy_must_not_exceed_10000_characters') || 'Policy must not exceed 10000 characters';
                    errors.push(error);
                    fieldErrors['clinic.reschedule_policy_ar'] = error;
                }
                return { valid: errors.length === 0, errors, fieldErrors };

            case 5: {
                // Validate operating hours - at least one day must be open with valid time slots
                let hasValidTimeSlot = false;
                let hasTimeValidationError = false;
                
                for (let i = 0; i < data.clinic.operating_hours.length; i++) {
                    const hour = data.clinic.operating_hours[i];
                    if (!hour.closed_all_day && hour.is_open) {
                        if (hour.opening_time && hour.closing_time) {
                            const opening = new Date(`2000-01-01T${hour.opening_time}`);
                            const closing = new Date(`2000-01-01T${hour.closing_time}`);
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
                        } else if (!hour.opening_time || !hour.closing_time) {
                            const error = t('opening_and_closing_time_required');
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
                    const error = t('at_least_one_operating_hour_required') || 'At least one time of availability should be selected';
                    errors.push(error);
                    // Add error to first day for visibility and also as a general error
                    if (data.clinic.operating_hours.length > 0) {
                        fieldErrors['operating_hours.0'] = error;
                    }
                    // Add general error key for easier display
                    fieldErrors['operating_hours'] = error;
                }
                
                return { valid: errors.length === 0, errors, fieldErrors };
            }

            case 6:
                if (!data.clinic.business_license) {
                    const error = t('business_license_required');
                    errors.push(error);
                    fieldErrors['clinic.business_license'] = error;
                }
                if (!data.clinic.id_document_front) {
                    const error = t('id_document_front_required');
                    errors.push(error);
                    fieldErrors['clinic.id_document_front'] = error;
                }
                return { valid: errors.length === 0, errors, fieldErrors };

            case 7:
                // Subscription is optional, but if provided, validate it exists
                // No validation errors needed for optional field
                return { valid: true, errors: [], fieldErrors: {} };

            default:
                return { valid: true, errors: [], fieldErrors: {} };
        }
    }, [data, t]);

    // Clear validation errors when step changes
    useEffect(() => {
        setValidationErrors({});
        setTouchedFields(new Set());
    }, [currentStep]);

    // Check if current step is valid (without setting state to avoid infinite loops)
    // We use validateStep which already depends on data, so we only need currentStep
    const isCurrentStepValid = useMemo(() => {
        const validation = validateStep(currentStep);
        return validation.valid;
    }, [currentStep, validateStep]);

    // Check clinic email uniqueness
    const checkClinicEmailUniqueness = useCallback(async (email: string) => {
        if (!email || !email.trim() || !email.includes('@')) {
            return; // Don't check if email is empty or invalid format
        }

        setCheckingEmail(true);
        try {
            const response = await fetch('/register/check-clinic-email', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
                },
                body: JSON.stringify({ email: email.trim() }),
            });

            const result = await response.json();
            
            if (!result.available) {
                setValidationErrors(prev => ({
                    ...prev,
                    'clinic.email': t('clinic_email_already_taken') || result.message || 'This email is already taken',
                }));
            } else {
                // Clear error if email is available
                setValidationErrors(prev => {
                    const newErrors = { ...prev };
                    if (newErrors['clinic.email'] === (t('clinic_email_already_taken') || 'This email is already taken')) {
                        delete newErrors['clinic.email'];
                    }
                    return newErrors;
                });
            }
        } catch (error) {
            console.error('Error checking email:', error);
            // Don't show error to user if check fails - let backend handle it on submit
        } finally {
            setCheckingEmail(false);
        }
    }, [t]);

    // Only validate on blur if field was already touched (after first submit attempt)
    const handleFieldBlur = useCallback((fieldName: string) => {
        // Special handling for clinic email - check uniqueness
        if (fieldName === 'clinic.email' && data.clinic.email && data.clinic.email.trim()) {
            checkClinicEmailUniqueness(data.clinic.email);
        }

        // Only validate if we've already attempted to submit this step
        // This prevents validation from showing on initial focus/blur
        if (touchedFields.has(fieldName)) {
            requestAnimationFrame(() => {
                const validation = validateStep(currentStep);
                if (!validation.valid && validation.fieldErrors) {
                    setValidationErrors(prev => {
                        const newErrors = { ...prev, ...validation.fieldErrors! };
                        // Clear error for this specific field if it's now valid
                        if (!validation.fieldErrors![fieldName]) {
                            delete newErrors[fieldName];
                        }
                        return newErrors;
                    });
                } else if (validation.valid) {
                    // Clear error for this specific field if it's now valid
                    setValidationErrors(prev => {
                        const newErrors = { ...prev };
                        delete newErrors[fieldName];
                        return newErrors;
                    });
                }
            });
        }
    }, [currentStep, validateStep, touchedFields, data.clinic.email, checkClinicEmailUniqueness]);

    const submit: FormEventHandler = async (e) => {
        e.preventDefault();
        
        // Mark all fields in current step as touched IMMEDIATELY so errors show up
        const stepFields: string[] = [];
        switch (currentStep) {
            case 1:
                stepFields.push('name', 'email', 'phone', 'password', 'password_confirmation');
                break;
            case 2:
                stepFields.push('clinic.name_en', 'clinic.name_ar', 'clinic.phone', 'clinic.category_id');
                break;
            case 3:
                stepFields.push('clinic.governorate_id', 'clinic.area_id', 'clinic.city', 'clinic.apt', 'clinic.house');
                break;
            case 4:
                // No required fields that need validation on blur
                break;
            case 5:
                // Operating hours validation
                break;
            case 6:
                stepFields.push('clinic.business_license', 'clinic.id_document_front');
                break;
            case 7:
                // Subscription is optional, no required fields
                break;
        }
        
        // Mark all step fields as touched immediately
        const newTouchedFields = new Set(touchedFields);
        stepFields.forEach(field => {
            newTouchedFields.add(field);
        });
        setTouchedFields(newTouchedFields);
        
        // First, do client-side validation
        const validation = validateStep(currentStep);
        
        // Set validation errors IMMEDIATELY so they're visible
        if (validation.fieldErrors) {
            setValidationErrors(validation.fieldErrors);
        } else {
            setValidationErrors({});
        }
        
        if (!validation.valid) {
            // Show all validation errors as toast
            if (validation.errors.length > 0) {
            validation.errors.forEach(error => {
                customToast.error(error);
            });
            }
                // Scroll to top to show errors
                window.scrollTo({ top: 0, behavior: 'smooth' });
            // Don't proceed to next step
            return;
        }

        // If client-side validation passed, call backend validation
        try {
            setValidating(true);
            const backendValidation = await validateStepWithBackend(currentStep);
            
            if (!backendValidation.valid) {
                // Convert backend errors to field errors format
                const fieldErrors: Record<string, string> = {};
                const newTouchedFields = new Set(touchedFields);
                
                Object.keys(backendValidation.errors).forEach(key => {
                    const errors = backendValidation.errors[key];
                    if (Array.isArray(errors) && errors.length > 0) {
                        // Take the first error message for the field
                        fieldErrors[key] = errors[0];
                        // Mark field as touched so error displays
                        newTouchedFields.add(key);
                    } else if (typeof errors === 'string') {
                        fieldErrors[key] = errors;
                        newTouchedFields.add(key);
                    }
                });
                
                setValidationErrors(fieldErrors);
                setTouchedFields(newTouchedFields);
                
                // Show all validation errors as toast (translated messages)
                Object.entries(backendValidation.errors).forEach(([key, errorArray]) => {
                    if (key === '_general') {
                        // Show general errors
                        if (Array.isArray(errorArray)) {
                            errorArray.forEach(error => {
                                customToast.error(error);
                            });
                        } else if (typeof errorArray === 'string') {
                            customToast.error(errorArray);
                        }
                    } else {
                        // Show field-specific errors
                        if (Array.isArray(errorArray)) {
                            errorArray.forEach(error => {
                                // Error messages from backend are already translated
                                customToast.error(error);
                            });
                        } else if (typeof errorArray === 'string') {
                            customToast.error(errorArray);
                        }
                    }
                });
                
                // Scroll to first error field
                const firstErrorField = Object.keys(fieldErrors).find(key => key !== '_general');
                if (firstErrorField) {
                    // Try multiple selectors to find the error field
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
                            const errorElement = document.querySelector(selector);
                            if (errorElement) {
                                setTimeout(() => {
                                    errorElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
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
                
                // Don't proceed to next step
                return;
            }
        } catch (error) {
            // Handle unexpected errors
            console.error('Backend validation error:', error);
            const errorMessage = error instanceof Error 
                ? error.message 
                : (t('something_went_wrong') || 'Something went wrong. Please try again later.');
            
            customToast.error(errorMessage);
            window.scrollTo({ top: 0, behavior: 'smooth' });
            return;
        } finally {
            setValidating(false);
        }

        // Only proceed if both client-side and backend validation passed
        if (currentStep < TOTAL_STEPS) {
            // Clear validation errors before moving to next step
            setValidationErrors({});
            setTouchedFields(new Set());
            nextStep();
            return;
        }

        // Final submission - validate all steps before submitting
        // Validate all steps to ensure everything is correct
        let allStepsValid = true;
        for (let step = 1; step <= TOTAL_STEPS; step++) {
            const stepValidation = validateStep(step);
            if (!stepValidation.valid) {
                allStepsValid = false;
                if (stepValidation.fieldErrors) {
                    setValidationErrors(prev => ({ ...prev, ...stepValidation.fieldErrors! }));
                }
                stepValidation.errors.forEach(error => {
                    customToast.error(error);
                });
            }
        }
        
        if (!allStepsValid) {
            // Scroll to first step with errors
            setCurrentStep(1);
            window.scrollTo({ top: 0, behavior: 'smooth' });
            return;
        }
        
        // Check total file size before submitting
        let totalFileSize = 0;
        const files: File[] = [];
        
        if (data.clinic.logo instanceof File) {
            totalFileSize += data.clinic.logo.size;
            files.push(data.clinic.logo);
        }
        if (data.clinic.business_license instanceof File) {
            totalFileSize += data.clinic.business_license.size;
            files.push(data.clinic.business_license);
        }
        if (data.clinic.id_document_front instanceof File) {
            totalFileSize += data.clinic.id_document_front.size;
            files.push(data.clinic.id_document_front);
        }
        if (data.clinic.id_document_back instanceof File) {
            totalFileSize += data.clinic.id_document_back.size;
            files.push(data.clinic.id_document_back);
        }
        
        // Warn if total file size exceeds 30MB (server might have lower limit)
        const maxTotalSize = 30 * 1024 * 1024; // 30MB
        if (totalFileSize > maxTotalSize) {
            customToast.error(t('content_too_large') || 'Request content is too large. Please reduce file sizes and try again.');
            return;
        }
        
        const formData = new FormData();
        
        // User data
        formData.append('name', data.name);
        formData.append('email', data.email);
        formData.append('phone', data.phone);
        formData.append('password', data.password);
        formData.append('password_confirmation', data.password_confirmation);
        
        // Clinic data
        Object.keys(data.clinic).forEach(key => {
            const value = data.clinic[key as keyof typeof data.clinic];
            
            if (key === 'operating_hours') {
                (value as OperatingHour[]).forEach((oh, index) => {
                    formData.append(`clinic[operating_hours][${index}][day_of_week]`, oh.day_of_week);
                    formData.append(`clinic[operating_hours][${index}][is_open]`, oh.is_open ? '1' : '0');
                    formData.append(`clinic[operating_hours][${index}][closed_all_day]`, oh.closed_all_day ? '1' : '0');
                    if (oh.opening_time) formData.append(`clinic[operating_hours][${index}][opening_time]`, oh.opening_time);
                    if (oh.closing_time) formData.append(`clinic[operating_hours][${index}][closing_time]`, oh.closing_time);
                });
            } else if (value instanceof File) {
                formData.append(`clinic[${key}]`, value);
            } else if (value !== null && value !== '' && value !== undefined) {
                // Handle arrays and objects
                if (Array.isArray(value)) {
                    formData.append(`clinic[${key}]`, JSON.stringify(value));
                } else if (typeof value === 'object') {
                    formData.append(`clinic[${key}]`, JSON.stringify(value));
                } else {
                    formData.append(`clinic[${key}]`, String(value));
                }
            }
        });

        post('/register', {
            forceFormData: true,
            onSuccess: () => {
                customToast.success(t('registration_success_toast'), t('registration_success_toast_description'));
                // Reset form state on success
                setValidationErrors({});
                setTouchedFields(new Set());
                // Clear sessionStorage on successful registration
                sessionStorage.removeItem('registerCurrentStep');
            },
            onError: (serverErrors) => {
                // Handle "content too large" or similar errors
                if (serverErrors && typeof serverErrors === 'object') {
                    // Check for general error message (like "content too large")
                    if ('message' in serverErrors && typeof serverErrors.message === 'string') {
                        const errorMessage = serverErrors.message.toLowerCase();
                        if (errorMessage.includes('too large') || errorMessage.includes('content too large') || errorMessage.includes('request entity too large')) {
                            customToast.error(t('content_too_large') || 'Request content is too large. Please reduce file sizes and try again.');
                            return;
                        }
                        // Show the general error message
                        customToast.error(serverErrors.message);
                    }
                }
                
                // Server-side validation errors handling
                if (serverErrors && Object.keys(serverErrors).length > 0) {
                    const formattedErrors: Record<string, string> = {};
                    
                    // Helper function to format field names in error messages
                    const formatErrorMessage = (key: string, message: string): string => {
                        // Replace field names with proper labels
                        const fieldNameMap: Record<string, string> = {
                            'clinic.name_en': t('clinic_name_en') || 'Clinic Name (English)',
                            'clinic.name_ar': t('clinic_name_ar') || 'Clinic Name (Arabic)',
                            'clinic.phone': t('clinic_phone') || 'Clinic Phone',
                            'clinic.email': t('clinic_email') || 'Clinic Email',
                            'clinic.bio_en': t('bio_en') || 'Bio (English)',
                            'clinic.bio_ar': t('bio_ar') || 'Bio (Arabic)',
                            'clinic.category_id': t('category') || 'Category',
                            'clinic.governorate_id': t('governorate') || 'Governorate',
                            'clinic.area_id': t('area') || 'Area',
                            'clinic.address': t('address') || 'Address',
                            'clinic.business_license': t('business_license') || 'Business License',
                            'clinic.id_document_front': t('id_document_front') || 'ID Document (Front)',
                            'clinic.id_document_back': t('id_document_back') || 'ID Document (Back)',
                            'clinic.logo': t('logo') || 'Logo',
                            'clinic.operating_hours': t('operating_hours') || 'Operating Hours',
                            'clinic.city': t('city') || 'City',
                            'clinic.apt': t('apartment') || 'Apartment',
                            'clinic.house': t('house') || 'House',
                            'clinic.postal_code': t('postal_code') || 'Postal Code',
                            'name': t('full_name') || 'Full Name',
                            'email': t('email') || 'Email',
                            'phone': t('phone_number') || 'Phone Number',
                            'password': t('password') || 'Password',
                        };
                        
                        // Replace field names in error messages
                        let formattedMessage = message;
                        Object.entries(fieldNameMap).forEach(([fieldKey, fieldLabel]) => {
                            // Replace patterns like "clinic.name_en" or "The clinic.name_en field..."
                            const patterns = [
                                new RegExp(`\\b${fieldKey.replace(/\./g, '\\.')}\\b`, 'gi'),
                                new RegExp(`The ${fieldKey.replace(/\./g, '\\.')}`, 'gi'),
                                new RegExp(`${fieldKey.replace(/\./g, '\\.')} field`, 'gi'),
                            ];
                            patterns.forEach(pattern => {
                                formattedMessage = formattedMessage.replace(pattern, fieldLabel);
                            });
                        });
                        
                        // Remove dots from field names (e.g., "clinic.name" -> "clinic name")
                        formattedMessage = formattedMessage.replace(/clinic\.([a-z_]+)/gi, (match, field) => {
                            const fieldName = field.replace(/_/g, ' ');
                            return `clinic ${fieldName}`;
                        });
                        
                        // Remove all dots from field references (e.g., "clinic.city" -> "clinic city")
                        formattedMessage = formattedMessage.replace(/(\w+)\.(\w+)/g, '$1 $2');
                        // Also handle nested fields like "clinic.address.city" -> "clinic address city"
                        formattedMessage = formattedMessage.replace(/(\w+)\.(\w+)\.(\w+)/g, '$1 $2 $3');
                        
                        // Remove trailing dots and clean up message
                        formattedMessage = formattedMessage.replace(/\.{2,}/g, '.').replace(/\.$/, '').trim();
                        
                        // Remove any remaining standalone dots that are part of field names
                        formattedMessage = formattedMessage.replace(/\b(\w+)\.(\w+)\b/g, '$1 $2');
                        
                        return formattedMessage;
                    };
                    
                    Object.entries(serverErrors).forEach(([key, error]) => {
                        if (typeof error === 'string') {
                            const formattedMessage = formatErrorMessage(key, error);
                            formattedErrors[key] = formattedMessage;
                            customToast.error(formattedMessage);
                        } else if (Array.isArray(error)) {
                            const errorArray = error as Array<string | unknown>;
                            if (errorArray.length > 0) {
                                const firstError = String(errorArray[0] || '');
                                const formattedMessage = formatErrorMessage(key, firstError);
                                formattedErrors[key] = formattedMessage;
                                errorArray.forEach((err: string | unknown) => {
                                    if (typeof err === 'string') {
                                        const formattedErr = formatErrorMessage(key, err);
                                        customToast.error(formattedErr);
                                    }
                                });
                            }
                        }
                    });
                    
                    // Merge server errors with validation errors for display
                    setValidationErrors(prev => ({ ...prev, ...formattedErrors }));
                    
                    // Mark all error fields as touched
                    setTouchedFields(prev => {
                        const newTouched = new Set(prev);
                        Object.keys(formattedErrors).forEach(key => newTouched.add(key));
                        return newTouched;
                    });
                }
            },
            onFinish: () => {
                // Scroll to first error field if validation failed
                const allErrors = { ...validationErrors, ...errors };
                if (Object.keys(allErrors).length > 0) {
                    const firstErrorField = Object.keys(allErrors)[0];
                    if (firstErrorField) {
                        // Try multiple selectors to find the error field
                        const fieldName = firstErrorField.replace(/clinic\./g, 'clinic.');
                        const selectors = [
                            `[name="${fieldName}"]`,
                            `#${fieldName}`,
                            `#${fieldName.replace(/\./g, '\\.')}`,
                            `input[id*="${fieldName.split('.').pop()}"]`,
                        ];
                        
                        for (const selector of selectors) {
                            try {
                                const errorElement = document.querySelector(selector);
                                if (errorElement) {
                                    setTimeout(() => {
                                        errorElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
                                        (errorElement as HTMLElement).focus();
                                    }, 100);
                                    break;
                                }
                            } catch {
                                // Ignore selector errors
                            }
                        }
                    }
                }
            },
        });
    };

    const progress = (currentStep / TOTAL_STEPS) * 100;
    const steps = [
        { number: 1, title: t('account_information'), icon: Building2 },
        { number: 2, title: t('clinic_basic_info'), icon: FileText },
        { number: 3, title: t('address_location'), icon: MapPin },
        { number: 4, title: t('settings_policies'), icon: Settings },
        { number: 5, title: t('operating_hours'), icon: Clock },
        { number: 6, title: t('documents'), icon: Upload },
        // { number: 7, title: t('subscription'), icon: CreditCard }, // COMMENTED OUT - Subscription step hidden
    ];
    
    return (
        <div className="min-h-screen bg-gradient-to-br from-[#A8B5FF] via-[#8B7FD9] to-[#6B46C1] dark:from-slate-900 dark:via-[#4C1D95] dark:to-[#3B0F6B] py-12 px-6 relative" dir={dir}>
            {/* Logo */}
            <div className={cn("absolute top-6 z-10", isRTL ? "right-6" : "left-6")}>
                <Link href="/" className={cn("flex items-center gap-3", flexDirection)}>
                    {appLogo ? (
                        <img
                            src={appLogo}
                            alt={appName}
                            className="h-8 w-8 object-contain"
                        />
                    ) : (
                        <div className="h-8 w-8 rounded bg-primary-gradient flex items-center justify-center">
                            <span className="text-white text-sm font-bold">{appInitial}</span>
                        </div>
                    )}
                    <div className={cn("text-xl font-bold text-slate-800 dark:text-slate-100", isRTL ? "!text-right" : "!text-left")}>
                        {appName}
                    </div>
                </Link>
            </div>
            {/* Language Switcher */}
            <div className={cn("absolute top-6 z-10", isRTL ? "left-6" : "right-6")}>
                <LanguageSwitcher />
            </div>
            <div className="max-w-4xl mx-auto">
                {/* Header */}
                <div className="text-center mb-8">
                    <h1 className="text-4xl font-bold text-slate-900 dark:text-slate-100 mb-4 text-center">
                        {t('clinic_registration')}
                    </h1>
                    <p className={cn("text-lg text-slate-600 dark:text-slate-300", isRTL ? "!text-right" : "text-center")}>
                        {t('clinic_registration_description')}
                    </p>
                </div>

                {/* Progress Steps */}
                <div className={cn("bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 dark:border-slate-700/20 p-6 mb-6", isRTL ? "!text-right" : "!text-left")} dir={dir}>
                    <div className={cn("flex items-center justify-between mb-4", flexDirection)}>
                        {steps.map((step, index) => {
                            const StepIcon = step.icon;
                            const isActive = currentStep === step.number;
                            const isCompleted = currentStep > step.number;
                            
                            return (
                                <div key={step.number} className="flex items-center flex-1">
                                    <div className="flex flex-col items-center flex-1">
                                        <div className={cn(
                                            "flex items-center justify-center w-12 h-12 rounded-full border-2 transition-all",
                                            isActive 
                                                ? 'bg-primary border-primary text-white' 
                                                : isCompleted 
                                                    ? 'bg-green-500 border-green-500 text-white' 
                                                    : 'bg-slate-100 dark:bg-slate-700 border-slate-300 dark:border-slate-600 text-slate-400'
                                        )}>
                                            {isCompleted ? (
                                                <Check className="h-6 w-6" />
                                            ) : (
                                                <StepIcon className="h-6 w-6" />
                                            )}
                                        </div>
                                        <span className={cn("text-xs mt-2 text-center", isActive ? 'font-semibold text-primary' : 'text-slate-500 dark:text-slate-400')}>
                                            {step.title}
                                        </span>
                                    </div>
                                    {index < steps.length - 1 && (
                                        <div className={cn(
                                            "flex-1 h-0.5 mx-2 -mt-6",
                                            isCompleted ? 'bg-green-500' : 'bg-slate-200 dark:bg-slate-700'
                                        )} />
                                    )}
                                </div>
                            );
                        })}
                    </div>
                    <Progress value={progress} className="h-2" />
                    <p className={cn("text-sm text-slate-500 dark:text-slate-400 mt-2", isRTL ? "!text-right" : "text-center")} dir={dir}>
                        {t('step')} {currentStep} {t('of')} {TOTAL_STEPS}
                    </p>
                </div>

                {/* Main Form */}
                <div className={cn("bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm rounded-3xl shadow-2xl border border-white/20 dark:border-slate-700/20 overflow-hidden", isRTL ? "!text-right" : "!text-left")} dir={dir}>
                    <Head title={t('clinic_registration')} />
                    <form onSubmit={submit} encType="multipart/form-data">
                        <div className="p-8" dir={dir}>
                                {/* Step 1: User Account Information */}
                            {currentStep === 1 && (
                                <div className="space-y-6">
                                    <div className={cn("flex items-center gap-3 mb-6", flexDirection)}>
                                        <Building2 className="h-6 w-6 text-primary" />
                                        <h2 className={cn("text-2xl font-semibold text-slate-900 dark:text-slate-100", isRTL ? "!text-right" : "!text-left")}>
                                            {t('account_information')}
                                        </h2>
                                    </div>
                                    
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className={cn("space-y-2", isRTL ? "!text-right" : "!text-left")}>
                                            <Label htmlFor="name" className={cn(isRTL ? "!text-right" : "!text-left")}>
                                                {t('full_name')} <span className="text-red-500">*</span>
                                            </Label>
                                            <Input
                                                id="name"
                                                type="text"
                                                required
                                                autoFocus
                                                value={data.name}
                                                maxLength={30}
                                                onChange={(e) => {
                                                    const value = e.target.value.trimStart();
                                                    // Enforce max length of 30 characters
                                                    const limitedValue = value.slice(0, 30);
                                                    setData('name', limitedValue);
                                                    // Clear error if field was previously invalid
                                                    if (validationErrors.name) {
                                                        setValidationErrors(prev => {
                                                            const newErrors = { ...prev };
                                                            delete newErrors.name;
                                                            return newErrors;
                                                        });
                                                    }
                                                }}
                                                onBlur={() => {
                                                    const trimmed = data.name.trim();
                                                    setData('name', trimmed);
                                                    // Only validate if field was already touched (after submit attempt)
                                                    if (touchedFields.has('name')) {
                                                        handleFieldBlur('name');
                                                    }
                                                }}
                                                placeholder={t('enter_full_name')}
                                                dir={getFieldDir('text')}
                                                className={cn(
                                                    (errors.name || validationErrors.name) ? 'border-red-500' : '',
                                                    'dark:bg-slate-800 dark:text-slate-100 dark:border-slate-600',
                                                    getInputTextAlign('text')
                                                )}
                                            />
                                            <InputError message={errors.name || validationErrors.name} className={cn(isRTL ? "!text-right" : "!text-left")} dir={dir} />
                                        </div>

                                        <div className={cn("space-y-2", isRTL ? "!text-right" : "!text-left")}>
                                            <Label htmlFor="phone" className={cn(isRTL ? "!text-right" : "!text-left")}>
                                                {t('phone_number')} <span className="text-red-500">*</span>
                                            </Label>
                                            <PhoneInput
                                                id="phone"
                                                required
                                                value={data.phone}
                                                onChange={(value) => {
                                                    setData('phone', value);
                                                    // Clear error if field was previously invalid
                                                    if (validationErrors.phone) {
                                                        setValidationErrors(prev => {
                                                            const newErrors = { ...prev };
                                                            delete newErrors.phone;
                                                            return newErrors;
                                                        });
                                                    }
                                                }}
                                                onBlur={() => {
                                                    // Validate phone on blur
                                                    const isValid = isValidPhone(data.phone);
                                                    if (!isValid && data.phone) {
                                                        setValidationErrors(prev => ({
                                                            ...prev,
                                                            phone: t('phone_invalid_format')
                                                        }));
                                                    } else {
                                                        setValidationErrors(prev => {
                                                            const newErrors = { ...prev };
                                                            delete newErrors.phone;
                                                            return newErrors;
                                                        });
                                                    }
                                                    handleFieldBlur('phone');
                                                }}
                                                dir={getFieldDir('phone')}
                                                className={cn(
                                                    (errors.phone || validationErrors.phone) ? 'border-red-500' : '',
                                                    getInputTextAlign('phone')
                                                )}
                                            />
                                            <InputError message={errors.phone || validationErrors.phone} className={cn(isRTL ? "!text-right" : "!text-left")} dir={dir} />
                                            <p className={cn("text-xs text-slate-500 dark:text-slate-400", isRTL ? "!text-right" : "!text-left")} dir={dir}>{t('phone_format_hint')}</p>
                                        </div>

                                        <div className={cn("space-y-2", isRTL ? "!text-right" : "!text-left")}>
                                            <Label htmlFor="email" className={cn(isRTL ? "!text-right" : "!text-left")}>
                                                {t('email_address')} <span className="text-red-500">*</span>
                                            </Label>
                                            <Input
                                                id="email"
                                                type="email"
                                                required
                                                value={data.email}
                                                onChange={(e) => {
                                                    const value = e.target.value.trimStart();
                                                    setData('email', value);
                                                    // Clear error if field was previously invalid
                                                    if (validationErrors.email) {
                                                        setValidationErrors(prev => {
                                                            const newErrors = { ...prev };
                                                            delete newErrors.email;
                                                            return newErrors;
                                                        });
                                                    }
                                                }}
                                                onBlur={(e) => {
                                                    const trimmed = e.target.value.trim().toLowerCase();
                                                    setData('email', trimmed);
                                                    handleFieldBlur('email');
                                                }}
                                                placeholder={t('email_example')}
                                                dir={getFieldDir('email')}
                                                className={cn(
                                                    (errors.email || validationErrors.email) ? 'border-red-500' : '',
                                                    'dark:bg-slate-800 dark:text-slate-100 dark:border-slate-600',
                                                    getInputTextAlign('email')
                                                )}
                                            />
                                            <InputError message={errors.email || validationErrors.email} className={cn(isRTL ? "!text-right" : "!text-left")} dir={dir} />
                                    </div>

                                        <div className={cn("space-y-2", isRTL ? "!text-right" : "!text-left")}>
                                            <Label htmlFor="password" className={cn(isRTL ? "!text-right" : "!text-left")}>
                                                {t('password')} <span className="text-red-500">*</span>
                                            </Label>
                                            <PasswordInput
                                                id="password"
                                                required
                                                value={data.password}
                                                showValidation={true}
                                                onChange={(e) => {
                                                    const value = e.target.value;
                                                    setData('password', value);
                                                }}
                                                onBlur={(e) => {
                                                    const trimmed = e.target.value.trim();
                                                    setData('password', trimmed);
                                                    handleFieldBlur('password');
                                                }}
                                                placeholder={t('password')}
                                                error={errors.password || validationErrors.password}
                                                className={getInputTextAlign('text')}
                                            />
                                            <InputError message={errors.password || validationErrors.password} className={cn(isRTL ? "!text-right" : "!text-left")} dir={dir} />
                                        </div>

                                        <div className={cn("space-y-2 md:col-span-2", isRTL ? "!text-right" : "!text-left")}>
                                            <Label htmlFor="password_confirmation" className={cn(isRTL ? "!text-right" : "!text-left")}>
                                                {t('confirm_password')} <span className="text-red-500">*</span>
                                            </Label>
                                            <PasswordInput
                                                id="password_confirmation"
                                                required
                                                value={data.password_confirmation}
                                                onChange={(e) => {
                                                    const value = e.target.value;
                                                    setData('password_confirmation', value);
                                                    // Clear error if field was previously invalid
                                                    if (validationErrors.password_confirmation) {
                                                        setValidationErrors(prev => {
                                                            const newErrors = { ...prev };
                                                            delete newErrors.password_confirmation;
                                                            return newErrors;
                                                        });
                                                    }
                                                }}
                                                onBlur={(e) => {
                                                    const trimmed = e.target.value.trim();
                                                    setData('password_confirmation', trimmed);
                                                    handleFieldBlur('password_confirmation');
                                                }}
                                                placeholder={t('confirm_password')}
                                                error={errors.password_confirmation}
                                                className={getInputTextAlign('text')}
                                            />
                                            <InputError message={errors.password_confirmation || validationErrors.password_confirmation} className={cn(isRTL ? "!text-right" : "!text-left")} dir={dir} />
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Step 2: Clinic Basic Information */}
                            {currentStep === 2 && (
                                <div className="space-y-6">
                                    <div className={cn("flex items-center gap-3 mb-6", flexDirection)}>
                                        <FileText className="h-6 w-6 text-primary" />
                                        <h2 className={cn("text-2xl font-semibold text-slate-900 dark:text-slate-100", isRTL ? "!text-right" : "!text-left")}>
                                            {t('clinic_basic_info')}
                                        </h2>
                                </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className={cn("space-y-2", isRTL ? "!text-right" : "!text-left")}>
                                            <Label htmlFor="clinic.name_en" className={cn(isRTL ? "!text-right" : "!text-left")}>
                                                {t('clinic_name_en')} <span className="text-red-500">*</span>
                                            </Label>
                                            <Input
                                                id="clinic.name_en"
                                                type="text"
                                                required
                                                value={data.clinic.name_en}
                                                maxLength={30}
                                                onChange={(e) => {
                                                    const value = e.target.value.trimStart();
                                                    // Enforce max length of 30 characters
                                                    const limitedValue = value.slice(0, 30);
                                                    setData('clinic.name_en', limitedValue);
                                                    
                                                    // Real-time validation for English only
                                                    if (value && value.trim()) {
                                                        const englishPattern = /^[a-zA-Z0-9\s\-_.,;:!?@#$%^&*()[\]{}""''/\n\r]+$/;
                                                        if (!englishPattern.test(value)) {
                                                            setValidationErrors(prev => ({
                                                                ...prev,
                                                                'clinic.name_en': t('clinic_name_en_must_be_english')
                                                            }));
                                                        } else {
                                                            setValidationErrors(prev => {
                                                                const newErrors = { ...prev };
                                                                delete newErrors['clinic.name_en'];
                                                                return newErrors;
                                                            });
                                                        }
                                                    } else {
                                                        setValidationErrors(prev => {
                                                            const newErrors = { ...prev };
                                                            delete newErrors['clinic.name_en'];
                                                            return newErrors;
                                                        });
                                                    }
                                                }}
                                                onBlur={(e) => {
                                                    const trimmed = e.target.value.trim();
                                                    setData('clinic.name_en', trimmed);
                                                    handleFieldBlur('clinic.name_en');
                                                }}
                                                placeholder={t('enter_clinic_name_en')}
                                                dir={getFieldDir('text')}
                                                className={cn(
                                                    (errors['clinic.name_en'] || validationErrors['clinic.name_en']) ? 'border-red-500' : '',
                                                    'dark:bg-slate-800 dark:text-slate-100 dark:border-slate-600',
                                                    getInputTextAlign('text')
                                                )}
                                            />
                                            <InputError message={errors['clinic.name_en'] || validationErrors['clinic.name_en']} className={cn(isRTL ? "!text-right" : "!text-left")} dir={dir} />
                                        </div>

                                        <div className={cn("space-y-2", isRTL ? "!text-right" : "!text-left")}>
                                            <Label htmlFor="clinic.name_ar" className={cn(isRTL ? "!text-right" : "!text-left")}>
                                                {t('clinic_name_ar')} <span className="text-red-500">*</span>
                                            </Label>
                                            <Input
                                                id="clinic.name_ar"
                                                type="text"
                                                required
                                                value={data.clinic.name_ar}
                                                maxLength={30}
                                                onChange={(e) => {
                                                    const value = e.target.value.trimStart();
                                                    // Enforce max length of 30 characters
                                                    const limitedValue = value.slice(0, 30);
                                                    setData('clinic.name_ar', limitedValue);
                                                    
                                                    // Real-time validation for Arabic only
                                                    if (value && value.trim()) {
                                                        const arabicPattern = /^[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF\s\u0660-\u0669\u06F0-\u06F9.,;:!?\-_()[\]{}""''«»/\n\r]+$/u;
                                                        if (!arabicPattern.test(value)) {
                                                            setValidationErrors(prev => ({
                                                                ...prev,
                                                                'clinic.name_ar': t('clinic_name_ar_must_be_arabic')
                                                            }));
                                                        } else {
                                                            setValidationErrors(prev => {
                                                                const newErrors = { ...prev };
                                                                delete newErrors['clinic.name_ar'];
                                                                return newErrors;
                                                            });
                                                        }
                                                    } else {
                                                        setValidationErrors(prev => {
                                                            const newErrors = { ...prev };
                                                            delete newErrors['clinic.name_ar'];
                                                            return newErrors;
                                                        });
                                                    }
                                                }}
                                                onBlur={(e) => {
                                                    const trimmed = e.target.value.trim();
                                                    setData('clinic.name_ar', trimmed);
                                                    handleFieldBlur('clinic.name_ar');
                                                }}
                                                placeholder={t('enter_clinic_name_ar')}
                                                dir={getFieldDir('text')}
                                                className={cn(
                                                    (errors['clinic.name_ar'] || validationErrors['clinic.name_ar']) ? 'border-red-500' : '',
                                                    'dark:bg-slate-800 dark:text-slate-100 dark:border-slate-600',
                                                    getInputTextAlign('text')
                                                )}
                                            />
                                            <InputError message={errors['clinic.name_ar'] || validationErrors['clinic.name_ar']} className={cn(isRTL ? "!text-right" : "!text-left")} dir={dir} />
                                        </div>

                                        <div className={cn("space-y-2", isRTL ? "!text-right" : "!text-left")}>
                                            <Label htmlFor="clinic.phone" className={cn(isRTL ? "!text-right" : "!text-left")}>
                                                {t('clinic_phone')} <span className="text-red-500">*</span>
                                            </Label>
                                            <PhoneInput
                                                id="clinic.phone"
                                                required
                                                value={data.clinic.phone}
                                                onChange={(value) => {
                                                    setData('clinic.phone', value);
                                                    // Clear error if field was previously invalid
                                                    if (validationErrors['clinic.phone']) {
                                                        setValidationErrors(prev => {
                                                            const newErrors = { ...prev };
                                                            delete newErrors['clinic.phone'];
                                                            return newErrors;
                                                        });
                                                    }
                                                }}
                                                onBlur={() => {
                                                    // Validate phone on blur - show error if invalid format
                                                    if (data.clinic.phone) {
                                                        const isValid = isValidPhone(data.clinic.phone);
                                                        if (!isValid) {
                                                            setValidationErrors(prev => ({
                                                                ...prev,
                                                                'clinic.phone': t('clinic_phone_invalid_format')
                                                            }));
                                                        } else {
                                                            setValidationErrors(prev => {
                                                                const newErrors = { ...prev };
                                                                delete newErrors['clinic.phone'];
                                                                return newErrors;
                                                            });
                                                        }
                                                    }
                                                    handleFieldBlur('clinic.phone');
                                                }}
                                                dir={getFieldDir('phone')}
                                                className={cn(
                                                    (errors['clinic.phone'] || validationErrors['clinic.phone']) ? 'border-red-500' : '',
                                                    getInputTextAlign('phone')
                                                )}
                                            />
                                            <InputError message={errors['clinic.phone'] || validationErrors['clinic.phone']} className={cn(isRTL ? "!text-right" : "!text-left")} dir={dir} />
                                        </div>

                                        <div className={cn("space-y-2", isRTL ? "!text-right" : "!text-left")}>
                                            <Label htmlFor="clinic.email" className={cn(isRTL ? "!text-right" : "!text-left")}>
                                                {t('clinic_email')} <span className="text-muted-foreground text-sm">({t('optional')})</span>
                                            </Label>
                                            <div className="relative">
                                                <Input
                                                    id="clinic.email"
                                                    type="email"
                                                    value={data.clinic.email}
                                                    onChange={(e) => {
                                                        setData('clinic.email', e.target.value);
                                                        // Clear error when user types
                                                        if (validationErrors['clinic.email']) {
                                                            setValidationErrors(prev => {
                                                                const newErrors = { ...prev };
                                                                delete newErrors['clinic.email'];
                                                                return newErrors;
                                                            });
                                                        }
                                                    }}
                                                    onBlur={() => handleFieldBlur('clinic.email')}
                                                    placeholder={t('clinic_email_placeholder')}
                                                    dir={getFieldDir('email')}
                                                    className={cn(
                                                        (errors['clinic.email'] || validationErrors['clinic.email']) ? 'border-red-500' : '',
                                                        'dark:bg-slate-800 dark:text-slate-100 dark:border-slate-600',
                                                        getInputTextAlign('email')
                                                    )}
                                                    disabled={checkingEmail}
                                                />
                                                {checkingEmail && (
                                                    <div className={cn("absolute top-1/2 -translate-y-1/2", isRTL ? "left-3" : "right-3")}>
                                                        <LoaderCircle className="h-4 w-4 animate-spin text-muted-foreground" />
                                                    </div>
                                                )}
                                            </div>
                                            <InputError message={errors['clinic.email'] || validationErrors['clinic.email']} className={cn(isRTL ? "!text-right" : "!text-left")} dir={dir} />
                                        </div>

                                        <div className={cn("space-y-2", isRTL ? "!text-right" : "!text-left")}>
                                            <Label htmlFor="clinic.category_id" className={cn(isRTL ? "!text-right" : "!text-left")}>
                                                {t('category')} <span className="text-red-500">*</span>
                                            </Label>
                                            <Select
                                                value={data.clinic.category_id || undefined}
                                                onValueChange={(value) => setData('clinic.category_id', value)}
                                            >
                                                <SelectTrigger className="dark:bg-slate-800 dark:text-slate-100 dark:border-slate-600">
                                                    <SelectValue placeholder={t('select_category')} />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {categories && categories.length > 0 ? (
                                                        categories.map((category) => (
                                                            <SelectItem key={category.id} value={category.id.toString()}>
                                                                {isRTL ? category.name_ar : category.name_en}
                                                            </SelectItem>
                                                        ))
                                                    ) : (
                                                        <SelectItem value="no-categories" disabled>
                                                            {t('no_categories_available')}
                                                        </SelectItem>
                                                    )}
                                                </SelectContent>
                                            </Select>
                                </div>

                                        <div className={cn("space-y-2", isRTL ? "!text-right" : "!text-left")}>
                                            <Label htmlFor="clinic.logo" className={cn(isRTL ? "!text-right" : "!text-left")}>
                                                {t('clinic_logo')} <span className="text-muted-foreground text-sm">({t('optional')})</span>
                                            </Label>
                                            <div className={cn("flex items-center gap-4", flexDirection)}>
                                                <Input
                                                    id="clinic.logo"
                                                    type="file"
                                                    accept="image/jpeg,image/jpg,image/png"
                                                    onChange={(e) => handleFileChange('logo', e.target.files?.[0] || null, setLogoPreview)}
                                                    className="flex-1 dark:bg-slate-800 dark:text-slate-100 dark:border-slate-600 file:dark:bg-slate-700 file:dark:text-slate-100"
                                                />
                                                {logoPreview && (
                                                    <img src={logoPreview} alt="Logo preview" className="h-16 w-16 object-cover rounded" />
                                                )}
                                            </div>
                                            <InputError message={validationErrors['clinic.logo']} className={cn(isRTL ? "!text-right" : "!text-left")} dir={dir} />
                                        </div>

                                        <div className={cn("space-y-2 md:col-span-2", isRTL ? "!text-right" : "!text-left")}>
                                            <Label htmlFor="clinic.bio_en" className={cn(isRTL ? "!text-right" : "!text-left")}>
                                                {t('description_en')} <span className="text-muted-foreground text-sm">({t('optional')})</span>
                                            </Label>
                                            <Textarea
                                                id="clinic.bio_en"
                                                value={data.clinic.bio_en}
                                                maxLength={2000}
                                                onChange={(e) => {
                                                    const value = e.target.value;
                                                    // Enforce max length of 2000 characters
                                                    const limitedValue = value.slice(0, 2000);
                                                    setData('clinic.bio_en', limitedValue);
                                                    
                                                    // Real-time validation for English only
                                                    if (value && value.trim()) {
                                                        const englishPattern = /^[a-zA-Z0-9\s\-_.,;:!?@#$%^&*()[\]{}""''/\n\r]+$/;
                                                        if (!englishPattern.test(value)) {
                                                            const fieldName = t('description_en') || 'Description (English)';
                                                            const errorMsg = t('description_en_must_be_english') || t('field_must_be_english_only')?.replace(':attribute', fieldName) || `${fieldName} must contain only English characters`;
                                                            setValidationErrors(prev => ({
                                                                ...prev,
                                                                'clinic.bio_en': errorMsg
                                                            }));
                                                        } else {
                                                            setValidationErrors(prev => {
                                                                const newErrors = { ...prev };
                                                                delete newErrors['clinic.bio_en'];
                                                                return newErrors;
                                                            });
                                                        }
                                                    } else {
                                                        setValidationErrors(prev => {
                                                            const newErrors = { ...prev };
                                                            delete newErrors['clinic.bio_en'];
                                                            return newErrors;
                                                        });
                                                    }
                                                }}
                                                placeholder={t('enter_description_en')}
                                                rows={4}
                                                dir={getFieldDir('textarea')}
                                                className={cn(
                                                    (errors['clinic.bio_en'] || validationErrors['clinic.bio_en']) ? 'border-red-500' : '',
                                                    'dark:bg-slate-800 dark:text-slate-100 dark:border-slate-600',
                                                    getInputTextAlign('textarea')
                                                )}
                                            />
                                            <InputError message={errors['clinic.bio_en'] || validationErrors['clinic.bio_en']} className={cn(isRTL ? "!text-right" : "!text-left")} dir={dir} />
                                        </div>

                                        <div className={cn("space-y-2 md:col-span-2", isRTL ? "!text-right" : "!text-left")}>
                                            <Label htmlFor="clinic.bio_ar" className={cn(isRTL ? "!text-right" : "!text-left")}>
                                                {t('description_ar')} <span className="text-muted-foreground text-sm">({t('optional')})</span>
                                            </Label>
                                            <Textarea
                                                id="clinic.bio_ar"
                                                value={data.clinic.bio_ar}
                                                maxLength={2000}
                                                onChange={(e) => {
                                                    const value = e.target.value;
                                                    // Enforce max length of 2000 characters
                                                    const limitedValue = value.slice(0, 2000);
                                                    setData('clinic.bio_ar', limitedValue);
                                                    
                                                    // Real-time validation for Arabic only
                                                    if (value && value.trim()) {
                                                        const arabicPattern = /^[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF\s\u0660-\u0669\u06F0-\u06F9.,;:!?\-_()[\]{}""''«»/\n\r]+$/u;
                                                        if (!arabicPattern.test(value)) {
                                                            const fieldName = t('description_ar') || 'Description (Arabic)';
                                                            const errorMsg = t('description_ar_must_be_arabic') || t('field_must_be_arabic_only')?.replace(':attribute', fieldName) || `${fieldName} must contain only Arabic characters`;
                                                            setValidationErrors(prev => ({
                                                                ...prev,
                                                                'clinic.bio_ar': errorMsg
                                                            }));
                                                        } else {
                                                            setValidationErrors(prev => {
                                                                const newErrors = { ...prev };
                                                                delete newErrors['clinic.bio_ar'];
                                                                return newErrors;
                                                            });
                                                        }
                                                    } else {
                                                        setValidationErrors(prev => {
                                                            const newErrors = { ...prev };
                                                            delete newErrors['clinic.bio_ar'];
                                                            return newErrors;
                                                        });
                                                    }
                                                }}
                                                placeholder={t('enter_description_ar')}
                                                rows={4}
                                                dir={getFieldDir('textarea')}
                                                className={cn(
                                                    (errors['clinic.bio_ar'] || validationErrors['clinic.bio_ar']) ? 'border-red-500' : '',
                                                    'dark:bg-slate-800 dark:text-slate-100 dark:border-slate-600',
                                                    getInputTextAlign('textarea')
                                                )}
                                            />
                                            <InputError message={errors['clinic.bio_ar'] || validationErrors['clinic.bio_ar']} className={cn(isRTL ? "!text-right" : "!text-left")} dir={dir} />
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Step 3: Address & Location */}
                            {currentStep === 3 && (
                                <div className="space-y-6">
                                    <div className={cn("flex items-center gap-3 mb-6", flexDirection)}>
                                        <MapPin className="h-6 w-6 text-primary" />
                                        <h2 className={cn("text-2xl font-semibold text-slate-900 dark:text-slate-100", isRTL ? "!text-right" : "!text-left")}>
                                            {t('address_location')}
                                        </h2>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className={cn("space-y-2", isRTL ? "!text-right" : "!text-left")}>
                                            <Label htmlFor="clinic.governorate_id" className={cn(isRTL ? "!text-right" : "!text-left")}>
                                                {t('governorate')} <span className="text-red-500">*</span>
                                            </Label>
                                            <Select
                                                value={data.clinic.governorate_id || undefined}
                                                onValueChange={handleGovernorateChange}
                                            >
                                                <SelectTrigger className={cn(
                                                    errors['clinic.governorate_id'] ? 'border-red-500' : '',
                                                    'dark:bg-slate-800 dark:text-slate-100 dark:border-slate-600'
                                                )}>
                                                    <SelectValue placeholder={t('select_governorate')} />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {governorates && governorates.length > 0 ? (
                                                        governorates.map((gov) => (
                                                            <SelectItem key={gov.id} value={gov.id.toString()}>
                                                                {isRTL ? gov.name_ar : gov.name_en}
                                                            </SelectItem>
                                                        ))
                                                    ) : (
                                                        <SelectItem value="no-governorates" disabled>
                                                            {t('no_governorates_available')}
                                                        </SelectItem>
                                                    )}
                                                </SelectContent>
                                            </Select>
                                            <InputError message={errors['clinic.governorate_id'] || validationErrors['clinic.governorate_id']} className={cn(isRTL ? "!text-right" : "!text-left")} dir={dir} />
                                        </div>

                                        <div className={cn("space-y-2", isRTL ? "!text-right" : "!text-left")}>
                                            <Label htmlFor="clinic.area_id" className={cn(isRTL ? "!text-right" : "!text-left")}>
                                                {t('area')} <span className="text-red-500">*</span>
                                            </Label>
                                            <Select
                                                value={data.clinic.area_id || undefined}
                                                onValueChange={(value) => setData('clinic.area_id', value)}
                                                disabled={!selectedGovernorate}
                                            >
                                                <SelectTrigger className={cn(
                                                    errors['clinic.area_id'] ? 'border-red-500' : '',
                                                    'dark:bg-slate-800 dark:text-slate-100 dark:border-slate-600'
                                                )}>
                                                    <SelectValue placeholder={selectedGovernorate ? t('select_area') : t('select_governorate_first')} />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {areas && areas.length > 0 ? (
                                                        areas.map((area) => (
                                                            <SelectItem key={area.id} value={area.id.toString()}>
                                                                {isRTL ? area.name_ar : area.name_en}
                                                            </SelectItem>
                                                        ))
                                                    ) : (
                                                        <SelectItem value="no-areas" disabled>
                                                            {selectedGovernorate ? t('no_areas_available') : t('select_governorate_first')}
                                                        </SelectItem>
                                                    )}
                                                </SelectContent>
                                            </Select>
                                            <InputError message={errors['clinic.area_id'] || validationErrors['clinic.area_id']} className={cn(isRTL ? "!text-right" : "!text-left")} dir={dir} />
                                        </div>

                                        <div className={cn("space-y-2 md:col-span-2", isRTL ? "!text-right" : "!text-left")}>
                                            <AddressAutocomplete
                                                id="clinic.address"
                                                label={t('address')}
                                                value={data.clinic.address}
                                                onChange={(field, value) => {
                                                    setData('clinic.address', value);
                                                    // Clear error if field was previously invalid
                                                    if (validationErrors['clinic.address']) {
                                                        setValidationErrors(prev => {
                                                            const newErrors = { ...prev };
                                                            delete newErrors['clinic.address'];
                                                            return newErrors;
                                                        });
                                                    }
                                                }}
                                                onAddressChange={handleAddressChange}
                                                placeholder={t('enter_full_address')}
                                                error={errors['clinic.address'] || validationErrors['clinic.address']}
                                                required
                                                maxLength={2000}
                                                rows={2}
                                                countryRestriction="KW"
                                                governorateName={
                                                    data.clinic.governorate_id && governorates
                                                        ? (governorates.find(g => g.id.toString() === data.clinic.governorate_id)
                                                            ? (isRTL
                                                                ? governorates.find(g => g.id.toString() === data.clinic.governorate_id)?.name_ar
                                                                : governorates.find(g => g.id.toString() === data.clinic.governorate_id)?.name_en)
                                                            : undefined)
                                                        : undefined
                                                }
                                                areaName={
                                                    data.clinic.area_id && areas
                                                        ? (areas.find(a => a.id.toString() === data.clinic.area_id)
                                                            ? (isRTL
                                                                ? areas.find(a => a.id.toString() === data.clinic.area_id)?.name_ar
                                                                : areas.find(a => a.id.toString() === data.clinic.area_id)?.name_en)
                                                            : undefined)
                                                        : undefined
                                                }
                                                requireGovernorateAndArea={true}
                                            />
                                        </div>

                                        <div className="space-y-2">
                                            <Label htmlFor="clinic.block">
                                                {t('block')} <span className="text-muted-foreground text-sm">({t('optional')})</span>
                                            </Label>
                                            <Input
                                                id="clinic.block"
                                                type="text"
                                                value={data.clinic.block}
                                                maxLength={50}
                                                onChange={(e) => {
                                                    const value = e.target.value.slice(0, 50);
                                                    setData('clinic.block', value);
                                                    if (validationErrors['clinic.block']) {
                                                        setValidationErrors(prev => {
                                                            const newErrors = { ...prev };
                                                            delete newErrors['clinic.block'];
                                                            return newErrors;
                                                        });
                                                    }
                                                }}
                                                onBlur={() => handleFieldBlur('clinic.block')}
                                                placeholder={t('enter_block')}
                                                dir={getFieldDir('text')}
                                                className={cn(
                                                    (errors['clinic.block'] || validationErrors['clinic.block']) ? 'border-red-500' : '',
                                                    'dark:bg-slate-800 dark:text-slate-100 dark:border-slate-600',
                                                    getInputTextAlign('text')
                                                )}
                                                disabled={!data.clinic.governorate_id || !data.clinic.area_id}
                                            />
                                            <InputError message={errors['clinic.block'] || validationErrors['clinic.block']} className={cn(isRTL ? "!text-right" : "!text-left")} dir={dir} />
                                        </div>

                                        <div className={cn("space-y-2", isRTL ? "!text-right" : "!text-left")}>
                                            <Label htmlFor="clinic.street" className={cn(isRTL ? "!text-right" : "!text-left")}>
                                                {t('street')} <span className="text-muted-foreground text-sm">({t('optional')})</span>
                                            </Label>
                                            <Input
                                                id="clinic.street"
                                                type="text"
                                                value={data.clinic.street}
                                                maxLength={100}
                                                onChange={(e) => {
                                                    const value = e.target.value.slice(0, 100);
                                                    setData('clinic.street', value);
                                                    if (validationErrors['clinic.street']) {
                                                        setValidationErrors(prev => {
                                                            const newErrors = { ...prev };
                                                            delete newErrors['clinic.street'];
                                                            return newErrors;
                                                        });
                                                    }
                                                }}
                                                onBlur={() => handleFieldBlur('clinic.street')}
                                                placeholder={t('enter_street')}
                                                dir={getFieldDir('text')}
                                                className={cn(
                                                    (errors['clinic.street'] || validationErrors['clinic.street']) ? 'border-red-500' : '',
                                                    'dark:bg-slate-800 dark:text-slate-100 dark:border-slate-600',
                                                    getInputTextAlign('text')
                                                )}
                                                disabled={!data.clinic.governorate_id || !data.clinic.area_id}
                                            />
                                            <InputError message={errors['clinic.street'] || validationErrors['clinic.street']} className={cn(isRTL ? "!text-right" : "!text-left")} dir={dir} />
                                        </div>

                                        <div className="space-y-2">
                                            <Label htmlFor="clinic.avenue">
                                                {t('avenue')} <span className="text-muted-foreground text-sm">({t('optional')})</span>
                                            </Label>
                                            <Input
                                                id="clinic.avenue"
                                                type="text"
                                                value={data.clinic.avenue}
                                                maxLength={100}
                                                onChange={(e) => {
                                                    const value = e.target.value.slice(0, 100);
                                                    setData('clinic.avenue', value);
                                                    if (validationErrors['clinic.avenue']) {
                                                        setValidationErrors(prev => {
                                                            const newErrors = { ...prev };
                                                            delete newErrors['clinic.avenue'];
                                                            return newErrors;
                                                        });
                                                    }
                                                }}
                                                onBlur={() => handleFieldBlur('clinic.avenue')}
                                                placeholder={t('enter_avenue')}
                                                dir={getFieldDir('text')}
                                                className={cn(
                                                    (errors['clinic.avenue'] || validationErrors['clinic.avenue']) ? 'border-red-500' : '',
                                                    'dark:bg-slate-800 dark:text-slate-100 dark:border-slate-600',
                                                    getInputTextAlign('text')
                                                )}
                                                disabled={!data.clinic.governorate_id || !data.clinic.area_id}
                                            />
                                            <InputError message={errors['clinic.avenue'] || validationErrors['clinic.avenue']} className={cn(isRTL ? "!text-right" : "!text-left")} dir={dir} />
                                        </div>

                                        <div className={cn("space-y-2", isRTL ? "!text-right" : "!text-left")}>
                                            <Label htmlFor="clinic.house" className={cn(isRTL ? "!text-right" : "!text-left")}>
                                                {t('house')} <span className="text-muted-foreground text-sm">({t('optional')})</span>
                                            </Label>
                                            <Input
                                                id="clinic.house"
                                                type="text"
                                                value={data.clinic.house}
                                                maxLength={50}
                                                onChange={(e) => {
                                                    const value = e.target.value.slice(0, 50);
                                                    setData('clinic.house', value);
                                                }}
                                                onBlur={() => handleFieldBlur('clinic.house')}
                                                placeholder={t('enter_house')}
                                                dir={getFieldDir('text')}
                                                className={cn(
                                                    (errors['clinic.house'] || validationErrors['clinic.house']) ? 'border-red-500' : '',
                                                    'dark:bg-slate-800 dark:text-slate-100 dark:border-slate-600',
                                                    getInputTextAlign('text')
                                                )}
                                                disabled={!data.clinic.governorate_id || !data.clinic.area_id}
                                            />
                                            <InputError message={errors['clinic.house'] || validationErrors['clinic.house']} className={cn(isRTL ? "!text-right" : "!text-left")} dir={dir} />
                                        </div>

                                        <div className={cn("space-y-2", isRTL ? "!text-right" : "!text-left")}>
                                            <Label htmlFor="clinic.floor" className={cn(isRTL ? "!text-right" : "!text-left")}>
                                                {t('floor')} <span className="text-muted-foreground text-sm">({t('optional')})</span>
                                            </Label>
                                            <Input
                                                id="clinic.floor"
                                                type="text"
                                                value={data.clinic.floor}
                                                maxLength={50}
                                                onChange={(e) => {
                                                    const value = e.target.value.slice(0, 50);
                                                    setData('clinic.floor', value);
                                                    if (validationErrors['clinic.floor']) {
                                                        setValidationErrors(prev => {
                                                            const newErrors = { ...prev };
                                                            delete newErrors['clinic.floor'];
                                                            return newErrors;
                                                        });
                                                    }
                                                }}
                                                onBlur={() => handleFieldBlur('clinic.floor')}
                                                placeholder={t('enter_floor')}
                                                dir={getFieldDir('text')}
                                                className={cn(
                                                    (errors['clinic.floor'] || validationErrors['clinic.floor']) ? 'border-red-500' : '',
                                                    'dark:bg-slate-800 dark:text-slate-100 dark:border-slate-600',
                                                    getInputTextAlign('text')
                                                )}
                                                disabled={!data.clinic.governorate_id || !data.clinic.area_id}
                                            />
                                            <InputError message={errors['clinic.floor'] || validationErrors['clinic.floor']} className={cn(isRTL ? "!text-right" : "!text-left")} dir={dir} />
                                        </div>

                                        <div className={cn("space-y-2", isRTL ? "!text-right" : "!text-left")}>
                                            <Label htmlFor="clinic.apt" className={cn(isRTL ? "!text-right" : "!text-left")}>
                                                {t('apartment')} <span className="text-muted-foreground text-sm">({t('optional')})</span>
                                            </Label>
                                            <Input
                                                id="clinic.apt"
                                                type="text"
                                                value={data.clinic.apt}
                                                maxLength={50}
                                                onChange={(e) => {
                                                    const value = e.target.value.slice(0, 50);
                                                    setData('clinic.apt', value);
                                                    if (validationErrors['clinic.apt']) {
                                                        setValidationErrors(prev => {
                                                            const newErrors = { ...prev };
                                                            delete newErrors['clinic.apt'];
                                                            return newErrors;
                                                        });
                                                    }
                                                }}
                                                onBlur={() => handleFieldBlur('clinic.apt')}
                                                placeholder={t('enter_apartment')}
                                                dir={getFieldDir('text')}
                                                className={cn(
                                                    (errors['clinic.apt'] || validationErrors['clinic.apt']) ? 'border-red-500' : '',
                                                    'dark:bg-slate-800 dark:text-slate-100 dark:border-slate-600',
                                                    getInputTextAlign('text')
                                                )}
                                                disabled={!data.clinic.governorate_id || !data.clinic.area_id}
                                            />
                                            <InputError message={errors['clinic.apt'] || validationErrors['clinic.apt']} className={cn(isRTL ? "!text-right" : "!text-left")} dir={dir} />
                                        </div>

                                        <div className={cn("space-y-2", isRTL ? "!text-right" : "!text-left")}>
                                            <Label htmlFor="clinic.city" className={cn(isRTL ? "!text-right" : "!text-left")}>
                                                {t('city')} <span className="text-muted-foreground text-sm">({t('optional')})</span>
                                            </Label>
                                            <Input
                                                id="clinic.city"
                                                type="text"
                                                value={data.clinic.city}
                                                maxLength={100}
                                                onChange={(e) => {
                                                    const value = e.target.value.slice(0, 100);
                                                    setData('clinic.city', value);
                                                    if (validationErrors['clinic.city']) {
                                                        setValidationErrors(prev => {
                                                            const newErrors = { ...prev };
                                                            delete newErrors['clinic.city'];
                                                            return newErrors;
                                                        });
                                                    }
                                                }}
                                                onBlur={() => handleFieldBlur('clinic.city')}
                                                placeholder={t('enter_city')}
                                                dir={getFieldDir('text')}
                                                className={cn(
                                                    (errors['clinic.city'] || validationErrors['clinic.city']) ? 'border-red-500' : '',
                                                    'dark:bg-slate-800 dark:text-slate-100 dark:border-slate-600',
                                                    getInputTextAlign('text')
                                                )}
                                                disabled={!data.clinic.governorate_id || !data.clinic.area_id}
                                            />
                                            <InputError message={errors['clinic.city'] || validationErrors['clinic.city']} className={cn(isRTL ? "!text-right" : "!text-left")} dir={dir} />
                                        </div>

                                        <div className={cn("space-y-2", isRTL ? "!text-right" : "!text-left")}>
                                            <Label htmlFor="clinic.postal_code" className={cn(isRTL ? "!text-right" : "!text-left")}>
                                                {t('postal_code')} <span className="text-muted-foreground text-sm">({t('optional')})</span>
                                            </Label>
                                            <Input
                                                id="clinic.postal_code"
                                                type="text"
                                                value={data.clinic.postal_code}
                                                maxLength={20}
                                                onChange={(e) => {
                                                    // Only allow digits
                                                    const value = e.target.value.replace(/\D/g, '').slice(0, 20);
                                                    setData('clinic.postal_code', value);
                                                    // Clear validation error if field was previously invalid
                                                    if (validationErrors['clinic.postal_code']) {
                                                        setValidationErrors(prev => {
                                                            const newErrors = { ...prev };
                                                            delete newErrors['clinic.postal_code'];
                                                            return newErrors;
                                                        });
                                                    }
                                                }}
                                                onBlur={() => handleFieldBlur('clinic.postal_code')}
                                                placeholder={t('enter_postal_code')}
                                                dir={getFieldDir('number')}
                                                className={cn(
                                                    (errors['clinic.postal_code'] || validationErrors['clinic.postal_code']) ? 'border-red-500' : '',
                                                    'dark:bg-slate-800 dark:text-slate-100 dark:border-slate-600',
                                                    getInputTextAlign('number')
                                                )}
                                                disabled={!data.clinic.governorate_id || !data.clinic.area_id}
                                            />
                                            <InputError message={errors['clinic.postal_code'] || validationErrors['clinic.postal_code']} className={cn(isRTL ? "!text-right" : "!text-left")} dir={dir} />
                                        </div>

                                        <div className={cn("space-y-2", isRTL ? "!text-right" : "!text-left")}>
                                            <Label htmlFor="clinic.latitude" className={cn(isRTL ? "!text-right" : "!text-left")}>
                                                {t('latitude')} <span className="text-muted-foreground text-sm">({t('optional')})</span>
                                            </Label>
                                            <Input
                                                id="clinic.latitude"
                                                type="number"
                                                step="any"
                                                value={data.clinic.latitude}
                                                onChange={(e) => {
                                                    const value = e.target.value;
                                                    setData('clinic.latitude', value);
                                                    // Clear error if field was previously invalid
                                                    if (validationErrors['clinic.latitude']) {
                                                        setValidationErrors(prev => {
                                                            const newErrors = { ...prev };
                                                            delete newErrors['clinic.latitude'];
                                                            return newErrors;
                                                        });
                                                    }
                                                }}
                                                onBlur={(e) => {
                                                    const value = e.target.value.trim();
                                                    if (value) {
                                                        const lat = parseFloat(value);
                                                        if (isNaN(lat) || lat < -90 || lat > 90) {
                                                            setValidationErrors(prev => ({
                                                                ...prev,
                                                                'clinic.latitude': t('latitude_invalid') || 'Latitude must be a number between -90 and 90'
                                                            }));
                                                        } else {
                                                            setValidationErrors(prev => {
                                                                const newErrors = { ...prev };
                                                                delete newErrors['clinic.latitude'];
                                                                return newErrors;
                                                            });
                                                        }
                                                    }
                                                    handleFieldBlur('clinic.latitude');
                                                }}
                                                placeholder="29.3759"
                                                dir={getFieldDir('number')}
                                                className={cn(
                                                    (errors['clinic.latitude'] || validationErrors['clinic.latitude']) ? 'border-red-500' : '',
                                                    'dark:bg-slate-800 dark:text-slate-100 dark:border-slate-600',
                                                    getInputTextAlign('number')
                                                )}
                                                disabled={!data.clinic.governorate_id || !data.clinic.area_id}
                                            />
                                            <InputError message={errors['clinic.latitude'] || validationErrors['clinic.latitude']} className={cn(isRTL ? "!text-right" : "!text-left")} dir={dir} />
                                        </div>

                                        <div className={cn("space-y-2", isRTL ? "!text-right" : "!text-left")}>
                                            <Label htmlFor="clinic.longitude" className={cn(isRTL ? "!text-right" : "!text-left")}>
                                                {t('longitude')} <span className="text-muted-foreground text-sm">({t('optional')})</span>
                                            </Label>
                                            <Input
                                                id="clinic.longitude"
                                                type="number"
                                                step="any"
                                                value={data.clinic.longitude}
                                                onChange={(e) => {
                                                    const value = e.target.value;
                                                    setData('clinic.longitude', value);
                                                    // Clear error if field was previously invalid
                                                    if (validationErrors['clinic.longitude']) {
                                                        setValidationErrors(prev => {
                                                            const newErrors = { ...prev };
                                                            delete newErrors['clinic.longitude'];
                                                            return newErrors;
                                                        });
                                                    }
                                                }}
                                                onBlur={(e) => {
                                                    const value = e.target.value.trim();
                                                    if (value) {
                                                        const lng = parseFloat(value);
                                                        if (isNaN(lng) || lng < -180 || lng > 180) {
                                                            setValidationErrors(prev => ({
                                                                ...prev,
                                                                'clinic.longitude': t('longitude_invalid') || 'Longitude must be a number between -180 and 180'
                                                            }));
                                                        } else {
                                                            setValidationErrors(prev => {
                                                                const newErrors = { ...prev };
                                                                delete newErrors['clinic.longitude'];
                                                                return newErrors;
                                                            });
                                                        }
                                                    }
                                                    handleFieldBlur('clinic.longitude');
                                                }}
                                                placeholder="47.9774"
                                                dir={getFieldDir('number')}
                                                className={cn(
                                                    (errors['clinic.longitude'] || validationErrors['clinic.longitude']) ? 'border-red-500' : '',
                                                    'dark:bg-slate-800 dark:text-slate-100 dark:border-slate-600',
                                                    getInputTextAlign('number')
                                                )}
                                                disabled={!data.clinic.governorate_id || !data.clinic.area_id}
                                            />
                                            <InputError message={errors['clinic.longitude'] || validationErrors['clinic.longitude']} className={cn(isRTL ? "!text-right" : "!text-left")} dir={dir} />
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Step 4: Settings & Policies */}
                            {currentStep === 4 && (
                                <div className="space-y-6">
                                    <div className={cn("flex items-center gap-3 mb-6", flexDirection)}>
                                        <Settings className="h-6 w-6 text-primary" />
                                        <h2 className={cn("text-2xl font-semibold text-slate-900 dark:text-slate-100", isRTL ? "!text-right" : "!text-left")}>
                                            {t('settings_policies')}
                                        </h2>
                                    </div>
                                    
                                    <div className="space-y-6">
                                        {/* Booking Settings */}
                                        <div className={cn("space-y-4 border-b pb-6", isRTL ? "!text-right" : "!text-left")}>
                                            <h3 className={cn("text-lg font-semibold", isRTL ? "!text-right" : "!text-left")}>{t('booking_settings')}</h3>
                                            
                                            <div className={cn("flex items-center justify-between gap-3", flexDirection)}>
                                                <Label htmlFor="auto_confirm" className={cn(isRTL ? "!text-right" : "!text-left")}>{t('auto_confirm_bookings')}</Label>
                                                <Switch
                                                    id="auto_confirm"
                                                    checked={data.clinic.auto_confirm_bookings}
                                                    onCheckedChange={(checked) => setData('clinic.auto_confirm_bookings', checked)}
                                                />
                                            </div>

                                        </div>

                                        <div className={cn("space-y-4", isRTL ? "!text-right" : "!text-left")}>
                                            <h3 className={cn("text-lg font-semibold", isRTL ? "!text-right" : "!text-left")}>{t('policies')}</h3>
                                            
                                            <div className={cn("space-y-2", isRTL ? "!text-right" : "!text-left")}>
                                                <Label htmlFor="cancellation_policy_en" className={cn(isRTL ? "!text-right" : "!text-left")}>
                                                    {t('cancellation_policy_en')} <span className="text-red-500">*</span>
                                                </Label>
                                                <Textarea
                                                    id="cancellation_policy_en"
                                                    value={data.clinic.cancellation_policy_en}
                                                    maxLength={2000}
                                                    onChange={(e) => {
                                                        const value = e.target.value;
                                                        // Enforce max length of 2000 characters
                                                        const limitedValue = value.slice(0, 2000);
                                                        setData('clinic.cancellation_policy_en', limitedValue);
                                                        // Real-time validation for English only
                                                        if (value && value.trim()) {
                                                            const englishPattern = /^[a-zA-Z0-9\s\-_.,;:!?@#$%^&*()[\]{}""''/]+$/;
                                                            if (!englishPattern.test(value)) {
                                                                const fieldName = t('cancellation_policy_en') || 'Cancellation Policy (English)';
                                                                const errorMsg = t('clinic_name_en_must_be_english') || t('field_must_be_english_only')?.replace(':attribute', fieldName) || `${fieldName} must contain only English characters`;
                                                                setValidationErrors(prev => ({
                                                                    ...prev,
                                                                    'clinic.cancellation_policy_en': errorMsg
                                                                }));
                                                            } else {
                                                                setValidationErrors(prev => {
                                                                    const newErrors = { ...prev };
                                                                    delete newErrors['clinic.cancellation_policy_en'];
                                                                    return newErrors;
                                                                });
                                                            }
                                                        } else {
                                                            setValidationErrors(prev => {
                                                                const newErrors = { ...prev };
                                                                delete newErrors['clinic.cancellation_policy_en'];
                                                                return newErrors;
                                                            });
                                                        }
                                                    }}
                                                    placeholder={t('enter_cancellation_policy_en')}
                                                    rows={4}
                                                    dir={getFieldDir('textarea')}
                                                    className={cn(
                                                        (errors['clinic.cancellation_policy_en'] || validationErrors['clinic.cancellation_policy_en']) ? 'border-red-500' : '',
                                                        'dark:bg-slate-800 dark:text-slate-100 dark:border-slate-600',
                                                        getInputTextAlign('textarea')
                                                    )}
                                                />
                                                <InputError message={errors['clinic.cancellation_policy_en'] || validationErrors['clinic.cancellation_policy_en']} className={cn(isRTL ? "!text-right" : "!text-left")} dir={dir} />
                                            </div>

                                            <div className={cn("space-y-2", isRTL ? "!text-right" : "!text-left")}>
                                                <Label htmlFor="cancellation_policy_ar" className={cn(isRTL ? "!text-right" : "!text-left")}>
                                                    {t('cancellation_policy_ar')} <span className="text-red-500">*</span>
                                                </Label>
                                                <Textarea
                                                    id="cancellation_policy_ar"
                                                    value={data.clinic.cancellation_policy_ar}
                                                    maxLength={2000}
                                                    onChange={(e) => {
                                                        const value = e.target.value;
                                                        // Enforce max length of 2000 characters
                                                        const limitedValue = value.slice(0, 2000);
                                                        setData('clinic.cancellation_policy_ar', limitedValue);
                                                        // Real-time validation for Arabic only
                                                        if (value && value.trim()) {
                                                            const arabicPattern = /^[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF\s\u0660-\u0669\u06F0-\u06F9.,;:!?\-_()[\]{}""''«»/]+$/u;
                                                            if (!arabicPattern.test(value)) {
                                                                const fieldName = t('cancellation_policy_ar') || 'Cancellation Policy (Arabic)';
                                                                const errorMsg = t('clinic_name_ar_must_be_arabic') || t('field_must_be_arabic_only')?.replace(':attribute', fieldName) || `${fieldName} must contain only Arabic characters`;
                                                                setValidationErrors(prev => ({
                                                                    ...prev,
                                                                    'clinic.cancellation_policy_ar': errorMsg
                                                                }));
                                                            } else {
                                                                setValidationErrors(prev => {
                                                                    const newErrors = { ...prev };
                                                                    delete newErrors['clinic.cancellation_policy_ar'];
                                                                    return newErrors;
                                                                });
                                                            }
                                                        } else {
                                                            setValidationErrors(prev => {
                                                                const newErrors = { ...prev };
                                                                delete newErrors['clinic.cancellation_policy_ar'];
                                                                return newErrors;
                                                            });
                                                        }
                                                    }}
                                                    placeholder={t('enter_cancellation_policy_ar')}
                                                    rows={4}
                                                    dir={getFieldDir('textarea')}
                                                    className={cn(
                                                        (errors['clinic.cancellation_policy_ar'] || validationErrors['clinic.cancellation_policy_ar']) ? 'border-red-500' : '',
                                                        'dark:bg-slate-800 dark:text-slate-100 dark:border-slate-600',
                                                        getInputTextAlign('textarea')
                                                    )}
                                                />
                                                <InputError message={errors['clinic.cancellation_policy_ar'] || validationErrors['clinic.cancellation_policy_ar']} className={cn(isRTL ? "!text-right" : "!text-left")} dir={dir} />
                                            </div>

                                            <div className={cn("space-y-2", isRTL ? "!text-right" : "!text-left")}>
                                                <Label htmlFor="refund_policy_en" className={cn(isRTL ? "!text-right" : "!text-left")}>
                                                    {t('refund_policy_en')} <span className="text-red-500">*</span>
                                                </Label>
                                                <Textarea
                                                    id="refund_policy_en"
                                                    value={data.clinic.refund_policy_en}
                                                    maxLength={2000}
                                                    onChange={(e) => {
                                                        const value = e.target.value;
                                                        // Enforce max length of 2000 characters
                                                        const limitedValue = value.slice(0, 2000);
                                                        setData('clinic.refund_policy_en', limitedValue);
                                                        // Real-time validation for English only
                                                        if (value && value.trim()) {
                                                            const englishPattern = /^[a-zA-Z0-9\s\-_.,;:!?@#$%^&*()[\]{}""''/]+$/;
                                                            if (!englishPattern.test(value)) {
                                                                const fieldName = t('refund_policy_en') || 'Refund Policy (English)';
                                                                const errorMsg = t('clinic_name_en_must_be_english') || t('field_must_be_english_only')?.replace(':attribute', fieldName) || `${fieldName} must contain only English characters`;
                                                                setValidationErrors(prev => ({
                                                                    ...prev,
                                                                    'clinic.refund_policy_en': errorMsg
                                                                }));
                                                            } else {
                                                                setValidationErrors(prev => {
                                                                    const newErrors = { ...prev };
                                                                    delete newErrors['clinic.refund_policy_en'];
                                                                    return newErrors;
                                                                });
                                                            }
                                                        } else {
                                                            setValidationErrors(prev => {
                                                                const newErrors = { ...prev };
                                                                delete newErrors['clinic.refund_policy_en'];
                                                                return newErrors;
                                                            });
                                                        }
                                                    }}
                                                    placeholder={t('enter_refund_policy_en')}
                                                    rows={4}
                                                    dir={getFieldDir('textarea')}
                                                    className={cn(
                                                        (errors['clinic.refund_policy_en'] || validationErrors['clinic.refund_policy_en']) ? 'border-red-500' : '',
                                                        'dark:bg-slate-800 dark:text-slate-100 dark:border-slate-600',
                                                        getInputTextAlign('textarea')
                                                    )}
                                                />
                                                <InputError message={errors['clinic.refund_policy_en'] || validationErrors['clinic.refund_policy_en']} className={cn(isRTL ? "!text-right" : "!text-left")} dir={dir} />
                                            </div>

                                            <div className={cn("space-y-2", isRTL ? "!text-right" : "!text-left")}>
                                                <Label htmlFor="refund_policy_ar" className={cn(isRTL ? "!text-right" : "!text-left")}>
                                                    {t('refund_policy_ar')} <span className="text-red-500">*</span>
                                                </Label>
                                                <Textarea
                                                    id="refund_policy_ar"
                                                    value={data.clinic.refund_policy_ar}
                                                    maxLength={2000}
                                                    onChange={(e) => {
                                                        const value = e.target.value;
                                                        // Enforce max length of 2000 characters
                                                        const limitedValue = value.slice(0, 2000);
                                                        setData('clinic.refund_policy_ar', limitedValue);
                                                        // Real-time validation for Arabic only
                                                        if (value && value.trim()) {
                                                            const arabicPattern = /^[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF\s\u0660-\u0669\u06F0-\u06F9.,;:!?\-_()[\]{}""''«»/]+$/u;
                                                            if (!arabicPattern.test(value)) {
                                                                const fieldName = t('refund_policy_ar') || 'Refund Policy (Arabic)';
                                                                const errorMsg = t('clinic_name_ar_must_be_arabic') || t('field_must_be_arabic_only')?.replace(':attribute', fieldName) || `${fieldName} must contain only Arabic characters`;
                                                                setValidationErrors(prev => ({
                                                                    ...prev,
                                                                    'clinic.refund_policy_ar': errorMsg
                                                                }));
                                                            } else {
                                                                setValidationErrors(prev => {
                                                                    const newErrors = { ...prev };
                                                                    delete newErrors['clinic.refund_policy_ar'];
                                                                    return newErrors;
                                                                });
                                                            }
                                                        } else {
                                                            setValidationErrors(prev => {
                                                                const newErrors = { ...prev };
                                                                delete newErrors['clinic.refund_policy_ar'];
                                                                return newErrors;
                                                            });
                                                        }
                                                    }}
                                                    placeholder={t('enter_refund_policy_ar')}
                                                    rows={4}
                                                    dir={getFieldDir('textarea')}
                                                    className={cn(
                                                        (errors['clinic.refund_policy_ar'] || validationErrors['clinic.refund_policy_ar']) ? 'border-red-500' : '',
                                                        'dark:bg-slate-800 dark:text-slate-100 dark:border-slate-600',
                                                        getInputTextAlign('textarea')
                                                    )}
                                                />
                                                <InputError message={errors['clinic.refund_policy_ar'] || validationErrors['clinic.refund_policy_ar']} className={cn(isRTL ? "!text-right" : "!text-left")} dir={dir} />
                                            </div>

                                            <div className={cn("space-y-2", isRTL ? "!text-right" : "!text-left")}>
                                                <Label htmlFor="privacy_policy_en" className={cn(isRTL ? "!text-right" : "!text-left")}>
                                                    {t('privacy_policy_en')}
                                                </Label>
                                                <Textarea
                                                    id="privacy_policy_en"
                                                    value={data.clinic.privacy_policy_en}
                                                    maxLength={2000}
                                                    onChange={(e) => {
                                                        const value = e.target.value;
                                                        const limitedValue = value.slice(0, 2000);
                                                        setData('clinic.privacy_policy_en', limitedValue);
                                                        if (value && value.trim()) {
                                                            const englishPattern = /^[a-zA-Z0-9\s\-_.,;:!?@#$%^&*()[\]{}""''/]+$/;
                                                            if (!englishPattern.test(value)) {
                                                                const fieldName = t('privacy_policy_en') || 'Privacy Policy (English)';
                                                                const errorMsg = t('clinic_name_en_must_be_english') || t('field_must_be_english_only')?.replace(':attribute', fieldName) || `${fieldName} must contain only English characters`;
                                                                setValidationErrors(prev => ({
                                                                    ...prev,
                                                                    'clinic.privacy_policy_en': errorMsg
                                                                }));
                                                            } else {
                                                                setValidationErrors(prev => {
                                                                    const newErrors = { ...prev };
                                                                    delete newErrors['clinic.privacy_policy_en'];
                                                                    return newErrors;
                                                                });
                                                            }
                                                        } else {
                                                            setValidationErrors(prev => {
                                                                const newErrors = { ...prev };
                                                                delete newErrors['clinic.privacy_policy_en'];
                                                                return newErrors;
                                                            });
                                                        }
                                                    }}
                                                    placeholder={t('enter_privacy_policy_en')}
                                                    rows={4}
                                                    dir={getFieldDir('textarea')}
                                                    className={cn(
                                                        (errors['clinic.privacy_policy_en'] || validationErrors['clinic.privacy_policy_en']) ? 'border-red-500' : '',
                                                        'dark:bg-slate-800 dark:text-slate-100 dark:border-slate-600',
                                                        getInputTextAlign('textarea')
                                                    )}
                                                />
                                                <InputError message={errors['clinic.privacy_policy_en'] || validationErrors['clinic.privacy_policy_en']} className={cn(isRTL ? "!text-right" : "!text-left")} dir={dir} />
                                            </div>

                                            <div className={cn("space-y-2", isRTL ? "!text-right" : "!text-left")}>
                                                <Label htmlFor="privacy_policy_ar" className={cn(isRTL ? "!text-right" : "!text-left")}>
                                                    {t('privacy_policy_ar')}
                                                </Label>
                                                <Textarea
                                                    id="privacy_policy_ar"
                                                    value={data.clinic.privacy_policy_ar}
                                                    maxLength={2000}
                                                    onChange={(e) => {
                                                        const value = e.target.value;
                                                        const limitedValue = value.slice(0, 2000);
                                                        setData('clinic.privacy_policy_ar', limitedValue);
                                                        if (value && value.trim()) {
                                                            const arabicPattern = /^[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF\s\u0660-\u0669\u06F0-\u06F9.,;:!?\-_()[\]{}""''«»/]+$/u;
                                                            if (!arabicPattern.test(value)) {
                                                                const fieldName = t('privacy_policy_ar') || 'Privacy Policy (Arabic)';
                                                                const errorMsg = t('clinic_name_ar_must_be_arabic') || t('field_must_be_arabic_only')?.replace(':attribute', fieldName) || `${fieldName} must contain only Arabic characters`;
                                                                setValidationErrors(prev => ({
                                                                    ...prev,
                                                                    'clinic.privacy_policy_ar': errorMsg
                                                                }));
                                                            } else {
                                                                setValidationErrors(prev => {
                                                                    const newErrors = { ...prev };
                                                                    delete newErrors['clinic.privacy_policy_ar'];
                                                                    return newErrors;
                                                                });
                                                            }
                                                        } else {
                                                            setValidationErrors(prev => {
                                                                const newErrors = { ...prev };
                                                                delete newErrors['clinic.privacy_policy_ar'];
                                                                return newErrors;
                                                            });
                                                        }
                                                    }}
                                                    placeholder={t('enter_privacy_policy_ar')}
                                                    rows={4}
                                                    dir={getFieldDir('textarea')}
                                                    className={cn(
                                                        (errors['clinic.privacy_policy_ar'] || validationErrors['clinic.privacy_policy_ar']) ? 'border-red-500' : '',
                                                        'dark:bg-slate-800 dark:text-slate-100 dark:border-slate-600',
                                                        getInputTextAlign('textarea')
                                                    )}
                                                />
                                                <InputError message={errors['clinic.privacy_policy_ar'] || validationErrors['clinic.privacy_policy_ar']} className={cn(isRTL ? "!text-right" : "!text-left")} dir={dir} />
                                            </div>

                                            <div className={cn("space-y-2", isRTL ? "!text-right" : "!text-left")}>
                                                <Label htmlFor="terms_and_conditions_en" className={cn(isRTL ? "!text-right" : "!text-left")}>
                                                    {t('terms_and_conditions_en')}
                                                </Label>
                                                <Textarea
                                                    id="terms_and_conditions_en"
                                                    value={data.clinic.terms_and_conditions_en}
                                                    maxLength={2000}
                                                    onChange={(e) => {
                                                        const value = e.target.value;
                                                        const limitedValue = value.slice(0, 2000);
                                                        setData('clinic.terms_and_conditions_en', limitedValue);
                                                        if (value && value.trim()) {
                                                            const englishPattern = /^[a-zA-Z0-9\s\-_.,;:!?@#$%^&*()[\]{}""''/]+$/;
                                                            if (!englishPattern.test(value)) {
                                                                const fieldName = t('terms_and_conditions_en') || 'Terms & Conditions (English)';
                                                                const errorMsg = t('clinic_name_en_must_be_english') || t('field_must_be_english_only')?.replace(':attribute', fieldName) || `${fieldName} must contain only English characters`;
                                                                setValidationErrors(prev => ({
                                                                    ...prev,
                                                                    'clinic.terms_and_conditions_en': errorMsg
                                                                }));
                                                            } else {
                                                                setValidationErrors(prev => {
                                                                    const newErrors = { ...prev };
                                                                    delete newErrors['clinic.terms_and_conditions_en'];
                                                                    return newErrors;
                                                                });
                                                            }
                                                        } else {
                                                            setValidationErrors(prev => {
                                                                const newErrors = { ...prev };
                                                                delete newErrors['clinic.terms_and_conditions_en'];
                                                                return newErrors;
                                                            });
                                                        }
                                                    }}
                                                    placeholder={t('enter_terms_and_conditions_en')}
                                                    rows={4}
                                                    dir={getFieldDir('textarea')}
                                                    className={cn(
                                                        (errors['clinic.terms_and_conditions_en'] || validationErrors['clinic.terms_and_conditions_en']) ? 'border-red-500' : '',
                                                        'dark:bg-slate-800 dark:text-slate-100 dark:border-slate-600',
                                                        getInputTextAlign('textarea')
                                                    )}
                                                />
                                                <InputError message={errors['clinic.terms_and_conditions_en'] || validationErrors['clinic.terms_and_conditions_en']} className={cn(isRTL ? "!text-right" : "!text-left")} dir={dir} />
                                            </div>

                                            <div className={cn("space-y-2", isRTL ? "!text-right" : "!text-left")}>
                                                <Label htmlFor="terms_and_conditions_ar" className={cn(isRTL ? "!text-right" : "!text-left")}>
                                                    {t('terms_and_conditions_ar')}
                                                </Label>
                                                <Textarea
                                                    id="terms_and_conditions_ar"
                                                    value={data.clinic.terms_and_conditions_ar}
                                                    maxLength={2000}
                                                    onChange={(e) => {
                                                        const value = e.target.value;
                                                        const limitedValue = value.slice(0, 2000);
                                                        setData('clinic.terms_and_conditions_ar', limitedValue);
                                                        if (value && value.trim()) {
                                                            const arabicPattern = /^[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF\s\u0660-\u0669\u06F0-\u06F9.,;:!?\-_()[\]{}""''«»/]+$/u;
                                                            if (!arabicPattern.test(value)) {
                                                                const fieldName = t('terms_and_conditions_ar') || 'Terms & Conditions (Arabic)';
                                                                const errorMsg = t('clinic_name_ar_must_be_arabic') || t('field_must_be_arabic_only')?.replace(':attribute', fieldName) || `${fieldName} must contain only Arabic characters`;
                                                                setValidationErrors(prev => ({
                                                                    ...prev,
                                                                    'clinic.terms_and_conditions_ar': errorMsg
                                                                }));
                                                            } else {
                                                                setValidationErrors(prev => {
                                                                    const newErrors = { ...prev };
                                                                    delete newErrors['clinic.terms_and_conditions_ar'];
                                                                    return newErrors;
                                                                });
                                                            }
                                                        } else {
                                                            setValidationErrors(prev => {
                                                                const newErrors = { ...prev };
                                                                delete newErrors['clinic.terms_and_conditions_ar'];
                                                                return newErrors;
                                                            });
                                                        }
                                                    }}
                                                    placeholder={t('enter_terms_and_conditions_ar')}
                                                    rows={4}
                                                    dir={getFieldDir('textarea')}
                                                    className={cn(
                                                        (errors['clinic.terms_and_conditions_ar'] || validationErrors['clinic.terms_and_conditions_ar']) ? 'border-red-500' : '',
                                                        'dark:bg-slate-800 dark:text-slate-100 dark:border-slate-600',
                                                        getInputTextAlign('textarea')
                                                    )}
                                                />
                                                <InputError message={errors['clinic.terms_and_conditions_ar'] || validationErrors['clinic.terms_and_conditions_ar']} className={cn(isRTL ? "!text-right" : "!text-left")} dir={dir} />
                                            </div>

                                            <div className={cn("space-y-2", isRTL ? "!text-right" : "!text-left")}>
                                                <Label htmlFor="reschedule_policy_en" className={cn(isRTL ? "!text-right" : "!text-left")}>
                                                    {t('reschedule_policy_en')} <span className="text-red-500">*</span>
                                                </Label>
                                                <Textarea
                                                    id="reschedule_policy_en"
                                                    value={data.clinic.reschedule_policy_en}
                                                    maxLength={10000}
                                                    onChange={(e) => {
                                                        const value = e.target.value;
                                                        // Enforce max length of 10000 characters
                                                        const limitedValue = value.slice(0, 10000);
                                                        setData('clinic.reschedule_policy_en', limitedValue);
                                                        // Real-time validation for English only
                                                        if (value && value.trim()) {
                                                            const englishPattern = /^[a-zA-Z0-9\s\-_.,;:!?@#$%^&*()[\]{}""''/]+$/;
                                                            if (!englishPattern.test(value)) {
                                                                const fieldName = t('reschedule_policy_en') || 'Reschedule Policy (English)';
                                                                const errorMsg = t('clinic_name_en_must_be_english') || t('field_must_be_english_only')?.replace(':attribute', fieldName) || `${fieldName} must contain only English characters`;
                                                                setValidationErrors(prev => ({
                                                                    ...prev,
                                                                    'clinic.reschedule_policy_en': errorMsg
                                                                }));
                                                            } else {
                                                                setValidationErrors(prev => {
                                                                    const newErrors = { ...prev };
                                                                    delete newErrors['clinic.reschedule_policy_en'];
                                                                    return newErrors;
                                                                });
                                                            }
                                                        } else {
                                                            setValidationErrors(prev => {
                                                                const newErrors = { ...prev };
                                                                delete newErrors['clinic.reschedule_policy_en'];
                                                                return newErrors;
                                                            });
                                                        }
                                                    }}
                                                    placeholder={t('enter_reschedule_policy_en')}
                                                    rows={4}
                                                    dir={getFieldDir('textarea')}
                                                    className={cn(
                                                        (errors['clinic.reschedule_policy_en'] || validationErrors['clinic.reschedule_policy_en']) ? 'border-red-500' : '',
                                                        'dark:bg-slate-800 dark:text-slate-100 dark:border-slate-600',
                                                        getInputTextAlign('textarea')
                                                    )}
                                                />
                                                <InputError message={errors['clinic.reschedule_policy_en'] || validationErrors['clinic.reschedule_policy_en']} className={cn(isRTL ? "!text-right" : "!text-left")} dir={dir} />
                                            </div>

                                            <div className={cn("space-y-2", isRTL ? "!text-right" : "!text-left")}>
                                                <Label htmlFor="reschedule_policy_ar" className={cn(isRTL ? "!text-right" : "!text-left")}>
                                                    {t('reschedule_policy_ar')} <span className="text-red-500">*</span>
                                                </Label>
                                                <Textarea
                                                    id="reschedule_policy_ar"
                                                    value={data.clinic.reschedule_policy_ar}
                                                    maxLength={10000}
                                                    onChange={(e) => {
                                                        const value = e.target.value;
                                                        // Enforce max length of 10000 characters
                                                        const limitedValue = value.slice(0, 10000);
                                                        setData('clinic.reschedule_policy_ar', limitedValue);
                                                        // Real-time validation for Arabic only
                                                        if (value && value.trim()) {
                                                            const arabicPattern = /^[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF\s\u0660-\u0669\u06F0-\u06F9.,;:!?\-_()[\]{}""''«»/]+$/u;
                                                            if (!arabicPattern.test(value)) {
                                                                const fieldName = t('reschedule_policy_ar') || 'Reschedule Policy (Arabic)';
                                                                const errorMsg = t('clinic_name_ar_must_be_arabic') || t('field_must_be_arabic_only')?.replace(':attribute', fieldName) || `${fieldName} must contain only Arabic characters`;
                                                                setValidationErrors(prev => ({
                                                                    ...prev,
                                                                    'clinic.reschedule_policy_ar': errorMsg
                                                                }));
                                                            } else {
                                                                setValidationErrors(prev => {
                                                                    const newErrors = { ...prev };
                                                                    delete newErrors['clinic.reschedule_policy_ar'];
                                                                    return newErrors;
                                                                });
                                                            }
                                                        } else {
                                                            setValidationErrors(prev => {
                                                                const newErrors = { ...prev };
                                                                delete newErrors['clinic.reschedule_policy_ar'];
                                                                return newErrors;
                                                            });
                                                        }
                                                    }}
                                                    placeholder={t('enter_reschedule_policy_ar')}
                                                    rows={4}
                                                    dir={getFieldDir('textarea')}
                                                    className={cn(
                                                        (errors['clinic.reschedule_policy_ar'] || validationErrors['clinic.reschedule_policy_ar']) ? 'border-red-500' : '',
                                                        'dark:bg-slate-800 dark:text-slate-100 dark:border-slate-600',
                                                        getInputTextAlign('textarea')
                                                    )}
                                                />
                                                <InputError message={errors['clinic.reschedule_policy_ar'] || validationErrors['clinic.reschedule_policy_ar']} className={cn(isRTL ? "!text-right" : "!text-left")} dir={dir} />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Step 5: Operating Hours */}
                            {currentStep === 5 && (
                                <div className="space-y-6">
                                    <div className="flex items-center gap-3 mb-6">
                                        <Clock className="h-6 w-6 text-primary" />
                                        <h2 className="text-2xl font-semibold text-slate-900 dark:text-slate-100">
                                            {t('operating_hours')}
                                        </h2>
                                    </div>
                                    
                                    {(validationErrors['operating_hours'] || validationErrors['operating_hours.0']) && (
                                        <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                                            <InputError message={validationErrors['operating_hours'] || validationErrors['operating_hours.0']} className={cn(isRTL ? "!text-right" : "!text-left")} dir={dir} />
                                        </div>
                                    )}
                                    <div className="space-y-4">
                                        {data.clinic.operating_hours.map((hour, index) => {
                                            const dayInfo = DAYS_OF_WEEK.find(d => d.value === hour.day_of_week);
                                            const dayLabel = dayInfo ? t(dayInfo.labelKey) : hour.day_of_week;
                                            
                                            return (
                                                <div key={index} className="border rounded-lg p-4 space-y-4 dark:border-slate-700 dark:bg-slate-800/50">
                                                    <div className={cn("flex items-center justify-between", flexDirection)}>
                                                        <h4 className={cn("font-semibold", isRTL ? "!text-right" : "!text-left")}>{dayLabel}</h4>
                                                        <div className={cn("flex items-center gap-4", flexDirection)}>
                                                            <div className={cn("flex items-center gap-2", flexDirection)}>
                                                                <Switch
                                                                    checked={hour.is_open && !hour.closed_all_day}
                                                                    onCheckedChange={(checked) => {
                                                                        updateOperatingHourMultiple(index, {
                                                                            closed_all_day: !checked,
                                                                            is_open: checked,
                                                                        });
                                                                        // Clear validation error when user opens/closes a day
                                                                        if (validationErrors['operating_hours'] || validationErrors['operating_hours.0']) {
                                                                            setValidationErrors(prev => {
                                                                                const newErrors = { ...prev };
                                                                                delete newErrors['operating_hours'];
                                                                                delete newErrors['operating_hours.0'];
                                                                                return newErrors;
                                                                            });
                                                                        }
                                                                        if (validationErrors[`operating_hours.${index}`]) {
                                                                            setValidationErrors(prev => {
                                                                                const newErrors = { ...prev };
                                                                                delete newErrors[`operating_hours.${index}`];
                                                                                return newErrors;
                                                                            });
                                                                        }
                                                                    }}
                                                                />
                                                                <Label className={cn(isRTL ? "!text-right" : "!text-left")}>{t('open')}</Label>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    {!hour.closed_all_day && (
                                                        <div className="grid grid-cols-2 gap-4">
                                                            <div className={cn("space-y-2", isRTL ? "!text-right" : "!text-left")}>
                                                                <Label className={cn(isRTL ? "!text-right" : "!text-left")}>{t('opening_time')}</Label>
                                                                <Input
                                                                    type="time"
                                                                    value={hour.opening_time || ''}
                                                                    onChange={(e) => {
                                                                        updateOperatingHour(index, 'opening_time', e.target.value);
                                                                        // Clear validation error when user changes time
                                                                        if (validationErrors[`operating_hours.${index}`]) {
                                                                            const newErrors = { ...validationErrors };
                                                                            delete newErrors[`operating_hours.${index}`];
                                                                            setValidationErrors(newErrors);
                                                                        }
                                                                    }}
                                                                    dir={getFieldDir('text')}
                                                                    className={cn(
                                                                        validationErrors[`operating_hours.${index}`] ? 'border-red-500' : '',
                                                                        'dark:bg-slate-800 dark:text-slate-100 dark:border-slate-600',
                                                                        getInputTextAlign('text')
                                                                    )}
                                                                />
                                                            </div>
                                                            <div className={cn("space-y-2", isRTL ? "!text-right" : "!text-left")}>
                                                                <Label className={cn(isRTL ? "!text-right" : "!text-left")}>{t('closing_time')}</Label>
                                                                <Input
                                                                    type="time"
                                                                    value={hour.closing_time || ''}
                                                                    onChange={(e) => {
                                                                        updateOperatingHour(index, 'closing_time', e.target.value);
                                                                        // Clear validation error when user changes time
                                                                        if (validationErrors[`operating_hours.${index}`]) {
                                                                            const newErrors = { ...validationErrors };
                                                                            delete newErrors[`operating_hours.${index}`];
                                                                            setValidationErrors(newErrors);
                                                                        }
                                                                    }}
                                                                    dir={getFieldDir('text')}
                                                                    className={cn(
                                                                        validationErrors[`operating_hours.${index}`] ? 'border-red-500' : '',
                                                                        'dark:bg-slate-800 dark:text-slate-100 dark:border-slate-600',
                                                                        getInputTextAlign('text')
                                                                    )}
                                                                />
                                                            </div>
                                                            {validationErrors[`operating_hours.${index}`] && (
                                                                <div className="col-span-2">
                                                                    <InputError message={validationErrors[`operating_hours.${index}`]} className={cn(isRTL ? "!text-right" : "!text-left")} dir={dir} />
                                                                </div>
                                                            )}
                                                        </div>
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}

                            {/* Step 6: Documents */}
                            {currentStep === 6 && (
                                <div className="space-y-6">
                                    <div className={cn("flex items-center gap-3 mb-6", flexDirection)}>
                                        <Upload className="h-6 w-6 text-primary" />
                                        <h2 className={cn("text-2xl font-semibold text-slate-900 dark:text-slate-100", isRTL ? "!text-right" : "!text-left")}>
                                            {t('documents')}
                                        </h2>
                                    </div>

                                    <div className="space-y-6">
                                        <div className={cn("bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4", isRTL ? "!text-right" : "!text-left")} dir={dir}>
                                            <p className={cn("text-sm text-blue-800 dark:text-blue-200", isRTL ? "!text-right" : "!text-left")}>
                                                {t('documents_upload_info')}
                                            </p>
                                        </div>

                                        <div className={cn("space-y-2", isRTL ? "!text-right" : "!text-left")}>
                                            <Label htmlFor="business_license" className={cn(isRTL ? "!text-right" : "!text-left")}>
                                                {t('business_license')} <span className="text-red-500">*</span>
                                            </Label>
                                            <div className="border-2 border-dashed border-border dark:border-slate-600 rounded-lg p-6 dark:bg-slate-800/50">
                                                <Input
                                                    id="business_license"
                                                    type="file"
                                                    accept=".pdf,.jpg,.jpeg,.png"
                                                    onChange={(e) => handleFileChange('business_license', e.target.files?.[0] || null, setBusinessLicensePreview, setBusinessLicenseFileName)}
                                                    className="hidden"
                                                />
                                                <Label htmlFor="business_license" className="cursor-pointer flex flex-col items-center gap-2">
                                                    <Upload className="h-8 w-8 text-muted-foreground dark:text-slate-400" />
                                                    <span className="text-sm text-primary hover:underline">
                                                        {t('click_to_upload')} {t('business_license')}
                                                    </span>
                                                    <p className="text-xs text-muted-foreground dark:text-slate-400">
                                                        {t('file_format_hint')}
                                                    </p>
                                                </Label>
                                                {(businessLicensePreview || businessLicenseFileName) && (
                                                    <div className="mt-4 text-center space-y-2">
                                                        {businessLicensePreview && businessLicensePreview !== 'pdf' ? (
                                                            <img src={businessLicensePreview} alt="Business License Preview" className="max-h-48 mx-auto rounded border" />
                                                        ) : (
                                                            <div className="flex items-center justify-center gap-2 text-sm text-green-600">
                                                                <Check className="h-4 w-4" />
                                                                <span>{businessLicenseFileName || t('file_uploaded')}</span>
                                                            </div>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                            <InputError message={errors['clinic.business_license'] || validationErrors['clinic.business_license']} className={cn(isRTL ? "!text-right" : "!text-left")} dir={dir} />
                                        </div>

                                        <div className={cn("space-y-2", isRTL ? "!text-right" : "!text-left")}>
                                            <Label htmlFor="id_document_front" className={cn(isRTL ? "!text-right" : "!text-left")}>
                                                {t('id_document_front')} <span className="text-red-500">*</span>
                                            </Label>
                                            <div className="border-2 border-dashed border-border dark:border-slate-600 rounded-lg p-6 dark:bg-slate-800/50">
                                                <Input
                                                    id="id_document_front"
                                                    type="file"
                                                    accept=".pdf,.jpg,.jpeg,.png"
                                                    onChange={(e) => handleFileChange('id_document_front', e.target.files?.[0] || null, setIdDocumentFrontPreview, setIdDocumentFrontFileName)}
                                                    className="hidden"
                                                />
                                                <Label htmlFor="id_document_front" className="cursor-pointer flex flex-col items-center gap-2">
                                                    <Upload className="h-8 w-8 text-muted-foreground dark:text-slate-400" />
                                                    <span className="text-sm text-primary hover:underline">
                                                        {t('click_to_upload')} {t('id_document_front')}
                                                    </span>
                                                    <p className="text-xs text-muted-foreground dark:text-slate-400">
                                                        {t('file_format_hint')}
                                                    </p>
                                                </Label>
                                                {(idDocumentFrontPreview || idDocumentFrontFileName) && (
                                                    <div className="mt-4 text-center space-y-2">
                                                        {idDocumentFrontPreview && idDocumentFrontPreview !== 'pdf' ? (
                                                            <img src={idDocumentFrontPreview} alt="ID Document Front Preview" className="max-h-48 mx-auto rounded border" />
                                                        ) : (
                                                            <div className="flex items-center justify-center gap-2 text-sm text-green-600">
                                                                <Check className="h-4 w-4" />
                                                                <span>{idDocumentFrontFileName || t('file_uploaded')}</span>
                                                            </div>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                            <InputError message={errors['clinic.id_document_front'] || validationErrors['clinic.id_document_front']} className={cn(isRTL ? "!text-right" : "!text-left")} dir={dir} />
                                        </div>

                                        <div className={cn("space-y-2", isRTL ? "!text-right" : "!text-left")}>
                                            <Label htmlFor="id_document_back" className={cn(isRTL ? "!text-right" : "!text-left")}>
                                                {t('id_document_back')} ({t('optional')})
                                            </Label>
                                            <div className="border-2 border-dashed border-border dark:border-slate-600 rounded-lg p-6 dark:bg-slate-800/50">
                                                <Input
                                                    id="id_document_back"
                                                    type="file"
                                                    accept=".pdf,.jpg,.jpeg,.png"
                                                    onChange={(e) => handleFileChange('id_document_back', e.target.files?.[0] || null, setIdDocumentBackPreview, setIdDocumentBackFileName)}
                                                    className="hidden"
                                                />
                                                <Label htmlFor="id_document_back" className="cursor-pointer flex flex-col items-center gap-2">
                                                    <Upload className="h-8 w-8 text-muted-foreground dark:text-slate-400" />
                                                    <span className="text-sm text-primary hover:underline">
                                                        {t('click_to_upload')} {t('id_document_back')}
                                                    </span>
                                                    <p className="text-xs text-muted-foreground dark:text-slate-400">
                                                        {t('file_format_hint')}
                                                    </p>
                                                </Label>
                                                {(idDocumentBackPreview || idDocumentBackFileName) && (
                                                    <div className="mt-4 text-center space-y-2">
                                                        {idDocumentBackPreview && idDocumentBackPreview !== 'pdf' ? (
                                                            <img src={idDocumentBackPreview} alt="ID Document Back Preview" className="max-h-48 mx-auto rounded border" />
                                                        ) : (
                                                            <div className="flex items-center justify-center gap-2 text-sm text-green-600">
                                                                <Check className="h-4 w-4" />
                                                                <span>{idDocumentBackFileName || t('file_uploaded')}</span>
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
                            {false && currentStep === 7 && (
                                <div className="space-y-6">
                                    <div className="flex items-center gap-3 mb-6">
                                        <CreditCard className="h-6 w-6 text-primary" />
                                        <h2 className="text-2xl font-semibold text-slate-900 dark:text-slate-100">
                                            {t('subscription')}
                                        </h2>
                                    </div>

                                    <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-6">
                                        <p className="text-sm text-blue-800 dark:text-blue-200">
                                            {t('subscription_selection_info') || 'Select a subscription package for your clinic. You can change this later.'}
                                        </p>
                                    </div>

                                    {subscriptionPackages && subscriptionPackages.length > 0 ? (
                                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                            {/* Option: No Subscription */}
                                            <div
                                                onClick={() => {
                                                    setData('clinic.subscription_package_id', '');
                                                    if (validationErrors['clinic.subscription_package_id']) {
                                                        setValidationErrors(prev => {
                                                            const newErrors = { ...prev };
                                                            delete newErrors['clinic.subscription_package_id'];
                                                            return newErrors;
                                                        });
                                                    }
                                                }}
                                                className={cn(
                                                    "relative border-2 rounded-lg p-6 cursor-pointer transition-all",
                                                    !data.clinic.subscription_package_id
                                                        ? 'border-primary bg-primary/5 dark:bg-primary/10'
                                                        : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
                                                )}
                                            >
                                                <div className={cn("flex items-center justify-between mb-4", flexDirection)}>
                                                    <h3 className={cn("text-lg font-semibold text-slate-900 dark:text-slate-100", isRTL ? "!text-right" : "!text-left")}>
                                                        {t('no_subscription') || 'No Subscription'}
                                                    </h3>
                                                    {(!data.clinic.subscription_package_id || data.clinic.subscription_package_id === '') && (
                                                        <div className={cn("h-5 w-5 rounded-full bg-primary flex items-center justify-center", isRTL ? "mr-auto" : "ml-auto")}>
                                                            <Check className="h-3 w-3 text-white" />
                                                        </div>
                                                    )}
                                                </div>
                                                <p className={cn("text-sm text-slate-600 dark:text-slate-400 mb-4", isRTL ? "!text-right" : "!text-left")}>
                                                    {t('no_subscription_description') || 'Continue without a subscription package. You can subscribe later.'}
                                                </p>
                                                <div className={cn("text-2xl font-bold text-slate-900 dark:text-slate-100", isRTL ? "!text-right" : "!text-left")}>
                                                    {t('free') || 'Free'}
                                                </div>
                                            </div>

                                            {/* Subscription Packages */}
                                            {subscriptionPackages.map((pkg) => {
                                                const pkgIdStr = String(pkg.id);
                                                const currentValue = data.clinic.subscription_package_id;
                                                const selectedIdStr = currentValue ? String(currentValue) : '';
                                                const isSelected = selectedIdStr !== '' && selectedIdStr === pkgIdStr;
                                                const packageName = isRTL ? pkg.name_ar : pkg.name_en;
                                                const packageDescription = isRTL ? (pkg.description_ar || pkg.description_en) : (pkg.description_en || pkg.description_ar);
                                                
                                                return (
                                                    <div
                                                        key={pkg.id}
                                                        onClick={() => {
                                                            setData('clinic.subscription_package_id', pkgIdStr);
                                                            if (validationErrors['clinic.subscription_package_id']) {
                                                                setValidationErrors(prev => {
                                                                    const newErrors = { ...prev };
                                                                    delete newErrors['clinic.subscription_package_id'];
                                                                    return newErrors;
                                                                });
                                                            }
                                                        }}
                                                        className={cn(
                                                            "relative border-2 rounded-lg p-6 cursor-pointer transition-all",
                                                            isSelected
                                                                ? 'border-primary bg-primary/5 dark:bg-primary/10 ring-2 ring-primary/20'
                                                                : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
                                                        )}
                                                    >
                                                        {isSelected && (
                                                            <div className={cn("absolute top-4 h-5 w-5 rounded-full bg-primary flex items-center justify-center z-10", isRTL ? "left-4" : "right-4")}>
                                                                <Check className="h-3 w-3 text-white" />
                                                            </div>
                                                        )}
                                                        <div className={cn("mb-4", isRTL ? "!text-right" : "!text-left")}>
                                                            <h3 className={cn("text-lg font-semibold text-slate-900 dark:text-slate-100 mb-2", isRTL ? "!text-right" : "!text-left")}>
                                                                {packageName}
                                                            </h3>
                                                            {packageDescription && (
                                                                <p className={cn("text-sm text-slate-600 dark:text-slate-400 line-clamp-2", isRTL ? "!text-right" : "!text-left")}>
                                                                    {packageDescription}
                                                                </p>
                                                            )}
                                                        </div>
                                                        <div className={cn("flex items-baseline gap-2 mb-4", flexDirection)}>
                                                            <span className={cn("text-2xl font-bold text-slate-900 dark:text-slate-100", isRTL ? "!text-right" : "!text-left")} dir="ltr">
                                                                {pkg.price || '0'} {pkg.currency || 'KWD'}
                                                            </span>
                                                            <span className={cn("text-sm text-slate-500 dark:text-slate-400", isRTL ? "!text-right" : "!text-left")}>
                                                                / {pkg.billing_cycle === 'monthly' ? t('month') : t('year')}
                                                            </span>
                                                        </div>
                                                        {pkg.features && Array.isArray(pkg.features) && pkg.features.length > 0 && (
                                                            <ul className={cn("space-y-2 text-sm text-slate-600 dark:text-slate-400", isRTL ? "!text-right" : "!text-left")}>
                                                                {pkg.features.slice(0, 3).map((feature, idx) => (
                                                                    <li key={idx} className={cn("flex items-start gap-2", flexDirection)}>
                                                                        <Check className={cn("h-4 w-4 text-primary mt-0.5 flex-shrink-0", iconMargin('sm'))} />
                                                                        <span className={cn(isRTL ? "!text-right" : "!text-left")}>{feature}</span>
                                                                    </li>
                                                                ))}
                                                                {pkg.features.length > 3 && (
                                                                    <li className="text-xs text-slate-500 dark:text-slate-400">
                                                                        +{pkg.features.length - 3} {t('more_features') || 'more features'}
                                                                    </li>
                                                                )}
                                                            </ul>
                                                        )}
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    ) : (
                                        <div className={cn("py-12", isRTL ? "!text-right" : "text-center")}>
                                            <p className={cn("text-slate-500 dark:text-slate-400", isRTL ? "!text-right" : "text-center")}>
                                                {t('no_subscription_packages_available') || 'No subscription packages available at the moment.'}
                                            </p>
                                        </div>
                                    )}
                                    <InputError message={errors['clinic.subscription_package_id'] || validationErrors['clinic.subscription_package_id']} className={cn(isRTL ? "!text-right" : "!text-left")} dir={dir} />
                                </div>
                            )}

                            {/* Navigation Buttons */}
                            <div className={cn("flex items-center justify-between pt-6 border-t mt-8", flexDirection)} dir={dir}>
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={prevStep}
                                    disabled={currentStep === 1}
                                    className={flexDirection}
                                >
                                    {isRTL ? (
                                        <ChevronRight className={cn("h-4 w-4", iconMargin('md'))} />
                                    ) : (
                                        <ChevronLeft className={cn("h-4 w-4", iconMargin('md'))} />
                                    )}
                                    {t('previous')}
                                </Button>

                                <div className={cn("flex items-center gap-3", flexDirection)}>
                                    {currentStep < TOTAL_STEPS ? (
                                        <div className={cn("flex flex-col gap-2", isRTL ? 'items-start' : 'items-end')}>
                                            <Button
                                                type="submit"
                                                disabled={validating}
                                                className={flexDirection}
                                            >
                                                {validating ? (
                                                    <>
                                                        <LoaderCircle className={cn("h-4 w-4 animate-spin", iconMargin('md'))} />
                                                        {t('validating')}
                                                    </>
                                                ) : (
                                                    <>
                                                        {t('next')}
                                                        {isRTL ? (
                                                            <ChevronLeft className={cn("h-4 w-4", iconMargin('md'))} />
                                                        ) : (
                                                            <ChevronRight className={cn("h-4 w-4", iconMargin('md'))} />
                                                        )}
                                                    </>
                                                )}
                                            </Button>
                                            {!isCurrentStepValid && Object.keys(validationErrors).length > 0 && (
                                                <p className={cn("text-xs text-red-500", isRTL ? "!text-right" : "!text-left")} dir={dir}>
                                                    {t('please_fix_errors_before_continuing')}
                                                </p>
                                            )}
                                        </div>
                                    ) : (
                                        <Button
                                            type="submit"
                                            disabled={processing}
                                            className={flexDirection}
                                        >
                                            {processing ? (
                                                <>
                                                    <LoaderCircle className={cn("h-4 w-4 animate-spin", iconMargin('md'))} />
                                                    {t('submitting')}
                                                </>
                                            ) : (
                                                <>
                                                    <Upload className={cn("h-4 w-4", iconMargin('md'))} />
                                                    {t('submit_application')}
                                                </>
                                        )}
                                    </Button>
                                    )}
                                </div>
                            </div>

                            {/* Login Link */}
                            <div className={cn("text-sm text-slate-500 dark:text-slate-400 mt-6 text-center")}>
                                        {t('already_have_account')}{' '}
                                        <TextLink href={login()} className="text-primary hover:text-primary/80 font-medium">
                                            {t('log_in')}
                                        </TextLink>
                                </div>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}
