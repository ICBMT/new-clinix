import { ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { useRTL } from '@/hooks/use-rtl';
import { usePage } from '@inertiajs/react';
import { type SharedData } from '@/types';

interface ViewPageLayoutProps {
    children: ReactNode;
    className?: string;
}

export function ViewPageLayout({ children, className }: ViewPageLayoutProps) {
    const page = usePage<SharedData>();
    const { locale: pageLocale } = page.props;
    const isRTL = pageLocale === 'ar';
    const dir = isRTL ? 'rtl' : 'ltr';
    const { textAlign } = useRTL();

    return (
        <div 
            className={cn(
                "flex h-full flex-1 flex-col gap-6 overflow-x-auto rounded-xl bg-card dark:bg-card p-6 border border-border",
                isRTL ? '!text-right' : '!text-left',
                className
            )} 
            dir={dir}
        >
            {children}
        </div>
    );
}




