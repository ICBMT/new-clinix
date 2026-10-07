import { DataTable } from '@/components/data-table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { UserCard } from '@/components/user-card';
import { ClinicCard } from '@/components/clinic-card';
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
import { Head, Link, router, usePage } from '@inertiajs/react';
import { type SharedData } from '@/types';
import { Eye, Edit, Trash2, Filter, Check } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { useState, useEffect, useCallback } from 'react';
import { customToast } from '@/components/ui/custom-toast';
import { index as dashboard } from '@/routes/dashboard';
import { type BreadcrumbItem } from '@/types';
import { formatHumanDate } from '@/utils/date-utils';
import { usePermissions } from '@/hooks/use-permissions';
import { getLocalizedName } from '@/utils/localization';
import { cn } from '@/lib/utils';

interface Review {
    id: number;
    rating: number;
    comment: string;
    status: 'pending' | 'approved' | 'rejected';
    rejection_reason?: string | null;
    vendor_response?: string | null;
    created_at: string;
    user?: {
        id: number;
        name: string;
        email: string;
        phone?: string;
        avatar?: string | null;
        email_verified_at?: string | null;
        phone_verified_at?: string | null;
    } | null;
    treatment?: {
        id: number;
        name_en?: string;
        name_ar?: string;
        name?: string;
    } | null;
    clinic?: {
        id: number;
        name_en?: string;
        name_ar?: string;
        name?: string;
        email?: string;
        phone?: string;
        logo?: string | null;
    } | null;
    booking?: {
        id: number;
        booking_reference: string;
        clinic?: {
            id: number;
            name_en?: string;
            name_ar?: string;
            email?: string;
            phone?: string;
            logo?: string | null;
        } | null;
    } | null;
}

interface ReviewsPageProps {
    reviews: {
        data: Review[];
        current_page: number;
        last_page: number;
        per_page: number;
        total: number;
    };
    filters: {
        search?: string;
        status?: string;
        rating?: string;
        type?: string;
    };
    isSuperAdmin?: boolean;
}

export default function ReviewsIndex({ reviews, filters: initialFilters, isSuperAdmin: isSuperAdminProp }: ReviewsPageProps) {
    useRTLInit();
    const { t, locale } = useTranslation();
    const page = usePage<SharedData>();
    const { locale: pageLocale } = page.props;
    const isRTL = pageLocale === 'ar';
    const dir = isRTL ? 'rtl' : 'ltr';
    const { flexDirection, iconMargin } = useRTL();
    const { isSuperAdmin: isSuperAdminFromHook, can } = usePermissions();
    const isSuperAdmin = isSuperAdminProp ?? isSuperAdminFromHook;
    
    const breadcrumbs: BreadcrumbItem[] = [
        {
            title: t('dashboard'),
            href: dashboard.url(),
        },
        {
            title: t('reviews_management'),
            href: '/dashboard/reviews',
        },
    ];

    const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; reviewId: number | null }>({ open: false, reviewId: null });
    const [optimisticReviews, setOptimisticReviews] = useState(reviews.data);
    const [showFilters, setShowFilters] = useState(false);
    const [isInitialLoad, setIsInitialLoad] = useState(true);

    // Filter states
    const [filters, setFilters] = useState({
        search: initialFilters?.search || '',
        status: initialFilters?.status || 'all',
        rating: initialFilters?.rating || 'all',
        type: initialFilters?.type || 'all',
    });

    const applyFiltersToBackend = useCallback((filtersToApply: typeof filters) => {
        router.get('/dashboard/reviews', {
            page: 1,
            search: filtersToApply.search || undefined,
            filters: {
                status: filtersToApply.status && filtersToApply.status !== 'all' ? filtersToApply.status : undefined,
                rating: filtersToApply.rating && filtersToApply.rating !== 'all' ? filtersToApply.rating : undefined,
                type: filtersToApply.type && filtersToApply.type !== 'all' ? filtersToApply.type : undefined,
            },
        }, { preserveState: true, preserveScroll: true });
    }, []);

    useEffect(() => {
        setOptimisticReviews(reviews.data);
    }, [reviews.data]);

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
        { value: 'pending', label: t('pending') },
        { value: 'approved', label: t('approved') },
        { value: 'rejected', label: t('rejected') },
    ];

    const ratingOptions: SelectOption[] = [
        { value: 'all', label: t('all') },
        { value: '5', label: '5 ⭐' },
        { value: '4', label: '4 ⭐' },
        { value: '3', label: '3 ⭐' },
        { value: '2', label: '2 ⭐' },
        { value: '1', label: '1 ⭐' },
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

        if (filters.status && filters.status !== 'all') {
            const option = statusOptions.find(o => o.value === filters.status);
            active.push({
                key: 'status',
                label: t('status'),
                value: filters.status,
                displayValue: option?.label || filters.status,
            });
        }

        if (filters.rating && filters.rating !== 'all') {
            const option = ratingOptions.find(o => o.value === filters.rating);
            active.push({
                key: 'rating',
                label: t('rating'),
                value: filters.rating,
                displayValue: option?.label || filters.rating,
            });
        }

        return active;
    };

    const handleRemoveFilter = (key: string) => {
        const newFilters = { ...filters };
        
        if (key === 'status') {
            newFilters.status = 'all';
        } else if (key === 'rating') {
            newFilters.rating = 'all';
        } else {
            newFilters[key as keyof typeof filters] = '';
        }

        setFilters(newFilters);
    };

    const handleClearAllFilters = () => {
        const clearedFilters = {
            search: '',
            status: 'all',
            rating: 'all',
            type: 'all',
        };
        setFilters(clearedFilters);
    };

    const getStatusBadge = (status: string) => {
        const variants: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
            approved: 'default',
            pending: 'secondary',
            rejected: 'destructive',
        };

        return (
            <Badge variant={variants[status] || 'outline'} className={cn(isRTL ? '!text-right' : '!text-left')} dir={dir}>
                {t(status)}
            </Badge>
        );
    };

    const getRatingStars = (rating: number) => {
        return '⭐'.repeat(rating) + '☆'.repeat(5 - rating);
    };

    const columns = [
        {
            key: 'user',
            label: t('user'),
            render: (_: unknown, review: Review) => (
                review.user ? (
                    <Link
                        href={`/dashboard/users/${review.user.id}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <UserCard 
                            user={{
                                id: review.user.id,
                                name: review.user.name,
                                email: review.user.email || '',
                                phone: review.user.phone || '',
                                avatar: review.user.avatar,
                                email_verified_at: review.user.email_verified_at || null,
                                phone_verified_at: review.user.phone_verified_at || null,
                            }} 
                            variant="compact"
                            showVerificationBadges={false}
                        />
                    </Link>
                ) : (
                    <span className={cn("text-muted-foreground", isRTL ? '!text-right' : '!text-left')} dir={dir}>{t('unknown')}</span>
                )
            ),
        },
        {
            key: 'treatment',
            label: t('treatment'),
            render: (_: unknown, review: Review) => {
                const treatmentName = review.treatment 
                    ? getLocalizedName(review.treatment.name_en, review.treatment.name_ar, locale)
                    : t('n_a');
                
                return (
                    <div className={cn("p-2", isRTL ? '!text-right' : '!text-left')} dir={dir}>
                        {review.treatment ? (
                            <Link
                                href={`/dashboard/treatments/${review.treatment.id}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="block"
                                onClick={(e) => e.stopPropagation()}
                            >
                                <p className={cn("font-medium", isRTL ? '!text-right' : '!text-left')} dir={dir}>
                                    {treatmentName}
                                </p>
                            </Link>
                        ) : (
                            <p className={cn("font-medium text-muted-foreground", isRTL ? '!text-right' : '!text-left')} dir={dir}>
                                {t('n_a')}
                            </p>
                        )}
                        {review.booking?.booking_reference && (
                            <p className={cn("text-sm text-muted-foreground mt-1", isRTL ? '!text-right' : '!text-left')} dir="ltr">
                                {t('ref')}: {review.booking.booking_reference}
                            </p>
                        )}
                    </div>
                );
            },
        },
        {
            key: 'clinic',
            label: t('clinic'),
            render: (_: unknown, review: Review) => {
                // Use direct clinic relationship if available, otherwise use booking.clinic
                const clinic = review.clinic || review.booking?.clinic;
                
                return (
                    <div className={cn("p-2", isRTL ? '!text-right' : '!text-left')} dir={dir}>
                        {clinic ? (
                            <Link
                                href={`/dashboard/clinics/${clinic.id}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="block"
                                onClick={(e) => e.stopPropagation()}
                            >
                                <ClinicCard
                                    clinic={{
                                        id: clinic.id,
                                        company_name_en: clinic.name_en || clinic.name || '',
                                        company_name_ar: clinic.name_ar || clinic.name || '',
                                        email: clinic.email,
                                        phone: clinic.phone,
                                        logo: clinic.logo ?? null,
                                    }}
                                    locale={locale}
                                    variant="default"
                                />
                            </Link>
                        ) : (
                            <span
                                className={cn("text-sm text-muted-foreground", isRTL ? '!text-right' : '!text-left')}
                                dir={dir}
                            >
                                {t('n_a')}
                            </span>
                        )}
                    </div>
                );
            },
        },
        {
            key: 'rating',
            label: t('rating'),
            render: (_: unknown, review: Review) => (
                <div className={cn("flex items-center gap-2", flexDirection)}>
                    <span className="text-yellow-500">{getRatingStars(review.rating)}</span>
                    <span className={cn("text-sm text-muted-foreground", isRTL ? '!text-right' : '!text-left')} dir="ltr">({review.rating}/5)</span>
                </div>
            ),
        },
        {
            key: 'comment',
            label: t('comment'),
            render: (_: unknown, review: Review) => (
                <p className={cn("max-w-xs truncate text-sm", isRTL ? '!text-right' : '!text-left')} dir={dir}>{review.comment || t('no_comment')}</p>
            ),
        },
        {
            key: 'status',
            label: t('status'),
            render: (_: unknown, review: Review) => (
                <div className={cn(isRTL ? '!text-right' : '!text-left')}>
                    {isSuperAdmin ? (
                        <Switch
                            checked={review.status === 'approved'}
                            onCheckedChange={(checked) => {
                                const newStatus = checked ? 'approved' : 'rejected';
                                router.patch(`/dashboard/reviews/${review.id}/toggle-status`, {
                                    status: newStatus,
                                }, {
                                    preserveState: true,
                                    preserveScroll: true,
                                    onSuccess: () => {
                                        customToast.success(
                                            newStatus === 'approved' 
                                                ? t('review_approved_successfully')
                                                : t('review_rejected_successfully')
                                        );
                                        setOptimisticReviews(prev => 
                                            prev.map(r => 
                                                r.id === review.id 
                                                    ? { ...r, status: newStatus as 'approved' | 'rejected' } 
                                                    : r
                                            )
                                        );
                                    },
                                    onError: () => {
                                        customToast.error(t('update_failed'));
                                    },
                                });
                            }}
                        />
                    ) : (
                        getStatusBadge(review.status)
                    )}
                </div>
            ),
        },
        {
            key: 'created_at',
            label: t('created_at'),
            render: (_: unknown, review: Review) => (
                <span className={cn("text-sm text-muted-foreground", isRTL ? '!text-right' : '!text-left')} dir={dir}>{formatHumanDate(review.created_at, t)}</span>
            ),
        },
        {
            key: 'actions',
            label: t('actions'),
            render: (_: unknown, review: Review) => (
                <div className={cn("flex items-center gap-1 w-full", isRTL ? 'justify-start flex-row-reverse' : 'justify-end')}>
                    {can('reviews.show') && (
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => router.visit(`/dashboard/reviews/${review.id}`)}
                            title={t('view')}
                        >
                            <Eye className="h-4 w-4" />
                        </Button>
                    )}
                    {can('reviews.edit') && (
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => router.visit(`/dashboard/reviews/${review.id}/edit`)}
                            title={t('edit')}
                        >
                            <Edit className="h-4 w-4" />
                        </Button>
                    )}
                    {review.status === 'pending' && isSuperAdmin && can('reviews.approve') && (
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => router.patch(`/dashboard/reviews/${review.id}/approve`, {}, {
                                onSuccess: () => {
                                    customToast.success(t('review_approved_successfully'));
                                    setOptimisticReviews(prev => prev.map(r => 
                                        r.id === review.id ? { ...r, status: 'approved' as const } : r
                                    ));
                                },
                            })}
                            title={t('approve')}
                            className="text-green-600 hover:text-green-700 hover:bg-green-50"
                        >
                            <Check className="h-4 w-4" />
                        </Button>
                    )}
                    {review.status === 'pending' && isSuperAdmin && can('reviews.reject') && (
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => router.visit(`/dashboard/reviews/${review.id}/edit`)}
                            title={t('reject')}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                            <Edit className="h-4 w-4" />
                        </Button>
                    )}
                    {can('reviews.destroy') && (
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setDeleteDialog({ open: true, reviewId: review.id })}
                            title={t('delete')}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                            <Trash2 className="h-4 w-4" />
                        </Button>
                    )}
                </div>
            ),
        },
    ];

    const handleDelete = () => {
        if (deleteDialog.reviewId) {
            const review = optimisticReviews.find(r => r.id === deleteDialog.reviewId);
            router.delete(`/dashboard/reviews/${deleteDialog.reviewId}`, {
                onSuccess: () => {
                    customToast.success(t('review_deleted_successfully'), review?.user?.name);
                    setOptimisticReviews(prev => prev.filter(r => r.id !== deleteDialog.reviewId));
                },
                onError: () => {
                    customToast.error(t('delete_failed'));
                }
            });
        }
    };

    const handlePageChange = (page: number) => {
        router.get('/dashboard/reviews', {
            page,
            per_page: reviews.per_page,
            search: filters.search || undefined,
            filters: {
                status: filters.status && filters.status !== 'all' ? filters.status : undefined,
                rating: filters.rating && filters.rating !== 'all' ? filters.rating : undefined,
                type: filters.type && filters.type !== 'all' ? filters.type : undefined,
            },
        }, { preserveState: true });
    };

    const handlePerPageChange = (perPage: number) => {
        router.get('/dashboard/reviews', {
            page: 1,
            per_page: perPage,
            search: filters.search || undefined,
            filters: {
                status: filters.status && filters.status !== 'all' ? filters.status : undefined,
                rating: filters.rating && filters.rating !== 'all' ? filters.rating : undefined,
                type: filters.type && filters.type !== 'all' ? filters.type : undefined,
            },
        }, { preserveState: true, preserveScroll: true });
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={t('reviews_management')} />
            
            <div className={cn("flex h-full flex-1 flex-col gap-6 overflow-x-auto rounded-xl bg-card dark:bg-card p-6 border border-border", isRTL ? '!text-right' : '!text-left')} dir={dir}>
                {/* Header */}
                <div className={cn("flex items-center justify-between border-b pb-4", flexDirection)}>
                    <div className={cn(isRTL ? '!text-right' : '!text-left')}>
                        <h1 className={cn("text-3xl font-bold text-foreground", isRTL ? '!text-right' : '!text-left')}>{t('reviews_management')}</h1>
                        <p className={cn("text-muted-foreground mt-1", isRTL ? '!text-right' : '!text-left')}>{t('manage_and_moderate_user_reviews')}</p>
                    </div>
                </div>

                {/* Pagination Info and Show Filters Button */}
                <div className={cn("flex items-center justify-between", flexDirection)}>
                    <div className={cn("flex items-center gap-2", flexDirection)}>
                        <span className={cn("text-sm text-foreground", isRTL ? '!text-right' : '!text-left')}>
                            {t('showing')} {((reviews.current_page - 1) * reviews.per_page) + 1} {t('of')} {reviews.total} {t('results')}
                        </span>
                        <Select value={reviews.per_page.toString()} onValueChange={(value) => handlePerPageChange(Number(value))}>
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
                            placeholder={t('search_by_user_treatment_or_comment')}
                        />
                        
                        <SelectFilter
                            id="status"
                            label={t('status')}
                            value={filters.status}
                            onChange={(value) => setFilters(prev => ({ ...prev, status: value }))}
                            options={statusOptions}
                            placeholder={t('all')}
                        />
                        
                        <SelectFilter
                            id="rating"
                            label={t('rating')}
                            value={filters.rating}
                            onChange={(value) => setFilters(prev => ({ ...prev, rating: value }))}
                            options={ratingOptions}
                            placeholder={t('all')}
                        />
                    </CollapsibleFilters>
                )}

                {/* Data Table */}
                <DataTable
                    data={optimisticReviews}
                    columns={columns}
                    total={reviews.total}
                    currentPage={reviews.current_page}
                    perPage={reviews.per_page}
                    onPageChange={handlePageChange}
                    onPerPageChange={handlePerPageChange}
                    locale={locale}
                />
            </div>

            {/* Delete Dialog */}
            <ConfirmationDialog
                open={deleteDialog.open}
                onOpenChange={(open) => setDeleteDialog({ open, reviewId: null })}
                onConfirm={handleDelete}
                title={t('delete_review')}
                description={t('delete_review_confirmation')}
                variant="danger"
                confirmText={t('delete')}
            />
        </AppLayout>
    );
}

