import { type ReactNode } from 'react';
import { LucideIcon } from 'lucide-react';
import { useRTL } from '@/hooks/use-rtl';
import { usePage } from '@inertiajs/react';
import { type SharedData } from '@/types';
import { cn } from '@/lib/utils';

interface ViewDetailsSectionProps {
    title: string;
    icon?: LucideIcon;
    children: ReactNode;
    className?: string;
}

export function ViewDetailsSection({
    title,
    icon: Icon,
    children,
    className,
}: ViewDetailsSectionProps) {
    const page = usePage<SharedData>();
    const { locale: pageLocale } = page.props;
    const isRTL = pageLocale === 'ar';
    const dir = isRTL ? 'rtl' : 'ltr';
    const { flexDirection, iconMargin } = useRTL();

    return (
        <div className={cn("space-y-6", isRTL ? '!text-right' : '!text-left', className)} dir={dir}>
            {Icon ? (
                <div className={cn("flex items-center gap-3 mb-6", flexDirection)} dir={dir}>
                    <Icon className={cn("h-6 w-6 text-primary", iconMargin('md'))} />
                    <h2 className={cn("text-2xl font-semibold text-foreground", isRTL ? '!text-right' : '!text-left')} dir={dir}>
                        {title}
                    </h2>
                </div>
            ) : (
                <h2 className={cn("text-2xl font-semibold text-foreground mb-6", isRTL ? '!text-right' : '!text-left')} dir={dir}>
                    {title}
                </h2>
            )}
            {children}
        </div>
    );
}





