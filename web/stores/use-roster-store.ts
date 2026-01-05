import { create } from 'zustand';

interface RosterState {
    searchQuery: string;
    setSearchQuery: (query: string) => void;
}

export const useRosterStore = create<RosterState>((set) => ({
    searchQuery: '',
    setSearchQuery: (query) => set({ searchQuery: query }),
}));
