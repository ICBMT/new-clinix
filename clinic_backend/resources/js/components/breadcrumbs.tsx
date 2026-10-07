import {
    Breadcrumb,
    BreadcrumbItem,
    BreadcrumbLink,
    BreadcrumbList,
    BreadcrumbPage,
    BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { type BreadcrumbItem as BreadcrumbItemType, type SharedData } from '@/types';
import { useTranslation } from '@/hooks/use-translation';
import { useRTL } from '@/hooks/use-rtl';
import { Link, usePage } from '@inertiajs/react';
import { Fragment } from 'react';

/**
 * Convert common breadcrumb patterns to translation keys
 * These keys are then looked up in lang/en/common.php and lang/ar/common.php
 * via the useTranslation hook which uses translations from HandleInertiaRequests middleware
 * 
 * Examples:
 * - "Dashboard" -> "dashboard" -> looks up translations['dashboard'] from common.php
 * - "Areas Management" -> "areas_management" -> looks up translations['areas_management'] from common.php
 * - "Edit Area" -> "edit_area" -> looks up translations['edit_area'] from common.php
 * - "Create Area" -> "create_area" -> looks up translations['create_area'] from common.php
 * - "View Area" -> "view_area" -> looks up translations['view_area'] from common.php
 */
function convertToTranslationKey(title: string): string {
    // If already a translation key (lowercase with underscores), return as is
    if (/^[a-z][a-z0-9_]*$/.test(title)) {
        return title;
    }
    
    // Convert common patterns to match keys in common.php files
    let key = title.toLowerCase();
    
    // Handle common patterns
    key = key
        .replace(/\s+/g, '_')  // Replace spaces with underscores
        .replace(/[^a-z0-9_]/g, '');  // Remove special characters
    
    return key;
}

export function Breadcrumbs({
    breadcrumbs,
}: {
    breadcrumbs: BreadcrumbItemType[];
}) {
    // useTranslation hook uses translations from lang/en/common.php and lang/ar/common.php
    // These are provided via HandleInertiaRequests middleware: translations => __('common')
    const { t, locale } = useTranslation();
    const { isRTL } = useRTL();
    const { translations } = usePage<SharedData>().props;
    
    return (
        <>
            {breadcrumbs.length > 0 && (
                <Breadcrumb className={isRTL ? 'rtl-breadcrumb' : ''}>
                    <BreadcrumbList className={isRTL ? 'flex-row-reverse' : ''}>
                        {breadcrumbs.map((item, index) => {
                            const isLast = index === breadcrumbs.length - 1;
                            // Convert title to translation key (e.g., "Dashboard" -> "dashboard")
                            // Then look up in translations object from common.php files
                            const translationKey = convertToTranslationKey(item.title);
                            let translatedTitle = t(translationKey);
                            
                            // Fallback: If translation is missing or returns empty, use original title
                            // Check if translation exists in the translations object
                            const hasTranslation = translations && translations[translationKey] && translations[translationKey].trim() !== '';
                            
                            if (!hasTranslation || !translatedTitle || translatedTitle.trim() === '') {
                                // Format the original title nicely as fallback
                                translatedTitle = item.title
                                    .replace(/_/g, ' ')
                                    .split(' ')
                                    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
                                    .join(' ');
                            }
                            
                            return (
                                <Fragment key={index}>
                                    <BreadcrumbItem>
                                        {isLast ? (
                                            <BreadcrumbPage>
                                                {translatedTitle}
                                            </BreadcrumbPage>
                                        ) : (
                                            <BreadcrumbLink asChild>
                                                <Link href={item.href}>
                                                    {translatedTitle}
                                                </Link>
                                            </BreadcrumbLink>
                                        )}
                                    </BreadcrumbItem>
                                    {!isLast && <BreadcrumbSeparator />}
                                </Fragment>
                            );
                        })}
                    </BreadcrumbList>
                </Breadcrumb>
            )}
        </>
    );
}
