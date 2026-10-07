import { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface PageContentProps {
    children: ReactNode;
    className?: string;
}

export function PageContent({ children, className = '' }: PageContentProps) {
    return (
        <div className={cn(
            'flex h-full flex-1 flex-col gap-4 sm:gap-6 overflow-x-auto rounded-xl bg-card dark:bg-card p-4 sm:p-6 border border-border',
            className
        )}>
            {children}
        </div>
    );
}

