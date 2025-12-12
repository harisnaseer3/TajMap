import React, { useEffect, useState, useRef } from 'react';
import { plotService, mediaService, settingService } from '../../services/api';
import toast from 'react-hot-toast';
import { MagnifyingGlassMinusIcon, MagnifyingGlassPlusIcon, ArrowsPointingOutIcon } from '@heroicons/react/24/outline';

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
        street: '',
        type: '',
        category: '',
        area: '',
        price: '',
        status: 'available',
        description: ''
    });
    const [isSavingPlot, setIsSavingPlot] = useState(false);

    // Search and sort state
    const [searchQuery, setSearchQuery] = useState('');
    const [sortBy, setSortBy] = useState('plot_number'); // 'plot_number', 'status', 'sector', 'has_coordinates'

    const containerRef = useRef(null);
    const imageRef = useRef(null);
    const fileInputRef = useRef(null);
    const svgRef = useRef(null);
    const plotItemRefs = useRef({});

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
        // rect.width already includes zoom, so don't multiply by zoom
        const x = (e.clientX - rect.left - panOffset.x) / rect.width;
        const y = (e.clientY - rect.top - panOffset.y) / rect.height;

        if (currentTool === 'polygon') {
            const newPoints = [...currentPoints, { x, y }];
            setCurrentPoints(newPoints);
            addToHistory(newPoints);
        } else if (currentTool === 'rectangle' && !rectangleStart) {
            setRectangleStart({ x, y });
        }
    };

    const handleImageDoubleClick = (e) => {
        if (!isDrawing && !isCreatingNewPlot) return;

        // Prevent adding point from click event
        e.preventDefault();
        e.stopPropagation();

        // Check if we have enough points to create a polygon
        if (currentPoints.length < 3) {
            toast.error('Please draw at least 3 points to create a polygon');
            return;
        }

        // Stop drawing by switching to edit mode - keeps the points
        // User can then manually save or adjust the polygon
        setCurrentTool('edit');
        toast.success('Drawing completed. You can now edit points or click Save.');
    };

    const handleMouseDown = (e) => {
        const rect = imageRef.current.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;

        // Enable drag-to-pan when zoomed in (even when drawing/creating)
        if (zoom > 1 && e.button === 0) {
            setIsPanning(true);
            setPanStart({ x: e.clientX - panOffset.x, y: e.clientY - panOffset.y });
            return; // Don't process other interactions while panning
        }

        if (!isDrawing && !isCreatingNewPlot) return;

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
            // rect.width already includes zoom, so don't multiply by zoom
            const x = (mouseX - panOffset.x) / rect.width;
            const y = (mouseY - panOffset.y) / rect.height;
            setRectangleStart({ x, y });
        }
    };

    const handleMouseMove = (e) => {
        if (!imageRef.current) return;

        const rect = imageRef.current.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;

        // Handle panning when zoomed in
        if (isPanning) {
            setPanOffset({
                x: e.clientX - panStart.x,
                y: e.clientY - panStart.y
            });
            return; // Don't process other interactions while panning
        }

        if (!isDrawing && !isCreatingNewPlot) return;

        // Update current mouse position for preview - rect.width already includes zoom
        const x = (mouseX - panOffset.x) / rect.width;
        const y = (mouseY - panOffset.y) / rect.height;
        setCurrentMousePos({ x, y });

        if (isDraggingPoint && currentTool === 'edit' && selectedPointIndex !== null) {
            const newPoints = [...currentPoints];
            newPoints[selectedPointIndex] = { x, y };
            setCurrentPoints(newPoints);
        } else if (currentTool === 'rectangle' && rectangleStart) {
            // Update rectangle end point for live preview
            setRectangleEnd({ x, y });
        }
    };

    const handleMouseUp = (e) => {
        // Always stop panning when mouse is released
        if (isPanning) {
            setIsPanning(false);
        }

        if (currentTool === 'edit' && isDraggingPoint) {
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

        // Scroll the selected plot into view in the sidebar
        setTimeout(() => {
            if (plotItemRefs.current[plot.id]) {
                plotItemRefs.current[plot.id].scrollIntoView({
                    behavior: 'smooth',
                    block: 'nearest'
                });
            }
        }, 100);
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
            street: '',
            type: '',
            category: '',
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

            // Only send necessary fields with proper types
            const updateData = {
                coordinates: currentPoints,
                base_image_id: baseImageId,
                // Ensure numeric fields are properly typed
                area: selectedPlot.area ? parseFloat(selectedPlot.area) : undefined,
                price: selectedPlot.price ? parseFloat(selectedPlot.price) : undefined,
            };

            // Remove undefined values
            Object.keys(updateData).forEach(key => {
                if (updateData[key] === undefined) {
                    delete updateData[key];
                }
            });

            await plotService.adminUpdate(selectedPlot.id, updateData);

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
            // Only send coordinates field
            await plotService.adminUpdate(plot.id, {
                coordinates: []
            });

            toast.success('Coordinates cleared');
            fetchPlots();
        } catch (error) {
            console.error('Error clearing coordinates:', error);
            toast.error('Failed to clear coordinates');
        }
    };

    // Filter and sort plots
    const getFilteredAndSortedPlots = () => {
        let filteredPlots = [...plots];

        // Apply search filter
        if (searchQuery.trim()) {
            const query = searchQuery.toLowerCase();
            filteredPlots = filteredPlots.filter(plot =>
                plot.plot_number.toLowerCase().includes(query) ||
                plot.sector?.toLowerCase().includes(query) ||
                plot.street?.toLowerCase().includes(query) ||
                plot.type?.toLowerCase().includes(query) ||
                plot.category?.toLowerCase().includes(query) ||
                plot.status?.toLowerCase().includes(query)
            );
        }

        // Apply sorting
        filteredPlots.sort((a, b) => {
            switch (sortBy) {
                case 'plot_number':
                    return a.plot_number.localeCompare(b.plot_number);

                case 'status':
                    const statusOrder = { available: 1, reserved: 2, sold: 3 };
                    return (statusOrder[a.status] || 4) - (statusOrder[b.status] || 4);

                case 'sector':
                    const sectorA = a.sector || '';
                    const sectorB = b.sector || '';
                    return sectorA.localeCompare(sectorB);

                case 'has_coordinates':
                    const hasCoordA = a.coordinates && a.coordinates.length > 0 ? 0 : 1;
                    const hasCoordB = b.coordinates && b.coordinates.length > 0 ? 0 : 1;
                    return hasCoordA - hasCoordB;

                default:
                    return 0;
            }
        });

        return filteredPlots;
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

    const handleWheel = (e) => {
        e.preventDefault();
        const delta = e.deltaY > 0 ? -0.1 : 0.1;
        setZoom(prev => Math.max(0.25, Math.min(5, prev + delta)));
    };

    const convertCoordinates = (coords) => {
        if (!dimensions.width || !dimensions.height) return [];
        // dimensions already include zoom (from clientWidth/Height), so don't multiply by zoom again
        return coords.map(coord => ({
            x: coord.x * dimensions.width,
            y: coord.y * dimensions.height
        }));
    };

    const createPolygonPoints = (coords) => {
        const converted = convertCoordinates(coords);
        return converted.map(c => `${c.x},${c.y}`).join(' ');
    };

    // Update dimensions when image loads or resizes
    useEffect(() => {
        if (imageRef.current) {
            setDimensions({
                width: imageRef.current.clientWidth,
                height: imageRef.current.clientHeight
            });
        }
    }, [baseImage]);

    // Add resize observer to track dimension changes
    useEffect(() => {
        if (!imageRef.current) return;

        const updateDimensions = () => {
            if (imageRef.current) {
                setDimensions({
                    width: imageRef.current.clientWidth,
                    height: imageRef.current.clientHeight
                });
            }
        };

        // Create resize observer
        const resizeObserver = new ResizeObserver(updateDimensions);
        resizeObserver.observe(imageRef.current);

        // Also listen to window resize
        window.addEventListener('resize', updateDimensions);

        // Initial update
        updateDimensions();

        return () => {
            resizeObserver.disconnect();
            window.removeEventListener('resize', updateDimensions);
        };
    }, [baseImage, zoom]);

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
        // When zoomed in, always show grab cursor for panning
        if (zoom > 1 && isPanning) return 'grabbing';
        if (zoom > 1) return 'grab';

        if (!isDrawing && !isCreatingNewPlot) return 'default';
        if (currentTool === 'pan') return isPanning ? 'grabbing' : 'grab';
        if (currentTool === 'polygon' || currentTool === 'rectangle') return 'crosshair';
        if (currentTool === 'edit') return isDraggingPoint ? 'grabbing' : 'pointer';
        return 'default';
    };

    const getStatusColor = (status) => {
        switch (status?.toLowerCase()) {
            case 'available':
                return 'rgba(34, 197, 94, 0.1)'; // green
            case 'reserved':
                return 'rgba(251, 191, 36, 0.3)'; // yellow
            case 'hold':
                return 'rgba(156, 163, 175, 0.3)'; // gray
            case 'sold':
                return 'rgba(239, 68, 68, 0.3)'; // red
            default:
                return 'rgba(156, 163, 175, 0.3)'; // gray
        }
    };

    const getStatusBorderColor = (status) => {
        switch (status?.toLowerCase()) {
            case 'available':
                return 'rgba(34, 197, 94, 0.1)';
            case 'reserved':
                return 'rgba(251, 191, 36, 0.8)';
            case 'hold':
                return 'rgba(156, 163, 175, 0.8)';
            case 'sold':
                return 'rgba(239, 68, 68, 0.8)';
            default:
                return 'rgba(156, 163, 175, 0.8)';
        }
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

                        {/* Search Input */}
                        <div className="mb-3">
                            <div className="relative">
                                <input
                                    type="text"
                                    placeholder="Search plots..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="w-full px-3 py-2 pl-9 pr-9 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                                />
                                <svg className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                </svg>
                                {searchQuery && (
                                    <button
                                        onClick={() => setSearchQuery('')}
                                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                        title="Clear search"
                                    >
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                        </svg>
                                    </button>
                                )}
                            </div>
                        </div>

                        {/* Sort Dropdown */}
                        <div className="mb-4">
                            <select
                                value={sortBy}
                                onChange={(e) => setSortBy(e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                            >
                                <option value="plot_number">Sort by Plot Number</option>
                                <option value="status">Sort by Status</option>
                                <option value="sector">Sort by Sector</option>
                                <option value="has_coordinates">Sort by Coordinates</option>
                            </select>
                        </div>

                        {/* Results count */}
                        {searchQuery && (
                            <div className="mb-3 text-xs text-gray-600 px-1">
                                {getFilteredAndSortedPlots().length} result(s) found
                            </div>
                        )}

                        <div className="space-y-2">
                            {getFilteredAndSortedPlots().length > 0 ? (
                                getFilteredAndSortedPlots().map((plot) => (
                                    <div
                                        key={plot.id}
                                        ref={(el) => (plotItemRefs.current[plot.id] = el)}
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
                                                    {plot.sector && plot.street ? `${plot.sector} - ${plot.street}` : plot.sector || plot.street || 'No location'}
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
                                ))
                            ) : (
                                <div className="text-center py-8 text-gray-500">
                                    <svg className="w-12 h-12 mx-auto mb-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                    <p className="text-sm">No plots found</p>
                                    {searchQuery && (
                                        <button
                                            onClick={() => setSearchQuery('')}
                                            className="text-xs text-blue-600 hover:text-blue-800 mt-2"
                                        >
                                            Clear search
                                        </button>
                                    )}
                                </div>
                            )}
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
                            onWheel={handleWheel}
                        >
                            {/* Floating Zoom Controls */}
                            <div className="absolute top-4 right-4 z-50 flex flex-col gap-2">
                                <button
                                    onClick={handleZoomIn}
                                    disabled={zoom >= 5}
                                    className="bg-white hover:bg-gray-100 disabled:bg-gray-200 disabled:cursor-not-allowed rounded-lg p-2 shadow-lg transition-all"
                                    title="Zoom In"
                                >
                                    <MagnifyingGlassPlusIcon className="w-6 h-6 text-gray-700" />
                                </button>
                                <button
                                    onClick={handleZoomOut}
                                    disabled={zoom <= 0.25}
                                    className="bg-white hover:bg-gray-100 disabled:bg-gray-200 disabled:cursor-not-allowed rounded-lg p-2 shadow-lg transition-all"
                                    title="Zoom Out"
                                >
                                    <MagnifyingGlassMinusIcon className="w-6 h-6 text-gray-700" />
                                </button>
                                <button
                                    onClick={handleResetView}
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
                                    transform: `translate(${panOffset.x}px, ${panOffset.y}px) scale(${zoom})`,
                                    transformOrigin: 'center center',
                                    cursor: getCursorStyle(),
                                    transition: 'transform 0.2s ease-out'
                                }}
                                onClick={handleImageClick}
                                onDoubleClick={handleImageDoubleClick}
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
                                        pointerEvents: (isDrawing || isCreatingNewPlot) ? 'none' : 'auto'
                                    }}
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
                                            width: dimensions.width,
                                            height: dimensions.height,
                                            pointerEvents: (currentTool === 'edit' || (!isDrawing && !isCreatingNewPlot)) ? 'auto' : 'none'
                                        }}
                                    >
                                        {/* Existing plots */}
                                        {plots
                                            .filter(p => p.coordinates && p.coordinates.length > 0 && p.id !== selectedPlot?.id)
                                            .map((plot) => (
                                                <polygon
                                                    key={plot.id}
                                                    points={createPolygonPoints(plot.coordinates)}
                                                    fill={getStatusColor(plot.status)}
                                                    stroke={getStatusBorderColor(plot.status)}
                                                    strokeWidth="2"
                                                    style={{
                                                        cursor: (!isDrawing && !isCreatingNewPlot) ? 'pointer' : 'default',
                                                        pointerEvents: (!isDrawing && !isCreatingNewPlot) ? 'auto' : 'none'
                                                    }}
                                                    onClick={(e) => {
                                                        if (!isDrawing && !isCreatingNewPlot) {
                                                            e.stopPropagation();
                                                            handleStartDrawing(plot);
                                                        }
                                                    }}
                                                    onMouseEnter={(e) => {
                                                        if (!isDrawing && !isCreatingNewPlot) {
                                                            e.target.style.opacity = '0.7';
                                                        }
                                                    }}
                                                    onMouseLeave={(e) => {
                                                        e.target.style.opacity = '1';
                                                    }}
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
                                                x1={currentPoints[currentPoints.length - 1].x * dimensions.width}
                                                y1={currentPoints[currentPoints.length - 1].y * dimensions.height}
                                                x2={currentMousePos.x * dimensions.width}
                                                y2={currentMousePos.y * dimensions.height}
                                                stroke={isCreatingNewPlot ? "rgba(34, 197, 94, 0.6)" : "rgba(59, 130, 246, 0.6)"}
                                                strokeWidth="2"
                                                strokeDasharray="5,5"
                                            />
                                        )}

                                        {/* Rectangle preview while dragging */}
                                        {currentTool === 'rectangle' && rectangleStart && rectangleEnd && (
                                            <rect
                                                x={Math.min(rectangleStart.x, rectangleEnd.x) * dimensions.width}
                                                y={Math.min(rectangleStart.y, rectangleEnd.y) * dimensions.height}
                                                width={Math.abs(rectangleEnd.x - rectangleStart.x) * dimensions.width}
                                                height={Math.abs(rectangleEnd.y - rectangleStart.y) * dimensions.height}
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
                                            <option value="hold">Hold</option>
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
                                            placeholder="e.g., Sector A"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Street</label>
                                        <input
                                            type="text"
                                            value={newPlotData.street}
                                            onChange={(e) => setNewPlotData({ ...newPlotData, street: e.target.value })}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            placeholder="e.g., Main Street"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                                        <input
                                            type="text"
                                            value={newPlotData.type}
                                            onChange={(e) => setNewPlotData({ ...newPlotData, type: e.target.value })}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            placeholder="e.g., Residential, Commercial"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                                        <input
                                            type="text"
                                            value={newPlotData.category}
                                            onChange={(e) => setNewPlotData({ ...newPlotData, category: e.target.value })}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            placeholder="e.g., Premium, Standard"
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
                            <li><strong>Polygon:</strong> Click to add points, double-click to finish</li>
                            <li><strong>Rectangle:</strong> Click and drag</li>
                            <li><strong>Edit:</strong> Drag points, Delete key to remove</li>
                            <li><strong>Pan:</strong> Drag to move view</li>
                            <li><strong>Zoom:</strong> +/- buttons or mouse wheel</li>
                            <li><strong>Undo/Redo:</strong> Ctrl+Z / Ctrl+Y</li>
                            <li><strong>Double-click:</strong> Finish drawing and switch to edit mode</li>
                        </ul>
                    </div>
                </div>
            </div>
        </div>
    );
}
