import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Link } from '@inertiajs/react';
import { cn } from '@/lib/utils';
import { ArrowLeft, Plus, Filter } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { useTranslation } from '@/hooks/use-translation';
import { cn } from '@/lib/utils';
import { useRTL } from '@/hooks/use-rtl';
import { cn } from '@/lib/utils';

interface PageHeaderProps {
    title: string;
    description?: string;
    backUrl?: string;
    backLabel?: string;
    actions?: ReactNode;
    showFilters?: boolean;
    onToggleFilters?: () => void;
    activeFiltersCount?: number;
    onCreate?: () => void;
    createLabel?: string;
    className?: string;
}

export function PageHeader({
    title,
    description,
    backUrl,
    backLabel,
    actions,
    showFilters = false,
    onToggleFilters,
    activeFiltersCount = 0,
    onCreate,
    createLabel,
    className = '',
}: PageHeaderProps) {
    const { t, locale } = useTranslation();
    const { isRTL } = useRTL();

    return (
        <div className={`flex flex-col gap-4 border-b pb-4 ${className}`}>
            {/* Back button - always at the top/left in RTL */}
            {backUrl && (
                <div className={`flex ${isRTL ? 'justify-start' : 'justify-start'}`}>
                    <Link href={backUrl}>
                        <Button variant="outline" className={`flex items-center gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
                            <ArrowLeft className={`h-4 w-4 ${isRTL ? 'rotate-180' : ''}`} />
                            {backLabel || t('back')}
                        </Button>
                    </Link>
                </div>
            )}
            
            {/* Title and actions */}
            <div className={`flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 ${isRTL ? 'sm:flex-row-reverse' : ''}`}>
            <div className={`flex-1 min-w-0 ${isRTL ? 'text-right' : ''}`}>
                <h1 className="text-2xl sm:text-3xl font-bold text-foreground truncate">{title}</h1>
                {description && (
                    <p className="text-sm sm:text-base text-muted-foreground mt-1">{description}</p>
                )}
            </div>
            <div className={`flex flex-wrap items-center gap-2 sm:gap-3 ${isRTL ? 'flex-row-reverse' : ''}`}>
                {onToggleFilters && (
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={onToggleFilters}
                        className={`flex items-center gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}
                    >
                        <Filter className="h-4 w-4" />
                        <span className="hidden sm:inline">{showFilters ? t('hide_filters') : t('show_filters')}</span>
                        {activeFiltersCount > 0 && (
                            <span className={`${isRTL ? 'mr-1' : 'ml-1'} px-1.5 py-0.5 text-xs bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-300 rounded-full`}>
                                {activeFiltersCount}
                            </span>
                        )}
                    </Button>
                )}
                {actions}
                {onCreate && (
                    <Button 
                        onClick={onCreate}
                        className={`flex items-center gap-2 w-full sm:w-auto ${isRTL ? 'flex-row-reverse' : ''}`}
                    >
                        <Plus className={`h-4 w-4 ${isRTL ? 'ml-2' : 'mr-2'}`} />
                        <span className="hidden sm:inline">{createLabel || t('create_new')}</span>
                        <span className="sm:hidden">{t('create')}</span>
                    </Button>
                )}
                </div>
            </div>
        </div>
    );
}

