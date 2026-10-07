import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Clock, User, Activity } from 'lucide-react';
import { Link } from '@inertiajs/react';
import { useTranslation } from '@/hooks/use-translation';
import { useRTL } from '@/hooks/use-rtl';

interface ActivityItem {
    id: string;
    type: 'user' | 'system' | 'booking' | 'vendor';
    title: string;
    description: string;
    timestamp: string;
    user?: string;
    status?: 'success' | 'warning' | 'error' | 'info';
}

interface ActivityLogProps {
    title: string;
    activities: ActivityItem[];
    className?: string;
    showViewAll?: boolean;
    maxItems?: number;
}

export function ActivityLog({ 
    title, 
    activities, 
    className, 
    showViewAll = true, 
    maxItems = 5 
}: ActivityLogProps) {
    const { t, locale } = useTranslation();
    const { isRTL } = useRTL();
    const isRtl = isRTL;
    const displayActivities = activities.slice(0, maxItems);
    
    const getActivityIcon = (type: ActivityItem['type']) => {
        switch (type) {
            case 'user':
                return User;
            case 'system':
                return Activity;
            case 'booking':
                return Clock;
            case 'vendor':
                return User;
            default:
                return Activity;
        }
    };
    
    const getStatusColor = (status?: ActivityItem['status']) => {
        switch (status) {
            case 'success':
                return 'bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-300 border-green-200 dark:border-green-800';
            case 'warning':
                return 'bg-yellow-100 dark:bg-yellow-900/20 text-yellow-800 dark:text-yellow-300 border-yellow-200 dark:border-yellow-800';
            case 'error':
                return 'bg-red-100 dark:bg-red-900/20 text-red-800 dark:text-red-300 border-red-200 dark:border-red-800';
            case 'info':
                return 'bg-primary/10 text-primary border-primary/20';
            default:
                return 'bg-gray-100 dark:bg-gray-800/50 text-gray-800 dark:text-gray-300 border-gray-200 dark:border-gray-700';
        }
    };
    
    return (
        <Card className={cn('transition-all hover:shadow-md', className)}>
            <CardHeader className={cn("flex flex-row items-center justify-between space-y-0 pb-4", isRtl && "flex-row-reverse")}>
                <CardTitle className="text-lg font-semibold text-slate-900 dark:text-slate-100">{title}</CardTitle>
                {showViewAll && (
                    <Link href="/dashboard/activity-logs">
                        <Button variant="ghost" size="sm" className="text-primary hover:bg-primary/10">
                            {t('view_all')}
                        </Button>
                    </Link>
                )}
            </CardHeader>
            <CardContent>
                {displayActivities.length > 0 ? (
                    <div className="space-y-4">
                        {displayActivities.map((activity) => {
                            const Icon = getActivityIcon(activity.type);
                            return (
                                <div key={activity.id} className={cn("flex items-start", isRtl ? "space-x-reverse space-x-3" : "space-x-3")}>
                                    <div className="flex-shrink-0">
                                        <div className="w-8 h-8 rounded-full bg-gray-100 dark:bg-slate-700 flex items-center justify-center">
                                            <Icon className="h-4 w-4 text-muted-foreground dark:text-slate-300" />
                                        </div>
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className={cn("flex items-center justify-between", isRtl && "flex-row-reverse")}>
                                            <p className="text-sm font-medium text-foreground dark:text-slate-100 truncate">
                                                {activity.title}
                                            </p>
                                            {activity.status && (
                                                <Badge 
                                                    variant="outline" 
                                                    className={cn(isRtl ? 'mr-2' : 'ml-2', 'text-xs', getStatusColor(activity.status))}
                                                >
                                                    {activity.status}
                                                </Badge>
                                            )}
                                        </div>
                                        {activity.description && (
                                            <p className="text-sm text-muted-foreground dark:text-slate-400 truncate">
                                                {activity.description.replace(/<[^>]*>/g, '')}
                                            </p>
                                        )}
                                        <div className={cn("flex items-center mt-1 text-xs text-gray-400 dark:text-slate-500", isRtl && "flex-row-reverse")}>
                                            <Clock className={cn("h-3 w-3", isRtl ? "ml-1" : "mr-1")} />
                                            {activity.timestamp}
                                            {activity.user && (
                                                <>
                                                    <span className="mx-1">•</span>
                                                    <User className={cn("h-3 w-3", isRtl ? "ml-1" : "mr-1")} />
                                                    {activity.user}
                                                </>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                ) : (
                    <div className="text-center py-8 text-muted-foreground dark:text-slate-400">
                        <Activity className="h-12 w-12 mx-auto mb-2 text-gray-300 dark:text-slate-600" />
                        <p>{t('no_recent_activity')}</p>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
