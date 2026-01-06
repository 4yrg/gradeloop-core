import { Course, ClassGroup } from "../types";
import { apiClient } from "@/api/client";

export const coursesService = {
    getCourses: async (instituteId: string): Promise<Course[]> => {
        const response = await apiClient.get<Course[]>(`/institutes/${instituteId}/courses`);
        return response.data;
    },

    getCourseById: async (id: string): Promise<Course | undefined> => {
        const response = await apiClient.get<Course>(`/courses/${id}`);
        return response.data;
    },

    createCourse: async (instituteId: string, data: Omit<Course, "id">): Promise<Course> => {
        const response = await apiClient.post<Course>(`/institutes/${instituteId}/courses`, data);
        return response.data;
    },

    updateCourse: async (id: string, data: Partial<Course>): Promise<Course> => {
        const response = await apiClient.patch<Course>(`/courses/${id}`, data);
        return response.data;
    },

    deleteCourse: async (id: string): Promise<void> => {
        await apiClient.delete(`/courses/${id}`);
    },

    enrollClass: async (courseId: string, classId: string): Promise<Course> => {
        const response = await apiClient.post<Course>(`/courses/${courseId}/classes/${classId}`);
        return response.data;
    },

    removeClass: async (courseId: string, classId: string): Promise<Course> => {
        const response = await apiClient.delete<Course>(`/courses/${courseId}/classes/${classId}`);
        return response.data;
    },

    addInstructors: async (courseId: string, instructorIds: number[]): Promise<Course> => {
        const response = await apiClient.post<Course>(`/courses/${courseId}/instructors`, instructorIds);
        return response.data;
    }
};
