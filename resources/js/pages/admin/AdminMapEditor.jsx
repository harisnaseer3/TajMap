import React, { useEffect, useState, useRef } from 'react';
import { plotService, mediaService, settingService } from '../../services/api';
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

    // Advanced tools state
    const [currentTool, setCurrentTool] = useState('polygon'); // 'polygon', 'rectangle', 'pan', 'edit'
    const [zoom, setZoom] = useState(1);
    const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
    const [isPanning, setIsPanning] = useState(false);
    const [panStart, setPanStart] = useState({ x: 0, y: 0 });
    const [selectedPointIndex, setSelectedPointIndex] = useState(null);
    const [isDraggingPoint, setIsDraggingPoint] = useState(false);
    const [rectangleStart, setRectangleStart] = useState(null);
    const [rectangleEnd, setRectangleEnd] = useState(null);
    const [currentMousePos, setCurrentMousePos] = useState(null);
    const [history, setHistory] = useState([]);
    const [historyIndex, setHistoryIndex] = useState(-1);

    // New plot creation state
    const [isCreatingNewPlot, setIsCreatingNewPlot] = useState(false);
    const [showPlotDataModal, setShowPlotDataModal] = useState(false);
    const [newPlotData, setNewPlotData] = useState({
        plot_number: '',
        sector: '',
        block: '',
        area: '',
        price: '',
        status: 'available',
        description: ''
    });
    const [isSavingPlot, setIsSavingPlot] = useState(false);

    const containerRef = useRef(null);
    const imageRef = useRef(null);
    const fileInputRef = useRef(null);
    const svgRef = useRef(null);

    useEffect(() => {
        fetchPlots();
    }, []);

    const fetchPlots = async () => {
        try {
            setLoading(true);
            const response = await plotService.adminGetAll({ per_page: 1000 });

            const plotsData = response.data?.data || response.data || [];
            setPlots(plotsData);

            // Get base image from settings
            try {
                const settingsResponse = await settingService.getByGroup('map');
                const settings = settingsResponse.data?.data || settingsResponse.data || {};

                if (settings.base_map_url) {
                    setBaseImage(settings.base_map_url);
                }
            } catch (settingsError) {
                console.error('Error fetching base map settings:', settingsError);
                // Fallback: Get base image from first plot if available
                if (plotsData.length > 0 && plotsData[0].base_image) {
                    setBaseImage(plotsData[0].base_image.url);
                }
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

            // Handle both wrapped and unwrapped responses
            const uploadedImage = response.data?.data || response.data;

            if (uploadedImage && uploadedImage.url) {
                // Save to settings for persistence
                await settingService.bulkUpdate([
                    {
                        key: 'base_map_url',
                        value: uploadedImage.url,
                        type: 'string',
                        group: 'map',
                        label: 'Base Map URL',
                        description: 'URL of the base map image for plot editor'
                    },
                    {
                        key: 'base_map_id',
                        value: uploadedImage.id.toString(),
                        type: 'integer',
                        group: 'map',
                        label: 'Base Map Media ID',
                        description: 'Media ID of the base map image'
                    }
                ]);

                setBaseImage(uploadedImage.url);
                toast.success('Base map uploaded successfully');
            } else {
                toast.error('Upload succeeded but no URL returned');
            }
        } catch (error) {
            console.error('Error uploading image:', error);
            toast.error('Failed to upload image');
        } finally {
            setUploading(false);
        }
    };

    // Add to history for undo/redo
    const addToHistory = (points) => {
        const newHistory = history.slice(0, historyIndex + 1);
        newHistory.push([...points]);
        setHistory(newHistory);
        setHistoryIndex(newHistory.length - 1);
    };

    const undo = () => {
        if (historyIndex > 0) {
            setHistoryIndex(historyIndex - 1);
            setCurrentPoints(history[historyIndex - 1]);
        }
    };

    const redo = () => {
        if (historyIndex < history.length - 1) {
            setHistoryIndex(historyIndex + 1);
            setCurrentPoints(history[historyIndex + 1]);
        }
    };

    const handleImageClick = (e) => {
        if (!isDrawing && !isCreatingNewPlot) return;

        const rect = imageRef.current.getBoundingClientRect();
        const x = (e.clientX - rect.left - panOffset.x) / (rect.width * zoom);
        const y = (e.clientY - rect.top - panOffset.y) / (rect.height * zoom);

        if (currentTool === 'polygon') {
            const newPoints = [...currentPoints, { x, y }];
            setCurrentPoints(newPoints);
            addToHistory(newPoints);
        } else if (currentTool === 'rectangle' && !rectangleStart) {
            setRectangleStart({ x, y });
        }
    };

    const handleMouseDown = (e) => {
        if (!isDrawing && !isCreatingNewPlot) return;

        const rect = imageRef.current.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;

        if (currentTool === 'pan') {
            setIsPanning(true);
            setPanStart({ x: mouseX - panOffset.x, y: mouseY - panOffset.y });
        } else if (currentTool === 'edit') {
            // Check if clicking on a point
            const clickedPointIndex = findNearestPoint(mouseX, mouseY);
            if (clickedPointIndex !== -1) {
                setSelectedPointIndex(clickedPointIndex);
                setIsDraggingPoint(true);
            }
        } else if (currentTool === 'rectangle' && !rectangleStart) {
            const x = (mouseX - panOffset.x) / (rect.width * zoom);
            const y = (mouseY - panOffset.y) / (rect.height * zoom);
            setRectangleStart({ x, y });
        }
    };

    const handleMouseMove = (e) => {
        if (!isDrawing && !isCreatingNewPlot) return;
        if (!imageRef.current) return;

        const rect = imageRef.current.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;

        // Update current mouse position for preview
        const x = (mouseX - panOffset.x) / (rect.width * zoom);
        const y = (mouseY - panOffset.y) / (rect.height * zoom);
        setCurrentMousePos({ x, y });

        if (isPanning && currentTool === 'pan') {
            setPanOffset({
                x: mouseX - panStart.x,
                y: mouseY - panStart.y
            });
        } else if (isDraggingPoint && currentTool === 'edit' && selectedPointIndex !== null) {
            const newPoints = [...currentPoints];
            newPoints[selectedPointIndex] = { x, y };
            setCurrentPoints(newPoints);
        } else if (currentTool === 'rectangle' && rectangleStart) {
            // Update rectangle end point for live preview
            setRectangleEnd({ x, y });
        }
    };

    const handleMouseUp = (e) => {
        if (currentTool === 'pan') {
            setIsPanning(false);
        } else if (currentTool === 'edit' && isDraggingPoint) {
            setIsDraggingPoint(false);
            addToHistory(currentPoints);
        } else if (currentTool === 'rectangle' && rectangleStart && rectangleEnd) {
            // Create rectangle (4 points: top-left, top-right, bottom-right, bottom-left)
            const newPoints = [
                rectangleStart,
                { x: rectangleEnd.x, y: rectangleStart.y },
                rectangleEnd,
                { x: rectangleStart.x, y: rectangleEnd.y }
            ];
            setCurrentPoints(newPoints);
            addToHistory(newPoints);
            setRectangleStart(null);
            setRectangleEnd(null);
        }
    };

    const findNearestPoint = (mouseX, mouseY) => {
        if (!imageRef.current) return -1;
        const rect = imageRef.current.getBoundingClientRect();
        const threshold = 10; // pixels

        const convertedPoints = convertCoordinates(currentPoints);

        for (let i = 0; i < convertedPoints.length; i++) {
            const point = convertedPoints[i];
            const pointX = point.x + panOffset.x;
            const pointY = point.y + panOffset.y;

            const distance = Math.sqrt(
                Math.pow(mouseX - pointX, 2) + Math.pow(mouseY - pointY, 2)
            );

            if (distance < threshold) {
                return i;
            }
        }

        return -1;
    };

    const handleDeletePoint = () => {
        if (selectedPointIndex !== null && currentPoints.length > 3) {
            const newPoints = currentPoints.filter((_, i) => i !== selectedPointIndex);
            setCurrentPoints(newPoints);
            addToHistory(newPoints);
            setSelectedPointIndex(null);
        } else if (currentPoints.length <= 3) {
            toast.error('A polygon must have at least 3 points');
        }
    };

    const handleStartDrawing = (plot) => {
        setSelectedPlot(plot);
        setIsDrawing(true);
        setIsCreatingNewPlot(false);
        const points = plot.coordinates || [];
        setCurrentPoints(points);
        setHistory([points]);
        setHistoryIndex(0);
        setCurrentTool('polygon');
        setZoom(1);
        setPanOffset({ x: 0, y: 0 });
        setRectangleStart(null);
        setRectangleEnd(null);
        setCurrentMousePos(null);
    };

    const handleStartNewPlot = () => {
        setIsCreatingNewPlot(true);
        setIsDrawing(false);
        setSelectedPlot(null);
        setCurrentPoints([]);
        setHistory([[]]);
        setHistoryIndex(0);
        setCurrentTool('polygon');
        setZoom(1);
        setPanOffset({ x: 0, y: 0 });
        setRectangleStart(null);
        setRectangleEnd(null);
        setCurrentMousePos(null);
        setNewPlotData({
            plot_number: '',
            sector: '',
            block: '',
            area: '',
            price: '',
            status: 'available',
            description: ''
        });
    };

    const handleNextToPlotData = () => {
        if (currentPoints.length < 3) {
            toast.error('Please draw at least 3 points to create a polygon');
            return;
        }
        setShowPlotDataModal(true);
    };

    const handleSaveNewPlot = async (e) => {
        e.preventDefault();

        if (currentPoints.length < 3) {
            toast.error('Please draw at least 3 points to create a polygon');
            return;
        }

        try {
            setIsSavingPlot(true);

            const plotData = {
                ...newPlotData,
                coordinates: currentPoints,
                area: parseFloat(newPlotData.area),
                price: parseFloat(newPlotData.price)
            };

            await plotService.adminCreate(plotData);

            toast.success('Plot created successfully');
            setShowPlotDataModal(false);
            setIsCreatingNewPlot(false);
            setCurrentPoints([]);
            setHistory([]);
            setHistoryIndex(-1);
            setZoom(1);
            setPanOffset({ x: 0, y: 0 });
            fetchPlots();
        } catch (error) {
            console.error('Error creating plot:', error);
            toast.error('Failed to create plot');
        } finally {
            setIsSavingPlot(false);
        }
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
            setHistory([]);
            setHistoryIndex(-1);
            fetchPlots();
        } catch (error) {
            console.error('Error saving coordinates:', error);
            toast.error('Failed to save coordinates');
        }
    };

    const handleCancelDrawing = () => {
        setIsDrawing(false);
        setIsCreatingNewPlot(false);
        setCurrentPoints([]);
        setSelectedPlot(null);
        setHistory([]);
        setHistoryIndex(-1);
        setZoom(1);
        setPanOffset({ x: 0, y: 0 });
        setShowPlotDataModal(false);
        setRectangleStart(null);
        setRectangleEnd(null);
        setCurrentMousePos(null);
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

    const handleZoomIn = () => {
        setZoom(Math.min(zoom + 0.25, 5));
    };

    const handleZoomOut = () => {
        setZoom(Math.max(zoom - 0.25, 0.25));
    };

    const handleResetView = () => {
        setZoom(1);
        setPanOffset({ x: 0, y: 0 });
    };

    const convertCoordinates = (coords) => {
        if (!dimensions.width || !dimensions.height) return [];
        return coords.map(coord => ({
            x: coord.x * dimensions.width * zoom,
            y: coord.y * dimensions.height * zoom
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

    // Keyboard shortcuts
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (!isDrawing && !isCreatingNewPlot) return;

            if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
                e.preventDefault();
                undo();
            } else if ((e.ctrlKey || e.metaKey) && (e.key === 'y' || (e.key === 'z' && e.shiftKey))) {
                e.preventDefault();
                redo();
            } else if (e.key === 'Delete' || e.key === 'Backspace') {
                if (selectedPointIndex !== null) {
                    e.preventDefault();
                    handleDeletePoint();
                }
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isDrawing, isCreatingNewPlot, historyIndex, history, selectedPointIndex, currentPoints]);

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="text-lg text-gray-600">Loading map editor...</div>
            </div>
        );
    }

    const getCursorStyle = () => {
        if (!isDrawing && !isCreatingNewPlot) return 'default';
        if (currentTool === 'pan') return isPanning ? 'grabbing' : 'grab';
        if (currentTool === 'polygon' || currentTool === 'rectangle') return 'crosshair';
        if (currentTool === 'edit') return isDraggingPoint ? 'grabbing' : 'pointer';
        return 'default';
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold">Interactive Map Editor</h1>
                    <p className="text-gray-600 mt-1">Upload base map and define plot boundaries</p>
                </div>
                <div className="flex gap-2">
                    {baseImage && !isDrawing && !isCreatingNewPlot && (
                        <button
                            onClick={handleStartNewPlot}
                            className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 flex items-center gap-2"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                            </svg>
                            Add New Plot
                        </button>
                    )}
                    <button
                        onClick={() => fileInputRef.current?.click()}
                        disabled={uploading}
                        className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-400"
                    >
                        {uploading ? 'Uploading...' : baseImage ? 'Change Base Map' : 'Upload Base Map'}
                    </button>
                </div>
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
                                    onClick={() => !isDrawing && !isCreatingNewPlot && handleStartDrawing(plot)}
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
                        {(isDrawing || isCreatingNewPlot) && (
                            <>
                                {/* Toolbar */}
                                <div className="bg-white border border-gray-200 rounded-lg p-4">
                                    <div className="flex flex-wrap gap-4 items-center">
                                        {/* Drawing Tools */}
                                        <div className="flex gap-2">
                                            <button
                                                onClick={() => setCurrentTool('polygon')}
                                                className={`px-3 py-2 rounded flex items-center gap-2 ${
                                                    currentTool === 'polygon'
                                                        ? 'bg-blue-600 text-white'
                                                        : 'bg-gray-100 hover:bg-gray-200'
                                                }`}
                                                title="Polygon Tool (Click to add points)"
                                            >
                                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21l3-9-6-3 9-9 3 9 6 3-9 9z" />
                                                </svg>
                                                Polygon
                                            </button>
                                            <button
                                                onClick={() => setCurrentTool('rectangle')}
                                                className={`px-3 py-2 rounded flex items-center gap-2 ${
                                                    currentTool === 'rectangle'
                                                        ? 'bg-blue-600 text-white'
                                                        : 'bg-gray-100 hover:bg-gray-200'
                                                }`}
                                                title="Rectangle Tool (Click and drag)"
                                            >
                                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <rect x="3" y="3" width="18" height="18" strokeWidth={2} rx="2" />
                                                </svg>
                                                Rectangle
                                            </button>
                                            <button
                                                onClick={() => setCurrentTool('edit')}
                                                className={`px-3 py-2 rounded flex items-center gap-2 ${
                                                    currentTool === 'edit'
                                                        ? 'bg-blue-600 text-white'
                                                        : 'bg-gray-100 hover:bg-gray-200'
                                                }`}
                                                title="Edit Tool (Drag points to move, Del to delete)"
                                            >
                                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                                                </svg>
                                                Edit
                                            </button>
                                            <button
                                                onClick={() => setCurrentTool('pan')}
                                                className={`px-3 py-2 rounded flex items-center gap-2 ${
                                                    currentTool === 'pan'
                                                        ? 'bg-blue-600 text-white'
                                                        : 'bg-gray-100 hover:bg-gray-200'
                                                }`}
                                                title="Pan Tool (Drag to move view)"
                                            >
                                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
                                                </svg>
                                                Pan
                                            </button>
                                        </div>

                                        <div className="border-l border-gray-300 h-8"></div>

                                        {/* Zoom Controls */}
                                        <div className="flex gap-2 items-center">
                                            <button
                                                onClick={handleZoomOut}
                                                className="px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded"
                                                title="Zoom Out"
                                            >
                                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM13 10H7" />
                                                </svg>
                                            </button>
                                            <span className="text-sm font-medium min-w-[60px] text-center">
                                                {Math.round(zoom * 100)}%
                                            </span>
                                            <button
                                                onClick={handleZoomIn}
                                                className="px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded"
                                                title="Zoom In"
                                            >
                                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
                                                </svg>
                                            </button>
                                            <button
                                                onClick={handleResetView}
                                                className="px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded text-sm"
                                                title="Reset View"
                                            >
                                                Reset
                                            </button>
                                        </div>

                                        <div className="border-l border-gray-300 h-8"></div>

                                        {/* Undo/Redo */}
                                        <div className="flex gap-2">
                                            <button
                                                onClick={undo}
                                                disabled={historyIndex <= 0}
                                                className="px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded disabled:opacity-50 disabled:cursor-not-allowed"
                                                title="Undo (Ctrl+Z)"
                                            >
                                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
                                                </svg>
                                            </button>
                                            <button
                                                onClick={redo}
                                                disabled={historyIndex >= history.length - 1}
                                                className="px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded disabled:opacity-50 disabled:cursor-not-allowed"
                                                title="Redo (Ctrl+Y)"
                                            >
                                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 10h-10a8 8 0 00-8 8v2M21 10l-6 6m6-6l-6-6" />
                                                </svg>
                                            </button>
                                        </div>

                                        <div className="flex-1"></div>

                                        {/* Point Info */}
                                        <div className="text-sm text-gray-600">
                                            Points: {currentPoints.length}
                                            {selectedPointIndex !== null && ` (Selected: ${selectedPointIndex + 1})`}
                                        </div>
                                    </div>
                                </div>

                                {/* Status Bar */}
                                <div className={`border rounded-lg p-4 ${isCreatingNewPlot ? 'bg-green-50 border-green-200' : 'bg-blue-50 border-blue-200'}`}>
                                    <div className="flex justify-between items-center">
                                        <div>
                                            <h3 className={`font-bold ${isCreatingNewPlot ? 'text-green-900' : 'text-blue-900'}`}>
                                                {isCreatingNewPlot ? 'Creating New Plot' : `Editing: ${selectedPlot.plot_number}`}
                                            </h3>
                                            <p className={`text-sm mt-1 ${isCreatingNewPlot ? 'text-green-700' : 'text-blue-700'}`}>
                                                {currentTool === 'polygon' && 'Click on the map to add points'}
                                                {currentTool === 'rectangle' && 'Click and drag to create a rectangle'}
                                                {currentTool === 'pan' && 'Drag to pan the view'}
                                                {currentTool === 'edit' && 'Click and drag points to move them, or press Delete to remove'}
                                            </p>
                                        </div>
                                        <div className="flex gap-2">
                                            <button
                                                onClick={handleCancelDrawing}
                                                className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
                                            >
                                                Cancel
                                            </button>
                                            {isCreatingNewPlot ? (
                                                <button
                                                    onClick={handleNextToPlotData}
                                                    disabled={currentPoints.length < 3}
                                                    className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:bg-gray-400"
                                                >
                                                    Next: Enter Details
                                                </button>
                                            ) : (
                                                <button
                                                    onClick={handleSaveCoordinates}
                                                    disabled={currentPoints.length < 3}
                                                    className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:bg-gray-400"
                                                >
                                                    Save
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </>
                        )}

                        <div
                            ref={containerRef}
                            className="relative bg-white p-4 rounded-lg shadow overflow-auto"
                            style={{ maxHeight: '700px' }}
                        >
                            <div
                                className="relative inline-block"
                                style={{
                                    transform: `translate(${panOffset.x}px, ${panOffset.y}px)`,
                                    cursor: getCursorStyle()
                                }}
                                onMouseDown={handleMouseDown}
                                onMouseMove={handleMouseMove}
                                onMouseUp={handleMouseUp}
                                onMouseLeave={() => {
                                    setIsPanning(false);
                                    setIsDraggingPoint(false);
                                    setCurrentMousePos(null);
                                }}
                            >
                                <img
                                    ref={imageRef}
                                    src={baseImage}
                                    alt="Master Plan"
                                    className="max-w-full h-auto select-none"
                                    style={{
                                        width: `${100 * zoom}%`,
                                        pointerEvents: (isDrawing || isCreatingNewPlot) ? 'none' : 'auto'
                                    }}
                                    onClick={handleImageClick}
                                    onLoad={() => {
                                        if (imageRef.current) {
                                            setDimensions({
                                                width: imageRef.current.clientWidth,
                                                height: imageRef.current.clientHeight
                                            });
                                        }
                                    }}
                                    onError={() => {
                                        toast.error('Failed to load image. Please check the file.');
                                    }}
                                    draggable={false}
                                />

                                {dimensions.width > 0 && (
                                    <svg
                                        ref={svgRef}
                                        className="absolute top-0 left-0"
                                        style={{
                                            width: dimensions.width * zoom,
                                            height: dimensions.height * zoom,
                                            pointerEvents: currentTool === 'edit' ? 'auto' : 'none'
                                        }}
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
                                                    fill={isCreatingNewPlot ? "rgba(34, 197, 94, 0.3)" : "rgba(59, 130, 246, 0.3)"}
                                                    stroke={isCreatingNewPlot ? "rgba(34, 197, 94, 0.8)" : "rgba(59, 130, 246, 0.8)"}
                                                    strokeWidth="3"
                                                />
                                                {convertCoordinates(currentPoints).map((point, index) => (
                                                    <circle
                                                        key={index}
                                                        cx={point.x}
                                                        cy={point.y}
                                                        r={selectedPointIndex === index ? "8" : "5"}
                                                        fill={selectedPointIndex === index ? "rgb(239, 68, 68)" : (isCreatingNewPlot ? "rgb(34, 197, 94)" : "rgb(59, 130, 246)")}
                                                        stroke="white"
                                                        strokeWidth="2"
                                                        style={{
                                                            cursor: currentTool === 'edit' ? 'pointer' : 'default',
                                                            pointerEvents: currentTool === 'edit' ? 'auto' : 'none'
                                                        }}
                                                        onClick={(e) => {
                                                            if (currentTool === 'edit') {
                                                                e.stopPropagation();
                                                                setSelectedPointIndex(index);
                                                            }
                                                        }}
                                                    />
                                                ))}
                                            </>
                                        )}

                                        {/* Polygon preview line (from last point to cursor) */}
                                        {currentTool === 'polygon' && currentPoints.length > 0 && currentMousePos && (
                                            <line
                                                x1={currentPoints[currentPoints.length - 1].x * dimensions.width * zoom}
                                                y1={currentPoints[currentPoints.length - 1].y * dimensions.height * zoom}
                                                x2={currentMousePos.x * dimensions.width * zoom}
                                                y2={currentMousePos.y * dimensions.height * zoom}
                                                stroke={isCreatingNewPlot ? "rgba(34, 197, 94, 0.6)" : "rgba(59, 130, 246, 0.6)"}
                                                strokeWidth="2"
                                                strokeDasharray="5,5"
                                            />
                                        )}

                                        {/* Rectangle preview while dragging */}
                                        {currentTool === 'rectangle' && rectangleStart && rectangleEnd && (
                                            <rect
                                                x={Math.min(rectangleStart.x, rectangleEnd.x) * dimensions.width * zoom}
                                                y={Math.min(rectangleStart.y, rectangleEnd.y) * dimensions.height * zoom}
                                                width={Math.abs(rectangleEnd.x - rectangleStart.x) * dimensions.width * zoom}
                                                height={Math.abs(rectangleEnd.y - rectangleStart.y) * dimensions.height * zoom}
                                                fill={isCreatingNewPlot ? "rgba(34, 197, 94, 0.2)" : "rgba(59, 130, 246, 0.2)"}
                                                stroke={isCreatingNewPlot ? "rgba(34, 197, 94, 0.8)" : "rgba(59, 130, 246, 0.8)"}
                                                strokeWidth="2"
                                                strokeDasharray="5,5"
                                            />
                                        )}
                                    </svg>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Plot Data Modal */}
            {showPlotDataModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                        <div className="p-6">
                            <h2 className="text-2xl font-bold mb-4">Enter Plot Details</h2>
                            <form onSubmit={handleSaveNewPlot} className="space-y-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Plot Number <span className="text-red-500">*</span>
                                        </label>
                                        <input
                                            type="text"
                                            required
                                            value={newPlotData.plot_number}
                                            onChange={(e) => setNewPlotData({ ...newPlotData, plot_number: e.target.value })}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            placeholder="e.g., P-001"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Status <span className="text-red-500">*</span>
                                        </label>
                                        <select
                                            required
                                            value={newPlotData.status}
                                            onChange={(e) => setNewPlotData({ ...newPlotData, status: e.target.value })}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        >
                                            <option value="available">Available</option>
                                            <option value="reserved">Reserved</option>
                                            <option value="sold">Sold</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Sector</label>
                                        <input
                                            type="text"
                                            value={newPlotData.sector}
                                            onChange={(e) => setNewPlotData({ ...newPlotData, sector: e.target.value })}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            placeholder="e.g., North"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Block</label>
                                        <input
                                            type="text"
                                            value={newPlotData.block}
                                            onChange={(e) => setNewPlotData({ ...newPlotData, block: e.target.value })}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            placeholder="e.g., A"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Area (sq m) <span className="text-red-500">*</span>
                                        </label>
                                        <input
                                            type="number"
                                            required
                                            step="0.01"
                                            min="0"
                                            value={newPlotData.area}
                                            onChange={(e) => setNewPlotData({ ...newPlotData, area: e.target.value })}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            placeholder="e.g., 500.00"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Price ($) <span className="text-red-500">*</span>
                                        </label>
                                        <input
                                            type="number"
                                            required
                                            step="0.01"
                                            min="0"
                                            value={newPlotData.price}
                                            onChange={(e) => setNewPlotData({ ...newPlotData, price: e.target.value })}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            placeholder="e.g., 50000.00"
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                                    <textarea
                                        value={newPlotData.description}
                                        onChange={(e) => setNewPlotData({ ...newPlotData, description: e.target.value })}
                                        rows="3"
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        placeholder="Additional plot details..."
                                    />
                                </div>
                                <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
                                    <p className="text-sm text-blue-800">
                                        <strong>Coordinates:</strong> {currentPoints.length} points drawn on map
                                    </p>
                                </div>
                                <div className="flex gap-3 justify-end pt-4">
                                    <button
                                        type="button"
                                        onClick={() => setShowPlotDataModal(false)}
                                        className="px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
                                        disabled={isSavingPlot}
                                    >
                                        Back to Drawing
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={isSavingPlot}
                                        className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:bg-gray-400"
                                    >
                                        {isSavingPlot ? 'Creating...' : 'Create Plot'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}

            {/* Instructions */}
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <h3 className="font-bold text-yellow-900 mb-2">Quick Guide</h3>
                <div className="grid md:grid-cols-2 gap-4 text-sm text-yellow-800">
                    <div>
                        <h4 className="font-semibold mb-1">Basic Steps:</h4>
                        <ol className="list-decimal list-inside space-y-1">
                            <li>Upload a master plan image</li>
                            <li>Click "Add New Plot" or select existing plot</li>
                            <li>Use tools to draw/edit boundaries</li>
                            <li>Enter plot details and save</li>
                        </ol>
                    </div>
                    <div>
                        <h4 className="font-semibold mb-1">Tools:</h4>
                        <ul className="list-disc list-inside space-y-1">
                            <li><strong>Polygon:</strong> Click to add points</li>
                            <li><strong>Rectangle:</strong> Click and drag</li>
                            <li><strong>Edit:</strong> Drag points, Delete key to remove</li>
                            <li><strong>Pan:</strong> Drag to move view</li>
                            <li><strong>Zoom:</strong> +/- buttons or mouse wheel</li>
                            <li><strong>Undo/Redo:</strong> Ctrl+Z / Ctrl+Y</li>
                        </ul>
                    </div>
                </div>
            </div>
        </div>
    );
}
