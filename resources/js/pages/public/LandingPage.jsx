import { Link } from 'react-router-dom';
import React, { useState, useEffect } from "react";
import {
    MapIcon,
    ChartBarIcon,
    UserGroupIcon,
    ShieldCheckIcon,
    ArrowRightIcon,
    CheckCircleIcon,
    XMarkIcon
} from '@heroicons/react/24/outline';
import InteractiveMap from '../../components/InteractiveMap';
import Logo from '../../components/Logo';
import toast from 'react-hot-toast';
import { leadService, settingService } from '../../services/api';
import axios from 'axios';

export default function LandingPage() {
    const [selectedPlot, setSelectedPlot] = useState(null);
    const [showInquiryModal, setShowInquiryModal] = useState(false);
    const [inquiryData, setInquiryData] = useState({
        name: '',
        email: '',
        phone: '',
        message: ''
    });
    const [submitting, setSubmitting] = useState(false);
    const [showPopup, setShowPopup] = useState(false);
    const [popupImageUrl, setPopupImageUrl] = useState('');
    const [popupImage2Url, setPopupImage2Url] = useState('');
    const [popupEnabled, setPopupEnabled] = useState(false);
    const [popupClosing, setPopupClosing] = useState(false);
    const [imageLoaded, setImageLoaded] = useState(false);
    const [image2Loaded, setImage2Loaded] = useState(false);
    const [currentImageIndex, setCurrentImageIndex] = useState(1);
    const [showingSecondImage, setShowingSecondImage] = useState(false);

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

    // Fetch popup settings on component mount
    useEffect(() => {
        const fetchPopupSettings = async () => {
            try {
                // Fetch public settings for the appearance group
                const response = await axios.get('/api/public/settings/group/appearance');
                const settings = response.data?.data || response.data || {};

                // Extract popup-related settings (settings is a key-value object)
                const popupImageUrl = settings.landing_popup_image_url;
                const popupImage2Url = settings.landing_popup_image_2_url;
                const popupEnabled = settings.landing_popup_enabled;

                if (popupImageUrl && popupEnabled === true) {
                    setPopupImageUrl(popupImageUrl);
                    setPopupImage2Url(popupImage2Url || '');
                    setPopupEnabled(true);

                    // Show popup immediately
                    setTimeout(() => {
                        setShowPopup(true);
                    }, 500);
                }
            } catch (error) {
                console.error('Error fetching popup settings:', error);
            }
        };

        fetchPopupSettings();
    }, []);

    // Handle transition from first image to second image
    useEffect(() => {
        if (imageLoaded && popupImage2Url && !showingSecondImage) {
            // Wait for first image animation to complete (approximately 3-4 seconds)
            // Then transition to second image
            const transitionTimer = setTimeout(() => {
                setShowingSecondImage(true);
            }, 4000); // 4 seconds after first image loads

            return () => clearTimeout(transitionTimer);
        }
    }, [imageLoaded, popupImage2Url, showingSecondImage]);

    const handleClosePopup = () => {
        setPopupClosing(true);
        setTimeout(() => {
            setShowPopup(false);
            setPopupClosing(false);
            setImageLoaded(false);
            setImage2Loaded(false);
            setShowingSecondImage(false);
        }, 300);
    };

    const handlePlotClick = (plot) => {
        setSelectedPlot(plot);
        setShowInquiryModal(true);
    };

    const handleInquirySubmit = async (e) => {
        e.preventDefault();

        if (!selectedPlot) return;

        try {
            setSubmitting(true);
            await leadService.submit({
                ...inquiryData,
                plot_id: selectedPlot.id
            });

            toast.success('Inquiry submitted successfully! We will contact you soon.');
            setShowInquiryModal(false);
            setInquiryData({ name: '', email: '', phone: '', message: '' });
            setSelectedPlot(null);
        } catch (error) {
            console.error('Error submitting inquiry:', error);
            toast.error(error.response?.data?.message || 'Failed to submit inquiry');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="min-h-screen bg-white">
            {/* Navigation */}
            <nav className="fixed top-0 w-full bg-white/90 backdrop-blur-md shadow-sm z-50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center h-16">
                        <Logo
                            text="TajMap"
                            iconClassName="h-8 w-8"
                            textClassName="ml-2 text-xl font-bold text-gray-900"
                        />
                        <div className="hidden md:flex items-center space-x-8">
                            <a href="#map" className="text-gray-600 hover:text-gray-900 transition">
                                View Map
                            </a>
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

            {/* Interactive Map Section */}
            <section id="map" className="pt-32 pb-20 px-4 sm:px-6 lg:px-8 bg-gray-50">
                <div className="max-w-7xl mx-auto">
                    <div className="text-center mb-12">
                        <h2 className="text-4xl font-bold text-gray-900 mb-4">
                            Explore Our Interactive Map
                        </h2>
                        <p className="text-xl text-gray-600 max-w-2xl mx-auto">
                            Click on any plot to view details and submit an inquiry. Available plots are highlighted in green.
                        </p>
                    </div>
                    <InteractiveMap onPlotClick={handlePlotClick} />
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
                            <a
                                href="#map"
                                className="inline-block bg-white text-blue-600 px-6 py-3 rounded-lg font-semibold hover:bg-gray-100 transition"
                            >
                                View Available Plots
                            </a>
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

            {/* Inquiry Modal */}
            {showInquiryModal && selectedPlot && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                        <div className="p-6">
                            <div className="flex justify-between items-start mb-4">
                                <div>
                                    <h2 className="text-2xl font-bold text-gray-900">
                                        {selectedPlot.status.toLowerCase() === 'available' ? 'Inquire About Plot' : 'Plot Details'}
                                    </h2>
                                    <div className="flex items-center gap-2 mt-1">
                                        <p className="text-gray-600">{selectedPlot.plot_number}</p>
                                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                                            selectedPlot.status.toLowerCase() === 'available' ? 'bg-green-100 text-green-800' :
                                            selectedPlot.status.toLowerCase() === 'reserved' ? 'bg-yellow-100 text-yellow-800' :
                                            'bg-red-100 text-red-800'
                                        }`}>
                                            {selectedPlot.status}
                                        </span>
                                    </div>
                                </div>
                                <button
                                    onClick={() => {
                                        setShowInquiryModal(false);
                                        setSelectedPlot(null);
                                    }}
                                    className="text-gray-400 hover:text-gray-600"
                                >
                                    <XMarkIcon className="h-6 w-6" />
                                </button>
                            </div>

                            {/* Plot Details */}
                            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <p className="text-sm text-gray-600">Sector</p>
                                        <p className="font-semibold">{selectedPlot.sector}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-600">Street</p>
                                        <p className="font-semibold">{selectedPlot.street}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-600">Area</p>
                                        <p className="font-semibold">{selectedPlot.area} sq. units</p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-600">Price</p>
                                        <p className="font-semibold text-blue-600">Contact for price</p>
                                    </div>
                                </div>
                                {selectedPlot.description && (
                                    <div className="mt-4">
                                        <p className="text-sm text-gray-600">Description</p>
                                        <p className="text-sm mt-1">{selectedPlot.description}</p>
                                    </div>
                                )}
                            </div>

                            {/* Not Available Message */}
                            {selectedPlot.status.toLowerCase() !== 'available' && (
                                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
                                    <p className="text-yellow-800 font-semibold">This plot is currently {selectedPlot.status.toLowerCase()}</p>
                                    <p className="text-yellow-700 text-sm mt-1">Please check back later or contact us for more information.</p>
                                </div>
                            )}

                            {/* Inquiry Form - Only for Available Plots */}
                            {selectedPlot.status.toLowerCase() === 'available' && (
                                <form onSubmit={handleInquirySubmit} className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Your Name <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        required
                                        value={inquiryData.name}
                                        onChange={(e) => setInquiryData({ ...inquiryData, name: e.target.value })}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        placeholder="John Doe"
                                    />
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Email <span className="text-red-500">*</span>
                                        </label>
                                        <input
                                            type="email"
                                            required
                                            value={inquiryData.email}
                                            onChange={(e) => setInquiryData({ ...inquiryData, email: e.target.value })}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            placeholder="john@example.com"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Phone <span className="text-red-500">*</span>
                                        </label>
                                        <input
                                            type="tel"
                                            required
                                            value={inquiryData.phone}
                                            onChange={(e) => setInquiryData({ ...inquiryData, phone: e.target.value })}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            placeholder="+1 (555) 000-0000"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Message
                                    </label>
                                    <textarea
                                        value={inquiryData.message}
                                        onChange={(e) => setInquiryData({ ...inquiryData, message: e.target.value })}
                                        rows="4"
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        placeholder="I'm interested in this plot..."
                                    />
                                </div>

                                <div className="flex gap-3 justify-end pt-4">
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setShowInquiryModal(false);
                                            setSelectedPlot(null);
                                        }}
                                        className="px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
                                        disabled={submitting}
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={submitting}
                                        className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-400"
                                    >
                                        {submitting ? 'Submitting...' : 'Submit Inquiry'}
                                    </button>
                                </div>
                            </form>
                            )}

                            {/* Close button for non-available plots */}
                            {selectedPlot.status.toLowerCase() !== 'available' && (
                                <div className="flex justify-end pt-4">
                                    <button
                                        onClick={() => {
                                            setShowInquiryModal(false);
                                            setSelectedPlot(null);
                                        }}
                                        className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
                                    >
                                        Close
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Landing Page Popup */}
            {showPopup && popupEnabled && popupImageUrl && (
                <div
                    className={`fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center p-4 ${
                        popupClosing ? 'popup-overlay-out' : 'popup-overlay-in'
                    }`}
                    style={{ zIndex: 9999 }}
                    onClick={handleClosePopup}
                >
                    <div
                        className="relative max-w-4xl w-full bg-white rounded-lg shadow-2xl overflow-hidden"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Close Button */}
                        <button
                            onClick={handleClosePopup}
                            className="absolute top-4 right-4 z-10 bg-white/90 hover:bg-white rounded-full p-2 shadow-lg transition-all hover:scale-110"
                            aria-label="Close popup"
                        >
                            <XMarkIcon className="w-6 h-6 text-gray-700" />
                        </button>

                        {/* Animated Images */}
                        <div className="relative w-full h-[70vh] flex items-center justify-center overflow-hidden bg-gray-100">
                            {!imageLoaded && !showingSecondImage && (
                                <div className="absolute inset-0 flex items-center justify-center bg-gray-100 z-20">
                                    <div className="flex flex-col items-center gap-3">
                                        <div className="animate-spin rounded-full h-16 w-16 border-4 border-gray-300 border-t-blue-600"></div>
                                        <p className="text-gray-600 text-base font-medium">Loading image...</p>
                                    </div>
                                </div>
                            )}

                            {/* First Image */}
                            <img
                                src={popupImageUrl}
                                alt="Welcome"
                                className={`absolute inset-0 w-full h-full object-cover ${
                                    imageLoaded && !showingSecondImage ? 'popup-image-animation' :
                                    showingSecondImage ? 'popup-image-fadeout' : 'opacity-0'
                                }`}
                                style={{ transformOrigin: 'top left' }}
                                onLoad={() => setImageLoaded(true)}
                            />

                            {/* Second Image - only show if exists */}
                            {popupImage2Url && showingSecondImage && (
                                <>
                                    {!image2Loaded && (
                                        <div className="absolute inset-0 flex items-center justify-center bg-gray-100 z-20">
                                            <div className="flex flex-col items-center gap-3">
                                                <div className="animate-spin rounded-full h-16 w-16 border-4 border-gray-300 border-t-blue-600"></div>
                                                <p className="text-gray-600 text-base font-medium">Loading next image...</p>
                                            </div>
                                        </div>
                                    )}
                                    <img
                                        src={popupImage2Url}
                                        alt="Welcome 2"
                                        className={`absolute inset-0 w-full h-full object-cover cursor-pointer ${
                                            image2Loaded ? 'popup-image-2-animation' : 'opacity-0'
                                        }`}
                                        style={{ transformOrigin: 'center' }}
                                        onLoad={() => setImage2Loaded(true)}
                                        onClick={handleClosePopup}
                                    />
                                </>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Footer */}
            <footer className="bg-gray-900 text-gray-300 py-12 px-4 sm:px-6 lg:px-8">
                <div className="max-w-7xl mx-auto">
                    <div className="grid md:grid-cols-4 gap-8 mb-8">
                        <div>
                            <div className="mb-4">
                                <Logo
                                    text="TajMap"
                                    iconClassName="h-8 w-8"
                                    textClassName="ml-2 text-xl font-bold text-white"
                                />
                            </div>
                            <p className="text-sm">
                                Your trusted partner in finding the perfect plot of land.
                            </p>
                        </div>
                        <div>
                            <h4 className="text-white font-semibold mb-4">Quick Links</h4>
                            <ul className="space-y-2 text-sm">
                                <li><a href="#map" className="hover:text-white transition">View Map</a></li>
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
