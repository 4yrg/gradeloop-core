export type SubmissionStatus = 'accepted' | 'wrong_answer' | 'time_limit_exceeded' | 'memory_limit_exceeded' | 'runtime_error' | 'compilation_error' | 'pending';

export interface Submission {
    id: string;
    assignmentId: string;
    timestamp: string;
    status: SubmissionStatus;
    score: number;
    totalScore: number;
    language: string;
    runtime?: string;
    memory?: string;
    testCasesPassed: number;
    totalTestCases: number;
    codeSnippet?: string;
}

export const MOCK_SUBMISSIONS: Submission[] = [
    {
        id: 'sub-1',
        assignmentId: 'asgn-1',
        timestamp: new Date(Date.now() - 3600000 * 24).toISOString(), // 1 day ago
        status: 'wrong_answer',
        score: 45,
        totalScore: 100,
        language: 'Python',
        runtime: '1.2s',
        memory: '128MB',
        testCasesPassed: 12,
        totalTestCases: 25,
        codeSnippet: 'def solve():\n    # Incomplete logic\n    pass'
    },
    {
        id: 'sub-2',
        assignmentId: 'asgn-1',
        timestamp: new Date(Date.now() - 3600000 * 2).toISOString(), // 2 hours ago
        status: 'accepted',
        score: 100,
        totalScore: 100,
        language: 'Python',
        runtime: '0.8s',
        memory: '64MB',
        testCasesPassed: 25,
        totalTestCases: 25,
        codeSnippet: 'def solve():\n    # Optimized logic\n    return True'
    },
    {
        id: 'sub-3',
        assignmentId: 'asgn-2',
        timestamp: new Date(Date.now() - 3600000 * 48).toISOString(), // 2 days ago
        status: 'time_limit_exceeded',
        score: 20,
        totalScore: 100,
        language: 'Java',
        runtime: '2.5s',
        memory: '256MB',
        testCasesPassed: 5,
        totalTestCases: 20
    }
];
