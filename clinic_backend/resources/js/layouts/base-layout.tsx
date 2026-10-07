import { type ReactNode } from 'react';
import { useTranslation } from '@/hooks/use-translation';
import { useRTLInit } from '@/hooks/use-rtl-init';
import { useRTL } from '@/hooks/use-rtl';
import { cn } from '@/lib/utils';

interface BaseLayoutProps {
    children: ReactNode;
    className?: string;
    dir?: 'rtl' | 'ltr' | 'auto';
}

/**
 * Base layout component with unified RTL/LTR support
 * All layouts should extend this or use its pattern
 */
export function BaseLayout({ children, className, dir = 'auto' }: BaseLayoutProps) {
    useRTLInit();
    const { isRTL } = useRTL();
    
    const direction = dir === 'auto' ? (isRTL ? 'rtl' : 'ltr') : dir;
    
    return (
        <div 
            className={cn(className)}
            dir={direction}
        >
            {children}
        </div>
    );
}










