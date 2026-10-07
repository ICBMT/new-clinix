import { 
    CollapsibleFilters,
    SearchFieldFilter,
    SelectFilter,
    DateRangeFilter,
    MultiSelectFilter
} from '@/components/filters';
import { type CrudFilter } from '@/types/crud';

interface CrudFiltersProps {
    filters: CrudFilter[];
    activeFilters: Array<{
        key: string;
        label: string;
        value: any;
        displayValue: string;
    }>;
    onRemoveFilter: (key: string) => void;
    onClearFilters: () => void;
    isOpen: boolean;
}

export function CrudFilters({
    filters,
    activeFilters,
    onRemoveFilter,
    onClearFilters,
    isOpen,
}: CrudFiltersProps) {
    if (!isOpen || filters.length === 0) return null;

    return (
        <CollapsibleFilters
            activeFilters={activeFilters}
            onRemoveFilter={onRemoveFilter}
            onClearAll={onClearFilters}
            isOpen={isOpen}
        >
            {filters.map((filter) => {
                switch (filter.type) {
                    case 'search':
                        return (
                            <SearchFieldFilter
                                key={filter.id}
                                id={filter.id}
                                label={filter.label}
                                value={filter.value || ''}
                                onChange={filter.onChange || (() => {})}
                                placeholder={filter.placeholder}
                            />
                        );

                    case 'select':
                        return (
                            <SelectFilter
                                key={filter.id}
                                id={filter.id}
                                label={filter.label}
                                value={filter.value || 'all'}
                                onChange={filter.onChange || (() => {})}
                                options={filter.selectOptions || filter.options || []}
                                placeholder={filter.placeholder}
                            />
                        );

                    case 'multiselect':
                        return (
                            <MultiSelectFilter
                                key={filter.id}
                                id={filter.id}
                                label={filter.label}
                                value={filter.value || []}
                                onChange={filter.onChange || (() => {})}
                                options={filter.selectOptions || filter.options || []}
                                placeholder={filter.placeholder}
                            />
                        );

                    case 'date-range':
                        return (
                            <DateRangeFilter
                                key={filter.id}
                                id={filter.id}
                                label={filter.label}
                                fromValue={filter.fromValue || ''}
                                toValue={filter.toValue || ''}
                                onFromChange={filter.onFromChange || (() => {})}
                                onToChange={filter.onToChange || (() => {})}
                                fromPlaceholder={filter.fromPlaceholder}
                                toPlaceholder={filter.toPlaceholder}
                            />
                        );

                    default:
                        return null;
                }
            })}
        </CollapsibleFilters>
    );
}

