export type InstructorRole = 'LEAD' | 'SUPPORTING';

export interface Participant {
    id: string;
    name: string;
    email: string;
    avatarUrl?: string;
    role: 'INSTRUCTOR' | 'STUDENT';
    instructorRole?: InstructorRole;
}

export interface RosterData {
    instructors: Participant[];
    students: Participant[];
}
