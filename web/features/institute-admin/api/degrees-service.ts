import { apiClient } from "@/api/client";
import { Degree } from "../types";
import { Course } from "../types"; // valid if exported

export const degreesService = {
    getDegrees: async (): Promise<Degree[]> => {
        const response = await apiClient.get<Degree[]>("/degrees");
        return response.data;
    },

    getDegreeById: async (id: string): Promise<Degree | undefined> => {
        const response = await apiClient.get<Degree>(`/degrees/${id}`);
        return response.data;
    },

    createDegree: async (data: Omit<Degree, "id">): Promise<Degree> => {
        const response = await apiClient.post<Degree>("/degrees", data);
        return response.data;
    },

    updateDegree: async (id: string, data: Partial<Degree>): Promise<Degree> => {
        const response = await apiClient.put<Degree>(`/degrees/${id}`, data);
        return response.data;
    },

    deleteDegree: async (id: string): Promise<void> => {
        await apiClient.delete(`/degrees/${id}`);
    },

    // Relationship Management
    addCourseToDegree: async (degreeId: string, courseId: string): Promise<void> => {
        await apiClient.post(`/degrees/${degreeId}/courses/${courseId}`);
    },

    removeCourseFromDegree: async (degreeId: string, courseId: string): Promise<void> => {
        await apiClient.delete(`/degrees/${degreeId}/courses/${courseId}`);
    },

    getCoursesForDegree: async (degreeId: string): Promise<Course[]> => {
        const response = await apiClient.get<Course[]>(`/degrees/${degreeId}/courses`);
        return response.data;
    }
};
