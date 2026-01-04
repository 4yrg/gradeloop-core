import { Degree } from "../types";
import { MOCK_DEGREES } from "../data/mock-degrees";

// Helper to simulate API delay
const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export const degreesService = {
    getDegrees: async (): Promise<Degree[]> => {
        await delay(500);
        return [...MOCK_DEGREES];
    },

    getDegreeById: async (id: string): Promise<Degree | undefined> => {
        await delay(500);
        return MOCK_DEGREES.find(d => d.id === id);
    },

    createDegree: async (data: Omit<Degree, "id">): Promise<Degree> => {
        await delay(800);
        const newDegree = {
            ...data,
            id: Math.random().toString(36).substring(2, 9),
        };
        // In a real app, we would push to the array here or rely on re-fetching
        return newDegree;
    },

    updateDegree: async (id: string, data: Partial<Degree>): Promise<Degree> => {
        await delay(600);
        return { id, ...data } as Degree;
    },

    deleteDegree: async (id: string): Promise<void> => {
        await delay(500);
    }
};
