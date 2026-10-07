import { type BreadcrumbItem } from '@/types';
import { type ReactNode } from 'react';
import AppLayout from '@/layouts/app-layout';
import { useRTL } from '@/hooks/use-rtl';
import { cn } from '@/lib/utils';

interface PageLayoutProps {
    children: ReactNode;
    breadcrumbs?: BreadcrumbItem[];
    className?: string;
    containerClassName?: string;
}

/**
 * Universal page layout wrapper for all admin panel pages
 * Handles RTL, consistent styling, and structure
 */
export function PageLayout({
    children,
    breadcrumbs = [],
    className,
    containerClassName,
}: PageLayoutProps) {
    const { isRTL } = useRTL();

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <div 
                className={cn(
                    "flex h-full flex-1 flex-col gap-6 overflow-x-auto rounded-xl bg-card dark:bg-card p-6 border border-border",
                    className
                )}
                dir={isRTL ? 'rtl' : 'ltr'}
            >
                <div className={cn("flex-1", containerClassName)}>
                    {children}
                </div>
            </div>
        </AppLayout>
    );
}

