import { Head, router } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { DataTable } from '@/components/data-table';
import { ConfirmationDialog } from '@/components/confirmation-dialog';
import { CrudHeader } from './CrudHeader';
import { CrudFilters } from './CrudFilters';
import { CrudActions } from './CrudActions';
import { Button } from '@/components/ui/button';
import { 
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import { useTranslation } from '@/hooks/use-translation';
import { type CrudPageProps, type CrudColumn } from '@/types/crud';
import { CheckCircle, XCircle } from 'lucide-react';
import { type BreadcrumbItem } from '@/types';

export function CrudPage<T = any>({
    resourceName,
    resourceNamePlural,
    baseRoute,
    data,
    pagination,
    columns,
    filters = [],
    activeFilters = [],
    onFilterChange,
    onRemoveFilter,
    onClearFilters,
    rowActions = [],
    toggleActions = [],
    onCreate,
    onEdit,
    onView,
    onDelete,
    onPageChange,
    onPerPageChange,
    onSort,
    loading = false,
    description,
    headerActions,
    breadcrumbs,
    title,
}: CrudPageProps<T>) {
    const { t } = useTranslation();
    const [showFilters, setShowFilters] = useState(false);
    const [isInitialLoad, setIsInitialLoad] = useState(true);
    const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; row: T | null }>({ 
        open: false, 
        row: null 
    });
    const [optimisticData, setOptimisticData] = useState(data);

    // Initialize optimistic data
    useEffect(() => {
        setOptimisticData(data);
    }, [data]);

    // Filter state management
    const [filterValues, setFilterValues] = useState<Record<string, any>>(() => {
        const initial: Record<string, any> = {};
        filters.forEach(filter => {
            initial[filter.id] = filter.value || (filter.type === 'select' ? 'all' : '');
        });
        return initial;
    });

    // Auto-apply filters when they change (debounced)
    useEffect(() => {
        if (isInitialLoad) {
            setIsInitialLoad(false);
            return;
        }

        const timeoutId = setTimeout(() => {
            onFilterChange?.(filterValues);
        }, 300);

        return () => clearTimeout(timeoutId);
    }, [filterValues, isInitialLoad, onFilterChange]);

    // Enhanced columns with actions
    const enhancedColumns: CrudColumn<T>[] = [
        ...columns,
        {
            key: 'actions',
            label: t('actions'),
            render: (_: unknown, row: T) => (
                <CrudActions
                    row={row}
                    actions={rowActions}
                    toggleActions={toggleActions}
                    onView={onView}
                    onEdit={onEdit}
                    onDelete={(row) => setDeleteDialog({ open: true, row })}
                    entityType={resourceName}
                />
            ),
        },
    ];

    const handleDelete = useCallback(() => {
        if (deleteDialog.row && onDelete) {
            const row = deleteDialog.row;
            const rowId = (row as any).id;
            
            router.delete(`${baseRoute}/${rowId}`, {
                onSuccess: () => {
                    toast.success(t(`${resourceName}_deleted_successfully`), {
                        icon: <CheckCircle className="h-5 w-5 text-green-500" />,
                    });
                    setOptimisticData(prev => prev.filter((item: any) => item.id !== rowId));
                    setDeleteDialog({ open: false, row: null });
                },
                onError: () => {
                    toast.error(t('delete_failed'), {
                        icon: <XCircle className="h-5 w-5 text-red-500" />,
                    });
                }
            });
        }
    }, [deleteDialog.row, onDelete, baseRoute, resourceName, t]);

    const handleCreate = useCallback(() => {
        if (onCreate) {
            onCreate();
        } else {
            router.visit(`${baseRoute}/create`);
        }
    }, [onCreate, baseRoute]);

    const handleEdit = useCallback((row: T) => {
        if (onEdit) {
            onEdit(row);
        } else {
            const rowId = (row as any).id;
            router.visit(`${baseRoute}/${rowId}/edit`);
        }
    }, [onEdit, baseRoute]);

    const handleView = useCallback((row: T) => {
        if (onView) {
            onView(row);
        } else {
            const rowId = (row as any).id;
            router.visit(`${baseRoute}/${rowId}`);
        }
    }, [onView, baseRoute]);

    const handleFilterChange = useCallback((filterId: string, value: any) => {
        setFilterValues(prev => ({
            ...prev,
            [filterId]: value,
        }));
    }, []);

    // Update filter components with handlers
    const enhancedFilters = filters.map(filter => ({
        ...filter,
        value: filterValues[filter.id] ?? filter.value,
        onChange: (value: any) => handleFilterChange(filter.id, value),
        onFromChange: (value: string) => handleFilterChange(filter.id + '_from', value),
        onToChange: (value: string) => handleFilterChange(filter.id + '_to', value),
    }));

    const defaultBreadcrumbs: BreadcrumbItem[] = [
        { title: 'dashboard', href: '/dashboard' },
        { title: resourceNamePlural, href: baseRoute },
    ];

    return (
        <AppLayout breadcrumbs={breadcrumbs || defaultBreadcrumbs}>
            <Head title={title || resourceNamePlural} />

            <div className="flex h-full flex-1 flex-col gap-6 overflow-x-auto rounded-xl bg-card dark:bg-card p-6 border border-border">
                {/* Header */}
                <CrudHeader
                    title={title || resourceNamePlural}
                    description={description}
                    onCreate={handleCreate}
                    createLabel={t(`create_new_${resourceName.toLowerCase()}`)}
                    showFilters={showFilters}
                    onToggleFilters={() => setShowFilters(!showFilters)}
                    activeFiltersCount={activeFilters.length}
                    headerActions={headerActions}
                />

                {/* Pagination Info and Per Page Selector */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <span className="text-sm text-foreground">
                            {t('showing')} {((pagination.currentPage - 1) * pagination.perPage) + 1} {t('of')} {pagination.total} {t('results')}
                        </span>
                        {onPerPageChange && (
                            <Select 
                                value={pagination.perPage.toString()} 
                                onValueChange={(value) => onPerPageChange(Number(value))}
                            >
                                <SelectTrigger className="w-20">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="10">10</SelectItem>
                                    <SelectItem value="15">15</SelectItem>
                                    <SelectItem value="25">25</SelectItem>
                                    <SelectItem value="50">50</SelectItem>
                                    <SelectItem value="100">100</SelectItem>
                                </SelectContent>
                            </Select>
                        )}
                    </div>
                </div>

                {/* Filters */}
                {filters.length > 0 && (
                    <CrudFilters
                        filters={enhancedFilters}
                        activeFilters={activeFilters}
                        onRemoveFilter={onRemoveFilter || (() => {})}
                        onClearFilters={onClearFilters || (() => {})}
                        isOpen={showFilters}
                    />
                )}

                {/* Data Table */}
                <DataTable
                    data={optimisticData}
                    columns={enhancedColumns}
                    total={pagination.total}
                    currentPage={pagination.currentPage}
                    perPage={pagination.perPage}
                    onPageChange={onPageChange || (() => {})}
                    onPerPageChange={onPerPageChange || (() => {})}
                    onSort={onSort}
                    loading={loading}
                />
            </div>

            {/* Delete Confirmation Dialog */}
            {onDelete && (
                <ConfirmationDialog
                    open={deleteDialog.open}
                    onOpenChange={(open) => setDeleteDialog({ open, row: null })}
                    onConfirm={handleDelete}
                    title={t(`delete_${resourceName.toLowerCase()}`)}
                    description={t(`are_you_sure_delete_${resourceName.toLowerCase()}_message`)}
                    variant="danger"
                    confirmText={t('delete')}
                />
            )}
        </AppLayout>
    );
}

