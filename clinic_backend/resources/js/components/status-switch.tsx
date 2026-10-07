import { CustomSwitch } from '@/components/ui/custom-switch';
import { ActiveStatusBadge } from '@/components/ui/status-badges';
import { Loader2 } from 'lucide-react';
import { useState } from 'react';
import { customToast } from '@/components/ui/custom-toast';
import { router } from '@inertiajs/react';
import { useTranslation } from '@/hooks/use-translation';

interface StatusSwitchProps {
    id: number;
    status: 'active' | 'inactive';
    entityType: 'user' | 'vendor' | 'admin';
    onSuccess?: () => void;
    onError?: () => void;
    className?: string;
}

export function StatusSwitch({ 
    id, 
    status, 
    entityType, 
    onSuccess, 
    onError,
    className = ''
}: StatusSwitchProps) {
    const { t } = useTranslation();
    const [isLoading, setIsLoading] = useState(false);

    const handleToggle = (newCheckedState: boolean) => {
        const newStatus = newCheckedState ? 'active' : 'inactive';
        
        if (status === newStatus) {
            return;
        }
        
        setIsLoading(true);
        
        const endpoint = `/dashboard/${entityType}s/${id}/toggle-status`;
        
        router.patch(endpoint, { status: newStatus }, {
            onSuccess: () => {
                const message = newStatus === 'active' 
                    ? t(`${entityType}_activated_successfully`) 
                    : t(`${entityType}_deactivated_successfully`);
                
                customToast.success(message);
                
                onSuccess?.();
                setIsLoading(false);
            },
            onError: () => {
                customToast.error(t('status_update_failed'), t('update_failed'));
                
                onError?.();
                setIsLoading(false);
            },
        });
    };

    return (
        <div className={`flex items-center gap-3 ${className}`}>
            <div className="relative">
                <CustomSwitch
                    checked={status === 'active'}
                    onCheckedChange={handleToggle}
                    disabled={isLoading}
                    size="md"
                    showIcons={true}
                />
                {isLoading && (
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                        <Loader2 className="h-3 w-3 animate-spin text-primary" />
                    </div>
                )}
            </div>
            <ActiveStatusBadge status={status} />
        </div>
    );
}
