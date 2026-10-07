import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { useTranslation } from '@/hooks/use-translation';
import { 
    Server, 
    Database, 
    Cpu, 
    HardDrive, 
    Activity,
    Clock,
    Wifi,
    Users
} from 'lucide-react';

interface PerformanceMetric {
    label: string;
    value: number;
    max: number;
    unit: string;
    icon: React.ComponentType<{ className?: string }>;
    status: 'good' | 'warning' | 'critical';
    raw_value?: string;
    raw_max?: string;
}

interface SystemPerformanceProps {
    className?: string;
    metrics?: {
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

export function SystemPerformance({ className, metrics }: SystemPerformanceProps) {
    const { t } = useTranslation();
    
    // Use provided metrics or fallback to defaults
    const performanceMetrics: PerformanceMetric[] = metrics ? [
        {
            label: t('cpu_usage'),
            value: metrics.cpu_usage?.value ?? 0,
            max: metrics.cpu_usage?.max ?? 100,
            unit: metrics.cpu_usage?.unit ?? '%',
            icon: Cpu,
            status: (metrics.cpu_usage?.status ?? 'good') as 'good' | 'warning' | 'critical',
        },
        {
            label: t('memory_usage'),
            value: metrics.memory_usage?.value ?? 0,
            max: metrics.memory_usage?.max ?? 100,
            unit: metrics.memory_usage?.unit ?? '%',
            icon: Activity,
            status: (metrics.memory_usage?.status ?? 'good') as 'good' | 'warning' | 'critical',
            raw_value: metrics.memory_usage?.raw_value,
            raw_max: metrics.memory_usage?.raw_max,
        },
        {
            label: t('disk_usage'),
            value: metrics.disk_usage?.value ?? 0,
            max: metrics.disk_usage?.max ?? 100,
            unit: metrics.disk_usage?.unit ?? '%',
            icon: HardDrive,
            status: (metrics.disk_usage?.status ?? 'good') as 'good' | 'warning' | 'critical',
            raw_value: metrics.disk_usage?.raw_value,
            raw_max: metrics.disk_usage?.raw_max,
        },
        {
            label: t('active_sessions'),
            value: metrics.active_sessions?.value ?? 0,
            max: metrics.active_sessions?.max ?? 1000,
            unit: metrics.active_sessions?.unit ?? '',
            icon: Users,
            status: (metrics.active_sessions?.status ?? 'good') as 'good' | 'warning' | 'critical',
        },
        {
            label: t('response_time'),
            value: metrics.response_time?.value ?? 0,
            max: metrics.response_time?.max ?? 1000,
            unit: metrics.response_time?.unit ?? 'ms',
            icon: Clock,
            status: (metrics.response_time?.status ?? 'good') as 'good' | 'warning' | 'critical',
        },
        {
            label: t('database_queries'),
            value: metrics.database_queries?.value ?? 0,
            max: metrics.database_queries?.max ?? 100,
            unit: metrics.database_queries?.unit ?? '',
            icon: Database,
            status: (metrics.database_queries?.status ?? 'good') as 'good' | 'warning' | 'critical',
            raw_value: metrics.database_queries?.raw_value ? `${metrics.database_queries.raw_value} activities` : undefined,
        },
    ] : [
        {
            label: t('cpu_usage'),
            value: 45,
            max: 100,
            unit: '%',
            icon: Cpu,
            status: 'good',
        },
        {
            label: t('memory_usage'),
            value: 72,
            max: 100,
            unit: '%',
            icon: Activity,
            status: 'warning',
        },
        {
            label: t('disk_usage'),
            value: 38,
            max: 100,
            unit: '%',
            icon: HardDrive,
            status: 'good',
        },
        {
            label: t('active_sessions'),
            value: 234,
            max: 1000,
            unit: '',
            icon: Users,
            status: 'good',
        },
        {
            label: t('response_time'),
            value: 120,
            max: 1000,
            unit: 'ms',
            icon: Clock,
            status: 'good',
        },
    ];
    
    const getStatusColor = (status: PerformanceMetric['status']) => {
        switch (status) {
            case 'good':
                return 'text-green-600 bg-green-50 border-green-200 dark:bg-green-900/20 dark:text-green-300';
            case 'warning':
                return 'text-yellow-600 bg-yellow-50 border-yellow-200 dark:bg-yellow-900/20 dark:text-yellow-300';
            case 'critical':
                return 'text-red-600 bg-red-50 border-red-200 dark:bg-red-900/20 dark:text-red-300';
            default:
                return 'text-muted-foreground bg-gray-50 border-gray-200';
        }
    };
    
    const getProgressColor = (status: PerformanceMetric['status'], value: number, max: number) => {
        const percentage = (value / max) * 100;
        
        if (status === 'critical' || percentage > 90) {
            return 'bg-red-500';
        } else if (status === 'warning' || percentage > 70) {
            return 'bg-yellow-500';
        } else {
            return 'bg-green-500';
        }
    };
    
    const systemStatus = metrics?.system_status ?? 'healthy';
    const lastUpdated = metrics?.last_updated 
        ? new Date(metrics.last_updated).toLocaleTimeString() 
        : new Date().toLocaleTimeString();
    
    return (
        <Card className={cn('transition-all hover:shadow-md', className)}>
            <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                    <Server className="h-5 w-5" />
                    <span>{t('system_performance')}</span>
                </CardTitle>
            </CardHeader>
            <CardContent>
                <div className="space-y-6">
                    {performanceMetrics.map((metric, index) => {
                        const Icon = metric.icon;
                        const percentage = (metric.value / metric.max) * 100;
                        
                        return (
                            <div key={index} className="space-y-2">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center space-x-2">
                                        <Icon className="h-4 w-4 text-muted-foreground" />
                                        <span className="text-sm font-medium">{metric.label}</span>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                        <span className="text-sm font-semibold">
                                            {metric.raw_value || metric.value}{metric.unit}
                                        </span>
                                        {metric.raw_max && (
                                            <span className="text-xs text-muted-foreground">
                                                / {metric.raw_max}
                                            </span>
                                        )}
                                    </div>
                                </div>
                                <Progress 
                                    value={percentage} 
                                    className={cn('h-2', getProgressColor(metric.status, metric.value, metric.max))}
                                />
                                <div className="flex justify-between text-xs text-muted-foreground">
                                    <span>0{metric.unit}</span>
                                    <span>{metric.raw_max || metric.max}{metric.unit}</span>
                                </div>
                            </div>
                        );
                    })}
                </div>
                
                {/* System Status Summary */}
                <div className="mt-6 pt-4 border-t">
                    <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">{t('system_status')}</span>
                        <Badge className={cn(
                            'border',
                            systemStatus === 'healthy' && 'bg-green-100 text-green-800 border-green-200 dark:bg-green-900/20 dark:text-green-300',
                            systemStatus === 'warning' && 'bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900/20 dark:text-yellow-300',
                            systemStatus === 'critical' && 'bg-red-100 text-red-800 border-red-200 dark:bg-red-900/20 dark:text-red-300'
                        )}>
                            {systemStatus === 'healthy' ? t('healthy') : systemStatus === 'warning' ? t('warning') : t('critical')}
                        </Badge>
                    </div>
                    <div className="mt-2 text-xs text-muted-foreground">
                        {t('last_updated')}: {lastUpdated}
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}

