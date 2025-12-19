import { Link } from 'react-router-dom';
import React, { useState, useEffect, useCallback } from "react";
import {
    XMarkIcon,
    PauseIcon,
    PlayIcon
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
    const [isPaused, setIsPaused] = useState(false);
    const [loadingProgress, setLoadingProgress] = useState(0);
    const [imagesReady, setImagesReady] = useState(false);
    const [firstImageReady, setFirstImageReady] = useState(false);

    // Preload both images and track combined loading progress
    const preloadImages = (url1, url2) => {
        setLoadingProgress(0);
        setImagesReady(false);
        setFirstImageReady(false);
        setImageLoaded(false);
        setImage2Loaded(false);

        let image1Progress = 0;
        let image2Progress = 0;
        let image1Complete = false;
        let image2Complete = false;
        let image1BlobUrl = null;
        let image2BlobUrl = null;
        const hasSecondImage = !!url2;

        const calculateCombinedProgress = () => {
            // Combined progress: average of both images
            if (hasSecondImage) {
                return (image1Progress + image2Progress) / 2;
            }
            return image1Progress;
        };

        const updateProgress = () => {
            const combinedProgress = calculateCombinedProgress();
            setLoadingProgress(Math.min(100, Math.round(combinedProgress)));

            // Show first image as soon as it's ready
            if (image1Complete && !firstImageReady) {
                // Use blob URL if available, otherwise original URL is already set
                if (image1BlobUrl) {
                    setPopupImageUrl(image1BlobUrl);
                }
                // Always show first image, even if XHR failed (will use original URL)
                setFirstImageReady(true);
                setImageLoaded(true);
            }

            // Check if both images are ready (hide preloader)
            if (image1Complete && (image2Complete || !hasSecondImage)) {
                setLoadingProgress(100);
                // Update second image URL to blob URL if available
                if (image2BlobUrl) {
                    setPopupImage2Url(image2BlobUrl);
                }
                // Small delay to show 100% before hiding preloader
                setTimeout(() => {
                    setImagesReady(true);
                    if (hasSecondImage) {
                        setImage2Loaded(true);
                    }
                }, 200);
            }
        };

        // Load first image with progress tracking
        const xhr1 = new XMLHttpRequest();
        xhr1.open('GET', url1, true);
        xhr1.responseType = 'blob';

        xhr1.onprogress = (e) => {
            if (e.lengthComputable && e.total > 0) {
                image1Progress = (e.loaded / e.total) * 100;
                updateProgress();
            }
        };

        xhr1.onload = () => {
            if (xhr1.status === 200) {
                image1BlobUrl = URL.createObjectURL(xhr1.response);
                image1Progress = 100;
                image1Complete = true;
                updateProgress();
            } else {
                console.error('Failed to load first popup image');
                image1Progress = 100;
                image1Complete = true;
                updateProgress();
            }
        };

        xhr1.onerror = () => {
            console.warn('XHR failed for first image, falling back to Image loading');
            // Fallback to regular Image loading if XHR fails (e.g., CORS issues)
            const img1 = new Image();
            img1.onload = () => {
                image1Progress = 100;
                image1Complete = true;
                updateProgress();
            };
            img1.onerror = () => {
                console.error('Failed to load first popup image');
                image1Progress = 100;
                image1Complete = true;
                updateProgress();
            };
            img1.src = url1;
        };

        xhr1.send();

        // Load second image (if exists) with progress tracking
        if (hasSecondImage) {
            const xhr2 = new XMLHttpRequest();
            xhr2.open('GET', url2, true);
            xhr2.responseType = 'blob';

            xhr2.onprogress = (e) => {
                if (e.lengthComputable && e.total > 0) {
                    image2Progress = (e.loaded / e.total) * 100;
                    updateProgress();
                }
            };

            xhr2.onload = () => {
                if (xhr2.status === 200) {
                    image2BlobUrl = URL.createObjectURL(xhr2.response);
                    image2Progress = 100;
                    image2Complete = true;
                    updateProgress();
                } else {
                    console.error('Failed to load second popup image');
                    image2Progress = 100;
                    image2Complete = true;
                    updateProgress();
                }
            };

            xhr2.onerror = () => {
                console.warn('XHR failed for second image, falling back to Image loading');
                // Fallback to regular Image loading if XHR fails (e.g., CORS issues)
                const img2 = new Image();
                img2.onload = () => {
                    image2Progress = 100;
                    image2Complete = true;
                    updateProgress();
                };
                img2.onerror = () => {
                    console.error('Failed to load second popup image');
                    image2Progress = 100;
                    image2Complete = true;
                    updateProgress();
                };
                img2.src = url2;
            };

            xhr2.send();
        } else {
            // If no second image, mark it as complete
            image2Progress = 100;
            image2Complete = true;
            updateProgress();
        }
    };

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

                    // Preload both images and track progress
                    preloadImages(popupImageUrl, popupImage2Url || '');

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
        if (imagesReady && imageLoaded && popupImage2Url && !showingSecondImage) {
            // Wait 6 seconds (when first image stops at second-last tween)
            const transitionTimer = setTimeout(() => {
                setShowingSecondImage(true);
            }, 6000); // 6 seconds - first image animation completes

            return () => clearTimeout(transitionTimer);
        }
    }, [imagesReady, imageLoaded, popupImage2Url, showingSecondImage]);

    // Auto-close popup 8 seconds after second image is shown
    useEffect(() => {
        if (showingSecondImage && popupImage2Url && image2Loaded) {
            const autoCloseTimer = setTimeout(() => {
                handleClosePopup();
            }, 3000); // 8 seconds after second image is displayed

            return () => clearTimeout(autoCloseTimer);
        }
    }, [showingSecondImage, popupImage2Url, image2Loaded, handleClosePopup]);

    const handleClosePopup = useCallback(() => {
        setPopupClosing(true);
        setTimeout(() => {
            setShowPopup(false);
            setPopupClosing(false);
            setImageLoaded(false);
            setImage2Loaded(false);
            setShowingSecondImage(false);
            setIsPaused(false);
            setLoadingProgress(0);
            setImagesReady(false);
            setFirstImageReady(false);
            // Cleanup blob URLs if they exist
            if (popupImageUrl && popupImageUrl.startsWith('blob:')) {
                URL.revokeObjectURL(popupImageUrl);
            }
            if (popupImage2Url && popupImage2Url.startsWith('blob:')) {
                URL.revokeObjectURL(popupImage2Url);
            }
        }, 300);
    }, [popupImageUrl, popupImage2Url]);

    const togglePause = () => {
        setIsPaused(!isPaused);
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
                        className="relative max-w-6xl w-full bg-white rounded-lg shadow-2xl overflow-hidden"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Control Buttons */}
                        <div className="absolute top-4 right-4 z-10 flex gap-2">
                            {/* Pause/Play Button */}
                            <button
                                onClick={togglePause}
                                className={`${
                                    isPaused
                                        ? 'bg-green-500 hover:bg-green-600'
                                        : 'bg-blue-500 hover:bg-blue-600'
                                } rounded-full p-2 shadow-lg transition-all hover:scale-110`}
                                aria-label={isPaused ? "Resume animation" : "Pause animation"}
                            >
                                {isPaused ? (
                                    <PlayIcon className="w-6 h-6 text-white" />
                                ) : (
                                    <PauseIcon className="w-6 h-6 text-white" />
                                )}
                            </button>

                            {/* Close Button */}
                            <button
                                onClick={handleClosePopup}
                                className="bg-red-500 hover:bg-red-600 rounded-full p-2 shadow-lg transition-all hover:scale-110"
                                aria-label="Close popup"
                            >
                                <XMarkIcon className="w-6 h-6 text-white" />
                            </button>
                        </div>

                        {/* Animated Images */}
                        <div className="relative w-full aspect-[16/9] overflow-hidden bg-gray-100">
                            {/* First Image - show as soon as it's ready, start animation */}
                            {firstImageReady && (
                                <img
                                    src={popupImageUrl}
                                    alt="Welcome"
                                    className={`absolute inset-0 w-full h-full object-cover popup-image-animation`}
                                    style={{
                                        transformOrigin: 'top left',
                                        zIndex: 1,
                                        animationPlayState: isPaused ? 'paused' : 'running'
                                    }}
                                />
                            )}

                            {/* Percentage Preloader - overlay on top until both images ready */}
                            {!imagesReady && (
                                <div className="absolute inset-0 flex items-center justify-center z-20 bg-black bg-opacity-40 backdrop-blur-sm transition-opacity">
                                    <div className="flex flex-col items-center gap-4">
                                        {/* Circular Progress */}
                                        <div className="relative w-32 h-32">
                                            <svg className="w-32 h-32 transform -rotate-90" viewBox="0 0 120 120">
                                                {/* Background Circle */}
                                                <circle
                                                    cx="60"
                                                    cy="60"
                                                    r="54"
                                                    stroke="currentColor"
                                                    strokeWidth="8"
                                                    fill="none"
                                                    className="text-white opacity-30"
                                                />
                                                {/* Progress Circle */}
                                                <circle
                                                    cx="60"
                                                    cy="60"
                                                    r="54"
                                                    stroke="currentColor"
                                                    strokeWidth="8"
                                                    fill="none"
                                                    strokeDasharray={`${2 * Math.PI * 54}`}
                                                    strokeDashoffset={`${2 * Math.PI * 54 * (1 - loadingProgress / 100)}`}
                                                    strokeLinecap="round"
                                                    className="text-white transition-all duration-300 ease-out"
                                                />
                                            </svg>
                                            {/* Percentage Text */}
                                            <div className="absolute inset-0 flex items-center justify-center">
                                                <span className="text-2xl font-bold text-white drop-shadow-lg">
                                                    {Math.round(loadingProgress)}%
                                                </span>
                                            </div>
                                        </div>
                                        <p className="text-white text-base font-medium drop-shadow-lg">
                                            Loading...
                                        </p>
                                    </div>
                                </div>
                            )}

                            {/* Second Image - plays on top of frozen first image */}
                            {imagesReady && popupImage2Url && showingSecondImage && image2Loaded && (
                                <img
                                    src={popupImage2Url}
                                    alt="Welcome 2"
                                    className="absolute inset-0 w-full h-full object-cover cursor-pointer popup-image-2-animation"
                                    style={{
                                        transformOrigin: '75% 25%',
                                        zIndex: 2,
                                        animationPlayState: isPaused ? 'paused' : 'running'
                                    }}
                                    onClick={handleClosePopup}
                                />
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Footer */}
            <footer className="bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-gray-300 py-16 px-4 sm:px-6 lg:px-8">
                <div className="max-w-6xl mx-auto">
                    <div className="grid md:grid-cols-3 gap-12 mb-12">
                        <div className="md:col-span-1">
                            <div className="mb-6">
                                <Logo
                                    text="TajMap"
                                    iconClassName="h-10 w-10"
                                    textClassName="ml-2 text-2xl font-bold text-white"
                                />
                            </div>
                            <p className="text-gray-400 leading-relaxed">
                                Your trusted partner in finding the perfect plot of land. Explore premium properties with confidence.
                            </p>
                        </div>
                        <div>
                            <h4 className="text-white font-bold text-lg mb-6 border-b border-gray-700 pb-2">Quick Links</h4>
                            <ul className="space-y-3">
                                <li><a href="#map" className="hover:text-white hover:pl-2 transition-all duration-200 inline-block">View Map</a></li>
                                <li><Link to="/plots" className="hover:text-white hover:pl-2 transition-all duration-200 inline-block">Browse Plots</Link></li>
                                <li><Link to="/login" className="hover:text-white hover:pl-2 transition-all duration-200 inline-block">Login</Link></li>
                                <li><Link to="/register" className="hover:text-white hover:pl-2 transition-all duration-200 inline-block">Register</Link></li>
                            </ul>
                        </div>
                        <div>
                            <h4 className="text-white font-bold text-lg mb-6 border-b border-gray-700 pb-2">Company</h4>
                            <ul className="space-y-3">
                                <li><a href="https://tajpk.com/about-us/" target="_blank" rel="noopener noreferrer" className="hover:text-white hover:pl-2 transition-all duration-200 inline-block">About Us</a></li>
                                <li><a href="https://tajpk.com/contact-us/" target="_blank" rel="noopener noreferrer" className="hover:text-white hover:pl-2 transition-all duration-200 inline-block">Contact</a></li>
                            </ul>
                        </div>
                    </div>
                    <div className="border-t border-gray-700 pt-8 mt-8">
                        <p className="text-center text-gray-500 text-sm">&copy; 2025 TajMap. All rights reserved.</p>
                    </div>
                </div>
            </footer>
        </div>
    );
}
