import React, { useEffect, useState, useRef } from 'react';
import { plotService, mediaService } from '../../services/api';
import toast from 'react-hot-toast';

export default function AdminMapEditor() {
    const [loading, setLoading] = useState(true);
    const [plots, setPlots] = useState([]);
    const [baseImage, setBaseImage] = useState(null);
    const [selectedPlot, setSelectedPlot] = useState(null);
    const [isDrawing, setIsDrawing] = useState(false);
    const [currentPoints, setCurrentPoints] = useState([]);
    const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
    const [uploading, setUploading] = useState(false);

    const containerRef = useRef(null);
    const imageRef = useRef(null);
    const fileInputRef = useRef(null);

    useEffect(() => {
        fetchPlots();
    }, []);

    const fetchPlots = async () => {
        try {
            setLoading(true);
            const response = await plotService.adminGetAll({ per_page: 1000 });

            const plotsData = response.data?.data || response.data || [];
            setPlots(plotsData);

            // Get base image from first plot if available
            if (plotsData.length > 0 && plotsData[0].base_image) {
                setBaseImage(plotsData[0].base_image.url);
            }
        } catch (error) {
            console.error('Error fetching plots:', error);
            toast.error('Failed to load plots');
        } finally {
            setLoading(false);
        }
    };

    const handleImageUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        if (!file.type.startsWith('image/')) {
            toast.error('Please upload an image file');
            return;
        }

        try {
            setUploading(true);
            const response = await mediaService.upload(file, 'base_map');

            const uploadedImage = response.data;
            setBaseImage(uploadedImage.url);

            toast.success('Base map uploaded successfully');
        } catch (error) {
            console.error('Error uploading image:', error);
            toast.error('Failed to upload image');
        } finally {
            setUploading(false);
        }
    };

    const handleImageClick = (e) => {
        if (!isDrawing || !selectedPlot) return;

        const rect = imageRef.current.getBoundingClientRect();
        const x = (e.clientX - rect.left) / rect.width;
        const y = (e.clientY - rect.top) / rect.height;

        setCurrentPoints([...currentPoints, { x, y }]);
    };

    const handleStartDrawing = (plot) => {
        setSelectedPlot(plot);
        setIsDrawing(true);
        setCurrentPoints(plot.coordinates || []);
    };

    const handleSaveCoordinates = async () => {
        if (!selectedPlot || currentPoints.length < 3) {
            toast.error('Please draw at least 3 points to create a polygon');
            return;
        }

        try {
            const baseImageId = plots.find(p => p.base_image)?.base_image?.id;

            await plotService.adminUpdate(selectedPlot.id, {
                ...selectedPlot,
                coordinates: currentPoints,
                base_image_id: baseImageId
            });

            toast.success('Coordinates saved successfully');
            setIsDrawing(false);
            setCurrentPoints([]);
            setSelectedPlot(null);
            fetchPlots();
        } catch (error) {
            console.error('Error saving coordinates:', error);
            toast.error('Failed to save coordinates');
        }
    };

    const handleCancelDrawing = () => {
        setIsDrawing(false);
        setCurrentPoints([]);
        setSelectedPlot(null);
    };

    const handleClearCoordinates = async (plot) => {
        if (!confirm(`Clear coordinates for plot ${plot.plot_number}?`)) return;

        try {
            await plotService.adminUpdate(plot.id, {
                ...plot,
                coordinates: []
            });

            toast.success('Coordinates cleared');
            fetchPlots();
        } catch (error) {
            console.error('Error clearing coordinates:', error);
            toast.error('Failed to clear coordinates');
        }
    };

    const convertCoordinates = (coords) => {
        if (!dimensions.width || !dimensions.height) return [];
        return coords.map(coord => ({
            x: coord.x * dimensions.width,
            y: coord.y * dimensions.height
        }));
    };

    const createPolygonPoints = (coords) => {
        const converted = convertCoordinates(coords);
        return converted.map(c => `${c.x},${c.y}`).join(' ');
    };

    useEffect(() => {
        if (imageRef.current) {
            setDimensions({
                width: imageRef.current.clientWidth,
                height: imageRef.current.clientHeight
            });
        }
    }, [baseImage]);

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="text-lg text-gray-600">Loading map editor...</div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold">Interactive Map Editor</h1>
                    <p className="text-gray-600 mt-1">Upload base map and define plot boundaries</p>
                </div>
                <button
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploading}
                    className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-400"
                >
                    {uploading ? 'Uploading...' : baseImage ? 'Change Base Map' : 'Upload Base Map'}
                </button>
                <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                />
            </div>

            {!baseImage ? (
                <div className="bg-white p-12 rounded-lg shadow text-center">
                    <svg className="mx-auto h-16 w-16 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <p className="mt-4 text-gray-600">Upload a master plan image to get started</p>
                    <button
                        onClick={() => fileInputRef.current?.click()}
                        className="mt-4 px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                    >
                        Upload Base Map
                    </button>
                </div>
            ) : (
                <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                    {/* Plots List */}
                    <div className="lg:col-span-1 bg-white p-4 rounded-lg shadow max-h-[600px] overflow-y-auto">
                        <h2 className="font-bold text-lg mb-4">Plots ({plots.length})</h2>
                        <div className="space-y-2">
                            {plots.map((plot) => (
                                <div
                                    key={plot.id}
                                    className={`p-3 rounded border-2 cursor-pointer transition ${
                                        selectedPlot?.id === plot.id
                                            ? 'border-blue-500 bg-blue-50'
                                            : plot.coordinates && plot.coordinates.length > 0
                                            ? 'border-green-200 bg-green-50 hover:border-green-400'
                                            : 'border-gray-200 hover:border-gray-400'
                                    }`}
                                    onClick={() => !isDrawing && handleStartDrawing(plot)}
                                >
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <div className="font-semibold">{plot.plot_number}</div>
                                            <div className="text-xs text-gray-600">
                                                {plot.sector} - {plot.block}
                                            </div>
                                            <div className="text-xs text-gray-500 mt-1">
                                                {plot.coordinates && plot.coordinates.length > 0
                                                    ? `${plot.coordinates.length} points`
                                                    : 'No coordinates'}
                                            </div>
                                        </div>
                                        {plot.coordinates && plot.coordinates.length > 0 && (
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleClearCoordinates(plot);
                                                }}
                                                className="text-red-500 hover:text-red-700 text-xs"
                                                title="Clear coordinates"
                                            >
                                                Clear
                                            </button>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Map Editor */}
                    <div className="lg:col-span-3 space-y-4">
                        {isDrawing && (
                            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                                <div className="flex justify-between items-center">
                                    <div>
                                        <h3 className="font-bold text-blue-900">
                                            Drawing: {selectedPlot.plot_number}
                                        </h3>
                                        <p className="text-sm text-blue-700 mt-1">
                                            Click on the map to add points. Need at least 3 points. Current: {currentPoints.length}
                                        </p>
                                    </div>
                                    <div className="flex gap-2">
                                        <button
                                            onClick={handleCancelDrawing}
                                            className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            onClick={handleSaveCoordinates}
                                            disabled={currentPoints.length < 3}
                                            className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:bg-gray-400"
                                        >
                                            Save
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}

                        <div ref={containerRef} className="relative bg-white p-4 rounded-lg shadow">
                            <div className="relative inline-block">
                                <img
                                    ref={imageRef}
                                    src={baseImage}
                                    alt="Master Plan"
                                    className="max-w-full h-auto cursor-crosshair"
                                    onClick={handleImageClick}
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
                                        className="absolute top-0 left-0 pointer-events-none"
                                        style={{ width: dimensions.width, height: dimensions.height }}
                                    >
                                        {/* Existing plots */}
                                        {plots
                                            .filter(p => p.coordinates && p.coordinates.length > 0 && p.id !== selectedPlot?.id)
                                            .map((plot) => (
                                                <polygon
                                                    key={plot.id}
                                                    points={createPolygonPoints(plot.coordinates)}
                                                    fill="rgba(34, 197, 94, 0.2)"
                                                    stroke="rgba(34, 197, 94, 0.8)"
                                                    strokeWidth="2"
                                                />
                                            ))}

                                        {/* Current drawing */}
                                        {currentPoints.length > 0 && (
                                            <>
                                                <polygon
                                                    points={createPolygonPoints(currentPoints)}
                                                    fill="rgba(59, 130, 246, 0.3)"
                                                    stroke="rgba(59, 130, 246, 0.8)"
                                                    strokeWidth="3"
                                                />
                                                {convertCoordinates(currentPoints).map((point, index) => (
                                                    <circle
                                                        key={index}
                                                        cx={point.x}
                                                        cy={point.y}
                                                        r="5"
                                                        fill="rgb(59, 130, 246)"
                                                        stroke="white"
                                                        strokeWidth="2"
                                                    />
                                                ))}
                                            </>
                                        )}
                                    </svg>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Instructions */}
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <h3 className="font-bold text-yellow-900 mb-2">Instructions</h3>
                <ol className="list-decimal list-inside space-y-1 text-sm text-yellow-800">
                    <li>Upload a master plan image (site layout)</li>
                    <li>Select a plot from the list on the left</li>
                    <li>Click on the map to define the plot boundary (at least 3 points)</li>
                    <li>Click "Save" to save the coordinates</li>
                    <li>Repeat for all plots</li>
                    <li>Users will then be able to click plots on the interactive map to view details</li>
                </ol>
            </div>
        </div>
    );
}
