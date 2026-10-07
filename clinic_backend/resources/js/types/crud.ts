/**
 * CRUD Types and Interfaces
 * 
 * Reusable types for building CRUD interfaces in the admin panel
 */

export interface CrudColumn<T = any> {
    key: string;
    label: string;
    sortable?: boolean;
    render?: (value: any, row: T) => React.ReactNode;
    className?: string;
}

export interface CrudFilter {
    id: string;
    label: string;
    type: 'search' | 'select' | 'date' | 'date-range' | 'multiselect' | 'number' | 'boolean';
    options?: Array<{ value: string; label: string }>;
    placeholder?: string;
    value?: any;
    onChange?: (value: any) => void;
    // For select/multiselect
    selectOptions?: Array<{ value: string; label: string }>;
    // For date-range
    fromValue?: string;
    toValue?: string;
    onFromChange?: (value: string) => void;
    onToChange?: (value: string) => void;
    fromPlaceholder?: string;
    toPlaceholder?: string;
    // For number
    min?: number;
    max?: number;
}

export interface CrudAction<T = any> {
    id: string;
    label: string;
    icon?: React.ReactNode;
    variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
    onClick: (row: T) => void;
    condition?: (row: T) => boolean;
    className?: string;
}

export interface CrudToggleAction {
    id: string;
    label: string;
    field: string;
    endpoint: (id: number) => string;
    onSuccess?: (row: any) => void;
    onError?: (row: any) => void;
    getValue?: (row: any) => boolean;
}

export interface CrudConfig<T = any> {
    // Resource configuration
    resourceName: string;
    resourceNamePlural: string;
    baseRoute: string;
    
    // Data
    data: T[];
    pagination: {
        currentPage: number;
        lastPage: number;
        perPage: number;
        total: number;
    };
    
    // Table configuration
    columns: CrudColumn<T>[];
    
    // Filters
    filters?: CrudFilter[];
    activeFilters?: Array<{
        key: string;
        label: string;
        value: any;
        displayValue: string;
    }>;
    onFilterChange?: (filters: Record<string, any>) => void;
    onRemoveFilter?: (key: string) => void;
    onClearFilters?: () => void;
    
    // Actions
    headerActions?: React.ReactNode;
    rowActions?: CrudAction<T>[];
    toggleActions?: CrudToggleAction[];
    bulkActions?: React.ReactNode;
    
    // CRUD operations
    onCreate?: () => void;
    onEdit?: (row: T) => void;
    onView?: (row: T) => void;
    onDelete?: (row: T) => void;
    
    // Pagination
    onPageChange?: (page: number) => void;
    onPerPageChange?: (perPage: number) => void;
    
    // Sorting
    onSort?: (column: string, direction: 'asc' | 'desc') => void;
    
    // Loading state
    loading?: boolean;
    
    // Optional descriptions
    description?: string;
}

export interface CrudPageProps<T = any> extends CrudConfig<T> {
    breadcrumbs?: Array<{ title: string; href: string }>;
    title?: string;
}

