import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { 
    Table, 
    TableBody, 
    TableCell, 
    TableHead, 
    TableHeader, 
    TableRow 
} from '@/components/ui/table';
import { 
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { useTranslation } from '@/hooks/use-translation';
import { useRTL } from '@/hooks/use-rtl';
import { useRTLInit } from '@/hooks/use-rtl-init';
import { usePage } from '@inertiajs/react';
import { type SharedData } from '@/types';
import { ChevronLeft, ChevronRight, Filter } from 'lucide-react';
import { useState } from 'react';

interface Column {
    key: string;
    label: string;
    sortable?: boolean;
    render?: (value: any, row: any) => React.ReactNode;
}

interface DataTableProps {
    data: any[];
    columns: Column[];
    total: number;
    currentPage: number;
    perPage: number;
    onPageChange: (page: number) => void;
    onPerPageChange: (perPage: number) => void;
    onSort?: (column: string, direction: 'asc' | 'desc') => void;
    loading?: boolean;
    selectedRows?: number[];
    onSelectRow?: (id: number, selected: boolean) => void;
    onSelectAll?: (selected: boolean) => void;
    bulkActions?: React.ReactNode;
    className?: string;
}

export function DataTable({
    data,
    columns,
    total,
    currentPage,
    perPage,
    onPageChange,
    onPerPageChange,
    onSort,
    loading = false,
    selectedRows = [],
    onSelectRow,
    onSelectAll,
    bulkActions,
    className,
}: DataTableProps) {
    useRTLInit();
    const { t, locale } = useTranslation();
    const page = usePage<SharedData>();
    const { locale: pageLocale } = page.props;
    const isRTL = pageLocale === 'ar';
    const dir = isRTL ? 'rtl' : 'ltr';
    const { flexDirection, iconMargin } = useRTL();
    const [sortColumn, setSortColumn] = useState<string | null>(null);
    const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

    const totalPages = Math.ceil(total / perPage);
    const hasSelection = selectedRows.length > 0;
    const allSelected = data.length > 0 && selectedRows.length === data.length;

    const handleSort = (column: string) => {
        if (!onSort) return;
        
        const newDirection = sortColumn === column && sortDirection === 'asc' ? 'desc' : 'asc';
        setSortColumn(column);
        setSortDirection(newDirection);
        onSort(column, newDirection);
    };

    const handleSelectAll = (checked: boolean) => {
        onSelectAll?.(checked);
    };

    return (
        <div className={cn('space-y-4', className)}>

            {/* Bulk Actions */}
            {hasSelection && bulkActions && (
                <div className={cn("flex items-center", flexDirection)} dir={dir}>
                    {bulkActions}
                </div>
            )}

            {/* Table */}
            <div className={cn("border rounded-lg w-full overflow-x-auto", isRTL ? 'rtl-table' : '')} dir={dir}>
                <Table className={cn(isRTL ? 'text-right' : 'text-left', "w-full")} dir={dir}>
                    <TableHeader>
                        <TableRow>
                            {onSelectRow && (
                                <TableHead className="w-12" dir={dir}>
                                    <Checkbox
                                        checked={allSelected}
                                        onCheckedChange={handleSelectAll}
                                    />
                                </TableHead>
                            )}
                            {columns.map((column) => (
                                <TableHead 
                                    key={column.key}
                                    className={cn(
                                        column.sortable && 'cursor-pointer hover:bg-gray-50',
                                        column.key === 'actions' && (isRTL ? 'text-left' : 'text-right'),
                                        column.key !== 'actions' && (isRTL ? 'text-right' : 'text-left')
                                    )}
                                    dir={column.key === 'actions' || column.key === 'gross_amount' || column.key === 'net_amount' || column.key === 'remaining_amount' ? 'ltr' : dir}
                                    onClick={() => column.sortable && handleSort(column.key)}
                                >
                                    <div className={cn(
                                        "flex items-center",
                                        column.key === 'actions' 
                                            ? (isRTL ? 'justify-start' : 'justify-end')
                                            : flexDirection
                                    )} dir={dir}>
                                        <span className={cn(isRTL ? '!text-right' : '!text-left')} dir={dir}>{column.label}</span>
                                        {column.sortable && sortColumn === column.key && (
                                            <span className={cn("text-xs", isRTL ? '!text-right' : '!text-left')} dir={dir}>
                                                {sortDirection === 'asc' ? '↑' : '↓'}
                                            </span>
                                        )}
                                    </div>
                                </TableHead>
                            ))}
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {loading ? (
                            <TableRow>
                                <TableCell 
                                    colSpan={columns.length + (onSelectRow ? 1 : 0)}
                                    className="text-center py-8"
                                    align="center"
                                    dir={dir}
                                >
                                    <span className="text-center block" dir={dir}>{t('loading')}</span>
                                </TableCell>
                            </TableRow>
                        ) : data.length === 0 ? (
                            <TableRow>
                                <TableCell 
                                    colSpan={columns.length + (onSelectRow ? 1 : 0)}
                                    className="text-center py-8 text-muted-foreground"
                                    align="center"
                                    dir={dir}
                                >
                                    <span className="text-center block" dir={dir}>{t('no_data_found')}</span>
                                </TableCell>
                            </TableRow>
                        ) : (
                            data.map((row, index) => (
                                <TableRow key={row.id ?? `row-${index}`}>
                                    {onSelectRow && (
                                        <TableCell dir={dir}>
                                            <Checkbox
                                                checked={selectedRows.includes(row.id)}
                                                onCheckedChange={(checked) => 
                                                    onSelectRow(row.id, checked as boolean)
                                                }
                                            />
                                        </TableCell>
                                    )}
                                    {columns.map((column) => {
                                        const cellValue = row[column.key];
                                        let renderValue: React.ReactNode;
                                        
                                        if (column.render) {
                                            try {
                                                renderValue = column.render(cellValue, row);
                                                // Safety check: ensure render function returns valid React node
                                                // Check if it's a plain object (not array, not React element, not null)
                                                if (renderValue !== null && 
                                                    renderValue !== undefined && 
                                                    typeof renderValue === 'object' && 
                                                    !Array.isArray(renderValue) && 
                                                    !React.isValidElement(renderValue) &&
                                                    renderValue.constructor === Object) {
                                                    console.warn(`Column "${column.key}" render function returned plain object:`, renderValue);
                                                    renderValue = <span className={cn("text-muted-foreground", isRTL ? '!text-right' : '!text-left')} dir={dir}>—</span>;
                                                }
                                            } catch (error) {
                                                console.error(`Error rendering column "${column.key}":`, error);
                                                renderValue = <span className={cn("text-muted-foreground", isRTL ? '!text-right' : '!text-left')} dir={dir}>—</span>;
                                            }
                                        } else {
                                            // Safety check: if value is a plain object, don't render it directly
                                            if (cellValue !== null && 
                                                cellValue !== undefined && 
                                                typeof cellValue === 'object' && 
                                                !Array.isArray(cellValue) && 
                                                !React.isValidElement(cellValue) &&
                                                cellValue.constructor === Object) {
                                                console.warn(`Column "${column.key}" has plain object value without render function:`, cellValue);
                                                renderValue = <span className={cn("text-muted-foreground", isRTL ? '!text-right' : '!text-left')} dir={dir}>—</span>;
                                            } else {
                                                renderValue = cellValue;
                                            }
                                        }
                                        
                                        // Determine cell direction - actions and amount columns should be LTR
                                        const cellDir = column.key === 'actions' || column.key === 'gross_amount' || column.key === 'net_amount' || column.key === 'remaining_amount' || column.key === 'total_amount' ? 'ltr' : dir;
                                        
                                        // Check if renderValue is already a div with p-2 class (from column render functions)
                                        const isAlreadyWrapped = React.isValidElement(renderValue) && 
                                            typeof renderValue.type === 'string' && 
                                            renderValue.type === 'div' && 
                                            renderValue.props && 
                                            typeof renderValue.props === 'object' &&
                                            'className' in renderValue.props &&
                                            typeof renderValue.props.className === 'string' &&
                                            renderValue.props.className.includes('p-2');
                                        
                                        return (
                                        <TableCell 
                                            key={`${row.id ?? `row-${index}`}-${column.key}`}
                                            className={cn(
                                                column.key === 'actions' 
                                                    ? (isRTL ? 'text-left' : 'text-right')
                                                    : (isRTL ? 'text-right' : 'text-left')
                                            )}
                                            dir={cellDir}
                                        >
                                            {/* If already wrapped with p-2, just ensure it has dir attribute, otherwise wrap it */}
                                            {isAlreadyWrapped && React.isValidElement(renderValue)
                                                ? React.cloneElement(renderValue as React.ReactElement<any>, { 
                                                    dir: cellDir,
                                                    className: cn(
                                                        (renderValue.props as any)?.className || '',
                                                        isRTL ? '!text-right' : '!text-left'
                                                    )
                                                } as any)
                                                : (
                                                    <div className={cn("p-2", isRTL ? '!text-right' : '!text-left')} dir={cellDir}>
                                                        {renderValue}
                                                    </div>
                                                )
                                            }
                                        </TableCell>
                                        );
                                    })}
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>

            {/* Page Navigation */}
            {totalPages > 0 && (
                <div className={cn("flex items-center justify-center", isRTL ? '!text-right' : '!text-left')} dir={dir}>
                    <div className={cn("flex items-center gap-2", flexDirection)} dir={dir}>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => onPageChange(currentPage - 1)}
                            disabled={currentPage <= 1}
                            dir={dir}
                        >
                            {isRTL ? <ChevronRight className={cn("h-4 w-4", iconMargin('sm'))} /> : <ChevronLeft className={cn("h-4 w-4", iconMargin('sm'))} />}
                        </Button>
                        
                        <div className={cn("flex items-center gap-2", flexDirection)} dir={dir}>
                            {(() => {
                                const pages: number[] = [];
                                const maxVisible = 5;
                                
                                if (totalPages <= maxVisible) {
                                    // Show all pages if total is less than max
                                    for (let i = 1; i <= totalPages; i++) {
                                        pages.push(i);
                                    }
                                } else {
                                    // Show pages around current page
                                    let start = Math.max(1, currentPage - Math.floor(maxVisible / 2));
                                    const end = Math.min(totalPages, start + maxVisible - 1);
                                    
                                    // Adjust if we're near the end
                                    if (end - start < maxVisible - 1) {
                                        start = Math.max(1, end - maxVisible + 1);
                                    }
                                    
                                    for (let i = start; i <= end; i++) {
                                        pages.push(i);
                                    }
                                }
                                
                                return pages.map((page) => (
                                    <Button
                                        key={page}
                                        variant={currentPage === page ? "default" : "outline"}
                                        size="sm"
                                        onClick={() => onPageChange(page)}
                                        className="w-8 h-8 p-0"
                                        dir={dir}
                                    >
                                        {page}
                                    </Button>
                                ));
                            })()}
                        </div>

                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => onPageChange(currentPage + 1)}
                            disabled={currentPage >= totalPages}
                            dir={dir}
                        >
                            {isRTL ? <ChevronLeft className={cn("h-4 w-4", iconMargin('sm'))} /> : <ChevronRight className={cn("h-4 w-4", iconMargin('sm'))} />}
                        </Button>
                    </div>
                </div>
            )}
        </div>
    );
}
