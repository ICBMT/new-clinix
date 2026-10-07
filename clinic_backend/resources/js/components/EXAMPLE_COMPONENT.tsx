/**
 * EXAMPLE COMPONENT - Dark Mode Best Practices
 * 
 * This component demonstrates proper dark mode implementation
 * with the purple gradient theme. Use this as a template for new components.
 */

import { usePage } from '@inertiajs/react';
import { themeClasses, getStatusClasses, getRTLClasses, transitions } from '@/utils/theme-utils';
import { cn } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CheckCircle, AlertCircle, Clock } from 'lucide-react';

interface ExampleComponentProps {
    title: string;
    description?: string;
    status?: 'success' | 'warning' | 'error' | 'info';
    className?: string;
}

export function ExampleComponent({ 
    title, 
    description, 
    status = 'info',
    className 
}: ExampleComponentProps) {
    const { rtl } = usePage().props;
    const rtlClasses = getRTLClasses(rtl as boolean);

    const getStatusIcon = () => {
        switch (status) {
            case 'success':
                return <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400" />;
            case 'warning':
                return <AlertCircle className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />;
            case 'error':
                return <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400" />;
            default:
                return <Clock className="h-5 w-5 text-primary" />;
        }
    };

    return (
        <Card className={cn(
            // Base card styling with dark mode support
            themeClasses.card,
            
            // Transitions
            transitions.default,
            
            // Custom classes
            className
        )}>
            <CardHeader className={cn(
                // Header styling
                'flex flex-row items-center justify-between space-y-0 pb-4',
                'border-b border-border/50 dark:border-border'
            )}>
                <div className="flex items-center gap-3">
                    {/* Icon with proper dark mode colors */}
                    <div className={cn(
                        'p-2 rounded-lg',
                        'bg-primary/10 dark:bg-primary/20',
                        transitions.colors
                    )}>
                        {getStatusIcon()}
                    </div>
                    
                    <div>
                        {/* Title with proper text colors */}
                        <CardTitle className={cn(
                            'text-lg font-semibold',
                            'text-foreground',
                            rtlClasses.textLeft
                        )}>
                            {title}
                        </CardTitle>
                        
                        {/* Description with muted text */}
                        {description && (
                            <p className={cn(
                                'text-sm',
                                'text-muted-foreground',
                                rtlClasses.textLeft
                            )}>
                                {description}
                            </p>
                        )}
                    </div>
                </div>

                {/* Status badge */}
                <Badge 
                    variant="outline" 
                    className={getStatusClasses(status)}
                >
                    {status}
                </Badge>
            </CardHeader>

            <CardContent className="pt-6">
                <div className="space-y-4">
                    {/* Content area with proper background */}
                    <div className={cn(
                        'p-4 rounded-lg',
                        'bg-muted/50 dark:bg-muted/30',
                        'border border-border',
                        transitions.default
                    )}>
                        <p className={cn(
                            'text-sm',
                            themeClasses.textForeground
                        )}>
                            This is an example of properly styled content that works in both light and dark modes.
                        </p>
                    </div>

                    {/* Action buttons */}
                    <div className={cn(
                        'flex gap-2',
                        rtl ? 'flex-row-reverse' : 'flex-row'
                    )}>
                        <Button 
                            className={cn(
                                themeClasses.buttonPrimary,
                                transitions.default
                            )}
                        >
                            Primary Action
                        </Button>
                        
                        <Button 
                            variant="outline"
                            className={cn(
                                'border-border',
                                'hover:bg-muted',
                                transitions.default
                            )}
                        >
                            Secondary Action
                        </Button>
                    </div>

                    {/* Stats grid with dark mode support */}
                    <div className="grid grid-cols-3 gap-4">
                        {[
                            { label: 'Total', value: '1,234', change: '+12%' },
                            { label: 'Active', value: '856', change: '+5%' },
                            { label: 'Pending', value: '378', change: '+7%' },
                        ].map((stat, index) => (
                            <div
                                key={index}
                                className={cn(
                                    'p-3 rounded-lg',
                                    'bg-background dark:bg-card',
                                    'border border-border',
                                    'hover:shadow-sm',
                                    transitions.default
                                )}
                            >
                                <p className={cn(
                                    'text-xs font-medium',
                                    themeClasses.textMuted
                                )}>
                                    {stat.label}
                                </p>
                                <p className={cn(
                                    'text-xl font-bold mt-1',
                                    themeClasses.textForeground
                                )}>
                                    {stat.value}
                                </p>
                                <p className={cn(
                                    'text-xs mt-1',
                                    'text-green-600 dark:text-green-400'
                                )}>
                                    {stat.change}
                                </p>
                            </div>
                        ))}
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}

// Export for use in other components
export default ExampleComponent;

