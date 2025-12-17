import React from 'react';
import { useAuthStore } from '../store/authStore';

/**
 * Permission gate component - conditionally renders children based on permissions
 *
 * @param {string} permission - Single permission to check
 * @param {array} permissions - Multiple permissions to check
 * @param {boolean} requireAll - If true, requires all permissions; if false, requires any permission
 * @param {ReactNode} fallback - Component to render if permission check fails
 * @param {ReactNode} children - Component to render if permission check passes
 */
export default function PermissionGate({
    permission,
    permissions,
    requireAll = false,
    fallback = null,
    children
}) {
    const { hasPermission, hasAnyPermission, hasAllPermissions, isSuperAdmin } = useAuthStore();

    // Super admins always pass
    if (isSuperAdmin()) {
        return <>{children}</>;
    }

    let hasAccess = false;

    if (permission) {
        // Single permission check
        hasAccess = hasPermission(permission);
    } else if (permissions && permissions.length > 0) {
        // Multiple permissions
        hasAccess = requireAll
            ? hasAllPermissions(permissions)
            : hasAnyPermission(permissions);
    } else {
        // No permission specified, allow access
        hasAccess = true;
    }

    return hasAccess ? <>{children}</> : <>{fallback}</>;
}
