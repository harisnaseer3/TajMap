import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ticketService } from '../../services/api';
import toast from 'react-hot-toast';

export default function AdminTickets() {
    const [tickets, setTickets] = useState([]);
    const [loading, setLoading] = useState(true);
    const [statistics, setStatistics] = useState(null);
    const [filters, setFilters] = useState({
        status: '',
        priority: '',
        admin_user_id: '',
        search: '',
    });
    const [pagination, setPagination] = useState({
        current_page: 1,
        last_page: 1,
        total: 0,
    });

    const fetchTickets = async (page = 1) => {
        try {
            setLoading(true);
            const response = await ticketService.adminGetAll({
                ...filters,
                page,
                per_page: 20,
            });
            setTickets(response.data.data);
            setPagination(response.data.meta || response.data.pagination);
        } catch (error) {
            toast.error('Failed to load tickets');
        } finally {
            setLoading(false);
        }
    };

    const fetchStatistics = async () => {
        try {
            const response = await ticketService.adminGetStatistics();
            setStatistics(response.data);
        } catch (error) {
            console.error('Failed to load statistics');
        }
    };

    useEffect(() => {
        fetchTickets();
        fetchStatistics();
    }, [filters]);

    const getStatusColor = (status) => {
        switch (status) {
            case 'open': return 'bg-blue-100 text-blue-800';
            case 'in_progress': return 'bg-yellow-100 text-yellow-800';
            case 'resolved': return 'bg-green-100 text-green-800';
            case 'closed': return 'bg-gray-100 text-gray-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    const getPriorityColor = (priority) => {
        switch (priority) {
            case 'low': return 'bg-gray-100 text-gray-800';
            case 'medium': return 'bg-blue-100 text-blue-800';
            case 'high': return 'bg-orange-100 text-orange-800';
            case 'urgent': return 'bg-red-100 text-red-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    return (
        <div className="min-h-screen bg-gray-100 p-6">
            <div className="max-w-7xl mx-auto">
                <h1 className="text-3xl font-bold mb-6">Ticket Management</h1>

                {/* Statistics */}
                {statistics && (
                    <div className="grid md:grid-cols-5 gap-4 mb-6">
                        <div className="bg-white p-4 rounded-lg shadow">
                            <p className="text-gray-600 text-sm">Total Tickets</p>
                            <p className="text-2xl font-bold">{statistics.total}</p>
                        </div>
                        <div className="bg-blue-50 p-4 rounded-lg shadow">
                            <p className="text-gray-600 text-sm">Open</p>
                            <p className="text-2xl font-bold text-blue-600">{statistics.open}</p>
                        </div>
                        <div className="bg-yellow-50 p-4 rounded-lg shadow">
                            <p className="text-gray-600 text-sm">In Progress</p>
                            <p className="text-2xl font-bold text-yellow-600">{statistics.in_progress}</p>
                        </div>
                        <div className="bg-green-50 p-4 rounded-lg shadow">
                            <p className="text-gray-600 text-sm">Resolved</p>
                            <p className="text-2xl font-bold text-green-600">{statistics.resolved}</p>
                        </div>
                        <div className="bg-orange-50 p-4 rounded-lg shadow">
                            <p className="text-gray-600 text-sm">Unassigned</p>
                            <p className="text-2xl font-bold text-orange-600">{statistics.unassigned}</p>
                        </div>
                    </div>
                )}

                {/* Filters */}
                <div className="bg-white p-4 rounded-lg shadow mb-6">
                    <div className="grid md:grid-cols-4 gap-4">
                        <input
                            type="text"
                            placeholder="Search tickets..."
                            className="border rounded-lg px-4 py-2"
                            value={filters.search}
                            onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                        />
                        <select
                            className="border rounded-lg px-4 py-2"
                            value={filters.status}
                            onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                        >
                            <option value="">All Status</option>
                            <option value="open">Open</option>
                            <option value="in_progress">In Progress</option>
                            <option value="resolved">Resolved</option>
                            <option value="closed">Closed</option>
                        </select>
                        <select
                            className="border rounded-lg px-4 py-2"
                            value={filters.priority}
                            onChange={(e) => setFilters({ ...filters, priority: e.target.value })}
                        >
                            <option value="">All Priorities</option>
                            <option value="low">Low</option>
                            <option value="medium">Medium</option>
                            <option value="high">High</option>
                            <option value="urgent">Urgent</option>
                        </select>
                        <select
                            className="border rounded-lg px-4 py-2"
                            value={filters.admin_user_id}
                            onChange={(e) => setFilters({ ...filters, admin_user_id: e.target.value })}
                        >
                            <option value="">All Assignments</option>
                            <option value="unassigned">Unassigned</option>
                        </select>
                    </div>
                </div>

                {/* Tickets List */}
                {loading ? (
                    <div className="text-center py-12">
                        <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-gray-300 border-t-blue-600"></div>
                    </div>
                ) : tickets.length === 0 ? (
                    <div className="bg-white p-12 rounded-lg shadow text-center">
                        <p className="text-gray-500">No tickets found</p>
                    </div>
                ) : (
                    <div className="bg-white rounded-lg shadow overflow-hidden">
                        <table className="w-full">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">ID</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Subject</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">User</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Priority</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Assigned</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Created</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200">
                                {tickets.map((ticket) => (
                                    <tr key={ticket.id} className="hover:bg-gray-50">
                                        <td className="px-6 py-4 text-sm">#{ticket.id}</td>
                                        <td className="px-6 py-4">
                                            <div className="text-sm font-medium text-gray-900">{ticket.subject}</div>
                                            <div className="text-sm text-gray-500 line-clamp-1">{ticket.description}</div>
                                        </td>
                                        <td className="px-6 py-4 text-sm">{ticket.user?.name}</td>
                                        <td className="px-6 py-4">
                                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(ticket.priority)}`}>
                                                {ticket.priority}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(ticket.status)}`}>
                                                {ticket.status.replace('_', ' ')}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-sm">
                                            {ticket.admin_user ? ticket.admin_user.name : <span className="text-gray-400">Unassigned</span>}
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-500">
                                            {new Date(ticket.created_at).toLocaleDateString()}
                                        </td>
                                        <td className="px-6 py-4">
                                            <Link
                                                to={`/admin/tickets/${ticket.id}`}
                                                className="text-blue-600 hover:underline text-sm"
                                            >
                                                View
                                            </Link>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

                {/* Pagination */}
                {pagination.last_page > 1 && (
                    <div className="mt-6 flex justify-center gap-2">
                        {Array.from({ length: pagination.last_page }, (_, i) => i + 1).map((page) => (
                            <button
                                key={page}
                                onClick={() => fetchTickets(page)}
                                className={`px-4 py-2 rounded ${
                                    page === pagination.current_page
                                        ? 'bg-blue-600 text-white'
                                        : 'bg-white text-gray-700 hover:bg-gray-100'
                                }`}
                            >
                                {page}
                            </button>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
