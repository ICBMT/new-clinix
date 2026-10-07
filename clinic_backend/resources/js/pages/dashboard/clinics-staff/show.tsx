import { type BreadcrumbItem } from '@/types';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useTranslation } from '@/hooks/use-translation';
import { useRTL } from '@/hooks/use-rtl';
import { useRTLInit } from '@/hooks/use-rtl-init';
import { getLocalizedName } from '@/utils/localization';
import AppLayout from '@/layouts/app-layout';
import { index as dashboard } from '@/routes/dashboard';
import { Head, Link, usePage } from '@inertiajs/react';
import { ArrowLeft, Edit, Building2, Calendar, Mail, Phone, User, MapPin, CheckCircle, Clock, XCircle } from 'lucide-react';
import { formatHumanDate } from '@/utils/date-utils';
import { type SharedData } from '@/types';

interface Staff {
    id: number;
    name: string;
    email?: string;
    phone?: string;
    status: string;
    email_verified_at?: string | null;
    phone_verified_at?: string | null;
    created_at: string;
    updated_at: string;
    clinics?: Array<{
        id: number;
        name_en: string;
        name_ar: string;
        owner_id?: number;
        phone?: string;
        email?: string;
        address?: string;
        status?: string;
        verification_status?: 'pending' | 'approved' | 'rejected';
        governorate_id?: number;
        area_id?: number;
        created_at?: string;
        owner?: {
            id: number;
            name: string;
            email: string;
            phone?: string;
        };
        governorate?: {
            id: number;
            name_en: string;
            name_ar: string;
        };
        area?: {
            id: number;
            name_en: string;
            name_ar: string;
        };
    }>;
    roles?: Array<{
        id: number;
        name: string;
    }>;
}

interface Owner {
    id: number;
    name: string;
    email: string;
    phone?: string;
}

interface ShowStaffProps {
    staff: Staff;
    owner?: Owner | null;
}

export default function ShowStaff({ staff, owner }: ShowStaffProps) {
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
            title: t('clinics_staff_management'),
            href: '/dashboard/clinics-staff',
        },
        {
            title: t('staff_details'),
            href: '#',
        },
    ];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`${t('staff_details')} - ${staff.name}`} />

            <div className={cn("flex h-full flex-1 flex-col gap-6 overflow-x-auto rounded-xl bg-card dark:bg-card p-6 border border-border", isRTL ? '!text-right' : '!text-left')} dir={dir}>
                {/* Header */}
                <div className={cn("flex items-center justify-between border-b pb-4", flexDirection)}>
                    <div className={cn(isRTL ? '!text-right' : '!text-left')}>
                        <h1 className={cn("text-3xl font-bold text-foreground", isRTL ? '!text-right' : '!text-left')}>{t('staff_details')}</h1>
                        <p className={cn("text-muted-foreground mt-1", isRTL ? '!text-right' : '!text-left')}>{t('view_staff_information')}</p>
                    </div>
                    <div className={cn("flex items-center gap-3", flexDirection)}>
                        <Link href={`/dashboard/clinics-staff/${staff.id}/edit`}>
                            <Button className={cn("flex items-center gap-2", flexDirection)}>
                                <Edit className={cn("h-4 w-4", iconMargin('md'))} />
                                {t('edit_staff')}
                            </Button>
                        </Link>
                        <Link href="/dashboard/clinics-staff">
                            <Button variant="outline" className={cn("flex items-center gap-2", flexDirection)}>
                                <ArrowLeft className={cn("h-4 w-4", isRTL && 'rotate-180')} />
                                {t('back')}
                            </Button>
                        </Link>
                    </div>
                </div>

                {/* Staff Card with Status */}
                <div className={cn("bg-gray-50 dark:bg-gray-800/50 rounded-lg p-6", isRTL ? '!text-right' : '!text-left')}>
                    <div className={cn("flex items-center justify-between", flexDirection)}>
                        <div className={cn("flex items-center gap-4", flexDirection)}>
                            <div className={cn("w-16 h-16 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center", isRTL ? '!text-right' : '!text-left')}>
                                <User className={cn("h-8 w-8 text-purple-600 dark:text-purple-400", iconMargin('md'))} />
                            </div>
                            <div className={cn(isRTL ? '!text-right' : '!text-left')}>
                                <h2 className={cn("text-2xl font-bold text-foreground", isRTL ? '!text-right' : '!text-left')} dir={dir}>
                                    {staff.name}
                                </h2>
                                <div className={cn("flex items-center gap-4 mt-2", flexDirection)}>
                                    {staff.email && (
                                        <div className={cn("flex items-center gap-2 text-sm text-muted-foreground", flexDirection)}>
                                            <Mail className={cn("h-4 w-4", iconMargin('sm'))} />
                                            <span dir="ltr">{staff.email}</span>
                                        </div>
                                    )}
                                    {staff.phone && (
                                        <div className={cn("flex items-center gap-2 text-sm text-muted-foreground", flexDirection)}>
                                            <Phone className={cn("h-4 w-4", iconMargin('sm'))} />
                                            <span dir="ltr">{staff.phone}</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                        <div className={cn("flex flex-col gap-2", isRTL ? 'items-start' : 'items-end')}>
                            <Badge 
                                variant={staff.status === 'active' ? 'default' : 'destructive'}
                                className={cn("text-base px-4 py-1", isRTL ? '!text-right' : '!text-left',
                                    staff.status === 'active' 
                                        ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 border-green-200 dark:border-green-800' 
                                        : 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300 border-red-200 dark:border-red-800'
                                )}
                            >
                                {t(staff.status)}
                            </Badge>
                        </div>
                    </div>
                </div>

                {/* Tabs */}
                <Tabs defaultValue="details" className="w-full">
                    <TabsList className={cn("grid w-full grid-cols-2", flexDirection)}>
                        <TabsTrigger value="details" className={cn(isRTL ? '!text-right' : '!text-left')}>{t('details')}</TabsTrigger>
                        <TabsTrigger value="clinics" className={cn(isRTL ? '!text-right' : '!text-left')}>{t('clinics')}</TabsTrigger>
                    </TabsList>

                    <TabsContent value="details" className={cn("space-y-6 mt-6", isRTL ? '!text-right' : '!text-left')} dir={dir}>
                        {/* Basic Information */}
                        <div className={cn("space-y-4", isRTL ? '!text-right' : '!text-left')} dir={dir}>
                            <h3 className={cn("text-lg font-semibold text-foreground", isRTL ? '!text-right' : '!text-left')} dir={dir}>{t('basic_information')}</h3>
                            
                            <div className={cn("grid grid-cols-1 md:grid-cols-2 gap-6", flexDirection)}>
                                {/* Staff Name */}
                                <div className={cn("space-y-2", isRTL ? '!text-right' : '!text-left')} dir={dir}>
                                    <p className={cn("text-sm text-muted-foreground", isRTL ? '!text-right' : '!text-left')} dir={dir}>{t('full_name')}</p>
                                    <p className={cn("text-base font-medium text-foreground", isRTL ? '!text-right' : '!text-left')} dir={dir}>{staff.name}</p>
                                </div>

                                {/* Email */}
                                {staff.email && (
                                    <div className={cn("space-y-2", isRTL ? '!text-right' : '!text-left')} dir={dir}>
                                        <p className={cn("text-sm text-muted-foreground", isRTL ? '!text-right' : '!text-left')} dir={dir}>{t('email_address')}</p>
                                        <div className={cn("flex items-center gap-2", flexDirection)}>
                                            <Mail className={cn("h-4 w-4 text-gray-400 dark:text-gray-500", iconMargin('sm'))} />
                                            <p className={cn("text-base font-medium text-foreground", isRTL ? '!text-right' : '!text-left')} dir="ltr">{staff.email}</p>
                                        </div>
                                    </div>
                                )}

                                {/* Phone */}
                                {staff.phone && (
                                    <div className={cn("space-y-2", isRTL ? '!text-right' : '!text-left')} dir={dir}>
                                        <p className={cn("text-sm text-muted-foreground", isRTL ? '!text-right' : '!text-left')} dir={dir}>{t('phone_number')}</p>
                                        <div className={cn("flex items-center gap-2", flexDirection)}>
                                            <Phone className={cn("h-4 w-4 text-gray-400 dark:text-gray-500", iconMargin('sm'))} />
                                            <p className={cn("text-base font-medium font-mono text-foreground", isRTL ? '!text-right' : '!text-left')} dir="ltr">{staff.phone}</p>
                                        </div>
                                    </div>
                                )}

                                {/* Status */}
                                <div className={cn("space-y-2", isRTL ? '!text-right' : '!text-left')} dir={dir}>
                                    <p className={cn("text-sm text-muted-foreground", isRTL ? '!text-right' : '!text-left')} dir={dir}>{t('status')}</p>
                                    <Badge 
                                        variant={staff.status === 'active' ? 'default' : 'destructive'}
                                        className={cn(
                                            isRTL ? '!text-right' : '!text-left',
                                            staff.status === 'active' 
                                                ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 border-green-200 dark:border-green-800' 
                                                : 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300 border-red-200 dark:border-red-800'
                                        )}
                                        dir={dir}
                                    >
                                        {t(staff.status)}
                                    </Badge>
                                </div>

                                {/* Created At */}
                                <div className={cn("space-y-2", isRTL ? '!text-right' : '!text-left')} dir={dir}>
                                    <p className={cn("text-sm text-muted-foreground", isRTL ? '!text-right' : '!text-left')} dir={dir}>{t('created_at')}</p>
                                    <div className={cn("flex items-center gap-2", flexDirection)}>
                                        <Calendar className={cn("h-4 w-4 text-gray-400 dark:text-gray-500", iconMargin('sm'))} />
                                        <p className={cn("text-base font-medium text-foreground", isRTL ? '!text-right' : '!text-left')} dir={dir}>{formatHumanDate(staff.created_at, t)}</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Clinic Owner Information */}
                        {owner && (
                            <div className={cn("space-y-4 border-t pt-4", isRTL ? '!text-right' : '!text-left')} dir={dir}>
                                <h3 className={cn("text-lg font-semibold text-foreground", isRTL ? '!text-right' : '!text-left')} dir={dir}>{t('clinic_owner')}</h3>
                                <div className={cn("bg-card border border-border rounded-lg p-4", isRTL ? '!text-right' : '!text-left')} dir={dir}>
                                    <div className={cn("grid gap-4 md:grid-cols-2", flexDirection)}>
                                        <div className={cn(isRTL ? '!text-right' : '!text-left')} dir={dir}>
                                            <p className={cn("text-sm text-muted-foreground", isRTL ? '!text-right' : '!text-left')} dir={dir}>{t('full_name')}</p>
                                            <p className={cn("text-base font-medium text-foreground", isRTL ? '!text-right' : '!text-left')} dir={dir}>{owner.name}</p>
                                        </div>
                                        <div className={cn(isRTL ? '!text-right' : '!text-left')} dir={dir}>
                                            <p className={cn("text-sm text-muted-foreground", isRTL ? '!text-right' : '!text-left')} dir={dir}>{t('email_address')}</p>
                                            <p className={cn("text-base font-medium text-foreground", isRTL ? '!text-right' : '!text-left')} dir="ltr">{owner.email}</p>
                                        </div>
                                        {owner.phone && (
                                            <div className={cn(isRTL ? '!text-right' : '!text-left')} dir={dir}>
                                                <p className={cn("text-sm text-muted-foreground", isRTL ? '!text-right' : '!text-left')} dir={dir}>{t('phone_number')}</p>
                                                <p className={cn("text-base font-medium text-foreground", isRTL ? '!text-right' : '!text-left')} dir="ltr">{owner.phone}</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Dates */}
                        <div className={cn("space-y-4 border-t pt-4", isRTL ? '!text-right' : '!text-left')} dir={dir}>
                            <h3 className={cn("text-lg font-semibold text-foreground flex items-center gap-2", flexDirection)} dir={dir}>
                                <Calendar className={cn("h-5 w-5", iconMargin('md'))} />
                                {t('dates')}
                            </h3>
                            <div className={cn("grid gap-4 md:grid-cols-2", flexDirection)}>
                                <div className={cn(isRTL ? '!text-right' : '!text-left')} dir={dir}>
                                    <p className={cn("text-sm text-muted-foreground", isRTL ? '!text-right' : '!text-left')} dir={dir}>{t('created_at')}</p>
                                    <p className={cn("text-base font-medium text-foreground", isRTL ? '!text-right' : '!text-left')} dir={dir}>{formatHumanDate(staff.created_at, t)}</p>
                                </div>
                                <div className={cn(isRTL ? '!text-right' : '!text-left')} dir={dir}>
                                    <p className={cn("text-sm text-muted-foreground", isRTL ? '!text-right' : '!text-left')} dir={dir}>{t('updated_at')}</p>
                                    <p className={cn("text-base font-medium text-foreground", isRTL ? '!text-right' : '!text-left')} dir={dir}>{formatHumanDate(staff.updated_at, t)}</p>
                                </div>
                            </div>
                        </div>
                    </TabsContent>

                    <TabsContent value="clinics" className={cn("space-y-6 mt-6", isRTL ? '!text-right' : '!text-left')} dir={dir}>
                        <div className={cn("space-y-4", isRTL ? '!text-right' : '!text-left')} dir={dir}>
                            <h3 className={cn("text-lg font-semibold text-foreground flex items-center gap-2", flexDirection)} dir={dir}>
                                <Building2 className={cn("h-5 w-5", iconMargin('md'))} />
                                {t('associated_clinics')}
                            </h3>
                            {staff.clinics && staff.clinics.length > 0 ? (
                                <div className={cn("grid gap-4 md:grid-cols-2", flexDirection)}>
                                    {staff.clinics.map((clinic) => (
                                        <div key={clinic.id} className={cn("p-6 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 space-y-4", isRTL ? '!text-right' : '!text-left')} dir={dir}>
                                            {/* Clinic Name and Status */}
                                            <div className={cn("flex items-start justify-between", flexDirection)}>
                                                <div className={cn("flex-1", isRTL ? '!text-right' : '!text-left')} dir={dir}>
                                                    <h4 className={cn("text-lg font-semibold text-foreground mb-2", isRTL ? '!text-right' : '!text-left')} dir={dir}>
                                                        {getLocalizedName(clinic.name_en, clinic.name_ar, locale)}
                                                    </h4>
                                                </div>
                                                {clinic.verification_status && (
                                                    <Badge 
                                                        variant={
                                                            clinic.verification_status === 'approved' ? 'default' : 
                                                            clinic.verification_status === 'pending' ? 'secondary' : 
                                                            'destructive'
                                                        }
                                                        className={cn("text-xs", isRTL ? '!text-right' : '!text-left',
                                                            clinic.verification_status === 'approved' 
                                                                ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 border-green-200 dark:border-green-800' 
                                                                : clinic.verification_status === 'pending'
                                                                ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300 border-yellow-200 dark:border-yellow-800'
                                                                : 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300 border-red-200 dark:border-red-800'
                                                        )}
                                                        dir={dir}
                                                    >
                                                        {clinic.verification_status === 'approved' && <CheckCircle className={cn("h-3 w-3", iconMargin('sm'))} />}
                                                        {clinic.verification_status === 'pending' && <Clock className={cn("h-3 w-3", iconMargin('sm'))} />}
                                                        {clinic.verification_status === 'rejected' && <XCircle className={cn("h-3 w-3", iconMargin('sm'))} />}
                                                        {t(clinic.verification_status)}
                                                    </Badge>
                                                )}
                                            </div>

                                            {/* Contact Information */}
                                            <div className={cn("space-y-2 border-t pt-3", isRTL ? '!text-right' : '!text-left')} dir={dir}>
                                                {clinic.phone && (
                                                    <div className={cn("flex items-center gap-2 text-sm", flexDirection)}>
                                                        <Phone className={cn("h-4 w-4 text-muted-foreground flex-shrink-0", iconMargin('sm'))} />
                                                        <span className={cn("text-foreground", isRTL ? '!text-right' : '!text-left')} dir="ltr">{clinic.phone}</span>
                                                    </div>
                                                )}
                                                {clinic.email && (
                                                    <div className={cn("flex items-center gap-2 text-sm", flexDirection)}>
                                                        <Mail className={cn("h-4 w-4 text-muted-foreground flex-shrink-0", iconMargin('sm'))} />
                                                        <span className={cn("text-foreground", isRTL ? '!text-right' : '!text-left')} dir="ltr">{clinic.email}</span>
                                                    </div>
                                                )}
                                            </div>

                                            {/* Location Information */}
                                            {(clinic.address || clinic.governorate || clinic.area) && (
                                                <div className={cn("space-y-2 border-t pt-3", isRTL ? '!text-right' : '!text-left')} dir={dir}>
                                                    {clinic.address && (
                                                        <div className={cn("flex items-start gap-2 text-sm", flexDirection)}>
                                                            <MapPin className={cn("h-4 w-4 text-muted-foreground flex-shrink-0 mt-0.5", iconMargin('sm'))} />
                                                            <span className={cn("text-foreground", isRTL ? '!text-right' : '!text-left')} dir={dir}>{clinic.address}</span>
                                                        </div>
                                                    )}
                                                    {(clinic.governorate || clinic.area) && (
                                                        <div className={cn("flex items-center gap-2 text-sm text-muted-foreground", flexDirection)} dir={dir}>
                                                            {clinic.governorate && (
                                                                <span className={cn(isRTL ? '!text-right' : '!text-left')} dir={dir}>
                                                                    {getLocalizedName(clinic.governorate.name_en, clinic.governorate.name_ar, locale)}
                                                                </span>
                                                            )}
                                                            {clinic.governorate && clinic.area && <span>•</span>}
                                                            {clinic.area && (
                                                                <span className={cn(isRTL ? '!text-right' : '!text-left')} dir={dir}>
                                                                    {getLocalizedName(clinic.area.name_en, clinic.area.name_ar, locale)}
                                                                </span>
                                                            )}
                                                        </div>
                                                    )}
                                                </div>
                                            )}

                                            {/* Owner Information */}
                                            {clinic.owner && (
                                                <div className={cn("space-y-2 border-t pt-3", isRTL ? '!text-right' : '!text-left')} dir={dir}>
                                                    <p className={cn("text-xs text-muted-foreground", isRTL ? '!text-right' : '!text-left')} dir={dir}>{t('clinic_owner')}</p>
                                                    <div className={cn("flex items-center gap-2", flexDirection)}>
                                                        <User className={cn("h-4 w-4 text-muted-foreground", iconMargin('sm'))} />
                                                        <span className={cn("text-sm font-medium text-foreground", isRTL ? '!text-right' : '!text-left')} dir={dir}>{clinic.owner.name}</span>
                                                    </div>
                                                </div>
                                            )}

                                            {/* Created Date */}
                                            {clinic.created_at && (
                                                <div className={cn("space-y-2 border-t pt-3", isRTL ? '!text-right' : '!text-left')} dir={dir}>
                                                    <div className={cn("flex items-center gap-2 text-xs text-muted-foreground", flexDirection)}>
                                                        <Calendar className={cn("h-3 w-3", iconMargin('sm'))} />
                                                        <span className={cn(isRTL ? '!text-right' : '!text-left')} dir={dir}>{t('created_at')}: {formatHumanDate(clinic.created_at, t)}</span>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className={cn("p-4 bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-lg text-center", isRTL ? '!text-right' : '!text-left')} dir={dir}>
                                    <p className={cn("text-sm text-muted-foreground", isRTL ? '!text-right' : '!text-left')} dir={dir}>{t('no_clinics_assigned')}</p>
                                </div>
                            )}
                        </div>
                    </TabsContent>
                </Tabs>
            </div>
        </AppLayout>
    );
}

