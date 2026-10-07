import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { User, Target, Eye, Activity, Calendar } from 'lucide-react';
import { Link } from '@inertiajs/react';
import { useTranslation } from '@/hooks/use-translation';
import { useRTL } from '@/hooks/use-rtl';
import { useRTLInit } from '@/hooks/use-rtl-init';
import { usePermissions } from '@/hooks/use-permissions';
import { formatHumanDate } from '@/utils/date-utils';

interface ActivityLogItem {
    id: number | string;
    log_name?: string;
    event?: string;
    description: string;
    created_at: string;
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
}

interface ActivityLogCardsProps {
    title: string;
    activities: ActivityLogItem[];
    className?: string;
    showViewAll?: boolean;
    maxItems?: number;
}

export function ActivityLogCards({ 
    title, 
    activities, 
    className, 
    showViewAll = true, 
    maxItems = 5 
}: ActivityLogCardsProps) {
    useRTLInit();
    const { t } = useTranslation();
    const { isRTL, dir, textAlign, flexDirection } = useRTL();
    const { can } = usePermissions();
    const displayActivities = activities.slice(0, maxItems);
    
    const renderDescriptionWithBold = (description: string) => {
        if (!description) return '';

        const strippedDescription = description.replace(/<[^>]*>/g, '');

        // Build terms from translation keys to avoid hardcoded text
        const boldKeys = [
            'created',
            'updated',
            'deleted',
            'login',
            'logout',
            'registered',
            'reset',
            'verified',
        ];

        const escapeRegex = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

        const boldTerms = Array.from(new Set(boldKeys.flatMap((key) => {
            const translated = t(key);
            return [translated, key, key.replace(/_/g, ' ')];
        }).filter(Boolean)));

        const regex = new RegExp(`\\b(${boldTerms.map(escapeRegex).join('|')})\\b`, 'gi');

        const parts = strippedDescription.split(regex);
        return parts.map((part, index) => {
            if (boldTerms.some(term => term.toLowerCase() === part.toLowerCase())) {
                return <strong key={index} className="font-semibold">{part}</strong>;
            }
            return <span key={index}>{part}</span>;
        });
    };
    
    return (
        <Card className={cn('transition-all hover:shadow-md', className)} dir={dir}>
            <CardHeader className={cn("flex flex-row items-center justify-between pb-4 w-full", flexDirection)}>
                <CardTitle className={cn("text-lg font-semibold text-slate-900 dark:text-slate-100 flex-shrink-0", textAlign)}>{title}</CardTitle>
                {showViewAll && can('activity-logs.view') && (
                    <Link href="/dashboard/activity-logs" className="flex-shrink-0">
                        <Button variant="ghost" size="sm" className={cn("text-primary hover:bg-primary/10", flexDirection)}>
                            {t('view_all')}
                        </Button>
                    </Link>
                )}
            </CardHeader>
            <CardContent className={cn(textAlign)}>
                {displayActivities.length > 0 ? (
                    <div className="space-y-3">
                        {displayActivities.map((activity) => {
                            const eventType = activity.event || activity.log_name || 'system';
                            // Remove underscores and capitalize first letter
                            const formattedEventType = eventType
                                .split('_')
                                .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
                                .join(' ');
                            const performerName = activity.causer?.name || activity.causer?.email || t('system');
                            const targetName = activity.subject?.name || activity.subject?.title || activity.subject?.email || t('n_a');
                            
                            return (
                                <div 
                                    key={activity.id} 
                                    className={cn("flex items-start gap-4 p-3 border rounded-lg", isRTL ? "flex-row-reverse" : "flex-row")}
                                    dir={dir}
                                >
                                    {/* View Action - Appears on right in LTR, left in RTL */}
                                    {can('activity-logs.show') && (
                                        <div className={cn("flex-shrink-0", isRTL ? "order-1" : "order-2")}>
                                            <Link href={`/dashboard/activity-logs/${activity.id}`}>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    className="text-purple-600 dark:text-purple-400 hover:text-purple-500 dark:hover:text-purple-300 hover:bg-purple-50 dark:hover:bg-purple-900/20"
                                                >
                                                    <Eye className="h-4 w-4" />
                                                </Button>
                                            </Link>
                                        </div>
                                    )}
                                    
                                    {/* Event Content - Appears on left in LTR, right in RTL */}
                                    <div className={cn("flex-1 min-w-0 overflow-hidden", isRTL ? "order-2" : "order-1")}>
                                        {/* Event Header - Inline */}
                                        <div className={cn("flex items-start gap-2 mb-2", flexDirection)}>
                                            <Badge variant="secondary" className={cn("text-xs px-2 py-1 flex-shrink-0", textAlign)}>
                                                {t(activity.log_name) || formattedEventType}
                                            </Badge>
                                            <span className={cn("text-sm text-muted-foreground break-words overflow-wrap-anywhere whitespace-pre-wrap", textAlign)}>
                                                {renderDescriptionWithBold(activity.description)}
                                            </span>
                                        </div>

                                        {/* Metadata - Horizontal Layout */}
                                        <div className={cn("flex items-center gap-4 text-xs text-muted-foreground", flexDirection)}>
                                            {/* Performed By */}
                                            <div className={cn("flex items-center gap-1", flexDirection)}>
                                                <User className="h-3 w-3" />
                                                <span className={cn("text-gray-400", textAlign)}>{t('performed_by')}:</span>
                                                <span className={cn("font-medium text-foreground", textAlign)}>
                                                    {performerName}
                                                </span>
                                            </div>
                                            <span>•</span>
                                            {/* Target */}
                                            <div className={cn("flex items-center gap-1", flexDirection)}>
                                                <Target className="h-3 w-3" />
                                                <span className={cn("text-gray-400", textAlign)}>{t('target')}:</span>
                                                <span className={cn("font-medium text-foreground", textAlign)}>
                                                    {targetName}
                                                </span>
                                            </div>
                                            <span>•</span>
                                            {/* Performed At */}
                                            <div className={cn("flex items-center gap-1", flexDirection)}>
                                                <Calendar className="h-3 w-3" />
                                                <span className={cn("text-gray-400", textAlign)}>{t('performed_at')}:</span>
                                                <span className={cn("font-medium text-foreground", textAlign)}>
                                                    {formatHumanDate(activity.created_at, t)}
                                                </span>
                                            </div>
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

