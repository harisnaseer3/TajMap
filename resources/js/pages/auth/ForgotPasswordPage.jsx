import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { authService } from '../../services/api';
import toast from 'react-hot-toast';

export default function ForgotPasswordPage() {
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const [submitted, setSubmitted] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            const response = await authService.forgotPassword({ email });
            setSubmitted(true);
        } catch (error) {
            console.error('Forgot password error:', error);
            console.error('Error response:', error.response);

            // Show specific error message if available
            if (error.response?.data?.message) {
                toast.error(error.response.data.message);
            } else if (error.response?.data?.errors) {
                const errors = error.response.data.errors;
                Object.values(errors).forEach(err => {
                    if (Array.isArray(err)) {
                        toast.error(err[0]);
                    }
                });
            }
        } finally {
            setLoading(false);
        }
    };

    if (submitted) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center p-4">
                <div className="bg-white rounded-lg shadow-xl p-8 w-full max-w-md">
                    <div className="text-center">
                        <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-blue-100 mb-4">
                            <svg className="h-6 w-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                            </svg>
                        </div>
                        <h2 className="text-2xl font-bold text-gray-900 mb-3">Contact Administrator</h2>
                        <p className="text-gray-700 mb-4 font-medium">
                            To reset your password, please contact the administrator with your registered email address.
                        </p>
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                            <p className="text-sm text-gray-700 mb-2">
                                <strong>Your email:</strong> {email}
                            </p>
                            <p className="text-sm text-gray-600">
                                Please contact support for password reset assistance. Have your registered email ready for verification.
                            </p>
                        </div>
                        <Link
                            to="/login"
                            className="inline-block bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700"
                        >
                            Back to Login
                        </Link>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center p-4">
            <div className="bg-white rounded-lg shadow-xl p-8 w-full max-w-md">
                <h1 className="text-3xl font-bold text-gray-900 mb-2">Forgot Password?</h1>
                <p className="text-gray-600 mb-6">
                    Enter your email address to request a password reset from the administrator.
                </p>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full px-4 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            placeholder="your@email.com"
                            required
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {loading ? 'Submitting...' : 'Request Password Reset'}
                    </button>
                </form>

                <div className="mt-6 text-center">
                    <Link to="/login" className="text-blue-600 hover:underline">
                        Back to Login
                    </Link>
                    <br />
                    <Link to="/" className="text-gray-600 hover:underline text-sm">
                        Back to Home
                    </Link>
                </div>
            </div>
        </div>
    );
}
