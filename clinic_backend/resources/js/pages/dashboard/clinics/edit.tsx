import { type BreadcrumbItem } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useTranslation } from '@/hooks/use-translation';
import { useRTL } from '@/hooks/use-rtl';
import { useRTLInit } from '@/hooks/use-rtl-init';
import { getLocalizedName } from '@/utils/localization';
import AppLayout from '@/layouts/app-layout';
import { index as dashboard } from '@/routes/dashboard';
import { Head, Link, router, useForm, usePage } from '@inertiajs/react';
import { ArrowLeft, Building2, FileText, MapPin, Settings, Clock, Upload, CreditCard, User, Save } from 'lucide-react';
import { useState, useRef, useEffect, useMemo, FormEventHandler } from 'react';
import InputError from '@/components/input-error';
import { customToast } from '@/components/ui/custom-toast';
import { PhoneInput } from '@/components/phone-input';
import { LoaderCircle } from 'lucide-react';
import { AddressAutocomplete } from '@/components/address-autocomplete';
import { DocumentPreview } from '@/components/document-preview';
import { PasswordInput } from '@/components/password-input';
import { cn } from '@/lib/utils';
import { type SharedData } from '@/types';

interface OperatingHour {
    id?: number;
    day_of_week: string;
    opening_time: string | null;
    closing_time: string | null;
    is_open: boolean;
    closed_all_day: boolean;
}

interface EditClinicProps {
    clinic: {
        id: number;
        owner_id?: number;
        name_en: string;
        name_ar: string;
        bio_en?: string;
        bio_ar?: string;
        status: 'pending' | 'approved' | 'rejected' | 'suspended';
        rejection_reason?: string | null;
        logo?: string;
        phone?: string;
        email?: string;
        address?: string;
        governorate_id?: number;
        area_id?: number;
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
        category_id?: number;
        auto_confirm_bookings?: boolean;
        cancellation_policy_en?: string;
        cancellation_policy_ar?: string;
        refund_policy_en?: string;
        refund_policy_ar?: string;
        privacy_policy_en?: string;
        privacy_policy_ar?: string;
        terms_and_conditions_en?: string;
        terms_and_conditions_ar?: string;
        reschedule_policy_en?: string;
        reschedule_policy_ar?: string;
        rescheduling_buffer_hours?: number | null;
        refund_policy_type?: string | null;
        refund_policy_percentage?: number | null;
        owner?: {
            id: number;
            name: string;
            email: string;
            phone?: string;
            admin_commission?: number | null;
        };
        category?: {
            id: number;
            name_en: string;
            name_ar: string;
        };
        governorate?: {
            id: number;
            name_en: string;
            name_ar: string;
        };
        area?: {
            id: number;
            name_en: string;
            name_ar: string;
        };
        activeSubscription?: {
            subscription_package_id?: number;
        };
    };
    categories?: Array<{ id: number; name_en: string; name_ar: string }>;
    governorates?: Array<{ id: number; name_en: string; name_ar: string }>;
    areas?: Array<{ id: number; name_en: string; name_ar: string; governorate_id: number }>;
    documents?: Array<{
        id: number;
        file_name: string;
        file_url: string;
        file_type?: string;
        mime_type?: string;
        collection_name: string;
        disk: string;
        size: number;
        created_at: string;
    }>;
    subscriptionPackages?: Array<{ 
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
    users?: Array<{ id: number; name: string; email: string; phone?: string }>;
    allUsers?: Array<{ id: number; name: string; email: string; phone?: string }>;
    operatingHours?: OperatingHour[];
    subscriptions?: Array<{
        id: number;
        subscription_package_id: number;
        status: string;
        start_date?: string;
        end_date?: string;
    }>;
    currentUser?: {
        id: number;
        name: string;
        email: string;
        roles: string[];
    } | null;
    clinicOwnerId?: number | null;
    isReadOnlyOwner?: boolean;
    siteSettings?: {
        rescheduling_buffer_hours: number;
        cancellation_buffer_hours: number;
        user_cancellation_penalty_type: string;
        user_cancellation_penalty_value: number;
        user_cancellation_platform_charge_percentage: number;
        clinic_refund_policy_type: string;
        clinic_refund_policy_value: number;
        clinic_refund_policy_percentage: number;
    };
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

const defaultOperatingHours = DAYS_OF_WEEK.map(day => ({
    day_of_week: day.value,
    opening_time: '09:00',
    closing_time: '17:00',
    is_open: true,
    closed_all_day: false,
}));

export default function EditClinic({ 
    clinic,
    categories = [], 
    governorates = [], 
    areas = [],
    documents = [],
    subscriptionPackages = [],
    users = [],
    allUsers = [],
    operatingHours = [],
    subscriptions = [],
    currentUser = null,
    clinicOwnerId = null,
    isReadOnlyOwner = false,
    siteSettings = {
        rescheduling_buffer_hours: 24,
        cancellation_buffer_hours: 24,
        user_cancellation_penalty_type: 'percentage',
        user_cancellation_penalty_value: 5,
        user_cancellation_platform_charge_percentage: 5,
        clinic_refund_policy_type: 'partial',
        clinic_refund_policy_value: 20,
        clinic_refund_policy_percentage: 20,
    },
}: EditClinicProps) {
    useRTLInit();
    const { t, locale } = useTranslation();
    const page = usePage<SharedData>();
    const { locale: pageLocale } = page.props;
    const isRTL = pageLocale === 'ar';
    const dir = isRTL ? 'rtl' : 'ltr';
    const { flexDirection, getFieldDir, getInputTextAlign, iconMargin } = useRTL();
    
    // Client-side mount check to prevent hydration mismatches with icons
    const [isMounted, setIsMounted] = useState(false);
    
    // Always initialize to "1" (string) to avoid hydration mismatch
    // Tabs component expects string values
    const [activeTab, setActiveTab] = useState<string>('1');
    
    // Logo preview and loading states
    const [logoPreview, setLogoPreview] = useState<string | null>(clinic.logo || null);
    const [logoLoading, setLogoLoading] = useState(false);
    
    // Mark as mounted and sync with URL parameter after mount
    useEffect(() => {
        setIsMounted(true);
        if (typeof window === 'undefined') {
            return;
        }
        const urlParams = new URLSearchParams(window.location.search);
        const tab = urlParams.get('tab');
        if (tab) {
            const tabNum = parseInt(tab);
            if (!isNaN(tabNum) && tabNum >= 1 && tabNum <= 7) {
                setActiveTab(tabNum.toString());
            }
        }
    }, []);
    
    // Handle tab change and update URL
    const handleTabChange = (value: string) => {
        setActiveTab(value);
        if (typeof window !== 'undefined') {
            const tabNum = parseInt(value);
            const url = new URL(window.location.href);
            url.searchParams.set('tab', tabNum.toString());
            // Use replace to update URL without adding to history and without full page reload
            window.history.replaceState({}, '', url.toString());
        }
    };
    
    // Initialize operating hours from clinic or use defaults
    const initialOperatingHours = operatingHours && operatingHours.length > 0
        ? DAYS_OF_WEEK.map(day => {
            const existing = operatingHours.find(oh => oh.day_of_week === day.value);
            return existing ? {
                day_of_week: day.value,
                opening_time: existing.opening_time || '09:00',
                closing_time: existing.closing_time || '17:00',
                is_open: existing.is_open,
                closed_all_day: existing.closed_all_day,
            } : {
                day_of_week: day.value,
                opening_time: '09:00',
                closing_time: '17:00',
                is_open: true,
                closed_all_day: false,
            };
        })
        : defaultOperatingHours;

    // Store files in ref
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

    // Operating hours validation errors
    const [operatingHoursErrors, setOperatingHoursErrors] = useState<Record<string, string>>({});

    // Validate operating hours time
    const validateOperatingHours = (hours: typeof data.clinic.operating_hours) => {
        const newErrors: Record<string, string> = {};
        
        hours.forEach((hour, index) => {
            if (hour.is_open && !hour.closed_all_day && hour.opening_time && hour.closing_time) {
                const opening = new Date(`2000-01-01T${hour.opening_time}`);
                const closing = new Date(`2000-01-01T${hour.closing_time}`);
                if (opening >= closing) {
                    // Use clearer message: start time must not be greater than end time
                    newErrors[`operating_hours.${index}`] = t('start_time_must_not_be_greater_than_end_time');
                }
            }
        });
        
        setOperatingHoursErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    // Initialize form with existing clinic data
    const { data, setData, processing, errors } = useForm({
        user_id: clinic.owner_id?.toString() || '',
        user: {
        name: clinic.owner?.name || '',
        email: clinic.owner?.email || '',
        phone: clinic.owner?.phone || '',
        admin_commission: clinic.owner?.admin_commission ?? null,
        password: '',
        password_confirmation: '',
        },
        clinic: {
            name_en: clinic.name_en || '',
            name_ar: clinic.name_ar || '',
            bio_en: clinic.bio_en || '',
            bio_ar: clinic.bio_ar || '',
            phone: clinic.phone || '',
            email: clinic.email || '',
            category_id: clinic.category_id?.toString() || '',
            governorate_id: (clinic.governorate_id?.toString() || clinic.governorate?.id?.toString() || ''),
            area_id: (clinic.area_id?.toString() || clinic.area?.id?.toString() || ''),
            address: clinic.address || '',
            block: clinic.block || '',
            street: clinic.street || '',
            avenue: clinic.avenue || '',
            house: clinic.house || '',
            floor: clinic.floor || '',
            apt: clinic.apt || '',
            city: clinic.city || '',
            state: clinic.state || '',
            country: clinic.country || 'Kuwait',
            postal_code: clinic.postal_code || '',
            latitude: clinic.latitude || '',
            longitude: clinic.longitude || '',
            auto_confirm_bookings: clinic.auto_confirm_bookings || false,
            cancellation_policy_en: clinic.cancellation_policy_en || '',
            cancellation_policy_ar: clinic.cancellation_policy_ar || '',
            refund_policy_en: clinic.refund_policy_en || '',
            refund_policy_ar: clinic.refund_policy_ar || '',
            privacy_policy_en: clinic.privacy_policy_en || '',
            privacy_policy_ar: clinic.privacy_policy_ar || '',
            terms_and_conditions_en: clinic.terms_and_conditions_en || '',
            terms_and_conditions_ar: clinic.terms_and_conditions_ar || '',
            reschedule_policy_en: clinic.reschedule_policy_en || '',
            reschedule_policy_ar: clinic.reschedule_policy_ar || '',
            rescheduling_buffer_hours: clinic.rescheduling_buffer_hours ?? siteSettings.rescheduling_buffer_hours,
            cancellation_buffer_hours: clinic.cancellation_buffer_hours ?? siteSettings.cancellation_buffer_hours,
            refund_policy_type: clinic.refund_policy_type || siteSettings.clinic_refund_policy_type,
            refund_policy_percentage: clinic.refund_policy_percentage ?? siteSettings.clinic_refund_policy_percentage,
            operating_hours: initialOperatingHours.map(oh => ({
                day_of_week: oh.day_of_week,
                opening_time: oh.opening_time || '09:00',
                closing_time: oh.closing_time || '17:00',
                is_open: oh.is_open,
                closed_all_day: oh.closed_all_day,
            })),
            subscription_package_id: (() => {
                // First try to get from activeSubscription relationship (this is the most reliable)
                if (clinic.activeSubscription?.subscription_package_id) {
                    const pkgId = clinic.activeSubscription.subscription_package_id;
                    return typeof pkgId === 'number' ? pkgId.toString() : String(pkgId);
                }
                // Fallback: get from subscriptions array (most recent subscription)
                // Check all subscriptions, not just active ones, since subscription_id is the definitive link
                if (subscriptions && subscriptions.length > 0) {
                    // Try to find active subscription first
                    const activeSub = subscriptions.find(sub => sub.status === 'active');
                    if (activeSub?.subscription_package_id) {
                        const pkgId = activeSub.subscription_package_id;
                        return typeof pkgId === 'number' ? pkgId.toString() : String(pkgId);
                    }
                    // If no active subscription, use the most recent one (could be expired but still linked)
                    const latestSub = subscriptions[0];
                    if (latestSub?.subscription_package_id) {
                        const pkgId = latestSub.subscription_package_id;
                        return typeof pkgId === 'number' ? pkgId.toString() : String(pkgId);
                    }
                }
                return '';
            })(),
        },
    });

    // Track previous user_id to prevent infinite loops
    const prevUserIdRef = useRef<string>(data.user_id || '');

    // Determine role-based restrictions
    const isClinicRole = currentUser?.roles?.includes('clinic') && !currentUser?.roles?.includes('super-admin');
    const isClinicManagerRole = currentUser?.roles?.includes('clinic_manager') && !currentUser?.roles?.includes('super-admin');

    // Get the users list for the dropdown - filter based on role
    const usersForDropdown = useMemo(() => {
        // If clinic role: Only show the logged-in user themselves
        if (isClinicRole && currentUser?.id) {
            const currentUserObj = {
                id: currentUser.id,
                name: currentUser.name,
                email: currentUser.email,
                phone: (currentUser as any).phone || '',
            };
            return [currentUserObj];
        }
        
        // If clinic manager: Only show the clinic owner
        if (isClinicManagerRole && clinicOwnerId) {
            // Find the clinic owner in the users list
            const ownerInUsers = users.find(u => u.id.toString() === clinicOwnerId.toString());
            if (ownerInUsers) {
                return [ownerInUsers];
            }
            // If owner not in users list but we have clinic.owner, use that
            if (clinic.owner && clinic.owner.id.toString() === clinicOwnerId.toString()) {
                return [{
                    id: clinic.owner.id,
                    name: clinic.owner.name,
                    email: clinic.owner.email,
                    phone: clinic.owner.phone || '',
                }];
            }
            return [];
        }
        
        // For all other roles: Show all clinic role users (from users prop)
        // The backend already filters this to only show clinic role users
        const baseUsers = users.length > 0 ? users : [];
        const ownerId = clinic.owner_id?.toString();
        
        // If owner exists and is not in the list, add them
        if (ownerId && clinic.owner && !baseUsers.find(u => u.id.toString() === ownerId)) {
            return [
                ...baseUsers,
                {
                    id: clinic.owner.id,
                    name: clinic.owner.name,
                    email: clinic.owner.email,
                    phone: clinic.owner.phone || '',
                }
            ];
        }
        return baseUsers;
    }, [isClinicRole, isClinicManagerRole, currentUser, clinicOwnerId, users, clinic.owner_id, clinic.owner]);
    const canChangeOwner = !isClinicRole && !isClinicManagerRole && !isReadOnlyOwner;
    const isOwnerInfoReadOnly = isClinicRole || isClinicManagerRole || isReadOnlyOwner;
    
    // Auto-set user_id based on role if not already set
    useEffect(() => {
        if (isClinicRole && currentUser?.id && !data.user_id) {
            setData('user_id', currentUser.id.toString());
        } else if (isClinicManagerRole && clinicOwnerId && !data.user_id) {
            setData('user_id', clinicOwnerId.toString());
        } else if ((isClinicRole || isClinicManagerRole) && clinic.owner_id && !data.user_id) {
            // Fallback: use clinic owner_id
            setData('user_id', clinic.owner_id.toString());
        }
    }, [isClinicRole, isClinicManagerRole, currentUser?.id, clinicOwnerId, clinic.owner_id]);

    // Get selected user for display
    const selectedUser = usersForDropdown.find(u => u.id.toString() === data.user_id);
    
    // Filter areas based on selected governorate
    const filteredAreas = data.clinic.governorate_id 
        ? areas.filter(area => area.governorate_id.toString() === data.clinic.governorate_id)
        : areas;

    // Track previous governorate_id to detect actual changes
    const prevGovernorateIdRef = useRef<string>(data.clinic.governorate_id || '');

    // Update areas when governorate changes (only when governorate actually changes)
    useEffect(() => {
        const currentGovernorateId = data.clinic.governorate_id || '';
        const prevGovernorateId = prevGovernorateIdRef.current;

        // Only process if governorate actually changed
        if (currentGovernorateId !== prevGovernorateId) {
            prevGovernorateIdRef.current = currentGovernorateId;

            if (currentGovernorateId && data.clinic.area_id) {
                // Check if the current area belongs to the new governorate
                const currentArea = areas.find(a => a.id.toString() === data.clinic.area_id);
                if (currentArea && currentArea.governorate_id.toString() !== currentGovernorateId) {
                    // Area doesn't belong to new governorate, reset it
                    setData('clinic.area_id', '');
                }
                // If area belongs to new governorate, keep it
            } else if (!currentGovernorateId && data.clinic.area_id) {
                // Governorate was cleared, clear area too
                setData('clinic.area_id', '');
            }
        }
    }, [data.clinic.governorate_id, data.clinic.area_id, areas, setData]);

    // Update user fields when owner selection changes
    useEffect(() => {
        // Only update if user_id actually changed
        if (prevUserIdRef.current === data.user_id) {
            return;
        }
        
        prevUserIdRef.current = data.user_id || '';
        
        if (data.user_id) {
            const selectedUser = usersForDropdown.find(u => u.id.toString() === data.user_id);
            if (selectedUser) {
                // Get admin_commission from clinic.owner if it's the same user, otherwise use null
                const adminCommission = (clinic.owner?.id.toString() === data.user_id) 
                    ? (clinic.owner?.admin_commission ?? null)
                    : null;
                setData('user', {
                    name: selectedUser.name || '',
                    email: selectedUser.email || '',
                    phone: (selectedUser.phone || '') as string,
                    admin_commission: adminCommission,
                    password: '',
                    password_confirmation: '',
                });
            }
        } else {
            // Reset user fields if no owner is selected
            setData('user', {
                name: '',
                email: '',
                phone: '',
                admin_commission: null,
                password: '',
                password_confirmation: '',
            });
        }
    }, [data.user_id, usersForDropdown]);

    const handleFileChange = (field: 'logo' | 'business_license' | 'id_document_front' | 'id_document_back', file: File | null) => {
        // Validate file type for logo (only JPG, JPEG, PNG allowed)
        if (field === 'logo' && file) {
            const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png'];
            const fileExtension = file.name.split('.').pop()?.toLowerCase();
            const isValidType = allowedTypes.includes(file.type) || 
                               (fileExtension && ['jpg', 'jpeg', 'png'].includes(fileExtension));
            
            if (!isValidType) {
                const errorMessage = t('logo_invalid_format');
                // Logo is stored in filesRef, not in form data
                // Show error toast
                customToast.error(
                    t('invalid_file_format'),
                    errorMessage
                );
                // Clear the file input
                const input = document.getElementById('clinic.logo') as HTMLInputElement;
                if (input) input.value = '';
                return;
            }
        }
        
        filesRef.current[field] = file;
        
        // Handle logo preview
        if (field === 'logo') {
            if (file) {
                setLogoLoading(true);
                // Create preview URL
                const previewUrl = URL.createObjectURL(file);
                setLogoPreview(previewUrl);
                // Image will load asynchronously, so we'll set loading to false once it's loaded
                const img = new Image();
                img.onload = () => {
                    setLogoLoading(false);
                };
                img.onerror = () => {
                    setLogoLoading(false);
                };
                img.src = previewUrl;
            } else {
                // Reset to original logo if file is removed
                setLogoPreview(clinic.logo || null);
                setLogoLoading(false);
            }
        }
    };
    
    // Cleanup preview URLs on unmount and when preview changes
    useEffect(() => {
        return () => {
            if (logoPreview && logoPreview.startsWith('blob:')) {
                URL.revokeObjectURL(logoPreview);
            }
        };
    }, [logoPreview]);
    
    // Update logo preview when clinic logo changes (e.g., after successful upload)
    useEffect(() => {
        if (clinic.logo && !filesRef.current.logo) {
            setLogoPreview(clinic.logo);
        }
    }, [clinic.logo]);

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        
        const formData = new FormData();
        
        // Add owner/user data
        if (data.user_id || clinic.owner_id) {
            formData.append('owner_id', (data.user_id || clinic.owner_id?.toString() || '').toString());
        }
        
        // Add user information for update (only if user has permission)
        if (data.user && selectedUser && !isOwnerInfoReadOnly) {
            if (data.user.name) {
                formData.append('user_name', data.user.name);
            }
            if (data.user.email) {
                formData.append('user_email', data.user.email);
            }
            if (data.user.phone) {
                formData.append('user_phone', data.user.phone);
            }
        }
        
        // Add admin_commission only if user has permission (not clinic or clinic_manager)
        if (data.user && selectedUser && !isOwnerInfoReadOnly && data.user.admin_commission !== undefined) {
                // Send empty string for null to allow clearing the value
                formData.append('admin_commission', data.user.admin_commission === null ? '' : data.user.admin_commission.toString());
            }
        
        // Add password fields only if password is provided
        if (data.user && selectedUser && !isOwnerInfoReadOnly && data.user.password && data.user.password !== '') {
            formData.append('password', data.user.password);
            formData.append('password_confirmation', data.user.password_confirmation || '');
        }
        
        // Add clinic basic info
        if (data.clinic.name_en) {
            formData.append('name_en', data.clinic.name_en);
        }
        if (data.clinic.name_ar) {
            formData.append('name_ar', data.clinic.name_ar);
        }
        if (data.clinic.bio_en !== undefined) {
            formData.append('bio_en', data.clinic.bio_en || '');
        }
        if (data.clinic.bio_ar !== undefined) {
            formData.append('bio_ar', data.clinic.bio_ar || '');
        }
        if (data.clinic.phone) {
            formData.append('phone', data.clinic.phone);
        }
        if (data.clinic.email !== undefined) {
            formData.append('email', data.clinic.email || '');
        }
        if (data.clinic.category_id) {
            formData.append('category_id', data.clinic.category_id);
        }
        
        // Add address data - always send governorate_id and area_id (even if empty to clear them)
        formData.append('governorate_id', data.clinic.governorate_id ? parseInt(data.clinic.governorate_id, 10).toString() : '');
        formData.append('area_id', data.clinic.area_id ? parseInt(data.clinic.area_id, 10).toString() : '');
        if (data.clinic.address) {
            formData.append('address', data.clinic.address);
        }
        if (data.clinic.block !== undefined) {
            formData.append('block', data.clinic.block || '');
        }
        if (data.clinic.street !== undefined) {
            formData.append('street', data.clinic.street || '');
        }
        if (data.clinic.avenue !== undefined) {
            formData.append('avenue', data.clinic.avenue || '');
        }
        if (data.clinic.house !== undefined) {
            formData.append('house', data.clinic.house || '');
        }
        if (data.clinic.floor !== undefined) {
            formData.append('floor', data.clinic.floor || '');
        }
        if (data.clinic.apt !== undefined) {
            formData.append('apt', data.clinic.apt || '');
        }
        if (data.clinic.city !== undefined) {
            formData.append('city', data.clinic.city || '');
        }
        if (data.clinic.state !== undefined) {
            formData.append('state', data.clinic.state || '');
        }
        if (data.clinic.country !== undefined) {
            formData.append('country', data.clinic.country || '');
        }
        if (data.clinic.postal_code !== undefined) {
            formData.append('postal_code', data.clinic.postal_code || '');
        }
        if (data.clinic.latitude !== undefined) {
            formData.append('latitude', data.clinic.latitude || '');
        }
        if (data.clinic.longitude !== undefined) {
            formData.append('longitude', data.clinic.longitude || '');
        }
        
        // Add settings
        if (data.clinic.auto_confirm_bookings !== undefined) {
            formData.append('auto_confirm_bookings', data.clinic.auto_confirm_bookings ? '1' : '0');
        }
        if (data.clinic.cancellation_policy_en !== undefined) {
            formData.append('cancellation_policy_en', data.clinic.cancellation_policy_en || '');
        }
        if (data.clinic.cancellation_policy_ar !== undefined) {
            formData.append('cancellation_policy_ar', data.clinic.cancellation_policy_ar || '');
        }
        if (data.clinic.refund_policy_en !== undefined) {
            formData.append('refund_policy_en', data.clinic.refund_policy_en || '');
        }
        if (data.clinic.refund_policy_ar !== undefined) {
            formData.append('refund_policy_ar', data.clinic.refund_policy_ar || '');
        }
        if (data.clinic.privacy_policy_en !== undefined) {
            formData.append('privacy_policy_en', data.clinic.privacy_policy_en || '');
        }
        if (data.clinic.privacy_policy_ar !== undefined) {
            formData.append('privacy_policy_ar', data.clinic.privacy_policy_ar || '');
        }
        if (data.clinic.terms_and_conditions_en !== undefined) {
            formData.append('terms_and_conditions_en', data.clinic.terms_and_conditions_en || '');
        }
        if (data.clinic.terms_and_conditions_ar !== undefined) {
            formData.append('terms_and_conditions_ar', data.clinic.terms_and_conditions_ar || '');
        }
        if (data.clinic.reschedule_policy_en !== undefined) {
            formData.append('reschedule_policy_en', data.clinic.reschedule_policy_en || '');
        }
        if (data.clinic.reschedule_policy_ar !== undefined) {
            formData.append('reschedule_policy_ar', data.clinic.reschedule_policy_ar || '');
        }
        
        // Add buffer hours
        if (data.clinic.rescheduling_buffer_hours !== undefined && data.clinic.rescheduling_buffer_hours !== null) {
            formData.append('rescheduling_buffer_hours', data.clinic.rescheduling_buffer_hours.toString());
        }
        if (data.clinic.cancellation_buffer_hours !== undefined && data.clinic.cancellation_buffer_hours !== null) {
            formData.append('cancellation_buffer_hours', data.clinic.cancellation_buffer_hours.toString());
        }
        
        // Add refund policy type and value
        if (data.clinic.refund_policy_type !== undefined && data.clinic.refund_policy_type !== null) {
            formData.append('refund_policy_type', data.clinic.refund_policy_type);
        }
        if (data.clinic.refund_policy_percentage !== undefined && data.clinic.refund_policy_percentage !== null) {
            formData.append('refund_policy_percentage', data.clinic.refund_policy_percentage.toString());
        }
        
        // Add operating hours
        if (data.clinic.operating_hours && Array.isArray(data.clinic.operating_hours)) {
            data.clinic.operating_hours.forEach((oh: any, index: number) => {
                formData.append(`operating_hours[${index}][day_of_week]`, oh.day_of_week || '');
                formData.append(`operating_hours[${index}][is_open]`, oh.is_open ? '1' : '0');
                formData.append(`operating_hours[${index}][closed_all_day]`, oh.closed_all_day ? '1' : '0');
                if (oh.opening_time) formData.append(`operating_hours[${index}][opening_time]`, oh.opening_time);
                if (oh.closing_time) formData.append(`operating_hours[${index}][closing_time]`, oh.closing_time);
            });
        }
        
        // Add subscription
        if (data.clinic.subscription_package_id !== undefined) {
            formData.append('subscription_package_id', data.clinic.subscription_package_id || '');
        }
        
        // Add files
        if (filesRef.current.logo instanceof File) {
            formData.append('logo', filesRef.current.logo);
        }
        if (filesRef.current.business_license instanceof File) {
            formData.append('business_license', filesRef.current.business_license);
        }
        if (filesRef.current.id_document_front instanceof File) {
            formData.append('id_document_front', filesRef.current.id_document_front);
        }
        if (filesRef.current.id_document_back instanceof File) {
            formData.append('id_document_back', filesRef.current.id_document_back);
        }
        
        formData.append('_method', 'PATCH');
        
        router.post(`/dashboard/clinics/${clinic.id}`, formData, {
            forceFormData: true,
            preserveScroll: true,
            onSuccess: () => {
                customToast.success(t('clinic_updated_successfully'));
                router.reload({ only: ['clinic'] });
            },
            onError: (errors) => {
                if (errors && Object.keys(errors).length > 0) {
                    Object.values(errors).forEach((error) => {
                        if (typeof error === 'string') {
                            customToast.error(error);
                        } else if (Array.isArray(error)) {
                            (error as string[]).forEach((err) => customToast.error(err));
                        }
                    });
                }
            },
        });
    };

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
            title: t('edit_clinic'),
            href: '#',
        },
    ];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={t('edit_clinic')} />

            <div className={cn("flex h-full flex-1 flex-col gap-6 overflow-x-auto rounded-xl bg-card dark:bg-card p-6 border border-border", isRTL ? '!text-right' : '!text-left')} dir={dir}>
                {/* Header */}
                <div className={cn("flex items-center justify-between border-b pb-4", flexDirection)}>
                    <div className={cn(isRTL ? '!text-right' : '!text-left')}>
                        <h1 className={cn("text-3xl font-bold text-foreground", isRTL ? '!text-right' : '!text-left')}>{t('edit_clinic')}</h1>
                        <p className={cn("text-muted-foreground mt-1", isRTL ? '!text-right' : '!text-left')}>{t('edit_clinic_description')}</p>
                    </div>
                    
                    {isMounted && (
                    <Link href="/dashboard/clinics">
                        <Button variant="outline" className={cn("flex items-center gap-2", flexDirection)}>
                            <ArrowLeft className={cn("h-4 w-4", isRTL && 'rotate-180')} />
                            {t('back')}
                        </Button>
                    </Link>
                    )}
                </div>

                <form onSubmit={submit} encType="multipart/form-data">
                    {!isMounted ? (
                        // Show loading state during SSR and initial hydration
                        <div className="flex items-center justify-center py-12">
                            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
                        </div>
                    ) : (
                        <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
                            <TabsList className={cn("grid w-full grid-cols-6", flexDirection)}> {/* Changed from grid-cols-7 to grid-cols-6 - subscription tab hidden */}
                                <TabsTrigger value="1" className={cn(isRTL ? '!text-right' : '!text-left')}>
                                    {t('account_information')}
                                </TabsTrigger>
                                <TabsTrigger value="2" className={cn(isRTL ? '!text-right' : '!text-left')}>
                                    {t('clinic_basic_info')}
                                </TabsTrigger>
                                <TabsTrigger value="3" className={cn(isRTL ? '!text-right' : '!text-left')}>
                                    {t('address_location')}
                                </TabsTrigger>
                                <TabsTrigger value="4" className={cn(isRTL ? '!text-right' : '!text-left')}>
                                    {t('settings_policies')}
                                </TabsTrigger>
                                <TabsTrigger value="5" className={cn(isRTL ? '!text-right' : '!text-left')}>
                                    {t('operating_hours')}
                                </TabsTrigger>
                                <TabsTrigger value="6" className={cn(isRTL ? '!text-right' : '!text-left')}>
                                    {t('documents')}
                                </TabsTrigger>
                                {/* <TabsTrigger value="7" className={cn(isRTL ? '!text-right' : '!text-left')}> COMMENTED OUT - Subscription tab hidden
                                    {t('subscription')}
                                </TabsTrigger> */}
                            </TabsList>

                        {/* Tab 1: Account Information */}
                        <TabsContent value="1" className={cn("mt-6", isRTL ? '!text-right' : '!text-left')} dir={dir}>
                            <div className={cn("space-y-6 p-6 bg-card rounded-lg border", isRTL ? '!text-right' : '!text-left')} dir={dir}>
                                <div className={cn("flex items-center gap-3 mb-6", flexDirection)}>
                                    <Building2 className="h-6 w-6 text-primary" />
                                    <h2 className={cn("text-2xl font-semibold text-foreground", isRTL ? '!text-right' : '!text-left')}>
                                        {t('account_information')}
                                    </h2>
                                </div>
                                
                                <div className={cn("space-y-4", isRTL ? '!text-right' : '!text-left')} dir={dir}>
                                    <div className={cn("space-y-2", isRTL ? '!text-right' : '!text-left')}>
                        <Label htmlFor="user_id" className={cn(isRTL ? '!text-right' : '!text-left')}>
                                            {isRTL ? <><span className="text-red-500">*</span> {t('clinic_owner')}</> : <>{t('clinic_owner')} <span className="text-red-500">*</span></>}
                                        </Label>
                                        <Select 
                                            value={String(data.user_id || '')} 
                                            onValueChange={(value) => {
                                                // Prevent changing owner for clinic/clinic_manager roles
                                                if (!canChangeOwner) {
                                                    return;
                                                }
                                                setData('user_id', value);
                                            }}
                                            disabled={!canChangeOwner}
                                        >
                                            <SelectTrigger className={cn(errors.user_id ? 'border-red-500' : '', getInputTextAlign())} disabled={!canChangeOwner} dir={dir}>
                                                <SelectValue placeholder={t('select_user')} />
                                            </SelectTrigger>
                                            <SelectContent dir={dir}>
                                                {usersForDropdown.map((user) => (
                                                    <SelectItem key={user.id} value={user.id.toString()} dir={dir}>
                                                        {user.name} ({user.email})
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        {!canChangeOwner && (
                                            <p className="text-xs text-muted-foreground">
                                                {isClinicRole 
                                                    ? t('owner_locked_clinic_role')
                                                    : t('owner_locked_clinic_manager_role')}
                                            </p>
                                        )}
                                        <InputError message={errors.user_id} />
                                    </div>
                                    
                                    {/* Editable Owner Information */}
                                    {selectedUser && (
                                        <div className={cn("p-4 bg-muted/50 rounded-lg border space-y-4", isRTL ? '!text-right' : '!text-left')} dir={dir}>
                                            <p className={cn("text-sm font-medium text-muted-foreground", isRTL ? '!text-right' : '!text-left')} dir={dir}>{t('owner_information')}</p>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                <div className={cn("space-y-2", isRTL ? '!text-right' : '!text-left')} dir={dir}>
                                                    <Label htmlFor="user.name" className={cn(isRTL ? '!text-right' : '!text-left')} dir={dir}>
                                                        {t('full_name')} <span className="text-red-500">*</span>
                                                    </Label>
                                                    <Input
                                                        id="user.name"
                                                        type="text"
                                                        required
                                                        value={data.user.name}
                                                        onChange={(e) => setData('user.name', e.target.value)}
                                                        placeholder={t('enter_full_name')}
                                                        className={cn(errors['user.name'] ? 'border-red-500' : '', getInputTextAlign())}
                                                        disabled={isOwnerInfoReadOnly}
                                                        readOnly={isOwnerInfoReadOnly}
                                                        dir={dir}
                                                    />
                                                    <InputError message={errors['user.name']} />
                                                </div>
                                                <div className={cn("space-y-2", isRTL ? '!text-right' : '!text-left')} dir={dir}>
                                                    <Label htmlFor="user.email" className={cn(isRTL ? '!text-right' : '!text-left')} dir={dir}>
                                                        {t('email')} <span className="text-red-500">*</span>
                                                    </Label>
                                                    <Input
                                                        id="user.email"
                                                        type="email"
                                                        required
                                                        value={data.user.email}
                                                        onChange={(e) => setData('user.email', e.target.value.trimStart())}
                                                        onBlur={(e) => {
                                                            const trimmed = e.target.value.trim().toLowerCase();
                                                            setData('user.email', trimmed);
                                                        }}
                                                        placeholder={t('email_example')}
                                                        className={cn(errors['user.email'] ? 'border-red-500' : '', getInputTextAlign())}
                                                        disabled={isOwnerInfoReadOnly}
                                                        readOnly={isOwnerInfoReadOnly}
                                                        dir="ltr"
                                                    />
                                                    <InputError message={errors['user.email']} />
                                                </div>
                                                <div className={cn("space-y-2", isRTL ? '!text-right' : '!text-left')} dir={dir}>
                                                    <Label htmlFor="user.phone" className={cn(isRTL ? '!text-right' : '!text-left')} dir={dir}>
                                                        {t('phone_number')} <span className="text-red-500">*</span>
                                                    </Label>
                                                    <PhoneInput
                                                        id="user.phone"
                                                        required
                                                        value={data.user.phone}
                                                        onChange={(value) => setData('user.phone', value)}
                                                        className={errors['user.phone'] ? 'border-red-500' : ''}
                                                        disabled={isOwnerInfoReadOnly}
                                                        readOnly={isOwnerInfoReadOnly}
                                                    />
                                                    <InputError message={errors['user.phone']} />
                                                </div>
                                                <div className={cn("space-y-2", isRTL ? '!text-right' : '!text-left')} dir={dir}>
                                                    <Label htmlFor="user_id" className={cn(isRTL ? '!text-right' : '!text-left')} dir={dir}>
                                                        {t('user_id')}
                                                    </Label>
                                                    <Input
                                                        id="user_id"
                                                        type="text"
                                                        value={`#${selectedUser.id}`}
                                                        disabled
                                                        className={cn("bg-muted", getInputTextAlign())}
                                                        dir="ltr"
                                                    />
                                                </div>
                                                <div className={cn("space-y-2", isRTL ? '!text-right' : '!text-left')} dir={dir}>
                                                    <Label htmlFor="user.admin_commission" className={cn(isRTL ? '!text-right' : '!text-left')} dir={dir}>
                                                        {t('admin_commission')}
                                                    </Label>
                                                    <Input
                                                        id="user.admin_commission"
                                                        type="number"
                                                        min="0"
                                                        max="100"
                                                        step="0.01"
                                                        value={data.user.admin_commission ?? ''}
                                                        onChange={(e) => {
                                                            // Prevent changes if readonly
                                                            if (isOwnerInfoReadOnly) {
                                                                return;
                                                            }
                                                            const value = e.target.value === '' ? null : parseFloat(e.target.value);
                                                            setData('user.admin_commission', value);
                                                        }}
                                                        placeholder="0.00"
                                                        className={cn(errors['user.admin_commission'] ? 'border-red-500' : '', getInputTextAlign())}
                                                        disabled={isOwnerInfoReadOnly}
                                                        readOnly={isOwnerInfoReadOnly}
                                                        dir="ltr"
                                                    />
                                                    {isOwnerInfoReadOnly && (
                                                        <p className={cn("text-xs text-muted-foreground", isRTL ? '!text-right' : '!text-left')} dir={dir}>
                                                            {t('admin_commission_readonly')}
                                                        </p>
                                                    )}
                                                    <InputError message={errors['user.admin_commission']} />
                                                </div>
                                                {!isOwnerInfoReadOnly && (
                                                    <>
                                                        <div className={cn("space-y-2 md:col-span-2", isRTL ? '!text-right' : '!text-left')} dir={dir}>
                                                            <Label htmlFor="user.password" className={cn(isRTL ? '!text-right' : '!text-left')} dir={dir}>
                                                                {t('password')} ({t('optional')})
                                                            </Label>
                                                            <PasswordInput
                                                                id="user.password"
                                                                value={data.user.password || ''}
                                                                onChange={(e) => setData('user.password', e.target.value)}
                                                                placeholder={t('enter_new_password')}
                                                                className={errors['user.password'] ? 'border-red-500' : ''}
                                                                error={errors['user.password']}
                                                            />
                                                            <p className={cn("text-xs text-muted-foreground", isRTL ? '!text-right' : '!text-left')} dir={dir}>
                                                                {t('leave_blank_to_keep_current')}
                                                            </p>
                                                            <InputError message={errors['user.password']} />
                                                        </div>
                                                        {data.user.password && (
                                                            <div className={cn("space-y-2 md:col-span-2", isRTL ? '!text-right' : '!text-left')} dir={dir}>
                                                                <Label htmlFor="user.password_confirmation" className={cn(isRTL ? '!text-right' : '!text-left')} dir={dir}>
                                                                    {t('confirm_password')} <span className="text-red-500">*</span>
                                                                </Label>
                                                                <PasswordInput
                                                                    id="user.password_confirmation"
                                                                    value={data.user.password_confirmation || ''}
                                                                    onChange={(e) => setData('user.password_confirmation', e.target.value)}
                                                                    placeholder={t('confirm_password')}
                                                                    className={errors['user.password_confirmation'] ? 'border-red-500' : ''}
                                                                    error={errors['user.password_confirmation']}
                                                                />
                                                                <InputError message={errors['user.password_confirmation']} />
                                                            </div>
                                                        )}
                                                    </>
                                                )}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </TabsContent>

                        {/* Tab 2: Clinic Basic Information */}
                        <TabsContent value="2" className={cn("mt-6", isRTL ? '!text-right' : '!text-left')} dir={dir}>
                            <div className={cn("space-y-6 p-6 bg-card rounded-lg border", isRTL ? '!text-right' : '!text-left')} dir={dir}>
                                <div className={cn("flex items-center gap-3 mb-6", flexDirection)}>
                                    <FileText className="h-6 w-6 text-primary" />
                                    <h2 className={cn("text-2xl font-semibold text-foreground", isRTL ? '!text-right' : '!text-left')}>
                                        {t('clinic_basic_info')}
                                    </h2>
                                </div>
                                
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className={cn("space-y-2", isRTL ? '!text-right' : '!text-left')} dir={dir}>
                                        <Label htmlFor="clinic.name_en" className={cn(isRTL ? '!text-right' : '!text-left')} dir={dir}>
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
                                                const limitedValue = value.slice(0, 30);
                                                setData('clinic.name_en', limitedValue);
                                            }}
                                            onBlur={(e) => {
                                                const trimmed = e.target.value.trim();
                                                setData('clinic.name_en', trimmed);
                                            }}
                                            placeholder={t('enter_clinic_name_en')}
                                            className={cn(errors['clinic.name_en'] ? 'border-red-500' : '', getInputTextAlign())}
                                            dir="ltr"
                                        />
                                        <InputError message={errors['clinic.name_en']} />
                                    </div>

                                    <div className={cn("space-y-2", isRTL ? '!text-right' : '!text-left')} dir={dir}>
                                        <Label htmlFor="clinic.name_ar" className={cn(isRTL ? '!text-right' : '!text-left')} dir={dir}>
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
                                                const limitedValue = value.slice(0, 30);
                                                setData('clinic.name_ar', limitedValue);
                                            }}
                                            onBlur={(e) => {
                                                const trimmed = e.target.value.trim();
                                                setData('clinic.name_ar', trimmed);
                                            }}
                                            placeholder={t('enter_clinic_name_ar')}
                                            className={cn(errors['clinic.name_ar'] ? 'border-red-500' : '', getInputTextAlign())}
                                            dir="rtl"
                                        />
                                        <InputError message={errors['clinic.name_ar']} />
                                    </div>

                                    <div className={cn("space-y-2 md:col-span-2", isRTL ? '!text-right' : '!text-left')} dir={dir}>
                                        <Label htmlFor="clinic.bio_en" className={cn(isRTL ? '!text-right' : '!text-left')} dir={dir}>
                                            {t('bio_en')}
                                        </Label>
                                        <Textarea
                                            id="clinic.bio_en"
                                            value={data.clinic.bio_en}
                                            onChange={(e) => setData('clinic.bio_en', e.target.value)}
                                            placeholder={t('enter_bio_en')}
                                            rows={4}
                                            className={cn(errors['clinic.bio_en'] ? 'border-red-500' : '', getInputTextAlign())}
                                            dir="ltr"
                                        />
                                        <InputError message={errors['clinic.bio_en']} />
                                    </div>

                                    <div className={cn("space-y-2 md:col-span-2", isRTL ? '!text-right' : '!text-left')} dir={dir}>
                                        <Label htmlFor="clinic.bio_ar" className={cn(isRTL ? '!text-right' : '!text-left')} dir={dir}>
                                            {t('bio_ar')}
                                        </Label>
                                        <Textarea
                                            id="clinic.bio_ar"
                                            value={data.clinic.bio_ar}
                                            onChange={(e) => setData('clinic.bio_ar', e.target.value)}
                                            placeholder={t('enter_bio_ar')}
                                            rows={4}
                                            className={cn(errors['clinic.bio_ar'] ? 'border-red-500' : '', getInputTextAlign())}
                                            dir="rtl"
                                        />
                                        <InputError message={errors['clinic.bio_ar']} />
                                    </div>

                                    <div className={cn("space-y-2", isRTL ? '!text-right' : '!text-left')} dir={dir}>
                                        <Label htmlFor="clinic.phone" className={cn(isRTL ? '!text-right' : '!text-left')} dir={dir}>
                                            {t('phone')} <span className="text-red-500">*</span>
                                        </Label>
                                        <PhoneInput
                                            id="clinic.phone"
                                            required
                                            value={data.clinic.phone}
                                            onChange={(value) => setData('clinic.phone', value)}
                                            className={errors['clinic.phone'] ? 'border-red-500' : ''}
                                        />
                                        <InputError message={errors['clinic.phone']} />
                                    </div>

                                    <div className={cn("space-y-2", isRTL ? '!text-right' : '!text-left')} dir={dir}>
                                        <Label htmlFor="clinic.email" className={cn(isRTL ? '!text-right' : '!text-left')} dir={dir}>
                                            {t('email')} <span className="text-red-500">*</span>
                                        </Label>
                                        <Input
                                            id="clinic.email"
                                            type="email"
                                            required
                                            value={data.clinic.email}
                                            onChange={(e) => setData('clinic.email', e.target.value.trimStart())}
                                            onBlur={(e) => {
                                                const trimmed = e.target.value.trim().toLowerCase();
                                                setData('clinic.email', trimmed);
                                            }}
                                            placeholder={t('email_example')}
                                            className={cn(errors['clinic.email'] ? 'border-red-500' : '', getInputTextAlign())}
                                            dir="ltr"
                                        />
                                        <InputError message={errors['clinic.email']} />
                                    </div>

                                    <div className={cn("space-y-2", isRTL ? '!text-right' : '!text-left')} dir={dir}>
                                        <Label htmlFor="clinic.category_id" className={cn(isRTL ? '!text-right' : '!text-left')} dir={dir}>
                                            {t('category')} <span className="text-red-500">*</span>
                                        </Label>
                                        <Select 
                                            value={data.clinic.category_id || ''} 
                                            onValueChange={(value) => setData('clinic.category_id', value)}
                                        >
                                            <SelectTrigger className={cn(errors['clinic.category_id'] ? 'border-red-500' : '', getInputTextAlign())} dir={dir}>
                                                <SelectValue placeholder={t('select_category')} />
                                            </SelectTrigger>
                                            <SelectContent dir={dir}>
                                                {categories.map((category) => (
                                                    <SelectItem key={category.id} value={category.id.toString()} dir={dir}>
                                                        {getLocalizedName(category.name_en, category.name_ar, locale)}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        <InputError message={errors['clinic.category_id']} />
                                        {data.clinic.category_id && (() => {
                                            const selectedCategory = categories.find(c => c.id.toString() === data.clinic.category_id);
                                            return selectedCategory ? (
                                                <p className={cn("text-sm text-muted-foreground", isRTL ? '!text-right' : '!text-left')} dir={dir}>
                                                    {t('selected')}: {getLocalizedName(selectedCategory.name_en, selectedCategory.name_ar, locale)}
                                                </p>
                                            ) : null;
                                        })()}
                                    </div>

                                    <div className={cn("space-y-2", isRTL ? '!text-right' : '!text-left')} dir={dir}>
                                        <Label htmlFor="clinic.logo" className={cn(isRTL ? '!text-right' : '!text-left')} dir={dir}>
                                            {t('logo')}
                                        </Label>
                                        <div className={cn("flex items-center gap-4", flexDirection)}>
                                            {logoPreview && (
                                                <div className="relative">
                                                    {logoLoading ? (
                                                        <div className="w-32 h-32 rounded border-2 border-dashed border-gray-300 dark:border-slate-600 flex items-center justify-center bg-gray-50 dark:bg-slate-800">
                                                            <LoaderCircle className="h-6 w-6 animate-spin text-primary" />
                                                        </div>
                                                    ) : (
                                                        <img 
                                                            src={logoPreview} 
                                                            alt={filesRef.current.logo ? "New logo" : "Current logo"} 
                                                            className="w-32 h-32 object-cover rounded border border-gray-200 dark:border-slate-700" 
                                                        />
                                            )}
                                                    {filesRef.current.logo && !logoLoading && (
                                                        <button
                                                            type="button"
                                                            onClick={() => {
                                                                handleFileChange('logo', null);
                                                                const input = document.getElementById('clinic.logo') as HTMLInputElement;
                                                                if (input) input.value = '';
                                                            }}
                                                            className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors"
                                                            title={t('remove')}
                                                        >
                                                            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                                            </svg>
                                                        </button>
                                                    )}
                                                </div>
                                            )}
                                            <div className="relative">
                                                <Input
                                                    id="clinic.logo"
                                                    type="file"
                                                    accept="image/jpeg,image/jpg,image/png"
                                                    onChange={(e) => {
                                                        const file = e.target.files?.[0] || null;
                                                        handleFileChange('logo', file);
                                                    }}
                                                    disabled={logoLoading}
                                                    className={`hidden ${(errors as any)['clinic.logo'] ? 'border-red-500' : ''}`}
                                                />
                                                <Label
                                                    htmlFor="clinic.logo"
                                                    className={cn("flex items-center gap-2 cursor-pointer px-4 py-2 border rounded-md hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 disabled:opacity-50 disabled:cursor-not-allowed", flexDirection, logoLoading ? 'opacity-50 cursor-not-allowed' : '')}
                                                    dir={dir}
                                                >
                                                    {logoLoading ? (
                                                        <LoaderCircle className="h-4 w-4 animate-spin" />
                                                    ) : (
                                                    <Upload className="h-4 w-4" />
                                                    )}
                                                    <span className={cn(isRTL ? '!text-right' : '!text-left')} dir={dir}>{logoLoading ? t('uploading') : t('choose_file')}</span>
                                                </Label>
                                            </div>
                                        </div>
                                        <InputError message={(errors as any)['clinic.logo']} />
                                    </div>
                                </div>
                            </div>
                        </TabsContent>

                        {/* Tab 3: Address & Location */}
                        <TabsContent value="3" className={cn("mt-6", isRTL ? '!text-right' : '!text-left')} dir={dir}>
                            <div className={cn("space-y-6 p-6 bg-card rounded-lg border", isRTL ? '!text-right' : '!text-left')} dir={dir}>
                                <div className={cn("flex items-center gap-3 mb-6", flexDirection)}>
                                    <MapPin className="h-6 w-6 text-primary" />
                                    <h2 className={cn("text-2xl font-semibold text-foreground", isRTL ? '!text-right' : '!text-left')}>
                                        {t('address_location')}
                                    </h2>
                                </div>
                                
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className={cn("space-y-2", isRTL ? '!text-right' : '!text-left')} dir={dir}>
                                        <Label htmlFor="clinic.governorate_id" className={cn(isRTL ? '!text-right' : '!text-left')} dir={dir}>
                                            {t('governorate')} <span className="text-red-500">*</span>
                                        </Label>
                                        <Select 
                                            value={data.clinic.governorate_id ? data.clinic.governorate_id.toString() : ''} 
                                            onValueChange={(value) => {
                                                setData('clinic.governorate_id', value);
                                                setData('clinic.area_id', ''); // Reset area when governorate changes
                                            }}
                                        >
                                            <SelectTrigger className={cn(errors['clinic.governorate_id'] ? 'border-red-500' : '', getInputTextAlign())} dir={dir}>
                                                <SelectValue placeholder={t('select_governorate')} />
                                            </SelectTrigger>
                                            <SelectContent dir={dir}>
                                                {governorates.map((governorate) => (
                                                    <SelectItem key={governorate.id} value={governorate.id.toString()} dir={dir}>
                                                        {getLocalizedName(governorate.name_en, governorate.name_ar, locale)}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        <InputError message={errors['clinic.governorate_id']} />
                                        {data.clinic.governorate_id && (() => {
                                            const selectedGov = governorates.find(g => g.id.toString() === data.clinic.governorate_id);
                                            return selectedGov ? (
                                                <p className={cn("text-sm text-muted-foreground", isRTL ? '!text-right' : '!text-left')} dir={dir}>
                                                    {t('selected')}: {getLocalizedName(selectedGov.name_en, selectedGov.name_ar, locale)}
                                                </p>
                                            ) : null;
                                        })()}
                                    </div>

                                    <div className={cn("space-y-2", isRTL ? '!text-right' : '!text-left')} dir={dir}>
                                        <Label htmlFor="clinic.area_id" className={cn(isRTL ? '!text-right' : '!text-left')} dir={dir}>
                                            {t('area')} <span className="text-red-500">*</span>
                                        </Label>
                                        <Select 
                                            value={data.clinic.area_id ? data.clinic.area_id.toString() : ''} 
                                            onValueChange={(value) => setData('clinic.area_id', value)}
                                            disabled={!data.clinic.governorate_id}
                                        >
                                            <SelectTrigger className={cn(errors['clinic.area_id'] ? 'border-red-500' : '', getInputTextAlign())} dir={dir}>
                                                <SelectValue placeholder={data.clinic.governorate_id ? t('select_area') : t('select_governorate_first')} />
                                            </SelectTrigger>
                                            <SelectContent dir={dir}>
                                                {filteredAreas.map((area) => (
                                                    <SelectItem key={area.id} value={area.id.toString()} dir={dir}>
                                                        {getLocalizedName(area.name_en, area.name_ar, locale)}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        <InputError message={errors['clinic.area_id']} />
                                        {data.clinic.area_id && (() => {
                                            const selectedArea = areas.find(a => a.id.toString() === data.clinic.area_id);
                                            return selectedArea ? (
                                                <p className={cn("text-sm text-muted-foreground", isRTL ? '!text-right' : '!text-left')} dir={dir}>
                                                    {t('selected')}: {getLocalizedName(selectedArea.name_en, selectedArea.name_ar, locale)}
                                                </p>
                                            ) : null;
                                        })()}
                                    </div>

                                    <div className="space-y-2 md:col-span-2">
                                        <AddressAutocomplete
                                            id="clinic.address"
                                            label={t('address')}
                                            value={data.clinic.address}
                                            onChange={(field, value) => setData('clinic.address', value)}
                                            onAddressChange={(components) => {
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
                                            }}
                                            placeholder={t('enter_address')}
                                            error={errors['clinic.address']}
                                            required
                                            rows={3}
                                            countryRestriction="KW"
                                            governorateName={
                                                data.clinic.governorate_id && governorates
                                                    ? (governorates.find(g => g.id.toString() === data.clinic.governorate_id)
                                                        ? getLocalizedName(
                                                            governorates.find(g => g.id.toString() === data.clinic.governorate_id)!.name_en,
                                                            governorates.find(g => g.id.toString() === data.clinic.governorate_id)!.name_ar,
                                                            locale
                                                        )
                                                        : undefined)
                                                    : undefined
                                            }
                                            areaName={
                                                data.clinic.area_id && areas
                                                    ? (areas.find(a => a.id.toString() === data.clinic.area_id)
                                                        ? getLocalizedName(
                                                            areas.find(a => a.id.toString() === data.clinic.area_id)!.name_en,
                                                            areas.find(a => a.id.toString() === data.clinic.area_id)!.name_ar,
                                                            locale
                                                        )
                                                        : undefined)
                                                    : undefined
                                            }
                                            requireGovernorateAndArea={true}
                                        />
                                    </div>

                                    <div className={cn("space-y-2", isRTL ? '!text-right' : '!text-left')} dir={dir}>
                                        <Label htmlFor="clinic.block" className={cn(isRTL ? '!text-right' : '!text-left')} dir={dir}>
                                            {t('block')}
                                        </Label>
                                        <Input
                                            id="clinic.block"
                                            type="text"
                                            value={data.clinic.block}
                                            onChange={(e) => setData('clinic.block', e.target.value)}
                                            placeholder={t('enter_block')}
                                            className={cn(errors['clinic.block'] ? 'border-red-500' : '', getInputTextAlign())}
                                            disabled={!data.clinic.governorate_id || !data.clinic.area_id}
                                            dir={dir}
                                        />
                                        <InputError message={errors['clinic.block']} />
                                    </div>

                                    <div className={cn("space-y-2", isRTL ? '!text-right' : '!text-left')} dir={dir}>
                                        <Label htmlFor="clinic.street" className={cn(isRTL ? '!text-right' : '!text-left')} dir={dir}>
                                            {t('street')}
                                        </Label>
                                        <Input
                                            id="clinic.street"
                                            type="text"
                                            value={data.clinic.street}
                                            onChange={(e) => setData('clinic.street', e.target.value)}
                                            placeholder={t('enter_street')}
                                            className={cn(errors['clinic.street'] ? 'border-red-500' : '', getInputTextAlign())}
                                            disabled={!data.clinic.governorate_id || !data.clinic.area_id}
                                            dir={dir}
                                        />
                                        <InputError message={errors['clinic.street']} />
                                    </div>

                                    <div className={cn("space-y-2", isRTL ? '!text-right' : '!text-left')} dir={dir}>
                                        <Label htmlFor="clinic.avenue" className={cn(isRTL ? '!text-right' : '!text-left')} dir={dir}>
                                            {t('avenue')}
                                        </Label>
                                        <Input
                                            id="clinic.avenue"
                                            type="text"
                                            value={data.clinic.avenue}
                                            onChange={(e) => setData('clinic.avenue', e.target.value)}
                                            placeholder={t('enter_avenue')}
                                            className={cn(errors['clinic.avenue'] ? 'border-red-500' : '', getInputTextAlign())}
                                            disabled={!data.clinic.governorate_id || !data.clinic.area_id}
                                            dir={dir}
                                        />
                                        <InputError message={errors['clinic.avenue']} />
                                    </div>

                                    <div className={cn("space-y-2", isRTL ? '!text-right' : '!text-left')} dir={dir}>
                                        <Label htmlFor="clinic.house" className={cn(isRTL ? '!text-right' : '!text-left')} dir={dir}>
                                            {t('house')}
                                        </Label>
                                        <Input
                                            id="clinic.house"
                                            type="text"
                                            value={data.clinic.house}
                                            onChange={(e) => setData('clinic.house', e.target.value)}
                                            placeholder={t('enter_house')}
                                            className={cn(errors['clinic.house'] ? 'border-red-500' : '', getInputTextAlign())}
                                            disabled={!data.clinic.governorate_id || !data.clinic.area_id}
                                            dir={dir}
                                        />
                                        <InputError message={errors['clinic.house']} />
                                    </div>

                                    <div className={cn("space-y-2", isRTL ? '!text-right' : '!text-left')} dir={dir}>
                                        <Label htmlFor="clinic.floor" className={cn(isRTL ? '!text-right' : '!text-left')} dir={dir}>
                                            {t('floor')}
                                        </Label>
                                        <Input
                                            id="clinic.floor"
                                            type="text"
                                            value={data.clinic.floor}
                                            onChange={(e) => setData('clinic.floor', e.target.value)}
                                            placeholder={t('enter_floor')}
                                            className={cn(errors['clinic.floor'] ? 'border-red-500' : '', getInputTextAlign())}
                                            disabled={!data.clinic.governorate_id || !data.clinic.area_id}
                                            dir={dir}
                                        />
                                        <InputError message={errors['clinic.floor']} />
                                    </div>

                                    <div className={cn("space-y-2", isRTL ? '!text-right' : '!text-left')} dir={dir}>
                                        <Label htmlFor="clinic.apt" className={cn(isRTL ? '!text-right' : '!text-left')} dir={dir}>
                                            {t('apt')}
                                        </Label>
                                        <Input
                                            id="clinic.apt"
                                            type="text"
                                            value={data.clinic.apt}
                                            onChange={(e) => setData('clinic.apt', e.target.value)}
                                            placeholder={t('enter_apt')}
                                            className={cn(errors['clinic.apt'] ? 'border-red-500' : '', getInputTextAlign())}
                                            disabled={!data.clinic.governorate_id || !data.clinic.area_id}
                                            dir={dir}
                                        />
                                        <InputError message={errors['clinic.apt']} />
                                    </div>

                                    <div className={cn("space-y-2", isRTL ? '!text-right' : '!text-left')} dir={dir}>
                                        <Label htmlFor="clinic.city" className={cn(isRTL ? '!text-right' : '!text-left')} dir={dir}>
                                            {t('city')}
                                        </Label>
                                        <Input
                                            id="clinic.city"
                                            type="text"
                                            value={data.clinic.city}
                                            onChange={(e) => setData('clinic.city', e.target.value)}
                                            placeholder={t('enter_city')}
                                            className={cn(errors['clinic.city'] ? 'border-red-500' : '', getInputTextAlign())}
                                            disabled={!data.clinic.governorate_id || !data.clinic.area_id}
                                            dir={dir}
                                        />
                                        <InputError message={errors['clinic.city']} />
                                    </div>

                                    <div className={cn("space-y-2", isRTL ? '!text-right' : '!text-left')} dir={dir}>
                                        <Label htmlFor="clinic.country" className={cn(isRTL ? '!text-right' : '!text-left')} dir={dir}>
                                            {t('country')}
                                        </Label>
                                        <Input
                                            id="clinic.country"
                                            type="text"
                                            value={data.clinic.country}
                                            onChange={(e) => setData('clinic.country', e.target.value)}
                                            placeholder={t('enter_country')}
                                            className={cn(errors['clinic.country'] ? 'border-red-500' : '', getInputTextAlign())}
                                            dir={dir}
                                        />
                                        <InputError message={errors['clinic.country']} />
                                    </div>

                                    <div className={cn("space-y-2", isRTL ? '!text-right' : '!text-left')} dir={dir}>
                                        <Label htmlFor="clinic.postal_code" className={cn(isRTL ? '!text-right' : '!text-left')} dir={dir}>
                                            {t('postal_code')}
                                        </Label>
                                        <Input
                                            id="clinic.postal_code"
                                            type="text"
                                            value={data.clinic.postal_code}
                                            onChange={(e) => setData('clinic.postal_code', e.target.value)}
                                            placeholder={t('enter_postal_code')}
                                            className={cn(errors['clinic.postal_code'] ? 'border-red-500' : '', getInputTextAlign())}
                                            disabled={!data.clinic.governorate_id || !data.clinic.area_id}
                                            dir="ltr"
                                        />
                                        <InputError message={errors['clinic.postal_code']} />
                                    </div>

                                    <div className={cn("space-y-2", isRTL ? '!text-right' : '!text-left')} dir={dir}>
                                        <Label htmlFor="clinic.latitude" className={cn(isRTL ? '!text-right' : '!text-left')} dir={dir}>
                                            {t('latitude')}
                                        </Label>
                                        <Input
                                            id="clinic.latitude"
                                            type="text"
                                            value={data.clinic.latitude}
                                            onChange={(e) => setData('clinic.latitude', e.target.value)}
                                            placeholder={t('enter_latitude')}
                                            className={cn(errors['clinic.latitude'] ? 'border-red-500' : '', getInputTextAlign())}
                                            disabled={!data.clinic.governorate_id || !data.clinic.area_id}
                                            dir="ltr"
                                        />
                                        <InputError message={errors['clinic.latitude']} />
                                    </div>

                                    <div className={cn("space-y-2", isRTL ? '!text-right' : '!text-left')} dir={dir}>
                                        <Label htmlFor="clinic.longitude" className={cn(isRTL ? '!text-right' : '!text-left')} dir={dir}>
                                            {t('longitude')}
                                        </Label>
                                        <Input
                                            id="clinic.longitude"
                                            type="text"
                                            value={data.clinic.longitude}
                                            onChange={(e) => setData('clinic.longitude', e.target.value)}
                                            placeholder={t('enter_longitude')}
                                            className={cn(errors['clinic.longitude'] ? 'border-red-500' : '', getInputTextAlign())}
                                            disabled={!data.clinic.governorate_id || !data.clinic.area_id}
                                            dir="ltr"
                                        />
                                        <InputError message={errors['clinic.longitude']} />
                                    </div>
                                </div>
                            </div>
                        </TabsContent>

                        {/* Tab 4: Settings & Policies */}
                        <TabsContent value="4" className={cn("mt-6", isRTL ? '!text-right' : '!text-left')} dir={dir}>
                            <div className={cn("space-y-6 p-6 bg-card rounded-lg border", isRTL ? '!text-right' : '!text-left')} dir={dir}>
                                <div className={cn("flex items-center gap-3 mb-6", flexDirection)}>
                                    <Settings className="h-6 w-6 text-primary" />
                                    <h2 className={cn("text-2xl font-semibold text-foreground", isRTL ? '!text-right' : '!text-left')}>
                                        {t('settings_policies')}
                                    </h2>
                                </div>
                                
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className={cn("flex items-center justify-between p-4 border rounded-lg", flexDirection)} dir={dir}>
                                        <div className={cn("space-y-0.5", isRTL ? '!text-right' : '!text-left')} dir={dir}>
                                            <Label htmlFor="clinic.auto_confirm_bookings" className={cn(isRTL ? '!text-right' : '!text-left')} dir={dir}>{t('auto_confirm_bookings')}</Label>
                                            <p className={cn("text-sm text-muted-foreground", isRTL ? '!text-right' : '!text-left')} dir={dir}>{t('auto_confirm_bookings_description')}</p>
                                        </div>
                                        <Switch
                                            id="clinic.auto_confirm_bookings"
                                            checked={data.clinic.auto_confirm_bookings}
                                            onCheckedChange={(checked) => setData('clinic.auto_confirm_bookings', checked)}
                                        />
                                    </div>

                                    <div className={cn("space-y-2 md:col-span-2", isRTL ? '!text-right' : '!text-left')} dir={dir}>
                                        <Label htmlFor="clinic.cancellation_policy_en" className={cn(isRTL ? '!text-right' : '!text-left')} dir={dir}>
                                            {t('cancellation_policy_en')} <span className="text-red-500">*</span>
                                        </Label>
                                        <Textarea
                                            id="clinic.cancellation_policy_en"
                                            value={data.clinic.cancellation_policy_en}
                                            onChange={(e) => setData('clinic.cancellation_policy_en', e.target.value)}
                                            placeholder={t('enter_cancellation_policy_en')}
                                            rows={4}
                                            className={cn(errors['clinic.cancellation_policy_en'] ? 'border-red-500' : '', getInputTextAlign())}
                                            dir="ltr"
                                        />
                                        <InputError message={errors['clinic.cancellation_policy_en']} />
                                    </div>

                                    <div className={cn("space-y-2 md:col-span-2", isRTL ? '!text-right' : '!text-left')} dir={dir}>
                                        <Label htmlFor="clinic.cancellation_policy_ar" className={cn(isRTL ? '!text-right' : '!text-left')} dir={dir}>
                                            {t('cancellation_policy_ar')} <span className="text-red-500">*</span>
                                        </Label>
                                        <Textarea
                                            id="clinic.cancellation_policy_ar"
                                            value={data.clinic.cancellation_policy_ar}
                                            onChange={(e) => setData('clinic.cancellation_policy_ar', e.target.value)}
                                            placeholder={t('enter_cancellation_policy_ar')}
                                            rows={4}
                                            className={cn(errors['clinic.cancellation_policy_ar'] ? 'border-red-500' : '', getInputTextAlign())}
                                            dir="rtl"
                                        />
                                        <InputError message={errors['clinic.cancellation_policy_ar']} />
                                    </div>

                                    <div className={cn("space-y-2 md:col-span-2", isRTL ? '!text-right' : '!text-left')} dir={dir}>
                                        <Label htmlFor="clinic.refund_policy_en" className={cn(isRTL ? '!text-right' : '!text-left')} dir={dir}>
                                            {t('refund_policy_en')} <span className="text-red-500">*</span>
                                        </Label>
                                        <Textarea
                                            id="clinic.refund_policy_en"
                                            value={data.clinic.refund_policy_en}
                                            onChange={(e) => setData('clinic.refund_policy_en', e.target.value)}
                                            placeholder={t('enter_refund_policy_en')}
                                            rows={4}
                                            className={cn(errors['clinic.refund_policy_en'] ? 'border-red-500' : '', getInputTextAlign())}
                                            dir="ltr"
                                        />
                                        <InputError message={errors['clinic.refund_policy_en']} />
                                    </div>

                                    <div className={cn("space-y-2 md:col-span-2", isRTL ? '!text-right' : '!text-left')} dir={dir}>
                                        <Label htmlFor="clinic.refund_policy_ar" className={cn(isRTL ? '!text-right' : '!text-left')} dir={dir}>
                                            {t('refund_policy_ar')} <span className="text-red-500">*</span>
                                        </Label>
                                        <Textarea
                                            id="clinic.refund_policy_ar"
                                            value={data.clinic.refund_policy_ar}
                                            onChange={(e) => setData('clinic.refund_policy_ar', e.target.value)}
                                            placeholder={t('enter_refund_policy_ar')}
                                            rows={4}
                                            className={cn(errors['clinic.refund_policy_ar'] ? 'border-red-500' : '', getInputTextAlign())}
                                            dir="rtl"
                                        />
                                        <InputError message={errors['clinic.refund_policy_ar']} />
                                    </div>

                                    <div className={cn("space-y-2 md:col-span-2", isRTL ? '!text-right' : '!text-left')} dir={dir}>
                                        <Label htmlFor="clinic.privacy_policy_en" className={cn(isRTL ? '!text-right' : '!text-left')} dir={dir}>
                                            {t('privacy_policy_en')}
                                        </Label>
                                        <Textarea
                                            id="clinic.privacy_policy_en"
                                            value={data.clinic.privacy_policy_en}
                                            onChange={(e) => setData('clinic.privacy_policy_en', e.target.value)}
                                            placeholder={t('enter_privacy_policy_en')}
                                            rows={4}
                                            className={cn(errors['clinic.privacy_policy_en'] ? 'border-red-500' : '', getInputTextAlign())}
                                            dir="ltr"
                                        />
                                        <InputError message={errors['clinic.privacy_policy_en']} />
                                    </div>

                                    <div className={cn("space-y-2 md:col-span-2", isRTL ? '!text-right' : '!text-left')} dir={dir}>
                                        <Label htmlFor="clinic.privacy_policy_ar" className={cn(isRTL ? '!text-right' : '!text-left')} dir={dir}>
                                            {t('privacy_policy_ar')}
                                        </Label>
                                        <Textarea
                                            id="clinic.privacy_policy_ar"
                                            value={data.clinic.privacy_policy_ar}
                                            onChange={(e) => setData('clinic.privacy_policy_ar', e.target.value)}
                                            placeholder={t('enter_privacy_policy_ar')}
                                            rows={4}
                                            className={cn(errors['clinic.privacy_policy_ar'] ? 'border-red-500' : '', getInputTextAlign())}
                                            dir="rtl"
                                        />
                                        <InputError message={errors['clinic.privacy_policy_ar']} />
                                    </div>

                                    <div className={cn("space-y-2 md:col-span-2", isRTL ? '!text-right' : '!text-left')} dir={dir}>
                                        <Label htmlFor="clinic.terms_and_conditions_en" className={cn(isRTL ? '!text-right' : '!text-left')} dir={dir}>
                                            {t('terms_and_conditions_en')}
                                        </Label>
                                        <Textarea
                                            id="clinic.terms_and_conditions_en"
                                            value={data.clinic.terms_and_conditions_en}
                                            onChange={(e) => setData('clinic.terms_and_conditions_en', e.target.value)}
                                            placeholder={t('enter_terms_and_conditions_en')}
                                            rows={4}
                                            className={cn(errors['clinic.terms_and_conditions_en'] ? 'border-red-500' : '', getInputTextAlign())}
                                            dir="ltr"
                                        />
                                        <InputError message={errors['clinic.terms_and_conditions_en']} />
                                    </div>

                                    <div className={cn("space-y-2 md:col-span-2", isRTL ? '!text-right' : '!text-left')} dir={dir}>
                                        <Label htmlFor="clinic.terms_and_conditions_ar" className={cn(isRTL ? '!text-right' : '!text-left')} dir={dir}>
                                            {t('terms_and_conditions_ar')}
                                        </Label>
                                        <Textarea
                                            id="clinic.terms_and_conditions_ar"
                                            value={data.clinic.terms_and_conditions_ar}
                                            onChange={(e) => setData('clinic.terms_and_conditions_ar', e.target.value)}
                                            placeholder={t('enter_terms_and_conditions_ar')}
                                            rows={4}
                                            className={cn(errors['clinic.terms_and_conditions_ar'] ? 'border-red-500' : '', getInputTextAlign())}
                                            dir="rtl"
                                        />
                                        <InputError message={errors['clinic.terms_and_conditions_ar']} />
                                    </div>

                                    <div className={cn("space-y-2 md:col-span-2", isRTL ? '!text-right' : '!text-left')} dir={dir}>
                                        <Label htmlFor="clinic.reschedule_policy_en" className={cn(isRTL ? '!text-right' : '!text-left')} dir={dir}>
                                            {t('reschedule_policy_en')} <span className="text-red-500">*</span>
                                        </Label>
                                        <Textarea
                                            id="clinic.reschedule_policy_en"
                                            value={data.clinic.reschedule_policy_en}
                                            onChange={(e) => setData('clinic.reschedule_policy_en', e.target.value)}
                                            placeholder={t('enter_reschedule_policy_en')}
                                            rows={4}
                                            className={cn(errors['clinic.reschedule_policy_en'] ? 'border-red-500' : '', getInputTextAlign())}
                                            dir="ltr"
                                        />
                                        <InputError message={errors['clinic.reschedule_policy_en']} />
                                    </div>

                                    <div className={cn("space-y-2 md:col-span-2", isRTL ? '!text-right' : '!text-left')} dir={dir}>
                                        <Label htmlFor="clinic.reschedule_policy_ar" className={cn(isRTL ? '!text-right' : '!text-left')} dir={dir}>
                                            {t('reschedule_policy_ar')} <span className="text-red-500">*</span>
                                        </Label>
                                        <Textarea
                                            id="clinic.reschedule_policy_ar"
                                            value={data.clinic.reschedule_policy_ar}
                                            onChange={(e) => setData('clinic.reschedule_policy_ar', e.target.value)}
                                            placeholder={t('enter_reschedule_policy_ar')}
                                            rows={4}
                                            className={cn(errors['clinic.reschedule_policy_ar'] ? 'border-red-500' : '', getInputTextAlign())}
                                            dir="rtl"
                                        />
                                        <InputError message={errors['clinic.reschedule_policy_ar']} />
                                    </div>

                                    {/* Rescheduling Buffer Time */}
                                    <div className={cn("space-y-2", isRTL ? '!text-right' : '!text-left')} dir={dir}>
                                        <Label htmlFor="clinic.rescheduling_buffer_hours" className={cn(isRTL ? '!text-right' : '!text-left')} dir={dir}>
                                            {t('rescheduling_buffer_hours')}
                                        </Label>
                                        <Input
                                            id="clinic.rescheduling_buffer_hours"
                                            type="number"
                                            min="0"
                                            value={data.clinic.rescheduling_buffer_hours ?? siteSettings.rescheduling_buffer_hours}
                                            onChange={(e) => setData('clinic.rescheduling_buffer_hours', e.target.value ? parseInt(e.target.value) : null)}
                                            placeholder={t('enter_rescheduling_buffer_hours')}
                                            className={cn(errors['clinic.rescheduling_buffer_hours'] ? 'border-red-500' : '', getInputTextAlign())}
                                            dir="ltr"
                                        />
                                        <p className={cn("text-sm text-muted-foreground", isRTL ? '!text-right' : '!text-left')} dir={dir}>
                                            {t('rescheduling_buffer_hours_description')} ({t('default')}: {siteSettings.rescheduling_buffer_hours} {t('hours')})
                                        </p>
                                        <InputError message={errors['clinic.rescheduling_buffer_hours']} />
                                    </div>

                                    {/* Cancellation Buffer Time */}
                                    <div className={cn("space-y-2", isRTL ? '!text-right' : '!text-left')} dir={dir}>
                                        <Label htmlFor="clinic.cancellation_buffer_hours" className={cn(isRTL ? '!text-right' : '!text-left')} dir={dir}>
                                            {t('cancellation_buffer_hours')}
                                        </Label>
                                        <Input
                                            id="clinic.cancellation_buffer_hours"
                                            type="number"
                                            min="0"
                                            value={data.clinic.cancellation_buffer_hours ?? siteSettings.cancellation_buffer_hours}
                                            onChange={(e) => setData('clinic.cancellation_buffer_hours', e.target.value ? parseInt(e.target.value) : null)}
                                            placeholder={t('enter_cancellation_buffer_hours')}
                                            className={cn(errors['clinic.cancellation_buffer_hours'] ? 'border-red-500' : '', getInputTextAlign())}
                                            dir="ltr"
                                        />
                                        <p className={cn("text-sm text-muted-foreground", isRTL ? '!text-right' : '!text-left')} dir={dir}>
                                            {t('cancellation_buffer_hours_description')} ({t('default')}: {siteSettings.cancellation_buffer_hours} {t('hours')})
                                        </p>
                                        <InputError message={errors['clinic.cancellation_buffer_hours']} />
                                    </div>

                                    {/* Refund Policy Type */}
                                    <div className={cn("space-y-2", isRTL ? '!text-right' : '!text-left')} dir={dir}>
                                        <Label htmlFor="clinic.refund_policy_type" className={cn(isRTL ? '!text-right' : '!text-left')} dir={dir}>
                                            {t('refund_policy_type')}
                                        </Label>
                                        <Select
                                            value={data.clinic.refund_policy_type || siteSettings.clinic_refund_policy_type}
                                            onValueChange={(value) => setData('clinic.refund_policy_type', value)}
                                        >
                                            <SelectTrigger className={cn(errors['clinic.refund_policy_type'] ? 'border-red-500' : '', getInputTextAlign())} dir={dir}>
                                                <SelectValue placeholder={t('select_refund_policy_type')} />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="full">{t('full_refund')}</SelectItem>
                                                <SelectItem value="partial">{t('partial_refund')}</SelectItem>
                                                <SelectItem value="fixed">{t('fixed_refund')}</SelectItem>
                                            </SelectContent>
                                        </Select>
                                        <p className={cn("text-sm text-muted-foreground", isRTL ? '!text-right' : '!text-left')} dir={dir}>
                                            {t('refund_policy_type_description')} ({t('default')}: {t(siteSettings.clinic_refund_policy_type === 'full' ? 'full_refund' : siteSettings.clinic_refund_policy_type === 'fixed' ? 'fixed_refund' : 'partial_refund')})
                                        </p>
                                        <InputError message={errors['clinic.refund_policy_type']} />
                                    </div>

                                    {/* Refund Policy Value (percentage for partial, fixed amount for fixed, hidden for full) */}
                                    {(data.clinic.refund_policy_type === 'partial' || data.clinic.refund_policy_type === 'fixed' || (!data.clinic.refund_policy_type && (siteSettings.clinic_refund_policy_type === 'partial' || siteSettings.clinic_refund_policy_type === 'fixed'))) && (
                                        <div className={cn("space-y-2", isRTL ? '!text-right' : '!text-left')} dir={dir}>
                                            <Label htmlFor="clinic.refund_policy_percentage" className={cn(isRTL ? '!text-right' : '!text-left')} dir={dir}>
                                                {data.clinic.refund_policy_type === 'fixed' || (!data.clinic.refund_policy_type && siteSettings.clinic_refund_policy_type === 'fixed') 
                                                    ? t('refund_policy_fixed_amount') 
                                                    : t('refund_policy_percentage')}
                                            </Label>
                                            <Input
                                                id="clinic.refund_policy_percentage"
                                                type="number"
                                                min="0"
                                                max={data.clinic.refund_policy_type === 'fixed' || (!data.clinic.refund_policy_type && siteSettings.clinic_refund_policy_type === 'fixed') ? undefined : "100"}
                                                step={data.clinic.refund_policy_type === 'fixed' || (!data.clinic.refund_policy_type && siteSettings.clinic_refund_policy_type === 'fixed') ? "0.01" : "0.01"}
                                                value={data.clinic.refund_policy_percentage ?? siteSettings.clinic_refund_policy_value ?? siteSettings.clinic_refund_policy_percentage}
                                                onChange={(e) => setData('clinic.refund_policy_percentage', e.target.value ? parseFloat(e.target.value) : null)}
                                                placeholder={data.clinic.refund_policy_type === 'fixed' || (!data.clinic.refund_policy_type && siteSettings.clinic_refund_policy_type === 'fixed') 
                                                    ? t('enter_refund_policy_fixed_amount') 
                                                    : t('enter_refund_policy_percentage')}
                                                className={cn(errors['clinic.refund_policy_percentage'] ? 'border-red-500' : '', getInputTextAlign())}
                                                dir="ltr"
                                            />
                                            <p className={cn("text-sm text-muted-foreground", isRTL ? '!text-right' : '!text-left')} dir={dir}>
                                                {data.clinic.refund_policy_type === 'fixed' || (!data.clinic.refund_policy_type && siteSettings.clinic_refund_policy_type === 'fixed')
                                                    ? t('refund_policy_fixed_amount_description') + ` (${t('default')}: ${siteSettings.clinic_refund_policy_value ?? siteSettings.clinic_refund_policy_percentage} ${t('currency_unit') || 'KWD'})`
                                                    : t('refund_policy_percentage_description') + ` (${t('default')}: ${siteSettings.clinic_refund_policy_value ?? siteSettings.clinic_refund_policy_percentage}%)`}
                                            </p>
                                            <InputError message={errors['clinic.refund_policy_percentage']} />
                                        </div>
                                    )}
                                </div>
                            </div>
                        </TabsContent>

                        {/* Tab 5: Operating Hours */}
                        <TabsContent value="5" className={cn("mt-6", isRTL ? '!text-right' : '!text-left')} dir={dir}>
                            <div className={cn("space-y-6 p-6 bg-card rounded-lg border", isRTL ? '!text-right' : '!text-left')} dir={dir}>
                                <div className={cn("flex items-center gap-3 mb-6", flexDirection)}>
                                    <Clock className="h-6 w-6 text-primary" />
                                    <h2 className={cn("text-2xl font-semibold text-foreground", isRTL ? '!text-right' : '!text-left')}>
                                        {t('operating_hours')}
                                    </h2>
                                </div>
                                
                                <div className="space-y-4">
                                    {DAYS_OF_WEEK.map((day) => {
                                        const operatingHour = data.clinic.operating_hours.find(oh => oh.day_of_week === day.value);
                                        if (!operatingHour) return null;
                                        
                                        return (
                                            <div key={day.value} className={cn("p-4 border rounded-lg space-y-4", isRTL ? '!text-right' : '!text-left')} dir={dir}>
                                                <div className={cn("flex items-center justify-between", flexDirection)}>
                                                    <Label className={cn("text-base font-medium", isRTL ? '!text-right' : '!text-left')} dir={dir}>{t(day.labelKey)}</Label>
                                                    <div className={cn("flex items-center gap-4", flexDirection)}>
                                                        <div className={cn("flex items-center gap-2", flexDirection)}>
                                                            <Switch
                                                                checked={operatingHour.is_open && !operatingHour.closed_all_day}
                                                                onCheckedChange={(checked) => {
                                                                    const updatedHours = data.clinic.operating_hours.map(oh =>
                                                                        oh.day_of_week === day.value
                                                                            ? { ...oh, is_open: checked, closed_all_day: !checked }
                                                                            : oh
                                                                    );
                                                                    setData('clinic.operating_hours', updatedHours);
                                                                }}
                                                            />
                                                            <span className={cn("text-sm", isRTL ? '!text-right' : '!text-left')} dir={dir}>{operatingHour.is_open && !operatingHour.closed_all_day ? t('open') : t('closed')}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                                
                                                {operatingHour.is_open && !operatingHour.closed_all_day && (
                                                    <div className="space-y-4">
                                                    <div className="grid grid-cols-2 gap-4">
                                                        <div className={cn("space-y-2", isRTL ? '!text-right' : '!text-left')} dir={dir}>
                                                            <Label className={cn(isRTL ? '!text-right' : '!text-left')} dir={dir}>{t('opening_time')}</Label>
                                                            <Input
                                                                type="time"
                                                                value={operatingHour.opening_time || '09:00'}
                                                                onChange={(e) => {
                                                                    const updatedHours = data.clinic.operating_hours.map(oh =>
                                                                        oh.day_of_week === day.value
                                                                            ? { ...oh, opening_time: e.target.value }
                                                                            : oh
                                                                    );
                                                                    setData('clinic.operating_hours', updatedHours);
                                                                        // Validate after update
                                                                        setTimeout(() => {
                                                                            validateOperatingHours(updatedHours);
                                                                        }, 0);
                                                                }}
                                                                onClick={(e) => {
                                                                    // Make entire input clickable to open time picker
                                                                    const input = e.currentTarget;
                                                                    if (input && 'showPicker' in input && typeof (input as any).showPicker === 'function') {
                                                                        (input as any).showPicker();
                                                                    } else {
                                                                        input.focus();
                                                                        input.click();
                                                                    }
                                                                }}
                                                                className={cn(operatingHoursErrors[`operating_hours.${data.clinic.operating_hours.findIndex(oh => oh.day_of_week === day.value)}`] ? 'border-red-500' : '', getInputTextAlign(), 'cursor-pointer')}
                                                                dir="ltr"
                                                                style={{ cursor: 'pointer' }}
                                                            />
                                                        </div>
                                                        <div className={cn("space-y-2", isRTL ? '!text-right' : '!text-left')} dir={dir}>
                                                            <Label className={cn(isRTL ? '!text-right' : '!text-left')} dir={dir}>{t('closing_time')}</Label>
                                                            <Input
                                                                type="time"
                                                                value={operatingHour.closing_time || '17:00'}
                                                                onChange={(e) => {
                                                                    const updatedHours = data.clinic.operating_hours.map((oh: any) =>
                                                                        oh.day_of_week === day.value
                                                                            ? { ...oh, closing_time: e.target.value }
                                                                            : oh
                                                                    );
                                                                    setData('clinic.operating_hours', updatedHours);
                                                                        // Validate after update
                                                                        setTimeout(() => {
                                                                            validateOperatingHours(updatedHours);
                                                                        }, 0);
                                                                }}
                                                                onClick={(e) => {
                                                                    // Make entire input clickable to open time picker
                                                                    const input = e.currentTarget;
                                                                    if (input && 'showPicker' in input && typeof (input as any).showPicker === 'function') {
                                                                        (input as any).showPicker();
                                                                    } else {
                                                                        input.focus();
                                                                        input.click();
                                                                    }
                                                                }}
                                                                className={cn(operatingHoursErrors[`operating_hours.${data.clinic.operating_hours.findIndex(oh => oh.day_of_week === day.value)}`] ? 'border-red-500' : '', getInputTextAlign(), 'cursor-pointer')}
                                                                dir="ltr"
                                                                style={{ cursor: 'pointer' }}
                                                            />
                                                        </div>
                                                        </div>
                                                        {(() => {
                                                            const hourIndex = data.clinic.operating_hours.findIndex(oh => oh.day_of_week === day.value);
                                                            return operatingHoursErrors[`operating_hours.${hourIndex}`] && (
                                                                <InputError message={operatingHoursErrors[`operating_hours.${hourIndex}`]} />
                                                            );
                                                        })()}
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        </TabsContent>

                        {/* Tab 6: Documents */}
                        <TabsContent value="6" className={cn("mt-6", isRTL ? '!text-right' : '!text-left')} dir={dir}>
                            <div className={cn("space-y-6 p-6 bg-card rounded-lg border", isRTL ? '!text-right' : '!text-left')} dir={dir}>
                                <div className={cn("flex items-center gap-3 mb-6", flexDirection)}>
                                    <Upload className="h-6 w-6 text-primary" />
                                    <h2 className={cn("text-2xl font-semibold text-foreground", isRTL ? '!text-right' : '!text-left')}>
                                        {t('documents')}
                                    </h2>
                                </div>
                                
                                <div className="space-y-6">
                                    {/* Business License */}
                                    <div className={cn("space-y-4", isRTL ? '!text-right' : '!text-left')} dir={dir}>
                                        <Label htmlFor="business_license" className={cn(isRTL ? '!text-right' : '!text-left')} dir={dir}>
                                            {t('business_license')}
                                        </Label>
                                        
                                        {/* Preview: Existing document or newly uploaded file */}
                                        {(documents.find(d => d.collection_name === 'business_license') || filesRef.current.business_license) && (
                                            <DocumentPreview
                                                file={filesRef.current.business_license || documents.find(d => d.collection_name === 'business_license') || null}
                                                collectionName="business_license"
                                                showRemove={!!filesRef.current.business_license}
                                                onRemove={() => {
                                                    handleFileChange('business_license', null);
                                                    const input = document.getElementById('business_license') as HTMLInputElement;
                                                    if (input) input.value = '';
                                                }}
                                                className="max-w-md"
                                            />
                                            )}
                                        
                                        {/* File Input */}
                                            <div className="relative">
                                                <Input
                                                    id="business_license"
                                                    type="file"
                                                    accept=".pdf,.jpg,.jpeg,.png"
                                                    onChange={(e) => {
                                                        const file = e.target.files?.[0] || null;
                                                        handleFileChange('business_license', file);
                                                    }}
                                                    className={`hidden ${(errors as any)['business_license'] ? 'border-red-500' : ''}`}
                                                />
                                                <Label
                                                    htmlFor="business_license"
                                                    className={`flex items-center gap-2 cursor-pointer px-4 py-2 border rounded-md hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 ${isRTL ? 'flex-row-reverse' : ''}`}
                                                >
                                                    <Upload className="h-4 w-4" />
                                                <span>{filesRef.current.business_license ? t('change_file') : t('choose_file')}</span>
                                                </Label>
                                        </div>
                                        <InputError message={(errors as any)['business_license']} />
                                    </div>

                                    {/* ID Document Front */}
                                    <div className="space-y-4">
                                        <Label htmlFor="id_document_front" className={isRTL ? 'text-right' : ''}>
                                            {t('id_document_front')}
                                        </Label>
                                        
                                        {/* Preview: Existing document or newly uploaded file */}
                                        {(documents.find(d => d.collection_name === 'id_document_front') || filesRef.current.id_document_front) && (
                                            <DocumentPreview
                                                file={filesRef.current.id_document_front || documents.find(d => d.collection_name === 'id_document_front') || null}
                                                collectionName="id_document_front"
                                                showRemove={!!filesRef.current.id_document_front}
                                                onRemove={() => {
                                                    handleFileChange('id_document_front', null);
                                                    const input = document.getElementById('id_document_front') as HTMLInputElement;
                                                    if (input) input.value = '';
                                                }}
                                                className="max-w-md"
                                            />
                                            )}
                                        
                                        {/* File Input */}
                                            <div className="relative">
                                                <Input
                                                    id="id_document_front"
                                                    type="file"
                                                    accept=".pdf,.jpg,.jpeg,.png"
                                                    onChange={(e) => {
                                                        const file = e.target.files?.[0] || null;
                                                        handleFileChange('id_document_front', file);
                                                    }}
                                                    className={`hidden ${(errors as any)['id_document_front'] ? 'border-red-500' : ''}`}
                                                />
                                                <Label
                                                    htmlFor="id_document_front"
                                                    className={`flex items-center gap-2 cursor-pointer px-4 py-2 border rounded-md hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 ${isRTL ? 'flex-row-reverse' : ''}`}
                                                >
                                                    <Upload className="h-4 w-4" />
                                                <span>{filesRef.current.id_document_front ? t('change_file') : t('choose_file')}</span>
                                                </Label>
                                        </div>
                                        <InputError message={(errors as any)['id_document_front']} />
                                    </div>

                                    {/* ID Document Back */}
                                    <div className="space-y-4">
                                        <Label htmlFor="id_document_back" className={isRTL ? 'text-right' : ''}>
                                            {t('id_document_back')}
                                        </Label>
                                        
                                        {/* Preview: Existing document or newly uploaded file */}
                                        {(documents.find(d => d.collection_name === 'id_document_back') || filesRef.current.id_document_back) && (
                                            <DocumentPreview
                                                file={filesRef.current.id_document_back || documents.find(d => d.collection_name === 'id_document_back') || null}
                                                collectionName="id_document_back"
                                                showRemove={!!filesRef.current.id_document_back}
                                                onRemove={() => {
                                                    handleFileChange('id_document_back', null);
                                                    const input = document.getElementById('id_document_back') as HTMLInputElement;
                                                    if (input) input.value = '';
                                                }}
                                                className="max-w-md"
                                            />
                                        )}
                                        
                                        {/* File Input */}
                                            <div className="relative">
                                                <Input
                                                    id="id_document_back"
                                                    type="file"
                                                    accept=".pdf,.jpg,.jpeg,.png"
                                                    onChange={(e) => {
                                                        const file = e.target.files?.[0] || null;
                                                        handleFileChange('id_document_back', file);
                                                    }}
                                                    className={`hidden ${(errors as any)['id_document_back'] ? 'border-red-500' : ''}`}
                                                />
                                                <Label
                                                    htmlFor="id_document_back"
                                                    className={`flex items-center gap-2 cursor-pointer px-4 py-2 border rounded-md hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 ${isRTL ? 'flex-row-reverse' : ''}`}
                                                >
                                                    <Upload className="h-4 w-4" />
                                                <span>{filesRef.current.id_document_back ? t('change_file') : t('choose_file')}</span>
                                                </Label>
                                        </div>
                                        <InputError message={(errors as any)['id_document_back']} />
                                    </div>
                                </div>
                            </div>
                        </TabsContent>

                        {/* Tab 7: Subscription - COMMENTED OUT */}
                        {false && <TabsContent value="7" className="mt-6">
                            <div className="space-y-6 p-6 bg-card rounded-lg border">
                                <div className="flex items-center gap-3 mb-6">
                                    <CreditCard className="h-6 w-6 text-primary" />
                                    <h2 className="text-2xl font-semibold text-foreground">
                                        {t('subscription')}
                                    </h2>
                                </div>
                                
                                <div className={`space-y-2 ${isRTL ? 'text-right' : ''}`}>
                        <Label htmlFor="clinic.subscription_package_id" className={isRTL ? 'text-right' : ''}>
                                        {t('subscription_package')}
                                    </Label>
                                    <Select 
                                        value={data.clinic.subscription_package_id ? String(data.clinic.subscription_package_id) : ''} 
                                        onValueChange={(value) => setData('clinic.subscription_package_id', value)}
                                    >
                                        <SelectTrigger className={errors['clinic.subscription_package_id'] ? 'border-red-500' : ''}>
                                            <SelectValue placeholder={t('select_subscription_package')} />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {subscriptionPackages.map((pkg) => {
                                                const packageName = getLocalizedName(pkg.name_en, pkg.name_ar, locale);
                                                const price = pkg.price || '0';
                                                const currency = pkg.currency || 'KWD';
                                                const billingCycle = pkg.billing_cycle ? (t(pkg.billing_cycle) || pkg.billing_cycle) : '';
                                                const displayText = `${packageName} - ${price} ${currency}${billingCycle ? ` / ${billingCycle}` : ''}`;
                                                
                                                return (
                                                    <SelectItem key={pkg.id} value={String(pkg.id)}>
                                                        {displayText}
                                                    </SelectItem>
                                                );
                                            })}
                                        </SelectContent>
                                    </Select>
                                    <InputError message={errors['clinic.subscription_package_id']} />
                                    {(() => {
                                        if (data.clinic.subscription_package_id) {
                                        const selectedIdStr = String(data.clinic.subscription_package_id);
                                        const selectedPackage = subscriptionPackages.find(p => String(p.id) === selectedIdStr);
                                            if (selectedPackage) {
                                                return (
                                            <div className="p-4 bg-muted/50 rounded-lg border mt-4">
                                                <div className={`space-y-2 ${isRTL ? 'text-right' : ''}`}>
                                                    <p className="text-sm font-medium text-muted-foreground">{t('selected_package')}</p>
                                                    <p className="text-lg font-semibold text-foreground">
                                                        {getLocalizedName(selectedPackage.name_en, selectedPackage.name_ar, locale)}
                                                    </p>
                                                    {selectedPackage.description_en && (
                                                        <p className="text-sm text-foreground">
                                                            {isRTL && selectedPackage.description_ar 
                                                                ? selectedPackage.description_ar 
                                                                : selectedPackage.description_en}
                                                        </p>
                                                    )}
                                                    <p className="text-sm text-muted-foreground">
                                                        {t('price')}: {selectedPackage.price || '0'} {selectedPackage.currency || 'KWD'} / {selectedPackage.billing_cycle ? t(selectedPackage.billing_cycle) : ''}
                                                    </p>
                                                </div>
                                            </div>
                                                );
                                            }
                                        }
                                        // Show "Free Plan" when no subscription is selected
                                        return (
                                            <div className="p-4 bg-muted/50 rounded-lg border mt-4">
                                                <div className={`space-y-2 ${isRTL ? 'text-right' : ''}`}>
                                                    <p className="text-sm font-medium text-muted-foreground">{t('selected_package')}</p>
                                                    <p className="text-lg font-semibold text-foreground">
                                                        {t('free_plan')}
                                                    </p>
                                                </div>
                                            </div>
                                        );
                                    })()}
                                </div>
                            </div>
                        </TabsContent>}
                        </Tabs>
                    )}

                    {/* Save Button */}
                    {isMounted && (
                        <div className={`flex items-center justify-end pt-6 border-t mt-8 ${isRTL ? 'flex-row-reverse' : ''}`}>
                            <Button
                                type="submit"
                                disabled={processing}
                                className="min-w-[150px]"
                            >
                                {processing ? (
                                    <>
                                        <LoaderCircle className={`h-4 w-4 ${isRTL ? 'ml-2' : 'mr-2'} animate-spin`} />
                                        {t('saving')}
                                    </>
                                ) : (
                                    <>
                                        <Save className={`h-4 w-4 ${isRTL ? 'ml-2' : 'mr-2'}`} />
                                        {t('save_changes')}
                                    </>
                                )}
                            </Button>
                        </div>
                    )}
                </form>
            </div>
        </AppLayout>
    );
}
