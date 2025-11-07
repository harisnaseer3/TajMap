import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ticketService } from '../../services/api';
import toast from 'react-hot-toast';

export default function CreateTicket() {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        subject: '',
        description: '',
        priority: 'medium',
    });
    const [submitting, setSubmitting] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            setSubmitting(true);
            const response = await ticketService.create(formData);
            toast.success('Ticket created successfully');
            navigate(`/user/tickets/${response.data.id}`);
        } catch (error) {
            toast.error('Failed to create ticket');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-100 p-6">
            <div className="max-w-2xl mx-auto">
                <div className="mb-6">
                    <Link to="/user/tickets" className="text-blue-600 hover:underline">
                        &larr; Back to Tickets
                    </Link>
                </div>

                <div className="bg-white p-6 rounded-lg shadow">
                    <h1 className="text-2xl font-bold mb-6">Create New Ticket</h1>
                    <form onSubmit={handleSubmit}>
                        <div className="mb-4">
                            <label className="block text-gray-700 font-semibold mb-2">
                                Subject *
                            </label>
                            <input
                                type="text"
                                className="w-full border rounded-lg px-4 py-2"
                                placeholder="Brief description of your issue"
                                value={formData.subject}
                                onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                                required
                                maxLength={255}
                            />
                        </div>

                        <div className="mb-4">
                            <label className="block text-gray-700 font-semibold mb-2">
                                Description *
                            </label>
                            <textarea
                                className="w-full border rounded-lg px-4 py-2"
                                rows="6"
                                placeholder="Detailed description of your issue..."
                                value={formData.description}
                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                required
                                maxLength={5000}
                            />
                            <p className="text-sm text-gray-500 mt-1">
                                {formData.description.length} / 5000 characters
                            </p>
                        </div>

                        <div className="mb-6">
                            <label className="block text-gray-700 font-semibold mb-2">
                                Priority
                            </label>
                            <select
                                className="w-full border rounded-lg px-4 py-2"
                                value={formData.priority}
                                onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                            >
                                <option value="low">Low</option>
                                <option value="medium">Medium</option>
                                <option value="high">High</option>
                                <option value="urgent">Urgent</option>
                            </select>
                        </div>

                        <div className="flex gap-4">
                            <button
                                type="submit"
                                disabled={submitting}
                                className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 disabled:bg-gray-400"
                            >
                                {submitting ? 'Creating...' : 'Create Ticket'}
                            </button>
                            <Link
                                to="/user/tickets"
                                className="bg-gray-200 text-gray-700 px-6 py-2 rounded-lg hover:bg-gray-300"
                            >
                                Cancel
                            </Link>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}
