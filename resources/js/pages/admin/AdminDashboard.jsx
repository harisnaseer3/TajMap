import React, { useEffect, useState } from 'react';
import { dashboardService } from '../../services/api';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, PieChart, Pie, Cell } from 'recharts';

const COLORS = ['#22c55e', '#fbbf24', '#ef4444'];

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

    if (loading) return <div>Loading...</div>;

    return (
        <div>
            <h1 className="text-2xl font-bold mb-6">Dashboard</h1>
            <div className="grid md:grid-cols-4 gap-6 mb-6">
                <div className="bg-white p-6 rounded-lg shadow">
                    <h3 className="text-sm text-gray-600">Total Plots</h3>
                    <p className="text-3xl font-bold">{stats?.plots.total || 0}</p>
                </div>
                <div className="bg-green-100 p-6 rounded-lg shadow">
                    <h3 className="text-sm text-gray-600">Available</h3>
                    <p className="text-3xl font-bold text-green-600">{stats?.plots.available || 0}</p>
                </div>
                <div className="bg-yellow-100 p-6 rounded-lg shadow">
                    <h3 className="text-sm text-gray-600">Reserved</h3>
                    <p className="text-3xl font-bold text-yellow-600">{stats?.plots.reserved || 0}</p>
                </div>
                <div className="bg-red-100 p-6 rounded-lg shadow">
                    <h3 className="text-sm text-gray-600">Sold</h3>
                    <p className="text-3xl font-bold text-red-600">{stats?.plots.sold || 0}</p>
                </div>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
                <div className="bg-white p-6 rounded-lg shadow">
                    <h3 className="font-bold text-lg mb-4">Plot Distribution</h3>
                    {stats?.plots.by_status && (
                        <PieChart width={400} height={300}>
                            <Pie data={stats.plots.by_status} dataKey="count" nameKey="status" cx="50%" cy="50%" outerRadius={80}>
                                {stats.plots.by_status.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                ))}
                            </Pie>
                            <Tooltip />
                            <Legend />
                        </PieChart>
                    )}
                </div>

                <div className="bg-white p-6 rounded-lg shadow">
                    <h3 className="font-bold text-lg mb-4">Lead Statistics</h3>
                    <div className="space-y-2">
                        <p>Total Leads: <span className="font-bold">{stats?.leads.total || 0}</span></p>
                        <p>New: <span className="font-bold">{stats?.leads.new || 0}</span></p>
                        <p>Contacted: <span className="font-bold">{stats?.leads.contacted || 0}</span></p>
                        <p>Interested: <span className="font-bold">{stats?.leads.interested || 0}</span></p>
                        <p>Closed: <span className="font-bold">{stats?.leads.closed || 0}</span></p>
                    </div>
                </div>
            </div>
        </div>
    );
}
