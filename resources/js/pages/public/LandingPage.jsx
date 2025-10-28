import { Link } from 'react-router-dom';
import React from "react";
import {
    MapIcon,
    ChartBarIcon,
    UserGroupIcon,
    ShieldCheckIcon,
    ArrowRightIcon,
    CheckCircleIcon
} from '@heroicons/react/24/outline';

export default function LandingPage() {
    const features = [
        {
            icon: MapIcon,
            title: 'Interactive Plot Maps',
            description: 'Browse and explore plots with our intuitive map interface. Visualize property boundaries and locations in real-time.'
        },
        {
            icon: ChartBarIcon,
            title: 'Advanced Analytics',
            description: 'Track market trends, plot availability, and make data-driven decisions with comprehensive analytics.'
        },
        {
            icon: UserGroupIcon,
            title: 'Lead Management',
            description: 'Efficiently manage customer inquiries and leads with our powerful CRM tools and automated workflows.'
        },
        {
            icon: ShieldCheckIcon,
            title: 'Secure & Reliable',
            description: 'Your data is protected with enterprise-grade security. Trust us with your valuable property information.'
        }
    ];

    const stats = [
        { value: '500+', label: 'Available Plots' },
        { value: '1000+', label: 'Happy Customers' },
        { value: '50+', label: 'Projects' },
        { value: '24/7', label: 'Support' }
    ];

    return (
        <div className="min-h-screen bg-white">
            {/* Navigation */}
            <nav className="fixed top-0 w-full bg-white/90 backdrop-blur-md shadow-sm z-50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center h-16">
                        <div className="flex items-center">
                            <MapIcon className="h-8 w-8 text-blue-600" />
                            <span className="ml-2 text-xl font-bold text-gray-900">TajMap</span>
                        </div>
                        <div className="hidden md:flex items-center space-x-8">
                            <Link to="/plots" className="text-gray-600 hover:text-gray-900 transition">
                                Browse Plots
                            </Link>
                            <Link to="/login" className="text-gray-600 hover:text-gray-900 transition">
                                Login
                            </Link>
                            <Link
                                to="/register"
                                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
                            >
                                Get Started
                            </Link>
                        </div>
                    </div>
                </div>
            </nav>

            {/* Hero Section */}
            <section className="pt-32 pb-20 px-4 sm:px-6 lg:px-8">
                <div className="max-w-7xl mx-auto">
                    <div className="text-center">
                        <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6">
                            Find Your Perfect
                            <span className="block text-blue-600">Plot of Land</span>
                        </h1>
                        <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
                            Discover, explore, and manage real estate plots with our comprehensive platform.
                            From browsing available properties to managing leads, we've got you covered.
                        </p>
                        <div className="flex flex-col sm:flex-row gap-4 justify-center">
                            <Link
                                to="/plots"
                                className="inline-flex items-center justify-center px-8 py-3 bg-blue-600 text-white text-lg font-semibold rounded-lg hover:bg-blue-700 transition shadow-lg"
                            >
                                Browse Plots
                                <ArrowRightIcon className="ml-2 h-5 w-5" />
                            </Link>
                            <Link
                                to="/register"
                                className="inline-flex items-center justify-center px-8 py-3 bg-white text-blue-600 text-lg font-semibold rounded-lg border-2 border-blue-600 hover:bg-blue-50 transition"
                            >
                                Sign Up Free
                            </Link>
                        </div>
                    </div>
                </div>
            </section>

            {/* Stats Section */}
            <section className="py-16 bg-blue-600">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
                        {stats.map((stat, index) => (
                            <div key={index} className="text-center">
                                <div className="text-4xl font-bold text-white mb-2">{stat.value}</div>
                                <div className="text-blue-100">{stat.label}</div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Features Section */}
            <section className="py-20 px-4 sm:px-6 lg:px-8">
                <div className="max-w-7xl mx-auto">
                    <div className="text-center mb-16">
                        <h2 className="text-4xl font-bold text-gray-900 mb-4">
                            Everything You Need
                        </h2>
                        <p className="text-xl text-gray-600 max-w-2xl mx-auto">
                            Powerful features to help you find, manage, and sell properties efficiently.
                        </p>
                    </div>
                    <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
                        {features.map((feature, index) => (
                            <div
                                key={index}
                                className="bg-white p-6 rounded-xl shadow-lg hover:shadow-xl transition border border-gray-100"
                            >
                                <div className="bg-blue-100 w-12 h-12 rounded-lg flex items-center justify-center mb-4">
                                    <feature.icon className="h-6 w-6 text-blue-600" />
                                </div>
                                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                                    {feature.title}
                                </h3>
                                <p className="text-gray-600">
                                    {feature.description}
                                </p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Benefits Section */}
            <section className="py-20 bg-gray-50 px-4 sm:px-6 lg:px-8">
                <div className="max-w-7xl mx-auto">
                    <div className="grid md:grid-cols-2 gap-12 items-center">
                        <div>
                            <h2 className="text-4xl font-bold text-gray-900 mb-6">
                                Why Choose TajMap?
                            </h2>
                            <div className="space-y-4">
                                {[
                                    'Easy-to-use interface for browsing plots',
                                    'Comprehensive property details and documents',
                                    'Real-time availability updates',
                                    'Secure payment processing',
                                    'Dedicated customer support',
                                    'Mobile-friendly platform'
                                ].map((benefit, index) => (
                                    <div key={index} className="flex items-start">
                                        <CheckCircleIcon className="h-6 w-6 text-green-500 mr-3 flex-shrink-0" />
                                        <span className="text-gray-700">{benefit}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                        <div className="bg-gradient-to-br from-blue-500 to-blue-700 rounded-2xl p-8 text-white">
                            <h3 className="text-2xl font-bold mb-4">Ready to get started?</h3>
                            <p className="mb-6 text-blue-100">
                                Join thousands of satisfied customers who found their dream property with us.
                            </p>
                            <Link
                                to="/register"
                                className="inline-block bg-white text-blue-600 px-6 py-3 rounded-lg font-semibold hover:bg-gray-100 transition"
                            >
                                Create Free Account
                            </Link>
                        </div>
                    </div>
                </div>
            </section>

            {/* CTA Section */}
            <section className="py-20 px-4 sm:px-6 lg:px-8">
                <div className="max-w-4xl mx-auto text-center">
                    <h2 className="text-4xl font-bold text-gray-900 mb-6">
                        Start Your Property Journey Today
                    </h2>
                    <p className="text-xl text-gray-600 mb-8">
                        Browse our extensive collection of plots and find the perfect land for your dream project.
                    </p>
                    <Link
                        to="/plots"
                        className="inline-flex items-center px-8 py-4 bg-blue-600 text-white text-lg font-semibold rounded-lg hover:bg-blue-700 transition shadow-lg"
                    >
                        Explore Available Plots
                        <ArrowRightIcon className="ml-2 h-5 w-5" />
                    </Link>
                </div>
            </section>

            {/* Footer */}
            <footer className="bg-gray-900 text-gray-300 py-12 px-4 sm:px-6 lg:px-8">
                <div className="max-w-7xl mx-auto">
                    <div className="grid md:grid-cols-4 gap-8 mb-8">
                        <div>
                            <div className="flex items-center mb-4">
                                <MapIcon className="h-8 w-8 text-blue-500" />
                                <span className="ml-2 text-xl font-bold text-white">TajMap</span>
                            </div>
                            <p className="text-sm">
                                Your trusted partner in finding the perfect plot of land.
                            </p>
                        </div>
                        <div>
                            <h4 className="text-white font-semibold mb-4">Quick Links</h4>
                            <ul className="space-y-2 text-sm">
                                <li><Link to="/plots" className="hover:text-white transition">Browse Plots</Link></li>
                                <li><Link to="/login" className="hover:text-white transition">Login</Link></li>
                                <li><Link to="/register" className="hover:text-white transition">Register</Link></li>
                            </ul>
                        </div>
                        <div>
                            <h4 className="text-white font-semibold mb-4">Company</h4>
                            <ul className="space-y-2 text-sm">
                                <li><a href="#" className="hover:text-white transition">About Us</a></li>
                                <li><a href="#" className="hover:text-white transition">Contact</a></li>
                                <li><a href="#" className="hover:text-white transition">Careers</a></li>
                            </ul>
                        </div>
                        <div>
                            <h4 className="text-white font-semibold mb-4">Legal</h4>
                            <ul className="space-y-2 text-sm">
                                <li><a href="#" className="hover:text-white transition">Privacy Policy</a></li>
                                <li><a href="#" className="hover:text-white transition">Terms of Service</a></li>
                                <li><a href="#" className="hover:text-white transition">Cookie Policy</a></li>
                            </ul>
                        </div>
                    </div>
                    <div className="border-t border-gray-800 pt-8 text-center text-sm">
                        <p>&copy; 2025 TajMap. All rights reserved.</p>
                    </div>
                </div>
            </footer>
        </div>
    );
}
