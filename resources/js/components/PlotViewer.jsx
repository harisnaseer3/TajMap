import React, { useRef, useEffect, useState, useCallback } from 'react';

/**
 * Interactive Canvas Plot Viewer with zoom/pan/hover/click
 * Displays plots with normalized coordinates (0-1 range)
 */
export default function PlotViewer({ plots, onPlotClick, selectedPlotId, baseImage }) {
    const canvasRef = useRef(null);
    const [transform, setTransform] = useState({ x: 0, y: 0, scale: 1 });
    const [isDragging, setIsDragging] = useState(false);
    const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
    const [hoveredPlot, setHoveredPlot] = useState(null);
    const [canvasSize, setCanvasSize] = useState({ width: 800, height: 600 });

    // Color mapping for plot statuses
    const statusColors = {
        available: { fill: 'rgba(34, 197, 94, 0.3)', stroke: '#22c55e', hover: 'rgba(34, 197, 94, 0.5)' },
        reserved: { fill: 'rgba(251, 191, 36, 0.3)', stroke: '#fbbf24', hover: 'rgba(251, 191, 36, 0.5)' },
        sold: { fill: 'rgba(239, 68, 68, 0.3)', stroke: '#ef4444', hover: 'rgba(239, 68, 68, 0.5)' },
    };

    // Resize canvas to fill container
    useEffect(() => {
        const updateCanvasSize = () => {
            const container = canvasRef.current?.parentElement;
            if (container) {
                setCanvasSize({
                    width: container.clientWidth,
                    height: container.clientHeight || 600,
                });
            }
        };

        updateCanvasSize();
        window.addEventListener('resize', updateCanvasSize);
        return () => window.removeEventListener('resize', updateCanvasSize);
    }, []);

    // Draw plots on canvas
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        const { width, height } = canvasSize;

        // Clear canvas
        ctx.clearRect(0, 0, width, height);

        // Save context
        ctx.save();

        // Apply transform
        ctx.translate(transform.x, transform.y);
        ctx.scale(transform.scale, transform.scale);

        // Draw base image if provided
        if (baseImage) {
            // Draw base image logic here
        }

        // Draw plots
        plots.forEach((plot) => {
            const isHovered = hoveredPlot?.id === plot.id;
            const isSelected = selectedPlotId === plot.id;
            const colors = statusColors[plot.status] || statusColors.available;

            ctx.beginPath();

            // Convert normalized coordinates to canvas coordinates
            const coords = plot.coordinates.map(coord => ({
                x: coord.x * width,
                y: coord.y * height
            }));

            // Draw polygon
            coords.forEach((point, index) => {
                if (index === 0) {
                    ctx.moveTo(point.x, point.y);
                } else {
                    ctx.lineTo(point.x, point.y);
                }
            });
            ctx.closePath();

            // Fill
            ctx.fillStyle = isHovered || isSelected ? colors.hover : colors.fill;
            ctx.fill();

            // Stroke
            ctx.strokeStyle = isSelected ? '#000' : colors.stroke;
            ctx.lineWidth = isSelected ? 3 / transform.scale : 2 / transform.scale;
            ctx.stroke();

            // Draw plot number
            const center = coords.reduce((acc, point) => ({
                x: acc.x + point.x / coords.length,
                y: acc.y + point.y / coords.length
            }), { x: 0, y: 0 });

            ctx.fillStyle = '#000';
            ctx.font = `${12 / transform.scale}px sans-serif`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(plot.plot_number, center.x, center.y);
        });

        // Restore context
        ctx.restore();
    }, [plots, transform, hoveredPlot, selectedPlotId, canvasSize, baseImage]);

    // Convert screen coordinates to canvas coordinates
    const screenToCanvas = useCallback((screenX, screenY) => {
        const canvas = canvasRef.current;
        if (!canvas) return { x: 0, y: 0 };

        const rect = canvas.getBoundingClientRect();
        const x = (screenX - rect.left - transform.x) / transform.scale;
        const y = (screenY - rect.top - transform.y) / transform.scale;
        return { x, y };
    }, [transform]);

    // Check if point is inside polygon
    const isPointInPolygon = useCallback((point, polygon) => {
        let inside = false;
        for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
            const xi = polygon[i].x, yi = polygon[i].y;
            const xj = polygon[j].x, yj = polygon[j].y;

            const intersect = ((yi > point.y) !== (yj > point.y))
                && (point.x < (xj - xi) * (point.y - yi) / (yj - yi) + xi);
            if (intersect) inside = !inside;
        }
        return inside;
    }, []);

    // Find plot at coordinates
    const findPlotAtPosition = useCallback((canvasX, canvasY) => {
        const { width, height } = canvasSize;
        const normalizedX = canvasX / width;
        const normalizedY = canvasY / height;

        for (let i = plots.length - 1; i >= 0; i--) {
            const plot = plots[i];
            if (isPointInPolygon({ x: normalizedX, y: normalizedY }, plot.coordinates)) {
                return plot;
            }
        }
        return null;
    }, [plots, canvasSize, isPointInPolygon]);

    // Mouse move handler
    const handleMouseMove = useCallback((e) => {
        if (isDragging) {
            const dx = e.clientX - dragStart.x;
            const dy = e.clientY - dragStart.y;
            setTransform(prev => ({ ...prev, x: prev.x + dx, y: prev.y + dy }));
            setDragStart({ x: e.clientX, y: e.clientY });
        } else {
            const { x, y } = screenToCanvas(e.clientX, e.clientY);
            const plot = findPlotAtPosition(x, y);
            setHoveredPlot(plot);
        }
    }, [isDragging, dragStart, screenToCanvas, findPlotAtPosition]);

    // Mouse down handler
    const handleMouseDown = useCallback((e) => {
        if (e.button === 0) { // Left click
            setIsDragging(true);
            setDragStart({ x: e.clientX, y: e.clientY });
        }
    }, []);

    // Mouse up handler
    const handleMouseUp = useCallback((e) => {
        if (isDragging) {
            setIsDragging(false);
        } else {
            const { x, y } = screenToCanvas(e.clientX, e.clientY);
            const plot = findPlotAtPosition(x, y);
            if (plot && onPlotClick) {
                onPlotClick(plot);
            }
        }
    }, [isDragging, screenToCanvas, findPlotAtPosition, onPlotClick]);

    // Wheel handler for zoom
    const handleWheel = useCallback((e) => {
        e.preventDefault();
        const delta = e.deltaY > 0 ? 0.9 : 1.1;
        const newScale = Math.max(0.5, Math.min(5, transform.scale * delta));

        // Zoom towards mouse position
        const { x, y } = screenToCanvas(e.clientX, e.clientY);
        const scaleDiff = newScale - transform.scale;

        setTransform(prev => ({
            x: prev.x - x * scaleDiff,
            y: prev.y - y * scaleDiff,
            scale: newScale,
        }));
    }, [transform.scale, screenToCanvas]);

    // Reset view
    const resetView = () => {
        setTransform({ x: 0, y: 0, scale: 1 });
    };

    return (
        <div className="relative w-full h-full bg-gray-100 rounded-lg overflow-hidden">
            <canvas
                ref={canvasRef}
                width={canvasSize.width}
                height={canvasSize.height}
                onMouseMove={handleMouseMove}
                onMouseDown={handleMouseDown}
                onMouseUp={handleMouseUp}
                onMouseLeave={() => setHoveredPlot(null)}
                onWheel={handleWheel}
                className="cursor-grab active:cursor-grabbing"
            />

            {/* Hover tooltip */}
            {hoveredPlot && (
                <div className="absolute top-4 left-4 bg-white p-4 rounded-lg shadow-lg">
                    <h3 className="font-bold text-lg">{hoveredPlot.plot_number}</h3>
                    <div className="text-sm text-gray-600 space-y-1">
                        <p>Status: <span className="capitalize font-semibold">{hoveredPlot.status}</span></p>
                        <p>Area: {hoveredPlot.area} sq ft</p>
                        <p>Price: ${hoveredPlot.price.toLocaleString()}</p>
                        {hoveredPlot.sector && <p>Sector: {hoveredPlot.sector}</p>}
                        {hoveredPlot.block && <p>Block: {hoveredPlot.block}</p>}
                    </div>
                </div>
            )}

            {/* Controls */}
            <div className="absolute bottom-4 right-4 flex gap-2">
                <button
                    onClick={() => setTransform(prev => ({ ...prev, scale: Math.min(5, prev.scale * 1.2) }))}
                    className="bg-white px-3 py-2 rounded shadow hover:bg-gray-100"
                >
                    +
                </button>
                <button
                    onClick={() => setTransform(prev => ({ ...prev, scale: Math.max(0.5, prev.scale / 1.2) }))}
                    className="bg-white px-3 py-2 rounded shadow hover:bg-gray-100"
                >
                    -
                </button>
                <button
                    onClick={resetView}
                    className="bg-white px-3 py-2 rounded shadow hover:bg-gray-100"
                >
                    Reset
                </button>
            </div>

            {/* Legend */}
            <div className="absolute bottom-4 left-4 bg-white p-3 rounded shadow">
                <h4 className="font-semibold text-sm mb-2">Status</h4>
                <div className="space-y-1 text-xs">
                    <div className="flex items-center gap-2">
                        <div className="w-4 h-4 rounded" style={{ backgroundColor: statusColors.available.stroke }}></div>
                        <span>Available</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-4 h-4 rounded" style={{ backgroundColor: statusColors.reserved.stroke }}></div>
                        <span>Reserved</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-4 h-4 rounded" style={{ backgroundColor: statusColors.sold.stroke }}></div>
                        <span>Sold</span>
                    </div>
                </div>
            </div>
        </div>
    );
}