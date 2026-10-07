import { type BreadcrumbItem } from '@/types';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { UserCard } from '@/components/user-card';
import { DataTable } from '@/components/data-table';
import { ViewPageLayout, PageHeader } from '@/components/page-layouts';
import { useRTLInit } from '@/hooks/use-rtl-init';
import { useTranslation } from '@/hooks/use-translation';
import { useRTL } from '@/hooks/use-rtl';
import { usePermissions } from '@/hooks/use-permissions';
import { getLocalizedName } from '@/utils/localization';
import { formatHumanDate } from '@/utils/date-utils';
import { cn } from '@/lib/utils';
import AppLayout from '@/layouts/app-layout';
import { index as dashboard } from '@/routes/dashboard';
import { Head, Link, router, usePage } from '@inertiajs/react';
import { ArrowLeft, Edit, Mail, Phone, Calendar, Clock, User, Heart, Pill, Eye } from 'lucide-react';
import { type SharedData } from '@/types';

interface ShowUserProps {
    user: {
        id: number;
        name: string;
        email: string;
        phone?: string;
        email_verified_at?: string | null;
        phone_verified_at?: string | null;
        created_at: string;
        updated_at: string;
        last_login_at?: string | null;
        gender?: string | null;
        skin_type?: string | null;
        age?: number | null;
        date_of_birth?: string | null;
        last_machine_used?: number[] | null;
        last_machine_used_name?: string | null;
        restricted_machines?: number[] | null;
        restricted_machines_name?: string | null;
        allergies?: string | null;
        medications?: string | null;
    };
    machines?: Array<{ id: number; name_en: string; name_ar: string }>;
    bookings?: {
        data: Array<{
            id: number;
            booking_reference: string;
            clinic?: { id: number; name_en: string; name_ar: string };
            treatment?: { id: number; name_en: string; name_ar: string };
            status: string;
            payment_status: string;
            total_amount: string;
            created_at: string;
        }>;
        current_page: number;
        last_page: number;
        per_page: number;
        total: number;
    };
    favorites?: {
        clinic?: {
            data: Array<{
                id: number;
                favoritable: {
                    id: number;
                    name_en: string;
                    name_ar: string;
                } | null;
                created_at: string;
            }>;
        };
        treatment?: {
            data: Array<{
                id: number;
                favoritable: {
                    id: number;
                    name_en: string;
                    name_ar: string;
                } | null;
                created_at: string;
            }>;
        };
        machine?: {
            data: Array<{
                id: number;
                favoritable: {
                    id: number;
                    serial_number?: string;
                    model_en?: string;
                    model_ar?: string;
                } | null;
                created_at: string;
            }>;
        };
    };
    medicalRecords?: {
        data: Array<{
            id: number;
            file_name: string;
            file_path: string;
            file_size: number;
            mime_type: string;
            created_at: string;
        }>;
        current_page: number;
        last_page: number;
        per_page: number;
        total: number;
    };
    transactions?: {
        data: Array<{
            id: number;
            transaction_id: string;
            type: string;
            amount: string;
            currency: string;
            status: string;
            created_at: string;
        }>;
        current_page: number;
        last_page: number;
        per_page: number;
        total: number;
    };
    activityLogs?: {
        data: Array<{
            id: number;
            description: string;
            event: string;
            properties: Record<string, unknown>;
            created_at: string;
        }>;
        current_page: number;
        last_page: number;
        per_page: number;
        total: number;
    };
}

export default function ShowUser({ 
    user, 
    machines = [], 
    bookings,
    favorites,
    medicalRecords,
    transactions,
    activityLogs
}: ShowUserProps) {
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
            title: t('users_management'),
            href: '/dashboard/users',
        },
        {
            title: t('view_user'),
            href: '#',
        },
    ];

    // Helper to get machine names from IDs
    const getMachineNames = (machineIds: number[] | null | undefined): string => {
        if (!machineIds || !Array.isArray(machineIds) || machineIds.length === 0) {
            return t('not_specified');
        }
        const names = machineIds.map(id => {
            const machine = machines.find(m => m.id === id);
            return machine ? getLocalizedName(machine.name_en, machine.name_ar, locale) : `Machine #${id}`;
        });
        return names.join(', ');
    };

    const formatDate = (date: string) => {
        return new Date(date).toLocaleDateString(isRTL ? 'ar-SA' : 'en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    const getGenderLabel = (gender: string | null | undefined) => {
        if (!gender) return t('not_specified');
        return gender === 'male' ? t('male') : t('female');
    };

    const getSkinTypeLabel = (skinType: string | null | undefined) => {
        if (!skinType) return t('not_specified');
        const labels: Record<string, string> = {
            fair: t('fair'),
            medium: t('medium'),
            dark: t('dark'),
        };
        return labels[skinType] || skinType;
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`${t('user_details')} - ${user.name}`} />

            <ViewPageLayout>
                <PageHeader
                    title={t('user_details')}
                    description={t('view_user_information_and_activity')}
                    actions={
                        <div className={cn("flex items-center gap-3", flexDirection)}>
                            <Link href={`/dashboard/users/${user.id}/edit`}>
                                <Button className={cn("flex items-center gap-2", flexDirection)}>
                                    <Edit className={cn("h-4 w-4", iconMargin('md'))} />
                                    {t('edit_user')}
                                </Button>
                            </Link>
                            <Link href="/dashboard/users">
                                <Button variant="outline" className={cn("flex items-center gap-2", flexDirection)}>
                                    <ArrowLeft className={cn("h-4 w-4", isRTL && 'rotate-180', iconMargin('md'))} />
                                    {t('back')}
                                </Button>
                            </Link>
                        </div>
                    }
                />

                {/* User Card */}
                <div className={cn("bg-gray-50 dark:bg-gray-800 rounded-lg p-6", isRTL ? '!text-right' : '!text-left')}>
                    <UserCard user={user} showVerificationBadges={true} />
                </div>

                {/* Tabs */}
                <Tabs defaultValue="profile" className={cn("w-full", isRTL ? '!text-right' : '!text-left')}>
                    <TabsList className={cn(`grid w-full ${
                        (() => {
                            const visibleTabs = [
                                can('users.view-profile'),
                                can('users.view-medical'),
                                can('users.view-bookings'),
                                can('users.view-favorites'),
                                can('users.view-medical-records'),
                                can('users.view-transactions'),
                                can('users.view-activity'),
                            ].filter(Boolean).length;
                            const colsMap: { [key: number]: string } = {
                                1: 'grid-cols-1',
                                2: 'grid-cols-2',
                                3: 'grid-cols-3',
                                4: 'grid-cols-4',
                                5: 'grid-cols-5',
                                6: 'grid-cols-6',
                                7: 'grid-cols-7',
                            };
                            return colsMap[visibleTabs] || 'grid-cols-2';
                        })()
                    }`, flexDirection)}>
                        {can('users.view-profile') && (
                            <TabsTrigger value="profile" className={cn(isRTL ? '!text-right' : '!text-left')}>{t('profile')}</TabsTrigger>
                        )}
                        {can('users.view-medical') && (
                            <TabsTrigger value="medical" className={cn(isRTL ? '!text-right' : '!text-left')}>{t('medical_information')}</TabsTrigger>
                        )}
                        {can('users.view-bookings') && (
                            <TabsTrigger value="bookings" className={cn(isRTL ? '!text-right' : '!text-left')}>{t('bookings')}</TabsTrigger>
                        )}
                        {can('users.view-favorites') && (
                            <TabsTrigger value="favorites" className={cn(isRTL ? '!text-right' : '!text-left')}>{t('favorites')}</TabsTrigger>
                        )}
                        {can('users.view-medical-records') && (
                            <TabsTrigger value="medical-records" className={cn(isRTL ? '!text-right' : '!text-left')}>{t('medical_records')}</TabsTrigger>
                        )}
                        {can('users.view-transactions') && (
                            <TabsTrigger value="transactions" className={cn(isRTL ? '!text-right' : '!text-left')}>{t('transactions')}</TabsTrigger>
                        )}
                        {can('users.view-activity') && (
                            <TabsTrigger value="activity" className={cn(isRTL ? '!text-right' : '!text-left')}>{t('activity')}</TabsTrigger>
                        )}
                    </TabsList>

                    {can('users.view-profile') && (
                        <TabsContent value="profile" className={cn("space-y-6 mt-6", isRTL ? '!text-right' : '!text-left')}>
                        {/* Basic Information */}
                        <div className={cn("space-y-4", isRTL ? '!text-right' : '!text-left')}>
                            <h3 className={cn("text-lg font-semibold text-foreground", isRTL ? '!text-right' : '!text-left')} dir={dir}>{t('basic_information')}</h3>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {/* Full Name */}
                                <div className={cn("space-y-2", isRTL ? '!text-right' : '!text-left')}>
                                    <p className={cn("text-sm text-muted-foreground", isRTL ? '!text-right' : '!text-left')} dir={dir}>{t('full_name')}</p>
                                    <p className={cn("text-base font-medium text-foreground", isRTL ? '!text-right' : '!text-left')} dir={dir}>{user.name}</p>
                                </div>

                                {/* Email */}
                                {user.email && (
                                    <div className={cn("space-y-2", isRTL ? '!text-right' : '!text-left')}>
                                        <p className={cn("text-sm text-muted-foreground", isRTL ? '!text-right' : '!text-left')} dir={dir}>{t('email')}</p>
                                        <div className={cn("flex items-center gap-2", flexDirection)}>
                                            <Mail className={cn("h-4 w-4 text-gray-400 dark:text-gray-500", iconMargin('sm'))} />
                                            <p className={cn("text-base font-medium text-foreground", isRTL ? '!text-right' : '!text-left')} dir="ltr">{user.email}</p>
                                            {user.email_verified_at ? (
                                                <Badge variant="default" className={cn(isRTL ? 'mr-2' : 'ml-2', isRTL ? '!text-right' : '!text-left')} dir={dir}>{t('verified')}</Badge>
                                            ) : (
                                                <Badge variant="destructive" className={cn(isRTL ? 'mr-2' : 'ml-2', isRTL ? '!text-right' : '!text-left')} dir={dir}>{t('not_verified')}</Badge>
                                            )}
                                        </div>
                                        <p className={cn("text-xs text-muted-foreground", isRTL ? '!text-right' : '!text-left')} dir={dir}>
                                            {user.email_verified_at 
                                                ? `${t('verified')} - ${formatDate(user.email_verified_at)}`
                                                : t('email_not_verified')
                                            }
                                        </p>
                                    </div>
                                )}

                                {/* Phone */}
                                {user.phone && (
                                    <div className={cn("space-y-2", isRTL ? '!text-right' : '!text-left')}>
                                        <p className={cn("text-sm text-muted-foreground", isRTL ? '!text-right' : '!text-left')} dir={dir}>{t('phone_number')}</p>
                                        <div className={cn("flex items-center gap-2", flexDirection)}>
                                            <Phone className={cn("h-4 w-4 text-gray-400 dark:text-gray-500", iconMargin('sm'))} />
                                            <p className={cn("text-base font-medium font-mono text-foreground", isRTL ? '!text-right' : '!text-left')} dir="ltr">{user.phone}</p>
                                            {user.phone_verified_at ? (
                                                <Badge variant="default" className={cn(isRTL ? 'mr-2' : 'ml-2', isRTL ? '!text-right' : '!text-left')} dir={dir}>{t('verified')}</Badge>
                                            ) : (
                                                <Badge variant="destructive" className={cn(isRTL ? 'mr-2' : 'ml-2', isRTL ? '!text-right' : '!text-left')} dir={dir}>{t('not_verified')}</Badge>
                                            )}
                                        </div>
                                        <p className={cn("text-xs text-muted-foreground", isRTL ? '!text-right' : '!text-left')} dir={dir}>
                                            {user.phone_verified_at 
                                                ? `${t('verified')} - ${formatDate(user.phone_verified_at)}`
                                                : t('phone_not_verified')
                                            }
                                        </p>
                                    </div>
                                )}

                                {/* Created At */}
                                <div className={cn("space-y-2", isRTL ? '!text-right' : '!text-left')}>
                                    <p className={cn("text-sm text-muted-foreground", isRTL ? '!text-right' : '!text-left')} dir={dir}>{t('created_at')}</p>
                                    <div className={cn("flex items-center gap-2", flexDirection)}>
                                        <Calendar className={cn("h-4 w-4 text-gray-400 dark:text-gray-500", iconMargin('sm'))} />
                                        <p className={cn("text-base font-medium text-foreground", isRTL ? '!text-right' : '!text-left')} dir={dir}>{formatDate(user.created_at)}</p>
                                    </div>
                                </div>

                                {/* Last Updated */}
                                <div className={cn("space-y-2", isRTL ? '!text-right' : '!text-left')}>
                                    <p className={cn("text-sm text-muted-foreground", isRTL ? '!text-right' : '!text-left')} dir={dir}>{t('updated_at')}</p>
                                    <div className={cn("flex items-center gap-2", flexDirection)}>
                                        <Clock className={cn("h-4 w-4 text-gray-400 dark:text-gray-500", iconMargin('sm'))} />
                                        <p className={cn("text-base font-medium text-foreground", isRTL ? '!text-right' : '!text-left')} dir={dir}>{formatDate(user.updated_at)}</p>
                                    </div>
                                </div>

                                {/* Last Login */}
                                {user.last_login_at && (
                                    <div className={cn("space-y-2", isRTL ? '!text-right' : '!text-left')}>
                                        <p className={cn("text-sm text-muted-foreground", isRTL ? '!text-right' : '!text-left')} dir={dir}>{t('last_login')}</p>
                                        <div className={cn("flex items-center gap-2", flexDirection)}>
                                            <Clock className={cn("h-4 w-4 text-gray-400 dark:text-gray-500", iconMargin('sm'))} />
                                            <p className={cn("text-base font-medium text-foreground", isRTL ? '!text-right' : '!text-left')} dir={dir}>{formatDate(user.last_login_at)}</p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                        </TabsContent>
                    )}

                    {can('users.view-medical') && (
                        <TabsContent value="medical" className={cn("space-y-6 mt-6", isRTL ? '!text-right' : '!text-left')}>
                        {/* Medical Information */}
                        <div className={cn("space-y-4", isRTL ? '!text-right' : '!text-left')}>
                            <h3 className={cn("text-lg font-semibold text-foreground", isRTL ? '!text-right' : '!text-left')} dir={dir}>{t('medical_information')}</h3>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {/* Gender */}
                                <div className={cn("space-y-2", isRTL ? '!text-right' : '!text-left')}>
                                    <p className={cn("text-sm text-muted-foreground flex items-center gap-2", flexDirection)}>
                                        <User className={cn("h-4 w-4", iconMargin('sm'))} />
                                        {t('gender')}
                                    </p>
                                    <p className={cn("text-base font-medium text-foreground", isRTL ? '!text-right' : '!text-left')} dir={dir}>{getGenderLabel(user.gender)}</p>
                                </div>

                                {/* Skin Type */}
                                <div className={cn("space-y-2", isRTL ? '!text-right' : '!text-left')}>
                                    <p className={cn("text-sm text-muted-foreground", isRTL ? '!text-right' : '!text-left')} dir={dir}>{t('skin_type')}</p>
                                    <p className={cn("text-base font-medium text-foreground", isRTL ? '!text-right' : '!text-left')} dir={dir}>{getSkinTypeLabel(user.skin_type)}</p>
                                </div>

                                {/* Age */}
                                <div className={cn("space-y-2", isRTL ? '!text-right' : '!text-left')}>
                                    <p className={cn("text-sm text-muted-foreground", isRTL ? '!text-right' : '!text-left')} dir={dir}>{t('age')}</p>
                                    <p className={cn("text-base font-medium text-foreground", isRTL ? '!text-right' : '!text-left')} dir="ltr">
                                        {user.age ? `${user.age} ${t('years_old') || 'years'}` : t('not_specified')}
                                    </p>
                                </div>

                                {/* Date of Birth */}
                                {user.date_of_birth && (
                                    <div className={cn("space-y-2", isRTL ? '!text-right' : '!text-left')}>
                                        <p className={cn("text-sm text-muted-foreground", isRTL ? '!text-right' : '!text-left')} dir={dir}>{t('date_of_birth')}</p>
                                        <div className={cn("flex items-center gap-2", flexDirection)}>
                                            <Calendar className={cn("h-4 w-4 text-gray-400 dark:text-gray-500", iconMargin('sm'))} />
                                            <p className={cn("text-base font-medium text-foreground", isRTL ? '!text-right' : '!text-left')} dir={dir}>
                                                {new Date(user.date_of_birth).toLocaleDateString(isRTL ? 'ar-SA' : 'en-US', {
                                                    year: 'numeric',
                                                    month: 'long',
                                                    day: 'numeric',
                                                })}
                                            </p>
                                        </div>
                                    </div>
                                )}

                                {/* Last Machine Used */}
                                <div className={cn("space-y-2", isRTL ? '!text-right' : '!text-left')}>
                                    <p className={cn("text-sm text-muted-foreground", isRTL ? '!text-right' : '!text-left')} dir={dir}>{t('last_machine_used')}</p>
                                    <p className={cn("text-base font-medium text-foreground", isRTL ? '!text-right' : '!text-left')} dir={dir}>
                                        {(() => {
                                            const machineNames = getMachineNames(user.last_machine_used);
                                            const hasOtherName = user.last_machine_used_name && user.last_machine_used_name.trim() !== '';
                                            if (machineNames !== t('not_specified') && hasOtherName) {
                                                return `${machineNames}, ${user.last_machine_used_name}`;
                                            } else if (hasOtherName) {
                                                return user.last_machine_used_name;
                                            } else {
                                                return machineNames;
                                            }
                                        })()}
                                    </p>
                                </div>

                                {/* Restricted Machines */}
                                <div className={cn("space-y-2", isRTL ? '!text-right' : '!text-left')}>
                                    <p className={cn("text-sm text-muted-foreground", isRTL ? '!text-right' : '!text-left')} dir={dir}>{t('restricted_machines')}</p>
                                    <p className={cn("text-base font-medium text-foreground", isRTL ? '!text-right' : '!text-left')} dir={dir}>
                                        {(() => {
                                            const machineNames = getMachineNames(user.restricted_machines);
                                            const hasOtherName = user.restricted_machines_name && user.restricted_machines_name.trim() !== '';
                                            if (machineNames !== t('not_specified') && hasOtherName) {
                                                return `${machineNames}, ${user.restricted_machines_name}`;
                                            } else if (hasOtherName) {
                                                return user.restricted_machines_name;
                                            } else {
                                                return machineNames;
                                            }
                                        })()}
                                    </p>
                                </div>
                            </div>

                            {/* Allergies */}
                            <div className={cn("space-y-2 pt-4 border-t", isRTL ? '!text-right' : '!text-left')}>
                                <p className={cn("text-sm text-muted-foreground flex items-center gap-2", flexDirection)}>
                                    <Heart className={cn("h-4 w-4", iconMargin('sm'))} />
                                    {t('do_you_have_any_known_allergies')}
                                </p>
                                <div className={cn("bg-gray-50 dark:bg-gray-800 rounded-lg p-4", isRTL ? '!text-right' : '!text-left')}>
                                    <p className={cn("text-base text-foreground whitespace-pre-wrap", isRTL ? '!text-right' : '!text-left')} dir={dir}>
                                        {user.allergies && String(user.allergies).trim() !== ''
                                            ? user.allergies
                                            : t('no_record_found')}
                                    </p>
                                </div>
                            </div>

                            {/* Medications */}
                            <div className={cn("space-y-2 pt-4 border-t", isRTL ? '!text-right' : '!text-left')}>
                                <p className={cn("text-sm text-muted-foreground flex items-center gap-2", flexDirection)}>
                                    <Pill className={cn("h-4 w-4", iconMargin('sm'))} />
                                    {t('current_medications') || t('medications')}
                                </p>
                                <div className={cn("bg-gray-50 dark:bg-gray-800 rounded-lg p-4", isRTL ? '!text-right' : '!text-left')}>
                                    <p className={cn("text-base text-foreground whitespace-pre-wrap", isRTL ? '!text-right' : '!text-left')} dir={dir}>
                                        {user.medications || t('no_medications_recorded') || t('no_medications_used')}
                                    </p>
                                </div>
                            </div>
                        </div>
                        </TabsContent>
                    )}

                    {can('users.view-bookings') && (
                        <TabsContent value="bookings" className={cn("space-y-6 mt-6", isRTL ? '!text-right' : '!text-left')}>
                            <div className={cn("space-y-4", isRTL ? '!text-right' : '!text-left')}>
                                <h3 className={cn("text-lg font-semibold text-foreground", isRTL ? '!text-right' : '!text-left')} dir={dir}>{t('user_bookings')}</h3>
                                {bookings && bookings.data && bookings.data.length > 0 ? (
                                    <div className={cn("space-y-4", isRTL ? '!text-right' : '!text-left')}>
                                        {bookings.data.map((booking) => (
                                            <div key={booking.id} className={cn("border rounded-lg p-4 dark:border-slate-700", isRTL ? '!text-right' : '!text-left')}>
                                                <div className={cn("flex items-center justify-between", flexDirection)}>
                                                    <div className={cn(isRTL ? '!text-right' : '!text-left')}>
                                                        <p className={cn("font-mono text-sm font-medium", isRTL ? '!text-right' : '!text-left')} dir="ltr">{booking.booking_reference}</p>
                                                        <p className={cn("text-sm text-muted-foreground mt-1", isRTL ? '!text-right' : '!text-left')} dir={dir}>
                                                            {isRTL && booking.clinic?.name_ar 
                                                                ? booking.clinic.name_ar 
                                                                : booking.clinic?.name_en || t('n_a')}
                                                        </p>
                                                        {booking.treatment && (
                                                            <p className={cn("text-sm text-muted-foreground", isRTL ? '!text-right' : '!text-left')} dir={dir}>
                                                                {isRTL && booking.treatment.name_ar 
                                                                    ? booking.treatment.name_ar 
                                                                    : booking.treatment.name_en || t('n_a')}
                                                            </p>
                                                        )}
                                                    </div>
                                                    <div className={cn(isRTL ? 'text-left' : 'text-right')}>
                                                        <Badge variant={booking.status === 'completed' ? 'default' : 'secondary'} className={cn(isRTL ? '!text-right' : '!text-left')} dir={dir}>
                                                            {t(booking.status)}
                                                        </Badge>
                                                        <p className={cn("text-sm font-medium mt-1", isRTL ? '!text-right' : '!text-left')} dir="ltr">{booking.total_amount} KWD</p>
                                                        <p className={cn("text-xs text-muted-foreground mt-1", isRTL ? '!text-right' : '!text-left')} dir={dir}>
                                                            {formatDate(booking.created_at)}
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <p className={cn("text-sm text-muted-foreground", isRTL ? '!text-right' : '!text-left')} dir={dir}>{t('bookings_will_be_displayed_here')}</p>
                                )}
                            </div>
                        </TabsContent>
                    )}

                    {can('users.view-favorites') && (
                        <TabsContent value="favorites" className={cn("space-y-6 mt-6", isRTL ? '!text-right' : '!text-left')}>
                            <div className={cn("space-y-4", isRTL ? '!text-right' : '!text-left')}>
                                <h3 className={cn("text-lg font-semibold text-foreground", isRTL ? '!text-right' : '!text-left')} dir={dir}>{t('user_favorites')}</h3>
                                {favorites && (
                                    <div className={cn("space-y-6", isRTL ? '!text-right' : '!text-left')}>
                                        {favorites.clinic && favorites.clinic.data && favorites.clinic.data.length > 0 && (
                                            <div className={cn(isRTL ? '!text-right' : '!text-left')}>
                                                <h4 className={cn("font-medium mb-2", isRTL ? '!text-right' : '!text-left')} dir={dir}>{t('clinics')}</h4>
                                                <div className={cn("space-y-2", isRTL ? '!text-right' : '!text-left')}>
                                                    {favorites.clinic.data
                                                        .filter((fav) => fav.favoritable) // Filter out null favoritable
                                                        .map((fav) => (
                                                        <div key={fav.id} className={cn("border rounded-lg p-3 dark:border-slate-700", isRTL ? '!text-right' : '!text-left')}>
                                                            <p className={cn("font-medium", isRTL ? '!text-right' : '!text-left')} dir={dir}>
                                                                {fav.favoritable && (
                                                                    isRTL && fav.favoritable.name_ar 
                                                                        ? fav.favoritable.name_ar 
                                                                        : (fav.favoritable.name_en || t('unknown'))
                                                                )}
                                                            </p>
                                                            <p className={cn("text-xs text-muted-foreground mt-1", isRTL ? '!text-right' : '!text-left')} dir={dir}>
                                                                {formatDate(fav.created_at)}
                                                            </p>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                        {favorites.treatment && favorites.treatment.data && favorites.treatment.data.length > 0 && (
                                            <div className={cn(isRTL ? '!text-right' : '!text-left')}>
                                                <h4 className={cn("font-medium mb-2", isRTL ? '!text-right' : '!text-left')} dir={dir}>{t('treatments')}</h4>
                                                <div className={cn("space-y-2", isRTL ? '!text-right' : '!text-left')}>
                                                    {favorites.treatment.data
                                                        .filter((fav) => fav.favoritable) // Filter out null favoritable
                                                        .map((fav) => (
                                                        <div key={fav.id} className={cn("border rounded-lg p-3 dark:border-slate-700", isRTL ? '!text-right' : '!text-left')}>
                                                            <p className={cn("font-medium", isRTL ? '!text-right' : '!text-left')} dir={dir}>
                                                                {fav.favoritable && (
                                                                    isRTL && fav.favoritable.name_ar 
                                                                        ? fav.favoritable.name_ar 
                                                                        : (fav.favoritable.name_en || t('unknown'))
                                                                )}
                                                            </p>
                                                            <p className={cn("text-xs text-muted-foreground mt-1", isRTL ? '!text-right' : '!text-left')} dir={dir}>
                                                                {formatDate(fav.created_at)}
                                                            </p>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                        {favorites.machine && favorites.machine.data && favorites.machine.data.length > 0 && (
                                            <div className={cn(isRTL ? '!text-right' : '!text-left')}>
                                                <h4 className={cn("font-medium mb-2", isRTL ? '!text-right' : '!text-left')} dir={dir}>{t('machines')}</h4>
                                                <div className={cn("space-y-2", isRTL ? '!text-right' : '!text-left')}>
                                                    {favorites.machine.data
                                                        .filter((fav) => fav.favoritable) // Filter out null favoritable
                                                        .map((fav) => (
                                                        <div key={fav.id} className={cn("border rounded-lg p-3 dark:border-slate-700", isRTL ? '!text-right' : '!text-left')}>
                                                            <p className={cn("font-medium", isRTL ? '!text-right' : '!text-left')} dir={dir}>
                                                                {fav.favoritable 
                                                                    ? (fav.favoritable.serial_number || fav.favoritable.model_en || t('unknown'))
                                                                    : t('unknown')
                                                                }
                                                            </p>
                                                            <p className={cn("text-xs text-muted-foreground mt-1", isRTL ? '!text-right' : '!text-left')} dir={dir}>
                                                                {formatDate(fav.created_at)}
                                                            </p>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                        {(!favorites.clinic || !favorites.clinic.data || favorites.clinic.data.length === 0) &&
                                         (!favorites.treatment || !favorites.treatment.data || favorites.treatment.data.length === 0) &&
                                         (!favorites.machine || !favorites.machine.data || favorites.machine.data.length === 0) && (
                                            <p className={cn("text-sm text-muted-foreground", isRTL ? '!text-right' : '!text-left')} dir={dir}>{t('favorites_will_be_displayed_here')}</p>
                                        )}
                                    </div>
                                )}
                            </div>
                        </TabsContent>
                    )}

                    {can('users.view-medical-records') && (
                        <TabsContent value="medical-records" className={cn("space-y-6 mt-6", isRTL ? '!text-right' : '!text-left')}>
                            <div className={cn("space-y-4", isRTL ? '!text-right' : '!text-left')}>
                                <h3 className={cn("text-lg font-semibold text-foreground", isRTL ? '!text-right' : '!text-left')} dir={dir}>{t('medical_records')}</h3>
                                {medicalRecords && medicalRecords.data && medicalRecords.data.length > 0 ? (
                                    <div className={cn("space-y-4", isRTL ? '!text-right' : '!text-left')}>
                                        {medicalRecords.data.map((record) => (
                                            <div key={record.id} className={cn("border rounded-lg p-4 dark:border-slate-700", isRTL ? '!text-right' : '!text-left')}>
                                                <div className={cn("flex items-center justify-between", flexDirection)}>
                                                    <div className={cn(isRTL ? '!text-right' : '!text-left')}>
                                                        <p className={cn("font-medium", isRTL ? '!text-right' : '!text-left')} dir={dir}>{record.file_name}</p>
                                                        <p className={cn("text-sm text-muted-foreground mt-1", isRTL ? '!text-right' : '!text-left')} dir="ltr">
                                                            {record.file_size && !isNaN(record.file_size) && record.file_size > 0
                                                                ? `${(record.file_size / 1024).toFixed(2)} KB`
                                                                : t('unknown')}
                                                        </p>
                                                        <p className={cn("text-xs text-muted-foreground mt-1", isRTL ? '!text-right' : '!text-left')} dir={dir}>
                                                            {formatDate(record.created_at)}
                                                        </p>
                                                    </div>
                                                    <a 
                                                        href={record.file_path} 
                                                        target="_blank" 
                                                        rel="noopener noreferrer"
                                                        className={cn("text-primary hover:underline", isRTL ? '!text-right' : '!text-left')}
                                                    >
                                                        {t('view')}
                                                    </a>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <p className={cn("text-sm text-muted-foreground", isRTL ? '!text-right' : '!text-left')} dir={dir}>{t('medical_records_will_be_displayed_here')}</p>
                                )}
                            </div>
                        </TabsContent>
                    )}

                    {can('users.view-transactions') && (
                        <TabsContent value="transactions" className={cn("space-y-6 mt-6", isRTL ? '!text-right' : '!text-left')}>
                            <div className={cn("space-y-4", isRTL ? '!text-right' : '!text-left')}>
                                <h3 className={cn("text-lg font-semibold text-foreground", isRTL ? '!text-right' : '!text-left')} dir={dir}>{t('transactions')}</h3>
                                {transactions && transactions.data && transactions.data.length > 0 ? (
                                    <div className={cn("space-y-4", isRTL ? '!text-right' : '!text-left')}>
                                        {transactions.data.map((transaction) => (
                                            <div key={transaction.id} className={cn("border rounded-lg p-4 dark:border-slate-700", isRTL ? '!text-right' : '!text-left')}>
                                                <div className={cn("flex items-center justify-between", flexDirection)}>
                                                    <div className={cn(isRTL ? '!text-right' : '!text-left')}>
                                                        <p className={cn("font-mono text-sm font-medium", isRTL ? '!text-right' : '!text-left')} dir="ltr">{transaction.transaction_id}</p>
                                                        <p className={cn("text-sm text-muted-foreground mt-1", isRTL ? '!text-right' : '!text-left')} dir={dir}>{t(transaction.type)}</p>
                                                        <p className={cn("text-xs text-muted-foreground mt-1", isRTL ? '!text-right' : '!text-left')} dir={dir}>
                                                            {formatDate(transaction.created_at)}
                                                        </p>
                                                    </div>
                                                    <div className={cn(isRTL ? 'text-left' : 'text-right')}>
                                                        <Badge variant={transaction.status === 'completed' ? 'default' : 'secondary'} className={cn(isRTL ? '!text-right' : '!text-left')} dir={dir}>
                                                            {t(transaction.status)}
                                                        </Badge>
                                                        <p className={cn("text-sm font-medium mt-1", isRTL ? '!text-right' : '!text-left')} dir="ltr">
                                                            {transaction.amount} {transaction.currency}
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <p className={cn("text-sm text-muted-foreground", isRTL ? '!text-right' : '!text-left')} dir={dir}>{t('transactions_will_be_displayed_here')}</p>
                                )}
                            </div>
                        </TabsContent>
                    )}

                    {can('users.view-activity') && (
                        <TabsContent value="activity" className={cn("space-y-6 mt-6", isRTL ? '!text-right' : '!text-left')}>
                            <ActivityLogsTable activityLogs={activityLogs} />
                        </TabsContent>
                    )}
                </Tabs>
            </ViewPageLayout>
        </AppLayout>
    );
}

// Activity Logs Table Component
interface ActivityLogsTableProps {
    activityLogs?: {
        data: Array<{
            id: number;
            description: string;
            event: string;
            properties: Record<string, unknown>;
            created_at: string;
            causer?: {
                id: number;
                name: string;
                email: string;
            };
            subject?: {
                id: number;
                name?: string;
                email?: string;
                title?: string;
            };
        }>;
        current_page: number;
        last_page: number;
        per_page: number;
        total: number;
    };
}

function ActivityLogsTable({ activityLogs }: ActivityLogsTableProps) {
    const { t, locale } = useTranslation();
    const page = usePage<SharedData>();
    const { locale: pageLocale } = page.props;
    const isRTL = pageLocale === 'ar';
    const dir = isRTL ? 'rtl' : 'ltr';
    const { flexDirection, iconMargin } = useRTL();

    if (!activityLogs || !activityLogs.data || activityLogs.data.length === 0) {
        return (
            <div className={cn("space-y-4", isRTL ? '!text-right' : '!text-left')}>
                <h3 className={cn("text-lg font-semibold text-foreground", isRTL ? '!text-right' : '!text-left')} dir={dir}>{t('activity')}</h3>
                <p className={cn("text-sm text-muted-foreground", isRTL ? '!text-right' : '!text-left')} dir={dir}>{t('user_activity_will_be_displayed_here')}</p>
            </div>
        );
    }

    const handlePageChange = (page: number) => {
        router.get(window.location.pathname, {
            page,
            per_page: activityLogs.per_page,
        }, {
            preserveState: true,
            preserveScroll: true,
        });
    };

    const handlePerPageChange = (perPage: number) => {
        router.reload({
            data: {
                per_page: perPage,
                page: 1,
            },
            only: ['activityLogs'],
            preserveState: true,
            preserveScroll: true,
        });
    };

    // Helper to render description with bold text
    const renderDescriptionWithBold = (description: string) => {
        if (!description) return '';
        const strippedDescription = description.replace(/<[^>]*>/g, '');
        const boldWords = ['created', 'updated', 'deleted', 'logged in', 'logged out', 'registered', 'reset', 'verified'];
        const regex = new RegExp(`\\b(${boldWords.join('|')})\\b`, 'gi');
        const parts = strippedDescription.split(regex);
        return parts.map((part, index) => {
            if (boldWords.some(word => word.toLowerCase() === part.toLowerCase())) {
                return <strong key={index} className="font-semibold">{part}</strong>;
            }
            return <span key={index}>{part}</span>;
        });
    };

    const columns = [
        {
            key: 'action',
            label: t('action'),
            render: (_: unknown, log: ActivityLogsTableProps['activityLogs']['data'][0]) => (
                <div className={cn("flex items-start gap-4 p-3 border rounded-lg bg-gray-50 dark:bg-slate-800/50", flexDirection)}>
                    <div className="flex-1 min-w-0">
                        <div className={cn("flex items-center gap-2 mb-2", flexDirection)}>
                            <Badge variant="secondary" className={cn("bg-gray-800 text-white text-xs px-2 py-1", isRTL ? '!text-right' : '!text-left')} dir={dir}>
                                {t(log.event) || log.event}
                            </Badge>
                            <span className={cn("text-sm text-muted-foreground", isRTL ? '!text-right' : '!text-left')} dir={dir}>
                                {renderDescriptionWithBold(log.description)}
                            </span>
                        </div>
                        <div className={cn("flex items-center gap-4 text-xs text-muted-foreground", flexDirection)}>
                            {log.causer && (
                                <>
                                    <div className={cn("flex items-center gap-1", flexDirection)}>
                                        <User className={cn("h-3 w-3", iconMargin('xs'))} />
                                        <span className={cn("text-gray-400", isRTL ? '!text-right' : '!text-left')} dir={dir}>{t('performed_by')}:</span>
                                        <span className={cn("font-medium text-foreground", isRTL ? '!text-right' : '!text-left')} dir={dir}>
                                            {log.causer.name || log.causer.email || t('system')}
                                        </span>
                                    </div>
                                    <span>•</span>
                                </>
                            )}
                            <div className={cn("flex items-center gap-1", flexDirection)}>
                                <Calendar className={cn("h-3 w-3", iconMargin('xs'))} />
                                <span className={cn("text-gray-400", isRTL ? '!text-right' : '!text-left')} dir={dir}>{t('performed_at')}:</span>
                                <span className={cn("font-medium text-foreground", isRTL ? '!text-right' : '!text-left')} dir={dir}>
                                    {formatHumanDate(log.created_at, t)}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            ),
        },
        {
            key: 'actions',
            label: t('actions'),
            render: (_: unknown, log: ActivityLogsTableProps['activityLogs']['data'][0]) => (
                <div className={cn("flex items-center gap-2", flexDirection)}>
                    <Button
                        variant="ghost"
                        size="sm"
                        asChild
                        className="text-purple-600 dark:text-purple-400 hover:text-purple-500 dark:hover:text-purple-300 hover:bg-purple-50 dark:hover:bg-purple-900/20"
                    >
                        <Link href={`/dashboard/activity-logs/${log.id}`}>
                            <Eye className={cn("h-4 w-4", iconMargin('md'))} />
                        </Link>
                    </Button>
                </div>
            ),
        },
    ];

    return (
        <div className={cn("space-y-4", isRTL ? '!text-right' : '!text-left')}>
            <h3 className={cn("text-lg font-semibold text-foreground", isRTL ? '!text-right' : '!text-left')} dir={dir}>{t('activity')}</h3>
            <DataTable
                data={activityLogs.data.filter(item => item != null)}
                columns={columns}
                total={activityLogs.total}
                currentPage={activityLogs.current_page}
                perPage={activityLogs.per_page}
                onPageChange={handlePageChange}
                onPerPageChange={handlePerPageChange}
            />
        </div>
    );
}
