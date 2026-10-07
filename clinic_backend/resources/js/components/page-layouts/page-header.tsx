import { ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { useRTL } from '@/hooks/use-rtl';

interface PageHeaderProps {
    title: string;
    description?: string;
    actions?: ReactNode;
    className?: string;
}

export function PageHeader({ title, description, actions, className }: PageHeaderProps) {
    const { isRTL, flexDirection, textAlign } = useRTL();

    return (
        <div className={cn("flex items-center justify-between border-b pb-4", flexDirection, className)}>
            <div className={isRTL ? '!text-right' : '!text-left'}>
                <h1 className={cn("text-3xl font-bold text-foreground", isRTL ? '!text-right' : '!text-left')}>
                    {title}
                </h1>
                {description && (
                    <p className={cn("text-muted-foreground mt-1", isRTL ? '!text-right' : '!text-left')}>
                        {description}
                    </p>
                )}
            </div>
            {actions && (
                <div className={cn("flex items-center gap-3", flexDirection)}>
                    {actions}
                </div>
            )}
        </div>
    );
}




