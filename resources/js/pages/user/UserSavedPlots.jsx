import React, { useEffect, useState } from 'react';
import { savedPlotService } from '../../services/api';

export default function UserSavedPlots() {
    const [plots, setPlots] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchSavedPlots();
    }, []);

    const fetchSavedPlots = async () => {
        try {
            const { data } = await savedPlotService.getAll();
            setPlots(data.data);
        } catch (error) {
            console.error('Error fetching saved plots:', error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-100 p-6">
            <div className="max-w-7xl mx-auto">
                <h1 className="text-3xl font-bold mb-6">Saved Plots</h1>
                {loading ? (
                    <p>Loading...</p>
                ) : plots.length === 0 ? (
                    <p className="text-gray-600">No saved plots yet</p>
                ) : (
                    <div className="grid gap-4">
                        {plots.map(plot => (
                            <div key={plot.id} className="bg-white p-6 rounded-lg shadow">
                                <h3 className="text-xl font-bold">{plot.plot_number}</h3>
                                <p className="text-gray-600">Area: {plot.area} sq ft</p>
                                <p className="text-gray-600">Price: ${plot.price.toLocaleString()}</p>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}