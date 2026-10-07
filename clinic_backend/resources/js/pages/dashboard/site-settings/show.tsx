import { Head, Link, router, usePage } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useRTLInit } from '@/hooks/use-rtl-init';
import { useTranslation } from '@/hooks/use-translation';
import { useRTL } from '@/hooks/use-rtl';
import { usePermissions } from '@/hooks/use-permissions';
import AppLayout from '@/layouts/app-layout';
import { Edit, Settings, CheckCircle } from 'lucide-react';
import dashboard from '@/routes/dashboard';
import { useEffect, useRef, useState } from 'react';
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
    permissions: string[];
}

export default function SiteSettingsShow({ settings = [], currentCategory, categoryLabel }: Props) {
    useRTLInit();
    const { t, locale } = useTranslation();
    const { isRTL, dir, textAlign, flexDirection, iconMargin } = useRTL();
    const { can } = usePermissions();
    const { flash } = usePage().props as { flash?: { success?: string } };
    const hasReloadedRef = useRef(false);
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
    
    // Reload data when navigating back from edit page to ensure fresh data
    useEffect(() => {
        // Check if we're coming from the edit page or any site-settings navigation
        const comingFromEdit = document.referrer.includes('/dashboard/site-settings') && 
                              document.referrer.includes('/edit');
        
        // Only reload once per mount, and only if we're navigating from edit page
        if (!hasReloadedRef.current && comingFromEdit) {
            hasReloadedRef.current = true;
            router.reload({ only: ['settings'] });
        }
    }, []);
    
    // Safety check
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


    return (
        <AppLayout>
            <Head title={`${translatedCategoryLabel} - ${t('site_settings')}`} />

            <div className={cn("flex h-full flex-1 flex-col gap-6 overflow-x-auto rounded-xl bg-white dark:bg-slate-900 p-6", isRTL ? '!text-right' : '!text-left')} dir={dir}>
                {/* Header */}
                <div className={cn("flex items-center justify-between", flexDirection)}>
                    <div className={isRTL ? '!text-right' : '!text-left'}>
                        <h1 className={cn("text-2xl font-bold text-slate-900 dark:text-slate-100", isRTL ? '!text-right' : '!text-left')}>{translatedCategoryLabel}</h1>
                        <p className={cn("text-muted-foreground dark:text-slate-400", isRTL ? '!text-right' : '!text-left')}>{t('site_settings_description')}</p>
                    </div>
                    <div className={cn("flex items-center gap-2", flexDirection)}>
                        {can(`site-settings.${currentCategory}.edit`) && (
                            <Link href={dashboard.siteSettings.edit.url({ category: currentCategory })}>
                                <Button className={cn("bg-primary-gradient hover:opacity-90 text-white", flexDirection)}>
                                    <Edit className={cn("h-4 w-4", iconMargin('md'))} />
                                    {t('edit')}
                                </Button>
                            </Link>
                        )}
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

                {/* Settings List */}
                {isTermsOrPrivacy ? (
                    // Terms & Conditions or Privacy Policy with Tabs
                    (() => {
                        const enKey = currentCategory === 'terms' ? 'terms_conditions_en' : 'privacy_policy_en';
                        const arKey = currentCategory === 'terms' ? 'terms_conditions_ar' : 'privacy_policy_ar';
                        const enSetting = settings.find(s => s.key === enKey);
                        const arSetting = settings.find(s => s.key === arKey);
                        
                        return (
                            <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as 'en' | 'ar')} className="w-full">
                                <TabsList className="grid w-full grid-cols-2">
                                    <TabsTrigger value="en">{t('english')}</TabsTrigger>
                                    <TabsTrigger value="ar">{t('arabic')}</TabsTrigger>
                                </TabsList>
                                
                                <TabsContent value="en" className="mt-6">
                                    <Card>
                                        <CardHeader>
                                            <CardTitle className={cn("text-lg text-slate-900 dark:text-slate-100", isRTL ? '!text-right' : '!text-left')}>
                                                {currentCategory === 'terms' ? t('terms_conditions') : t('privacy_policy')} ({t('english')})
                                            </CardTitle>
                                        </CardHeader>
                                        <CardContent>
                                            {enSetting?.value ? (
                                                <div 
                                                    className={cn("prose dark:prose-invert max-w-none text-slate-900 dark:text-slate-100", isRTL ? '!text-right' : '!text-left')}
                                                    dir="ltr"
                                                    dangerouslySetInnerHTML={{ __html: enSetting.value }}
                                                />
                                            ) : (
                                                <p className={cn("text-muted-foreground", isRTL ? '!text-right' : '!text-left')} dir="ltr">{t('no_value')}</p>
                                            )}
                                        </CardContent>
                                    </Card>
                                </TabsContent>
                                
                                <TabsContent value="ar" className="mt-6">
                                    <Card>
                                        <CardHeader>
                                            <CardTitle className={cn("text-lg text-slate-900 dark:text-slate-100", isRTL ? '!text-right' : '!text-left')}>
                                                {currentCategory === 'terms' ? t('terms_conditions') : t('privacy_policy')} ({t('arabic')})
                                            </CardTitle>
                                        </CardHeader>
                                        <CardContent>
                                            {arSetting?.value ? (
                                                <div 
                                                    className={cn("prose dark:prose-invert max-w-none text-slate-900 dark:text-slate-100", isRTL ? '!text-right' : '!text-left')}
                                                    dir="rtl"
                                                    dangerouslySetInnerHTML={{ __html: arSetting.value }}
                                                />
                                            ) : (
                                                <p className={cn("text-muted-foreground", isRTL ? '!text-right' : '!text-left')} dir="rtl">{t('no_value')}</p>
                                            )}
                                        </CardContent>
                                    </Card>
                                </TabsContent>
                            </Tabs>
                        );
                    })()
                ) : (
                    // Regular settings display
                    <div className="space-y-8">
                        {Array.isArray(settings) && settings.length > 0 ? (
                            (() => {
                                // Group settings by type for better organization
                                const groupedSettings = {
                                    core: settings.filter(s => 
                                        s.key === 'otp_test_mode' || 
                                        s.key === 'otp_provider' || 
                                        s.key === 'otp_digits' || 
                                        s.key === 'otp_expiry_minutes'
                                    ),
                                    twilio: settings.filter(s => 
                                        s.key.startsWith('twilio_') || s.key.startsWith('whatsapp_')
                                    ),
                                    smsbox: settings.filter(s => 
                                        s.key.startsWith('smsbox_')
                                    ),
                                    other: settings.filter(s => 
                                        !s.key.startsWith('otp_') && 
                                        !s.key.startsWith('twilio_') && 
                                        !s.key.startsWith('whatsapp_') && 
                                        !s.key.startsWith('smsbox_')
                                    )
                                };

                                return Object.entries(groupedSettings).map(([groupName, groupSettings]) => {
                                    if (groupSettings.length === 0) return null;

                                    return (
                                        <div key={groupName} className={cn("space-y-6", isRTL ? '!text-right' : '!text-left')}>
                                            {/* Render fields in pairs for titles and descriptions */}
                                            {groupSettings.map((setting) => {
                                                // Check if this is a title field that should be paired
                                                const isTitleField = setting.key.includes('_title_');
                                                const isDescriptionField = setting.key.includes('_description_');
                                                
                                                if (isTitleField) {
                                                    // Find the corresponding description field
                                                    const descriptionKey = setting.key.replace('_title_', '_description_');
                                                    const descriptionSetting = groupSettings.find(s => s.key === descriptionKey);
                                                    
                                                    return (
                                                        <div key={setting.id} className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                                            {/* Title Field */}
                                                            <Card>
                                                            <CardHeader className="pb-3">
                                                                <CardTitle className={cn("text-lg text-slate-900 dark:text-slate-100", isRTL ? '!text-right' : '!text-left')}>{t(setting.key) || setting.key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}</CardTitle>
                                                            </CardHeader>
                                                            <CardContent>
                                                                <div className={cn("text-sm", isRTL ? '!text-right' : '!text-left')}>
                                                                    <span className={cn("font-mono text-sm bg-muted dark:bg-slate-800 px-2 py-1 rounded text-slate-900 dark:text-slate-100", isRTL ? '!text-right' : '!text-left')} dir={dir}>
                                                                        {setting.value || t('no_value')}
                                                                    </span>
                                                                </div>
                                                            </CardContent>
                                                            </Card>
                                                            
                                                            {/* Description Field */}
                                                            {descriptionSetting && (
                                                                <Card>
                                                                    <CardHeader className="pb-3">
                                                                        <CardTitle className={cn("text-lg text-slate-900 dark:text-slate-100", isRTL ? '!text-right' : '!text-left')}>{t(descriptionSetting.key)}</CardTitle>
                                                                    </CardHeader>
                                                                    <CardContent>
                                                                        <div className={cn("text-sm", isRTL ? '!text-right' : '!text-left')}>
                                                                            <span className={cn("font-mono text-sm bg-muted dark:bg-slate-800 px-2 py-1 rounded text-slate-900 dark:text-slate-100", isRTL ? '!text-right' : '!text-left')} dir={dir}>
                                                                                {descriptionSetting.value || t('no_value')}
                                                                            </span>
                                                                        </div>
                                                                    </CardContent>
                                                                </Card>
                                                            )}
                                                        </div>
                                                    );
                                                } else if (isDescriptionField) {
                                                    // Skip description fields as they're handled with their title pairs
                                                    return null;
                                                } else {
                                                    // Regular field
                                                    return (
                                                        <Card key={setting.id}>
                                                            <CardHeader className="pb-3">
                                                                <CardTitle className={cn("text-lg text-slate-900 dark:text-slate-100", isRTL ? '!text-right' : '!text-left')}>{t(setting.key)}</CardTitle>
                                                            </CardHeader>
                                                            <CardContent>
                                                                <div className={cn("text-sm", isRTL ? '!text-right' : '!text-left')}>
                                                                    {/* Show image preview for logo and favicon */}
                                                                    {setting.key === 'app_logo' || setting.key === 'app_favicon' ? (
                                                                        !setting.value || setting.value.trim() === '' ? (
                                                                            <div className={cn("flex items-center gap-4 mb-3", flexDirection)}>
                                                                                <div className="h-16 w-16 bg-gray-100 dark:bg-slate-700 flex items-center justify-center">
                                                                                    <span className={cn("text-xs text-muted-foreground dark:text-slate-400", isRTL ? '!text-right' : '!text-left')} dir={dir}>{t('no_image')}</span>
                                                                                </div>
                                                                                <div className={cn("flex-1", isRTL ? '!text-right' : '!text-left')}>
                                                                                    <p className={cn("text-sm font-medium text-slate-900 dark:text-slate-100", isRTL ? '!text-right' : '!text-left')} dir={dir}>{setting.key === 'app_logo' ? t('no_logo') : t('no_favicon')}</p>
                                                                                </div>
                                                                            </div>
                                                                        ) : (
                                                                            <div className={cn("flex items-center gap-4 mb-3", flexDirection)}>
                                                                                <img 
                                                                                    src={setting.value} 
                                                                                    alt={setting.key === 'app_logo' ? t('application_logo') : t('application_favicon')}
                                                                                    className="h-16 w-16 object-contain"
                                                                                    onError={(e) => {
                                                                                        const target = e.target as HTMLImageElement;
                                                                                        const parent = target.parentElement;
                                                                                        if (parent) {
                                                                                            const errorDiv = document.createElement('div');
                                                                                            errorDiv.className = cn("flex items-center gap-4 mb-3", flexDirection);
                                                                                            errorDiv.innerHTML = `<div class="h-16 w-16 bg-gray-100 dark:bg-slate-700 flex items-center justify-center"><span class="text-xs text-muted-foreground">${t('failed_to_load')}</span></div><div class="flex-1"><p class="text-sm font-medium text-slate-900 dark:text-slate-100">${setting.key === 'app_logo' ? t('logo_load_error') : t('favicon_load_error')}</p></div>`;
                                                                                            parent.replaceWith(errorDiv);
                                                                                        }
                                                                                    }}
                                                                                />
                                                                                <div className={cn("flex-1", isRTL ? '!text-right' : '!text-left')}>
                                                                                    <p className={cn("text-sm font-medium text-slate-900 dark:text-slate-100", isRTL ? '!text-right' : '!text-left')} dir={dir}>{setting.key === 'app_logo' ? t('current_logo') : t('current_favicon')}</p>
                                                                                    <p className={cn("text-xs text-muted-foreground", isRTL ? '!text-right' : '!text-left')} dir="ltr">{setting.value}</p>
                                                                                </div>
                                                                            </div>
                                                                        )
                                                                    ) : setting.type === 'boolean' ? (
                                                                        <span className={cn(`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium`, isRTL ? '!text-right' : '!text-left', setting.value === 'true' 
                                                                                ? 'bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-300' 
                                                                                : 'bg-red-100 dark:bg-red-900/20 text-red-800 dark:text-red-300'
                                                                        )} dir={dir}>
                                                                            {setting.value === 'true' ? t('enabled') : t('disabled')}
                                                                        </span>
                                                                    ) : setting.type === 'password' || setting.key.includes('api_key') || setting.key.includes('secret') || setting.key.startsWith('firebase_') ? (
                                                                        <span className={cn("font-mono text-sm bg-muted dark:bg-slate-800 px-2 py-1 rounded text-slate-900 dark:text-slate-100", isRTL ? '!text-right' : '!text-left')} dir="ltr">
                                                                            {setting.value ? '••••••••••••••••' : t('no_value')}
                                                                        </span>
                                                                    ) : (
                                                                        <span className={cn("font-mono text-sm bg-muted dark:bg-slate-800 px-2 py-1 rounded break-all text-slate-900 dark:text-slate-100", isRTL ? '!text-right' : '!text-left')} dir={dir}>
                                                                            {setting.value || t('no_value')}
                                                                        </span>
                                                                    )}
                                                                </div>
                                                            </CardContent>
                                                        </Card>
                                                    );
                                                }
                                            })}
                                        </div>
                                    );
                                });
                            })()
                        ) : (
                            <Card className="col-span-full">
                                <CardContent className={cn("flex flex-col items-center justify-center py-12", isRTL ? '!text-right' : '!text-left')}>
                                    <Settings className={cn("h-12 w-12 text-muted-foreground dark:text-slate-600 mb-4", iconMargin('md'))} />
                                    <h3 className={cn("text-lg font-semibold mb-2 text-slate-900 dark:text-slate-100", isRTL ? '!text-right' : '!text-left')} dir={dir}>{t('no_settings_found')}</h3>
                                    <p className={cn("text-muted-foreground dark:text-slate-400", isRTL ? '!text-right' : '!text-left')} dir={dir}>
                                        {t('no_settings_found')} {categoryLabel.toLowerCase()}
                                    </p>
                                </CardContent>
                            </Card>
                        )}
                    </div>
                )}
            </div>
        </AppLayout>
    );
}
