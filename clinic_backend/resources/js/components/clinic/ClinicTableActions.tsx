import { Button } from '@/components/ui/button';
import { useRTL } from '@/hooks/use-rtl';
import { useTranslation } from '@/hooks/use-translation';
import { cn } from '@/lib/utils';
import { Eye, Edit, Trash2, type LucideIcon } from 'lucide-react';
import { type ReactNode } from 'react';

interface ActionButton {
    icon: LucideIcon;
    label: string;
    onClick: () => void;
    variant?: 'default' | 'ghost' | 'destructive' | 'outline';
    className?: string;
}

interface ClinicTableActionsProps {
    actions: ActionButton[];
    className?: string;
}

/**
 * Reusable action buttons component for clinic tables
 * Handles RTL alignment and accessibility automatically
 */
export function ClinicTableActions({
    actions,
    className,
}: ClinicTableActionsProps) {
    const { isRTL } = useRTL();
    const { t } = useTranslation();

    return (
        <div className={cn(
            "flex items-center gap-1 w-full",
            isRTL ? 'justify-start flex-row-reverse' : 'justify-end',
            className
        )}>
            {actions.map((action, index) => {
                const Icon = action.icon;
                const isDestructive = action.variant === 'destructive' || action.label.toLowerCase().includes('delete');
                
                return (
                    <Button
                        key={index}
                        variant={action.variant || 'ghost'}
                        size="icon"
                        onClick={action.onClick}
                        title={t(action.label) || action.label}
                        aria-label={t(action.label) || action.label}
                        className={cn(
                            isRTL && 'flex-row-reverse',
                            isDestructive && 'text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-900/20',
                            action.className
                        )}
                    >
                        <Icon className="h-4 w-4" />
                    </Button>
                );
            })}
        </div>
    );
}

/**
 * Pre-configured action buttons for clinic CRUD operations
 */
export function ClinicStandardActions({
    onView,
    onEdit,
    onDelete,
    showView = true,
    showEdit = true,
    showDelete = true,
    className,
}: {
    onView?: () => void;
    onEdit?: () => void;
    onDelete?: () => void;
    showView?: boolean;
    showEdit?: boolean;
    showDelete?: boolean;
    className?: string;
}) {
    const { t } = useTranslation();
    const actions: ActionButton[] = [];

    if (showView && onView) {
        actions.push({
            icon: Eye,
            label: 'view',
            onClick: onView,
        });
    }

    if (showEdit && onEdit) {
        actions.push({
            icon: Edit,
            label: 'edit',
            onClick: onEdit,
        });
    }

    if (showDelete && onDelete) {
        actions.push({
            icon: Trash2,
            label: 'delete',
            onClick: onDelete,
            variant: 'ghost',
            className: 'text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-900/20',
        });
    }

    return <ClinicTableActions actions={actions} className={className} />;
}

