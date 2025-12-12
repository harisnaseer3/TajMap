import React, { useEffect, useState } from 'react';
import { userService } from '../../services/api';
import toast from 'react-hot-toast';

export default function AdminUsers() {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [pagination, setPagination] = useState({});
    const [showModal, setShowModal] = useState(false);
    const [editingUser, setEditingUser] = useState(null);
    const [showResetTokenModal, setShowResetTokenModal] = useState(false);
    const [showTempPasswordModal, setShowTempPasswordModal] = useState(false);
    const [selectedUser, setSelectedUser] = useState(null);
    const [filters, setFilters] = useState({
        search: '',
        role: '',
        page: 1,
        per_page: 20,
    });

    useEffect(() => {
        fetchUsers();
    }, [filters]);

    const fetchUsers = async () => {
        try {
            setLoading(true);
            const response = await userService.getAll(filters);
            const responseData = response.data;

            if (responseData && responseData.data && responseData.meta) {
                setUsers(responseData.data);
                setPagination({
                    current_page: responseData.meta.current_page,
                    last_page: responseData.meta.last_page,
                    total: responseData.meta.total,
                    per_page: responseData.meta.per_page,
                });
            } else {
                setUsers([]);
                setPagination({});
            }
        } catch (error) {
            console.error('Error fetching users:', error);
            toast.error('Failed to load users');
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id) => {
        if (!confirm('Are you sure you want to delete this user?')) return;

        try {
            await userService.delete(id);
            toast.success('User deleted successfully');
            fetchUsers();
        } catch (error) {
            console.error('Error deleting user:', error);
            toast.error(error.response?.data?.message || 'Failed to delete user');
        }
    };

    const handleEdit = (user) => {
        setEditingUser(user);
        setShowModal(true);
    };

    const handleCreate = () => {
        setEditingUser(null);
        setShowModal(true);
    };

    const handleGenerateResetToken = (user) => {
        setSelectedUser(user);
        setShowResetTokenModal(true);
    };

    const handleSetTempPassword = (user) => {
        setSelectedUser(user);
        setShowTempPasswordModal(true);
    };

    const handleFilterChange = (key, value) => {
        setFilters(prev => ({ ...prev, [key]: value, page: 1 }));
    };

    const handlePageChange = (page) => {
        setFilters(prev => ({ ...prev, page }));
    };

    const getRoleBadge = (role) => {
        return role === 'admin'
            ? 'bg-purple-100 text-purple-800'
            : 'bg-blue-100 text-blue-800';
    };

    if (loading && users.length === 0) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="text-lg text-gray-600">Loading users...</div>
            </div>
        );
    }

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold">Users Management</h1>
                <button
                    onClick={handleCreate}
                    className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
                >
                    + Add New User
                </button>
            </div>

            {/* Filters */}
            <div className="bg-white p-4 rounded-lg shadow mb-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <input
                        type="text"
                        placeholder="Search by name, email, or phone..."
                        value={filters.search}
                        onChange={(e) => handleFilterChange('search', e.target.value)}
                        className="px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <select
                        value={filters.role}
                        onChange={(e) => handleFilterChange('role', e.target.value)}
                        className="px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                        <option value="">All Roles</option>
                        <option value="admin">Admin</option>
                        <option value="user">User</option>
                    </select>
                </div>
            </div>

            {/* Users Table */}
            <div className="bg-white rounded-lg shadow overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    User
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Contact
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Role
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Assigned Leads
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Saved Plots
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Joined
                                </th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Actions
                                </th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {users.length === 0 ? (
                                <tr>
                                    <td colSpan="7" className="px-6 py-8 text-center text-gray-500">
                                        No users found.
                                    </td>
                                </tr>
                            ) : (
                                users.map((user) => (
                                    <tr key={user.id} className="hover:bg-gray-50">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center">
                                                <div className="flex-shrink-0 h-10 w-10">
                                                    <div className="h-10 w-10 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center text-white font-bold">
                                                        {user.name.charAt(0).toUpperCase()}
                                                    </div>
                                                </div>
                                                <div className="ml-4">
                                                    <div className="text-sm font-medium text-gray-900">{user.name}</div>
                                                    <div className="text-sm text-gray-500">ID: {user.id}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm text-gray-900">{user.email}</div>
                                            <div className="text-sm text-gray-500">{user.phone || 'N/A'}</div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getRoleBadge(user.role)}`}>
                                                {user.role}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                            {user.assigned_leads_count || 0}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                            {user.saved_plots_count || 0}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {new Date(user.created_at).toLocaleDateString()}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                                            <button
                                                onClick={() => handleEdit(user)}
                                                className="text-blue-600 hover:text-blue-900"
                                            >
                                                Edit
                                            </button>
                                            <button
                                                onClick={() => handleGenerateResetToken(user)}
                                                className="text-green-600 hover:text-green-900"
                                                title="Generate Reset Token"
                                            >
                                                Reset Link
                                            </button>
                                            <button
                                                onClick={() => handleSetTempPassword(user)}
                                                className="text-purple-600 hover:text-purple-900"
                                                title="Set Temporary Password"
                                            >
                                                Temp Pass
                                            </button>
                                            <button
                                                onClick={() => handleDelete(user.id)}
                                                className="text-red-600 hover:text-red-900"
                                            >
                                                Delete
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                {pagination.last_page > 1 && (
                    <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
                        <div className="flex-1 flex justify-between sm:hidden">
                            <button
                                onClick={() => handlePageChange(pagination.current_page - 1)}
                                disabled={pagination.current_page === 1}
                                className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
                            >
                                Previous
                            </button>
                            <button
                                onClick={() => handlePageChange(pagination.current_page + 1)}
                                disabled={pagination.current_page === pagination.last_page}
                                className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
                            >
                                Next
                            </button>
                        </div>
                        <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                            <div>
                                <p className="text-sm text-gray-700">
                                    Showing page <span className="font-medium">{pagination.current_page}</span> of{' '}
                                    <span className="font-medium">{pagination.last_page}</span> ({pagination.total} total users)
                                </p>
                            </div>
                            <div>
                                <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                                    <button
                                        onClick={() => handlePageChange(pagination.current_page - 1)}
                                        disabled={pagination.current_page === 1}
                                        className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                                    >
                                        Previous
                                    </button>
                                    <button
                                        onClick={() => handlePageChange(pagination.current_page + 1)}
                                        disabled={pagination.current_page === pagination.last_page}
                                        className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                                    >
                                        Next
                                    </button>
                                </nav>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Create/Edit Modal */}
            {showModal && (
                <UserModal
                    user={editingUser}
                    onClose={() => {
                        setShowModal(false);
                        setEditingUser(null);
                    }}
                    onSuccess={() => {
                        setShowModal(false);
                        setEditingUser(null);
                        fetchUsers();
                    }}
                />
            )}

            {/* Generate Reset Token Modal */}
            {showResetTokenModal && selectedUser && (
                <GenerateResetTokenModal
                    user={selectedUser}
                    onClose={() => {
                        setShowResetTokenModal(false);
                        setSelectedUser(null);
                    }}
                />
            )}

            {/* Set Temporary Password Modal */}
            {showTempPasswordModal && selectedUser && (
                <SetTempPasswordModal
                    user={selectedUser}
                    onClose={() => {
                        setShowTempPasswordModal(false);
                        setSelectedUser(null);
                    }}
                />
            )}
        </div>
    );
}

// User Create/Edit Modal Component
function UserModal({ user, onClose, onSuccess }) {
    const [formData, setFormData] = useState({
        name: user?.name || '',
        email: user?.email || '',
        phone: user?.phone || '',
        role: user?.role || 'user',
        password: '',
        password_confirmation: '',
    });
    const [submitting, setSubmitting] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();

        // Validation
        if (!formData.name || !formData.email || !formData.role) {
            toast.error('Please fill in all required fields');
            return;
        }

        if (!user && !formData.password) {
            toast.error('Password is required for new users');
            return;
        }

        if (formData.password && formData.password !== formData.password_confirmation) {
            toast.error('Passwords do not match');
            return;
        }

        setSubmitting(true);

        try {
            const dataToSend = { ...formData };

            // Remove password fields if empty (for updates without password change)
            if (!dataToSend.password) {
                delete dataToSend.password;
                delete dataToSend.password_confirmation;
            }

            if (user) {
                await userService.update(user.id, dataToSend);
                toast.success('User updated successfully');
            } else {
                await userService.create(dataToSend);
                toast.success('User created successfully');
            }
            onSuccess();
        } catch (error) {
            console.error('Error saving user:', error);
            const errorMessage = error.response?.data?.message || 'Failed to save user';
            const errors = error.response?.data?.errors;

            if (errors) {
                Object.values(errors).forEach(err => {
                    if (Array.isArray(err)) {
                        toast.error(err[0]);
                    } else {
                        toast.error(err);
                    }
                });
            } else {
                toast.error(errorMessage);
            }
        } finally {
            setSubmitting(false);
        }
    };

    const handleChange = (field, value) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                <div className="p-6">
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-2xl font-bold">{user ? 'Edit User' : 'Create New User'}</h2>
                        <button
                            onClick={onClose}
                            className="text-gray-400 hover:text-gray-600 text-2xl"
                        >
                            ×
                        </button>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Name *
                                </label>
                                <input
                                    type="text"
                                    required
                                    value={formData.name}
                                    onChange={(e) => handleChange('name', e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Email *
                                </label>
                                <input
                                    type="email"
                                    required
                                    value={formData.email}
                                    onChange={(e) => handleChange('email', e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Phone
                                </label>
                                <input
                                    type="tel"
                                    value={formData.phone}
                                    onChange={(e) => handleChange('phone', e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Role *
                                </label>
                                <select
                                    required
                                    value={formData.role}
                                    onChange={(e) => handleChange('role', e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                                >
                                    <option value="user">User</option>
                                    <option value="admin">Admin</option>
                                </select>
                            </div>
                        </div>

                        <div className="border-t pt-4">
                            <h3 className="text-lg font-medium mb-3">
                                {user ? 'Change Password (leave blank to keep current)' : 'Set Password *'}
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Password {!user && '*'}
                                    </label>
                                    <input
                                        type="password"
                                        required={!user}
                                        value={formData.password}
                                        onChange={(e) => handleChange('password', e.target.value)}
                                        className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        placeholder={user ? 'Leave blank to keep current' : ''}
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Confirm Password {!user && '*'}
                                    </label>
                                    <input
                                        type="password"
                                        required={!user}
                                        value={formData.password_confirmation}
                                        onChange={(e) => handleChange('password_confirmation', e.target.value)}
                                        className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="flex justify-end gap-3 pt-4">
                            <button
                                type="button"
                                onClick={onClose}
                                className="px-4 py-2 border border-gray-300 rounded text-gray-700 hover:bg-gray-50 transition"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={submitting}
                                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition disabled:opacity-50"
                            >
                                {submitting ? 'Saving...' : user ? 'Update User' : 'Create User'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}

// Generate Reset Token Modal Component
function GenerateResetTokenModal({ user, onClose }) {
    const [loading, setLoading] = useState(false);
    const [resetData, setResetData] = useState(null);

    const handleGenerate = async () => {
        setLoading(true);
        try {
            const response = await userService.generateResetToken(user.id);
            setResetData(response.data);
            toast.success('Reset token generated successfully!');
        } catch (error) {
            console.error('Error generating reset token:', error);
        } finally {
            setLoading(false);
        }
    };

    const copyToClipboard = (text, label) => {
        navigator.clipboard.writeText(text);
        toast.success(`${label} copied to clipboard!`);
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full">
                <div className="p-6">
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-2xl font-bold">Generate Password Reset Token</h2>
                        <button
                            onClick={onClose}
                            className="text-gray-400 hover:text-gray-600 text-2xl"
                        >
                            ×
                        </button>
                    </div>

                    {!resetData ? (
                        <div>
                            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                                <p className="text-sm text-gray-700 mb-2">
                                    <strong>User:</strong> {user.name} ({user.email})
                                </p>
                                <p className="text-sm text-gray-600">
                                    This will generate a secure reset token that you can share with the user.
                                    The token will expire in 24 hours.
                                </p>
                            </div>

                            <div className="flex justify-end gap-3 pt-4">
                                <button
                                    type="button"
                                    onClick={onClose}
                                    className="px-4 py-2 border border-gray-300 rounded text-gray-700 hover:bg-gray-50 transition"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleGenerate}
                                    disabled={loading}
                                    className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition disabled:opacity-50"
                                >
                                    {loading ? 'Generating...' : 'Generate Reset Token'}
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div>
                            <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
                                <p className="text-sm font-semibold text-green-800 mb-2">
                                    Reset token generated successfully!
                                </p>
                                <p className="text-sm text-gray-600">
                                    Share the reset URL or token with {user.name} via phone, WhatsApp, or in-person.
                                </p>
                            </div>

                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Reset URL (Recommended)
                                    </label>
                                    <div className="flex gap-2">
                                        <input
                                            type="text"
                                            value={resetData.reset_url}
                                            readOnly
                                            className="flex-1 px-3 py-2 border border-gray-300 rounded bg-gray-50 text-sm"
                                        />
                                        <button
                                            onClick={() => copyToClipboard(resetData.reset_url, 'Reset URL')}
                                            className="px-3 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm"
                                        >
                                            Copy
                                        </button>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Token (Alternative)
                                    </label>
                                    <div className="flex gap-2">
                                        <input
                                            type="text"
                                            value={resetData.token}
                                            readOnly
                                            className="flex-1 px-3 py-2 border border-gray-300 rounded bg-gray-50 text-sm font-mono"
                                        />
                                        <button
                                            onClick={() => copyToClipboard(resetData.token, 'Token')}
                                            className="px-3 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm"
                                        >
                                            Copy
                                        </button>
                                    </div>
                                </div>

                                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                                    <p className="text-sm text-gray-700">
                                        <strong>Expires:</strong> {resetData.expires_at}
                                    </p>
                                    <p className="text-sm text-gray-600 mt-1">
                                        {resetData.note}
                                    </p>
                                </div>
                            </div>

                            <div className="flex justify-end gap-3 pt-4 mt-4 border-t">
                                <button
                                    onClick={onClose}
                                    className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
                                >
                                    Done
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

// Set Temporary Password Modal Component
function SetTempPasswordModal({ user, onClose }) {
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);

    const generateRandomPassword = () => {
        const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
        let pass = '';
        for (let i = 0; i < 12; i++) {
            pass += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        setPassword(pass);
    };

    const handleSubmit = async () => {
        if (!password || password.length < 8) {
            toast.error('Password must be at least 8 characters');
            return;
        }

        setLoading(true);
        try {
            await userService.setTemporaryPassword(user.id, password);
            toast.success('Temporary password set successfully!');
            setSuccess(true);
        } catch (error) {
            console.error('Error setting temporary password:', error);
        } finally {
            setLoading(false);
        }
    };

    const copyToClipboard = () => {
        navigator.clipboard.writeText(password);
        toast.success('Password copied to clipboard!');
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full">
                <div className="p-6">
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-2xl font-bold">Set Temporary Password</h2>
                        <button
                            onClick={onClose}
                            className="text-gray-400 hover:text-gray-600 text-2xl"
                        >
                            ×
                        </button>
                    </div>

                    {!success ? (
                        <div>
                            <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 mb-4">
                                <p className="text-sm text-gray-700 mb-2">
                                    <strong>User:</strong> {user.name} ({user.email})
                                </p>
                                <p className="text-sm text-gray-600">
                                    Set a temporary password for this user. They will be required to change it on first login.
                                </p>
                            </div>

                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Temporary Password (min. 8 characters)
                                    </label>
                                    <div className="flex gap-2">
                                        <input
                                            type="text"
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                            className="flex-1 px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-purple-500"
                                            placeholder="Enter temporary password"
                                        />
                                        <button
                                            onClick={generateRandomPassword}
                                            className="px-3 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 text-sm"
                                        >
                                            Generate
                                        </button>
                                    </div>
                                </div>
                            </div>

                            <div className="flex justify-end gap-3 pt-4 mt-4 border-t">
                                <button
                                    type="button"
                                    onClick={onClose}
                                    className="px-4 py-2 border border-gray-300 rounded text-gray-700 hover:bg-gray-50 transition"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleSubmit}
                                    disabled={loading}
                                    className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 transition disabled:opacity-50"
                                >
                                    {loading ? 'Setting...' : 'Set Temporary Password'}
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div>
                            <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
                                <p className="text-sm font-semibold text-green-800 mb-2">
                                    Temporary password set successfully!
                                </p>
                                <p className="text-sm text-gray-600">
                                    Share this password with {user.name} securely. They must change it on first login.
                                </p>
                            </div>

                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Temporary Password
                                    </label>
                                    <div className="flex gap-2">
                                        <input
                                            type="text"
                                            value={password}
                                            readOnly
                                            className="flex-1 px-3 py-2 border border-gray-300 rounded bg-gray-50 font-mono text-lg"
                                        />
                                        <button
                                            onClick={copyToClipboard}
                                            className="px-3 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm"
                                        >
                                            Copy
                                        </button>
                                    </div>
                                </div>

                                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                                    <p className="text-sm text-gray-700">
                                        <strong>Important:</strong> User will be forced to change this password on next login.
                                    </p>
                                </div>
                            </div>

                            <div className="flex justify-end gap-3 pt-4 mt-4 border-t">
                                <button
                                    onClick={onClose}
                                    className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 transition"
                                >
                                    Done
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
