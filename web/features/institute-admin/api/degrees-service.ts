import { apiClient } from "@/api/client";
import { Degree } from "../types";
import { Course } from "../types";

export const degreesService = {
    getDegrees: async (instituteId: string): Promise<Degree[]> => {
        const response = await apiClient.get<Degree[]>(`/institutes/${instituteId}/degrees`);
        return response.data;
    },

    getDegreeById: async (id: string): Promise<Degree | undefined> => {
        const response = await apiClient.get<Degree>(`/degrees/${id}`);
        return response.data;
    },

    createDegree: async (instituteId: string, data: Omit<Degree, "id">): Promise<Degree> => {
        const response = await apiClient.post<Degree>(`/institutes/${instituteId}/degrees`, data);
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
