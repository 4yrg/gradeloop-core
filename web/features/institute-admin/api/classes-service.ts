import { apiClient } from "@/api/client";
import { ClassGroup, Person } from "../types";
import { peopleService } from "./people.api";

export const classesService = {
    getClassesForDegree: async (degreeId: string): Promise<ClassGroup[]> => {
        const response = await apiClient.get<ClassGroup[]>(`/degrees/${degreeId}/classes`);
        return response.data;
    },

    createClass: async (instituteId: string, data: Partial<ClassGroup>): Promise<ClassGroup> => {
        const response = await apiClient.post<ClassGroup>(`/institutes/${instituteId}/classes`, data);
        return response.data;
    },

    bulkCreateClasses: async (instituteId: string, data: any[]): Promise<ClassGroup[]> => {
        const response = await apiClient.post<ClassGroup[]>(`/institutes/${instituteId}/classes/bulk`, data);
        return response.data;
    },

    downloadTemplate: (instituteId: string) => {
        const endpoint = `/institutes/${instituteId}/classes/template`;
        const url = `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8081'}${endpoint}`;
        window.open(url, '_blank');
    },

    updateClass: async (id: string, data: Partial<ClassGroup>): Promise<ClassGroup> => {
        const response = await apiClient.patch<ClassGroup>(`/classes/${id}`, data);
        return response.data;
    },

    getClassById: async (id: string): Promise<ClassGroup> => {
        const response = await apiClient.get<ClassGroup>(`/classes/${id}`);
        return response.data;
    },

    getStudentsForClass: async (classId: string): Promise<Person[]> => {
        const response = await apiClient.get<ClassGroup>(`/classes/${classId}`);
        const studentIds = response.data.studentIds || [];
        if (studentIds.length === 0) return [];

        return peopleService.getStudentsByIds(studentIds.map(id => Number(id)));
    },

    importStudents: async (classId: string, studentIds: number[]): Promise<void> => {
        await apiClient.post(`/classes/${classId}/students`, studentIds);
    },

    addStudentsToClass: async (classId: string, studentIds: number[]): Promise<void> => {
        await apiClient.post(`/classes/${classId}/students`, studentIds);
    },

    removeStudentFromClass: async (classId: string, studentId: string): Promise<void> => {
        // backend doesn't have this yet, skipping for now
    },

    deleteClass: async (id: string): Promise<void> => {
        await apiClient.delete(`/classes/${id}`);
    }
};
