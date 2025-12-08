import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { savedPlotService, settingService } from '../../services/api';
import toast from 'react-hot-toast';
import {
    BookmarkIcon,
    MapIcon,
    MapPinIcon,
    ScaleIcon,
    CurrencyDollarIcon,
    HomeIcon,
    MagnifyingGlassIcon,
    TrashIcon,
    ArrowLeftIcon
} from '@heroicons/react/24/outline';
import { BookmarkIcon as BookmarkSolidIcon } from '@heroicons/react/24/solid';

export default function UserSavedPlots() {
    const [plots, setPlots] = useState([]);
    const [filteredPlots, setFilteredPlots] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [filterStatus, setFilterStatus] = useState('');
    const [showPrices, setShowPrices] = useState(true);

    useEffect(() => {
        fetchSavedPlots();
        fetchSettings();
    }, []);

    useEffect(() => {
        filterPlots();
    }, [searchQuery, filterStatus, plots]);

    const fetchSavedPlots = async () => {
        try {
            const response = await savedPlotService.getAll();
            let savedPlots = [];
            if (Array.isArray(response.data)) {
                savedPlots = response.data;
            } else if (response.data?.data && Array.isArray(response.data.data)) {
                savedPlots = response.data.data;
            }
            setPlots(savedPlots);
            setFilteredPlots(savedPlots);
        } catch (error) {
            console.error('Error fetching saved plots:', error);
            toast.error('Failed to load saved plots');
        } finally {
            setLoading(false);
        }
    };

    const fetchSettings = async () => {
        try {
            const response = await settingService.getByGroup('appearance');
            const settings = response.data || {};
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
            console.error('Failed to fetch settings:', error);
        }
    };

    const filterPlots = () => {
        let filtered = [...plots];

        // Search filter
        if (searchQuery) {
            filtered = filtered.filter(plot =>
                plot.plot_number?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                plot.sector?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                plot.block?.toLowerCase().includes(searchQuery.toLowerCase())
            );
        }

        // Status filter
        if (filterStatus) {
            filtered = filtered.filter(plot => plot.status === filterStatus);
        }

        setFilteredPlots(filtered);
    };

    const handleRemovePlot = async (plotId) => {
        if (!confirm('Are you sure you want to remove this plot from saved?')) return;

        try {
            await savedPlotService.remove(plotId);
            setPlots(plots.filter(p => p.id !== plotId));
            toast.success('Plot removed from saved');
        } catch (error) {
            toast.error('Failed to remove plot');
        }
    };

    const getStatusColor = (status) => {
        switch (status?.toLowerCase()) {
            case 'available': return 'bg-green-100 text-green-800';
            case 'reserved': return 'bg-yellow-100 text-yellow-800';
            case 'sold': return 'bg-red-100 text-red-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-100 flex items-center justify-center">
                <div className="text-center">
                    <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-gray-300 border-t-blue-600 mb-4"></div>
                    <p className="text-gray-600">Loading your saved plots...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-100 p-6">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="mb-6">
                    <Link to="/user/dashboard" className="text-blue-600 hover:underline flex items-center gap-2 mb-4">
                        <ArrowLeftIcon className="h-4 w-4" />
                        Back to Dashboard
                    </Link>
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="bg-blue-600 p-3 rounded-lg">
                                <BookmarkSolidIcon className="h-8 w-8 text-white" />
                            </div>
                            <div>
                                <h1 className="text-3xl font-bold text-gray-800">Saved Plots</h1>
                                <p className="text-gray-600">Your favorite plots in one place</p>
                            </div>
                        </div>
                        <Link
                            to="/plots"
                            className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition flex items-center gap-2"
                        >
                            <MapIcon className="h-5 w-5" />
                            Browse More Plots
                        </Link>
                    </div>
                </div>

                {/* Stats */}
                <div className="grid md:grid-cols-4 gap-6 mb-6">
                    <div className="bg-white p-6 rounded-lg shadow-sm border-l-4 border-blue-500">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-gray-500 text-sm font-medium">Total Saved</p>
                                <p className="text-3xl font-bold text-gray-800 mt-2">{plots.length}</p>
                            </div>
                            <BookmarkSolidIcon className="h-12 w-12 text-blue-500 opacity-80" />
                        </div>
                    </div>

                    <div className="bg-white p-6 rounded-lg shadow-sm border-l-4 border-green-500">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-gray-500 text-sm font-medium">Available</p>
                                <p className="text-3xl font-bold text-green-600 mt-2">
                                    {plots.filter(p => p.status === 'available').length}
                                </p>
                            </div>
                            <HomeIcon className="h-12 w-12 text-green-500 opacity-80" />
                        </div>
                    </div>

                    <div className="bg-white p-6 rounded-lg shadow-sm border-l-4 border-yellow-500">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-gray-500 text-sm font-medium">Reserved</p>
                                <p className="text-3xl font-bold text-yellow-600 mt-2">
                                    {plots.filter(p => p.status === 'reserved').length}
                                </p>
                            </div>
                            <MapPinIcon className="h-12 w-12 text-yellow-500 opacity-80" />
                        </div>
                    </div>

                    <div className="bg-white p-6 rounded-lg shadow-sm border-l-4 border-red-500">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-gray-500 text-sm font-medium">Sold</p>
                                <p className="text-3xl font-bold text-red-600 mt-2">
                                    {plots.filter(p => p.status === 'sold').length}
                                </p>
                            </div>
                            <HomeIcon className="h-12 w-12 text-red-500 opacity-80" />
                        </div>
                    </div>
                </div>

                {/* Filters */}
                {plots.length > 0 && (
                    <div className="bg-white p-4 rounded-lg shadow-sm mb-6">
                        <div className="grid md:grid-cols-2 gap-4">
                            <div className="relative">
                                <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                                <input
                                    type="text"
                                    placeholder="Search by plot number, sector, or block..."
                                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                />
                            </div>
                            <select
                                className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                value={filterStatus}
                                onChange={(e) => setFilterStatus(e.target.value)}
                            >
                                <option value="">All Status</option>
                                <option value="available">Available</option>
                                <option value="reserved">Reserved</option>
                                <option value="sold">Sold</option>
                            </select>
                        </div>
                    </div>
                )}

                {/* Plots Grid */}
                {filteredPlots.length === 0 ? (
                    <div className="bg-white p-12 rounded-lg shadow-sm text-center">
                        <BookmarkIcon className="h-20 w-20 text-gray-300 mx-auto mb-4" />
                        <h3 className="text-xl font-bold text-gray-800 mb-2">
                            {plots.length === 0 ? 'No saved plots yet' : 'No plots match your filters'}
                        </h3>
                        <p className="text-gray-600 mb-6">
                            {plots.length === 0
                                ? 'Start saving plots to keep track of your favorites'
                                : 'Try adjusting your search or filters'}
                        </p>
                        <Link
                            to="/plots"
                            className="inline-flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition"
                        >
                            <MapIcon className="h-5 w-5" />
                            Browse Plots
                        </Link>
                    </div>
                ) : (
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filteredPlots.map(plot => (
                            <div key={plot.id} className="bg-white rounded-lg shadow-sm hover:shadow-lg transition overflow-hidden">
                                {/* Plot Image/Header */}
                                <div className="bg-gradient-to-br from-blue-500 to-blue-600 p-6 text-white">
                                    <div className="flex items-start justify-between mb-4">
                                        <div>
                                            <h3 className="text-2xl font-bold">{plot.plot_number}</h3>
                                            <p className="text-blue-100 text-sm mt-1">
                                                {plot.sector && `Sector ${plot.sector}`}
                                                {plot.block && `, Block ${plot.block}`}
                                            </p>
                                        </div>
                                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(plot.status)}`}>
                                            {plot.status || 'Unknown'}
                                        </span>
                                    </div>
                                </div>

                                {/* Plot Details */}
                                <div className="p-6">
                                    <div className="space-y-3 mb-4">
                                        <div className="flex items-center gap-3">
                                            <ScaleIcon className="h-5 w-5 text-gray-400" />
                                            <div>
                                                <p className="text-xs text-gray-500">Area</p>
                                                <p className="text-sm font-semibold text-gray-800">{plot.area} sq. units</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <CurrencyDollarIcon className="h-5 w-5 text-gray-400" />
                                            <div>
                                                <p className="text-xs text-gray-500">Price</p>
                                                <p className="text-sm font-semibold text-blue-600">
                                                    Contact for price
                                                </p>
                                            </div>
                                        </div>
                                        {plot.description && (
                                            <div className="mt-3 pt-3 border-t border-gray-200">
                                                <p className="text-xs text-gray-500 mb-1">Description</p>
                                                <p className="text-sm text-gray-700 line-clamp-2">{plot.description}</p>
                                            </div>
                                        )}
                                    </div>

                                    {/* Actions */}
                                    <div className="flex gap-2">
                                        <Link
                                            to={`/plots?search=${plot.plot_number}`}
                                            className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition text-center font-semibold text-sm"
                                        >
                                            View Details
                                        </Link>
                                        <button
                                            onClick={() => handleRemovePlot(plot.id)}
                                            className="bg-red-100 text-red-600 px-4 py-2 rounded-lg hover:bg-red-200 transition"
                                            title="Remove from saved"
                                        >
                                            <TrashIcon className="h-5 w-5" />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}