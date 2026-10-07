import { DataTable } from '@/components/data-table';
import { Button } from '@/components/ui/button';
import { 
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ConfirmationDialog } from '@/components/confirmation-dialog';
import { 
    CollapsibleFilters, 
    SearchFieldFilter, 
    SelectFilter, 
    DateRangeFilter,
    type ActiveFilter,
    type SelectOption 
} from '@/components/filters';
import AppLayout from '@/layouts/app-layout';
import { useTranslation } from '@/hooks/use-translation';
import { useRTL } from '@/hooks/use-rtl';
import { useRTLInit } from '@/hooks/use-rtl-init';
import { usePermissions } from '@/hooks/use-permissions';
import { Head, Link, router, usePage } from '@inertiajs/react';
import { Plus, Eye, Edit, Trash2, Filter } from 'lucide-react';
import { useState, useEffect, useCallback } from 'react';
import { customToast } from '@/components/ui/custom-toast';
import { index as dashboard } from '@/routes/dashboard';
import { type BreadcrumbItem } from '@/types';
import { formatHumanDate } from '@/utils/date-utils';
import { getLocalizedName } from '@/utils/localization';
import { cn } from '@/lib/utils';
import { type SharedData } from '@/types';

interface Category {
    id: number;
    name_en: string;
    name_ar: string;
    description_en?: string;
    description_ar?: string;
    parent_id?: number;
    parent?: Category;
    status: 'active' | 'inactive';
    sort_order: number;
    created_at: string;
    updated_at: string;
    media?: Array<{
        id: number;
        url?: string;
        file_name?: string;
        collection_name?: string;
    }>;
}

interface CategoriesPageProps {
    categories: {
        data: Category[];
        current_page: number;
        last_page: number;
        per_page: number;
        total: number;
    };
    filters: {
        search?: string;
        status?: string;
        created_from?: string;
        created_to?: string;
    };
}

// Breadcrumbs will be set inside component to use translation

export default function CategoriesIndex({ categories, filters: initialFilters }: CategoriesPageProps) {
    useRTLInit();
    const { t, locale } = useTranslation();
    const page = usePage<SharedData>();
    const { locale: pageLocale } = page.props;
    const isRTL = pageLocale === 'ar';
    const dir = isRTL ? 'rtl' : 'ltr';
    const { flexDirection, iconMargin } = useRTL();
    const { can } = usePermissions();
    const { flash } = usePage<SharedData>().props;
    
    const breadcrumbs: BreadcrumbItem[] = [
        { title: t('dashboard'), href: dashboard.url() },
        { title: t('categories_management'), href: '/dashboard/categories' },
    ];

    // Flash messages
    useEffect(() => {
        if (flash?.success) {
            customToast.success(flash.success);
        }
        if (flash?.error) {
            customToast.error(flash.error);
        }
    }, [flash]);
    const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; categoryId: number | null }>({ 
        open: false, 
        categoryId: null 
    });
    const [optimisticCategories, setOptimisticCategories] = useState(categories.data);
    const [showFilters, setShowFilters] = useState(false);
    const [isInitialLoad, setIsInitialLoad] = useState(true);

    // Filter states
    const [filters, setFilters] = useState({
        search: initialFilters?.search || '',
        status: initialFilters?.status || 'all',
        created_from: initialFilters?.created_from || '',
        created_to: initialFilters?.created_to || '',
    });

    const applyFiltersToBackend = useCallback((filtersToApply: typeof filters) => {
        const params: Record<string, any> = {
            page: 1,
        };
        
        if (filtersToApply.search) {
            params.search = filtersToApply.search;
        }
        
        const filterParams: Record<string, any> = {};
        if (filtersToApply.status && filtersToApply.status !== 'all') {
            filterParams.status = filtersToApply.status;
        }
        if (filtersToApply.created_from) {
            filterParams.created_from = filtersToApply.created_from;
        }
        if (filtersToApply.created_to) {
            filterParams.created_to = filtersToApply.created_to;
        }
        
        if (Object.keys(filterParams).length > 0) {
            params.filters = filterParams;
        }
        
        router.get('/dashboard/categories', params, { preserveState: true, preserveScroll: true });
    }, []);

    // Initialize optimistic state
    useEffect(() => {
        setOptimisticCategories(categories.data);
    }, [categories.data]);

    // Auto-apply filters when they change
    useEffect(() => {
        if (isInitialLoad) {
            setIsInitialLoad(false);
            return;
        }
        const timeoutId = setTimeout(() => {
            applyFiltersToBackend(filters);
        }, 300); // Debounce 300ms
        return () => clearTimeout(timeoutId);
    }, [filters, isInitialLoad, applyFiltersToBackend]);

    // Status options for filter
    const statusOptions: SelectOption[] = [
        { value: 'all', label: t('all') },
        { value: 'active', label: t('active') },
        { value: 'inactive', label: t('inactive') },
    ];

    // Build active filters array
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

        if (filters.status && filters.status !== 'all') {
            const option = statusOptions.find(o => o.value === filters.status);
            active.push({
                key: 'status',
                label: t('status'),
                value: filters.status,
                displayValue: option?.label || filters.status,
            });
        }

        if (filters.created_from || filters.created_to) {
            const displayValue = [
                filters.created_from && `${t('date_from')}: ${filters.created_from}`,
                filters.created_to && `${t('date_to')}: ${filters.created_to}`,
            ].filter(Boolean).join(' | ');

            active.push({
                key: 'created_date',
                label: t('created_date'),
                value: [filters.created_from, filters.created_to],
                displayValue,
            });
        }

        return active;
    };

    const handleRemoveFilter = (key: string) => {
        const newFilters = { ...filters };
        
        if (key === 'created_date') {
            newFilters.created_from = '';
            newFilters.created_to = '';
        } else if (key === 'status') {
            newFilters.status = 'all';
        } else {
            newFilters[key as keyof typeof filters] = '';
        }

        setFilters(newFilters);
    };

    const handleClearAllFilters = () => {
        const clearedFilters = {
            search: '',
            status: 'all',
            created_from: '',
            created_to: '',
        };
        setFilters(clearedFilters);
    };

    const handleToggleStatus = (categoryId: number, currentStatus: Category['status']) => {
        const newStatus: Category['status'] = currentStatus === 'active' ? 'inactive' : 'active';

        // Optimistic update
        setOptimisticCategories(prev =>
            prev.map(category =>
                category.id === categoryId ? { ...category, status: newStatus } : category
            )
        );

        router.patch(`/dashboard/categories/${categoryId}/toggle-status`, { status: newStatus }, {
            preserveScroll: true,
            onSuccess: () => {
                customToast.success(t('status_updated_successfully'));
            },
            onError: () => {
                // Revert on error
                setOptimisticCategories(prev =>
                    prev.map(category =>
                        category.id === categoryId ? { ...category, status: currentStatus } : category
                    )
                );
                customToast.error(t('update_failed'));
            },
        });
    };

    const columns = [
        {
            key: 'category',
            label: t('category'),
            render: (_: unknown, category: Category) => {
                // Derive image URL from media (same logic as edit page)
                let imageUrl: string | null = null;
                if (category.media && category.media.length > 0) {
                    const categoryImage =
                        category.media.find(
                            (m) =>
                                m.collection_name === 'category_images' ||
                                m.collection_name === 'images'
                        ) || category.media[0];

                    if (categoryImage) {
                        if (categoryImage.file_name) {
                            if (
                                categoryImage.file_name.startsWith('http://') ||
                                categoryImage.file_name.startsWith('https://')
                            ) {
                                imageUrl = categoryImage.file_name;
                            } else {
                                imageUrl = `/storage/${categoryImage.file_name.replace(/^storage\//, '')}`;
                            }
                        } else if (categoryImage.url) {
                            imageUrl = categoryImage.url;
                        }
                    }
                }

                const categoryName = getLocalizedName(category.name_en, category.name_ar, locale);
                const parentName = category.parent
                    ? getLocalizedName(category.parent.name_en, category.parent.name_ar, locale)
                    : t('no_parent_category');

                const isActive = category.status === 'active';

                return (
                    <div className={cn("flex items-center gap-3", flexDirection)}>
                        {/* Category Image */}
                        <Avatar className="h-10 w-10 flex-shrink-0">
                            {imageUrl ? (
                                <AvatarImage
                                    src={imageUrl}
                                    alt={categoryName}
                                    onError={(e) => {
                                        (e.target as HTMLImageElement).style.display = 'none';
                                    }}
                                />
                            ) : null}
                            <AvatarFallback className="bg-purple-500/10 text-purple-600 dark:text-purple-400 font-semibold">
                                {categoryName.charAt(0).toUpperCase()}
                            </AvatarFallback>
                        </Avatar>

                        {/* Name + Parent */}
                        <div className={cn("flex flex-col min-w-0 flex-1", isRTL ? '!text-right' : '!text-left')}>
                            <span className={cn("font-medium text-foreground truncate", isRTL ? '!text-right' : '!text-left')} dir={dir}>
                                {categoryName}
                            </span>
                            <span className={cn("text-xs text-muted-foreground truncate", isRTL ? '!text-right' : '!text-left')} dir={dir}>
                                {parentName}
                            </span>
                        </div>

                        {/* Status toggle + badge */}
                        <div
                            className={cn(
                                "flex items-center gap-2",
                                isRTL ? 'ml-auto flex-row-reverse' : 'ml-auto'
                            )}
                        >
                            {can('categories.toggle-status') && (
                                <Switch
                                    checked={isActive}
                                    onCheckedChange={() => handleToggleStatus(category.id, category.status)}
                                    aria-label={isActive ? t('deactivate') : t('activate')}
                                />
                            )}
                            <Badge
                                variant={isActive ? 'default' : 'secondary'}
                                className={
                                    isActive
                                        ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300'
                                        : 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300'
                                }
                            >
                                {t(category.status)}
                            </Badge>
                        </div>
                    </div>
                );
            },
        },
        {
            key: 'created_at',
            label: t('created_at'),
            render: (_: unknown, category: Category) => (
                <span className={cn("text-sm text-muted-foreground", isRTL ? '!text-right' : '!text-left')} dir={dir}>
                    {formatHumanDate(category.created_at, t)}
                </span>
            ),
        },
        {
            key: 'actions',
            label: t('actions'),
            render: (_: unknown, category: Category) => (
                <div className={cn("flex items-center gap-1 w-full", isRTL ? 'justify-start flex-row-reverse' : 'justify-end')}>
                    {can('categories.show') && (
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => router.visit(`/dashboard/categories/${category.id}`)}
                            title={t('view')}
                            aria-label={t('view')}
                        >
                            <Eye className="h-4 w-4" />
                        </Button>
                    )}
                    {can('categories.edit') && (
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => router.visit(`/dashboard/categories/${category.id}/edit`)}
                            title={t('edit')}
                            aria-label={t('edit')}
                        >
                            <Edit className="h-4 w-4" />
                        </Button>
                    )}
                    {can('categories.destroy') && (
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setDeleteDialog({ open: true, categoryId: category.id })}
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
        if (deleteDialog.categoryId) {
            const category = optimisticCategories.find(c => c.id === deleteDialog.categoryId);
            router.delete(`/dashboard/categories/${deleteDialog.categoryId}`, {
                onSuccess: (page) => {
                    // Check if there's an error message in the response
                    if (page?.props?.flash?.error) {
                        customToast.error(page.props.flash.error);
                    } else if (page?.props?.flash?.success) {
                        customToast.success(page.props.flash.success);
                        setOptimisticCategories(prev => prev.filter(c => c.id !== deleteDialog.categoryId));
                    } else {
                        customToast.success(t('category_deleted_successfully'), category?.name_en);
                    setOptimisticCategories(prev => prev.filter(c => c.id !== deleteDialog.categoryId));
                    }
                },
                onError: (errors) => {
                    // Handle validation errors or other errors
                    const errorMessage = errors?.message || errors?.error || t('delete_failed');
                    customToast.error(errorMessage);
                }
            });
        }
    };

    const handlePageChange = (page: number) => {
        const params: Record<string, any> = { page, per_page: categories.per_page };
        
        if (filters.search) {
            params.search = filters.search;
        }
        
        const filterParams: Record<string, any> = {};
        if (filters.status && filters.status !== 'all') {
            filterParams.status = filters.status;
        }
        if (filters.created_from) {
            filterParams.created_from = filters.created_from;
        }
        if (filters.created_to) {
            filterParams.created_to = filters.created_to;
        }
        
        if (Object.keys(filterParams).length > 0) {
            params.filters = filterParams;
        }
        
        router.get('/dashboard/categories', params, { preserveState: true, preserveScroll: true });
    };

    const handlePerPageChange = (perPage: number) => {
        router.reload({
            data: {
                per_page: perPage,
                page: 1,
            },
            only: [],
        });
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={t('categories_management')} />

            <div className={cn("flex h-full flex-1 flex-col gap-6 overflow-x-auto rounded-xl bg-card dark:bg-card p-6 border border-border", isRTL ? '!text-right' : '!text-left')} dir={dir}>
                {/* Header */}
                <div className={cn("flex items-center justify-between border-b pb-4", flexDirection)}>
                    <div className={cn(isRTL ? '!text-right' : '!text-left')}>
                        <h1 className={cn("text-3xl font-bold text-foreground", isRTL ? '!text-right' : '!text-left')}>{t('categories_management')}</h1>
                        <p className={cn("text-muted-foreground mt-1", isRTL ? '!text-right' : '!text-left')}>{t('manage_categories')}</p>
                    </div>
                    {can('categories.create') && (
                        <Link href="/dashboard/categories/create">
                            <Button className={cn("flex items-center gap-2", flexDirection)}>
                                <Plus className={cn("h-4 w-4", iconMargin('md'))} />
                                {t('add_category')}
                            </Button>
                        </Link>
                    )}
                </div>

                {/* Pagination Info and Show Filters Button */}
                <div className={cn("flex items-center justify-between", flexDirection)}>
                    <div className={cn("flex items-center gap-2", flexDirection)}>
                        <span className={cn("text-sm text-foreground", isRTL ? '!text-right' : '!text-left')}>
                            {t('showing')} {((categories.current_page - 1) * categories.per_page) + 1} {t('of')} {categories.total} {t('results')}
                        </span>
                        <Select value={categories.per_page.toString()} onValueChange={(value) => handlePerPageChange(Number(value))}>
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
                            placeholder={t('search_categories')}
                        />
                        
                        <SelectFilter
                            id="status"
                            label={t('status')}
                            value={filters.status}
                            onChange={(value) => setFilters(prev => ({ ...prev, status: value }))}
                            options={statusOptions}
                            placeholder={t('all')}
                        />
                        
                        <DateRangeFilter
                            id="created_date"
                            label={t('created_date')}
                            fromValue={filters.created_from}
                            toValue={filters.created_to}
                            onFromChange={(value) => setFilters(prev => ({ ...prev, created_from: value }))}
                            onToChange={(value) => setFilters(prev => ({ ...prev, created_to: value }))}
                            fromPlaceholder={t('date_from')}
                            toPlaceholder={t('date_to')}
                        />
                    </CollapsibleFilters>
                )}

                {/* Data Table */}
                <DataTable
                    data={optimisticCategories}
                    columns={columns}
                    total={categories.total}
                    currentPage={categories.current_page}
                    perPage={categories.per_page}
                    onPageChange={handlePageChange}
                    onPerPageChange={handlePerPageChange}
                    locale={locale}
                />
            </div>

            {/* Delete Dialog */}
            <ConfirmationDialog
                open={deleteDialog.open}
                onOpenChange={(open) => setDeleteDialog({ open, categoryId: null })}
                onConfirm={handleDelete}
                title={t('delete_category')}
                description={t('delete_category_confirmation')}
                variant="danger"
                confirmText={t('delete')}
            />
        </AppLayout>
    );
}

