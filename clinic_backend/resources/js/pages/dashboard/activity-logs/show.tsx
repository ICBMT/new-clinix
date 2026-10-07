import { type BreadcrumbItem } from '@/types';
import { Badge } from '@/components/ui/badge';
import { useTranslation } from '@/hooks/use-translation';
import { useRTL } from '@/hooks/use-rtl';
import { useRTLInit } from '@/hooks/use-rtl-init';
import { index as dashboard } from '@/routes/dashboard';
import { formatHumanDate } from '@/utils/date-utils';
import { cn } from '@/lib/utils';
import {
    Calendar,
    FileText,
    Mail,
    Target,
    User,
    Globe,
    Monitor,
    Smartphone,
    Tablet,
    Server,
    MapPin,
    Clock,
} from 'lucide-react';
import { ViewLayout, ViewDetailsSection, ViewField, ViewFieldWithIcon } from '@/components/view';

interface ActivityLog {
    id: number;
    log_name: string;
    description: string;
    event: string;
    created_at: string;
    causer?: {
        id: number;
        name: string;
        email: string;
    };
    subject?: {
        id: number;
        name?: string;
        email?: string;
        title?: string;
    };
    properties?: Record<string, unknown>;
}

interface ActivityLogShowPageProps {
    activityLog: ActivityLog;
}

export default function ActivityLogShow({
    activityLog,
}: ActivityLogShowPageProps) {
    useRTLInit();
    const { t, locale } = useTranslation();
    const { isRTL, dir, flexDirection } = useRTL();

    const breadcrumbs: BreadcrumbItem[] = [
        {
            title: t('dashboard'),
            href: dashboard.url(),
        },
        {
            title: t('activity_logs'),
            href: '/dashboard/activity-logs',
        },
        {
            title: t('activity_log_details'),
            href: '#',
        },
    ];

    const formatDate = (date: string) => {
        return new Date(date).toLocaleDateString(locale === 'ar' ? 'ar-SA' : 'en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    // Extract properties from activity log with proper type safety
    const properties = activityLog.properties || {};
    const deviceInfo: Record<string, unknown> = typeof properties.user_agent_parsed === 'object' && properties.user_agent_parsed !== null 
        ? (properties.user_agent_parsed as Record<string, unknown>)
        : {};
    
    // Helper to get device icon
    const getDeviceIcon = (deviceType?: string) => {
        const type = String(deviceType || '').toLowerCase();
        if (type === 'mobile') return Smartphone;
        if (type === 'tablet') return Tablet;
        return Monitor;
    };

    const DeviceIcon = getDeviceIcon(String(properties.device_type || ''));

    // Helper to safely get string value from properties
    const getPropertyString = (key: string, fallback = ''): string => {
        const value = properties[key];
        return value ? String(value) : fallback;
    };

    // Helper to safely get string value from deviceInfo
    const getDeviceInfoString = (key: string, fallback = ''): string => {
        const value = deviceInfo[key];
        return value ? String(value) : fallback;
    };

    // Format event name - if translation exists use it, otherwise format the event name nicely
    // Format event name - keep activity logs in English only, no translations
    const getEventDisplayName = (event: string | null | undefined): string => {
        // Handle null, undefined, or empty string
        if (!event || event.trim() === '') {
            // Try to get event from description if available (English only)
            if (activityLog.description) {
                const desc = activityLog.description.toLowerCase();
                
                // Check for common event patterns in description (English only)
                if (desc.includes('created') || desc.includes('create')) {
                    return 'Created';
                }
                if (desc.includes('updated') || desc.includes('update')) {
                    return 'Updated';
                }
                if (desc.includes('deleted') || desc.includes('delete')) {
                    return 'Deleted';
                }
                if (desc.includes('logged in') || desc.includes('login')) {
                    return 'Login';
                }
                if (desc.includes('logged out') || desc.includes('logout')) {
                    return 'Logout';
                }
                if (desc.includes('registered')) {
                    return 'Registered';
                }
                if (desc.includes('approved')) {
                    return 'Approved';
                }
                if (desc.includes('rejected')) {
                    return 'Rejected';
                }
                if (desc.includes('viewed')) {
                    return 'Viewed';
                }
            }
            
            // If we still don't have an event, try to use log_name and format it nicely
            if (activityLog.log_name) {
                const formatted = activityLog.log_name
                    .split('_')
                    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
                    .join(' ');
                if (formatted && formatted.length > 1) {
                    return formatted;
                }
            }
            
            // Final fallback - use a generic activity label (English only)
            return 'Activity';
        }
        
        // Map common events to English display names (no translation)
        const eventMap: Record<string, string> = {
            'created': 'Created',
            'updated': 'Updated',
            'deleted': 'Deleted',
            'login': 'Login',
            'logout': 'Logout',
            'registered': 'Registered',
            'password_reset': 'Password Reset',
            'email_verification': 'Email Verification',
            'approved': 'Approved',
            'rejected': 'Rejected',
            'viewed': 'Viewed',
            'store': 'Created',
            'update': 'Updated',
            'destroy': 'Deleted',
            'edit': 'Updated',
            'save': 'Updated',
            'activate': 'Activated',
            'deactivate': 'Deactivated',
            'toggle': 'Toggled',
            'cancel': 'Cancelled',
            'complete': 'Completed',
            'confirm': 'Confirmed',
        };
        
        const eventLower = event.toLowerCase().trim();
        if (eventMap[eventLower]) {
            return eventMap[eventLower];
        }
        
        // Otherwise, format the event name nicely in English
        const formatted = event
            .split('_')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
            .join(' ')
            .replace(/unknown/gi, '')
            .trim();
        
        // If formatted result is empty or just whitespace, use a fallback
        if (!formatted || formatted.length === 0) {
            return activityLog.log_name 
                ? activityLog.log_name
                    .split('_')
                    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
                    .join(' ')
                : 'Activity';
        }
        
        return formatted;
    };

    return (
        <ViewLayout
            breadcrumbs={breadcrumbs}
            title={t('activity_log_details')}
            description={t('view_detailed_activity_information')}
            backUrl="/dashboard/activity-logs"
            headTitle={`${t('activity_log_details')} - ${activityLog.description ? activityLog.description.replace(/<[^>]*>/g, '').substring(0, 50) : ''}`}
        >
            <div className={cn("space-y-6", isRTL ? '!text-right' : '!text-left')} dir={dir}>
                {/* Activity Summary Card */}
                <div className={cn("rounded-lg bg-muted/50 dark:bg-muted/30 p-6 border border-border", isRTL ? '!text-right' : '!text-left')} dir={dir}>
                    <div className={cn("flex items-start gap-4", flexDirection)} dir={dir}>
                        <div className="flex-shrink-0 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 dark:bg-primary/20">
                            <FileText className="h-8 w-8 text-primary" />
                        </div>
                        <div className="flex-1 min-w-0">
                            <h3 className={cn("text-lg font-semibold text-foreground break-words overflow-wrap-anywhere whitespace-pre-wrap line-clamp-3", isRTL ? '!text-right' : '!text-left')} dir={dir}>
                                {activityLog.description ? activityLog.description.replace(/<[^>]*>/g, '').substring(0, 200) + (activityLog.description.replace(/<[^>]*>/g, '').length > 200 ? '...' : '') : ''}
                            </h3>
                            <div className={cn("mt-3 flex items-center gap-2 flex-wrap", flexDirection)} dir={dir}>
                                <Badge
                                    variant="secondary"
                                    className={cn("bg-primary dark:bg-primary/80 px-2 py-1 text-xs text-primary-foreground transition-colors hover:bg-primary/90 flex-shrink-0", isRTL ? '!text-right' : '!text-left')}
                                    dir={dir}
                                >
                                    {getEventDisplayName(activityLog.event)}
                                </Badge>
                                <span className={cn("text-sm text-muted-foreground flex-shrink-0", isRTL ? '!text-right' : '!text-left')} dir={dir}>•</span>
                                <div className={cn("flex items-center gap-1 flex-shrink-0", flexDirection)} dir={dir}>
                                    <Calendar className="h-4 w-4 text-muted-foreground" />
                                    <span className={cn("text-sm text-muted-foreground whitespace-nowrap", isRTL ? '!text-right' : '!text-left')} dir={dir}>
                                        {formatHumanDate(activityLog.created_at, t)}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Description - Scrollable section for long content */}
                {activityLog.description && (
                    <ViewDetailsSection title={t('description')} icon={FileText}>
                        <div className={cn(
                            "rounded-lg bg-muted/50 dark:bg-muted/30 p-4 border border-border",
                            "max-h-[600px] overflow-y-auto overflow-x-hidden",
                            "scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-600 scrollbar-track-transparent",
                            isRTL ? '!text-right' : '!text-left'
                        )} dir={dir} style={{
                            scrollbarWidth: 'thin',
                            scrollbarColor: 'rgb(209 213 219) transparent'
                        }}>
                            <div className={cn(
                                "text-sm text-foreground break-words overflow-wrap-anywhere whitespace-pre-wrap leading-relaxed",
                                "prose prose-sm dark:prose-invert max-w-none",
                                isRTL ? '!text-right prose-rtl' : '!text-left'
                            )} dir={dir}>
                                {activityLog.description.replace(/<[^>]*>/g, '')}
                            </div>
                        </div>
                    </ViewDetailsSection>
                )}

                {/* Activity Information */}
                <ViewDetailsSection title={t('activity_information')}>
                    <div className={cn("grid grid-cols-1 gap-6 md:grid-cols-2", isRTL ? '!text-right' : '!text-left')} dir={dir}>
                        <ViewField
                            label={t('event')}
                            value={
                                <Badge
                                    variant="secondary"
                                    className={cn("bg-primary dark:bg-primary/80 px-2 py-1 text-xs text-primary-foreground", isRTL ? '!text-right' : '!text-left')}
                                    dir={dir}
                                >
                                    {getEventDisplayName(activityLog.event)}
                                </Badge>
                            }
                            icon={FileText}
                        />
                        <ViewField
                            label={t('log_name')}
                            value={
                                <Badge
                                    variant="secondary"
                                    className={cn("bg-primary dark:bg-primary/80 px-2 py-1 text-xs text-primary-foreground", isRTL ? '!text-right' : '!text-left')}
                                    dir={dir}
                                >
                                    {activityLog.log_name}
                                </Badge>
                            }
                        />
                        <ViewFieldWithIcon
                            label={t('created_at')}
                            value={formatDate(activityLog.created_at)}
                            icon={Calendar}
                        />
                        <ViewFieldWithIcon
                            label={t('performed_by')}
                            value={activityLog.causer?.name || t('system')}
                            icon={User}
                        />
                        <ViewFieldWithIcon
                            label={t('target')}
                            value={
                                activityLog.subject?.name ||
                                activityLog.subject?.title ||
                                activityLog.subject?.email ||
                                t('n_a')
                            }
                            icon={Target}
                        />
                    </div>
                </ViewDetailsSection>

                {/* User Information */}
                {activityLog.causer && (
                    <ViewDetailsSection title={t('user_information')} icon={User}>
                        <div className={cn("grid grid-cols-1 gap-6 md:grid-cols-2", isRTL ? '!text-right' : '!text-left')} dir={dir}>
                            <ViewFieldWithIcon
                                label={t('user_name')}
                                value={String(activityLog.causer.name || '')}
                                icon={User}
                            />
                            <ViewFieldWithIcon
                                label={t('email')}
                                value={String(activityLog.causer.email || t('n_a'))}
                                icon={Mail}
                            />
                        </div>
                    </ViewDetailsSection>
                )}

                {/* Device & Network Information */}
                <ViewDetailsSection title={t('device_network_information')} icon={DeviceIcon}>
                    <div className={cn("grid grid-cols-1 gap-6 md:grid-cols-2", isRTL ? '!text-right' : '!text-left')} dir={dir}>
                        {/* IP Address */}
                        {getPropertyString('ip_address') && (
                            <ViewFieldWithIcon
                                label={t('ip_address')}
                                value={getPropertyString('ip_address')}
                                icon={MapPin}
                            />
                        )}
                        
                        {/* Device Name */}
                        {(getPropertyString('device_name') || getDeviceInfoString('device_name')) && (
                            <ViewFieldWithIcon
                                label={t('device_name')}
                                value={getPropertyString('device_name') || getDeviceInfoString('device_name')}
                                icon={DeviceIcon}
                            />
                        )}
                        
                        {/* Device Type */}
                        {(getPropertyString('device_type') || getDeviceInfoString('device_type')) && (
                            <ViewFieldWithIcon
                                label={t('device_type')}
                                value={getPropertyString('device_type') || getDeviceInfoString('device_type')}
                                icon={DeviceIcon}
                            />
                        )}
                        
                        {/* Operating System */}
                        {(() => {
                            const os = getPropertyString('os') || getDeviceInfoString('os');
                            const osVersion = getPropertyString('os_version') || getDeviceInfoString('os_version');
                            const osValue = os ? (osVersion ? `${os} ${osVersion}` : os) : t('n_a');
                            return (
                                <ViewFieldWithIcon
                                    label={t('operating_system')}
                                    value={osValue}
                                    icon={Monitor}
                                />
                            );
                        })()}
                        
                        {/* Browser */}
                        {(() => {
                            const browser = getPropertyString('browser') || getDeviceInfoString('browser');
                            const browserVersion = getPropertyString('browser_version') || getDeviceInfoString('browser_version');
                            const browserValue = browser ? (browserVersion ? `${browser} ${browserVersion}` : browser) : t('n_a');
                            return (
                                <ViewFieldWithIcon
                                    label={t('browser')}
                                    value={browserValue}
                                    icon={Globe}
                                />
                            );
                        })()}
                        
                        {/* User Agent */}
                        {getPropertyString('user_agent') && (
                            <ViewField
                                label={t('user_agent')}
                                spanCols={2}
                                value={
                                    <div className={cn("rounded-lg bg-muted/50 dark:bg-muted/30 p-3 border border-border", isRTL ? '!text-right' : '!text-left')} dir={dir}>
                                        <code className={cn("text-xs break-all text-foreground", isRTL ? '!text-right' : '!text-left')} dir="ltr">
                                            {getPropertyString('user_agent')}
                                        </code>
                                    </div>
                                }
                            />
                        )}
                    </div>
                </ViewDetailsSection>

                {/* Request Information */}
                <ViewDetailsSection title={t('request_information')} icon={Globe}>
                    <div className={cn("grid grid-cols-1 gap-6 md:grid-cols-2", isRTL ? '!text-right' : '!text-left')} dir={dir}>
                        {/* URL */}
                        {getPropertyString('url') && (
                            <ViewField
                                label={t('url')}
                                spanCols={2}
                                value={
                                    <div className={cn("rounded-lg bg-muted/50 dark:bg-muted/30 p-3 border border-border", isRTL ? '!text-right' : '!text-left')} dir={dir}>
                                        <code className={cn("text-xs break-all text-foreground", isRTL ? '!text-right' : '!text-left')} dir="ltr">
                                            {getPropertyString('url')}
                                        </code>
                                    </div>
                                }
                            />
                        )}
                        
                        {/* Method */}
                        {getPropertyString('method') && (
                            <ViewFieldWithIcon
                                label={t('method')}
                                value={getPropertyString('method')}
                                icon={Server}
                            />
                        )}
                        
                        {/* Path */}
                        {getPropertyString('path') && (
                            <ViewField
                                label={t('path')}
                                value={
                                    <code className={cn("text-sm text-foreground font-mono", isRTL ? '!text-right' : '!text-left')} dir="ltr">
                                        {getPropertyString('path')}
                                    </code>
                                }
                            />
                        )}
                        
                        {/* Host */}
                        {getPropertyString('host') && (
                            <ViewField
                                label={t('host')}
                                value={getPropertyString('host')}
                            />
                        )}
                        
                        {/* Scheme */}
                        {getPropertyString('scheme') && (
                            <ViewField
                                label={t('scheme')}
                                value={getPropertyString('scheme')}
                            />
                        )}
                        
                        {/* Referer */}
                        {getPropertyString('referer') && (
                            <ViewField
                                label={t('referer')}
                                spanCols={2}
                                value={
                                    <code className={cn("text-xs break-all text-foreground font-mono", isRTL ? '!text-right' : '!text-left')} dir="ltr">
                                        {getPropertyString('referer')}
                                    </code>
                                }
                            />
                        )}
                    </div>
                </ViewDetailsSection>

                {/* Timestamp Information */}
                {getPropertyString('timestamp') && (
                    <ViewDetailsSection title={t('timestamp_information')} icon={Clock}>
                        <div className={cn("grid grid-cols-1 gap-6 md:grid-cols-2", isRTL ? '!text-right' : '!text-left')} dir={dir}>
                            <ViewField
                                label={t('timestamp')}
                                value={getPropertyString('timestamp')}
                            />
                            
                            {getPropertyString('timestamp_iso8601') && (
                                <ViewField
                                    label={t('timestamp_iso8601')}
                                    value={
                                        <code className={cn("text-sm text-foreground font-mono", isRTL ? '!text-right' : '!text-left')} dir="ltr">
                                            {getPropertyString('timestamp_iso8601')}
                                        </code>
                                    }
                                />
                            )}
                            
                            {getPropertyString('timestamp_unix') && (
                                <ViewField
                                    label={t('timestamp_unix')}
                                    value={getPropertyString('timestamp_unix')}
                                />
                            )}
                            
                            {getPropertyString('timezone') && (
                                <ViewField
                                    label={t('timezone')}
                                    value={getPropertyString('timezone')}
                                />
                            )}
                        </div>
                    </ViewDetailsSection>
                )}
            </div>
        </ViewLayout>
    );
}
