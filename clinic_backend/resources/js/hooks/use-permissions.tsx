import { usePage } from '@inertiajs/react';
import { useMemo } from 'react';
import { type SharedData } from '@/types';

interface UserPermissions {
    [key: string]: boolean;
}

export function usePermissions() {
    const page = usePage<SharedData>();
    
    // Memoize arrays to avoid dependency issues
    const userPermissionsArray = useMemo(() => {
        return page.props.auth?.user?.permissions || [];
    }, [page.props.auth?.user?.permissions]);
    
    const userRoles = useMemo(() => {
        return page.props.auth?.user?.roles || [];
    }, [page.props.auth?.user?.roles]);
    
    // Convert array to object for easier lookup
    const userPermissions = useMemo(() => {
        const permissions: UserPermissions = {};
        userPermissionsArray.forEach(permission => {
            permissions[permission] = true;
        });
        return permissions;
    }, [userPermissionsArray]);

    // Helper to check if user has a specific role
    const hasRole = useMemo(() => {
        return (role: string): boolean => {
            return userRoles.includes(role);
        };
    }, [userRoles]);

    // Helper to check if user has any of the specified roles
    const hasAnyRole = useMemo(() => {
        return (roles: string[]): boolean => {
            return roles.some(role => userRoles.includes(role));
        };
    }, [userRoles]);

    // Check if user is super admin
    const isSuperAdmin = useMemo(() => {
        return userRoles.includes('super-admin');
    }, [userRoles]);

    // Check if user is clinic role
    const isClinic = useMemo(() => {
        return userRoles.includes('clinic');
    }, [userRoles]);

    // Check if user is clinic manager
    const isClinicManager = useMemo(() => {
        return userRoles.includes('clinic_manager');
    }, [userRoles]);

    const can = useMemo(() => {
        return (permission: string): boolean => {
            // Super admin can access everything
            if (isSuperAdmin) {
                return true;
            }
            return userPermissions[permission] || false;
        };
    }, [userPermissions, isSuperAdmin]);

    const canAny = useMemo(() => {
        return (permissions: string[]): boolean => {
            // Super admin can access everything
            if (isSuperAdmin) {
                return true;
            }
            return permissions.some(permission => userPermissions[permission] || false);
        };
    }, [userPermissions, isSuperAdmin]);

    const canAll = useMemo(() => {
        return (permissions: string[]): boolean => {
            // Super admin can access everything
            if (isSuperAdmin) {
                return true;
            }
            return permissions.every(permission => userPermissions[permission] || false);
        };
    }, [userPermissions, isSuperAdmin]);

    const getSiteSettingsPermissions = useMemo(() => {
        return (category: string): string[] => {
            const actions = ['view', 'edit', 'update', 'reset', 'export', 'import'];
            return actions.filter(action => 
                userPermissions[`site-settings.${category}.${action}`] || false
            );
        };
    }, [userPermissions]);

    const getUserPermissions = useMemo(() => {
        return (resource: string): string[] => {
            const actions = ['view', 'create', 'store', 'show', 'edit', 'update', 'delete', 'destroy'];
            return actions.filter(action => 
                userPermissions[`${resource}.${action}`] || false
            );
        };
    }, [userPermissions]);

    return {
        can,
        canAny,
        canAll,
        hasRole,
        hasAnyRole,
        isSuperAdmin,
        isClinic,
        isClinicManager,
        getSiteSettingsPermissions,
        getUserPermissions,
        permissions: userPermissions,
        roles: userRoles,
    };
}

export default usePermissions;
