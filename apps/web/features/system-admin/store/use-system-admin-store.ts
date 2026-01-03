import { create } from "zustand";

interface SystemAdminState {
    // Multi-step form state
    createInstituteStep: number;
    setCreateInstituteStep: (step: number) => void;
    resetCreateInstituteForm: () => void;

    // Selection state
    selectedInstituteId: string | null;
    setSelectedInstituteId: (id: string | null) => void;

    // Modal states
    isCreateModalOpen: boolean;
    setCreateModalOpen: (open: boolean) => void;
    isEditModalOpen: boolean;
    setEditModalOpen: (open: boolean) => void;
}

export const useSystemAdminStore = create<SystemAdminState>((set) => ({
    createInstituteStep: 1,
    setCreateInstituteStep: (step) => set({ createInstituteStep: step }),
    resetCreateInstituteForm: () => set({ createInstituteStep: 1 }),

    selectedInstituteId: null,
    setSelectedInstituteId: (id) => set({ selectedInstituteId: id }),

    isCreateModalOpen: false,
    setCreateModalOpen: (open) => set({ isCreateModalOpen: open }),
    isEditModalOpen: false,
    setEditModalOpen: (open) => set({ isEditModalOpen: open }),
}));
