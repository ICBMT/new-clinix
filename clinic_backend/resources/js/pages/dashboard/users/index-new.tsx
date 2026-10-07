/**
 * Example: Users CRUD using the new reusable CrudPage pattern
 * 
 * This demonstrates how to use the CrudPage component for a complete CRUD interface
 */
import { router } from '@inertiajs/react';
import { CrudPage } from '@/components/crud/CrudPage';
import { UserCard } from '@/components/user-card';
import { type CrudColumn, type CrudFilter, type CrudToggleAction } from '@/types/crud';
import { useTranslation } from '@/hooks/use-translation';
import { formatHumanDate } from '@/utils/date-utils';
import { Eye, Edit, Trash2 } from 'lucide-react';

interface User {
    id: number;
    name: string;
    email: string;
    phone: string;
    email_verified_at: string | null;
    phone_verified_at: string | null;
    created_at: string;
}

interface UsersPageProps {
    users: {
        data: User[];
        current_page: number;
        last_page: number;
        per_page: number;
        total: number;
    };
    filters: {
        search?: string;
        email_verified?: string;
        phone_verified?: string;
        created_from?: string;
        created_to?: string;
    };
}

export default function UsersIndexNew({ users, filters: initialFilters }: UsersPageProps) {
    const { t, locale } = useTranslation();

    // Define columns
    const columns: CrudColumn<User>[] = [
        {
            key: 'user',
            label: t('user'),
            render: (_: unknown, user: User) => <UserCard user={user} />,
        },
        {
            key: 'created_at',
            label: t('created_at'),
            sortable: true,
            render: (date: string) => formatHumanDate(date),
        },
    ];

    // Define filters
    const filters: CrudFilter[] = [
        {
            id: 'search',
            label: t('search'),
            type: 'search',
            value: initialFilters?.search || '',
            placeholder: 'Search by name, email, or phone...',
        },
        {
            id: 'email_verified',
            label: t('email_status'),
            type: 'select',
            value: initialFilters?.email_verified || 'all',
            selectOptions: [
                { value: 'all', label: t('all') },
                { value: 'verified', label: t('verified') },
                { value: 'not_verified', label: t('not_verified') },
            ],
        },
        {
            id: 'phone_verified',
            label: t('phone_status'),
            type: 'select',
            value: initialFilters?.phone_verified || 'all',
            selectOptions: [
                { value: 'all', label: t('all') },
                { value: 'verified', label: t('verified') },
                { value: 'not_verified', label: t('not_verified') },
            ],
        },
        {
            id: 'created_date',
            label: t('created_date'),
            type: 'date-range',
            fromValue: initialFilters?.created_from || '',
            toValue: initialFilters?.created_to || '',
            fromPlaceholder: t('date_from'),
            toPlaceholder: t('date_to'),
        },
    ];

    // Define toggle actions (for switches in table)
    const toggleActions: CrudToggleAction[] = [
        {
            id: 'email_verification',
            label: t('email_verified'),
            field: 'email_verified_at',
            endpoint: (id: number) => `/dashboard/users/${id}/toggle-email-verification`,
        },
        {
            id: 'phone_verification',
            label: t('phone_verified'),
            field: 'phone_verified_at',
            endpoint: (id: number) => `/dashboard/users/${id}/toggle-phone-verification`,
        },
    ];

    // Build active filters for display
    const activeFilters = [
        ...(initialFilters?.search ? [{
            key: 'search',
            label: t('search'),
            value: initialFilters.search,
            displayValue: initialFilters.search,
        }] : []),
        ...(initialFilters?.email_verified && initialFilters.email_verified !== 'all' ? [{
            key: 'email_verified',
            label: t('email_status'),
            value: initialFilters.email_verified,
            displayValue: initialFilters.email_verified === 'verified' ? t('verified') : t('not_verified'),
        }] : []),
        ...(initialFilters?.phone_verified && initialFilters.phone_verified !== 'all' ? [{
            key: 'phone_verified',
            label: t('phone_status'),
            value: initialFilters.phone_verified,
            displayValue: initialFilters.phone_verified === 'verified' ? t('verified') : t('not_verified'),
        }] : []),
        ...((initialFilters?.created_from || initialFilters?.created_to) ? [{
            key: 'created_date',
            label: t('created_date'),
            value: [initialFilters.created_from, initialFilters.created_to],
            displayValue: [
                initialFilters.created_from && `${t('date_from')}: ${initialFilters.created_from}`,
                initialFilters.created_to && `${t('date_to')}: ${initialFilters.created_to}`,
            ].filter(Boolean).join(' | '),
        }] : []),
    ];

    // Handlers
    const handleFilterChange = (newFilters: Record<string, any>) => {
        router.get('/dashboard/users', {
            page: 1,
            search: newFilters.search || undefined,
            filters: {
                email_verified: newFilters.email_verified && newFilters.email_verified !== 'all' 
                    ? newFilters.email_verified 
                    : undefined,
                phone_verified: newFilters.phone_verified && newFilters.phone_verified !== 'all' 
                    ? newFilters.phone_verified 
                    : undefined,
                created_from: newFilters.created_date_from || undefined,
                created_to: newFilters.created_date_to || undefined,
            },
        }, { preserveState: true, preserveScroll: true });
    };

    const handleRemoveFilter = (key: string) => {
        const currentFilters = { ...initialFilters };
        delete currentFilters[key as keyof typeof currentFilters];
        
        router.get('/dashboard/users', {
            page: 1,
            search: currentFilters.search || undefined,
            filters: {
                email_verified: currentFilters.email_verified || undefined,
                phone_verified: currentFilters.phone_verified || undefined,
                created_from: currentFilters.created_from || undefined,
                created_to: currentFilters.created_to || undefined,
            },
        }, { preserveState: true });
    };

    const handleClearFilters = () => {
        router.get('/dashboard/users', {
            page: 1,
        }, { preserveState: true });
    };

    const handlePageChange = (page: number) => {
        router.get('/dashboard/users', {
            page,
            search: initialFilters?.search || undefined,
            filters: {
                email_verified: initialFilters?.email_verified || undefined,
                phone_verified: initialFilters?.phone_verified || undefined,
                created_from: initialFilters?.created_from || undefined,
                created_to: initialFilters?.created_to || undefined,
            },
        }, { preserveState: true });
    };

    const handlePerPageChange = (perPage: number) => {
        router.get('/dashboard/users', {
            per_page: perPage,
            page: 1,
            search: initialFilters?.search || undefined,
            filters: {
                email_verified: initialFilters?.email_verified || undefined,
                phone_verified: initialFilters?.phone_verified || undefined,
                created_from: initialFilters?.created_from || undefined,
                created_to: initialFilters?.created_to || undefined,
            },
        }, { preserveState: true });
    };

    return (
        <CrudPage
            resourceName="user"
            resourceNamePlural={t('users_management')}
            baseRoute="/dashboard/users"
            data={users.data}
            pagination={{
                currentPage: users.current_page,
                lastPage: users.last_page,
                perPage: users.per_page,
                total: users.total,
            }}
            columns={columns}
            filters={filters}
            activeFilters={activeFilters}
            onFilterChange={handleFilterChange}
            onRemoveFilter={handleRemoveFilter}
            onClearFilters={handleClearFilters}
            toggleActions={toggleActions}
            onView={(user) => router.visit(`/dashboard/users/${user.id}`)}
            onEdit={(user) => router.visit(`/dashboard/users/${user.id}/edit`)}
            onPageChange={handlePageChange}
            onPerPageChange={handlePerPageChange}
            description="Manage user accounts and verifications"
        />
    );
}

