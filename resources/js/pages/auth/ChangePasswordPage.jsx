import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authService } from '../../services/api';
import { useAuthStore } from '../../store/authStore';
import toast from 'react-hot-toast';

export default function ChangePasswordPage() {
    const navigate = useNavigate();
    const { user, clearAuth } = useAuthStore();
    const [formData, setFormData] = useState({
        current_password: '',
        new_password: '',
        new_password_confirmation: '',
    });
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();

        // Validate passwords match
        if (formData.new_password !== formData.new_password_confirmation) {
            toast.error('New passwords do not match');
            return;
        }

        setLoading(true);

        try {
            await authService.changePassword(formData);
            toast.success('Password changed successfully! Please login with your new password.');

            // Clear auth and redirect to login
            clearAuth();
            navigate('/login');
        } catch (error) {
            console.error('Change password error:', error);
            // Error is handled by interceptor
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center p-4">
            <div className="bg-white rounded-lg shadow-xl p-8 w-full max-w-md">
                <div className="text-center mb-6">
                    <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-yellow-100 mb-4">
                        <svg className="h-6 w-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                        </svg>
                    </div>
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">Change Password</h1>
                    <p className="text-gray-600">
                        You are using a temporary password. Please create a new secure password.
                    </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Current Password
                        </label>
                        <input
                            type="password"
                            value={formData.current_password}
                            onChange={(e) => setFormData({ ...formData, current_password: e.target.value })}
                            className="w-full px-4 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            placeholder="Enter your temporary password"
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            New Password
                        </label>
                        <input
                            type="password"
                            value={formData.new_password}
                            onChange={(e) => setFormData({ ...formData, new_password: e.target.value })}
                            className="w-full px-4 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            placeholder="Enter new password (min. 8 characters)"
                            minLength="8"
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Confirm New Password
                        </label>
                        <input
                            type="password"
                            value={formData.new_password_confirmation}
                            onChange={(e) => setFormData({ ...formData, new_password_confirmation: e.target.value })}
                            className="w-full px-4 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            placeholder="Re-enter new password"
                            minLength="8"
                            required
                        />
                    </div>

                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                        <p className="text-sm text-gray-700">
                            <strong>Password Requirements:</strong>
                        </p>
                        <ul className="text-sm text-gray-600 list-disc list-inside mt-1">
                            <li>Minimum 8 characters</li>
                            <li>Must be different from current password</li>
                        </ul>
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {loading ? 'Changing Password...' : 'Change Password'}
                    </button>
                </form>

                <div className="mt-4 text-center">
                    <button
                        onClick={() => {
                            clearAuth();
                            navigate('/login');
                        }}
                        className="text-sm text-gray-600 hover:underline"
                    >
                        Logout
                    </button>
                </div>
            </div>
        </div>
    );
}
