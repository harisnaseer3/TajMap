import { create } from 'zustand';

export const useLeadStore = create((set) => ({
    leads: [],
    selectedLead: null,
    filters: {
        status: null,
        adminUserId: null,
        search: '',
    },
    loading: false,

    setLeads: (leads) => set({ leads }),

    setSelectedLead: (lead) => set({ selectedLead: lead }),

    setFilters: (filters) => set((state) => ({
        filters: { ...state.filters, ...filters }
    })),

    resetFilters: () => set({
        filters: {
            status: null,
            adminUserId: null,
            search: '',
        }
    }),

    setLoading: (loading) => set({ loading }),

    addLead: (lead) => set((state) => ({
        leads: [lead, ...state.leads]
    })),

    updateLead: (leadId, updates) => set((state) => ({
        leads: state.leads.map(l => l.id === leadId ? { ...l, ...updates } : l),
        selectedLead: state.selectedLead?.id === leadId
            ? { ...state.selectedLead, ...updates }
            : state.selectedLead
    })),

    deleteLead: (leadId) => set((state) => ({
        leads: state.leads.filter(l => l.id !== leadId)
    })),

    // Group leads by status for Kanban board
    getLeadsByStatus: (status) => {
        const { leads } = set.getState ? set.getState() : { leads: [] };
        return leads.filter(lead => lead.status === status);
    },
}));