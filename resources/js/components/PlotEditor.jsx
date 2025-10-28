import React, { useRef, useEffect, useState, useCallback } from 'react';
import toast from 'react-hot-toast';

/**
 * Advanced Canvas Plot Editor with drawing tools, vertex editing, undo/redo
 */
export default function PlotEditor({ existingPlots = [], onPlotCreated, onPlotUpdated, baseImage }) {
    const canvasRef = useRef(null);
    const [transform, setTransform] = useState({ x: 0, y: 0, scale: 1 });
    const [canvasSize, setCanvasSize] = useState({ width: 1200, height: 800 });

    // Drawing state
    const [mode, setMode] = useState('select'); // select, polygon, rectangle, freeform, edit
    const [currentPoints, setCurrentPoints] = useState([]);
    const [selectedPlot, setSelectedPlot] = useState(null);
    const [selectedVertex, setSelectedVertex] = useState(null);

    // History for undo/redo
    const [history, setHistory] = useState([]);
    const [historyIndex, setHistoryIndex] = useState(-1);

    const [plots, setPlots] = useState(existingPlots);
    const [isDragging, setIsDragging] = useState(false);
    const [dragStart, setDragStart] = useState(null);

    // Resize canvas
    useEffect(() => {
        const updateSize = () => {
            const container = canvasRef.current?.parentElement;
            if (container) {
                setCanvasSize({ width: container.clientWidth, height: container.clientHeight || 800 });
            }
        };
        updateSize();
        window.addEventListener('resize', updateSize);
        return () => window.removeEventListener('resize', updateSize);
    }, []);

    // Update plots when existingPlots changes
    useEffect(() => {
        setPlots(existingPlots);
    }, [existingPlots]);

    // Convert screen to canvas coordinates
    const screenToCanvas = useCallback((screenX, screenY) => {
        const canvas = canvasRef.current;
        if (!canvas) return { x: 0, y: 0 };
        const rect = canvas.getBoundingClientRect();
        return {
            x: (screenX - rect.left - transform.x) / transform.scale,
            y: (screenY - rect.top - transform.y) / transform.scale,
        };
    }, [transform]);

    // Normalize coordinates to 0-1 range
    const normalizeCoordinate = useCallback((x, y) => ({
        x: x / canvasSize.width,
        y: y / canvasSize.height,
    }), [canvasSize]);

    // Denormalize coordinates from 0-1 range
    const denormalizeCoordinate = useCallback((coord) => ({
        x: coord.x * canvasSize.width,
        y: coord.y * canvasSize.height,
    }), [canvasSize]);

    // Add to history
    const addToHistory = useCallback((action) => {
        const newHistory = history.slice(0, historyIndex + 1);
        newHistory.push(action);
        setHistory(newHistory);
        setHistoryIndex(newHistory.length - 1);
    }, [history, historyIndex]);

    // Undo
    const undo = useCallback(() => {
        if (historyIndex >= 0) {
            const action = history[historyIndex];
            if (action.type === 'add') {
                setPlots(plots.filter(p => p !== action.plot));
            } else if (action.type === 'delete') {
                setPlots([...plots, action.plot]);
            } else if (action.type === 'modify') {
                setPlots(plots.map(p => p === action.newPlot ? action.oldPlot : p));
            }
            setHistoryIndex(historyIndex - 1);
        }
    }, [history, historyIndex, plots]);

    // Redo
    const redo = useCallback(() => {
        if (historyIndex < history.length - 1) {
            const action = history[historyIndex + 1];
            if (action.type === 'add') {
                setPlots([...plots, action.plot]);
            } else if (action.type === 'delete') {
                setPlots(plots.filter(p => p !== action.plot));
            } else if (action.type === 'modify') {
                setPlots(plots.map(p => p === action.oldPlot ? action.newPlot : p));
            }
            setHistoryIndex(historyIndex + 1);
        }
    }, [history, historyIndex, plots]);

    // Create rectangle
    const createRectangle = useCallback((start, end) => {
        const coords = [
            normalizeCoordinate(start.x, start.y),
            normalizeCoordinate(end.x, start.y),
            normalizeCoordinate(end.x, end.y),
            normalizeCoordinate(start.x, end.y),
        ];
        return coords;
    }, [normalizeCoordinate]);

    // Complete polygon
    const completePolygon = useCallback(() => {
        if (currentPoints.length < 3) {
            toast.error('A plot needs at least 3 points');
            return;
        }

        const newPlot = {
            id: Date.now(),
            coordinates: currentPoints.map(p => normalizeCoordinate(p.x, p.y)),
            isNew: true,
        };

        setPlots([...plots, newPlot]);
        addToHistory({ type: 'add', plot: newPlot });
        setCurrentPoints([]);
        setMode('select');

        if (onPlotCreated) {
            onPlotCreated(newPlot);
        }

        toast.success('Plot created! Fill in details to save.');
    }, [currentPoints, plots, normalizeCoordinate, addToHistory, onPlotCreated]);

    // Delete selected plot
    const deleteSelectedPlot = useCallback(() => {
        if (selectedPlot) {
            const updatedPlots = plots.filter(p => p !== selectedPlot);
            setPlots(updatedPlots);
            addToHistory({ type: 'delete', plot: selectedPlot });
            setSelectedPlot(null);
            toast.success('Plot deleted');
        }
    }, [selectedPlot, plots, addToHistory]);

    // Duplicate selected plot
    const duplicateSelectedPlot = useCallback(() => {
        if (selectedPlot) {
            const offset = 0.05; // 5% offset
            const newPlot = {
                ...selectedPlot,
                id: Date.now(),
                coordinates: selectedPlot.coordinates.map(c => ({
                    x: Math.min(0.95, c.x + offset),
                    y: Math.min(0.95, c.y + offset),
                })),
                isNew: true,
            };
            setPlots([...plots, newPlot]);
            addToHistory({ type: 'add', plot: newPlot });
            setSelectedPlot(newPlot);
            toast.success('Plot duplicated');
        }
    }, [selectedPlot, plots, addToHistory]);

    // Handle mouse click
    const handleMouseDown = useCallback((e) => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const { x, y } = screenToCanvas(e.clientX, e.clientY);

        if (mode === 'polygon') {
            setCurrentPoints([...currentPoints, { x, y }]);
        } else if (mode === 'rectangle') {
            setDragStart({ x, y });
            setIsDragging(true);
        } else if (mode === 'select' || mode === 'edit') {
            // Select plot or vertex
            setDragStart({ x: e.clientX, y: e.clientY });
            setIsDragging(true);
        }
    }, [mode, currentPoints, screenToCanvas]);

    const handleMouseMove = useCallback((e) => {
        if (!isDragging) return;

        if (mode === 'select') {
            const dx = e.clientX - dragStart.x;
            const dy = e.clientY - dragStart.y;
            setTransform(prev => ({ ...prev, x: prev.x + dx, y: prev.y + dy }));
            setDragStart({ x: e.clientX, y: e.clientY });
        }
    }, [isDragging, mode, dragStart]);

    const handleMouseUp = useCallback((e) => {
        if (mode === 'rectangle' && isDragging && dragStart) {
            const { x, y } = screenToCanvas(e.clientX, e.clientY);
            const coords = createRectangle(dragStart, { x, y });

            const newPlot = {
                id: Date.now(),
                coordinates: coords,
                isNew: true,
            };

            setPlots([...plots, newPlot]);
            addToHistory({ type: 'add', plot: newPlot });
            setMode('select');

            if (onPlotCreated) {
                onPlotCreated(newPlot);
            }

            toast.success('Plot created! Fill in details to save.');
        }

        setIsDragging(false);
        setDragStart(null);
    }, [mode, isDragging, dragStart, plots, screenToCanvas, createRectangle, addToHistory, onPlotCreated]);

    // Handle wheel for zoom
    const handleWheel = useCallback((e) => {
        e.preventDefault();
        const delta = e.deltaY > 0 ? 0.9 : 1.1;
        const newScale = Math.max(0.5, Math.min(5, transform.scale * delta));
        setTransform(prev => ({ ...prev, scale: newScale }));
    }, [transform.scale]);

    // Keyboard shortcuts
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.ctrlKey && e.key === 'z') {
                e.preventDefault();
                undo();
            } else if (e.ctrlKey && e.key === 'y') {
                e.preventDefault();
                redo();
            } else if (e.key === 'Delete' && selectedPlot) {
                deleteSelectedPlot();
            } else if (e.key === 'Escape') {
                setCurrentPoints([]);
                setMode('select');
            } else if (e.key === 'Enter' && mode === 'polygon') {
                completePolygon();
            } else if (e.ctrlKey && e.key === 'd' && selectedPlot) {
                e.preventDefault();
                duplicateSelectedPlot();
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [undo, redo, deleteSelectedPlot, selectedPlot, mode, completePolygon, duplicateSelectedPlot]);

    // Draw on canvas
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        const { width, height } = canvasSize;

        ctx.clearRect(0, 0, width, height);
        ctx.save();
        ctx.translate(transform.x, transform.y);
        ctx.scale(transform.scale, transform.scale);

        // Draw base image
        if (baseImage) {
            // Draw base image here
        }

        // Draw existing plots
        plots.forEach(plot => {
            const coords = plot.coordinates.map(denormalizeCoordinate);

            ctx.beginPath();
            coords.forEach((point, i) => {
                if (i === 0) ctx.moveTo(point.x, point.y);
                else ctx.lineTo(point.x, point.y);
            });
            ctx.closePath();

            ctx.fillStyle = plot === selectedPlot ? 'rgba(59, 130, 246, 0.3)' : 'rgba(34, 197, 94, 0.2)';
            ctx.fill();
            ctx.strokeStyle = plot === selectedPlot ? '#3b82f6' : '#22c55e';
            ctx.lineWidth = plot === selectedPlot ? 3 / transform.scale : 2 / transform.scale;
            ctx.stroke();

            // Draw vertices if in edit mode and selected
            if (mode === 'edit' && plot === selectedPlot) {
                coords.forEach((point, i) => {
                    ctx.fillStyle = selectedVertex === i ? '#ef4444' : '#3b82f6';
                    ctx.beginPath();
                    ctx.arc(point.x, point.y, 6 / transform.scale, 0, Math.PI * 2);
                    ctx.fill();
                });
            }
        });

        // Draw current polygon being drawn
        if (currentPoints.length > 0) {
            ctx.beginPath();
            currentPoints.forEach((point, i) => {
                if (i === 0) ctx.moveTo(point.x, point.y);
                else ctx.lineTo(point.x, point.y);
            });
            ctx.strokeStyle = '#3b82f6';
            ctx.lineWidth = 2 / transform.scale;
            ctx.stroke();

            // Draw points
            currentPoints.forEach(point => {
                ctx.fillStyle = '#3b82f6';
                ctx.beginPath();
                ctx.arc(point.x, point.y, 5 / transform.scale, 0, Math.PI * 2);
                ctx.fill();
            });
        }

        ctx.restore();
    }, [plots, currentPoints, selectedPlot, selectedVertex, transform, mode, canvasSize, denormalizeCoordinate, baseImage]);

    return (
        <div className="flex flex-col h-full">
            {/* Toolbar */}
            <div className="bg-white border-b p-4 flex items-center gap-4 flex-wrap">
                <div className="flex gap-2">
                    <button
                        onClick={() => setMode('select')}
                        className={`px-4 py-2 rounded ${mode === 'select' ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}
                    >
                        Select
                    </button>
                    <button
                        onClick={() => setMode('polygon')}
                        className={`px-4 py-2 rounded ${mode === 'polygon' ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}
                    >
                        Polygon
                    </button>
                    <button
                        onClick={() => setMode('rectangle')}
                        className={`px-4 py-2 rounded ${mode === 'rectangle' ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}
                    >
                        Rectangle
                    </button>
                    <button
                        onClick={() => setMode('edit')}
                        className={`px-4 py-2 rounded ${mode === 'edit' ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}
                        disabled={!selectedPlot}
                    >
                        Edit Vertices
                    </button>
                </div>

                <div className="flex gap-2 ml-auto">
                    <button onClick={undo} disabled={historyIndex < 0} className="px-3 py-2 bg-gray-200 rounded disabled:opacity-50">
                        Undo
                    </button>
                    <button onClick={redo} disabled={historyIndex >= history.length - 1} className="px-3 py-2 bg-gray-200 rounded disabled:opacity-50">
                        Redo
                    </button>
                    <button onClick={duplicateSelectedPlot} disabled={!selectedPlot} className="px-3 py-2 bg-gray-200 rounded disabled:opacity-50">
                        Duplicate
                    </button>
                    <button onClick={deleteSelectedPlot} disabled={!selectedPlot} className="px-3 py-2 bg-red-600 text-white rounded disabled:opacity-50">
                        Delete
                    </button>
                </div>
            </div>

            {/* Canvas */}
            <div className="flex-1 relative bg-gray-100">
                <canvas
                    ref={canvasRef}
                    width={canvasSize.width}
                    height={canvasSize.height}
                    onMouseDown={handleMouseDown}
                    onMouseMove={handleMouseMove}
                    onMouseUp={handleMouseUp}
                    onWheel={handleWheel}
                    className="cursor-crosshair"
                />

                {/* Instructions */}
                {mode === 'polygon' && (
                    <div className="absolute top-4 left-4 bg-white p-4 rounded shadow">
                        <p className="text-sm">Click to add points. Press Enter or double-click to complete.</p>
                        <p className="text-xs text-gray-600 mt-1">Points: {currentPoints.length}</p>
                    </div>
                )}
            </div>
        </div>
    );
}