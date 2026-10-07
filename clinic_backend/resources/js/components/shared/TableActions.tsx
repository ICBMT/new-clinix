import { Button } from '@/components/ui/button';
import { useRTL } from '@/hooks/use-rtl';
import { useTranslation } from '@/hooks/use-translation';
import { cn } from '@/lib/utils';
import { Eye, Edit, Trash2, type LucideIcon } from 'lucide-react';

interface ActionButton {
    icon: LucideIcon;
    label: string;
    onClick: () => void;
    variant?: 'default' | 'ghost' | 'destructive' | 'outline';
    className?: string;
}

interface TableActionsProps {
    actions: ActionButton[];
    className?: string;
}

/**
 * Universal action buttons component for all admin panel tables
 * Handles RTL alignment and accessibility automatically
 */
export function TableActions({
    actions,
    className,
}: TableActionsProps) {
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
 * Pre-configured action buttons for standard CRUD operations
 */
export function StandardActions({
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

    return <TableActions actions={actions} className={className} />;
}

