import { type ReactNode } from 'react';
import { type BreadcrumbItem } from '@/types';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useTranslation } from '@/hooks/use-translation';
import { useRTL } from '@/hooks/use-rtl';
import { useRTLInit } from '@/hooks/use-rtl-init';
import { usePage } from '@inertiajs/react';
import { type SharedData } from '@/types';
import AppLayout from '@/layouts/app-layout';
import { cn } from '@/lib/utils';
import { Head, Link } from '@inertiajs/react';
import { ArrowLeft, Edit } from 'lucide-react';

interface ViewLayoutProps {
    breadcrumbs: BreadcrumbItem[];
    title: string;
    description?: string;
    status?: {
        value: string;
        variant?: 'default' | 'secondary' | 'destructive';
        className?: string;
    };
    editUrl?: string;
    backUrl?: string;
    backLabel?: string;
    editLabel?: string;
    actions?: ReactNode; // Custom action buttons (preferred)
    customActions?: ReactNode; // Deprecated: use actions instead
    children: ReactNode;
    className?: string;
    headTitle?: string;
}

export function ViewLayout({
    breadcrumbs,
    title,
    description,
    status,
    editUrl,
    backUrl,
    backLabel,
    editLabel,
    actions,
    customActions,
    children,
    className,
    headTitle,
}: ViewLayoutProps) {
    useRTLInit();
    const { t } = useTranslation();
    const page = usePage<SharedData>();
    const { locale: pageLocale } = page.props;
    const isRTL = pageLocale === 'ar';
    const dir = isRTL ? 'rtl' : 'ltr';
    const { flexDirection, iconMargin } = useRTL();

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={headTitle || title} />

            <div className={cn("flex h-full flex-1 flex-col gap-6 overflow-x-auto rounded-xl bg-card dark:bg-card p-6 border border-border", isRTL ? '!text-right' : '!text-left', className)} dir={dir}>
                {/* Header */}
                <div className={cn("flex items-center justify-between border-b pb-4", flexDirection)}>
                    <div className={cn(isRTL ? '!text-right' : '!text-left')}>
                        <div className={cn("flex items-center gap-3", flexDirection)}>
                            <h1 className={cn("text-3xl font-bold text-foreground", isRTL ? '!text-right' : '!text-left')}>{title}</h1>
                            {status && (
                                <Badge 
                                    variant={status.variant || 'default'}
                                    className={cn(
                                        "text-base px-4 py-1",
                                        status.className,
                                        isRTL ? '!text-right' : '!text-left'
                                    )}
                                >
                                    {t(status.value)}
                                </Badge>
                            )}
                        </div>
                        {description && (
                            <p className={cn("text-muted-foreground mt-1", isRTL ? '!text-right' : '!text-left')}>{description}</p>
                        )}
                    </div>
                    
                    <div className={cn("flex items-center gap-3", flexDirection)}>
                        {actions || customActions || (
                            <>
                                {editUrl && (
                                    <Link href={editUrl}>
                                        <Button 
                                            className={cn("flex items-center gap-2", flexDirection)}
                                            aria-label={editLabel || t('edit')}
                                        >
                                            <Edit className={cn("h-4 w-4", iconMargin('md'))} />
                                            {editLabel || t('edit')}
                                        </Button>
                                    </Link>
                                )}
                                {backUrl && (
                                    <Link href={backUrl}>
                                        <Button 
                                            variant="outline" 
                                            className={cn("flex items-center gap-2", flexDirection)}
                                            aria-label={backLabel || t('back')}
                                        >
                                            <ArrowLeft className={cn("h-4 w-4", isRTL && 'rotate-180')} />
                                            {backLabel || t('back')}
                                        </Button>
                                    </Link>
                                )}
                            </>
                        )}
                    </div>
                </div>

                {/* Content */}
                {children}
            </div>
        </AppLayout>
    );
}


