import { apiClient } from './client';
import { Institute, ActivityLog, SetupStep } from '../features/system-admin/types';

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
    contact_email: string;
    is_active: boolean;
    admin_count?: number; // For list responses
    admins?: Array<{
        id: string;
        user_id: string;
        name: string;
        email: string;
        role: 'OWNER' | 'ADMIN';
        status: 'Active' | 'Pending'; // Added status from backend
    }>;
    created_at: string;
}

// Transform backend response to frontend Institute type
const transformInstituteResponse = (response: InstituteResponse): Institute => {
    return {
        id: response.id,
        name: response.name,
        code: response.code,
        domain: response.domain,
        contactEmail: response.contact_email,
        status: response.is_active ? 'active' : 'inactive',
        admins: response.admins?.map(admin => ({
            id: admin.id,
            name: admin.name,
            email: admin.email,
            role: admin.role.toLowerCase() as 'owner' | 'admin',
            status: admin.status?.toLowerCase() as 'active' | 'pending' || 'active', // Map backend status
        })) || [], // Default to empty array if admins is undefined
        setupProgress: 0, // Default progress
        createdAt: response.created_at,
    };
};

// For list responses that might include admin_count instead of full admin details
const transformInstituteListResponse = (response: InstituteResponse): Institute => {
    return {
        id: response.id,
        name: response.name,
        code: response.code,
        domain: response.domain,
        contactEmail: response.contact_email,
        status: response.is_active ? 'active' : 'inactive',
        admins: response.admin_count ? Array(response.admin_count).fill(null).map((_, index) => ({
            id: `admin-${index}`,
            name: '',
            email: '',
            role: 'admin' as 'owner' | 'admin',
        })) : [], // Create placeholder admin objects based on count
        setupProgress: 0, // Default progress
        createdAt: response.created_at,
    };
};

export const instituteApi = {
    getInstitutes: async (query?: string): Promise<Institute[]> => {
        try {
            const response = await apiClient.get<InstituteResponse[]>('/institutes', {
                params: { q: query }
            });
            // Add null/undefined check for response.data
            if (!response.data || !Array.isArray(response.data)) {
                console.warn('Invalid response data from institutes API:', response.data);
                return [];
            }
            return response.data.map(transformInstituteListResponse);
        } catch (error) {
            console.error('Failed to fetch institutes:', error);
            return [];
        }
    },

    getInstituteById: async (id: string): Promise<Institute | undefined> => {
        try {
            const response = await apiClient.get<InstituteResponse>(`/institutes/${id}`);
            // Add null/undefined check for response.data
            if (!response.data) {
                console.warn('Invalid response data from institute API:', response.data);
                return undefined;
            }
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

    deactivateInstitute: async (id: string): Promise<Institute> => {
        const response = await apiClient.patch<InstituteResponse>(`/institutes/${id}/deactivate`);
        return transformInstituteResponse(response.data);
    },

    activateInstitute: async (id: string): Promise<Institute> => {
        const response = await apiClient.patch<InstituteResponse>(`/institutes/${id}/activate`);
        return transformInstituteResponse(response.data);
    },

    deleteInstitute: async (id: string): Promise<void> => {
        await apiClient.delete(`/institutes/${id}`);
    },

    addAdmin: async (instituteId: string, data: { name: string; email: string; role: 'owner' | 'admin' }): Promise<void> => {
        await apiClient.post(`/institutes/${instituteId}/admins`, {
            name: data.name,
            email: data.email,
            role: data.role.toUpperCase(),
        });
    },

    removeAdmin: async (instituteId: string, adminId: string): Promise<void> => {
        await apiClient.delete(`/institutes/${instituteId}/admins/${adminId}`);
    },

    resendAdminInvite: async (instituteId: string, adminId: string): Promise<void> => {
        await apiClient.post(`/institutes/${instituteId}/admins/${adminId}/resend-invite`);
    },

    getActivityLogs: async (): Promise<ActivityLog[]> => {
        // TODO: Implement when backend endpoint is available
        return [];
    },

    getSetupSteps: async (): Promise<SetupStep[]> => {
        // TODO: Implement when backend endpoint is available
        return [];
    }
};
