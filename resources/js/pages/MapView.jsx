import React, { useState } from 'react';
import InteractiveMap from '../components/InteractiveMap';

export default function MapView() {
    const [selectedPlot, setSelectedPlot] = useState(null);

    const handlePlotClick = (plot) => {
        setSelectedPlot(plot);
    };

    return (
        <div className="min-h-screen bg-gray-50 py-8">
            <div className="container mx-auto px-4">
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-900">Interactive Master Plan</h1>
                    <p className="text-gray-600 mt-2">Click on any plot to view details and availability</p>
                </div>

                <InteractiveMap onPlotClick={handlePlotClick} />

                {/* Plot Details Modal */}
                {selectedPlot && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                        <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                            <div className="p-6">
                                <div className="flex justify-between items-start mb-4">
                                    <div>
                                        <h2 className="text-2xl font-bold text-gray-900">
                                            Plot {selectedPlot.plot_number}
                                        </h2>
                                        <p className="text-gray-600">
                                            Sector {selectedPlot.sector}, Block {selectedPlot.block}
                                        </p>
                                    </div>
                                    <button
                                        onClick={() => setSelectedPlot(null)}
                                        className="text-gray-400 hover:text-gray-600"
                                    >
                                        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                        </svg>
                                    </button>
                                </div>

                                <div className="space-y-4">
                                    {/* Status */}
                                    <div>
                                        <label className="text-sm font-semibold text-gray-700">Status</label>
                                        <div className="mt-1">
                                            <span className={`inline-block px-3 py-1 rounded-full text-sm font-semibold ${
                                                selectedPlot.status.toLowerCase() === 'available' ? 'bg-green-100 text-green-800' :
                                                selectedPlot.status.toLowerCase() === 'reserved' ? 'bg-yellow-100 text-yellow-800' :
                                                'bg-red-100 text-red-800'
                                            }`}>
                                                {selectedPlot.status}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Area */}
                                    <div>
                                        <label className="text-sm font-semibold text-gray-700">Area</label>
                                        <p className="text-gray-900 mt-1">{selectedPlot.area} square units</p>
                                    </div>

                                    {/* Price */}
                                    <div>
                                        <label className="text-sm font-semibold text-gray-700">Price</label>
                                        <p className="text-gray-900 mt-1 text-xl font-bold">
                                            ${parseFloat(selectedPlot.price).toLocaleString()}
                                        </p>
                                    </div>

                                    {/* Description */}
                                    {selectedPlot.description && (
                                        <div>
                                            <label className="text-sm font-semibold text-gray-700">Description</label>
                                            <p className="text-gray-900 mt-1">{selectedPlot.description}</p>
                                        </div>
                                    )}

                                    {/* Features */}
                                    {selectedPlot.features && Object.keys(selectedPlot.features).length > 0 && (
                                        <div>
                                            <label className="text-sm font-semibold text-gray-700 mb-2 block">Features</label>
                                            <div className="flex flex-wrap gap-2">
                                                {Object.entries(selectedPlot.features).map(([key, value]) => (
                                                    <span key={key} className="bg-blue-50 text-blue-700 px-3 py-1 rounded-full text-sm">
                                                        {key}: {typeof value === 'boolean' ? (value ? 'Yes' : 'No') : value}
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {/* Action Buttons */}
                                    {selectedPlot.status.toLowerCase() === 'available' && (
                                        <div className="pt-4 border-t">
                                            <button
                                                onClick={() => {
                                                    // Navigate to lead submission with plot pre-selected
                                                    window.location.href = `/contact?plot=${selectedPlot.id}`;
                                                }}
                                                className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 font-semibold transition"
                                            >
                                                Express Interest
                                            </button>
                                        </div>
                                    )}

                                    {selectedPlot.status.toLowerCase() !== 'available' && (
                                        <div className="pt-4 border-t">
                                            <p className="text-center text-gray-500 text-sm">
                                                This plot is currently {selectedPlot.status.toLowerCase()}.
                                            </p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
