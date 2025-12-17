
export interface User {
    id: string;
    name: string;
    email: string;
    role: 'student' | 'instructor' | 'admin';
    avatar?: string;
}

export interface Course {
    id: string;
    code: string;
    name: string;
    description: string;
    instructorId: string;
    semester: string;
    credits: number;
    enrolledCount: number;
    thumbnail?: string;
    progress?: number; // 0-100 for students
}

export interface Assignment {
    id: string;
    courseId: string;
    title: string;
    description: string;
    dueDate: string;
    status: 'open' | 'closed' | 'draft';
    type: 'individual' | 'group';
    points: number;
}

export interface Submission {
    id: string;
    assignmentId: string;
    studentId: string;
    submittedAt: string;
    status: 'graded' | 'pending' | 'submitted';
    grade?: number;
    feedback?: string;
    plagiarismScore?: number; // 0-100
    aiLikelihood?: number; // 0-100
}

// MOCK DATA

export const MOCK_USERS: User[] = [
    { id: 'u1', name: 'Alice Student', email: 'alice@student.slit.lk', role: 'student', avatar: 'https://github.com/shadcn.png' },
    { id: 'u2', name: 'Dr. John Smith', email: 'john@slit.lk', role: 'instructor', avatar: 'https://github.com/shadcn.png' },
    { id: 'u3', name: 'Admin User', email: 'admin@slit.lk', role: 'admin' },
];

export const MOCK_COURSES: Course[] = [
    {
        id: 'c1', code: 'IT1030', name: 'Mathematics for Computing', description: 'Fundamental math concepts for CS.',
        instructorId: 'u2', semester: '2022/OCT', credits: 4, enrolledCount: 150, progress: 45
    },
    {
        id: 'c2', code: 'SE3040', name: 'Advanced Software Engineering', description: 'Design patterns and architecture.',
        instructorId: 'u2', semester: '2023/JAN', credits: 4, enrolledCount: 80, progress: 10
    },
];

export const MOCK_ASSIGNMENTS: Assignment[] = [
    {
        id: 'a1', courseId: 'c1', title: 'Calculus Quiz 1', description: 'Solve problems 1-10.',
        dueDate: new Date(Date.now() + 86400000 * 2).toISOString(), // 2 days from now
        status: 'open', type: 'individual', points: 100
    },
    {
        id: 'a2', courseId: 'c2', title: 'Design Pattern Implementation', description: 'Implement Factory pattern.',
        dueDate: new Date(Date.now() - 86400000).toISOString(), // Yesterday
        status: 'closed', type: 'individual', points: 50
    }
];

export const MOCK_SUBMISSIONS: Submission[] = [
    {
        id: 's1', assignmentId: 'a2', studentId: 'u1', submittedAt: new Date(Date.now() - 90000000).toISOString(),
        status: 'graded', grade: 85, feedback: 'Good job, but check the singleton implementation.',
        plagiarismScore: 12, aiLikelihood: 5
    }
];

export interface Announcement {
    id: string;
    courseId: string;
    title: string;
    content: string;
    instructorId: string;
    date: string;
    attachments?: string[];
}

export interface CalendarEvent {
    id: string;
    title: string;
    date: Date;
    type: 'assignment' | 'exam' | 'session' | 'other';
    courseId?: string;
    description?: string;
}

export const MOCK_ANNOUNCEMENTS: Announcement[] = [
    {
        id: 'ann1', courseId: 'c1', title: 'Midterm Exam Schedule', content: ' The midterm exam will be held on Oct 25th in Main Hall.', instructorId: 'u2', date: new Date(Date.now() - 86400000 * 2).toISOString()
    },
    {
        id: 'ann2', courseId: 'c2', title: 'Lecture Cancelled', content: 'Todays lecture is cancelled due to illness.', instructorId: 'u2', date: new Date(Date.now() - 86400000 * 5).toISOString()
    }
];

export const MOCK_EVENTS: CalendarEvent[] = [
    ...MOCK_ASSIGNMENTS.map(a => ({
        id: `evt-${a.id}`,
        title: `Due: ${a.title}`,
        date: new Date(a.dueDate),
        type: 'assignment' as const,
        courseId: a.courseId,
        description: 'Assignment Deadline'
    })),
    {
        id: 'evt-1', title: 'Calculus Review Session', date: new Date(Date.now() + 86400000), type: 'session', courseId: 'c1'
    },
    {
        id: 'evt-2', title: 'System Maintenance', date: new Date(Date.now() + 86400000 * 3), type: 'other', description: 'GradeLoop maintenance'
    }
];
