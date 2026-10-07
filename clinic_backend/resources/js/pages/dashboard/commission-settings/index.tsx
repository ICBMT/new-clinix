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
import { Head, Link, router } from '@inertiajs/react';
import { Plus, Eye, Edit, Trash2, Filter, CheckCircle, XCircle } from 'lucide-react';
import { useState, useEffect, useCallback } from 'react';
import { customToast } from '@/components/ui/custom-toast';
import { index as dashboard } from '@/routes/dashboard';
import { type BreadcrumbItem } from '@/types';
import { formatHumanDate } from '@/utils/date-utils';
import { cn } from '@/lib/utils';

interface CommissionSetting {
    id: number;
    commission_rate: number;
    frequency: 'weekly' | 'monthly' | 'quarterly' | 'yearly';
    is_default: boolean;
    is_active: boolean;
    description?: string;
    created_at: string;
    vendor?: {
        id: number;
        name: string;
        email: string;
    } | null;
}

interface CommissionSettingsPageProps {
    settings: {
        data: CommissionSetting[];
        current_page: number;
        last_page: number;
        per_page: number;
        total: number;
    };
    filters: {
        search?: string;
        status?: string;
    };
}

export default function CommissionSettingsIndex({ settings, filters: initialFilters }: CommissionSettingsPageProps) {
    useRTLInit();
    const { t, locale } = useTranslation();
    const { isRTL, dir, textAlign, flexDirection, iconMargin } = useRTL();
    
    const breadcrumbs: BreadcrumbItem[] = [
        {
            title: t('dashboard'),
            href: dashboard.url(),
        },
        {
            title: t('commission_settings'),
            href: '/dashboard/commission-settings',
        },
    ];
    const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; settingId: number | null }>({ open: false, settingId: null });
    const [optimisticSettings, setOptimisticSettings] = useState(settings.data);
    const [showFilters, setShowFilters] = useState(false);
    const [isInitialLoad, setIsInitialLoad] = useState(true);

    const [filters, setFilters] = useState({
        search: initialFilters?.search || '',
        status: initialFilters?.status || 'all',
    });

    const applyFiltersToBackend = useCallback((filtersToApply: typeof filters) => {
        router.get('/dashboard/commission-settings', {
            page: 1,
            search: filtersToApply.search || undefined,
            filters: {
                status: filtersToApply.status && filtersToApply.status !== 'all' ? filtersToApply.status : undefined,
            },
        }, { preserveState: true });
    }, []);

    useEffect(() => {
        setOptimisticSettings(settings.data);
    }, [settings.data]);

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
        { value: 'active', label: t('active') },
        { value: 'inactive', label: t('inactive') },
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

        return active;
    };

    const handleRemoveFilter = (key: string) => {
        const newFilters = { ...filters };
        
        if (key === 'status') {
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
        };
        setFilters(clearedFilters);
    };

    const getStatusBadge = (isActive: boolean) => {
        return (
            <Badge variant={isActive ? 'default' : 'secondary'}>
                {isActive ? t('active') : t('inactive')}
            </Badge>
        );
    };

    const columns = [
        {
            key: 'vendor',
            label: t('vendor'),
            render: (_: unknown, setting: CommissionSetting) => (
                <div className={textAlign}>
                    {setting.vendor ? (
                        <>
                            <p className={cn("font-medium", textAlign)}>{setting.vendor.name}</p>
                            <p className={cn("text-sm text-muted-foreground", textAlign)}>{setting.vendor.email}</p>
                        </>
                    ) : (
                        <div className={cn("flex items-center gap-2", flexDirection)}>
                            <Badge variant="outline">{t('default')}</Badge>
                            {setting.is_default && (
                                <Badge variant="secondary" className="text-xs">{t('default_setting')}</Badge>
                            )}
                        </div>
                    )}
                </div>
            ),
        },
        {
            key: 'commission_rate',
            label: t('commission_rate'),
            render: (_: unknown, setting: CommissionSetting) => (
                <p className={cn("font-medium text-lg", textAlign)}>{setting.commission_rate}%</p>
            ),
        },
        {
            key: 'frequency',
            label: t('frequency'),
            render: (_: unknown, setting: CommissionSetting) => (
                <p className={cn("text-sm", textAlign)}>{t(setting.frequency)}</p>
            ),
        },
        {
            key: 'description',
            label: t('description'),
            render: (_: unknown, setting: CommissionSetting) => (
                <p className={cn("text-sm text-muted-foreground truncate max-w-xs", textAlign)} dir={dir}>{setting.description || t('no_description')}</p>
            ),
        },
        {
            key: 'status',
            label: t('status'),
            render: (_: unknown, setting: CommissionSetting) => getStatusBadge(setting.is_active),
        },
        {
            key: 'created_at',
            label: t('created_at'),
            render: (date: string) => formatHumanDate(date),
        },
        {
            key: 'actions',
            label: t('actions'),
            render: (_: unknown, setting: CommissionSetting) => (
                <div className={cn("flex items-center gap-1", isRTL ? 'justify-start flex-row-reverse' : 'justify-end')}>
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => router.visit(`/dashboard/commission-settings/${setting.id}`)}
                        title={t('view')}
                    >
                        <Eye className="h-4 w-4" />
                    </Button>
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => router.visit(`/dashboard/commission-settings/${setting.id}/edit`)}
                        title={t('edit')}
                    >
                        <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => router.patch(`/dashboard/commission-settings/${setting.id}/toggle-status`, {}, {
                            onSuccess: () => {
                                customToast.success(t('status_updated_successfully'));
                                setOptimisticSettings(prev => prev.map(s => 
                                    s.id === setting.id ? { ...s, is_active: !s.is_active } : s
                                ));
                            },
                        })}
                        title={setting.is_active ? t('deactivate') : t('activate')}
                        className={setting.is_active ? 'text-orange-600 hover:text-orange-700 hover:bg-orange-50' : 'text-green-600 hover:text-green-700 hover:bg-green-50'}
                    >
                        {setting.is_active ? <XCircle className="h-4 w-4" /> : <CheckCircle className="h-4 w-4" />}
                    </Button>
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setDeleteDialog({ open: true, settingId: setting.id })}
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
        if (deleteDialog.settingId) {
            const setting = optimisticSettings.find(s => s.id === deleteDialog.settingId);
            router.delete(`/dashboard/commission-settings/${deleteDialog.settingId}`, {
                onSuccess: () => {
                    customToast.success(t('setting_deleted_successfully'));
                    setOptimisticSettings(prev => prev.filter(s => s.id !== deleteDialog.settingId));
                },
                onError: () => {
                    customToast.error(t('delete_failed'));
                }
            });
        }
    };

    const handlePageChange = (page: number) => {
        router.get('/dashboard/commission-settings', {
            page,
            per_page: settings.per_page,
            search: filters.search || undefined,
            filters: {
                status: filters.status && filters.status !== 'all' ? filters.status : undefined,
            },
        }, { preserveState: true });
    };

    const handlePerPageChange = (perPage: number) => {
        router.get('/dashboard/commission-settings', {
            per_page: perPage,
            page: 1,
            search: filters.search || undefined,
            filters: {
                status: filters.status && filters.status !== 'all' ? filters.status : undefined,
            },
        }, { preserveState: true });
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={t('commission_settings')} />
            
            <div className={cn("flex h-full flex-1 flex-col gap-6 overflow-x-auto rounded-xl bg-card dark:bg-card p-6 border border-border", textAlign)} dir={dir}>
                <div className={cn("flex items-center justify-between border-b pb-4", flexDirection)}>
                    <div className={textAlign}>
                        <h1 className={cn("text-3xl font-bold text-foreground", textAlign)}>{t('commission_settings')}</h1>
                        <p className={cn("text-muted-foreground mt-1", textAlign)}>{t('manage_commission_rates_and_payout_frequencies')}</p>
                    </div>
                    <Link href="/dashboard/commission-settings/create">
                        <Button className={cn("flex items-center gap-2", flexDirection)}>
                            <Plus className={cn("h-4 w-4", iconMargin('md'))} />
                            {t('add_setting')}
                        </Button>
                    </Link>
                </div>

                <div className={cn("flex items-center justify-between", flexDirection)}>
                    <div className={cn("flex items-center gap-2", flexDirection)}>
                        <span className={cn("text-sm text-foreground", textAlign)}>
                            {t('showing')} {((settings.current_page - 1) * settings.per_page) + 1} {t('of')} {settings.total} {t('results')}
                        </span>
                        <Select value={settings.per_page.toString()} onValueChange={(value) => handlePerPageChange(Number(value))}>
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
                            placeholder={t('search_by_vendor_name_or_email')}
                        />
                        
                        <SelectFilter
                            id="status"
                            label={t('status')}
                            value={filters.status}
                            onChange={(value) => setFilters(prev => ({ ...prev, status: value }))}
                            options={statusOptions}
                            placeholder={t('all')}
                        />
                    </CollapsibleFilters>
                )}

                <DataTable
                    data={optimisticSettings}
                    columns={columns}
                    total={settings.total}
                    currentPage={settings.current_page}
                    perPage={settings.per_page}
                    onPageChange={handlePageChange}
                    onPerPageChange={handlePerPageChange}
                />
            </div>

            <ConfirmationDialog
                open={deleteDialog.open}
                onOpenChange={(open) => setDeleteDialog({ open, settingId: null })}
                onConfirm={handleDelete}
                title={t('delete_setting')}
                description={t('delete_commission_setting_confirmation')}
                variant="danger"
                confirmText={t('delete')}
            />
        </AppLayout>
    );
}

