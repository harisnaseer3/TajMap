import React, { useEffect, useState } from 'react';
import PlotViewer from '../../components/PlotViewer';
import { plotService, leadService } from '../../services/api';
import { usePlotStore } from '../../store/plotStore';
import toast from 'react-hot-toast';

export default function PlotListPage() {
    const { plots, setPlots, filters, setFilters } = usePlotStore();
    const [loading, setLoading] = useState(true);
    const [viewMode, setViewMode] = useState('map'); // map or list
    const [selectedPlot, setSelectedPlot] = useState(null);
    const [showLeadModal, setShowLeadModal] = useState(false);
    const [leadForm, setLeadForm] = useState({ name: '', phone: '', email: '', message: '' });

    useEffect(() => {
        fetchPlots();
    }, [filters]);

    const fetchPlots = async () => {
        setLoading(true);
        try {
            const { data } = await plotService.getAll(filters);
            setPlots(data.data);
        } catch (error) {
            console.error('Error fetching plots:', error);
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
            await leadService.submit({ ...leadForm, plot_id: selectedPlot.id });
            toast.success('Thank you for your interest! We will contact you soon.');
            setShowLeadModal(false);
            setLeadForm({ name: '', phone: '', email: '', message: '' });
        } catch (error) {
            console.error('Error submitting lead:', error);
        }
    };

    return (
        <div className="min-h-screen bg-gray-100">
            {/* Header */}
            <header className="bg-white shadow-sm border-b">
                <div className="container mx-auto px-6 py-4">
                    <h1 className="text-2xl font-bold">Available Plots</h1>
                </div>
            </header>

            <div className="container mx-auto px-6 py-6 flex gap-6">
                {/* Filters Sidebar */}
                <aside className="w-64 bg-white rounded-lg shadow p-6 h-fit">
                    <h3 className="font-bold text-lg mb-4">Filters</h3>
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium mb-1">Status</label>
                            <select
                                value={filters.status || ''}
                                onChange={(e) => setFilters({ status: e.target.value || null })}
                                className="w-full border rounded px-3 py-2"
                            >
                                <option value="">All</option>
                                <option value="available">Available</option>
                                <option value="reserved">Reserved</option>
                                <option value="sold">Sold</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1">Search</label>
                            <input
                                type="text"
                                value={filters.search || ''}
                                onChange={(e) => setFilters({ search: e.target.value })}
                                placeholder="Plot number..."
                                className="w-full border rounded px-3 py-2"
                            />
                        </div>
                        <button
                            onClick={() => setFilters({})}
                            className="w-full bg-gray-200 text-gray-700 py-2 rounded hover:bg-gray-300"
                        >
                            Reset Filters
                        </button>
                    </div>
                </aside>

                {/* Main Content */}
                <main className="flex-1">
                    {/* View Toggle */}
                    <div className="bg-white rounded-lg shadow p-4 mb-6 flex justify-between">
                        <div className="flex gap-2">
                            <button
                                onClick={() => setViewMode('map')}
                                className={`px-4 py-2 rounded ${viewMode === 'map' ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}
                            >
                                Map View
                            </button>
                            <button
                                onClick={() => setViewMode('list')}
                                className={`px-4 py-2 rounded ${viewMode === 'list' ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}
                            >
                                List View
                            </button>
                        </div>
                        <div className="text-gray-600">
                            {plots.length} plots found
                        </div>
                    </div>

                    {/* Content */}
                    {loading ? (
                        <div className="bg-white rounded-lg shadow p-20 text-center">
                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                            <p className="mt-4 text-gray-600">Loading plots...</p>
                        </div>
                    ) : viewMode === 'map' ? (
                        <div className="bg-white rounded-lg shadow" style={{ height: '600px' }}>
                            <PlotViewer
                                plots={plots}
                                onPlotClick={handlePlotClick}
                                selectedPlotId={selectedPlot?.id}
                            />
                        </div>
                    ) : (
                        <div className="grid gap-4">
                            {plots.map(plot => (
                                <div key={plot.id} className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition">
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <h3 className="text-xl font-bold">{plot.plot_number}</h3>
                                            <p className="text-gray-600 mt-1">
                                                {plot.sector && `Sector ${plot.sector}`}
                                                {plot.block && `, Block ${plot.block}`}
                                            </p>
                                            <div className="mt-3 space-y-1">
                                                <p><span className="font-medium">Area:</span> {plot.area} sq ft</p>
                                                <p><span className="font-medium">Price:</span> ${plot.price.toLocaleString()}</p>
                                                <p>
                                                    <span className="font-medium">Status:</span>{' '}
                                                    <span className={`px-2 py-1 rounded text-sm ${
                                                        plot.status === 'available' ? 'bg-green-100 text-green-800' :
                                                        plot.status === 'reserved' ? 'bg-yellow-100 text-yellow-800' :
                                                        'bg-red-100 text-red-800'
                                                    }`}>
                                                        {plot.status}
                                                    </span>
                                                </p>
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => handlePlotClick(plot)}
                                            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
                                        >
                                            Inquire
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </main>
            </div>

            {/* Lead Form Modal */}
            {showLeadModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-lg p-6 max-w-md w-full">
                        <h3 className="text-2xl font-bold mb-4">Inquire about {selectedPlot?.plot_number}</h3>
                        <form onSubmit={handleLeadSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium mb-1">Name *</label>
                                <input
                                    type="text"
                                    value={leadForm.name}
                                    onChange={(e) => setLeadForm({ ...leadForm, name: e.target.value })}
                                    className="w-full border rounded px-3 py-2"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1">Phone *</label>
                                <input
                                    type="tel"
                                    value={leadForm.phone}
                                    onChange={(e) => setLeadForm({ ...leadForm, phone: e.target.value })}
                                    className="w-full border rounded px-3 py-2"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1">Email</label>
                                <input
                                    type="email"
                                    value={leadForm.email}
                                    onChange={(e) => setLeadForm({ ...leadForm, email: e.target.value })}
                                    className="w-full border rounded px-3 py-2"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1">Message</label>
                                <textarea
                                    value={leadForm.message}
                                    onChange={(e) => setLeadForm({ ...leadForm, message: e.target.value })}
                                    className="w-full border rounded px-3 py-2"
                                    rows="3"
                                ></textarea>
                            </div>
                            <div className="flex gap-2">
                                <button
                                    type="submit"
                                    className="flex-1 bg-blue-600 text-white py-2 rounded hover:bg-blue-700"
                                >
                                    Submit
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setShowLeadModal(false)}
                                    className="flex-1 bg-gray-200 text-gray-700 py-2 rounded hover:bg-gray-300"
                                >
                                    Cancel
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}