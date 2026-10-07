import { useRTL } from '@/hooks/use-rtl';
import { cn } from '@/lib/utils';

export default function Heading({
    title,
    description,
}: {
    title: string;
    description?: string;
}) {
    const { isRTL, dir } = useRTL();
    
    return (
        <div className={cn("mb-8 space-y-0.5", isRTL ? '!text-right' : '!text-left')} dir={dir}>
            <h2 className={cn("text-xl font-semibold tracking-tight", isRTL ? '!text-right' : '!text-left')} dir={dir}>{title}</h2>
            {description && (
                <p className={cn("text-sm text-muted-foreground", isRTL ? '!text-right' : '!text-left')} dir={dir}>{description}</p>
            )}
        </div>
    );
}
