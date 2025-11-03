import React, { useEffect, useState } from 'react';
import { dashboardService } from '../../services/api';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, PieChart, Pie, Cell, LineChart, Line, ResponsiveContainer } from 'recharts';

const COLORS = ['#22c55e', '#fbbf24', '#ef4444', '#3b82f6', '#8b5cf6', '#ec4899'];

export default function AdminDashboard() {
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchDashboardData();
    }, []);

    const fetchDashboardData = async () => {
        try {
            const { data } = await dashboardService.admin();
            setStats(data);
        } catch (error) {
            console.error('Error:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold text-gray-800">Admin Dashboard</h1>
                    <p className="text-gray-600 mt-1">Welcome back! Here's what's happening today.</p>
                </div>
                <div className="text-sm text-gray-500">
                    Last updated: {new Date().toLocaleDateString()}
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid md:grid-cols-4 gap-6">
                <div className="bg-gradient-to-br from-blue-500 to-blue-600 p-6 rounded-lg shadow-lg text-white transform hover:scale-105 transition-transform">
                    <div className="flex justify-between items-start">
                        <div>
                            <h3 className="text-sm opacity-90">Total Plots</h3>
                            <p className="text-4xl font-bold mt-2">{stats?.plots.total || 0}</p>
                        </div>
                        <svg className="w-12 h-12 opacity-50" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z"></path>
                        </svg>
                    </div>
                    <p className="text-xs mt-4 opacity-75">All registered plots</p>
                </div>

                <div className="bg-gradient-to-br from-green-500 to-green-600 p-6 rounded-lg shadow-lg text-white transform hover:scale-105 transition-transform">
                    <div className="flex justify-between items-start">
                        <div>
                            <h3 className="text-sm opacity-90">Available</h3>
                            <p className="text-4xl font-bold mt-2">{stats?.plots.available || 0}</p>
                        </div>
                        <svg className="w-12 h-12 opacity-50" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"></path>
                        </svg>
                    </div>
                    <p className="text-xs mt-4 opacity-75">{((stats?.plots.available / stats?.plots.total) * 100 || 0).toFixed(1)}% of total</p>
                </div>

                <div className="bg-gradient-to-br from-yellow-500 to-yellow-600 p-6 rounded-lg shadow-lg text-white transform hover:scale-105 transition-transform">
                    <div className="flex justify-between items-start">
                        <div>
                            <h3 className="text-sm opacity-90">Reserved</h3>
                            <p className="text-4xl font-bold mt-2">{stats?.plots.reserved || 0}</p>
                        </div>
                        <svg className="w-12 h-12 opacity-50" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd"></path>
                        </svg>
                    </div>
                    <p className="text-xs mt-4 opacity-75">{((stats?.plots.reserved / stats?.plots.total) * 100 || 0).toFixed(1)}% of total</p>
                </div>

                <div className="bg-gradient-to-br from-red-500 to-red-600 p-6 rounded-lg shadow-lg text-white transform hover:scale-105 transition-transform">
                    <div className="flex justify-between items-start">
                        <div>
                            <h3 className="text-sm opacity-90">Sold</h3>
                            <p className="text-4xl font-bold mt-2">{stats?.plots.sold || 0}</p>
                        </div>
                        <svg className="w-12 h-12 opacity-50" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M8.433 7.418c.155-.103.346-.196.567-.267v1.698a2.305 2.305 0 01-.567-.267C8.07 8.34 8 8.114 8 8c0-.114.07-.34.433-.582zM11 12.849v-1.698c.22.071.412.164.567.267.364.243.433.468.433.582 0 .114-.07.34-.433.582a2.305 2.305 0 01-.567.267z"></path>
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-13a1 1 0 10-2 0v.092a4.535 4.535 0 00-1.676.662C6.602 6.234 6 7.009 6 8c0 .99.602 1.765 1.324 2.246.48.32 1.054.545 1.676.662v1.941c-.391-.127-.68-.317-.843-.504a1 1 0 10-1.51 1.31c.562.649 1.413 1.076 2.353 1.253V15a1 1 0 102 0v-.092a4.535 4.535 0 001.676-.662C13.398 13.766 14 12.991 14 12c0-.99-.602-1.765-1.324-2.246A4.535 4.535 0 0011 9.092V7.151c.391.127.68.317.843.504a1 1 0 101.511-1.31c-.563-.649-1.413-1.076-2.354-1.253V5z" clipRule="evenodd"></path>
                        </svg>
                    </div>
                    <p className="text-xs mt-4 opacity-75">{((stats?.plots.sold / stats?.plots.total) * 100 || 0).toFixed(1)}% of total</p>
                </div>
            </div>

            {/* Charts Section */}
            <div className="grid md:grid-cols-2 gap-6">
                <div className="bg-white p-6 rounded-lg shadow-lg border border-gray-200">
                    <h3 className="font-bold text-xl mb-4 text-gray-800">Plot Distribution</h3>
                    {stats?.plots.by_status && stats.plots.by_status.length > 0 ? (
                        <ResponsiveContainer width="100%" height={300}>
                            <PieChart>
                                <Pie
                                    data={stats.plots.by_status}
                                    dataKey="count"
                                    nameKey="status"
                                    cx="50%"
                                    cy="50%"
                                    outerRadius={100}
                                    label
                                >
                                    {stats.plots.by_status.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip />
                                <Legend />
                            </PieChart>
                        </ResponsiveContainer>
                    ) : (
                        <div className="flex items-center justify-center h-64 text-gray-400">
                            No data available
                        </div>
                    )}
                </div>

                <div className="bg-white p-6 rounded-lg shadow-lg border border-gray-200">
                    <h3 className="font-bold text-xl mb-4 text-gray-800">Lead Pipeline</h3>
                    <div className="space-y-4">
                        <div className="flex justify-between items-center p-3 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors">
                            <div className="flex items-center">
                                <div className="w-3 h-3 bg-blue-500 rounded-full mr-3"></div>
                                <span className="font-medium text-gray-700">New Leads</span>
                            </div>
                            <span className="text-2xl font-bold text-blue-600">{stats?.leads.new || 0}</span>
                        </div>
                        <div className="flex justify-between items-center p-3 bg-yellow-50 rounded-lg hover:bg-yellow-100 transition-colors">
                            <div className="flex items-center">
                                <div className="w-3 h-3 bg-yellow-500 rounded-full mr-3"></div>
                                <span className="font-medium text-gray-700">Contacted</span>
                            </div>
                            <span className="text-2xl font-bold text-yellow-600">{stats?.leads.contacted || 0}</span>
                        </div>
                        <div className="flex justify-between items-center p-3 bg-purple-50 rounded-lg hover:bg-purple-100 transition-colors">
                            <div className="flex items-center">
                                <div className="w-3 h-3 bg-purple-500 rounded-full mr-3"></div>
                                <span className="font-medium text-gray-700">Interested</span>
                            </div>
                            <span className="text-2xl font-bold text-purple-600">{stats?.leads.interested || 0}</span>
                        </div>
                        <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg hover:bg-green-100 transition-colors">
                            <div className="flex items-center">
                                <div className="w-3 h-3 bg-green-500 rounded-full mr-3"></div>
                                <span className="font-medium text-gray-700">Closed</span>
                            </div>
                            <span className="text-2xl font-bold text-green-600">{stats?.leads.closed || 0}</span>
                        </div>
                        <div className="mt-4 pt-4 border-t border-gray-200">
                            <div className="flex justify-between items-center">
                                <span className="text-lg font-semibold text-gray-800">Total Leads</span>
                                <span className="text-3xl font-bold text-gray-800">{stats?.leads.total || 0}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Additional Stats Section */}
            <div className="grid md:grid-cols-3 gap-6">
                <div className="bg-white p-6 rounded-lg shadow-lg border border-gray-200">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="font-bold text-lg text-gray-800">Conversion Rate</h3>
                        <svg className="w-8 h-8 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M12 7a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0V8.414l-4.293 4.293a1 1 0 01-1.414 0L8 10.414l-4.293 4.293a1 1 0 01-1.414-1.414l5-5a1 1 0 011.414 0L11 10.586 14.586 7H12z" clipRule="evenodd"></path>
                        </svg>
                    </div>
                    <p className="text-4xl font-bold text-green-600 mb-2">
                        {stats?.leads.total > 0
                            ? ((stats?.leads.closed / stats?.leads.total) * 100).toFixed(1)
                            : 0}%
                    </p>
                    <p className="text-sm text-gray-600">
                        {stats?.leads.closed || 0} out of {stats?.leads.total || 0} leads converted
                    </p>
                    <div className="mt-4 bg-gray-200 rounded-full h-2">
                        <div
                            className="bg-green-500 h-2 rounded-full transition-all duration-500"
                            style={{ width: `${stats?.leads.total > 0 ? (stats?.leads.closed / stats?.leads.total) * 100 : 0}%` }}
                        ></div>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-lg shadow-lg border border-gray-200">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="font-bold text-lg text-gray-800">Sales Progress</h3>
                        <svg className="w-8 h-8 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M2 11a1 1 0 011-1h2a1 1 0 011 1v5a1 1 0 01-1 1H3a1 1 0 01-1-1v-5zM8 7a1 1 0 011-1h2a1 1 0 011 1v9a1 1 0 01-1 1H9a1 1 0 01-1-1V7zM14 4a1 1 0 011-1h2a1 1 0 011 1v12a1 1 0 01-1 1h-2a1 1 0 01-1-1V4z"></path>
                        </svg>
                    </div>
                    <p className="text-4xl font-bold text-blue-600 mb-2">
                        {stats?.plots.total > 0
                            ? (((stats?.plots.sold + stats?.plots.reserved) / stats?.plots.total) * 100).toFixed(1)
                            : 0}%
                    </p>
                    <p className="text-sm text-gray-600">
                        Sold + Reserved plots
                    </p>
                    <div className="mt-4 bg-gray-200 rounded-full h-2">
                        <div
                            className="bg-blue-500 h-2 rounded-full transition-all duration-500"
                            style={{ width: `${stats?.plots.total > 0 ? ((stats?.plots.sold + stats?.plots.reserved) / stats?.plots.total) * 100 : 0}%` }}
                        ></div>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-lg shadow-lg border border-gray-200">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="font-bold text-lg text-gray-800">Active Leads</h3>
                        <svg className="w-8 h-8 text-purple-500" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z"></path>
                        </svg>
                    </div>
                    <p className="text-4xl font-bold text-purple-600 mb-2">
                        {(stats?.leads.new || 0) + (stats?.leads.contacted || 0) + (stats?.leads.interested || 0)}
                    </p>
                    <p className="text-sm text-gray-600">
                        Leads in pipeline
                    </p>
                    <div className="mt-4 space-y-1 text-xs text-gray-500">
                        <div className="flex justify-between">
                            <span>New:</span>
                            <span className="font-medium">{stats?.leads.new || 0}</span>
                        </div>
                        <div className="flex justify-between">
                            <span>Contacted:</span>
                            <span className="font-medium">{stats?.leads.contacted || 0}</span>
                        </div>
                        <div className="flex justify-between">
                            <span>Interested:</span>
                            <span className="font-medium">{stats?.leads.interested || 0}</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-gradient-to-r from-indigo-500 to-purple-600 p-6 rounded-lg shadow-lg text-white">
                <h3 className="font-bold text-xl mb-4">Quick Actions</h3>
                <div className="grid md:grid-cols-4 gap-4">
                    <button className="bg-white bg-opacity-20 hover:bg-opacity-30 backdrop-blur-sm p-4 rounded-lg transition-all transform hover:scale-105">
                        <svg className="w-8 h-8 mx-auto mb-2" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd"></path>
                        </svg>
                        <span className="text-sm font-medium">Add New Plot</span>
                    </button>
                    <button className="bg-white bg-opacity-20 hover:bg-opacity-30 backdrop-blur-sm p-4 rounded-lg transition-all transform hover:scale-105">
                        <svg className="w-8 h-8 mx-auto mb-2" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M8 9a3 3 0 100-6 3 3 0 000 6zM8 11a6 6 0 016 6H2a6 6 0 016-6zM16 7a1 1 0 10-2 0v1h-1a1 1 0 100 2h1v1a1 1 0 102 0v-1h1a1 1 0 100-2h-1V7z"></path>
                        </svg>
                        <span className="text-sm font-medium">Add Lead</span>
                    </button>
                    <button className="bg-white bg-opacity-20 hover:bg-opacity-30 backdrop-blur-sm p-4 rounded-lg transition-all transform hover:scale-105">
                        <svg className="w-8 h-8 mx-auto mb-2" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd"></path>
                        </svg>
                        <span className="text-sm font-medium">View Reports</span>
                    </button>
                    <button className="bg-white bg-opacity-20 hover:bg-opacity-30 backdrop-blur-sm p-4 rounded-lg transition-all transform hover:scale-105">
                        <svg className="w-8 h-8 mx-auto mb-2" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd"></path>
                        </svg>
                        <span className="text-sm font-medium">Settings</span>
                    </button>
                </div>
            </div>
        </div>
    );
}
