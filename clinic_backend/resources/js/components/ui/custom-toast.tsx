import { toast } from 'sonner';
import { CheckCircle, XCircle, AlertCircle, Info } from 'lucide-react';

export interface CustomToastProps {
    title: string;
    description?: string;
    variant?: 'success' | 'error' | 'warning' | 'info';
    duration?: number;
}

export function showCustomToast({ title, description, variant = 'success', duration = 4000 }: CustomToastProps) {
    const icons = {
        success: <CheckCircle className="h-5 w-5 text-green-500" />,
        error: <XCircle className="h-5 w-5 text-red-500" />,
        warning: <AlertCircle className="h-5 w-5 text-orange-500" />,
        info: <Info className="h-5 w-5 text-blue-500" />,
    };

    const icon = icons[variant];

    if (description) {
        toast[variant](title, {
            description,
            icon,
            duration,
            className: 'bg-white border border-gray-200 shadow-lg',
        });
    } else {
        toast[variant](title, {
            icon,
            duration,
            className: 'bg-white border border-gray-200 shadow-lg',
        });
    }
}

// Convenience functions for common use cases
export const customToast = {
    success: (title: string, description?: string) => 
        showCustomToast({ title, description, variant: 'success' }),
    
    error: (title: string, description?: string) => 
        showCustomToast({ title, description, variant: 'error' }),
    
    warning: (title: string, description?: string) => 
        showCustomToast({ title, description, variant: 'warning' }),
    
    info: (title: string, description?: string) => 
        showCustomToast({ title, description, variant: 'info' }),
};
