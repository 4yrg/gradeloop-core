
export interface DashboardSummary {
    totalUsers: {
        student: number;
        instructor: number;
        admin: number;
    };
    activeClasses: number;
    activeAssignments: number;
    systemUsage: {
        cpu: number;
        executions: number;
    };
    flaggedCases: number;
}

export interface AIGovernanceStats {
    aiGradingEnabledClasses: number;
    avgAiLikelihood: number;
    agentUsageRate: number; // percentage
}

export interface SystemAlert {
    id: string;
    type: 'warning' | 'error' | 'info';
    category: 'abuse' | 'resource' | 'integrity';
    message: string;
    timestamp: string;
}

const MOCK_DASHBOARD_SUMMARY: DashboardSummary = {
    totalUsers: {
        student: 1250,
        instructor: 45,
        admin: 3
    },
    activeClasses: 28,
    activeAssignments: 15,
    systemUsage: {
        cpu: 45, // percentage
        executions: 12500
    },
    flaggedCases: 12
};

const MOCK_AI_GOVERNANCE: AIGovernanceStats = {
    aiGradingEnabledClasses: 18,
    avgAiLikelihood: 12.5,
    agentUsageRate: 65
};

const MOCK_SYSTEM_ALERTS: SystemAlert[] = [
    {
        id: 'al1',
        type: 'warning',
        category: 'resource',
        message: 'Compute usage spike detected in Judge0 cluster',
        timestamp: new Date().toISOString()
    },
    {
        id: 'al2',
        type: 'error',
        category: 'integrity',
        message: 'Multiple high-similarity submissions detected in "Algorithms 101"',
        timestamp: new Date(Date.now() - 3600000).toISOString()
    },
    {
        id: 'al3',
        type: 'info',
        category: 'abuse',
        message: 'Suspicious login attempts from IP 192.168.1.105',
        timestamp: new Date(Date.now() - 7200000).toISOString()
    }
];

export const AdminService = {
    getDashboardSummary: async (): Promise<DashboardSummary> => {
        await new Promise(resolve => setTimeout(resolve, 800));
        return MOCK_DASHBOARD_SUMMARY;
    },

    getAIGovernanceStats: async (): Promise<AIGovernanceStats> => {
        await new Promise(resolve => setTimeout(resolve, 600));
        return MOCK_AI_GOVERNANCE;
    },

    getSystemAlerts: async (): Promise<SystemAlert[]> => {
        await new Promise(resolve => setTimeout(resolve, 500));
        return MOCK_SYSTEM_ALERTS;
    },

    getAcademicStructure: async (): Promise<AcademicNode[]> => {
        await new Promise(resolve => setTimeout(resolve, 800));
        return MOCK_ACADEMIC_STRUCTURE;
    }
};

export type AcademicNodeType = 'faculty' | 'degree' | 'year' | 'semester' | 'specialization' | 'batch' | 'class';

export interface AcademicNode {
    id: string;
    type: AcademicNodeType;
    name: string;
    children?: AcademicNode[];
    metadata?: Record<string, any>;
}

const MOCK_ACADEMIC_STRUCTURE: AcademicNode[] = [
    {
        id: 'fac-1', type: 'faculty', name: 'Faculty of Computing', children: [
            {
                id: 'deg-1', type: 'degree', name: 'B.Sc (Hons) IT', children: [
                    {
                        id: 'yr-1', type: 'year', name: '1st Year', children: [
                            {
                                id: 'sem-1', type: 'semester', name: '1st Semester', children: [
                                    {
                                        id: 'batch-1', type: 'batch', name: '2024 Regular', children: [
                                            { id: 'cls-1', type: 'class', name: 'Introduction to Programming (IT1010)' },
                                            { id: 'cls-2', type: 'class', name: 'Mathematics for Computing (IT1030)' }
                                        ]
                                    }
                                ]
                            },
                            {
                                id: 'sem-2', type: 'semester', name: '2nd Semester', children: [] // Term 2
                            }
                        ]
                    },
                    {
                        id: 'yr-2', type: 'year', name: '2nd Year', children: [
                            {
                                id: 'sem-3', type: 'semester', name: '1st Semester', children: [
                                    {
                                        id: 'spec-1', type: 'specialization', name: 'Software Engineering', children: [
                                            {
                                                id: 'batch-2', type: 'batch', name: 'SE Weekday', children: [
                                                    { id: 'cls-3', type: 'class', name: 'Object Oriented Programming (IT2010)' }
                                                ]
                                            }
                                        ]
                                    }
                                ]
                            }
                        ]
                    }
                ]
            }
        ]
    },
    {
        id: 'fac-2', type: 'faculty', name: 'Faculty of Engineering', children: []
    }
];
