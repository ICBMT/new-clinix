import { DataTable } from '@/components/data-table';
import { Button } from '@/components/ui/button';
import { ConfirmationDialog } from '@/components/confirmation-dialog';
import { 
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { 
    CollapsibleFilters, 
    SearchFieldFilter, 
    type ActiveFilter,
} from '@/components/filters';
import AppLayout from '@/layouts/app-layout';
import { useRTLInit } from '@/hooks/use-rtl-init';
import { useTranslation } from '@/hooks/use-translation';
import { useRTL } from '@/hooks/use-rtl';
import { Head, router } from '@inertiajs/react';
import { Eye, Trash2, Filter, Download, FileText } from 'lucide-react';
import { useState, useEffect, useCallback } from 'react';
import { customToast } from '@/components/ui/custom-toast';
import { index as dashboard } from '@/routes/dashboard';
import { type BreadcrumbItem } from '@/types';
import { formatHumanDate } from '@/utils/date-utils';
import { cn } from '@/lib/utils';

interface MedicalRecord {
    id: number;
    file_name: string;
    file_size?: number;
    mime_type?: string;
    disk?: string;
    created_at: string;
    mediable?: {
        id: number;
        name: string;
        email: string;
    } | null;
}

interface MedicalRecordsPageProps {
    records: {
        data: MedicalRecord[];
        current_page: number;
        last_page: number;
        per_page: number;
        total: number;
    };
    filters: {
        search?: string;
        user_id?: string;
    };
}

export default function MedicalRecordsIndex({ records, filters: initialFilters }: MedicalRecordsPageProps) {
    useRTLInit();
    const { t, locale } = useTranslation();
    const { isRTL, dir, textAlign, flexDirection, iconMargin } = useRTL();
    
    const breadcrumbs: BreadcrumbItem[] = [
        {
            title: t('dashboard'),
            href: dashboard.url(),
        },
        {
            title: t('medical_records_management'),
            href: '/dashboard/medical-records',
        },
    ];
    const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; recordId: number | null }>({ open: false, recordId: null });
    const [optimisticRecords, setOptimisticRecords] = useState(records.data);
    const [showFilters, setShowFilters] = useState(false);
    const [isInitialLoad, setIsInitialLoad] = useState(true);

    const [filters, setFilters] = useState({
        search: initialFilters?.search || '',
    });

    const applyFiltersToBackend = useCallback((filtersToApply: typeof filters) => {
        router.get('/dashboard/medical-records', {
            page: 1,
            search: filtersToApply.search || undefined,
        }, { preserveState: true });
    }, []);

    useEffect(() => {
        setOptimisticRecords(records.data);
    }, [records.data]);

    useEffect(() => {
        if (isInitialLoad) {
            setIsInitialLoad(false);
            return;
        }

        const timeoutId = setTimeout(() => {
            applyFiltersToBackend(filters);
        }, 300);

        return () => clearTimeout(timeoutId);
    }, [filters, isInitialLoad, applyFiltersToBackend]);

    const getActiveFilters = (): ActiveFilter[] => {
        const active: ActiveFilter[] = [];

        if (filters.search) {
            active.push({
                key: 'search',
                label: t('search'),
                value: filters.search,
                displayValue: filters.search,
            });
        }

        return active;
    };

    const handleRemoveFilter = (key: string) => {
        const newFilters = { ...filters };
        newFilters[key as keyof typeof filters] = '';
        setFilters(newFilters);
    };

    const handleClearAllFilters = () => {
        const clearedFilters = {
            search: '',
        };
        setFilters(clearedFilters);
    };

    const formatFileSize = (bytes?: number) => {
        if (!bytes) return t('unknown');
        const kb = bytes / 1024;
        const mb = kb / 1024;
        if (mb >= 1) return `${mb.toFixed(2)} MB`;
        return `${kb.toFixed(2)} KB`;
    };

    const columns = [
        {
            key: 'file',
            label: t('file'),
            render: (_: unknown, record: MedicalRecord) => (
                <div className={cn("flex items-center gap-3", flexDirection)}>
                    <FileText className={cn("h-8 w-8 text-muted-foreground", iconMargin('md'))} />
                    <div className={textAlign}>
                        <p className={cn("font-medium", textAlign)} dir={dir}>{record.file_name}</p>
                        {record.mime_type && (
                            <p className={cn("text-sm text-muted-foreground", textAlign)} dir={dir}>{record.mime_type}</p>
                        )}
                    </div>
                </div>
            ),
        },
        {
            key: 'user',
            label: t('user'),
            render: (_: unknown, record: MedicalRecord) => (
                <div className={textAlign}>
                    <p className={cn("font-medium", textAlign)} dir={dir}>{record.mediable?.name || t('unknown')}</p>
                    <p className={cn("text-sm text-muted-foreground", textAlign)} dir="ltr">{record.mediable?.email || ''}</p>
                </div>
            ),
        },
        {
            key: 'file_size',
            label: t('file_size'),
            render: (_: unknown, record: MedicalRecord) => (
                <p className={cn("text-sm", textAlign)} dir="ltr">{formatFileSize(record.file_size)}</p>
            ),
        },
        {
            key: 'created_at',
            label: t('uploaded_at'),
            render: (date: string) => (
                <span className={cn("text-sm", textAlign)} dir={dir}>{formatHumanDate(date)}</span>
            ),
        },
        {
            key: 'actions',
            label: t('actions'),
            render: (_: unknown, record: MedicalRecord) => (
                <div className={cn("flex items-center gap-1", isRTL ? 'justify-start flex-row-reverse' : 'justify-end')}>
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => router.visit(`/dashboard/medical-records/${record.id}`)}
                        title={t('view')}
                    >
                        <Eye className="h-4 w-4" />
                    </Button>
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                            window.open(`/dashboard/medical-records/${record.id}/download`, '_blank');
                        }}
                        title={t('download')}
                    >
                        <Download className="h-4 w-4" />
                    </Button>
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setDeleteDialog({ open: true, recordId: record.id })}
                        title={t('delete')}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                        <Trash2 className="h-4 w-4" />
                    </Button>
                </div>
            ),
        },
    ];

    const handleDelete = () => {
        if (deleteDialog.recordId) {
            const record = optimisticRecords.find(r => r.id === deleteDialog.recordId);
            router.delete(`/dashboard/medical-records/${deleteDialog.recordId}`, {
                onSuccess: () => {
                    customToast.success(t('record_deleted_successfully'), record?.file_name);
                    setOptimisticRecords(prev => prev.filter(r => r.id !== deleteDialog.recordId));
                },
                onError: () => {
                    customToast.error(t('delete_failed'));
                }
            });
        }
    };

    const handlePageChange = (page: number) => {
        router.get('/dashboard/medical-records', {
            page,
            per_page: records.per_page,
            search: filters.search || undefined,
        }, { preserveState: true });
    };

    const handlePerPageChange = (perPage: number) => {
        router.get('/dashboard/medical-records', {
            per_page: perPage,
            page: 1,
            search: filters.search || undefined,
        }, { preserveState: true });
    };

    const handleExport = () => {
        router.get('/dashboard/medical-records/export/csv', {}, {
            onSuccess: () => {
                customToast.success(t('export_started'));
            },
        });
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={t('medical_records_management')} />
            
            <div className={cn("flex h-full flex-1 flex-col gap-6 overflow-x-auto rounded-xl bg-card dark:bg-card p-6 border border-border", textAlign)} dir={dir}>
                <div className={cn("flex items-center justify-between", flexDirection)}>
                    <div className={textAlign}>
                        <h1 className={cn("text-3xl font-bold text-foreground", textAlign)}>{t('medical_records_management')}</h1>
                        <p className={cn("text-muted-foreground mt-1", textAlign)}>{t('manage_medical_records_description')}</p>
                    </div>
                    <Button
                        variant="outline"
                        onClick={handleExport}
                        className={cn("flex items-center gap-2", flexDirection)}
                    >
                        <Download className={cn("h-4 w-4", iconMargin('md'))} />
                        {t('export_csv')}
                    </Button>
                </div>

                <div className={cn("flex items-center justify-between", flexDirection)}>
                    <div className={cn("flex items-center gap-2", flexDirection)}>
                        <span className={cn("text-sm text-foreground", textAlign)}>
                            {t('showing')} {((records.current_page - 1) * records.per_page) + 1} {t('of')} {records.total} {t('results')}
                        </span>
                        <Select value={records.per_page.toString()} onValueChange={(value) => handlePerPageChange(Number(value))}>
                            <SelectTrigger className={cn("w-20", textAlign)}>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="10">10</SelectItem>
                                <SelectItem value="15">15</SelectItem>
                                <SelectItem value="25">25</SelectItem>
                                <SelectItem value="50">50</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    
                    <div className={cn("flex items-center gap-2", flexDirection)}>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setShowFilters(!showFilters)}
                            className={cn("flex items-center gap-2", flexDirection)}
                        >
                            <Filter className={cn("h-4 w-4", iconMargin('md'))} />
                            {showFilters ? t('hide_filters') : t('show_filters')}
                            {getActiveFilters().length > 0 && (
                                <span className={cn(isRTL ? 'mr-1' : 'ml-1', "px-1.5 py-0.5 text-xs bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-300 rounded-full")}>
                                    {getActiveFilters().length}
                                </span>
                            )}
                        </Button>
                    </div>
                </div>

                {showFilters && (
                    <CollapsibleFilters
                        activeFilters={getActiveFilters()}
                        onRemoveFilter={handleRemoveFilter}
                        onClearAll={handleClearAllFilters}
                        isOpen={true}
                    >
                        <SearchFieldFilter
                            id="search"
                            label={t('search')}
                            value={filters.search}
                            onChange={(value) => setFilters(prev => ({ ...prev, search: value }))}
                            placeholder={t('search_by_file_name_or_user')}
                        />
                    </CollapsibleFilters>
                )}

                <DataTable
                    data={optimisticRecords}
                    columns={columns}
                    total={records.total}
                    currentPage={records.current_page}
                    perPage={records.per_page}
                    onPageChange={handlePageChange}
                    onPerPageChange={handlePerPageChange}
                />
            </div>

            <ConfirmationDialog
                open={deleteDialog.open}
                onOpenChange={(open) => setDeleteDialog({ open, recordId: null })}
                onConfirm={handleDelete}
                title={t('delete_record')}
                description={t('delete_medical_record_confirmation')}
                cancelText={t('cancel')}
                variant="danger"
                confirmText={t('delete')}
            />
        </AppLayout>
    );
}

