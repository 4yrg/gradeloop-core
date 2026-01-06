import { Course, ClassGroup } from "../types";
import { apiClient } from "@/api/client";

export const coursesService = {
    getCourses: async (): Promise<Course[]> => {
        const response = await apiClient.get<Course[]>("/courses");
        return response.data;
    },

    getCoursesForDegree: async (degreeId: string): Promise<Course[]> => {
        // This might be redundant if degreesService has it, but useful for course-centric view
        const response = await apiClient.get<Course[]>(`/degrees/${degreeId}/courses`);
        return response.data;
    },

    getCourseById: async (id: string): Promise<Course | undefined> => {
        const response = await apiClient.get<Course>(`/courses/${id}`);
        return response.data;
    },

    createCourse: async (data: Omit<Course, "id">): Promise<Course> => {
        const response = await apiClient.post<Course>("/courses", data);
        return response.data;
    },

    updateCourse: async (id: string, data: Partial<Course>): Promise<Course> => {
        const response = await apiClient.put<Course>(`/courses/${id}`, data);
        return response.data;
    },

    deleteCourse: async (id: string): Promise<void> => {
        await apiClient.delete(`/courses/${id}`);
    },

    assignInstructors: async (courseId: string, instructorIds: string[]): Promise<void> => {
        await apiClient.post(`/courses/${courseId}/instructors`, { instructorIds });
    },

    setModuleLeader: async (courseId: string, instructorId: string): Promise<void> => {
        await apiClient.put(`/courses/${courseId}/module-leader`, { instructorId });
    },

    // Class Management
    getClassesForCourse: async (courseId: string): Promise<ClassGroup[]> => {
        // TODO: Implement backend endpoint
        return [];
    },

    addClassesToCourse: async (courseId: string, classIds: string[]): Promise<void> => {
        // TODO: Implement backend endpoint
    },

    removeClassFromCourse: async (courseId: string, classId: string): Promise<void> => {
        // TODO: Implement backend endpoint
    }
};
