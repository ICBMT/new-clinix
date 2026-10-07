import { Button } from '@/components/ui/button';
import { Link } from '@inertiajs/react';
import { useRTL } from '@/hooks/use-rtl';
import { useTranslation } from '@/hooks/use-translation';
import { cn } from '@/lib/utils';
import { ArrowLeft, Plus, type LucideIcon } from 'lucide-react';
import { type ReactNode } from 'react';

interface PageHeaderProps {
    title: string;
    description?: string;
    backUrl?: string;
    backLabel?: string;
    actions?: ReactNode;
    onCreate?: () => void;
    createLabel?: string;
    createUrl?: string;
    className?: string;
}

/**
 * Universal page header for all admin panel pages
 * Handles RTL, consistent styling, and common actions
 */
export function PageHeader({
    title,
    description,
    backUrl,
    backLabel,
    actions,
    onCreate,
    createLabel,
    createUrl,
    className,
}: PageHeaderProps) {
    const { t } = useTranslation();
    const { isRTL } = useRTL();

    return (
        <div className={cn("flex items-center justify-between border-b pb-4", isRTL && 'flex-row-reverse', className)}>
            <div className={cn("flex-1", isRTL ? 'text-right' : 'text-left')}>
                <h1 className="text-3xl font-bold text-foreground">{title}</h1>
                {description && (
                    <p className="text-muted-foreground mt-1">{description}</p>
                )}
            </div>
            <div className={cn("flex items-center gap-3", isRTL && 'flex-row-reverse')}>
                {actions}
                {createUrl && (
                    <Link href={createUrl}>
                        <Button className={cn("flex items-center gap-2", isRTL && 'flex-row-reverse')}>
                            <Plus className="h-4 w-4" />
                            {createLabel || t('create_new') || 'Create New'}
                        </Button>
                    </Link>
                )}
                {onCreate && (
                    <Button 
                        onClick={onCreate}
                        className={cn("flex items-center gap-2", isRTL && 'flex-row-reverse')}
                    >
                        <Plus className="h-4 w-4" />
                        {createLabel || t('create_new') || 'Create New'}
                    </Button>
                )}
                {backUrl && (
                    <Link href={backUrl}>
                        <Button 
                            variant="outline" 
                            className={cn("flex items-center gap-2", isRTL && 'flex-row-reverse')}
                            aria-label={backLabel || t('back')}
                        >
                            <ArrowLeft className={cn("h-4 w-4", isRTL && 'rotate-180')} />
                            {backLabel || t('back')}
                        </Button>
                    </Link>
                )}
            </div>
        </div>
    );
}

