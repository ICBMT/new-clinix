import { Button } from '@/components/ui/button';
import { Plus, Filter } from 'lucide-react';
import { useTranslation } from '@/hooks/use-translation';
import { type CrudConfig } from '@/types/crud';

interface CrudHeaderProps {
    title: string;
    description?: string;
    onCreate?: () => void;
    createLabel?: string;
    showFilters?: boolean;
    onToggleFilters?: () => void;
    activeFiltersCount?: number;
    headerActions?: React.ReactNode;
}

export function CrudHeader({
    title,
    description,
    onCreate,
    createLabel,
    showFilters = false,
    onToggleFilters,
    activeFiltersCount = 0,
    headerActions,
}: CrudHeaderProps) {
    const { t } = useTranslation();

    return (
        <div className="flex items-center justify-between">
            <div>
                <h1 className="text-3xl font-bold text-foreground">{title}</h1>
                {description && (
                    <p className="text-muted-foreground mt-1">{description}</p>
                )}
            </div>
            <div className="flex items-center gap-2">
                {onToggleFilters && (
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={onToggleFilters}
                        className="flex items-center gap-2"
                    >
                        <Filter className="h-4 w-4" />
                        {showFilters ? t('hide_filters') : t('show_filters')}
                        {activeFiltersCount > 0 && (
                            <span className="ml-1 px-1.5 py-0.5 text-xs bg-blue-100 text-blue-800 rounded-full">
                                {activeFiltersCount}
                            </span>
                        )}
                    </Button>
                )}
                {headerActions}
                {onCreate && (
                    <Button 
                        onClick={onCreate}
                        className="flex items-center gap-2"
                    >
                        <Plus className="h-4 w-4" />
                        {createLabel || t('create_new')}
                    </Button>
                )}
            </div>
        </div>
    );
}

