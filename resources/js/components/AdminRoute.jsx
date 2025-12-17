import { Navigate, Outlet } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import React from "react";

export default function AdminRoute({ requiredPermission = null }) {
    const user = useAuthStore(state => state.user);
    const isAuthenticated = useAuthStore(state => state.isAuthenticated);
    const hasPermission = useAuthStore(state => state.hasPermission);
    const isSuperAdmin = useAuthStore(state => state.isSuperAdmin);

    if (!isAuthenticated) {
        return <Navigate to="/login" replace />;
    }

    if (user?.role !== 'admin') {
        return <Navigate to="/" replace />;
    }

    // If route requires specific permission, check it
    if (requiredPermission && !isSuperAdmin() && !hasPermission(requiredPermission)) {
        // Redirect to dashboard with permission denied message
        return <Navigate to="/admin/dashboard" replace />;
    }

    return <Outlet />;
}
