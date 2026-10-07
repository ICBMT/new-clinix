import { ActivityLogCards } from '@/components/dashboard/activity-log-cards';
import { SystemPerformance } from '@/components/dashboard/system-performance';
import { DashboardHeader } from '@/components/dashboard/dashboard-header';
import { DashboardStatsSection } from '@/components/dashboard/dashboard-stats-section';
import { DashboardChartsSection } from '@/components/dashboard/dashboard-charts-section';
import AppLayout from '@/layouts/app-layout';
import { useTranslation } from '@/hooks/use-translation';
import { useRTL } from '@/hooks/use-rtl';
import { useRTLInit } from '@/hooks/use-rtl-init';
import { usePermissions } from '@/hooks/use-permissions';
import { WebPushNotificationButton } from '@/components/web-push-notification-button';
import { index as dashboard } from '@/routes/dashboard';
import { type BreadcrumbItem } from '@/types';
import { Head, usePage } from '@inertiajs/react';
import { type SharedData } from '@/types';
import { useEffect } from 'react';
import { autoSetupNotifications, resetAutoSetup } from '@/utils/auto-notification-setup';
import { cn } from '@/lib/utils';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Dashboard',
        href: dashboard.url(),
    },
];

interface DashboardStats {
    total_users?: number;
    user_change?: number;
    user_change_type?: 'increase' | 'decrease';
    total_vendors?: number;
    vendor_change?: number;
    vendor_change_type?: 'increase' | 'decrease';
    total_clinics?: number;
    clinic_change?: number;
    clinic_change_type?: 'increase' | 'decrease';
    total_bookings?: number;
    booking_change?: number;
    booking_change_type?: 'increase' | 'decrease';
    total_revenue?: number;
    revenue_change?: number;
    revenue_change_type?: 'increase' | 'decrease';
    total_earnings?: number;
    earnings_change?: number;
    earnings_change_type?: 'increase' | 'decrease';
    pending_vendors?: number;
    today_registrations?: number;
    pending_bookings?: number;
    total_services?: number;
    service_change?: number;
    service_change_type?: 'increase' | 'decrease';
    active_services?: number;
    total_treatments?: number;
    treatment_change?: number;
    treatment_change_type?: 'increase' | 'decrease';
    active_treatments?: number;
    pending_clinics?: number;
}

interface ChartData {
    labels: string[];
    data: number[];
}

interface DashboardCharts {
    user_activity?: ChartData;
    booking_statistics?: ChartData;
    revenue_statistics?: ChartData;
    earnings_statistics?: ChartData;
}

interface ActivityItem {
    id: number | string;
    log_name?: string;
    event?: string;
    type?: 'user' | 'system' | 'booking' | 'vendor';
    title?: string;
    description: string;
    created_at: string;
    timestamp?: string;
    causer?: {
        id: number;
        name: string;
        email?: string;
    };
    subject?: {
        id: number;
        name?: string;
        email?: string;
        title?: string;
    };
    user?: string;
    status?: 'success' | 'warning' | 'error' | 'info';
}

interface DashboardProps {
    stats: DashboardStats;
    charts: DashboardCharts;
    activities: ActivityItem[];
    isClinicUser?: boolean;
    systemPerformance?: {
        cpu_usage?: { value: number; max: number; unit: string; status: string };
        memory_usage?: { value: number; max: number; unit: string; status: string; raw_value?: string; raw_max?: string };
        disk_usage?: { value: number; max: number; unit: string; status: string; raw_value?: string; raw_max?: string };
        active_sessions?: { value: number; max: number; unit: string; status: string };
        response_time?: { value: number; max: number; unit: string; status: string };
        database_queries?: { value: number; max: number; unit: string; status: string; raw_value?: number };
        system_status?: string;
        last_updated?: string;
    };
}

export default function Dashboard({ stats, charts, activities, isClinicUser = false, systemPerformance }: DashboardProps) {
    useRTLInit();
    const { t, locale } = useTranslation();
    const page = usePage<SharedData>();
    const { locale: pageLocale } = page.props;
    const isRTL = pageLocale === 'ar';
    const dir = isRTL ? 'rtl' : 'ltr';
    const { flexDirection, iconMargin } = useRTL();
    const { can, isSuperAdmin } = usePermissions();

    // Automatically setup notifications after login
    useEffect(() => {
        console.log('Dashboard: useEffect triggered, resetting auto-setup...');
        // Reset auto-setup on dashboard load to ensure it runs after login
        // This is important because sessionStorage might persist across page loads
        resetAutoSetup();

        // Wait a bit for the page to fully load and Firebase to initialize
        const timer = setTimeout(() => {
            console.log('Dashboard: Calling autoSetupNotifications...');
            autoSetupNotifications().catch(error => {
                console.error('Dashboard: Auto-setup failed:', error);
            });
        }, 1500); // Delay to ensure everything is loaded

        return () => clearTimeout(timer);
    }, []);

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={t('dashboard')} />
            <div className={cn("flex h-full flex-1 flex-col gap-6 overflow-x-auto rounded-xl p-6", isRTL ? '!text-right' : '!text-left')} dir={dir}>
                {/* Header */}
                <div className={cn("flex items-center justify-between gap-4", flexDirection)} dir={dir}>
                    <div className={cn("flex-1", isRTL ? '!text-right' : '!text-left')} dir={dir}>
                        <DashboardHeader 
                            pendingVendors={stats.pending_vendors}
                            todayRegistrations={stats.today_registrations}
                        />
                    </div>
                    <div className={cn("flex items-center gap-3 flex-shrink-0", flexDirection)} dir={dir}>
                        <WebPushNotificationButton 
                            variant="outline" 
                            size="sm" 
                            showLabel={true}
                            autoRequest={true}
                        />
                    </div>
                </div>

                {/* Stats Cards */}
                {can('dashboard.highlights') && <DashboardStatsSection stats={stats} isClinicUser={isClinicUser} />}

                {/* Charts Row */}
                {(can('dashboard.user-activity') || can('dashboard.bookings-overview')) && (
                    <DashboardChartsSection charts={charts} isClinicUser={isClinicUser} />
                )}

                {/* Bottom Row */}
                <div className={cn("grid gap-6 lg:grid-cols-3", isRTL ? '!text-right' : '!text-left')} dir={dir}>
                    {can('dashboard.recent-activities') && (
                        <ActivityLogCards
                            title={t('recent_activity')}
                            activities={activities}
                            maxItems={5}
                            className="lg:col-span-2"
                            showViewAll={can('activity-logs.view')}
                        />
                    )}
                    
                    {can('dashboard.system-performance') && isSuperAdmin && (
                        <SystemPerformance 
                            metrics={systemPerformance} 
                            className={can('dashboard.recent-activities') ? '' : 'lg:col-span-3'}
                        />
                    )}
                </div>
            </div>
        </AppLayout>
    );
}
