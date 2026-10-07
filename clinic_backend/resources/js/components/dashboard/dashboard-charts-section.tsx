import { ChartCard, SimpleLineChart, SimpleBarChart } from '@/components/dashboard/chart-card';
import { Button } from '@/components/ui/button';
import { useTranslation } from '@/hooks/use-translation';
import { usePermissions } from '@/hooks/use-permissions';
import { Link } from '@inertiajs/react';

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

interface DashboardChartsSectionProps {
    charts: DashboardCharts;
    isClinicUser?: boolean;
}

// Helper function to check if chart data is valid
function hasValidChartData(chartData?: ChartData): boolean {
    if (!chartData) return false;
    if (!chartData.data || !Array.isArray(chartData.data) || chartData.data.length === 0) return false;
    // Check if there's at least one non-zero value (convert to number first)
    const numericData = chartData.data.map(val => Number(val) || 0);
    return numericData.some(val => val > 0);
}

export function DashboardChartsSection({ charts, isClinicUser = false }: DashboardChartsSectionProps) {
    const { t } = useTranslation();
    const { can } = usePermissions();

    return (
        <div className="grid gap-6 lg:grid-cols-2">
            {!isClinicUser && can('dashboard.user-activity') && charts.user_activity && (
                <ChartCard
                    title={t('user_activity')}
                    action={
                        can('users.view') ? (
                        <Link href="/dashboard/users">
                            <Button variant="ghost" size="sm" className="text-primary hover:bg-primary/10">
                                {t('view_all')}
                            </Button>
                        </Link>
                        ) : undefined
                    }
                >
                    {hasValidChartData(charts.user_activity) ? (
                        <SimpleLineChart 
                            data={charts.user_activity.data} 
                            labels={charts.user_activity.labels}
                        />
                    ) : (
                        <div className="h-64 w-full flex items-center justify-center text-muted-foreground">
                            <p>{t('no_data_available')}</p>
                        </div>
                    )}
                </ChartCard>
            )}

            {can('dashboard.bookings-overview') && charts.booking_statistics && (
                <ChartCard
                    title={t('booking_statistics')}
                    action={
                        can('bookings.view') ? (
                            <Link href={isClinicUser ? "/dashboard/clinics-bookings" : "/dashboard/bookings"}>
                            <Button variant="ghost" size="sm" className="text-primary hover:bg-primary/10">
                                {t('view_all')}
                            </Button>
                        </Link>
                        ) : undefined
                    }
                >
                    {hasValidChartData(charts.booking_statistics) ? (
                        <SimpleBarChart 
                            data={charts.booking_statistics.data} 
                            labels={charts.booking_statistics.labels} 
                        />
                    ) : (
                        <div className="h-64 w-full flex items-center justify-center text-muted-foreground">
                            <p>{t('no_data_available')}</p>
                        </div>
                    )}
                </ChartCard>
            )}

            {can('dashboard.bookings-overview') && charts.revenue_statistics && (
                <ChartCard
                    title={t('revenue_statistics')}
                    action={
                        <Link href="/dashboard/transactions">
                            <Button variant="ghost" size="sm" className="text-primary hover:bg-primary/10">
                                {t('view_all')}
                            </Button>
                        </Link>
                    }
                >
                    {hasValidChartData(charts.revenue_statistics) ? (
                        <SimpleLineChart 
                            data={charts.revenue_statistics.data} 
                            labels={charts.revenue_statistics.labels}
                        />
                    ) : (
                        <div className="h-64 w-full flex items-center justify-center text-muted-foreground">
                            <p>{t('no_data_available')}</p>
                        </div>
                    )}
                </ChartCard>
            )}

            {can('dashboard.bookings-overview') && charts.earnings_statistics && (
                <ChartCard
                    title={t('earnings_statistics')}
                    action={
                        can('earnings.view') ? (
                        <Link href="/dashboard/earnings">
                            <Button variant="ghost" size="sm" className="text-primary hover:bg-primary/10">
                                {t('view_all')}
                            </Button>
                        </Link>
                        ) : undefined
                    }
                >
                    {hasValidChartData(charts.earnings_statistics) ? (
                        <SimpleLineChart 
                            data={charts.earnings_statistics.data} 
                            labels={charts.earnings_statistics.labels}
                        />
                    ) : (
                        <div className="h-64 w-full flex items-center justify-center text-muted-foreground">
                            <p>{t('no_data_available')}</p>
                        </div>
                    )}
                </ChartCard>
            )}
        </div>
    );
}

