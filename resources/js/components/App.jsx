import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import React from "react";

// Public Pages
import LandingPage from '../pages/public/LandingPage';
import PlotListPage from '../pages/public/PlotListPage';
import LoginPage from '../pages/auth/LoginPage';
import RegisterPage from '../pages/auth/RegisterPage';

// User Pages
import UserDashboard from '../pages/user/UserDashboard';
import UserSavedPlots from '../pages/user/UserSavedPlots';

// Admin Pages
import AdminLayout from '../layouts/AdminLayout';
import AdminDashboard from '../pages/admin/AdminDashboard';
import AdminPlots from '../pages/admin/AdminPlots';
import AdminLeads from '../pages/admin/AdminLeads';
import AdminAnalytics from '../pages/admin/AdminAnalytics';
import AdminSettings from '../pages/admin/AdminSettings';
import AdminUsers from '../pages/admin/AdminUsers';

// Components
import ProtectedRoute from './ProtectedRoute';
import AdminRoute from './AdminRoute';

export default function App() {
    return (
        <BrowserRouter>
            <Toaster position="top-right" />
            <Routes>
                {/* Public Routes */}
                <Route path="/" element={<LandingPage />} />
                <Route path="/plots" element={<PlotListPage />} />
                <Route path="/login" element={<LoginPage />} />
                <Route path="/register" element={<RegisterPage />} />

                {/* User Routes */}
                <Route path="/user" element={<ProtectedRoute />}>
                    <Route path="dashboard" element={<UserDashboard />} />
                    <Route path="saved-plots" element={<UserSavedPlots />} />
                </Route>

                {/* Admin Routes */}
                <Route path="/admin" element={<AdminRoute />}>
                    <Route element={<AdminLayout />}>
                        <Route index element={<Navigate to="/admin/dashboard" replace />} />
                        <Route path="dashboard" element={<AdminDashboard />} />
                        <Route path="plots" element={<AdminPlots />} />
                        <Route path="leads" element={<AdminLeads />} />
                        <Route path="analytics" element={<AdminAnalytics />} />
                        <Route path="settings" element={<AdminSettings />} />
                        <Route path="users" element={<AdminUsers />} />
                    </Route>
                </Route>

                {/* 404 */}
                <Route path="*" element={<div className="flex items-center justify-center min-h-screen">
                    <div className="text-center">
                        <h1 className="text-6xl font-bold text-gray-800">404</h1>
                        <p className="text-xl text-gray-600 mt-4">Page not found</p>
                    </div>
                </div>} />
            </Routes>
        </BrowserRouter>
    );
}
