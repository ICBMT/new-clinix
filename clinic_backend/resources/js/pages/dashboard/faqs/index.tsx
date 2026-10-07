import { DataTable } from '@/components/data-table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
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
    SelectFilter, 
    type ActiveFilter,
    type SelectOption 
} from '@/components/filters';
import AppLayout from '@/layouts/app-layout';
import { useRTLInit } from '@/hooks/use-rtl-init';
import { useTranslation } from '@/hooks/use-translation';
import { useRTL } from '@/hooks/use-rtl';
import { usePermissions } from '@/hooks/use-permissions';
import { Head, Link, router, usePage } from '@inertiajs/react';
import { type SharedData } from '@/types';
import { Plus, Eye, Edit, Trash2, Filter, CheckCircle, XCircle } from 'lucide-react';
import { useState, useEffect, useCallback } from 'react';
import { customToast } from '@/components/ui/custom-toast';
import { index as dashboard } from '@/routes/dashboard';
import { type BreadcrumbItem } from '@/types';
import { formatHumanDate } from '@/utils/date-utils';
import { cn } from '@/lib/utils';

interface Faq {
    id: number;
    question_en: string;
    question_ar?: string;
    answer_en: string;
    answer_ar?: string;
    category?: string;
    is_active: boolean;
    sort_order: number;
    created_at: string;
}

interface FaqsPageProps {
    faqs: {
        data: Faq[];
        current_page: number;
        last_page: number;
        per_page: number;
        total: number;
    };
    filters: {
        search?: string;
        category?: string;
        status?: string;
    };
}

export default function FaqsIndex({ faqs, filters: initialFilters }: FaqsPageProps) {
    useRTLInit();
    const { t, locale } = useTranslation();
    const page = usePage<SharedData>();
    const { locale: pageLocale } = page.props;
    const isRTL = pageLocale === 'ar';
    const dir = isRTL ? 'rtl' : 'ltr';
    const { flexDirection, iconMargin } = useRTL();
    const { can } = usePermissions();
    
    const breadcrumbs: BreadcrumbItem[] = [
        {
            title: t('dashboard'),
            href: dashboard.url(),
        },
        {
            title: t('faq_management'),
            href: '/dashboard/faqs',
        },
    ];

    const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; faqId: number | null }>({ open: false, faqId: null });
    const [optimisticFaqs, setOptimisticFaqs] = useState(faqs.data);
    const [showFilters, setShowFilters] = useState(false);
    const [isInitialLoad, setIsInitialLoad] = useState(true);

    const [filters, setFilters] = useState({
        search: initialFilters?.search || '',
        is_active: (() => {
            const isActive = initialFilters?.is_active;
            if (isActive === true || isActive === 'true' || isActive === '1') {
                return 'true';
            } else if (isActive === false || isActive === 'false' || isActive === '0') {
                return 'false';
            }
            return 'all';
        })(),
    });

    const applyFiltersToBackend = useCallback((filtersToApply: typeof filters) => {
        const params: Record<string, any> = {
            page: 1,
        };
        
        if (filtersToApply.search) {
            params.search = filtersToApply.search;
        }
        
        const filtersObj: Record<string, any> = {};
        
        // Only include is_active if it's not 'all'
        if (filtersToApply.is_active && filtersToApply.is_active !== 'all') {
            if (filtersToApply.is_active === 'true') {
                filtersObj.is_active = true;
            } else if (filtersToApply.is_active === 'false') {
                filtersObj.is_active = false;
            }
        }
        
        // Only include filters if there are any
        if (Object.keys(filtersObj).length > 0) {
            params.filters = filtersObj;
        }
        
        router.get('/dashboard/faqs', params, { 
            preserveState: true, 
            preserveScroll: true,
            replace: true, // Replace current history entry to avoid filter persistence
        });
    }, []);

    useEffect(() => {
        setOptimisticFaqs(faqs.data);
    }, [faqs.data]);

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

    const statusOptions: SelectOption[] = [
        { value: 'all', label: t('all') },
        { value: 'true', label: t('active') },
        { value: 'false', label: t('inactive') },
    ];

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

        if (filters.is_active && filters.is_active !== 'all') {
            const option = statusOptions.find(o => o.value === filters.is_active);
            active.push({
                key: 'is_active',
                label: t('status'),
                value: filters.is_active,
                displayValue: option?.label || filters.is_active,
            });
        }

        return active;
    };

    const handleRemoveFilter = (key: string) => {
        const newFilters = { ...filters };
        
        if (key === 'is_active') {
            newFilters.is_active = 'all';
        } else {
            newFilters[key as keyof typeof filters] = '';
        }

        setFilters(newFilters);
    };

    const handleClearAllFilters = () => {
        const clearedFilters = {
            search: '',
            is_active: 'all',
        };
        setFilters(clearedFilters);
    };

    const columns = [
        {
            key: 'question_answer',
            label: t('question_and_answer') || t('question') + ' / ' + t('answer'),
            render: (_: unknown, faq: Faq) => (
                <div className={cn("space-y-2", isRTL ? '!text-right' : '!text-left')} dir={dir}>
                    <div className={cn("font-medium text-foreground", isRTL ? '!text-right' : '!text-left')} dir={dir}>
                        {locale === 'ar' && faq.question_ar ? faq.question_ar : faq.question_en}
                    </div>
                    <div className={cn("text-sm text-muted-foreground line-clamp-2", isRTL ? '!text-right' : '!text-left')} dir={dir}>
                        {locale === 'ar' && faq.answer_ar ? faq.answer_ar : faq.answer_en}
                    </div>
                </div>
            ),
        },
        {
            key: 'status',
            label: t('status'),
            render: (_: unknown, faq: Faq) => (
                <Badge 
                    variant={faq.is_active ? 'default' : 'secondary'}
                    className={cn(
                        faq.is_active 
                            ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300' 
                            : 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300',
                        isRTL ? '!text-right' : '!text-left'
                    )}
                >
                    {faq.is_active ? t('active') : t('inactive')}
                </Badge>
            ),
        },
        {
            key: 'created_at',
            label: t('created_at'),
            render: (date: string) => formatHumanDate(date, t),
        },
        {
            key: 'actions',
            label: t('actions'),
            render: (_: unknown, faq: Faq) => (
                <div className={cn("flex items-center gap-1 w-full", isRTL ? 'justify-start flex-row-reverse' : 'justify-end')}>
                    {can('faqs.show') && (
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => router.visit(`/dashboard/faqs/${faq.id}`)}
                            title={t('view')}
                            aria-label={t('view')}
                        >
                            <Eye className="h-4 w-4" />
                        </Button>
                    )}
                    {can('faqs.edit') && (
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => router.visit(`/dashboard/faqs/${faq.id}/edit`)}
                            title={t('edit')}
                            aria-label={t('edit')}
                        >
                            <Edit className="h-4 w-4" />
                        </Button>
                    )}
                    {can('faqs.toggle-status') && (
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => router.patch(`/dashboard/faqs/${faq.id}/toggle-status`, {}, {
                                onSuccess: () => {
                                    customToast.success(t('status_updated_successfully'));
                                    setOptimisticFaqs(prev => prev.map(f => 
                                        f.id === faq.id ? { ...f, is_active: !f.is_active } : f
                                    ));
                                },
                                onError: () => {
                                    customToast.error(t('status_update_failed'));
                                },
                            })}
                            title={faq.is_active ? t('deactivate') : t('activate')}
                            aria-label={faq.is_active ? t('deactivate') : t('activate')}
                            className={faq.is_active ? 'text-orange-600 hover:text-orange-700 hover:bg-orange-50' : 'text-green-600 hover:text-green-700 hover:bg-green-50'}
                        >
                            {faq.is_active ? <XCircle className="h-4 w-4" /> : <CheckCircle className="h-4 w-4" />}
                        </Button>
                    )}
                    {can('faqs.destroy') && (
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setDeleteDialog({ open: true, faqId: faq.id })}
                            title={t('delete')}
                            aria-label={t('delete')}
                            className="text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-900/20"
                        >
                            <Trash2 className="h-4 w-4" />
                        </Button>
                    )}
                </div>
            ),
        },
    ];

    const handleDelete = () => {
        if (deleteDialog.faqId) {
            const faq = optimisticFaqs.find(f => f.id === deleteDialog.faqId);
            router.delete(`/dashboard/faqs/${deleteDialog.faqId}`, {
                onSuccess: () => {
                    customToast.success(t('faq_deleted_successfully'), faq?.question_en);
                    setOptimisticFaqs(prev => prev.filter(f => f.id !== deleteDialog.faqId));
                },
                onError: () => {
                    customToast.error(t('delete_failed'));
                }
            });
        }
    };

    const handlePageChange = (page: number) => {
        const params: Record<string, any> = {
            page,
            per_page: faqs.per_page,
        };
        
        if (filters.search) {
            params.search = filters.search;
        }
        
        const filtersObj: Record<string, any> = {};
        
        // Only include is_active if it's not 'all'
        if (filters.is_active && filters.is_active !== 'all') {
            if (filters.is_active === 'true') {
                filtersObj.is_active = true;
            } else if (filters.is_active === 'false') {
                filtersObj.is_active = false;
            }
        }
        
        // Only include filters if there are any
        if (Object.keys(filtersObj).length > 0) {
            params.filters = filtersObj;
        }
        
        router.get('/dashboard/faqs', params, { preserveState: true, preserveScroll: true });
    };

    const handlePerPageChange = (perPage: number) => {
        router.reload({
            data: {
                per_page: perPage,
                page: 1,
            },
            only: [],
            preserveState: true,
            preserveScroll: true,
        });
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={t('faq_management')} />

            <div className={cn("flex h-full flex-1 flex-col gap-6 overflow-x-auto rounded-xl bg-card dark:bg-card p-6 border border-border", isRTL ? '!text-right' : '!text-left')} dir={dir}>
                {/* Header */}
                <div className={cn("flex items-center justify-between border-b pb-4", flexDirection)}>
                    <div className={cn(isRTL ? '!text-right' : '!text-left')}>
                        <h1 className={cn("text-3xl font-bold text-foreground", isRTL ? '!text-right' : '!text-left')}>{t('faq_management')}</h1>
                        <p className={cn("text-muted-foreground mt-1", isRTL ? '!text-right' : '!text-left')}>{t('manage_faqs_description')}</p>
                    </div>
                    {can('faqs.create') && (
                        <Link href="/dashboard/faqs/create">
                            <Button className={cn("flex items-center gap-2", flexDirection)}>
                                <Plus className={cn("h-4 w-4", iconMargin('md'))} />
                                {t('add_faq')}
                            </Button>
                        </Link>
                    )}
                </div>

                {/* Pagination Info and Show Filters Button */}
                <div className={cn("flex items-center justify-between", flexDirection)}>
                    <div className={cn("flex items-center gap-2", flexDirection)}>
                        <span className={cn("text-sm text-foreground", isRTL ? '!text-right' : '!text-left')}>
                            {t('showing')} {((faqs.current_page - 1) * faqs.per_page) + 1} {t('of')} {faqs.total} {t('results')}
                        </span>
                        <Select value={faqs.per_page.toString()} onValueChange={(value) => handlePerPageChange(Number(value))}>
                            <SelectTrigger className={cn("w-20", isRTL ? '!text-right' : '!text-left')}>
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
                            <Filter className="h-4 w-4" />
                            {showFilters ? t('hide_filters') : t('show_filters')}
                            {getActiveFilters().length > 0 && (
                                <span className={cn("px-1.5 py-0.5 text-xs bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-300 rounded-full", iconMargin('sm'))}>
                                    {getActiveFilters().length}
                                </span>
                            )}
                        </Button>
                    </div>
                </div>

                {/* Filters */}
                {showFilters && (
                    <CollapsibleFilters
                        activeFilters={getActiveFilters()}
                        onRemoveFilter={handleRemoveFilter}
                        onClearAll={handleClearAllFilters}
                        isOpen={true}
                        locale={locale}
                    >
                        <SearchFieldFilter
                            id="search"
                            label={t('search')}
                            value={filters.search}
                            onChange={(value) => setFilters(prev => ({ ...prev, search: value }))}
                            placeholder={t('search_by_question_or_answer')}
                        />
                        
                        <SelectFilter
                            id="is_active"
                            label={t('status')}
                            value={filters.is_active}
                            onChange={(value) => setFilters(prev => ({ ...prev, is_active: value }))}
                            options={statusOptions}
                            placeholder={t('all')}
                        />
                    </CollapsibleFilters>
                )}

                {/* Data Table */}
                <DataTable
                    data={optimisticFaqs}
                    columns={columns}
                    total={faqs.total}
                    currentPage={faqs.current_page}
                    perPage={faqs.per_page}
                    onPageChange={handlePageChange}
                    onPerPageChange={handlePerPageChange}
                    locale={locale}
                />
            </div>

            {/* Delete Dialog */}
            <ConfirmationDialog
                open={deleteDialog.open}
                onOpenChange={(open) => setDeleteDialog({ open, faqId: null })}
                onConfirm={handleDelete}
                title={t('delete_faq')}
                description={t('delete_faq_confirmation')}
                variant="danger"
                confirmText={t('delete')}
            />
        </AppLayout>
    );
}

