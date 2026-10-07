import { type BreadcrumbItem } from '@/types';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useRTLInit } from '@/hooks/use-rtl-init';
import { useTranslation } from '@/hooks/use-translation';
import { useRTL } from '@/hooks/use-rtl';
import { getLocalizedName } from '@/utils/localization';
import AppLayout from '@/layouts/app-layout';
import { index as dashboard } from '@/routes/dashboard';
import { Head, Link, usePage } from '@inertiajs/react';
import { ArrowLeft, Edit, Calendar, Building2, Cpu, MapPin, Phone, Mail, Clock, FileText } from 'lucide-react';
import { cn } from '@/lib/utils';
import { type SharedData } from '@/types';

interface OperatingHour {
    id: number;
    day_of_week: string;
    opening_time: string | null;
    closing_time: string | null;
    is_open: boolean;
    closed_all_day: boolean;
}

interface ShowMachineProps {
    machine: {
        id: number;
        model?: string; // Legacy field, use model_en/model_ar instead
        model_en?: string;
        model_ar?: string;
        serial_number?: string;
        manufacturer?: string;
        manufacturer_en?: string;
        manufacturer_ar?: string;
        image?: string;
        description_en?: string;
        description_ar?: string;
        status: 'ready' | 'maintenance' | 'busy';
        created_at: string;
        updated_at: string;
        clinic?: {
            id: number;
            name_en: string;
            name_ar: string;
            phone?: string;
            email?: string;
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
            area?: {
                id: number;
                name_en: string;
                name_ar: string;
            } | null;
            governorate?: {
                id: number;
                name_en: string;
                name_ar: string;
            } | null;
            operatingHours?: OperatingHour[];
        } | null;
    };
}

const DAYS_OF_WEEK = [
    { value: 'monday', labelKey: 'monday' },
    { value: 'tuesday', labelKey: 'tuesday' },
    { value: 'wednesday', labelKey: 'wednesday' },
    { value: 'thursday', labelKey: 'thursday' },
    { value: 'friday', labelKey: 'friday' },
    { value: 'saturday', labelKey: 'saturday' },
    { value: 'sunday', labelKey: 'sunday' },
];

export default function ShowMachine({ machine }: ShowMachineProps) {
    useRTLInit();
    const { t, locale } = useTranslation();
    const page = usePage<SharedData>();
    const { locale: pageLocale } = page.props;
    const isRTL = pageLocale === 'ar';
    const dir = isRTL ? 'rtl' : 'ltr';
    const { flexDirection, iconMargin, textAlign } = useRTL();
    
    const breadcrumbs: BreadcrumbItem[] = [
        {
            title: t('dashboard'),
            href: dashboard.url(),
        },
        {
            title: t('machines_management'),
            href: '/dashboard/machines',
        },
        {
            title: t('view_machine') || t('machine_details'),
            href: '#',
        },
    ];

    const formatDate = (date: string) => {
        return new Date(date).toLocaleDateString(locale === 'ar' ? 'ar-SA' : 'en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`${t('machine_details')} - ${getLocalizedName(machine.model_en, machine.model_ar, locale) || machine.model || ''}`} />

            <div className={cn("flex h-full flex-1 flex-col gap-6 overflow-x-auto rounded-xl bg-card dark:bg-card p-6 border border-border", isRTL ? '!text-right' : '!text-left')} dir={dir}>
                {/* Header */}
                <div className={cn("flex items-center justify-between border-b pb-4", flexDirection)}>
                    <div className={cn(isRTL ? '!text-right' : '!text-left')}>
                        <div className={cn("flex items-center gap-3", flexDirection)}>
                            <h1 className={cn("text-3xl font-bold text-foreground", isRTL ? '!text-right' : '!text-left')}>{t('machine_details')}</h1>
                            <Badge 
                                variant={
                                    machine.status === 'ready' ? 'default' : 
                                    machine.status === 'maintenance' ? 'secondary' : 'destructive'
                                }
                                className={cn(
                                    "text-base px-4 py-1",
                                    machine.status === 'ready' ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 border-green-200 dark:border-green-800' :
                                    machine.status === 'maintenance' ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300 border-yellow-200 dark:border-yellow-800' :
                                    'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300 border-red-200 dark:border-red-800',
                                    isRTL ? '!text-right' : '!text-left'
                                )}
                            >
                                {t(machine.status)}
                            </Badge>
                        </div>
                        <p className={cn("text-muted-foreground mt-1", isRTL ? '!text-right' : '!text-left')}>{t('view_machine_information')}</p>
                    </div>
                    
                    <div className={cn("flex items-center gap-3", flexDirection)}>
                        <Link href={`/dashboard/machines/${machine.id}/edit`}>
                            <Button 
                                className={cn("flex items-center gap-2", flexDirection)}
                                aria-label={t('edit_machine')}
                            >
                                <Edit className={cn("h-4 w-4", iconMargin('md'))} />
                                {t('edit_machine')}
                            </Button>
                        </Link>
                        <Link href="/dashboard/machines">
                            <Button 
                                variant="outline" 
                                className={cn("flex items-center gap-2", flexDirection)}
                                aria-label={t('back')}
                            >
                                <ArrowLeft className={cn("h-4 w-4", isRTL && 'rotate-180')} />
                                {t('back')}
                            </Button>
                        </Link>
                    </div>
                </div>

                {/* Machine Information Tabs */}
                <Tabs defaultValue="details" className="w-full">
                    <TabsList className={cn("grid w-full grid-cols-2", flexDirection)}>
                        <TabsTrigger value="details" className={cn(isRTL ? '!text-right' : '!text-left')}>
                            {t('details')}
                        </TabsTrigger>
                        <TabsTrigger value="related" className={cn(isRTL ? '!text-right' : '!text-left')}>
                            {t('related_information')}
                        </TabsTrigger>
                    </TabsList>

                    {/* Tab 1: Machine Details */}
                    <TabsContent value="details" className={cn("mt-6", isRTL ? '!text-right' : '!text-left')} dir={dir}>
                        <div className={cn("space-y-6", isRTL ? '!text-right' : '!text-left')} dir={dir}>
                            <div className={cn("flex items-center gap-3 mb-6", flexDirection)}>
                                <Cpu className="h-6 w-6 text-primary" />
                                <h2 className={cn("text-2xl font-semibold text-foreground", isRTL ? '!text-right' : '!text-left')}>
                                    {t('machine_information')}
                                </h2>
                            </div>

                            {/* Machine Image */}
                            {machine.image && (
                                <div className={cn("flex items-start gap-6 mb-6", flexDirection)}>
                                    <img 
                                        src={machine.image} 
                                        alt={getLocalizedName(machine.model_en, machine.model_ar, locale) || machine.model || ''}
                                        className="w-32 h-32 rounded-lg object-cover"
                                    />
                                    <div className={cn("flex-1", isRTL ? '!text-right' : '!text-left')}>
                                        <h3 className={cn("text-xl font-bold", isRTL ? '!text-right' : '!text-left')} dir={dir}>
                                            {getLocalizedName(machine.model_en, machine.model_ar, locale) || machine.model || ''}
                                        </h3>
                                        {(machine.manufacturer_en || machine.manufacturer_ar || machine.manufacturer) && (
                                            <p className={cn("text-base text-muted-foreground mt-1", isRTL ? '!text-right' : '!text-left')} dir={dir}>
                                                {getLocalizedName(machine.manufacturer_en, machine.manufacturer_ar, locale) || machine.manufacturer || ''}
                                            </p>
                                        )}
                                    </div>
                                </div>
                            )}

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {machine.model_en && (
                                    <div className={cn("space-y-2", isRTL ? '!text-right' : '!text-left')} dir={dir}>
                                        <p className={cn("text-sm text-muted-foreground", isRTL ? '!text-right' : '!text-left')}>{t('model_en')}</p>
                                        <p className={cn("text-base font-medium text-foreground", isRTL ? '!text-right' : '!text-left')} dir="ltr">{machine.model_en}</p>
                                    </div>
                                )}
                                {machine.model_ar && (
                                    <div className={cn("space-y-2", isRTL ? '!text-right' : '!text-left')} dir={dir}>
                                        <p className={cn("text-sm text-muted-foreground", isRTL ? '!text-right' : '!text-left')}>{t('model_ar')}</p>
                                        <p className={cn("text-base font-medium text-foreground", isRTL ? '!text-right' : '!text-left')} dir="rtl">{machine.model_ar}</p>
                                    </div>
                                )}

                                {machine.serial_number && (
                                    <div className={cn("space-y-2", isRTL ? '!text-right' : '!text-left')} dir={dir}>
                                        <p className={cn("text-sm text-muted-foreground flex items-center gap-2", flexDirection)}>
                                            <Cpu className={cn("h-4 w-4", iconMargin('md'))} />
                                            {t('serial_number')}
                                        </p>
                                        <p className={cn("text-base font-medium font-mono text-foreground", isRTL ? '!text-right' : '!text-left')} dir="ltr">{machine.serial_number}</p>
                                    </div>
                                )}

                                {machine.manufacturer_en && (
                                    <div className={cn("space-y-2", isRTL ? '!text-right' : '!text-left')} dir={dir}>
                                        <p className={cn("text-sm text-muted-foreground", isRTL ? '!text-right' : '!text-left')}>{t('manufacturer_en')}</p>
                                        <p className={cn("text-base font-medium text-foreground", isRTL ? '!text-right' : '!text-left')} dir="ltr">{machine.manufacturer_en}</p>
                                    </div>
                                )}
                                {machine.manufacturer_ar && (
                                    <div className={cn("space-y-2", isRTL ? '!text-right' : '!text-left')} dir={dir}>
                                        <p className={cn("text-sm text-muted-foreground", isRTL ? '!text-right' : '!text-left')}>{t('manufacturer_ar')}</p>
                                        <p className={cn("text-base font-medium text-foreground", isRTL ? '!text-right' : '!text-left')} dir="rtl">{machine.manufacturer_ar}</p>
                                    </div>
                                )}

                                <div className={cn("space-y-2", isRTL ? '!text-right' : '!text-left')} dir={dir}>
                                    <p className={cn("text-sm text-muted-foreground flex items-center gap-2", flexDirection)}>
                                        <Calendar className={cn("h-4 w-4", iconMargin('md'))} />
                                        {t('created_at')}
                                    </p>
                                    <p className={cn("text-base font-medium text-foreground", isRTL ? '!text-right' : '!text-left')} dir={dir}>{formatDate(machine.created_at)}</p>
                                </div>

                                <div className={cn("space-y-2", isRTL ? '!text-right' : '!text-left')} dir={dir}>
                                    <p className={cn("text-sm text-muted-foreground flex items-center gap-2", flexDirection)}>
                                        <Clock className={cn("h-4 w-4", iconMargin('md'))} />
                                        {t('updated_at')}
                                    </p>
                                    <p className={cn("text-base font-medium text-foreground", isRTL ? '!text-right' : '!text-left')} dir={dir}>{formatDate(machine.updated_at)}</p>
                                </div>
                            </div>

                            {machine.description_en && (
                                <div className={cn("space-y-2 pt-4 border-t", isRTL ? '!text-right' : '!text-left')} dir={dir}>
                                    <p className={cn("text-sm text-muted-foreground", isRTL ? '!text-right' : '!text-left')}>{t('description_en')}</p>
                                    <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
                                        <p className={cn("text-base text-foreground whitespace-pre-wrap", isRTL ? '!text-right' : '!text-left')} dir="ltr">{machine.description_en}</p>
                                    </div>
                                </div>
                            )}

                            {machine.description_ar && (
                                <div className={cn("space-y-2 pt-4 border-t", isRTL ? '!text-right' : '!text-left')} dir={dir}>
                                    <p className={cn("text-sm text-muted-foreground", isRTL ? '!text-right' : '!text-left')}>{t('description_ar')}</p>
                                    <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
                                        <p className={cn("text-base text-foreground whitespace-pre-wrap", isRTL ? '!text-right' : '!text-left')} dir="rtl">{machine.description_ar}</p>
                                    </div>
                                </div>
                            )}
                        </div>
                    </TabsContent>

                    {/* Tab 2: Related Information */}
                    <TabsContent value="related" className={cn("mt-6", isRTL ? '!text-right' : '!text-left')} dir={dir}>
                        <div className={cn("space-y-6", isRTL ? '!text-right' : '!text-left')} dir={dir}>
                            {machine.clinic ? (
                                <>
                                    <div className={cn("flex items-center gap-3 mb-6", flexDirection)}>
                                        <Building2 className="h-6 w-6 text-primary" />
                                        <h2 className={cn("text-2xl font-semibold text-foreground", isRTL ? '!text-right' : '!text-left')}>
                                            {t('clinic_information')}
                                        </h2>
                                    </div>

                                    {/* Clinic Name */}
                                    <div className={cn("space-y-2", isRTL ? '!text-right' : '!text-left')} dir={dir}>
                                        <p className={cn("text-sm text-muted-foreground flex items-center gap-2", flexDirection)}>
                                            <Building2 className={cn("h-4 w-4", iconMargin('md'))} />
                                            {t('clinic')}
                                        </p>
                                        <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
                                            <p className={cn("text-lg font-semibold text-foreground", isRTL ? '!text-right' : '!text-left')} dir={dir}>
                                                {getLocalizedName(machine.clinic.name_en, machine.clinic.name_ar, locale)}
                                            </p>
                                            {locale === 'en' && machine.clinic.name_ar && (
                                                <p className={cn("text-sm text-muted-foreground mt-1", isRTL ? '!text-right' : '!text-left')} dir="rtl">{machine.clinic.name_ar}</p>
                                            )}
                                            {isRTL && machine.clinic.name_en && (
                                                <p className={cn("text-sm text-muted-foreground mt-1", isRTL ? '!text-right' : '!text-left')} dir="ltr">{machine.clinic.name_en}</p>
                                            )}
                                        </div>
                                    </div>

                                    {/* Contact Information */}
                                    {(machine.clinic.phone || machine.clinic.email) && (
                                        <div className={cn("space-y-2", isRTL ? '!text-right' : '!text-left')} dir={dir}>
                                            <p className={cn("text-sm font-medium text-foreground", isRTL ? '!text-right' : '!text-left')}>{t('contact_information')}</p>
                                            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 space-y-3">
                                                {machine.clinic.phone && (
                                                    <div className={cn("flex items-center gap-2", flexDirection)}>
                                                        <Phone className={cn("h-4 w-4 text-muted-foreground", iconMargin('md'))} />
                                                        <a href={`tel:${machine.clinic.phone}`} className={cn("text-base font-medium text-foreground", isRTL ? '!text-right' : '!text-left')} dir={dir}>
                                                            {machine.clinic.phone}
                                                        </a>
                                                    </div>
                                                )}
                                                {machine.clinic.email && (
                                                    <div className={cn("flex items-center gap-2", flexDirection)}>
                                                        <Mail className={cn("h-4 w-4 text-muted-foreground", iconMargin('md'))} />
                                                        <a href={`mailto:${machine.clinic.email}`} className={cn("text-base font-medium text-foreground", isRTL ? '!text-right' : '!text-left')} dir="ltr">
                                                            {machine.clinic.email}
                                                        </a>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    )}

                                    {/* Location Information */}
                                    {(machine.clinic.governorate || machine.clinic.area || machine.clinic.address) && (
                                        <div className={cn("space-y-2", isRTL ? '!text-right' : '!text-left')} dir={dir}>
                                            <p className={cn("text-sm font-medium text-foreground flex items-center gap-2", flexDirection)}>
                                                <MapPin className={cn("h-4 w-4", iconMargin('md'))} />
                                                {t('location_information')}
                                            </p>
                                            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                    {machine.clinic.governorate && (
                                                        <div className={cn("space-y-1", isRTL ? '!text-right' : '!text-left')} dir={dir}>
                                                            <p className={cn("text-sm text-muted-foreground", isRTL ? '!text-right' : '!text-left')}>{t('governorate')}</p>
                                                            <p className={cn("text-base font-medium text-foreground", isRTL ? '!text-right' : '!text-left')} dir={dir}>
                                                                {getLocalizedName(machine.clinic.governorate.name_en, machine.clinic.governorate.name_ar, locale)}
                                                            </p>
                                                        </div>
                                                    )}
                                                    {machine.clinic.area && (
                                                        <div className={cn("space-y-1", isRTL ? '!text-right' : '!text-left')} dir={dir}>
                                                            <p className={cn("text-sm text-muted-foreground", isRTL ? '!text-right' : '!text-left')}>{t('area')}</p>
                                                            <p className={cn("text-base font-medium text-foreground", isRTL ? '!text-right' : '!text-left')} dir={dir}>
                                                                {getLocalizedName(machine.clinic.area.name_en, machine.clinic.area.name_ar, locale)}
                                                            </p>
                                                        </div>
                                                    )}
                                                    {machine.clinic.address && (
                                                        <div className={cn("space-y-1 md:col-span-2", isRTL ? '!text-right' : '!text-left')} dir={dir}>
                                                            <p className={cn("text-sm text-muted-foreground", isRTL ? '!text-right' : '!text-left')}>{t('address')}</p>
                                                            <p className={cn("text-base font-medium text-foreground", isRTL ? '!text-right' : '!text-left')} dir={dir}>{machine.clinic.address}</p>
                                                        </div>
                                                    )}
                                                    {machine.clinic.block && (
                                                        <div className={cn("space-y-1", isRTL ? '!text-right' : '!text-left')} dir={dir}>
                                                            <p className={cn("text-sm text-muted-foreground", isRTL ? '!text-right' : '!text-left')}>{t('block')}</p>
                                                            <p className={cn("text-base font-medium text-foreground", isRTL ? '!text-right' : '!text-left')} dir={dir}>{machine.clinic.block}</p>
                                                        </div>
                                                    )}
                                                    {machine.clinic.street && (
                                                        <div className={cn("space-y-1", isRTL ? '!text-right' : '!text-left')} dir={dir}>
                                                            <p className={cn("text-sm text-muted-foreground", isRTL ? '!text-right' : '!text-left')}>{t('street')}</p>
                                                            <p className={cn("text-base font-medium text-foreground", isRTL ? '!text-right' : '!text-left')} dir={dir}>{machine.clinic.street}</p>
                                                        </div>
                                                    )}
                                                    {machine.clinic.avenue && (
                                                        <div className={cn("space-y-1", isRTL ? '!text-right' : '!text-left')} dir={dir}>
                                                            <p className={cn("text-sm text-muted-foreground", isRTL ? '!text-right' : '!text-left')}>{t('avenue')}</p>
                                                            <p className={cn("text-base font-medium text-foreground", isRTL ? '!text-right' : '!text-left')} dir={dir}>{machine.clinic.avenue}</p>
                                                        </div>
                                                    )}
                                                    {machine.clinic.house && (
                                                        <div className={cn("space-y-1", isRTL ? '!text-right' : '!text-left')} dir={dir}>
                                                            <p className={cn("text-sm text-muted-foreground", isRTL ? '!text-right' : '!text-left')}>{t('house')}</p>
                                                            <p className={cn("text-base font-medium text-foreground", isRTL ? '!text-right' : '!text-left')} dir={dir}>{machine.clinic.house}</p>
                                                        </div>
                                                    )}
                                                    {machine.clinic.floor && (
                                                        <div className={cn("space-y-1", isRTL ? '!text-right' : '!text-left')} dir={dir}>
                                                            <p className={cn("text-sm text-muted-foreground", isRTL ? '!text-right' : '!text-left')}>{t('floor')}</p>
                                                            <p className={cn("text-base font-medium text-foreground", isRTL ? '!text-right' : '!text-left')} dir={dir}>{machine.clinic.floor}</p>
                                                        </div>
                                                    )}
                                                    {machine.clinic.apt && (
                                                        <div className={cn("space-y-1", isRTL ? '!text-right' : '!text-left')} dir={dir}>
                                                            <p className={cn("text-sm text-muted-foreground", isRTL ? '!text-right' : '!text-left')}>{t('apt')}</p>
                                                            <p className={cn("text-base font-medium text-foreground", isRTL ? '!text-right' : '!text-left')} dir={dir}>{machine.clinic.apt}</p>
                                                        </div>
                                                    )}
                                                    {machine.clinic.city && (
                                                        <div className={cn("space-y-1", isRTL ? '!text-right' : '!text-left')} dir={dir}>
                                                            <p className={cn("text-sm text-muted-foreground", isRTL ? '!text-right' : '!text-left')}>{t('city')}</p>
                                                            <p className={cn("text-base font-medium text-foreground", isRTL ? '!text-right' : '!text-left')} dir={dir}>{machine.clinic.city}</p>
                                                        </div>
                                                    )}
                                                    {machine.clinic.postal_code && (
                                                        <div className={cn("space-y-1", isRTL ? '!text-right' : '!text-left')} dir={dir}>
                                                            <p className={cn("text-sm text-muted-foreground", isRTL ? '!text-right' : '!text-left')}>{t('postal_code')}</p>
                                                            <p className={cn("text-base font-medium text-foreground", isRTL ? '!text-right' : '!text-left')} dir={dir}>{machine.clinic.postal_code}</p>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {/* Operating Hours */}
                                    {machine.clinic.operatingHours && machine.clinic.operatingHours.length > 0 && (
                                        <div className={cn("space-y-2", isRTL ? '!text-right' : '!text-left')} dir={dir}>
                                            <p className={cn("text-sm font-medium text-foreground flex items-center gap-2", flexDirection)}>
                                                <Clock className={cn("h-4 w-4", iconMargin('md'))} />
                                                {t('operating_hours')}
                                            </p>
                                            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
                                                <div className="space-y-3">
                                                    {DAYS_OF_WEEK.map((day) => {
                                                        const operatingHour = machine.clinic?.operatingHours?.find(oh => oh.day_of_week === day.value);
                                                        return (
                                                            <div key={day.value} className={cn("flex items-center justify-between pb-3", day.value !== DAYS_OF_WEEK[DAYS_OF_WEEK.length - 1].value ? 'border-b border-border' : '', flexDirection)}>
                                                                <div className={cn("flex-1", isRTL ? '!text-right' : '!text-left')}>
                                                                    <p className={cn("text-sm font-medium text-foreground", isRTL ? '!text-right' : '!text-left')}>{t(day.labelKey)}</p>
                                                                </div>
                                                                <div className={cn("flex items-center gap-2", flexDirection)}>
                                                                    {operatingHour && !operatingHour.closed_all_day && operatingHour.is_open ? (
                                                                        <>
                                                                            <span className={cn("text-sm text-muted-foreground", isRTL ? '!text-right' : '!text-left')}>{t('from')}</span>
                                                                            <span className={cn("text-sm font-medium text-foreground", isRTL ? '!text-right' : '!text-left')} dir="ltr">{operatingHour.opening_time || '—'}</span>
                                                                            <span className={cn("text-sm text-muted-foreground", isRTL ? '!text-right' : '!text-left')}>{t('to')}</span>
                                                                            <span className={cn("text-sm font-medium text-foreground", isRTL ? '!text-right' : '!text-left')} dir="ltr">{operatingHour.closing_time || '—'}</span>
                                                                        </>
                                                                    ) : (
                                                                        <Badge variant="secondary" className={cn("text-xs", isRTL ? '!text-right' : '!text-left')}>{t('closed')}</Badge>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </>
                            ) : (
                                <div className={cn("space-y-2", isRTL ? '!text-right' : '!text-left')} dir={dir}>
                                    <p className={cn("text-sm text-muted-foreground flex items-center gap-2", flexDirection)}>
                                        <Building2 className={cn("h-4 w-4", iconMargin('md'))} />
                                        {t('clinic')}
                                    </p>
                                    <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
                                        <p className={cn("text-muted-foreground", isRTL ? '!text-right' : '!text-left')}>{t('no_clinic_assigned') || t('n_a')}</p>
                                    </div>
                                </div>
                            )}
                        </div>
                    </TabsContent>
                </Tabs>
            </div>
        </AppLayout>
    );
}

