import { CustomSwitch } from '@/components/ui/custom-switch';
import { Loader2 } from 'lucide-react';
import { useState } from 'react';
import { customToast } from '@/components/ui/custom-toast';
import { router } from '@inertiajs/react';
import { useTranslation } from '@/hooks/use-translation';
import { CheckCircle, XCircle } from 'lucide-react';

interface VerificationSwitchProps {
    id: number;
    type: 'email' | 'phone';
    isVerified: boolean;
    entityType: 'user' | 'vendor';
    onSuccess?: () => void;
    onError?: () => void;
    className?: string;
}

export function VerificationSwitch({ 
    id, 
    type, 
    isVerified, 
    entityType, 
    onSuccess, 
    onError,
    className = ''
}: VerificationSwitchProps) {
    const { t } = useTranslation();
    const [isLoading, setIsLoading] = useState(false);

    const handleToggle = (newCheckedState: boolean) => {
        if (isVerified === newCheckedState) {
            return;
        }
        
        setIsLoading(true);
        
        const endpoint = `/dashboard/${entityType}s/${id}/toggle-${type}-verification`;
        
        router.patch(endpoint, { verified: newCheckedState }, {
            onSuccess: () => {
                const newStatus = newCheckedState ? 'verified' : 'unverified';
                const message = newStatus === 'verified' 
                    ? t(`${type}_verified_successfully`) 
                    : t(`${type}_unverified_successfully`);
                
                customToast.success(message);
                
                onSuccess?.();
                setIsLoading(false);
            },
            onError: () => {
                customToast.error(t(`${type}_verification_failed`), t('update_failed'));
                
                onError?.();
                setIsLoading(false);
            },
        });
    };

    return (
        <div className={`relative ${className}`}>
            <CustomSwitch
                checked={isVerified}
                onCheckedChange={handleToggle}
                disabled={isLoading}
                size="md"
                showIcons={true}
                className="relative"
            />
            {isLoading && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <Loader2 className="h-3 w-3 animate-spin text-primary" />
                </div>
            )}
        </div>
    );
}

