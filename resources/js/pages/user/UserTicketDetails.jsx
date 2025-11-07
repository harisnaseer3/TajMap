import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { ticketService } from '../../services/api';
import { useAuthStore } from '../../store/authStore';
import toast from 'react-hot-toast';

export default function UserTicketDetails() {
    const { id } = useParams();
    const navigate = useNavigate();
    const user = useAuthStore(state => state.user);
    const [ticket, setTicket] = useState(null);
    const [loading, setLoading] = useState(true);
    const [replyMessage, setReplyMessage] = useState('');
    const [submitting, setSubmitting] = useState(false);

    const fetchTicket = async () => {
        try {
            setLoading(true);
            const response = await ticketService.getOne(id);
            setTicket(response.data);
        } catch (error) {
            toast.error('Failed to load ticket');
            navigate('/user/tickets');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchTicket();
    }, [id]);

    const handleSubmitReply = async (e) => {
        e.preventDefault();
        if (!replyMessage.trim()) return;

        try {
            setSubmitting(true);
            await ticketService.addReply(id, replyMessage);
            toast.success('Reply added successfully');
            setReplyMessage('');
            fetchTicket();
        } catch (error) {
            toast.error('Failed to add reply');
        } finally {
            setSubmitting(false);
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
            <div className="max-w-4xl mx-auto">
                <div className="mb-6">
                    <Link to="/user/tickets" className="text-blue-600 hover:underline">
                        &larr; Back to Tickets
                    </Link>
                </div>

                {/* Ticket Header */}
                <div className="bg-white p-6 rounded-lg shadow mb-6">
                    <div className="flex justify-between items-start mb-4">
                        <h1 className="text-2xl font-bold">{ticket.subject}</h1>
                        <div className="flex gap-2">
                            <span className={`px-3 py-1 rounded-full text-xs font-medium ${getPriorityColor(ticket.priority)}`}>
                                {ticket.priority}
                            </span>
                            <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(ticket.status)}`}>
                                {ticket.status.replace('_', ' ')}
                            </span>
                        </div>
                    </div>
                    <p className="text-gray-700 whitespace-pre-wrap">{ticket.description}</p>
                    <div className="mt-4 text-sm text-gray-500">
                        <p>Created: {new Date(ticket.created_at).toLocaleString()}</p>
                        {ticket.admin_user && (
                            <p>Assigned to: {ticket.admin_user.name}</p>
                        )}
                    </div>
                </div>

                {/* Replies */}
                <div className="bg-white p-6 rounded-lg shadow mb-6">
                    <h2 className="text-xl font-bold mb-4">Replies ({ticket.replies?.length || 0})</h2>
                    <div className="space-y-4">
                        {ticket.replies && ticket.replies.length > 0 ? (
                            [...ticket.replies].reverse().map((reply) => (
                                <div key={reply.id} className="border-l-4 border-gray-300 pl-4 py-2">
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
                {ticket.status !== 'closed' && (
                    <div className="bg-white p-6 rounded-lg shadow">
                        <h2 className="text-xl font-bold mb-4">Add Reply</h2>
                        <form onSubmit={handleSubmitReply}>
                            <textarea
                                className="w-full border rounded-lg px-4 py-2 mb-4"
                                rows="4"
                                placeholder="Type your message..."
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
                )}
            </div>
        </div>
    );
}
