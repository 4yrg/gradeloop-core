import { Semester } from "../types";
import { MOCK_SEMESTERS } from "../data/mock-semesters";

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export const semestersService = {
    getSemesters: async (): Promise<Semester[]> => {
        await delay(500);
        return [...MOCK_SEMESTERS];
    },

    createSemester: async (data: Omit<Semester, "id">): Promise<Semester> => {
        await delay(800);
        return {
            ...data,
            id: Math.random().toString(36).substring(2, 9),
        };
    },

    updateSemester: async (id: string, data: Partial<Semester>): Promise<Semester> => {
        await delay(600);
        return { id, ...(MOCK_SEMESTERS.find(s => s.id === id) as Semester), ...data };
    },

    deleteSemester: async (id: string): Promise<void> => {
        await delay(500);
    },

    setActiveSemester: async (id: string): Promise<void> => {
        await delay(300);
        // Logic to unset others and set this one would happen on backend
    }
};
