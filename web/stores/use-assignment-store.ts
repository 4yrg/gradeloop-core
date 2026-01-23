import { create } from 'zustand';
import { CreateAssignmentValues } from '../lib/validations/assignment';

interface AssignmentStore {
    isOpen: boolean;
    step: 1 | 2;
    formData: Partial<CreateAssignmentValues>;
    setOpen: (open: boolean) => void;
    setStep: (step: 1 | 2) => void;
    setFormData: (data: Partial<CreateAssignmentValues>) => void;
    reset: () => void;
}

export const useAssignmentStore = create<AssignmentStore>((set) => ({
    isOpen: false,
    step: 1,
    formData: {
        autograderPoints: 100,
        allowManualGrading: false,
        allowLateSubmissions: false,
        enforceTimeLimit: false,
        enableGroupSubmissions: false,
        enableLeaderboard: false,
    },
    setOpen: (open) => set({ isOpen: open }),
    setStep: (step) => set({ step }),
    setFormData: (data) => set((state) => ({ formData: { ...state.formData, ...data } })),
    reset: () => set({
        isOpen: false,
        step: 1,
        formData: {
            autograderPoints: 100,
            allowManualGrading: false,
            allowLateSubmissions: false,
            enforceTimeLimit: false,
            enableGroupSubmissions: false,
            enableLeaderboard: false,
        }
    }),
}));
