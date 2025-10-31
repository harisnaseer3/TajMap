import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import InteractiveMap from '../../components/InteractiveMap';
import { plotService, leadService } from '../../services/api';
import { usePlotStore } from '../../store/plotStore';
import toast from 'react-hot-toast';
import {
    MapIcon,
    FunnelIcon,
    ViewColumnsIcon,
    Squares2X2Icon,
    MagnifyingGlassIcon,
    XMarkIcon,
    HomeIcon,
    CheckCircleIcon
} from '@heroicons/react/24/outline';

export default function PlotListPage() {
    const { plots, setPlots, filters, setFilters } = usePlotStore();
    const [loading, setLoading] = useState(true);
    const [viewMode, setViewMode] = useState('map'); // map or list
    const [selectedPlot, setSelectedPlot] = useState(null);
    const [showLeadModal, setShowLeadModal] = useState(false);
    const [leadForm, setLeadForm] = useState({ name: '', phone: '', email: '', message: '' });
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        fetchPlots();
    }, [filters]);

    const fetchPlots = async () => {
        setLoading(true);
        try {
            const { data } = await plotService.getAll({ ...filters, per_page: 1000 });
            setPlots(data.data);
        } catch (error) {
            console.error('Error fetching plots:', error);
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
            console.error('Error submitting lead:', error);
            toast.error('Failed to submit inquiry');
        } finally {
            setSubmitting(false);
        }
    };

    // Calculate statistics
    const stats = {
        total: plots.length,
        available: plots.filter(p => p.status === 'available').length,
        reserved: plots.filter(p => p.status === 'reserved').length,
        sold: plots.filter(p => p.status === 'sold').length,
    };

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <header className="bg-white shadow-sm border-b sticky top-0 z-40">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center h-16">
                        <div className="flex items-center gap-4">
                            <Link to="/" className="flex items-center gap-2 hover:opacity-80 transition">
                                <MapIcon className="h-8 w-8 text-blue-600" />
                                <span className="text-xl font-bold text-gray-900">TajMap</span>
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
                    <aside className="lg:w-72 space-y-4">
                        <div className="bg-white rounded-lg shadow p-6">
                            <div className="flex items-center gap-2 mb-4">
                                <FunnelIcon className="h-5 w-5 text-gray-600" />
                                <h3 className="font-bold text-lg">Filters</h3>
                            </div>

                            <div className="space-y-4">
                                {/* Status Filter */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Status
                                    </label>
                                    <select
                                        value={filters.status || ''}
                                        onChange={(e) => setFilters({ status: e.target.value || null })}
                                        className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    >
                                        <option value="">All Statuses</option>
                                        <option value="available">Available</option>
                                        <option value="reserved">Reserved</option>
                                        <option value="sold">Sold</option>
                                    </select>
                                </div>

                                {/* Search Filter */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Search Plot Number
                                    </label>
                                    <div className="relative">
                                        <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                                        <input
                                            type="text"
                                            value={filters.search || ''}
                                            onChange={(e) => setFilters({ search: e.target.value })}
                                            placeholder="e.g., P-001"
                                            className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        />
                                    </div>
                                </div>

                                {/* Reset Button */}
                                <button
                                    onClick={() => setFilters({})}
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
                                    <span className="text-blue-600 font-bold">{plots.length}</span> {plots.length === 1 ? 'plot' : 'plots'} found
                                </div>
                            </div>
                        </div>

                        {/* Content */}
                        {loading ? (
                            <div className="bg-white rounded-lg shadow p-20 text-center">
                                <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600 mx-auto"></div>
                                <p className="mt-6 text-gray-600 text-lg">Loading plots...</p>
                            </div>
                        ) : plots.length === 0 ? (
                            <div className="bg-white rounded-lg shadow p-20 text-center">
                                <Squares2X2Icon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                                <h3 className="text-xl font-bold text-gray-900 mb-2">No plots found</h3>
                                <p className="text-gray-600 mb-4">Try adjusting your filters to see more results</p>
                                <button
                                    onClick={() => setFilters({})}
                                    className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 transition"
                                >
                                    Reset Filters
                                </button>
                            </div>
                        ) : viewMode === 'map' ? (
                            <div>
                                <InteractiveMap onPlotClick={handlePlotClick} />
                            </div>
                        ) : (
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
                                                                {plot.block && `, Block ${plot.block}`}
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
                                                            <p className="text-lg font-semibold text-gray-900">${parseFloat(plot.price).toLocaleString()}</p>
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
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
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
                                        <p className="text-sm text-gray-600">Block</p>
                                        <p className="font-semibold">{selectedPlot.block || 'N/A'}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-600">Area</p>
                                        <p className="font-semibold">{selectedPlot.area} sq. units</p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-600">Price</p>
                                        <p className="font-semibold">${parseFloat(selectedPlot.price).toLocaleString()}</p>
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
