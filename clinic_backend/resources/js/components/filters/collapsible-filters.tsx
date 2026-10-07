import { X, Filter } from 'lucide-react';
import React, { ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useTranslation } from '@/hooks/use-translation';
import { useRTL } from '@/hooks/use-rtl';

export interface ActiveFilter {
    key: string;
    label: string;
    value: string | string[];
    displayValue: string;
}

interface CollapsibleFiltersProps {
    children: ReactNode;
    activeFilters: ActiveFilter[];
    onRemoveFilter: (key: string) => void;
    onClearAll: () => void;
    className?: string;
    isOpen?: boolean;
}

export function CollapsibleFilters({
    children,
    activeFilters,
    onRemoveFilter,
    onClearAll,
    className,
    isOpen: controlledIsOpen,
}: CollapsibleFiltersProps) {
    const { t } = useTranslation();
    const { isRTL } = useRTL();
    
    // Use controlled state if provided, otherwise assume it's open when rendered
    const isOpen = controlledIsOpen !== undefined ? controlledIsOpen : true;

    return (
        <div className={cn(
            'bg-card dark:bg-card rounded-lg border border-border shadow-sm',
            'transition-colors duration-200',
            className
        )} dir={isRTL ? 'rtl' : 'ltr'}>
            {/* Filter Content - Always show when open */}
            {isOpen && (
                <div className="p-4 space-y-4">
                    {/* Filter Inputs - Custom column layout: search col-12, others col-3 */}
                    <div className="grid grid-cols-12 gap-3">
                        {React.Children.map(children, (child, index) => {
                            // First child (search) gets full width (col-12), others get 3 columns (col-3)
                            const isSearchField = index === 0;
                            return (
                                <div key={index} className={isSearchField ? "col-span-12" : "col-span-3"}>
                                    {child}
                                </div>
                            );
                        })}
                    </div>

                    {/* Active Filters Display - Compact inline */}
                    {activeFilters.length > 0 && (
                        <div className="mt-4 pt-3 border-t border-border dark:border-border">
                            <div className="flex items-center justify-between flex-wrap gap-2">
                                <div className="flex items-center gap-2 flex-wrap">
                                    <span className="text-xs font-medium text-foreground flex items-center gap-1">
                                        <Filter className="h-3 w-3" />
                                        {t('active_filters')}:
                                    </span>
                                    {activeFilters.map((filter) => (
                                        <div
                                            key={filter.key}
                                            className={cn(
                                                "inline-flex items-center px-2 py-1 text-xs bg-primary/10 dark:bg-primary/20 text-primary border border-primary/20 dark:border-primary/30 rounded-full hover:bg-primary/20 dark:hover:bg-primary/30 transition-colors",
                                                isRTL ? "flex-row-reverse gap-1.5" : "gap-1.5"
                                            )}
                                        >
                                            <span className={cn("font-medium text-xs whitespace-nowrap", isRTL && "text-right")}>{filter.label}</span>
                                            <button
                                                type="button"
                                                onClick={() => onRemoveFilter(filter.key)}
                                                className={cn(
                                                    "hover:bg-primary/30 dark:hover:bg-primary/40 rounded-full p-0.5 transition-colors flex-shrink-0",
                                                    isRTL ? "-mr-0.5" : "-ml-0.5"
                                                )}
                                                aria-label={`Remove ${filter.label} filter`}
                                            >
                                                <X className="h-3 w-3" />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={onClearAll}
                                    className={cn(
                                        "text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-900/20 text-xs",
                                        isRTL && "flex-row-reverse"
                                    )}
                                >
                                    <X className={cn("h-3 w-3", isRTL ? "ml-1" : "mr-1")} />
                                    {t('clear_all_filters')}
                                </Button>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

