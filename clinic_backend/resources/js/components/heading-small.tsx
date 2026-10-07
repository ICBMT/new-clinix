import { useRTL } from '@/hooks/use-rtl';
import { cn } from '@/lib/utils';

export default function HeadingSmall({
    title,
    description,
}: {
    title: string;
    description?: string;
}) {
    const { isRTL, dir } = useRTL();
    
    return (
        <header className={cn(isRTL ? '!text-right' : '!text-left')} dir={dir}>
            <h3 className={cn("mb-0.5 text-base font-medium", isRTL ? '!text-right' : '!text-left')} dir={dir}>{title}</h3>
            {description && (
                <p className={cn("text-sm text-muted-foreground", isRTL ? '!text-right' : '!text-left')} dir={dir}>{description}</p>
            )}
        </header>
    );
}
