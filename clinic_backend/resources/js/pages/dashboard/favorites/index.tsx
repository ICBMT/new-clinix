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
import { useRTLInit } from '@/hooks/use-rtl-init';
import { useTranslation } from '@/hooks/use-translation';
import { useRTL } from '@/hooks/use-rtl';
import { Head, Link, router } from '@inertiajs/react';
import { Eye, Trash2, Filter, Heart } from 'lucide-react';
import { useState, useCallback } from 'react';
import { index as dashboard } from '@/routes/dashboard';
import { type BreadcrumbItem } from '@/types';
import { formatHumanDate } from '@/utils/date-utils';
import { cn } from '@/lib/utils';

interface Favorite {
    id: number;
    user_id: number;
    favoritable_type: string;
    favoritable_id: number;
    created_at: string;
    user?: {
        id: number;
        name: string;
        email: string;
    };
    favoritable?: {
        id: number;
        name?: string;
        name_en?: string;
        name_ar?: string;
        title?: string;
    };
}

interface FavoritesPageProps {
    favorites: {
        data: Favorite[];
        current_page: number;
        last_page: number;
        per_page: number;
        total: number;
    };
    filters: {
        search?: string;
        user_id?: string;
        favoritable_type?: string;
    };
}

export default function FavoritesIndex({ favorites, filters: initialFilters }: FavoritesPageProps) {
    useRTLInit();
    const { t, locale } = useTranslation();
    const { isRTL, dir, textAlign, flexDirection, iconMargin } = useRTL();
    
    const breadcrumbs: BreadcrumbItem[] = [
        {
            title: t('dashboard'),
            href: dashboard.url(),
        },
        {
            title: t('favorites'),
            href: '/dashboard/favorites',
        },
    ];
    const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; favoriteId: number | null }>({ 
        open: false, 
        favoriteId: null 
    });
    const [showFilters, setShowFilters] = useState(false);

    const [filters, setFilters] = useState({
        search: initialFilters?.search || '',
        user_id: initialFilters?.user_id || '',
        favoritable_type: initialFilters?.favoritable_type || 'all',
    });

    const applyFiltersToBackend = useCallback((filtersToApply: typeof filters) => {
        router.get('/dashboard/favorites', {
            page: 1,
            search: filtersToApply.search || undefined,
            filters: {
                user_id: filtersToApply.user_id || undefined,
                favoritable_type: filtersToApply.favoritable_type && filtersToApply.favoritable_type !== 'all' ? filtersToApply.favoritable_type : undefined,
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
            user_id: '',
            favoritable_type: 'all',
        };
        setFilters(clearedFilters);
        applyFiltersToBackend(clearedFilters);
    };

    const handleDelete = (favoriteId: number) => {
        router.delete(`/dashboard/favorites/${favoriteId}`, {
            onSuccess: () => {
                setDeleteDialog({ open: false, favoriteId: null });
            },
        });
    };

    const activeFilters: ActiveFilter[] = [
        ...(filters.search ? [{ key: 'search', label: t('search'), value: filters.search }] : []),
        ...(filters.user_id ? [{ key: 'user_id', label: t('user'), value: filters.user_id }] : []),
        ...(filters.favoritable_type && filters.favoritable_type !== 'all' ? [{ key: 'favoritable_type', label: t('type'), value: filters.favoritable_type }] : []),
    ];

    const typeOptions: SelectOption[] = [
        { value: 'all', label: t('all_types') },
        { value: 'App\\Models\\Treatment', label: t('treatments') },
        { value: 'App\\Models\\Clinic', label: t('clinics') },
    ];

    const getFavoritableName = (favorite: Favorite) => {
        if (!favorite.favoritable) return `#${favorite.favoritable_id}`;
        const item = favorite.favoritable;
        if (item.name) return item.name;
        if (item.name_en || item.name_ar) {
            return isRTL ? item.name_ar : item.name_en;
        }
        if (item.title) return item.title;
        return `#${favorite.favoritable_id}`;
    };

    const columns = [
        {
            header: t('id'),
            accessorKey: 'id',
            cell: ({ row }: any) => <span className={cn("font-medium", textAlign)} dir="ltr">#{row.original.id}</span>,
        },
        {
            header: t('user'),
            accessorKey: 'user',
            cell: ({ row }: any) => {
                const user = row.original.user;
                return user ? (
                    <Link href={`/dashboard/users/${user.id}`} className={cn("text-primary hover:underline", textAlign)} dir={dir}>
                        {user.name}
                    </Link>
                ) : <span className={cn("text-muted-foreground", textAlign)} dir={dir}>—</span>;
            },
        },
        {
            header: t('type'),
            accessorKey: 'favoritable_type',
            cell: ({ row }: any) => {
                const type = row.original.favoritable_type;
                const typeName = type.split('\\').pop() || type;
                return <Badge variant="secondary">{typeName}</Badge>;
            },
        },
        {
            header: t('item'),
            accessorKey: 'favoritable',
            cell: ({ row }: any) => (
                <div className={cn("flex items-center gap-2", flexDirection)}>
                    <Heart className={cn("h-4 w-4 text-red-500", iconMargin('md'))} />
                    <span className={cn("font-medium", textAlign)} dir={dir}>{getFavoritableName(row.original)}</span>
                </div>
            ),
        },
        {
            header: t('created_at'),
            accessorKey: 'created_at',
            cell: ({ row }: any) => (
                <span className={cn("text-sm", textAlign)} dir={dir}>{formatHumanDate(row.original.created_at)}</span>
            ),
        },
        {
            header: t('actions'),
            accessorKey: 'actions',
            cell: ({ row }: any) => (
                <div className={cn("flex items-center gap-2", flexDirection)}>
                    <Link href={`/dashboard/favorites/${row.original.id}`}>
                        <Button variant="ghost" size="sm" className={flexDirection}>
                            <Eye className={cn("h-4 w-4", iconMargin('md'))} />
                        </Button>
                    </Link>
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setDeleteDialog({ open: true, favoriteId: row.original.id })}
                        className={flexDirection}
                    >
                        <Trash2 className={cn("h-4 w-4 text-red-500", iconMargin('md'))} />
                    </Button>
                </div>
            ),
        },
    ];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={t('favorites')} />

            <div className={cn("flex h-full flex-1 flex-col gap-6 overflow-x-auto rounded-xl bg-card dark:bg-card p-6 border border-border", textAlign)} dir={dir}>
                {/* Header */}
                <div className={cn("flex items-center justify-between border-b pb-4", flexDirection)}>
                    <div className={textAlign}>
                        <h1 className={cn("text-3xl font-bold text-foreground", textAlign)}>{t('favorites')}</h1>
                        <p className={cn("text-muted-foreground mt-1", textAlign)}>
                            {t('total_favorites')}: {favorites.total}
                        </p>
                    </div>
                    <Button
                        variant="outline"
                        onClick={() => setShowFilters(!showFilters)}
                        className={cn("flex items-center gap-2", flexDirection)}
                    >
                        <Filter className={cn("h-4 w-4", iconMargin('md'))} />
                        {t('filters')}
                        {activeFilters.length > 0 && (
                            <span className={cn(isRTL ? 'mr-1' : 'ml-1', "bg-primary text-primary-foreground rounded-full px-2 py-0.5 text-xs")}>
                                {activeFilters.length}
                            </span>
                        )}
                    </Button>
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
                                placeholder={t('search_favorites')}
                            />
                            <SearchFieldFilter
                                label={t('user_id')}
                                value={filters.user_id}
                                onChange={(value) => handleFilterChange('user_id', value)}
                                placeholder={t('enter_user_id')}
                            />
                            <SelectFilter
                                label={t('type')}
                                value={filters.favoritable_type}
                                options={typeOptions}
                                onChange={(value) => handleFilterChange('favoritable_type', value)}
                            />
                        </div>
                    </CollapsibleFilters>
                )}

                {/* Data Table */}
                <DataTable
                    data={favorites.data}
                    columns={columns}
                    pagination={{
                        currentPage: favorites.current_page,
                        lastPage: favorites.last_page,
                        perPage: favorites.per_page,
                        total: favorites.total,
                        onPageChange: (page: number) => {
                            router.get('/dashboard/favorites', {
                                ...router.page.props,
                                page,
                            }, { preserveState: true });
                        },
                    }}
                />

                {/* Delete Confirmation Dialog */}
                <ConfirmationDialog
                    open={deleteDialog.open}
                    onOpenChange={(open) => setDeleteDialog({ open, favoriteId: null })}
                    onConfirm={() => deleteDialog.favoriteId && handleDelete(deleteDialog.favoriteId)}
                    title={t('delete_favorite')}
                    description={t('are_you_sure_delete_favorite')}
                />
            </div>
        </AppLayout>
    );
}

