import { Link } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { savedPlotService, ticketService } from '../../services/api';
import React, { useState, useEffect } from "react";
import {
    BookmarkIcon,
    TicketIcon,
    MapIcon,
    PlusCircleIcon,
    ChartBarIcon,
    ClockIcon,
    CheckCircleIcon,
    ExclamationCircleIcon,
    InformationCircleIcon
} from '@heroicons/react/24/outline';

export default function UserDashboard() {
    const user = useAuthStore(state => state.user);
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({
        savedPlots: 0,
        totalTickets: 0,
        openTickets: 0,
        resolvedTickets: 0
    });
    const [recentTickets, setRecentTickets] = useState([]);
    const [savedPlots, setSavedPlots] = useState([]);

    useEffect(() => {
        fetchDashboardData();
    }, []);

    const fetchDashboardData = async () => {
        try {
            setLoading(true);

            // Fetch saved plots
            const savedPlotsResponse = await savedPlotService.getAll();

            // Handle paginated response - data might be in response.data.data or response.data
            let savedPlotsData = [];
            if (Array.isArray(savedPlotsResponse.data)) {
                savedPlotsData = savedPlotsResponse.data;
            } else if (savedPlotsResponse.data?.data && Array.isArray(savedPlotsResponse.data.data)) {
                savedPlotsData = savedPlotsResponse.data.data;
            }

            setSavedPlots(savedPlotsData.slice(0, 3)); // Get first 3

            // Fetch tickets
            const ticketsResponse = await ticketService.getAll({ per_page: 5 });
            const ticketsData = ticketsResponse.data?.data || [];
            setRecentTickets(ticketsData);

            // Fetch all tickets to get accurate counts
            const allTicketsResponse = await ticketService.getAll({ per_page: 1000 });
            const allTicketsData = allTicketsResponse.data?.data || [];

            // Calculate stats from all tickets
            const openTicketsCount = allTicketsData.filter(t => t.status === 'open' || t.status === 'in_progress').length;
            const resolvedTicketsCount = allTicketsData.filter(t => t.status === 'resolved' || t.status === 'closed').length;

            setStats({
                savedPlots: savedPlotsData.length,
                totalTickets: allTicketsData.length,
                openTickets: openTicketsCount,
                resolvedTickets: resolvedTicketsCount
            });
        } catch (error) {
            console.error('Failed to fetch dashboard data:', error);
        } finally {
            setLoading(false);
        }
    };

    const getStatusBadge = (status) => {
        const colors = {
            open: 'bg-blue-100 text-blue-800',
            in_progress: 'bg-yellow-100 text-yellow-800',
            resolved: 'bg-green-100 text-green-800',
            closed: 'bg-gray-100 text-gray-800'
        };
        return colors[status] || 'bg-gray-100 text-gray-800';
    };

    const getPriorityBadge = (priority) => {
        const colors = {
            low: 'bg-gray-100 text-gray-600',
            medium: 'bg-blue-100 text-blue-600',
            high: 'bg-orange-100 text-orange-600',
            urgent: 'bg-red-100 text-red-600'
        };
        return colors[priority] || 'bg-gray-100 text-gray-600';
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-100 flex items-center justify-center">
                <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-gray-300 border-t-blue-600"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-100 p-6">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-800 mb-2">Welcome back, {user?.name}!</h1>
                    <p className="text-gray-600">Here's what's happening with your account today.</p>
                </div>

                {/* Stats Cards */}
                <div className="grid md:grid-cols-4 gap-6 mb-8">
                    <div className="bg-white p-6 rounded-lg shadow-sm border-l-4 border-blue-500">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-gray-500 text-sm font-medium">Saved Plots</p>
                                <p className="text-3xl font-bold text-gray-800 mt-2">{stats.savedPlots}</p>
                            </div>
                            <BookmarkIcon className="h-12 w-12 text-blue-500 opacity-80" />
                        </div>
                        <Link to="/user/saved-plots" className="text-blue-600 text-sm mt-4 inline-block hover:underline">
                            View all →
                        </Link>
                    </div>

                    <div className="bg-white p-6 rounded-lg shadow-sm border-l-4 border-purple-500">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-gray-500 text-sm font-medium">Total Tickets</p>
                                <p className="text-3xl font-bold text-gray-800 mt-2">{stats.totalTickets}</p>
                            </div>
                            <TicketIcon className="h-12 w-12 text-purple-500 opacity-80" />
                        </div>
                        <Link to="/user/tickets" className="text-purple-600 text-sm mt-4 inline-block hover:underline">
                            View all →
                        </Link>
                    </div>

                    <div className="bg-white p-6 rounded-lg shadow-sm border-l-4 border-yellow-500">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-gray-500 text-sm font-medium">Open Tickets</p>
                                <p className="text-3xl font-bold text-gray-800 mt-2">{stats.openTickets}</p>
                            </div>
                            <ClockIcon className="h-12 w-12 text-yellow-500 opacity-80" />
                        </div>
                        <Link to="/user/tickets?status=open" className="text-yellow-600 text-sm mt-4 inline-block hover:underline">
                            View open →
                        </Link>
                    </div>

                    <div className="bg-white p-6 rounded-lg shadow-sm border-l-4 border-green-500">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-gray-500 text-sm font-medium">Resolved</p>
                                <p className="text-3xl font-bold text-gray-800 mt-2">{stats.resolvedTickets}</p>
                            </div>
                            <CheckCircleIcon className="h-12 w-12 text-green-500 opacity-80" />
                        </div>
                        <Link to="/user/tickets?status=resolved" className="text-green-600 text-sm mt-4 inline-block hover:underline">
                            View resolved →
                        </Link>
                    </div>
                </div>

                {/* Quick Actions */}
                <div className="grid md:grid-cols-3 gap-6 mb-8">
                    <Link to="/plots" className="bg-gradient-to-br from-blue-500 to-blue-600 p-6 rounded-lg shadow-lg hover:shadow-xl transition-shadow text-white group">
                        <MapIcon className="h-12 w-12 mb-4 group-hover:scale-110 transition-transform" />
                        <h2 className="text-xl font-bold mb-2">Browse Plots</h2>
                        <p className="text-blue-100">Explore available plots and find your perfect property</p>
                    </Link>

                    <Link to="/user/tickets/create" className="bg-gradient-to-br from-purple-500 to-purple-600 p-6 rounded-lg shadow-lg hover:shadow-xl transition-shadow text-white group">
                        <PlusCircleIcon className="h-12 w-12 mb-4 group-hover:scale-110 transition-transform" />
                        <h2 className="text-xl font-bold mb-2">Create Ticket</h2>
                        <p className="text-purple-100">Need help? Submit a support ticket and we'll assist you</p>
                    </Link>

                    <Link to="/map" className="bg-gradient-to-br from-green-500 to-green-600 p-6 rounded-lg shadow-lg hover:shadow-xl transition-shadow text-white group">
                        <ChartBarIcon className="h-12 w-12 mb-4 group-hover:scale-110 transition-transform" />
                        <h2 className="text-xl font-bold mb-2">Interactive Map</h2>
                        <p className="text-green-100">View all plots on an interactive map with detailed info</p>
                    </Link>
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                    {/* Recent Tickets */}
                    <div className="bg-white p-6 rounded-lg shadow-sm">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-xl font-bold text-gray-800">Recent Tickets</h2>
                            <Link to="/user/tickets" className="text-blue-600 text-sm hover:underline">
                                View all →
                            </Link>
                        </div>
                        {recentTickets.length > 0 ? (
                            <div className="space-y-4">
                                {recentTickets.map((ticket) => (
                                    <Link
                                        key={ticket.id}
                                        to={`/user/tickets/${ticket.id}`}
                                        className="block p-4 border border-gray-200 rounded-lg hover:border-blue-300 hover:bg-blue-50 transition"
                                    >
                                        <div className="flex items-start justify-between mb-2">
                                            <h3 className="font-semibold text-gray-800 flex-1">{ticket.subject}</h3>
                                            <div className="flex gap-2 ml-4">
                                                <span className={`px-2 py-1 rounded text-xs font-medium ${getPriorityBadge(ticket.priority)}`}>
                                                    {ticket.priority}
                                                </span>
                                                <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusBadge(ticket.status)}`}>
                                                    {ticket.status.replace('_', ' ')}
                                                </span>
                                            </div>
                                        </div>
                                        <p className="text-sm text-gray-600 line-clamp-1 mb-2">{ticket.description}</p>
                                        <p className="text-xs text-gray-500">
                                            Created {new Date(ticket.created_at).toLocaleDateString()} • {ticket.replies_count || 0} replies
                                        </p>
                                    </Link>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-12">
                                <TicketIcon className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                                <p className="text-gray-500 mb-4">You don't have any tickets yet</p>
                                <Link
                                    to="/user/tickets/create"
                                    className="inline-block bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
                                >
                                    Create Your First Ticket
                                </Link>
                            </div>
                        )}
                    </div>

                    {/* Saved Plots & Help Section */}
                    <div className="space-y-6">
                        {/* Saved Plots Preview */}
                        <div className="bg-white p-6 rounded-lg shadow-sm">
                            <div className="flex items-center justify-between mb-6">
                                <h2 className="text-xl font-bold text-gray-800">Saved Plots</h2>
                                <Link to="/user/saved-plots" className="text-blue-600 text-sm hover:underline">
                                    View all →
                                </Link>
                            </div>
                            {savedPlots.length > 0 ? (
                                <div className="space-y-3">
                                    {savedPlots.map((item) => (
                                        <div key={item.id} className="flex items-center p-3 border border-gray-200 rounded-lg">
                                            <div className="bg-blue-100 p-3 rounded-lg mr-4">
                                                <MapIcon className="h-6 w-6 text-blue-600" />
                                            </div>
                                            <div className="flex-1">
                                                <p className="font-semibold text-gray-800">{item.plot?.plot_number || 'Plot'}</p>
                                                <p className="text-sm text-gray-500">{item.plot?.sector} - {item.plot?.block}</p>
                                            </div>
                                            <Link
                                                to={`/plots/${item.plot?.id}`}
                                                className="text-blue-600 text-sm hover:underline"
                                            >
                                                View
                                            </Link>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-8">
                                    <BookmarkIcon className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                                    <p className="text-gray-500 mb-3">No saved plots yet</p>
                                    <Link to="/plots" className="text-blue-600 hover:underline text-sm">
                                        Browse plots to get started
                                    </Link>
                                </div>
                            )}
                        </div>

                        {/* Help & Information */}
                        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-6 rounded-lg border border-blue-200">
                            <div className="flex items-start">
                                <InformationCircleIcon className="h-6 w-6 text-blue-600 mr-3 mt-1 flex-shrink-0" />
                                <div>
                                    <h3 className="font-bold text-gray-800 mb-2">Need Help?</h3>
                                    <p className="text-sm text-gray-600 mb-4">
                                        Our support team is here to help you find the perfect plot. Create a ticket if you have any questions or need assistance.
                                    </p>
                                    <Link
                                        to="/user/tickets/create"
                                        className="inline-block bg-blue-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-700 transition"
                                    >
                                        Contact Support
                                    </Link>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
