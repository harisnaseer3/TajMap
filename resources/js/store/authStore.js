import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// Permission constants (matching backend) - Action Level
export const PERMISSIONS = {
    // Plots
    VIEW_PLOTS: 'view_plots',
    CREATE_PLOTS: 'create_plots',
    EDIT_PLOTS: 'edit_plots',
    DELETE_PLOTS: 'delete_plots',
    IMPORT_PLOTS: 'import_plots',
    EXPORT_PLOTS: 'export_plots',
    // Leads
    VIEW_LEADS: 'view_leads',
    CREATE_LEADS: 'create_leads',
    EDIT_LEADS: 'edit_leads',
    DELETE_LEADS: 'delete_leads',
    ASSIGN_LEADS: 'assign_leads',
    EXPORT_LEADS: 'export_leads',
    // Users
    VIEW_USERS: 'view_users',
    CREATE_USERS: 'create_users',
    EDIT_USERS: 'edit_users',
    DELETE_USERS: 'delete_users',
    MANAGE_USER_PERMISSIONS: 'manage_user_permissions',
    // Settings
    VIEW_SETTINGS: 'view_settings',
    EDIT_SETTINGS: 'edit_settings',
};

export const PERMISSION_GROUPS = {
    'Plots': {
        [PERMISSIONS.VIEW_PLOTS]: 'View Plots',
        [PERMISSIONS.CREATE_PLOTS]: 'Create Plots',
        [PERMISSIONS.EDIT_PLOTS]: 'Edit Plots',
        [PERMISSIONS.DELETE_PLOTS]: 'Delete Plots',
        [PERMISSIONS.IMPORT_PLOTS]: 'Import Plots',
        [PERMISSIONS.EXPORT_PLOTS]: 'Export Plots',
    },
    'Leads': {
        [PERMISSIONS.VIEW_LEADS]: 'View Leads',
        [PERMISSIONS.CREATE_LEADS]: 'Create Leads',
        [PERMISSIONS.EDIT_LEADS]: 'Edit Leads',
        [PERMISSIONS.DELETE_LEADS]: 'Delete Leads',
        [PERMISSIONS.ASSIGN_LEADS]: 'Assign Leads',
        [PERMISSIONS.EXPORT_LEADS]: 'Export Leads',
    },
    'Users': {
        [PERMISSIONS.VIEW_USERS]: 'View Users',
        [PERMISSIONS.CREATE_USERS]: 'Create Users',
        [PERMISSIONS.EDIT_USERS]: 'Edit Users',
        [PERMISSIONS.DELETE_USERS]: 'Delete Users',
        [PERMISSIONS.MANAGE_USER_PERMISSIONS]: 'Manage Permissions',
    },
    'Settings': {
        [PERMISSIONS.VIEW_SETTINGS]: 'View Settings',
        [PERMISSIONS.EDIT_SETTINGS]: 'Edit Settings',
    },
};

export const useAuthStore = create(
    persist(
        (set, get) => ({
            user: null,
            token: null,
            isAuthenticated: false,
            permissions: [],

            setAuth: (user, token) => {
                set({
                    user,
                    token,
                    isAuthenticated: true,
                    permissions: user?.permissions || []
                });
                localStorage.setItem('auth_token', token);
            },

            clearAuth: () => {
                set({
                    user: null,
                    token: null,
                    isAuthenticated: false,
                    permissions: []
                });
                localStorage.removeItem('auth_token');
            },

            updateUser: (user) => {
                set({
                    user,
                    permissions: user?.permissions || []
                });
            },

            isAdmin: () => {
                const { user } = get();
                return user?.role === 'admin';
            },

            isSuperAdmin: () => {
                const { user } = get();
                return user?.is_super_admin === true;
            },

            hasPermission: (permission) => {
                const { user } = get();
                // Super admins have all permissions
                if (user?.is_super_admin) return true;
                // Check permissions array
                return user?.permissions?.includes(permission) || false;
            },

            hasAnyPermission: (permissions) => {
                return permissions.some(p => get().hasPermission(p));
            },

            hasAllPermissions: (permissions) => {
                return permissions.every(p => get().hasPermission(p));
            },

            getToken: () => {
                return get().token || localStorage.getItem('auth_token');
            },
        }),
        {
            name: 'auth-storage',
            partialize: (state) => ({
                user: state.user,
                token: state.token,
                isAuthenticated: state.isAuthenticated,
                permissions: state.permissions,
            }),
        }
    )
);