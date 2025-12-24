import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { authService } from '../../services/api';
import toast from 'react-hot-toast';

export default function ResetPasswordPage() {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const [formData, setFormData] = useState({
        token: '',
        email: '',
        password: '',
        password_confirmation: '',
    });
    const [loading, setLoading] = useState(false);
    const [showManualEntry, setShowManualEntry] = useState(false);

    useEffect(() => {
        // Extract token and email from URL parameters
        const token = searchParams.get('token')?.trim();
        const email = searchParams.get('email')?.trim();

        if (token && email) {
            // Warn if token seems too short (Laravel tokens are typically 64 characters)
            if (token.length < 20) {
                console.warn('Token seems unusually short. Expected ~64 characters, got:', token.length);
                toast.error('Invalid reset token. The token appears to be incomplete.');
                setShowManualEntry(true);
                return;
            }

            setFormData(prev => ({ ...prev, token, email }));
        } else {
            // No URL parameters, show manual entry form
            setShowManualEntry(true);
        }
    }, [searchParams]);

    const handleSubmit = async (e) => {
        e.preventDefault();

        // Validate password length
        if (formData.password.length < 8) {
            toast.error('Password must be at least 8 characters long.');
            return;
        }

        if (formData.password !== formData.password_confirmation) {
            toast.error('Passwords do not match.');
            return;
        }

        // Validate token
        const trimmedToken = formData.token.trim();
        if (!trimmedToken) {
            toast.error('Reset token is required.');
            return;
        }
        
        if (trimmedToken.length < 10) {
            toast.error('Reset token appears to be too short. Please check and try again.');
            return;
        }
        
        // Validate email
        if (!formData.email || !formData.email.trim()) {
            toast.error('Email address is required.');
            return;
        }

        setLoading(true);

        try {
            // Ensure token and email are trimmed before sending
            const submitData = {
                token: formData.token.trim(),
                email: formData.email.trim(),
                password: formData.password,
                password_confirmation: formData.password_confirmation,
            };

            console.log('Submitting password reset with data:', {
                email: submitData.email,
                tokenLength: submitData.token.length,
                hasPassword: !!submitData.password,
                hasPasswordConfirmation: !!submitData.password_confirmation,
            });

            const response = await authService.resetPassword(submitData);
            toast.success(response.message || 'Password reset successful!');
            navigate('/login');
        } catch (error) {
            console.error('Reset password error:', error);
            console.error('Error response:', error.response?.data);
            console.error('Error status:', error.response?.status);
            
            // Show specific error messages if axios interceptor didn't handle it
            if (error.response?.data?.errors) {
                const errors = error.response.data.errors;
                Object.entries(errors).forEach(([field, messages]) => {
                    if (Array.isArray(messages)) {
                        messages.forEach(msg => toast.error(`${field}: ${msg}`));
                    } else if (typeof messages === 'string') {
                        toast.error(`${field}: ${messages}`);
                    }
                });
            } else if (error.response?.data?.message) {
                toast.error(error.response.data.message);
            } else if (!error.response) {
                // Network error or no response
                toast.error('Network error. Please check your connection and try again.');
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center p-4">
            <div className="bg-white rounded-lg shadow-xl p-8 w-full max-w-md">
                <h1 className="text-3xl font-bold text-gray-900 mb-2">Reset Password</h1>
                <p className="text-gray-600 mb-6">
                    Enter your new password below.
                </p>

                <form onSubmit={handleSubmit} className="space-y-4">
                    {showManualEntry && (
                        <>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Reset Token <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    value={formData.token}
                                    onChange={(e) => setFormData({ ...formData, token: e.target.value })}
                                    className="w-full px-4 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm"
                                    placeholder="Paste your reset token here (e.g., 1g25xHVcUG8w3Mfr3MsTYkcTEscvCbhJhwRnVTGcXlkNljHi66T4aR9ECxQ...)"
                                    required
                                />
                                <p className="mt-1 text-xs text-gray-500">
                                    Enter the reset token provided by your administrator
                                </p>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Email Address <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="email"
                                    value={formData.email}
                                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                    className="w-full px-4 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    placeholder="Enter your email address"
                                    required
                                />
                            </div>
                        </>
                    )}

                    {!showManualEntry && (
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                            <input
                                type="email"
                                value={formData.email}
                                className="w-full px-4 py-2 border border-gray-300 rounded bg-gray-50"
                                disabled
                            />
                        </div>
                    )}

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">New Password</label>
                        <input
                            type="password"
                            value={formData.password}
                            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                            className="w-full px-4 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            placeholder="Enter new password"
                            required
                            minLength="8"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Confirm Password</label>
                        <input
                            type="password"
                            value={formData.password_confirmation}
                            onChange={(e) => setFormData({ ...formData, password_confirmation: e.target.value })}
                            className="w-full px-4 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            placeholder="Confirm new password"
                            required
                            minLength="8"
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {loading ? 'Resetting...' : 'Reset Password'}
                    </button>
                </form>

                <div className="mt-6 space-y-3">
                    {!showManualEntry && (
                        <div className="text-center">
                            <button
                                type="button"
                                onClick={() => setShowManualEntry(true)}
                                className="text-sm text-blue-600 hover:underline"
                            >
                                Enter token manually instead
                            </button>
                        </div>
                    )}
                    <div className="text-center">
                        <Link to="/login" className="text-blue-600 hover:underline">
                            Back to Login
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}
