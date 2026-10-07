/**
 * Global Filter Components Export
 * 
 * Centralized export for all filter components
 */

// Core filter components
export { CollapsibleFilters } from './collapsible-filters';
export type { ActiveFilter } from './collapsible-filters';

export { SearchFieldFilter } from './search-field-filter';
export { SelectFilter } from './select-filter';
export type { SelectOption } from './select-filter';

export { DateRangeFilter } from './date-range-filter';
export type { DateRangeFilterProps } from './date-range-filter';

export { DatePickerFilter } from './date-picker-filter';
export { MultiSelectFilter } from './multi-select-filter';
export type { MultiSelectOption } from './multi-select-filter';

// Universal filter panel (alternative approach)
export { UniversalFilterPanel } from './universal-filter-panel';
export type { FilterField, ActiveFilter as UniversalActiveFilter, FilterType } from './universal-filter-panel';

