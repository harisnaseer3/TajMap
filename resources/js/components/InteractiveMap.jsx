import React, { useEffect, useState, useRef, useMemo } from 'react';
import { plotService, settingService } from '../services/api';
import toast from 'react-hot-toast';
import { MagnifyingGlassMinusIcon, MagnifyingGlassPlusIcon, ArrowsPointingOutIcon } from '@heroicons/react/24/outline';

export default function InteractiveMap({ onPlotClick, filters = {} }) {
    const [loading, setLoading] = useState(true);
    const [plots, setPlots] = useState([]);
    const [baseImage, setBaseImage] = useState(null);
    const [selectedPlot, setSelectedPlot] = useState(null);
    const [hoveredPlot, setHoveredPlot] = useState(null);
    const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
    const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 });
    const [showPrices, setShowPrices] = useState(true);
    const [zoom, setZoom] = useState(1);
    const [pan, setPan] = useState({ x: 0, y: 0 });
    const [isDragging, setIsDragging] = useState(false);
    const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

    const containerRef = useRef(null);
    const imageRef = useRef(null);
    const zoomRef = useRef(1); // Track zoom to prevent accidental resets

    // Serialize filters to prevent unnecessary re-renders from object reference changes
    const filtersKey = useMemo(() => JSON.stringify(filters), [
        filters?.search,
        filters?.status,
        filters?.sector,
        filters?.street,
        filters?.type,
        filters?.category,
        filters?.min_price,
        filters?.max_price,
        filters?.min_area,
        filters?.max_area,
        filters?.sort_by,
        filters?.sort_order
    ]);

    useEffect(() => {
        fetchMapData();
    }, [filtersKey]);

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

    // Keep zoomRef in sync with zoom state
    useEffect(() => {
        zoomRef.current = zoom;
    }, [zoom]);

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

            // Fetch base map and appearance settings
            try {
                const [mapSettingsResponse, appearanceSettingsResponse] = await Promise.all([
                    settingService.getByGroup('map'),
                    settingService.getByGroup('appearance')
                ]);

                // getByGroup returns an object like { key: value }, not an array
                const mapSettings = mapSettingsResponse.data || {};
                const appearanceSettings = appearanceSettingsResponse.data || {};

                // Get base_map_url directly from the object
                const baseMapUrl = mapSettings.base_map_url;

                // Get show_plot_prices setting
                const showPricesValue = appearanceSettings.show_plot_prices;
                if (showPricesValue !== undefined) {
                    // Handle different boolean representations
                    setShowPrices(
                        showPricesValue === true ||
                        showPricesValue === 'true' ||
                        showPricesValue === '1' ||
                        showPricesValue === 1
                    );
                }

                if (baseMapUrl && mappedPlots.length > 0) {
                    setBaseImage(baseMapUrl);
                    setPlots(mappedPlots);
                } else if (!baseMapUrl) {
                    toast.error('No base map configured. Admin needs to upload a base map.');
                } else if (mappedPlots.length === 0) {
                    toast.error('No plots configured yet. Admin needs to add plot coordinates.');
                }
            } catch (settingsError) {
                // Fallback: try to get base image from plots
                if (mappedPlots.length > 0 && mappedPlots[0].base_image) {
                    setBaseImage(mappedPlots[0].base_image.url);
                    setPlots(mappedPlots);
                } else {
                    toast.error('No interactive map configured yet');
                }
            }
        } catch (error) {
            toast.error('Failed to load map');
        } finally {
            setLoading(false);
        }
    };

    const getStatusColor = (status) => {
        switch (status.toLowerCase()) {
            case 'available':
                return 'rgba(34, 197, 94, 0.05)'; // green
            case 'reserved':
                return 'rgba(251, 191, 36, 0.6)'; // yellow
            case 'sold':
                return 'rgba(239, 68, 68, 0.6)'; // red
            default:
                return 'rgba(156, 163, 175, 0.6)'; // gray
        }
    };

    const getStatusBorderColor = (status) => {
        switch (status.toLowerCase()) {
            case 'available':
                return 'rgba(34, 197, 94, 0.05)';
            case 'reserved':
                return 'rgba(251, 191, 36, 0.8)';
            case 'sold':
                return 'rgba(239, 68, 68, 0.8)';
            default:
                return 'rgba(156, 163, 175, 0.8)';
        }
    };

    const handlePlotClick = (plot, e) => {
        // Prevent event bubbling that might interfere with zoom
        if (e) {
            e.stopPropagation();
            e.preventDefault();
        }
        // Ensure zoom state remains unchanged when selecting a plot
        // Restore zoom from ref if it was somehow reset
        if (zoom !== zoomRef.current) {
            setZoom(zoomRef.current);
        }
        setSelectedPlot(plot);
        if (onPlotClick) {
            onPlotClick(plot);
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

    const handleZoomIn = () => {
        setZoom(prev => {
            const newZoom = Math.min(prev + 0.25, 3);
            zoomRef.current = newZoom;
            return newZoom;
        });
    };

    const handleZoomOut = () => {
        setZoom(prev => {
            const newZoom = Math.max(prev - 0.25, 1.0);
            zoomRef.current = newZoom;
            return newZoom;
        });
    };

    const handleResetZoom = () => {
        setZoom(1);
        zoomRef.current = 1;
        setPan({ x: 0, y: 0 });
    };

    const handleMouseDown = (e) => {
        if (e.button === 0 && zoom > 1) { // Left mouse button and zoomed in
            setIsDragging(true);
            setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
        }
    };

    const handleMouseMoveContainer = (e) => {
        // Handle tooltip
        if (hoveredPlot && containerRef.current) {
            const rect = containerRef.current.getBoundingClientRect();
            setTooltipPosition({
                x: e.clientX - rect.left + 15,
                y: e.clientY - rect.top + 15
            });
        }

        // Handle panning
        if (isDragging) {
            setPan({
                x: e.clientX - dragStart.x,
                y: e.clientY - dragStart.y
            });
        }
    };

    const handleMouseUp = () => {
        setIsDragging(false);
    };

    const handleWheel = (e) => {
        e.preventDefault();
        if (!containerRef.current) return;

        // Get mouse position relative to the container
        const containerRect = containerRef.current.getBoundingClientRect();
        const mouseX = e.clientX - containerRect.left;
        const mouseY = e.clientY - containerRect.top;

        // Calculate the point in image coordinates (before zoom change)
        const imageX = (mouseX - pan.x) / zoom;
        const imageY = (mouseY - pan.y) / zoom;

        // Calculate new zoom level
        const delta = e.deltaY > 0 ? -0.1 : 0.1;
        const newZoom = Math.max(1.0, Math.min(3, zoom + delta));

        // Adjust pan offset so the point under the mouse stays in the same screen position
        const newPanX = mouseX - imageX * newZoom;
        const newPanY = mouseY - imageY * newZoom;

        setZoom(newZoom);
        zoomRef.current = newZoom;
        setPan({ x: newPanX, y: newPanY });
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
                    <div className="w-4 h-4 rounded" style={{backgroundColor: 'rgba(34, 197, 94, 0.05)'}}></div>
                    <span className="text-sm text-gray-700">Available</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded" style={{backgroundColor: 'rgba(251, 191, 36, 0.7)'}}></div>
                    <span className="text-sm text-gray-700">Reserved</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded" style={{backgroundColor: 'rgba(156, 163, 175, 0.7)'}}></div>
                    <span className="text-sm text-gray-700">Hold</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded" style={{backgroundColor: 'rgba(239, 68, 68, 0.7)'}}></div>
                    <span className="text-sm text-gray-700">Sold</span>
                </div>
            </div>

            {/* Interactive Map */}
            <div
                ref={containerRef}
                className="relative bg-white p-4 rounded-lg shadow overflow-hidden flex justify-center items-center"
                style={{height: '70vh', cursor: isDragging ? 'grabbing' : zoom > 1 ? 'grab' : 'default' }}
                onMouseMove={handleMouseMoveContainer}
                onMouseDown={handleMouseDown}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
                onWheel={handleWheel}
            >
                {/* Zoom Controls */}
                <div className="absolute top-4 right-4 z-20 flex flex-col gap-2">
                    <button
                        onClick={handleZoomIn}
                        disabled={zoom >= 3}
                        className="bg-white hover:bg-gray-100 disabled:bg-gray-200 disabled:cursor-not-allowed rounded-lg p-2 shadow-lg transition-all"
                        title="Zoom In"
                    >
                        <MagnifyingGlassPlusIcon className="w-6 h-6 text-gray-700" />
                    </button>
                    <button
                        onClick={handleZoomOut}
                        disabled={zoom <= 1.0}
                        className="bg-white hover:bg-gray-100 disabled:bg-gray-200 disabled:cursor-not-allowed rounded-lg p-2 shadow-lg transition-all"
                        title="Zoom Out"
                    >
                        <MagnifyingGlassMinusIcon className="w-6 h-6 text-gray-700" />
                    </button>
                    <button
                        onClick={handleResetZoom}
                        className="bg-white hover:bg-gray-100 rounded-lg p-2 shadow-lg transition-all"
                        title="Reset View"
                    >
                        <ArrowsPointingOutIcon className="w-6 h-6 text-gray-700" />
                    </button>
                    <div className="bg-white rounded-lg px-2 py-1 shadow-lg text-xs font-semibold text-gray-700 text-center">
                        {Math.round(zoom * 100)}%
                    </div>
                </div>

                <div
                    className="relative inline-block"
                    style={{
                        transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
                        transformOrigin: 'center center',
                        transition: isDragging ? 'none' : 'transform 0.2s ease-out'
                    }}
                >
                    <img
                        ref={imageRef}
                        src={baseImage}
                        alt="Master Plan"
                        className="max-w-full h-auto mx-auto select-none"
                        draggable={false}
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
                                            ? getStatusColor(plot.status).replace('0.6', '0.85')
                                            : getStatusColor(plot.status)
                                        }
                                        stroke={getStatusBorderColor(plot.status)}
                                        strokeWidth="2"
                                        className="pointer-events-auto cursor-pointer transition-all"
                                        onClick={(e) => handlePlotClick(plot, e)}
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
                            <div>Sector: {hoveredPlot.sector} | Street: {hoveredPlot.street}</div>
                            <div>Area: {hoveredPlot.area} sq. units</div>
                            <div>Price: Contact for price</div>
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
                                Sector: {hoveredPlot.sector} | Street: {hoveredPlot.street}
                            </p>
                            <p className="text-sm text-gray-600">
                                Area: {hoveredPlot.area} sq. units | Price: Contact for price
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
