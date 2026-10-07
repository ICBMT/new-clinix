import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useTranslation } from '@/hooks/use-translation';
import { AlertCircle, CheckCircle, Trash2, XCircle } from 'lucide-react';

interface ConfirmationDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onConfirm: () => void;
    title: string;
    description: string;
    variant?: 'danger' | 'warning' | 'success' | 'info';
    confirmText?: string;
    cancelText?: string;
    children?: React.ReactNode;
}

export function ConfirmationDialog({
    open,
    onOpenChange,
    onConfirm,
    title,
    description,
    variant = 'danger',
    confirmText,
    cancelText,
    children,
}: ConfirmationDialogProps) {
    const { t } = useTranslation();

    const handleConfirm = () => {
        onConfirm();
        onOpenChange(false);
    };

    const icons = {
        danger: <Trash2 className="h-6 w-6 text-red-600" />,
        warning: <AlertCircle className="h-6 w-6 text-orange-600" />,
        success: <CheckCircle className="h-6 w-6 text-green-600" />,
        info: <AlertCircle className="h-6 w-6 text-blue-600" />,
    };

    const colors = {
        danger: 'bg-red-50 border-red-200',
        warning: 'bg-orange-50 border-orange-200',
        success: 'bg-green-50 border-green-200',
        info: 'bg-blue-50 border-blue-200',
    };

    const buttonColors = {
        danger: 'bg-red-600 hover:bg-red-700 focus:ring-red-500',
        warning: 'bg-orange-600 hover:bg-orange-700 focus:ring-orange-500',
        success: 'bg-green-600 hover:bg-green-700 focus:ring-green-500',
        info: 'bg-blue-600 hover:bg-blue-700 focus:ring-blue-500',
    };

    return (
        <AlertDialog open={open} onOpenChange={onOpenChange}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <div className="flex items-center space-x-3">
                        <div className={`flex h-12 w-12 items-center justify-center rounded-full ${colors[variant]}`}>
                            {icons[variant]}
                        </div>
                        <AlertDialogTitle className="text-xl">{title}</AlertDialogTitle>
                    </div>
                    <AlertDialogDescription className="text-base pt-2">
                        {description}
                    </AlertDialogDescription>
                    {children}
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel>{cancelText || t('cancel')}</AlertDialogCancel>
                    <AlertDialogAction
                        onClick={handleConfirm}
                        className={buttonColors[variant]}
                    >
                        {confirmText || t('confirm')}
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}

