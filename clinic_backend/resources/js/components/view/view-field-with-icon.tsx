import { type ReactNode } from 'react';
import { LucideIcon } from 'lucide-react';
import { useRTL } from '@/hooks/use-rtl';
import { usePage } from '@inertiajs/react';
import { type SharedData } from '@/types';
import { cn } from '@/lib/utils';

interface ViewFieldWithIconProps {
    label: string;
    value?: ReactNode;
    icon: LucideIcon;
    className?: string;
    valueClassName?: string;
    labelClassName?: string;
    spanCols?: 1 | 2;
    dir?: 'ltr' | 'rtl' | 'auto';
    emptyValue?: string;
}

export function ViewFieldWithIcon({
    label,
    value,
    icon: Icon,
    className,
    valueClassName,
    labelClassName,
    spanCols = 1,
    dir: fieldDir = 'auto',
    emptyValue = '—',
}: ViewFieldWithIconProps) {
    const page = usePage<SharedData>();
    const { locale: pageLocale } = page.props;
    const isRTL = pageLocale === 'ar';
    const dir = isRTL ? 'rtl' : 'ltr';
    const { flexDirection, textAlign, iconMargin } = useRTL();

    // Determine field direction
    const finalDir = fieldDir === 'auto' ? dir : fieldDir;

    return (
        <div 
            className={cn(
                "space-y-2",
                spanCols === 2 && "md:col-span-2",
                isRTL ? '!text-right' : '!text-left',
                className
            )}
            dir={finalDir}
        >
            <p className={cn("text-sm text-muted-foreground", isRTL ? '!text-right' : '!text-left', labelClassName)} dir={finalDir}>
                {label}
            </p>
            <div className={cn("flex items-center gap-2", flexDirection)} dir={finalDir}>
                <Icon className={cn("h-4 w-4 text-gray-400 dark:text-gray-500", iconMargin('sm'))} />
                <div className={cn("text-base font-medium text-foreground", isRTL ? '!text-right' : '!text-left', valueClassName)} dir={finalDir}>
                    {value !== null && value !== undefined && value !== '' ? value : emptyValue}
                </div>
            </div>
        </div>
    );
}





