import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import InteractiveMap from '../../components/InteractiveMap';
import Logo from '../../components/Logo';
import { plotService, leadService, settingService, savedPlotService } from '../../services/api';
import { usePlotStore } from '../../store/plotStore';
import { useAuthStore } from '../../store/authStore';
import toast from 'react-hot-toast';
import {
    MapIcon,
    FunnelIcon,
    ViewColumnsIcon,
    Squares2X2Icon,
    MagnifyingGlassIcon,
    XMarkIcon,
    HomeIcon,
    CheckCircleIcon,
    ChevronLeftIcon,
    ChevronRightIcon,
    CurrencyDollarIcon,
    ScaleIcon,
    MapPinIcon,
    AdjustmentsHorizontalIcon,
    BookmarkIcon
} from '@heroicons/react/24/outline';
import { BookmarkIcon as BookmarkSolidIcon } from '@heroicons/react/24/solid';

export default function PlotListPage() {
    const { plots, setPlots, filters, setFilters } = usePlotStore();
    const { user, token } = useAuthStore();
    const [loading, setLoading] = useState(true);
    const [viewMode, setViewMode] = useState('map'); // map or list
    const [selectedPlot, setSelectedPlot] = useState(null);
    const [showLeadModal, setShowLeadModal] = useState(false);
    const [leadForm, setLeadForm] = useState({ name: '', phone: '', email: '', message: '' });
    const [submitting, setSubmitting] = useState(false);
    const [showPrices, setShowPrices] = useState(true);
    const [savedPlotIds, setSavedPlotIds] = useState([]);

    // Pagination state
    const [pagination, setPagination] = useState({
        current_page: 1,
        last_page: 1,
        per_page: 12,
        total: 0,
    });

    // Sectors and streets for filters
    const [sectors, setSectors] = useState([]);
    const [streets, setStreets] = useState([]);

    // All plots for map view (without pagination)
    const [allPlots, setAllPlots] = useState([]);

    useEffect(() => {
        fetchSectors();
        fetchSettings();
        if (token) {
            fetchSavedPlots();
        }
    }, [token]);

    const fetchSettings = async () => {
        try {
            const response = await settingService.getByGroup('appearance');
            // getByGroup returns an object like { key: value }, not an array
            const settings = response.data || {};

            // Get show_plot_prices setting
            const showPricesValue = settings.show_plot_prices;
            if (showPricesValue !== undefined) {
                setShowPrices(
                    showPricesValue === true ||
                    showPricesValue === 'true' ||
                    showPricesValue === '1' ||
                    showPricesValue === 1
                );
            }
        } catch (error) {
            // Silently fail and use default
        }
    };

    const fetchSavedPlots = async () => {
        try {
            const response = await savedPlotService.getAll();
            let savedPlots = [];
            if (Array.isArray(response.data)) {
                savedPlots = response.data;
            } else if (response.data?.data && Array.isArray(response.data.data)) {
                savedPlots = response.data.data;
            }
            // savedPlots contains Plot objects directly, so use plot.id
            const ids = savedPlots.map(plot => plot.id);
            setSavedPlotIds(ids);
        } catch (error) {
            console.error('Failed to fetch saved plots:', error);
        }
    };

    const handleSavePlot = async (plotId) => {
        if (!token) {
            toast.error('Please login to save plots');
            return;
        }

        try {
            await savedPlotService.save(plotId);
            setSavedPlotIds([...savedPlotIds, plotId]);
            toast.success('Plot saved successfully');
        } catch (error) {
            toast.error('Failed to save plot');
        }
    };

    const handleUnsavePlot = async (plotId) => {
        try {
            await savedPlotService.remove(plotId);
            setSavedPlotIds(savedPlotIds.filter(id => id !== plotId));
            toast.success('Plot removed from saved');
        } catch (error) {
            toast.error('Failed to remove plot');
        }
    };

    useEffect(() => {
        if (filters.sector) {
            fetchStreets(filters.sector);
        }
    }, [filters.sector]);

    useEffect(() => {
        if (viewMode === 'list') {
            fetchPlots();
        } else {
            fetchAllPlots();
        }
    }, [filters, pagination.current_page, viewMode]);

    const fetchSectors = async () => {
        try {
            const response = await plotService.getSectors();
            setSectors(response.data?.sectors || []);
        } catch (error) {
            // Silently fail
        }
    };

    const fetchStreets = async (sector) => {
        try {
            const response = await plotService.getStreets({ sector });
            setStreets(response.data?.streets || []);
        } catch (error) {
            // Silently fail
        }
    };

    const fetchPlots = async () => {
        setLoading(true);
        try {
            const response = await plotService.getAll({
                ...filters,
                per_page: pagination.per_page,
                page: pagination.current_page,
            });

            const data = response.data;

            // Check if pagination data is in meta object (Laravel Resource) or at root level
            const paginationData = data.meta || data;

            setPlots(data.data || []);

            // Update pagination metadata
            setPagination({
                current_page: paginationData.current_page || 1,
                last_page: paginationData.last_page || 1,
                per_page: paginationData.per_page || 12,
                total: paginationData.total || 0,
                from: paginationData.from || 0,
                to: paginationData.to || 0,
            });
        } catch (error) {
            toast.error('Failed to load plots');
        } finally {
            setLoading(false);
        }
    };

    const fetchAllPlots = async () => {
        setLoading(true);
        try {
            const response = await plotService.getAll({ ...filters, per_page: 1000 });
            const data = response.data;
            setAllPlots(data.data || []);
        } catch (error) {
            toast.error('Failed to load plots');
        } finally {
            setLoading(false);
        }
    };

    const handlePlotClick = (plot) => {
        setSelectedPlot(plot);
        setShowLeadModal(true);
    };

    const handleLeadSubmit = async (e) => {
        e.preventDefault();
        try {
            setSubmitting(true);
            await leadService.submit({ ...leadForm, plot_id: selectedPlot.id });
            toast.success('Thank you for your interest! We will contact you soon.');
            setShowLeadModal(false);
            setLeadForm({ name: '', phone: '', email: '', message: '' });
        } catch (error) {
            toast.error('Failed to submit inquiry');
        } finally {
            setSubmitting(false);
        }
    };

    const handleFilterChange = (newFilters) => {
        setFilters(newFilters);
        setPagination(prev => ({ ...prev, current_page: 1 })); // Reset to page 1 when filters change
    };

    const handleResetFilters = () => {
        // Explicitly clear all filter fields with null instead of empty strings
        setFilters({
            search: null,
            status: null,
            sector: null,
            street: null,
            type: null,
            category: null,
            min_price: null,
            max_price: null,
            min_area: null,
            max_area: null,
            sort_by: null,
            sort_order: null
        });
        setStreets([]);
        setPagination(prev => ({ ...prev, current_page: 1 }));
    };

    const handlePageChange = (page) => {
        setPagination(prev => ({ ...prev, current_page: page }));
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    // Calculate statistics from all plots for map view or paginated data for list view
    const displayPlots = viewMode === 'map' ? allPlots : plots;
    const stats = {
        total: viewMode === 'map' ? allPlots.length : pagination.total,
        available: displayPlots.filter(p => p.status === 'available').length,
        reserved: displayPlots.filter(p => p.status === 'reserved').length,
        sold: displayPlots.filter(p => p.status === 'sold').length,
    };

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <header className="bg-white shadow-sm border-b sticky top-0 z-40">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center h-16">
                        <div className="flex items-center gap-4">
                            <Link to="/" className="hover:opacity-80 transition">
                                <Logo
                                    text="TajMap"
                                    iconClassName="h-8 w-8"
                                    textClassName="ml-2 text-xl font-bold text-gray-900"
                                />
                            </Link>
                            <span className="text-gray-300">|</span>
                            <h1 className="text-xl font-semibold text-gray-900">Browse Plots</h1>
                        </div>
                        <Link
                            to="/"
                            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition"
                        >
                            <HomeIcon className="h-5 w-5" />
                            <span className="hidden sm:inline">Back to Home</span>
                        </Link>
                    </div>
                </div>
            </header>

            {/* Hero Section */}
            <section className="bg-gradient-to-r from-blue-600 to-blue-800 text-white py-12">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center">
                        <h2 className="text-4xl font-bold mb-4">Find Your Perfect Plot</h2>
                        <p className="text-xl text-blue-100 max-w-2xl mx-auto">
                            Explore our interactive map and detailed listings to discover the ideal plot for your dream project
                        </p>
                    </div>
                </div>
            </section>

            {/* Statistics Cards */}
            <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-8">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="bg-white rounded-lg shadow p-6 text-center">
                        <div className="text-3xl font-bold text-gray-900">{stats.total}</div>
                        <div className="text-sm text-gray-600 mt-1">Total Plots</div>
                    </div>
                    <div className="bg-white rounded-lg shadow p-6 text-center">
                        <div className="text-3xl font-bold text-green-600">{stats.available}</div>
                        <div className="text-sm text-gray-600 mt-1">Available</div>
                    </div>
                    <div className="bg-white rounded-lg shadow p-6 text-center">
                        <div className="text-3xl font-bold text-yellow-600">{stats.reserved}</div>
                        <div className="text-sm text-gray-600 mt-1">Reserved</div>
                    </div>
                    <div className="bg-white rounded-lg shadow p-6 text-center">
                        <div className="text-3xl font-bold text-red-600">{stats.sold}</div>
                        <div className="text-sm text-gray-600 mt-1">Sold</div>
                    </div>
                </div>
            </section>

            {/* Main Content */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="flex flex-col lg:flex-row gap-6">
                    {/* Filters Sidebar */}
                    <aside className="lg:w-80 space-y-4">
                        <div className="bg-white rounded-lg shadow p-6">
                            <div className="flex items-center gap-2 mb-4">
                                <FunnelIcon className="h-5 w-5 text-gray-600" />
                                <h3 className="font-bold text-lg">Filters</h3>
                            </div>

                            <div className="space-y-4">
                                {/* Search Filter - Moved to Top */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Search Plot Number
                                    </label>
                                    <div className="relative">
                                        <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                                        <input
                                            type="text"
                                            value={filters.search || ''}
                                            onChange={(e) => handleFilterChange({ ...filters, search: e.target.value })}
                                            placeholder="e.g., P-001"
                                            className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        />
                                    </div>
                                </div>

                                {/* Status Filter */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Status
                                    </label>
                                    <select
                                        value={filters.status || ''}
                                        onChange={(e) => handleFilterChange({ ...filters, status: e.target.value || null })}
                                        className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    >
                                        <option value="">All Statuses</option>
                                        <option value="available">Available</option>
                                        <option value="reserved">Reserved</option>
                                        <option value="sold">Sold</option>
                                    </select>
                                </div>

                                {/* Sector Filter */}
                                <div>
                                    <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                                        <MapPinIcon className="h-4 w-4" />
                                        Sector
                                    </label>
                                    <select
                                        value={filters.sector || ''}
                                        onChange={(e) => handleFilterChange({ ...filters, sector: e.target.value || null, street: null })}
                                        className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    >
                                        <option value="">All Sectors</option>
                                        {sectors.map(sector => (
                                            <option key={sector} value={sector}>{sector}</option>
                                        ))}
                                    </select>
                                </div>

                                {/* Street Filter */}
                                <div>
                                    <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                                        <Squares2X2Icon className="h-4 w-4" />
                                        Street
                                    </label>
                                    <select
                                        value={filters.street || ''}
                                        onChange={(e) => handleFilterChange({ ...filters, street: e.target.value || null })}
                                        className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        disabled={!filters.sector}
                                    >
                                        <option value="">All Streets</option>
                                        {streets.map(street => (
                                            <option key={street} value={street}>{street}</option>
                                        ))}
                                    </select>
                                </div>

                                {/* Area Range */}
                                <div>
                                    <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                                        <ScaleIcon className="h-4 w-4" />
                                        Area Range (sq. units)
                                    </label>
                                    <div className="grid grid-cols-2 gap-2">
                                        <input
                                            type="number"
                                            placeholder="Min"
                                            value={filters.min_area || ''}
                                            onChange={(e) => handleFilterChange({ ...filters, min_area: e.target.value })}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        />
                                        <input
                                            type="number"
                                            placeholder="Max"
                                            value={filters.max_area || ''}
                                            onChange={(e) => handleFilterChange({ ...filters, max_area: e.target.value })}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        />
                                    </div>
                                </div>

                                {/* Sort Options */}
                                <div>
                                    <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                                        <AdjustmentsHorizontalIcon className="h-4 w-4" />
                                        Sort By
                                    </label>
                                    <select
                                        value={`${filters.sort_by || 'created_at'}-${filters.sort_order || 'desc'}`}
                                        onChange={(e) => {
                                            const [sort_by, sort_order] = e.target.value.split('-');
                                            handleFilterChange({ ...filters, sort_by, sort_order });
                                        }}
                                        className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    >
                                        <option value="created_at-desc">Newest First</option>
                                        <option value="created_at-asc">Oldest First</option>
                                        <option value="area-asc">Area: Small to Large</option>
                                        <option value="area-desc">Area: Large to Small</option>
                                        <option value="plot_number-asc">Plot Number: A-Z</option>
                                        <option value="plot_number-desc">Plot Number: Z-A</option>
                                    </select>
                                </div>

                                {/* Reset Button */}
                                <button
                                    onClick={handleResetFilters}
                                    className="w-full bg-gray-100 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-200 transition font-medium"
                                >
                                    Reset Filters
                                </button>
                            </div>
                        </div>

                        {/* Help Card */}
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
                            <h4 className="font-bold text-blue-900 mb-3">Need Help?</h4>
                            <p className="text-sm text-blue-800 mb-4">
                                Can't find what you're looking for? Our team is here to help you find the perfect plot.
                            </p>
                            <Link
                                to="/"
                                className="block text-center bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition text-sm font-medium"
                            >
                                Contact Us
                            </Link>
                        </div>

                        {/* Quick Tips */}
                        <div className="bg-white rounded-lg shadow p-6">
                            <h4 className="font-bold text-gray-900 mb-3">Quick Tips</h4>
                            <ul className="space-y-2 text-sm text-gray-600">
                                <li className="flex items-start gap-2">
                                    <CheckCircleIcon className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                                    <span>Hover over plots to see details</span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <CheckCircleIcon className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                                    <span>Click on available plots to inquire</span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <CheckCircleIcon className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                                    <span>Use filters to narrow down options</span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <CheckCircleIcon className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                                    <span>Switch between map and list views</span>
                                </li>
                            </ul>
                        </div>
                    </aside>

                    {/* Main Content Area */}
                    <main className="flex-1 space-y-6">
                        {/* View Toggle & Results Count */}
                        <div className="bg-white rounded-lg shadow p-4">
                            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => setViewMode('map')}
                                        className={`flex items-center gap-2 px-4 py-2 rounded-md transition ${
                                            viewMode === 'map'
                                                ? 'bg-blue-600 text-white'
                                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                        }`}
                                    >
                                        <MapIcon className="h-5 w-5" />
                                        Map View
                                    </button>
                                    <button
                                        onClick={() => setViewMode('list')}
                                        className={`flex items-center gap-2 px-4 py-2 rounded-md transition ${
                                            viewMode === 'list'
                                                ? 'bg-blue-600 text-white'
                                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                        }`}
                                    >
                                        <ViewColumnsIcon className="h-5 w-5" />
                                        List View
                                    </button>
                                </div>
                                <div className="text-gray-600 font-medium">
                                    {viewMode === 'list' && pagination.total > 0 ? (
                                        <span>
                                            Showing <span className="text-blue-600 font-bold">{pagination.from}</span> to{' '}
                                            <span className="text-blue-600 font-bold">{pagination.to}</span> of{' '}
                                            <span className="text-blue-600 font-bold">{pagination.total}</span> plots
                                        </span>
                                    ) : (
                                        <span>
                                            <span className="text-blue-600 font-bold">{displayPlots.length}</span>{' '}
                                            {displayPlots.length === 1 ? 'plot' : 'plots'} found
                                        </span>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Content */}
                        {loading ? (
                            <div className="bg-white rounded-lg shadow p-20 text-center">
                                <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600 mx-auto"></div>
                                <p className="mt-6 text-gray-600 text-lg">Loading plots...</p>
                            </div>
                        ) : displayPlots.length === 0 ? (
                            <div className="bg-white rounded-lg shadow p-20 text-center">
                                <Squares2X2Icon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                                <h3 className="text-xl font-bold text-gray-900 mb-2">No plots found</h3>
                                <p className="text-gray-600 mb-4">Try adjusting your filters to see more results</p>
                                <button
                                    onClick={handleResetFilters}
                                    className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 transition"
                                >
                                    Reset Filters
                                </button>
                            </div>
                        ) : viewMode === 'map' ? (
                            <div>
                                <InteractiveMap onPlotClick={handlePlotClick} filters={filters} />
                            </div>
                        ) : (
                            <>
                                <div className="grid gap-6">
                                    {plots.map(plot => (
                                        <div key={plot.id} className="bg-white rounded-lg shadow hover:shadow-lg transition">
                                            <div className="p-6">
                                                <div className="flex flex-col md:flex-row justify-between items-start gap-4">
                                                    <div className="flex-1">
                                                        <div className="flex items-start justify-between gap-4">
                                                            <div>
                                                                <h3 className="text-2xl font-bold text-gray-900">{plot.plot_number}</h3>
                                                                <p className="text-gray-600 mt-1">
                                                                    {plot.sector && `Sector ${plot.sector}`}
                                                                    {plot.street && `, Street ${plot.street}`}
                                                                </p>
                                                            </div>
                                                            <span className={`px-3 py-1 rounded-full text-sm font-semibold whitespace-nowrap ${
                                                                plot.status === 'available' ? 'bg-green-100 text-green-800' :
                                                                plot.status === 'reserved' ? 'bg-yellow-100 text-yellow-800' :
                                                                'bg-red-100 text-red-800'
                                                            }`}>
                                                                {plot.status}
                                                            </span>
                                                        </div>

                                                        <div className="mt-4 grid grid-cols-2 gap-4">
                                                            <div>
                                                                <p className="text-sm text-gray-600">Area</p>
                                                                <p className="text-lg font-semibold text-gray-900">{plot.area} sq. units</p>
                                                            </div>
                                                            <div>
                                                                <p className="text-sm text-gray-600">Price</p>
                                                                <p className="text-lg font-semibold text-blue-600">Contact for price</p>
                                                            </div>
                                                        </div>

                                                        {plot.description && (
                                                            <div className="mt-4">
                                                                <p className="text-sm text-gray-600">Description</p>
                                                                <p className="text-gray-700 mt-1">{plot.description}</p>
                                                            </div>
                                                        )}
                                                    </div>

                                                    <div className="flex flex-col gap-2 w-full md:w-auto">
                                                        <button
                                                            onClick={() => handlePlotClick(plot)}
                                                            className={`px-6 py-3 rounded-md font-semibold transition whitespace-nowrap ${
                                                                plot.status === 'available'
                                                                    ? 'bg-blue-600 text-white hover:bg-blue-700'
                                                                    : 'bg-gray-300 text-gray-600 cursor-not-allowed'
                                                            }`}
                                                            disabled={plot.status !== 'available'}
                                                        >
                                                            {plot.status === 'available' ? 'Inquire Now' : 'Not Available'}
                                                        </button>
                                                        {token && (
                                                            <button
                                                                onClick={() => savedPlotIds.includes(plot.id) ? handleUnsavePlot(plot.id) : handleSavePlot(plot.id)}
                                                                className={`px-6 py-3 rounded-md font-semibold transition whitespace-nowrap flex items-center justify-center gap-2 ${
                                                                    savedPlotIds.includes(plot.id)
                                                                        ? 'bg-yellow-600 text-white hover:bg-yellow-700'
                                                                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                                                                }`}
                                                            >
                                                                {savedPlotIds.includes(plot.id) ? (
                                                                    <>
                                                                        <BookmarkSolidIcon className="h-5 w-5" />
                                                                        Saved
                                                                    </>
                                                                ) : (
                                                                    <>
                                                                        <BookmarkIcon className="h-5 w-5" />
                                                                        Save Plot
                                                                    </>
                                                                )}
                                                            </button>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                {/* Pagination Controls */}
                                {pagination.last_page > 1 && (
                                    <div className="bg-white rounded-lg shadow p-4">
                                        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                                            <div className="text-sm text-gray-600">
                                                Page {pagination.current_page} of {pagination.last_page}
                                            </div>
                                            <div className="flex items-center gap-2">
                                                {/* Previous Button */}
                                                <button
                                                    onClick={() => handlePageChange(pagination.current_page - 1)}
                                                    disabled={pagination.current_page === 1}
                                                    className="px-3 py-2 rounded-md border border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition"
                                                >
                                                    <ChevronLeftIcon className="h-5 w-5" />
                                                </button>

                                                {/* Page Numbers */}
                                                <div className="flex gap-1">
                                                    {[...Array(pagination.last_page)].map((_, index) => {
                                                        const page = index + 1;
                                                        // Show first, last, current, and adjacent pages
                                                        if (
                                                            page === 1 ||
                                                            page === pagination.last_page ||
                                                            (page >= pagination.current_page - 1 && page <= pagination.current_page + 1)
                                                        ) {
                                                            return (
                                                                <button
                                                                    key={page}
                                                                    onClick={() => handlePageChange(page)}
                                                                    className={`px-4 py-2 rounded-md transition ${
                                                                        page === pagination.current_page
                                                                            ? 'bg-blue-600 text-white font-semibold'
                                                                            : 'border border-gray-300 hover:bg-gray-50'
                                                                    }`}
                                                                >
                                                                    {page}
                                                                </button>
                                                            );
                                                        } else if (
                                                            page === pagination.current_page - 2 ||
                                                            page === pagination.current_page + 2
                                                        ) {
                                                            return <span key={page} className="px-2 py-2 text-gray-500">...</span>;
                                                        }
                                                        return null;
                                                    })}
                                                </div>

                                                {/* Next Button */}
                                                <button
                                                    onClick={() => handlePageChange(pagination.current_page + 1)}
                                                    disabled={pagination.current_page === pagination.last_page}
                                                    className="px-3 py-2 rounded-md border border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition"
                                                >
                                                    <ChevronRightIcon className="h-5 w-5" />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </>
                        )}
                    </main>
                </div>
            </div>

            {/* Lead Form Modal */}
            {showLeadModal && selectedPlot && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                        <div className="p-6">
                            <div className="flex justify-between items-start mb-4">
                                <div>
                                    <h3 className="text-2xl font-bold text-gray-900">
                                        {selectedPlot.status === 'available' ? 'Inquire About Plot' : 'Plot Details'}
                                    </h3>
                                    <div className="flex items-center gap-2 mt-1">
                                        <p className="text-gray-600">{selectedPlot.plot_number}</p>
                                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                                            selectedPlot.status === 'available' ? 'bg-green-100 text-green-800' :
                                            selectedPlot.status === 'reserved' ? 'bg-yellow-100 text-yellow-800' :
                                            'bg-red-100 text-red-800'
                                        }`}>
                                            {selectedPlot.status}
                                        </span>
                                    </div>
                                </div>
                                <button
                                    onClick={() => setShowLeadModal(false)}
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
                                        <p className="font-semibold">{selectedPlot.sector || 'N/A'}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-600">Street</p>
                                        <p className="font-semibold">{selectedPlot.street || 'N/A'}</p>
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

                            {selectedPlot.status === 'available' ? (
                                <form onSubmit={handleLeadSubmit} className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Name <span className="text-red-500">*</span>
                                        </label>
                                        <input
                                            type="text"
                                            value={leadForm.name}
                                            onChange={(e) => setLeadForm({ ...leadForm, name: e.target.value })}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            required
                                        />
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                Phone <span className="text-red-500">*</span>
                                            </label>
                                            <input
                                                type="tel"
                                                value={leadForm.phone}
                                                onChange={(e) => setLeadForm({ ...leadForm, phone: e.target.value })}
                                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                required
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                Email
                                            </label>
                                            <input
                                                type="email"
                                                value={leadForm.email}
                                                onChange={(e) => setLeadForm({ ...leadForm, email: e.target.value })}
                                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Message</label>
                                        <textarea
                                            value={leadForm.message}
                                            onChange={(e) => setLeadForm({ ...leadForm, message: e.target.value })}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            rows="4"
                                            placeholder="Tell us about your requirements..."
                                        ></textarea>
                                    </div>
                                    <div className="flex gap-3 justify-end pt-4">
                                        <button
                                            type="button"
                                            onClick={() => setShowLeadModal(false)}
                                            className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition"
                                            disabled={submitting}
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            type="submit"
                                            className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition disabled:bg-gray-400"
                                            disabled={submitting}
                                        >
                                            {submitting ? 'Submitting...' : 'Submit Inquiry'}
                                        </button>
                                    </div>
                                </form>
                            ) : (
                                <div>
                                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
                                        <p className="text-yellow-800 font-semibold">This plot is currently {selectedPlot.status}</p>
                                        <p className="text-yellow-700 text-sm mt-1">Please check back later or contact us for more information.</p>
                                    </div>
                                    <div className="flex justify-end">
                                        <button
                                            onClick={() => setShowLeadModal(false)}
                                            className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition"
                                        >
                                            Close
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
