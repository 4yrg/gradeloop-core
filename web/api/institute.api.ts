import { apiClient } from './client';
import { Institute, ActivityLog, SetupStep, InstituteAdmin } from '../features/system-admin/types';

// Backend API types to match Java DTOs
interface CreateInstituteRequest {
    name: string;
    code: string;
    domain: string;
    contactEmail: string;
    admins: Array<{
        name: string;
        email: string;
        role: 'OWNER' | 'ADMIN';
    }>;
}

interface InstituteResponse {
    id: string;
    name: string;
    code: string;
    domain: string;
    contactEmail: string;
    admins: Array<{
        id: string;
        userId: number;
        role: 'OWNER' | 'ADMIN';
    }>;
}

// Transform backend response to frontend Institute type
const transformInstituteResponse = (response: InstituteResponse): Institute => {
    return {
        id: response.id,
        name: response.name,
        code: response.code,
        domain: response.domain,
        contactEmail: response.contactEmail,
        status: 'active', // Default status, can be enhanced later
        admins: response.admins.map(admin => ({
            id: admin.id,
            name: '', // Backend doesn't return name in current implementation
            email: '', // Backend doesn't return email in current implementation
            role: admin.role.toLowerCase() as 'owner' | 'admin',
        })),
        setupProgress: 0, // Default progress
        createdAt: new Date().toISOString(),
    };
};

export const instituteApi = {
    getInstitutes: async (): Promise<Institute[]> => {
        try {
            const response = await apiClient.get<InstituteResponse[]>('/institutes');
            return response.data.map(transformInstituteResponse);
        } catch (error) {
            console.error('Failed to fetch institutes:', error);
            return [];
        }
    },

    getInstituteById: async (id: string): Promise<Institute | undefined> => {
        try {
            const response = await apiClient.get<InstituteResponse>(`/institutes/${id}`);
            return transformInstituteResponse(response.data);
        } catch (error) {
            console.error(`Failed to fetch institute ${id}:`, error);
            return undefined;
        }
    },

    createInstitute: async (data: Partial<Institute>): Promise<Institute> => {
        const requestData: CreateInstituteRequest = {
            name: data.name!,
            code: data.code!,
            domain: data.domain!,
            contactEmail: data.contactEmail!,
            admins: (data.admins || []).map(admin => ({
                name: admin.name,
                email: admin.email,
                role: admin.role.toUpperCase() as 'OWNER' | 'ADMIN',
            })),
        };

        const response = await apiClient.post<InstituteResponse>('/institutes', requestData);
        return transformInstituteResponse(response.data);
    },

    updateInstitute: async (id: string, data: Partial<Institute>): Promise<Institute> => {
        const response = await apiClient.patch<InstituteResponse>(`/institutes/${id}`, {
            name: data.name,
            domain: data.domain,
            contactEmail: data.contactEmail,
        });
        return transformInstituteResponse(response.data);
    },

    deleteInstitute: async (id: string): Promise<void> => {
        await apiClient.delete(`/institutes/${id}`);
    },

    addAdmin: async (instituteId: string, data: { name: string; email: string; role: 'owner' | 'admin' }): Promise<void> => {
        // This endpoint would need to be implemented in the backend
        await apiClient.post(`/institutes/${instituteId}/admins`, {
            name: data.name,
            email: data.email,
            role: data.role.toUpperCase(),
        });
    },

    getActivityLogs: async (instituteId: string): Promise<ActivityLog[]> => {
        // TODO: Implement when backend endpoint is available
        return [];
    },

    getSetupSteps: async (instituteId: string): Promise<SetupStep[]> => {
        // TODO: Implement when backend endpoint is available
        return [];
    }
};
