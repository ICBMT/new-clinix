import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { useTranslation } from '@/hooks/use-translation';
import { useState, useEffect, Fragment } from 'react';
// Removed Table components - using native HTML table elements for better sticky header support

interface PermissionGroup {
    create: string[];
    read: string[];
    update: string[];
    delete: string[];
    others: string[];
}

interface SubGroup {
    name: string;
    permissions: PermissionGroup;
    count: number;
}

interface GroupData {
    permissions: PermissionGroup;
    count: number;
    subGroups: SubGroup[];
}

interface PermissionTableProps {
    permissionGroups: Record<string, GroupData>;
    selectedPermissions?: string[];
    onChange?: (permissions: string[]) => void;
    readonly?: boolean;
}

export function PermissionTable({
    permissionGroups,
    selectedPermissions = [],
    onChange,
    readonly = false,
}: PermissionTableProps) {
    const { t } = useTranslation();
    const DASHBOARD_VIEW_PERMISSION = 'dashboard.view';
    
    // Ensure dashboard.view is always included
    const initialPermissions = Array.isArray(selectedPermissions) 
        ? [...new Set([...selectedPermissions, DASHBOARD_VIEW_PERMISSION])]
        : [DASHBOARD_VIEW_PERMISSION];
    
    const [selected, setSelected] = useState<Set<string>>(new Set(initialPermissions));

    useEffect(() => {
        // Always include dashboard.view when updating from props
        const updatedPermissions = Array.isArray(selectedPermissions)
            ? [...new Set([...selectedPermissions, DASHBOARD_VIEW_PERMISSION])]
            : [DASHBOARD_VIEW_PERMISSION];
        setSelected(new Set(updatedPermissions));
    }, [selectedPermissions]);

    const handleToggle = (permission: string) => {
        if (readonly) return;
        
        // Prevent unchecking dashboard.view
        if (permission === DASHBOARD_VIEW_PERMISSION) {
            return;
        }

        const newSelected = new Set(selected);
        if (newSelected.has(permission)) {
            newSelected.delete(permission);
        } else {
            newSelected.add(permission);
        }
        // Always ensure dashboard.view is included
        newSelected.add(DASHBOARD_VIEW_PERMISSION);
        setSelected(newSelected);
        onChange?.(Array.from(newSelected));
    };

    const handleToggleAll = (permissions: string[]) => {
        if (readonly) return;

        const newSelected = new Set(selected);
        const allSelected = permissions.every(p => newSelected.has(p));
        
        if (allSelected) {
            // Don't allow unchecking dashboard.view
            permissions.forEach(p => {
                if (p !== DASHBOARD_VIEW_PERMISSION) {
                    newSelected.delete(p);
                }
            });
        } else {
            permissions.forEach(p => newSelected.add(p));
        }
        
        // Always ensure dashboard.view is included
        newSelected.add(DASHBOARD_VIEW_PERMISSION);
        setSelected(newSelected);
        onChange?.(Array.from(newSelected));
    };

    const isPermissionSelected = (permission: string): boolean => {
        // dashboard.view is always selected
        if (permission === DASHBOARD_VIEW_PERMISSION) {
            return true;
        }
        return selected.has(permission);
    };
    
    const isPermissionReadonly = (permission: string): boolean => {
        // dashboard.view is always readonly
        return permission === DASHBOARD_VIEW_PERMISSION || readonly;
    };

    const areAllSelected = (permissions: string[]): boolean => {
        return permissions.length > 0 && permissions.every(p => selected.has(p));
    };

    const getSomeSelected = (permissions: string[]): boolean => {
        return permissions.some(p => selected.has(p)) && !areAllSelected(permissions);
    };

    const getAllModulePermissions = (groupData: GroupData): string[] => {
        const allPermissions: string[] = [];
        
        // Add main group permissions
        allPermissions.push(...groupData.permissions.create);
        allPermissions.push(...groupData.permissions.read);
        allPermissions.push(...groupData.permissions.update);
        allPermissions.push(...groupData.permissions.delete);
        allPermissions.push(...groupData.permissions.others);
        
        // Add all sub-group permissions
        groupData.subGroups.forEach(subGroup => {
            allPermissions.push(...subGroup.permissions.create);
            allPermissions.push(...subGroup.permissions.read);
            allPermissions.push(...subGroup.permissions.update);
            allPermissions.push(...subGroup.permissions.delete);
            allPermissions.push(...subGroup.permissions.others);
        });
        
        return allPermissions;
    };

    const getAllSubGroupPermissions = (subGroup: SubGroup): string[] => {
        const allPermissions: string[] = [];
        allPermissions.push(...subGroup.permissions.create);
        allPermissions.push(...subGroup.permissions.read);
        allPermissions.push(...subGroup.permissions.update);
        allPermissions.push(...subGroup.permissions.delete);
        allPermissions.push(...subGroup.permissions.others);
        return allPermissions;
    };

    const handleToggleModule = (groupData: GroupData) => {
        if (readonly) return;
        const allPermissions = getAllModulePermissions(groupData);
        handleToggleAll(allPermissions);
    };

    const handleToggleSubGroup = (subGroup: SubGroup) => {
        if (readonly) return;
        const allPermissions = getAllSubGroupPermissions(subGroup);
        handleToggleAll(allPermissions);
    };

    const formatPermissionName = (permission: string): string => {
        // Format the full permission name, converting snake_case to Title Case
        // e.g., "users.create_user" -> "Users Create User"
        return permission
            .split('.')
            .map(part => 
                part
                    .replace(/_/g, ' ')
                    .replace(/-/g, ' ')
                    .split(' ')
                    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
                    .join(' ')
            )
            .join(' ');
    };

    const formatGroupName = (name: string): string => {
        // Format group name by converting snake_case or kebab-case to Title Case
        // Don't translate, just format the name
        // e.g., "users_management" -> "Users Management", "Users Management" -> "Users Management"
        return name
            .replace(/_/g, ' ')
            .replace(/-/g, ' ')
            .split(' ')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
            .join(' ');
    };

    const getActionPermissions = (permissions: PermissionGroup, action: 'create' | 'read' | 'update' | 'delete'): string[] => {
        if (action === 'read') {
            return permissions.read;
        }
        return permissions[action] || [];
    };

    const renderCheckbox = (permissions: string[]) => {
        if (permissions.length === 0) {
            return <span className="text-muted-foreground">—</span>;
        }

        const allSelected = areAllSelected(permissions);
        const someSelected = permissions.some(p => selected.has(p)) && !allSelected;
        // Check if all permissions are readonly (e.g., only dashboard.view)
        const allReadonly = permissions.length > 0 && permissions.every(p => isPermissionReadonly(p));
        // Check if this is the dashboard.view permission group
        const isDashboardViewOnly = permissions.length === 1 && permissions[0] === DASHBOARD_VIEW_PERMISSION;

                return (
            <div className="flex items-center justify-center">
                                                    <Checkbox
                    checked={allSelected || someSelected || isDashboardViewOnly}
                    onCheckedChange={() => handleToggleAll(permissions)}
                                                        disabled={readonly || allReadonly}
                    className={someSelected && !allSelected ? 'data-[state=checked]:bg-primary/50' : ''}
                />
                                                </div>
        );
    };

    const renderOtherPermissions = (permissions: PermissionGroup) => {
        if (permissions.others.length === 0) {
            return null;
        }

        return (
            <>
                <tr className="border-b transition-colors hover:bg-muted/50 bg-muted/30">
                    <td colSpan={5} className="p-4 align-middle pl-8 py-2">
                        <span className="text-sm font-medium text-muted-foreground">
                            {t('other_permissions')} ({permissions.others.length})
                        </span>
                    </td>
                </tr>
                {permissions.others.map((permission) => (
                    <tr key={permission} className="border-b transition-colors hover:bg-muted/50 bg-muted/10">
                        <td className="p-4 align-middle pl-12 py-2">
                            <span className="text-sm">{formatPermissionName(permission)}</span>
                        </td>
                        <td className="p-4 align-middle text-center">
                            <span className="text-muted-foreground">—</span>
                        </td>
                        <td className="p-4 align-middle text-center">
                            <div className="flex items-center justify-center">
                                                    <Checkbox
                                    checked={isPermissionSelected(permission)}
                                                        onCheckedChange={() => handleToggle(permission)}
                                                        disabled={isPermissionReadonly(permission)}
                                                    />
                                                </div>
                        </td>
                        <td className="p-4 align-middle text-center">
                            <div className="flex items-center justify-center">
                                                    <Checkbox
                                    checked={isPermissionSelected(permission)}
                                                        onCheckedChange={() => handleToggle(permission)}
                                                        disabled={isPermissionReadonly(permission)}
                                                    />
                                                </div>
                        </td>
                        <td className="p-4 align-middle text-center">
                            <div className="flex items-center justify-center">
                                                    <Checkbox
                                    checked={isPermissionSelected(permission)}
                                                        onCheckedChange={() => handleToggle(permission)}
                                                        disabled={isPermissionReadonly(permission)}
                                                    />
                                                </div>
                        </td>
                    </tr>
                ))}
            </>
        );
    };

    return (
        <div className="rounded-lg border bg-card">
            <div className="overflow-x-auto max-h-[calc(100vh-300px)] overflow-y-auto relative">
                <table className="w-full caption-bottom text-sm">
                    <thead className="[&_tr]:border-b">
                        <tr className="sticky top-0 z-10 bg-card dark:bg-card border-b-2 shadow-sm">
                            <th className="h-12 px-4 text-left align-middle font-semibold w-[300px] bg-card dark:bg-card sticky top-0 left-0 z-20 shadow-[2px_0_4px_-2px_rgba(0,0,0,0.1)] dark:shadow-[2px_0_4px_-2px_rgba(255,255,255,0.1)]">{t('module_sub_module')}</th>
                            <th className="h-12 px-4 text-center align-middle font-semibold w-[100px] bg-card dark:bg-card sticky top-0 z-10">{t('create')}</th>
                            <th className="h-12 px-4 text-center align-middle font-semibold w-[100px] bg-card dark:bg-card sticky top-0 z-10">{t('update')}</th>
                            <th className="h-12 px-4 text-center align-middle font-semibold w-[100px] bg-card dark:bg-card sticky top-0 z-10">{t('delete')}</th>
                            <th className="h-12 px-4 text-center align-middle font-semibold w-[100px] bg-card dark:bg-card sticky top-0 z-10">{t('view')}</th>
                        </tr>
                    </thead>
                    <tbody className="[&_tr:last-child]:border-0">
                        {Object.entries(permissionGroups).map(([groupName, groupData]) => {
                            const { permissions, count, subGroups } = groupData;

                return (
                                <Fragment key={groupName}>
                                    {/* Main Group Row - Only show if there are main group permissions or sub-groups */}
                                    {(permissions.create.length > 0 || 
                                      permissions.read.length > 0 || 
                                      permissions.update.length > 0 || 
                                      permissions.delete.length > 0 || 
                                      permissions.others.length > 0 || 
                                      subGroups.length > 0) && (
                                        <tr className="border-b transition-colors hover:bg-muted/50 bg-muted/50 font-semibold">
                                            <td className="p-4 align-middle py-3">
                                                <div className="flex items-center gap-2">
                                                    <Checkbox
                                                        checked={areAllSelected(getAllModulePermissions(groupData))}
                                                        onCheckedChange={() => handleToggleModule(groupData)}
                                                        disabled={readonly}
                                                        className={getSomeSelected(getAllModulePermissions(groupData)) ? 'data-[state=checked]:bg-primary/50' : ''}
                                                    />
                                                    <span>{formatGroupName(groupName)}</span>
                                                    <Badge variant="secondary" className="text-xs">
                                                        {count} {t('permissions')}
                                                    </Badge>
                                            </div>
                                            </td>
                                            <td className="p-4 align-middle text-center">
                                                {renderCheckbox(getActionPermissions(permissions, 'create'))}
                                            </td>
                                            <td className="p-4 align-middle text-center">
                                                {renderCheckbox(getActionPermissions(permissions, 'update'))}
                                            </td>
                                            <td className="p-4 align-middle text-center">
                                                {renderCheckbox(getActionPermissions(permissions, 'delete'))}
                                            </td>
                                            <td className="p-4 align-middle text-center">
                                                {renderCheckbox(getActionPermissions(permissions, 'read'))}
                                            </td>
                                        </tr>
                                    )}

                                    {/* Sub-Groups */}
                                    {subGroups.map((subGroup, subGroupIndex) => {
                                        const subPermissions = subGroup.permissions;
                                        
                                        return (
                                            <Fragment key={`${subGroup.name}-${subGroupIndex}`}>
                                                <tr className="border-b transition-colors hover:bg-muted/50 bg-muted/30">
                                                    <td colSpan={5} className="p-4 align-middle pl-6 py-2">
                                                        <div className="flex items-center gap-2">
                                                    <Checkbox
                                                                checked={areAllSelected(getAllSubGroupPermissions(subGroup))}
                                                                onCheckedChange={() => handleToggleSubGroup(subGroup)}
                                                        disabled={readonly}
                                                                className={getSomeSelected(getAllSubGroupPermissions(subGroup)) ? 'data-[state=checked]:bg-primary/50' : ''}
                                                            />
                                                            <span className="text-sm font-medium">
                                                                {formatGroupName(subGroup.name)}
                                                            </span>
                                                            <Badge variant="outline" className="text-xs">
                                                                {subGroup.count} {t('permissions')}
                                                            </Badge>
                                                </div>
                                                    </td>
                                                </tr>

                                                {/* Sub-Group CRUD Permissions - Only show if there are CRUD permissions */}
                                                {(getActionPermissions(subPermissions, 'create').length > 0 ||
                                                  getActionPermissions(subPermissions, 'read').length > 0 ||
                                                  getActionPermissions(subPermissions, 'update').length > 0 ||
                                                  getActionPermissions(subPermissions, 'delete').length > 0) && (
                                                    <tr className="border-b transition-colors hover:bg-muted/50 bg-muted/10">
                                                        <td className="p-4 align-middle pl-8 py-2">
                                                            <span className="text-sm text-muted-foreground">
                                                                {t('crud_permissions')}
                                                            </span>
                                                        </td>
                                                        <td className="p-4 align-middle text-center">
                                                            {renderCheckbox(getActionPermissions(subPermissions, 'create'))}
                                                        </td>
                                                        <td className="p-4 align-middle text-center">
                                                            {renderCheckbox(getActionPermissions(subPermissions, 'update'))}
                                                        </td>
                                                        <td className="p-4 align-middle text-center">
                                                            {renderCheckbox(getActionPermissions(subPermissions, 'delete'))}
                                                        </td>
                                                        <td className="p-4 align-middle text-center">
                                                            {renderCheckbox(getActionPermissions(subPermissions, 'read'))}
                                                        </td>
                                                    </tr>
                                                )}

                                                {/* Other Permissions for Sub-Group */}
                                                {renderOtherPermissions(subPermissions)}
                                            </Fragment>
                                        );
                                    })}

                                    {/* Other Permissions for Main Group */}
                                    {renderOtherPermissions(permissions)}
                                </Fragment>
                );
            })}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
