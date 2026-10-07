import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Mail, Phone, Building2 } from 'lucide-react';
import { useRTL } from '@/hooks/use-rtl';
import { useTranslation } from '@/hooks/use-translation';
import { usePage } from '@inertiajs/react';
import { type SharedData } from '@/types';
import { getLocalizedCompanyName } from '@/utils/localization';
import { cn } from '@/lib/utils';

interface ClinicCardProps {
    clinic: {
        id: number;
        company_name_en: string;
        company_name_ar: string;
        email?: string;
        phone?: string;
        logo?: string | null;
    };
    locale?: string;
    variant?: 'default' | 'card' | 'compact';
    className?: string;
}

export function ClinicCard({ 
    clinic, 
    locale,
    variant = 'default',
    className = '' 
}: ClinicCardProps) {
    const { t } = useTranslation();
    const page = usePage<SharedData>();
    const pageLocale = locale || page.props.locale;
    const isRTL = pageLocale === 'ar';
    const dir = isRTL ? 'rtl' : 'ltr';
    const { flexDirection, iconMargin } = useRTL();
    const textAlignClass = isRTL ? '!text-right' : '!text-left';

    const clinicName = getLocalizedCompanyName(clinic.company_name_en, clinic.company_name_ar, pageLocale);
    
    const getInitials = (name: string) => {
        return name
            .split(' ')
            .map(n => n[0])
            .join('')
            .toUpperCase()
            .slice(0, 2);
    };

    // Card variant
    if (variant === 'card') {
        return (
            <div className={cn("bg-gray-50 dark:bg-gray-800/50 rounded-lg p-4 border border-gray-200 dark:border-gray-700", className)} dir={dir}>
                <div className={cn("flex items-center gap-4", flexDirection)}>
                    {/* Logo/Avatar */}
                    <Avatar className="h-12 w-12 flex-shrink-0">
                        {clinic.logo ? (
                            <AvatarImage 
                                src={clinic.logo} 
                                alt={clinicName}
                                onError={(e) => {
                                    (e.target as HTMLImageElement).style.display = 'none';
                                }}
                            />
                        ) : null}
                        <AvatarFallback className="bg-purple-500 text-white font-semibold text-lg">
                            {clinicName.charAt(0).toUpperCase()}
                        </AvatarFallback>
                    </Avatar>

                    {/* Clinic Info */}
                    <div className={cn("flex flex-col gap-1 flex-1 min-w-0", textAlignClass)}>
                        {/* Name */}
                        <div className={cn("font-semibold text-base text-foreground", textAlignClass)} dir={dir}>
                            {clinicName}
                        </div>

                        {/* Email */}
                        {clinic.email ? (
                            <div className={cn("flex items-center gap-2 text-sm text-muted-foreground", flexDirection)}>
                                <Mail className={cn("h-4 w-4 flex-shrink-0 text-gray-500 dark:text-gray-400", iconMargin('sm'))} />
                                <span className={cn("truncate", textAlignClass)}>{clinic.email}</span>
                            </div>
                        ) : (
                            <div className={cn("flex items-center gap-2 text-sm text-muted-foreground", flexDirection)}>
                                <span className={cn("truncate", textAlignClass)}>{t('n_a')}</span>
                            </div>
                        )}

                        {/* Phone */}
                        {clinic.phone ? (
                            <div className={cn("flex items-center gap-2 text-sm text-muted-foreground", flexDirection)}>
                                <Phone className={cn("h-4 w-4 flex-shrink-0 text-gray-500 dark:text-gray-400", iconMargin('sm'))} />
                                <span className={cn("truncate font-mono", textAlignClass)} dir="ltr">{clinic.phone}</span>
                            </div>
                        ) : (
                            <div className={cn("flex items-center gap-2 text-sm text-muted-foreground", flexDirection)}>
                                <span className={cn("truncate", textAlignClass)}>{t('n_a')}</span>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        );
    }

    // Compact variant
    if (variant === 'compact') {
        return (
            <div className={cn("flex items-center gap-2", className)} dir={dir}>
                <Avatar className="h-8 w-8 flex-shrink-0">
                    {clinic.logo ? (
                        <AvatarImage 
                            src={clinic.logo} 
                            alt={clinicName}
                            onError={(e) => {
                                (e.target as HTMLImageElement).style.display = 'none';
                            }}
                        />
                    ) : null}
                    <AvatarFallback className="bg-purple-500/10 text-purple-600 dark:text-purple-400 font-semibold text-xs">
                        {clinicName.charAt(0).toUpperCase()}
                    </AvatarFallback>
                </Avatar>
                <div className={cn("flex flex-col min-w-0", textAlignClass)}>
                    <div className={cn("font-medium text-sm text-foreground truncate", textAlignClass)} dir={dir}>
                        {clinicName}
                    </div>
                    {clinic.email && (
                        <div className={cn("text-xs text-muted-foreground truncate", textAlignClass)}>
                            {clinic.email}
                        </div>
                    )}
                </div>
            </div>
        );
    }

    // Default variant
    return (
        <div className={cn("flex items-center gap-3", className)} dir={dir}>
            {/* Logo/Avatar */}
            <Avatar className="h-10 w-10 flex-shrink-0">
                {clinic.logo ? (
                    <AvatarImage 
                        src={clinic.logo} 
                        alt={clinicName}
                        onError={(e) => {
                            (e.target as HTMLImageElement).style.display = 'none';
                        }}
                    />
                ) : null}
                <AvatarFallback className="bg-purple-500/10 text-purple-600 dark:text-purple-400 font-semibold">
                    {clinicName.charAt(0).toUpperCase()}
                </AvatarFallback>
            </Avatar>

            {/* Clinic Info */}
            <div className={cn("flex flex-col min-w-0", textAlignClass)}>
                {/* Name */}
                <div className={cn("font-medium text-foreground truncate flex items-center gap-1.5", flexDirection)}>
                    <Building2 className={cn("h-3.5 w-3.5 flex-shrink-0 text-purple-500", iconMargin('sm'))} />
                    <span className={textAlignClass} dir={dir}>{clinicName}</span>
                </div>

                {/* Email */}
                {clinic.email ? (
                    <div className={cn("flex items-center gap-1.5 text-sm text-muted-foreground", flexDirection)}>
                        <Mail className={cn("h-3.5 w-3.5 flex-shrink-0", iconMargin('sm'))} />
                        <span className={cn("truncate", textAlignClass)}>{clinic.email}</span>
                    </div>
                ) : (
                    <div className={cn("flex items-center gap-1.5 text-sm text-muted-foreground", flexDirection)}>
                        <span className={cn("truncate", textAlignClass)}>{t('n_a')}</span>
                    </div>
                )}

                {/* Phone */}
                {clinic.phone ? (
                    <div className={cn("flex items-center gap-1.5 text-sm text-muted-foreground", flexDirection)}>
                        <Phone className={cn("h-3.5 w-3.5 flex-shrink-0", iconMargin('sm'))} />
                        <span className={cn("truncate font-mono", textAlignClass)} dir="ltr">{clinic.phone}</span>
                    </div>
                ) : (
                    <div className={cn("flex items-center gap-1.5 text-sm text-muted-foreground", flexDirection)}>
                        <span className={cn("truncate", textAlignClass)}>{t('n_a')}</span>
                    </div>
                )}
            </div>
        </div>
    );
}

