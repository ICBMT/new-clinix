/**
 * Universal Filter Panel Component
 * 
 * A reusable filter component that accepts dynamic filter configurations
 * for different pages. Works like Laravel Blade components with props.
 * 
 * Usage:
 * <UniversalFilterPanel
 *   filters={filterConfig}
 *   activeFilters={activeFiltersList}
 *   onFilterChange={handleFilterChange}
 *   onClearAll={handleClearAll}
 *   isOpen={showFilters}
 * />
 */

import { ReactNode } from 'react';
import { X, Filter as FilterIcon, Calendar } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTranslation } from '@/hooks/use-translation';
import { useRTL } from '@/hooks/use-rtl';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { SearchFieldFilter } from './search-field-filter';

// Filter types supported
export type FilterType = 'search' | 'select' | 'date-range' | 'date' | 'multi-select';

// Filter field configuration
export interface FilterField {
    id: string;
    type: FilterType;
    label: string;
    placeholder?: string;
    options?: Array<{ value: string; label: string }>;
    value?: string | string[] | { from?: string; to?: string };
    width?: 'full' | 'half' | 'third' | 'quarter'; // col-span-12, 6, 4, 3
}

// Active filter for display
export interface ActiveFilter {
    key: string;
    label: string;
    value: string | string[];
    displayValue: string;
}

interface UniversalFilterPanelProps {
    filters: FilterField[];
    activeFilters: ActiveFilter[];
    onFilterChange: (filterId: string, value: string | string[] | { from?: string; to?: string }) => void;
    onRemoveFilter: (filterId: string) => void;
    onClearAll: () => void;
    isOpen?: boolean;
    className?: string;
}

export function UniversalFilterPanel({
    filters,
    activeFilters,
    onFilterChange,
    onRemoveFilter,
    onClearAll,
    isOpen = true,
    className,
}: UniversalFilterPanelProps) {
    const { t } = useTranslation();
    const { isRTL } = useRTL();

    // Get column span class based on width
    const getColSpan = (width?: FilterField['width']) => {
        switch (width) {
            case 'full':
                return 'col-span-12';
            case 'half':
                return 'col-span-6';
            case 'third':
                return 'col-span-4';
            case 'quarter':
                return 'col-span-3';
            default:
                return 'col-span-3'; // Default to quarter width
        }
    };

    // Render filter field based on type
    const renderFilterField = (filter: FilterField) => {
        switch (filter.type) {
            case 'search':
                return (
                    <SearchFieldFilter
                        id={filter.id}
                        label={filter.label}
                        value={typeof filter.value === 'string' ? filter.value : ''}
                        onChange={(value) => onFilterChange(filter.id, value)}
                        placeholder={filter.placeholder || 'Search...'}
                    />
                );

            case 'select':
                return (
                    <div className="flex flex-col gap-2" dir={isRTL ? 'rtl' : 'ltr'}>
                        <Label htmlFor={filter.id} className={cn("text-sm font-medium text-foreground", isRTL && "text-right")}>
                            {filter.label}
                        </Label>
                        <Select
                            value={typeof filter.value === 'string' ? filter.value : ''}
                            onValueChange={(value) => onFilterChange(filter.id, value)}
                        >
                            <SelectTrigger 
                                id={filter.id}
                                className={cn("bg-background dark:bg-background text-foreground", isRTL && "text-right")}
                                dir={isRTL ? 'rtl' : 'ltr'}
                            >
                                <SelectValue placeholder={filter.placeholder || `Select ${filter.label}`} className={cn(isRTL && "text-right")} />
                            </SelectTrigger>
                            <SelectContent className={cn(isRTL && "rtl text-right")} dir={isRTL ? 'rtl' : 'ltr'}>
                                {filter.options?.map((option) => (
                                    <SelectItem key={option.value} value={option.value} className={cn(isRTL && "text-right")}>
                                        {option.label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                );

            case 'date':
                return (
                    <div className="flex flex-col gap-2" dir={isRTL ? 'rtl' : 'ltr'}>
                        <Label htmlFor={filter.id} className={cn("text-sm font-medium text-foreground", isRTL && "text-right")}>
                            {filter.label}
                        </Label>
                        <div className="relative">
                            <Calendar className={cn(
                                "absolute top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground",
                                isRTL ? "right-3" : "left-3"
                            )} />
                            <Input
                                id={filter.id}
                                type="date"
                                value={typeof filter.value === 'string' ? filter.value : ''}
                                onChange={(e) => onFilterChange(filter.id, e.target.value)}
                                dir={isRTL ? 'rtl' : 'ltr'}
                                className={cn(
                                    "bg-background dark:bg-background text-foreground",
                                    isRTL ? "pr-10 text-right" : "pl-10"
                                )}
                            />
                        </div>
                    </div>
                );

            case 'date-range':
                const dateRangeValue = typeof filter.value === 'object' && !Array.isArray(filter.value)
                    ? filter.value
                    : { from: '', to: '' };

                return (
                    <div className="flex flex-col gap-2" dir={isRTL ? 'rtl' : 'ltr'}>
                        <Label className={cn("text-sm font-medium text-foreground", isRTL && "text-right")}>
                            {filter.label}
                        </Label>
                        <div className="grid grid-cols-2 gap-2">
                            <div className="relative">
                                <Calendar className={cn(
                                    "absolute top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground",
                                    isRTL ? "right-3" : "left-3"
                                )} />
                                <Input
                                    type="date"
                                    value={dateRangeValue.from || ''}
                                    onChange={(e) => onFilterChange(filter.id, {
                                        ...dateRangeValue,
                                        from: e.target.value
                                    })}
                                    placeholder="From"
                                    dir={isRTL ? 'rtl' : 'ltr'}
                                    className={cn(
                                        "bg-background dark:bg-background text-foreground",
                                        isRTL ? "pr-10 text-right" : "pl-10"
                                    )}
                                />
                            </div>
                            <div className="relative">
                                <Calendar className={cn(
                                    "absolute top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground",
                                    isRTL ? "right-3" : "left-3"
                                )} />
                                <Input
                                    type="date"
                                    value={dateRangeValue.to || ''}
                                    onChange={(e) => onFilterChange(filter.id, {
                                        ...dateRangeValue,
                                        to: e.target.value
                                    })}
                                    placeholder="To"
                                    dir={isRTL ? 'rtl' : 'ltr'}
                                    className={cn(
                                        "bg-background dark:bg-background text-foreground",
                                        isRTL ? "pr-10 text-right" : "pl-10"
                                    )}
                                />
                            </div>
                        </div>
                    </div>
                );

            default:
                return null;
        }
    };

    if (!isOpen) return null;

    return (
        <div className={cn(
            'bg-card dark:bg-card rounded-lg border border-border shadow-sm',
            'transition-colors duration-200',
            className
        )} dir={isRTL ? 'rtl' : 'ltr'}>
            <div className="p-4 space-y-4">
                {/* Filter Grid */}
                <div className="grid grid-cols-12 gap-3">
                    {filters.map((filter) => (
                        <div key={filter.id} className={getColSpan(filter.width)}>
                            {renderFilterField(filter)}
                        </div>
                    ))}
                </div>

                {/* Active Filters Display */}
                {activeFilters.length > 0 && (
                    <div className="mt-4 pt-3 border-t border-border dark:border-border">
                        <div className="flex items-center justify-between flex-wrap gap-2">
                            <div className="flex items-center gap-2 flex-wrap">
                                <span className="text-xs font-medium text-foreground flex items-center gap-1">
                                    <FilterIcon className="h-3 w-3" />
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
                                        <span className={cn("font-medium text-xs whitespace-nowrap", isRTL && "text-right")}>
                                            {filter.label}: {filter.displayValue}
                                        </span>
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
                                className="text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-900/20 text-xs"
                            >
                                <X className="h-3 w-3 mr-1" />
                                {t('clear_all_filters')}
                            </Button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

// Export types for use in pages
export type { FilterField, FilterType, ActiveFilter };

