import { type BreadcrumbItem } from '@/types';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useTranslation } from '@/hooks/use-translation';
import { useRTL } from '@/hooks/use-rtl';
import { useRTLInit } from '@/hooks/use-rtl-init';
import { getLocalizedName } from '@/utils/localization';
import AppLayout from '@/layouts/app-layout';
import { index as dashboard } from '@/routes/dashboard';
import { Head, Link, usePage } from '@inertiajs/react';
import { ArrowLeft, Edit, Clock, Building2, Calendar } from 'lucide-react';
import { formatHumanDate } from '@/utils/date-utils';
import { type SharedData } from '@/types';

interface OperatingHour {
    id: number;
    clinic_id: number;
    day_of_week: string;
    opening_time?: string;
    closing_time?: string;
    is_closed: boolean;
    break_start?: string;
    break_end?: string;
    clinic?: {
        id: number;
        name_en: string;
        name_ar: string;
    };
    created_at: string;
    updated_at: string;
}

interface ShowOperatingHourProps {
    operatingHour: OperatingHour;
}

const DAYS_OF_WEEK = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];

export default function ShowOperatingHour({ operatingHour }: ShowOperatingHourProps) {
    useRTLInit();
    const { t, locale } = useTranslation();
    const page = usePage<SharedData>();
    const { locale: pageLocale } = page.props;
    const isRTL = pageLocale === 'ar';
    const dir = isRTL ? 'rtl' : 'ltr';
    const { flexDirection, iconMargin } = useRTL();
    
    if (!operatingHour) {
        return (
            <AppLayout breadcrumbs={[]}>
                <Head title={t('operating_hours_not_found')} />
                <div className={cn("flex h-full flex-1 flex-col gap-6 overflow-x-auto rounded-xl bg-card dark:bg-card p-6 border border-border", isRTL ? '!text-right' : '!text-left')} dir={dir}>
                    <p className={cn(isRTL ? '!text-right' : '!text-left')}>{t('operating_hours_not_found')}</p>
                </div>
            </AppLayout>
        );
    }
    
    const breadcrumbs: BreadcrumbItem[] = [
        {
            title: t('dashboard'),
            href: dashboard.url(),
        },
        {
            title: t('clinics_operating_hours_management'),
            href: '/dashboard/clinics-operating-hours',
        },
        {
            title: t('operating_hours_details'),
            href: '#',
        },
    ];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`${t('operating_hours_details')} - ${getLocalizedName(operatingHour.clinic?.name_en, operatingHour.clinic?.name_ar, locale)}`} />

            <div className={cn("flex h-full flex-1 flex-col gap-6 overflow-x-auto rounded-xl bg-card dark:bg-card p-6 border border-border", isRTL ? '!text-right' : '!text-left')} dir={dir}>
                {/* Header */}
                <div className={cn("border-b pb-4 space-y-4", isRTL ? '!text-right' : '!text-left')}>
                    {/* Back button */}
                    <div className={cn("flex", isRTL ? 'justify-end' : 'justify-start')}>
                        <Link href="/dashboard/clinics-operating-hours">
                            <Button variant="outline" className={cn("flex items-center gap-2", flexDirection)}>
                                <ArrowLeft className={cn("h-4 w-4", isRTL && 'rotate-180')} />
                                {t('back')}
                            </Button>
                        </Link>
                    </div>
                    
                    {/* Title */}
                    <div className={cn(isRTL ? '!text-right' : '!text-left')}>
                        <h1 className={cn("text-3xl font-bold text-foreground", isRTL ? '!text-right' : '!text-left')}>{t('operating_hours_details')}</h1>
                        <p className={cn("text-muted-foreground mt-1", isRTL ? '!text-right' : '!text-left')}>
                            {getLocalizedName(operatingHour.clinic?.name_en, operatingHour.clinic?.name_ar, locale) || t('n_a')}
                        </p>
                    </div>
                    <Link href={`/dashboard/clinics-operating-hours/${operatingHour.id}/edit`}>
                        <Button className={cn("flex items-center gap-2", flexDirection)}>
                            <Edit className={cn("h-4 w-4", iconMargin('md'))} />
                            {t('edit')}
                        </Button>
                    </Link>
                </div>

                <div className="grid gap-6 md:grid-cols-2">
                    {/* Clinic Information */}
                    <div className={cn("space-y-4", isRTL ? '!text-right' : '!text-left')}>
                        <h3 className={cn("text-lg font-semibold flex items-center gap-2", flexDirection)}>
                            <Building2 className="h-5 w-5" />
                            {t('clinic_information')}
                        </h3>
                        <div className={cn("space-y-2", isRTL ? '!text-right' : '!text-left')}>
                            <div className={cn(isRTL ? '!text-right' : '!text-left')}>
                                <p className={cn("text-sm text-muted-foreground", isRTL ? '!text-right' : '!text-left')}>{t('clinic')}</p>
                                <p className={cn("font-medium", isRTL ? '!text-right' : '!text-left')}>
                                    {getLocalizedName(operatingHour.clinic?.name_en, operatingHour.clinic?.name_ar, locale) || t('n_a')}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Operating Hours Information */}
                    <div className={cn("space-y-4", isRTL ? '!text-right' : '!text-left')}>
                        <h3 className={cn("text-lg font-semibold flex items-center gap-2", flexDirection)}>
                            <Clock className="h-5 w-5" />
                            {t('operating_hours')}
                        </h3>
                        <div className={cn("space-y-2", isRTL ? '!text-right' : '!text-left')}>
                            <div className={cn(isRTL ? '!text-right' : '!text-left')}>
                                <p className={cn("text-sm text-muted-foreground", isRTL ? '!text-right' : '!text-left')}>{t('day_of_week')}</p>
                                <p className={cn("font-medium", isRTL ? '!text-right' : '!text-left')}>{t(operatingHour.day_of_week)}</p>
                            </div>
                            <div className={cn(isRTL ? '!text-right' : '!text-left')}>
                                <p className={cn("text-sm text-muted-foreground", isRTL ? '!text-right' : '!text-left')}>{t('status')}</p>
                                <Badge variant={operatingHour.is_closed ? 'destructive' : 'default'} className={cn(isRTL ? '!text-right' : '!text-left')}>
                                    {operatingHour.is_closed ? t('closed') : t('open')}
                                </Badge>
                            </div>
                            {!operatingHour.is_closed && (
                                <>
                                    <div className={cn(isRTL ? '!text-right' : '!text-left')}>
                                        <p className={cn("text-sm text-muted-foreground", isRTL ? '!text-right' : '!text-left')}>{t('opening_time')}</p>
                                        <p className={cn("font-medium", isRTL ? '!text-right' : '!text-left')}>{operatingHour.opening_time || t('n_a')}</p>
                                    </div>
                                    <div className={cn(isRTL ? '!text-right' : '!text-left')}>
                                        <p className={cn("text-sm text-muted-foreground", isRTL ? '!text-right' : '!text-left')}>{t('closing_time')}</p>
                                        <p className={cn("font-medium", isRTL ? '!text-right' : '!text-left')}>{operatingHour.closing_time || t('n_a')}</p>
                                    </div>
                                    {operatingHour.break_start && operatingHour.break_end && (
                                        <>
                                            <div className={cn(isRTL ? '!text-right' : '!text-left')}>
                                                <p className={cn("text-sm text-muted-foreground", isRTL ? '!text-right' : '!text-left')}>{t('break_start')}</p>
                                                <p className={cn("font-medium", isRTL ? '!text-right' : '!text-left')}>{operatingHour.break_start}</p>
                                            </div>
                                            <div className={cn(isRTL ? '!text-right' : '!text-left')}>
                                                <p className={cn("text-sm text-muted-foreground", isRTL ? '!text-right' : '!text-left')}>{t('break_end')}</p>
                                                <p className={cn("font-medium", isRTL ? '!text-right' : '!text-left')}>{operatingHour.break_end}</p>
                                            </div>
                                        </>
                                    )}
                                </>
                            )}
                        </div>
                    </div>

                    {/* Dates */}
                    <div className={cn("space-y-4", isRTL ? '!text-right' : '!text-left')}>
                        <h3 className={cn("text-lg font-semibold flex items-center gap-2", flexDirection)}>
                            <Calendar className="h-5 w-5" />
                            {t('dates')}
                        </h3>
                        <div className={cn("space-y-2", isRTL ? '!text-right' : '!text-left')}>
                            <div className={cn(isRTL ? '!text-right' : '!text-left')}>
                                <p className={cn("text-sm text-muted-foreground", isRTL ? '!text-right' : '!text-left')}>{t('created_at')}</p>
                                <p className={cn("font-medium", isRTL ? '!text-right' : '!text-left')}>{formatHumanDate(operatingHour.created_at)}</p>
                            </div>
                            <div className={cn(isRTL ? '!text-right' : '!text-left')}>
                                <p className={cn("text-sm text-muted-foreground", isRTL ? '!text-right' : '!text-left')}>{t('updated_at')}</p>
                                <p className={cn("font-medium", isRTL ? '!text-right' : '!text-left')}>{formatHumanDate(operatingHour.updated_at)}</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}

