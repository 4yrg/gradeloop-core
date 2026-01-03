import { MOCK_DASHBOARD_STATS, MOCK_RECENT_ACTIVITY } from "../data/mock-stats";

// Helper to simulate API delay
const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export interface DashboardStats {
    totalStudents: number;
    totalInstructors: number;
    activeCourses: number;
    activeSemesters: number;

    averageAttendance: number;
}

export interface ActivityItem {
    id: string;
    action: string;
    details: string;
    timestamp: string;
    user: string;
}

export const dashboardService = {
    getStats: async (): Promise<DashboardStats> => {
        await delay(600);
        return MOCK_DASHBOARD_STATS;
    },

    getRecentActivity: async (): Promise<ActivityItem[]> => {
        await delay(400);
        return MOCK_RECENT_ACTIVITY;
    }
};
