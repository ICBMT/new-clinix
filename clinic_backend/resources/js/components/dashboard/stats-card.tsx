import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { useTranslation } from '@/hooks/use-translation';
import { LucideIcon } from 'lucide-react';

interface StatsCardProps {
    title: string;
    value: string | number;
    change?: {
        value: number;
        type: 'increase' | 'decrease' | 'neutral';
    };
    icon: LucideIcon;
    iconColor?: string;
    bgColor?: string;
    className?: string;
}

export function StatsCard({
    title,
    value,
    change,
    icon: Icon,
    iconColor = 'text-primary',
    bgColor = 'bg-primary/10',
    className,
}: StatsCardProps) {
    const { t } = useTranslation();
    return (
        <Card className={cn('relative overflow-hidden transition-all hover:shadow-md hover:shadow-primary/10', className)}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground break-words">
                    {title}
                </CardTitle>
                <div className={cn('rounded-full p-2', bgColor)}>
                    <Icon className={cn('h-4 w-4', iconColor)} />
                </div>
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold break-words">{value}</div>
                {change && (
                    <div className="flex items-center gap-3 text-xs text-muted-foreground flex-wrap">
                        <Badge
                            variant={
                                change.type === 'increase'
                                    ? 'default'
                                    : change.type === 'decrease'
                                    ? 'destructive'
                                    : 'secondary'
                            }
                            className={cn(
                                "text-xs",
                                change.type === 'increase' && "bg-primary-gradient text-white border-0"
                            )}
                        >
                            {change.type === 'increase' && '+'}
                            {change.value}%
                        </Badge>
                        <span className="break-words">{t('from_last_month')}</span>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
