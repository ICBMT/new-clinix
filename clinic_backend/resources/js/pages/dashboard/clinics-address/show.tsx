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
import { ArrowLeft, Edit, MapPin, Building2, Phone, Mail, User } from 'lucide-react';
import { type SharedData } from '@/types';

interface ShowClinicAddressProps {
    clinic: {
        id: number;
        name_en: string;
        name_ar: string;
        address?: string;
        block?: string;
        street?: string;
        avenue?: string;
        house?: string;
        floor?: string;
        apt?: string;
        city?: string;
        state?: string;
        country?: string;
        postal_code?: string;
        latitude?: string;
        longitude?: string;
        phone?: string;
        email?: string;
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
        owner?: {
            id: number;
            name: string;
            email: string;
            phone?: string;
        };
    };
}

export default function ShowClinicAddress({ clinic }: ShowClinicAddressProps) {
    useRTLInit();
    const { t, locale } = useTranslation();
    const page = usePage<SharedData>();
    const { locale: pageLocale } = page.props;
    const isRTL = pageLocale === 'ar';
    const dir = isRTL ? 'rtl' : 'ltr';
    const { flexDirection, iconMargin } = useRTL();
    
    if (!clinic) {
        return (
            <AppLayout breadcrumbs={[]}>
                <div className={cn("flex h-full flex-1 flex-col gap-6 overflow-x-auto rounded-xl bg-card dark:bg-card p-6 border border-border", isRTL ? '!text-right' : '!text-left')} dir={dir}>
                    <div className={cn("text-center py-8", isRTL ? '!text-right' : '!text-left')}>
                        <p className={cn("text-muted-foreground", isRTL ? '!text-right' : '!text-left')}>{t('clinic_not_found')}</p>
                    </div>
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
            title: t('clinics_address_management'),
            href: '/dashboard/clinics-address',
        },
        {
            title: getLocalizedName(clinic?.name_en, clinic?.name_ar, locale) || t('view_clinic_address'),
            href: '#',
        },
    ];

    const formatAddress = () => {
        if (!clinic) return t('n_a');
        const parts = [];
        if (clinic.block) parts.push(`${t('block')} ${clinic.block}`);
        if (clinic.street) parts.push(`${t('street')} ${clinic.street}`);
        if (clinic.avenue) parts.push(`${t('avenue')} ${clinic.avenue}`);
        if (clinic.house) parts.push(`${t('house')} ${clinic.house}`);
        if (clinic.floor) parts.push(`${t('floor')} ${clinic.floor}`);
        if (clinic.apt) parts.push(`${t('apt')} ${clinic.apt}`);
        if (clinic.city) parts.push(clinic.city);
        if (clinic.state) parts.push(clinic.state);
        if (clinic.country) parts.push(clinic.country);
        if (clinic.postal_code) parts.push(clinic.postal_code);
        return parts.length > 0 ? parts.join(', ') : clinic.address || t('n_a');
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`${t('clinic_address')} - ${getLocalizedName(clinic?.name_en, clinic?.name_ar, locale)}`} />

            <div className={cn("flex h-full flex-1 flex-col gap-6 overflow-x-auto rounded-xl bg-card dark:bg-card p-6 border border-border", isRTL ? '!text-right' : '!text-left')} dir={dir}>
                {/* Header */}
                <div className={cn("border-b pb-4 space-y-4", isRTL ? '!text-right' : '!text-left')}>
                    <div className={cn("flex items-center gap-4", flexDirection)}>
                        <Link href="/dashboard/clinics-address">
                            <Button variant="ghost" size="icon">
                                <ArrowLeft className={cn("h-4 w-4", isRTL && 'rotate-180')} />
                            </Button>
                        </Link>
                        <div className={cn(isRTL ? '!text-right' : '!text-left')}>
                            <h1 className={cn("text-3xl font-bold text-foreground", isRTL ? '!text-right' : '!text-left')}>
                                {getLocalizedName(clinic?.name_en, clinic?.name_ar, locale)}
                            </h1>
                            <p className={cn("text-muted-foreground mt-1", isRTL ? '!text-right' : '!text-left')}>{t('clinic_address_details')}</p>
                        </div>
                    </div>
                    <Link href={`/dashboard/clinics-address/${clinic?.id}/edit`}>
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
                                <p className={cn("text-sm text-muted-foreground", isRTL ? '!text-right' : '!text-left')}>{t('clinic_name')}</p>
                                <p className={cn("font-medium", isRTL ? '!text-right' : '!text-left')}>
                                    {getLocalizedName(clinic?.name_en, clinic?.name_ar, locale) || t('n_a')}
                                </p>
                            </div>
                            {clinic?.phone && (
                                <div className={cn(isRTL ? '!text-right' : '!text-left')}>
                                    <p className={cn("text-sm text-muted-foreground", isRTL ? '!text-right' : '!text-left')}>{t('phone')}</p>
                                    <p className={cn("font-medium", isRTL ? '!text-right' : '!text-left')}>{clinic.phone}</p>
                                </div>
                            )}
                            {clinic?.email && (
                                <div className={cn(isRTL ? '!text-right' : '!text-left')}>
                                    <p className={cn("text-sm text-muted-foreground", isRTL ? '!text-right' : '!text-left')}>{t('email')}</p>
                                    <p className={cn("font-medium", isRTL ? '!text-right' : '!text-left')}>{clinic.email}</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Address Information */}
                    <div className={cn("space-y-4", isRTL ? '!text-right' : '!text-left')}>
                        <h3 className={cn("text-lg font-semibold flex items-center gap-2", flexDirection)}>
                            <MapPin className="h-5 w-5" />
                            {t('address_information')}
                        </h3>
                        <div className={cn("space-y-2", isRTL ? '!text-right' : '!text-left')}>
                            <div className={cn(isRTL ? '!text-right' : '!text-left')}>
                                <p className={cn("text-sm text-muted-foreground", isRTL ? '!text-right' : '!text-left')}>{t('full_address')}</p>
                                <p className={cn("font-medium", isRTL ? '!text-right' : '!text-left')} dir={dir}>{formatAddress()}</p>
                            </div>
                            {clinic?.governorate && (
                                <div className={cn(isRTL ? '!text-right' : '!text-left')}>
                                    <p className={cn("text-sm text-muted-foreground", isRTL ? '!text-right' : '!text-left')}>{t('governorate')}</p>
                                    <p className={cn("font-medium", isRTL ? '!text-right' : '!text-left')}>
                                        {getLocalizedName(clinic.governorate?.name_en, clinic.governorate?.name_ar, locale) || t('n_a')}
                                    </p>
                                </div>
                            )}
                            {clinic?.area && (
                                <div className={cn(isRTL ? '!text-right' : '!text-left')}>
                                    <p className={cn("text-sm text-muted-foreground", isRTL ? '!text-right' : '!text-left')}>{t('area')}</p>
                                    <p className={cn("font-medium", isRTL ? '!text-right' : '!text-left')}>
                                        {getLocalizedName(clinic.area?.name_en, clinic.area?.name_ar, locale) || t('n_a')}
                                    </p>
                                </div>
                            )}
                            {clinic?.latitude && clinic?.longitude && (
                                <div className={cn(isRTL ? '!text-right' : '!text-left')}>
                                    <p className={cn("text-sm text-muted-foreground", isRTL ? '!text-right' : '!text-left')}>{t('coordinates')}</p>
                                    <p className={cn("font-medium", isRTL ? '!text-right' : '!text-left')}>{clinic.latitude}, {clinic.longitude}</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Owner Information */}
                    {clinic?.owner && (
                        <div className={cn("space-y-4", isRTL ? '!text-right' : '!text-left')}>
                            <h3 className={cn("text-lg font-semibold flex items-center gap-2", flexDirection)}>
                                <User className="h-5 w-5" />
                                {t('owner_information')}
                            </h3>
                            <div className={cn("space-y-2", isRTL ? '!text-right' : '!text-left')}>
                                <div className={cn(isRTL ? '!text-right' : '!text-left')}>
                                    <p className={cn("text-sm text-muted-foreground", isRTL ? '!text-right' : '!text-left')}>{t('name')}</p>
                                    <p className={cn("font-medium", isRTL ? '!text-right' : '!text-left')}>{clinic.owner.name || t('n_a')}</p>
                                </div>
                                {clinic.owner.email && (
                                    <div className={cn(isRTL ? '!text-right' : '!text-left')}>
                                        <p className={cn("text-sm text-muted-foreground", isRTL ? '!text-right' : '!text-left')}>{t('email')}</p>
                                        <p className={cn("font-medium", isRTL ? '!text-right' : '!text-left')}>{clinic.owner.email}</p>
                                    </div>
                                )}
                                {clinic.owner.phone && (
                                    <div className={cn(isRTL ? '!text-right' : '!text-left')}>
                                        <p className={cn("text-sm text-muted-foreground", isRTL ? '!text-right' : '!text-left')}>{t('phone')}</p>
                                        <p className={cn("font-medium", isRTL ? '!text-right' : '!text-left')}>{clinic.owner.phone}</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </AppLayout>
    );
}

