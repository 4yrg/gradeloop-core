
import { MOCK_USERS } from './mocks';

export const AdminService = {
    getAllUsers: async () => {
        await new Promise(resolve => setTimeout(resolve, 500));
        return MOCK_USERS;
    },

    createUser: async (user: any) => {
        await new Promise(resolve => setTimeout(resolve, 800));
        return { success: true, user: { ...user, id: 'new-u-' + Date.now() } };
    },

    getSystemStats: async () => {
        await new Promise(resolve => setTimeout(resolve, 500));
        return {
            totalUsers: 1250,
            activeCourses: 45,
            submissionsToday: 320,
            systemHealth: 'Healthy'
        };
    }
};
