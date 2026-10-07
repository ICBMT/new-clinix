import { DataTable } from '@/components/data-table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { ConfirmationDialog } from '@/components/confirmation-dialog';
import { UserCard } from '@/components/user-card';
import { VerificationStatusSwitch } from '@/components/verification-status-switch';
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
import { Head, Link, router, usePage } from '@inertiajs/react';
import { type SharedData } from '@/types';
import { cn } from '@/lib/utils';
import { Plus, Eye, Edit, Trash2, Filter, Check, X } from 'lucide-react';
import { useState, useEffect, useCallback } from 'react';
import { customToast } from '@/components/ui/custom-toast';
import { index as dashboard } from '@/routes/dashboard';
import { type BreadcrumbItem } from '@/types';
import { formatHumanDate } from '@/utils/date-utils';

interface Vendor {
    id: number;
    name: string;
    email: string;
    phone: string;
    email_verified_at: string | null;
    phone_verified_at: string | null;
    created_at: string;
    profile: {
        verification_status: 'pending' | 'approved' | 'rejected';
    };
}

interface VendorsPageProps {
    vendors: {
    data: Vendor[];
    current_page: number;
        last_page: number;
    per_page: number;
    total: number;
    };
    filters: {
        search?: string;
        verification_status?: string;
        email_verified?: string;
        phone_verified?: string;
        created_from?: string;
        created_to?: string;
    };
}

// Breadcrumbs will be set inside component to use translation

export default function VendorsIndex({ vendors, filters: initialFilters }: VendorsPageProps) {
    useRTLInit();
    const { t, locale } = useTranslation();
    const page = usePage<SharedData>();
    const { locale: pageLocale } = page.props;
    const isRTL = pageLocale === 'ar';
    const dir = isRTL ? 'rtl' : 'ltr';
    const { flexDirection, iconMargin } = useRTL();
    const [activeTab, setActiveTab] = useState<string>('all');
    const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; vendorId: number | null }>({ open: false, vendorId: null });
    const [approveDialog, setApproveDialog] = useState<{ open: boolean; vendorId: number | null }>({ open: false, vendorId: null });
    const [rejectDialog, setRejectDialog] = useState<{ open: boolean; vendorId: number | null }>({ open: false, vendorId: null });
    const [optimisticVendors, setOptimisticVendors] = useState(vendors.data);
    const [showFilters, setShowFilters] = useState(false);
    const [isInitialLoad, setIsInitialLoad] = useState(true);

    // Filter states
    const [filters, setFilters] = useState({
        search: initialFilters?.search || '',
        verification_status: initialFilters?.verification_status || 'all',
        email_verified: initialFilters?.email_verified || 'all',
        phone_verified: initialFilters?.phone_verified || 'all',
        created_from: initialFilters?.created_from || '',
        created_to: initialFilters?.created_to || '',
    });

    const applyFiltersToBackend = useCallback((filtersToApply: typeof filters) => {
        router.get('/dashboard/vendors', {
            page: 1, // Reset to first page when applying filters
            search: filtersToApply.search || undefined,
            filters: {
                verification_status: filtersToApply.verification_status && filtersToApply.verification_status !== 'all' ? filtersToApply.verification_status : undefined,
                email_verified: filtersToApply.email_verified && filtersToApply.email_verified !== 'all' ? filtersToApply.email_verified : undefined,
                phone_verified: filtersToApply.phone_verified && filtersToApply.phone_verified !== 'all' ? filtersToApply.phone_verified : undefined,
                created_from: filtersToApply.created_from || undefined,
                created_to: filtersToApply.created_to || undefined,
            },
        }, { preserveState: true, preserveScroll: true });
    }, []);

    // Initialize optimistic vendors only once when component mounts
    useEffect(() => {
        setOptimisticVendors(vendors.data);
    }, [vendors.data]);

    // Auto-apply filters when they change
    useEffect(() => {
        // Skip auto-apply on initial load
        if (isInitialLoad) {
            setIsInitialLoad(false);
            return;
        }

        const timeoutId = setTimeout(() => {
            applyFiltersToBackend(filters);
        }, 300); // Debounce for 300ms to avoid too many requests

        return () => clearTimeout(timeoutId);
    }, [filters, isInitialLoad, applyFiltersToBackend]);

    // Sync activeTab with initial filters on mount
    useEffect(() => {
        if (initialFilters?.verification_status) {
            setActiveTab(initialFilters.verification_status);
        } else {
            setActiveTab('all');
        }
    }, [initialFilters?.verification_status]);

    // Verification status options
    const verificationStatusOptions: SelectOption[] = [
        { value: 'all', label: t('all') },
        { value: 'pending', label: t('pending') },
        { value: 'approved', label: t('approved') },
        { value: 'rejected', label: t('rejected') },
    ];

    // Verification options (for email/phone)
    const verificationOptions: SelectOption[] = [
        { value: 'all', label: t('all') },
        { value: 'verified', label: t('verified') },
        { value: 'not_verified', label: t('not_verified') },
    ];

    // Tab change handler
    const handleTabChange = (tab: string) => {
        setActiveTab(tab);
        
        const newFilters = { ...filters };
        
        if (tab === 'all') {
            newFilters.verification_status = 'all';
        } else {
            newFilters.verification_status = tab;
        }
        
        setFilters(newFilters);
        // Auto-apply will handle the backend request via useEffect
    };

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
        
        if (filters.verification_status && filters.verification_status !== 'all') {
            const option = verificationStatusOptions.find(o => o.value === filters.verification_status);
            active.push({
                key: 'verification_status',
                label: t('verification_status'),
                value: filters.verification_status,
                displayValue: option?.label || filters.verification_status,
            });
        }

        if (filters.email_verified && filters.email_verified !== 'all') {
            const option = verificationOptions.find(o => o.value === filters.email_verified);
            active.push({
                key: 'email_verified',
                label: t('email_status'),
                value: filters.email_verified,
                displayValue: option?.label || filters.email_verified,
            });
        }
        
        if (filters.phone_verified && filters.phone_verified !== 'all') {
            const option = verificationOptions.find(o => o.value === filters.phone_verified);
            active.push({
                key: 'phone_verified',
                label: t('phone_status'),
                value: filters.phone_verified,
                displayValue: option?.label || filters.phone_verified,
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
        } else if (key === 'verification_status') {
            newFilters.verification_status = 'all';
            } else if (key === 'email_verified') {
                newFilters.email_verified = 'all';
            } else if (key === 'phone_verified') {
                newFilters.phone_verified = 'all';
        } else {
            newFilters[key as keyof typeof filters] = '';
            }

        setFilters(newFilters);
        // Auto-apply will handle the backend request via useEffect
    };

    const handleClearAllFilters = () => {
        const clearedFilters = {
            search: '',
            verification_status: 'all',
            email_verified: 'all',
            phone_verified: 'all',
            created_from: '',
            created_to: '',
        };
        setFilters(clearedFilters);
        // Auto-apply will handle the backend request via useEffect
    };


    const columns = [
        {
            key: 'vendor',
            label: t('vendor'),
            render: (_: unknown, vendor: Vendor) => (
                <UserCard user={vendor} />
            ),
        },
        {
            key: 'verification_status',
            label: t('verification_status'),
            render: (_: unknown, vendor: Vendor) => {
                const verificationStatus = vendor.profile?.verification_status || 'pending';
                let className = '';
                let variant: 'default' | 'secondary' | 'destructive' = 'secondary';
                
                if (verificationStatus === 'approved') {
                    variant = 'default';
                    className = 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 border-green-200 dark:border-green-800 hover:bg-green-200 dark:hover:bg-green-800/40 hover:text-green-900 dark:hover:text-green-200';
                } else if (verificationStatus === 'pending') {
                    variant = 'secondary';
                    className = 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300 border-yellow-200 dark:border-yellow-800 hover:bg-yellow-200 dark:hover:bg-yellow-800/40 hover:text-yellow-900 dark:hover:text-yellow-200';
                } else if (verificationStatus === 'rejected') {
                    variant = 'destructive';
                    className = 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300 border-red-200 dark:border-red-800 hover:bg-red-200 dark:hover:bg-red-800/40 hover:text-red-900 dark:hover:text-red-200';
                }
                
                return (
                    <Badge variant={variant} className={cn(className, isRTL ? '!text-right' : '!text-left')}>
                        {t(verificationStatus)}
                    </Badge>
                );
            },
        },
        {
            key: 'email_verified',
            label: t('email_verified'),
            render: (_: unknown, vendor: Vendor) => (
                <VerificationStatusSwitch
                    id={vendor.id}
                    type="email"
                    isVerified={!!vendor.email_verified_at}
                    entityType="vendor"
                    onSuccess={() => {
                        setOptimisticVendors(prev => prev.map(v => 
                            v.id === vendor.id 
                                ? { ...v, email_verified_at: !v.email_verified_at ? new Date().toISOString() : null }
                                : v
                        ));
                    }}
                    onError={() => {
                        setOptimisticVendors(vendors.data);
                    }}
                />
            ),
        },
        {
            key: 'phone_verified',
            label: t('phone_verified'),
            render: (_: unknown, vendor: Vendor) => (
                <VerificationStatusSwitch
                    id={vendor.id}
                    type="phone"
                    isVerified={!!vendor.phone_verified_at}
                    entityType="vendor"
                    onSuccess={() => {
                        setOptimisticVendors(prev => prev.map(v => 
                            v.id === vendor.id 
                                ? { ...v, phone_verified_at: !v.phone_verified_at ? new Date().toISOString() : null }
                                : v
                        ));
                    }}
                    onError={() => {
                        setOptimisticVendors(vendors.data);
                    }}
                />
            ),
        },
        {
            key: 'created_at',
            label: t('created_at'),
            render: (_: unknown, vendor: Vendor) => (
                <span className={cn("text-sm text-muted-foreground", isRTL ? '!text-right' : '!text-left')} dir={dir}>
                    {formatHumanDate(vendor.created_at, t)}
                </span>
            ),
        },
        {
            key: 'actions',
            label: t('actions'),
            render: (_: unknown, vendor: Vendor) => (
                <div className={cn("flex items-center gap-1 w-full", isRTL ? 'justify-start flex-row-reverse' : 'justify-end')}>
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => router.visit(`/dashboard/vendors/${vendor.id}`)}
                        title={t('view')}
                        aria-label={t('view')}
                    >
                        <Eye className="h-4 w-4" />
                    </Button>
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => router.visit(`/dashboard/vendors/${vendor.id}/edit`)}
                        title={t('edit')}
                        aria-label={t('edit')}
                    >
                        <Edit className="h-4 w-4" />
                    </Button>
                    {vendor.profile?.verification_status === 'pending' && (
                        <>
                            <Button 
                                variant="ghost" 
                                size="icon"
                                onClick={() => setApproveDialog({ open: true, vendorId: vendor.id })}
                                title={t('approve')}
                                aria-label={t('approve')}
                                className="text-green-600 dark:text-green-400 hover:text-green-700 dark:hover:text-green-300 hover:bg-green-50 dark:hover:bg-green-900/20"
                            >
                                <Check className="h-4 w-4" />
                            </Button>
                            <Button 
                                variant="ghost" 
                                size="icon"
                                onClick={() => setRejectDialog({ open: true, vendorId: vendor.id })}
                                title={t('reject')}
                                aria-label={t('reject')}
                                className="text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-900/20"
                            >
                                <X className="h-4 w-4" />
                            </Button>
                        </>
                    )}
                    <Button 
                        variant="ghost" 
                        size="icon"
                        onClick={() => setDeleteDialog({ open: true, vendorId: vendor.id })}
                        title={t('delete')}
                        aria-label={t('delete')}
                        className="text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-900/20"
                    >
                        <Trash2 className="h-4 w-4" />
                    </Button>
                </div>
            ),
        },
    ];



    const handleDelete = () => {
        if (deleteDialog.vendorId) {
            const vendor = optimisticVendors.find(v => v.id === deleteDialog.vendorId);
            router.delete(`/dashboard/vendors/${deleteDialog.vendorId}`, {
                onSuccess: () => {
                    customToast.success(t('vendor_deleted_successfully'), vendor?.name);
                    setOptimisticVendors(prev => prev.filter(v => v.id !== deleteDialog.vendorId));
                },
                onError: () => {
                    customToast.error(t('update_failed'));
                }
            });
        }
    };

    const handlePageChange = (page: number) => {
        router.get('/dashboard/vendors', {
            page,
            per_page: vendors.per_page,
            search: filters.search || undefined,
            filters: {
                verification_status: filters.verification_status && filters.verification_status !== 'all' ? filters.verification_status : undefined,
                email_verified: filters.email_verified && filters.email_verified !== 'all' ? filters.email_verified : undefined,
                phone_verified: filters.phone_verified && filters.phone_verified !== 'all' ? filters.phone_verified : undefined,
                created_from: filters.created_from || undefined,
                created_to: filters.created_to || undefined,
            },
        }, { preserveState: true, preserveScroll: true });
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

    const handleApprove = () => {
        if (approveDialog.vendorId) {
            router.patch(`/dashboard/vendors/${approveDialog.vendorId}/approve`, {}, {
                onSuccess: () => {
                    setOptimisticVendors(prev => prev.map(v => 
                        v.id === approveDialog.vendorId 
                            ? { ...v, verification_status: 'approved' as const }
                            : v
                    ));
                    setApproveDialog({ open: false, vendorId: null });
                },
                onError: (errors) => {
                    console.error('Approve error:', errors);
                    customToast.error(t('failed_to_approve_vendor'));
                }
            });
        }
    };

    const handleReject = () => {
        if (rejectDialog.vendorId) {
            router.patch(`/dashboard/vendors/${rejectDialog.vendorId}/reject`, {
                rejection_reason: 'Rejected by admin'
            }, {
                onSuccess: () => {
                    setOptimisticVendors(prev => prev.map(v => 
                        v.id === rejectDialog.vendorId 
                            ? { ...v, verification_status: 'rejected' as const }
                            : v
                    ));
                    setRejectDialog({ open: false, vendorId: null });
                },
                onError: (errors) => {
                    console.error('Reject error:', errors);
                    customToast.error(t('failed_to_reject_vendor'));
                }
            });
        }
    };




    const breadcrumbs: BreadcrumbItem[] = [
        {
            title: t('dashboard'),
            href: dashboard.url(),
        },
        {
            title: t('vendors_management'),
            href: '/dashboard/vendors',
        },
    ];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={t('vendors_management')} />

            <div className={cn("flex h-full flex-1 flex-col gap-6 overflow-x-auto rounded-xl bg-card dark:bg-card p-6 border border-border", isRTL ? '!text-right' : '!text-left')} dir={dir}>
                {/* Header */}
                <div className={cn("flex items-center justify-between border-b pb-4", flexDirection)}>
                    <div className={cn(isRTL ? '!text-right' : '!text-left')}>
                        <h1 className={cn("text-3xl font-bold text-foreground", isRTL ? '!text-right' : '!text-left')}>{t('vendors_management')}</h1>
                        <p className={cn("text-muted-foreground mt-1", isRTL ? '!text-right' : '!text-left')}>{t('manage_vendor_accounts')}</p>
                    </div>
                    <Link href="/dashboard/vendors/create">
                        <Button className={cn("flex items-center gap-2", flexDirection)}>
                            <Plus className={cn("h-4 w-4", iconMargin('md'))} />
                            {t('add_vendor')}
                        </Button>
                    </Link>
                </div>

                {/* Tabs for filtering by verification status */}
                <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
                    <TabsList className={cn("grid w-full grid-cols-4", flexDirection)}>
                        <TabsTrigger value="all" className={cn(isRTL ? '!text-right' : '!text-left')}>{t('all')}</TabsTrigger>
                        <TabsTrigger value="approved" className={cn(isRTL ? '!text-right' : '!text-left')}>{t('approved')}</TabsTrigger>
                        <TabsTrigger value="pending" className={cn(isRTL ? '!text-right' : '!text-left')}>{t('pending')}</TabsTrigger>
                        <TabsTrigger value="rejected" className={cn(isRTL ? '!text-right' : '!text-left')}>{t('rejected')}</TabsTrigger>
                    </TabsList>
                </Tabs>

                {/* Pagination Info and Show Filters Button */}
                <div className={cn("flex items-center justify-between", flexDirection)}>
                    <div className={cn("flex items-center gap-2", flexDirection)}>
                        <span className={cn("text-sm text-foreground", isRTL ? '!text-right' : '!text-left')}>
                            {t('showing')} {((vendors.current_page - 1) * vendors.per_page) + 1} {t('of')} {vendors.total} {t('results')}
                        </span>
                        <Select value={vendors.per_page.toString()} onValueChange={(value) => handlePerPageChange(Number(value))}>
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
                            placeholder={t('search_by_name_email_phone')}
                        />
                        
                        <SelectFilter
                            id="verification_status"
                            label={t('verification_status')}
                            value={filters.verification_status}
                            onChange={(value) => setFilters(prev => ({ ...prev, verification_status: value }))}
                            options={verificationStatusOptions}
                            placeholder={t('all')}
                        />
                        
                        <SelectFilter
                            id="email_verified"
                            label={t('email_status')}
                            value={filters.email_verified}
                            onChange={(value) => setFilters(prev => ({ ...prev, email_verified: value }))}
                            options={verificationOptions}
                            placeholder={t('all')}
                        />
                        
                        <SelectFilter
                            id="phone_verified"
                            label={t('phone_status')}
                            value={filters.phone_verified}
                            onChange={(value) => setFilters(prev => ({ ...prev, phone_verified: value }))}
                            options={verificationOptions}
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
                    data={optimisticVendors}
                    columns={columns}
                    total={vendors.total}
                    currentPage={vendors.current_page}
                    perPage={vendors.per_page}
                    onPageChange={handlePageChange}
                    onPerPageChange={handlePerPageChange}
                    locale={locale}
                />
            </div>

            {/* Delete Dialog */}
            <ConfirmationDialog
                open={deleteDialog.open}
                onOpenChange={(open) => setDeleteDialog({ open, vendorId: null })}
                onConfirm={handleDelete}
                title={t('delete_vendor')}
                description={t('delete_vendor_confirmation')}
                variant="danger"
                confirmText={t('delete')}
            />

            {/* Approve Dialog */}
            <ConfirmationDialog
                open={approveDialog.open}
                onOpenChange={(open) => setApproveDialog({ open, vendorId: null })}
                onConfirm={handleApprove}
                title={t('approve_vendor')}
                description={t('approve_vendor_confirmation')}
                variant="success"
                confirmText={t('approve')}
            />

            {/* Reject Dialog */}
            <ConfirmationDialog
                open={rejectDialog.open}
                onOpenChange={(open) => setRejectDialog({ open, vendorId: null })}
                onConfirm={handleReject}
                title={t('reject_vendor')}
                description={t('reject_vendor_confirmation')}
                variant="warning"
                confirmText={t('reject')}
            />
        </AppLayout>
    );
}
