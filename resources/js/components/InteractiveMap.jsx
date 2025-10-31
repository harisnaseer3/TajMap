import React, { useEffect, useState, useRef } from 'react';
import { plotService, settingService } from '../services/api';
import toast from 'react-hot-toast';

export default function InteractiveMap({ onPlotClick, filters = {} }) {
    const [loading, setLoading] = useState(true);
    const [plots, setPlots] = useState([]);
    const [baseImage, setBaseImage] = useState(null);
    const [selectedPlot, setSelectedPlot] = useState(null);
    const [hoveredPlot, setHoveredPlot] = useState(null);
    const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
    const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 });

    const containerRef = useRef(null);
    const imageRef = useRef(null);

    useEffect(() => {
        fetchMapData();
    }, [filters]);

    useEffect(() => {
        const handleResize = () => {
            if (imageRef.current) {
                setDimensions({
                    width: imageRef.current.clientWidth,
                    height: imageRef.current.clientHeight
                });
            }
        };

        handleResize();
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, [baseImage]);

    const fetchMapData = async () => {
        try {
            setLoading(true);

            // Fetch plots with filters applied
            const plotsResponse = await plotService.getAll({ ...filters, per_page: 1000 });
            const plotsData = plotsResponse.data?.data || plotsResponse.data || [];

            // Filter plots that have coordinates
            const mappedPlots = plotsData.filter(plot =>
                plot.coordinates &&
                plot.coordinates.length > 0
            );

            // Fetch base map from settings
            try {
                const settingsResponse = await settingService.getByGroup('map');
                const settings = settingsResponse.data?.data || settingsResponse.data || {};

                if (settings.base_map_url && mappedPlots.length > 0) {
                    setBaseImage(settings.base_map_url);
                    setPlots(mappedPlots);
                } else if (!settings.base_map_url) {
                    toast.error('No base map configured. Admin needs to upload a base map.');
                } else if (mappedPlots.length === 0) {
                    toast.error('No plots configured yet. Admin needs to add plot coordinates.');
                }
            } catch (settingsError) {
                console.error('Error fetching settings:', settingsError);
                // Fallback: try to get base image from plots
                if (mappedPlots.length > 0 && mappedPlots[0].base_image) {
                    setBaseImage(mappedPlots[0].base_image.url);
                    setPlots(mappedPlots);
                } else {
                    toast.error('No interactive map configured yet');
                }
            }
        } catch (error) {
            console.error('Error fetching map data:', error);
            toast.error('Failed to load map');
        } finally {
            setLoading(false);
        }
    };

    const getStatusColor = (status) => {
        switch (status.toLowerCase()) {
            case 'available':
                return 'rgba(34, 197, 94, 0.3)'; // green
            case 'reserved':
                return 'rgba(251, 191, 36, 0.3)'; // yellow
            case 'sold':
                return 'rgba(239, 68, 68, 0.3)'; // red
            default:
                return 'rgba(156, 163, 175, 0.3)'; // gray
        }
    };

    const getStatusBorderColor = (status) => {
        switch (status.toLowerCase()) {
            case 'available':
                return 'rgba(34, 197, 94, 0.8)';
            case 'reserved':
                return 'rgba(251, 191, 36, 0.8)';
            case 'sold':
                return 'rgba(239, 68, 68, 0.8)';
            default:
                return 'rgba(156, 163, 175, 0.8)';
        }
    };

    const handlePlotClick = (plot) => {
        setSelectedPlot(plot);
        if (onPlotClick) {
            onPlotClick(plot);
        }
    };

    const handleMouseMove = (e) => {
        if (hoveredPlot && containerRef.current) {
            const rect = containerRef.current.getBoundingClientRect();
            setTooltipPosition({
                x: e.clientX - rect.left + 15,
                y: e.clientY - rect.top + 15
            });
        }
    };

    const convertCoordinates = (coords) => {
        return coords.map(coord => ({
            x: coord.x * dimensions.width,
            y: coord.y * dimensions.height
        }));
    };

    const createPolygonPoints = (coords) => {
        const converted = convertCoordinates(coords);
        return converted.map(c => `${c.x},${c.y}`).join(' ');
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-96 bg-gray-100 rounded-lg">
                <div className="text-lg text-gray-600">Loading map...</div>
            </div>
        );
    }

    if (!baseImage || plots.length === 0) {
        return (
            <div className="flex items-center justify-center h-96 bg-gray-100 rounded-lg">
                <div className="text-center">
                    <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                    </svg>
                    <p className="mt-2 text-gray-600">No interactive map available</p>
                    <p className="text-sm text-gray-500 mt-1">Admin needs to configure plot coordinates</p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {/* Legend */}
            <div className="flex flex-wrap gap-4 bg-white p-4 rounded-lg shadow">
                <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded" style={{ backgroundColor: 'rgba(34, 197, 94, 0.5)' }}></div>
                    <span className="text-sm text-gray-700">Available</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded" style={{ backgroundColor: 'rgba(251, 191, 36, 0.5)' }}></div>
                    <span className="text-sm text-gray-700">Reserved</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded" style={{ backgroundColor: 'rgba(239, 68, 68, 0.5)' }}></div>
                    <span className="text-sm text-gray-700">Sold</span>
                </div>
            </div>

            {/* Interactive Map */}
            <div
                ref={containerRef}
                className="relative bg-white p-4 rounded-lg shadow overflow-auto flex justify-center items-center"
                onMouseMove={handleMouseMove}
            >
                <div className="relative inline-block">
                    <img
                        ref={imageRef}
                        src={baseImage}
                        alt="Master Plan"
                        className="max-w-full h-auto mx-auto"
                        onLoad={() => {
                            if (imageRef.current) {
                                setDimensions({
                                    width: imageRef.current.clientWidth,
                                    height: imageRef.current.clientHeight
                                });
                            }
                        }}
                    />

                    {dimensions.width > 0 && (
                        <svg
                            className="absolute top-0 left-0 w-full h-full pointer-events-none"
                            style={{ width: dimensions.width, height: dimensions.height }}
                        >
                            {plots.map((plot) => (
                                <g key={plot.id}>
                                    <polygon
                                        points={createPolygonPoints(plot.coordinates)}
                                        fill={hoveredPlot?.id === plot.id
                                            ? getStatusColor(plot.status).replace('0.3', '0.6')
                                            : getStatusColor(plot.status)
                                        }
                                        stroke={getStatusBorderColor(plot.status)}
                                        strokeWidth="2"
                                        className="pointer-events-auto cursor-pointer transition-all"
                                        onClick={() => handlePlotClick(plot)}
                                        onMouseEnter={() => setHoveredPlot(plot)}
                                        onMouseLeave={() => setHoveredPlot(null)}
                                    />

                                    {/* Plot Number Label */}
                                    {plot.coordinates.length > 0 && (
                                        <text
                                            x={plot.coordinates.reduce((sum, c) => sum + c.x, 0) / plot.coordinates.length * dimensions.width}
                                            y={plot.coordinates.reduce((sum, c) => sum + c.y, 0) / plot.coordinates.length * dimensions.height}
                                            textAnchor="middle"
                                            dominantBaseline="middle"
                                            className="pointer-events-none text-xs font-bold fill-gray-800"
                                            style={{ fontSize: '12px' }}
                                        >
                                            {plot.plot_number}
                                        </text>
                                    )}
                                </g>
                            ))}
                        </svg>
                    )}
                </div>

                {/* Tooltip */}
                {hoveredPlot && (
                    <div
                        className="absolute z-10 bg-gray-900 text-white px-3 py-2 rounded-lg shadow-lg text-sm pointer-events-none"
                        style={{
                            left: `${tooltipPosition.x}px`,
                            top: `${tooltipPosition.y}px`,
                            maxWidth: '250px'
                        }}
                    >
                        <div className="font-bold mb-1">{hoveredPlot.plot_number}</div>
                        <div className="text-xs space-y-1">
                            <div>Sector: {hoveredPlot.sector} | Block: {hoveredPlot.block}</div>
                            <div>Area: {hoveredPlot.area} sq. units</div>
                            <div>Price: PKR {parseFloat(hoveredPlot.price).toLocaleString()}</div>
                            <div className="mt-1">
                                <span className={`px-2 py-0.5 rounded text-xs font-semibold ${
                                    hoveredPlot.status.toLowerCase() === 'available' ? 'bg-green-500' :
                                    hoveredPlot.status.toLowerCase() === 'reserved' ? 'bg-yellow-500' :
                                    'bg-red-500'
                                }`}>
                                    {hoveredPlot.status}
                                </span>
                            </div>
                            <div className="text-gray-300 text-xs mt-2 italic">
                                {hoveredPlot.status.toLowerCase() === 'available' ? 'Click to inquire' : 'Click for details'}
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Hovered Plot Info */}
            {hoveredPlot && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <div className="flex justify-between items-start">
                        <div>
                            <h3 className="font-bold text-lg">{hoveredPlot.plot_number}</h3>
                            <p className="text-sm text-gray-600">
                                Sector: {hoveredPlot.sector} | Block: {hoveredPlot.block}
                            </p>
                            <p className="text-sm text-gray-600">
                                Area: {hoveredPlot.area} sq. units | Price: PKR {parseFloat(hoveredPlot.price).toLocaleString()}
                            </p>
                        </div>
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                            hoveredPlot.status.toLowerCase() === 'available' ? 'bg-green-100 text-green-800' :
                            hoveredPlot.status.toLowerCase() === 'reserved' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-red-100 text-red-800'
                        }`}>
                            {hoveredPlot.status}
                        </span>
                    </div>
                    <p className="text-sm text-gray-500 mt-2">Click to view more details</p>
                </div>
            )}
        </div>
    );
}
