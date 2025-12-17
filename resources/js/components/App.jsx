import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import React from "react";

// Public Pages
import LandingPage from '../pages/public/LandingPage';
import PlotListPage from '../pages/public/PlotListPage';
import MapView from '../pages/MapView';
import LoginPage from '../pages/auth/LoginPage';
import RegisterPage from '../pages/auth/RegisterPage';
import ForgotPasswordPage from '../pages/auth/ForgotPasswordPage';
import ResetPasswordPage from '../pages/auth/ResetPasswordPage';
import ChangePasswordPage from '../pages/auth/ChangePasswordPage';

// User Pages
import UserDashboard from '../pages/user/UserDashboard';
import UserSavedPlots from '../pages/user/UserSavedPlots';
import UserTickets from '../pages/user/UserTickets';
import UserTicketDetails from '../pages/user/UserTicketDetails';
import CreateTicket from '../pages/user/CreateTicket';

// Admin Pages
import AdminLayout from '../layouts/AdminLayout';
import AdminDashboard from '../pages/admin/AdminDashboard';
import AdminPlots from '../pages/admin/AdminPlots';
import AdminLeads from '../pages/admin/AdminLeads';
import AdminAnalytics from '../pages/admin/AdminAnalytics';
import AdminSettings from '../pages/admin/AdminSettings';
import AdminUsers from '../pages/admin/AdminUsers';
import AdminMapEditor from '../pages/admin/AdminMapEditor';
import AdminTickets from '../pages/admin/AdminTickets';
import AdminTicketDetails from '../pages/admin/AdminTicketDetails';

// Components
import ProtectedRoute from './ProtectedRoute';
import AdminRoute from './AdminRoute';
import { PERMISSIONS } from '../store/authStore';

export default function App() {
    return (
        <BrowserRouter>
            <Toaster position="top-right" />
            <Routes>
                {/* Public Routes */}
                <Route path="/" element={<LandingPage />} />
                <Route path="/plots" element={<PlotListPage />} />
                <Route path="/map" element={<MapView />} />
                <Route path="/login" element={<LoginPage />} />
                <Route path="/register" element={<RegisterPage />} />
                <Route path="/forgot-password" element={<ForgotPasswordPage />} />
                <Route path="/reset-password" element={<ResetPasswordPage />} />
                <Route path="/change-password" element={<ChangePasswordPage />} />

                {/* User Routes */}
                <Route path="/user" element={<ProtectedRoute />}>
                    <Route path="dashboard" element={<UserDashboard />} />
                    <Route path="saved-plots" element={<UserSavedPlots />} />
                    <Route path="tickets" element={<UserTickets />} />
                    <Route path="tickets/create" element={<CreateTicket />} />
                    <Route path="tickets/:id" element={<UserTicketDetails />} />
                </Route>

                {/* Admin Routes - No specific permission required */}
                <Route path="/admin" element={<AdminRoute />}>
                    <Route element={<AdminLayout />}>
                        <Route index element={<Navigate to="/admin/dashboard" replace />} />
                        <Route path="dashboard" element={<AdminDashboard />} />
                        <Route path="analytics" element={<AdminAnalytics />} />
                        <Route path="tickets" element={<AdminTickets />} />
                        <Route path="tickets/:id" element={<AdminTicketDetails />} />
                    </Route>
                </Route>

                {/* Admin Routes - Plots View Permission */}
                <Route path="/admin" element={<AdminRoute requiredPermission={PERMISSIONS.VIEW_PLOTS} />}>
                    <Route element={<AdminLayout />}>
                        <Route path="plots" element={<AdminPlots />} />
                        <Route path="map-editor" element={<AdminMapEditor />} />
                    </Route>
                </Route>

                {/* Admin Routes - Leads View Permission */}
                <Route path="/admin" element={<AdminRoute requiredPermission={PERMISSIONS.VIEW_LEADS} />}>
                    <Route element={<AdminLayout />}>
                        <Route path="leads" element={<AdminLeads />} />
                    </Route>
                </Route>

                {/* Admin Routes - Users View Permission */}
                <Route path="/admin" element={<AdminRoute requiredPermission={PERMISSIONS.VIEW_USERS} />}>
                    <Route element={<AdminLayout />}>
                        <Route path="users" element={<AdminUsers />} />
                    </Route>
                </Route>

                {/* Admin Routes - Settings View Permission */}
                <Route path="/admin" element={<AdminRoute requiredPermission={PERMISSIONS.VIEW_SETTINGS} />}>
                    <Route element={<AdminLayout />}>
                        <Route path="settings" element={<AdminSettings />} />
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
