import { apiClient } from "@/lib/axios";
import { MOCK_INSTITUTES, MOCK_ACTIVITY_LOGS, MOCK_SETUP_STEPS } from "../data/mock-institutes";
import { Institute, ActivityLog, SetupStep } from "../types";

// Helper to simulate API delay
const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export const instituteService = {
    getInstitutes: async (): Promise<Institute[]> => {
        await delay(500);
        // In a real app: return (await apiClient.get("/institutes")).data;
        return [...MOCK_INSTITUTES];
    },

    getInstituteById: async (id: string): Promise<Institute | undefined> => {
        await delay(300);
        return MOCK_INSTITUTES.find((i) => i.id === id);
    },

    createInstitute: async (data: Partial<Institute>): Promise<Institute> => {
        await delay(1000);
        const newInstitute: Institute = {
            ...data,
            id: Math.random().toString(36).substr(2, 9),
            setupProgress: 0,
            createdAt: new Date().toISOString(),
        } as Institute;
        return newInstitute;
    },

    updateInstitute: async (id: string, data: Partial<Institute>): Promise<Institute> => {
        await delay(800);
        return { ...MOCK_INSTITUTES[0], ...data, id };
    },

    getActivityLogs: async (instituteId: string): Promise<ActivityLog[]> => {
        await delay(400);
        return [...MOCK_ACTIVITY_LOGS];
    },

    getSetupSteps: async (instituteId: string): Promise<SetupStep[]> => {
        await delay(400);
        return [...MOCK_SETUP_STEPS];
    },
};
