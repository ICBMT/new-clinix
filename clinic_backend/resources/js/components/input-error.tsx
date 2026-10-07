import { cn } from '@/lib/utils';
import { type HTMLAttributes } from 'react';
import { useRTL } from '@/hooks/use-rtl';

export default function InputError({
    message,
    className = '',
    ...props
}: HTMLAttributes<HTMLParagraphElement> & { message?: string }) {
    const { isRTL, dir } = useRTL();
    
    return message ? (
        <p
            {...props}
            className={cn(
                'text-sm font-medium text-red-600 dark:text-red-400 mt-1',
                isRTL ? '!text-right' : '!text-left',
                className
            )}
            dir={dir}
        >
            {message}
        </p>
    ) : null;
}
