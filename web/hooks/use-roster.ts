import { useQuery } from '@tanstack/react-query';
import { RosterData } from '@/types/roster';

const mockRosterData: RosterData = {
    instructors: [
        {
            id: 'i1',
            name: 'Dr. Jane Smith',
            email: 'jane.smith@university.edu',
            role: 'INSTRUCTOR',
            instructorRole: 'LEAD',
        },
        {
            id: 'i2',
            name: 'Prof. John Doe',
            email: 'john.doe@university.edu',
            role: 'INSTRUCTOR',
            instructorRole: 'SUPPORTING',
        },
        {
            id: 'i3',
            name: 'Dr. Alan Turing',
            email: 'alan.turing@university.edu',
            role: 'INSTRUCTOR',
            instructorRole: 'SUPPORTING',
        }
    ],
    students: Array.from({ length: 120 }, (_, i) => ({
        id: `s${i + 1}`,
        name: `Student ${i + 1}`,
        email: `student${i + 1}@university.edu`,
        role: 'STUDENT' as const,
    })),
};

export const useRoster = (courseId: string) => {
    return useQuery<RosterData>({
        queryKey: ['roster', courseId],
        queryFn: async () => {
            // Simulating API delay
            await new Promise((resolve) => setTimeout(resolve, 800));
            return mockRosterData;
        },
        enabled: !!courseId,
    });
};
