import { DataTable } from '@/components/data-table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
    CollapsibleFilters, 
    SearchFieldFilter, 
    SelectFilter,
    type ActiveFilter,
    type SelectOption 
} from '@/components/filters';
import { ConfirmationDialog } from '@/components/confirmation-dialog';
import AppLayout from '@/layouts/app-layout';
import { useTranslation } from '@/hooks/use-translation';
import { useRTL } from '@/hooks/use-rtl';
import { useRTLInit } from '@/hooks/use-rtl-init';
import { Head, Link, router, usePage } from '@inertiajs/react';
import { Plus, Eye, Edit, Trash2, Filter, Download } from 'lucide-react';
import { useState, useCallback } from 'react';
import { index as dashboard } from '@/routes/dashboard';
import { type BreadcrumbItem } from '@/types';
import { formatHumanDate } from '@/utils/date-utils';
import { formatFileSize } from '@/utils/file-utils';
import { cn } from '@/lib/utils';
import { type SharedData } from '@/types';

interface BookingDocument {
    id: number;
    booking_id: number;
    name: string;
    file_path: string;
    file_name: string;
    file_type?: string;
    file_size?: number;
    created_at: string;
    booking?: {
        id: number;
        booking_reference: string;
    };
}

interface BookingDocumentsPageProps {
    documents: {
        data: BookingDocument[];
        current_page: number;
        last_page: number;
        per_page: number;
        total: number;
    };
    filters: {
        search?: string;
        booking_id?: string;
        file_type?: string;
    };
}

export default function BookingDocumentsIndex({ documents, filters: initialFilters }: BookingDocumentsPageProps) {
    useRTLInit();
    const { t, locale } = useTranslation();
    const page = usePage<SharedData>();
    const { locale: pageLocale } = page.props;
    const isRTL = pageLocale === 'ar';
    const dir = isRTL ? 'rtl' : 'ltr';
    const { flexDirection, iconMargin } = useRTL();
    
    const breadcrumbs: BreadcrumbItem[] = [
        {
            title: t('dashboard'),
            href: dashboard.url(),
        },
        {
            title: t('booking_documents'),
            href: '/dashboard/booking-documents',
        },
    ];
    const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; documentId: number | null }>({ 
        open: false, 
        documentId: null 
    });
    const [showFilters, setShowFilters] = useState(false);

    const [filters, setFilters] = useState({
        search: initialFilters?.search || '',
        booking_id: initialFilters?.booking_id || '',
        file_type: initialFilters?.file_type || 'all',
    });

    const applyFiltersToBackend = useCallback((filtersToApply: typeof filters) => {
        router.get('/dashboard/booking-documents', {
            page: 1,
            search: filtersToApply.search || undefined,
            filters: {
                booking_id: filtersToApply.booking_id || undefined,
                file_type: filtersToApply.file_type && filtersToApply.file_type !== 'all' ? filtersToApply.file_type : undefined,
            },
        }, { preserveState: true });
    }, []);

    const handleFilterChange = (key: string, value: string) => {
        const newFilters = { ...filters, [key]: value };
        setFilters(newFilters);
        applyFiltersToBackend(newFilters);
    };

    const clearFilters = () => {
        const clearedFilters = {
            search: '',
            booking_id: '',
            file_type: 'all',
        };
        setFilters(clearedFilters);
        applyFiltersToBackend(clearedFilters);
    };

    const handleDelete = (documentId: number) => {
        router.delete(`/dashboard/booking-documents/${documentId}`, {
            onSuccess: () => {
                setDeleteDialog({ open: false, documentId: null });
            },
        });
    };

    const activeFilters: ActiveFilter[] = [
        ...(filters.search ? [{ key: 'search', label: t('search'), value: filters.search }] : []),
        ...(filters.booking_id ? [{ key: 'booking_id', label: t('booking'), value: filters.booking_id }] : []),
        ...(filters.file_type && filters.file_type !== 'all' ? [{ key: 'file_type', label: t('file_type'), value: filters.file_type }] : []),
    ];

    const fileTypeOptions: SelectOption[] = [
        { value: 'all', label: t('all_types') },
        { value: 'application/pdf', label: 'PDF' },
        { value: 'image', label: t('images') },
        { value: 'application/msword', label: 'DOC' },
        { value: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', label: 'DOCX' },
    ];

    const getFileTypeIcon = (fileType?: string) => {
        if (!fileType) return '📄';
        if (fileType.includes('pdf')) return '📕';
        if (fileType.includes('image')) return '🖼️';
        if (fileType.includes('word') || fileType.includes('document')) return '📘';
        return '📄';
    };

    const columns = [
        {
            header: t('id'),
            accessorKey: 'id',
            cell: ({ row }: any) => <span className="font-medium">#{row.original.id}</span>,
        },
        {
            header: t('name'),
            accessorKey: 'name',
            cell: ({ row }: any) => (
                <div className={cn("flex items-center gap-2", flexDirection)} dir={dir}>
                    <span className="text-lg">{getFileTypeIcon(row.original.file_type)}</span>
                    <span className={cn("font-medium", isRTL ? '!text-right' : '!text-left')}>{row.original.name}</span>
                </div>
            ),
        },
        {
            header: t('booking'),
            accessorKey: 'booking',
            cell: ({ row }: any) => {
                const booking = row.original.booking;
                return booking ? (
                    <Link href={`/dashboard/bookings/${booking.id}`} className="text-primary hover:underline">
                        {booking.booking_reference}
                    </Link>
                ) : <span className="text-muted-foreground">—</span>;
            },
        },
        {
            header: t('file_name'),
            accessorKey: 'file_name',
            cell: ({ row }: any) => (
                <span className="text-sm text-muted-foreground">{row.original.file_name}</span>
            ),
        },
        {
            header: t('file_size'),
            accessorKey: 'file_size',
            cell: ({ row }: any) => (
                <span className="text-sm">
                    {row.original.file_size ? formatFileSize(row.original.file_size) : '—'}
                </span>
            ),
        },
        {
            header: t('created_at'),
            accessorKey: 'created_at',
            cell: ({ row }: any) => formatHumanDate(row.original.created_at),
        },
        {
            header: t('actions'),
            accessorKey: 'actions',
            cell: ({ row }: any) => (
                <div className={cn("flex items-center gap-2", flexDirection)}>
                    <Link href={`/dashboard/booking-documents/${row.original.id}/download`}>
                        <Button variant="ghost" size="sm">
                            <Download className="h-4 w-4" />
                        </Button>
                    </Link>
                    <Link href={`/dashboard/booking-documents/${row.original.id}`}>
                        <Button variant="ghost" size="sm">
                            <Eye className="h-4 w-4" />
                        </Button>
                    </Link>
                    <Link href={`/dashboard/booking-documents/${row.original.id}/edit`}>
                        <Button variant="ghost" size="sm">
                            <Edit className="h-4 w-4" />
                        </Button>
                    </Link>
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setDeleteDialog({ open: true, documentId: row.original.id })}
                    >
                        <Trash2 className="h-4 w-4 text-red-500" />
                    </Button>
                </div>
            ),
        },
    ];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={t('booking_documents')} />

            <div className={cn("flex h-full flex-1 flex-col gap-6 overflow-x-auto rounded-xl bg-card dark:bg-card p-6 border border-border", isRTL ? '!text-right' : '!text-left')} dir={dir}>
                {/* Header */}
                <div className={cn("flex items-center justify-between border-b pb-4", flexDirection)}>
                    <div className={cn(isRTL ? '!text-right' : '!text-left')}>
                        <h1 className={cn("text-3xl font-bold text-foreground", isRTL ? '!text-right' : '!text-left')}>{t('booking_documents')}</h1>
                        <p className={cn("text-muted-foreground mt-1", isRTL ? '!text-right' : '!text-left')}>
                            {t('total_documents')}: {documents.total}
                        </p>
                    </div>
                    <div className={cn("flex items-center gap-3", flexDirection)}>
                        <Button
                            variant="outline"
                            onClick={() => setShowFilters(!showFilters)}
                            className={cn("flex items-center gap-2", flexDirection)}
                        >
                            <Filter className="h-4 w-4" />
                            {t('filters')}
                            {activeFilters.length > 0 && (
                                <span className={cn("bg-primary text-primary-foreground rounded-full px-2 py-0.5 text-xs", iconMargin('sm'))}>
                                    {activeFilters.length}
                                </span>
                            )}
                        </Button>
                        <Link href="/dashboard/booking-documents/create">
                            <Button className={cn("flex items-center gap-2", flexDirection)}>
                                <Plus className={cn("h-4 w-4", iconMargin('md'))} />
                                {t('add_document')}
                            </Button>
                        </Link>
                    </div>
                </div>

                {/* Filters */}
                {showFilters && (
                    <CollapsibleFilters
                        activeFilters={activeFilters}
                        onClearFilters={clearFilters}
                    >
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <SearchFieldFilter
                                label={t('search')}
                                value={filters.search}
                                onChange={(value) => handleFilterChange('search', value)}
                                placeholder={t('search_documents')}
                            />
                            <SearchFieldFilter
                                label={t('booking_id')}
                                value={filters.booking_id}
                                onChange={(value) => handleFilterChange('booking_id', value)}
                                placeholder={t('enter_booking_id')}
                            />
                            <SelectFilter
                                label={t('file_type')}
                                value={filters.file_type}
                                options={fileTypeOptions}
                                onChange={(value) => handleFilterChange('file_type', value)}
                            />
                        </div>
                    </CollapsibleFilters>
                )}

                {/* Data Table */}
                <DataTable
                    data={documents.data}
                    columns={columns}
                    pagination={{
                        currentPage: documents.current_page,
                        lastPage: documents.last_page,
                        perPage: documents.per_page,
                        total: documents.total,
                        onPageChange: (page: number) => {
                            router.get('/dashboard/booking-documents', {
                                ...router.page.props,
                                page,
                            }, { preserveState: true });
                        },
                    }}
                />

                {/* Delete Confirmation Dialog */}
                <ConfirmationDialog
                    open={deleteDialog.open}
                    onOpenChange={(open) => setDeleteDialog({ open, documentId: null })}
                    onConfirm={() => deleteDialog.documentId && handleDelete(deleteDialog.documentId)}
                    title={t('delete_document')}
                    description={t('are_you_sure_delete_document')}
                />
            </div>
        </AppLayout>
    );
}

