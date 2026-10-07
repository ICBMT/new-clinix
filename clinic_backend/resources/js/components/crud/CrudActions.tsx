import { Button } from '@/components/ui/button';
import { Eye, Edit, Trash2, MoreHorizontal } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { useTranslation } from '@/hooks/use-translation';
import { type CrudAction, type CrudToggleAction } from '@/types/crud';
import { StatusSwitch } from '@/components/status-switch';
import { VerificationStatusSwitch } from '@/components/verification-status-switch';

interface CrudActionsProps<T = any> {
    row: T;
    actions?: CrudAction<T>[];
    toggleActions?: CrudToggleAction[];
    onView?: (row: T) => void;
    onEdit?: (row: T) => void;
    onDelete?: (row: T) => void;
    entityType?: string; // For toggle actions
}

export function CrudActions<T = any>({
    row,
    actions = [],
    toggleActions = [],
    onView,
    onEdit,
    onDelete,
    entityType,
}: CrudActionsProps<T>) {
    const { t } = useTranslation();
    const rowId = (row as any).id;

    // Default actions
    const defaultActions: CrudAction<T>[] = [];
    
    if (onView) {
        defaultActions.push({
            id: 'view',
            label: t('view'),
            icon: <Eye className="h-4 w-4" />,
            variant: 'ghost',
            onClick: onView,
        });
    }

    if (onEdit) {
        defaultActions.push({
            id: 'edit',
            label: t('edit'),
            icon: <Edit className="h-4 w-4" />,
            variant: 'ghost',
            onClick: onEdit,
        });
    }

    if (onDelete) {
        defaultActions.push({
            id: 'delete',
            label: t('delete'),
            icon: <Trash2 className="h-4 w-4" />,
            variant: 'ghost',
            onClick: onDelete,
            className: 'text-red-600 hover:text-red-700 hover:bg-red-50',
        });
    }

    // Merge default and custom actions
    const allActions = [...defaultActions, ...actions].filter(action => 
        !action.condition || action.condition(row)
    );

    // Separate toggle actions and regular actions
    const visibleToggleActions = toggleActions.filter(toggle => {
        const value = toggle.getValue ? toggle.getValue(row) : (row as any)[toggle.field];
        return value !== undefined;
    });

    const visibleActions = allActions.slice(0, 3); // Show first 3 actions directly
    const moreActions = allActions.slice(3);

    return (
        <div className="flex items-center justify-end gap-1">
            {/* Toggle Actions (switches) */}
            {visibleToggleActions.map((toggle) => {
                const value = toggle.getValue ? toggle.getValue(row) : (row as any)[toggle.field];
                const isVerified = toggle.field.includes('verified');
                
                if (isVerified && entityType) {
                    // Use VerificationStatusSwitch for verification fields
                    const type = toggle.field.includes('email') ? 'email' : 'phone';
                    return (
                        <VerificationStatusSwitch
                            key={toggle.id}
                            id={rowId}
                            type={type}
                            isVerified={value}
                            entityType={entityType}
                            onSuccess={() => toggle.onSuccess?.(row)}
                            onError={() => toggle.onError?.(row)}
                        />
                    );
                } else {
                    // Use StatusSwitch for other boolean fields
                    return (
                        <StatusSwitch
                            key={toggle.id}
                            id={rowId}
                            checked={value}
                            endpoint={toggle.endpoint(rowId)}
                            onSuccess={() => toggle.onSuccess?.(row)}
                            onError={() => toggle.onError?.(row)}
                        />
                    );
                }
            })}

            {/* Regular Actions */}
            {visibleActions.map((action) => (
                <Button
                    key={action.id}
                    variant={action.variant || 'ghost'}
                    size="icon"
                    onClick={() => action.onClick(row)}
                    title={action.label}
                    className={action.className}
                >
                    {action.icon}
                </Button>
            ))}

            {/* More Actions Dropdown */}
            {moreActions.length > 0 && (
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                            <MoreHorizontal className="h-4 w-4" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                        {moreActions.map((action) => (
                            <DropdownMenuItem
                                key={action.id}
                                onClick={() => action.onClick(row)}
                                className={action.className}
                            >
                                {action.icon}
                                <span className="ml-2">{action.label}</span>
                            </DropdownMenuItem>
                        ))}
                    </DropdownMenuContent>
                </DropdownMenu>
            )}
        </div>
    );
}

