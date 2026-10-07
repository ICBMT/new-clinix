import AppLogoIcon from './app-logo-icon';
import { usePage } from '@inertiajs/react';
import { type SharedData } from '@/types';

export default function AppLogo() {
    const page = usePage<SharedData>();
    const { rtl } = page.props;
    
    // Get dynamic logo and app name from site settings
    const appLogo = page.props.siteSettings?.app_logo;
    const appNameEn = page.props.siteSettings?.app_name_en || 'Kuwait Admin';
    const appNameAr = page.props.siteSettings?.app_name_ar || 'كويت أدمن';
    const appName = rtl ? appNameAr : appNameEn;
    
    // Check if logo exists and is not empty
    const hasCustomLogo = appLogo && appLogo.trim() !== '';

    return (
        <>
            <div className="flex aspect-square size-12 items-center justify-center rounded-md bg-primary-gradient text-white overflow-hidden p-1.5">
                {hasCustomLogo ? (
                    <img 
                        src={appLogo} 
                        alt={appName}
                        className="size-full object-contain rounded-md"
                    />
                ) : (
                    <AppLogoIcon className="size-7 fill-current text-white" />
                )}
            </div>
            <div className="ml-1 grid flex-1 text-left text-base">
                <span className="mb-0.5 truncate leading-tight font-semibold text-lg text-primary-gradient">
                    {appName}
                </span>
            </div>
        </>
    );
}
