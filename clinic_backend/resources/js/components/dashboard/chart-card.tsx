import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { useId } from 'react';
import { useTranslation } from '@/hooks/use-translation';

interface ChartCardProps {
    title: string;
    children: React.ReactNode;
    className?: string;
    action?: React.ReactNode;
}

export function ChartCard({ title, children, className, action }: ChartCardProps) {
    return (
        <Card className={cn('transition-all hover:shadow-md', className)}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
                <CardTitle className="text-lg font-semibold">{title}</CardTitle>
                {action}
            </CardHeader>
            <CardContent>
                {children}
            </CardContent>
        </Card>
    );
}

// Simple Line Chart Component
export function SimpleLineChart({ data, labels, className }: { data: number[]; labels?: string[]; className?: string }) {
    const { t } = useTranslation();
    const gradientId = useId();
    
    // Handle empty or invalid data
    if (!data || data.length === 0 || !Array.isArray(data)) {
        return (
            <div className={cn('h-64 w-full flex items-center justify-center text-muted-foreground', className)}>
                <p>{t('no_data_available')}</p>
            </div>
        );
    }
    
    // Check if all values are zero or invalid
    const numericData = data.map(val => Number(val) || 0);
    const hasValidData = numericData.some(val => val > 0);
    
    if (!hasValidData) {
        return (
            <div className={cn('h-64 w-full flex items-center justify-center text-muted-foreground', className)}>
                <p>{t('no_data_available')}</p>
            </div>
        );
    }
    
    // Ensure all values are numbers (already validated above)
    const max = Math.max(...numericData, 1);
    const min = Math.min(...numericData, 0);
    const range = max - min || 1;
    
    // Calculate points with padding for better visibility
    const padding = 5; // 5% padding on top and bottom
    const points = numericData.map((value, index) => {
        const x = numericData.length > 1 ? (index / (numericData.length - 1)) * 100 : 50;
        // Invert Y axis (SVG Y increases downward) and add padding
        const normalizedValue = range > 0 ? ((value - min) / range) : 0.5;
        const y = 100 - (padding + normalizedValue * (100 - padding * 2));
        return `${x},${y}`;
    }).join(' ');
    
    return (
        <div className={cn('h-64 w-full relative pb-8', className)}>
            <svg viewBox="0 0 100 100" className="h-full w-full" preserveAspectRatio="none" style={{ overflow: 'visible', paddingBottom: '20px' }}>
                <defs>
                    <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="#A8B5FF" />
                        <stop offset="100%" stopColor="#6B46C1" />
                    </linearGradient>
                </defs>
                {/* Background grid lines */}
                <line x1="0" y1="0" x2="100" y2="0" stroke="#e5e7eb" strokeWidth="0.2" />
                <line x1="0" y1="50" x2="100" y2="50" stroke="#e5e7eb" strokeWidth="0.2" />
                <line x1="0" y1="100" x2="100" y2="100" stroke="#e5e7eb" strokeWidth="0.2" />
                <polyline
                    fill="none"
                    stroke={`url(#${gradientId})`}
                    strokeWidth="1"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    points={points}
                />
                {numericData.map((value, index) => {
                    const x = numericData.length > 1 ? (index / (numericData.length - 1)) * 100 : 50;
                    const normalizedValue = range > 0 ? ((value - min) / range) : 0.5;
                    const y = 100 - (padding + normalizedValue * (100 - padding * 2));
                    return (
                        <circle
                            key={index}
                            cx={x}
                            cy={y}
                            r="1.5"
                            fill={`url(#${gradientId})`}
                            stroke="#fff"
                            strokeWidth="0.5"
                        />
                    );
                })}
            </svg>
            {labels && labels.length > 0 && labels.length === numericData.length && (
                <div className="absolute bottom-0 left-0 right-0 flex justify-between text-xs text-muted-foreground px-2 pb-2 pt-1 gap-1">
                    {labels.map((label, index) => (
                        <span key={index} className="truncate flex-1 text-center" style={{ marginTop: '4px', minWidth: 0 }}>{label}</span>
                    ))}
                </div>
            )}
        </div>
    );
}

// Simple Bar Chart Component
export function SimpleBarChart({ data, labels, className }: { data: number[]; labels?: string[]; className?: string }) {
    const { t } = useTranslation();
    
    // Handle empty or invalid data
    if (!data || data.length === 0 || !Array.isArray(data)) {
        return (
            <div className={cn('h-64 w-full flex items-center justify-center text-muted-foreground', className)}>
                <p>{t('no_data_available')}</p>
            </div>
        );
    }
    
    // Ensure all values are numbers
    const numericData = data.map(val => Number(val) || 0);
    
    // Check if all values are zero or invalid
    const hasValidData = numericData.some(val => val > 0);
    
    if (!hasValidData) {
        return (
            <div className={cn('h-64 w-full flex items-center justify-center text-muted-foreground', className)}>
                <p>{t('no_data_available')}</p>
            </div>
        );
    }
    
    const max = Math.max(...numericData, 1);
    
    return (
        <div className={cn('h-64 w-full flex flex-col', className)}>
            <div className="flex-1 flex items-end justify-between gap-2 px-2">
                {numericData.map((value, index) => {
                    const percentage = max > 0 ? (value / max) * 100 : 0;
                    return (
                        <div key={index} className="flex flex-col items-center justify-end flex-1 relative group min-w-0">
                            <div
                                className="w-full bg-primary-gradient rounded-t transition-all hover:opacity-80 min-h-[2px]"
                                style={{ height: `${Math.max(percentage, 1)}%` }}
                                title={labels?.[index] ? `${labels[index]}: ${value}` : String(value)}
                            />
                        </div>
                    );
                })}
            </div>
            {labels && labels.length > 0 && labels.length === numericData.length && (
                <div className="flex justify-between text-xs text-muted-foreground px-2 mt-3 pb-2 gap-1">
                    {labels.map((label, index) => (
                        <span key={index} className="transform -rotate-45 origin-left truncate flex-1 text-center whitespace-nowrap" style={{ minWidth: 0 }}>
                            {label}
                        </span>
                    ))}
                </div>
            )}
        </div>
    );
}
