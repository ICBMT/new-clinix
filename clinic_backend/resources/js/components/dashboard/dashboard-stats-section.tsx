import { StatsCard } from '@/components/dashboard/stats-card';
import { useTranslation } from '@/hooks/use-translation';
import { usePermissions } from '@/hooks/use-permissions';
import { 
    Users, 
    Building2, 
    Calendar, 
    DollarSign,
    Package,
    Clock,
} from 'lucide-react';
import { formatCurrency } from '@/utils/currency-utils';

interface DashboardStats {
    // Admin stats
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
    
    // Earnings (for clinic users)
    total_earnings?: number;
    earnings_change?: number;
    earnings_change_type?: 'increase' | 'decrease';
    
    // Clinic/Vendor stats
    pending_bookings?: number;
    total_services?: number;
    service_change?: number;
    service_change_type?: 'increase' | 'decrease';
    
    active_services?: number;
    
    // Clinic-specific stats
    total_treatments?: number;
    treatment_change?: number;
    treatment_change_type?: 'increase' | 'decrease';
    active_treatments?: number;
    
    pending_clinics?: number;
    today_registrations?: number;
}

interface DashboardStatsSectionProps {
    stats: DashboardStats;
    isClinicUser?: boolean;
}

export function DashboardStatsSection({ stats, isClinicUser = false }: DashboardStatsSectionProps) {
    const { t } = useTranslation();
    const { can } = usePermissions();

    const formatNumber = (num: number | undefined): string => {
        if (num === undefined || num === null) return '0';
        // Always use English number formatting (don't convert in Arabic)
        return new Intl.NumberFormat('en-US').format(num);
    };

    const formatRevenue = (amount: number | undefined): string => {
        if (amount === undefined || amount === null) return '0.00 KWD';
        // Always use KWD currency (don't translate to Arabic)
        // Always use English number formatting (don't convert in Arabic)
        const formattedAmount = new Intl.NumberFormat('en-US', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        }).format(amount);
        
        return `${formattedAmount} KWD`;
    };

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
            {can('dashboard.highlights') && (
                <>
                    {/* Users - Show for all users (admin sees all, clinic sees their clinic's users) */}
                    {stats.total_users !== undefined && (
                        <StatsCard
                            title={isClinicUser ? (t('clinic_users') || t('total_users')) : t('total_users')}
                            value={formatNumber(stats.total_users)}
                            change={
                                stats.user_change !== undefined
                                    ? {
                                          value: Math.abs(stats.user_change),
                                          type: stats.user_change_type || 'neutral',
                                      }
                                    : undefined
                            }
                            icon={Users}
                            iconColor="text-primary"
                            bgColor="bg-primary/10"
                        />
                    )}

                    {!isClinicUser && can('vendors.view') && stats.total_vendors !== undefined && (
                        <StatsCard
                            title={t('active_vendors')}
                            value={formatNumber(stats.total_vendors)}
                            change={
                                stats.vendor_change !== undefined
                                    ? {
                                          value: Math.abs(stats.vendor_change),
                                          type: stats.vendor_change_type || 'neutral',
                                      }
                                    : undefined
                            }
                            icon={Building2}
                            iconColor="text-primary"
                            bgColor="bg-primary/10"
                        />
                    )}

                    {!isClinicUser && can('vendors.view') && stats.total_clinics !== undefined && (
                        <StatsCard
                            title={t('total_clinics')}
                            value={formatNumber(stats.total_clinics)}
                            change={
                                stats.clinic_change !== undefined
                                    ? {
                                          value: Math.abs(stats.clinic_change),
                                          type: stats.clinic_change_type || 'neutral',
                                      }
                                    : undefined
                            }
                            icon={Building2}
                            iconColor="text-primary"
                            bgColor="bg-primary/10"
                        />
                    )}

                    {/* Clinic Stats - Treatments */}
                    {stats.total_treatments !== undefined && (
                        <StatsCard
                            title={t('total_treatments')}
                            value={formatNumber(stats.total_treatments)}
                            change={
                                stats.treatment_change !== undefined
                                    ? {
                                          value: Math.abs(stats.treatment_change),
                                          type: stats.treatment_change_type || 'neutral',
                                      }
                                    : undefined
                            }
                            icon={Package}
                            iconColor="text-primary"
                            bgColor="bg-primary/10"
                        />
                    )}

                    {stats.active_treatments !== undefined && (
                        <StatsCard
                            title={t('active_treatments')}
                            value={formatNumber(stats.active_treatments)}
                            icon={Package}
                            iconColor="text-primary"
                            bgColor="bg-primary/10"
                        />
                    )}

                    {/* Vendor/Service Stats - Only show for non-clinic users */}
                    {!isClinicUser && can('services.view') && stats.total_services !== undefined && (
                        <StatsCard
                            title={t('total_services')}
                            value={formatNumber(stats.total_services)}
                            change={
                                stats.service_change !== undefined
                                    ? {
                                          value: Math.abs(stats.service_change),
                                          type: stats.service_change_type || 'neutral',
                                      }
                                    : undefined
                            }
                            icon={Package}
                            iconColor="text-primary"
                            bgColor="bg-primary/10"
                        />
                    )}

                    {!isClinicUser && can('services.view') && stats.active_services !== undefined && (
                        <StatsCard
                            title={t('active_services')}
                            value={formatNumber(stats.active_services)}
                            icon={Package}
                            iconColor="text-primary"
                            bgColor="bg-primary/10"
                        />
                    )}

                    {/* Bookings */}
                    {can('bookings.view') && stats.total_bookings !== undefined && (
                        <StatsCard
                            title={t('total_bookings')}
                            value={formatNumber(stats.total_bookings)}
                            change={
                                stats.booking_change !== undefined
                                    ? {
                                          value: Math.abs(stats.booking_change),
                                          type: stats.booking_change_type || 'neutral',
                                      }
                                    : undefined
                            }
                            icon={Calendar}
                            iconColor="text-primary"
                            bgColor="bg-primary/10"
                        />
                    )}

                    {can('bookings.view') && stats.pending_bookings !== undefined && (
                        <StatsCard
                            title={t('pending_bookings')}
                            value={formatNumber(stats.pending_bookings)}
                            icon={Clock}
                            iconColor="text-primary"
                            bgColor="bg-primary/10"
                        />
                    )}

                    {/* Revenue */}
                    {stats.total_revenue !== undefined && (
                        <StatsCard
                            title={t('revenue')}
                            value={formatRevenue(stats.total_revenue)}
                            change={
                                stats.revenue_change !== undefined
                                    ? {
                                          value: Math.abs(stats.revenue_change),
                                          type: stats.revenue_change_type || 'neutral',
                                      }
                                    : undefined
                            }
                            icon={DollarSign}
                            iconColor="text-primary"
                            bgColor="bg-primary/10"
                        />
                    )}

                    {/* Earnings - Show for all users (clinic users and super admin) */}
                    {stats.total_earnings !== undefined && (
                        <StatsCard
                            title={t('total_earnings') || t('earnings')}
                            value={formatRevenue(stats.total_earnings)}
                            change={
                                stats.earnings_change !== undefined
                                    ? {
                                          value: Math.abs(stats.earnings_change),
                                          type: stats.earnings_change_type || 'neutral',
                                      }
                                    : undefined
                            }
                            icon={DollarSign}
                            iconColor="text-green-600"
                            bgColor="bg-green-100 dark:bg-green-900/30"
                        />
                    )}
                </>
            )}
        </div>
    );
}

