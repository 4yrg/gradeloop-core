import { apiClient } from './client';
import { Institute, ActivityLog, SetupStep } from '../features/system-admin/types';
import { MOCK_INSTITUTES, MOCK_ACTIVITY_LOGS, MOCK_SETUP_STEPS } from '../features/system-admin/data/mock-institutes';

export const instituteApi = {
    getInstitutes: async (): Promise<Institute[]> => {
        // Mock implementation to match current behavior
        return [...MOCK_INSTITUTES];
    },

    getInstituteById: async (id: string): Promise<Institute | undefined> => {
        return MOCK_INSTITUTES.find((i) => i.id === id);
    },

    createInstitute: async (data: Partial<Institute>): Promise<Institute> => {
        const response = await apiClient.post("/system/institutes", {
            name: data.name,
            code: data.code,
            domain: data.domain,
            contactEmail: data.contactEmail,
            status: data.status || "pending",
            admins: data.admins || []
        });
        return response.data.institute || response.data;
    },

    updateInstitute: async (id: string, data: Partial<Institute>): Promise<Institute> => {
        return { ...MOCK_INSTITUTES[0], ...data, id };
    },

    addAdmin: async (instituteId: string, data: { name: string; email: string }): Promise<void> => {
        await apiClient.post(`/system/institutes/${instituteId}/admins`, data);
    },

    getActivityLogs: async (instituteId: string): Promise<ActivityLog[]> => {
        return [...MOCK_ACTIVITY_LOGS];
    },

    getSetupSteps: async (instituteId: string): Promise<SetupStep[]> => {
        return [...MOCK_SETUP_STEPS];
    }
};
