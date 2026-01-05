import { Semester } from "../types";
import { apiClient } from "@/api/client";

export const semestersService = {
    getSemesters: async (): Promise<Semester[]> => {
        const response = await apiClient.get<Semester[]>("/semesters");
        return response.data;
    },

    createSemester: async (data: Omit<Semester, "id">): Promise<Semester> => {
        const response = await apiClient.post<Semester>("/semesters", data);
        return response.data;
    },

    updateSemester: async (id: string, data: Partial<Semester>): Promise<Semester> => {
        const response = await apiClient.put<Semester>(`/semesters/${id}`, data);
        return response.data;
    },

    deleteSemester: async (id: string): Promise<void> => {
        await apiClient.delete(`/semesters/${id}`);
    },

    setActiveSemester: async (id: string): Promise<void> => {
        await apiClient.patch(`/semesters/${id}/activate`);
    }
};
