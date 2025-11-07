import { Link } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import React from "react";

export default function UserDashboard() {
    const user = useAuthStore(state => state.user);

    return (
        <div className="min-h-screen bg-gray-100 p-6">
            <div className="max-w-7xl mx-auto">
                <h1 className="text-3xl font-bold mb-6">Welcome, {user?.name}!</h1>
                <div className="grid md:grid-cols-3 gap-6">
                    <Link to="/user/saved-plots" className="bg-white p-6 rounded-lg shadow hover:shadow-lg">
                        <h2 className="text-xl font-bold mb-2">Saved Plots</h2>
                        <p className="text-gray-600">View your favorite plots</p>
                    </Link>
                    <Link to="/user/tickets" className="bg-white p-6 rounded-lg shadow hover:shadow-lg">
                        <h2 className="text-xl font-bold mb-2">Support Tickets</h2>
                        <p className="text-gray-600">View and manage your tickets</p>
                    </Link>
                    <Link to="/plots" className="bg-white p-6 rounded-lg shadow hover:shadow-lg">
                        <h2 className="text-xl font-bold mb-2">Browse Plots</h2>
                        <p className="text-gray-600">Find your perfect plot</p>
                    </Link>
                </div>
            </div>
        </div>
    );
}
