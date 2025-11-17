import React, { useEffect, useState } from 'react';
import { plotService } from '../../services/api';
import toast from 'react-hot-toast';

export default function AdminPlots() {
    const [plots, setPlots] = useState([]);
    const [loading, setLoading] = useState(true);
    const [pagination, setPagination] = useState({});
    const [showModal, setShowModal] = useState(false);
    const [showImportModal, setShowImportModal] = useState(false);
    const [editingPlot, setEditingPlot] = useState(null);
    const [selectedPlots, setSelectedPlots] = useState([]);
    const [filters, setFilters] = useState({
        search: '',
        status: '',
        sector: '',
        street: '',
        type: '',
        category: '',
        with_trashed: false,
        page: 1,
        per_page: 15,
    });

    useEffect(() => {
        fetchPlots();
        // Clear selections when filters change
        setSelectedPlots([]);
    }, [filters]);

    const fetchPlots = async () => {
        try {
            setLoading(true);
            const response = await plotService.adminGetAll(filters);
            const responseData = response.data;

            // Handle Laravel Resource Collection format
            if (responseData && responseData.data && responseData.meta) {
                // Laravel Resource Collection format
                setPlots(responseData.data);
                setPagination({
                    current_page: responseData.meta.current_page,
                    last_page: responseData.meta.last_page,
                    total: responseData.meta.total,
                    per_page: responseData.meta.per_page,
                });
            } else if (Array.isArray(responseData)) {
                // Simple array format
                setPlots(responseData);
                setPagination({});
            } else {
                // Fallback
                setPlots([]);
                setPagination({});
            }
        } catch (error) {
            console.error('Error fetching plots:', error);
            toast.error('Failed to load plots');
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id) => {
        if (!confirm('Are you sure you want to delete this plot?')) return;

        try {
            await plotService.adminDelete(id);
            toast.success('Plot deleted successfully');
            fetchPlots();
        } catch (error) {
            console.error('Error deleting plot:', error);
            toast.error('Failed to delete plot');
        }
    };

    const handleRestore = async (id) => {
        try {
            await plotService.adminRestore(id);
            toast.success('Plot restored successfully');
            fetchPlots();
        } catch (error) {
            console.error('Error restoring plot:', error);
            toast.error('Failed to restore plot');
        }
    };

    const handleEdit = (plot) => {
        setEditingPlot(plot);
        setShowModal(true);
    };

    const handleCreate = () => {
        setEditingPlot(null);
        setShowModal(true);
    };

    const handleFilterChange = (key, value) => {
        setFilters(prev => ({ ...prev, [key]: value, page: 1 }));
    };

    const handlePageChange = (page) => {
        setFilters(prev => ({ ...prev, page }));
    };

    const handleSelectAll = (e) => {
        if (e.target.checked) {
            // Select all non-deleted plots on current page
            const selectablePlotIds = plots
                .filter(plot => !plot.deleted_at)
                .map(plot => plot.id);
            setSelectedPlots(selectablePlotIds);
        } else {
            setSelectedPlots([]);
        }
    };

    const handleSelectPlot = (plotId) => {
        setSelectedPlots(prev => {
            if (prev.includes(plotId)) {
                return prev.filter(id => id !== plotId);
            } else {
                return [...prev, plotId];
            }
        });
    };

    const handleBulkDelete = async () => {
        if (selectedPlots.length === 0) {
            toast.error('Please select at least one plot to delete');
            return;
        }

        if (!confirm(`Are you sure you want to delete ${selectedPlots.length} plot(s)?`)) {
            return;
        }

        try {
            await plotService.adminBulkDelete(selectedPlots);
            toast.success(`${selectedPlots.length} plot(s) deleted successfully`);
            setSelectedPlots([]);
            fetchPlots();
        } catch (error) {
            console.error('Error deleting plots:', error);
            toast.error('Failed to delete plots');
        }
    };

    const handleExportCSV = async () => {
        try {
            // Only send non-empty filter values
            const exportParams = {};
            if (filters.status) exportParams.status = filters.status;
            if (filters.sector) exportParams.sector = filters.sector;
            if (filters.street) exportParams.street = filters.street;
            if (filters.type) exportParams.type = filters.type;
            if (filters.category) exportParams.category = filters.category;

            const response = await plotService.adminExportCsv(exportParams);

            // Check if response is an error (JSON) instead of CSV
            if (response.headers['content-type']?.includes('application/json')) {
                const errorData = typeof response.data === 'string' ? JSON.parse(response.data) : response.data;
                toast.error(errorData.message || 'Failed to export plots');
                return;
            }

            const blob = new Blob([response.data], { type: 'text/csv' });
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `plots-${new Date().toISOString().split('T')[0]}.csv`);
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.URL.revokeObjectURL(url);
            toast.success('Plots exported to CSV successfully');
        } catch (error) {
            console.error('Error exporting CSV:', error);
            toast.error(error.response?.data?.message || 'Failed to export plots');
        }
    };

    const handleExportJSON = async () => {
        try {
            // Only send non-empty filter values
            const exportParams = {};
            if (filters.status) exportParams.status = filters.status;
            if (filters.sector) exportParams.sector = filters.sector;
            if (filters.street) exportParams.street = filters.street;
            if (filters.type) exportParams.type = filters.type;
            if (filters.category) exportParams.category = filters.category;

            const response = await plotService.adminExportJson(exportParams);

            const blob = new Blob([JSON.stringify(response.data, null, 2)], { type: 'application/json' });
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `plots-${new Date().toISOString().split('T')[0]}.json`);
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.URL.revokeObjectURL(url);
            toast.success('Plots exported to JSON successfully');
        } catch (error) {
            console.error('Error exporting JSON:', error);
            toast.error('Failed to export plots');
        }
    };

    const getStatusBadge = (status) => {
        const badges = {
            available: 'bg-green-100 text-green-800',
            reserved: 'bg-yellow-100 text-yellow-800',
            sold: 'bg-red-100 text-red-800',
        };
        return badges[status] || 'bg-gray-100 text-gray-800';
    };

    if (loading && plots.length === 0) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="text-lg text-gray-600">Loading plots...</div>
            </div>
        );
    }

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-2xl font-bold">Plots Management</h1>
                    {selectedPlots.length > 0 && (
                        <p className="text-sm text-gray-600 mt-1">
                            {selectedPlots.length} plot(s) selected
                        </p>
                    )}
                </div>
                <div className="flex gap-2">
                    {selectedPlots.length > 0 && (
                        <button
                            onClick={handleBulkDelete}
                            className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition flex items-center gap-2"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                            Delete Selected ({selectedPlots.length})
                        </button>
                    )}
                    <button
                        onClick={() => setShowImportModal(true)}
                        className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition flex items-center gap-2"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                        </svg>
                        Import
                    </button>
                    <button
                        onClick={handleExportCSV}
                        className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 transition flex items-center gap-2"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        Export CSV
                    </button>
                    <button
                        onClick={handleCreate}
                        className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
                    >
                        + Add New Plot
                    </button>
                </div>
            </div>

            {/* Filters */}
            <div className="bg-white p-4 rounded-lg shadow mb-6">
                <div className="grid grid-cols-1 md:grid-cols-4 lg:grid-cols-7 gap-4">
                    <input
                        type="text"
                        placeholder="Search by plot number..."
                        value={filters.search}
                        onChange={(e) => handleFilterChange('search', e.target.value)}
                        className="px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <select
                        value={filters.status}
                        onChange={(e) => handleFilterChange('status', e.target.value)}
                        className="px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                        <option value="">All Status</option>
                        <option value="available">Available</option>
                        <option value="reserved">Reserved</option>
                        <option value="hold">Hold</option>
                        <option value="sold">Sold</option>
                    </select>
                    <input
                        type="text"
                        placeholder="Sector..."
                        value={filters.sector}
                        onChange={(e) => handleFilterChange('sector', e.target.value)}
                        className="px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <input
                        type="text"
                        placeholder="Street..."
                        value={filters.street}
                        onChange={(e) => handleFilterChange('street', e.target.value)}
                        className="px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <input
                        type="text"
                        placeholder="Type..."
                        value={filters.type}
                        onChange={(e) => handleFilterChange('type', e.target.value)}
                        className="px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <input
                        type="text"
                        placeholder="Category..."
                        value={filters.category}
                        onChange={(e) => handleFilterChange('category', e.target.value)}
                        className="px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <label className="flex items-center gap-2">
                        <input
                            type="checkbox"
                            checked={filters.with_trashed}
                            onChange={(e) => handleFilterChange('with_trashed', e.target.checked)}
                            className="rounded"
                        />
                        <span className="text-sm">Include Deleted</span>
                    </label>
                </div>
            </div>

            {/* Plots Table */}
            <div className="bg-white rounded-lg shadow overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left">
                                    <input
                                        type="checkbox"
                                        checked={selectedPlots.length > 0 && selectedPlots.length === plots.filter(p => !p.deleted_at).length}
                                        onChange={handleSelectAll}
                                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                    />
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Plot Number
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Sector / Street
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Type
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Category
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Area (sq m)
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Price
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Status
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Leads
                                </th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Actions
                                </th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {plots.length === 0 ? (
                                <tr>
                                    <td colSpan="10" className="px-6 py-8 text-center text-gray-500">
                                        No plots found. Create your first plot to get started.
                                    </td>
                                </tr>
                            ) : (
                                plots.map((plot) => (
                                    <tr key={plot.id} className={plot.deleted_at ? 'bg-gray-50' : ''}>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            {!plot.deleted_at && (
                                                <input
                                                    type="checkbox"
                                                    checked={selectedPlots.includes(plot.id)}
                                                    onChange={() => handleSelectPlot(plot.id)}
                                                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                                />
                                            )}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm font-medium text-gray-900">{plot.plot_number}</div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm text-gray-900">
                                                {plot.sector || '-'} / {plot.street || '-'}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                            {plot.type || '-'}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                            {plot.category || '-'}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                            {plot.area ? parseFloat(plot.area).toFixed(2) : '-'}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                            PKR {plot.price ? parseFloat(plot.price).toLocaleString() : '0'}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusBadge(plot.status)}`}>
                                                {plot.status}
                                            </span>
                                            {plot.deleted_at && (
                                                <span className="ml-2 px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-gray-200 text-gray-800">
                                                    Deleted
                                                </span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                            {plot.leads_count || 0}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                            {plot.deleted_at ? (
                                                <button
                                                    onClick={() => handleRestore(plot.id)}
                                                    className="text-green-600 hover:text-green-900 mr-3"
                                                >
                                                    Restore
                                                </button>
                                            ) : (
                                                <>
                                                    <button
                                                        onClick={() => handleEdit(plot)}
                                                        className="text-blue-600 hover:text-blue-900 mr-3"
                                                    >
                                                        Edit
                                                    </button>
                                                    <button
                                                        onClick={() => handleDelete(plot.id)}
                                                        className="text-red-600 hover:text-red-900"
                                                    >
                                                        Delete
                                                    </button>
                                                </>
                                            )}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                {pagination.last_page > 1 && (
                    <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
                        <div className="flex-1 flex justify-between sm:hidden">
                            <button
                                onClick={() => handlePageChange(pagination.current_page - 1)}
                                disabled={pagination.current_page === 1}
                                className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
                            >
                                Previous
                            </button>
                            <button
                                onClick={() => handlePageChange(pagination.current_page + 1)}
                                disabled={pagination.current_page === pagination.last_page}
                                className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
                            >
                                Next
                            </button>
                        </div>
                        <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                            <div>
                                <p className="text-sm text-gray-700">
                                    Showing page <span className="font-medium">{pagination.current_page}</span> of{' '}
                                    <span className="font-medium">{pagination.last_page}</span> ({pagination.total} total plots)
                                </p>
                            </div>
                            <div>
                                <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                                    <button
                                        onClick={() => handlePageChange(pagination.current_page - 1)}
                                        disabled={pagination.current_page === 1}
                                        className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                                    >
                                        Previous
                                    </button>
                                    {[...Array(pagination.last_page)].map((_, i) => (
                                        <button
                                            key={i + 1}
                                            onClick={() => handlePageChange(i + 1)}
                                            className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                                                pagination.current_page === i + 1
                                                    ? 'z-10 bg-blue-50 border-blue-500 text-blue-600'
                                                    : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                                            }`}
                                        >
                                            {i + 1}
                                        </button>
                                    ))}
                                    <button
                                        onClick={() => handlePageChange(pagination.current_page + 1)}
                                        disabled={pagination.current_page === pagination.last_page}
                                        className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                                    >
                                        Next
                                    </button>
                                </nav>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Create/Edit Modal */}
            {showModal && (
                <PlotModal
                    plot={editingPlot}
                    onClose={() => {
                        setShowModal(false);
                        setEditingPlot(null);
                    }}
                    onSuccess={() => {
                        setShowModal(false);
                        setEditingPlot(null);
                        fetchPlots();
                    }}
                />
            )}

            {/* Import Modal */}
            {showImportModal && (
                <ImportModal
                    onClose={() => setShowImportModal(false)}
                    onSuccess={() => {
                        setShowImportModal(false);
                        fetchPlots();
                    }}
                />
            )}
        </div>
    );
}

// Plot Create/Edit Modal Component
function PlotModal({ plot, onClose, onSuccess }) {
    const [formData, setFormData] = useState({
        plot_number: plot?.plot_number || '',
        sector: plot?.sector || '',
        street: plot?.street || '',
        type: plot?.type || '',
        category: plot?.category || '',
        status: plot?.status || 'available',
        area: plot?.area || '',
        price: plot?.price || '',
        description: plot?.description || '',
        coordinates: plot?.coordinates || [
            { x: 0.1, y: 0.1 },
            { x: 0.9, y: 0.1 },
            { x: 0.9, y: 0.9 },
            { x: 0.1, y: 0.9 },
        ],
    });
    const [submitting, setSubmitting] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitting(true);

        try {
            if (plot) {
                await plotService.adminUpdate(plot.id, formData);
                toast.success('Plot updated successfully');
            } else {
                await plotService.adminCreate(formData);
                toast.success('Plot created successfully');
            }
            onSuccess();
        } catch (error) {
            console.error('Error saving plot:', error);
            toast.error(error.response?.data?.message || 'Failed to save plot');
        } finally {
            setSubmitting(false);
        }
    };

    const handleChange = (field, value) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                <div className="p-6">
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-2xl font-bold">{plot ? 'Edit Plot' : 'Create New Plot'}</h2>
                        <button
                            onClick={onClose}
                            className="text-gray-400 hover:text-gray-600 text-2xl"
                        >
                            ×
                        </button>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Plot Number *
                                </label>
                                <input
                                    type="text"
                                    required
                                    value={formData.plot_number}
                                    onChange={(e) => handleChange('plot_number', e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Status *
                                </label>
                                <select
                                    required
                                    value={formData.status}
                                    onChange={(e) => handleChange('status', e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                                >
                                    <option value="available">Available</option>
                                    <option value="reserved">Reserved</option>
                                    <option value="hold">Hold</option>
                                    <option value="sold">Sold</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Sector
                                </label>
                                <input
                                    type="text"
                                    value={formData.sector}
                                    onChange={(e) => handleChange('sector', e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Street
                                </label>
                                <input
                                    type="text"
                                    value={formData.street}
                                    onChange={(e) => handleChange('street', e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Type
                                </label>
                                <input
                                    type="text"
                                    value={formData.type}
                                    onChange={(e) => handleChange('type', e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    placeholder="e.g., Residential, Commercial"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Category
                                </label>
                                <input
                                    type="text"
                                    value={formData.category}
                                    onChange={(e) => handleChange('category', e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    placeholder="e.g., Premium, Standard"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Area (sq m) *
                                </label>
                                <input
                                    type="number"
                                    required
                                    step="0.01"
                                    value={formData.area}
                                    onChange={(e) => handleChange('area', e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Price ($) *
                                </label>
                                <input
                                    type="number"
                                    required
                                    step="0.01"
                                    value={formData.price}
                                    onChange={(e) => handleChange('price', e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Description
                            </label>
                            <textarea
                                rows="3"
                                value={formData.description}
                                onChange={(e) => handleChange('description', e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>

                        <div className="bg-blue-50 p-4 rounded">
                            <p className="text-sm text-blue-800">
                                <strong>Note:</strong> Coordinates are managed through the advanced plot editor. Default coordinates will be set automatically.
                            </p>
                        </div>

                        <div className="flex justify-end gap-3 pt-4">
                            <button
                                type="button"
                                onClick={onClose}
                                className="px-4 py-2 border border-gray-300 rounded text-gray-700 hover:bg-gray-50 transition"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={submitting}
                                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition disabled:opacity-50"
                            >
                                {submitting ? 'Saving...' : plot ? 'Update Plot' : 'Create Plot'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}

// Import Modal Component
function ImportModal({ onClose, onSuccess }) {
    const [file, setFile] = useState(null);
    const [importing, setImporting] = useState(false);
    const [importResult, setImportResult] = useState(null);

    const handleFileChange = (e) => {
        const selectedFile = e.target.files[0];
        if (selectedFile) {
            // Validate file type
            const validTypes = [
                'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                'application/vnd.ms-excel'
            ];
            if (!validTypes.includes(selectedFile.type) && !selectedFile.name.endsWith('.xlsx') && !selectedFile.name.endsWith('.xls')) {
                toast.error('Please select a valid Excel file (.xlsx or .xls)');
                return;
            }
            setFile(selectedFile);
            setImportResult(null);
        }
    };

    const handleImport = async () => {
        if (!file) {
            toast.error('Please select a file to import');
            return;
        }

        setImporting(true);
        try {
            const response = await plotService.adminImport(file);

            if (response.success) {
                toast.success(response.message || 'Plots imported successfully');
                setImportResult({
                    success: true,
                    message: response.message,
                    data: response.data,
                });
                setTimeout(() => {
                    onSuccess();
                }, 1500);
            } else {
                setImportResult({
                    success: false,
                    message: response.message || 'Import failed',
                    failures: response.data?.failures || [],
                });
            }
        } catch (error) {
            console.error('Error importing plots:', error);

            // Handle different error formats
            if (error.response?.status === 422) {
                const responseData = error.response.data;

                // Check for import validation failures (from errorResponse with failures array)
                if (responseData?.errors?.failures) {
                    setImportResult({
                        success: false,
                        message: responseData.message || 'Import completed with errors',
                        failures: responseData.errors.failures,
                        successfulImports: responseData.errors.successful_imports || 0,
                    });
                }
                // Check for standard Laravel validation errors (field-level errors)
                else if (responseData?.errors && typeof responseData.errors === 'object') {
                    // Convert errors object to failures array for display
                    const failures = [];

                    Object.entries(responseData.errors).forEach(([field, messages]) => {
                        if (Array.isArray(messages)) {
                            messages.forEach(msg => {
                                failures.push({
                                    error: msg,
                                    attribute: field
                                });
                            });
                        } else if (typeof messages === 'string') {
                            failures.push({
                                error: messages,
                                attribute: field
                            });
                        }
                    });

                    setImportResult({
                        success: false,
                        message: responseData.message || 'Validation failed',
                        failures: failures,
                    });
                } else {
                    toast.error(responseData?.message || 'Validation failed');
                }
            } else {
                toast.error(error.response?.data?.message || 'Failed to import plots');
            }
        } finally {
            setImporting(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
                <div className="p-6">
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-2xl font-bold">Import Plots from Excel</h2>
                        <button
                            onClick={onClose}
                            className="text-gray-400 hover:text-gray-600 text-2xl"
                        >
                            ×
                        </button>
                    </div>

                    <div className="space-y-4">
                        {/* Instructions */}
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                            <div className="flex justify-between items-start mb-2">
                                <h3 className="font-semibold text-blue-900">Excel File Format</h3>
                                <a
                                    href="/api/admin/plots/download-template"
                                    download
                                    className="text-sm bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded transition"
                                >
                                    Download Template
                                </a>
                            </div>
                            <p className="text-sm text-blue-800 mb-2">Your Excel file format (Row 1 can be a title, Row 2 must have headers):</p>
                            <div className="grid grid-cols-2 gap-2 text-sm">
                                <div><strong>Sr No.</strong> - Optional serial number (ignored during import)</div>
                                <div><strong>Name</strong> - Plot number/identifier (required, unique)</div>
                                <div><strong>Size</strong> - Dimensions (25x50) or area (1250 sq m)</div>
                                <div><strong>Sector</strong> - Sector name</div>
                                <div><strong>Street</strong> - Street name</div>
                                <div><strong>Type</strong> - Plot type</div>
                                <div><strong>Category</strong> - Plot category</div>
                                <div><strong>Status</strong> - available/reserved/hold/sold</div>
                                <div><strong>Actions</strong> - Description/notes</div>
                            </div>
                            <p className="text-xs text-blue-700 mt-2 font-semibold">
                                Note: The "Name" column is required. Empty rows will be skipped automatically.
                            </p>
                        </div>

                        {/* File Upload */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Select Excel File (.xlsx or .xls)
                            </label>
                            <input
                                type="file"
                                accept=".xlsx,.xls"
                                onChange={handleFileChange}
                                className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                            />
                            {file && (
                                <p className="mt-2 text-sm text-gray-600">
                                    Selected: {file.name} ({(file.size / 1024).toFixed(2)} KB)
                                </p>
                            )}
                        </div>

                        {/* Import Result */}
                        {importResult && (
                            <div className={`rounded-lg p-4 ${importResult.success ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
                                <h3 className={`font-semibold mb-2 ${importResult.success ? 'text-green-900' : 'text-red-900'}`}>
                                    {importResult.success ? 'Import Successful' : 'Import Failed'}
                                </h3>
                                <p className={`text-sm ${importResult.success ? 'text-green-800' : 'text-red-800'}`}>
                                    {importResult.message}
                                </p>

                                {(importResult.data?.imported_count || importResult.data?.newly_created !== undefined) && (
                                    <div className="text-sm text-green-800 mt-1">
                                        {importResult.data?.newly_created !== undefined ? (
                                            <>
                                                <p><strong>{importResult.data.newly_created}</strong> new plot(s) created</p>
                                                <p><strong>{importResult.data.total_plots}</strong> total plots in database</p>
                                                {importResult.data.newly_created === 0 && (
                                                    <p className="text-xs mt-1">All plots already existed and were updated with new data</p>
                                                )}
                                            </>
                                        ) : (
                                            <p>Successfully imported {importResult.data.imported_count} plot(s)</p>
                                        )}
                                    </div>
                                )}

                                {importResult.successfulImports > 0 && (
                                    <p className="text-sm text-green-800 mt-1">
                                        Successfully imported {importResult.successfulImports} plot(s)
                                    </p>
                                )}

                                {importResult.failures && importResult.failures.length > 0 && (
                                    <div className="mt-3">
                                        <h4 className="font-semibold text-red-900 mb-2">Errors:</h4>
                                        <div className="max-h-48 overflow-y-auto space-y-2">
                                            {importResult.failures.map((failure, index) => {
                                                // Extract error messages safely
                                                let errorMessages = [];
                                                if (failure.errors) {
                                                    if (Array.isArray(failure.errors)) {
                                                        errorMessages = failure.errors;
                                                    } else if (typeof failure.errors === 'object') {
                                                        // If errors is an object, extract all values
                                                        errorMessages = Object.values(failure.errors).flat();
                                                    } else {
                                                        errorMessages = [String(failure.errors)];
                                                    }
                                                }

                                                return (
                                                    <div key={index} className="text-sm bg-white rounded p-2">
                                                        {failure.row && <div><strong>Row {failure.row}:</strong></div>}
                                                        {failure.attribute && <div className="text-gray-700">Field: <strong>{failure.attribute}</strong></div>}
                                                        {errorMessages.length > 0 && (
                                                            <div className="text-red-700 mt-1">
                                                                {errorMessages.map((msg, i) => (
                                                                    <div key={i}>• {msg}</div>
                                                                ))}
                                                            </div>
                                                        )}
                                                        {failure.error && <div className="text-red-700">{failure.error}</div>}
                                                        {failure.values && (
                                                            <div className="text-xs text-gray-600 mt-1 bg-gray-50 p-1 rounded">
                                                                <strong>Values:</strong> {JSON.stringify(failure.values)}
                                                            </div>
                                                        )}
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Action Buttons */}
                        <div className="flex justify-end gap-3 pt-4">
                            <button
                                type="button"
                                onClick={onClose}
                                className="px-4 py-2 border border-gray-300 rounded text-gray-700 hover:bg-gray-50 transition"
                            >
                                Close
                            </button>
                            <button
                                onClick={handleImport}
                                disabled={!file || importing}
                                className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                            >
                                {importing ? (
                                    <>
                                        <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                        </svg>
                                        Importing...
                                    </>
                                ) : (
                                    <>
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                                        </svg>
                                        Import Plots
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
