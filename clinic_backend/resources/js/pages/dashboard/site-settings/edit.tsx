import { Head, Link, usePage, router } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CKEditorComponent } from '@/components/ui/ckeditor';
import { PhoneInput } from '@/components/phone-input';
import { useRTLInit } from '@/hooks/use-rtl-init';
import { useTranslation } from '@/hooks/use-translation';
import { useRTL } from '@/hooks/use-rtl';
import AppLayout from '@/layouts/app-layout';
import { Save, ArrowLeft, CheckCircle, Upload, X } from 'lucide-react';
import { useState, useEffect } from 'react';
import dashboard from '@/routes/dashboard';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface SiteSetting {
    id: number;
    key: string;
    value: string;
    type: string;
    description: string;
}

interface Props {
    settings: SiteSetting[];
    categories: { [key: string]: string };
    currentCategory: string;
    categoryLabel: string;
}

export default function Edit({ settings = [], categories = {}, currentCategory, categoryLabel }: Props) {
    useRTLInit();
    const { t, locale } = useTranslation();
    const { isRTL, dir, textAlign, flexDirection, iconMargin, getFieldDir, getInputTextAlign } = useRTL();
    const pageProps = usePage<{ locale?: string; flash?: { success?: string } }>().props;
    const { flash } = pageProps;
    const [activeTab, setActiveTab] = useState<'en' | 'ar'>((isRTL ? 'ar' : 'en') as 'en' | 'ar');
    
    // Map category to translation key
    const categoryTranslationMap: { [key: string]: string } = {
        'general': 'general_settings',
        'vendor': 'vendor_settings',
        'contact': 'contact_us_settings',
        'terms': 'terms_conditions',
        'privacy': 'privacy_policy',
        'loyalty': 'loyalty_settings',
        'communication': 'communication_settings',
        'myfatoorah': 'myfatoorah_payment_settings',
        'support': 'contact_support_settings',
        'booking': 'booking_settings',
    };
    
    const categoryTranslationKey = categoryTranslationMap[currentCategory] || categoryLabel;
    const translatedCategoryLabel = t(categoryTranslationKey) || categoryLabel;
    
    // Check if this is terms or privacy category
    const isTermsOrPrivacy = currentCategory === 'terms' || currentCategory === 'privacy';
    
    const [formData, setFormData] = useState<{ [key: number]: string | boolean | number | string[] }>(() => {
        const initialData: { [key: number]: string | boolean | number | string[] } = {};
        if (Array.isArray(settings)) {
            settings.forEach(setting => {
                if (setting && setting.id) {
                    if (setting.type === 'boolean') {
                        initialData[setting.id] = setting.value === 'true';
                    } else if (setting.type === 'array') {
                        // Parse array from JSON or comma-separated string
                        try {
                            const parsed = JSON.parse(setting.value || '[]');
                            initialData[setting.id] = Array.isArray(parsed) ? parsed : [];
                        } catch {
                            // If not JSON, treat as comma-separated
                            const values = setting.value ? setting.value.split(',').map(v => v.trim()).filter(v => v) : [];
                            initialData[setting.id] = values;
                        }
                    } else {
                        initialData[setting.id] = setting.value || '';
                    }
                }
            });
        }
        return initialData;
    });
    const [filePreviews, setFilePreviews] = useState<{ [key: number]: File | null }>({});
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [forceRender, setForceRender] = useState(0);
    const [fieldErrors, setFieldErrors] = useState<{ [key: string]: string }>({});
    const [otpProvider, setOtpProvider] = useState<string>('');

    // Track OTP provider changes without forcing full re-render
    useEffect(() => {
        const otpProviderSetting = Array.isArray(settings) ? settings.find(s => s.key === 'otp_provider') : null;
        if (otpProviderSetting) {
            const currentOtpProvider = String(formData[otpProviderSetting.id] ?? otpProviderSetting.value);
            if (otpProvider !== currentOtpProvider) {
                setOtpProvider(currentOtpProvider);
                // Only force render when OTP provider actually changes
                setForceRender(prev => prev + 1);
            }
        }
    }, [formData, settings, otpProvider]);

    
    // Early return if currentCategory is not available
    if (!currentCategory || !categoryLabel) {
        return (
            <AppLayout>
                <div className="flex h-full flex-1 flex-col gap-6 overflow-x-auto rounded-xl bg-white dark:bg-slate-900 p-6">
                    <div className="text-center py-12">
                        <p className="text-muted-foreground">{t('loading')}</p>
                    </div>
                </div>
            </AppLayout>
        );
    }

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        
        // Prevent double submission
        if (isSubmitting) {
            return;
        }
        
        
        const updatedSettings = (Array.isArray(settings) ? settings : []).map((setting) => {
            let settingValue = formData[setting.id] ?? setting.value;
            
            // Convert array to JSON string for array type settings
            if (setting.type === 'array' && Array.isArray(settingValue)) {
                settingValue = JSON.stringify(settingValue);
            }
            
            const settingData: { id: number; value: string | boolean | number | string[]; type: string } = {
                id: setting.id,
                value: settingValue,
                type: setting.type,
            };
            
            return settingData;
        });

        // Check if default language is being changed
        const defaultLanguageSetting = settings.find(s => s.key === 'app_default_language');
        const isLanguageChanged = defaultLanguageSetting && 
            formData[defaultLanguageSetting.id] !== undefined &&
            String(formData[defaultLanguageSetting.id]) !== String(defaultLanguageSetting.value);

        // Safety check for currentCategory
        if (!currentCategory) {
            toast.error(t('invalid_category'));
            return;
        }

        // Check if we have files to upload
        const hasFilesToUpload = Object.values(filePreviews).some(file => file !== null);
        
        setIsSubmitting(true);
        
        if (hasFilesToUpload) {
            // Use FormData for file uploads
            const formDataObj = new FormData();
            formDataObj.append('_method', 'PUT');
            
            // Add settings as array structure for FormData
            updatedSettings.forEach((setting, index) => {
                formDataObj.append(`settings[${index}][id]`, String(setting.id));
                formDataObj.append(`settings[${index}][type]`, setting.type);
                
                // Get the original setting to check the key
                const originalSetting = settings.find(s => s.id === setting.id);
                const settingKey = originalSetting?.key || '';
                
                // Check if this setting has a file to upload
                const filePreview = filePreviews[setting.id];
                const isFileSetting = settingKey === 'app_logo' || 
                                     settingKey === 'app_favicon' || 
                                     settingKey.includes('_icon') || 
                                     settingKey.includes('_image');
                
                if (filePreview && isFileSetting) {
                    // For file uploads, send the file
                    formDataObj.append(`settings[${index}][file]`, filePreview);
                    // Don't send value for file settings when uploading a new file
                    // The controller will set the value from the uploaded file path
                } else {
                    // For all settings (file or not), send the value to preserve existing data
                    const value = setting.value;
                    if (value !== null && value !== undefined && value !== '') {
                        formDataObj.append(`settings[${index}][value]`, String(value));
                    }
                }
            });
            
            router.post(dashboard.siteSettings.update.url({ category: currentCategory }), formDataObj, {
                forceFormData: true,
                preserveScroll: true,
                onSuccess: () => {
                    setIsSubmitting(false);
                    setFilePreviews({});
                    // Flash message will be shown in the UI
                    
                    // If language changed, preserve locale and do full page refresh to update layout
                    if (isLanguageChanged && defaultLanguageSetting) {
                        const newLocale = String(formData[defaultLanguageSetting.id]);
                        // Preserve locale in URL before reload
                        const url = new URL(window.location.href);
                        url.searchParams.set('lang', newLocale);
                        window.location.href = url.toString();
                    } else {
                        // Reload the page to show updated images
                        router.reload({ only: ['settings'] });
                    }
                },
                onError: (errors) => {
                    setIsSubmitting(false);
                    // Map errors to field-specific errors
                    const mappedErrors: { [key: string]: string } = {};
                    if (errors && Object.keys(errors).length > 0) {
                        Object.keys(errors).forEach(errorKey => {
                            const errorValue = errors[errorKey];
                            if (errorValue) {
                                // Try to find the setting key from error key
                                // Error format might be: settings.0.value or setting_key
                                const settingIndexMatch = errorKey.match(/settings\[(\d+)\]/);
                                if (settingIndexMatch) {
                                    const index = parseInt(settingIndexMatch[1]);
                                    const setting = settings[index];
                                    if (setting) {
                                        mappedErrors[setting.key] = Array.isArray(errorValue) ? errorValue[0] : String(errorValue);
                                    }
                                } else if (errorKey.includes('.')) {
                                    // Try to extract setting key from nested error
                                    const parts = errorKey.split('.');
                                    const settingKey = parts[parts.length - 1];
                                    const setting = settings.find(s => s.key === settingKey);
                                    if (setting) {
                                        mappedErrors[setting.key] = Array.isArray(errorValue) ? errorValue[0] : String(errorValue);
                                    }
                                } else {
                                    // Direct key match
                                    const setting = settings.find(s => s.key === errorKey);
                                    if (setting) {
                                        mappedErrors[setting.key] = Array.isArray(errorValue) ? errorValue[0] : String(errorValue);
                                    }
                                }
                            }
                        });
                        setFieldErrors(mappedErrors);
                        
                        const hasRealErrors = Object.keys(mappedErrors).length > 0;
                        if (hasRealErrors) {
                            toast.error(t('update_failed'), {
                                description: t('site_settings_update_failed'),
                            });
                        }
                    }
                }
            });
        } else {
            // No files, use regular object
            router.put(dashboard.siteSettings.update.url({ category: currentCategory }), {
                settings: updatedSettings,
            }, {
                preserveScroll: true,
                onSuccess: () => {
                    setIsSubmitting(false);
                    setFilePreviews({});
                    // Flash message will be shown in the UI
                    
                    // If language changed, preserve locale and do full page refresh to update layout
                    if (isLanguageChanged && defaultLanguageSetting) {
                        const newLocale = String(formData[defaultLanguageSetting.id]);
                        // Preserve locale in URL before reload
                        const url = new URL(window.location.href);
                        url.searchParams.set('lang', newLocale);
                        window.location.href = url.toString();
                    } else {
                        // Reload the page to show updated images
                        router.reload({ only: ['settings'] });
                    }
                },
                onError: (errors) => {
                    setIsSubmitting(false);
                    // Map errors to field-specific errors
                    const mappedErrors: { [key: string]: string } = {};
                    if (errors && Object.keys(errors).length > 0) {
                        Object.keys(errors).forEach(errorKey => {
                            const errorValue = errors[errorKey];
                            if (errorValue) {
                                // Try to find the setting key from error key
                                // Error format might be: settings.0.value or setting_key
                                const settingIndexMatch = errorKey.match(/settings\[(\d+)\]/);
                                if (settingIndexMatch) {
                                    const index = parseInt(settingIndexMatch[1]);
                                    const setting = settings[index];
                                    if (setting) {
                                        mappedErrors[setting.key] = Array.isArray(errorValue) ? errorValue[0] : String(errorValue);
                                    }
                                } else if (errorKey.includes('.')) {
                                    // Try to extract setting key from nested error
                                    const parts = errorKey.split('.');
                                    const settingKey = parts[parts.length - 1];
                                    const setting = settings.find(s => s.key === settingKey);
                                    if (setting) {
                                        mappedErrors[setting.key] = Array.isArray(errorValue) ? errorValue[0] : String(errorValue);
                                    }
                                } else {
                                    // Direct key match
                                    const setting = settings.find(s => s.key === errorKey);
                                    if (setting) {
                                        mappedErrors[setting.key] = Array.isArray(errorValue) ? errorValue[0] : String(errorValue);
                                    }
                                }
                            }
                        });
                        setFieldErrors(mappedErrors);
                        
                        const hasRealErrors = Object.keys(mappedErrors).length > 0;
                        if (hasRealErrors) {
                            toast.error(t('update_failed'), {
                                description: t('site_settings_update_failed'),
                            });
                        }
                    }
                }
            });
        }
        
    };

    const handleValueChange = (settingId: number, value: string | boolean | number | string[]) => {
        const setting = Array.isArray(settings) ? settings.find(s => s.id === settingId) : null;
        const isOtpProvider = setting && setting.key === 'otp_provider';
        const prevValue = formData[settingId];
        
        setFormData(prev => ({
            ...prev,
            [settingId]: value
        }));
        
        // Only force re-render if OTP provider actually changed
        if (isOtpProvider && String(prevValue) !== String(value)) {
            setForceRender(prev => prev + 1);
        }
    };
    

    const handleFileChange = (settingId: number, settingKey: string, file: File | null) => {
        if (file) {
            setFilePreviews(prev => ({
                ...prev,
                [settingId]: file
            }));
        } else {
            setFilePreviews(prev => {
                const newPreviews = { ...prev };
                delete newPreviews[settingId];
                return newPreviews;
            });
        }
    };

    const renderInput = (setting: SiteSetting) => {
        const value = formData[setting.id] ?? setting.value;
        const isFileSetting = setting.key === 'app_logo' || 
                             setting.key === 'app_favicon' || 
                             (setting.key.includes('_icon') && !setting.key.includes('contact_type')) ||
                             setting.key.includes('_image');
        const selectedFile = filePreviews[setting.id];
        const currentValue = value ? String(value) : '';
        const hasCurrentValue = currentValue && currentValue.trim() !== '' && currentValue !== 'null';

        // Get current OTP provider for conditional rendering
        const otpProviderSetting = Array.isArray(settings) ? settings.find(s => s.key === 'otp_provider') : null;
        const currentOtpProvider = otpProvider || (otpProviderSetting ? String(formData[otpProviderSetting.id] ?? otpProviderSetting.value) : 'smsbox');

        // Handle conditional rendering for communication settings
        if (currentCategory === 'communication') {
            // Show Twilio fields only when Twilio is selected
            if (setting.key.startsWith('twilio_') || setting.key.startsWith('whatsapp_')) {
                if (currentOtpProvider !== 'twilio') {
                    return null; // Don't render Twilio fields when not selected
                }
            }
            
            // Show SMSBox fields only when SMSBox is selected
            if (setting.key.startsWith('smsbox_')) {
                if (currentOtpProvider !== 'smsbox') {
                    return null; // Don't render SMSBox fields when not selected
                }
            }
        }

        // Handle booking settings conditional rendering
        if (currentCategory === 'booking') {
            // Hide vendor refund policy value when type is "full"
            if (setting.key === 'booking_vendor_refund_policy_value') {
                const vendorRefundPolicyTypeSetting = Array.isArray(settings) ? settings.find(s => s.key === 'booking_vendor_refund_policy_type') : null;
                const currentVendorRefundPolicyType = vendorRefundPolicyTypeSetting 
                    ? String(formData[vendorRefundPolicyTypeSetting.id] ?? vendorRefundPolicyTypeSetting.value ?? 'partial')
                    : 'partial';
                
                if (currentVendorRefundPolicyType === 'full') {
                    return null; // Don't render value field when type is "full"
                }
            }
        }

        // Handle file uploads for logo, favicon, and contact icons
        if (isFileSetting) {
            return (
                <div className="space-y-4">
                    {/* Current logo preview */}
                    {hasCurrentValue && !selectedFile && (
                        <div className="flex items-center gap-4 p-4 border rounded-lg bg-gray-50 dark:bg-slate-800">
                            <img 
                                src={currentValue}
                                alt={setting.key === 'app_logo' ? t('current_logo') : t('current_favicon')}
                                className="h-16 w-16 object-contain"
                                onError={(e) => {
                                    const target = e.target as HTMLImageElement;
                                    const parent = target.parentElement;
                                    if (parent) {
                                        const errorDiv = document.createElement('div');
                                        errorDiv.className = 'flex items-center gap-4 p-4 border rounded-lg bg-gray-50 dark:bg-slate-800';
                                        errorDiv.innerHTML = `<div class="h-16 w-16 bg-gray-200 dark:bg-slate-700 flex items-center justify-center rounded"><span class="text-xs text-muted-foreground">${t('failed_to_load')}</span></div><div class="flex-1"><p class="text-sm font-medium text-slate-900 dark:text-slate-100">${setting.key === 'app_logo' ? t('logo_load_error') : t('favicon_load_error')}</p></div>`;
                                        parent.replaceWith(errorDiv);
                                    }
                                }}
                            />
                            <div className="flex-1">
                                <p className="text-sm font-medium text-slate-900 dark:text-slate-100">
                                    {setting.key === 'app_logo' ? t('current_logo') : t('current_favicon')}
                                </p>
                                <p className="text-xs text-muted-foreground">{currentValue}</p>
                            </div>
                        </div>
                    )}

                    {/* New file preview */}
                    {selectedFile && (
                        <div className="flex items-center gap-4 p-4 border rounded-lg bg-blue-50 dark:bg-blue-900/20">
                            <img 
                                src={URL.createObjectURL(selectedFile)} 
                                alt={t('preview')}
                                className="h-16 w-16 object-contain"
                            />
                            <div className="flex-1">
                                <p className="text-sm font-medium text-slate-900 dark:text-slate-100">
                                    {t('preview')} - {setting.key === 'app_logo' ? t('application_logo') : t('application_favicon')}
                                </p>
                                <p className="text-xs text-muted-foreground dark:text-slate-400">{selectedFile.name}</p>
                            </div>
                            <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => handleFileChange(setting.id, setting.key, null)}
                            >
                                <X className="h-4 w-4" />
                            </Button>
                        </div>
                    )}

                    {/* File input */}
                    <div className={cn("flex items-center gap-2", flexDirection)}>
                        <Input
                            id={`file-${setting.id}`}
                            type="file"
                            accept="image/*,.ico"
                            onChange={(e) => {
                                const file = e.target.files?.[0] || null;
                                handleFileChange(setting.id, setting.key, file);
                            }}
                            className="hidden"
                            disabled={false}
                        />
                        <Label
                            htmlFor={`file-${setting.id}`}
                            className={cn("flex items-center gap-2 cursor-pointer px-4 py-2 border rounded-md hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100", flexDirection)}
                        >
                            <Upload className={cn("h-4 w-4", iconMargin('md'))} />
                            <span className={isRTL ? '!text-right' : '!text-left'}>{selectedFile ? t('change_file') : t('choose_file')}</span>
                        </Label>
                        {selectedFile && (
                            <span className={cn("text-sm text-muted-foreground dark:text-slate-400", isRTL ? '!text-right' : '!text-left')} dir="ltr">
                                {selectedFile.name}
                            </span>
                        )}
                    </div>
                </div>
            );
        }

        switch (setting.type) {
            case 'boolean':
                return (
                    <Switch
                        checked={value === true || value === 'true'}
                        onCheckedChange={(checked) => handleValueChange(setting.id, checked)}
                    />
                );

            case 'select': {
                const selectOptions = getSelectOptions(setting.key);
                // Get translated options for platform fee type
                const getTranslatedOption = (option: string) => {
                    if (setting.key === 'vendor_platform_fee_type') {
                        return t(option) || option;
                    }
                    return option;
                };
                return (
                    <Select
                        value={String(value)}
                        onValueChange={(newValue) => handleValueChange(setting.id, newValue)}
                    >
                        <SelectTrigger className={isRTL ? '!text-right' : '!text-left'} dir={dir}>
                            <SelectValue placeholder={t('select_an_option') || 'Select an option'} />
                        </SelectTrigger>
                        <SelectContent dir={dir}>
                            {selectOptions.map((option) => (
                                <SelectItem key={option} value={option}>
                                    {getTranslatedOption(option)}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                );
            }

            case 'array': {
                // Handle array type - for vendor values and similar
                const arrayValue = Array.isArray(value) ? value : [];
                return (
                    <div className={cn("space-y-2", isRTL ? '!text-right' : '!text-left')}>
                        <div className={cn("flex flex-wrap gap-2", flexDirection)}>
                            {arrayValue.map((item, index) => (
                                <div key={index} className={cn("flex items-center gap-1 px-2 py-1 bg-slate-100 dark:bg-slate-800 rounded", flexDirection)}>
                                    <span className={cn("text-sm", isRTL ? '!text-right' : '!text-left')} dir={dir}>{item}</span>
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="sm"
                                        className="h-4 w-4 p-0"
                                        onClick={() => {
                                            const newArray = arrayValue.filter((_, i) => i !== index);
                                            handleValueChange(setting.id, newArray);
                                        }}
                                    >
                                        <X className="h-3 w-3" />
                                    </Button>
                                </div>
                            ))}
                        </div>
                        <div className={cn("flex gap-2", flexDirection)}>
                            <Input
                                type="text"
                                placeholder={t('add_value')}
                                dir={getFieldDir('text')}
                                className={cn("flex-1", getInputTextAlign('text'))}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                        e.preventDefault();
                                        const input = e.target as HTMLInputElement;
                                        const newValue = input.value.trim();
                                        if (newValue) {
                                            handleValueChange(setting.id, [...arrayValue, newValue]);
                                            input.value = '';
                                        }
                                    }
                                }}
                            />
                            <Button
                                type="button"
                                variant="outline"
                                onClick={(e) => {
                                    e.preventDefault();
                                    const button = e.currentTarget;
                                    const input = button.previousElementSibling as HTMLInputElement;
                                    if (input) {
                                        const newValue = input.value.trim();
                                        if (newValue) {
                                            handleValueChange(setting.id, [...arrayValue, newValue]);
                                            input.value = '';
                                        }
                                    }
                                }}
                            >
                                {t('add')}
                            </Button>
                        </div>
                        <p className={cn("text-xs text-muted-foreground", isRTL ? '!text-right' : '!text-left')} dir={dir}>
                            {t('array_values_help')}
                        </p>
                    </div>
                );
            }

            case 'textarea':
                // Use CKEditor for rich content fields
                if (isRichContentField(setting.key)) {
                    return (
                        <CKEditorComponent
                            value={String(value)}
                            onChange={(newValue) => handleValueChange(setting.id, newValue)}
                            placeholder={t(`${setting.key}_placeholder`) || setting.description}
                            className="min-h-[300px]"
                        />
                    );
                }
                
                return (
                    <Textarea
                        value={String(value)}
                        onChange={(e) => handleValueChange(setting.id, e.target.value)}
                        dir={getFieldDir('textarea')}
                        className={cn(fieldErrors[setting.key] ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : '', getInputTextAlign('textarea'))}
                        rows={3}
                        disabled={false}
                    />
                );

            case 'password':
                return (
                    <Input
                        type="password"
                        value={String(value)}
                        onChange={(e) => handleValueChange(setting.id, e.target.value)}
                        dir={getFieldDir('text')}
                        className={getInputTextAlign('text')}
                        disabled={false}
                    />
                );

            case 'json':
                // For JSON type fields (like Firebase credentials), use textarea
                return (
                    <Textarea
                        value={String(value)}
                        onChange={(e) => handleValueChange(setting.id, e.target.value)}
                        dir={getFieldDir('textarea')}
                        className={cn("font-mono text-sm", fieldErrors[setting.key] ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : '', getInputTextAlign('textarea'))}
                        rows={10}
                        disabled={false}
                        placeholder={t('paste_json_here') || 'Paste JSON here...'}
                    />
                );

            case 'email':
                // Check for validation errors - check email format
                const emailValue = String(value || '');
                const hasEmailError = fieldErrors[setting.key] || 
                                     (emailValue && !emailValue.includes('@')) ||
                                     (emailValue && !emailValue.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/));
                
                return (
                    <div className={cn("space-y-1", isRTL ? '!text-right' : '!text-left')}>
                        <Input
                            type="email"
                            value={emailValue}
                            onChange={(e) => {
                                const newValue = e.target.value;
                                handleValueChange(setting.id, newValue);
                                // Clear error when user starts typing
                                if (fieldErrors[setting.key]) {
                                    setFieldErrors(prev => {
                                        const newErrors = { ...prev };
                                        delete newErrors[setting.key];
                                        return newErrors;
                                    });
                                }
                            }}
                            onBlur={(e) => {
                                const emailVal = e.target.value;
                                if (emailVal && !emailVal.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
                                    setFieldErrors(prev => ({
                                        ...prev,
                                        [setting.key]: t('invalid_email_format')
                                    }));
                                }
                            }}
                            dir={getFieldDir('email')}
                            className={cn(hasEmailError ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : '', getInputTextAlign('email'))}
                            disabled={false}
                        />
                        {fieldErrors[setting.key] && (
                            <p className={cn("text-sm text-red-500", isRTL ? '!text-right' : '!text-left')} dir={dir}>{fieldErrors[setting.key]}</p>
                        )}
                    </div>
                );
            

            case 'url':
                return (
                    <Input
                        type="url"
                        value={String(value)}
                        onChange={(e) => handleValueChange(setting.id, e.target.value)}
                        dir={getFieldDir('url')}
                        className={getInputTextAlign('url')}
                        disabled={false}
                    />
                );

            case 'image':
                const imageValue = String(value || '');
                const imageFile = filePreviews[setting.id];
                
                return (
                    <div className={cn("space-y-2", isRTL ? '!text-right' : '!text-left')}>
                        {imageValue && !imageFile && (
                            <div className={cn("flex items-center gap-4 p-4 border rounded-lg bg-gray-50 dark:bg-slate-800", flexDirection)}>
                                <img 
                                    src={imageValue}
                                    alt={setting.description || t('current_image')}
                                    className="h-16 w-16 object-contain"
                                />
                                <div className={cn("flex-1", isRTL ? '!text-right' : '!text-left')}>
                                    <p className={cn("text-sm font-medium", isRTL ? '!text-right' : '!text-left')} dir={dir}>{t('current_image')}</p>
                                </div>
                            </div>
                        )}
                        {imageFile && (
                            <div className={cn("flex items-center gap-4 p-4 border rounded-lg bg-blue-50 dark:bg-blue-900/20", flexDirection)}>
                                <img 
                                    src={URL.createObjectURL(imageFile)} 
                                    alt={t('preview')}
                                    className="h-16 w-16 object-contain"
                                />
                                <div className={cn("flex-1", isRTL ? '!text-right' : '!text-left')}>
                                    <p className={cn("text-sm font-medium", isRTL ? '!text-right' : '!text-left')} dir={dir}>{t('preview')}</p>
                                    <p className={cn("text-xs text-muted-foreground", isRTL ? '!text-right' : '!text-left')} dir="ltr">{imageFile.name}</p>
                                </div>
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleFileChange(setting.id, setting.key, null)}
                                >
                                    <X className="h-4 w-4" />
                                </Button>
                            </div>
                        )}
                        <div className={cn("flex items-center gap-2", flexDirection)}>
                            <Input
                                id={`file-${setting.id}`}
                                type="file"
                                accept="image/*"
                                onChange={(e) => {
                                    const file = e.target.files?.[0] || null;
                                    handleFileChange(setting.id, setting.key, file);
                                }}
                                className="hidden"
                            />
                            <Label
                                htmlFor={`file-${setting.id}`}
                                className={cn("flex items-center gap-2 cursor-pointer px-4 py-2 border rounded-md hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors bg-white dark:bg-slate-800", flexDirection)}
                            >
                                <Upload className={cn("h-4 w-4", iconMargin('md'))} />
                                <span className={isRTL ? '!text-right' : '!text-left'}>{imageFile ? t('change_file') : t('choose_file')}</span>
                            </Label>
                        </div>
                        {fieldErrors[setting.key] && (
                            <p className={cn("text-sm text-red-500", isRTL ? '!text-right' : '!text-left')} dir={dir}>{fieldErrors[setting.key]}</p>
                        )}
                    </div>
                );

            case 'number':
            case 'integer':
            case 'float':
            case 'decimal': {
                // Check if this is a vendor amount field that should show currency unit
                // Check for vendor category and any amount/value fields
                const isVendorCategory = currentCategory === 'vendor' || setting.key.includes('vendor_');
                const isVendorAmount = isVendorCategory && 
                                      (setting.key.includes('amount') || setting.key.includes('value') || setting.key.includes('fee') || setting.key.includes('price') || setting.key.includes('cost'));
                const currencyUnitSetting = settings.find(s => s.key === 'vendor_currency_unit');
                const currencyUnit = currencyUnitSetting ? (formData[currencyUnitSetting.id] || currencyUnitSetting.value || 'KWD') : 'KWD';
                
                // Check if this is customer penalty value or vendor refund policy value
                const isCustomerPenaltyValue = setting.key === 'booking_user_cancellation_penalty_value';
                const isVendorRefundPolicyValue = setting.key === 'booking_vendor_refund_policy_value';
                const isPlatformFee = setting.key === 'vendor_platform_fee';
                
                // Get penalty type for customer penalty value
                const customerPenaltyTypeSetting = isCustomerPenaltyValue 
                    ? settings.find(s => s.key === 'booking_user_cancellation_penalty_type')
                    : null;
                const currentCustomerPenaltyType = customerPenaltyTypeSetting 
                    ? String(formData[customerPenaltyTypeSetting.id] ?? customerPenaltyTypeSetting.value ?? 'percentage')
                    : null;
                
                // Get vendor refund policy type
                const vendorRefundPolicyTypeSetting = isVendorRefundPolicyValue 
                    ? settings.find(s => s.key === 'booking_vendor_refund_policy_type')
                    : null;
                const currentVendorRefundPolicyType = vendorRefundPolicyTypeSetting
                    ? String(formData[vendorRefundPolicyTypeSetting.id] ?? vendorRefundPolicyTypeSetting.value ?? 'partial')
                    : null;
                
                // Get platform fee type
                const platformFeeTypeSetting = isPlatformFee 
                    ? settings.find(s => s.key === 'vendor_platform_fee_type')
                    : null;
                const currentPlatformFeeType = platformFeeTypeSetting
                    ? String(formData[platformFeeTypeSetting.id] ?? platformFeeTypeSetting.value ?? 'percentage')
                    : null;
                
                // Determine if we should show percentage or currency indicator
                const showPercentage = (isCustomerPenaltyValue && currentCustomerPenaltyType === 'percentage') ||
                                      (isVendorRefundPolicyValue && currentVendorRefundPolicyType === 'partial') ||
                                      (isPlatformFee && currentPlatformFeeType === 'percentage');
                const showCurrency = (isCustomerPenaltyValue && currentCustomerPenaltyType === 'fixed') ||
                                    (isVendorRefundPolicyValue && currentVendorRefundPolicyType === 'fixed') ||
                                    (isPlatformFee && currentPlatformFeeType === 'fixed');
                
                // For platform fee, customer penalty value, and vendor refund policy value, don't show the default vendor amount currency
                // These fields have their own conditional currency/percentage indicators
                const shouldShowVendorAmountCurrency = isVendorAmount && !isPlatformFee && !isCustomerPenaltyValue && !isVendorRefundPolicyValue;
                
                // For OTP fields, ensure they stay visible even when empty
                const isOtpField = setting.key === 'otp_digits' || setting.key === 'otp_expiry_minutes';
                
                return (
                    <div className="relative">
                        <Input
                            type="number"
                            value={String(value || '')}
                            onChange={(e) => {
                                const newValue = e.target.value;
                                handleValueChange(setting.id, newValue === '' ? '' : (setting.type === 'float' || setting.type === 'decimal' ? parseFloat(newValue) : parseInt(newValue, 10)));
                            }}
                            step={setting.type === 'float' || setting.type === 'decimal' ? '0.01' : '1'}
                            min="0"
                            max={showPercentage ? "100" : undefined}
                            dir={getFieldDir('number')}
                            className={cn(
                                shouldShowVendorAmountCurrency ? (isRTL ? 'pr-12' : 'pl-12') : '',
                                (showPercentage || showCurrency) ? (isRTL ? 'pl-12' : 'pr-12') : '',
                                fieldErrors[setting.key] ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : '', 
                                getInputTextAlign('number')
                            )}
                            placeholder={isOtpField ? (setting.key === 'otp_digits' ? '6' : '5') : ''}
                            disabled={false}
                        />
                        {shouldShowVendorAmountCurrency && (
                            <span className={cn("absolute top-1/2 -translate-y-1/2 z-10", isRTL ? 'left-3' : 'right-3', "text-sm text-muted-foreground font-medium pointer-events-none")} dir="ltr">
                                {String(currencyUnit)}
                            </span>
                        )}
                        {showPercentage && (
                            <span className={cn("absolute top-1/2 -translate-y-1/2 z-10 pointer-events-none text-sm text-muted-foreground font-medium", isRTL ? 'left-3' : 'right-3')} dir="ltr">
                                %
                            </span>
                        )}
                        {showCurrency && (
                            <span className={cn("absolute top-1/2 -translate-y-1/2 z-10 pointer-events-none text-sm text-muted-foreground font-medium", isRTL ? 'left-3' : 'right-3')} dir="ltr">
                                {String(currencyUnit)}
                            </span>
                        )}
                        {fieldErrors[setting.key] && (
                            <p className={cn("text-sm text-red-500 mt-1", isRTL ? '!text-right' : '!text-left')} dir={dir}>{fieldErrors[setting.key]}</p>
                        )}
                    </div>
                );
            }

            default:
                // Check if this is a phone field by key name (even if type is 'text')
                const isPhoneFieldByKey = setting.key === 'support_phone' || setting.key === 'support_whatsapp';
                if (isPhoneFieldByKey) {
                    const phoneValue = String(value || '');
                    const hasPhoneError = fieldErrors[setting.key] || (phoneValue && phoneValue.length > 0 && phoneValue.length < 8);
                    
                    return (
                        <div className={cn("space-y-1", isRTL ? '!text-right' : '!text-left')}>
                            <PhoneInput
                                value={phoneValue}
                                onChange={(phoneVal) => {
                                    handleValueChange(setting.id, phoneVal);
                                    // Clear error when user starts typing
                                    if (fieldErrors[setting.key]) {
                                        setFieldErrors(prev => {
                                            const newErrors = { ...prev };
                                            delete newErrors[setting.key];
                                            return newErrors;
                                        });
                                    }
                                }}
                                onBlur={(e) => {
                                    const val = e.target.value || phoneValue;
                                    if (val && val.length > 0 && val.length < 8) {
                                        setFieldErrors(prev => ({
                                            ...prev,
                                            [setting.key]: t('invalid_phone_number')
                                        }));
                                    }
                                }}
                                disabled={false}
                                className={hasPhoneError ? 'border-red-500' : ''}
                            />
                            {fieldErrors[setting.key] && (
                                <p className={cn("text-sm text-red-500", isRTL ? '!text-right' : '!text-left')} dir={dir}>{fieldErrors[setting.key]}</p>
                            )}
                        </div>
                    );
                }
                
                // Check if this is a contact us type field that needs icon upload
                const isContactTypeField = setting.key.includes('contact_type') || setting.key.includes('contact_us_type');
                if (isContactTypeField && setting.type === 'text') {
                    const contactIconKey = `${setting.key}_icon`;
                    const contactIconSetting = settings.find(s => s.key === contactIconKey);
                    const contactIconValue = contactIconSetting ? (formData[contactIconSetting.id] || contactIconSetting.value || '') : '';
                    const contactIconFile = filePreviews[contactIconSetting?.id || 0];
                    
                    return (
                        <div className={cn("space-y-4", isRTL ? '!text-right' : '!text-left')}>
                            <Input
                                type="text"
                                value={String(value)}
                                onChange={(e) => handleValueChange(setting.id, e.target.value)}
                                dir={getFieldDir('text')}
                                className={cn(fieldErrors[setting.key] ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : '', getInputTextAlign('text'))}
                                disabled={false}
                            />
                            {fieldErrors[setting.key] && (
                                <p className={cn("text-sm text-red-500", isRTL ? '!text-right' : '!text-left')} dir={dir}>{fieldErrors[setting.key]}</p>
                            )}
                            {contactIconSetting && (
                                <div className={cn("space-y-2", isRTL ? '!text-right' : '!text-left')}>
                                    <Label className={cn("text-sm font-medium", isRTL ? '!text-right' : '!text-left')}>{t('icon')}</Label>
                                    {contactIconValue && !contactIconFile && (
                                        <div className={cn("flex items-center gap-4 p-4 border rounded-lg bg-gray-50 dark:bg-slate-800", flexDirection)}>
                                            <img 
                                                src={String(contactIconValue)}
                                                alt={t('current_icon')}
                                                className="h-12 w-12 object-contain"
                                            />
                                            <div className={cn("flex-1", isRTL ? '!text-right' : '!text-left')}>
                                                <p className={cn("text-sm font-medium", isRTL ? '!text-right' : '!text-left')} dir={dir}>{t('current_icon')}</p>
                                            </div>
                                        </div>
                                    )}
                                    {contactIconFile && (
                                        <div className={cn("flex items-center gap-4 p-4 border rounded-lg bg-blue-50 dark:bg-blue-900/20", flexDirection)}>
                                            <img 
                                                src={URL.createObjectURL(contactIconFile)} 
                                                alt={t('preview')}
                                                className="h-12 w-12 object-contain"
                                            />
                                            <div className={cn("flex-1", isRTL ? '!text-right' : '!text-left')}>
                                                <p className={cn("text-sm font-medium", isRTL ? '!text-right' : '!text-left')} dir={dir}>{t('preview')}</p>
                                                <p className={cn("text-xs text-muted-foreground", isRTL ? '!text-right' : '!text-left')} dir="ltr">{contactIconFile.name}</p>
                                            </div>
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => handleFileChange(contactIconSetting.id, contactIconSetting.key, null)}
                                            >
                                                <X className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    )}
                                    <div className={cn("flex items-center gap-2", flexDirection)}>
                                        <Input
                                            id={`file-${contactIconSetting.id}`}
                                            type="file"
                                            accept="image/*"
                                            onChange={(e) => {
                                                const file = e.target.files?.[0] || null;
                                                handleFileChange(contactIconSetting.id, contactIconSetting.key, file);
                                            }}
                                            className="hidden"
                                        />
                                        <Label
                                            htmlFor={`file-${contactIconSetting.id}`}
                                            className={cn("flex items-center gap-2 cursor-pointer px-4 py-2 border rounded-md hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors bg-white dark:bg-slate-800", flexDirection)}
                                        >
                                            <Upload className={cn("h-4 w-4", iconMargin('md'))} />
                                            <span className={isRTL ? '!text-right' : '!text-left'}>{contactIconFile ? t('change_file') : t('choose_file')}</span>
                                        </Label>
                                    </div>
                                </div>
                            )}
                        </div>
                    );
                }
                
                return (
                    <div className={cn("space-y-1", isRTL ? '!text-right' : '!text-left')}>
                        <Input
                            type="text"
                            value={String(value)}
                            onChange={(e) => handleValueChange(setting.id, e.target.value)}
                            dir={getFieldDir('text')}
                            className={cn(fieldErrors[setting.key] ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : '', getInputTextAlign('text'))}
                            disabled={false}
                        />
                        {fieldErrors[setting.key] && (
                            <p className={cn("text-sm text-red-500", isRTL ? '!text-right' : '!text-left')} dir={dir}>{fieldErrors[setting.key]}</p>
                        )}
                    </div>
                );
        }
    };

    const getSelectOptions = (key: string) => {
        const options: { [key: string]: string[] } = {
            'app_default_language': ['en', 'ar'],
            'vendor_platform_fee_type': ['percentage', 'fixed'],
            'otp_provider': ['smsbox', 'twilio'],
            'myfatoorah_country_iso': ['KWT', 'SAU', 'UAE', 'BHR', 'QAT', 'OMN'],
            'booking_user_cancellation_penalty_type': ['percentage', 'fixed'],
            'booking_vendor_refund_policy_type': ['full', 'partial', 'fixed'],
            'clinic_refund_policy_type': ['full', 'partial', 'fixed'],
        };
        return options[key] || [];
    };

    const isRichContentField = (key: string) => {
        const richContentFields = [
            'terms_conditions_en',
            'terms_conditions_ar',
            'privacy_policy_en',
            'privacy_policy_ar',
            'about_us_en',
            'about_us_ar',
            'contact_us_description_en',
            'contact_us_description_ar',
            'maintenance_message_en',
            'maintenance_message_ar',
            'welcome_message_en',
            'welcome_message_ar',
            'footer_description_en',
            'footer_description_ar',
        ];
        return richContentFields.includes(key);
    };

    return (
        <AppLayout>
            <Head title={`${t('update_site_settings')} - ${translatedCategoryLabel}`} />

            <div className={cn("flex h-full flex-1 flex-col gap-6 overflow-x-auto rounded-xl bg-white dark:bg-slate-900 p-6", isRTL ? '!text-right' : '!text-left')} dir={dir}>
                {/* Header */}
                <div className={cn("flex items-center justify-between", flexDirection)}>
                    <div className={isRTL ? '!text-right' : '!text-left'}>
                        <h1 className={cn("text-2xl font-bold text-slate-900 dark:text-slate-100", isRTL ? '!text-right' : '!text-left')}>{t('update_site_settings')}</h1>
                        <p className={cn("text-muted-foreground dark:text-slate-400", isRTL ? '!text-right' : '!text-left')}>{translatedCategoryLabel}</p>
                    </div>
                    <div className={cn("flex items-center gap-2", flexDirection)}>
                        <Link 
                            href={dashboard.siteSettings.show.url({ category: currentCategory })}
                            only={['settings']}
                        >
                            <Button variant="outline" className="border-primary/20 text-primary hover:bg-primary/10">
                                <ArrowLeft className={cn("h-4 w-4", isRTL && 'rotate-180', iconMargin('md'))} />
                                {t('back')}
                            </Button>
                        </Link>
                    </div>
                </div>

                {/* Success Message */}
                {flash?.success && (
                    <div className={cn("bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4", isRTL ? '!text-right' : '!text-left')}>
                        <div className={cn("flex items-center", flexDirection)}>
                            <CheckCircle className={cn("h-5 w-5 text-green-500 dark:text-green-400", iconMargin('md'))} />
                            <p className={cn("text-green-800 dark:text-green-300 font-medium", isRTL ? '!text-right' : '!text-left')} dir={dir}>{flash.success}</p>
                        </div>
                    </div>
                )}

                {/* Settings Form */}
                <form id="site-settings-form" key={forceRender} onSubmit={handleSubmit}>
                    {isTermsOrPrivacy ? (
                        // Terms & Conditions or Privacy Policy with Tabs
                        (() => {
                            const enKey = currentCategory === 'terms' ? 'terms_conditions_en' : 'privacy_policy_en';
                            const arKey = currentCategory === 'terms' ? 'terms_conditions_ar' : 'privacy_policy_ar';
                            const enSetting = settings.find(s => s.key === enKey);
                            const arSetting = settings.find(s => s.key === arKey);
                            
                            return (
                                <Card>
                                    <CardHeader>
                                        <CardTitle className={cn("text-slate-900 dark:text-slate-100", isRTL ? '!text-right' : '!text-left')}>{translatedCategoryLabel}</CardTitle>
                                        <CardDescription className={cn("text-slate-600 dark:text-slate-400", isRTL ? '!text-right' : '!text-left')}>
                                            {t('site_settings_description')}
                                        </CardDescription>
                                    </CardHeader>
                                    <CardContent>
                                        <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as 'en' | 'ar')} className="w-full">
                                            <TabsList className="grid w-full grid-cols-2">
                                                <TabsTrigger value="en">{t('english')}</TabsTrigger>
                                                <TabsTrigger value="ar">{t('arabic')}</TabsTrigger>
                                            </TabsList>
                                            
                                            <TabsContent value="en" className="mt-6">
                                                {enSetting && (
                                                    <div className={cn("space-y-2", isRTL ? '!text-right' : '!text-left')} dir="ltr">
                                                        <Label htmlFor={`setting-${enSetting.id}`} className={cn("text-base font-medium text-slate-700 dark:text-slate-300 block mb-2", isRTL ? '!text-right' : '!text-left')}>
                                                            {t(enSetting.key) || enSetting.key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                                                        </Label>
                                                        <div className="space-y-2">
                                                            {renderInput(enSetting)}
                                                            {enSetting.description && (
                                                                <p className={cn("text-sm text-muted-foreground dark:text-slate-400 mt-2 leading-relaxed", isRTL ? '!text-right' : '!text-left')} dir="ltr">
                                                                    {t(`${enSetting.key}_description`) || enSetting.description}
                                                                </p>
                                                            )}
                                                        </div>
                                                    </div>
                                                )}
                                            </TabsContent>
                                            
                                            <TabsContent value="ar" className="mt-6">
                                                {arSetting && (
                                                    <div className={cn("space-y-2", isRTL ? '!text-right' : '!text-left')} dir="rtl">
                                                        <Label htmlFor={`setting-${arSetting.id}`} className={cn("text-base font-medium text-slate-700 dark:text-slate-300 block mb-2", isRTL ? '!text-right' : '!text-left')}>
                                                            {t(arSetting.key) || arSetting.key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                                                        </Label>
                                                        <div className="space-y-2">
                                                            {renderInput(arSetting)}
                                                            {arSetting.description && (
                                                                <p className={cn("text-sm text-muted-foreground dark:text-slate-400 mt-2 leading-relaxed", isRTL ? '!text-right' : '!text-left')} dir="rtl">
                                                                    {t(`${arSetting.key}_description`) || arSetting.description}
                                                                </p>
                                                            )}
                                                        </div>
                                                    </div>
                                                )}
                                            </TabsContent>
                                        </Tabs>
                                    </CardContent>
                                </Card>
                            );
                        })()
                    ) : (
                        // Regular settings display
                        <Card>
                            <CardHeader>
                                <CardTitle className={cn("text-slate-900 dark:text-slate-100", isRTL ? '!text-right' : '!text-left')}>{t(categoryLabel) || categoryLabel}</CardTitle>
                                <CardDescription className={cn("text-slate-600 dark:text-slate-400", isRTL ? '!text-right' : '!text-left')}>
                                    {t('site_settings_description')}
                                </CardDescription>
                            </CardHeader>
                            <CardContent className={cn("space-y-6", isRTL ? '!text-right' : '!text-left')}>
                                <div className={cn("space-y-6", isRTL ? '!text-right' : '!text-left')}>
                                    {(() => {
                                        // Sort booking settings: buffer hours first, then customer penalty fields, then vendor fields
                                        let sortedSettings = [...settings];
                                        if (currentCategory === 'booking') {
                                            const orderMap: { [key: string]: number } = {
                                                'booking_rescheduling_buffer_hours': 1,
                                                'booking_cancellation_buffer_hours': 2,
                                                'booking_user_cancellation_penalty_type': 3, // Hidden, but kept in order
                                                'booking_user_cancellation_penalty_value': 4, // Customer penalty value
                                                'booking_vendor_refund_policy_type': 5, // Vendor fields start here
                                                'booking_vendor_refund_policy_value': 6,
                                            };
                                            sortedSettings = sortedSettings.sort((a, b) => {
                                                const orderA = orderMap[a.key] || 999;
                                                const orderB = orderMap[b.key] || 999;
                                                return orderA - orderB;
                                            });
                                        }
                                        return sortedSettings;
                                    })().map((setting) => {
                                        const renderedInput = renderInput(setting);
                                        if (!renderedInput) return null; // Skip rendering if conditional logic returns null
                                        
                                        // Get penalty and vendor refund policy types for label customization
                                        const customerPenaltyTypeSetting = currentCategory === 'booking' && setting.key === 'booking_user_cancellation_penalty_value'
                                            ? settings.find(s => s.key === 'booking_user_cancellation_penalty_type')
                                            : null;
                                        const currentCustomerPenaltyType = customerPenaltyTypeSetting 
                                            ? String(formData[customerPenaltyTypeSetting.id] ?? customerPenaltyTypeSetting.value ?? 'percentage')
                                            : null;
                                        
                                        const vendorRefundPolicyTypeSetting = currentCategory === 'booking' && setting.key === 'booking_vendor_refund_policy_value'
                                            ? settings.find(s => s.key === 'booking_vendor_refund_policy_type')
                                            : null;
                                        const currentVendorRefundPolicyType = vendorRefundPolicyTypeSetting 
                                            ? String(formData[vendorRefundPolicyTypeSetting.id] ?? vendorRefundPolicyTypeSetting.value ?? 'partial')
                                            : null;
                                        
                                        // Custom label for penalty and vendor refund policy values
                                        const getLabel = () => {
                                            if (setting.key === 'booking_user_cancellation_penalty_value') {
                                                const typeLabel = currentCustomerPenaltyType === 'fixed' ? t('fixed_amount') : t('percentage');
                                                return `${t(setting.key) || setting.key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())} (${typeLabel})`;
                                            }
                                            if (setting.key === 'booking_vendor_refund_policy_value') {
                                                if (currentVendorRefundPolicyType === 'partial') {
                                                    return `${t(setting.key) || setting.key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())} (${t('percentage')})`;
                                                }
                                                if (currentVendorRefundPolicyType === 'fixed') {
                                                    return `${t(setting.key) || setting.key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())} (${t('fixed_amount')})`;
                                                }
                                            }
                                            return t(setting.key) || setting.key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
                                        };
                                        
                                        return (
                                            <div key={setting.id} className={cn("space-y-2", isRTL ? '!text-right' : '!text-left')} dir={dir}>
                                                <Label htmlFor={`setting-${setting.id}`} className={cn("text-base font-medium text-slate-700 dark:text-slate-300 block mb-2", isRTL ? '!text-right' : '!text-left')}>
                                                    {getLabel()}
                                                </Label>
                                                <div className="space-y-2">
                                                    {renderedInput}
                                                    {setting.description && (
                                                        <p className={cn("text-sm text-muted-foreground dark:text-slate-400 mt-2 leading-relaxed", isRTL ? '!text-right' : '!text-left')} dir={dir}>
                                                            {t(`${setting.key}_description`) || setting.description}
                                                        </p>
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </CardContent>
                        </Card>
                    )}
                </form>
                
                {/* Action Buttons at Bottom */}
                <div className={cn("flex items-center justify-end gap-2 border-t pt-4 mt-6", flexDirection)}>
                    <Link 
                        href={dashboard.siteSettings.show.url({ category: currentCategory })}
                        only={['settings']}
                    >
                        <Button variant="outline" className="border-primary/20 text-primary hover:bg-primary/10">
                            {t('cancel')}
                        </Button>
                    </Link>
                    <Button type="submit" form="site-settings-form" disabled={isSubmitting} className={cn("bg-primary-gradient hover:opacity-90 text-white", flexDirection)}>
                        <Save className={cn("h-4 w-4", iconMargin('md'))} />
                        {isSubmitting ? t('saving') : t('save_changes')}
                    </Button>
                </div>
            </div>
        </AppLayout>
    );
}