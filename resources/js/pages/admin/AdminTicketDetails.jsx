import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { ticketService, userService } from '../../services/api';
import { useAuthStore } from '../../store/authStore';
import toast from 'react-hot-toast';

export default function AdminTicketDetails() {
    const { id } = useParams();
    const navigate = useNavigate();
    const user = useAuthStore(state => state.user);
    const [ticket, setTicket] = useState(null);
    const [loading, setLoading] = useState(true);
    const [admins, setAdmins] = useState([]);
    const [replyMessage, setReplyMessage] = useState('');
    const [submitting, setSubmitting] = useState(false);

    const fetchTicket = async () => {
        try {
            setLoading(true);
            const response = await ticketService.adminGetOne(id);
            setTicket(response.data);
        } catch (error) {
            toast.error('Failed to load ticket');
            navigate('/admin/tickets');
        } finally {
            setLoading(false);
        }
    };

    const fetchAdmins = async () => {
        try {
            const response = await userService.getAll({ role: 'admin' });
            setAdmins(response.data.data || response.data.items || []);
        } catch (error) {
            console.error('Failed to load admins');
        }
    };

    useEffect(() => {
        fetchTicket();
        fetchAdmins();
    }, [id]);

    const handleUpdateStatus = async (status) => {
        try {
            await ticketService.adminUpdateStatus(id, status);
            toast.success('Status updated successfully');
            fetchTicket();
        } catch (error) {
            toast.error('Failed to update status');
        }
    };

    const handleUpdatePriority = async (priority) => {
        try {
            await ticketService.adminUpdatePriority(id, priority);
            toast.success('Priority updated successfully');
            fetchTicket();
        } catch (error) {
            toast.error('Failed to update priority');
        }
    };

    const handleAssign = async (adminUserId) => {
        try {
            await ticketService.adminAssign(id, adminUserId);
            toast.success('Ticket assigned successfully');
            fetchTicket();
        } catch (error) {
            toast.error('Failed to assign ticket');
        }
    };

    const handleSubmitReply = async (e) => {
        e.preventDefault();
        if (!replyMessage.trim()) return;

        try {
            setSubmitting(true);
            await ticketService.adminAddReply(id, replyMessage);
            toast.success('Reply added successfully');
            setReplyMessage('');
            fetchTicket();
        } catch (error) {
            toast.error('Failed to add reply');
        } finally {
            setSubmitting(false);
        }
    };

    const handleDelete = async () => {
        if (!confirm('Are you sure you want to delete this ticket?')) return;

        try {
            await ticketService.adminDelete(id);
            toast.success('Ticket deleted successfully');
            navigate('/admin/tickets');
        } catch (error) {
            toast.error('Failed to delete ticket');
        }
    };

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

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-100 flex items-center justify-center">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-gray-300 border-t-blue-600"></div>
            </div>
        );
    }

    if (!ticket) return null;

    return (
        <div className="min-h-screen bg-gray-100 p-6">
            <div className="max-w-6xl mx-auto">
                <div className="mb-6">
                    <Link to="/admin/tickets" className="text-blue-600 hover:underline">
                        &larr; Back to Tickets
                    </Link>
                </div>

                <div className="grid md:grid-cols-3 gap-6">
                    {/* Main Content */}
                    <div className="md:col-span-2 space-y-6">
                        {/* Ticket Header */}
                        <div className="bg-white p-6 rounded-lg shadow">
                            <div className="flex justify-between items-start mb-4">
                                <h1 className="text-2xl font-bold">#{ticket.id} - {ticket.subject}</h1>
                                <div className="flex gap-2">
                                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${getPriorityColor(ticket.priority)}`}>
                                        {ticket.priority}
                                    </span>
                                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(ticket.status)}`}>
                                        {ticket.status.replace('_', ' ')}
                                    </span>
                                </div>
                            </div>
                            <p className="text-gray-700 whitespace-pre-wrap mb-4">{ticket.description}</p>
                            <div className="text-sm text-gray-500">
                                <p>Created by: <span className="font-semibold">{ticket.user?.name}</span> ({ticket.user?.email})</p>
                                <p>Created: {new Date(ticket.created_at).toLocaleString()}</p>
                                <p>Last updated: {new Date(ticket.updated_at).toLocaleString()}</p>
                            </div>
                        </div>

                        {/* Replies */}
                        <div className="bg-white p-6 rounded-lg shadow">
                            <h2 className="text-xl font-bold mb-4">Replies ({ticket.replies?.length || 0})</h2>
                            <div className="space-y-4">
                                {ticket.replies && ticket.replies.length > 0 ? (
                                    [...ticket.replies].reverse().map((reply) => (
                                        <div key={reply.id} className={`border-l-4 pl-4 py-2 ${
                                            reply.user.role === 'admin' ? 'border-purple-400' : 'border-gray-300'
                                        }`}>
                                            <div className="flex justify-between items-start mb-2">
                                                <div>
                                                    <span className="font-semibold">{reply.user.name}</span>
                                                    {reply.user.role === 'admin' && (
                                                        <span className="ml-2 text-xs bg-purple-100 text-purple-800 px-2 py-1 rounded">
                                                            Admin
                                                        </span>
                                                    )}
                                                </div>
                                                <span className="text-sm text-gray-500">
                                                    {new Date(reply.created_at).toLocaleString()}
                                                </span>
                                            </div>
                                            <p className="text-gray-700 whitespace-pre-wrap">{reply.message}</p>
                                        </div>
                                    ))
                                ) : (
                                    <p className="text-gray-500 text-center py-4">No replies yet</p>
                                )}
                            </div>
                        </div>

                        {/* Reply Form */}
                        <div className="bg-white p-6 rounded-lg shadow">
                            <h2 className="text-xl font-bold mb-4">Add Reply</h2>
                            <form onSubmit={handleSubmitReply}>
                                <textarea
                                    className="w-full border rounded-lg px-4 py-2 mb-4"
                                    rows="4"
                                    placeholder="Type your response..."
                                    value={replyMessage}
                                    onChange={(e) => setReplyMessage(e.target.value)}
                                    required
                                />
                                <button
                                    type="submit"
                                    disabled={submitting}
                                    className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 disabled:bg-gray-400"
                                >
                                    {submitting ? 'Sending...' : 'Send Reply'}
                                </button>
                            </form>
                        </div>
                    </div>

                    {/* Sidebar */}
                    <div className="space-y-6">
                        {/* Status Management */}
                        <div className="bg-white p-6 rounded-lg shadow">
                            <h3 className="font-bold mb-3">Status</h3>
                            <select
                                className="w-full border rounded-lg px-3 py-2"
                                value={ticket.status}
                                onChange={(e) => handleUpdateStatus(e.target.value)}
                            >
                                <option value="open">Open</option>
                                <option value="in_progress">In Progress</option>
                                <option value="resolved">Resolved</option>
                                <option value="closed">Closed</option>
                            </select>
                        </div>

                        {/* Priority Management */}
                        <div className="bg-white p-6 rounded-lg shadow">
                            <h3 className="font-bold mb-3">Priority</h3>
                            <select
                                className="w-full border rounded-lg px-3 py-2"
                                value={ticket.priority}
                                onChange={(e) => handleUpdatePriority(e.target.value)}
                            >
                                <option value="low">Low</option>
                                <option value="medium">Medium</option>
                                <option value="high">High</option>
                                <option value="urgent">Urgent</option>
                            </select>
                        </div>

                        {/* Assignment */}
                        <div className="bg-white p-6 rounded-lg shadow">
                            <h3 className="font-bold mb-3">Assigned To</h3>
                            <select
                                className="w-full border rounded-lg px-3 py-2"
                                value={ticket.admin_user_id || ''}
                                onChange={(e) => handleAssign(e.target.value)}
                            >
                                <option value="">Unassigned</option>
                                {admins.map((admin) => (
                                    <option key={admin.id} value={admin.id}>
                                        {admin.name}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Actions */}
                        <div className="bg-white p-6 rounded-lg shadow">
                            <h3 className="font-bold mb-3">Actions</h3>
                            <button
                                onClick={handleDelete}
                                className="w-full bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700"
                            >
                                Delete Ticket
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
