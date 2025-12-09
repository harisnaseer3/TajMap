import React, { useState } from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { authService } from '../services/api';
import toast from 'react-hot-toast';
import Logo from '../components/Logo';

export default function AdminLayout() {
    const location = useLocation();
    const navigate = useNavigate();
    const { user, clearAuth } = useAuthStore();
    const [sidebarOpen, setSidebarOpen] = useState(true);

    const handleLogout = async () => {
        try {
            await authService.logout();
            clearAuth();
            navigate('/login');
            toast.success('Logged out successfully');
        } catch (error) {
            console.error('Logout error:', error);
            clearAuth();
            navigate('/login');
        }
    };

    const navItems = [
        { path: '/admin/dashboard', label: 'Dashboard', icon: '📊' },
        { path: '/admin/plots', label: 'Plots', icon: '🗺️' },
        { path: '/admin/leads', label: 'Leads', icon: '👥' },
        { path: '/admin/tickets', label: 'Tickets', icon: '🎫' },
        { path: '/admin/analytics', label: 'Analytics', icon: '📈' },
        { path: '/admin/map-editor', label: 'Map Editor', icon: '🗺️' },
        { path: '/admin/users', label: 'Users', icon: '👤' },
        { path: '/admin/settings', label: 'Settings', icon: '⚙️' },
    ];

    // Filter nav items - only show Settings for specific email
    const filteredNavItems = navItems.filter(item => {
        if (item.path === '/admin/settings') {
            return user?.email === 'harisnaseer3@gmail.com';
        }
        return true;
    });

    return (
        <div className="flex h-screen bg-gray-100">
            {/* Sidebar */}
            <aside className={`bg-gray-900 text-white transition-all duration-300 ${sidebarOpen ? 'w-64' : 'w-20'}`}>
                <div className="p-4 flex items-center justify-between border-b border-gray-700">
                    <Logo
                        showText={sidebarOpen}
                        text="TajMap Admin"
                        iconClassName="h-8 w-8"
                        textClassName="ml-2 text-xl font-bold text-white"
                    />
                    <button onClick={() => setSidebarOpen(!sidebarOpen)} className="text-gray-400 hover:text-white">
                        {sidebarOpen ? '◀' : '▶'}
                    </button>
                </div>

                <nav className="mt-6">
                    {filteredNavItems.map(item => (
                        <Link
                            key={item.path}
                            to={item.path}
                            className={`flex items-center gap-4 px-6 py-3 hover:bg-gray-800 transition ${
                                location.pathname === item.path ? 'bg-gray-800 border-l-4 border-blue-500' : ''
                            }`}
                        >
                            <span className="text-2xl">{item.icon}</span>
                            {sidebarOpen && <span>{item.label}</span>}
                        </Link>
                    ))}
                </nav>
            </aside>

            {/* Main Content */}
            <div className="flex-1 flex flex-col overflow-hidden">
                {/* Header */}
                <header className="bg-white shadow-sm border-b border-gray-200">
                    <div className="px-6 py-4 flex items-center justify-between">
                        <h2 className="text-2xl font-semibold text-gray-800">
                            {filteredNavItems.find(item => item.path === location.pathname)?.label || 'Admin Panel'}
                        </h2>

                        <div className="flex items-center gap-4">
                            <span className="text-sm text-gray-600">Welcome, {user?.name}</span>
                            <button
                                onClick={handleLogout}
                                className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition"
                            >
                                Logout
                            </button>
                        </div>
                    </div>
                </header>

                {/* Page Content */}
                <main className="flex-1 overflow-auto p-6">
                    <Outlet />
                </main>
            </div>
        </div>
    );
}