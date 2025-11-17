import { create } from 'zustand';

export const usePlotStore = create((set, get) => ({
    plots: [],
    selectedPlot: null,
    filters: {
        status: null,
        sector: null,
        street: null,
        type: null,
        category: null,
        search: '',
        minPrice: null,
        maxPrice: null,
        minArea: null,
        maxArea: null,
    },
    pagination: {
        currentPage: 1,
        lastPage: 1,
        perPage: 15,
        total: 0,
    },
    loading: false,

    setPlots: (plots) => set({ plots }),

    setSelectedPlot: (plot) => set({ selectedPlot: plot }),

    setFilters: (filters) => set((state) => ({
        filters: { ...state.filters, ...filters }
    })),

    resetFilters: () => set({
        filters: {
            status: null,
            sector: null,
            street: null,
            type: null,
            category: null,
            search: '',
            minPrice: null,
            maxPrice: null,
            minArea: null,
            maxArea: null,
        }
    }),

    setPagination: (pagination) => set({ pagination }),

    setLoading: (loading) => set({ loading }),

    addPlot: (plot) => set((state) => ({
        plots: [plot, ...state.plots]
    })),

    updatePlot: (plotId, updates) => set((state) => ({
        plots: state.plots.map(p => p.id === plotId ? { ...p, ...updates } : p)
    })),

    deletePlot: (plotId) => set((state) => ({
        plots: state.plots.filter(p => p.id !== plotId)
    })),
}));