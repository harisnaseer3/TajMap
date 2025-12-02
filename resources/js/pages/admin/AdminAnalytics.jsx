import React, { useEffect, useState } from 'react';
import { analyticsService } from '../../services/api';
import toast from 'react-hot-toast';

export default function AdminAnalytics() {
    const [loading, setLoading] = useState(true);
    const [dashboardData, setDashboardData] = useState(null);
    const [monthlyTrends, setMonthlyTrends] = useState(null);
    const [adminPerformance, setAdminPerformance] = useState(null);
    const [plotDistribution, setPlotDistribution] = useState(null);
    const [selectedMonths, setSelectedMonths] = useState(6);

    useEffect(() => {
        fetchAllData();
    }, [selectedMonths]);

    const fetchAllData = async () => {
        try {
            setLoading(true);

            const [dashboardRes, trendsRes, performanceRes, distributionRes] = await Promise.all([
                analyticsService.dashboard(),
                analyticsService.monthlyTrends(selectedMonths),
                analyticsService.adminPerformance(),
                analyticsService.plotDistribution(),
            ]);

            setDashboardData(dashboardRes.data);
            setMonthlyTrends(trendsRes.data);
            setAdminPerformance(performanceRes.data);
            setPlotDistribution(distributionRes.data);
        } catch (error) {
            console.error('Error fetching analytics:', error);
            toast.error('Failed to load analytics data');
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="text-lg text-gray-600">Loading analytics...</div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold">Analytics Dashboard</h1>
                <select
                    value={selectedMonths}
                    onChange={(e) => setSelectedMonths(Number(e.target.value))}
                    className="px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                    <option value={3}>Last 3 Months</option>
                    <option value={6}>Last 6 Months</option>
                    <option value={12}>Last 12 Months</option>
                </select>
            </div>

            {/* Key Metrics Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <MetricCard
                    title="Total Plots"
                    value={dashboardData?.plots?.total || 0}
                    icon="📊"
                    color="blue"
                />
                <MetricCard
                    title="Available Plots"
                    value={dashboardData?.plots?.available || 0}
                    icon="✅"
                    color="green"
                />
                <MetricCard
                    title="Total Leads"
                    value={dashboardData?.leads?.total || 0}
                    icon="👥"
                    color="purple"
                />
                <MetricCard
                    title="Closed Leads"
                    value={dashboardData?.leads?.closed || 0}
                    icon="🎯"
                    color="orange"
                />
            </div>

            {/* Plot Status Distribution */}
            <div className="bg-white p-6 rounded-lg shadow">
                <h2 className="text-xl font-bold mb-4">Plot Status Distribution</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {dashboardData?.plots?.by_status?.map((item) => (
                        <div key={item.status} className="text-center">
                            <div className="text-3xl font-bold text-blue-600">{item.count}</div>
                            <div className="text-gray-600">{item.status}</div>
                            <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                                <div
                                    className="bg-blue-600 h-2 rounded-full"
                                    style={{
                                        width: `${(item.count / (dashboardData?.plots?.total || 1)) * 100}%`,
                                    }}
                                />
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Lead Status Distribution */}
            <div className="bg-white p-6 rounded-lg shadow">
                <h2 className="text-xl font-bold mb-4">Lead Status Distribution</h2>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    {dashboardData?.leads?.by_status?.map((item) => (
                        <div key={item.status} className="text-center">
                            <div className="text-3xl font-bold text-purple-600">{item.count}</div>
                            <div className="text-gray-600">{item.status}</div>
                            <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                                <div
                                    className={`h-2 rounded-full ${getLeadStatusColor(item.status)}`}
                                    style={{
                                        width: `${(item.count / (dashboardData?.leads?.total || 1)) * 100}%`,
                                    }}
                                />
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Monthly Trends */}
            <div className="bg-white p-6 rounded-lg shadow">
                <h2 className="text-xl font-bold mb-4">Monthly Trends</h2>
                {monthlyTrends?.lead_trends && monthlyTrends.lead_trends.length > 0 ? (
                    <div className="space-y-4">
                        <div className="flex items-end space-x-2 h-64">
                            {monthlyTrends.lead_trends.map((trend, index) => {
                                const maxCount = Math.max(...monthlyTrends.lead_trends.map(t => t.count));
                                const height = (trend.count / maxCount) * 100;
                                return (
                                    <div key={index} className="flex-1 flex flex-col items-center">
                                        <div className="text-xs text-gray-600 mb-1">{trend.count}</div>
                                        <div
                                            className="w-full bg-blue-500 rounded-t hover:bg-blue-600 transition-all"
                                            style={{ height: `${height}%` }}
                                            title={`${trend.month}: ${trend.count} leads`}
                                        />
                                        <div className="text-xs text-gray-500 mt-2 transform -rotate-45 origin-top-left">
                                            {trend.month}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                        <div className="text-center text-sm text-gray-600">
                            Lead Generation Over Time
                        </div>
                    </div>
                ) : (
                    <div className="text-center text-gray-500 py-8">No trend data available</div>
                )}
            </div>

            {/* Admin Performance */}
            <div className="bg-white p-6 rounded-lg shadow">
                <h2 className="text-xl font-bold mb-4">Admin Performance</h2>
                {adminPerformance?.admins && adminPerformance.admins.length > 0 ? (
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total Leads</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">New</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Contacted</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Interested</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Closed</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Conversion Rate</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {adminPerformance.admins.map((admin) => (
                                    <tr key={admin.id} className="hover:bg-gray-50">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm font-medium text-gray-900">{admin.name}</div>
                                            <div className="text-sm text-gray-500">{admin.email}</div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                            {admin.total_leads}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                            {admin.new_leads}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                            {admin.contacted_leads}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                            {admin.interested_leads}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                            {admin.closed_leads}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                                admin.conversion_rate >= 50 ? 'bg-green-100 text-green-800' :
                                                admin.conversion_rate >= 25 ? 'bg-yellow-100 text-yellow-800' :
                                                'bg-red-100 text-red-800'
                                            }`}>
                                                {admin.conversion_rate}%
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <div className="text-center text-gray-500 py-8">No admin performance data available</div>
                )}
            </div>

            {/* Plot Distribution */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white p-6 rounded-lg shadow">
                    <h2 className="text-xl font-bold mb-4">Plots by Sector</h2>
                    {plotDistribution?.by_sector && plotDistribution.by_sector.length > 0 ? (
                        <div className="space-y-3">
                            {plotDistribution.by_sector.map((item) => (
                                <div key={item.sector}>
                                    <div className="flex justify-between text-sm mb-1">
                                        <span className="font-medium">Sector {item.sector}</span>
                                        <span className="text-gray-600">{item.count} plots</span>
                                    </div>
                                    <div className="w-full bg-gray-200 rounded-full h-3">
                                        <div
                                            className="bg-green-500 h-3 rounded-full"
                                            style={{
                                                width: `${(item.count / Math.max(...plotDistribution.by_sector.map(s => s.count))) * 100}%`,
                                            }}
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center text-gray-500 py-8">No sector data available</div>
                    )}
                </div>

                <div className="bg-white p-6 rounded-lg shadow">
                    <h2 className="text-xl font-bold mb-4">Plots by Street (Top 10)</h2>
                    {plotDistribution?.by_street && plotDistribution.by_street.length > 0 ? (
                        <div className="space-y-3">
                            {plotDistribution.by_street.map((item) => (
                                <div key={item.street}>
                                    <div className="flex justify-between text-sm mb-1">
                                        <span className="font-medium">Street {item.street}</span>
                                        <span className="text-gray-600">{item.count} plots</span>
                                    </div>
                                    <div className="w-full bg-gray-200 rounded-full h-3">
                                        <div
                                            className="bg-blue-500 h-3 rounded-full"
                                            style={{
                                                width: `${(item.count / Math.max(...plotDistribution.by_street.map(b => b.count))) * 100}%`,
                                            }}
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center text-gray-500 py-8">No street data available</div>
                    )}
                </div>

                <div className="bg-white p-6 rounded-lg shadow">
                    <h2 className="text-xl font-bold mb-4">Plots by Type</h2>
                    {plotDistribution?.by_type && plotDistribution.by_type.length > 0 ? (
                        <div className="space-y-3">
                            {plotDistribution.by_type.map((item) => (
                                <div key={item.type}>
                                    <div className="flex justify-between text-sm mb-1">
                                        <span className="font-medium">{item.type}</span>
                                        <span className="text-gray-600">{item.count} plots</span>
                                    </div>
                                    <div className="w-full bg-gray-200 rounded-full h-3">
                                        <div
                                            className="bg-purple-500 h-3 rounded-full"
                                            style={{
                                                width: `${(item.count / Math.max(...plotDistribution.by_type.map(t => t.count))) * 100}%`,
                                            }}
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center text-gray-500 py-8">No type data available</div>
                    )}
                </div>

                <div className="bg-white p-6 rounded-lg shadow">
                    <h2 className="text-xl font-bold mb-4">Plots by Category</h2>
                    {plotDistribution?.by_category && plotDistribution.by_category.length > 0 ? (
                        <div className="space-y-3">
                            {plotDistribution.by_category.map((item) => (
                                <div key={item.category}>
                                    <div className="flex justify-between text-sm mb-1">
                                        <span className="font-medium">{item.category}</span>
                                        <span className="text-gray-600">{item.count} plots</span>
                                    </div>
                                    <div className="w-full bg-gray-200 rounded-full h-3">
                                        <div
                                            className="bg-orange-500 h-3 rounded-full"
                                            style={{
                                                width: `${(item.count / Math.max(...plotDistribution.by_category.map(c => c.count))) * 100}%`,
                                            }}
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center text-gray-500 py-8">No category data available</div>
                    )}
                </div>
            </div>
        </div>
    );
}

// Metric Card Component
function MetricCard({ title, value, icon, color }) {
    const colorClasses = {
        blue: 'bg-blue-50 text-blue-600',
        green: 'bg-green-50 text-green-600',
        purple: 'bg-purple-50 text-purple-600',
        orange: 'bg-orange-50 text-orange-600',
    };

    return (
        <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center justify-between">
                <div>
                    <p className="text-sm text-gray-600 mb-1">{title}</p>
                    <p className="text-3xl font-bold">{value}</p>
                </div>
                <div className={`text-4xl ${colorClasses[color]}`}>
                    {icon}
                </div>
            </div>
        </div>
    );
}

// Helper function for lead status colors
function getLeadStatusColor(status) {
    const colors = {
        'New': 'bg-blue-500',
        'Contacted': 'bg-yellow-500',
        'Interested': 'bg-green-500',
        'Closed': 'bg-gray-500',
    };
    return colors[status] || 'bg-gray-500';
}
