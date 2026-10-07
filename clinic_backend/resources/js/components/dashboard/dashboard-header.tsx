import { Button } from '@/components/ui/button';
import { useTranslation } from '@/hooks/use-translation';
import { useRTL } from '@/hooks/use-rtl';
import { usePermissions } from '@/hooks/use-permissions';
import { Link } from '@inertiajs/react';
import { UserPlus, UserCheck } from 'lucide-react';

interface DashboardHeaderProps {
    pendingVendors?: number;
    todayRegistrations?: number;
}

export function DashboardHeader({ pendingVendors, todayRegistrations }: DashboardHeaderProps) {
    const { t, locale } = useTranslation();
    const { isRTL } = useRTL();
    const { can } = usePermissions();

    return (
        <div className={`flex items-center justify-between gap-4 ${isRTL ? 'flex-row-reverse' : ''}`}>
            <div className="flex-1">
                <h1 className="text-3xl font-bold text-foreground dark:text-slate-100">
                    {t('dashboard_overview')}
                </h1>
                <p className="text-muted-foreground dark:text-slate-300 mt-1">
                    {t('welcome_back')} {t('heres_whats_happening')}
                </p>
            </div>
            <div className={`flex items-center gap-3 flex-shrink-0 ${isRTL ? 'flex-row-reverse' : ''}`}>
                {can('dashboard.new-registrations') && can('users.view') && todayRegistrations !== undefined && (
                    <Link href="/dashboard/users">
                        <Button 
                            variant="outline" 
                            size="sm" 
                            className="border-primary/20 text-primary hover:bg-primary/10"
                        >
                            <UserPlus className={`h-4 w-4 ${isRTL ? 'ml-2' : 'mr-2'}`} />
                            {t('new_registrations')} ({todayRegistrations})
                        </Button>
                    </Link>
                )}
                {can('dashboard.new-registrations') && can('vendors.view') && pendingVendors !== undefined && pendingVendors > 0 && (
                    <Link href="/dashboard/clinics?status=pending">
                        <Button 
                            size="sm" 
                            className="bg-primary-gradient hover:opacity-90 text-white border-0"
                        >
                            <UserCheck className={`h-4 w-4 ${isRTL ? 'ml-2' : 'mr-2'}`} />
                            {t('pending_approvals')} ({pendingVendors})
                        </Button>
                    </Link>
                )}
            </div>
        </div>
    );
}

